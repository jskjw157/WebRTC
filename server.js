const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

// 정적 파일 제공
app.use(express.static('public'))

// 소켓 연결 처리
io.on('connection', (socket) => {
    console.log('사용자 연결됨')

    socket.on('disconnect', () => {
        console.log('사용자 연결 해제됨')
    })
})

// 서버 시작
const PORT = process.env.PORT || 3000
http.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`)
})
