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
})
