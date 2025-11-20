// ELO Rating System
// Standard chess ELO calculation adapted for Gunslinger

class EloCalculator {
    constructor() {
        this.K_FACTOR = 32; // How much ratings change per game (standard is 32)
    }

    /**
     * Calculate expected score for a player
     * @param {number} playerRating - Player's current ELO
     * @param {number} opponentRating - Opponent's current ELO
     * @returns {number} Expected score (0-1)
     */
    getExpectedScore(playerRating, opponentRating) {
        return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    }

    /**
     * Calculate new ELO ratings after a match
     * @param {number} player1Rating - Player 1's current ELO
     * @param {number} player2Rating - Player 2's current ELO
     * @param {number} player1Score - Player 1's score (0-5)
     * @param {number} player2Score - Player 2's score (0-5)
     * @returns {Object} New ratings for both players
     */
    calculateNewRatings(player1Rating, player2Rating, player1Score, player2Score) {
        // Calculate actual score (0 = loss, 0.5 = draw, 1 = win)
        let actualScore1, actualScore2;
        
        if (player1Score > player2Score) {
            actualScore1 = 1;
            actualScore2 = 0;
        } else if (player2Score > player1Score) {
            actualScore1 = 0;
            actualScore2 = 1;
        } else {
            actualScore1 = 0.5;
            actualScore2 = 0.5;
        }

        // Calculate expected scores
        const expectedScore1 = this.getExpectedScore(player1Rating, player2Rating);
        const expectedScore2 = this.getExpectedScore(player2Rating, player1Rating);

        // Calculate new ratings
        const newRating1 = Math.round(player1Rating + this.K_FACTOR * (actualScore1 - expectedScore1));
        const newRating2 = Math.round(player2Rating + this.K_FACTOR * (actualScore2 - expectedScore2));

        // Calculate rating changes
        const change1 = newRating1 - player1Rating;
        const change2 = newRating2 - player2Rating;

        return {
            player1: {
                oldRating: player1Rating,
                newRating: newRating1,
                change: change1
            },
            player2: {
                oldRating: player2Rating,
                newRating: newRating2,
                change: change2
            }
        };
    }

    /**
     * Format rating change for display
     * @param {number} change - Rating change amount
     * @returns {string} Formatted string with + or -
     */
    formatChange(change) {
        if (change > 0) {
            return `+${change}`;
        }
        return `${change}`;
    }
}

// Export singleton
const eloCalculator = new EloCalculator();
