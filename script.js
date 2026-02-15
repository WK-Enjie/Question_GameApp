// ========== GAME STATE ==========
const gameState = {
    pin: ['', '', '', '', '', ''],
    currentDigit: 0,
    questions: [],
    currentQuestion: 0,
    currentPlayer: 1,
    scores: [0, 0],
    targetScore: 41, // ✅ CHANGED TO 41 - MAX POINTS
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

    if (levelDigit < 1 || levelDigit > 3) return null;
    if (subjectDigit < 0 || subjectDigit > 5) return null;

    const level = LEVELS[levelDigit];
    const subject = SUBJECTS[subjectDigit];

    const formattedCode = `${levelDigit}${subjectDigit}${gradeDigit}-${chap10}${chap1}-${worksheet}`;
    const filename = `${levelDigit}${subjectDigit}${gradeDigit}${chap10}${chap1}${worksheet}.json`;
    const filepath = `Questions/${level.folder}/${subject.folder}/${filename}`;

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

// ========== SAFE EVENT DELEGATION ==========
function setupEventListeners() {
    // PIN KEYPAD
    document.querySelectorAll('.key[data-key]').forEach(button => {
        button.removeEventListener('click', handleKeyClick); // Prevent duplicates
        button.addEventListener('click', handleKeyClick);
    });

    // CRITICAL FIX: Event delegation for submit button (works even if DOM changes)
    document.removeEventListener('click', handleDocumentClick);
    document.addEventListener('click', handleDocumentClick);

    // Other buttons
    document.getElementById('clear-btn')?.addEventListener('click', clearPin);
    document.getElementById('submit-pin')?.addEventListener('click', submitPin);
    document.getElementById('test-pin')?.addEventListener('click', () => {
        setPinFromCode('202031');
        setTimeout(submitPin, 300);
    });
    document.getElementById('home-btn')?.addEventListener('click', () => {
        clearPin();
        showScreen('pin-screen');
    });
    document.getElementById('retry-btn')?.addEventListener('click', submitPin);
    document.getElementById('back-to-pin-error')?.addEventListener('click', () => {
        clearPin();
        showScreen('pin-screen');
    });
    document.getElementById('restart-btn')?.addEventListener('click', initGame);
    document.getElementById('new-chapter-btn')?.addEventListener('click', () => {
        clearPin();
        showScreen('pin-screen');
    });
    document.getElementById('scan-quizzes')?.addEventListener('click', scanForQuizzes);
    document.getElementById('json-upload')?.addEventListener('change', handleFileUpload);
    document.getElementById('hit-btn')?.addEventListener('click', hitMe);
    document.getElementById('stand-btn')?.addEventListener('click', stand);
    
    // Treasure boxes
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.removeEventListener('click', handleTreasureClick);
        box.addEventListener('click', handleTreasureClick);
    });
}

function handleKeyClick(e) {
    const digit = this.getAttribute('data-key');
    addDigit(digit);
}

function handleDocumentClick(e) {
    // Submit answer button (event delegation)
    if (e.target.matches('#submit-answer, #submit-answer *')) {
        e.preventDefault();
        submitAnswer();
        return;
    }
    
    // Option selection (event delegation)
    if (e.target.closest('.option')) {
        const option = e.target.closest('.option');
        const index = parseInt(option.dataset.index);
        if (!isNaN(index)) {
            selectOption(index);
        }
    }
}

function handleTreasureClick() {
    const boxNum = this.getAttribute('data-box');
    openTreasureBox(boxNum);
}

// ========== CORE FUNCTIONS (WITH NULL SAFETY) ==========
function updatePinDisplay() {
    for (let i = 1; i <= 6; i++) {
        const el = document.getElementById(`digit${i}`);
        if (!el) continue;
        const val = gameState.pin[i-1] || '_';
        const numEl = el.querySelector('.digit-number');
        if (numEl) numEl.textContent = val;
        el.classList.toggle('filled', val !== '_');
    }
}

function addDigit(digit) {
    if (gameState.currentDigit >= 6) return;
    gameState.pin[gameState.currentDigit] = digit;
    gameState.currentDigit++;
    updatePinDisplay();
}

function clearPin() {
    gameState.pin = Array(6).fill('');
    gameState.currentDigit = 0;
    updatePinDisplay();
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    if (screen) screen.classList.add('active');
}

async function submitPin() {
    const pin = gameState.pin.join('');
    if (pin.length !== 6) {
        alert('⚠️ Please enter all 6 digits');
        return;
    }
    
    showScreen('loading-screen');
    try {
        const result = await loadQuizByCode(pin);
        if (!result.success) throw new Error(result.error);
        
        gameState.questions = result.data.questions;
        document.getElementById('quiz-title').textContent = result.data.title || result.info.fullName;
        document.getElementById('quiz-topic').textContent = `${result.info.subject} • ${result.info.gradeLabel}`;
        document.getElementById('current-quiz-code').textContent = result.info.code;
        document.getElementById('current-quiz-path').textContent = result.info.filepath;
        
        initGame();
        showScreen('game-screen');
    } catch (err) {
        console.error('Load failed:', err);
        setTimeout(() => {
            document.getElementById('error-message').innerHTML = 
                `<strong>Error:</strong> ${err.message || 'Failed to load quiz'}`;
            showScreen('error-screen');
        }, 500);
    }
}

async function loadQuizByCode(code) {
    const info = decodeQuizCode(code);
    if (!info) return { success: false, error: 'Invalid code format' };
    
    try {
        const res = await fetch(info.filepath);
        if (!res.ok) throw new Error(`File not found: ${info.filename}`);
        const data = await res.json();
        
        if (!data.questions?.length) throw new Error('Invalid quiz format');
        addQuizToCatalog(info);
        return { success: true, data, info };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function initGame() {
    Object.assign(gameState, {
        currentQuestion: 0,
        currentPlayer: 1,
        scores: [0, 0],
        roundScores: [0, 0],
        selectedAnswer: null,
        answered: false,
        powerupUsed: false,
        canUsePowerup: false,
        coins: 0
    });
    
    updateScores();
    updatePlayerTurn();
    loadQuestion();
    document.getElementById('game-over')?.style.setProperty('display', 'none', 'important');
}

function loadQuestion() {
    const q = gameState.questions[gameState.currentQuestion];
    if (!q) {
        endGame();
        return;
    }
    
    // Update UI
    document.getElementById('current-q').textContent = gameState.currentQuestion + 1;
    document.getElementById('total-q').textContent = gameState.questions.length;
    document.getElementById('question-text').textContent = q.question;
    
    // Render options WITH DIRECT EVENT HANDLERS
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    q.options.forEach((opt, idx) => {
        const el = document.createElement('div');
        el.className = 'option';
        el.innerHTML = `<strong>${String.fromCharCode(65 + idx)})</strong> ${opt}`;
        el.dataset.index = idx;
        
        // DIRECT CLICK HANDLER (MOST RELIABLE)
        el.onclick = () => selectOption(idx);
        
        container.appendChild(el);
    });
    
    // Reset state
    gameState.selectedAnswer = null;
    gameState.answered = false;
    document.getElementById('submit-answer').disabled = true;
    document.getElementById('answer-feedback').innerHTML = 
        '<div class="feedback-placeholder"><i class="fas fa-lightbulb"></i><p>Select an answer to continue</p></div>';
    
    document.getElementById('treasure-section').style.display = 'none';
    document.getElementById('blackjack-controls').style.display = 'none';
    updateScores();
    updatePlayerTurn();
}

function selectOption(index) {
    if (gameState.answered) return;
    
    // Deselect all
    document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
    
    // Select current
    const options = document.querySelectorAll('.option');
    if (options[index]) {
        options[index].classList.add('selected');
        gameState.selectedAnswer = index;
        
        // ENABLE SUBMIT BUTTON (CRITICAL FIX)
        const btn = document.getElementById('submit-answer');
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.style.transform = 'scale(1.02)';
            setTimeout(() => {
                if (btn) btn.style.transform = 'scale(1)';
            }, 100);
        }
    }
}

function submitAnswer() {
    // SAFETY CHECKS
    if (gameState.answered) {
        console.log('Already answered');
        return;
    }
    
    if (gameState.selectedAnswer === null) {
        alert('❗ Please select an answer first!');
        return;
    }
    
    gameState.answered = true;
    const q = gameState.questions[gameState.currentQuestion];
    const isCorrect = gameState.selectedAnswer === q.correct;
    const points = q.points || 10;
    const playerIdx = gameState.currentPlayer - 1;
    
    // Disable button immediately
    const submitBtn = document.getElementById('submit-answer');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitted...';
    }
    
    // Visual feedback
    document.querySelectorAll('.option').forEach((el, idx) => {
        if (idx === q.correct) {
            el.classList.add('correct');
            createCoinExplosion(el.getBoundingClientRect());
        } else if (idx === gameState.selectedAnswer && !isCorrect) {
            el.classList.add('incorrect');
        }
    });
    
    // Process answer
    if (isCorrect) {
        let earned = points;
        if (gameState.canUsePowerup && confirm('✨ Use Power-Up for DOUBLE points?')) {
            earned *= 2;
            gameState.canUsePowerup = false;
            showCelebration('⚡ POWER-UP! Points doubled!', 'warning');
        }
        
        gameState.roundScores[playerIdx] += earned;
        
        // CHECK BUST (AGAINST 41)
        if (gameState.roundScores[playerIdx] > gameState.targetScore) {
            bust(playerIdx);
            return;
        }
        
        showCelebration(`✅ CORRECT! +${earned} points!`, 'success');
        document.getElementById('blackjack-controls').style.display = 'flex';
        document.getElementById('current-round-total').textContent = gameState.roundScores[playerIdx];
        updateRiskWarning();
        
        gameState.coins += Math.floor(earned / 5);
        document.getElementById('treasure-section').style.display = 'block';
        
        document.getElementById('answer-feedback').innerHTML = `
            <div class="feedback-correct">
                <span>🧧</span>
                <div>
                    <h3>恭喜发财! +${earned} points</h3>
                    <p><strong>Round Total:</strong> ${gameState.roundScores[playerIdx]}/41</p>
                    ${q.explanation ? `<p><strong>Explanation:</strong> ${q.explanation}</p>` : ''}
                </div>
            </div>
        `;
    } else {
        const correctAns = q.options[q.correct];
        showCelebration('❌ WRONG! Turn lost!', 'danger');
        
        document.getElementById('answer-feedback').innerHTML = `
            <div class="feedback-incorrect">
                <span>❌</span>
                <div>
                    <h3>Incorrect Answer</h3>
                    <p><strong>Correct:</strong> ${String.fromCharCode(65 + q.correct)}) ${correctAns}</p>
                    ${q.explanation ? `<p><strong>Explanation:</strong> ${q.explanation}</p>` : ''}
                </div>
            </div>
        `;
        
        setTimeout(() => {
            switchPlayer();
            gameState.currentQuestion++;
            loadQuestion();
        }, 2200);
    }
}

// ========== BLACKJACK (MAX 41) ==========
function hitMe() {
    const total = gameState.roundScores[gameState.currentPlayer - 1];
    if (total > 35 && !confirm(`⚠️ RISKY! You have ${total}/41 points. Hit anyway?`)) return;
    
    document.getElementById('blackjack-controls').style.display = 'none';
    gameState.currentQuestion++;
    loadQuestion();
    showCelebration('🔥 HIT! Next question!', 'warning');
}

function stand() {
    const playerIdx = gameState.currentPlayer - 1;
    const pts = gameState.roundScores[playerIdx];
    
    if (pts === 0) {
        showCelebration('ℹ️ No points to bank!', 'info');
        nextTurn();
        return;
    }
    
    gameState.scores[playerIdx] += pts;
    gameState.roundScores[playerIdx] = 0;
    updateScores();
    
    showCelebration(`✅ STAND! Banked ${pts} points!`, 'success');
    setTimeout(nextTurn, 1800);
}

function bust(playerIdx) {
    const lost = gameState.roundScores[playerIdx];
    gameState.roundScores[playerIdx] = 0;
    updateRoundDisplay();
    
    showCelebration(`💥 BUST! Lost ${lost} points!`, 'danger');
    setTimeout(nextTurn, 2000);
}

function nextTurn() {
    switchPlayer();
    gameState.currentQuestion++;
    loadQuestion();
}

function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    updatePlayerTurn();
}

function updateRiskWarning() {
    const total = gameState.roundScores[gameState.currentPlayer - 1];
    const warn = document.getElementById('risk-warning');
    if (warn) warn.style.display = total > 35 ? 'inline-block' : 'none';
}

// ========== UTILITIES ==========
function updateScores() {
    document.getElementById('score1').textContent = gameState.scores[0] || '0';
    document.getElementById('score2').textContent = gameState.scores[1] || '0';
    updateRoundDisplay();
}

function updateRoundDisplay() {
    document.getElementById('round-score1').textContent = gameState.roundScores[0] || '0';
    document.getElementById('round-score2').textContent = gameState.roundScores[1] || '0';
}

function updatePlayerTurn() {
    const el = document.getElementById('current-player');
    if (el) el.textContent = `Player ${gameState.currentPlayer}'s Turn`;
    
    document.getElementById('player1')?.classList.toggle('active', gameState.currentPlayer === 1);
    document.getElementById('player2')?.classList.toggle('active', gameState.currentPlayer === 2);
}

function showCelebration(msg, type = 'success') {
    const area = document.getElementById('celebration-area');
    if (!area) return;
    
    const div = document.createElement('div');
    div.className = 'celebration';
    div.innerHTML = msg;
    
    // Color coding
    const styles = {
        success: 'linear-gradient(135deg, #38a169, #2f855a)',
        danger: 'linear-gradient(135deg, #e53e3e, #c53030)',
        warning: 'linear-gradient(135deg, #dd6b20, #c05621)',
        info: 'linear-gradient(135deg, #3182ce, #2c5282)'
    };
    
    div.style.background = styles[type] || styles.success;
    area.appendChild(div);
    
    setTimeout(() => {
        div.remove();
    }, 2800);
}

function createCoinExplosion(rect) {
    const container = document.getElementById('coins-container');
    if (!container) return;
    
    for (let i = 0; i < 10; i++) {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.textContent = ['💰', '🧧', '🏮'][Math.floor(Math.random() * 3)];
        
        const x = rect.left + rect.width/2 + (Math.random() - 0.5) * 100;
        const y = rect.top + rect.height/2 + (Math.random() - 0.5) * 50;
        
        coin.style.left = `${x}px`;
        coin.style.top = `${y}px`;
        coin.style.fontSize = `${1 + Math.random() * 0.8}rem`;
        
        container.appendChild(coin);
        setTimeout(() => coin.remove(), 3000);
    }
}

function endGame() {
    // Bank remaining safe points
    for (let i = 0; i < 2; i++) {
        if (gameState.roundScores[i] > 0 && gameState.roundScores[i] <= gameState.targetScore) {
            gameState.scores[i] += gameState.roundScores[i];
        }
    }
    
    updateScores();
    
    const s1 = gameState.scores[0];
    const s2 = gameState.scores[1];
    let msg = s1 > s2 ? 'Player 1 Wins! 🏆' : 
              s2 > s1 ? 'Player 2 Wins! 🏆' : "It's a Tie! 🤝";
    
    document.getElementById('winner-message').textContent = 'Game Over!';
    document.getElementById('winner-name').textContent = msg;
    document.getElementById('final-score1').textContent = s1;
    document.getElementById('final-score2').textContent = s2;
    
    document.getElementById('game-over').style.display = 'flex';
    showCelebration(`🏆 ${msg} 🏆`, 'success');
}

// ========== CATALOG & FILE HANDLING ==========
async function loadCatalogFromStorage() {
    try {
        const stored = localStorage.getItem('quizCatalog');
        if (stored) {
            gameState.quizCatalog = JSON.parse(stored);
            return;
        }
    } catch (e) {}
    
    gameState.quizCatalog = [
        { code: '202-03-1', filename: '202031.json', path: 'Questions/lower-secondary/math/202031.json', name: 'Sec 2 Quadratic WS1', subject: 'Math', level: 'Lower Sec', grade: 'S2' },
        { code: '202-03-2', filename: '202032.json', path: 'Questions/lower-secondary/math/202032.json', name: 'Sec 2 Quadratic WS2', subject: 'Math', level: 'Lower Sec', grade: 'S2' }
    ];
    localStorage.setItem('quizCatalog', JSON.stringify(gameState.quizCatalog));
}

function addQuizToCatalog(info) {
    if (gameState.quizCatalog.some(q => q.code === info.code)) return false;
    gameState.quizCatalog.push({
        code: info.code,
        filename: info.filename,
        path: info.filepath,
        name: info.fullName,
        subject: info.subject,
        level: info.level,
        grade: info.gradeLabel
    });
    localStorage.setItem('quizCatalog', JSON.stringify(gameState.quizCatalog));
    return true;
}

function updateCatalogDisplay() {
    const el = document.getElementById('quiz-catalog');
    const count = document.getElementById('quiz-count');
    if (!el || !count) return;
    
    if (gameState.quizCatalog.length === 0) {
        el.innerHTML = '<div class="no-quizzes"><i class="fas fa-search"></i><h4>No quizzes found</h4></div>';
        count.textContent = '0';
        return;
    }
    
    el.innerHTML = gameState.quizCatalog.map(q => `
        <div class="quiz-item" data-code="${q.code.replace(/-/g, '')}">
            <div class="quiz-header">
                <span class="quiz-code">${q.code}</span>
                <span class="quiz-name">${q.name}</span>
            </div>
            <div class="quiz-details">
                <span class="quiz-level">${q.level}</span> • 
                <span class="quiz-grade">${q.grade}</span> • 
                <span class="quiz-subject">${q.subject}</span>
            </div>
        </div>
    `).join('');
    
    count.textContent = gameState.quizCatalog.length;
    
    // Add click handlers
    document.querySelectorAll('.quiz-item').forEach(item => {
        item.onclick = () => {
            setPinFromCode(item.dataset.code);
            setTimeout(submitPin, 300);
        };
    });
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const status = document.getElementById('upload-status');
    status.textContent = 'Loading...';
    status.className = 'upload-status';
    
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            gameState.questions = data.questions || [];
            document.getElementById('quiz-title').textContent = data.title || 'Uploaded Quiz';
            document.getElementById('quiz-topic').textContent = `${data.subject || 'General'} • ${data.level || 'All'}`;
            document.getElementById('current-quiz-code').textContent = 'UPLOAD';
            document.getElementById('current-quiz-path').textContent = file.name;
            
            initGame();
            showScreen('game-screen');
            status.textContent = '✅ Loaded successfully!';
            status.className = 'upload-status success';
        } catch (err) {
            status.textContent = `❌ Error: ${err.message}`;
            status.className = 'upload-status error';
        }
    };
    reader.readAsText(file);
}

function scanForQuizzes() {
    showScreen('loading-screen');
    setTimeout(() => {
        document.getElementById('loading-message').textContent = 'Scan complete!';
        document.getElementById('quiz-found').textContent = gameState.quizCatalog.length;
        setTimeout(() => {
            showScreen('pin-screen');
            updateCatalogDisplay();
        }, 1200);
    }, 800);
}

// ========== INITIALIZE ON LOAD ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ CNY Game Initialized | Max Points: 41');
        loadCatalogFromStorage().then(updateCatalogDisplay);
        setupEventListeners();
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('pin-screen').classList.contains('active')) {
                if (/\d/.test(e.key)) addDigit(e.key);
                if (e.key === 'Backspace') {
                    e.preventDefault();
                    clearPin();
                }
                if (e.key === 'Enter') submitPin();
            }
        });
    });
} else {
    console.log('✅ CNY Game Initialized | Max Points: 41');
    loadCatalogFromStorage().then(updateCatalogDisplay);
    setupEventListeners();
}