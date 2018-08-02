const port = 3000
const express = require('express')
const socket = require('socket.io')
const app = express()
const server = app.listen(port, () => console.log(`Signaling server running on port ${port}`))
const io = socket(server)

app.use(express.static('public'))

const sockets = {}

io.on('connection', function (socket) {
  console.log('Socket connection estabilished!')

  // on connection, add the socket to the 'sockets' obj
  sockets[socket.id] = socket
  console.log(`${socket.id} connection accepted`)

  socket.on('join', () => {
    // on getting a 'join', send out an 'addPeer' event with the socket ID of the other guy
    console.log('Join event recieved')

    if (Object.keys(sockets).length === 2) { // both people connected
      // broadcast 'addPeer' for other guy to recieve, in it send own socket ID
      // emit 'addPeer' for own client to recieve, in it send other peer's socket ID
      // so now, own client has others socket ID, and other client has my socket ID
      socket.broadcast.emit('addPeer', {peer_id: socket.id, should_create_offer: false})
      socket.emit('addPeer', {
        peer_id: Object.keys(sockets).filter((id) => id !== socket.id)[0],
        should_create_offer: true
      })
    }
  })

  socket.on('disconnect', () => {
    console.log('Disconnected')
    // MAYBE?? remove socket entry from 'sockets' obj
  })

  // sends offer/answer from one peer to another
  socket.on('relaySessionDescription', function (config) {
    let peerId = config.peer_id
    let sessionDescription = config.session_description
    console.info(`Server relaying Peer [ ${socket.id} ]'s '${sessionDescription.type}' to Peer [ ${peerId} ]`)
    if (peerId in sockets) {
      sockets[peerId].emit('sessionDescription', {'peer_id': socket.id, 'session_description': sessionDescription})
    }
  })

  socket.on('relayICECandidate', function (config) {
    let peerId = config.peer_id
    let iceCandidate = config.ice_candidate
    console.info(`Server relaying Peer [ ${socket.id} ]'s ICE candidate to Peer [ ${peerId} ]`)
    if (peerId in sockets) {
      sockets[peerId].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': iceCandidate})
    }
  })
})
