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

// ========== QUIZ CATALOG (ONLY YOUR WORKING FILES) ==========
const QUIZ_CATALOG = [
    // YOUR COMBINED CHEMISTRY FILE (NO HYPHEN)
    { code: '342091', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Combined Science (Chemistry)', folder: 'upper-secondary/combined-chem', name: 'Sec 4 Combined Chemistry Chapter 9', filename: '342091.json' }
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

// ========== CORRECTED LOAD QUIZ FUNCTION ==========
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
        // Auto-discover quiz even if not in catalog
        console.log('📝 Auto-discovering quiz:', code);
        
        // Parse code to determine folder
        const levelCode = code[0]; // 1st digit
        const subjectCode = code[1]; // 2nd digit
        const gradeCode = code[2]; // 3rd digit
        
        let level = '', folder = '', subject = '', grade = '';
        
        // Determine level
        if (levelCode === '1') {
            level = 'Primary';
            grade = `P${gradeCode}`;
        } else if (levelCode === '2') {
            level = 'Lower Secondary';
            grade = `Sec ${gradeCode}`;
        } else if (levelCode === '3') {
            level = 'Upper Secondary';
            grade = `Sec ${parseInt(gradeCode) + 2}`; // 1=S3, 2=S4
        }
        
        // Determine subject and folder
        if (subjectCode === '0') {
            subject = 'Mathematics';
            folder = `${level.toLowerCase().replace(' ', '-')}/math`;
        } else if (subjectCode === '1') {
            subject = 'Science';
            folder = `${level.toLowerCase().replace(' ', '-')}/science`;
        } else if (subjectCode === '4') {
            subject = 'Combined Science (Chemistry)';
            folder = `${level.toLowerCase().replace(' ', '-')}/combined-chem`;
        } else if (subjectCode === '2') {
            subject = 'Physics';
            folder = `${level.toLowerCase().replace(' ', '-')}/physics`;
        }
        
        const quizInfo = {
            code: code,
            level: level,
            grade: grade,
            subject: subject,
            folder: folder,
            name: `${grade} ${subject} Chapter ${code.slice(3,5)}`,
            filename: `${code}.json`
        };
        
        console.log('📁 Auto-detected:', quizInfo);
        
        const filepath = `Questions/${folder}/${code}.json`;
        return await tryLoadFile(code, filepath, quizInfo);
    }
    
    const filepath = `Questions/${quizInfo.folder}/${quizInfo.filename}`;
    return await tryLoadFile(code, filepath, quizInfo);
}

async function tryLoadFile(code, filepath, quizInfo) {
    console.log('📂 Looking for file:', filepath);
    
    try {
        const response = await fetch(filepath);
        
        if (!response.ok) {
            throw new Error(`File not found: ${filepath}`);
        }
        
        const data = await response.json();
        console.log('✅ Successfully loaded:', filepath);
        
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
            error: `Failed to load ${code}.json: ${error.message}`,
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
        
    } catch (error) {
        console.error('Failed to load quiz:', error);
        document.getElementById('loading-text').textContent = `Error loading ${code}`;
        
        setTimeout(() => {
            document.getElementById('error-message').innerHTML = error.message;
            showScreen('error');
        }, 1500);
    }
}

// ========== GAME FUNCTIONS (FIXED TREASURE BOXES) ==========
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
            
            // Use event listener instead of onclick to prevent memory leaks
            optionElement.addEventListener('click', () => selectOption(index));
            
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
    const treasureSection = document.querySelector('.treasure-section');
    if (treasureSection) {
        treasureSection.style.display = 'none';
    }
    
    // Reset treasure boxes - CRITICAL FIX HERE
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.className = 'treasure-box';
        box.textContent = '🎁';
        box.style.background = 'linear-gradient(135deg, #fbbf24, #d97706)';
        box.style.cursor = 'pointer';
        box.style.pointerEvents = 'auto';
        
        // Remove old event listeners and add new ones
        box.replaceWith(box.cloneNode(true));
    });
    
    // Re-attach event listeners to treasure boxes
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.addEventListener('click', () => openTreasureBox(box.dataset.box));
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
    if (options[index]) {
        options[index].classList.add('selected');
        gameState.selectedAnswer = index;
        
        // Enable submit button
        document.getElementById('submit-answer').disabled = false;
    }
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
            opt.style.color = '#48bb78';
            opt.style.fontWeight = 'bold';
            opt.style.border = '2px solid #48bb78';
        } else if (index === gameState.selectedAnswer && !isCorrect) {
            opt.style.color = '#f56565';
            opt.style.textDecoration = 'line-through';
            opt.style.border = '2px solid #f56565';
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
        const treasureSection = document.querySelector('.treasure-section');
        if (treasureSection) {
            treasureSection.style.display = 'block';
        }
        
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
            box.style.pointerEvents = 'none';
            box.style.opacity = '0.5';
            box.style.cursor = 'not-allowed';
        });
        
        // Switch player for next question
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        updatePlayerTurn();
        
        // Show next button immediately
        document.getElementById('next-btn').style.display = 'flex';
    }
}

// ========== FIXED TREASURE BOX FUNCTION ==========
function openTreasureBox(boxNum) {
    if (!gameState.canUsePowerup || gameState.powerupUsed) return;
    
    gameState.powerupUsed = true;
    
    // Mark all boxes as opened
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.style.pointerEvents = 'none';
        box.style.opacity = '0.7';
        box.style.cursor = 'default';
    });
    
    // Random power-up
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    // Update selected box
    const selectedBox = document.querySelector(`.treasure-box[data-box="${boxNum}"]`);
    if (selectedBox) {
        selectedBox.textContent = powerUp.icon;
        selectedBox.style.background = 'linear-gradient(135deg, #9f7aea, #6b46c1)';
        selectedBox.style.transform = 'scale(1.1)';
        selectedBox.style.transition = 'all 0.3s';
        
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

// ========== NO CATALOG DISPLAY (HIDES ALL FILES) ==========
function loadQuizCatalog() {
    const catalogDiv = document.getElementById('quiz-catalog');
    
    if (!catalogDiv) return;
    
    // Don't show any catalog - just show instructions
    catalogDiv.innerHTML = `
        <h3>📚 Enter Quiz Code</h3>
        <div style="text-align: center; color: #a0aec0; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 10px; margin: 15px 0;">
            <p style="margin-bottom: 10px;">💡 Enter 6-digit code or use admin panel to manage files</p>
            <p style="color: #fbbf24; font-weight: bold;">Example: 342091 = Combined Chemistry Chapter 9</p>
        </div>
        <div style="color: #a0aec0; font-size: 0.9rem; text-align: center; margin-top: 15px;">
            Only your working files will appear here
        </div>
    `;
}

function selectQuiz(code) {
    const digits = code.split('');
    gameState.pin = [...digits];
    gameState.currentDigit = digits.length;
    updatePinDisplay();
    submitPin();
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
    
    // Load quiz catalog (won't show files)
    loadQuizCatalog();
    
    // Update hidden worksheets panel
    updateHiddenWorksheetsPanel();
    
    // Hide all those existing files automatically
    const filesToHide = ['341011', '34101z', '101011', '201011', '301011'];
    filesToHide.forEach(code => {
        if (!gameState.hiddenWorksheets.includes(code)) {
            gameState.hiddenWorksheets.push(code);
        }
    });
    localStorage.setItem('hiddenWorksheets', JSON.stringify(gameState.hiddenWorksheets));
    
    console.log('✅ Quiz Game Ready!');
    console.log('📁 Your file location: Questions/upper-secondary/combined-chem/342091.json');
    console.log('🔒 Hidden files:', gameState.hiddenWorksheets);
});

// ========== DEBUG & ADMIN FUNCTIONS ==========
window.quizTools = {
    // Test your Combined Chemistry quiz
    testQuiz: function() {
        console.log('🧪 Testing Combined Chemistry Quiz...');
        const code = '342091';
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
                },
                {
                    "question": "Sample question 2?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct": 1,
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
    
    // Show all available folders
    showFolders: function() {
        console.log('📁 Available Folders:');
        console.log('- Questions/primary/math/');
        console.log('- Questions/primary/science/');
        console.log('- Questions/lower-secondary/math/');
        console.log('- Questions/lower-secondary/science/');
        console.log('- Questions/upper-secondary/math/');
        console.log('- Questions/upper-secondary/combined-chem/');
        console.log('- Questions/upper-secondary/pure-chem/');
        console.log('- Questions/upper-secondary/pure-physics/');
    }
};

// Quick test command
console.log('💡 Type quizTools.testQuiz() to test your Combined Chemistry quiz');
</script>