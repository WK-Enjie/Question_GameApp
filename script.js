// ========== GAME STATE ==========
const gameState = {
    pin: ['', '', '', '', '', ''],
    currentDigit: 0,
    questions: [],
    currentQuestion: 0,
    currentPlayer: 1,
    scores: [0, 0],
    targetScore: 21,
    roundScores: [0, 0],
    selectedAnswer: null,
    answered: false,
    powerupUsed: false,
    canUsePowerup: false,
    coins: 0,
    riskMode: false,
    currentQuizCode: '',
    currentQuizInfo: null,
    quizCatalog: [],
    loadedFromUpload: false
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

    const [levelDigit, subjectDigit, gradeDigit, chap10, chap1, worksheet] = digits;

    // Validate digits
    if (levelDigit < 1 || levelDigit > 3) return null;
    if (subjectDigit < 0 || subjectDigit > 5) return null;

    const level = LEVELS[levelDigit];
    const subject = SUBJECTS[subjectDigit];

    // Format: XXX-XX-X
    const formattedCode = `${levelDigit}${subjectDigit}${gradeDigit}-${chap10}${chap1}-${worksheet}`;

    // Build filename: XXXXXX.json (no hyphens)
    const filename = `${levelDigit}${subjectDigit}${gradeDigit}${chap10}${chap1}${worksheet}.json`;

    // Build path: Questions/[level]/[subject]/filename.json
    const filepath = `Questions/${level.folder}/${subject.folder}/${filename}`;

    // Grade label
    let gradeLabel = '';
    if (levelDigit === 1) {
        gradeLabel = `P${gradeDigit}`;
    } else {
        gradeLabel = `S${gradeDigit}`;
    }

    return {
        code: formattedCode,
        rawCode: code,
        filename: filename,
        filepath: filepath,
        level: level.name,
        subject: subject.name,
        grade: gradeDigit,
        gradeLabel: gradeLabel,
        chapter: parseInt(`${chap10}${chap1}`),
        worksheet: worksheet,
        fullName: `${level.name} ${gradeLabel} ${subject.name} Chapter ${parseInt(`${chap10}${chap1}`)} Worksheet ${worksheet}`
    };
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 CNY Blackjack Quiz Game Initialized');
    
    // Initialize PIN display
    updatePinDisplay();

    // Load catalog from storage
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

    // Test button
    document.getElementById('test-pin').addEventListener('click', function() {
        setPinFromCode('342091'); // 342-09-1
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

    // Blackjack buttons
    document.getElementById('hit-btn').addEventListener('click', hitMe);
    document.getElementById('stand-btn').addEventListener('click', stand);

    // File upload
    document.getElementById('json-upload').addEventListener('change', handleFileUpload);

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

    console.log('✅ All systems ready');
    console.log('💡 Add JSON quiz files to the Questions folder');
    console.log('📂 File naming: 3-digit level/subject/grade + 2-digit chapter + 1-digit worksheet');
    console.log('📂 Example: 342091.json = 3(upper sec)4(comb chem)2(S4)09(chapter9)1(worksheet1)');
});

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
    
    // Decode the quiz code
    const quizInfo = decodeQuizCode(code);
    if (!quizInfo) {
        return { 
            success: false, 
            error: `Invalid quiz code format: ${code}` 
        };
    }

    // Store current quiz code
    gameState.currentQuizCode = quizInfo.code;
    gameState.currentQuizInfo = quizInfo;

    // Update loading display
    document.getElementById('loading-message').textContent = `Loading ${quizInfo.code}...`;

    try {
        // Try to load the file
        const response = await fetch(quizInfo.filepath);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`File not found: ${quizInfo.filename}`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Quiz loaded successfully');
        
        // Validate quiz data
        if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error('Invalid quiz format: Missing questions array');
        }
        
        if (data.questions.length === 0) {
            throw new Error('Quiz file is empty');
        }
        
        // Add to catalog if not already there
        addQuizToCatalog(quizInfo);
        
        return { 
            success: true, 
            data: data, 
            info: quizInfo 
        };
        
    } catch (error) {
        console.error('❌ Error loading quiz:', error);
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
    document.getElementById('loading-message').textContent = 'Loading quiz...';

    try {
        const result = await loadQuizByCode(pin);
        
        if (!result.success) {
            // Check if this might be a new file not in catalog
            const quizInfo = decodeQuizCode(pin);
            let errorMsg = `<strong>Worksheet ${quizInfo?.code || pin} not found</strong><br><br>`;
            errorMsg += `<div style="color: #a0aec0; font-size: 0.9rem;">`;
            errorMsg += `Error: ${result.error}</div>`;
            
            // Suggest creating the file
            if (quizInfo && result.error.includes('not found')) {
                errorMsg += `<br><div style="background: rgba(214, 158, 46, 0.1); padding: 15px; border-radius: 10px; margin-top: 15px;">`;
                errorMsg += `<strong>Suggested file location:</strong><br>`;
                errorMsg += `<code style="background: rgba(214, 158, 46, 0.2); padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 5px;">`;
                errorMsg += `${quizInfo.filepath}</code>`;
                errorMsg += `</div>`;
            }
            
            // Show available quizzes
            if (gameState.quizCatalog.length > 0) {
                errorMsg += `<br><strong>Available quizzes (${gameState.quizCatalog.length}):</strong><br>`;
                gameState.quizCatalog.slice(0, 5).forEach(q => {
                    errorMsg += `<div style="margin: 5px 0; padding: 8px; background: rgba(45, 55, 72, 0.5); border-radius: 5px;">`;
                    errorMsg += `• <strong>${q.code}</strong>: ${q.name}`;
                    errorMsg += `</div>`;
                });
                
                if (gameState.quizCatalog.length > 5) {
                    errorMsg += `<div style="color: #718096; margin-top: 5px;">`;
                    errorMsg += `... and ${gameState.quizCatalog.length - 5} more`;
                    errorMsg += `</div>`;
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
            `${result.info.subject} • ${result.info.gradeLabel}`;
        document.getElementById('current-quiz-code').textContent = 
            result.info.code;
        document.getElementById('current-quiz-path').textContent = 
            result.info.filepath;
        
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

// ========== FILE UPLOAD ==========
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const statusEl = document.getElementById('upload-status');
    statusEl.textContent = 'Loading quiz...';
    statusEl.className = 'upload-status';
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const quizData = JSON.parse(e.target.result);
            gameState.loadedFromUpload = true;
            
            // Set quiz info from uploaded data
            gameState.questions = quizData.questions || [];
            document.getElementById('quiz-title').textContent = quizData.title || 'Uploaded Quiz';
            document.getElementById('quiz-topic').textContent = `${quizData.subject || 'General'} • ${quizData.level || 'All Levels'}`;
            document.getElementById('current-quiz-code').textContent = 'UPLOAD';
            document.getElementById('current-quiz-path').textContent = `Uploaded: ${file.name}`;
            
            // Initialize game
            initGame();
            showScreen('game-screen');
            
            statusEl.textContent = '✅ Quiz loaded successfully!';
            statusEl.className = 'upload-status success';
        } catch (error) {
            statusEl.textContent = `❌ Error: ${error.message}`;
            statusEl.className = 'upload-status error';
            console.error('Error parsing JSON:', error);
        }
    };
    reader.readAsText(file);
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
    
    // Default quizzes for testing
    const defaultQuizzes = [
        { code: '101-01-1', filename: '101011.json', path: 'Questions/primary/math/101011.json', name: 'P1 Math Chapter 1', subject: 'Mathematics', level: 'Primary', grade: 'P1' },
        { code: '201-01-1', filename: '201011.json', path: 'Questions/lower-secondary/math/201011.json', name: 'Sec 1 Math Chapter 1', subject: 'Mathematics', level: 'Lower Secondary', grade: 'S1' },
        { code: '201-01-2', filename: '201012.json', path: 'Questions/lower-secondary/math/201012.json', name: 'Sec 1 Math Chapter 1 Worksheet 2', subject: 'Mathematics', level: 'Lower Secondary', grade: 'S1' },
        { code: '342-09-1', filename: '342091.json', path: 'Questions/upper-secondary/combined-chem/342091.json', name: 'Sec 4 Combined Chemistry Chapter 9', subject: 'Combined Chemistry', level: 'Upper Secondary', grade: 'S4' }
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
                <h4>No quizzes found</h4>
                <p>Add JSON files to the Questions folder</p>
                <button id="refresh-catalog" class="btn secondary">
                    <i class="fas fa-redo"></i> Refresh
                </button>
            </div>
        `;
        countEl.textContent = '0 quizzes';
        return;
    }

    // Sort quizzes by code
    const sortedQuizzes = [...gameState.quizCatalog].sort((a, b) => a.code.localeCompare(b.code));

    catalogEl.innerHTML = sortedQuizzes.map(quiz => `
        <div class="quiz-item" data-code="${quiz.code.replace(/-/g, '')}">
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
    `).join('');

    countEl.textContent = `${gameState.quizCatalog.length} quizzes`;

    // Add click handlers
    document.querySelectorAll('.quiz-item').forEach(item => {
        item.addEventListener('click', function() {
            const code = this.dataset.code;
            setPinFromCode(code);
            setTimeout(submitPin, 500);
        });
    });
}

// ========== FILE SCANNER (Placeholder) ==========
async function scanForQuizzes() {
    console.log('🔍 Scanning for quiz files...');
    showScreen('loading-screen');
    
    const loadingMessage = document.getElementById('loading-message');
    const loadingDetails = document.getElementById('loading-details');
    const progressBar = document.getElementById('scan-progress');
    const foundCount = document.getElementById('quiz-found');

    loadingMessage.textContent = 'Scanning Questions folder...';
    loadingDetails.textContent = 'Looking for quiz files...';
    
    // Simulate scanning progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                loadingMessage.textContent = 'Scan complete!';
                loadingDetails.textContent = `Found ${gameState.quizCatalog.length} quiz files`;
                foundCount.textContent = gameState.quizCatalog.length;
                
                setTimeout(() => {
                    showScreen('pin-screen');
                    updateCatalogDisplay();
                }, 1500);
            }, 500);
        }
    }, 100);
}

// ========== GAME FUNCTIONS ==========
function initGame() {
    gameState.currentQuestion = 0;
    gameState.currentPlayer = 1;
    gameState.scores = [0, 0];
    gameState.roundScores = [0, 0];
    gameState.selectedAnswer = null;
    gameState.answered = false;
    gameState.powerupUsed = false;
    gameState.canUsePowerup = false;
    gameState.coins = 0;
    
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
            optionEl.innerHTML = `<strong>${String.fromCharCode(65 + index)})</strong> ${option}`;
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
        '<div class="feedback-placeholder"><i class="fas fa-lightbulb"></i><p>Select an answer to continue</p></div>';

    document.getElementById('treasure-section').style.display = 'none';
    document.getElementById('blackjack-controls').style.display = 'none';

    updateScores();
    updatePlayerTurn();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const basePoints = question.points || 10;
    const playerIdx = gameState.currentPlayer - 1;

    // Disable submit
    document.getElementById('submit-answer').disabled = true;

    // Mark answers
    document.querySelectorAll('.option').forEach((opt, index) => {
        if (index === question.correct) {
            opt.classList.add('correct');
            createCoinExplosion(opt.getBoundingClientRect());
        } else if (index === gameState.selectedAnswer && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });

    // Process answer
    if (isCorrect) {
        let points = basePoints;
        
        // Apply power-up if available and used
        if (gameState.canUsePowerup && confirm('Use Power-Up for double points?')) {
            points *= 2;
            gameState.canUsePowerup = false;
            showCelebration('⚡ Power-Up Activated! Points doubled!', 'warning');
        }
        
        // Add to round score (blackjack style)
        gameState.roundScores[playerIdx] += points;
        
        // Check for bust
        if (gameState.roundScores[playerIdx] > gameState.targetScore) {
            bust(playerIdx);
            return;
        }
        
        // Show celebration
        showCelebration(`✅ Correct! +${points} this round!`, 'success');
        
        // Show blackjack controls
        document.getElementById('blackjack-controls').style.display = 'flex';
        document.getElementById('current-round-total').textContent = gameState.roundScores[playerIdx];
        
        // Update risk warning
        updateRiskWarning();
        
        // Award coins
        gameState.coins += Math.floor(points / 5);
        document.getElementById('treasure-section').style.display = 'block';
        
        // Show feedback
        let feedback = `
            <div class="feedback-correct">
                <span>🧧</span>
                <div>
                    <h3>恭喜发财! +${points} points</h3>
                    <p><strong>Round Total:</strong> ${gameState.roundScores[playerIdx]}/21</p>
                    ${question.explanation ? `<p><strong>Explanation:</strong> ${question.explanation}</p>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('answer-feedback').innerHTML = feedback;
        
    } else {
        // Wrong answer - lose turn
        const correctLetter = String.fromCharCode(65 + question.correct);
        const correctText = question.options[question.correct];
        
        showCelebration('❌ Wrong answer! Turn lost!', 'danger');
        
        // Show feedback
        let feedback = `
            <div class="feedback-incorrect">
                <span>❌</span>
                <div>
                    <h3>Incorrect Answer</h3>
                    <p><strong>Correct:</strong> ${correctLetter}) ${correctText}</p>
                    ${question.explanation ? `<p><strong>Explanation:</strong> ${question.explanation}</p>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('answer-feedback').innerHTML = feedback;
        
        // Switch player after delay
        setTimeout(() => {
            switchPlayer();
            gameState.currentQuestion++;
            loadQuestion();
        }, 2500);
    }
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

// ========== BLACKJACK FUNCTIONS ==========
function hitMe() {
    const playerIdx = gameState.currentPlayer - 1;
    const currentRoundTotal = gameState.roundScores[playerIdx];
    
    // Show warning for high risk
    if (currentRoundTotal >= 18) {
        if (!confirm('⚠️ Very risky! You have ' + currentRoundTotal + '/21 points. Are you sure you want to HIT?')) {
            return;
        }
    }
    
    // Hide controls
    document.getElementById('blackjack-controls').style.display = 'none';
    
    // Move to next question with risk multiplier
    gameState.currentQuestion++;
    loadQuestion();
    
    showCelebration('🔥 HIT! Next question loaded!', 'warning');
}

function stand() {
    // End round, bank current points
    const playerIdx = gameState.currentPlayer - 1;
    const roundPoints = gameState.roundScores[playerIdx];
    
    if (roundPoints === 0) {
        showCelebration('ℹ️ No points to bank!', 'info');
        switchPlayer();
        gameState.currentQuestion++;
        loadQuestion();
        return;
    }
    
    gameState.scores[playerIdx] += roundPoints;
    updateScores();
    
    showCelebration(
        `✅ STAND! Banking ${roundPoints} points!`, 
        'success'
    );
    
    // Reset round score
    gameState.roundScores[playerIdx] = 0;
    updateRoundDisplay();
    
    // Switch player after delay
    setTimeout(() => {
        switchPlayer();
        gameState.currentQuestion++;
        loadQuestion();
    }, 1800);
}

function bust(playerIdx) {
    // Player loses all round points
    const lostPoints = gameState.roundScores[playerIdx];
    showCelebration(`💥 BUST! Lost ${lostPoints} points!`, 'danger');
    
    // Reset round score
    gameState.roundScores[playerIdx] = 0;
    updateRoundDisplay();
    
    // Switch player after delay
    setTimeout(() => {
        switchPlayer();
        gameState.currentQuestion++;
        loadQuestion();
    }, 2200);
}

function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    updatePlayerTurn();
}

function updateRiskWarning() {
    const playerIdx = gameState.currentPlayer - 1;
    const currentScore = gameState.roundScores[playerIdx];
    const warningEl = document.getElementById('risk-warning');
    
    if (currentScore > 18) {
        warningEl.style.display = 'inline-block';
    } else {
        warningEl.style.display = 'none';
    }
}

// ========== DISPLAY UPDATES ==========
function updateScores() {
    document.getElementById('score1').textContent = gameState.scores[0];
    document.getElementById('score2').textContent = gameState.scores[1];
    updateRoundDisplay();
}

function updateRoundDisplay() {
    document.getElementById('round-score1').textContent = gameState.roundScores[0];
    document.getElementById('round-score2').textContent = gameState.roundScores[1];
}

function updatePlayerTurn() {
    const playerTurnEl = document.getElementById('current-player');
    playerTurnEl.textContent = `Player ${gameState.currentPlayer}'s Turn`;
    
    // Visual indicator for current player
    document.getElementById('player1').classList.toggle('active', gameState.currentPlayer === 1);
    document.getElementById('player2').classList.toggle('active', gameState.currentPlayer === 2);
}

// ========== TREASURE BOXES ==========
const powerUps = [
    { icon: '⚡', name: 'Double Points', type: 'double' },
    { icon: '➗', name: 'Half Points', type: 'half' },
    { icon: '➖', name: 'Negative Points', type: 'negative' },
    { icon: '🔄', name: 'Switch Scores', type: 'switch' },
    { icon: '✨', name: 'Bonus +10', type: 'bonus' }
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

// ========== CELEBRATION EFFECTS ==========
function showCelebration(message, type = 'success') {
    const celebrationArea = document.getElementById('celebration-area');
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.innerHTML = message;

    // Add color based on type
    if (type === 'success') {
        celebration.style.background = 'linear-gradient(135deg, #38a169, #2f855a)';
        celebration.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 30px rgba(104, 211, 145, 0.8)';
    } else if (type === 'danger') {
        celebration.style.background = 'linear-gradient(135deg, #e53e3e, #c53030)';
        celebration.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 30px rgba(245, 101, 101, 0.8)';
    } else if (type === 'warning') {
        celebration.style.background = 'linear-gradient(135deg, #dd6b20, #c05621)';
        celebration.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 30px rgba(237, 137, 54, 0.8)';
    } else if (type === 'info') {
        celebration.style.background = 'linear-gradient(135deg, #3182ce, #2c5282)';
        celebration.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 30px rgba(83, 161, 230, 0.8)';
    }

    celebrationArea.appendChild(celebration);

    // Remove after animation
    setTimeout(() => {
        celebration.remove();
    }, 3000);
}

// ========== COIN EFFECTS ==========
function createCoinExplosion(rect) {
    const coinsContainer = document.getElementById('coins-container');
    
    // Create multiple coins
    for (let i = 0; i < 12; i++) {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.textContent = i % 3 === 0 ? '💰' : i % 3 === 1 ? '🧧' : '🏮';
        
        // Random position around the element
        const x = rect.left + rect.width/2 + (Math.random() - 0.5) * 120;
        const y = rect.top + rect.height/2 + (Math.random() - 0.5) * 60;
        
        coin.style.left = `${x}px`;
        coin.style.top = `${y}px`;
        coin.style.fontSize = `${1.2 + Math.random() * 0.8}rem`;
        
        coinsContainer.appendChild(coin);
        
        // Remove after animation
        setTimeout(() => {
            coin.remove();
        }, 3200);
    }
}

// ========== END GAME ==========
function endGame() {
    // Bank any remaining round points
    for (let i = 0; i < 2; i++) {
        if (gameState.roundScores[i] > 0 && gameState.roundScores[i] <= 21) {
            gameState.scores[i] += gameState.roundScores[i];
        }
    }
    
    updateScores();
    
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

    document.getElementById('game-over').style.display = 'flex';
    
    // Final celebration
    setTimeout(() => {
        showCelebration(`🏆 ${winnerMessage} 🏆`, 'success');
    }, 500);
}

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

    // Add a test quiz
    addTestQuiz: function() {
        const testQuiz = {
            code: '201-01-1',
            filename: '201011.json',
            path: 'Questions/lower-secondary/math/201011.json',
            name: 'Sec 1 Math Chapter 1',
            subject: 'Mathematics',
            level: 'Lower Secondary',
            grade: 'S1'
        };
        
        gameState.quizCatalog.push(testQuiz);
        localStorage.setItem('quizCatalog', JSON.stringify(gameState.quizCatalog));
        updateCatalogDisplay();
        console.log('Test quiz added');
    },

    // Show current state
    showState: function() {
        console.log('Current PIN:', gameState.pin);
        console.log('Catalog size:', gameState.quizCatalog.length);
        console.log('Catalog:', gameState.quizCatalog);
    }
};