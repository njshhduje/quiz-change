const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// クイズの状態管理
let gameState = {
    currentQuestion: 1,
    isOpen: false,
    answers: {} // { socketId: { name: 'Player', cards: [], isCorrect: null } }
};

io.on('connection', (socket) => {
    // 接続時に現在の状態を送信
    socket.emit('init', gameState);

    // 回答送信
    socket.on('submitAnswer', (data) => {
        gameState.answers[socket.id] = { 
            name: data.name, 
            cards: data.cards, 
            isCorrect: null 
        };
        io.emit('updateDisplay', gameState);
    });

    // 管理者操作: 公開/非公開
    socket.on('toggleOpen', (isOpen) => {
        gameState.isOpen = isOpen;
        io.emit('updateDisplay', gameState);
    });

    // 管理者操作: 次の問題へ
    socket.on('nextQuestion', () => {
        gameState.currentQuestion++;
        gameState.isOpen = false;
        gameState.answers = {}; // 回答リセット
        io.emit('updateDisplay', gameState);
        io.emit('resetPlayer');
    });

    // 管理者操作: 正誤判定
    socket.on('judge', ({ id, result }) => {
        if (gameState.answers[id]) {
            gameState.answers[id].isCorrect = result;
            io.emit('updateDisplay', gameState);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
