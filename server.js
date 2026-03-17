const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// ==========================================
// 【重要】ここに正解を順番通りに8つ入力してください
// ==========================================
const CORRECT_ANSWER = [
    "スイミー", "泣いた赤鬼", "モチモチの木", "白い帽子",
    "大造じいさんとがん", "狐の窓", "少年の日の思い出", "走れメロス"
];

let gameState = {
    revealedCount: 0,
    players: {},
    choices: [...CORRECT_ANSWER].sort(() => Math.random() - 0.5) 
};

io.on('connection', (socket) => {
    socket.emit('update', gameState);

    socket.on('submit', (data) => {
        if (gameState.players[socket.id]) return;
        gameState.players[socket.id] = { name: data.name, cards: data.cards, isCorrect: null };
        io.emit('update', gameState);
    });

    socket.on('admin-control', (action) => {
        if (action.type === 'next-step') {
            if (gameState.revealedCount < 8) {
                gameState.revealedCount++;
                // 新しいカードを出すときは、一旦判定表示を消す（演出用）
                Object.values(gameState.players).forEach(p => p.isCorrect = null);
            }
        } 
        else if (action.type === 'scoring') {
            Object.keys(gameState.players).forEach(id => {
                const p = gameState.players[id];
                if (gameState.revealedCount === 0) return;

                const idx = gameState.revealedCount - 1;
                // 今出した1枚が合っているか判定
                if (p.cards[idx] === CORRECT_ANSWER[idx]) {
                    p.isCorrect = (gameState.revealedCount === 8) ? 'all-correct' : 'correct';
                } else {
                    p.isCorrect = 'incorrect';
                }
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
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
