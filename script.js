<script>
// ========== ENHANCED GAME STATE ==========
const gameState = {
    pin: '',
    questions: [],
    currentQuestion: 0,
    currentPlayer: 1,
    scores: [0, 0],
    selectedAnswer: null,
    answered: false,
    powerupUsed: false,
    canUsePowerup: false,
    availableQuizzes: []
};

// ========== QUIZ CATALOG ==========
const QUIZ_CATALOG = [
    // PRIMARY (100-199)
    { code: '101', level: 'Primary', grade: 'P1', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 1 Mathematics' },
    { code: '102', level: 'Primary', grade: 'P2', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 2 Mathematics' },
    { code: '103', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 3 Mathematics' },
    { code: '104', level: 'Primary', grade: 'P4', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 4 Mathematics' },
    { code: '105', level: 'Primary', grade: 'P5', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 5 Mathematics' },
    { code: '106', level: 'Primary', grade: 'P6', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 6 Mathematics' },
    
    { code: '111', level: 'Primary', grade: 'P1', subject: 'Science', folder: 'primary/science', name: 'Primary 1 Science' },
    { code: '112', level: 'Primary', grade: 'P2', subject: 'Science', folder: 'primary/science', name: 'Primary 2 Science' },
    { code: '113', level: 'Primary', grade: 'P3', subject: 'Science', folder: 'primary/science', name: 'Primary 3 Science' },
    { code: '114', level: 'Primary', grade: 'P4', subject: 'Science', folder: 'primary/science', name: 'Primary 4 Science' },
    { code: '115', level: 'Primary', grade: 'P5', subject: 'Science', folder: 'primary/science', name: 'Primary 5 Science' },
    { code: '116', level: 'Primary', grade: 'P6', subject: 'Science', folder: 'primary/science', name: 'Primary 6 Science' },
    
    // LOWER SECONDARY (200-299)
    { code: '201', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Mathematics', folder: 'lower-secondary/math', name: 'Secondary 1 Mathematics' },
    { code: '202', level: 'Lower Secondary', grade: 'Sec 2', subject: 'Mathematics', folder: 'lower-secondary/math', name: 'Secondary 2 Mathematics' },
    { code: '203', level: 'Lower Secondary', grade: 'Sec 3', subject: 'E Mathematics', folder: 'lower-secondary/math', name: 'Secondary 3 E Mathematics' },
    
    { code: '211', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Science', folder: 'lower-secondary/science', name: 'Secondary 1 Science' },
    { code: '212', level: 'Lower Secondary', grade: 'Sec 2', subject: 'Science', folder: 'lower-secondary/science', name: 'Secondary 2 Science' },
    { code: '213', level: 'Lower Secondary', grade: 'Sec 3', subject: 'Science', folder: 'lower-secondary/science', name: 'Secondary 3 Science' },
    
    // UPPER SECONDARY (300-399)
    { code: '301', level: 'Upper Secondary', grade: 'Sec 3', subject: 'E Mathematics', folder: 'upper-secondary/emath', name: 'Secondary 3 E Mathematics' },
    { code: '302', level: 'Upper Secondary', grade: 'Sec 4', subject: 'E Mathematics', folder: 'upper-secondary/emath', name: 'Secondary 4 E Mathematics' },
    
    { code: '311', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Pure Chemistry', folder: 'upper-secondary/pure-chem', name: 'Secondary 3 Pure Chemistry' },
    { code: '312', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Pure Chemistry', folder: 'upper-secondary/pure-chem', name: 'Secondary 4 Pure Chemistry' },
    
    { code: '321', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Pure Physics', folder: 'upper-secondary/pure-physics', name: 'Secondary 3 Pure Physics' },
    { code: '322', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Pure Physics', folder: 'upper-secondary/pure-physics', name: 'Secondary 4 Pure Physics' },
    
    { code: '331', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Combined Science (Physics)', folder: 'upper-secondary/combined-physics', name: 'Sec 3 Combined Sci (Physics)' },
    { code: '332', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Combined Science (Physics)', folder: 'upper-secondary/combined-physics', name: 'Sec 4 Combined Sci (Physics)' },
    
    { code: '341', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Combined Science (Chemistry)', folder: 'upper-secondary/combined-chem', name: 'Sec 3 Combined Sci (Chemistry)' },
    { code: '342', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Combined Science (Chemistry)', folder: 'upper-secondary/combined-chem', name: 'Sec 4 Combined Sci (Chemistry)' }
];

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
    const digits = ['digit1', 'digit2', 'digit3'];
    digits.forEach((id, index) => {
        const digit = document.getElementById(id);
        digit.textContent = gameState.pin[index] || '_';
    });
}

function addDigit(digit) {
    if (gameState.pin.length < 3) {
        gameState.pin += digit;
        updatePinDisplay();
    }
}

function clearPin() {
    gameState.pin = '';
    updatePinDisplay();
}

// ========== MODIFIED LOAD QUIZ FUNCTION ==========
async function loadQuizByCode(code) {
    // Find quiz in catalog
    const quizInfo = QUIZ_CATALOG.find(q => q.code === code);
    
    if (!quizInfo) {
        return { 
            success: false, 
            error: `Quiz code ${code} not found.` 
        };
    }
    
    const filename = `Questions/${quizInfo.folder}/${code}.json`;
    console.log('Loading from:', filename);
    
    try {
        const response = await fetch(filename);
        
        if (!response.ok) {
            return { 
                success: false, 
                error: `Quiz file not found: ${filename}` 
            };
        }
        
        const data = await response.json();
        return { 
            success: true, 
            data: data, 
            info: quizInfo 
        };
        
    } catch (error) {
        console.error('Error loading quiz:', error);
        return { 
            success: false, 
            error: `Failed to load: ${error.message}` 
        };
    }
}

// ========== SUBMIT PIN ==========
async function submitPin() {
    let pinToUse = gameState.pin;
    
    if (pinToUse.length !== 3) {
        alert('Please enter a 3-digit code');
        return;
    }
    
    // Validate code format
    if (!/^[1-3][0-9]{2}$/.test(pinToUse)) {
        alert('Invalid code. First digit must be 1, 2, or 3.');
        return;
    }
    
    showScreen('loading-screen');
    document.getElementById('loading-text').textContent = `Loading quiz ${pinToUse}...`;
    
    try {
        const result = await loadQuizByCode(pinToUse);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        gameState.questions = result.data.questions;
        
        // Set quiz info
        const quizTitle = document.getElementById('quiz-title');
        const quizTopic = document.getElementById('quiz-topic');
        
        quizTitle.textContent = result.data.title || result.info.name;
        quizTopic.textContent = `${result.info.grade} ${result.info.subject}`;
        
        // Add topic if available
        if (result.data.topic) {
            quizTopic.textContent += ` | ${result.data.topic}`;
        } else if (result.data.difficulty) {
            quizTopic.textContent += ` | ${result.data.difficulty}`;
        }
        
        // Initialize game
        initGame();
        showScreen('game-screen');
        
        // Save to recent quizzes
        saveToRecentQuizzes(pinToUse, result.data.title || result.info.name, result.info.subject, result.info.grade);
        
    } catch (error) {
        console.error('Failed to load quiz:', error);
        
        // Find similar quizzes
        const similarQuizzes = QUIZ_CATALOG.filter(q => 
            q.code[0] === pinToUse[0]
        ).slice(0, 5);
        
        let suggestion = '';
        if (similarQuizzes.length > 0) {
            suggestion = `<br><br>Available ${similarQuizzes[0].level} quizzes:`;
            similarQuizzes.forEach(q => {
                suggestion += `<br>• <strong>${q.code}</strong>: ${q.grade} ${q.subject}`;
            });
        }
        
        document.getElementById('error-message').innerHTML = 
            `<strong>Quiz ${pinToUse} not found</strong>${suggestion}`;
        showScreen('error-screen');
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
    
    document.getElementById('current-q').textContent = gameState.currentQuestion + 1;
    document.getElementById('total-q').textContent = gameState.questions.length;
    document.getElementById('points').textContent = question.points;
    document.getElementById('question').textContent = question.question;
    
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.onclick = () => selectOption(index);
        optionsContainer.appendChild(optionElement);
    });
    
    // Reset UI
    gameState.selectedAnswer = null;
    gameState.answered = false;
    gameState.powerupUsed = false;
    gameState.canUsePowerup = false;
    
    const submitBtn = document.getElementById('submit-answer');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submit Answer';
    
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('next-btn').style.display = 'none';
    
    // Reset treasure boxes
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.textContent = '🎁';
        box.style.background = 'linear-gradient(135deg, #fbbf24, #d97706)';
        box.onclick = () => openTreasureBox(box.dataset.box);
    });
    
    document.getElementById('powerup-result').innerHTML = 
        'Answer correctly to unlock treasure!';
    document.getElementById('powerup-result').style.color = '#a0aec0';
}

function selectOption(index) {
    if (gameState.answered) return;
    
    // Remove previous selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Select new option
    const options = document.querySelectorAll('.option');
    options[index].classList.add('selected');
    gameState.selectedAnswer = index;
    
    // Enable submit button
    document.getElementById('submit-answer').disabled = false;
}

function submitAnswer() {
    if (gameState.answered || gameState.selectedAnswer === null) return;
    
    gameState.answered = true;
    const submitBtn = document.getElementById('submit-answer');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Answered';
    
    const question = gameState.questions[gameState.currentQuestion];
    const isCorrect = gameState.selectedAnswer === question.correct;
    gameState.canUsePowerup = isCorrect;
    
    // Show correct/incorrect answers
    const options = document.querySelectorAll('.option');
    options.forEach((opt, index) => {
        if (index === question.correct) {
            opt.style.background = 'rgba(72, 187, 120, 0.3)';
            opt.style.border = '2px solid #48bb78';
        } else if (index === gameState.selectedAnswer && !isCorrect) {
            opt.style.background = 'rgba(245, 101, 101, 0.3)';
            opt.style.border = '2px solid #f56565';
        }
    });
    
    // Update score if correct
    if (isCorrect) {
        gameState.scores[gameState.currentPlayer - 1] += question.points;
        updateScores();
        
        let feedback = `<div style="color: #48bb78; font-weight: bold; margin-bottom: 10px;">
            ✓ Correct! +${question.points} points
        </div>`;
        
        if (question.explanation) {
            feedback += `<div style="color: #a0aec0;">💡 ${question.explanation}</div>`;
        }
        
        document.getElementById('feedback').innerHTML = feedback;
        
    } else {
        let feedback = `<div style="color: #f56565; font-weight: bold; margin-bottom: 10px;">
            ✗ Incorrect! No points
        </div>
        <div style="color: #48bb78; margin-bottom: 10px;">
            Correct answer: ${question.options[question.correct]}
        </div>`;
        
        if (question.explanation) {
            feedback += `<div style="color: #a0aec0;">💡 ${question.explanation}</div>`;
        }
        
        document.getElementById('feedback').innerHTML = feedback;
        
        // Disable treasure boxes for wrong answers
        document.querySelectorAll('.treasure-box').forEach(box => {
            box.textContent = '🔒';
            box.style.background = 'linear-gradient(135deg, #4a5568, #2d3748)';
            box.onclick = null;
        });
        
        document.getElementById('powerup-result').innerHTML = 
            'No power-up for wrong answers!';
        document.getElementById('powerup-result').style.color = '#f56565';
        
        // Show next button immediately
        document.getElementById('next-btn').style.display = 'block';
    }
}

function openTreasureBox(boxNum) {
    if (!gameState.canUsePowerup || gameState.powerupUsed) return;
    
    gameState.powerupUsed = true;
    
    // Mark all boxes as opened
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.style.background = 'linear-gradient(135deg, #4a5568, #2d3748)';
        box.onclick = null;
    });
    
    // Random power-up
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    // Update selected box
    const selectedBox = document.querySelector(`.treasure-box[data-box="${boxNum}"]`);
    selectedBox.textContent = powerUp.icon;
    
    // Show result
    document.getElementById('powerup-result').innerHTML = 
        `<strong>${powerUp.name}</strong><br>${powerUp.icon}`;
    document.getElementById('powerup-result').style.color = '#fbbf24';
    
    // Apply power-up
    applyPowerUp(powerUp.type);
    
    // Show next button
    document.getElementById('next-btn').style.display = 'block';
}

function applyPowerUp(type) {
    const playerIndex = gameState.currentPlayer - 1;
    const otherIndex = playerIndex === 0 ? 1 : 0;
    const question = gameState.questions[gameState.currentQuestion];
    let points = question.points;
    
    switch(type) {
        case 'double':
            points *= 2;
            gameState.scores[playerIndex] += points;
            break;
        case 'half':
            points = Math.floor(points / 2);
            gameState.scores[playerIndex] += points;
            break;
        case 'negative':
            gameState.scores[playerIndex] -= points;
            break;
        case 'switch':
            const temp = gameState.scores[playerIndex];
            gameState.scores[playerIndex] = gameState.scores[otherIndex];
            gameState.scores[otherIndex] = temp;
            break;
        case 'bonus':
            gameState.scores[playerIndex] += 10;
            break;
    }
    
    // Ensure score doesn't go below 0
    if (gameState.scores[playerIndex] < 0) {
        gameState.scores[playerIndex] = 0;
    }
    
    updateScores();
}

function updateScores() {
    document.getElementById('score1').textContent = gameState.scores[0];
    document.getElementById('score2').textContent = gameState.scores[1];
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
    
    if (gameState.currentQuestion >= gameState.questions.length) {
        endGame();
        return;
    }
    
    // Switch player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    
    loadQuestion();
    updatePlayerTurn();
}

function endGame() {
    // Determine winner
    let winner = '';
    if (gameState.scores[0] > gameState.scores[1]) {
        winner = 'Player 1 Wins! 🏆';
    } else if (gameState.scores[1] > gameState.scores[0]) {
        winner = 'Player 2 Wins! 🏆';
    } else {
        winner = "It's a Tie! 🤝";
    }
    
    document.getElementById('winner').textContent = winner;
    document.getElementById('final-score1').textContent = gameState.scores[0];
    document.getElementById('final-score2').textContent = gameState.scores[1];
    
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('next-btn').style.display = 'none';
}

// ========== RECENT QUIZZES ==========
function saveToRecentQuizzes(code, title, subject, grade) {
    let recent = JSON.parse(localStorage.getItem('recentQuizzes') || '[]');
    
    // Remove if already exists
    recent = recent.filter(q => q.code !== code);
    
    // Add to beginning
    recent.unshift({ 
        code: code, 
        title: title,
        subject: subject,
        grade: grade,
        timestamp: Date.now() 
    });
    
    // Keep only last 8
    recent = recent.slice(0, 8);
    
    localStorage.setItem('recentQuizzes', JSON.stringify(recent));
}

function showRecentQuizzes() {
    const recent = JSON.parse(localStorage.getItem('recentQuizzes') || '[]');
    
    if (recent.length > 0) {
        const container = document.createElement('div');
        container.className = 'recent-quizzes';
        container.innerHTML = `
            <div style="color: #a0aec0; margin: 20px 0 10px 0; font-weight: bold;">
                ⏰ Recently Played
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px;">
                ${recent.map(quiz => {
                    // Get icon based on subject
                    let icon = '📚';
                    if (quiz.subject.includes('Math')) icon = '🧮';
                    if (quiz.subject.includes('Science') && !quiz.subject.includes('Chem') && !quiz.subject.includes('Phys')) icon = '🔬';
                    if (quiz.subject.includes('Chem')) icon = '🧪';
                    if (quiz.subject.includes('Phys')) icon = '⚛️';
                    
                    return `
                        <button class="recent-btn" data-code="${quiz.code}" 
                                style="background: rgba(76, 201, 240, 0.1); 
                                       border: 1px solid #4cc9f0; 
                                       border-radius: 8px; 
                                       padding: 10px; 
                                       color: white; 
                                       cursor: pointer;
                                       text-align: left;">
                            <div style="font-weight: bold; color: #fbbf24;">${icon} ${quiz.code}</div>
                            <div style="font-size: 0.85rem; margin-top: 3px;">${quiz.subject}</div>
                            <div style="font-size: 0.75rem; color: #a0aec0;">${quiz.grade}</div>
                        </button>
                    `;
                }).join('')}
            </div>
        `;
        
        // Insert after PIN display
        const pinDisplay = document.querySelector('.pin-display');
        if (pinDisplay) {
            pinDisplay.parentNode.insertBefore(container, pinDisplay.nextSibling);
        }
        
        // Add click handlers
        container.querySelectorAll('.recent-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                gameState.pin = btn.dataset.code;
                updatePinDisplay();
            });
        });
    }
}

// ========== QUIZ CATALOG DISPLAY ==========
function showQuizCatalog() {
    const quickCodes = document.querySelector('.quick-codes');
    if (!quickCodes) return;
    
    // Clear existing content
    quickCodes.innerHTML = '';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = '📚 Available Quizzes';
    title.style.color = '#a0aec0';
    title.style.marginBottom = '15px';
    quickCodes.appendChild(title);
    
    // Group by level
    const levels = {
        'Primary': QUIZ_CATALOG.filter(q => q.level === 'Primary'),
        'Lower Secondary': QUIZ_CATALOG.filter(q => q.level === 'Lower Secondary'),
        'Upper Secondary': QUIZ_CATALOG.filter(q => q.level === 'Upper Secondary')
    };
    
    // Create catalog for each level
    Object.keys(levels).forEach(level => {
        const quizzes = levels[level];
        if (quizzes.length === 0) return;
        
        const levelContainer = document.createElement('div');
        levelContainer.style.marginBottom = '20px';
        
        // Level header
        const levelHeader = document.createElement('div');
        levelHeader.style.color = '#4cc9f0';
        levelHeader.style.fontWeight = 'bold';
        levelHeader.style.marginBottom = '10px';
        levelHeader.style.paddingBottom = '5px';
        levelHeader.style.borderBottom = '2px solid rgba(76, 201, 240, 0.3)';
        levelHeader.textContent = level;
        levelContainer.appendChild(levelHeader);
        
        // Create grid for quizzes
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        grid.style.gap = '8px';
        
        // Add each quiz
        quizzes.forEach(quiz => {
            let icon = '📚';
            if (quiz.subject.includes('Math')) icon = '🧮';
            if (quiz.subject.includes('Science') && !quiz.subject.includes('Chem') && !quiz.subject.includes('Phys')) icon = '🔬';
            if (quiz.subject.includes('Chem')) icon = '🧪';
            if (quiz.subject.includes('Phys')) icon = '⚛️';
            
            const quizItem = document.createElement('div');
            quizItem.className = 'code-item';
            quizItem.dataset.code = quiz.code;
            quizItem.style.cssText = `
                padding: 12px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            `;
            quizItem.innerHTML = `
                <div style="font-weight: bold; color: #fbbf24;">${icon} ${quiz.code}</div>
                <div style="font-size: 0.9rem; margin-top: 5px;">${quiz.subject}</div>
                <div style="font-size: 0.8rem; color: #a0aec0; margin-top: 3px;">${quiz.grade}</div>
            `;
            
            quizItem.addEventListener('mouseenter', () => {
                quizItem.style.background = 'rgba(76, 201, 240, 0.1)';
                quizItem.style.borderColor = '#4cc9f0';
            });
            
            quizItem.addEventListener('mouseleave', () => {
                quizItem.style.background = 'rgba(255,255,255,0.05)';
                quizItem.style.borderColor = 'rgba(255,255,255,0.1)';
            });
            
            quizItem.addEventListener('click', () => {
                gameState.pin = quiz.code;
                updatePinDisplay();
            });
            
            grid.appendChild(quizItem);
        });
        
        levelContainer.appendChild(grid);
        quickCodes.appendChild(levelContainer);
    });
    
    // Add guide
    const guide = document.createElement('div');
    guide.style.color = '#fbbf24';
    guide.style.fontSize = '0.9rem';
    guide.style.marginTop = '15px';
    guide.style.textAlign = 'center';
    guide.innerHTML = '💡 First digit: 1=Primary, 2=Lower Sec, 3=Upper Sec';
    quickCodes.appendChild(guide);
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize PIN display
    updatePinDisplay();
    
    // Show quiz catalog
    showQuizCatalog();
    
    // Show recent quizzes
    showRecentQuizzes();
    
    // Check for URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam && codeParam.length === 3 && /^[1-3][0-9]{2}$/.test(codeParam)) {
        gameState.pin = codeParam;
        updatePinDisplay();
        setTimeout(() => submitPin(), 800);
    }
    
    // ========== EVENT LISTENERS ==========
    // PIN buttons
    document.querySelectorAll('.keypad-btn').forEach(btn => {
        btn.addEventListener('click', () => addDigit(btn.dataset.digit));
    });
    
    document.getElementById('clear-btn').addEventListener('click', clearPin);
    document.getElementById('submit-pin-btn').addEventListener('click', submitPin);
    
    // Game buttons
    document.getElementById('submit-answer').addEventListener('click', submitAnswer);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('home-btn').addEventListener('click', () => {
        gameState.pin = '';
        showScreen('pin-screen');
    });
    
    // Error buttons
    document.getElementById('retry-btn').addEventListener('click', submitPin);
    document.getElementById('back-btn').addEventListener('click', () => {
        gameState.pin = '';
        showScreen('pin-screen');
    });
    
    // Game over buttons
    document.getElementById('restart-game').addEventListener('click', initGame);
    document.getElementById('new-chapter').addEventListener('click', () => {
        gameState.pin = '';
        showScreen('pin-screen');
    });
    
    // Treasure boxes
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.addEventListener('click', () => openTreasureBox(box.dataset.box));
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
    
    console.log('Singapore Curriculum Quiz Game Ready!');
    console.log('Available quizzes:', QUIZ_CATALOG.length);
});

// ========== ADMIN TOOLS ==========
window.quizAdmin = {
    // Generate template
    generateTemplate: function(code, subject, grade, level) {
        const quizInfo = QUIZ_CATALOG.find(q => q.code === code);
        const folder = quizInfo ? quizInfo.folder : 'custom';
        
        const template = {
            "title": `${grade} ${subject}`,
            "topic": `${subject} Fundamentals`,
            "subject": subject,
            "level": level,
            "grade": grade,
            "author": "Teacher",
            "dateCreated": new Date().toISOString().split('T')[0],
            "difficulty": "Medium",
            "estimatedTime": "15 minutes",
            "questions": [
                {
                    "question": "Sample question 1?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct": 0,
                    "points": 10,
                    "explanation": "Explanation for correct answer.",
                    "learningObjective": "Understand basic concept"
                },
                {
                    "question": "Sample question 2?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct": 1,
                    "points": 15,
                    "explanation": "Explanation for correct answer.",
                    "learningObjective": "Apply knowledge"
                }
            ]
        };
        
        console.log(`=== TEMPLATE FOR QUIZ ${code} ===`);
        console.log(`Save as: Questions/${folder}/${code}.json`);
        console.log(JSON.stringify(template, null, 2));
        console.log(`=== END TEMPLATE ===`);
    },
    
    // List all quizzes
    listQuizzes: function() {
        console.log('=== AVAILABLE QUIZZES ===');
        const byLevel = {
            'Primary': [],
            'Lower Secondary': [],
            'Upper Secondary': []
        };
        
        QUIZ_CATALOG.forEach(quiz => {
            byLevel[quiz.level].push(quiz);
        });
        
        Object.keys(byLevel).forEach(level => {
            if (byLevel[level].length > 0) {
                console.log(`\n${level}:`);
                byLevel[level].forEach(quiz => {
                    console.log(`  ${quiz.code}: ${quiz.grade} ${quiz.subject} (${quiz.folder})`);
                });
            }
        });
    },
    
    // Test a quiz
    testQuiz: function(code) {
        console.log(`Testing quiz ${code}...`);
        gameState.pin = code;
        submitPin();
    }
};
</script>