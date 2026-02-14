// ========== GAME STATE ==========
const gameState = {
    pin: ['', '', '', '', '', ''],
    currentDigit: 0,
    questions: [],
    currentQuestion: 0,
    currentPlayer: 1,
    scores: [0, 0],
    targetScore: 21, // Blackjack-style target
    roundScores: [0, 0], // Current round accumulation
    selectedAnswer: null,
    answered: false,
    powerupUsed: false,
    canUsePowerup: false,
    coins: 0,
    riskMode: false,
    roundHistory: []
};

// ========== SAMPLE QUESTIONS (Replace with your actual questions) ==========
const sampleQuestions = [
    {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correct: 2,
        points: 10,
        explanation: "Paris has been the capital of France since the 12th century."
    },
    {
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correct: 1,
        points: 10,
        explanation: "Mars appears reddish due to iron oxide (rust) on its surface."
    },
    {
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correct: 1,
        points: 10,
        explanation: "Basic arithmetic: 2 + 2 = 4."
    },
    {
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        correct: 1,
        points: 10,
        explanation: "Shakespeare wrote this famous tragedy around 1597."
    },
    {
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic", "Indian", "Pacific", "Arctic"],
        correct: 2,
        points: 10,
        explanation: "The Pacific Ocean covers about 30% of Earth's surface."
    }
];

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Set year display
    document.getElementById('year-display').textContent = new Date().getFullYear();
    
    // Event listeners
    document.getElementById('join-game').addEventListener('click', joinGame);
    document.getElementById('pin-input').addEventListener('input', handlePinInput);
    document.getElementById('submit-answer').addEventListener('click', submitAnswer);
    document.getElementById('hit-btn').addEventListener('click', hitMe);
    document.getElementById('stand-btn').addEventListener('click', stand);
    
    // Load questions
    gameState.questions = [...sampleQuestions];
    
    // Initialize display
    updateScores();
    updatePlayerTurn();
});

// ========== PIN ENTRY FUNCTIONS ==========
function handlePinInput(e) {
    const pinInput = e.target.value;
    if (/^\d{0,6}$/.test(pinInput)) {
        document.getElementById('pin-error').textContent = '';
    } else {
        document.getElementById('pin-error').textContent = 'PIN must be 6 digits!';
        e.target.value = e.target.value.slice(0, 6).replace(/\D/g, '');
    }
}

function joinGame() {
    const pin = document.getElementById('pin-input').value;
    if (pin.length !== 6) {
        document.getElementById('pin-error').textContent = 'Please enter a 6-digit PIN!';
        return;
    }
    
    // Hide PIN section, show game section
    document.getElementById('pin-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'block';
    
    // Load first question
    loadQuestion();
    
    // Show celebration
    showCelebration('🎉 Game Started! Good Luck! 🎉', 'success');
}

// ========== QUESTION FUNCTIONS ==========
function loadQuestion() {
    if (gameState.currentQuestion >= gameState.questions.length) {
        endGame();
        return;
    }
    
    gameState.answered = false;
    gameState.selectedAnswer = null;
    document.getElementById('submit-answer').disabled = false;
    
    const question = gameState.questions[gameState.currentQuestion];
    const questionNumber = gameState.currentQuestion + 1;
    
    // Update question display
    document.querySelector('.question-number').textContent = `Question ${questionNumber}`;
    document.querySelector('.points-badge').textContent = `+${question.points} pts`;
    document.getElementById('question-text').textContent = question.question;
    
    // Clear previous options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Add options
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.innerHTML = `<strong>${String.fromCharCode(65 + index)})</strong> ${option}`;
        optionDiv.dataset.index = index;
        optionDiv.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionDiv);
    });
    
    // Hide feedback and treasure
    document.getElementById('answer-feedback').style.display = 'none';
    document.getElementById('treasure-section').style.display = 'none';
    document.getElementById('blackjack-controls').style.display = 'none';
    
    // Clear previous answer states
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // Update risk warning
    updateRiskWarning();
}

function selectOption(index) {
    if (gameState.answered) return;
    
    // Remove selection from other options
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Add selection to clicked option
    const selectedOption = document.querySelector(`.option[data-index="${index}"]`);
    selectedOption.classList.add('selected');
    gameState.selectedAnswer = index;
}

// ========== ANSWER SUBMISSION ==========
function submitAnswer() {
    if (gameState.answered || gameState.selectedAnswer === null) return;
    gameState.answered = true;
    
    const question = gameState.questions[gameState.currentQuestion];
    const isCorrect = gameState.selectedAnswer === question.correct;
    const basePoints = question.points || 10;
    
    // Disable submit
    document.getElementById('submit-answer').disabled = true;
    
    // Mark answers
    document.querySelectorAll('.option').forEach((opt, index) => {
        if (index === question.correct) {
            opt.classList.add('correct');
            createCoinExplosion(opt.getBoundingClientRect());
        } else if (index === gameState.selectedAnswer && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });
    
    // Process answer
    if (isCorrect) {
        let points = basePoints;
        
        // Add to round score (blackjack style)
        const playerIdx = gameState.currentPlayer - 1;
        gameState.roundScores[playerIdx] += points;
        
        // Check for bust
        if (gameState.roundScores[playerIdx] > gameState.targetScore) {
            bust(playerIdx);
            return;
        }
        
        // Show celebration
        showCelebration(`✅ Correct! +${points} this round!`, 'success');
        
        // Show blackjack controls
        document.getElementById('blackjack-controls').style.display = 'flex';
        document.getElementById('current-round-total').textContent = gameState.roundScores[playerIdx];
        
        // Update risk warning
        updateRiskWarning();
        
        // Show treasure
        gameState.coins += 5;
        document.getElementById('coin-count').textContent = gameState.coins;
        document.getElementById('treasure-section').style.display = 'block';
        
        let feedback = `
            <div class="feedback-correct">
                <span>🧧</span>
                <div>
                    <h3>恭喜发财! +${points} points</h3>
                    <p><strong>Round Total:</strong> ${gameState.roundScores[playerIdx]}/21</p>
                    ${question.explanation ? `<p><strong>Explanation:</strong> ${question.explanation}</p>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('answer-feedback').innerHTML = feedback;
        document.getElementById('answer-feedback').style.display = 'block';
        
    } else {
        // Wrong answer - lose turn
        const correctLetter = String.fromCharCode(65 + question.correct);
        const correctText = question.options[question.correct];
        
        showCelebration('❌ Wrong answer! Turn lost!', 'danger');
        
        let feedback = `
            <div class="feedback-incorrect">
                <span>❌</span>
                <div>
                    <h3>Incorrect Answer</h3>
                    <p><strong>Correct:</strong> ${correctLetter}) ${correctText}</p>
                    ${question.explanation ? `<p><strong>Explanation:</strong> ${question.explanation}</p>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('answer-feedback').innerHTML = feedback;
        document.getElementById('answer-feedback').style.display = 'block';
        
        // Switch player
        setTimeout(() => {
            gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
            updatePlayerTurn();
            gameState.currentQuestion++;
            loadQuestion();
        }, 2000);
    }
}

// ========== BLACKJACK FUNCTIONS ==========
function hitMe() {
    const playerIdx = gameState.currentPlayer - 1;
    const currentRoundTotal = gameState.roundScores[playerIdx];
    
    if (currentRoundTotal >= 18) {
        showCelebration('⚠️ Very risky! Are you sure?', 'warning');
    }
    
    // Continue to next question with risk multiplier
    gameState.currentQuestion++;
    document.getElementById('blackjack-controls').style.display = 'none';
    loadQuestion();
    
    showCelebration('🔥 HIT! Next question loaded!', 'warning');
}

function stand() {
    // End round, bank current points
    const playerIdx = gameState.currentPlayer - 1;
    const roundPoints = gameState.roundScores[playerIdx];
    
    gameState.scores[playerIdx] += roundPoints;
    updateScores();
    
    showCelebration(
        `✅ STAND! Banking ${roundPoints} points!`, 
        'success'
    );
    
    // Reset round score
    gameState.roundScores[playerIdx] = 0;
    
    // Switch player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    updatePlayerTurn();
    updateRoundDisplay();
    
    // Load next question
    setTimeout(() => {
        gameState.currentQuestion++;
        loadQuestion();
    }, 1500);
}

function bust(playerIdx) {
    // Player loses all round points
    const lostPoints = gameState.roundScores[playerIdx];
    showCelebration(`💥 BUST! Lost ${lostPoints} points!`, 'danger');
    
    // Reset round score
    gameState.roundScores[playerIdx] = 0;
    updateRoundDisplay();
    
    // Switch player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    updatePlayerTurn();
    
    // Load next question
    setTimeout(() => {
        gameState.currentQuestion++;
        loadQuestion();
    }, 2000);
}

function updateRiskWarning() {
    const playerIdx = gameState.currentPlayer - 1;
    const currentScore = gameState.roundScores[playerIdx];
    const warningEl = document.getElementById('risk-warning');
    
    if (currentScore > 18) {
        warningEl.style.display = 'inline';
    } else {
        warningEl.style.display = 'none';
    }
}

// ========== DISPLAY UPDATES ==========
function updateScores() {
    document.getElementById('score1').textContent = gameState.scores[0];
    document.getElementById('score2').textContent = gameState.scores[1];
    updateRoundDisplay();
}

function updateRoundDisplay() {
    document.getElementById('round-score1').textContent = gameState.roundScores[0];
    document.getElementById('round-score2').textContent = gameState.roundScores[1];
}

function updatePlayerTurn() {
    const playerTurnEl = document.getElementById('current-player');
    playerTurnEl.textContent = `Player ${gameState.currentPlayer}'s Turn`;
    
    // Update player card highlighting (optional)
}

// ========== CELEBRATION EFFECTS ==========
function showCelebration(message, type = 'success') {
    const celebrationArea = document.getElementById('celebration-area');
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.textContent = message;
    
    // Add color based on type
    if (type === 'success') {
        celebration.style.background = 'linear-gradient(135deg, #38a169, #2f855a)';
    } else if (type === 'danger') {
        celebration.style.background = 'linear-gradient(135deg, #e53e3e, #c53030)';
    } else if (type === 'warning') {
        celebration.style.background = 'linear-gradient(135deg, #dd6b20, #c05621)';
    }
    
    celebrationArea.appendChild(celebration);
    
    // Remove after animation
    setTimeout(() => {
        celebration.remove();
    }, 3000);
}

// ========== COIN EFFECTS ==========
function createCoinExplosion(rect) {
    const coinsContainer = document.getElementById('coins-container');
    
    // Create multiple coins
    for (let i = 0; i < 10; i++) {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.textContent = '💰';
        
        // Random position around the element
        const x = rect.left + rect.width/2 + (Math.random() - 0.5) * 100;
        const y = rect.top + rect.height/2 + (Math.random() - 0.5) * 50;
        
        coin.style.left = `${x}px`;
        coin.style.top = `${y}px`;
        
        coinsContainer.appendChild(coin);
        
        // Remove after animation
        setTimeout(() => {
            coin.remove();
        }, 3000);
    }
}

// ========== END GAME ==========
function endGame() {
    const winner = gameState.scores[0] > gameState.scores[1] ? 1 : 2;
    const winnerScore = Math.max(gameState.scores[0], gameState.scores[1]);
    
    showCelebration(`🏆 Game Over! Player ${winner} Wins with ${winnerScore} points! 🏆`, 'success');
    
    // Reset game after delay
    setTimeout(() => {
        if (confirm('Play again?')) {
            resetGame();
        }
    }, 3000);
}

function resetGame() {
    gameState.scores = [0, 0];
    gameState.roundScores = [0, 0];
    gameState.currentQuestion = 0;
    gameState.currentPlayer = 1;
    gameState.coins = 0;
    
    updateScores();
    updatePlayerTurn();
    loadQuestion();
}