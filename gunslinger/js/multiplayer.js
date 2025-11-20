class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.roomCode = null;
        this.playerNum = null;
        this.serverUrl = 'https://tri-process.tristaronline.deno.net';
        this.connected = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            // Load Socket.IO from CDN
            if (typeof io === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
                script.onload = () => {
                    this.initializeSocket();
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load Socket.IO'));
                document.head.appendChild(script);
            } else {
                this.initializeSocket();
                resolve();
            }
        });
    }

    initializeSocket() {
        this.socket = io(this.serverUrl, {
            transports: ['polling'], // Force polling only (no WebSocket)
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000
        });
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
            this.showMessage('Connected!');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.connected = false;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.connected = false;
            
            if (reason === 'io server disconnect') {
                // Server disconnected us
                this.showError('Server disconnected. Returning to menu...');
                this.handleDisconnect();
            } else if (reason === 'transport close' || reason === 'ping timeout') {
                // Connection lost
                this.showError('Connection lost. Returning to menu...');
                this.handleDisconnect();
            } else {
                this.showError('Disconnected from server');
            }
        });

        this.socket.on('player-joined', (data) => {
            this.showMessage(`Opponent joined!`);
            document.getElementById('waiting-message').textContent = 'Opponent found! Starting game...';
            
            // Store opponent data
            this.opponentData = data.opponent;
            
            // Start the game with opponent data
            setTimeout(() => {
                this.game.startOnlineGame(this.opponentData);
            }, 1000);
        });

        this.socket.on('round-start', (data) => {
            this.game.startMultiplayerRound(data);
        });

        this.socket.on('cue-trigger', (data) => {
            this.game.triggerMultiplayerCue(data.serverTime);
        });

        this.socket.on('round-end', (data) => {
            this.game.handleMultiplayerRoundEnd(data);
        });

        this.socket.on('game-end', (data) => {
            this.game.handleMultiplayerGameEnd(data);
        });

        this.socket.on('player-disconnected', () => {
            this.showError('Opponent disconnected. Returning to menu...');
            this.handleDisconnect();
        });
        
        this.socket.on('match-found', (data) => {
            console.log('Match found!', data);
            // Store opponent data
            this.opponentData = data.opponent;
            this.game.matchmakingManager.handleMatchFound(data);
        });
    }

    async checkServerHealth() {
        try {
            const response = await fetch(`${this.serverUrl}/health`);
            const data = await response.json();
            return data.status === 'ok';
        } catch (error) {
            return false;
        }
    }

    async createRoom(characterConfig) {
        // Check if server is up first
        this.showMessage('Checking server status...');
        const serverUp = await this.checkServerHealth();
        
        if (!serverUp) {
            throw new Error('Server is starting up. Please wait 30 seconds and try again.');
        }

        if (!this.connected) {
            this.showMessage('Connecting to server...');
            await this.connect();
            
            // Wait for connection
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout. Server may be cold-starting.'));
                }, 10000);
                
                if (this.connected) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    this.socket.once('connect', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                }
            });
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 5000);

            const elo = firebaseClient.isAuthenticated() ? 
                parseInt(document.getElementById('user-elo')?.textContent) || 1000 : 1000;
            
            this.socket.emit('create-room', { 
                character: characterConfig,
                username: firebaseClient.isAuthenticated() ? 
                    firebaseClient.getCurrentUser().displayName : 'Guest',
                elo: elo
            }, (response) => {
                clearTimeout(timeout);
                if (response.success) {
                    this.roomCode = response.roomCode;
                    this.playerNum = response.playerNum;
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    async joinRoom(roomCode, characterConfig) {
        // Check if server is up first
        this.showMessage('Checking server status...');
        const serverUp = await this.checkServerHealth();
        
        if (!serverUp) {
            throw new Error('Server is starting up. Please wait 30 seconds and try again.');
        }

        if (!this.connected) {
            this.showMessage('Connecting to server...');
            await this.connect();
            
            // Wait for connection
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout. Server may be cold-starting.'));
                }, 10000);
                
                if (this.connected) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    this.socket.once('connect', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                }
            });
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 5000);

            const elo = firebaseClient.isAuthenticated() ? 
                parseInt(document.getElementById('user-elo')?.textContent) || 1000 : 1000;
            
            this.socket.emit('join-room', { 
                roomCode, 
                playerData: { 
                    character: characterConfig,
                    username: firebaseClient.isAuthenticated() ? 
                        firebaseClient.getCurrentUser().displayName : 'Guest',
                    elo: elo
                }
            }, (response) => {
                clearTimeout(timeout);
                if (response.success) {
                    this.roomCode = response.roomCode;
                    this.playerNum = response.playerNum;
                    
                    // Store opponent data if available
                    if (response.opponent) {
                        this.opponentData = response.opponent;
                    }
                    
                    // Player 2 should also start the game with opponent data
                    setTimeout(() => {
                        this.game.startOnlineGame(this.opponentData);
                    }, 1000);
                    
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    markReady() {
        if (this.socket && this.connected) {
            this.socket.emit('player-ready');
        }
    }

    sendShot(reactionTime) {
        if (this.socket && this.connected) {
            this.socket.emit('player-shot', reactionTime);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.roomCode = null;
            this.playerNum = null;
        }
    }
    
    handleDisconnect() {
        // Clean up and return to menu
        this.disconnect();
        setTimeout(() => {
            this.game.resetGame();
        }, 2000);
    }

    showMessage(message) {
        const statusEl = document.getElementById('multiplayer-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = '#4eff4e';
        }
    }

    showError(message) {
        const statusEl = document.getElementById('multiplayer-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = '#ff4444';
        }
    }
}
