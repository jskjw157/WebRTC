// 소켓 연결
const socket = io()

// DOM 요소
const localVideo = document.getElementById('localVideo')
const remoteVideo = document.getElementById('remoteVideo')
const startButton = document.getElementById('startButton')
const callButton = document.getElementById('callButton')
const hangupButton = document.getElementById('hangupButton')

// WebRTC 변수
let localStream
let remoteStream
let peerConnection

// STUN 서버 설정
const configuration = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302',
        },
    ],
}

// 미디어 스트림 제약조건
const constraints = {
    video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
    },
}

// 미디어 트랙 정지 함수 추가
function stopMediaTracks(stream) {
    if (!stream) return
    stream.getTracks().forEach((track) => {
        track.stop()
    })
}

// 카메라 시작 함수
async function startCamera() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints)
        localVideo.srcObject = localStream
        startButton.disabled = true
        callButton.disabled = false
    } catch (err) {
        console.error('카메라 접근 오류:', err)
        alert('카메라를 시작할 수 없습니다.')
    }
}

let dataChannel

// P2P 연결 시작
async function startCall() {
    console.log('연결 시작...')
    callButton.disabled = true
    hangupButton.disabled = false

    try {
        if (!peerConnection) {
            peerConnection = new RTCPeerConnection(configuration)
            console.log('PeerConnection 생성됨')

            // 데이터 채널 생성
            dataChannel = peerConnection.createDataChannel('chat')
            setupDataChannel()

            peerConnection.ondatachannel = (event) => {
                dataChannel = event.channel
                setupDataChannel()
            }

            // 로컬 스트림 추가
            localStream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStream)
            })

            // 원격 스트림 처리
            peerConnection.ontrack = (event) => {
                console.log('원격 스트림 받음')
                remoteVideo.srcObject = event.streams[0]
            }

            // ICE candidate 처리
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('ICE candidate 발견')
                    socket.emit('ice-candidate', event.candidate)
                }
            }
        }

        // offer 생성 및 전송
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        console.log('오퍼 생성 및 전송')
        socket.emit('offer', offer)
    } catch (err) {
        console.error('연결 시작 오류:', err)
    }
}

// 데이터 채널 설정 함수
function setupDataChannel() {
    dataChannel.onopen = () => {
        console.log('데이터 채널 열림')
        document.getElementById('sendButton').disabled = false
    }

    dataChannel.onclose = () => {
        console.log('데이터 채널 닫힘')
        document.getElementById('sendButton').disabled = true
    }

    dataChannel.onmessage = (event) => {
        console.log('메시지 받음:', event.data)
        const chatBox = document.getElementById('chatBox')
        chatBox.innerHTML += `<div>상대방: ${event.data}</div>`
        chatBox.scrollTop = chatBox.scrollHeight
    }
}

// 메시지 전송 함수
function sendMessage() {
    const chatInput = document.getElementById('chatInput')
    const message = chatInput.value
    if (message && dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(message)
        const chatBox = document.getElementById('chatBox')
        chatBox.innerHTML += `<div>나: ${message}</div>`
        chatBox.scrollTop = chatBox.scrollHeight
        chatInput.value = ''
    }
}

// 연결 종료
function hangup() {
    console.log('연결 종료 시작')

    // 원격 스트림만 정리
    if (remoteVideo.srcObject) {
        const remoteStream = remoteVideo.srcObject
        stopMediaTracks(remoteStream)
        remoteVideo.pause()
        remoteVideo.srcObject = null
    }

    // PeerConnection 정리
    if (peerConnection) {
        peerConnection.close()
        peerConnection = null
    }

    // 버튼 상태 초기화
    callButton.disabled = false
    hangupButton.disabled = true

    // 연결 종료 신호를 서버에 전송
    socket.emit('user-hangup')
}

// offer 받았을 때의 처리
socket.on('offer', async (offer, fromId) => {
    console.log('오퍼 받음 from:', fromId)
    try {
        if (!peerConnection) {
            peerConnection = new RTCPeerConnection(configuration)

            peerConnection.ondatachannel = (event) => {
                console.log('데이터 채널 받음')
                dataChannel = event.channel
                setupDataChannel()
            }

            localStream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStream)
            })

            peerConnection.ontrack = (event) => {
                console.log('원격 스트림 받음')
                remoteVideo.srcObject = event.streams[0]
            }

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('ICE candidate 발견 (응답측)')
                    socket.emit('ice-candidate', event.candidate, fromId)
                }
            }
        }

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        console.log('응답 전송 to:', fromId)
        socket.emit('answer', answer, fromId)

        // 응답하는 쪽에서도 버튼 상태 업데이트
        callButton.disabled = true
        hangupButton.disabled = false
    } catch (err) {
        console.error('오퍼 처리 오류:', err)
    }
})

socket.on('answer', async (answer) => {
    console.log('응답 받음')
    try {
        await peerConnection.setRemoteDescription(answer)
    } catch (err) {
        console.error('응답 설정 오류:', err)
    }
})

socket.on('ice-candidate', async (candidate) => {
    console.log('ICE candidate 받음')
    try {
        await peerConnection.addIceCandidate(candidate)
    } catch (err) {
        console.error('ICE 후보 추가 오류:', err)
    }
})

// 서버 연결 상태 확인을 위한 이벤트 추가
socket.on('connect', () => {
    console.log('서버 연결됨. 소켓 ID:', socket.id)
})

socket.on('userCount', (count) => {
    console.log('현재 연결된 사용자 수:', count)
})

// 소켓 이벤트 핸들러 추가
socket.on('peer-hangup', () => {
    console.log('상대방이 연결을 종료함')

    // 원격 스트림 정리
    if (remoteVideo.srcObject) {
        const remoteStream = remoteVideo.srcObject
        stopMediaTracks(remoteStream)
        remoteVideo.pause()
        remoteVideo.srcObject = null
    }

    // PeerConnection 정리
    if (peerConnection) {
        peerConnection.close()
        peerConnection = null
    }

    // 버튼 상태 초기화
    callButton.disabled = false
    hangupButton.disabled = true
})

// 이벤트 리스너
startButton.addEventListener('click', startCamera)
callButton.addEventListener('click', startCall)
hangupButton.addEventListener('click', hangup)

// 이벤트 리스너 추가
document.getElementById('sendButton').addEventListener('click', sendMessage)
document.getElementById('chatInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage()
    }
})
