// ================================================================
//  QUIZ FLIP — CARD BATTLE GAME
//  Complete Game Logic
// ================================================================

// ========== GAME STATE ==========
const gameState = {
    // PIN
    pin: ['', '', '', '', '', ''],
    currentDigit: 0,

    // Quiz data
    questions: [],
    currentQuizCode: '',
    quizCatalog: [],
    quizInfo: null,

    // Core game
    currentQuestion: -1,
    currentPlayer: 1,
    scores: [0, 0],
    selectedAnswer: null,
    answered: false,

    // Cards
    cards: [],
    flippedCount: 0,
    totalCards: 0,

    // Streaks
    streaks: [0, 0],
    bestStreaks: [0, 0],

    // Per-player stats
    correctCounts: [0, 0],
    totalAnswered: [0, 0],
    fastestAnswer: [Infinity, Infinity],

    // Timer
    timeLeft: 15,
    timerInterval: null,
    timerMax: 15,
    answerStartTime: 0,

    // Treasure
    canPickTreasure: false,
    treasurePicked: false,

    // Sound
    soundEnabled: true,

    // Special card indices (assigned at game start)
    specialCards: new Set(),   // ⚡ double-point cards
    bonusCards: new Set()      // 🎁 treasure cards
};


// ================================================================
//  QUIZ CODE DECODER  (unchanged — works with existing worksheets)
// ================================================================
const SUBJECTS = {
    0: { name: 'Mathematics',        folder: 'math' },
    1: { name: 'Science',            folder: 'science' },
    2: { name: 'Combined Physics',   folder: 'combined-physics' },
    3: { name: 'Pure Physics',       folder: 'pure-physics' },
    4: { name: 'Combined Chemistry', folder: 'combined-chem' },
    5: { name: 'Pure Chemistry',     folder: 'pure-chem' }
};

const LEVELS = {
    1: { name: 'Primary',          folder: 'primary' },
    2: { name: 'Lower Secondary',  folder: 'lower-secondary' },
    3: { name: 'Upper Secondary',  folder: 'upper-secondary' }
};

function decodeQuizCode(code) {
    const digits = code.split('').map(d => parseInt(d));
    if (digits.length !== 6) return null;

    const [levelDigit, subjectDigit, gradeDigit, chap10, chap1, worksheet] = digits;
    if (levelDigit < 1 || levelDigit > 3) return null;
    if (subjectDigit < 0 || subjectDigit > 5) return null;

    const level   = LEVELS[levelDigit];
    const subject = SUBJECTS[subjectDigit];
    const formattedCode = `${levelDigit}${subjectDigit}${gradeDigit}-${chap10}${chap1}-${worksheet}`;
    const filename = `${levelDigit}${subjectDigit}${gradeDigit}${chap10}${chap1}${worksheet}.json`;
    const filepath = `Questions/${level.folder}/${subject.folder}/${filename}`;
    const gradeLabel = levelDigit === 1 ? `P${gradeDigit}` : `S${gradeDigit}`;

    return {
        code: formattedCode,
        rawCode: code,
        filename, filepath,
        level: level.name,
        subject: subject.name,
        grade: gradeDigit,
        gradeLabel,
        chapter: parseInt(`${chap10}${chap1}`),
        worksheet,
        fullName: `${level.name} ${gradeLabel} ${subject.name} Ch ${parseInt(`${chap10}${chap1}`)} WS ${worksheet}`
    };
}


// ================================================================
//  SOUND ENGINE  (Web Audio API — no files needed)
// ================================================================
class SoundEngine {
    constructor() { this.ctx = null; this.enabled = true; }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    play(type) {
        if (!this.enabled) return;
        try { this.init(); this['_' + type]?.(); } catch (e) { /* silent */ }
    }

    _tone(freq, dur, wave = 'sine', vol = 0.13) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = wave;
        o.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(vol, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        o.connect(g).connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + dur);
    }

    _cardFlip() {
        this._tone(800, 0.07, 'sine', 0.09);
        setTimeout(() => this._tone(1200, 0.05, 'sine', 0.07), 50);
    }

    _correct() {
        this._tone(523, 0.12, 'sine', 0.14);
        setTimeout(() => this._tone(659, 0.12, 'sine', 0.14), 100);
        setTimeout(() => this._tone(784, 0.18, 'sine', 0.14), 200);
    }

    _incorrect() {
        this._tone(330, 0.18, 'square', 0.07);
        setTimeout(() => this._tone(260, 0.25, 'square', 0.07), 140);
    }

    _select()      { this._tone(600, 0.05, 'sine', 0.07); }
    _tick()         { this._tone(1000, 0.025, 'sine', 0.04); }
    _timeWarning()  { this._tone(800, 0.08, 'square', 0.06); }

    _treasure() {
        [523, 659, 784, 1047].forEach((f, i) =>
            setTimeout(() => this._tone(f, 0.13, 'sine', 0.11), i * 75));
    }

    _powerup() {
        [400, 600, 900, 1200].forEach((f, i) =>
            setTimeout(() => this._tone(f, 0.12, 'sine', 0.1), i * 70));
    }

    _gameOver() {
        [523, 494, 440, 392, 523, 659, 784].forEach((f, i) =>
            setTimeout(() => this._tone(f, 0.22, 'sine', 0.11), i * 140));
    }

    _streak() {
        this._tone(880, 0.08, 'sine', 0.1);
        setTimeout(() => this._tone(1100, 0.12, 'sine', 0.11), 75);
    }

    _buttonClick() { this._tone(500, 0.035, 'sine', 0.06); }

    toggle() { this.enabled = !this.enabled; return this.enabled; }
}

const sound = new SoundEngine();


// ================================================================
//  CONFETTI ENGINE
// ================================================================
class ConfettiEngine {
    constructor(id) {
        this.canvas = document.getElementById(id);
        this.cx = this.canvas.getContext('2d');
        this.particles = [];
        this.running = false;
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    burst(x, y, count = 35) {
        const colors = [
            '#667eea','#764ba2','#f59e0b','#10b981',
            '#ef4444','#3b82f6','#ec4899','#8b5cf6'
        ];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
            const speed = 3 + Math.random() * 8;
            this.particles.push({
                x: x ?? this.canvas.width / 2,
                y: y ?? this.canvas.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 3 + Math.random() * 6,
                rot: Math.random() * 360,
                rotV: (Math.random() - 0.5) * 12,
                life: 1,
                decay: 0.012 + Math.random() * 0.014,
                shape: Math.random() > 0.5 ? 'r' : 'c'
            });
        }
        if (!this.running) { this.running = true; this._loop(); }
    }

    celebrate() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.burst(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height * 0.5, 28
            ), i * 200);
        }
    }

    _loop() {
        this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.14;
            p.vx *= 0.99; p.rot += p.rotV; p.life -= p.decay;
            if (p.life <= 0) return false;

            this.cx.save();
            this.cx.translate(p.x, p.y);
            this.cx.rotate(p.rot * Math.PI / 180);
            this.cx.globalAlpha = p.life;
            this.cx.fillStyle = p.color;
            if (p.shape === 'r')
                this.cx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            else {
                this.cx.beginPath();
                this.cx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.cx.fill();
            }
            this.cx.restore();
            return true;
        });
        if (this.particles.length) requestAnimationFrame(() => this._loop());
        else this.running = false;
    }
}

let confetti; // initialised in DOMContentLoaded


// ================================================================
//  FLOATING SCORE POPUP
// ================================================================
function showScorePopup(text, x, y, type = 'positive') {
    const el = document.createElement('div');
    el.className = `score-popup ${type}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
    document.getElementById('score-popups').appendChild(el);
    setTimeout(() => el.remove(), 1400);
}


// ================================================================
//  SCREEN MANAGEMENT
// ================================================================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
}


// ================================================================
//  PIN INPUT  (unchanged API)
// ================================================================
function updatePinDisplay() {
    for (let i = 1; i <= 6; i++) {
        const el = document.getElementById(`digit${i}`);
        const v  = gameState.pin[i - 1];
        if (!el) continue;
        el.querySelector('.digit-number').textContent = v || '_';
        el.classList.toggle('filled', v !== '');
    }
}
function addDigit(d)       { if (gameState.currentDigit < 6) { gameState.pin[gameState.currentDigit++] = d; updatePinDisplay(); sound.play('buttonClick'); } }
function removeLastDigit() { if (gameState.currentDigit > 0) { gameState.pin[--gameState.currentDigit] = ''; updatePinDisplay(); } }
function clearPin()        { gameState.pin = ['','','','','','']; gameState.currentDigit = 0; updatePinDisplay(); }
function setPinFromCode(c) { clearPin(); c.split('').forEach(d => addDigit(d)); }


// ================================================================
//  FILE SCANNER  (unchanged)
// ================================================================
async function scanForQuizzes() {
    showScreen('loading-screen');
    const msg  = document.getElementById('loading-message');
    const det  = document.getElementById('loading-details');
    const bar  = document.getElementById('scan-progress');
    const cnt  = document.getElementById('quiz-found');
    gameState.quizCatalog = [];

    const paths = [
        { level: 1, ln: 'primary',         subj: [0, 1] },
        { level: 2, ln: 'lower-secondary', subj: [0, 1] },
        { level: 3, ln: 'upper-secondary', subj: [0, 2, 3, 4, 5] }
    ];

    try {
        msg.textContent = 'Checking Questions folder…';
        det.textContent = 'Looking for quiz files…';
        const base = await fetch('Questions/');
        if (!base.ok) throw new Error('Questions folder not found.');

        const total = paths.reduce((a, p) => a + p.subj.length, 0);
        let step = 0;
        for (const p of paths) {
            for (const s of p.subj) {
                step++;
                det.textContent = `Scanning ${p.ln}/${SUBJECTS[s].name}…`;
                bar.style.width = `${(step / total) * 100}%`;
                try { await fetch(`Questions/${p.ln}/${SUBJECTS[s].folder}/`); } catch (_) {}
            }
        }

        await loadCatalogFromStorage();
        bar.style.width = '100%';
        cnt.textContent = gameState.quizCatalog.length;

        setTimeout(() => {
            msg.textContent = gameState.quizCatalog.length ? 'Scan complete!' : 'No quizzes found';
            det.textContent = gameState.quizCatalog.length
                ? `Found ${gameState.quizCatalog.length} quiz files`
                : 'Add JSON quiz files to the Questions folder';
            setTimeout(() => { showScreen('pin-screen'); updateCatalogDisplay(); }, 1500);
        }, 800);
    } catch (e) {
        msg.textContent = 'Scan failed';
        det.textContent = e.message;
        setTimeout(() => { showScreen('pin-screen'); updateCatalogDisplay(); }, 2000);
    }
}


// ================================================================
//  CATALOG MANAGEMENT  (unchanged)
// ================================================================
async function loadCatalogFromStorage() {
    const s = localStorage.getItem('quizCatalog');
    if (s) { gameState.quizCatalog = JSON.parse(s); return; }

    gameState.quizCatalog = [
        { code:'101-01-1', filename:'101011.json', path:'Questions/primary/math/101011.json',                          name:'P1 Math Chapter 1' },
        { code:'201-01-1', filename:'201011.json', path:'Questions/lower-secondary/math/201011.json',                  name:'Sec 1 Math Chapter 1' },
        { code:'201-01-2', filename:'201012.json', path:'Questions/lower-secondary/math/201012.json',                  name:'Sec 1 Math Ch 1 WS 2' },
        { code:'342-09-1', filename:'342091.json', path:'Questions/upper-secondary/combined-chem/342091.json',         name:'Sec 4 Comb Chem Ch 9' }
    ];
    localStorage.setItem('quizCatalog', JSON.stringify(gameState.quizCatalog));
}

function addQuizToCatalog(info) {
    if (gameState.quizCatalog.find(q => q.code === info.code)) return false;
    gameState.quizCatalog.push({
        code: info.code, filename: info.filename, path: info.filepath,
        name: info.fullName, subject: info.subject, level: info.level, grade: info.gradeLabel
    });
    localStorage.setItem('quizCatalog', JSON.stringify(gameState.quizCatalog));
    updateCatalogDisplay();
    return true;
}

function updateCatalogDisplay() {
    const el  = document.getElementById('quiz-catalog');
    const cnt = document.getElementById('quiz-count');
    if (!gameState.quizCatalog.length) {
        el.innerHTML = '<div class="no-quizzes"><i class="fas fa-search"></i><h4>No quizzes found</h4><p>Add JSON files to the Questions folder</p></div>';
        cnt.textContent = '0 quizzes';
        return;
    }
    const sorted = [...gameState.quizCatalog].sort((a, b) => a.code.localeCompare(b.code));
    el.innerHTML = sorted.map(q => `
        <div class="quiz-item" data-code="${q.code.replace(/-/g,'')}">
            <div class="quiz-header"><span class="quiz-code">${q.code}</span><span class="quiz-name">${q.name}</span></div>
            <div class="quiz-details">${q.level||''} · ${q.grade||''} · ${q.subject||''}</div>
        </div>`).join('');
    cnt.textContent = `${gameState.quizCatalog.length} quizzes`;

    document.querySelectorAll('.quiz-item').forEach(item =>
        item.addEventListener('click', function() {
            setPinFromCode(this.dataset.code);
            setTimeout(submitPin, 500);
        })
    );
}


// ================================================================
//  LOAD QUIZ  (unchanged JSON path logic)
// ================================================================
async function loadQuizByCode(code) {
    const info = decodeQuizCode(code);
    if (!info) return { success: false, error: `Invalid code: ${code}` };
    gameState.currentQuizCode = info.code;
    document.getElementById('loading-message').textContent = `Loading ${info.code}…`;

    try {
        const res = await fetch(info.filepath);
        if (!res.ok) throw new Error(res.status === 404 ? `File not found: ${info.filename}` : `HTTP ${res.status}`);
        const data = await res.json();
        if (!data.questions?.length) throw new Error('Invalid or empty quiz file');
        addQuizToCatalog(info);
        return { success: true, data, info };
    } catch (e) {
        return { success: false, error: e.message };
    }
}


// ================================================================
//  SUBMIT PIN  →  LOAD  →  START GAME
// ================================================================
async function submitPin() {
    const pin = gameState.pin.join('');
    if (pin.length !== 6) { alert('Please enter all 6 digits'); return; }

    showScreen('loading-screen');
    document.getElementById('loading-message').textContent = 'Loading quiz…';
    document.getElementById('loading-details').textContent  = '';
    document.getElementById('scan-progress').style.width     = '50%';

    try {
        const result = await loadQuizByCode(pin);
        if (!result.success) {
            const qi = decodeQuizCode(pin);
            let html = `<strong>Worksheet ${qi?.code || pin} not found</strong><br><br>`;
            html += `<div style="color:#94a3b8;font-size:.9rem">Error: ${result.error}</div>`;
            if (qi && result.error.includes('not found'))
                html += `<br><div style="background:rgba(102,126,234,.1);padding:15px;border-radius:10px"><strong>Expected:</strong><br><code style="background:rgba(102,126,234,.2);padding:5px 10px;border-radius:5px">${qi.filepath}</code></div>`;
            if (gameState.quizCatalog.length) {
                html += `<br><strong>Available:</strong><br>`;
                gameState.quizCatalog.slice(0, 5).forEach(q =>
                    html += `<div style="margin:5px 0;padding:8px;background:rgba(255,255,255,.05);border-radius:5px">• <strong>${q.code}</strong>: ${q.name}</div>`);
            }
            throw new Error(html);
        }

        document.getElementById('scan-progress').style.width = '100%';
        gameState.questions = result.data.questions;
        gameState.quizInfo  = result.info;

        document.getElementById('quiz-title').textContent          = result.data.title || result.info.fullName;
        document.getElementById('quiz-topic').textContent          = `${result.info.subject} · ${result.info.gradeLabel}`;
        document.getElementById('current-quiz-code').textContent   = result.info.code;

        setTimeout(() => { initGame(); showScreen('game-screen'); }, 350);
    } catch (e) {
        setTimeout(() => { document.getElementById('error-message').innerHTML = e.message; showScreen('error-screen'); }, 500);
    }
}


// ================================================================
//  CARD BOARD GENERATION
// ================================================================
function generateCardBoard() {
    const board = document.getElementById('card-board');
    board.innerHTML = '';

    const total = gameState.questions.length;
    gameState.totalCards  = total;
    gameState.flippedCount = 0;
    gameState.cards = [];

    // ----- assign special / bonus cards -----
    gameState.specialCards.clear();
    gameState.bonusCards.clear();

    const indices  = Array.from({ length: total }, (_, i) => i);
    const shuffled = [...indices].sort(() => Math.random() - 0.5);

    const nSpecial = Math.max(1, Math.floor(total * 0.15));
    const nBonus   = Math.max(1, Math.floor(total * 0.12));
    shuffled.slice(0, nSpecial).forEach(i => gameState.specialCards.add(i));
    shuffled.slice(nSpecial, nSpecial + nBonus).forEach(i => gameState.bonusCards.add(i));

    // ----- grid columns -----
    let cols = 5;
    if (total <= 4)       cols = 2;
    else if (total <= 6)  cols = 3;
    else if (total <= 9)  cols = 3;
    else if (total <= 12) cols = 4;
    else if (total <= 20) cols = 5;
    else                  cols = 6;
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    // ----- create cards -----
    for (let i = 0; i < total; i++) {
        const isSpecial = gameState.specialCards.has(i);
        const isBonus   = gameState.bonusCards.has(i);

        const card = document.createElement('div');
        card.className = 'flip-card';
        card.dataset.index = i;
        card.style.animationDelay = `${i * 0.06}s`;

        if (isSpecial) card.classList.add('card-special');
        if (isBonus)   card.classList.add('card-bonus');

        let icon = '❓';
        if (isSpecial) icon = '⚡';
        else if (isBonus) icon = '🎁';

        card.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    <span class="card-number">${i + 1}</span>
                    <span class="card-icon">${icon}</span>
                </div>
                <div class="flip-card-back">
                    <span class="card-result-icon"></span>
                    <span class="card-result-label"></span>
                </div>
            </div>`;

        card.addEventListener('click', () => onCardClick(i));
        board.appendChild(card);

        gameState.cards.push({ element: card, index: i, flipped: false, result: null, owner: null });
    }
}


// ================================================================
//  INIT / RESET GAME
// ================================================================
function initGame() {
    gameState.currentQuestion = -1;
    gameState.currentPlayer   = 1;
    gameState.scores          = [0, 0];
    gameState.streaks         = [0, 0];
    gameState.bestStreaks      = [0, 0];
    gameState.correctCounts   = [0, 0];
    gameState.totalAnswered   = [0, 0];
    gameState.fastestAnswer   = [Infinity, Infinity];
    gameState.selectedAnswer  = null;
    gameState.answered        = false;
    gameState.canPickTreasure = false;
    gameState.treasurePicked  = false;

    hideQuestionOverlay();
    hideTreasureOverlay();
    hideGameOver();
    updateScores();
    updateStreaks();
    updatePlayerTurn();
    generateCardBoard();
    document.getElementById('cards-remaining').textContent = gameState.totalCards;
}


// ================================================================
//  CARD CLICK  →  FLIP  →  SHOW QUESTION
// ================================================================
function onCardClick(idx) {
    const c = gameState.cards[idx];
    if (c.flipped || document.getElementById('question-overlay').classList.contains('show')) return;

    gameState.currentQuestion = idx;
    c.flipped = true;
    c.owner   = gameState.currentPlayer;
    c.element.classList.add('flipped', `owner-p${gameState.currentPlayer}`);

    gameState.flippedCount++;
    document.getElementById('cards-remaining').textContent = gameState.totalCards - gameState.flippedCount;

    sound.play('cardFlip');
    setTimeout(() => showQuestion(idx), 450);
}


// ================================================================
//  QUESTION OVERLAY
// ================================================================
function showQuestion(idx) {
    const q = gameState.questions[idx];
    if (!q) return;

    // --- reset state ---
    gameState.selectedAnswer = null;
    gameState.answered       = false;

    // --- points ---
    let pts      = q.points || 10;
    const isDbl  = gameState.specialCards.has(idx);
    const isBns  = gameState.bonusCards.has(idx);
    if (isDbl) pts *= 2;

    // --- header badges ---
    document.getElementById('q-number').textContent = `Q${idx + 1}`;
    document.getElementById('q-points').textContent = `${pts} pts`;

    const sp = document.getElementById('q-special');
    sp.textContent = '';
    sp.className   = 'q-special-badge';
    if (isDbl)      { sp.textContent = '⚡ DOUBLE'; sp.classList.add('double'); }
    else if (isBns) { sp.textContent = '🎁 TREASURE'; }

    // --- question text ---
    document.getElementById('question-text').textContent = q.question || 'Question';

    // --- options ---
    const optBox = document.getElementById('options-container');
    optBox.innerHTML = '';
    (q.options || []).forEach((o, i) => {
        const btn = document.createElement('button');
        btn.className = 'q-option';
        btn.dataset.index = i;
        btn.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + i)}</span><span class="option-text">${o}</span>`;
        btn.addEventListener('click', () => selectOption(i));
        optBox.appendChild(btn);
    });

    // --- buttons ---
    const sub = document.getElementById('submit-answer');
    sub.disabled  = true;
    sub.classList.remove('hidden');
    sub.innerHTML = '<i class="fas fa-lock"></i><span>Lock In Answer</span>';

    const exp = document.getElementById('q-explanation');
    exp.className = 'q-explanation';
    exp.innerHTML = '';

    const nxt = document.getElementById('next-btn');
    nxt.classList.remove('show');
    nxt.style.display = 'none';

    // --- show overlay ---
    document.getElementById('question-overlay').classList.add('show');

    // --- start timer ---
    gameState.answerStartTime = Date.now();
    startTimer(q.time || 15);
}

function hideQuestionOverlay() {
    document.getElementById('question-overlay').classList.remove('show');
    stopTimer();
}


// ================================================================
//  OPTION SELECTION
// ================================================================
function selectOption(i) {
    if (gameState.answered) return;
    sound.play('select');

    document.querySelectorAll('.q-option').forEach(o => o.classList.remove('selected'));
    const opts = document.querySelectorAll('.q-option');
    if (opts[i]) {
        opts[i].classList.add('selected');
        gameState.selectedAnswer = i;
        const sub = document.getElementById('submit-answer');
        sub.disabled  = false;
        sub.innerHTML = '<i class="fas fa-check-circle"></i><span>Lock In Answer</span>';
    }
}


// ================================================================
//  SUBMIT ANSWER
// ================================================================
function submitAnswer() {
    if (gameState.answered || gameState.selectedAnswer === null) return;

    gameState.answered = true;
    stopTimer();

    const idx      = gameState.currentQuestion;
    const q        = gameState.questions[idx];
    const correct  = gameState.selectedAnswer === q.correct;
    const pi       = gameState.currentPlayer - 1;        // player index
    const isDbl    = gameState.specialCards.has(idx);
    const isBns    = gameState.bonusCards.has(idx);
    const timeTaken = (Date.now() - gameState.answerStartTime) / 1000;

    // stats
    gameState.totalAnswered[pi]++;

    // hide submit button
    document.getElementById('submit-answer').classList.add('hidden');

    // lock & colour options
    document.querySelectorAll('.q-option').forEach((o, i) => {
        o.classList.add('locked');
        if (i === q.correct)                              o.classList.add('correct');
        else if (i === gameState.selectedAnswer && !correct) o.classList.add('incorrect');
        else                                               o.classList.add('dimmed');
    });

    const cardData = gameState.cards[idx];

    // ===================== CORRECT =====================
    if (correct) {
        // fastest
        if (timeTaken < gameState.fastestAnswer[pi]) gameState.fastestAnswer[pi] = timeTaken;

        // streak
        gameState.streaks[pi]++;
        const streak = gameState.streaks[pi];
        if (streak > gameState.bestStreaks[pi]) gameState.bestStreaks[pi] = streak;
        gameState.correctCounts[pi]++;

        // points  (base × double? × streak multiplier)
        let basePts    = q.points || 10;
        let multiplier = isDbl ? 2 : 1;
        if (streak >= 5)      multiplier += 1;
        else if (streak >= 3) multiplier += 0.5;

        const totalPts = Math.round(basePts * multiplier);
        gameState.scores[pi] += totalPts;

        // --- audio ---
        sound.play('correct');
        if (streak >= 3) sound.play('streak');

        // --- card back ---
        cardData.element.classList.add('result-correct');
        cardData.element.querySelector('.card-result-icon').textContent  = '✅';
        cardData.element.querySelector('.card-result-label').textContent = `+${totalPts}`;

        // --- confetti ---
        const cr = cardData.element.getBoundingClientRect();
        confetti.burst(cr.left + cr.width / 2, cr.top + cr.height / 2, 25);

        // --- floating popup ---
        const sbRect = document.getElementById(`sb-p${gameState.currentPlayer}`).getBoundingClientRect();
        showScorePopup(`+${totalPts}`, sbRect.left + sbRect.width / 2, sbRect.top, 'positive');
        if (streak >= 3) showScorePopup(`🔥 ${streak}x Streak!`, sbRect.left + sbRect.width / 2, sbRect.top - 35, 'bonus');

        // --- score pulse ---
        pulseScore(gameState.currentPlayer, 'up');
        glowPlayer(gameState.currentPlayer);

        updateScores();
        updateStreaks();

        // --- explanation ---
        let html = `<div><strong>✅ Correct! +${totalPts} points</strong>`;
        if (multiplier > 1) {
            const reasons = [];
            if (isDbl)       reasons.push('⚡ Double card');
            if (streak >= 3) reasons.push(`🔥 ${streak}x streak`);
            html += `<br><small>${reasons.join(' · ')}</small>`;
        }
        if (q.explanation) html += `<br><br>${q.explanation}`;
        html += '</div>';

        const exp = document.getElementById('q-explanation');
        exp.innerHTML = html;
        exp.className = 'q-explanation correct-exp show';

        // --- next action ---
        if (isBns) {
            // treasure card — open treasure overlay
            gameState.canPickTreasure = true;
            gameState.treasurePicked  = false;
            const nxt = document.getElementById('next-btn');
            nxt.innerHTML = '<span>🎁 Open Treasure!</span><i class="fas fa-gift"></i>';
            nxt.classList.add('show');
            nxt.style.display = 'flex';
            nxt.onclick = () => { hideQuestionOverlay(); setTimeout(showTreasureOverlay, 200); };
        } else {
            buildNextButton(true);     // keep turn
        }

    // ===================== INCORRECT =====================
    } else {
        gameState.streaks[pi] = 0;

        sound.play('incorrect');

        cardData.element.classList.add('result-incorrect', 'shake');
        cardData.element.querySelector('.card-result-icon').textContent  = '❌';
        cardData.element.querySelector('.card-result-label').textContent = 'Miss';

        // screen shake
        const gs = document.getElementById('game-screen');
        gs.classList.add('screen-shake');
        setTimeout(() => gs.classList.remove('screen-shake'), 450);

        const letter = String.fromCharCode(65 + q.correct);
        let html = `<div><strong>❌ Incorrect</strong><br>Correct: <strong>${letter}) ${q.options[q.correct]}</strong>`;
        if (q.explanation) html += `<br><br>${q.explanation}`;
        html += '</div>';

        const exp = document.getElementById('q-explanation');
        exp.innerHTML = html;
        exp.className = 'q-explanation incorrect-exp show';

        updateStreaks();
        buildNextButton(false);        // switch player
    }
}


// ================================================================
//  TIME-UP HANDLER
// ================================================================
function timeUp() {
    if (gameState.answered) return;
    gameState.answered = true;
    sound.play('incorrect');

    const idx = gameState.currentQuestion;
    const q   = gameState.questions[idx];
    const pi  = gameState.currentPlayer - 1;

    gameState.totalAnswered[pi]++;
    gameState.streaks[pi] = 0;

    document.getElementById('submit-answer').classList.add('hidden');

    document.querySelectorAll('.q-option').forEach((o, i) => {
        o.classList.add('locked');
        if (i === q.correct) o.classList.add('correct');
        else                 o.classList.add('dimmed');
    });

    const cd = gameState.cards[idx];
    cd.element.classList.add('result-incorrect', 'shake');
    cd.element.querySelector('.card-result-icon').textContent  = '⏰';
    cd.element.querySelector('.card-result-label').textContent = 'Time!';

    const letter = String.fromCharCode(65 + q.correct);
    const exp = document.getElementById('q-explanation');
    exp.innerHTML = `<div><strong>⏰ Time's Up!</strong><br>Answer: <strong>${letter}) ${q.options[q.correct]}</strong>${q.explanation ? `<br><br>${q.explanation}` : ''}</div>`;
    exp.className = 'q-explanation incorrect-exp show';

    updateStreaks();
    buildNextButton(false);
}


// ================================================================
//  NEXT / CONTINUE BUTTON
// ================================================================
function buildNextButton(keepTurn) {
    const btn = document.getElementById('next-btn');
    btn.innerHTML = '<span>Continue</span><i class="fas fa-arrow-right"></i>';
    btn.classList.add('show');
    btn.style.display = 'flex';

    btn.onclick = () => {
        hideQuestionOverlay();
        if (!keepTurn) gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        updatePlayerTurn();
        if (gameState.flippedCount >= gameState.totalCards) setTimeout(endGame, 500);
    };
}


// ================================================================
//  TIMER
// ================================================================
function startTimer(secs) {
    gameState.timeLeft = secs;
    gameState.timerMax = secs;
    renderTimer();

    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft -= 0.1;
        if (gameState.timeLeft <= 0) { gameState.timeLeft = 0; stopTimer(); timeUp(); return; }
        renderTimer();
        // tick in last 5 s
        if (gameState.timeLeft <= 5 && Math.abs(gameState.timeLeft - Math.round(gameState.timeLeft)) < 0.06)
            sound.play('tick');
    }, 100);
}

function stopTimer() { clearInterval(gameState.timerInterval); }

function renderTimer() {
    const pct   = (gameState.timeLeft / gameState.timerMax) * 100;
    const bar   = document.getElementById('timer-bar');
    const text  = document.getElementById('timer-text');
    const clock = text.parentElement;

    bar.style.width = `${pct}%`;
    text.textContent = Math.ceil(gameState.timeLeft);

    bar.classList.remove('warning', 'danger');
    clock.classList.remove('warning', 'danger');

    if (gameState.timeLeft <= 3)       { bar.classList.add('danger');  clock.classList.add('danger'); }
    else if (gameState.timeLeft <= 7)  { bar.classList.add('warning'); clock.classList.add('warning'); }
}


// ================================================================
//  SCORES · STREAKS · TURN
// ================================================================
function updateScores() {
    document.getElementById('score1').textContent = gameState.scores[0];
    document.getElementById('score2').textContent = gameState.scores[1];
}

function updateStreaks() {
    document.getElementById('streak-count1').textContent = gameState.streaks[0];
    document.getElementById('streak-count2').textContent = gameState.streaks[1];
    document.getElementById('streak1').classList.toggle('on-fire', gameState.streaks[0] >= 2);
    document.getElementById('streak2').classList.toggle('on-fire', gameState.streaks[1] >= 2);
}

function updatePlayerTurn() {
    document.getElementById('sb-p1').classList.toggle('active', gameState.currentPlayer === 1);
    document.getElementById('sb-p2').classList.toggle('active', gameState.currentPlayer === 2);

    const banner = document.getElementById('turn-banner');
    banner.className = `turn-banner p${gameState.currentPlayer}-turn`;
    document.getElementById('turn-avatar').textContent = gameState.currentPlayer === 1 ? '😎' : '🤓';
    document.getElementById('turn-text').textContent   = `Player ${gameState.currentPlayer}'s Turn — Pick a card!`;
}

function pulseScore(player, dir) {
    const el = document.getElementById(`score${player}`);
    el.classList.remove('pulse-up', 'pulse-down');
    void el.offsetWidth;                               // reflow
    el.classList.add(dir === 'up' ? 'pulse-up' : 'pulse-down');
}

function glowPlayer(player) {
    const el = document.getElementById(`sb-p${player}`);
    el.classList.remove('got-correct');
    void el.offsetWidth;
    el.classList.add('got-correct');
}


// ================================================================
//  TREASURE SYSTEM
// ================================================================
const TREASURES = [
    { icon: '⭐', name: 'Bonus +5',    pts: 5,  cls: 'positive' },
    { icon: '🌟', name: 'Bonus +10',   pts: 10, cls: 'positive' },
    { icon: '💎', name: 'Bonus +15',   pts: 15, cls: 'positive' },
    { icon: '🎯', name: 'Bonus +20',   pts: 20, cls: 'positive' },
    { icon: '🍀', name: 'Lucky +8',    pts: 8,  cls: 'positive' },
    { icon: '🔄', name: 'Swap Scores', pts: 0,  cls: 'tricky',  action: 'swap' },
    { icon: '🛡️', name: 'Shield',      pts: 0,  cls: 'neutral', action: 'shield' },
    { icon: '⚡', name: 'Double Next',  pts: 0,  cls: 'positive', action: 'doubleNext' }
];

function showTreasureOverlay() {
    // reset boxes
    document.querySelectorAll('.t-box').forEach(b => {
        b.classList.remove('opened', 'not-chosen');
        b.querySelector('.t-box-back').innerHTML = '';
    });
    document.getElementById('treasure-result').innerHTML = '';
    const cont = document.getElementById('treasure-continue');
    cont.classList.remove('show'); cont.style.display = 'none';

    // assign random treasures
    const shuffled = [...TREASURES].sort(() => Math.random() - 0.5);
    document.querySelectorAll('.t-box').forEach((b, i) => { b._treasure = shuffled[i]; });

    document.getElementById('treasure-overlay').classList.add('show');
    sound.play('treasure');
}

function hideTreasureOverlay() {
    document.getElementById('treasure-overlay').classList.remove('show');
}

function openTreasureBox(box) {
    if (gameState.treasurePicked) return;
    gameState.treasurePicked = true;

    const t  = box._treasure;
    const pi = gameState.currentPlayer - 1;

    // flip chosen box
    box.classList.add('opened');
    box.querySelector('.t-box-back').innerHTML =
        `<span class="t-reward-icon">${t.icon}</span><span class="t-reward-text">${t.name}</span>`;

    // dim others
    document.querySelectorAll('.t-box').forEach(b => { if (b !== box) b.classList.add('not-chosen'); });

    sound.play('powerup');

    // apply effect
    let msg = '';
    if (t.pts > 0) {
        gameState.scores[pi] += t.pts;
        msg = `${t.icon} +${t.pts} bonus points!`;
        const r = document.getElementById(`sb-p${gameState.currentPlayer}`).getBoundingClientRect();
        showScorePopup(`+${t.pts}`, r.left + r.width / 2, r.top, 'bonus');
        pulseScore(gameState.currentPlayer, 'up');
    } else if (t.action === 'swap') {
        [gameState.scores[0], gameState.scores[1]] = [gameState.scores[1], gameState.scores[0]];
        msg = '🔄 Scores swapped!';
    } else if (t.action === 'shield') {
        msg = '🛡️ Shield activated — next miss forgiven!';
    } else if (t.action === 'doubleNext') {
        msg = '⚡ Next correct answer = 2× points!';
    }

    updateScores();

    // confetti
    const br = box.getBoundingClientRect();
    confetti.burst(br.left + br.width / 2, br.top + br.height / 2, 28);

    // show result + continue
    setTimeout(() => {
        document.getElementById('treasure-result').innerHTML =
            `<div class="t-result-text ${t.cls}">${msg}</div>`;
        const cont = document.getElementById('treasure-continue');
        cont.classList.add('show'); cont.style.display = 'flex';
    }, 550);
}


// ================================================================
//  GAME OVER
// ================================================================
function endGame() {
    sound.play('gameOver');

    const [s1, s2] = gameState.scores;
    let title, sub;
    if (s1 > s2)      { title = '🏆 Player 1 Wins!'; sub = 'Player 1 is the Champion!'; }
    else if (s2 > s1) { title = '🏆 Player 2 Wins!'; sub = 'Player 2 is the Champion!'; }
    else              { title = "🤝 It's a Tie!";     sub = 'Both players matched!'; }

    document.getElementById('winner-message').textContent = title;
    document.getElementById('winner-name').textContent    = sub;
    document.getElementById('final-score1').textContent   = s1;
    document.getElementById('final-score2').textContent   = s2;

    document.querySelector('.go-p1').classList.toggle('winner', s1 >= s2);
    document.querySelector('.go-p2').classList.toggle('winner', s2 >= s1);

    buildStats();
    document.getElementById('game-over').classList.add('show');
    confetti.celebrate();
}

function buildStats() {
    const acc = (c, t) => t > 0 ? Math.round((c / t) * 100) + '%' : '-';
    const fast = v => v < Infinity ? v.toFixed(1) + 's' : '-';

    document.getElementById('game-stats').innerHTML = `
        <div class="stat-row stat-header">
            <span class="stat-icon"></span><span class="stat-label"></span>
            <span class="stat-p1">P1</span><span class="stat-p2">P2</span>
        </div>
        <div class="stat-row"><span class="stat-icon">✅</span><span class="stat-label">Correct</span>
            <span class="stat-p1">${gameState.correctCounts[0]}</span><span class="stat-p2">${gameState.correctCounts[1]}</span></div>
        <div class="stat-row"><span class="stat-icon">🎯</span><span class="stat-label">Accuracy</span>
            <span class="stat-p1">${acc(gameState.correctCounts[0], gameState.totalAnswered[0])}</span>
            <span class="stat-p2">${acc(gameState.correctCounts[1], gameState.totalAnswered[1])}</span></div>
        <div class="stat-row"><span class="stat-icon">🔥</span><span class="stat-label">Best Streak</span>
            <span class="stat-p1">${gameState.bestStreaks[0]}</span><span class="stat-p2">${gameState.bestStreaks[1]}</span></div>
        <div class="stat-row"><span class="stat-icon">⚡</span><span class="stat-label">Fastest</span>
            <span class="stat-p1">${fast(gameState.fastestAnswer[0])}</span>
            <span class="stat-p2">${fast(gameState.fastestAnswer[1])}</span></div>`;
}

function hideGameOver() { document.getElementById('game-over').classList.remove('show'); }


// ================================================================
//  MASTER INITIALISATION
// ================================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🃏 Quiz Flip — Card Battle Game');

    // confetti engine
    confetti = new ConfettiEngine('confetti-canvas');

    // pin
    updatePinDisplay();

    // catalog
    await loadCatalogFromStorage();
    updateCatalogDisplay();

    // ---- PIN SCREEN listeners ----
    document.querySelectorAll('.key[data-key]').forEach(b =>
        b.addEventListener('click', function () { addDigit(this.dataset.key); }));

    document.getElementById('clear-btn').addEventListener('click', clearPin);
    document.getElementById('submit-pin').addEventListener('click', submitPin);
    document.getElementById('scan-quizzes').addEventListener('click', scanForQuizzes);

    document.getElementById('test-pin').addEventListener('click', () => {
        setPinFromCode('342091');
        setTimeout(submitPin, 500);
    });

    // ---- GAME listeners ----
    document.getElementById('submit-answer').addEventListener('click', submitAnswer);

    document.getElementById('home-btn').addEventListener('click', () => {
        stopTimer(); hideQuestionOverlay(); hideTreasureOverlay(); hideGameOver();
        clearPin(); showScreen('pin-screen');
    });

    document.getElementById('sound-btn').addEventListener('click', function () {
        const on = sound.toggle();
        gameState.soundEnabled = on;
        document.getElementById('sound-icon').className = on ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        this.classList.toggle('muted', !on);
    });

    // ---- ERROR listeners ----
    document.getElementById('retry-btn')?.addEventListener('click', submitPin);
    document.getElementById('back-to-pin-error')?.addEventListener('click', () => {
        clearPin(); showScreen('pin-screen');
    });

    // ---- GAME OVER listeners ----
    document.getElementById('restart-btn')?.addEventListener('click', () => { hideGameOver(); initGame(); });
    document.getElementById('new-chapter-btn')?.addEventListener('click', () => {
        stopTimer(); hideQuestionOverlay(); hideTreasureOverlay(); hideGameOver();
        clearPin(); showScreen('pin-screen');
    });

    // ---- TREASURE listeners ----
    document.querySelectorAll('.t-box').forEach(b =>
        b.addEventListener('click', function () { openTreasureBox(this); }));

    document.getElementById('treasure-continue').addEventListener('click', () => {
        hideTreasureOverlay();
        updatePlayerTurn();   // player keeps turn (they answered correctly)
        if (gameState.flippedCount >= gameState.totalCards) setTimeout(endGame, 500);
    });

    // ---- KEYBOARD ----
    document.addEventListener('keydown', e => {
        // pin screen
        if (document.getElementById('pin-screen').classList.contains('active')) {
            if (e.key >= '0' && e.key <= '9') addDigit(e.key);
            else if (e.key === 'Backspace')   removeLastDigit();
            else if (e.key === 'Enter')       submitPin();
            return;
        }
        // question overlay
        if (document.getElementById('question-overlay').classList.contains('show') && !gameState.answered) {
            const map = { a:0, b:1, c:2, d:3, '1':0, '2':1, '3':2, '4':3 };
            const idx = map[e.key.toLowerCase()];
            if (idx !== undefined) selectOption(idx);
            if (e.key === 'Enter' && gameState.selectedAnswer !== null) submitAnswer();
        }
    });

    console.log('✅ Ready — add quiz JSON files to Questions/ folder');
});


// ================================================================
//  DEBUG TOOLS  (same as original)
// ================================================================
window.quizTools = {
    testQuiz:     c  => { setPinFromCode(c); setTimeout(submitPin, 500); },
    resetCatalog: () => { localStorage.removeItem('quizCatalog'); gameState.quizCatalog = []; updateCatalogDisplay(); console.log('Catalog reset'); },
    addTestQuiz:  () => {
        gameState.quizCatalog.push({ code:'201-01-1', filename:'201011.json', path:'Questions/lower-secondary/math/201011.json',
            name:'Sec 1 Math Chapter 1', subject:'Mathematics', level:'Lower Secondary', grade:'S1' });
        localStorage.setItem('quizCatalog', JSON.stringify(gameState.quizCatalog));
        updateCatalogDisplay(); console.log('Test quiz added');
    },
    showState: () => console.log(JSON.parse(JSON.stringify(gameState)))
};