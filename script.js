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

// ========== CNY SOUND EFFECTS (Optional - uncomment if you want to add sound) ==========
// const cnySounds = {
//     firecracker: new Audio('https://www.soundjay.com/misc/sounds/firecracker-1.mp3'),
//     gong: new Audio('https://www.soundjay.com/misc/sounds/bell-church-1.mp3'),
//     cheer: new Audio('https://www.soundjay.com/misc/sounds/applause-1.mp3')
// };

// ========== QUIZ CODE DECODER ==========
const SUBJECTS = {
    0: { name: 'Mathematics', folder: 'math', chinese: '数学' },
    1: { name: 'Science', folder: 'science', chinese: '科学' },
    2: { name: 'Combined Physics', folder: 'combined-physics', chinese: '综合物理' },
    3: { name: 'Pure Physics', folder: 'pure-physics', chinese: '纯物理' },
    4: { name: 'Combined Chemistry', folder: 'combined-chem', chinese: '综合化学' },
    5: { name: 'Pure Chemistry', folder: 'pure-chem', chinese: '纯化学' }
};

const LEVELS = {
    1: { name: 'Primary', folder: 'primary', chinese: '小学' },
    2: { name: 'Lower Secondary', folder: 'lower-secondary', chinese: '初中' },
    3: { name: 'Upper Secondary', folder: 'upper-secondary', chinese: '高中' }
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
        levelChinese: level.chinese,
        subject: subject.name,
        subjectChinese: subject.chinese,
        grade: grade,
        gradeLabel: gradeLabel,
        chapter: parseInt(`${chapterTens}${chapterOnes}`),
        worksheet: worksheet,
        fullName: `${level.chinese} ${gradeLabel} ${subject.chinese} 第${parseInt(`${chapterTens}${chapterOnes}`)}章 练习${worksheet}`
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
        loadingMessage.textContent = '检查题库中...';
        loadingDetails.textContent = '正在寻找红包...';
        
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
    
    // If no stored catalog, create from your actual files
    const defaultQuizzes = [
        { 
            code: '10501-7', 
            filename: '105017.json', 
            path: 'Questions/primary/math/105017.json', 
            name: '小学 P5 数学 第1章 练习7 - Guess and Check',
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
            name: '小学 P5 数学 第1章 练习8 - Common Multiples',
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
            name: '小学 P5 数学 第1章 练习9 - Smart Shopper',
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
            name: '小学 P5 数学 第2章 练习1 - Fractions & Decimals',
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
            name: '小学 P5 数学 第2章 练习2 - Advanced Fractions',
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
            name: '小学 P5 数学 第2章 练习3 - Fraction of Quantity',
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
                <h4>没有找到红包</h4>
                <p>在 Questions 文件夹中添加 JSON 文件</p>
                <button id="refresh-catalog" class="btn small" onclick="location.reload()">
                    <i class="fas fa-redo"></i> 刷新
                </button>
            </div>
        `;
        countEl.textContent = '0 个红包';
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
        fullName = `${level === 'primary' ? '小学' : level === 'lower-secondary' ? '初中' : '高中'} ${gradeLabel} 数学 第${chapterNum}章 练习${worksheetNum}`;
    } else {
        filepath = `Questions/primary/math/${filename}`;
        fullName = `小学 P5 数学 练习`;
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
    document.getElementById('loading-message').textContent = `打开红包 ${code}...`;
    
    try {
        // Try to load the file
        console.log(`Fetching from: ${filepath}`);
        const response = await fetch(filepath);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`文件不存在: ${filename}`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ 红包打开成功', data);
        
        // Validate quiz data
        if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error('红包格式错误: 缺少题目数组');
        }
        
        if (data.questions.length === 0) {
            throw new Error('红包是空的');
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
            let errorMsg = `<strong>红包 ${pin} 不存在</strong><br><br>`;
            errorMsg += `<div style="color: #666; font-size: 0.9rem;">`;
            errorMsg += `错误: ${result.error}</div>`;
            
            // Suggest correct filename format
            errorMsg += `<br><div style="background: #f0f9ff; padding: 15px; border-radius: 10px; margin-top: 15px;">`;
            errorMsg += `<strong>文件名格式:</strong><br>`;
            errorMsg += `<code style="background: #e1f0ff; padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 5px;">`;
            errorMsg += `Questions/primary/math/${pin}.json</code>`;
            errorMsg += `</div>`;
            
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
            `数学 • ${result.info.gradeLabel || 'P5'}`;
        
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
    
    console.log('✅ 新年快乐，万事如意！');
    console.log('📂 文件命名规则: 6位数字.json (例如: 105017.json)');
    console.log('📂 105017.json = 小学/P5/第1章/练习7');
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
            code: '10501-7',
            filename: '105017.json',
            path: 'Questions/primary/math/105017.json',
            name: '小学 P5 数学 第1章 练习7 - Guess and Check',
            subject: 'Mathematics',
            level: 'Primary',
            grade: 'P5'
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