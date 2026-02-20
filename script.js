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
    quizCatalog: []
};

// ========== CNY SOUND EFFECTS (Optional - uncomment if you want to add sound) ==========
// const cnySounds = {
//     firecracker: new Audio('https://www.soundjay.com/misc/sounds/firecracker-1.mp3'),
//     gong: new Audio('https://www.soundjay.com/misc/sounds/bell-church-1.mp3'),
//     cheer: new Audio('https://www.soundjay.com/misc/sounds/applause-1.mp3')
// };

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
        { level: 1, levelName: 'primary', subjects: [0, 1] },
        { level: 2, levelName: 'lower-secondary', subjects: [0, 1] },
        { level: 3, levelName: 'upper-secondary', subjects: [0, 2, 3, 4, 5] }
    ];
    
    try {
        // Check if Questions folder exists
        loadingMessage.textContent = '检查题库中...';
        loadingDetails.textContent = '正在寻找红包...';
        
        const baseCheck = await fetch('Questions/');
        if (!baseCheck.ok) {
            throw new Error('题库文件夹不存在，请创建 Questions 文件夹');
        }
        
        // Scan each level and subject
        for (let levelIdx = 0; levelIdx < scanPaths.length; levelIdx++) {
            const levelData = scanPaths[levelIdx];
            
            for (let subjIdx = 0; subjIdx < levelData.subjects.length; subjIdx++) {
                const subjectDigit = levelData.subjects[subjIdx];
                const subject = SUBJECTS[subjectDigit];
                
                const path = `Questions/${levelData.levelName}/${subject.folder}/`;
                loadingDetails.textContent = `扫描中: ${levelData.levelName}/${subject.name}...`;
                
                // Update progress
                const progress = ((levelIdx * levelData.subjects.length + subjIdx + 1) / 
                                 (scanPaths.length * scanPaths.reduce((a, b) => a + b.subjects.length, 0))) * 100;
                progressBar.style.width = `${progress}%`;
                
                try {
                    // Try to get directory listing
                    const response = await fetch(path);
                    if (!response.ok) continue;
                    
                } catch (error) {
                    console.log(`跳过 ${path}: ${error.message}`);
                }
            }
        }
        
        // After scanning, load from localStorage or default list
        await loadCatalogFromStorage();
        
        // Update progress to 100%
        progressBar.style.width = '100%';
        foundCount.textContent = gameState.quizCatalog.length;
        foundQuizzes = gameState.quizCatalog.length;
        
        // Show completion message
        setTimeout(() => {
            if (foundQuizzes === 0) {
                loadingMessage.textContent = '没有找到红包';
                loadingDetails.textContent = '请在 Questions 文件夹中添加 JSON 题库文件';
                setTimeout(() => {
                    showScreen('pin-screen');
                    updateCatalogDisplay();
                }, 2000);
            } else {
                loadingMessage.textContent = '恭喜发财！红包找到啦！';
                loadingDetails.textContent = `找到 ${foundQuizzes} 个红包题库`;
                setTimeout(() => {
                    showScreen('pin-screen');
                    updateCatalogDisplay();
                }, 1500);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Scan error:', error);
        loadingMessage.textContent = '扫描失败';
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
    
    // If no stored catalog, create from default files
    const defaultQuizzes = [
        { code: '101-01-1', filename: '101011.json', path: 'Questions/primary/math/101011.json', name: 'P1 数学 第1章', level: 'Primary', grade: 'P1', subject: 'Mathematics' },
        { code: '201-01-1', filename: '201011.json', path: 'Questions/lower-secondary/math/201011.json', name: '中1 数学 第1章', level: 'Lower Secondary', grade: 'S1', subject: 'Mathematics' },
        { code: '201-01-2', filename: '201012.json', path: 'Questions/lower-secondary/math/201012.json', name: '中1 数学 第1章 练习2', level: 'Lower Secondary', grade: 'S1', subject: 'Mathematics' },
        { code: '342-09-1', filename: '342091.json', path: 'Questions/upper-secondary/combined-chem/342091.json', name: '中4 综合化学 第9章', level: 'Upper Secondary', grade: 'S4', subject: 'Combined Chemistry' }
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
                <h4>没有找到红包</h4>
                <p>在 Questions 文件夹中添加 JSON 文件</p>
                <button id="refresh-catalog" class="btn small">
                    <i class="fas fa-redo"></i> 刷新
                </button>
            </div>
        `;
        countEl.textContent = '0 个红包';
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
    
    countEl.textContent = `${gameState.quizCatalog.length} 个红包`;
    
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
    
    // Decode the quiz code
    const quizInfo = decodeQuizCode(code);
    if (!quizInfo) {
        return { 
            success: false, 
            error: `红包码格式错误: ${code}` 
        };
    }
    
    // Store current quiz code
    gameState.currentQuizCode = quizInfo.code;
    
    // Update loading display
    document.getElementById('loading-message').textContent = `打开红包 ${quizInfo.code}...`;
    
    try {
        // Try to load the file
        const response = await fetch(quizInfo.filepath);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`文件不存在: ${quizInfo.filename}`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ 红包打开成功');
        
        // Validate quiz data
        if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error('红包格式错误: 缺少题目数组');
        }
        
        if (data.questions.length === 0) {
            throw new Error('红包是空的');
        }
        
        // Add to catalog if not already there
        addQuizToCatalog(quizInfo);
        
        return { 
            success: true, 
            data: data, 
            info: quizInfo 
        };
        
    } catch (error) {
        console.error('❌ 红包打开失败:', error);
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
        alert('请输入全部6位数字');
        return;
    }
    
    showScreen('loading-screen');
    document.getElementById('loading-message').textContent = '打开红包中...';
    
    try {
        const result = await loadQuizByCode(pin);
        
        if (!result.success) {
            // Check if this might be a new file not in catalog
            const quizInfo = decodeQuizCode(pin);
            let errorMsg = `<strong>红包 ${quizInfo?.code || pin} 不存在</strong><br><br>`;
            errorMsg += `<div style="color: #666; font-size: 0.9rem;">`;
            errorMsg += `错误: ${result.error}</div>`;
            
            // Suggest creating the file
            if (quizInfo && result.error.includes('不存在')) {
                errorMsg += `<br><div style="background: #f0f9ff; padding: 15px; border-radius: 10px; margin-top: 15px;">`;
                errorMsg += `<strong>建议文件位置:</strong><br>`;
                errorMsg += `<code style="background: #e1f0ff; padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 5px;">`;
                errorMsg += `${quizInfo.filepath}</code>`;
                errorMsg += `</div>`;
            }
            
            // Show available quizzes
            if (gameState.quizCatalog.length > 0) {
                errorMsg += `<br><strong>可用红包 (${gameState.quizCatalog.length}):</strong><br>`;
                gameState.quizCatalog.slice(0, 5).forEach(q => {
                    errorMsg += `<div style="margin: 5px 0; padding: 8px; background: #f7fafc; border-radius: 5px;">
                        • <strong>${q.code}</strong>: ${q.name}
                    </div>`;
                });
                
                if (gameState.quizCatalog.length > 5) {
                    errorMsg += `<div style="color: #718096; margin-top: 5px;">
                        ... 还有 ${gameState.quizCatalog.length - 5} 个红包
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
            `${result.info.subject} • ${result.info.gradeLabel}`;
        document.getElementById('current-quiz-code').textContent = 
            result.info.code;
        
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
    document.getElementById('question-text').textContent = question.question || "题目";
    
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
        '<div class="feedback-placeholder"><i class="fas fa-lightbulb"></i> 选择答案开始挑战</div>';
    
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
                <span>🧧✅</span>
                <div>
                    <h3>恭喜发财！ +${points} 分</h3>
                    ${question.explanation ? `<p><strong>解释:</strong> ${question.explanation}</p>` : ''}
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
                <span>🧧❌</span>
                <div>
                    <h3>再接再厉</h3>
                    <p><strong>正确答案:</strong> ${correctLetter}) ${correctText}</p>
                    ${question.explanation ? `<p><strong>解释:</strong> ${question.explanation}</p>` : ''}
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
        winnerMessage = '玩家 1 新年行大运! 🐉';
        winnerName = '玩家 1';
    } else if (score2 > score1) {
        winnerMessage = '玩家 2 新年行大运! 🐲';
        winnerName = '玩家 2';
    } else {
        winnerMessage = "恭喜发财，和气生财! 🤝";
        winnerName = '两位玩家';
    }
    
    document.getElementById('winner-message').textContent = winnerMessage;
    document.getElementById('winner-name').textContent = winnerName;
    document.getElementById('final-score1').textContent = score1;
    document.getElementById('final-score2').textContent = score2;
    
    document.getElementById('game-over').style.display = 'block';
}

// ========== POWER-UPS ==========
const powerUps = [
    { icon: '🧧⚡', name: '双倍红包', type: 'double' },
    { icon: '🧧➗', name: '一半红包', type: 'half' },
    { icon: '🧧➖', name: '扣红包', type: 'negative' },
    { icon: '🧧🔄', name: '交换红包', type: 'switch' },
    { icon: '🧧✨', name: '额外红包 +10', type: 'bonus' }
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
            <p>恭喜发财！红包拿来！</p>
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
            message = `双倍红包！ +${doublePoints}`;
            break;
        case 'half':
            const halfPoints = Math.floor(basePoints / 2);
            gameState.scores[playerIdx] += halfPoints;
            message = `一半红包！ +${halfPoints}`;
            break;
        case 'negative':
            gameState.scores[playerIdx] -= basePoints;
            message = `扣红包！ -${basePoints}`;
            break;
        case 'switch':
            [gameState.scores[playerIdx], gameState.scores[otherIdx]] = 
            [gameState.scores[otherIdx], gameState.scores[playerIdx]];
            message = `红包交换！`;
            break;
        case 'bonus':
            gameState.scores[playerIdx] += 10;
            message = `额外红包 +10！`;
            break;
    }
    
    updateScores();
    
    // Add message
    const feedbackDiv = document.getElementById('answer-feedback');
    feedbackDiv.innerHTML += `<div class="powerup-message">🎁 ${message}</div>`;
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🧧 新春 Quiz 挑战 启动！');
    
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
    
    console.log('✅ 新年快乐，万事如意！');
    console.log('💡 在 Questions 文件夹中添加 JSON 题库文件');
    console.log('📂 文件命名规则: 3位学段/科目/年级 + 2位章节 + 1位练习');
    console.log('📂 例如: 342091.json = 高中/综合化学/中4/第9章/练习1');
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
        console.log('红包目录已重置');
    },
    
    // Add a test quiz
    addTestQuiz: function() {
        const testQuiz = {
            code: '201-01-1',
            filename: '201011.json',
            path: 'Questions/lower-secondary/math/201011.json',
            name: '中1 数学 第1章',
            subject: 'Mathematics',
            level: 'Lower Secondary',
            grade: 'S1'
        };
        
        gameState.quizCatalog.push(testQuiz);
        localStorage.setItem('quizCatalog', JSON.stringify(gameState.quizCatalog));
        updateCatalogDisplay();
        console.log('测试红包已添加');
    },
    
    // Show current state
    showState: function() {
        console.log('当前红包码:', gameState.pin);
        console.log('红包目录大小:', gameState.quizCatalog.length);
        console.log('红包目录:', gameState.quizCatalog);
    }
};