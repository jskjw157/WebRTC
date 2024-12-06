# WebRTC p2p Sample

## 소개

이 프로젝트는 WebRTC를 이용한 P2P 화상 통화 및 채팅 샘플 애플리케이션입니다.

## 주요 기능

-   1:1 화상 통화
-   실시간 채팅
-   STUN 서버를 통한 P2P 연결
-   사용자 연결 상태 확인

## 기술 스택

-   Node.js
-   Express
-   Socket.IO
-   WebRTC API

## 실행 방법

1. 의존성 설치

```bash
npm install
```

2. 서버 실행

```bash
npm start
```

3. 브라우저에서 접속

-   http://localhost:3000 으로 접속

## 환경 설정

-   `.env` 파일을 생성하고 다음 내용을 설정하세요

```env
PORT=3000
STUN_SERVER=stun:stun.l.google.com:19302
```

## 프로세스 흐름

1. 첫 번째 사용자가 방을 생성합니다.
2. 생성된 방 ID를 두 번째 사용자와 공유합니다.
3. 두 번째 사용자가 공유받은 방 ID로 접속합니다.
4. 자동으로 P2P 연결이 설정됩니다.

## License

MIT License
