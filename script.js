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
    canUsePowerup: false,
    hiddenWorksheets: []
};

// ========== QUIZ CATALOG ==========
const QUIZ_CATALOG = [
    { code: '201-01-1', filename: '201011.json', folder: 'lower-secondary/math', name: 'Sec 1 Math Chapter 1' },
    { code: '201-01-2', filename: '201012.json', folder: 'lower-secondary/math', name: 'Sec 1 Math Chapter 1 Worksheet 2' },
    { code: '201-02-1', filename: '201021.json', folder: 'lower-secondary/math', name: 'Sec 1 Math Chapter 2' },
    { code: '344-09-1', filename: '344091.json', folder: 'upper-secondary/combined-chem', name: 'Sec 4 Combined Chemistry Chapter 9' },
    { code: '354-13-1', filename: '354131.json', folder: 'upper-secondary/pure-chem', name: 'Sec 4 Pure Chemistry Chapter 13' }
];

// ========== POWER-UPS ==========
const powerUps = [
    { icon: '⚡', name: 'Double Points', type: 'double' },
    { icon: '➗', name: 'Half Points', type: 'half' },
    { icon: '➖', name: 'Negative Points', type: 'negative' },
    { icon: '🔄', name: 'Switch Scores', type: 'switch' },
    { icon: '✨', name: 'Bonus +10', type: 'bonus' }
];

// ========== PIN FUNCTIONS ==========
function updatePinDisplay() {
    console.log('Updating PIN display:', gameState.pin);
    
    for (let i = 1; i <= 6; i++) {
        const digitElement = document.getElementById(`digit${i}`);
        const digitValue = gameState.pin[i - 1];
        
        if (digitElement) {
            digitElement.textContent = digitValue || '_';
            digitElement.classList.toggle('filled', digitValue !== '');
        }
    }
}

function addDigit(digit) {
    console.log('Adding digit:', digit, 'at position:', gameState.currentDigit);
    
    if (gameState.currentDigit < 6) {
        gameState.pin[gameState.currentDigit] = digit;
        gameState.currentDigit++;
        updatePinDisplay();
    }
}

function removeLastDigit() {
    if (gameState.currentDigit > 0) {
        gameState.currentDigit--;
        gameState.pin[gameState.currentDigit] = '';
        updatePinDisplay();
    }
}

function clearPin() {
    gameState.pin = ['', '', '', '', '', ''];
    gameState.currentDigit = 0;
    updatePinDisplay();
}

// ========== SCREEN MANAGEMENT ==========
function showScreen(screenId) {
    console.log('Showing screen:', screenId);
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

// ========== LOAD QUIZ FUNCTION ==========
async function loadQuizByCode(code) {
    console.log('🔍 Loading quiz:', code);
    
    // Find quiz in catalog
    const quizInfo = QUIZ_CATALOG.find(q => q.code === code);
    
    if (!quizInfo) {
        return { 
            success: false, 
            error: `Quiz code ${code} not found.` 
        };
    }
    
    // Build file path
    const filepath = `Questions/${quizInfo.folder}/${quizInfo.filename}`;
    
    try {
        console.log('Trying to load:', filepath);
        const response = await fetch(filepath);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Quiz loaded successfully');
        
        return { 
            success: true, 
            data: data, 
            info: quizInfo 
        };
        
    } catch (error) {
        console.error('❌ Error loading quiz:', error);
        return { 
            success: false, 
            error: `Failed to load: ${error.message}` 
        };
    }
}

// ========== SUBMIT PIN ==========
async function submitPin() {
    const pin = gameState.pin.join('');
    console.log('Submit PIN called. PIN:', pin);
    
    if (pin.length !== 6) {
        alert('Please enter all 6 digits');
        return;
    }
    
    // Format: 201012 -> 201-01-2
    const formattedPin = `${pin.substring(0,3)}-${pin.substring(3,5)}-${pin.substring(5)}`;
    console.log('Formatted PIN:', formattedPin);
    
    showScreen('loading-screen');
    document.getElementById('loading-message').textContent = `Loading ${formattedPin}...`;
    
    try {
        const result = await loadQuizByCode(formattedPin);
        
        if (!result.success) {
            // Build error message
            let errorMsg = `<strong>Worksheet ${formattedPin} not found</strong><br><br>`;
            errorMsg += `<div style="color: #666; font-size: 0.9rem;">`;
            errorMsg += `Error: ${result.error}</div>`;
            
            // Show available quizzes
            const availableQuizzes = QUIZ_CATALOG.filter(q => 
                !gameState.hiddenWorksheets.includes(q.code)
            );
            
            if (availableQuizzes.length > 0) {
                errorMsg += `<br><strong>Available quizzes:</strong><br>`;
                availableQuizzes.forEach(q => {
                    errorMsg += `<div style="margin: 5px 0;">
                        • <strong>${q.code}</strong>: ${q.name}
                    </div>`;
                });
            }
            
            throw new Error(errorMsg);
        }
        
        // Store questions
        if (result.data.questions && Array.isArray(result.data.questions)) {
            gameState.questions = result.data.questions;
        } else if (Array.isArray(result.data)) {
            gameState.questions = result.data;
        } else {
            throw new Error('Invalid quiz format');
        }
        
        if (gameState.questions.length === 0) {
            throw new Error('Quiz file is empty');
        }
        
        // Set quiz info
        document.getElementById('quiz-title').textContent = result.data.title || result.info.name;
        document.getElementById('quiz-topic').textContent = result.data.subject || 'Mathematics';
        
        // Initialize game
        initGame();
        showScreen('game-screen');
        
    } catch (error) {
        console.error('Failed to load quiz:', error);
        
        setTimeout(() => {
            document.getElementById('error-message').innerHTML = error.message;
            showScreen('error-screen');
        }, 500);
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
    const question = gameState.questions[gameState.currentQuestion];
    
    if (!question) {
        endGame();
        return;
    }
    
    // Update counters
    document.getElementById('current-q').textContent = gameState.currentQuestion + 1;
    document.getElementById('total-q').textContent = gameState.questions.length;
    document.getElementById('question-text').textContent = question.question || "Question";
    
    // Clear and add options
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    if (question.options && question.options.length) {
        question.options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'option';
            optionEl.textContent = `${String.fromCharCode(65 + index)}) ${option}`;
            optionEl.dataset.index = index;
            optionEl.onclick = () => selectOption(index);
            container.appendChild(optionEl);
        });
    }
    
    // Reset UI
    gameState.selectedAnswer = null;
    gameState.answered = false;
    gameState.powerupUsed = false;
    gameState.canUsePowerup = false;
    
    const submitBtn = document.getElementById('submit-answer');
    submitBtn.disabled = true;
    submitBtn.style.display = 'block';
    
    document.getElementById('next-btn').style.display = 'none';
    
    // Hide feedback and treasure
    document.getElementById('answer-feedback').innerHTML = 
        '<div class="feedback-placeholder">Select an answer to continue</div>';
    
    document.getElementById('treasure-section').style.display = 'none';
    
    updateScores();
    updatePlayerTurn();
}

function selectOption(index) {
    if (gameState.answered) return;
    
    // Remove previous selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Select new option
    const options = document.querySelectorAll('.option');
    if (options[index]) {
        options[index].classList.add('selected');
        gameState.selectedAnswer = index;
        
        // Enable submit button
        document.getElementById('submit-answer').disabled = false;
    }
}

function submitAnswer() {
    if (gameState.answered || gameState.selectedAnswer === null) return;
    
    gameState.answered = true;
    const question = gameState.questions[gameState.currentQuestion];
    const isCorrect = gameState.selectedAnswer === question.correct;
    
    // Disable submit
    document.getElementById('submit-answer').disabled = true;
    
    // Mark answers
    document.querySelectorAll('.option').forEach((opt, index) => {
        if (index === question.correct) {
            opt.classList.add('correct');
        } else if (index === gameState.selectedAnswer && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });
    
    // Process answer
    if (isCorrect) {
        const points = question.points || 10;
        gameState.scores[gameState.currentPlayer - 1] += points;
        gameState.canUsePowerup = true;
        
        let feedback = `
            <div class="feedback-correct">
                <span>✅</span>
                <div>
                    <h3>Correct! +${points} points</h3>
                    ${question.explanation ? `<p><strong>Explanation:</strong> ${question.explanation}</p>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('answer-feedback').innerHTML = feedback;
        document.getElementById('treasure-section').style.display = 'block';
        
    } else {
        const correctLetter = String.fromCharCode(65 + question.correct);
        const correctText = question.options[question.correct];
        
        let feedback = `
            <div class="feedback-incorrect">
                <span>❌</span>
                <div>
                    <h3>Incorrect</h3>
                    <p><strong>Correct answer:</strong> ${correctLetter}) ${correctText}</p>
                    ${question.explanation ? `<p><strong>Explanation:</strong> ${question.explanation}</p>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('answer-feedback').innerHTML = feedback;
        
        // Switch player
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        updatePlayerTurn();
    }
    
    // Show next button
    document.getElementById('next-btn').style.display = 'block';
    updateScores();
}

function openTreasureBox(boxNum) {
    if (!gameState.canUsePowerup || gameState.powerupUsed) return;
    
    gameState.powerupUsed = true;
    
    // Random power-up
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    // Update selected box
    const selectedBox = document.querySelector(`[data-box="${boxNum}"]`);
    if (selectedBox) {
        selectedBox.textContent = powerUp.icon;
        selectedBox.classList.add('active');
    }
    
    // Show power-up
    document.getElementById('powerup-result').innerHTML = `
        <div class="powerup-display">
            <div class="powerup-icon">${powerUp.icon}</div>
            <h3>${powerUp.name}</h3>
            <p>Power-up activated!</p>
        </div>
    `;
    
    // Apply effect
    applyPowerUp(powerUp.type);
}

function applyPowerUp(type) {
    const playerIdx = gameState.currentPlayer - 1;
    const otherIdx = playerIdx === 0 ? 1 : 0;
    const question = gameState.questions[gameState.currentQuestion];
    const basePoints = question.points || 10;
    
    let message = '';
    
    switch(type) {
        case 'double':
            const doublePoints = basePoints * 2;
            gameState.scores[playerIdx] += doublePoints;
            message = `Double points! +${doublePoints}`;
            break;
        case 'half':
            const halfPoints = Math.floor(basePoints / 2);
            gameState.scores[playerIdx] += halfPoints;
            message = `Half points! +${halfPoints}`;
            break;
        case 'negative':
            gameState.scores[playerIdx] -= basePoints;
            message = `Negative points! -${basePoints}`;
            break;
        case 'switch':
            [gameState.scores[playerIdx], gameState.scores[otherIdx]] = 
            [gameState.scores[otherIdx], gameState.scores[playerIdx]];
            message = `Scores switched!`;
            break;
        case 'bonus':
            gameState.scores[playerIdx] += 10;
            message = `Bonus +10 points!`;
            break;
    }
    
    updateScores();
    
    // Add message
    const feedbackDiv = document.getElementById('answer-feedback');
    feedbackDiv.innerHTML += `<div class="powerup-message">🎁 ${message}</div>`;
}

function updateScores() {
    document.getElementById('score1').textContent = gameState.scores[0];
    document.getElementById('score2').textContent = gameState.scores[1];
}

function updatePlayerTurn() {
    const player1 = document.getElementById('player1');
    const player2 = document.getElementById('player2');
    
    player1.classList.toggle('active', gameState.currentPlayer === 1);
    player2.classList.toggle('active', gameState.currentPlayer === 2);
}

function nextQuestion() {
    gameState.currentQuestion++;
    
    if (gameState.currentQuestion >= gameState.questions.length) {
        endGame();
        return;
    }
    
    if (gameState.answered) {
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    }
    
    loadQuestion();
}

function endGame() {
    const score1 = gameState.scores[0];
    const score2 = gameState.scores[1];
    
    let winnerMessage = '';
    let winnerName = '';
    
    if (score1 > score2) {
        winnerMessage = 'Player 1 Wins! 🏆';
        winnerName = 'Player 1';
    } else if (score2 > score1) {
        winnerMessage = 'Player 2 Wins! 🏆';
        winnerName = 'Player 2';
    } else {
        winnerMessage = "It's a Tie! 🤝";
        winnerName = 'Both Players';
    }
    
    document.getElementById('winner-message').textContent = winnerMessage;
    document.getElementById('winner-name').textContent = winnerName;
    document.getElementById('final-score1').textContent = score1;
    document.getElementById('final-score2').textContent = score2;
    
    document.getElementById('game-over').style.display = 'block';
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Quiz Game Initialized');
    
    // Initialize PIN display
    updatePinDisplay();
    
    // ========== PIN KEYPAD EVENT LISTENERS ==========
    // Number buttons
    document.querySelectorAll('.key[data-key]').forEach(button => {
        button.addEventListener('click', function() {
            const digit = this.getAttribute('data-key');
            console.log('Number button clicked:', digit);
            addDigit(digit);
        });
    });
    
    // Clear button
    document.getElementById('clear-btn').addEventListener('click', function() {
        console.log('Clear button clicked');
        clearPin();
    });
    
    // Submit button
    document.getElementById('submit-pin').addEventListener('click', function() {
        console.log('Submit button clicked');
        submitPin();
    });
    
    // Game buttons
    document.getElementById('submit-answer').addEventListener('click', submitAnswer);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('home-btn').addEventListener('click', function() {
        clearPin();
        showScreen('pin-screen');
    });
    
    // Error screen buttons
    document.getElementById('retry-btn')?.addEventListener('click', submitPin);
    document.getElementById('back-to-pin-error')?.addEventListener('click', function() {
        clearPin();
        showScreen('pin-screen');
    });
    
    // Game over buttons
    document.getElementById('restart-btn')?.addEventListener('click', initGame);
    document.getElementById('new-chapter-btn')?.addEventListener('click', function() {
        clearPin();
        showScreen('pin-screen');
    });
    
    // Treasure boxes
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.addEventListener('click', function() {
            const boxNum = this.getAttribute('data-box');
            openTreasureBox(boxNum);
        });
    });
    
    // Keyboard support
    document.addEventListener('keydown', function(e) {
        if (document.getElementById('pin-screen').classList.contains('active')) {
            if (e.key >= '0' && e.key <= '9') {
                addDigit(e.key);
            } else if (e.key === 'Backspace') {
                removeLastDigit();
            } else if (e.key === 'Enter') {
                submitPin();
            }
        }
    });
    
    console.log('✅ All event listeners attached');
    console.log('Try clicking number buttons or typing 2 0 1 0 1 2');
});

// ========== DEBUG HELPERS ==========
window.quizTools = {
    test: function() {
        console.log('Testing PIN: 2 0 1 0 1 2');
        const testDigits = ['2', '0', '1', '0', '1', '2'];
        testDigits.forEach((digit, index) => {
            setTimeout(() => {
                addDigit(digit);
            }, index * 200);
        });
        
        setTimeout(() => {
            console.log('Submitting PIN...');
            submitPin();
        }, 1500);
    },
    
    setPin: function(pinString) {
        clearPin();
        pinString.split('').forEach(digit => {
            addDigit(digit);
        });
    },
    
    showState: function() {
        console.log('Current PIN:', gameState.pin);
        console.log('Current digit position:', gameState.currentDigit);
    }
};