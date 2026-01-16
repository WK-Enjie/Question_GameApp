<script>
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

// ========== QUIZ CATALOG (Updated for NO HYPHEN files) ==========
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
    
    // YOUR EXISTING PRIMARY QUIZZES (NO HYPHEN FILES)
    { code: '341-01-1', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', filename: '341011.json', name: 'Primary 3 Math Chapter 1 Worksheet 1' },
    { code: '341-01-z', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', filename: '34101z.json', name: 'Primary 3 Math Chapter 1 Worksheet Z' },
    
    // LOWER SECONDARY (200-299) - NO HYPHEN FILES
    { code: '201-01-1', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Mathematics', folder: 'lower-secondary/math', filename: '201011.json', name: 'Sec 1 Math Chapter 1 (LCM & HCF)' },
    { code: '201-01-2', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Mathematics', folder: 'lower-secondary/math', filename: '201012.json', name: 'Sec 1 Math Chapter 1 Worksheet 2' },
    { code: '201-02-1', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Mathematics', folder: 'lower-secondary/math', filename: '201021.json', name: 'Sec 1 Math Chapter 2 (Algebra)' },
    { code: '202-01-1', level: 'Lower Secondary', grade: 'Sec 2', subject: 'Mathematics', folder: 'lower-secondary/math', filename: '202011.json', name: 'Secondary 2 Math Chapter 1' },
    
    // Lower Secondary Science
    { code: '211-01-1', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Science', folder: 'lower-secondary/science', filename: '211011.json', name: 'Secondary 1 Science Chapter 1' },
    { code: '212-01-1', level: 'Lower Secondary', grade: 'Sec 2', subject: 'Science', folder: 'lower-secondary/science', filename: '212011.json', name: 'Secondary 2 Science Chapter 1' },
    
    // UPPER SECONDARY (300-399) - NO HYPHEN FILES
    { code: '301-01-1', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Mathematics', folder: 'upper-secondary/math', filename: '301011.json', name: 'Upper Secondary Math Chapter 1' },
    { code: '302-01-1', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Mathematics', folder: 'upper-secondary/math', filename: '302011.json', name: 'Upper Secondary Math Chapter 1' },
    
    // Upper Secondary Combined Chemistry - YOUR FILE IS HERE
    { code: '342-09-1', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Combined Science (Chemistry)', folder: 'upper-secondary/combined-chem', filename: '342091.json', name: 'Sec 4 Combined Chemistry Chapter 9' },
    
    // Upper Secondary Pure Chemistry
    { code: '311-01-1', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Pure Chemistry', folder: 'upper-secondary/pure-chem', filename: '311011.json', name: 'Secondary 3 Pure Chemistry Chapter 1' },
    { code: '312-01-1', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Pure Chemistry', folder: 'upper-secondary/pure-chem', filename: '312011.json', name: 'Secondary 4 Pure Chemistry Chapter 1' },
    
    // Upper Secondary Pure Physics
    { code: '321-01-1', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Pure Physics', folder: 'upper-secondary/pure-physics', filename: '321011.json', name: 'Secondary 3 Pure Physics Chapter 1' },
    { code: '322-01-1', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Pure Physics', folder: 'upper-secondary/pure-physics', filename: '322011.json', name: 'Secondary 4 Pure Physics Chapter 1' }
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

// ========== CORRECTED LOAD QUIZ FUNCTION (NO HYPHENS) ==========
async function loadQuizByCode(code) {
    console.log('🔍 Loading quiz:', code);
    
    // Check if worksheet is hidden
    if (gameState.hiddenWorksheets.includes(code)) {
        return { 
            success: false, 
            error: `Worksheet ${code} is hidden. Use admin panel to show it.` 
        };
    }
    
    // Find quiz in catalog
    const quizInfo = QUIZ_CATALOG.find(q => q.code === code);
    
    if (!quizInfo) {
        return { 
            success: false, 
            error: `Quiz code ${code} not found in catalog.` 
        };
    }
    
    // Use filename WITHOUT hyphens from catalog
    const filename = quizInfo.filename;
    const filepath = `Questions/${quizInfo.folder}/${filename}`;
    
    console.log('📂 Looking for file:', filepath);
    console.log('📁 Folder:', quizInfo.folder);
    console.log('📄 Filename:', filename);
    
    try {
        // Try the exact path first
        const response = await fetch(filepath);
        
        if (!response.ok) {
            // If file not found, try alternative paths
            const altPaths = [
                filepath,  // Main path
                `./Questions/${quizInfo.folder}/${filename}`,
                `../Questions/${quizInfo.folder}/${filename}`,
                `Questions/${filename}`,  // Direct in Questions folder
                `./${filename}`,  // Root directory
                `${filename}`,  // Current directory
                // Also try with hyphens (just in case)
                `Questions/${quizInfo.folder}/${code}.json`,
                `${code}.json`
            ];
            
            console.log('🔍 Trying alternative paths...');
            
            for (const path of altPaths) {
                try {
                    console.log(`  Trying: ${path}`);
                    const altResponse = await fetch(path);
                    if (altResponse.ok) {
                        const data = await altResponse.json();
                        console.log(`✅ Found at: ${path}`);
                        return { 
                            success: true, 
                            data: data, 
                            info: quizInfo,
                            path: path
                        };
                    }
                } catch (e) {
                    // Continue to next path
                    continue;
                }
            }
            
            throw new Error(`File not found. Tried: ${filepath} and alternatives`);
        }
        
        const data = await response.json();
        console.log('✅ Successfully loaded:', filename);
        
        return { 
            success: true, 
            data: data, 
            info: quizInfo,
            path: filepath
        };
        
    } catch (error) {
        console.error('❌ Error loading quiz:', error);
        return { 
            success: false, 
            error: `Failed to load ${filename}: ${error.message}`,
            expectedPath: `Questions/${quizInfo.folder}/${filename}`
        };
    }
}

// ========== SUBMIT PIN ==========
async function submitPin() {
    // Join pin array to string
    const pin = gameState.pin.join('');
    
    if (pin.length !== 6) {
        alert('Please enter all 6 digits');
        return;
    }
    
    // Format as XXX-XX-X based on position (for display only)
    const formattedPin = `${pin.slice(0,3)}-${pin.slice(3,5)}-${pin.slice(5)}`;
    
    showScreen('loading-screen');
    document.getElementById('loading-message').textContent = `Loading ${formattedPin}...`;
    
    try {
        const result = await loadQuizByCode(formattedPin);
        
        if (!result.success) {
            // Show detailed error
            let errorMsg = `<strong>Worksheet ${formattedPin} not found</strong><br><br>`;
            errorMsg += `<div style="color: #a0aec0; font-size: 0.9rem;">`;
            errorMsg += `Expected file: ${result.expectedPath || 'unknown'}<br>`;
            errorMsg += `Error: ${result.error}</div>`;
            
            // Find what quizzes ARE available
            const availableQuizzes = QUIZ_CATALOG.filter(q => 
                !gameState.hiddenWorksheets.includes(q.code)
            ).slice(0, 8);
            
            if (availableQuizzes.length > 0) {
                errorMsg += `<br><div style="color: #fbbf24; margin-top: 15px;">Available quizzes:</div>`;
                availableQuizzes.forEach(q => {
                    errorMsg += `<div style="font-size: 0.9rem; margin: 5px 0;">
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
            throw new Error('Invalid quiz format: No questions array found');
        }
        
        if (gameState.questions.length === 0) {
            throw new Error('Quiz file is empty');
        }
        
        // Set quiz info
        const quizTitle = document.getElementById('quiz-title');
        const quizTopic = document.getElementById('quiz-topic');
        
        quizTitle.textContent = result.data.title || result.info.name;
        quizTopic.textContent = `${result.info.grade} ${result.info.subject}`;
        
        // Add topic if available
        if (result.data.topic) {
            quizTopic.textContent += ` | ${result.data.topic}`;
        }
        
        // Initialize game
        initGame();
        showScreen('game-screen');
        
        // Save to recent quizzes
        saveToRecentQuizzes(formattedPin, result.data.title || result.info.name, result.info.subject, result.info.grade);
        
    } catch (error) {
        console.error('Failed to load quiz:', error);
        document.getElementById('loading-message').textContent = `Error: ${error.message.split('<')[0]}`;
        
        setTimeout(() => {
            document.getElementById('error-message').innerHTML = error.message;
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
    const question = gameState.questions[gameState.currentQuestion];
    
    if (!question) {
        console.error('No question found at index:', gameState.currentQuestion);
        endGame();
        return;
    }
    
    // Update question info
    document.getElementById('current-q').textContent = gameState.currentQuestion + 1;
    document.getElementById('total-q').textContent = gameState.questions.length;
    document.getElementById('question-text').textContent = question.question || "Question text missing";
    
    // Clear previous options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Add new options
    if (question.options && Array.isArray(question.options)) {
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = `${String.fromCharCode(65 + index)}) ${option}`;
            optionElement.dataset.index = index;
            optionElement.onclick = () => selectOption(index);
            optionsContainer.appendChild(optionElement);
        });
    }
    
    // Reset UI state
    gameState.selectedAnswer = null;
    gameState.answered = false;
    gameState.powerupUsed = false;
    gameState.canUsePowerup = false;
    
    // Reset buttons
    const submitBtn = document.getElementById('submit-answer');
    submitBtn.disabled = true;
    submitBtn.style.display = 'flex';
    
    document.getElementById('next-btn').style.display = 'none';
    
    // Hide feedback
    const feedbackDiv = document.getElementById('answer-feedback');
    feedbackDiv.innerHTML = '<div class="powerup-placeholder"><i>💡</i><p>Answer the question to see feedback</p></div>';
    
    // Hide treasure section
    const treasureSection = document.querySelector('.treasure-section');
    if (treasureSection) {
        treasureSection.style.display = 'none';
    }
    
    // Reset treasure boxes
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.className = 'treasure-box';
        box.textContent = '🎁';
        box.onclick = () => openTreasureBox(box.dataset.box);
    });
    
    // Update player displays
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
        
        document.getElementById('answer-feedback').innerHTML = feedback;
        
        // Show treasure boxes
        document.querySelector('.treasure-section').style.display = 'block';
        
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
        
        document.getElementById('answer-feedback').innerHTML = feedback;
        
        // Disable treasure boxes for wrong answers
        document.querySelectorAll('.treasure-box').forEach(box => {
            box.classList.add('disabled');
            box.onclick = null;
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
    
    // Mark all boxes as opened
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.classList.add('opened');
        box.onclick = null;
    });
    
    // Random power-up
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    // Update selected box
    const selectedBox = document.querySelector(`.treasure-box[data-box="${boxNum}"]`);
    selectedBox.textContent = powerUp.icon;
    selectedBox.classList.add(`powerup-${powerUp.type}`);
    
    // Show power-up result
    const powerupResult = document.getElementById('powerup-result');
    powerupResult.innerHTML = `
        <div class="powerup-display">
            <div class="powerup-icon ${`powerup-${powerUp.type}`}" style="font-size: 4rem;">${powerUp.icon}</div>
            <h3 style="color: #fbbf24; margin: 10px 0;">${powerUp.name}</h3>
            <p style="color: #b8b8d1;">Power-up applied!</p>
        </div>
    `;
    
    // Apply power-up effect
    applyPowerUp(powerUp.type);
    
    // Show next button
    document.getElementById('next-btn').style.display = 'flex';
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
            message = `Double points! +${doublePoints}`;
            break;
            
        case 'half':
            const halfPoints = Math.floor(basePoints / 2);
            gameState.scores[playerIndex] += halfPoints;
            message = `Half points! +${halfPoints}`;
            break;
            
        case 'negative':
            gameState.scores[playerIndex] -= basePoints;
            message = `Negative points! -${basePoints}`;
            break;
            
        case 'switch':
            const temp = gameState.scores[playerIndex];
            gameState.scores[playerIndex] = gameState.scores[otherIndex];
            gameState.scores[otherIndex] = temp;
            message = `Scores switched!`;
            break;
            
        case 'bonus':
            gameState.scores[playerIndex] += 10;
            message = `Bonus +10 points!`;
            break;
    }
    
    // Ensure score doesn't go below 0
    if (gameState.scores[playerIndex] < 0) {
        gameState.scores[playerIndex] = 0;
    }
    
    updateScores();
    
    // Add power-up message to feedback
    const feedbackDiv = document.getElementById('answer-feedback');
    feedbackDiv.innerHTML += `<div style="color: #fbbf24; margin-top: 15px; font-weight: bold;">🎁 ${message}</div>`;
}

function updateScores() {
    document.getElementById('score1').textContent = gameState.scores[0];
    document.getElementById('score2').textContent = gameState.scores[1];
    
    // Also update final scores display
    document.getElementById('final-score1').textContent = gameState.scores[0];
    document.getElementById('final-score2').textContent = gameState.scores[1];
}

function updatePlayerTurn() {
    const player1 = document.getElementById('player1');
    const player2 = document.getElementById('player2');
    
    // Update active player
    if (gameState.currentPlayer === 1) {
        player1.classList.add('active');
        player2.classList.remove('active');
        document.getElementById('player1-turn').textContent = "Current Turn";
        document.getElementById('player2-turn').textContent = "";
    } else {
        player1.classList.remove('active');
        player2.classList.add('active');
        document.getElementById('player1-turn').textContent = "";
        document.getElementById('player2-turn').textContent = "Current Turn";
    }
}

function nextQuestion() {
    gameState.currentQuestion++;
    
    if (gameState.currentQuestion >= gameState.questions.length) {
        endGame();
        return;
    }
    
    // Switch player if not already switched
    if (gameState.answered) {
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    }
    
    loadQuestion();
}

function endGame() {
    // Determine winner
    let winnerName = '';
    let winnerMessage = '';
    
    if (gameState.scores[0] > gameState.scores[1]) {
        winnerName = 'Player 1';
        winnerMessage = 'Player 1 Wins! 🏆';
    } else if (gameState.scores[1] > gameState.scores[0]) {
        winnerName = 'Player 2';
        winnerMessage = 'Player 2 Wins! 🏆';
    } else {
        winnerName = 'Both Players';
        winnerMessage = "It's a Tie! 🤝";
    }
    
    // Update game over screen
    document.getElementById('winner-name').textContent = winnerName;
    document.getElementById('winner-message').textContent = winnerMessage;
    
    // Show game over screen
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('submit-answer').style.display = 'none';
}

// ========== QUIZ CATALOG DISPLAY ==========
async function loadQuizCatalog() {
    const catalogDiv = document.getElementById('quick-codes');
    
    if (!catalogDiv) return;
    
    try {
        // Filter out hidden worksheets
        const visibleQuizzes = QUIZ_CATALOG.filter(quiz => 
            !gameState.hiddenWorksheets.includes(quiz.code)
        );
        
        if (visibleQuizzes.length === 0) {
            catalogDiv.innerHTML = '<div style="color: #a0aec0; text-align: center; padding: 20px;">No quizzes available (all may be hidden)</div>';
            return;
        }
        
        // Group by level
        const levels = {
            'Primary': visibleQuizzes.filter(q => q.level === 'Primary'),
            'Lower Secondary': visibleQuizzes.filter(q => q.level === 'Lower Secondary'),
            'Upper Secondary': visibleQuizzes.filter(q => q.level === 'Upper Secondary')
        };
        
        let html = '<h3>📚 Available Quizzes</h3>';
        
        // Create catalog for each level
        Object.keys(levels).forEach(level => {
            const quizzes = levels[level];
            if (quizzes.length === 0) return;
            
            const levelColor = level === 'Primary' ? '#48bb78' : 
                             level === 'Lower Secondary' ? '#4cc9f0' : '#9f7aea';
            
            html += `
                <div class="level-section" style="margin-bottom: 25px;">
                    <div class="level-title" style="color: ${levelColor}; font-size: 1.3rem; margin-bottom: 15px; border-bottom: 2px solid ${levelColor}40; padding-bottom: 5px;">
                        ${level}
                    </div>
                    <div class="code-list">
            `;
            
            quizzes.forEach(quiz => {
                let icon = '📚';
                if (quiz.subject.includes('Math')) icon = '🧮';
                if (quiz.subject.includes('Science') && !quiz.subject.includes('Chem') && !quiz.subject.includes('Phys')) icon = '🔬';
                if (quiz.subject.includes('Chem')) icon = '🧪';
                if (quiz.subject.includes('Phys')) icon = '⚛️';
                
                html += `
                    <div class="code-item" data-code="${quiz.code}" 
                         onclick="selectQuizCode('${quiz.code}')"
                         style="cursor: pointer; transition: all 0.3s;">
                        <div style="font-weight: bold; color: #fbbf24; font-size: 1.1rem;">${icon} ${quiz.code}</div>
                        <div style="font-size: 0.9rem; margin-top: 5px;">${quiz.name}</div>
                        <div style="font-size: 0.8rem; color: #b8b8d1; margin-top: 3px;">${quiz.subject} • ${quiz.grade}</div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        catalogDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading catalog:', error);
        catalogDiv.innerHTML = '<div style="color: #f56565; text-align: center; padding: 20px;">Error loading quiz catalog</div>';
    }
}

function selectQuizCode(code) {
    const digits = code.replace(/-/g, '').split('');
    gameState.pin = [...digits];
    gameState.currentDigit = digits.length;
    updatePinDisplay();
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
    
    // Keep only last 5
    recent = recent.slice(0, 5);
    
    localStorage.setItem('recentQuizzes', JSON.stringify(recent));
    showRecentQuizzes();
}

function showRecentQuizzes() {
    const recent = JSON.parse(localStorage.getItem('recentQuizzes') || '[]');
    
    if (recent.length > 0) {
        const container = document.createElement('div');
        container.className = 'recent-quizzes';
        container.innerHTML = `
            <div style="color: #b8b8d1; margin: 30px 0 15px 0; font-weight: bold; font-size: 1.1rem;">
                ⏰ Recently Played
            </div>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                ${recent.map(quiz => {
                    let icon = '📚';
                    if (quiz.subject.includes('Math')) icon = '🧮';
                    if (quiz.subject.includes('Science') && !quiz.subject.includes('Chem') && !quiz.subject.includes('Phys')) icon = '🔬';
                    if (quiz.subject.includes('Chem')) icon = '🧪';
                    if (quiz.subject.includes('Phys')) icon = '⚛️';
                    
                    return `
                        <button class="code-item" data-code="${quiz.code}" 
                                style="background: rgba(76, 201, 240, 0.1); 
                                       border: 1px solid #4cc9f0; 
                                       border-radius: 10px; 
                                       padding: 12px; 
                                       color: white; 
                                       cursor: pointer;
                                       text-align: left;
                                       min-width: 180px;">
                            <div style="font-weight: bold; color: #fbbf24;">${icon} ${quiz.code}</div>
                            <div style="font-size: 0.9rem; margin-top: 5px;">${quiz.subject}</div>
                            <div style="font-size: 0.8rem; color: #b8b8d1; margin-top: 3px;">${quiz.grade}</div>
                        </button>
                    `;
                }).join('')}
            </div>
        `;
        
        // Insert after PIN display
        const pinDisplay = document.querySelector('.pin-keypad');
        if (pinDisplay) {
            const existingRecent = document.querySelector('.recent-quizzes');
            if (existingRecent) {
                existingRecent.remove();
            }
            pinDisplay.parentNode.insertBefore(container, pinDisplay.nextSibling);
        }
        
        // Add click handlers
        container.querySelectorAll('.code-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.dataset.code;
                const digits = code.replace(/-/g, '').split('');
                gameState.pin = [...digits];
                gameState.currentDigit = digits.length;
                updatePinDisplay();
            });
        });
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Quiz Game...');
    
    // Initialize PIN display
    updatePinDisplay();
    
    // Load quiz catalog
    loadQuizCatalog();
    
    // Show recent quizzes
    showRecentQuizzes();
    
    // ========== EVENT LISTENERS ==========
    // PIN buttons
    document.querySelectorAll('.pin-btn').forEach(btn => {
        btn.addEventListener('click', () => addDigit(btn.dataset.digit));
    });
    
    document.getElementById('clear-btn').addEventListener('click', clearPin);
    document.getElementById('submit-pin').addEventListener('click', submitPin);
    
    // Game buttons
    document.getElementById('submit-answer').addEventListener('click', submitAnswer);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('home-btn').addEventListener('click', () => {
        clearPin();
        showScreen('pin-screen');
    });
    
    // Error buttons
    document.getElementById('retry-btn')?.addEventListener('click', submitPin);
    document.getElementById('back-to-pin-error')?.addEventListener('click', () => {
        clearPin();
        showScreen('pin-screen');
    });
    
    // Game over buttons
    document.getElementById('restart-btn')?.addEventListener('click', initGame);
    document.getElementById('new-chapter-btn')?.addEventListener('click', () => {
        clearPin();
        showScreen('pin-screen');
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
    console.log('📁 YOUR FILES (NO HYPHENS):');
    console.log('- Questions/primary/math/341011.json');
    console.log('- Questions/primary/math/34101z.json');
    console.log('- Questions/upper-secondary/combined-chem/342091.json');
    console.log('- Questions/lower-secondary/math/201011.json');
    console.log('- Questions/lower-secondary/math/201012.json');
    console.log('- Questions/lower-secondary/math/201021.json');
    
    console.log('🎮 Test commands:');
    console.log('quizTools.testQuiz("341-01-1")');
    console.log('quizTools.testQuiz("342-09-1")');
    console.log('quizTools.testQuiz("201-01-1")');
});

// ========== DEBUG & ADMIN FUNCTIONS ==========
window.quizTools = {
    // List all expected files
    listFiles: function() {
        console.log('📁 YOUR FILE STRUCTURE (NO HYPHENS):');
        QUIZ_CATALOG.forEach(quiz => {
            console.log(`- Questions/${quiz.folder}/${quiz.filename}`);
        });
    },
    
    // Test specific quiz
    testQuiz: function(code) {
        console.log(`🧪 Testing: ${code}`);
        const digits = code.replace(/-/g, '').split('');
        gameState.pin = [...digits];
        gameState.currentDigit = digits.length;
        updatePinDisplay();
        setTimeout(() => submitPin(), 500);
    },
    
    // Check if file exists
    checkFile: async function(code) {
        const quizInfo = QUIZ_CATALOG.find(q => q.code === code);
        if (!quizInfo) {
            console.log(`❌ Code ${code} not in catalog`);
            return;
        }
        
        const filepath = `Questions/${quizInfo.folder}/${quizInfo.filename}`;
        console.log(`🔍 Checking: ${filepath}`);
        
        try {
            const response = await fetch(filepath);
            if (response.ok) {
                console.log(`✅ File exists: ${quizInfo.filename}`);
            } else {
                console.log(`❌ File NOT found: ${quizInfo.filename}`);
            }
        } catch (e) {
            console.log(`❌ Error accessing: ${filepath}`);
        }
    },
    
    // Show hidden worksheets
    showHidden: function() {
        console.log('🔒 Hidden Worksheets:', gameState.hiddenWorksheets);
    },
    
    // Clear all data
    resetAll: function() {
        if (confirm('Reset ALL game data? This cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
    }
};

// Quick test all your files
console.log('💡 Type quizTools.listFiles() to see your file structure');
</script>