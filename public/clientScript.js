// **** CONFIG ****
const SIGNALING_SERVER = 'http://localhost:3000'
const USE_AUDIO = true
const USE_VIDEO = true

// **** Global ****
// let localMediaStream = null

const init = () => {
  // 1) establish socket connection with server
  // 2) set up local media
  // 3) emit 'join' event

  let socket = io(SIGNALING_SERVER) // establishes socket connection

  socket.on('connect', () => {
    console.log('Connection to signaling server estabilished')
    setupLocalMedia(function () {
      socket.emit('join')
    })
  })

  socket.on('addPeer', (peer) => {
    console.log('add this peer => ', peer.peer_id)
  })

  socket.on('disconnect', () => {
    console.log('disconnected')
  })
}

// *********************** //
// ** Local media stuff ** //
// ***********************//

function setupLocalMedia (callback) {
  // Ask user for permission to use the computers microphone and/or camera,
  // if .getUserMedia() is present, create a <video> element, attach it to <body>
  // play webcam stream in it

  const hasGetUserMedia = function () {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) // !! (not twice) coerces object to boolean
  }

  const handleSuccess = (stream) => {
    // create <video> element, display webcam stream in it
    console.log('Got permission for camera and/or mic')

    const video = document.createElement('video')
    video.setAttribute('autoplay', '')
    video.setAttribute('muted', 'true') // mute by default
    video.setAttribute('controls', '')
    document.body.appendChild(video)
    video.srcObject = stream

    if (callback) callback()
  }

  const handleError = (error) => {
    if (error.name === 'PermissionDeniedError') {
      console.log('Permissions have not been granted to use your camera and microphone')
    } else console.log(`getUserMedia error: ${error.name}`, error)
  }

  if (hasGetUserMedia()) {
    navigator.mediaDevices
      .getUserMedia({audio: USE_AUDIO, video: USE_VIDEO})
      .then(handleSuccess)
      .catch(handleError)
  } else {
    console.error('getUserMedia() is not supported for your browser')
  }
}
