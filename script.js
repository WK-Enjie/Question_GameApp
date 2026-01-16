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

// ========== QUIZ CATALOG (Updated with correct folder paths) ==========
const QUIZ_CATALOG = [
    // PRIMARY (100-199)
    { code: '101-01-1', level: 'Primary', grade: 'P1', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 1 Mathematics Chapter 1' },
    { code: '102-01-1', level: 'Primary', grade: 'P2', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 2 Mathematics Chapter 1' },
    { code: '103-01-1', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 3 Mathematics Chapter 1' },
    { code: '104-01-1', level: 'Primary', grade: 'P4', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 4 Mathematics Chapter 1' },
    { code: '105-01-1', level: 'Primary', grade: 'P5', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 5 Mathematics Chapter 1' },
    { code: '106-01-1', level: 'Primary', grade: 'P6', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 6 Mathematics Chapter 1' },
    
    // Primary Science
    { code: '111-01-1', level: 'Primary', grade: 'P1', subject: 'Science', folder: 'primary/science', name: 'Primary 1 Science Chapter 1' },
    { code: '112-01-1', level: 'Primary', grade: 'P2', subject: 'Science', folder: 'primary/science', name: 'Primary 2 Science Chapter 1' },
    
    // YOUR EXISTING QUIZZES (with correct codes)
    { code: '341-01-1', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 3 Math Chapter 1 Worksheet 1' },
    { code: '341-01-z', level: 'Primary', grade: 'P3', subject: 'Mathematics', folder: 'primary/math', name: 'Primary 3 Math Chapter 1 Worksheet Z' },
    
    // UPPER SECONDARY COMBINED CHEMISTRY (your file)
    { code: '342-09-1', level: 'Upper Secondary', grade: 'Sec 4', subject: 'Combined Science (Chemistry)', folder: 'upper-secondary/combined-chem', name: 'Sec 4 Combined Chemistry Chapter 9' }
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

// ========== PIN FUNCTIONS (Updated for 6 digits) ==========
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

// ========== CORRECTED LOAD QUIZ FUNCTION (with hyphen support) ==========
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
    
    // CORRECT: Use hyphenated filename directly
    const filename = `${code}.json`;
    const filepath = `Questions/${quizInfo.folder}/${filename}`;
    
    console.log('📂 Looking for file:', filepath);
    
    try {
        const response = await fetch(filepath);
        
        if (!response.ok) {
            // Try alternative paths
            const altPaths = [
                `Questions/${quizInfo.folder}/${code.replace(/-/g, '')}.json`, // No hyphens
                `./Questions/${quizInfo.folder}/${filename}`,
                `../Questions/${quizInfo.folder}/${filename}`
            ];
            
            let found = false;
            let data = null;
            
            for (const path of altPaths) {
                try {
                    console.log('Trying alternative:', path);
                    const altResponse = await fetch(path);
                    if (altResponse.ok) {
                        data = await altResponse.json();
                        console.log('✓ Found at:', path);
                        found = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!found) {
                throw new Error(`File not found. Tried: ${filepath} and alternatives`);
            }
            
            return { 
                success: true, 
                data: data, 
                info: quizInfo 
            };
        }
        
        const data = await response.json();
        console.log('✅ Successfully loaded:', filename);
        
        return { 
            success: true, 
            data: data, 
            info: quizInfo 
        };
        
    } catch (error) {
        console.error('❌ Error loading quiz:', error);
        return { 
            success: false, 
            error: `Failed to load ${filename}: ${error.message}` 
        };
    }
}

// ========== SUBMIT PIN (Updated for 6-digit codes) ==========
async function submitPin() {
    // Join pin array to string
    const pin = gameState.pin.join('');
    
    if (pin.length !== 6) {
        alert('Please enter all 6 digits');
        return;
    }
    
    // Format as XXX-XX-X based on position
    const formattedPin = `${pin.slice(0,3)}-${pin.slice(3,5)}-${pin.slice(5)}`;
    
    showScreen('loading-screen');
    document.getElementById('loading-text').textContent = `Loading ${formattedPin}...`;
    
    try {
        const result = await loadQuizByCode(formattedPin);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // Store questions
        if (result.data.questions && Array.isArray(result.data.questions)) {
            gameState.questions = result.data.questions;
        } else if (Array.isArray(result.data)) {
            gameState.questions = result.data;
        } else {
            throw new Error('Invalid quiz format');
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
        
        let errorHTML = `<strong>Worksheet not found</strong><br><br>`;
        errorHTML += `<div style="color: #a0aec0; font-size: 0.9rem;">`;
        errorHTML += `Code: ${pin.slice(0,3)}-${pin.slice(3,5)}-${pin.slice(5)}<br>`;
        errorHTML += `Expected file: Questions/.../${pin.slice(0,3)}-${pin.slice(3,5)}-${pin.slice(5)}.json<br>`;
        errorHTML += `Error: ${error.message}</div>`;
        
        // Show similar quizzes
        const similarQuizzes = QUIZ_CATALOG.filter(q => 
            q.code[0] === pin[0]
        ).slice(0, 5);
        
        if (similarQuizzes.length > 0) {
            errorHTML += `<br><div style="color: #fbbf24;">Available ${similarQuizzes[0].level} quizzes:</div>`;
            similarQuizzes.forEach(q => {
                errorHTML += `<div style="font-size: 0.9rem;">• <strong>${q.code}</strong>: ${q.grade} ${q.subject}</div>`;
            });
        }
        
        document.getElementById('error-message').innerHTML = errorHTML;
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
    
    if (!question) {
        console.error('No question found at index:', gameState.currentQuestion);
        return;
    }
    
    document.getElementById('current-q').textContent = gameState.currentQuestion + 1;
    document.getElementById('total-q').textContent = gameState.questions.length;
    document.getElementById('points').textContent = question.points || 10;
    document.getElementById('question').textContent = question.question;
    
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    if (question.options && Array.isArray(question.options)) {
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.onclick = () => selectOption(index);
            optionsContainer.appendChild(optionElement);
        });
    }
    
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
    
    // Hide treasure section
    const treasureSection = document.querySelector('.treasure-section');
    if (treasureSection) {
        treasureSection.style.display = 'none';
    }
    
    // Reset treasure boxes
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.textContent = '🎁';
        box.style.background = 'linear-gradient(135deg, #fbbf24, #d97706)';
        box.onclick = () => openTreasureBox(box.dataset.box);
    });
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
        gameState.scores[gameState.currentPlayer - 1] += question.points || 10;
        updateScores();
        
        let feedback = `<div style="color: #48bb78; font-weight: bold; margin-bottom: 10px;">
            ✓ Correct! +${question.points || 10} points
        </div>`;
        
        if (question.explanation) {
            feedback += `<div style="color: #a0aec0;">💡 ${question.explanation}</div>`;
        }
        
        document.getElementById('feedback').innerHTML = feedback;
        
        // Show treasure boxes
        const treasureSection = document.querySelector('.treasure-section');
        if (treasureSection) {
            treasureSection.style.display = 'block';
        }
        
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
    
    // Apply power-up
    applyPowerUp(powerUp.type);
    
    // Show next button
    document.getElementById('next-btn').style.display = 'block';
}

function applyPowerUp(type) {
    const playerIndex = gameState.currentPlayer - 1;
    const otherIndex = playerIndex === 0 ? 1 : 0;
    const question = gameState.questions[gameState.currentQuestion];
    let points = question.points || 10;
    
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

// ========== HIDDEN WORKSHEETS FUNCTIONS ==========
function hideWorksheet() {
    const code = document.getElementById('hide-code').value.trim();
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
        document.getElementById('hide-code').value = '';
    } else {
        alert(`Worksheet ${code} is already hidden.`);
    }
}

function showWorksheet() {
    const code = document.getElementById('show-code').value.trim();
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
        document.getElementById('show-code').value = '';
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
    
    if (gameState.hiddenWorksheets.length > 0) {
        panel.style.display = 'block';
        list.innerHTML = gameState.hiddenWorksheets.map(code => `
            <div class="hidden-code-item" onclick="useHiddenCode('${code}')">
                ${code}
            </div>
        `).join('');
    } else {
        panel.style.display = 'none';
    }
}

function useHiddenCode(code) {
    // Split code into digits for PIN display
    const digits = code.replace(/-/g, '').split('');
    gameState.pin = [...digits];
    gameState.currentDigit = digits.length;
    updatePinDisplay();
}

function toggleHiddenPanel() {
    const panel = document.getElementById('hidden-worksheets-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
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
    const container = document.getElementById('recent-quizzes-container');
    
    if (!container) return;
    
    if (recent.length > 0) {
        container.innerHTML = `
            <div class="recent-quizzes">
                <div style="color: #a0aec0; margin: 20px 0 10px 0; font-weight: bold;">
                    ⏰ Recently Played
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px;">
                    ${recent.map(quiz => {
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
            </div>
        `;
        
        // Add click handlers
        container.querySelectorAll('.recent-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.dataset.code;
                const digits = code.replace(/-/g, '').split('');
                gameState.pin = [...digits];
                gameState.currentDigit = digits.length;
                updatePinDisplay();
            });
        });
    } else {
        container.innerHTML = '';
    }
}

// ========== QUIZ CATALOG DISPLAY ==========
async function loadQuizCatalog() {
    const catalogDiv = document.getElementById('quiz-catalog');
    
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
            
            const levelContainer = document.createElement('div');
            levelContainer.style.marginBottom = '20px';
            
            // Level header
            const levelHeader = document.createElement('div');
            levelHeader.className = 'level-title';
            levelHeader.style.color = level === 'Primary' ? '#48bb78' : 
                                     level === 'Lower Secondary' ? '#4cc9f0' : '#9f7aea';
            levelHeader.textContent = level;
            levelContainer.appendChild(levelHeader);
            
            // Create grid for quizzes
            const grid = document.createElement('div');
            grid.className = 'quiz-grid';
            
            // Add each quiz
            quizzes.forEach(quiz => {
                let icon = '📚';
                if (quiz.subject.includes('Math')) icon = '🧮';
                if (quiz.subject.includes('Science') && !quiz.subject.includes('Chem') && !quiz.subject.includes('Phys')) icon = '🔬';
                if (quiz.subject.includes('Chem')) icon = '🧪';
                if (quiz.subject.includes('Phys')) icon = '⚛️';
                
                const quizItem = document.createElement('div');
                quizItem.className = 'quiz-item';
                quizItem.dataset.code = quiz.code;
                quizItem.innerHTML = `
                    <div class="quiz-code">${icon} ${quiz.code}</div>
                    <div class="quiz-name">${quiz.name}</div>
                    <div class="quiz-meta">${quiz.subject} • ${quiz.grade}</div>
                `;
                
                quizItem.addEventListener('click', () => {
                    const digits = quiz.code.replace(/-/g, '').split('');
                    gameState.pin = [...digits];
                    gameState.currentDigit = digits.length;
                    updatePinDisplay();
                });
                
                grid.appendChild(quizItem);
            });
            
            levelContainer.appendChild(grid);
            html += levelContainer.outerHTML;
        });
        
        catalogDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading catalog:', error);
        catalogDiv.innerHTML = '<div style="color: #f56565; text-align: center; padding: 20px;">Error loading quiz catalog</div>';
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize PIN display
    updatePinDisplay();
    
    // Load quiz catalog
    loadQuizCatalog();
    
    // Show recent quizzes
    showRecentQuizzes();
    
    // Update hidden worksheets panel
    updateHiddenWorksheetsPanel();
    
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
        gameState.pin = ['', '', '', '', '', ''];
        gameState.currentDigit = 0;
        showScreen('pin-screen');
    });
    
    // Error buttons
    document.getElementById('retry-btn').addEventListener('click', submitPin);
    document.getElementById('back-btn').addEventListener('click', () => {
        gameState.pin = ['', '', '', '', '', ''];
        gameState.currentDigit = 0;
        showScreen('pin-screen');
    });
    
    // Game over buttons
    document.getElementById('restart-game').addEventListener('click', initGame);
    document.getElementById('new-chapter').addEventListener('click', () => {
        gameState.pin = ['', '', '', '', '', ''];
        gameState.currentDigit = 0;
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
    
    console.log('✅ Singapore Curriculum Quiz Game Ready!');
    console.log('📁 Expected files:');
    console.log('- Questions/primary/math/341-01-1.json');
    console.log('- Questions/primary/math/341-01-z.json');
    console.log('- Questions/upper-secondary/combined-chem/342-09-1.json');
});

// ========== ADMIN TOOLS ==========
window.quizAdmin = {
    // Generate template
    generateTemplate: function(code, subject, grade, level) {
        const template = {
            "title": `${grade} ${subject}`,
            "topic": `${subject} Fundamentals`,
            "subject": subject,
            "level": level,
            "grade": grade,
            "questions": [
                {
                    "question": "Sample question 1?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct": 0,
                    "points": 10,
                    "explanation": "Explanation for correct answer."
                }
            ]
        };
        
        console.log(`=== TEMPLATE FOR ${code} ===`);
        console.log(JSON.stringify(template, null, 2));
        console.log(`Save as: Questions/.../${code}.json`);
    },
    
    // List all quizzes
    listQuizzes: function() {
        console.log('=== AVAILABLE QUIZZES ===');
        QUIZ_CATALOG.forEach(quiz => {
            console.log(`${quiz.code}: ${quiz.name} (${quiz.folder})`);
        });
    },
    
    // Test a quiz
    testQuiz: function(code) {
        console.log(`Testing ${code}...`);
        const digits = code.replace(/-/g, '').split('');
        gameState.pin = [...digits];
        gameState.currentDigit = digits.length;
        updatePinDisplay();
        submitPin();
    },
    
    // Fix filename
    fixFilename: function(oldName, newName) {
        console.log(`Rename: ${oldName} → ${newName}`);
        console.log('You need to manually rename the file on your server.');
    }
};
</script>