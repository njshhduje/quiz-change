const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let gameState = {
    currentNum: 1,
    isOpen: false,
    players: {},
    // 8個の選択肢サンプル
    choices: ["選択肢1", "選択肢2", "選択肢3", "選択肢4", "選択肢5", "選択肢6", "選択肢7", "選択肢8"]
};

io.on('connection', (socket) => {
    socket.emit('update', gameState);

    socket.on('submit', (data) => {
        gameState.players[socket.id] = { name: data.name, cards: data.cards, isCorrect: null };
        io.emit('update', gameState);
    });

    socket.on('admin-control', (action) => {
        if (action.type === 'next') {
            gameState.currentNum++;
            gameState.isOpen = false;
            gameState.players = {}; 
        } else if (action.type === 'toggle') {
            gameState.isOpen = !gameState.isOpen;
        } else if (action.type === 'judge') {
            if (gameState.players[action.id]) gameState.players[action.id].isCorrect = action.result;
        }
        io.emit('update', gameState);
    });
});

server.listen(process.env.PORT || 3000);
