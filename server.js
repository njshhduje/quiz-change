const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// ==========================================
// 【重要】ここに正解を順番通りに書いてください
// ==========================================
const CORRECT_ANSWER = [
    "選択肢A",
    "選択肢B",
    "選択肢C",
    "選択肢D",
    "選択肢E",
    "選択肢F",
    "選択肢G",
    "選択肢H"
];

let gameState = {
    revealedCount: 0,
    players: {},
    choices: [...CORRECT_ANSWER].sort(() => Math.random() - 0.5) // シャッフルして配布
};

io.on('connection', (socket) => {
    socket.emit('update', gameState);

    // 回答送信
    socket.on('submit', (data) => {
        if (gameState.players[socket.id]) return;
        gameState.players[socket.id] = { 
            name: data.name, 
            cards: data.cards, 
            isCorrect: null 
        };
        io.emit('update', gameState);
    });

    // 管理者操作
    socket.on('admin-control', (action) => {
        if (action.type === 'next-step') {
            if (gameState.revealedCount < 8) gameState.revealedCount++;
        } 
        else if (action.type === 'scoring') {
            // 全プレイヤーの回答を正解と照合
            Object.keys(gameState.players).forEach(id => {
                const player = gameState.players[id];
                const isAllCorrect = JSON.stringify(player.cards) === JSON.stringify(CORRECT_ANSWER);
                player.isCorrect = isAllCorrect ? 'correct' : 'incorrect';
            });
        }
        else if (action.type === 'reset') {
            gameState.revealedCount = 0;
            gameState.players = {};
        }
        io.emit('update', gameState);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
