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
    currentQuizCode: '',
    quizCatalog: [],
    currentQuizInfo: null
};

// ========== QUIZ CODE DECODER ==========
const SUBJECTS = {
    0: { name: 'Mathematics', folder: 'math' },
    1: { name: 'Science', folder: 'science' },
    2: { name: 'Combined Physics', folder: 'combined-physics' },
    3: { name: 'Pure Physics', folder: 'pure-physics' },
    4: { name: 'Combined Chemistry', folder: 'combined-chem' },
    5: { name: 'Pure Chemistry', folder: 'pure-chem' }
};

const LEVELS = {
    1: { name: 'Primary', folder: 'primary' },
    2: { name: 'Lower Secondary', folder: 'lower-secondary' },
    3: { name: 'Upper Secondary', folder: 'upper-secondary' }
};

function decodeQuizCode(code) {
    const digits = code.split('').map(d => parseInt(d));
    
    if (digits.length !== 6) return null;
    
    const [levelDigit, gradeTens, gradeOnes, chapterTens, chapterOnes, worksheet] = digits;
    
    // Validate digits
    if (levelDigit < 1 || levelDigit > 3) return null;
    
    // For Primary level, grade is tens digit (0-6), for Secondary, grade is tens digit (1-4)
    const grade = parseInt(`${gradeTens}${gradeOnes}`);
    
    const level = LEVELS[levelDigit];
    
    // Determine subject based on grade and level (for your files, we'll use default mapping)
    // Since your files are all Mathematics, we'll set subject to 0 (Mathematics)
    const subjectDigit = 0; // All your files are Mathematics
    const subject = SUBJECTS[subjectDigit];
    
    // Format: XXX-XX-X (for display)
    const formattedCode = `${levelDigit}${grade}${chapterTens}${chapterOnes}-${worksheet}`;
    
    // Build filename: XXXXXX.json (your actual file naming)
    const filename = `${levelDigit}${grade}${chapterTens}${chapterOnes}${worksheet}.json`;
    
    // Build path: Questions/[level]/[subject]/filename.json
    const filepath = `Questions/${level.folder}/${subject.folder}/${filename}`;
    
    // Grade label
    let gradeLabel = '';
    if (levelDigit === 1) {
        gradeLabel = `P${grade}`;
    } else {
        gradeLabel = `S${grade}`;
    }
    
    return {
        code: formattedCode,
        rawCode: code,
        filename: filename,
        filepath: filepath,
        level: level.name,
        subject: subject.name,
        grade: grade,
        gradeLabel: gradeLabel,
        chapter: parseInt(`${chapterTens}${chapterOnes}`),
        worksheet: worksheet,
        fullName: `${level.name} ${gradeLabel} ${subject.name} Chapter ${parseInt(`${chapterTens}${chapterOnes}`)} Worksheet ${worksheet}`
    };
}

// ========== FILE SCANNER ==========
async function scanForQuizzes() {
    console.log('🔍 Scanning for quiz files...');
    showScreen('loading-screen');
    
    const loadingMessage = document.getElementById('loading-message');
    const loadingDetails = document.getElementById('loading-details');
    const progressBar = document.getElementById('scan-progress');
    const foundCount = document.getElementById('quiz-found');
    
    gameState.quizCatalog = [];
    let foundQuizzes = 0;
    
    // Define all possible paths to scan
    const scanPaths = [
        { level: 1, levelName: 'primary', subjects: ['math'] },
        { level: 2, levelName: 'lower-secondary', subjects: ['math'] },
        { level: 3, levelName: 'upper-secondary', subjects: ['math'] }
    ];
    
    try {
        loadingMessage.textContent = 'Checking worksheets...';
        loadingDetails.textContent = 'Looking for CNY math worksheets...';
        
        // For demo purposes, we'll load from localStorage or default list
        // In a real server environment, you'd need server-side file listing
        await loadCatalogFromStorage();
        
        // Update progress to 100%
        progressBar.style.width = '100%';
        foundCount.textContent = gameState.quizCatalog.length;
        foundQuizzes = gameState.quizCatalog.length;
        
        // Show completion message
        setTimeout(() => {
            if (foundQuizzes === 0) {
                loadingMessage.textContent = 'No worksheets found';
                loadingDetails.textContent = 'Add JSON files to the Questions folder';
                setTimeout(() => {
                    showScreen('pin-screen');
                    updateCatalogDisplay();
                }, 2000);
            } else {
                loadingMessage.textContent = 'Happy CNY! Worksheets loaded!';
                loadingDetails.textContent = `Found ${foundQuizzes} worksheets with red packet bonuses`;
                setTimeout(() => {
                    showScreen('pin-screen');
                    updateCatalogDisplay();
                }, 1500);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Scan error:', error);
        loadingMessage.textContent = 'Scan failed';
        loadingDetails.textContent = error.message;
        
        setTimeout(() => {
            showScreen('pin-screen');
            updateCatalogDisplay();
        }, 2000);
    }
}

// ========== CATALOG MANAGEMENT ==========
async function loadCatalogFromStorage() {
    // Try to load from localStorage first
    const storedCatalog = localStorage.getItem('quizCatalog');
    if (storedCatalog) {
        gameState.quizCatalog = JSON.parse(storedCatalog);
        console.log(`📂 Loaded ${gameState.quizCatalog.length} quizzes from storage`);
        return;
    }
    
    // If no stored catalog, create from your actual files
    const defaultQuizzes = [
        { 
            code: '10501-7', 
            filename: '105017.json', 
            path: 'Questions/primary/math/105017.json', 
            name: 'P5 Math Chapter 1 Worksheet 7 - Guess and Check',
            level: 'Primary',
            grade: 'P5',
            subject: 'Mathematics',
            chapter: 1,
            worksheet: 7
        },
        { 
            code: '10501-8', 
            filename: '105018.json', 
            path: 'Questions/primary/math/105018.json', 
            name: 'P5 Math Chapter 1 Worksheet 8 - Common Multiples',
            level: 'Primary',
            grade: 'P5',
            subject: 'Mathematics',
            chapter: 1,
            worksheet: 8
        },
        { 
            code: '10501-9', 
            filename: '105019.json', 
            path: 'Questions/primary/math/105019.json', 
            name: 'P5 Math Chapter 1 Worksheet 9 - Equal Spending',
            level: 'Primary',
            grade: 'P5',
            subject: 'Mathematics',
            chapter: 1,
            worksheet: 9
        },
        { 
            code: '10502-1', 
            filename: '105021.json', 
            path: 'Questions/primary/math/105021.json', 
            name: 'P5 Math Chapter 2 Worksheet 1 - Fractions & Decimals',
            level: 'Primary',
            grade: 'P5',
            subject: 'Mathematics',
            chapter: 2,
            worksheet: 1
        },
        { 
            code: '10502-2', 
            filename: '105022.json', 
            path: 'Questions/primary/math/105022.json', 
            name: 'P5 Math Chapter 2 Worksheet 2 - Advanced Fractions',
            level: 'Primary',
            grade: 'P5',
            subject: 'Mathematics',
            chapter: 2,
            worksheet: 2
        },
        { 
            code: '10502-3', 
            filename: '105023.json', 
            path: 'Questions/primary/math/105023.json', 
            name: 'P5 Math Chapter 2 Worksheet 3 - Fraction of Quantity',
            level: 'Primary',
            grade: 'P5',
            subject: 'Mathematics',
            chapter: 2,
            worksheet: 3
        }
    ];
    
    gameState.quizCatalog = defaultQuizzes;
    localStorage.setItem('quizCatalog', JSON.stringify(defaultQuizzes));
}

function addQuizToCatalog(quizInfo) {
    // Check if quiz already exists
    const exists = gameState.quizCatalog.find(q => q.code === quizInfo.code);
    if (!exists) {
        gameState.quizCatalog.push({
            code: quizInfo.code,
            filename: quizInfo.filename,
            path: quizInfo.filepath,
            name: quizInfo.fullName,
            subject: quizInfo.subject,
            level: quizInfo.level,
            grade: quizInfo.gradeLabel
        });
        
        localStorage.setItem('quizCatalog', JSON.stringify(gameState.quizCatalog));
        updateCatalogDisplay();
        return true;
    }
    return false;
}

function updateCatalogDisplay() {
    const catalogEl = document.getElementById('quiz-catalog');
    const countEl = document.getElementById('quiz-count');
    
    if (gameState.quizCatalog.length === 0) {
        catalogEl.innerHTML = `
            <div class="no-quizzes">
                <i class="fas fa-search"></i>
                <h4>No worksheets found</h4>
                <p>Add JSON files to the Questions folder</p>
                <button id="refresh-catalog" class="btn small" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Refresh
                </button>
            </div>
        `;
        countEl.textContent = '0 worksheets';
        return;
    }
    
    // Sort quizzes by code
    const sortedQuizzes = [...gameState.quizCatalog].sort((a, b) => a.code.localeCompare(b.code));
    
    catalogEl.innerHTML = sortedQuizzes.map(quiz => {
        // Extract raw code from filename (remove .json)
        const rawCode = quiz.filename.replace('.json', '');
        return `
        <div class="quiz-item" data-code="${rawCode}">
            <div class="quiz-header">
                <span class="quiz-code">${quiz.code}</span>
                <span class="quiz-name">${quiz.name}</span>
            </div>
            <div class="quiz-details">
                <span class="quiz-level">${quiz.level}</span> • 
                <span class="quiz-grade">${quiz.grade}</span> • 
                <span class="quiz-subject">${quiz.subject}</span>
            </div>
        </div>
    `}).join('');
    
    countEl.textContent = `${gameState.quizCatalog.length} worksheets`;
    
    // Add click handlers
    document.querySelectorAll('.quiz-item').forEach(item => {
        item.addEventListener('click', function() {
            const code = this.dataset.code;
            setPinFromCode(code);
            setTimeout(submitPin, 500);
        });
    });
}

// ========== PIN FUNCTIONS ==========
function updatePinDisplay() {
    for (let i = 1; i <= 6; i++) {
        const digitElement = document.getElementById(`digit${i}`);
        const digitValue = gameState.pin[i - 1];
        
        if (digitElement) {
            const numberEl = digitElement.querySelector('.digit-number');
            if (numberEl) {
                numberEl.textContent = digitValue || '_';
            }
            digitElement.classList.toggle('filled', digitValue !== '');
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

function setPinFromCode(code) {
    clearPin();
    const digits = code.split('');
    digits.forEach(digit => {
        addDigit(digit);
    });
}

// ========== SCREEN MANAGEMENT ==========
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

// ========== LOAD QUIZ ==========
async function loadQuizByCode(code) {
    console.log(`🔍 Loading: ${code}`);
    
    // Decode the quiz code (for display purposes)
    const quizInfo = decodeQuizCode(code);
    
    // Build filename directly from the 6-digit code
    const filename = `${code}.json`;
    
    // For your specific files, we need to determine the correct path
    // Based on your files: 105017.json, 105018.json, etc.
    // Format: first digit = level (1=Primary), next two digits = grade (05=P5), 
    // next two digits = chapter (01,02), last digit = worksheet (7,8,9,1,2,3)
    
    let filepath = '';
    let level = 'primary';
    let subject = 'math';
    let gradeLabel = '';
    let chapter = 0;
    let worksheet = 0;
    let fullName = '';
    
    if (code.length === 6) {
        const levelDigit = parseInt(code[0]);
        const gradeNum = parseInt(code.substring(1, 3));
        const chapterNum = parseInt(code.substring(3, 5));
        const worksheetNum = parseInt(code[5]);
        
        chapter = chapterNum;
        worksheet = worksheetNum;
        
        if (levelDigit === 1) {
            level = 'primary';
            gradeLabel = `P${gradeNum}`;
        } else if (levelDigit === 2) {
            level = 'lower-secondary';
            gradeLabel = `S${gradeNum}`;
        } else {
            level = 'upper-secondary';
            gradeLabel = `S${gradeNum}`;
        }
        
        filepath = `Questions/${level}/${subject}/${filename}`;
        fullName = `${level} ${gradeLabel} Math Chapter ${chapterNum} Worksheet ${worksheetNum}`;
    } else {
        filepath = `Questions/primary/math/${filename}`;
        fullName = `Math Worksheet`;
    }
    
    // Store current quiz info
    gameState.currentQuizCode = code;
    gameState.currentQuizInfo = {
        code: code,
        filename: filename,
        filepath: filepath,
        fullName: fullName,
        gradeLabel: gradeLabel,
        subject: 'Mathematics',
        chapter: chapter,
        worksheet: worksheet
    };
    
    // Update loading display
    document.getElementById('loading-message').textContent = `Opening worksheet ${code}...`;
    
    try {
        // Try to load the file
        console.log(`Fetching from: ${filepath}`);
        const response = await fetch(filepath);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`File not found: ${filename}`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Worksheet loaded successfully', data);
        
        // Validate quiz data
        if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error('Invalid worksheet format: missing questions array');
        }
        
        if (data.questions.length === 0) {
            throw new Error('Worksheet is empty');
        }
        
        // Add to catalog if not already there
        const catalogEntry = {
            code: code.substring(0,5) + '-' + code[5], // Format as XXX-XX-X
            filename: filename,
            path: filepath,
            name: data.title || fullName,
            subject: data.subject || 'Mathematics',
            level: data.level || (code[0] === '1' ? 'Primary' : 'Secondary'),
            grade: data.grade || gradeLabel
        };
        
        const exists = gameState.quizCatalog.find(q => q.filename === filename);
        if (!exists) {
            gameState.quizCatalog.push(catalogEntry);
            localStorage.setItem('quizCatalog', JSON.stringify(gameState.quizCatalog));
        }
        
        return { 
            success: true, 
            data: data, 
            info: gameState.currentQuizInfo 
        };
        
    } catch (error) {
        console.error('❌ Failed to load worksheet:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// ========== SUBMIT PIN ==========
async function submitPin() {
    const pin = gameState.pin.join('');
    
    if (pin.length !== 6) {
        alert('Please enter all 6 digits');
        return;
    }
    
    showScreen('loading-screen');
    document.getElementById('loading-message').textContent = 'Opening worksheet...';
    
    try {
        const result = await loadQuizByCode(pin);
        
        if (!result.success) {
            let errorMsg = `<strong>Worksheet ${pin} not found</strong><br><br>`;
            errorMsg += `<div style="color: #666; font-size: 0.9rem;">`;
            errorMsg += `Error: ${result.error}</div>`;
            
            // Suggest correct filename format
            errorMsg += `<br><div style="background: #f0f9ff; padding: 15px; border-radius: 10px; margin-top: 15px;">`;
            errorMsg += `<strong>File format:</strong><br>`;
            errorMsg += `<code style="background: #e1f0ff; padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 5px;">`;
            errorMsg += `Questions/primary/math/${pin}.json</code>`;
            errorMsg += `</div>`;
            
            // Show available quizzes
            if (gameState.quizCatalog.length > 0) {
                errorMsg += `<br><strong>Available worksheets (${gameState.quizCatalog.length}):</strong><br>`;
                gameState.quizCatalog.slice(0, 5).forEach(q => {
                    errorMsg += `<div style="margin: 5px 0; padding: 8px; background: #f7fafc; border-radius: 5px;">
                        • <strong>${q.code}</strong>: ${q.name}
                    </div>`;
                });
                
                if (gameState.quizCatalog.length > 5) {
                    errorMsg += `<div style="color: #718096; margin-top: 5px;">
                        ... and ${gameState.quizCatalog.length - 5} more
                    </div>`;
                }
            }
            
            throw new Error(errorMsg);
        }
        
        // Store questions
        gameState.questions = result.data.questions;
        
        // Set quiz info
        document.getElementById('quiz-title').textContent = 
            result.data.title || result.info.fullName;
        document.getElementById('quiz-topic').textContent = 
            `Mathematics • ${result.info.gradeLabel || 'P5'}`;
        
        // Format code for display (XXX-XX-X)
        const displayCode = pin.substring(0,5) + '-' + pin[5];
        document.getElementById('current-quiz-code').textContent = displayCode;
        
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
        '<div class="feedback-placeholder"><i class="fas fa-lightbulb"></i> Select an answer</div>';
    
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
                <span>✅🧧</span>
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

function endGame() {
    const score1 = gameState.scores[0];
    const score2 = gameState.scores[1];
    
    let winnerMessage = '';
    let winnerName = '';
    
    if (score1 > score2) {
        winnerMessage = 'Player 1 Wins! 🏆🧧';
        winnerName = 'Player 1';
    } else if (score2 > score1) {
        winnerMessage = 'Player 2 Wins! 🏆🧧';
        winnerName = 'Player 2';
    } else {
        winnerMessage = "It's a Tie! 🤝🧧";
        winnerName = 'Both Players';
    }
    
    document.getElementById('winner-message').textContent = winnerMessage;
    document.getElementById('winner-name').textContent = winnerName;
    document.getElementById('final-score1').textContent = score1;
    document.getElementById('final-score2').textContent = score2;
    
    document.getElementById('game-over').style.display = 'block';
}

// ========== POWER-UPS ==========
const powerUps = [
    { icon: '🧧⚡', name: 'Double Points', type: 'double' },
    { icon: '🧧➗', name: 'Half Points', type: 'half' },
    { icon: '🧧➖', name: 'Negative Points', type: 'negative' },
    { icon: '🧧🔄', name: 'Switch Scores', type: 'switch' },
    { icon: '🧧✨', name: 'Bonus +10', type: 'bonus' }
];

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
            <p>Happy CNY! You got a red packet bonus!</p>
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
    feedbackDiv.innerHTML += `<div class="powerup-message">🧧 ${message}</div>`;
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🧧 Celebrate CNY with Math - Loaded!');
    
    // Initialize PIN display
    updatePinDisplay();
    
    // Start scanning for quizzes
    await loadCatalogFromStorage();
    updateCatalogDisplay();
    
    // ========== EVENT LISTENERS ==========
    // Number buttons
    document.querySelectorAll('.key[data-key]').forEach(button => {
        button.addEventListener('click', function() {
            const digit = this.getAttribute('data-key');
            addDigit(digit);
        });
    });
    
    // Clear button
    document.getElementById('clear-btn').addEventListener('click', clearPin);
    
    // Submit button
    document.getElementById('submit-pin').addEventListener('click', submitPin);
    
    // Scan button
    document.getElementById('scan-quizzes').addEventListener('click', scanForQuizzes);
    
    // Test button - update to one of your actual files
    document.getElementById('test-pin').addEventListener('click', function() {
        setPinFromCode('105017'); // 10501-7 - Guess and Check
        setTimeout(submitPin, 500);
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
    
    console.log('✅ Happy Chinese New Year!');
    console.log('📂 File format: 6-digit code.json (e.g., 105017.json)');
    console.log('📂 105017 = Primary/P5/Chapter 1/Worksheet 7');
});

// ========== DEBUG & DEVELOPMENT TOOLS ==========
window.quizTools = {
    // Test a specific quiz
    testQuiz: function(code) {
        setPinFromCode(code);
        setTimeout(submitPin, 500);
    },
    
    // Clear localStorage
    resetCatalog: function() {
        localStorage.removeItem('quizCatalog');
        gameState.quizCatalog = [];
        updateCatalogDisplay();
        console.log('Catalog reset');
    },
    
    // Show current state
    showState: function() {
        console.log('Current code:', gameState.pin);
        console.log('Catalog size:', gameState.quizCatalog.length);
        console.log('Catalog:', gameState.quizCatalog);
    }
};