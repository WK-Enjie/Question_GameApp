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

// ========== QUIZ CATALOG (NO HYPHENS - EXACT FILENAMES) ==========
const QUIZ_CATALOG = [
    // PRIMARY MATH (100-199)
    { code: '101011', level: 'Primary', grade: 'P1', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 1 Math Chapter 1', filename: '101011.json' },
    { code: '102011', level: 'Primary', grade: 'P2', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 2 Math Chapter 1', filename: '102011.json' },
    { code: '103011', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 3 Math Chapter 1', filename: '103011.json' },
    { code: '104011', level: 'Primary', grade: 'P4', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 4 Math Chapter 1', filename: '104011.json' },
    { code: '105011', level: 'Primary', grade: 'P5', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 5 Math Chapter 1', filename: '105011.json' },
    { code: '106011', level: 'Primary', grade: 'P6', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 6 Math Chapter 1', filename: '106011.json' },
    
    // Primary Science
    { code: '111011', level: 'Primary', grade: 'P1', subject: 'Science', folder: 'primary/science', name: 'Primary 1 Science Chapter 1', filename: '111011.json' },
    { code: '112011', level: 'Primary', grade: 'P2', subject: 'Science', folder: 'primary/science', name: 'Primary 2 Science Chapter 1', filename: '112011.json' },
    
    // YOUR EXISTING PRIMARY QUIZZES (NO HYPHENS)
    { code: '341011', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 3 Math Chapter 1 Worksheet 1', filename: '341011.json' },
    { code: '34101z', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 3 Math Chapter 1 Worksheet Z', filename: '34101z.json' },
    
    // LOWER SECONDARY (200-299)
    { code: '201011', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Mathematics', folder: 'lower-secondary/math', name: 'Secondary 1 Math Chapter 1', filename: '201011.json' },
    { code: '202011', level: 'Lower Secondary', grade: 'Sec 2', subject: 'Mathematics', folder: 'lower-secondary/math', name: 'Secondary 2 Math Chapter 1', filename: '202011.json' },
    
    // Lower Secondary Science
    { code: '211011', level: 'Lower Secondary', grade: 'Sec 1', subject: 'Science', folder: 'lower-secondary/science', name: 'Secondary 1 Science Chapter 1', filename: '211011.json' },
    { code: '212011', level: 'Lower Secondary', grade: 'Sec 2', subject: 'Science', folder: 'lower-secondary/science', name: 'Secondary 2 Science Chapter 1', filename: '212011.json' },
    
    // UPPER SECONDARY (300-399)
    { code: '301011', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Mathematics', folder: 'upper-secondary/math', name: 'Upper Secondary Math Chapter 1', filename: '301011.json' },
    { code: '302011', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Mathematics', folder: 'upper-secondary/math', name: 'Upper Secondary Math Chapter 1', filename: '302011.json' },
    
    // YOUR COMBINED CHEMISTRY FILE (NO HYPHEN)
    { code: '342091', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Combined Science (Chemistry)', folder: 'upper-secondary/combined-chem', name: 'Sec 4 Combined Chemistry Chapter 9', filename: '342091.json' },
    
    // Upper Secondary Pure Chemistry
    { code: '311011', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Pure Chemistry', folder: 'upper-secondary/pure-chem', name: 'Secondary 3 Pure Chemistry Chapter 1', filename: '311011.json' },
    { code: '312011', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Pure Chemistry', folder: 'upper-secondary/pure-chem', name: 'Secondary 4 Pure Chemistry Chapter 1', filename: '312011.json' },
    
    // Upper Secondary Pure Physics
    { code: '321011', level: 'Upper Secondary', grade: 'Sec 3', subject: 'Pure Physics', folder: 'upper-secondary/pure-physics', name: 'Secondary 3 Pure Physics Chapter 1', filename: '321011.json' },
    { code: '322011', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Pure Physics', folder: 'upper-secondary/pure-physics', name: 'Secondary 4 Pure Physics Chapter 1', filename: '322011.json' }
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
    document.getElementById(screenId + '-screen').classList.add('active');
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
            error: `Worksheet ${code} is hidden. Use admin panel to show it.`,
            hidden: true
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
    
    // CORRECTED: Use the exact filename from catalog
    const filename = quizInfo.filename;
    const filepath = `Questions/${quizInfo.folder}/${filename}`;
    
    console.log('📂 Looking for file:', filepath);
    console.log('📁 Folder:', quizInfo.folder);
    console.log('📄 Filename:', filename);
    
    try {
        const response = await fetch(filepath);
        
        if (!response.ok) {
            // Try alternative paths
            const altPaths = [
                filepath,
                `Questions/${quizInfo.folder}/${code}.json`, // Just code
                `./Questions/${quizInfo.folder}/${filename}`,
                `${code}.json`, // Root directory
                `Questions/${filename}` // Direct in Questions folder
            ];
            
            console.log('Trying alternative paths:', altPaths);
            
            for (const path of altPaths) {
                try {
                    const altResponse = await fetch(path);
                    if (altResponse.ok) {
                        const data = await altResponse.json();
                        console.log('✅ Found at:', path);
                        return { 
                            success: true, 
                            data: data, 
                            info: quizInfo,
                            path: path
                        };
                    }
                } catch (e) {
                    console.log('❌ Not found:', path);
                    continue;
                }
            }
            
            throw new Error(`File not found. Tried: ${filepath}`);
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
            expectedPath: filepath
        };
    }
}

// ========== SUBMIT PIN ==========
async function submitPin() {
    // Join pin array to string (no hyphens)
    const code = gameState.pin.join('');
    
    if (code.length !== 6) {
        alert('Please enter all 6 digits');
        return;
    }
    
    showScreen('loading');
    document.getElementById('loading-text').textContent = `Loading ${code}...`;
    
    try {
        const result = await loadQuizByCode(code);
        
        if (!result.success) {
            let errorMsg = `<strong>Worksheet ${code} not found</strong><br><br>`;
            errorMsg += `<div style="color: #a0aec0; font-size: 0.9rem;">`;
            
            if (result.hidden) {
                errorMsg += `This worksheet is hidden.<br>Use admin panel (⚙️) to show it.`;
            } else {
                errorMsg += `Expected location: ${result.expectedPath || 'unknown'}<br>`;
                errorMsg += `Error: ${result.error}</div>`;
            }
            
            // Find what quizzes ARE available
            const similarQuizzes = QUIZ_CATALOG.filter(q => 
                q.code.startsWith(code[0]) || // Same level
                q.code.includes(code.slice(0,3)) // Same subject
            ).slice(0, 5);
            
            if (similarQuizzes.length > 0) {
                errorMsg += `<br><div style="color: #fbbf24; margin-top: 15px;">Available quizzes (click to select):</div>`;
                similarQuizzes.forEach(q => {
                    const isHidden = gameState.hiddenWorksheets.includes(q.code);
                    errorMsg += `<div style="font-size: 0.9rem; margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.05); border-radius: 5px; cursor: pointer;" 
                               onclick="selectQuiz('${q.code}')">
                        • <strong>${q.code}</strong>: ${q.name} ${isHidden ? '🔒' : ''}
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
        document.getElementById('quiz-title').textContent = result.data.title || result.info.name;
        document.getElementById('quiz-topic').textContent = `${result.info.grade} ${result.info.subject}`;
        
        // Add topic if available
        if (result.data.topic) {
            document.getElementById('quiz-topic').textContent += ` | ${result.data.topic}`;
        }
        
        // Initialize game
        initGame();
        showScreen('game');
        
        // Save to recent quizzes
        saveToRecentQuizzes(code, result.data.title || result.info.name, result.info.subject, result.info.grade);
        
    } catch (error) {
        console.error('Failed to load quiz:', error);
        document.getElementById('loading-text').textContent = `Error loading ${code}`;
        
        setTimeout(() => {
            document.getElementById('error-message').innerHTML = error.message;
            showScreen('error');
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
    document.getElementById('feedback').innerHTML = '';
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
    document.getElementById('question').textContent = question.question || "Question text missing";
    
    // Clear previous options
    const optionsContainer = document.getElementById('options');
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
    submitBtn.textContent = 'Submit Answer';
    
    document.getElementById('next-btn').style.display = 'none';
    
    // Hide feedback
    document.getElementById('feedback').innerHTML = '<div style="color: #a0aec0;"><i>💡 Answer the question to see feedback</i></div>';
    
    // Hide treasure section
    document.querySelector('.treasure-section').style.display = 'none';
    
    // Reset treasure boxes
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.className = 'treasure-box';
        box.textContent = '🎁';
        box.style.background = 'linear-gradient(135deg, #fbbf24, #d97706)';
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
            opt.style.color = '#48bb78';
            opt.style.fontWeight = 'bold';
        } else if (index === gameState.selectedAnswer && !isCorrect) {
            opt.classList.add('incorrect');
            opt.style.color = '#f56565';
            opt.style.textDecoration = 'line-through';
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
        
        document.getElementById('feedback').innerHTML = feedback;
        
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
        
        document.getElementById('feedback').innerHTML = feedback;
        
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
    const feedbackDiv = document.getElementById('feedback');
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
    
    // Switch player if not already switched
    if (gameState.answered) {
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    }
    
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
}

// ========== HIDDEN WORKSHEETS FUNCTIONS ==========
function toggleAdminMenu() {
    const menu = document.getElementById('admin-menu');
    menu.classList.toggle('active');
}

function hideWorksheet() {
    const code = document.getElementById('hide-code')?.value.trim();
    if (!code) {
        alert('Please enter a worksheet code');
        return;
    }
    
    if (!gameState.hiddenWorksheets.includes(code)) {
        gameState.hiddenWorksheets.push(code);
        localStorage.setItem('hiddenWorksheets', JSON.stringify(gameState.hiddenWorksheets));
        updateHiddenWorksheetsPanel();
        loadQuizCatalog();
        alert(`Worksheet ${code} hidden successfully!`);
        if (document.getElementById('hide-code')) {
            document.getElementById('hide-code').value = '';
        }
    } else {
        alert(`Worksheet ${code} is already hidden.`);
    }
}

function showWorksheet() {
    const code = document.getElementById('show-code')?.value.trim();
    if (!code) {
        alert('Please enter a worksheet code');
        return;
    }
    
    const index = gameState.hiddenWorksheets.indexOf(code);
    if (index > -1) {
        gameState.hiddenWorksheets.splice(index, 1);
        localStorage.setItem('hiddenWorksheets', JSON.stringify(gameState.hiddenWorksheets));
        updateHiddenWorksheetsPanel();
        loadQuizCatalog();
        alert(`Worksheet ${code} is now visible!`);
        if (document.getElementById('show-code')) {
            document.getElementById('show-code').value = '';
        }
    } else {
        alert(`Worksheet ${code} is not hidden.`);
    }
}

function clearHiddenWorksheets() {
    if (confirm('Clear all hidden worksheets? They will all become visible.')) {
        gameState.hiddenWorksheets = [];
        localStorage.setItem('hiddenWorksheets', JSON.stringify(gameState.hiddenWorksheets));
        updateHiddenWorksheetsPanel();
        loadQuizCatalog();
        alert('All worksheets are now visible!');
    }
}

function updateHiddenWorksheetsPanel() {
    const panel = document.getElementById('hidden-worksheets-panel');
    const list = document.getElementById('hidden-code-list');
    
    if (!panel || !list) return;
    
    if (gameState.hiddenWorksheets.length > 0) {
        panel.style.display = 'block';
        list.innerHTML = gameState.hiddenWorksheets.map(code => `
            <div class="hidden-code-item" onclick="selectQuiz('${code}')">
                ${code}
            </div>
        `).join('');
    } else {
        panel.style.display = 'none';
    }
}

function toggleHiddenPanel() {
    const panel = document.getElementById('hidden-worksheets-panel');
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

// ========== QUIZ CATALOG DISPLAY ==========
async function loadQuizCatalog() {
    const catalogDiv = document.getElementById('quiz-catalog');
    
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
                    <div class="quiz-grid">
            `;
            
            quizzes.forEach(quiz => {
                let icon = '📚';
                if (quiz.subject.includes('Math')) icon = '🧮';
                if (quiz.subject.includes('Science') && !quiz.subject.includes('Chem') && !quiz.subject.includes('Phys')) icon = '🔬';
                if (quiz.subject.includes('Chem')) icon = '🧪';
                if (quiz.subject.includes('Phys')) icon = '⚛️';
                
                html += `
                    <div class="quiz-item" data-code="${quiz.code}" 
                         onclick="selectQuiz('${quiz.code}')"
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

function selectQuiz(code) {
    const digits = code.split('');
    gameState.pin = [...digits];
    gameState.currentDigit = digits.length;
    updatePinDisplay();
    submitPin();
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
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Quiz Game...');
    
    // Initialize PIN display
    updatePinDisplay();
    
    // Setup keypad
    document.querySelectorAll('.keypad-btn').forEach(btn => {
        btn.addEventListener('click', () => addDigit(btn.getAttribute('data-digit')));
    });
    
    // Clear button
    document.getElementById('clear-btn').addEventListener('click', clearPin);
    
    // Submit PIN button
    document.getElementById('submit-pin-btn').addEventListener('click', submitPin);
    
    // Home button
    document.getElementById('home-btn').addEventListener('click', () => {
        showScreen('pin');
        clearPin();
    });
    
    // Submit answer button
    document.getElementById('submit-answer').addEventListener('click', checkAnswer);
    
    // Next button
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    
    // Restart game
    document.getElementById('restart-game').addEventListener('click', initGame);
    
    // New chapter
    document.getElementById('new-chapter').addEventListener('click', () => {
        showScreen('pin');
        clearPin();
    });
    
    // Error buttons
    document.getElementById('retry-btn').addEventListener('click', submitPin);
    document.getElementById('back-btn').addEventListener('click', () => {
        showScreen('pin');
        clearPin();
    });
    
    // Admin buttons
    const adminHideBtn = document.getElementById('admin-hide-btn');
    const adminShowBtn = document.getElementById('admin-show-btn');
    const adminClearBtn = document.getElementById('admin-clear-btn');
    
    if (adminHideBtn) adminHideBtn.addEventListener('click', hideWorksheet);
    if (adminShowBtn) adminShowBtn.addEventListener('click', showWorksheet);
    if (adminClearBtn) adminClearBtn.addEventListener('click', clearHiddenWorksheets);
    
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
    
    // Load quiz catalog
    loadQuizCatalog();
    
    // Update hidden worksheets panel
    updateHiddenWorksheetsPanel();
    
    console.log('✅ Quiz Game Ready!');
    console.log('📁 File Structure (no hyphens):');
    console.log('- Questions/primary/math/341011.json');
    console.log('- Questions/primary/math/34101z.json');
    console.log('- Questions/upper-secondary/combined-chem/342091.json (YOUR FILE)');
    
    // Hide existing files by default (you mentioned this)
    if (gameState.hiddenWorksheets.length === 0) {
        // Hide the existing files mentioned in your error
        const filesToHide = ['342091', '341011', '34101z'];
        filesToHide.forEach(code => {
            if (!gameState.hiddenWorksheets.includes(code)) {
                gameState.hiddenWorksheets.push(code);
            }
        });
        localStorage.setItem('hiddenWorksheets', JSON.stringify(gameState.hiddenWorksheets));
        updateHiddenWorksheetsPanel();
        loadQuizCatalog();
        console.log('📁 Hidden existing files by default');
    }
});

// ========== DEBUG & ADMIN FUNCTIONS ==========
window.quizTools = {
    // List all expected files
    listFiles: function() {
        console.log('📁 Expected File Structure (No Hyphens):');
        QUIZ_CATALOG.forEach(quiz => {
            console.log(`- Questions/${quiz.folder}/${quiz.filename}`);
        });
    },
    
    // Test specific quiz
    testQuiz: function(code) {
        console.log(`🧪 Testing: ${code}`);
        const digits = code.split('');
        gameState.pin = [...digits];
        gameState.currentDigit = digits.length;
        updatePinDisplay();
        setTimeout(() => submitPin(), 500);
    },
    
    // Create template for new quiz
    createTemplate: function(code, subject, grade) {
        const template = {
            "title": `${grade} ${subject}`,
            "topic": "Chapter 1",
            "subject": subject,
            "grade": grade,
            "questions": [
                {
                    "question": "Sample question 1?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct": 0,
                    "points": 10,
                    "explanation": "This is the correct answer because..."
                }
            ]
        };
        
        console.log(`📄 Template for ${code}:`);
        console.log(JSON.stringify(template, null, 2));
        console.log(`💾 Save as: Questions/.../${code}.json`);
    },
    
    // Show hidden worksheets
    showHidden: function() {
        console.log('🔒 Hidden Worksheets:', gameState.hiddenWorksheets);
    },
    
    // Clear all data
    resetAll: function() {
        if (confirm('Reset ALL game data? This cannot be undone.')) {
            localStorage.clear();
            location.reload