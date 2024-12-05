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

// P2P 연결 시작
async function startCall() {
    console.log('연결 시작...')
    callButton.disabled = true
    hangupButton.disabled = false

    peerConnection = new RTCPeerConnection(configuration)
    console.log('PeerConnection 생성됨')

    // 연결 상태 모니터링 추가
    peerConnection.onconnectionstatechange = (event) => {
        console.log('연결 상태 변경:', peerConnection.connectionState)
    }

    // ICE 연결 상태 모니터링 추가
    peerConnection.oniceconnectionstatechange = (event) => {
        console.log('ICE 연결 상태:', peerConnection.iceConnectionState)
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
            console.log('ICE candidate 발견')
            socket.emit('ice-candidate', event.candidate)
        }
    }

    try {
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        console.log('오퍼 생성 및 전송')
        socket.emit('offer', offer)
    } catch (err) {
        console.error('오퍼 생성 오류:', err)
    }
}

// 연결 종료
function hangup() {
    if (peerConnection) {
        peerConnection.close()
        peerConnection = null
    }
    remoteVideo.srcObject = null
    callButton.disabled = false
    hangupButton.disabled = true
}

// 소켓 이벤트 처리 부분 수정
socket.on('offer', async (offer, fromId) => {
    console.log('오퍼 받음:', fromId)
    if (!peerConnection) {
        peerConnection = new RTCPeerConnection(configuration)

        // 연결 상태 모니터링
        peerConnection.onconnectionstatechange = (event) => {
            console.log('연결 상태 변경:', peerConnection.connectionState)
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
                console.log('ICE candidate 발견')
                socket.emit('ice-candidate', event.candidate, fromId)
            }
        }
    }

    try {
        await peerConnection.setRemoteDescription(offer)
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        console.log('응답 전송:', fromId)
        socket.emit('answer', answer, fromId)
    } catch (err) {
        console.error('응답 생성 오류:', err)
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

// 이벤트 리스너
startButton.addEventListener('click', startCamera)
callButton.addEventListener('click', startCall)
hangupButton.addEventListener('click', hangup)
