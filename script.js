/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
}

.container {
    width: 100%;
    max-width: 500px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    overflow: hidden;
    position: relative;
}

/* Screen Management */
.screen {
    display: none;
    padding: 30px;
    height: 100%;
}

.screen.active {
    display: block;
    animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* PIN Screen */
.header {
    text-align: center;
    margin-bottom: 40px;
}

.header h1 {
    color: #333;
    font-size: 2.5rem;
    margin-bottom: 10px;
}

.header p {
    color: #666;
    font-size: 1.1rem;
}

.pin-display {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 40px 0;
}

.digit {
    width: 50px;
    height: 60px;
    border: 2px solid #ddd;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    color: #333;
    transition: all 0.3s;
}

.digit:not(:empty) {
    border-color: #667eea;
    background: #f0f4ff;
    animation: pulse 0.3s;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

/* Keypad */
.keypad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-top: 40px;
}

.key {
    padding: 20px;
    font-size: 1.5rem;
    border: none;
    border-radius: 10px;
    background: #f5f5f5;
    color: #333;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: bold;
}

.key:hover {
    background: #e0e0e0;
    transform: translateY(-2px);
}

.key:active {
    transform: translateY(0);
}

.key.clear {
    background: #ff6b6b;
    color: white;
}

.key.submit {
    background: #4CAF50;
    color: white;
    grid-column: span 2;
}

/* Quiz Catalog */
.catalog {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.catalog h3 {
    color: #333;
    margin-bottom: 15px;
    font-size: 1.2rem;
}

.quiz-grid {
    display: grid;
    gap: 10px;
    margin-bottom: 15px;
}

.quiz-card {
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
}

.quiz-card:hover {
    border-color: #667eea;
    background: #f0f4ff;
    transform: translateX(5px);
}

.quiz-code {
    font-weight: bold;
    color: #667eea;
    margin-bottom: 5px;
}

.quiz-name {
    color: #333;
    margin-bottom: 5px;
}

.quiz-meta {
    font-size: 0.9rem;
    color: #666;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.catalog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #eee;
}

.btn.small {
    padding: 8px 15px;
    font-size: 0.9rem;
}

.quiz-count {
    font-size: 0.9rem;
    color: #666;
}

/* Loading Screen */
#loading-screen {
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

#loading-message {
    color: #666;
}

/* Error Screen */
#error-screen {
    text-align: center;
}

.error-icon {
    font-size: 4rem;
    color: #ff6b6b;
    margin-bottom: 20px;
}

.error-content {
    background: #fff5f5;
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
    text-align: left;
    max-height: 200px;
    overflow-y: auto;
}

.action-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 30px;
}

/* Game Screen */
.game-header {
    text-align: center;
    margin-bottom: 20px;
}

.game-header h2 {
    color: #333;
    font-size: 1.8rem;
    margin-bottom: 5px;
}

.game-header p {
    color: #666;
    margin-bottom: 15px;
}

.question-counter {
    background: #667eea;
    color: white;
    padding: 8px 20px;
    border-radius: 20px;
    display: inline-block;
    font-weight: bold;
}

/* Players */
.players {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
}

.player {
    flex: 1;
    padding: 15px;
    border: 2px solid #ddd;
    border-radius: 10px;
    text-align: center;
    transition: all 0.3s;
    position: relative;
}

.player.active {
    border-color: #667eea;
    background: #f0f4ff;
}

.player-name {
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
}

.score {
    font-size: 2rem;
    font-weight: bold;
    color: #667eea;
}

.turn-indicator {
    font-size: 0.8rem;
    color: #4CAF50;
    margin-top: 5px;
    height: 20px;
}

/* Question Container */
.question-container {
    background: #f9f9f9;
    padding: 25px;
    border-radius: 15px;
    margin-bottom: 20px;
}

.question-text {
    font-size: 1.3rem;
    color: #333;
    margin-bottom: 25px;
    line-height: 1.5;
}

.options {
    display: grid;
    gap: 10px;
}

.option {
    padding: 15px;
    background: white;
    border: 2px solid #ddd;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 500;
}

.option:hover {
    border-color: #667eea;
    transform: translateX(5px);
}

.option.selected {
    border-color: #667eea;
    background: #f0f4ff;
}

.option.correct {
    border-color: #4CAF50;
    background: #e8f5e9;
    color: #2e7d32;
}

.option.incorrect {
    border-color: #ff6b6b;
    background: #ffebee;
    color: #c62828;
}

/* Game Controls */
.game-controls {
    display: flex;
    gap: 10px;
    margin: 20px 0;
}

.btn {
    flex: 1;
    padding: 15px;
    border: none;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.btn.primary {
    background: #667eea;
    color: white;
}

.btn.primary:hover:not(:disabled) {
    background: #5a67d8;
    transform: translateY(-2px);
}

.btn.primary:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.btn.secondary {
    background: #f5f5f5;
    color: #333;
}

.btn.secondary:hover {
    background: #e0e0e0;
    transform: translateY(-2px);
}

/* Feedback */
.feedback-section {
    margin-top: 20px;
}

.feedback {
    padding: 20px;
    border-radius: 10px;
    background: #f9f9f9;
    margin-bottom: 20px;
}

.feedback-placeholder {
    color: #999;
    text-align: center;
    padding: 20px;
}

.feedback-correct, .feedback-incorrect {
    display: flex;
    gap: 15px;
    align-items: flex-start;
}

.feedback-correct span {
    font-size: 2rem;
    color: #4CAF50;
}

.feedback-incorrect span {
    font-size: 2rem;
    color: #ff6b6b;
}

.powerup-message {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    padding: 10px;
    border-radius: 5px;
    margin-top: 10px;
    text-align: center;
    font-weight: bold;
}

/* Treasure Section */
.treasure-section {
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
    border-radius: 15px;
    margin-top: 20px;
}

.treasure-section h3 {
    color: #333;
    margin-bottom: 20px;
}

.treasure-boxes {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin: 20px 0;
}

.treasure-box {
    width: 80px;
    height: 80px;
    background: #ffd700;
    border: 3px solid #ffa500;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    cursor: pointer;
    transition: all 0.3s;
}

.treasure-box:hover:not(.opened) {
    transform: scale(1.1);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.treasure-box.opened {
    opacity: 0.6;
    cursor: default;
}

.treasure-box.disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.treasure-box.active {
    background: #ffeb3b;
    border-color: #ff9800;
    animation: bounce 0.5s;
}

@keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
}

.powerup-display {
    margin-top: 20px;
    padding: 15px;
    background: white;
    border-radius: 10px;
    display: inline-block;
}

.powerup-icon {
    font-size: 3rem;
    margin-bottom: 10px;
}

/* Game Over */
.game-over {
    text-align: center;
    padding: 30px;
    background: #f9f9f9;
    border-radius: 15px;
    margin-top: 20px;
}

.winner-name {
    font-size: 3rem;
    color: #667eea;
    margin: 20px 0;
    font-weight: bold;
}

.final-scores {
    font-size: 1.2rem;
    color: #666;
    margin: 20px 0;
}

.game-over-btns {
    display: flex;
    gap: 10px;
    margin-top: 30px;
}

/* Responsive */
@media (max-width: 600px) {
    .container {
        border-radius: 10px;
    }
    
    .screen {
        padding: 20px;
    }
    
    .header h1 {
        font-size: 2rem;
    }
    
    .digit {
        width: 40px;
        height: 50px;
        font-size: 1.5rem;
    }
    
    .key {
        padding: 15px;
        font-size: 1.3rem;
    }
    
    .players {
        flex-direction: column;
    }
    
    .game-controls {
        flex-direction: column;
    }
    
    .treasure-boxes {
        flex-direction: column;
        align-items: center;
    }
}