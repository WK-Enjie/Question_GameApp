// Game state
const gameState = {
    currentPlayer: 1,
    playerScores: [0, 0],
    currentQuestion: 0,
    totalQuestions: 0,
    questions: [],
    selectedAnswer: null,
    answerSubmitted: false,
    treasureOpened: false,
    gameOver: false,
    currentPin: '',
    quizTitle: 'Quiz Game',
    quizTopic: 'Topic'
};

// Power-up types
const powerUps = [
    { 
        type: 'double', 
        name: 'Double Points', 
        icon: '⚡',
        description: 'Points doubled!',
        colorClass: 'powerup-double'
    },
    { 
        type: 'halved', 
        name: 'Halved Points', 
        icon: '➗',
        description: 'Points halved!',
        colorClass: 'powerup-halved'
    },
    { 
        type: 'negative', 
        name: 'Negative Points', 
        icon: '➖',
        description: 'Lose points!',
        colorClass: 'powerup-negative'
    },
    { 
        type: 'switch', 
        name: 'Switch Scores', 
        icon: '🔄',
        description: 'Swap scores!',
        colorClass: 'powerup-switch'
    },
    { 
        type: 'bonus', 
        name: 'Bonus Points', 
        icon: '✨',
        description: '+10 bonus points!',
        colorClass: 'powerup-bonus'
    }
];

// DOM Elements
const pinScreen = document.getElementById('pin-screen');
const loadingScreen = document.getElementById('loading-screen');
const gameScreen = document.getElementById('game-screen');
const errorScreen = document.getElementById('error-screen');

// PIN Elements
const pinDigits = [
    document.getElementById('pin-digit-1'),
    document.getElementById('pin-digit-2'),
    document.getElementById('pin-digit-3')
];
const pinButtons = document.querySelectorAll('.pin-btn[data-digit]');
const clearBtn = document.getElementById('clear-btn');
const submitPinBtn = document.getElementById('submit-pin');

// Game Elements
const quizTitle = document.getElementById('quiz-title');
const quizTopic = document.getElementById('quiz-topic');
const backToPinBtn = document.getElementById('back-to-pin');
const player1Card = document.getElementById('player1-card');
const player2Card = document.getElementById('player2-card');
const player1Score = document.getElementById('player1-score');
const player2Score = document.getElementById('player2-score');
const currentQuestionNum = document.getElementById('current-question');
const totalQuestionsElement = document.getElementById('total-questions');
const questionPoints = document.getElementById('question-points');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const submitBtn = document.getElementById('submit-btn');
const answerFeedback = document.getElementById('answer-feedback');
const treasureBoxes = document.getElementById('treasure-boxes');
const powerupResult = document.getElementById('powerup-result');
const nextBtn = document.getElementById('next-btn');
const gameOverScreen = document.getElementById('game-over');
const winnerName = document.getElementById('winner-name');
const finalScore1 = document.getElementById('final-score1');
const finalScore2 = document.getElementById('final-score2');
const restartBtn = document.getElementById('restart-btn');
const newChapterBtn = document.getElementById('new-chapter-btn');

// Error Elements
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const backToPinErrorBtn = document.getElementById('back-to-pin-error');

// Initialize PIN screen
function initPinScreen() {
    gameState.currentPin = '';
    updatePinDisplay();
    
    // Show only PIN screen
    pinScreen.classList.add('active');
    loadingScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    errorScreen.classList.remove('active');
    
    console.log('PIN screen initialized');
}

// Update PIN display
function updatePinDisplay() {
    for (let i = 0; i < 3; i++) {
        if (i < gameState.currentPin.length) {
            pinDigits[i].textContent = gameState.currentPin[i];
            pinDigits[i].style.color = '#4cc9f0';
        } else {
            pinDigits[i].textContent = '_';
            pinDigits[i].style.color = '#4cc9f0';
        }
    }
    console.log('PIN updated:', gameState.currentPin);
}

// Add digit to PIN
function addPinDigit(digit) {
    if (gameState.currentPin.length < 3) {
        gameState.currentPin += digit;
        updatePinDisplay();
    }
}

// Clear PIN
function clearPin() {
    gameState.currentPin = '';
    updatePinDisplay();
}

// Submit PIN and load questions
async function submitPin() {
    if (gameState.currentPin.length !== 3) {
        alert('Please enter a 3-digit code');
        return;
    }
    
    // Determine which folder based on first digit
    const firstDigit = gameState.currentPin[0];
    let folder = '';
    let subject = '';
    
    switch(firstDigit) {
        case '1':
            folder = 'chem/';
            subject = 'Chemistry';
            break;
        case '2':
            folder = 'math/';
            subject = 'Mathematics';
            break;
        default:
            alert('Invalid code. First digit should be 1 or 2');
            clearPin();
            return;
    }
    
    const filename = `Questions/${folder}${gameState.currentPin}.json`;
    console.log('Loading:', filename);
    
    // Show loading screen
    pinScreen.classList.remove('active');
    loadingScreen.classList.add('active');
    gameScreen.classList.remove('active');
    errorScreen.classList.remove('active');
    
    // Update loading message
    document.getElementById('loading-message').textContent = `Loading ${subject} questions...`;
    
    try {
        // Load questions from the categorized folder
        await loadQuestions(filename);
        
        // Initialize game
        initGame();
        
        // Show game screen
        loadingScreen.classList.remove('active');
        gameScreen.classList.add('active');
        
    } catch (error) {
        console.error('Failed to load questions:', error);
        showError(`No question set found for code: ${gameState.currentPin}. Please check the code and try again.`);
    }
}

// Load questions from JSON file
async function loadQuestions(filename) {
    try {
        console.log('Fetching:', filename);
        const response = await fetch(filename);
        
        if (!response.ok) {
            throw new Error(`File not found: ${filename}`);
        }
        
        const data = await response.json();
        
        // Validate the JSON structure
        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error('Invalid question format');
        }
        
        // Validate each question
        data.questions.forEach((question, index) => {
            if (!question.question) {
                throw new Error(`Question ${index + 1} is missing the "question" field`);
            }
            if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
                throw new Error(`Question ${index + 1} must have at least 2 options`);
            }
            if (question.correct === undefined || question.correct < 0 || question.correct >= question.options.length) {
                throw new Error(`Question ${index + 1} has an invalid "correct" index`);
            }
            if (question.points === undefined || question.points < 1) {
                throw new Error(`Question ${index + 1} must have positive "points" value`);
            }
        });
        
        gameState.questions = data.questions;
        gameState.totalQuestions = data.questions.length;
        
        // Set quiz title and topic from JSON
        gameState.quizTitle = data.title || 'Quiz Game';
        gameState.quizTopic = data.topic || 'General Questions';
        
        console.log(`Loaded ${data.questions.length} questions`);
        
    } catch (error) {
        console.error('Error loading questions:', error);
        throw error;
    }
}

// Show error screen
function showError(message) {
    errorMessage.textContent = message;
    loadingScreen.classList.remove('active');
    errorScreen.classList.add('active');
}

// Initialize the game
function initGame() {
    // Reset game state
    gameState.currentPlayer = 1;
    gameState.playerScores = [0, 0];
    gameState.currentQuestion = 0;
    gameState.selectedAnswer = null;
    gameState.answerSubmitted = false;
    gameState.treasureOpened = false;
    gameState.gameOver = false;
    
    // Update UI
    quizTitle.textContent = gameState.quizTitle;
    quizTopic.textContent = gameState.quizTopic;
    totalQuestionsElement.textContent = gameState.totalQuestions;
    updateScores();
    updatePlayerTurn();
    loadQuestion();
    resetTreasureBoxes();
    
    gameOverScreen.style.display = 'none';
    nextBtn.style.display = 'none';
    answerFeedback.textContent = '';
    powerupResult.innerHTML = `
        <div class="powerup-placeholder">
            <i class="fas fa-box-open"></i>
            <p>Answer question first!</p>
        </div>
    `;
}

// Update which player's turn it is
function updatePlayerTurn() {
    if (gameState.currentPlayer === 1) {
        player1Card.classList.add('active');
        player2Card.classList.remove('active');
    } else {
        player1Card.classList.remove('active');
        player2Card.classList.add('active');
    }
}

// Update score display
function updateScores() {
    player1Score.textContent = gameState.playerScores[0];
    player2Score.textContent = gameState.playerScores[1];
}

// Load the current question
function loadQuestion() {
    const question = gameState.questions[gameState.currentQuestion];
    
    currentQuestionNum.textContent = gameState.currentQuestion + 1;
    questionPoints.textContent = question.points;
    questionText.textContent = question.question;
    
    // Clear previous options
    optionsContainer.innerHTML = '';
    
    // Create new options
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.dataset.index = index;
        
        optionElement.addEventListener('click', () => selectOption(index));
        
        optionsContainer.appendChild(optionElement);
    });
    
    // Reset UI state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Answer';
    gameState.selectedAnswer = null;
    gameState.answerSubmitted = false;
    gameState.treasureOpened = false;
    answerFeedback.textContent = '';
    
    // Hide next button and reset treasure boxes
    nextBtn.style.display = 'none';
    resetTreasureBoxes();
}

// Handle option selection
function selectOption(index) {
    if (gameState.answerSubmitted) return;
    
    // Remove selection from all options
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selection to clicked option
    const selectedOption = document.querySelector(`.option[data-index="${index}"]`);
    selectedOption.classList.add('selected');
    gameState.selectedAnswer = index;
    
    // Enable submit button
    submitBtn.disabled = false;
}

// Handle answer submission
function submitAnswer() {
    if (gameState.answerSubmitted || gameState.selectedAnswer === null) return;
    
    // Mark answer as submitted
    gameState.answerSubmitted = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Answer Submitted';
    
    const question = gameState.questions[gameState.currentQuestion];
    const isCorrect = gameState.selectedAnswer === question.correct;
    
    // Show correct/incorrect feedback
    document.querySelectorAll('.option').forEach((option, index) => {
        if (index === question.correct) {
            option.classList.add('correct');
        } else if (index === gameState.selectedAnswer && !isCorrect) {
            option.classList.add('incorrect');
        }
        option.style.pointerEvents = 'none';
    });
    
    // Calculate base points
    let pointsEarned = isCorrect ? question.points : 0;
    
    // Store points for power-up application
    gameState.currentQuestionPoints = pointsEarned;
    gameState.wasCorrect = isCorrect;
    
    // Show feedback
    let feedbackHTML = '';
    if (isCorrect) {
        feedbackHTML = `<span style="color: #48bb78; font-weight: bold;"><i class="fas fa-check-circle"></i> Correct! ${pointsEarned} points.</span>`;
    } else {
        feedbackHTML = `<span style="color: #f56565; font-weight: bold;"><i class="fas fa-times-circle"></i> Incorrect. Correct answer: ${question.options[question.correct]}</span>`;
    }
    
    if (question.explanation) {
        feedbackHTML += `<div style="margin-top: 10px; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 5px; border-left: 2px solid #4cc9f0;">
            <div style="color: #4cc9f0; font-size: 0.9rem; margin-bottom: 3px;"><i class="fas fa-lightbulb"></i> Explanation:</div>
            <div style="color: #b8b8d1; font-size: 0.9rem;">${question.explanation}</div>
        </div>`;
    }
    
    answerFeedback.innerHTML = feedbackHTML;
    
    // Enable treasure boxes
    enableTreasureBoxes();
}

// Reset treasure boxes to initial state
function resetTreasureBoxes() {
    treasureBoxes.innerHTML = '';
    
    for (let i = 1; i <= 3; i++) {
        const box = document.createElement('div');
        box.className = 'treasure-box';
        box.dataset.box = i;
        box.textContent = '🎁';
        
        box.addEventListener('click', () => openTreasureBox(i));
        treasureBoxes.appendChild(box);
    }
}

// Enable treasure boxes for selection
function enableTreasureBoxes() {
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.classList.remove('opened');
        box.style.cursor = 'pointer';
        box.textContent = '🎁';
    });
}

// Open a treasure box and apply power-up
function openTreasureBox(boxNum) {
    if (gameState.treasureOpened || !gameState.answerSubmitted) return;
    
    gameState.treasureOpened = true;
    
    // Mark all boxes as opened
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.classList.add('opened');
        box.style.cursor = 'default';
    });
    
    // Randomly select a power-up
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    // Update the selected box
    const selectedBox = document.querySelector(`.treasure-box[data-box="${boxNum}"]`);
    selectedBox.textContent = powerUp.icon;
    
    // Show power-up result
    powerupResult.innerHTML = `
        <div class="powerup-display">
            <div class="powerup-icon ${powerUp.colorClass}" style="font-size: 2.5rem;">${powerUp.icon}</div>
            <div style="font-weight: bold; margin: 5px 0;">${powerUp.name}</div>
            <div style="color: #b8b8d1; font-size: 0.9rem;">${powerUp.description}</div>
        </div>
    `;
    
    // Apply the power-up
    applyPowerUp(powerUp.type);
    
    // Show next button
    nextBtn.style.display = 'flex';
}

// Apply the selected power-up
function applyPowerUp(powerUpType) {
    const playerIndex = gameState.currentPlayer - 1;
    const otherPlayerIndex = gameState.currentPlayer === 1 ? 1 : 0;
    let pointsChange = gameState.currentQuestionPoints;
    
    switch(powerUpType) {
        case 'double':
            pointsChange *= 2;
            break;
        case 'halved':
            pointsChange = Math.floor(pointsChange / 2);
            break;
        case 'negative':
            pointsChange = -pointsChange;
            break;
        case 'switch':
            // Swap scores
            const tempScore = gameState.playerScores[playerIndex];
            gameState.playerScores[playerIndex] = gameState.playerScores[otherPlayerIndex];
            gameState.playerScores[otherPlayerIndex] = tempScore;
            updateScores();
            return; // Don't add regular points since we swapped
        case 'bonus':
            pointsChange += 10;
            break;
    }
    
    // Apply points
    gameState.playerScores[playerIndex] += pointsChange;
    
    // Ensure score doesn't go negative
    if (gameState.playerScores[playerIndex] < 0) {
        gameState.playerScores[playerIndex] = 0;
    }
    
    updateScores();
}

// Move to next question or end game
function nextQuestion() {
    gameState.currentQuestion++;
    
    if (gameState.currentQuestion >= gameState.totalQuestions) {
        endGame();
        return;
    }
    
    // Switch players for next question
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    
    loadQuestion();
    updatePlayerTurn();
}

// End the game and show results
function endGame() {
    gameState.gameOver = true;
    
    // Determine winner
    let winner;
    if (gameState.playerScores[0] > gameState.playerScores[1]) {
        winner = "Player 1";
    } else if (gameState.playerScores[1] > gameState.playerScores[0]) {
        winner = "Player 2";
    } else {
        winner = "It's a tie!";
    }
    
    // Update final scores
    finalScore1.textContent = gameState.playerScores[0];
    finalScore2.textContent = gameState.playerScores[1];
    winnerName.textContent = winner;
    
    // Show game over screen
    gameOverScreen.style.display = 'block';
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing event listeners...');
    
    // PIN button events
    pinButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('PIN button clicked:', btn.dataset.digit);
            addPinDigit(btn.dataset.digit);
        });
    });
    
    clearBtn.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Clear button clicked');
        clearPin();
    });
    
    submitPinBtn.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Submit PIN button clicked');
        submitPin();
    });
    
    // Code items click events
    document.querySelectorAll('.code-item').forEach(item => {
        item.addEventListener('click', () => {
            const code = item.dataset.code;
            console.log('Code clicked:', code);
            gameState.currentPin = code;
            updatePinDisplay();
        });
    });
    
    // Game events
    submitBtn.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Submit answer button clicked');
        submitAnswer();
    });
    
    nextBtn.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Next button clicked');
        nextQuestion();
    });
    
    restartBtn.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Restart button clicked');
        initGame();
    });
    
    newChapterBtn.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('New chapter button clicked');
        initPinScreen();
    });
    
    backToPinBtn.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Back to PIN button clicked');
        initPinScreen();
    });
    
    // Error events
    retryBtn.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Retry button clicked');
        submitPin();
    });
    
    backToPinErrorBtn.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Back to PIN error button clicked');
        initPinScreen();
    });
    
    // Keyboard support for PIN entry
    document.addEventListener('keydown', (event) => {
        if (pinScreen.classList.contains('active')) {
            if (event.key >= '0' && event.key <= '9') {
                event.preventDefault();
                addPinDigit(event.key);
            } else if (event.key === 'Backspace') {
                event.preventDefault();
                clearPin();
            } else if (event.key === 'Enter') {
                event.preventDefault();
                submitPin();
            }
        }
    });
    
    // Initialize
    initPinScreen();
    console.log('Event listeners initialized successfully');
});