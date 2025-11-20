class Character {
    constructor(hat, color, playerNum, hatColor, gunColor, outfit, gunType, accessory, eyeType, bodyShape) {
        this.hat = hat;
        this.color = color;
        this.playerNum = playerNum;
        this.score = 0;
        this.hatColor = hatColor || '#654321';
        this.gunColor = gunColor || '#2c2c2c';
        this.outfit = outfit || 'plain';
        this.gunType = gunType || 'revolver';
        this.accessory = accessory || 'none';
        this.eyeType = eyeType || 'normal';
        this.bodyShape = bodyShape || 'normal';
        this.username = null; // For online mode
        
        // Animation state
        this.animationState = 'idle'; // idle, shooting, dead
        this.animationFrame = 0;
        this.armAngle = 0;
        this.fallRotation = 0;
    }

    draw(ctx, x, y, reactionTime = null, isWinner = false, showTime = false) {
        ctx.save();
        
        if (this.animationState === 'dead') {
            this.drawDead(ctx, x, y);
        } else {
            this.drawAlive(ctx, x, y, isWinner);
        }
        
        // Display username above character (if set)
        if (this.username) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Courier New';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(this.username, x, y - 150);
            ctx.fillText(this.username, x, y - 150);
        }
        
        // Display reaction time or dash
        if (showTime) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Courier New';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            
            const displayText = reactionTime !== null ? `${reactionTime}ms` : '-';
            const yOffset = this.username ? -130 : -130;
            ctx.strokeText(displayText, x, y + yOffset);
            ctx.fillText(displayText, x, y + yOffset);
        }
        
        ctx.restore();
    }

    drawAlive(ctx, x, y, isWinner) {
        const facing = this.playerNum === 1 ? 1 : -1;
        
        // Get body dimensions based on shape
        const bodyDims = this.getBodyDimensions();
        
        // Legs
        ctx.strokeStyle = '#2c1810';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x - 12, y + bodyDims.legLength);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x + 12, y + bodyDims.legLength);
        ctx.stroke();
        
        // Boots
        ctx.fillStyle = '#654321';
        ctx.fillRect(x - 18, y + bodyDims.legLength, 12, 8);
        ctx.fillRect(x + 6, y + bodyDims.legLength, 12, 8);
        
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(x - bodyDims.bodyWidth/2, y - bodyDims.bodyHeight, bodyDims.bodyWidth, bodyDims.bodyHeight);
        
        // Outfit details
        this.drawOutfit(ctx, x, y, bodyDims);
        
        // Arms
        const shootingArm = isWinner && this.animationState === 'shooting';
        this.drawArms(ctx, x, y, facing, shootingArm, bodyDims);
        
        // Gun
        if (shootingArm) {
            this.drawGun(ctx, x + (facing * 35), y - 45, facing, true);
        } else {
            this.drawGun(ctx, x + (facing * 25), y - 20, facing, false);
        }
        
        // Head
        const headY = y - bodyDims.bodyHeight - 10;
        ctx.fillStyle = '#f4c2a0';
        ctx.beginPath();
        ctx.arc(x, headY, bodyDims.headSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        this.drawEyes(ctx, x, headY);
        
        // Hat (positioned relative to head)
        this.drawHat(ctx, x, headY - bodyDims.headSize);
    }
    
    getBodyDimensions() {
        switch(this.bodyShape) {
            case 'slim':
                return { bodyWidth: 32, bodyHeight: 65, headSize: 20, legLength: 35 };
            case 'bulky':
                return { bodyWidth: 56, bodyHeight: 70, headSize: 24, legLength: 30 };
            case 'tall':
                return { bodyWidth: 40, bodyHeight: 80, headSize: 22, legLength: 45 };
            case 'short':
                return { bodyWidth: 48, bodyHeight: 50, headSize: 22, legLength: 25 };
            default: // normal
                return { bodyWidth: 44, bodyHeight: 65, headSize: 22, legLength: 35 };
        }
    }
    
    drawEyes(ctx, x, y) {
        ctx.fillStyle = '#000';
        
        switch(this.eyeType) {
            case 'normal':
                ctx.fillRect(x - 10, y - 3, 5, 3);
                ctx.fillRect(x + 5, y - 3, 5, 3);
                break;
            case 'squint':
                ctx.fillRect(x - 10, y - 2, 5, 2);
                ctx.fillRect(x + 5, y - 2, 5, 2);
                break;
            case 'wide':
                ctx.beginPath();
                ctx.arc(x - 7, y - 2, 4, 0, Math.PI * 2);
                ctx.arc(x + 7, y - 2, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'angry':
                ctx.beginPath();
                ctx.moveTo(x - 12, y - 5);
                ctx.lineTo(x - 5, y - 2);
                ctx.lineTo(x - 5, y);
                ctx.lineTo(x - 12, y - 3);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x + 12, y - 5);
                ctx.lineTo(x + 5, y - 2);
                ctx.lineTo(x + 5, y);
                ctx.lineTo(x + 12, y - 3);
                ctx.fill();
                break;
            case 'dots':
                ctx.beginPath();
                ctx.arc(x - 7, y - 2, 2, 0, Math.PI * 2);
                ctx.arc(x + 7, y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'closed':
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x - 12, y - 2);
                ctx.lineTo(x - 5, y - 2);
                ctx.moveTo(x + 5, y - 2);
                ctx.lineTo(x + 12, y - 2);
                ctx.stroke();
                break;
        }
    }

    drawDead(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y + 10);
        ctx.rotate(Math.PI / 2);
        
        // Body (rotated)
        ctx.fillStyle = this.color;
        ctx.fillRect(-22, -32, 44, 65);
        
        // Head
        ctx.fillStyle = '#f4c2a0';
        ctx.beginPath();
        ctx.arc(0, -50, 22, 0, Math.PI * 2);
        ctx.fill();
        
        // X eyes
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, -53);
        ctx.lineTo(-8, -49);
        ctx.moveTo(-8, -53);
        ctx.lineTo(-12, -49);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, -53);
        ctx.lineTo(12, -49);
        ctx.moveTo(12, -53);
        ctx.lineTo(8, -49);
        ctx.stroke();
        
        // Hat (fallen off)
        ctx.translate(30, -40);
        ctx.rotate(-Math.PI / 4);
        this.drawHat(ctx, 0, 75);
        
        ctx.restore();
    }

    drawOutfit(ctx, x, y, bodyDims) {
        switch(this.outfit) {
            case 'poncho':
                ctx.fillStyle = 'rgba(139, 69, 19, 0.6)';
                ctx.beginPath();
                ctx.moveTo(x - 30, y - 60);
                ctx.lineTo(x - 25, y - 10);
                ctx.lineTo(x + 25, y - 10);
                ctx.lineTo(x + 30, y - 60);
                ctx.closePath();
                ctx.fill();
                break;
            case 'vest':
                ctx.fillStyle = '#654321';
                ctx.fillRect(x - 20, y - 65, 18, 50);
                ctx.fillRect(x + 2, y - 65, 18, 50);
                break;
            case 'leather':
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 3;
                ctx.strokeRect(x - 20, y - 63, 40, 60);
                break;
            case 'uniform':
                ctx.fillStyle = '#1c4587';
                ctx.fillRect(x - 22, y - 65, 44, 30);
                break;
            case 'duster':
                ctx.fillStyle = 'rgba(101, 67, 33, 0.8)';
                ctx.fillRect(x - 24, y - 65, 48, 70);
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 24, y - 65, 48, 70);
                break;
            case 'plain':
                // No additional outfit
                break;
        }
        
        // Draw accessory
        this.drawAccessory(ctx, x, y);
    }
    
    drawAccessory(ctx, x, y) {
        switch(this.accessory) {
            case 'badge':
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(x - 8, y - 45, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = 1;
                ctx.stroke();
                break;
            case 'bandolier':
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(x - 20, y - 60);
                ctx.lineTo(x + 20, y - 10);
                ctx.stroke();
                // Bullets
                for (let i = 0; i < 4; i++) {
                    const bx = x - 15 + i * 10;
                    const by = y - 55 + i * 12;
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(bx, by, 4, 8);
                }
                break;
            case 'scarf':
                ctx.fillStyle = '#c41e3a';
                ctx.fillRect(x - 15, y - 68, 30, 8);
                break;
        }
    }

    drawArms(ctx, x, y, facing, shooting, bodyDims) {
        const bw = bodyDims.bodyWidth;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        
        // Left arm (non-shooting)
        ctx.beginPath();
        ctx.moveTo(x - bw/2, y - 55);
        ctx.lineTo(x - bw/2 - 15, y - 35);
        ctx.stroke();
        
        // Right arm (shooting arm)
        ctx.beginPath();
        ctx.moveTo(x + bw/2, y - 55);
        if (shooting) {
            ctx.lineTo(x + (facing * 40), y - 45);
        } else {
            ctx.lineTo(x + bw/2 + 10, y - 25);
        }
        ctx.stroke();
    }

    drawGun(ctx, x, y, facing, raised) {
        ctx.save();
        ctx.translate(x, y);
        if (facing === -1) {
            ctx.scale(-1, 1);
        }
        
        // Gun body
        ctx.fillStyle = this.gunColor;
        ctx.fillRect(0, -3, 25, 6);
        
        // Barrel
        ctx.fillRect(25, -2, 15, 4);
        
        // Handle
        ctx.fillRect(-5, 0, 8, 12);
        
        // Hammer
        ctx.fillStyle = '#555';
        ctx.fillRect(5, -6, 4, 4);
        
        // Gun type variations
        if (this.gunType === 'revolver') {
            ctx.beginPath();
            ctx.arc(12, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.gunType === 'rifle') {
            ctx.fillRect(25, -2, 30, 4);
            ctx.fillRect(10, -8, 8, 16);
        }
        
        // Muzzle flash
        if (raised && this.animationFrame < 10) {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.moveTo(40, 0);
            ctx.lineTo(50, -8);
            ctx.lineTo(55, 0);
            ctx.lineTo(50, 8);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }

    drawHat(ctx, x, y) {
        if (this.hat === 'none') return;
        
        ctx.fillStyle = this.hatColor;
        
        // y is now the top of the head, draw hats relative to that
        switch(this.hat) {
            case 'cowboy':
                ctx.fillRect(x - 30, y, 60, 8);
                ctx.fillRect(x - 18, y - 20, 36, 20);
                ctx.fillStyle = this.hatColor;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(x - 15, y - 18, 30, 5);
                ctx.globalAlpha = 1;
                break;
            case 'sheriff':
                ctx.fillRect(x - 28, y, 56, 6);
                ctx.fillRect(x - 20, y - 15, 40, 15);
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(x, y - 7, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'bandana':
                ctx.fillStyle = this.hatColor;
                ctx.fillRect(x - 22, y + 10, 44, 12);
                ctx.beginPath();
                ctx.arc(x + 20, y + 16, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'ranger':
                ctx.fillRect(x - 26, y, 52, 6);
                ctx.fillRect(x - 18, y - 13, 36, 13);
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(x - 18, y - 1, 36, 3);
                break;
            case 'sombrero':
                ctx.fillRect(x - 40, y, 80, 8);
                ctx.fillRect(x - 20, y - 20, 40, 20);
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 38, y + 2, 76, 4);
                break;
            case 'tophat':
                ctx.fillRect(x - 18, y, 36, 6);
                ctx.fillRect(x - 15, y - 30, 30, 30);
                break;
        }
    }

    startShootAnimation() {
        this.animationState = 'shooting';
        this.animationFrame = 0;
    }

    startDeathAnimation() {
        this.animationState = 'dead';
        this.animationFrame = 0;
    }

    resetAnimation() {
        this.animationState = 'idle';
        this.animationFrame = 0;
    }

    updateAnimation() {
        this.animationFrame++;
    }
}
