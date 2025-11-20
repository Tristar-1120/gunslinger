class GameMap {
    constructor(mapData) {
        this.name = mapData.name;
        this.background = mapData.background;
        this.cue = mapData.cue;
        this.cueText = mapData.cueText;
        this.cueActive = false;
    }

    draw(ctx, width, height) {
        // Background
        ctx.fillStyle = this.background;
        ctx.fillRect(0, 0, width, height);
        
        // Ground
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(0, height - 100, width, 100);
        
        // Visual cue effect
        if (this.cueActive) {
            this.drawCueEffect(ctx, width, height);
        }
        
        // Map name
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(this.name, 10, 20);
    }

    drawCueEffect(ctx, width, height) {
        switch(this.cue) {
            case 'light':
                // Darken screen
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, width, height);
                break;
            case 'bird':
                // Draw bird silhouette
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(width / 2, 50, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(width / 2 - 20, 50, 15, 3);
                ctx.fillRect(width / 2 + 5, 50, 15, 3);
                break;
            case 'bell':
                // Draw bell
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(width / 2, 40, 20, 0, Math.PI, true);
                ctx.fill();
                break;
            case 'wind':
                // Wind lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * 200, 100 + i * 50);
                    ctx.lineTo(i * 200 + 100, 100 + i * 50);
                    ctx.stroke();
                }
                break;
            case 'whistle':
                // Sound waves
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 3;
                for (let i = 1; i <= 3; i++) {
                    ctx.beginPath();
                    ctx.arc(width / 2, height / 2, i * 30, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
        }
    }

    activateCue() {
        this.cueActive = true;
    }

    deactivateCue() {
        this.cueActive = false;
    }
}
