// ========== ENHANCED GAME STATE ==========
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
    hiddenWorksheets: JSON.parse(localStorage.getItem('hiddenWorksheets')) || []
};

// ========== QUIZ CATALOG (CLEANED & CORRECTED) ==========
const QUIZ_CATALOG = [
    // PRIMARY (100-199)
    { code: '101-01-1', level: 'Primary', grade: 'P1', subject: 'Mathematics', folder: 'primary/math', filename: '101011.json', name: 'Primary 1 Math Chapter 1' },
    { code: '102-01-1', level: 'Primary', grade: 'P2', subject: 'Mathematics', folder: 'primary/math', filename: '102011.json', name: 'Primary 2 Math Chapter 1' },
    { code: '103-01-1', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', filename: '103011.json', name: 'Primary 3 Math Chapter 1' },
    { code: '104-01-1', level: 'Primary', grade: 'P4', subject: 'Mathematics', folder: 'primary/math', filename: '104011.json', name: 'Primary 4 Math Chapter 1' },
    { code: '105-01-1', level: 'Primary', grade: 'P5', subject: 'Mathematics', folder: 'primary/math', filename: '105011.json', name: 'Primary 5 Math Chapter 1' },
    { code: '106-01-1', level: 'Primary', grade: 'P6', subject: 'Mathematics', folder: 'primary/math', filename: '106011.json', name: 'Primary 6 Math Chapter 1' },
    
    // Primary Science
    { code: '111-01-1', level: 'Primary', grade: 'P1', subject: 'Science', folder: 'primary/science', filename: '111011.json', name: 'Primary 1 Science Chapter 1' },
    { code: '112-01-1', level: 'Primary', grade: 'P2', subject: 'Science', folder: 'primary/science', filename: '112011.json', name: 'Primary 2 Science Chapter 1' },
    
    // YOUR EXISTING PRIMARY QUIZZES
    { code: '341-01-1', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', filename: '341011.json', name: 'Primary 3 Math Chapter 1 Worksheet 1' },
    { code: '341-01-z', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', filename: '34101z.json', name: 'Primary 3 Math Chapter 1 Worksheet Z' },
    
    // LOWER SECONDARY (200-299)
    { code: '201-01-1', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Mathematics', folder: 'lower-secondary/math', filename: '201011.json', name: 'Sec 1 Math Chapter 1 (LCM & HCF)' },
    { code: '201-01-2', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Mathematics', folder: 'lower-secondary/math', filename: '201012.json', name: 'Sec 1 Math Chapter 1 Worksheet 2' },
    { code: '201-02-1', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Mathematics', folder: 'lower-secondary/math', filename: '201021.json', name: 'Sec 1 Math Chapter 2 (Algebra)' },
    { code: '202-01-1', level: 'Lower Secondary', grade: 'Sec 2', subject: 'Mathematics', folder: 'lower-secondary/math', filename: '202011.json', name: 'Secondary 2 Math Chapter 1' },
    
    // Lower Secondary Science
    { code: '211-01-1', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Science', folder: 'lower-secondary/science', filename: '211011.json', name: 'Secondary 1 Science Chapter 1' },
    { code: '212-01-1', level: 'Lower Secondary', grade: 'Sec 2', subject: 'Science', folder: 'lower-secondary/science', filename: '212011.json', name: 'Secondary 2 Science Chapter 1' },
    
    // UPPER SECONDARY (300-399)
    { code: '301-01-1', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Mathematics', folder: 'upper-secondary/math', filename: '301011.json', name: 'Upper Secondary Math Chapter 1' },
    { code: '302-01-1', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Mathematics', folder: 'upper-secondary/math', filename: '302011.json', name: 'Upper Secondary Math Chapter 1' },
    
    // Upper Secondary Combined Chemistry - YOUR FILE
    { code: '344-09-1', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Combined Chemistry', folder: 'upper-secondary/combined-chem', filename: '344091.json', name: 'Sec 4 Combined Chemistry Chapter 9' },
    
    // Upper Secondary Pure Chemistry - YOUR FILE
    { code: '354-13-1', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Pure Chemistry', folder: 'upper-secondary/pure-chem', filename: '354131.json', name: 'Secondary 4 Pure Chemistry Chapter 13' },
    { code: '353-01-1', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Pure Chemistry', folder: 'upper-secondary/pure-chem', filename: '353011.json', name: 'Secondary 3 Pure Chemistry Chapter 1' },
    { code: '354-01-1', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Pure Chemistry', folder: 'upper-secondary/pure-chem', filename: '354011.json', name: 'Secondary 4 Pure Chemistry Chapter 1' },
    
    // Upper Secondary Pure Physics
    { code: '333-01-1', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Pure Physics', folder: 'upper-secondary/pure-physics', filename: '333011.json', name: 'Secondary 3 Pure Physics Chapter 1' },
    { code: '334-01-1', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Pure Physics', folder: 'upper-secondary/pure-physics', filename: '334011.json', name: 'Secondary 4 Pure Physics Chapter 1' }
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
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
}

// ========== PIN FUNCTIONS ==========
function updatePinDisplay() {
    for (let i = 0; i < 6; i++) {
        const digitEl = document.getElementById(`digit${i + 1}`);
        if (digitEl) {
            digitEl.textContent = gameState.pin[i] || '_';
            digitEl.className = gameState.pin[i] ? 'digit filled' : 'digit empty';
        }
    }
}

function addDigit(digit) {
    if (gameState.currentDigit < 6) {
        gameState.pin[gameState.currentDigit] = digit;
        gameState.currentDigit++;
        updatePinDisplay();
    }
}

function clearPin() {
    gameState.pin = ['', '', '', '', '', ''];
    gameState.currentDigit = 0;
    updatePinDisplay();
}

function removeLastDigit() {
    if (gameState.currentDigit > 0) {
        gameState.currentDigit--;
        gameState.pin[gameState.currentDigit] = '';
        updatePinDisplay();
    }
}

// ========== LOAD QUIZ FUNCTION (OPTIMIZED) ==========
async function loadQuizByCode(code) {
    console.log('🔍 Loading:', code);
    
    if (gameState.hiddenWorksheets.includes(code)) {
        return { success: false, error: `Worksheet ${code} is hidden.` };
    }
    
    const quizInfo = QUIZ_CATALOG.find(q => q.code === code);
    if (!quizInfo) {
        return { success: false, error: `Code ${code} not found in catalog.` };
    }
    
    const filename = quizInfo.filename;
    const filepath = `Questions/${quizInfo.folder}/${filename}`;
    
    console.log('📁 Path:', filepath);
    
    try {
        // Try primary path
        const response = await fetch(filepath);
        
        if (!response.ok) {
            // Try alternative paths
            const altPaths = [
                `./Questions/${quizInfo.folder}/${filename}`,
                `../Questions/${quizInfo.folder}/${filename}`,
                `/${filepath}`,
                `${filename}`,
                `Questions/${filename}`
            ];
            
            for (const path of altPaths) {
                try {
                    const altResponse = await fetch(path);
                    if (altResponse.ok) {
                        const data = await altResponse.json();
                        console.log(`✅ Found at: ${path}`);
                        return { success: true, data, info: quizInfo };
                    }
                } catch (e) {
                    continue;
                }
            }
            
            throw new Error(`File not found: ${filename}`);
        }
        
        const data = await response.json();
        console.log('✅ Loaded:', filename);
        return { success: true, data, info: quizInfo };
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return { 
            success: false, 
            error: `Failed to load ${filename}`,
            details: error.message,
            path: filepath 
        };
    }
}

// ========== SUBMIT PIN ==========
async function submitPin() {
    const pin = gameState.pin.join('');
    
    if (pin.length !== 6) {
        showAlert('Please enter all 6 digits');
        return;
    }
    
    const formattedPin = `${pin.slice(0,3)}-${pin.slice(3,5)}-${pin.slice(5)}`;
    
    showScreen('loading-screen');
    document.getElementById('loading-message').textContent = `Loading ${formattedPin}...`;
    
    try {
        const result = await loadQuizByCode(formattedPin);
        
        if (!result.success) {
            // Build error message
            let errorHTML = `
                <div class="error-header">
                    <span class="error-icon">❌</span>
                    <h3>Worksheet ${formattedPin} not found</h3>
                </div>
                <div class="error-details">
                    <p><strong>Expected file:</strong> ${result.path || 'Unknown'}</p>
                    <p><strong>Error:</strong> ${result.error || 'Unknown error'}</p>
                </div>
                <div class="error-help">
                    <p><strong>💡 Available quizzes:</strong></p>
                    <ul class="available-quizzes">
            `;
            
            // Show up to 5 available quizzes
            const available = QUIZ_CATALOG
                .filter(q => !gameState.hiddenWorksheets.includes(q.code))
                .slice(0, 5);
            
            available.forEach(quiz => {
                errorHTML += `
                    <li onclick="selectQuizCode('${quiz.code}')">
                        <span class="quiz-code">${quiz.code}</span>
                        <span class="quiz-name">${quiz.name}</span>
                    </li>
                `;
            });
            
            errorHTML += `</ul></div>`;
            
            document.getElementById('error-message').innerHTML = errorHTML;
            throw new Error('Quiz not found');
        }
        
        // Process quiz data
        let questions = [];
        if (result.data.questions && Array.isArray(result.data.questions)) {
            questions = result.data.questions;
        } else if (Array.isArray(result.data)) {
            questions = result.data;
        } else {
            throw new Error('Invalid quiz format');
        }
        
        if (questions.length === 0) {
            throw new Error('Quiz file is empty');
        }
        
        gameState.questions = questions;
        
        // Update UI
        document.getElementById('quiz-title').textContent = result.data.title || result.info.name;
        document.getElementById('quiz-topic').textContent = `${result.info.grade} • ${result.info.subject}`;
        
        if (result.data.topic) {
            document.getElementById('quiz-topic').textContent += ` • ${result.data.topic}`;
        }
        
        // Initialize and show game
        initGame();
        showScreen('game-screen');
        
        // Save to recent
        saveToRecentQuizzes(formattedPin, result.data.title || result.info.name, 
                           result.info.subject, result.info.grade);
        
    } catch (error) {
        console.error('Submit error:', error);
        
        if (!document.getElementById('error-message').innerHTML.includes('not found')) {
            document.getElementById('error-message').innerHTML = `
                <div class="error-header">
                    <span class="error-icon">⚠️</span>
                    <h3>Error Loading Quiz</h3>
                </div>
                <p>${error.message}</p>
            `;
        }
        
        setTimeout(() => showScreen('error-screen'), 500);
    }
}

// ========== GAME FUNCTIONS (OPTIMIZED) ==========
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
    document.getElementById('question-text').textContent = question.question || "No question text";
    
    // Clear and add options
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    if (question.options && question.options.length) {
        question.options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'option';
            optionEl.innerHTML = `
                <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                <span class="option-text">${option}</span>
            `;
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
    
    const treasureSection = document.getElementById('treasure-section');
    if (treasureSection) treasureSection.style.display = 'none';
    
    // Reset treasure boxes
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.className = 'treasure-box';
        box.textContent = '🎁';
        box.onclick = null;
    });
    
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
    document.querySelectorAll('.option')[index].classList.add('selected');
    gameState.selectedAnswer = index;
    document.getElementById('submit-answer').disabled = false;
}

function submitAnswer() {
    if (gameState.answered || gameState.selectedAnswer === null) return;
    
    gameState.answered = true;
    const question = gameState.questions[gameState.currentQuestion];
    const isCorrect = gameState.selectedAnswer === question.correct;
    
    // Disable submit button
    document.getElementById('submit-answer').disabled = true;
    
    // Mark correct/incorrect
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
                <span class="feedback-icon">✅</span>
                <div class="feedback-content">
                    <h3>Correct! +${points} points</h3>
                    ${question.explanation ? `<p class="explanation"><strong>Explanation:</strong> ${question.explanation}</p>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('answer-feedback').innerHTML = feedback;
        
        // Show treasure
        document.getElementById('treasure-section').style.display = 'block';
        
    } else {
        const correctLetter = String.fromCharCode(65 + question.correct);
        const correctText = question.options[question.correct];
        
        let feedback = `
            <div class="feedback-incorrect">
                <span class="feedback-icon">❌</span>
                <div class="feedback-content">
                    <h3>Incorrect</h3>
                    <p class="correct-answer"><strong>Correct answer:</strong> ${correctLetter}) ${correctText}</p>
                    ${question.explanation ? `<p class="explanation"><strong>Explanation:</strong> ${question.explanation}</p>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('answer-feedback').innerHTML = feedback;
        
        // Disable treasure
        document.querySelectorAll('.treasure-box').forEach(box => {
            box.classList.add('disabled');
        });
        
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
    
    // Mark all boxes
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.classList.add('opened');
        box.onclick = null;
    });
    
    // Get random power-up
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    // Update selected box
    const selectedBox = document.querySelector(`[data-box="${boxNum}"]`);
    selectedBox.textContent = powerUp.icon;
    selectedBox.classList.add('active');
    
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
    
    // Ensure no negative scores
    if (gameState.scores[playerIdx] < 0) gameState.scores[playerIdx] = 0;
    if (gameState.scores[otherIdx] < 0) gameState.scores[otherIdx] = 0;
    
    updateScores();
    
    // Add message to feedback
    const feedbackDiv = document.getElementById('answer-feedback');
    feedbackDiv.innerHTML += `<div class="powerup-message">🎁 ${message}</div>`;
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
    
    player1.classList.toggle('active', gameState.currentPlayer === 1);
    player2.classList.toggle('active', gameState.currentPlayer === 2);
    
    document.getElementById('player1-turn').textContent = 
        gameState.currentPlayer === 1 ? "Current Turn" : "";
    document.getElementById('player2-turn').textContent = 
        gameState.currentPlayer === 2 ? "Current Turn" : "";
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
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('submit-answer').style.display = 'none';
}

// ========== QUIZ CATALOG & RECENT ==========
function loadQuizCatalog() {
    const container = document.getElementById('quick-codes');
    if (!container) return;
    
    try {
        const visibleQuizzes = QUIZ_CATALOG.filter(q => 
            !gameState.hiddenWorksheets.includes(q.code)
        );
        
        if (visibleQuizzes.length === 0) {
            container.innerHTML = '<p class="no-quizzes">No quizzes available</p>';
            return;
        }
        
        let html = '<h3 class="catalog-title">📚 Available Quizzes</h3>';
        
        // Group by level
        const groups = {
            'Primary': visibleQuizzes.filter(q => q.level === 'Primary'),
            'Lower Secondary': visibleQuizzes.filter(q => q.level === 'Lower Secondary'),
            'Upper Secondary': visibleQuizzes.filter(q => q.level === 'Upper Secondary')
        };
        
        for (const [level, quizzes] of Object.entries(groups)) {
            if (quizzes.length === 0) continue;
            
            const levelColor = {
                'Primary': '#48bb78',
                'Lower Secondary': '#4cc9f0',
                'Upper Secondary': '#9f7aea'
            }[level] || '#666';
            
            html += `
                <div class="level-group">
                    <h4 class="level-title" style="color: ${levelColor}">${level}</h4>
                    <div class="quiz-grid">
            `;
            
            quizzes.forEach(quiz => {
                const icon = quiz.subject.includes('Math') ? '🧮' :
                            quiz.subject.includes('Chem') ? '🧪' :
                            quiz.subject.includes('Phys') ? '⚛️' :
                            quiz.subject.includes('Science') ? '🔬' : '📚';
                
                html += `
                    <div class="quiz-card" data-code="${quiz.code}">
                        <div class="quiz-header">
                            <span class="quiz-icon">${icon}</span>
                            <span class="quiz-code">${quiz.code}</span>
                        </div>
                        <div class="quiz-name">${quiz.name}</div>
                        <div class="quiz-meta">
                            <span class="quiz-subject">${quiz.subject}</span>
                            <span class="quiz-grade">${quiz.grade}</span>
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        container.innerHTML = html;
        
        // Add click handlers
        container.querySelectorAll('.quiz-card').forEach(card => {
            card.addEventListener('click', () => {
                const code = card.dataset.code;
                selectQuizCode(code);
            });
        });
        
    } catch (error) {
        console.error('Catalog error:', error);
        container.innerHTML = '<p class="error">Error loading catalog</p>';
    }
}

function selectQuizCode(code) {
    const digits = code.replace(/-/g, '').split('');
    gameState.pin = [...digits];
    gameState.currentDigit = digits.length;
    updatePinDisplay();
}

function saveToRecentQuizzes(code, title, subject, grade) {
    let recent = JSON.parse(localStorage.getItem('recentQuizzes') || '[]');
    
    recent = recent.filter(q => q.code !== code);
    recent.unshift({ code, title, subject, grade, timestamp: Date.now() });
    recent = recent.slice(0, 5);
    
    localStorage.setItem('recentQuizzes', JSON.stringify(recent));
    showRecentQuizzes();
}

function showRecentQuizzes() {
    const recent = JSON.parse(localStorage.getItem('recentQuizzes') || '[]');
    if (recent.length === 0) return;
    
    const container = document.getElementById('recent-quizzes');
    if (!container) return;
    
    let html = '<h3 class="recent-title">⏰ Recent Quizzes</h3><div class="recent-grid">';
    
    recent.forEach(quiz => {
        const icon = quiz.subject.includes('Math') ? '🧮' :
                    quiz.subject.includes('Chem') ? '🧪' :
                    quiz.subject.includes('Phys') ? '⚛️' :
                    quiz.subject.includes('Science') ? '🔬' : '📚';
        
        html += `
            <button class="recent-card" data-code="${quiz.code}">
                <div class="recent-header">
                    <span class="recent-icon">${icon}</span>
                    <span class="recent-code">${quiz.code}</span>
                </div>
                <div class="recent-subject">${quiz.subject}</div>
                <div class="recent-grade">${quiz.grade}</div>
            </button>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add click handlers
    container.querySelectorAll('.recent-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.dataset.code;
            selectQuizCode(code);
        });
    });
}

// ========== UI HELPERS ==========
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Quiz Game Initializing...');
    
    // Initialize displays
    updatePinDisplay();
    loadQuizCatalog();
    showRecentQuizzes();
    
    // PIN event listeners
    document.querySelectorAll('.keypad-btn').forEach(btn => {
        if (btn.dataset.digit) {
            btn.addEventListener('click', () => addDigit(btn.dataset.digit));
        }
    });
    
    document.getElementById('clear-btn')?.addEventListener('click', clearPin);
    document.getElementById('backspace-btn')?.addEventListener('click', removeLastDigit);
    document.getElementById('submit-pin')?.addEventListener('click', submitPin);
    
    // Game event listeners
    document.getElementById('submit-answer')?.addEventListener('click', submitAnswer);
    document.getElementById('next-btn')?.addEventListener('click', nextQuestion);
    document.getElementById('home-btn')?.addEventListener('click', () => {
        clearPin();
        showScreen('pin-screen');
    });
    
    // Error screen listeners
    document.getElementById('retry-btn')?.addEventListener('click', submitPin);
    document.getElementById('back-to-pin-error')?.addEventListener('click', () => {
        clearPin();
        showScreen('pin-screen');
    });
    
    // Game over listeners
    document.getElementById('restart-btn')?.addEventListener('click', initGame);
    document.getElementById('new-chapter-btn')?.addEventListener('click', () => {
        clearPin();
        showScreen('pin-screen');
    });
    
    // Treasure box listeners
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.addEventListener('click', () => openTreasureBox(box.dataset.box));
    });
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('pin-screen')?.classList.contains('active')) {
            if (e.key >= '0' && e.key <= '9') {
                addDigit(e.key);
            } else if (e.key === 'Backspace') {
                removeLastDigit();
            } else if (e.key === 'Enter') {
                submitPin();
            }
        }
    });
    
    console.log('✅ Quiz Game Ready!');
});

// ========== DEBUG TOOLS ==========
window.quizTools = {
    listFiles: function() {
        console.log('📁 File Structure:');
        QUIZ_CATALOG.forEach(quiz => {
            console.log(`- Questions/${quiz.folder}/${quiz.filename}`);
        });
    },
    
    testQuiz: function(code) {
        console.log(`🧪 Testing: ${code}`);
        const digits = code.replace(/-/g, '').split('');
        gameState.pin = [...digits];
        gameState.currentDigit = digits.length;
        updatePinDisplay();
        setTimeout(() => submitPin(), 500);
    },
    
    checkFile: async function(code) {
        const quizInfo = QUIZ_CATALOG.find(q => q.code === code);
        if (!quizInfo) {
            console.log(`❌ ${code} not in catalog`);
            return;
        }
        
        const paths = [
            `Questions/${quizInfo.folder}/${quizInfo.filename}`,
            `./Questions/${quizInfo.folder}/${quizInfo.filename}`,
            `/${quizInfo.filename}`
        ];
        
        for (const path of paths) {
            try {
                const response = await fetch(path);
                console.log(`${response.ok ? '✅' : '❌'} ${path} - ${response.status}`);
                if (response.ok) return true;
            } catch (e) {
                console.log(`❌ ${path} - ${e.message}`);
            }
        }
        return false;
    },
    
    showHidden: function() {
        console.log('🔒 Hidden:', gameState.hiddenWorksheets);
    },
    
    resetAll: function() {
        if (confirm('Reset all game data?')) {
            localStorage.clear();
            location.reload();
        }
    }
};

console.log('💡 Type quizTools.testQuiz("344-09-1") to test Combined Chemistry');