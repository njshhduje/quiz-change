const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// 8問分のクイズデータ
const quizData = [
    { title: "大きさ順（大→小）", choices: ["太陽", "地球", "月"] },
    { title: "徳川将軍（早い順）", choices: ["家康", "家光", "慶喜"] },
    { title: "足の数（多い順）", choices: ["イカ", "クモ", "アリ"] },
    { title: "重い順（重→軽）", choices: ["鉄 1kg", "綿 1kg", "空気 1kg"] },
    { title: "標高（高い順）", choices: ["エベレスト", "富士山", "高尾山"] },
    { title: "五十音順（あ→ん）", choices: ["サツマイモ", "ジャガイモ", "タロイモ"] },
    { title: "面積（広い順）", choices: ["北海道", "東京都", "大阪府"] },
    { title: "発売が古い順", choices: ["ファミコン", "Switch", "PS5"] }
];

let gameState = {
    currentIdx: 0,
    isOpen: false,
    players: {}
};

io.on('connection', (socket) => {
    // 接続時に現在のクイズ情報を添えて送る
    socket.emit('update', { ...gameState, quiz: quizData[gameState.currentIdx] });

    socket.on('submit', (data) => {
        gameState.players[socket.id] = { name: data.name, cards: data.cards, isCorrect: null };
        io.emit('update', { ...gameState, quiz: quizData[gameState.currentIdx] });
    });

    socket.on('admin-control', (action) => {
        if (action.type === 'next') {
            if (gameState.currentIdx < quizData.length - 1) {
                gameState.currentIdx++;
                gameState.isOpen = false;
                gameState.players = {}; 
            }
        } else if (action.type === 'toggle') {
            gameState.isOpen = !gameState.isOpen;
        } else if (action.type === 'judge') {
            if (gameState.players[action.id]) gameState.players[action.id].isCorrect = action.result;
        }
        io.emit('update', { ...gameState, quiz: quizData[gameState.currentIdx] });
    });
});

server.listen(process.env.PORT || 3000);
