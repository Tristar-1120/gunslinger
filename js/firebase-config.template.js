// Firebase Client Configuration Template
// This file is used during build to inject environment variables

class FirebaseClient {
    constructor() {
        // Config injected at build time from environment variables
        this.firebaseConfig = {
            apiKey: "${FIREBASE_API_KEY}",
            authDomain: "${FIREBASE_AUTH_DOMAIN}",
            projectId: "${FIREBASE_PROJECT_ID}",
            storageBucket: "${FIREBASE_STORAGE_BUCKET}",
            messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
            appId: "${FIREBASE_APP_ID}"
        };
       
        this.app = null;
        this.auth = null;
        this.db = null;
        this.currentUser = null;
    }

    async initialize() {
        // Load Firebase from CDN
        if (typeof firebase === 'undefined') {
            await this.loadFirebase();
        }
        
        // Initialize Firebase
        this.app = firebase.initializeApp(this.firebaseConfig);
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        
        // Set persistence to LOCAL (single tab only)
        await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        
        // Listen for auth changes
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.handleAuthChange(user);
            
            // Check for multi-login
            if (user) {
                this.checkMultiLogin(user.uid);
            }
        });
    }
    
    checkMultiLogin(userId) {
        // Create a unique session ID for this tab
        if (!sessionStorage.getItem('sessionId')) {
            sessionStorage.setItem('sessionId', Date.now() + '-' + Math.random());
        }
        const sessionId = sessionStorage.getItem('sessionId');
        
        // Listen for other tabs
        const sessionRef = this.db.collection('sessions').doc(userId);
        
        // Set this session as active
        sessionRef.set({
            sessionId: sessionId,
            lastActive: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Listen for session changes
        sessionRef.onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data.sessionId !== sessionId) {
                    // Another tab logged in with this account
                    this.handleMultiLogin();
                }
            }
        });
        
        // Update session every 30 seconds
        this.sessionInterval = setInterval(() => {
            if (this.currentUser) {
                sessionRef.update({
                    lastActive: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }, 30000);
    }
    
    handleMultiLogin() {
        alert('This account is being used in another tab/window. You have been logged out.');
        this.signOut();
        window.location.reload();
    }

    loadFirebase() {
        return new Promise((resolve, reject) => {
            // Load Firebase core
            const script1 = document.createElement('script');
            script1.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
            
            script1.onload = () => {
                // Load Firebase auth
                const script2 = document.createElement('script');
                script2.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js';
                
                script2.onload = () => {
                    // Load Firestore
                    const script3 = document.createElement('script');
                    script3.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js';
                    script3.onload = resolve;
                    script3.onerror = reject;
                    document.head.appendChild(script3);
                };
                script2.onerror = reject;
                document.head.appendChild(script2);
            };
            script1.onerror = reject;
            document.head.appendChild(script1);
        });
    }

    handleAuthChange(user) {
        if (user) {
            this.onSignIn(user);
        } else {
            this.onSignOut();
        }
    }

    async onSignIn(user) {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('user-section').classList.remove('hidden');
        document.getElementById('username-display').textContent = user.displayName || user.email.split('@')[0];
        
        // Load user profile
        this.loadUserProfile(user.uid);
        
        // Check if user is admin and show admin button
        this.checkAndShowAdminButton(user.uid);
    }
    
    async checkAndShowAdminButton(userId) {
        const HEAD_ADMIN = '9b7BmmBbrFSZ5citqFe3oKfXw363';
        const adminBtn = document.getElementById('admin-panel-btn');
        
        if (!adminBtn) return;
        
        // Check if head admin
        if (userId === HEAD_ADMIN) {
            adminBtn.classList.remove('hidden');
            return;
        }
        
        // Check if in admins collection
        try {
            const adminDoc = await this.db.collection('admins').doc(userId).get();
            if (adminDoc.exists) {
                adminBtn.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    }

    onSignOut() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('user-section').classList.add('hidden');
        
        // Hide admin button
        const adminBtn = document.getElementById('admin-panel-btn');
        if (adminBtn) {
            adminBtn.classList.add('hidden');
        }
    }

    async signUp(email, password, username) {
        try {
            // Create auth user
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update display name
            await user.updateProfile({ displayName: username });
            
            // Create user profile in Firestore
            await this.db.collection('users').doc(user.uid).set({
                username: username,
                email: email,
                eloRating: 1000,
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                
                // New fields for enhanced profile
                friends: [],
                friendRequests: [],
                avgReactionTime: null,
                bestReactionTime: null,
                currentStreak: 0,
                bestStreak: 0,
                achievements: ['firstBlood'], // Everyone gets this on signup
                badges: [],
                isAdmin: false,
                
                // Stats tracking
                totalReactionTime: 0,
                reactionTimeCount: 0,
                perfectDuels: 0,
                
                character: {
                    hat: 'cowboy',
                    hatColor: '#654321',
                    outfit: 'poncho',
                    outfitColor: '#ff4444',
                    gun: 'revolver',
                    gunColor: '#2c2c2c',
                    accessory: 'none',
                    eye: 'normal',
                    bodyShape: 'normal'
                }
            });

            return { success: true, user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signInWithUsername(username, password) {
        try {
            // Query users collection to find email by username
            const usersRef = this.db.collection('users');
            const snapshot = await usersRef.where('username', '==', username).limit(1).get();
            
            if (snapshot.empty) {
                return { success: false, error: 'Username not found' };
            }
            
            const userDoc = snapshot.docs[0];
            const email = userDoc.data().email;
            
            // Now sign in with the email
            return await this.signIn(email, password);
        } catch (error) {
            console.error('Sign in with username error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            // Clean up session
            if (this.sessionInterval) {
                clearInterval(this.sessionInterval);
                this.sessionInterval = null;
            }
            
            if (this.currentUser) {
                await this.db.collection('sessions').doc(this.currentUser.uid).delete();
            }
            
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async loadUserProfile(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            
            if (doc.exists) {
                const profile = doc.data();
                document.getElementById('user-elo').textContent = profile.eloRating || 1000;
                document.getElementById('user-wins').textContent = profile.gamesWon || 0;
                document.getElementById('user-games').textContent = profile.gamesPlayed || 0;
                return { success: true, profile };
            }
            
            return { success: false, error: 'Profile not found' };
        } catch (error) {
            console.error('Load profile error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateElo(userId, newElo, gamesPlayed, gamesWon, gamesLost, didWin, reactionTimes = []) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            
            // Calculate streak
            let currentStreak = userData.currentStreak || 0;
            let bestStreak = userData.bestStreak || 0;
            
            if (didWin) {
                currentStreak++;
                if (currentStreak > bestStreak) {
                    bestStreak = currentStreak;
                }
            } else {
                currentStreak = 0;
            }
            
            // Calculate reaction time stats
            let totalReactionTime = userData.totalReactionTime || 0;
            let reactionTimeCount = userData.reactionTimeCount || 0;
            let bestReactionTime = userData.bestReactionTime || null;
            
            for (const rt of reactionTimes) {
                if (rt > 0) { // Only count valid reaction times
                    totalReactionTime += rt;
                    reactionTimeCount++;
                    if (!bestReactionTime || rt < bestReactionTime) {
                        bestReactionTime = rt;
                    }
                }
            }
            
            const avgReactionTime = reactionTimeCount > 0 ? totalReactionTime / reactionTimeCount : null;
            
            await this.db.collection('users').doc(userId).update({
                eloRating: newElo,
                gamesPlayed: gamesPlayed,
                gamesWon: gamesWon,
                gamesLost: gamesLost || 0,
                currentStreak: currentStreak,
                bestStreak: bestStreak,
                totalReactionTime: totalReactionTime,
                reactionTimeCount: reactionTimeCount,
                avgReactionTime: avgReactionTime,
                bestReactionTime: bestReactionTime
            });
            
            // Check for achievements
            await this.checkAndAwardAchievements(userId, {
                gamesPlayed,
                gamesWon,
                currentStreak,
                bestStreak,
                avgReactionTime,
                bestReactionTime,
                perfectDuels: userData.perfectDuels || 0
            });
            
            return { success: true };
        } catch (error) {
            console.error('Update ELO error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async updateCharacter(userId, characterConfig) {
        try {
            await this.db.collection('users').doc(userId).update({
                character: characterConfig
            });
            return { success: true };
        } catch (error) {
            console.error('Update character error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getUserByUsername(username) {
        try {
            const snapshot = await this.db.collection('users')
                .where('username', '==', username)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'User not found' };
            }
            
            const doc = snapshot.docs[0];
            return { 
                success: true, 
                user: {
                    id: doc.id,
                    ...doc.data()
                }
            };
        } catch (error) {
            console.error('Get user by username error:', error);
            return { success: false, error: error.message };
        }
    }

    async recordMatch(player1Id, player2Id, winnerId, player1EloBefore, player2EloBefore, player1EloAfter, player2EloAfter, rounds) {
        try {
            // Check for perfect duel (winner won all rounds)
            const player1Wins = rounds.filter(r => r.winner === 1).length;
            const player2Wins = rounds.filter(r => r.winner === 2).length;
            const isPerfectDuel = (winnerId === player1Id && player1Wins === 5) || 
                                  (winnerId === player2Id && player2Wins === 5);
            
            // Extract reaction times
            const player1ReactionTimes = rounds.map(r => r.player1Time || 0).filter(t => t > 0);
            const player2ReactionTimes = rounds.map(r => r.player2Time || 0).filter(t => t > 0);
            
            // Record match
            await this.db.collection('matches').add({
                player1Id: player1Id,
                player2Id: player2Id,
                winnerId: winnerId,
                player1EloBefore: player1EloBefore,
                player2EloBefore: player2EloBefore,
                player1EloAfter: player1EloAfter,
                player2EloAfter: player2EloAfter,
                rounds: rounds,
                isPerfectDuel: isPerfectDuel,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update head to head
            await this.updateHeadToHead(player1Id, player2Id, winnerId);
            
            // Update perfect duel count if applicable
            if (isPerfectDuel) {
                await this.db.collection('users').doc(winnerId).update({
                    perfectDuels: firebase.firestore.FieldValue.increment(1)
                });
            }
            
            return { 
                success: true, 
                player1ReactionTimes,
                player2ReactionTimes,
                isPerfectDuel
            };
        } catch (error) {
            console.error('Record match error:', error);
            return { success: false, error: error.message };
        }
    }

    async getLeaderboard(limit = 100) {
        try {
            const snapshot = await this.db.collection('users')
                .where('gamesPlayed', '>', 0)
                .orderBy('eloRating', 'desc')
                .limit(limit)
                .get();
            
            const leaderboard = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return { success: true, leaderboard };
        } catch (error) {
            console.error('Get leaderboard error:', error);
            return { success: false, error: error.message };
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // ========================================
    // RANK TIER SYSTEM
    // ========================================
    
    getRankTier(elo) {
        if (elo >= 1800) return { name: 'Master', color: '#ff00ff', icon: '👑' };
        if (elo >= 1600) return { name: 'Diamond', color: '#00ffff', icon: '💎' };
        if (elo >= 1400) return { name: 'Platinum', color: '#e5e4e2', icon: '⭐' };
        if (elo >= 1200) return { name: 'Gold', color: '#ffd700', icon: '🥇' };
        if (elo >= 1000) return { name: 'Silver', color: '#c0c0c0', icon: '🥈' };
        return { name: 'Bronze', color: '#cd7f32', icon: '🥉' };
    }

    // ========================================
    // FRIEND SYSTEM
    // ========================================
    
    async sendFriendRequest(fromUserId, toUserId) {
        try {
            // Check if already friends
            const fromDoc = await this.db.collection('users').doc(fromUserId).get();
            const fromData = fromDoc.data();
            
            if (fromData.friends && fromData.friends.includes(toUserId)) {
                return { success: false, error: 'Already friends' };
            }
            
            // Check if request already exists
            const existingRequest = await this.db.collection('friendRequests')
                .where('fromUserId', '==', fromUserId)
                .where('toUserId', '==', toUserId)
                .where('status', '==', 'pending')
                .get();
            
            if (!existingRequest.empty) {
                return { success: false, error: 'Friend request already sent' };
            }
            
            // Create friend request
            await this.db.collection('friendRequests').add({
                fromUserId: fromUserId,
                toUserId: toUserId,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Send friend request error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async acceptFriendRequest(requestId, fromUserId, toUserId) {
        try {
            const batch = this.db.batch();
            
            // Update request status
            const requestRef = this.db.collection('friendRequests').doc(requestId);
            batch.update(requestRef, { status: 'accepted' });
            
            // Add to both users' friend lists
            const fromUserRef = this.db.collection('users').doc(fromUserId);
            batch.update(fromUserRef, {
                friends: firebase.firestore.FieldValue.arrayUnion(toUserId)
            });
            
            const toUserRef = this.db.collection('users').doc(toUserId);
            batch.update(toUserRef, {
                friends: firebase.firestore.FieldValue.arrayUnion(fromUserId)
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Accept friend request error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async rejectFriendRequest(requestId) {
        try {
            await this.db.collection('friendRequests').doc(requestId).update({
                status: 'rejected'
            });
            return { success: true };
        } catch (error) {
            console.error('Reject friend request error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async removeFriend(userId, friendId) {
        try {
            const batch = this.db.batch();
            
            const userRef = this.db.collection('users').doc(userId);
            batch.update(userRef, {
                friends: firebase.firestore.FieldValue.arrayRemove(friendId)
            });
            
            const friendRef = this.db.collection('users').doc(friendId);
            batch.update(friendRef, {
                friends: firebase.firestore.FieldValue.arrayRemove(userId)
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Remove friend error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getFriendRequests(userId) {
        try {
            const snapshot = await this.db.collection('friendRequests')
                .where('toUserId', '==', userId)
                .where('status', '==', 'pending')
                .get();
            
            const requests = [];
            for (const doc of snapshot.docs) {
                const data = doc.data();
                const fromUserDoc = await this.db.collection('users').doc(data.fromUserId).get();
                requests.push({
                    id: doc.id,
                    fromUser: { id: data.fromUserId, ...fromUserDoc.data() },
                    createdAt: data.createdAt
                });
            }
            
            return { success: true, requests };
        } catch (error) {
            console.error('Get friend requests error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getFriends(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            
            if (!userData.friends || userData.friends.length === 0) {
                return { success: true, friends: [] };
            }
            
            const friends = [];
            for (const friendId of userData.friends) {
                const friendDoc = await this.db.collection('users').doc(friendId).get();
                if (friendDoc.exists) {
                    friends.push({ id: friendId, ...friendDoc.data() });
                }
            }
            
            return { success: true, friends };
        } catch (error) {
            console.error('Get friends error:', error);
            return { success: false, error: error.message };
        }
    }

    async searchUsersByUsername(searchTerm) {
        try {
            const usersRef = this.db.collection('users');
            const snapshot = await usersRef
                .where('username', '>=', searchTerm)
                .where('username', '<=', searchTerm + '\uf8ff')
                .limit(10)
                .get();
            
            const users = [];
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, users };
        } catch (error) {
            console.error('Search users error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // HEAD TO HEAD RECORDS
    // ========================================
    
    async getHeadToHead(userId1, userId2) {
        try {
            // Create consistent ID (alphabetically sorted)
            const ids = [userId1, userId2].sort();
            const recordId = `${ids[0]}_${ids[1]}`;
            
            const doc = await this.db.collection('headToHead').doc(recordId).get();
            
            if (!doc.exists) {
                return { 
                    success: true, 
                    record: {
                        [userId1]: { wins: 0, losses: 0 },
                        [userId2]: { wins: 0, losses: 0 }
                    }
                };
            }
            
            return { success: true, record: doc.data() };
        } catch (error) {
            console.error('Get head to head error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async updateHeadToHead(userId1, userId2, winnerId) {
        try {
            const ids = [userId1, userId2].sort();
            const recordId = `${ids[0]}_${ids[1]}`;
            const loserId = winnerId === userId1 ? userId2 : userId1;
            
            const docRef = this.db.collection('headToHead').doc(recordId);
            const doc = await docRef.get();
            
            if (!doc.exists) {
                // Create new record
                await docRef.set({
                    [winnerId]: { wins: 1, losses: 0 },
                    [loserId]: { wins: 0, losses: 1 }
                });
            } else {
                // Update existing record
                const data = doc.data();
                await docRef.update({
                    [`${winnerId}.wins`]: (data[winnerId]?.wins || 0) + 1,
                    [`${loserId}.losses`]: (data[loserId]?.losses || 0) + 1
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Update head to head error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // ACHIEVEMENTS & BADGES
    // ========================================
    
    getAchievementDefinitions() {
        return {
            firstBlood: { name: 'First Blood', desc: 'Win your first duel', icon: '🎯' },
            quickDraw: { name: 'Quick Draw', desc: 'React in under 200ms', icon: '⚡' },
            sharpshooter: { name: 'Sharpshooter', desc: 'Win 10 duels', icon: '🎖️' },
            gunslinger: { name: 'Gunslinger', desc: 'Win 50 duels', icon: '🔫' },
            legend: { name: 'Legend', desc: 'Win 100 duels', icon: '👑' },
            unbeatable: { name: 'Unbeatable', desc: '5 win streak', icon: '🔥' },
            untouchable: { name: 'Untouchable', desc: '10 win streak', icon: '💫' },
            perfectDuel: { name: 'Perfect Duel', desc: 'Win all 5 rounds', icon: '💯' },
            speedDemon: { name: 'Speed Demon', desc: 'Average under 250ms', icon: '⚡' },
            veteran: { name: 'Veteran', desc: 'Play 100 games', icon: '🎖️' }
        };
    }
    
    async checkAndAwardAchievements(userId, stats) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            const currentAchievements = userData.achievements || [];
            const newAchievements = [];
            
            // Check each achievement
            if (stats.gamesWon >= 1 && !currentAchievements.includes('firstBlood')) {
                newAchievements.push('firstBlood');
            }
            if (stats.bestReactionTime && stats.bestReactionTime < 200 && !currentAchievements.includes('quickDraw')) {
                newAchievements.push('quickDraw');
            }
            if (stats.gamesWon >= 10 && !currentAchievements.includes('sharpshooter')) {
                newAchievements.push('sharpshooter');
            }
            if (stats.gamesWon >= 50 && !currentAchievements.includes('gunslinger')) {
                newAchievements.push('gunslinger');
            }
            if (stats.gamesWon >= 100 && !currentAchievements.includes('legend')) {
                newAchievements.push('legend');
            }
            if (stats.currentStreak >= 5 && !currentAchievements.includes('unbeatable')) {
                newAchievements.push('unbeatable');
            }
            if (stats.currentStreak >= 10 && !currentAchievements.includes('untouchable')) {
                newAchievements.push('untouchable');
            }
            if (stats.perfectDuels >= 1 && !currentAchievements.includes('perfectDuel')) {
                newAchievements.push('perfectDuel');
            }
            if (stats.avgReactionTime && stats.avgReactionTime < 250 && !currentAchievements.includes('speedDemon')) {
                newAchievements.push('speedDemon');
            }
            if (stats.gamesPlayed >= 100 && !currentAchievements.includes('veteran')) {
                newAchievements.push('veteran');
            }
            
            // Award new achievements
            if (newAchievements.length > 0) {
                await this.db.collection('users').doc(userId).update({
                    achievements: firebase.firestore.FieldValue.arrayUnion(...newAchievements)
                });
            }
            
            return { success: true, newAchievements };
        } catch (error) {
            console.error('Check achievements error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // ADMIN FUNCTIONS
    // ========================================
    
    async isUserAdmin(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            return doc.exists && doc.data().isAdmin === true;
        } catch (error) {
            console.error('Check admin error:', error);
            return false;
        }
    }
    
    async setUserAdmin(adminUserId, targetUserId, isAdmin) {
        try {
            // Verify requester is admin
            const isAdminUser = await this.isUserAdmin(adminUserId);
            if (!isAdminUser) {
                return { success: false, error: 'Unauthorized' };
            }
            
            await this.db.collection('users').doc(targetUserId).update({
                isAdmin: isAdmin
            });
            
            // Log admin action
            await this.db.collection('adminLogs').add({
                adminId: adminUserId,
                action: 'setAdmin',
                targetUserId: targetUserId,
                value: isAdmin,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Set admin error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async adminAdjustElo(adminUserId, targetUserId, newElo) {
        try {
            const isAdminUser = await this.isUserAdmin(adminUserId);
            if (!isAdminUser) {
                return { success: false, error: 'Unauthorized' };
            }
            
            await this.db.collection('users').doc(targetUserId).update({
                eloRating: newElo
            });
            
            await this.db.collection('adminLogs').add({
                adminId: adminUserId,
                action: 'adjustElo',
                targetUserId: targetUserId,
                newElo: newElo,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Admin adjust ELO error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async adminGrantBadge(adminUserId, targetUserId, badge) {
        try {
            const isAdminUser = await this.isUserAdmin(adminUserId);
            if (!isAdminUser) {
                return { success: false, error: 'Unauthorized' };
            }
            
            await this.db.collection('users').doc(targetUserId).update({
                badges: firebase.firestore.FieldValue.arrayUnion(badge)
            });
            
            await this.db.collection('adminLogs').add({
                adminId: adminUserId,
                action: 'grantBadge',
                targetUserId: targetUserId,
                badge: badge,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Admin grant badge error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // HELPER METHODS FOR ADMIN PANEL
    // ========================================
    
    async getAllDocuments(collection) {
        try {
            const snapshot = await this.db.collection(collection).get();
            const docs = [];
            snapshot.forEach(doc => {
                docs.push({ id: doc.id, ...doc.data(), exists: true });
            });
            return docs;
        } catch (error) {
            console.error(`Get all ${collection} error:`, error);
            return [];
        }
    }
    
    async getDocument(collection, docId) {
        try {
            const doc = await this.db.collection(collection).doc(docId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data(), exists: true };
            }
            return { exists: false };
        } catch (error) {
            console.error(`Get document error:`, error);
            return { exists: false };
        }
    }
    
    async updateDocument(collection, docId, data) {
        try {
            await this.db.collection(collection).doc(docId).update(data);
            return { success: true };
        } catch (error) {
            console.error(`Update document error:`, error);
            throw error;
        }
    }
    
    async setDocument(collection, docId, data) {
        try {
            await this.db.collection(collection).doc(docId).set(data);
            return { success: true };
        } catch (error) {
            console.error(`Set document error:`, error);
            throw error;
        }
    }
    
    async deleteDocument(collection, docId) {
        try {
            await this.db.collection(collection).doc(docId).delete();
            return { success: true };
        } catch (error) {
            console.error(`Delete document error:`, error);
            throw error;
        }
    }
}

// Export singleton instance
const firebaseClient = new FirebaseClient();
