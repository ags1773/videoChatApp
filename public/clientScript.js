// **** CONFIG ****
const SIGNALING_SERVER = 'http://localhost:3000'

const init = () => {
  let socket = io(SIGNALING_SERVER)

  socket.on('connect', () => {
    console.log('Connection to signaling server estabilished')
  })

  document.querySelector('button').addEventListener('click', () => {
    socket.emit('message', document.querySelector('input').value)
    document.querySelector('input').value = ''
  })

  socket.on('disconnect', () => {
    console.log('disconnected')
  })
}
