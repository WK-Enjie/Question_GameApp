// ================================================================
//  QUIZ FLIP — CARD BATTLE GAME
//  Complete Game Logic with Math Rendering
//  Rules:
//  - Each player answers once per turn, then switches
//  - Correct: card stays, answer + explanation shown, points awarded
//  - Wrong: card stays (failed), correct answer NOT revealed
//  - Timeout: card UNFLIPS back to board, can be attempted again
// ================================================================

// ========== GAME STATE ==========
const gameState = {
    pin: ['', '', '', '', '', ''],
    currentDigit: 0,

    questions: [],
    currentQuizCode: '',
    quizCatalog: [],
    quizInfo: null,

    currentQuestion: -1,
    currentPlayer: 1,
    scores: [0, 0],
    selectedAnswer: null,
    answered: false,

    cards: [],
    completedCount: 0,
    totalCards: 0,

    streaks: [0, 0],
    bestStreaks: [0, 0],

    correctCounts: [0, 0],
    totalAnswered: [0, 0],
    fastestAnswer: [Infinity, Infinity],
    timeoutCounts: [0, 0],

    timeLeft: 150,
    timerInterval: null,
    timerMax: 150,
    answerStartTime: 0,

    canPickTreasure: false,
    treasurePicked: false,

    soundEnabled: true,

    specialCards: new Set(),
    bonusCards: new Set()
};


// ================================================================
//  QUIZ CODE DECODER
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
//  MATH RENDERER
//  Converts plain text notation into styled HTML:
//
//  FRACTIONS:      3/8          → stacked fraction
//  MIXED NUMBERS:  2 1/3        → whole + stacked fraction
//  SUPERSCRIPTS:   x^2          → x with raised 2
//                  x^{10}       → x with raised 10
//                  x^2 + y^2    → works inline
//  SQUARE ROOT:    √(2x)        → √ with vinculum over 2x
//                  √(ab)        → √ with vinculum over ab
//  CUBE ROOT:      ∛(8)         → ³√ with vinculum over 8
//                  cbrt(27)     → ³√ with vinculum over 27
//
//  PROTECTED (not converted):
//    450 / 9       → stays as "450 / 9" (spaces around slash)
//    $5,400        → stays as "$5,400" (dollar amounts)
//    P x R x T / 100 → stays unchanged
// ================================================================
function renderMath(text) {
    if (!text) return '';

    // Step 1: Escape HTML
    let s = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Step 2: Protect patterns we do NOT want to convert

    // Protect "x / y" (spaces around slash) — division expressions
    const protectedDivs = [];
    s = s.replace(/(\w+)\s+\/\s+(\w+)/g, (match) => {
        protectedDivs.push(match);
        return `__PDIV${protectedDivs.length - 1}__`;
    });

    // Protect dollar amounts "$5,400" or "$2,000.50"
    const protectedDollars = [];
    s = s.replace(/\$[\d,]+(\.\d+)?/g, (match) => {
        protectedDollars.push(match);
        return `__PDOL${protectedDollars.length - 1}__`;
    });

    // Step 3: Cube roots — ∛(content) or cbrt(content)
    s = s.replace(/(?:∛|cbrt)\(([^)]+)\)/g, (match, content) => {
        return `<span class="cbrt-wrap">` +
            `<span class="cbrt-index">3</span>` +
            `<span class="cbrt-sign">√</span>` +
            `<span class="cbrt-content">${content}</span>` +
        `</span>`;
    });

    // Step 4: Square roots — √(content)
    s = s.replace(/√\(([^)]+)\)/g, (match, content) => {
        return `<span class="sqrt-wrap">` +
            `<span class="sqrt-sign">√</span>` +
            `<span class="sqrt-content">${content}</span>` +
        `</span>`;
    });

    // Step 5: Standalone √ followed by a single variable — √a, √b
    s = s.replace(/√([a-zA-Z])/g, (match, v) => {
        return `<span class="sqrt-wrap">` +
            `<span class="sqrt-sign">√</span>` +
            `<span class="sqrt-content">${v}</span>` +
        `</span>`;
    });

    // Step 6: Superscripts with braces — x^{10}, a^{2n}
    s = s.replace(/\^{([^}]+)}/g, (match, exp) => {
        return `<span class="sup">${exp}</span>`;
    });

    // Step 7: Superscripts single char — x^2, b^4, )^2
    s = s.replace(/\^(\d+|[a-zA-Z])/g, (match, exp) => {
        return `<span class="sup">${exp}</span>`;
    });

    // Step 8: Mixed numbers — "2 1/3", "4 1/12", "1 3/8"
    // Pattern: whole_number SPACE numerator/denominator
    // Must come BEFORE simple fractions
    s = s.replace(/(\d+)\s+(\d+)\/(\d+)/g, (match, whole, num, den) => {
        return `<span class="mixed-num">` +
            `<span class="whole">${whole}</span>` +
            `<span class="frac">` +
                `<span class="frac-num">${num}</span>` +
                `<span class="frac-den">${den}</span>` +
            `</span>` +
        `</span>`;
    });

    // Step 9: Simple fractions — "3/8", "2/5", "11/12"
    // Only matches digit/digit that hasn't been converted yet
    s = s.replace(/(\d+)\/(\d+)/g, (match, num, den) => {
        return `<span class="frac">` +
            `<span class="frac-num">${num}</span>` +
            `<span class="frac-den">${den}</span>` +
        `</span>`;
    });

    // Step 10: Restore protected patterns
    protectedDivs.forEach((val, i) => {
        s = s.replace(`__PDIV${i}__`, val);
    });
    protectedDollars.forEach((val, i) => {
        s = s.replace(`__PDOL${i}__`, val);
    });

    return s;
}


// ================================================================
//  SOUND ENGINE
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

    _timeout() {
        this._tone(440, 0.15, 'triangle', 0.08);
        setTimeout(() => this._tone(350, 0.2, 'triangle', 0.08), 120);
        setTimeout(() => this._tone(280, 0.3, 'triangle', 0.06), 240);
    }

    _cardReturn() {
        this._tone(500, 0.1, 'sine', 0.06);
        setTimeout(() => this._tone(400, 0.12, 'sine', 0.05), 80);
    }

    _select()       { this._tone(600, 0.05, 'sine', 0.07); }
    _tick()          { this._tone(1000, 0.025, 'sine', 0.04); }
    _timeWarning()   { this._tone(800, 0.08, 'square', 0.06); }

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
            '#667eea', '#764ba2', '#f59e0b', '#10b981',
            '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'
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

let confetti;


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
//  PIN INPUT
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

function addDigit(d) {
    if (gameState.currentDigit < 6) {
        gameState.pin[gameState.currentDigit++] = d;
        updatePinDisplay();
        sound.play('buttonClick');
    }
}

function removeLastDigit() {
    if (gameState.currentDigit > 0) {
        gameState.pin[--gameState.currentDigit] = '';
        updatePinDisplay();
    }
}

function clearPin() {
    gameState.pin = ['', '', '', '', '', ''];
    gameState.currentDigit = 0;
    updatePinDisplay();
}

function setPinFromCode(c) {
    clearPin();
    c.split('').forEach(d => addDigit(d));
}


// ================================================================
//  FILE SCANNER
// ================================================================
async function scanForQuizzes() {
    showScreen('loading-screen');
    const msg = document.getElementById('loading-message');
    const det = document.getElementById('loading-details');
    const bar = document.getElementById('scan-progress');
    const cnt = document.getElementById('quiz-found');
    gameState.quizCatalog = [];

    const paths = [
        { level: 1, ln: 'primary',         subj: [0, 1] },
        { level: 2, ln: 'lower-secondary', subj: [0, 1] },
        { level: 3, ln: 'upper-secondary', subj: [0, 2, 3, 4, 5] }
    ];

    try {
        msg.textContent = 'Checking Questions folder...';
        det.textContent = 'Looking for quiz files...';
        const base = await fetch('Questions/');
        if (!base.ok) throw new Error('Questions folder not found.');

        const total = paths.reduce((a, p) => a + p.subj.length, 0);
        let step = 0;
        for (const p of paths) {
            for (const s of p.subj) {
                step++;
                det.textContent = `Scanning ${p.ln}/${SUBJECTS[s].name}...`;
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
//  CATALOG MANAGEMENT
// ================================================================
async function loadCatalogFromStorage() {
    const s = localStorage.getItem('quizCatalog');
    if (s) { gameState.quizCatalog = JSON.parse(s); return; }

    gameState.quizCatalog = [
        { code: '101-01-1', filename: '101011.json', path: 'Questions/primary/math/101011.json',                  name: 'P1 Math Chapter 1' },
        { code: '201-01-1', filename: '201011.json', path: 'Questions/lower-secondary/math/201011.json',          name: 'Sec 1 Math Chapter 1' },
        { code: '201-01-2', filename: '201012.json', path: 'Questions/lower-secondary/math/201012.json',          name: 'Sec 1 Math Ch 1 WS 2' },
        { code: '342-09-1', filename: '342091.json', path: 'Questions/upper-secondary/combined-chem/342091.json', name: 'Sec 4 Comb Chem Ch 9' }
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
        <div class="quiz-item" data-code="${q.code.replace(/-/g, '')}">
            <div class="quiz-header"><span class="quiz-code">${q.code}</span><span class="quiz-name">${q.name}</span></div>
            <div class="quiz-details">${q.level || ''} · ${q.grade || ''} · ${q.subject || ''}</div>
        </div>`).join('');
    cnt.textContent = `${gameState.quizCatalog.length} quizzes`;

    document.querySelectorAll('.quiz-item').forEach(item =>
        item.addEventListener('click', function () {
            setPinFromCode(this.dataset.code);
            setTimeout(submitPin, 500);
        })
    );
}


// ================================================================
//  LOAD QUIZ
// ================================================================
async function loadQuizByCode(code) {
    const info = decodeQuizCode(code);
    if (!info) return { success: false, error: `Invalid code: ${code}` };
    gameState.currentQuizCode = info.code;
    document.getElementById('loading-message').textContent = `Loading ${info.code}...`;

    try {
        const res = await fetch(info.filepath);
        if (!res.ok) throw new Error(res
