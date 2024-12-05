// 소켓 연결
const socket = io()

// 비디오 요소
const localVideo = document.getElementById('localVideo')
const startButton = document.getElementById('startButton')

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
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        localVideo.srcObject = stream
        console.log('카메라 스트림 시작됨')

        // 스트림 시작 후 버튼 비활성화
        startButton.disabled = true
    } catch (err) {
        console.error('카메라 접근 오류:', err)
        alert('카메라를 시작할 수 없습니다. 카메라 접근 권한을 확인해주세요.')
    }
}

// 이벤트 리스너
startButton.addEventListener('click', startCamera)

// 소켓 이벤트
socket.on('connect', () => {
    console.log('서버에 연결됨')
})
