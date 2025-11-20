// Matchmaking Queue System

class MatchmakingManager {
    constructor(game) {
        this.game = game;
        this.inQueue = false;
        this.queueStartTime = null;
        this.queueInterval = null;
    }

    setupEventListeners() {
        document.getElementById('quick-match-btn')?.addEventListener('click', () => this.joinQueue());
        document.getElementById('cancel-queue-btn')?.addEventListener('click', () => this.leaveQueue());
    }

    async joinQueue() {
        if (!this.game.multiplayerManager) {
            this.game.multiplayerManager = new MultiplayerManager(this.game);
        }

        const quickMatchBtn = document.getElementById('quick-match-btn');
        const originalText = quickMatchBtn.textContent;

        try {
            quickMatchBtn.disabled = true;
            quickMatchBtn.textContent = 'CONNECTING...';

            // Connect to server if not already connected
            if (!this.game.multiplayerManager.connected) {
                await this.game.multiplayerManager.connect();
            }

            // Get character config
            const config = this.game.customization1.getCharacterConfig();

            // Join matchmaking queue
            this.game.multiplayerManager.socket.emit('join-queue', { 
                character: config,
                elo: this.getPlayerElo(),
                username: firebaseClient.isAuthenticated() ? 
                    firebaseClient.getCurrentUser().displayName : 'Guest'
            }, (response) => {
                if (response.success) {
                    this.inQueue = true;
                    this.queueStartTime = Date.now();
                    this.showQueueScreen();
                    this.startQueueTimer();
                } else {
                    throw new Error(response.error);
                }
            });

        } catch (error) {
            quickMatchBtn.disabled = false;
            quickMatchBtn.textContent = originalText;
            alert('Failed to join queue: ' + error.message);
        }
    }

    leaveQueue() {
        if (this.game.multiplayerManager?.socket) {
            this.game.multiplayerManager.socket.emit('leave-queue');
        }
        
        this.inQueue = false;
        this.stopQueueTimer();
        
        // Reset all buttons to their original state
        const createBtn = document.getElementById('create-room-btn');
        const joinBtn = document.getElementById('join-room-btn');
        const quickMatchBtn = document.getElementById('quick-match-btn');
        
        createBtn.disabled = false;
        createBtn.textContent = 'CREATE ROOM';
        
        joinBtn.disabled = false;
        joinBtn.textContent = 'JOIN ROOM';
        
        quickMatchBtn.disabled = false;
        quickMatchBtn.textContent = 'QUICK MATCH';
        
        this.game.showScreen('online-setup');
    }

    showQueueScreen() {
        this.game.showScreen('queue-screen');
        document.getElementById('queue-status').textContent = 'Searching for opponent...';
        document.getElementById('queue-time').textContent = '0s';
        
        const eloRange = this.getEloRange();
        document.getElementById('queue-elo-range').textContent = 
            `Looking for players: ${eloRange.min} - ${eloRange.max} ELO`;
    }

    startQueueTimer() {
        this.queueInterval = setInterval(() => {
            if (this.queueStartTime) {
                const elapsed = Math.floor((Date.now() - this.queueStartTime) / 1000);
                document.getElementById('queue-time').textContent = `${elapsed}s`;
                
                // Expand search range over time
                if (elapsed % 10 === 0) {
                    const eloRange = this.getEloRange(elapsed);
                    document.getElementById('queue-elo-range').textContent = 
                        `Looking for players: ${eloRange.min} - ${eloRange.max} ELO`;
                }
            }
        }, 1000);
    }

    stopQueueTimer() {
        if (this.queueInterval) {
            clearInterval(this.queueInterval);
            this.queueInterval = null;
        }
    }

    getPlayerElo() {
        if (firebaseClient.isAuthenticated()) {
            const eloText = document.getElementById('user-elo')?.textContent;
            return parseInt(eloText) || 1000;
        }
        return 1000; // Default for guests
    }

    getEloRange(elapsedSeconds = 0) {
        const playerElo = this.getPlayerElo();
        // Start with ±100, expand by 50 every 10 seconds
        const range = 100 + Math.floor(elapsedSeconds / 10) * 50;
        return {
            min: Math.max(800, playerElo - range),
            max: Math.min(2000, playerElo + range)
        };
    }

    handleMatchFound(data) {
        this.stopQueueTimer();
        this.inQueue = false;
        
        document.getElementById('queue-status').textContent = 'Match found!';
        document.getElementById('queue-elo-range').textContent = 
            `Opponent ELO: ${data.opponentElo || '???'}`;
        
        // Store match info
        this.game.multiplayerManager.roomCode = data.roomCode;
        this.game.multiplayerManager.playerNum = data.playerNum;
        
        // Transition to game with opponent data
        setTimeout(() => {
            this.game.startOnlineGame(this.game.multiplayerManager.opponentData);
        }, 1500);
    }
}

// Export for use in game
window.MatchmakingManager = MatchmakingManager;
