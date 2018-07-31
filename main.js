const constraints = window.constraints = {
  audio: false,
  video: true
}

const hasGetUserMedia = function () {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) // !! (not twice) coerces object to boolean
}

const handleSuccess = (stream) => {
  const video = document.querySelector('video')
  console.log('Got stream with constraints:', constraints)
  video.srcObject = stream
}

const handleError = (error) => {
  if (error.name === 'PermissionDeniedError') {
    console.log('Permissions have not been granted to use your camera and microphone')
  } else { console.log(`getUserMedia error: ${error.name}`, error) }
}

if (hasGetUserMedia()) {
  // go ahead
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(handleSuccess)
    .catch(handleError)
} else {
  console.error('getUserMedia() is not supported for your browser')
}
