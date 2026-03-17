const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let gameState = {
    currentNum: 1,
    revealedCount: 0, // 0〜8まで1つずつ増やす
    players: {},
    // 8個の選択肢（中身は適宜書き換えてください）
    choices: ["選択肢 A", "選択肢 B", "選択肢 C", "選択肢 D", "選択肢 E", "選択肢 F", "選択肢 G", "選択肢 H"]
};

io.on('connection', (socket) => {
    socket.emit('update', gameState);

    socket.on('submit', (data) => {
        gameState.players[socket.id] = { name: data.name, cards: data.cards, isCorrect: null };
        io.emit('update', gameState);
    });

    socket.on('admin-control', (action) => {
        if (action.type === 'next-step') {
            if (gameState.revealedCount < 8) gameState.revealedCount++;
        } else if (action.type === 'hide-all') {
            gameState.revealedCount = 0;
        } else if (action.type === 'next-quiz') {
            gameState.currentNum++;
            gameState.revealedCount = 0;
            gameState.players = {};
        } else if (action.type === 'judge') {
            if (gameState.players[action.id]) gameState.players[action.id].isCorrect = action.result;
        }
        io.emit('update', gameState);
    });
});
socket.on('submit', (data) => {
    // すでにそのソケットIDで回答が存在している場合は無視
    if (gameState.players[socket.id]) {
        console.log("二重送信をブロックしました:", data.name);
        return;
    }

    // 回答を登録
    gameState.players[socket.id] = { 
        name: data.name, 
        cards: data.cards, 
        isCorrect: null 
    };
    
    // 全員に更新を通知
    io.emit('update', gameState);
});
server.listen(process.env.PORT || 3000);
