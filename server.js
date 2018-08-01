const port = 3000
const express = require('express')
const socket = require('socket.io')
const app = express()
const server = app.listen(port, () => console.log(`Signaling server running on port ${port}`))
const io = socket(server)

app.use(express.static('public'))

io.on('connection', function (socket) {
  console.log('Socket connection estabilished!')

  socket.on('message', (msg) => {
    console.log('Message recieved ', msg)
  })

  socket.on('disconnect', () => {
    console.log('Disconnected')
  })
})
