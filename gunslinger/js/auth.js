// Authentication UI Handler

class AuthManager {
    constructor() {
        this.modal = document.getElementById('auth-modal');
        this.form = document.getElementById('auth-form');
        this.isSignUp = false;
        this.isGuest = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Auth buttons
        document.getElementById('login-btn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('signup-btn').addEventListener('click', () => this.showSignUpModal());
        document.getElementById('guest-btn').addEventListener('click', () => this.playAsGuest());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        
        // Admin panel button
        const adminBtn = document.getElementById('admin-panel-btn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                window.location.href = 'admin.html';
            });
        }
        
        // Modal
        document.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        // Form
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    showLoginModal() {
        this.isSignUp = false;
        const usernameInput = document.getElementById('auth-username');
        const usernameGroup = document.getElementById('username-group');
        
        document.getElementById('auth-modal-title').textContent = 'Login';
        usernameGroup.classList.add('hidden');
        usernameInput.removeAttribute('required');
        usernameInput.disabled = true; // Disable to prevent validation
        document.getElementById('auth-submit-btn').textContent = 'Login';
        this.modal.classList.remove('hidden');
        document.getElementById('auth-email-username').focus();
    }

    showSignUpModal() {
        this.isSignUp = true;
        const usernameInput = document.getElementById('auth-username');
        const usernameGroup = document.getElementById('username-group');
        
        document.getElementById('auth-modal-title').textContent = 'Sign Up';
        usernameGroup.classList.remove('hidden');
        usernameInput.disabled = false; // Re-enable for signup
        usernameInput.setAttribute('required', 'required');
        document.getElementById('auth-submit-btn').textContent = 'Create Account';
        this.modal.classList.remove('hidden');
        usernameInput.focus();
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.form.reset();
        document.getElementById('auth-error').classList.add('hidden');
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const emailOrUsername = document.getElementById('auth-email-username').value;
        const password = document.getElementById('auth-password').value;
        const username = document.getElementById('auth-username').value;
        
        const submitBtn = document.getElementById('auth-submit-btn');
        const errorEl = document.getElementById('auth-error');
        
        // Disable button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Loading...';
        errorEl.classList.add('hidden');
        
        try {
            let result;
            
            if (this.isSignUp) {
                result = await firebaseClient.signUp(emailOrUsername, password, username);
            } else {
                // Check if input is email or username
                const isEmail = emailOrUsername.includes('@');
                if (isEmail) {
                    result = await firebaseClient.signIn(emailOrUsername, password);
                } else {
                    // Login by username - need to get email first
                    result = await firebaseClient.signInWithUsername(emailOrUsername, password);
                }
            }
            
            if (result.success) {
                // Check if user is banned
                const user = firebaseClient.getCurrentUser();
                if (user) {
                    const userData = await firebaseClient.getDocument('users', user.uid);
                    if (userData.banned) {
                        await firebaseClient.signOut();
                        errorEl.textContent = `Account banned: ${userData.banReason || 'No reason provided'}`;
                        errorEl.classList.remove('hidden');
                        return;
                    }
                }
                this.closeModal();
            } else {
                errorEl.textContent = result.error;
                errorEl.classList.remove('hidden');
            }
        } catch (error) {
            errorEl.textContent = 'An error occurred. Please try again.';
            errorEl.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = this.isSignUp ? 'Create Account' : 'Login';
        }
    }

    playAsGuest() {
        this.isGuest = true;
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('user-section').classList.remove('hidden');
        document.getElementById('username-display').textContent = 'Guest';
        document.getElementById('user-elo').textContent = '---';
        document.getElementById('user-wins').textContent = '---';
        document.getElementById('user-games').textContent = '---';
    }

    async logout() {
        if (this.isGuest) {
            this.isGuest = false;
            document.getElementById('auth-section').classList.remove('hidden');
            document.getElementById('user-section').classList.add('hidden');
        } else {
            await firebaseClient.signOut();
        }
    }
}

// Initialize auth manager when page loads
window.addEventListener('DOMContentLoaded', async () => {
    // Initialize Firebase
    try {
        await firebaseClient.initialize();
    } catch (error) {
        console.error('Firebase initialization error:', error);
        console.log('Running in guest-only mode');
    }
    
    // Initialize auth UI
    new AuthManager();
});
