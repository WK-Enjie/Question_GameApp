// ========== GAME CONFIGURATION ==========
const TARGET_SCORE = 50;

// ========== STATE ==========
const state = {
    pin: [],
    questions: [],
    currQIndex: 0,
    currPlayer: 1, // 1 or 2
    scores: [0, 0], // Total banked scores
    roundScore: 0,  // Current round accumulation
    isAnswered: false,
    quizCatalog: []
};

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log("🧧 CNY Game 50 Loaded");
    
    // Load Catalog
    const stored = localStorage.getItem('quizCatalog');
    if (stored) state.quizCatalog = JSON.parse(stored);
    renderCatalog();

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
});

// ========== NAVIGATION ==========
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showFeedback(msg, type) {
    const el = document.getElementById('feedback-area');
    el.textContent = msg;
    el.className = `feedback-area ${type}`; // success, error, info
    el.style.display = 'block';
}

function clearFeedback() {
    document.getElementById('feedback-area').style.display = 'none';
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
// Maps for decoding (Simplified for this version)
const LEVELS = { 1:'Primary', 2:'Lower Sec', 3:'Upper Sec' };
const SUBJECTS = { 0:'Math', 1:'Science', 2:'Comb Phy', 3:'Pure Phy', 4:'Comb Chem', 5:'Pure Chem' };

async function loadQuiz(code) {
    showScreen('loading-screen');
    
    // Decode logic
    const digits = code.split('').map(Number);
    const lvl = LEVELS[digits[0]] || 'Unknown';
    const sub = SUBJECTS[digits[1]] || 'General';
    const grade = digits[0] === 1 ? `P${digits[2]}` : `S${digits[2]}`;
    const ch = parseInt(`${digits[3]}${digits[4]}`);
    const ws = digits[5];
    
    // Construct path: Questions/folder/folder/code.json
    // NOTE: You must ensure your folder structure matches exactly or use flat structure
    // For safety, this code assumes a standard path. Adjust if your folders vary.
    let lvlFolder = digits[0] === 1 ? 'primary' : digits[0] === 2 ? 'lower-secondary' : 'upper-secondary';
    let subFolder = 'math'; // Defaulting for safety, add map if needed
    if(digits[1] === 1) subFolder = 'science';
    
    const filename = `${code}.json`;
    // We try to fetch. In a real app, you need exact paths. 
    // Here we use the path logic from your previous code:
    const path = `Questions/${lvlFolder}/${subFolder}/${filename}`; // Simplified path construction
    
    // Fallback for upload/test
    try {
        // Attempt fetch, if fails, throw
        const res = await fetch(path);
        if(!res.ok) throw new Error("File not found");
        const data = await res.json();
        startQuiz(data.questions);
    } catch (e) {
        console.warn("Fetch failed, trying catalog fallback or error", e);
        // Check catalog for local override
        const catItem = state.quizCatalog.find(q => q.code === code);
        if(catItem && catItem.questions) {
            startQuiz(catItem.questions);
        } else {
            alert("Quiz not found! Please upload JSON or check code.");
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
            startQuiz(data.questions);
        } catch(err) {
            alert("Invalid JSON");
        }
    };
    reader.readAsText(file);
}

// ========== GAMEPLAY CORE ==========
function startQuiz(questions) {
    if(!questions || questions.length === 0) {
        alert("No questions in file");
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
}

function loadQuestion() {
    const q = state.questions[state.currQIndex];
    if(!q) {
        endGame();
        return;
    }

    // Reset UI
    state.isAnswered = false;
    state.roundScore = 0;
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('current-q').textContent = state.currQIndex + 1;
    document.getElementById('total-q').textContent = state.questions.length;
    
    // Render Options
    const cont = document.getElementById('options-container');
    cont.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.textContent = `${String.fromCharCode(65+idx)}) ${opt}`;
        div.onclick = () => selectOption(div, idx);
        cont.appendChild(div);
    });

    // Hide Phases
    document.getElementById('submit-answer').style.display = 'block';
    document.getElementById('choice-section').style.display = 'none';
    document.getElementById('treasure-section').style.display = 'none';
    document.getElementById('risk-section').style.display = 'none';
    clearFeedback();
    
    // Update Turn UI
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

    const q = state.questions[state.currQIndex];
    const options = document.querySelectorAll('.option');
    const isCorrect = (selectedOptionIdx === q.correct);

    // Visuals
    if(isCorrect) options[selectedOptionIdx].classList.add('correct');
    else {
        options[selectedOptionIdx].classList.add('incorrect');
        options[q.correct].classList.add('correct');
    }

    document.getElementById('submit-answer').style.display = 'none';

    if(isCorrect) {
        // CORRECT: Logic -> Get Base Points -> Show Choice
        const base = q.points || 10;
        state.roundScore = base;
        showFeedback(`✅ CORRECT! Base: ${base} pts`, 'success');
        document.getElementById('choice-section').style.display = 'block';
    } else {
        // WRONG: Logic -> 0 Points -> Next Question -> KEEP TURN
        showFeedback(`❌ WRONG! Correct: ${String.fromCharCode(65+q.correct)}`, 'error');
        setTimeout(() => {
            state.currQIndex++;
            loadQuestion(); 
            // NOTE: currPlayer is NOT changed here (Winner keeps turn rule inverted: Loser keeps trying? 
            // Or did you mean "If player answers wrongly, next turn still his"? 
            // Yes, "If player answers wrongly, next turn still his." -> No switchPlayer call.
        }, 2500);
    }
}

// ========== PHASE 2: CHOICE ==========
function startTreasurePhase() {
    document.getElementById('choice-section').style.display = 'none';
    document.getElementById('treasure-section').style.display = 'block';
    // Reset boxes
    document.querySelectorAll('.t-box').forEach(b => {
        b.textContent = '?';
        b.style.background = 'var(--gold)';
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
    const effects = [
        { lbl: "Double Points!", val: 'x2' },
        { lbl: "Bonus +20", val: '+20' },
        { lbl: "Half Points", val: '/2' },
        { lbl: "Swap Scores!", val: 'swap' },
        { lbl: "Drop 50%", val: '/2' } // Same as half effectively
    ];
    
    const effect = effects[Math.floor(Math.random() * effects.length)];
    
    // Apply Effect
    if(effect.val === 'x2') state.roundScore *= 2;
    if(effect.val === '+20') state.roundScore += 20;
    if(effect.val === '/2') state.roundScore = Math.floor(state.roundScore / 2);
    if(effect.val === 'swap') {
        let temp = state.scores[0];
        state.scores[0] = state.scores[1];
        state.scores[1] = temp;
        updateScoreboard();
    }

    // UI Update
    box.textContent = effect.val === 'swap' ? '🔄' : '💰';
    box.style.background = '#fff';
    document.querySelectorAll('.t-box').forEach(b => b.style.pointerEvents = 'none'); // Lock
    
    showFeedback(`${effect.lbl} Round Score: ${state.roundScore}`, 'info');
    
    // Auto-Stand after delay
    setTimeout(() => {
        bankPointsAndNext();
    }, 2000);
}

// ========== PHASE 4: RISK (HIT/STAND) ==========
function updateRiskDisplay() {
    document.getElementById('risk-display').textContent = state.roundScore;
}

function handleHit() {
    // Add 50% of current score
    const add = Math.ceil(state.roundScore * 0.5);
    state.roundScore += add;
    updateRiskDisplay();

    if(state.roundScore > TARGET_SCORE) {
        // BUST
        state.roundScore = 0; // Lose round points
        updateRiskDisplay();
        showFeedback("💥 BUST! Score > 50", 'error');
        document.getElementById('btn-hit').disabled = true;
        document.getElementById('btn-stand').disabled = true;
        
        setTimeout(() => {
            // Bust means turn ends, no points
            switchPlayer();
            state.currQIndex++;
            loadQuestion();
        }, 2000);
    } else {
        showFeedback(`🔥 Hit! +${add} pts`, 'info');
    }
}

function handleStand() {
    showFeedback(`✅ Stand! Banking ${state.roundScore}...`, 'success');
    setTimeout(() => {
        bankPointsAndNext();
    }, 1000);
}

// ========== UTILS ==========
function bankPointsAndNext() {
    // Add round score to total
    state.scores[state.currPlayer - 1] += state.roundScore;
    updateScoreboard();
    
    // Next Turn
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
    
    let msg = "It's a Tie!";
    if(s1 > s2) msg = "Player 1 Wins! 🏆";
    if(s2 > s1) msg = "Player 2 Wins! 🏆";
    document.getElementById('winner-text').textContent = msg;
}

// ========== CATALOG & SCAN ==========
function renderCatalog() {
    const el = document.getElementById('quiz-catalog');
    el.innerHTML = state.quizCatalog.map(q => 
        `<div class="cat-item" onclick="loadQuiz('${q.code}')">${q.code}</div>`
    ).join('');
}

// Mock Scanner (Simulates finding files if you don't have a backend listing)
function scanForQuizzes() {
    alert("Scanning folder... (Ensure JSON files are in Questions/...)");
    // In a static file setup without a backend, we can't truly 'scan' directories.
    // This is a placeholder. You should manually add known codes to catalog or use upload.
    // For demo:
    const demo = { code: '202031', questions: [{question:"1+1?", options:["1","2"], correct:1, points:10}] };
    if(!state.quizCatalog.some(q=>q.code === '202031')) {
        state.quizCatalog.push(demo);
        localStorage.setItem('quizCatalog', JSON.stringify(state.quizCatalog));
        renderCatalog();
    }
}