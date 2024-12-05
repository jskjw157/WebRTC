const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

// 정적 파일 제공
app.use(express.static('public'))

// 연결된 사용자 관리
const connectedUsers = new Set()

io.on('connection', (socket) => {
    console.log('사용자 연결됨:', socket.id)
    connectedUsers.add(socket.id)

    // 현재 연결된 사용자 목록 전송
    socket.emit('userList', Array.from(connectedUsers))
    io.emit('userCount', connectedUsers.size)

    // offer 시그널 처리
    socket.on('offer', (offer) => {
        console.log('Offer 받음:', socket.id)
        // offer를 자신을 제외한 모든 클라이언트에게 전달
        socket.broadcast.emit('offer', offer, socket.id)
    })

    // answer 시그널 처리
    socket.on('answer', (answer, targetId) => {
        console.log('Answer 받음:', socket.id, '-> ', targetId)
        io.to(targetId).emit('answer', answer, socket.id)
    })

    // ICE candidate 처리
    socket.on('ice-candidate', (candidate, targetId) => {
        console.log('ICE candidate 받음:', socket.id)
        if (targetId) {
            io.to(targetId).emit('ice-candidate', candidate, socket.id)
        } else {
            socket.broadcast.emit('ice-candidate', candidate, socket.id)
        }
    })

    socket.on('disconnect', () => {
        console.log('사용자 연결 해제됨:', socket.id)
        connectedUsers.delete(socket.id)
        io.emit('userCount', connectedUsers.size)
    })
})

// 서버 시작
const PORT = process.env.PORT || 3000
http.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`)
})
