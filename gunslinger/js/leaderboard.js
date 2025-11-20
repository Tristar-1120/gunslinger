// Leaderboard Manager

class LeaderboardManager {
    constructor() {
        this.modal = document.getElementById('leaderboard-modal');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Both leaderboard buttons (guest and logged in)
        document.getElementById('leaderboard-btn-guest').addEventListener('click', () => this.show());
        document.getElementById('leaderboard-btn-user').addEventListener('click', () => this.show());
        document.querySelector('.close-leaderboard').addEventListener('click', () => this.hide());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
    }

    async show() {
        this.modal.classList.remove('hidden');
        await this.loadLeaderboard();
    }

    hide() {
        this.modal.classList.add('hidden');
    }

    async loadLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        const loading = document.getElementById('leaderboard-loading');
        const error = document.getElementById('leaderboard-error');
        
        // Show loading
        loading.classList.remove('hidden');
        error.classList.add('hidden');
        tbody.innerHTML = '';

        try {
            const result = await firebaseClient.getLeaderboard(100);
            
            if (result.success) {
                this.displayLeaderboard(result.leaderboard);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            console.error('Failed to load leaderboard:', err);
            error.textContent = 'Failed to load leaderboard. Please try again.';
            error.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
        }
    }

    displayLeaderboard(players) {
        const tbody = document.getElementById('leaderboard-body');
        const currentUser = firebaseClient.getCurrentUser();
        
        if (players.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No players yet. Be the first!</td></tr>';
            return;
        }

        let html = '';
        players.forEach((player, index) => {
            const rank = index + 1;
            const isCurrentUser = currentUser && player.id === currentUser.uid;
            const rowClass = isCurrentUser ? 'current-user-row' : '';
            
            // Calculate win rate
            const winRate = player.gamesPlayed > 0 
                ? Math.round((player.gamesWon / player.gamesPlayed) * 100) 
                : 0;
            
            // Medal for top 3
            let rankDisplay = rank;
            if (rank === 1) rankDisplay = '🥇';
            else if (rank === 2) rankDisplay = '🥈';
            else if (rank === 3) rankDisplay = '🥉';
            
            html += `
                <tr class="${rowClass}">
                    <td class="rank-cell">${rankDisplay}</td>
                    <td class="username-cell">
                        <a href="profile.html?user=${encodeURIComponent(player.username)}" class="profile-link">
                            ${this.escapeHtml(player.username)}${isCurrentUser ? ' (You)' : ''}
                        </a>
                    </td>
                    <td class="elo-cell">${player.eloRating}</td>
                    <td>${player.gamesWon}/${player.gamesLost}</td>
                    <td>${winRate}%</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    new LeaderboardManager();
});
