// Friends System Manager

class FriendsManager {
    constructor() {
        this.currentUser = null;
        this.friends = [];
        this.friendRequests = [];
        this.init();
    }

    async init() {
        // Wait for Firebase to be ready
        if (!firebaseClient.isAuthenticated()) {
            console.log('User not authenticated, friends system disabled');
            return;
        }

        this.currentUser = firebaseClient.getCurrentUser();
        await this.loadFriends();
        await this.loadFriendRequests();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Friend request button on profiles
        document.getElementById('send-friend-request-btn')?.addEventListener('click', () => {
            this.sendFriendRequest();
        });

        // View friends button
        document.getElementById('view-friends-btn')?.addEventListener('click', () => {
            this.showFriendsModal();
        });

        // Close friends modal
        document.querySelector('.close-friends')?.addEventListener('click', () => {
            this.closeFriendsModal();
        });

        // Add friend buttons
        document.getElementById('add-friend-btn-1')?.addEventListener('click', () => {
            this.showAddFriendModal();
        });

        document.getElementById('add-friend-btn-2')?.addEventListener('click', () => {
            this.showAddFriendModal();
        });

        // Close add friend modal
        document.querySelector('.close-add-friend')?.addEventListener('click', () => {
            this.closeAddFriendModal();
        });

        // Add friend search
        document.getElementById('add-friend-search-btn')?.addEventListener('click', () => {
            this.searchFriendsInModal();
        });

        document.getElementById('add-friend-search-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchFriendsInModal();
            }
        });

        // Close modal on background click
        document.getElementById('add-friend-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'add-friend-modal') {
                this.closeAddFriendModal();
            }
        });
    }

    async loadFriends() {
        if (!this.currentUser) return;

        const result = await firebaseClient.getFriends(this.currentUser.uid);
        if (result.success) {
            this.friends = result.friends;
            this.updateFriendsUI();
        }
    }

    async loadFriendRequests() {
        if (!this.currentUser) return;

        const result = await firebaseClient.getFriendRequests(this.currentUser.uid);
        console.log('Friend requests result:', result);
        if (result.success) {
            this.friendRequests = result.requests;
            console.log('Friend requests loaded:', this.friendRequests);
            this.updateFriendRequestsUI();
        } else {
            console.error('Failed to load friend requests:', result.error);
        }
    }

    async sendFriendRequest() {
        if (!this.currentUser) {
            alert('You must be logged in to send friend requests');
            return;
        }

        const targetUserId = document.getElementById('profile-user-id')?.value;
        if (!targetUserId) return;

        const result = await firebaseClient.sendFriendRequest(this.currentUser.uid, targetUserId);
        
        if (result.success) {
            alert('Friend request sent!');
            document.getElementById('send-friend-request-btn').disabled = true;
            document.getElementById('send-friend-request-btn').textContent = 'REQUEST SENT';
        } else {
            alert(result.error);
        }
    }

    async acceptFriendRequest(requestId, fromUserId) {
        const result = await firebaseClient.acceptFriendRequest(requestId, fromUserId, this.currentUser.uid);
        
        if (result.success) {
            await this.loadFriends();
            await this.loadFriendRequests();
        } else {
            alert('Failed to accept friend request');
        }
    }

    async rejectFriendRequest(requestId) {
        const result = await firebaseClient.rejectFriendRequest(requestId);
        
        if (result.success) {
            await this.loadFriendRequests();
        } else {
            alert('Failed to reject friend request');
        }
    }

    async removeFriend(friendId) {
        if (!confirm('Remove this friend?')) return;

        const result = await firebaseClient.removeFriend(this.currentUser.uid, friendId);
        
        if (result.success) {
            await this.loadFriends();
        } else {
            alert('Failed to remove friend');
        }
    }

    updateFriendsUI() {
        const container = document.getElementById('friends-list');
        if (!container) return;

        if (this.friends.length === 0) {
            container.innerHTML = '<p class="no-friends">No friends yet. Add some friends to duel!</p>';
            return;
        }

        container.innerHTML = this.friends.map(friend => {
            const rank = firebaseClient.getRankTier(friend.eloRating || 1000);
            return `
                <div class="friend-item">
                    <div class="friend-info">
                        <span class="friend-name">${friend.username}</span>
                        <span class="friend-rank" style="color: ${rank.color}">${rank.icon} ${rank.name}</span>
                        <span class="friend-elo">ELO: ${friend.eloRating || 1000}</span>
                    </div>
                    <div class="friend-actions">
                        <button class="friend-btn challenge-btn" onclick="friendsManager.challengeFriend('${friend.id}')">
                            ⚔️ CHALLENGE
                        </button>
                        <button class="friend-btn view-btn" onclick="window.location.href='profile.html?user=${friend.username}'">
                            👤 VIEW
                        </button>
                        <button class="friend-btn remove-btn" onclick="friendsManager.removeFriend('${friend.id}')">
                            ❌
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateFriendRequestsUI() {
        const container = document.getElementById('friend-requests-list');
        console.log('Updating friend requests UI, container:', container);
        console.log('Friend requests:', this.friendRequests);
        
        if (!container) {
            console.error('friend-requests-list container not found!');
            return;
        }

        const badge = document.getElementById('friend-requests-badge');
        if (badge) {
            if (this.friendRequests.length > 0) {
                badge.textContent = this.friendRequests.length;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        if (this.friendRequests.length === 0) {
            container.innerHTML = '<p class="no-requests">No pending friend requests</p>';
            return;
        }

        console.log('Rendering', this.friendRequests.length, 'friend requests');
        container.innerHTML = this.friendRequests.map(request => `
            <div class="friend-request-item">
                <div class="request-info">
                    <span class="request-name">${request.fromUser.username}</span>
                    <span class="request-elo">ELO: ${request.fromUser.eloRating || 1000}</span>
                </div>
                <div class="request-actions">
                    <button class="friend-btn accept-btn" onclick="friendsManager.acceptFriendRequest('${request.id}', '${request.fromUser.id}')">
                        ✓ ACCEPT
                    </button>
                    <button class="friend-btn reject-btn" onclick="friendsManager.rejectFriendRequest('${request.id}')">
                        ✗ REJECT
                    </button>
                </div>
            </div>
        `).join('');
    }

    challengeFriend(friendId) {
        // TODO: Implement friend challenge (create private room and invite)
        alert('Challenge feature coming soon! For now, create a private room and share the code.');
    }

    showFriendsModal() {
        document.getElementById('friends-modal')?.classList.remove('hidden');
    }

    closeFriendsModal() {
        document.getElementById('friends-modal')?.classList.add('hidden');
    }

    showAddFriendModal() {
        document.getElementById('add-friend-modal')?.classList.remove('hidden');
        document.getElementById('add-friend-search-input').value = '';
        document.getElementById('add-friend-search-results').innerHTML = '';
        document.getElementById('add-friend-search-input').focus();
    }

    closeAddFriendModal() {
        document.getElementById('add-friend-modal')?.classList.add('hidden');
    }

    async searchFriendsInModal() {
        const searchInput = document.getElementById('add-friend-search-input');
        const resultsContainer = document.getElementById('add-friend-search-results');
        const searchTerm = searchInput.value.trim();

        if (!searchTerm) {
            resultsContainer.innerHTML = '<p class="no-results">Enter a username to search</p>';
            return;
        }

        resultsContainer.innerHTML = '<p class="loading">Searching...</p>';

        const result = await firebaseClient.searchUsersByUsername(searchTerm);

        if (!result.success) {
            resultsContainer.innerHTML = '<p class="no-results">Search failed</p>';
            return;
        }

        if (result.users.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No users found</p>';
            return;
        }

        // Filter out current user and existing friends
        const filteredUsers = result.users.filter(user => 
            user.id !== this.currentUser.uid && 
            !this.friends.some(friend => friend.id === user.id)
        );

        if (filteredUsers.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No new users found</p>';
            return;
        }

        resultsContainer.innerHTML = filteredUsers.map(user => {
            const rank = firebaseClient.getRankTier(user.eloRating || 1000);
            return `
                <div class="friend-item">
                    <div class="friend-info">
                        <span class="friend-name">${user.username}</span>
                        <span class="friend-rank" style="color: ${rank.color}">${rank.icon} ${rank.name}</span>
                        <span class="friend-elo">ELO: ${user.eloRating || 1000}</span>
                    </div>
                    <div class="friend-actions">
                        <button class="friend-btn accept-btn" onclick="friendsManager.sendFriendRequestTo('${user.id}', '${user.username}')">
                            + ADD
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async searchFriends() {
        const searchInput = document.getElementById('friend-search-input');
        const resultsContainer = document.getElementById('friend-search-results');
        const searchTerm = searchInput.value.trim();

        if (!searchTerm) {
            resultsContainer.innerHTML = '<p class="no-results">Enter a username to search</p>';
            return;
        }

        resultsContainer.innerHTML = '<p class="loading">Searching...</p>';

        const result = await firebaseClient.searchUsersByUsername(searchTerm);

        if (!result.success) {
            resultsContainer.innerHTML = '<p class="no-results">Search failed</p>';
            return;
        }

        if (result.users.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No users found</p>';
            return;
        }

        // Filter out current user and existing friends
        const filteredUsers = result.users.filter(user => 
            user.id !== this.currentUser.uid && 
            !this.friends.some(friend => friend.id === user.id)
        );

        if (filteredUsers.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No new users found</p>';
            return;
        }

        resultsContainer.innerHTML = filteredUsers.map(user => {
            const rank = firebaseClient.getRankTier(user.eloRating || 1000);
            return `
                <div class="friend-item">
                    <div class="friend-info">
                        <span class="friend-name">${user.username}</span>
                        <span class="friend-rank" style="color: ${rank.color}">${rank.icon} ${rank.name}</span>
                        <span class="friend-elo">ELO: ${user.eloRating || 1000}</span>
                    </div>
                    <div class="friend-actions">
                        <button class="friend-btn accept-btn" onclick="friendsManager.sendFriendRequestTo('${user.id}', '${user.username}')">
                            + ADD
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async sendFriendRequestTo(userId, username) {
        if (!this.currentUser) return;

        const result = await firebaseClient.sendFriendRequest(this.currentUser.uid, userId);
        
        if (result.success) {
            alert(`Friend request sent to ${username}!`);
            // Refresh both search results
            this.searchFriendsInModal();
            // Also reload friend requests
            await this.loadFriendRequests();
        } else {
            alert(result.error || 'Failed to send friend request');
        }
    }
}

// Global instance
let friendsManager = null;

// Initialize when user logs in
window.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Firebase auth to complete
    setTimeout(() => {
        if (firebaseClient.isAuthenticated()) {
            friendsManager = new FriendsManager();
        }
    }, 1000);
});


// Tab switching helper
function showFriendsTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.friends-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    if (tabName === 'friends') {
        const friendsTab = document.getElementById('friends-tab');
        friendsTab.classList.add('active');
        friendsTab.classList.remove('hidden');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else if (tabName === 'requests') {
        const requestsTab = document.getElementById('requests-tab');
        requestsTab.classList.add('active');
        requestsTab.classList.remove('hidden');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}
