class CustomizationManager {
    constructor(playerNum) {
        this.playerNum = playerNum;
        // Support both "p1"/"p2" for local and "online" for online mode
        this.prefix = playerNum === 'online' ? 'online' : `p${playerNum}`;
        
        // Current selections
        this.hatIndex = 0;
        this.outfitIndex = 0;
        this.gunIndex = 0;
        this.accessoryIndex = 0;
        this.eyeIndex = 0;
        this.bodyShapeIndex = 0;
        this.outfitColor = playerNum === 1 ? '#ff4444' : '#4444ff';
        this.hatColor = '#654321';
        this.gunColor = '#2c2c2c';
        
        // Canvas for preview
        this.canvas = document.getElementById(`${this.prefix}-preview`);
        if (!this.canvas) {
            console.error(`Canvas not found for prefix: ${this.prefix}`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.setupControls();
        
        // Load saved character for online mode if logged in
        if (this.prefix === 'online') {
            this.loadSavedCharacter().then(() => {
                this.updatePreview();
            });
        } else {
            this.updatePreview();
        }
    }
    
    async loadSavedCharacter() {
        if (!firebaseClient.isAuthenticated()) return;
        
        const user = firebaseClient.getCurrentUser();
        const profile = await firebaseClient.loadUserProfile(user.uid);
        
        if (profile.success && profile.profile.character) {
            const char = profile.profile.character;
            
            // Find indices for each customization option
            this.hatIndex = CONFIG.HATS.findIndex(h => h.type === char.hat);
            this.outfitIndex = CONFIG.OUTFITS.findIndex(o => o.type === char.outfit);
            this.gunIndex = CONFIG.GUNS.findIndex(g => g.type === char.gun);
            this.accessoryIndex = CONFIG.ACCESSORIES.findIndex(a => a.type === char.accessory);
            this.eyeIndex = CONFIG.EYES.findIndex(e => e.type === char.eye);
            this.bodyShapeIndex = CONFIG.BODY_SHAPES.findIndex(b => b.type === char.bodyShape);
            
            // Set colors
            this.outfitColor = char.outfitColor || '#ff4444';
            this.hatColor = char.hatColor || '#654321';
            this.gunColor = char.gunColor || '#2c2c2c';
            
            // Update color inputs
            const outfitColorInput = document.getElementById(`${this.prefix}-outfit-color`);
            const hatColorInput = document.getElementById(`${this.prefix}-hat-color`);
            const gunColorInput = document.getElementById(`${this.prefix}-gun-color`);
            
            if (outfitColorInput) outfitColorInput.value = this.outfitColor;
            if (hatColorInput) hatColorInput.value = this.hatColor;
            if (gunColorInput) gunColorInput.value = this.gunColor;
            
            // Default to 0 if not found
            if (this.hatIndex === -1) this.hatIndex = 0;
            if (this.outfitIndex === -1) this.outfitIndex = 0;
            if (this.gunIndex === -1) this.gunIndex = 0;
            if (this.accessoryIndex === -1) this.accessoryIndex = 0;
            if (this.eyeIndex === -1) this.eyeIndex = 0;
            if (this.bodyShapeIndex === -1) this.bodyShapeIndex = 0;
        }
    }
    
    setupControls() {
        // Helper to safely add event listener
        const addListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Element not found: ${id}`);
            }
        };
        
        // Hat controls
        addListener(`${this.prefix}-hat-prev`, 'click', () => {
            this.hatIndex = (this.hatIndex - 1 + CONFIG.HATS.length) % CONFIG.HATS.length;
            this.updatePreview();
        });
        addListener(`${this.prefix}-hat-next`, 'click', () => {
            this.hatIndex = (this.hatIndex + 1) % CONFIG.HATS.length;
            this.updatePreview();
        });
        
        // Outfit controls
        addListener(`${this.prefix}-outfit-prev`, 'click', () => {
            this.outfitIndex = (this.outfitIndex - 1 + CONFIG.OUTFITS.length) % CONFIG.OUTFITS.length;
            this.updatePreview();
        });
        addListener(`${this.prefix}-outfit-next`, 'click', () => {
            this.outfitIndex = (this.outfitIndex + 1) % CONFIG.OUTFITS.length;
            this.updatePreview();
        });
        
        // Gun controls
        addListener(`${this.prefix}-gun-prev`, 'click', () => {
            this.gunIndex = (this.gunIndex - 1 + CONFIG.GUNS.length) % CONFIG.GUNS.length;
            this.updatePreview();
        });
        addListener(`${this.prefix}-gun-next`, 'click', () => {
            this.gunIndex = (this.gunIndex + 1) % CONFIG.GUNS.length;
            this.updatePreview();
        });
        
        // Accessory controls
        addListener(`${this.prefix}-accessory-prev`, 'click', () => {
            this.accessoryIndex = (this.accessoryIndex - 1 + CONFIG.ACCESSORIES.length) % CONFIG.ACCESSORIES.length;
            this.updatePreview();
        });
        addListener(`${this.prefix}-accessory-next`, 'click', () => {
            this.accessoryIndex = (this.accessoryIndex + 1) % CONFIG.ACCESSORIES.length;
            this.updatePreview();
        });
        
        // Eye controls
        addListener(`${this.prefix}-eye-prev`, 'click', () => {
            this.eyeIndex = (this.eyeIndex - 1 + CONFIG.EYES.length) % CONFIG.EYES.length;
            this.updatePreview();
        });
        addListener(`${this.prefix}-eye-next`, 'click', () => {
            this.eyeIndex = (this.eyeIndex + 1) % CONFIG.EYES.length;
            this.updatePreview();
        });
        
        // Body shape controls
        addListener(`${this.prefix}-body-prev`, 'click', () => {
            this.bodyShapeIndex = (this.bodyShapeIndex - 1 + CONFIG.BODY_SHAPES.length) % CONFIG.BODY_SHAPES.length;
            this.updatePreview();
        });
        addListener(`${this.prefix}-body-next`, 'click', () => {
            this.bodyShapeIndex = (this.bodyShapeIndex + 1) % CONFIG.BODY_SHAPES.length;
            this.updatePreview();
        });
        
        // Color controls
        addListener(`${this.prefix}-outfit-color`, 'input', (e) => {
            this.outfitColor = e.target.value;
            this.updatePreview();
        });
        addListener(`${this.prefix}-hat-color`, 'input', (e) => {
            this.hatColor = e.target.value;
            this.updatePreview();
        });
        addListener(`${this.prefix}-gun-color`, 'input', (e) => {
            this.gunColor = e.target.value;
            this.updatePreview();
        });
    }
    
    updatePreview() {
        if (!this.canvas || !this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Create temporary character for preview
        const tempChar = new Character(
            CONFIG.HATS[this.hatIndex].type,
            this.outfitColor,
            this.playerNum === 'online' ? 1 : this.playerNum,
            this.hatColor,
            this.gunColor,
            CONFIG.OUTFITS[this.outfitIndex].type,
            CONFIG.GUNS[this.gunIndex].type,
            CONFIG.ACCESSORIES[this.accessoryIndex].type,
            CONFIG.EYES[this.eyeIndex].type,
            CONFIG.BODY_SHAPES[this.bodyShapeIndex].type
        );
        
        tempChar.draw(this.ctx, this.canvas.width / 2, this.canvas.height - 50, null, false, false);
        
        // Update labels safely
        const updateLabel = (id, text) => {
            const element = document.getElementById(id);
            if (element) element.textContent = text;
        };
        
        updateLabel(`${this.prefix}-hat-name`, CONFIG.HATS[this.hatIndex].name);
        updateLabel(`${this.prefix}-outfit-name`, CONFIG.OUTFITS[this.outfitIndex].name);
        updateLabel(`${this.prefix}-gun-name`, CONFIG.GUNS[this.gunIndex].name);
        updateLabel(`${this.prefix}-accessory-name`, CONFIG.ACCESSORIES[this.accessoryIndex].name);
        updateLabel(`${this.prefix}-eye-name`, CONFIG.EYES[this.eyeIndex].name);
        updateLabel(`${this.prefix}-body-name`, CONFIG.BODY_SHAPES[this.bodyShapeIndex].name);
    }
    
    getCharacterConfig() {
        return {
            hat: CONFIG.HATS[this.hatIndex].type,
            outfit: CONFIG.OUTFITS[this.outfitIndex].type,
            gun: CONFIG.GUNS[this.gunIndex].type,
            accessory: CONFIG.ACCESSORIES[this.accessoryIndex].type,
            eye: CONFIG.EYES[this.eyeIndex].type,
            bodyShape: CONFIG.BODY_SHAPES[this.bodyShapeIndex].type,
            outfitColor: this.outfitColor,
            hatColor: this.hatColor,
            gunColor: this.gunColor
        };
    }
}
