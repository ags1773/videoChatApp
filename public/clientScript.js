// **** CONFIG ****
// const SIGNALING_SERVER = 'http://localhost:3000'
// const SIGNALING_SERVER = 'http://192.168.0.112:3000'
const SIGNALING_SERVER = 'https://evening-brushlands-68381.herokuapp.com'
const USE_AUDIO = true
const USE_VIDEO = true
const ICE_SERVERS = [
  {
    urls: ['stun:stun.l.google.com:19302']
  }
]

// **** Global ****
let socket
let localMediaStream
let peer = {}
let peerMediaElement = {}

const init = () => {
  socket = io(SIGNALING_SERVER) // establishes socket connection

  socket.on('connect', () => {
    console.log('Connection to signaling server estabilished')
    setupLocalMedia(function () {
      socket.emit('join')
    })
  })

  socket.on('addPeer', (config) => {
    console.log('SignallingServer says add this peer => ', config)
    // const peerId = peer.peer_id
    const peerConnection = new RTCPeerConnection(
      {'iceServers': ICE_SERVERS}
    )
    localMediaStream.getTracks().forEach(track => {
      console.log('track', track)
      peerConnection.addTrack(track, localMediaStream)
    })
    peer[config.peer_id] = peerConnection

    // localDescription describes how the connection is configured
    if (config.should_create_offer) {
      console.log('Creating RTC offer to ', config.peer_id)
      peerConnection.createOffer()
        .then(localDescription => {
          console.log('Local offer description is: ', localDescription)
          peerConnection.setLocalDescription(localDescription)
            .then(() => {
              socket.emit('relaySessionDescription',
                {
                  'peer_id': config.peer_id,
                  'session_description': localDescription
                }
              )
              console.log('Offer setLocalDescription succeeded')
            })
            .catch(err => console.error('Offer setLocalDescription failed!', err))
        })
        .catch(error => {
          console.error('Error sending offer: ', error)
        })
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('relayICECandidate', {
          'peer_id': config.peer_id,
          'ice_candidate': {
            'sdpMLineIndex': event.candidate.sdpMLineIndex,
            'candidate': event.candidate.candidate
          }
        })
      }
    }

    // 'ontrack' is called by the WebRTC layer when events occur on the media tracks on our WebRTC call.
    // This includes when streams are added to and removed from the call.
    // track events include the following fields:

    // RTCRtpReceiver       receiver
    // MediaStreamTrack     track
    // MediaStream[]        streams
    // RTCRtpTransceiver    transceiver

    peerConnection.ontrack = (event) => {
      console.log('ontrack (old: onAddStream) event')
      const video = document.createElement('video')
      video.setAttribute('autoplay', '')
      video.setAttribute('muted', 'false')
      video.setAttribute('controls', '')
      peerMediaElement[config.peer_id] = video
      document.body.appendChild(video)
      video.srcObject = event.streams[0]
    }
  })

  // Peers exchange session descriptions which contains information about their audio / video settings etc.
  // and that sort of stuff. First, the 'offerer' sends a description to the 'answerer' (with type "offer"),
  // then the answerer sends one back (with type "answer").

  socket.on('sessionDescription', function (config) {
    console.log('Remote sessionDescription recieved')
    const remotePeerId = config.peer_id
    const remotePeerDescription = config.session_description
    const remotePeer = peer[remotePeerId]

    const desc = new RTCSessionDescription(remotePeerDescription)
    remotePeer.setRemoteDescription(desc)
      .then(() => {
        console.log('setRemoteDescription succeeded')
        if (remotePeerDescription.type === 'offer') {
          console.log('Creating Answer...')
          return remotePeer.createAnswer()
        }
      })
      .then(localDescription => {
        console.log('Answer description is', localDescription)
        remotePeer.setLocalDescription(localDescription)
          .then(() => {
            socket.emit('relaySessionDescription',
              {
                'peer_id': remotePeerId,
                'session_description': localDescription
              }
            )
            console.log('Answer setLocalDescription succeeded')
          })
          .catch(err => console.error('Answer setLocalDescription Failed!', err))
      })
      .catch(err => console.error('Error in setRemoteDescription / Creating answer', err))
  })

  // The offerer will send a number of ICE Candidate blobs to the answerer so they
  // can begin trying to find the best path to one another on the net.

  socket.on('iceCandidate', function (config) {
    const remotePeer = peer[config.peer_id]
    const iceCandidate = config.ice_candidate
    remotePeer.addIceCandidate(new RTCIceCandidate(iceCandidate))
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

    localMediaStream = stream

    const video = document.createElement('video')
    video.setAttribute('autoplay', '')
    video.setAttribute('muted', 'false')
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
