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
    console.log('sockets available', Object.keys(sockets))

    if (Object.keys(sockets).length === 2) {
      // broadcast 'addPeer', in it send own socket ID to other peer
      // emit 'addPeer', in it send other peer's socket ID to self
      socket.broadcast.emit('addPeer', {peer_id: socket.id})
      socket.emit('addPeer', {
        peer_id: Object.keys(sockets).filter((id) => id !== socket.id)[0]
      })
    }
  })

  socket.on('disconnect', () => {
    console.log('Disconnected')
    // MAYBE?? remove socket entry from 'sockets' obj
  })
})
