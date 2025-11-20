class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1000;
        this.canvas.height = 500;
        
        this.state = 'mode-select';
        this.gameMode = null; // 'local' or 'online'
        this.currentRound = 0;
        this.roundResults = [];
        
        this.player1 = null;
        this.player2 = null;
        this.currentMap = null;
        
        this.cueStartTime = null;
        this.player1Time = null;
        this.player2Time = null;
        this.canShoot = false;
        
        this.customization1 = null;
        this.customization2 = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('local-btn').addEventListener('click', () => this.selectMode('local'));
        document.getElementById('online-btn').addEventListener('click', () => this.selectMode('online'));
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('back-btn').addEventListener('click', () => this.backToModeSelect());
        document.getElementById('back-online-btn').addEventListener('click', () => this.backToModeSelect());
        document.getElementById('create-room-btn').addEventListener('click', () => this.createOnlineRoom());
        document.getElementById('join-room-btn').addEventListener('click', () => this.joinOnlineRoom());
        document.getElementById('copy-code-btn').addEventListener('click', () => this.copyRoomCode());
        document.getElementById('play-again-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('save-character-btn').addEventListener('click', () => this.saveCharacter());
        
        // Matchmaking
        this.matchmakingManager = new MatchmakingManager(this);
        this.matchmakingManager.setupEventListeners();
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Mobile touch controls - Local mode
        const p1Btn = document.getElementById('mobile-p1-btn');
        const p2Btn = document.getElementById('mobile-p2-btn');
        
        p1Btn.addEventListener('click', () => this.handleMobileShoot('player1'));
        p1Btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMobileShoot('player1');
        });
        
        p2Btn.addEventListener('click', () => this.handleMobileShoot('player2'));
        p2Btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMobileShoot('player2');
        });
        
        // Canvas tap for online mode
        this.canvas.addEventListener('click', (e) => {
            if (this.isMobile && this.gameMode === 'online' && this.state === 'playing') {
                this.handleMobileShoot();
            }
        });
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.isMobile && this.gameMode === 'online' && this.state === 'playing') {
                e.preventDefault();
                this.handleMobileShoot();
            }
        });
        
        // Detect mobile and setup responsive canvas
        this.checkMobile();
        this.setupResponsiveCanvas();
        
        // Handle window resize and orientation changes
        window.addEventListener('resize', () => {
            this.setupResponsiveCanvas();
            if (this.isMobile) {
                this.checkOrientation();
            }
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.setupResponsiveCanvas();
                if (this.isMobile) {
                    this.checkOrientation();
                }
            }, 100);
        });
    }
    
    setupResponsiveCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(window.innerWidth - 40, 1000);
        const maxHeight = Math.min(window.innerHeight - 300, 500);
        
        // Maintain aspect ratio
        const aspectRatio = 1000 / 500;
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }
    
    checkMobile() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                        || window.innerWidth <= 768;
        this.isMobile = isMobile;
        
        if (isMobile) {
            document.body.classList.add('mobile');
            this.checkOrientation();
        }
    }
    
    checkOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        const landscapePrompt = document.getElementById('landscape-prompt');
        const isInGame = this.state === 'playing';
        
        if (this.isMobile && isPortrait) {
            // Show landscape prompt on ALL screens in portrait mode
            if (landscapePrompt) {
                landscapePrompt.classList.remove('hidden');
                
                // During gameplay, show as banner instead of full overlay
                if (isInGame) {
                    landscapePrompt.classList.add('in-game');
                } else {
                    landscapePrompt.classList.remove('in-game');
                }
            }
        } else {
            if (landscapePrompt) {
                landscapePrompt.classList.add('hidden');
                landscapePrompt.classList.remove('in-game');
            }
        }
    }
    
    handleMobileShoot(player = null) {
        // For local mode, specify which player
        if (player === 'player1') {
            const event = new KeyboardEvent('keydown', { key: ' ' });
            this.handleKeyPress(event);
        } else if (player === 'player2') {
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            this.handleKeyPress(event);
        } else {
            // Online mode - use space
            const event = new KeyboardEvent('keydown', { key: ' ' });
            this.handleKeyPress(event);
        }
    }
    
    async createOnlineRoom() {
        const createBtn = document.getElementById('create-room-btn');
        const originalText = createBtn.textContent;
        
        try {
            // Show loading state
            createBtn.disabled = true;
            createBtn.textContent = 'CREATING ROOM...';
            
            const config = this.customization1.getCharacterConfig();
            const response = await this.multiplayerManager.createRoom(config);
            
            // Show waiting room with code
            this.showScreen('waiting-room');
            const codeDisplay = document.getElementById('room-code-display');
            codeDisplay.textContent = response.roomCode;
            
            // Make code copyable
            document.getElementById('copy-code-btn').style.display = 'inline-block';
            document.getElementById('waiting-message').textContent = 'Share this code with your opponent!';
            
            this.multiplayerManager.markReady();
        } catch (error) {
            createBtn.disabled = false;
            createBtn.textContent = originalText;
            alert('Failed to create room: ' + error.message);
        }
    }
    
    async joinOnlineRoom() {
        const roomCode = document.getElementById('room-code-input').value.trim();
        if (!roomCode || roomCode.length !== 6) {
            alert('Please enter a valid 6-digit room code');
            return;
        }
        
        const joinBtn = document.getElementById('join-room-btn');
        const originalText = joinBtn.textContent;
        
        try {
            // Show loading state
            joinBtn.disabled = true;
            joinBtn.textContent = 'JOINING...';
            
            const config = this.customization1.getCharacterConfig();
            await this.multiplayerManager.joinRoom(roomCode, config);
            
            // Show waiting room
            this.showScreen('waiting-room');
            document.getElementById('room-code-display').textContent = roomCode;
            document.getElementById('copy-code-btn').style.display = 'none';
            document.getElementById('waiting-message').textContent = 'Joined! Starting soon...';
            
            this.multiplayerManager.markReady();
        } catch (error) {
            joinBtn.disabled = false;
            joinBtn.textContent = originalText;
            alert('Failed to join room: ' + error.message);
        }
    }
    
    copyRoomCode() {
        const code = document.getElementById('room-code-display').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.getElementById('copy-code-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓ COPIED!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }).catch(() => {
            alert('Failed to copy. Code: ' + code);
        });
    }
    
    selectMode(mode) {
        this.gameMode = mode;
        
        if (mode === 'online') {
            this.showScreen('online-setup');
            if (!this.multiplayerManager) {
                this.multiplayerManager = new MultiplayerManager(this);
            }
            // Use 'online' prefix for online mode customization
            this.customization1 = new CustomizationManager('online');
            
            // Show/hide save button based on login status
            this.updateSaveButtonVisibility();
            
            return;
        }
        
        this.showScreen('customization');
        
        // Initialize customization managers for local mode
        this.customization1 = new CustomizationManager(1);
        this.customization2 = new CustomizationManager(2);
    }
    
    updateSaveButtonVisibility() {
        const saveBtn = document.getElementById('save-character-btn');
        if (saveBtn) {
            if (firebaseClient.isAuthenticated()) {
                saveBtn.classList.remove('hidden');
            } else {
                saveBtn.classList.add('hidden');
            }
        }
    }
    
    async saveCharacter() {
        if (!firebaseClient.isAuthenticated()) {
            this.showSaveMessage('Please login to save your character', 'error');
            return;
        }
        
        const user = firebaseClient.getCurrentUser();
        const characterConfig = this.customization1.getCharacterConfig();
        
        try {
            await firebaseClient.updateCharacter(user.uid, characterConfig);
            this.showSaveMessage('✓ Character saved!', 'success');
        } catch (error) {
            console.error('Error saving character:', error);
            this.showSaveMessage('Failed to save character', 'error');
        }
    }
    
    showSaveMessage(message, type) {
        const msgEl = document.getElementById('save-character-msg');
        if (msgEl) {
            msgEl.textContent = message;
            msgEl.className = `save-msg ${type}`;
            msgEl.classList.remove('hidden');
            
            setTimeout(() => {
                msgEl.classList.add('hidden');
            }, 3000);
        }
    }
    
    backToModeSelect() {
        // Clean up online mode if active
        if (this.gameMode === 'online') {
            if (this.multiplayerManager) {
                this.multiplayerManager.disconnect();
            }
            if (this.matchmakingManager) {
                this.matchmakingManager.leaveQueue();
            }
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
        }
        
        this.showScreen('mode-select');
    }

    startGame() {
        const p1Config = this.customization1.getCharacterConfig();
        const p2Config = this.customization2.getCharacterConfig();
        
        this.player1 = new Character(
            p1Config.hat, p1Config.outfitColor, 1, p1Config.hatColor, 
            p1Config.gunColor, p1Config.outfit, p1Config.gun, 
            p1Config.accessory, p1Config.eye, p1Config.bodyShape
        );
        this.player2 = new Character(
            p2Config.hat, p2Config.outfitColor, 2, p2Config.hatColor, 
            p2Config.gunColor, p2Config.outfit, p2Config.gun, 
            p2Config.accessory, p2Config.eye, p2Config.bodyShape
        );
        
        this.showScreen('game-screen');
        this.startRound();
    }
    
    startOnlineGame(opponentData = null) {
        // Create characters for online mode
        const myConfig = this.customization1.getCharacterConfig();
        
        // Get opponent config if available
        const oppConfig = opponentData?.character || {
            hat: 'cowboy',
            outfit: 'vest',
            gun: 'revolver',
            accessory: 'none',
            eye: 'normal',
            bodyShape: 'normal',
            outfitColor: '#4444ff',
            hatColor: '#654321',
            gunColor: '#2c2c2c'
        };
        
        // Format usernames with rank (if available)
        const oppElo = opponentData?.elo;
        const myElo = firebaseClient.isAuthenticated() ? 
            parseInt(document.getElementById('user-elo')?.textContent) || null : null;
        
        this.opponentUsername = opponentData?.username || 'Guest';
        this.myUsername = firebaseClient.isAuthenticated() ? 
            firebaseClient.getCurrentUser().displayName : 'Guest';
        
        // Add rank if we have ELO data (will be fetched from leaderboard)
        if (oppElo) {
            this.fetchRankForUsername(this.opponentUsername, oppElo).then(rank => {
                if (rank) {
                    this.opponentUsername = `${this.opponentUsername} #${rank}`;
                    // Update character username
                    if (this.multiplayerManager.playerNum === 1) {
                        this.player2.username = this.opponentUsername;
                    } else {
                        this.player1.username = this.opponentUsername;
                    }
                }
            });
        }
        
        if (myElo && firebaseClient.isAuthenticated()) {
            this.fetchRankForUsername(this.myUsername, myElo).then(rank => {
                if (rank) {
                    this.myUsername = `${this.myUsername} #${rank}`;
                    // Update character username
                    if (this.multiplayerManager.playerNum === 1) {
                        this.player1.username = this.myUsername;
                    } else {
                        this.player2.username = this.myUsername;
                    }
                }
            });
        }
        
        // Determine which player we are
        if (this.multiplayerManager.playerNum === 1) {
            this.player1 = new Character(
                myConfig.hat, myConfig.outfitColor, 1, myConfig.hatColor, 
                myConfig.gunColor, myConfig.outfit, myConfig.gun, 
                myConfig.accessory, myConfig.eye, myConfig.bodyShape
            );
            this.player1.username = this.myUsername;
            
            // Opponent character (player 2)
            this.player2 = new Character(
                oppConfig.hat, oppConfig.outfitColor, 2, oppConfig.hatColor, 
                oppConfig.gunColor, oppConfig.outfit, oppConfig.gun, 
                oppConfig.accessory, oppConfig.eye, oppConfig.bodyShape
            );
            this.player2.username = this.opponentUsername;
        } else {
            // We are player 2
            this.player1 = new Character(
                oppConfig.hat, oppConfig.outfitColor, 1, oppConfig.hatColor, 
                oppConfig.gunColor, oppConfig.outfit, oppConfig.gun, 
                oppConfig.accessory, oppConfig.eye, oppConfig.bodyShape
            );
            this.player1.username = this.opponentUsername;
            
            this.player2 = new Character(
                myConfig.hat, myConfig.outfitColor, 2, myConfig.hatColor, 
                myConfig.gunColor, myConfig.outfit, myConfig.gun, 
                myConfig.accessory, myConfig.eye, myConfig.bodyShape
            );
            this.player2.username = this.myUsername;
        }
        
        // Initialize game state
        this.currentRound = 0;
        this.roundResults = [];
        this.player1.score = 0;
        this.player2.score = 0;
        
        // Create a temporary map for display until first round starts
        const tempMapData = CONFIG.MAPS[0];
        this.currentMap = new GameMap(tempMapData);
        
        this.showScreen('game-screen');
        this.showStatus('Waiting for round to start...');
        this.updateUI();
        
        // Start the game loop so we can see the characters
        this.state = 'playing';
        this.gameLoop();
    }

    startRound() {
        this.currentRound++;
        this.player1Time = null;
        this.player2Time = null;
        this.canShoot = false;
        this.cueStartTime = Date.now(); // Set initial time for early fire detection
        
        // Clear any existing cue timeout
        if (this.cueTimeout) {
            clearTimeout(this.cueTimeout);
            this.cueTimeout = null;
        }
        
        // Select random map
        const mapData = CONFIG.MAPS[Math.floor(Math.random() * CONFIG.MAPS.length)];
        this.currentMap = new GameMap(mapData);
        
        this.updateUI();
        this.showStatus('Get Ready...');
        
        // Wait random time before cue
        const waitTime = CONFIG.MIN_WAIT_TIME + Math.random() * (CONFIG.MAX_WAIT_TIME - CONFIG.MIN_WAIT_TIME);
        
        this.cueTimeout = setTimeout(() => {
            this.triggerCue();
        }, waitTime);
        
        this.gameLoop();
    }

    triggerCue() {
        this.currentMap.activateCue();
        this.cueStartTime = Date.now();
        this.canShoot = true;
        this.showStatus(this.currentMap.cueText + ' DRAW!');
    }

    handleKeyPress(e) {
        if (this.state !== 'playing') return;
        
        const currentTime = Date.now();
        const reactionTime = currentTime - this.cueStartTime;
        
        // Check for early fire (before cue)
        if (!this.canShoot && this.cueStartTime) {
            // Player shot before the cue
            if (this.gameMode === 'online' && this.multiplayerManager) {
                if (e.key === CONFIG.KEYS.PLAYER1 || e.key === CONFIG.KEYS.PLAYER2) {
                    this.showStatus('TOO EARLY! You lose this round!');
                    this.canShoot = false;
                    // Send a penalty time to server
                    this.multiplayerManager.sendShot(99999);
                }
                return;
            }
            
            // Local mode early fire
            if (e.key === CONFIG.KEYS.PLAYER1 && this.player1Time === null) {
                // Cancel the cue trigger
                if (this.cueTimeout) {
                    clearTimeout(this.cueTimeout);
                    this.cueTimeout = null;
                }
                this.showStatus('PLAYER 1 SHOT TOO EARLY! Player 2 wins!');
                this.player1.startDeathAnimation();
                this.player2.startShootAnimation();
                this.endRound(2);
                return;
            }
            
            if (e.key === CONFIG.KEYS.PLAYER2 && this.player2Time === null) {
                // Cancel the cue trigger
                if (this.cueTimeout) {
                    clearTimeout(this.cueTimeout);
                    this.cueTimeout = null;
                }
                this.showStatus('PLAYER 2 SHOT TOO EARLY! Player 1 wins!');
                this.player2.startDeathAnimation();
                this.player1.startShootAnimation();
                this.endRound(1);
                return;
            }
        }
        
        if (!this.canShoot) return;
        
        // Online multiplayer mode
        if (this.gameMode === 'online' && this.multiplayerManager) {
            if (e.key === CONFIG.KEYS.PLAYER1 || e.key === CONFIG.KEYS.PLAYER2) {
                this.multiplayerManager.sendShot(reactionTime);
                this.canShoot = false; // Prevent multiple shots
            }
            return;
        }
        
        // Local multiplayer mode
        if (e.key === CONFIG.KEYS.PLAYER1 && this.player1Time === null) {
            this.player1Time = reactionTime;
            this.player1.startShootAnimation();
            this.player2.startDeathAnimation();
            this.endRound(1);
        }
        
        if (e.key === CONFIG.KEYS.PLAYER2 && this.player2Time === null) {
            this.player2Time = reactionTime;
            this.player2.startShootAnimation();
            this.player1.startDeathAnimation();
            this.endRound(2);
        }
    }

    endRound(winner) {
        this.canShoot = false;
        
        if (winner === 1) {
            this.player1.score++;
        } else {
            this.player2.score++;
        }
        
        this.roundResults.push({
            round: this.currentRound,
            p1Time: this.player1Time,
            p2Time: this.player2Time,
            winner: winner
        });
        
        this.showStatus(`Player ${winner} wins this round!`);
        this.updateUI();
        
        setTimeout(() => {
            this.player1.resetAnimation();
            this.player2.resetAnimation();
            
            if (this.currentRound < CONFIG.TOTAL_ROUNDS) {
                this.startRound();
            } else {
                this.endGame();
            }
        }, 3000);
    }

    async endGame() {
        this.state = 'results';
        this.showScreen('results');
        
        const finalWinner = this.player1.score > this.player2.score ? 1 : 
                           this.player2.score > this.player1.score ? 2 : 0;
        
        const winnerText = finalWinner === 0 ? "IT'S A TIE!" : 
                          `PLAYER ${finalWinner} WINS!`;
        document.getElementById('winner-announcement').textContent = winnerText;
        
        this.displayResults();
        
        // Note: Local multiplayer does NOT affect ELO or online statistics
        // Only online multiplayer affects rankings
    }
    
    async updateEloRatings(winner) {
        const user = firebaseClient.getCurrentUser();
        if (!user) return;
        
        // For local mode, we only update the logged-in user's stats
        // Assume opponent is same rating for fair calculation
        const currentProfile = await firebaseClient.loadUserProfile(user.uid);
        if (!currentProfile.success) return;
        
        const profile = currentProfile.profile;
        const currentElo = profile.eloRating || 1000;
        const gamesPlayed = (profile.gamesPlayed || 0) + 1;
        const won = winner === 1;
        const gamesWon = (profile.gamesWon || 0) + (won ? 1 : 0);
        const gamesLost = (profile.gamesLost || 0) + (won ? 0 : 1);
        
        // Calculate ELO change (assume opponent has same rating)
        const eloResult = eloCalculator.calculateNewRatings(
            currentElo, 
            currentElo, // Opponent rating (same as player for local)
            this.player1.score,
            this.player2.score
        );
        
        const newElo = eloResult.player1.newRating;
        const eloChange = eloResult.player1.change;
        
        // Save character customization
        const characterConfig = this.customization1.getCharacterConfig();
        await firebaseClient.updateCharacter(user.uid, characterConfig);
        
        // Extract reaction times from rounds
        const reactionTimes = this.roundResults
            .filter(r => r.winner === 1 && r.p1Time !== null)
            .map(r => r.p1Time);
        
        // Update in Firebase with reaction times
        await firebaseClient.updateElo(user.uid, newElo, gamesPlayed, gamesWon, gamesLost, won, reactionTimes);
        
        // Update UI
        document.getElementById('user-elo').textContent = newElo;
        document.getElementById('user-wins').textContent = gamesWon;
        document.getElementById('user-games').textContent = gamesPlayed;
        
        // Show ELO change in results
        this.displayEloChange(eloChange);
    }
    
    displayEloChange(change) {
        const eloChangeEl = document.getElementById('elo-change');
        if (eloChangeEl) {
            const changeText = eloCalculator.formatChange(change);
            const changeClass = change >= 0 ? 'elo-positive' : 'elo-negative';
            eloChangeEl.innerHTML = `<span class="${changeClass}">ELO: ${changeText}</span>`;
            eloChangeEl.classList.remove('hidden');
        }
    }

    displayResults() {
        const table = document.getElementById('results-table');
        let html = '<tr><th>Round</th><th>Player 1</th><th>Player 2</th><th>Winner</th></tr>';
        
        this.roundResults.forEach(result => {
            const p1Display = result.p1Time !== null ? `${result.p1Time}ms` : '-';
            const p2Display = result.p2Time !== null ? `${result.p2Time}ms` : '-';
            
            html += `<tr>
                <td>Round ${result.round}</td>
                <td class="${result.winner === 1 ? 'winner-cell' : ''}">${p1Display}</td>
                <td class="${result.winner === 2 ? 'winner-cell' : ''}">${p2Display}</td>
                <td>Player ${result.winner}</td>
            </tr>`;
        });
        
        table.innerHTML = html;
    }

    resetGame() {
        this.currentRound = 0;
        this.roundResults = [];
        if (this.player1) this.player1.score = 0;
        if (this.player2) this.player2.score = 0;
        this.state = 'mode-select';
        
        // Clear status text
        this.showStatus('');
        
        if (this.gameMode === 'online' && this.multiplayerManager) {
            this.multiplayerManager.disconnect();
            // Reset matchmaking manager if it exists
            if (this.matchmakingManager) {
                this.matchmakingManager.leaveQueue();
            }
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
            
            this.showScreen('online-setup');
        } else {
            this.showScreen('customization');
        }
    }
    
    // Multiplayer game functions
    startMultiplayerRound(data) {
        this.currentRound = data.round;
        this.player1Time = null;
        this.player2Time = null;
        this.canShoot = false;
        this.cueStartTime = Date.now(); // Set initial time for early fire detection
        
        // Reset animations from previous round
        if (this.player1) this.player1.resetAnimation();
        if (this.player2) this.player2.resetAnimation();
        
        // Select map based on server data
        const mapData = CONFIG.MAPS[data.mapIndex];
        this.currentMap = new GameMap(mapData);
        
        this.updateUI();
        this.showStatus('Get Ready...');
        
        if (this.state !== 'playing') {
            this.state = 'playing';
            this.gameLoop();
        }
    }
    
    triggerMultiplayerCue(serverTime) {
        this.currentMap.activateCue();
        this.cueStartTime = Date.now();
        this.canShoot = true;
        this.showStatus(this.currentMap.cueText + ' DRAW!');
    }
    
    handleMultiplayerRoundEnd(data) {
        this.canShoot = false;
        
        // Update scores
        if (this.multiplayerManager.playerNum === 1) {
            this.player1.score = data.scores.player1;
            this.player2.score = data.scores.player2;
        } else {
            this.player1.score = data.scores.player2;
            this.player2.score = data.scores.player1;
        }
        
        // Set times for display
        if (data.winner === this.multiplayerManager.playerNum) {
            if (this.multiplayerManager.playerNum === 1) {
                this.player1Time = data.reactionTime;
                this.player1.startShootAnimation();
                this.player2.startDeathAnimation();
            } else {
                this.player2Time = data.reactionTime;
                this.player2.startShootAnimation();
                this.player1.startDeathAnimation();
            }
        } else {
            if (this.multiplayerManager.playerNum === 1) {
                this.player2Time = data.reactionTime;
                this.player2.startShootAnimation();
                this.player1.startDeathAnimation();
            } else {
                this.player1Time = data.reactionTime;
                this.player1.startShootAnimation();
                this.player2.startDeathAnimation();
            }
        }
        
        const winnerText = data.winner === this.multiplayerManager.playerNum ? 'You win!' : 'Opponent wins!';
        this.showStatus(winnerText);
        this.updateUI();
        
        // Reset animations after delay
        setTimeout(() => {
            this.player1.resetAnimation();
            this.player2.resetAnimation();
        }, 3000);
    }
    
    async handleMultiplayerGameEnd(data) {
        this.state = 'results';
        this.showScreen('results');
        
        const youWon = (data.winner === 1 && this.multiplayerManager.playerNum === 1) ||
                       (data.winner === 2 && this.multiplayerManager.playerNum === 2);
        const winnerText = data.winner === 0 ? "IT'S A TIE!" : 
                          youWon ? "YOU WIN!" : "OPPONENT WINS!";
        
        document.getElementById('winner-announcement').textContent = winnerText;
        
        // Display results
        const table = document.getElementById('results-table');
        let html = '<tr><th>Round</th><th>You</th><th>Opponent</th><th>Winner</th></tr>';
        
        data.results.forEach(result => {
            const isYourWin = result.winner === this.multiplayerManager.playerNum;
            const yourTime = isYourWin ? `${result.time}ms` : '-';
            const oppTime = !isYourWin ? `${result.time}ms` : '-';
            const winnerText = isYourWin ? 'You' : 'Opponent';
            
            html += `<tr>
                <td>Round ${result.round}</td>
                <td class="${isYourWin ? 'winner-cell' : ''}">${yourTime}</td>
                <td class="${!isYourWin ? 'winner-cell' : ''}">${oppTime}</td>
                <td>${winnerText}</td>
            </tr>`;
        });
        
        table.innerHTML = html;
        
        // Update ELO for authenticated users in online mode
        if (firebaseClient.isAuthenticated()) {
            await this.updateOnlineEloRatings(data, youWon);
        }
    }
    
    async updateOnlineEloRatings(data, youWon) {
        const user = firebaseClient.getCurrentUser();
        if (!user) return;
        
        const currentProfile = await firebaseClient.loadUserProfile(user.uid);
        if (!currentProfile.success) return;
        
        const profile = currentProfile.profile;
        const currentElo = profile.eloRating || 1000;
        const gamesPlayed = (profile.gamesPlayed || 0) + 1;
        const gamesWon = (profile.gamesWon || 0) + (youWon ? 1 : 0);
        const gamesLost = (profile.gamesLost || 0) + (youWon ? 0 : 1);
        
        // For online, assume opponent has similar rating (1000 default)
        // In a full implementation, you'd get opponent's actual rating
        const opponentElo = 1000;
        
        const yourScore = this.multiplayerManager.playerNum === 1 ? data.scores.player1 : data.scores.player2;
        const oppScore = this.multiplayerManager.playerNum === 1 ? data.scores.player2 : data.scores.player1;
        
        const eloResult = eloCalculator.calculateNewRatings(
            currentElo,
            opponentElo,
            yourScore,
            oppScore
        );
        
        const newElo = eloResult.player1.newRating;
        const eloChange = eloResult.player1.change;
        
        // Save character customization
        const characterConfig = this.customization1.getCharacterConfig();
        await firebaseClient.updateCharacter(user.uid, characterConfig);
        
        // Extract reaction times from your winning rounds
        const reactionTimes = data.results
            .filter(r => r.winner === this.multiplayerManager.playerNum)
            .map(r => r.time);
        
        // Update in Firebase with reaction times
        await firebaseClient.updateElo(user.uid, newElo, gamesPlayed, gamesWon, gamesLost, youWon, reactionTimes);
        
        // Update UI
        document.getElementById('user-elo').textContent = newElo;
        document.getElementById('user-wins').textContent = gamesWon;
        document.getElementById('user-games').textContent = gamesPlayed;
        
        // Show ELO change
        this.displayEloChange(eloChange);
    }

    gameLoop() {
        if (this.state !== 'playing') return;
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw map (if it exists)
        if (this.currentMap) {
            this.currentMap.draw(this.ctx, this.canvas.width, this.canvas.height);
        }
        
        // Draw characters (if they exist)
        if (this.player1 && this.player2) {
            // Determine winner and show times
            const showTimes = !this.canShoot && (this.player1Time !== null || this.player2Time !== null);
            const p1IsWinner = this.player1Time !== null;
            const p2IsWinner = this.player2Time !== null;
            
            // Draw characters
            this.player1.draw(this.ctx, 250, this.canvas.height - 130, 
                             this.player1Time, p1IsWinner, showTimes);
            this.player2.draw(this.ctx, 750, this.canvas.height - 130, 
                             this.player2Time, p2IsWinner, showTimes);
            
            // Update animations
            if (this.player1.animationState !== 'idle') {
                this.player1.updateAnimation();
            }
            if (this.player2.animationState !== 'idle') {
                this.player2.updateAnimation();
            }
        }
    }

    async fetchRankForUsername(username, elo) {
        try {
            // Get leaderboard data
            const leaderboard = await firebaseClient.getLeaderboard(100);
            if (!leaderboard.success) return null;
            
            // Find user's rank
            const userIndex = leaderboard.players.findIndex(p => p.username === username);
            return userIndex !== -1 ? userIndex + 1 : null;
        } catch (error) {
            console.error('Error fetching rank:', error);
            return null;
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(screenId).classList.remove('hidden');
        
        if (screenId === 'game-screen') {
            this.state = 'playing';
            
            // Check orientation for mobile
            if (this.isMobile) {
                this.checkOrientation();
                document.getElementById('mobile-controls').classList.remove('hidden');
                
                // Show appropriate controls based on game mode
                if (this.gameMode === 'local') {
                    document.getElementById('mobile-local-controls').classList.remove('hidden');
                    document.getElementById('mobile-online-controls').classList.add('hidden');
                } else {
                    document.getElementById('mobile-local-controls').classList.add('hidden');
                    document.getElementById('mobile-online-controls').classList.remove('hidden');
                }
            }
        } else {
            this.state = screenId === 'results' ? 'results' : 'menu';
            
            // Hide mobile controls on other screens
            document.getElementById('mobile-controls').classList.add('hidden');
            document.getElementById('mobile-local-controls').classList.add('hidden');
            document.getElementById('mobile-online-controls').classList.add('hidden');
            
            // Always check orientation on mobile
            if (this.isMobile) {
                this.checkOrientation();
            }
        }
    }

    showStatus(text) {
        document.getElementById('status-text').textContent = text;
    }

    updateUI() {
        document.getElementById('p1-score').textContent = `Player 1: ${this.player1.score}`;
        document.getElementById('p2-score').textContent = `Player 2: ${this.player2.score}`;
        document.getElementById('round-info').textContent = `Round ${this.currentRound}/${CONFIG.TOTAL_ROUNDS}`;
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
