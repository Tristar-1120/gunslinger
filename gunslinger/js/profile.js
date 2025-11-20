// User Profile Page

class ProfilePage {
    constructor() {
        this.username = null;
        this.userId = null;
        this.profileData = null;
        
        this.init();
    }

    async init() {
        // Get username from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.username = urlParams.get('user');
        
        if (!this.username) {
            this.showError('No username provided');
            return;
        }
        
        // Initialize Firebase
        try {
            await firebaseClient.initialize();
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.showError('Failed to connect to database');
            return;
        }
        
        // Load profile
        await this.loadProfile();
        
        // Setup event listeners
        document.getElementById('view-leaderboard-btn')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    async loadProfile() {
        try {
            // Get user by username
            const result = await firebaseClient.getUserByUsername(this.username);
            
            if (!result.success) {
                this.showError(`Player "${this.username}" not found`);
                return;
            }
            
            this.profileData = result.user;
            this.userId = result.user.id;
            
            // Get user's rank
            const rank = await this.getUserRank();
            
            // Display profile
            this.displayProfile(rank);
            
        } catch (error) {
            console.error('Load profile error:', error);
            this.showError('Failed to load profile');
        }
    }

    async getUserRank() {
        try {
            const leaderboard = await firebaseClient.getLeaderboard(1000);
            if (!leaderboard.success) return null;
            
            const index = leaderboard.leaderboard.findIndex(p => p.id === this.userId);
            return index >= 0 ? index + 1 : null;
        } catch (error) {
            console.error('Get rank error:', error);
            return null;
        }
    }

    displayProfile(rank) {
        // Hide loading, show content
        document.getElementById('profile-loading').classList.add('hidden');
        document.getElementById('profile-content').classList.remove('hidden');
        
        // Store user ID for friend requests
        document.getElementById('profile-user-id').value = this.userId;
        
        // Username
        document.getElementById('profile-username').textContent = this.profileData.username;
        
        // Rank Tier Badge
        const elo = this.profileData.eloRating || 1000;
        const rankTier = firebaseClient.getRankTier(elo);
        const rankBadge = document.getElementById('profile-rank-badge');
        rankBadge.querySelector('.rank-icon').textContent = rankTier.icon;
        rankBadge.querySelector('.rank-name').textContent = rankTier.name;
        rankBadge.querySelector('.rank-name').style.color = rankTier.color;
        
        // Stats
        const gamesPlayed = this.profileData.gamesPlayed || 0;
        const gamesWon = this.profileData.gamesWon || 0;
        const gamesLost = this.profileData.gamesLost || 0;
        const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
        
        document.getElementById('profile-elo').textContent = elo;
        document.getElementById('profile-winrate').textContent = `${winRate}%`;
        document.getElementById('profile-record').textContent = `${gamesWon} / ${gamesLost}`;
        document.getElementById('profile-rank').textContent = rank ? `#${rank}` : 'Unranked';
        
        // Streaks
        const currentStreak = this.profileData.currentStreak || 0;
        const bestStreak = this.profileData.bestStreak || 0;
        document.getElementById('profile-streak').textContent = currentStreak > 0 ? `${currentStreak} 🔥` : '0';
        document.getElementById('profile-best-streak').textContent = bestStreak;
        
        // Reaction times
        const avgReaction = this.profileData.avgReactionTime;
        const bestReaction = this.profileData.bestReactionTime;
        document.getElementById('profile-avg-reaction').textContent = avgReaction ? `${Math.round(avgReaction)}ms` : '---';
        document.getElementById('profile-best-reaction').textContent = bestReaction ? `${Math.round(bestReaction)}ms` : '---';
        
        // Achievements
        this.displayAchievements();
        
        // Badges
        this.displayBadges();
        
        // Show friend request button if viewing someone else's profile
        this.setupFriendButton();
        
        // Load head to head if logged in
        this.loadHeadToHead();
        
        // Draw character
        this.drawCharacter();
    }
    
    displayAchievements() {
        const achievements = this.profileData.achievements || [];
        const allAchievements = firebaseClient.getAchievementDefinitions();
        const grid = document.getElementById('achievements-grid');
        
        grid.innerHTML = Object.keys(allAchievements).map(key => {
            const achievement = allAchievements[key];
            const unlocked = achievements.includes(key);
            return `
                <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-desc">${achievement.desc}</div>
                    </div>
                    ${unlocked ? '<div class="achievement-check">✓</div>' : ''}
                </div>
            `;
        }).join('');
    }
    
    displayBadges() {
        const badges = this.profileData.badges || [];
        
        if (badges.length === 0) {
            document.getElementById('badges-section').classList.add('hidden');
            return;
        }
        
        document.getElementById('badges-section').classList.remove('hidden');
        const grid = document.getElementById('badges-grid');
        
        grid.innerHTML = badges.map(badge => `
            <div class="badge-item">
                <div class="badge-icon">⭐</div>
                <div class="badge-name">${badge}</div>
            </div>
        `).join('');
    }
    
    async setupFriendButton() {
        const currentUser = firebaseClient.getCurrentUser();
        if (!currentUser || currentUser.uid === this.userId) {
            return; // Don't show button on own profile or when not logged in
        }
        
        const btn = document.getElementById('send-friend-request-btn');
        btn.classList.remove('hidden');
        
        // Check if already friends
        const friendsResult = await firebaseClient.getFriends(currentUser.uid);
        if (friendsResult.success) {
            const isFriend = friendsResult.friends.some(f => f.id === this.userId);
            if (isFriend) {
                btn.textContent = '✓ Friends';
                btn.disabled = true;
            }
        }
    }
    
    async loadHeadToHead() {
        const currentUser = firebaseClient.getCurrentUser();
        if (!currentUser || currentUser.uid === this.userId) {
            return; // Don't show h2h on own profile
        }
        
        const result = await firebaseClient.getHeadToHead(currentUser.uid, this.userId);
        if (result.success && result.record) {
            const yourRecord = result.record[currentUser.uid] || { wins: 0, losses: 0 };
            const theirRecord = result.record[this.userId] || { wins: 0, losses: 0 };
            
            if (yourRecord.wins > 0 || theirRecord.wins > 0) {
                document.getElementById('head-to-head-section').classList.remove('hidden');
                document.getElementById('h2h-your-wins').textContent = yourRecord.wins;
                document.getElementById('h2h-their-wins').textContent = theirRecord.wins;
            }
        }
    }

    drawCharacter() {
        const canvas = document.getElementById('profile-character-canvas');
        const ctx = canvas.getContext('2d');
        
        // Get character config from profile
        const char = this.profileData.character || {
            hat: 'cowboy',
            hatColor: '#654321',
            outfit: 'poncho',
            outfitColor: '#ff4444',
            gun: 'revolver',
            gunColor: '#2c2c2c',
            accessory: 'none',
            eye: 'normal',
            bodyShape: 'normal'
        };
        
        // Create character instance
        const character = new Character(
            char.hat,
            char.outfitColor,
            1,
            char.hatColor,
            char.gunColor,
            char.outfit,
            char.gun,
            char.accessory,
            char.eye,
            char.bodyShape
        );
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw character
        character.draw(ctx, 100, 200);
    }

    showError(message) {
        document.getElementById('profile-loading').classList.add('hidden');
        document.getElementById('profile-content').classList.add('hidden');
        document.getElementById('profile-error').classList.remove('hidden');
        document.getElementById('error-text').textContent = message;
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    new ProfilePage();
});
