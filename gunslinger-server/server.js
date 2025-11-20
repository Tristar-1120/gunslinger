const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: false
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 10000,
    pingInterval: 5000
});

// Game state
const rooms = new Map();
const players = new Map();
const matchmakingQueue = [];

// Generate random 6-digit room code
function generateRoomCode() {
    let code;
    do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (rooms.has(code));
    return code;
}

// Validate reaction time (anti-cheat)
function isValidReactionTime(time, cueTime) {
    const elapsed = Date.now() - cueTime;
    const MIN_REACTION = 50; // Minimum human reaction time
    const MAX_REACTION = 5000; // Maximum allowed time
    
    return time >= MIN_REACTION && time <= MAX_REACTION && time <= elapsed + 100;
}

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Create a new room
    socket.on('create-room', (playerData, callback) => {
        const roomCode = generateRoomCode();
        const room = {
            code: roomCode,
            host: socket.id,
            players: new Map(),
            state: 'waiting', // waiting, playing, finished
            currentRound: 0,
            roundResults: [],
            cueTime: null,
            roundWinner: null,
            createdAt: Date.now()
        };
        
        room.players.set(socket.id, {
            id: socket.id,
            playerNum: 1,
            character: playerData.character,
            username: playerData.username || 'Guest',
            elo: playerData.elo || 1000,
            score: 0,
            ready: false
        });
        
        rooms.set(roomCode, room);
        players.set(socket.id, roomCode);
        socket.join(roomCode);
        
        console.log(`Room created: ${roomCode} by ${playerData.username}`);
        callback({ success: true, roomCode, playerNum: 1 });
    });
    
    // Join existing room
    socket.on('join-room', (data, callback) => {
        const { roomCode, playerData } = data;
        const room = rooms.get(roomCode);
        
        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }
        
        if (room.players.size >= 2) {
            return callback({ success: false, error: 'Room is full' });
        }
        
        if (room.state !== 'waiting') {
            return callback({ success: false, error: 'Game already in progress' });
        }
        
        room.players.set(socket.id, {
            id: socket.id,
            playerNum: 2,
            character: playerData.character,
            username: playerData.username || 'Guest',
            elo: playerData.elo || 1000,
            score: 0,
            ready: false
        });
        
        players.set(socket.id, roomCode);
        socket.join(roomCode);
        
        // Get host player data
        const hostPlayer = room.players.get(room.host);
        
        // Notify host that player joined (send joiner's data to host)
        io.to(room.host).emit('player-joined', {
            playerNum: 2,
            character: playerData.character,
            username: playerData.username || 'Guest',
            elo: playerData.elo || 1000
        });
        
        console.log(`${playerData.username} joined room: ${roomCode}`);
        
        // Send host's data back to joiner
        callback({ 
            success: true, 
            roomCode, 
            playerNum: 2,
            opponent: {
                character: hostPlayer.character,
                username: hostPlayer.username,
                elo: hostPlayer.elo
            }
        });
    });
    
    // Player ready
    socket.on('player-ready', () => {
        const roomCode = players.get(socket.id);
        if (!roomCode) return;
        
        const room = rooms.get(roomCode);
        if (!room) return;
        
        const player = room.players.get(socket.id);
        if (player) {
            player.ready = true;
        }
        
        // Check if both players are ready
        const allReady = Array.from(room.players.values()).every(p => p.ready);
        if (allReady && room.players.size === 2) {
            startRound(room);
        }
    });
    
    // Player shot
    socket.on('player-shot', (reactionTime) => {
        const roomCode = players.get(socket.id);
        if (!roomCode) return;
        
        const room = rooms.get(roomCode);
        if (!room || room.state !== 'playing') return;
        

        
        // Already have a winner for this round
        if (room.roundWinner) return;
        
        const player = room.players.get(socket.id);
        if (!player) return;
        
        // Check for early fire penalty (99999 is the penalty marker)
        if (reactionTime >= 99999) {
            // Player shot too early - opponent wins
            const opponent = Array.from(room.players.values()).find(p => p.id !== socket.id);
            if (opponent) {
                room.roundWinner = opponent.playerNum;
                opponent.score++;
                
                io.to(roomCode).emit('round-end', {
                    winner: opponent.playerNum,
                    reactionTime: 0,
                    earlyFire: true,
                    scores: {
                        player1: Array.from(room.players.values()).find(p => p.playerNum === 1)?.score || 0,
                        player2: Array.from(room.players.values()).find(p => p.playerNum === 2)?.score || 0
                    }
                });
                
                room.roundResults.push({
                    round: room.currentRound,
                    winner: opponent.playerNum,
                    time: 0,
                    earlyFire: true
                });
                
                // Check if game is over
                if (room.currentRound >= 5) {
                    endGame(room);
                } else {
                    setTimeout(() => {
                        if (rooms.has(roomCode)) {
                            startRound(room);
                        }
                    }, 3000);
                }
            }
            return;
        }
        
        // Validate reaction time
        if (!isValidReactionTime(reactionTime, room.cueTime)) {
            console.log(`Invalid reaction time from ${socket.id}: ${reactionTime}ms`);
            return;
        }
        
        // First player to shoot wins
        room.roundWinner = player.playerNum;
        player.score++;
        
        // Broadcast round result
        io.to(roomCode).emit('round-end', {
            winner: player.playerNum,
            reactionTime: reactionTime,
            scores: {
                player1: Array.from(room.players.values()).find(p => p.playerNum === 1)?.score || 0,
                player2: Array.from(room.players.values()).find(p => p.playerNum === 2)?.score || 0
            }
        });
        
        room.roundResults.push({
            round: room.currentRound,
            winner: player.playerNum,
            time: reactionTime
        });
        
        // Check if game is over
        if (room.currentRound >= 5) {
            endGame(room);
        } else {
            // Start next round after delay
            setTimeout(() => {
                if (rooms.has(roomCode)) {
                    startRound(room);
                }
            }, 3000);
        }
    });
    
    // Join matchmaking queue
    socket.on('join-queue', (data, callback) => {
        const { character, elo, username } = data;
        
        // Check if player is already in queue
        const existingIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
        if (existingIndex !== -1) {
            return callback({ success: false, error: 'Already in queue' });
        }
        
        // Add to queue
        const queueEntry = {
            socketId: socket.id,
            character: character,
            username: username || 'Guest',
            elo: elo || 1000,
            joinedAt: Date.now()
        };
        
        matchmakingQueue.push(queueEntry);
        console.log(`${username} joined queue (ELO: ${queueEntry.elo}). Queue size: ${matchmakingQueue.length}`);
        
        callback({ success: true });
        
        // Try to find a match
        tryMatchmaking();
    });
    
    // Leave matchmaking queue
    socket.on('leave-queue', () => {
        const index = matchmakingQueue.findIndex(p => p.socketId === socket.id);
        if (index !== -1) {
            matchmakingQueue.splice(index, 1);
            console.log(`Player ${socket.id} left queue. Queue size: ${matchmakingQueue.length}`);
        }
    });
    
    // Disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        // Remove from queue if present
        const queueIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
        if (queueIndex !== -1) {
            matchmakingQueue.splice(queueIndex, 1);
            console.log(`Removed from queue. Queue size: ${matchmakingQueue.length}`);
        }
        
        const roomCode = players.get(socket.id);
        if (roomCode) {
            const room = rooms.get(roomCode);
            if (room) {
                // Notify other players
                io.to(roomCode).emit('player-disconnected');
                
                // Clean up room
                rooms.delete(roomCode);
            }
            players.delete(socket.id);
        }
    });
});

// Matchmaking algorithm
function tryMatchmaking() {
    if (matchmakingQueue.length < 2) {
        return; // Need at least 2 players
    }
    
    // Sort by join time (FIFO)
    matchmakingQueue.sort((a, b) => a.joinedAt - b.joinedAt);
    
    // Try to match players with similar ELO
    for (let i = 0; i < matchmakingQueue.length - 1; i++) {
        const player1 = matchmakingQueue[i];
        
        for (let j = i + 1; j < matchmakingQueue.length; j++) {
            const player2 = matchmakingQueue[j];
            
            // Calculate ELO difference
            const eloDiff = Math.abs(player1.elo - player2.elo);
            
            // Calculate time in queue (seconds)
            const timeInQueue1 = (Date.now() - player1.joinedAt) / 1000;
            const timeInQueue2 = (Date.now() - player2.joinedAt) / 1000;
            const avgTimeInQueue = (timeInQueue1 + timeInQueue2) / 2;
            
            // Expand acceptable ELO range over time (100 base + 50 per 10 seconds)
            const maxEloDiff = 100 + Math.floor(avgTimeInQueue / 10) * 50;
            
            if (eloDiff <= maxEloDiff) {
                // Match found!
                createMatchFromQueue(player1, player2);
                
                // Remove matched players from queue
                matchmakingQueue.splice(j, 1); // Remove player2 first (higher index)
                matchmakingQueue.splice(i, 1); // Then remove player1
                
                console.log(`Match created! ELO diff: ${eloDiff}, Time in queue: ${avgTimeInQueue.toFixed(1)}s`);
                
                // Try to match remaining players
                if (matchmakingQueue.length >= 2) {
                    setTimeout(tryMatchmaking, 100);
                }
                
                return;
            }
        }
    }
}

function createMatchFromQueue(player1, player2) {
    const roomCode = generateRoomCode();
    
    const room = {
        code: roomCode,
        host: player1.socketId,
        players: new Map(),
        state: 'waiting',
        currentRound: 0,
        roundResults: [],
        cueTime: null,
        roundWinner: null,
        createdAt: Date.now()
    };
    
    // Add both players
    room.players.set(player1.socketId, {
        id: player1.socketId,
        playerNum: 1,
        character: player1.character,
        username: player1.username,
        score: 0,
        ready: false,
        elo: player1.elo
    });
    
    room.players.set(player2.socketId, {
        id: player2.socketId,
        playerNum: 2,
        character: player2.character,
        username: player2.username,
        score: 0,
        ready: false,
        elo: player2.elo
    });
    
    rooms.set(roomCode, room);
    players.set(player1.socketId, roomCode);
    players.set(player2.socketId, roomCode);
    
    // Join socket rooms
    io.sockets.sockets.get(player1.socketId)?.join(roomCode);
    io.sockets.sockets.get(player2.socketId)?.join(roomCode);
    
    // Notify both players with opponent data
    io.to(player1.socketId).emit('match-found', {
        roomCode: roomCode,
        playerNum: 1,
        opponentElo: player2.elo,
        opponent: {
            character: player2.character,
            username: player2.username,
            elo: player2.elo
        }
    });
    
    io.to(player2.socketId).emit('match-found', {
        roomCode: roomCode,
        playerNum: 2,
        opponentElo: player1.elo,
        opponent: {
            character: player1.character,
            username: player1.username,
            elo: player1.elo
        }
    });
    
    console.log(`Match created: ${roomCode} (${player1.username} ${player1.elo} vs ${player2.username} ${player2.elo})`);
    
    // Auto-ready both players and start game
    setTimeout(() => {
        const p1 = room.players.get(player1.socketId);
        const p2 = room.players.get(player2.socketId);
        if (p1) p1.ready = true;
        if (p2) p2.ready = true;
        
        if (room.players.size === 2) {
            startRound(room);
        }
    }, 2000);
}

function startRound(room) {
    room.currentRound++;
    room.state = 'playing';
    room.roundWinner = null;
    
    // Select random map
    const maps = ['Desert Noon', 'Saloon', 'Ghost Town', 'Canyon', 'Train Station'];
    const mapIndex = Math.floor(Math.random() * maps.length);
    
    // Notify players round is starting
    io.to(room.code).emit('round-start', {
        round: room.currentRound,
        mapIndex: mapIndex
    });
    
    // Random delay before cue (2-5 seconds)
    const delay = 2000 + Math.random() * 3000;
    
    setTimeout(() => {
        if (rooms.has(room.code) && room.state === 'playing') {
            room.cueTime = Date.now();
            io.to(room.code).emit('cue-trigger', {
                serverTime: room.cueTime
            });
            

        }
    }, delay);
}

function endGame(room) {
    room.state = 'finished';
    
    const players = Array.from(room.players.values());
    const p1Score = players.find(p => p.playerNum === 1)?.score || 0;
    const p2Score = players.find(p => p.playerNum === 2)?.score || 0;
    
    const finalWinner = p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : 0;
    
    io.to(room.code).emit('game-end', {
        winner: finalWinner,
        scores: { player1: p1Score, player2: p2Score },
        results: room.roundResults
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        rooms: rooms.size,
        players: players.size
    });
});





// Koyeb uses port 8000
const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Gunslinger server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
