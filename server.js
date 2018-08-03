const port = process.env.PORT || 3000
const express = require('express')
const socket = require('socket.io')
const cors = require('cors')
const app = express()
const server = app.listen(port, () => console.log(`Signaling server running on port ${port}`))
const io = socket(server)

app.use(cors())
app.use(express.static('public'))

const sockets = {}

io.on('connection', function (socket) {
  console.log(`${socket.id} connection accepted`)

  let peer
  sockets[socket.id] = socket

  socket.on('join', () => {
    console.log('Join event recieved')

    if (Object.keys(sockets).length === 2) { // when both people connected
      // emit 'addPeer', in it send peer's socket ID to client
      // so now, both peers have each others socket ID, and one of them has to create an offer
      peer = sockets[Object.keys(sockets).filter((id) => id !== socket.id)[0]]
      peer.emit('addPeer', {peer_id: socket.id, should_create_offer: false})
      socket.emit('addPeer', {
        peer_id: peer.id,
        should_create_offer: true
      })
    }
  })

  socket.on('disconnect', () => {
    console.log(socket.id, 'Disconnected')
    delete sockets[socket.id]
    console.log('Peers left in sockets object: ', Object.keys(sockets))
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
