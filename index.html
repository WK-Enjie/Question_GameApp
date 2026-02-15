// ========== GAME CONFIGURATION ==========
const TARGET_SCORE = 50;

// ========== STATE ==========
const state = {
    pin: [],
    questions: [],
    currQIndex: 0,
    currPlayer: 1,
    scores: [0, 0],
    roundScore: 0,
    isAnswered: false,
    quizCatalog: [],
    quizMetadata: null
};

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log("🧧 CNY Game 50 Loaded");
    
    // Load Catalog (hidden but used for fallback)
    const stored = localStorage.getItem('quizCatalog');
    if (stored) state.quizCatalog = JSON.parse(stored);

    // Event Listeners
    setupPinPad();
    
    // Game Actions
    document.getElementById('submit-answer').addEventListener('click', submitAnswer);
    document.getElementById('btn-choose-box').addEventListener('click', startTreasurePhase);
    document.getElementById('btn-choose-risk').addEventListener('click', startRiskPhase);
    
    // Risk Actions
    document.getElementById('btn-hit').addEventListener('click', handleHit);
    document.getElementById('btn-stand').addEventListener('click', handleStand);
    
    // Treasure Actions
    document.querySelectorAll('.t-box').forEach(box => {
        box.addEventListener('click', (e) => handleTreasureOpen(e.target));
    });

    // Navigation
    document.getElementById('btn-home').addEventListener('click', () => location.reload());
    document.getElementById('scan-quizzes').addEventListener('click', scanForQuizzes);
    document.getElementById('json-upload').addEventListener('change', handleFileUpload);

    // Admin Mode Toggle (Ctrl+Shift+A)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            document.body.classList.toggle('admin-mode');
            const isAdmin = document.body.classList.contains('admin-mode');
            showFeedback(isAdmin ? '🔓 Admin Mode Enabled' : '🔒 Admin Mode Disabled', 'info');
            setTimeout(clearFeedback, 2000);
        }
    });
});

// ========== NAVIGATION ==========
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showFeedback(msg, type) {
    const el = document.getElementById('feedback-area');
    el.textContent = msg;
    el.className = `feedback-area ${type}`;
}

function clearFeedback() {
    const el = document.getElementById('feedback-area');
    el.className = 'feedback-area';
    el.textContent = '';
}

// ========== PIN PAD & LOADING ==========
function setupPinPad() {
    document.querySelectorAll('.key[data-key]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.pin.length < 6) {
                state.pin.push(btn.dataset.key);
                updatePinDisplay();
            }
        });
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        state.pin = [];
        updatePinDisplay();
    });

    document.getElementById('submit-pin').addEventListener('click', async () => {
        const code = state.pin.join('');
        if (code.length === 6) await loadQuiz(code);
        else alert("Enter 6 digits");
    });
}

function updatePinDisplay() {
    for (let i = 1; i <= 6; i++) {
        const val = state.pin[i-1] || '_';
        document.querySelector(`#digit${i} .digit-number`).textContent = val;
    }
}

// ========== QUIZ LOADING LOGIC ==========
const LEVELS = { 
    1: 'primary', 
    2: 'lower-secondary', 
    3: 'upper-secondary' 
};

const SUBJECTS = { 
    0: 'math', 
    1: 'science', 
    2: 'combined-physics', 
    3: 'pure-physics', 
    4: 'combined-chemistry', 
    5: 'pure-chemistry' 
};

async function loadQuiz(code) {
    showScreen('loading-screen');
    document.getElementById('loading-message').textContent = `Loading Quiz ${code}...`;
    
    const digits = code.split('').map(Number);
    const lvlFolder = LEVELS[digits[0]] || 'primary';
    const subFolder = SUBJECTS[digits[1]] || 'math';
    
    const filename = `${code}.json`;
    const path = `Questions/${lvlFolder}/${subFolder}/${filename}`;
    
    console.log(`Attempting to load: ${path}`);
    
    try {
        const res = await fetch(path);
        if(!res.ok) throw new Error("File not found");
        const data = await res.json();
        
        if(!data.questions || !Array.isArray(data.questions)) {
            throw new Error("Invalid JSON format - missing 'questions' array");
        }
        
        state.quizMetadata = {
            title: data.title || 'Quiz',
            topic: data.topic || '',
            subject: data.subject || '',
            grade: data.grade || ''
        };
        
        startQuiz(data.questions);
        
    } catch (e) {
        console.warn("Fetch failed, checking catalog", e);
        
        const catItem = state.quizCatalog.find(q => q.code === code);
        if(catItem && catItem.questions) {
            state.quizMetadata = {
                title: catItem.title || 'Uploaded Quiz',
                topic: catItem.topic || '',
                subject: catItem.subject || '',
                grade: catItem.grade || ''
            };
            startQuiz(catItem.questions);
        } else {
            alert(`❌ Quiz ${code} not found!\n\nPlease check the code or contact admin.`);
            showScreen('pin-screen');
        }
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = JSON.parse(evt.target.result);
            
            if(!data.questions || !Array.isArray(data.questions)) {
                throw new Error("Invalid format - must have 'questions' array");
            }
            
            const nameMatch = file.name.match(/(\d{6})\.json/);
            let code = nameMatch ? nameMatch[1] : null;
            
            if(!code) {
                code = prompt("Enter 6-digit code for this quiz (e.g., 201011):");
            }
            
            if(!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
                alert("Invalid code. Must be 6 digits.");
                return;
            }
            
            const existing = state.quizCatalog.findIndex(q => q.code === code);
            const entry = { 
                code, 
                questions: data.questions,
                title: data.title || file.name,
                topic: data.topic || '',
                subject: data.subject || '',
                grade: data.grade || ''
            };
            
            if(existing >= 0) {
                state.quizCatalog[existing] = entry;
            } else {
                state.quizCatalog.push(entry);
            }
            
            localStorage.setItem('quizCatalog', JSON.stringify(state.quizCatalog));
            
            alert(`✅ Quiz "${data.title || code}" saved!\nCode: ${code}\n${data.questions.length} questions loaded.`);
            
            state.quizMetadata = {
                title: entry.title,
                topic: entry.topic,
                subject: entry.subject,
                grade: entry.grade
            };
            startQuiz(data.questions);
            
        } catch(err) {
            alert("❌ Invalid JSON format!\n\nError: " + err.message);
            console.error(err);
        }
    };
    reader.readAsText(file);
}

// ========== GAMEPLAY CORE ==========
function startQuiz(questions) {
    if(!questions || questions.length === 0) {
        alert("No questions in file");
        showScreen('pin-screen');
        return;
    }
    
    state.questions = questions;
    state.currQIndex = 0;
    state.currPlayer = 1;
    state.scores = [0, 0];
    state.roundScore = 0;
    
    updateScoreboard();
    loadQuestion();
    showScreen('game-screen');
    
    console.log(`Quiz loaded: ${state.quizMetadata?.title || 'Unknown'} (${questions.length} questions)`);
}

function loadQuestion() {
    const q = state.questions[state.currQIndex];
    if(!q) {
        endGame();
        return;
    }

    state.isAnswered = false;
    state.roundScore = 0;
    selectedOptionIdx = null;
    
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('current-q').textContent = state.currQIndex + 1;
    document.getElementById('total-q').textContent = state.questions.length;
    
    const cont = document.getElementById('options-container');
    cont.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.textContent = `${String.fromCharCode(65+idx)}) ${opt}`;
        div.onclick = () => selectOption(div, idx);
        cont.appendChild(div);
    });

    document.getElementById('submit-answer').style.display = 'block';
    document.getElementById('submit-answer').disabled = false;
    document.getElementById('btn-hit').disabled = false;
    document.getElementById('btn-stand').disabled = false;
    
    document.getElementById('choice-section').style.display = 'none';
    document.getElementById('treasure-section').style.display = 'none';
    document.getElementById('risk-section').style.display = 'none';
    clearFeedback();
    
    updateTurnIndicator();
}

let selectedOptionIdx = null;

function selectOption(el, idx) {
    if(state.isAnswered) return;
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    selectedOptionIdx = idx;
}

function submitAnswer() {
    if(selectedOptionIdx === null || state.isAnswered) return;
    state.isAnswered = true;
    document.getElementById('submit-answer').disabled = true;

    const q = state.questions[state.currQIndex];
    const options = document.querySelectorAll('.option');
    const isCorrect = (selectedOptionIdx === q.correct);

    if(isCorrect) {
        options[selectedOptionIdx].classList.add('correct');
    } else {
        options[selectedOptionIdx].classList.add('incorrect');
        options[q.correct].classList.add('correct');
    }

    document.getElementById('submit-answer').style.display = 'none';

    if(isCorrect) {
        const base = q.points || 10;
        state.roundScore = base;
        
        let msg = `✅ CORRECT! Base: ${base} pts`;
        if(q.explanation) {
            msg += `\n\n💡 ${q.explanation}`;
        }
        showFeedback(msg, 'success');
        
        setTimeout(() => {
            document.getElementById('choice-section').style.display = 'block';
        }, q.explanation ? 3000 : 1500);
        
    } else {
        let msg = `❌ WRONG! Correct: ${String.fromCharCode(65+q.correct)}) ${q.options[q.correct]}`;
        if(q.explanation) {
            msg += `\n\n💡 ${q.explanation}`;
        }
        showFeedback(msg, 'error');
        
        setTimeout(() => {
            state.currQIndex++;
            loadQuestion(); 
        }, q.explanation ? 4000 : 2500);
    }
}

// ========== PHASE 2: CHOICE ==========
function startTreasurePhase() {
    document.getElementById('choice-section').style.display = 'none';
    document.getElementById('treasure-section').style.display = 'block';
    
    document.querySelectorAll('.t-box').forEach(b => {
        b.textContent = '?';
        b.classList.remove('opened');
        b.style.pointerEvents = 'auto';
    });
    document.getElementById('treasure-result').innerHTML = '';
}

function startRiskPhase() {
    document.getElementById('choice-section').style.display = 'none';
    document.getElementById('risk-section').style.display = 'block';
    updateRiskDisplay();
}

// ========== PHASE 3: TREASURE ==========
function handleTreasureOpen(box) {
    if(box.classList.contains('opened')) return;
    
    const effects = [
        { lbl: "🎯 Double Points!", val: 'x2' },
        { lbl: "💰 Bonus +20!", val: '+20' },
        { lbl: "😱 Half Points!", val: '/2' },
        { lbl: "🔄 Swap Scores!", val: 'swap' },
        { lbl: "🎁 Lucky +15!", val: '+15' }
    ];
    
    const effect = effects[Math.floor(Math.random() * effects.length)];
    
    if(effect.val === 'x2') state.roundScore *= 2;
    if(effect.val === '+20') state.roundScore += 20;
    if(effect.val === '+15') state.roundScore += 15;
    if(effect.val === '/2') state.roundScore = Math.floor(state.roundScore / 2);
    if(effect.val === 'swap') {
        let temp = state.scores[0];
        state.scores[0] = state.scores[1];
        state.scores[1] = temp;
        updateScoreboard();
    }

    box.textContent = effect.val === 'swap' ? '🔄' : effect.val === 'x2' ? '2X' : effect.val === '/2' ? '½' : '+';
    box.classList.add('opened');
    
    document.querySelectorAll('.t-box').forEach(b => b.style.pointerEvents = 'none');
    
    document.getElementById('treasure-result').innerHTML = 
        `<strong>${effect.lbl}</strong><br>Round Score: ${state.roundScore} pts`;
    
    setTimeout(() => {
        bankPointsAndNext();
    }, 2500);
}

// ========== PHASE 4: RISK (HIT/STAND) ==========
function updateRiskDisplay() {
    document.getElementById('risk-display').textContent = state.roundScore;
    
    const display = document.getElementById('risk-display');
    if(state.roundScore >= 40) {
        display.style.color = '#f56565';
    } else if(state.roundScore >= 30) {
        display.style.color = '#ed8936';
    } else {
        display.style.color = 'var(--gold)';
    }
}

function handleHit() {
    const add = Math.ceil(state.roundScore * 0.5);
    state.roundScore += add;
    updateRiskDisplay();

    if(state.roundScore > TARGET_SCORE) {
        state.roundScore = 0;
        updateRiskDisplay();
        showFeedback("💥 BUST! Score > 50! Lost all round points!", 'error');
        document.getElementById('btn-hit').disabled = true;
        document.getElementById('btn-stand').disabled = true;
        
        setTimeout(() => {
            switchPlayer();
            state.currQIndex++;
            loadQuestion();
        }, 2500);
    } else if(state.roundScore === TARGET_SCORE) {
        showFeedback("🎯 PERFECT 50! Maximum points!", 'success');
        document.getElementById('btn-hit').disabled = true;
        setTimeout(handleStand, 1500);
    } else {
        showFeedback(`🔥 Hit! +${add} pts (Total: ${state.roundScore})`, 'info');
    }
}

function handleStand() {
    showFeedback(`✅ Stand! Banking ${state.roundScore} points...`, 'success');
    document.getElementById('btn-hit').disabled = true;
    document.getElementById('btn-stand').disabled = true;
    
    setTimeout(() => {
        bankPointsAndNext();
    }, 1500);
}

// ========== UTILS ==========
function bankPointsAndNext() {
    state.scores[state.currPlayer - 1] += state.roundScore;
    updateScoreboard();
    
    if(state.scores[state.currPlayer - 1] >= 100) {
        endGame();
        return;
    }
    
    switchPlayer();
    state.currQIndex++;
    loadQuestion();
}

function switchPlayer() {
    state.currPlayer = state.currPlayer === 1 ? 2 : 1;
    updateTurnIndicator();
}

function updateScoreboard() {
    document.getElementById('score1').textContent = state.scores[0];
    document.getElementById('score2').textContent = state.scores[1];
    
    const roundNum = Math.floor(state.currQIndex / 2) + 1;
    document.getElementById('p1-round').textContent = `Round: ${roundNum}`;
    document.getElementById('p2-round').textContent = `Round: ${roundNum}`;
}

function updateTurnIndicator() {
    const p1Card = document.getElementById('player1');
    const p2Card = document.getElementById('player2');
    const banner = document.getElementById('current-player-name');
    
    if(state.currPlayer === 1) {
        p1Card.classList.add('active');
        p2Card.classList.remove('active');
        banner.textContent = "Player 1's Turn";
    } else {
        p2Card.classList.add('active');
        p1Card.classList.remove('active');
        banner.textContent = "Player 2's Turn";
    }
}

function endGame() {
    showScreen('game-over-screen');
    const s1 = state.scores[0];
    const s2 = state.scores[1];
    document.getElementById('final-p1').textContent = s1;
    document.getElementById('final-p2').textContent = s2;
    
    let msg = "It's a Tie! 🤝";
    if(s1 > s2) msg = "🏆 Player 1 Wins! 🏆";
    if(s2 > s1) msg = "🏆 Player 2 Wins! 🏆";
    document.getElementById('winner-text').textContent = msg;
}

// ========== CATALOG (HIDDEN) ==========
function scanForQuizzes() {
    alert("📡 Please enter the 6-digit quiz code.");
}

function clearCatalog() {
    if(confirm("⚠️ Clear all saved quizzes?")) {
        state.quizCatalog = [];
        localStorage.removeItem('quizCatalog');
        alert("✅ Catalog cleared!");
    }
}