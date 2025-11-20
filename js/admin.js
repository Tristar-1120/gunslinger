const HEAD_ADMIN = '9b7BmmBbrFSZ5citqFe3oKfXw363';
let currentUser = null;
let isHeadAdmin = false;
let isAdmin = false;
let currentEditingPlayer = null;

// Check admin access
async function checkAdminAccess() {
    currentUser = firebaseClient.getCurrentUser();
    
    if (!currentUser) {
        alert('You must be logged in to access the admin panel');
        window.location.href = 'index.html';
        return false;
    }
    
    isHeadAdmin = currentUser.uid === HEAD_ADMIN;
    
    // Check if user is admin
    const adminDoc = await firebaseClient.getDocument('admins', currentUser.uid);
    isAdmin = adminDoc.exists || isHeadAdmin;
    
    if (!isAdmin) {
        alert('Access denied. You are not an administrator.');
        window.location.href = 'index.html';
        return false;
    }
    
    // Update UI
    const roleText = isHeadAdmin ? 'Head Administrator' : 'Administrator';
    document.getElementById('admin-role').textContent = `Logged in as: ${currentUser.displayName} (${roleText})`;
    
    return true;
}

// Switch tabs
window.switchTab = function(tab) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update sections
    document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));
    document.getElementById(`${tab}-section`).classList.add('active');
    
    // Load data
    if (tab === 'players') loadPlayers();
    if (tab === 'admins') loadAdmins();
    if (tab === 'bans') loadBans();
};

// Load all players
async function loadPlayers() {
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = '<p>Loading players...</p>';
    
    try {
        const players = await firebaseClient.getAllDocuments('users');
        
        if (players.length === 0) {
            playerList.innerHTML = '<p>No players found</p>';
            return;
        }
        
        playerList.innerHTML = '';
        players.forEach(player => {
            const isBanned = player.banned || false;
            const playerDiv = document.createElement('div');
            playerDiv.className = `player-item ${isBanned ? 'banned' : ''}`;
            playerDiv.innerHTML = `
                <div class="player-info">
                    <strong>${player.username || 'Unknown'}</strong>
                    ${isBanned ? '<span style="color: #ff4444;">[BANNED]</span>' : ''}
                    <br>
                    <small>ID: ${player.id}</small><br>
                    <small>ELO: ${player.elo || 1000} | Wins: ${player.wins || 0} | Losses: ${player.losses || 0}</small>
                </div>
                <div class="player-actions">
                    <button class="admin-btn" onclick="editPlayer('${player.id}')">Edit</button>
                    ${isBanned ? 
                        `<button class="admin-btn success" onclick="unbanPlayer('${player.id}')">Unban</button>` :
                        `<button class="admin-btn danger" onclick="banPlayer('${player.id}')">Ban</button>`
                    }
                    <button class="admin-btn danger" onclick="deletePlayer('${player.id}')">Delete</button>
                </div>
            `;
            playerList.appendChild(playerDiv);
        });
    } catch (error) {
        console.error('Error loading players:', error);
        playerList.innerHTML = '<p>Error loading players</p>';
    }
}

// Load admins
async function loadAdmins() {
    if (!isHeadAdmin) {
        document.getElementById('admin-list').innerHTML = '<p>Only the head admin can manage administrators</p>';
        document.querySelector('#admins-section button').style.display = 'none';
        return;
    }
    
    const adminList = document.getElementById('admin-list');
    adminList.innerHTML = '<p>Loading admins...</p>';
    
    try {
        const admins = await firebaseClient.getAllDocuments('admins');
        
        adminList.innerHTML = '';
        
        // Add head admin
        const headAdminDiv = document.createElement('div');
        headAdminDiv.className = 'player-item';
        headAdminDiv.innerHTML = `
            <div class="player-info">
                <strong>Head Administrator</strong>
                <span class="admin-badge">HEAD ADMIN</span>
                <br>
                <small>ID: ${HEAD_ADMIN}</small>
            </div>
        `;
        adminList.appendChild(headAdminDiv);
        
        // Add other admins
        admins.forEach(admin => {
            if (admin.id === HEAD_ADMIN) return;
            
            const adminDiv = document.createElement('div');
            adminDiv.className = 'player-item';
            adminDiv.innerHTML = `
                <div class="player-info">
                    <strong>${admin.username || 'Unknown'}</strong>
                    <span class="admin-badge">ADMIN</span>
                    <br>
                    <small>ID: ${admin.id}</small>
                </div>
                <div class="player-actions">
                    <button class="admin-btn danger" onclick="removeAdmin('${admin.id}')">Remove</button>
                </div>
            `;
            adminList.appendChild(adminDiv);
        });
        
        if (admins.length === 0) {
            adminList.innerHTML += '<p>No additional admins</p>';
        }
    } catch (error) {
        console.error('Error loading admins:', error);
        adminList.innerHTML = '<p>Error loading admins</p>';
    }
}

// Load banned players
async function loadBans() {
    const banList = document.getElementById('ban-list');
    banList.innerHTML = '<p>Loading banned players...</p>';
    
    try {
        const players = await firebaseClient.getAllDocuments('users');
        const banned = players.filter(p => p.banned);
        
        if (banned.length === 0) {
            banList.innerHTML = '<p>No banned players</p>';
            return;
        }
        
        banList.innerHTML = '';
        banned.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item banned';
            playerDiv.innerHTML = `
                <div class="player-info">
                    <strong>${player.username || 'Unknown'}</strong>
                    <br>
                    <small>ID: ${player.id}</small><br>
                    <small>Banned: ${player.banReason || 'No reason provided'}</small>
                </div>
                <div class="player-actions">
                    <button class="admin-btn success" onclick="unbanPlayer('${player.id}')">Unban</button>
                    <button class="admin-btn danger" onclick="deletePlayer('${player.id}')">Delete</button>
                </div>
            `;
            banList.appendChild(playerDiv);
        });
    } catch (error) {
        console.error('Error loading bans:', error);
        banList.innerHTML = '<p>Error loading bans</p>';
    }
}

// Edit player
window.editPlayer = async function(playerId) {
    try {
        const player = await firebaseClient.getDocument('users', playerId);
        if (!player.exists) {
            alert('Player not found');
            return;
        }
        
        currentEditingPlayer = playerId;
        document.getElementById('edit-player-name').textContent = player.username || 'Unknown';
        document.getElementById('edit-elo').value = player.elo || 1000;
        document.getElementById('edit-wins').value = player.wins || 0;
        document.getElementById('edit-losses').value = player.losses || 0;
        
        document.getElementById('edit-modal').style.display = 'block';
    } catch (error) {
        console.error('Error loading player:', error);
        alert('Error loading player data');
    }
};

// Save player edit
window.savePlayerEdit = async function() {
    if (!currentEditingPlayer) return;
    
    const elo = parseInt(document.getElementById('edit-elo').value);
    const wins = parseInt(document.getElementById('edit-wins').value);
    const losses = parseInt(document.getElementById('edit-losses').value);
    
    try {
        await firebaseClient.updateDocument('users', currentEditingPlayer, {
            elo: elo,
            wins: wins,
            losses: losses
        });
        
        alert('Player updated successfully');
        closeModal('edit-modal');
        loadPlayers();
    } catch (error) {
        console.error('Error updating player:', error);
        alert('Error updating player');
    }
};

// Ban player
window.banPlayer = async function(playerId) {
    const reason = prompt('Ban reason (optional):');
    if (reason === null) return;
    
    try {
        await firebaseClient.updateDocument('users', playerId, {
            banned: true,
            banReason: reason || 'No reason provided',
            bannedAt: new Date().toISOString(),
            bannedBy: currentUser.uid
        });
        
        alert('Player banned successfully');
        loadPlayers();
    } catch (error) {
        console.error('Error banning player:', error);
        alert('Error banning player');
    }
};

// Unban player
window.unbanPlayer = async function(playerId) {
    try {
        await firebaseClient.updateDocument('users', playerId, {
            banned: false,
            banReason: null,
            bannedAt: null,
            bannedBy: null
        });
        
        alert('Player unbanned successfully');
        loadPlayers();
        loadBans();
    } catch (error) {
        console.error('Error unbanning player:', error);
        alert('Error unbanning player');
    }
};

// Delete player
window.deletePlayer = async function(playerId) {
    if (!confirm('Are you sure you want to permanently delete this player? This cannot be undone.')) {
        return;
    }
    
    try {
        await firebaseClient.deleteDocument('users', playerId);
        alert('Player deleted successfully');
        loadPlayers();
    } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player');
    }
};

// Add admin
window.showAddAdminModal = function() {
    if (!isHeadAdmin) {
        alert('Only the head admin can add administrators');
        return;
    }
    document.getElementById('add-admin-modal').style.display = 'block';
};

window.addAdmin = async function() {
    const userId = document.getElementById('new-admin-id').value.trim();
    
    if (!userId) {
        alert('Please enter a user ID');
        return;
    }
    
    if (userId === HEAD_ADMIN) {
        alert('This user is already the head admin');
        return;
    }
    
    try {
        // Check if user exists
        const user = await firebaseClient.getDocument('users', userId);
        if (!user.exists) {
            alert('User not found');
            return;
        }
        
        // Add to admins collection
        await firebaseClient.setDocument('admins', userId, {
            username: user.username,
            addedAt: new Date().toISOString(),
            addedBy: currentUser.uid
        });
        
        alert('Admin added successfully');
        closeModal('add-admin-modal');
        loadAdmins();
    } catch (error) {
        console.error('Error adding admin:', error);
        alert('Error adding admin');
    }
};

// Remove admin
window.removeAdmin = async function(adminId) {
    if (!isHeadAdmin) {
        alert('Only the head admin can remove administrators');
        return;
    }
    
    if (!confirm('Remove this administrator?')) {
        return;
    }
    
    try {
        await firebaseClient.deleteDocument('admins', adminId);
        alert('Admin removed successfully');
        loadAdmins();
    } catch (error) {
        console.error('Error removing admin:', error);
        alert('Error removing admin');
    }
};

// Close modal
window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
};

// Search players
document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('player-search');
    if (searchBox) {
        searchBox.addEventListener('input', (e) => {
            const search = e.target.value.toLowerCase();
            document.querySelectorAll('#player-list .player-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(search) ? 'flex' : 'none';
            });
        });
    }
});

// Initialize
checkAdminAccess().then(hasAccess => {
    if (hasAccess) {
        loadPlayers();
    }
});
