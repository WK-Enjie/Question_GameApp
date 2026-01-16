// ========== GAME STATE ==========
const gameState = {
    pin: ['', '', '', '', '', ''],
    currentDigit: 0,
    questions: [],
    currentQuestion: 0,
    currentPlayer: 1,
    scores: [0, 0],
    selectedAnswer: null,
    answered: false,
    powerupUsed: false,
    canUsePowerup: false
};

// ========== POWER-UPS ==========
const powerUps = [
    { icon: '⚡', name: 'Double Points', type: 'double' },
    { icon: '➗', name: 'Half Points', type: 'half' },
    { icon: '➖', name: 'Negative Points', type: 'negative' },
    { icon: '🔄', name: 'Switch Scores', type: 'switch' },
    { icon: '✨', name: 'Bonus +10', type: 'bonus' }
];

// ========== SCREEN MANAGEMENT ==========
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ========== PIN FUNCTIONS ==========
function updatePinDisplay() {
    const digits = ['digit1', 'digit2', 'digit3', 'digit4', 'digit5', 'digit6'];
    digits.forEach((id, index) => {
        const digit = document.getElementById(id);
        digit.textContent = gameState.pin[index] || '_';
    });
}

function addDigit(digit) {
    if (gameState.currentDigit < 6) {
        gameState.pin[gameState.currentDigit] = digit;
        updatePinDisplay();
        gameState.currentDigit++;
    }
}

function clearPin() {
    gameState.pin = ['', '', '', '', '', ''];
    gameState.currentDigit = 0;
    updatePinDisplay();
}

// ========== LOAD QUIZ FUNCTION ==========
async function submitPin() {
    const code = gameState.pin.join('');
    
    if (code.length !== 6) {
        alert('Please enter all 6 digits');
        return;
    }
    
    showScreen('loading-screen');
    document.getElementById('loading-text').textContent = `Loading quiz ${code}...`;
    
    try {
        // Determine folder based on first digit
        let folder = '';
        const firstDigit = code[0];
        
        if (firstDigit === '1') {
            folder = 'primary/';
        } else if (firstDigit === '2') {
            folder = 'lower-secondary/';
        } else if (firstDigit === '3') {
            folder = 'upper-secondary/';
        } else {
            throw new Error('Invalid first digit. Must be 1, 2, or 3');
        }
        
        // Determine subject based on second digit
        let subjectFolder = '';
        const secondDigit = code[1];
        
        if (secondDigit === '0') {
            subjectFolder = 'math/';
        } else if (secondDigit === '1') {
            subjectFolder = 'science/';
        } else if (secondDigit === '4') {
            subjectFolder = 'combined-chem/';
        } else if (secondDigit === '2') {
            subjectFolder = 'physics/';
        } else {
            throw new Error('Invalid second digit. Must be 0, 1, 2, or 4');
        }
        
        // Construct filepath
        const filepath = `Questions/${folder}${subjectFolder}${code}.json`;
        console.log('📂 Looking for:', filepath);
        
        const response = await fetch(filepath);
        
        if (!response.ok) {
            throw new Error(`File not found at: ${filepath}`);
        }
        
        const quizData = await response.json();
        console.log('✅ Successfully loaded quiz');
        
        // Store questions
        gameState.questions = Array.isArray(quizData.questions) ? quizData.questions : quizData;
        if (gameState.questions.length === 0) {
            throw new Error('Quiz file is empty');
        }
        
        // Update UI
        document.getElementById('quiz-title').textContent = quizData.title || `Quiz ${code}`;
        document.getElementById('quiz-topic').textContent = 
            `${quizData.grade || ''} ${quizData.subject || ''}`;
        if (quizData.topic) {
            document.getElementById('quiz-topic').textContent += ` | ${quizData.topic}`;
        }
        
        // Initialize game
        initGame();
        showScreen('game-screen');
        
    } catch (error) {
        console.error('Failed to load quiz:', error);
        document.getElementById('loading-text').textContent = `Error loading quiz`;
        
        setTimeout(() => {
            document.getElementById('error-message').innerHTML = 
                `<strong>Worksheet ${code} not found</strong><br><br>
                 <div style="color: #a0aec0; font-size: 0.9rem;">
                 Please check if the file exists in the correct folder.<br>
                 Only enter valid 6-digit codes.<br><br>
                 Example: <strong>342091</strong> for Combined Chemistry</div>`;
            showScreen('error-screen');
        }, 1500);
    }
}

// ========== GAME FUNCTIONS ==========
function initGame() {
    gameState.currentQuestion = 0;
    gameState.currentPlayer = 1;
    gameState.scores = [0, 0];
    gameState.selectedAnswer = null;
    gameState.answered = false;
    gameState.powerupUsed = false;
    gameState.canUsePowerup = false;
    
    updateScores();
    updatePlayerTurn();
    loadQuestion();
    
    document.getElementById('game-over').style.display = 'none';
}

function loadQuestion() {
    if (gameState.currentQuestion >= gameState.questions.length) {
        endGame();
        return;
    }
    
    const question = gameState.questions[gameState.currentQuestion];
    
    // Update UI
    document.getElementById('current-q').textContent = gameState.currentQuestion + 1;
    document.getElementById('total-q').textContent = gameState.questions.length;
    document.getElementById('question').textContent = question.question;
    document.getElementById('points').textContent = question.points || 10;
    
    // Update scores
    updateScores();
    
    // Update active player
    updatePlayerTurn();

    // Clear options
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('powerup-result').innerHTML = '';
    
    // Hide treasure section
    const treasureSection = document.querySelector('.treasure-section');
    treasureSection.style.display = 'none';
    
    // Reset treasure boxes
    resetTreasureBoxes();

    // Add options
    if (question.options && Array.isArray(question.options)) {
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = `${String.fromCharCode(65 + index)}) ${option}`;
            optionElement.dataset.index = index;
            
            optionElement.addEventListener('click', function() {
                if (gameState.answered) return;
                
                // Clear previous selection
                document.querySelectorAll('.option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Select this option
                this.classList.add('selected');
                gameState.selectedAnswer = index;
                document.getElementById('submit-answer').disabled = false;
            });
            
            optionsDiv.appendChild(optionElement);
        });
    }

    // Reset submit button
    document.getElementById('submit-answer').disabled = true;
    document.getElementById('submit-answer').style.display = 'flex';
    gameState.answered = false;
    gameState.selectedAnswer = null;
    gameState.powerupUsed = false;
    gameState.canUsePowerup = false;
}

function resetTreasureBoxes() {
    const treasureBoxes = document.querySelectorAll('.treasure-box');
    
    treasureBoxes.forEach((box, index) => {
        // Reset to original state
        box.className = 'treasure-box';
        box.textContent = '🎁';
        box.style.background = 'linear-gradient(135deg, #fbbf24, #d97706)';
        box.style.opacity = '1';
        box.style.transform = 'scale(1)';
        box.style.cursor = 'pointer';
        box.style.pointerEvents = 'auto';
        
        // Remove existing event listeners
        const newBox = box.cloneNode(true);
        box.parentNode.replaceChild(newBox, box);
    });
    
    // Add fresh event listeners
    document.querySelectorAll('.treasure-box').forEach((box, index) => {
        box.addEventListener('click', function() {
            if (!gameState.canUsePowerup || gameState.powerupUsed) return;
            openTreasureBox(this.dataset.box);
        });
    });
}

function checkAnswer() {
    if (gameState.answered || gameState.selectedAnswer === null) return;
    
    gameState.answered = true;
    const submitBtn = document.getElementById('submit-answer');
    submitBtn.disabled = true;
    
    const question = gameState.questions[gameState.currentQuestion];
    const isCorrect = gameState.selectedAnswer === question.correct;
    gameState.canUsePowerup = isCorrect;
    
    // Mark correct/incorrect answers
    const options = document.querySelectorAll('.option');
    options.forEach((opt, index) => {
        if (index === question.correct) {
            opt.classList.add('correct');
        } else if (index === gameState.selectedAnswer && !isCorrect) {
            opt.classList.add('incorrect');
        }
        opt.style.pointerEvents = 'none';
    });
    
    // Update score if correct
    if (isCorrect) {
        const points = question.points || 10;
        gameState.scores[gameState.currentPlayer - 1] += points;
        updateScores();
        
        let feedback = `<div style="color: #48bb78; font-weight: bold; margin-bottom: 15px; font-size: 1.2rem;">
            ✅ Correct! +${points} points
        </div>`;
        
        if (question.explanation) {
            feedback += `<div style="color: #a0aec0; font-size: 1.1rem; line-height: 1.5;">
                <strong>Explanation:</strong> ${question.explanation}
            </div>`;
        }
        
        document.getElementById('feedback').innerHTML = feedback;
        
        // Show treasure boxes
        document.querySelector('.treasure-section').style.display = 'block';
        
        // Enable treasure boxes
        document.querySelectorAll('.treasure-box').forEach(box => {
            box.style.pointerEvents = 'auto';
            box.style.opacity = '1';
        });
        
    } else {
        let feedback = `<div style="color: #f56565; font-weight: bold; margin-bottom: 15px; font-size: 1.2rem;">
            ❌ Incorrect! No points
        </div>
        <div style="color: #48bb78; margin-bottom: 15px; font-size: 1.1rem;">
            <strong>Correct answer:</strong> ${String.fromCharCode(65 + question.correct)}) ${question.options[question.correct]}
        </div>`;
        
        if (question.explanation) {
            feedback += `<div style="color: #a0aec0; font-size: 1.1rem; line-height: 1.5;">
                <strong>Explanation:</strong> ${question.explanation}
            </div>`;
        }
        
        document.getElementById('feedback').innerHTML = feedback;
        
        // Disable treasure boxes for wrong answers
        document.querySelectorAll('.treasure-box').forEach(box => {
            box.classList.add('disabled');
        });
        
        // Switch player for next question
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        updatePlayerTurn();
        
        // Show next button immediately
        document.getElementById('next-btn').style.display = 'flex';
    }
}

function openTreasureBox(boxNum) {
    if (!gameState.canUsePowerup || gameState.powerupUsed) return;
    
    gameState.powerupUsed = true;
    
    // Disable all treasure boxes
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.classList.add('disabled');
        box.style.pointerEvents = 'none';
        box.style.opacity = '0.6';
    });
    
    // Random power-up
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    // Update selected box
    const selectedBox = document.querySelector(`.treasure-box[data-box="${boxNum}"]`);
    if (selectedBox) {
        selectedBox.textContent = powerUp.icon;
        selectedBox.classList.add(`powerup-${powerUp.type}`);
        
        // Show power-up name
        document.getElementById('powerup-result').innerHTML = 
            `<div style="color: #fbbf24; font-weight: bold; font-size: 1.1rem;">
                ${powerUp.icon} ${powerUp.name} Activated!
            </div>`;
        
        // Apply power-up effect
        applyPowerUp(powerUp.type);
        
        // Show next button
        document.getElementById('next-btn').style.display = 'flex';
    }
}

function applyPowerUp(type) {
    const playerIndex = gameState.currentPlayer - 1;
    const otherIndex = playerIndex === 0 ? 1 : 0;
    const question = gameState.questions[gameState.currentQuestion];
    const basePoints = question.points || 10;
    
    let message = '';
    
    switch(type) {
        case 'double':
            const doublePoints = basePoints * 2;
            gameState.scores[playerIndex] += doublePoints;
            message = `⚡ Double points! +${doublePoints}`;
            break;
            
        case 'half':
            const halfPoints = Math.floor(basePoints / 2);
            gameState.scores[playerIndex] += halfPoints;
            message = `➗ Half points! +${halfPoints}`;
            break;
            
        case 'negative':
            gameState.scores[playerIndex] -= basePoints;
            if (gameState.scores[playerIndex] < 0) gameState.scores[playerIndex] = 0;
            message = `➖ Negative points! -${basePoints}`;
            break;
            
        case 'switch':
            const temp = gameState.scores[playerIndex];
            gameState.scores[playerIndex] = gameState.scores[otherIndex];
            gameState.scores[otherIndex] = temp;
            message = `🔄 Scores switched!`;
            break;
            
        case 'bonus':
            gameState.scores[playerIndex] += 10;
            message = `✨ Bonus +10 points!`;
            break;
    }
    
    updateScores();
    
    // Add message to feedback
    const feedbackDiv = document.getElementById('feedback');
    feedbackDiv.innerHTML += `<div style="color: #fbbf24; margin-top: 15px; font-weight: bold;">🎁 ${message}</div>`;
}

function updateScores() {
    document.getElementById('score1').textContent = gameState.scores[0];
    document.getElementById('score2').textContent = gameState.scores[1];
    document.getElementById('final-score1').textContent = gameState.scores[0];
    document.getElementById('final-score2').textContent = gameState.scores[1];
}

function updatePlayerTurn() {
    const player1 = document.getElementById('player1');
    const player2 = document.getElementById('player2');
    
    if (gameState.currentPlayer === 1) {
        player1.classList.add('active');
        player2.classList.remove('active');
    } else {
        player1.classList.remove('active');
        player2.classList.add('active');
    }
}

function nextQuestion() {
    gameState.currentQuestion++;
    
    // Switch player for next question
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    
    loadQuestion();
}

function endGame() {
    // Determine winner
    let winnerMessage = '';
    
    if (gameState.scores[0] > gameState.scores[1]) {
        winnerMessage = 'Player 1 Wins! 🏆';
    } else if (gameState.scores[1] > gameState.scores[0]) {
        winnerMessage = 'Player 2 Wins! 🏆';
    } else {
        winnerMessage = "It's a Tie! 🤝";
    }
    
    // Update game over screen
    document.getElementById('winner').textContent = winnerMessage;
    
    // Show game over screen
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('submit-answer').style.display = 'none';
    document.querySelector('.treasure-section').style.display = 'none';
}

// ========== INITIALIZATION ==========
function initializeGame() {
    console.log('🚀 Initializing Quiz Game...');
    
    // Initialize PIN display
    updatePinDisplay();
    
    // Setup keypad buttons
    document.querySelectorAll('.keypad-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addDigit(btn.getAttribute('data-digit'));
        });
    });
    
    // Clear button
    document.getElementById('clear-btn').addEventListener('click', clearPin);
    
    // Submit PIN button
    document.getElementById('submit-pin-btn').addEventListener('click', submitPin);
    
    // Home button
    document.getElementById('home-btn').addEventListener('click', () => {
        showScreen('pin-screen');
        clearPin();
    });
    
    // Submit answer button
    document.getElementById('submit-answer').addEventListener('click', checkAnswer);
    
    // Next button
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    
    // Restart game
    const restartBtn = document.getElementById('restart-game');
    if (restartBtn) {
        restartBtn.addEventListener('click', initGame);
    }
    
    // New chapter
    const newChapterBtn = document.getElementById('new-chapter');
    if (newChapterBtn) {
        newChapterBtn.addEventListener('click', () => {
            showScreen('pin-screen');
            clearPin();
        });
    }
    
    // Error buttons
    document.getElementById('retry-btn').addEventListener('click', submitPin);
    document.getElementById('back-btn').addEventListener('click', () => {
        showScreen('pin-screen');
        clearPin();
    });
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('pin-screen').classList.contains('active')) {
            if (e.key >= '0' && e.key <= '9') {
                addDigit(e.key);
            } else if (e.key === 'Backspace') {
                clearPin();
            } else if (e.key === 'Enter') {
                submitPin();
            }
        }
    });
    
    console.log('✅ Quiz Game Ready!');
    console.log('💡 Enter 342091 and click GO to test Combined Chemistry');
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}