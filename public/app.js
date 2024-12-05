// 소켓 연결
const socket = io()

// 비디오 요소
const localVideo = document.getElementById('localVideo')
const startButton = document.getElementById('startButton')

// 카메라 시작 함수
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        })
        localVideo.srcObject = stream
        console.log('카메라 스트림 시작됨')
    } catch (err) {
        console.error('카메라 접근 오류:', err)
    }
}

// 이벤트 리스너
startButton.addEventListener('click', startCamera)

// 소켓 이벤트
socket.on('connect', () => {
    console.log('서버에 연결됨')
})
