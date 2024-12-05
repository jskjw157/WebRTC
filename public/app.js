async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        })
        document.getElementById('localVideo').srcObject = stream
    } catch (err) {
        console.error('카메라 접근 오류:', err)
    }
}

document.getElementById('startButton').onclick = startCamera
