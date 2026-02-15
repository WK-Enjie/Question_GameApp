// ========== GAME STATE ==========
const gameState = {
    pin: ['', '', '', '', '', ''],
    currentDigit: 0,
    questions: [],
    currentQuestion: 0,
    currentPlayer: 1,
    scores: [0, 0],
    targetScore: 50, // ✅ UPDATED TO 50
    roundScores: [0, 0], // Points accumulated in current question
    selectedAnswer: null,
    answered: false,
    quizCatalog: [],
    currentQuizCode: ''
};

// ... [Keep specific configuration constants like SUBJECTS, LEVELS, decodeQuizCode unchanged] ...

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 CNY Game Ready | Max 50 | Winner takes turn');
    await loadCatalogFromStorage();
    updateCatalogDisplay();
    setupEventListeners();
});

function setupEventListeners() {
    // PIN & Navigation
    document.querySelectorAll('.key[data-key]').forEach(b => b.addEventListener('click', () => addDigit(b.dataset.key)));
    document.getElementById('clear-btn').addEventListener('click', clearPin);
    document.getElementById('submit-pin').addEventListener('click', submitPin);
    document.getElementById('home-btn').addEventListener('click', () => showScreen('pin-screen'));
    document.getElementById('restart-btn')?.addEventListener('click', initGame);
    document.getElementById('json-upload')?.addEventListener('change', handleFileUpload);
    document.getElementById('scan-quizzes')?.addEventListener('click', scanForQuizzes);

    // Game Actions
    document.getElementById('submit-answer').addEventListener('click', submitAnswer);
    
    // Choice Phase
    document.getElementById('choose-box-btn').addEventListener('click', startTreasurePhase);
    document.getElementById('choose-risk-btn').addEventListener('click', startRiskPhase);

    // Treasure
    document.querySelectorAll('.treasure-box').forEach(box => {
        box.addEventListener('click', function() {
            if(!this.classList.contains('opened')) openTreasureBox(this);
        });
    });

    // Risk (Hit/Stand)
    document.getElementById('hit-btn').addEventListener('click', hitMe);
    document.getElementById('stand-btn').addEventListener('click', stand);
    
    // Test Button
    document.getElementById('test-pin').addEventListener('click', () => {
         setPinFromCode('202031'); setTimeout(submitPin, 500);
    });
}

// ... [Keep PIN, LOAD, and CATALOG functions unchanged from previous version] ...

// ========== GAME LOGIC CORE ==========

function initGame() {
    Object.assign(gameState, {
        currentQuestion: 0,
        currentPlayer: 1,
        scores: [0, 0],
        roundScores: [0, 0],
        selectedAnswer: null,
        answered: false
    });
    
    updateScores();
    updatePlayerTurn();
    loadQuestion();
    document.getElementById('game-over').style.display = 'none';
}

function loadQuestion() {
    // Reset UI for new question
    document.getElementById('choice-section').style.display = 'none';
    document.getElementById('treasure-section').style.display = 'none';
    document.getElementById('blackjack-controls').style.display = 'none';
    document.getElementById('answer-feedback').innerHTML = '';
    
    const q = gameState.questions[gameState.currentQuestion];
    if (!q) { endGame(); return; }

    // Display Text
    document.getElementById('current-q').textContent = gameState.currentQuestion + 1;
    document.getElementById('total-q').textContent = gameState.questions.length;
    document.getElementById('question-text').textContent = q.question;

    // Render Options
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const el = document.createElement('div');
        el.className = 'option';
        el.innerHTML = `<strong>${String.fromCharCode(65 + idx)})</strong> ${opt}`;
        el.onclick = () => selectOption(idx);
        container.appendChild(el);
    });

    // Reset State
    gameState.selectedAnswer = null;
    gameState.answered = false;
    
    const btn = document.getElementById('submit-answer');
    btn.style.display = 'block';
    btn.disabled = true;
    btn.textContent = 'Submit Answer';
    
    // Reset Round Score for current player
    gameState.roundScores[gameState.currentPlayer - 1] = 0;
    
    updateScores();
    updatePlayerTurn();
}

function selectOption(index) {
    if (gameState.answered) return;
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    document.querySelectorAll('.option')[index].classList.add('selected');
    gameState.selectedAnswer = index;
    document.getElementById('submit-answer').disabled = false;
}

function submitAnswer() {
    if (gameState.selectedAnswer === null) return;
    gameState.answered = true;
    
    const q = gameState.questions[gameState.currentQuestion];
    const isCorrect = gameState.selectedAnswer === q.correct;
    const playerIdx = gameState.currentPlayer - 1;
    
    // Visuals
    const options = document.querySelectorAll('.option');
    options[q.correct].classList.add('correct');
    if (!isCorrect) options[gameState.selectedAnswer].classList.add('incorrect');
    document.getElementById('submit-answer').style.display = 'none';

    if (isCorrect) {
        // 1. Base Points
        const basePoints = q.points || 10;
        gameState.roundScores[playerIdx] = basePoints;
        
        showCelebration(`✅ Correct! Base: ${basePoints} pts`, 'success');
        
        // 2. Show Choice UI
        document.getElementById('choice-section').style.display = 'block';
        document.getElementById('answer-feedback').innerHTML = `
            <div class="feedback-correct">
                <h3>Select your bonus!</h3>
                <p>Base points banked: ${basePoints}</p>
            </div>`;
    } else {
        // WRONG ANSWER
        showCelebration('❌ Incorrect!', 'danger');
        document.getElementById('answer-feedback').innerHTML = `
            <div class="feedback-incorrect">
                <h3>Wrong Answer</h3>
                <p>Correct was: ${String.fromCharCode(65+q.correct)}</p>
            </div>`;
        
        // LOGIC: Player keeps turn if wrong.
        // We just move to next question, but do NOT switchPlayer()
        setTimeout(() => {
            gameState.currentQuestion++;
            loadQuestion();
        }, 2500);
    }
}

// ========== CHOICE PHASE ==========

function startTreasurePhase() {
    document.getElementById('choice-section').style.display = 'none';
    document.getElementById('treasure-section').style.display = 'block';
    
    // Reset boxes
    document.querySelectorAll('.treasure-box').forEach(b => {
        b.className = 'treasure-box';
        b.textContent = '🎁';
    });
    document.getElementById('powerup-result').innerHTML = 'Pick a box to reveal your fate!';
}

function startRiskPhase() {
    document.getElementById('choice-section').style.display = 'none';
    document.getElementById('blackjack-controls').style.display = 'flex';
    updateRiskUI();
}

// ========== TREASURE LOGIC ==========
const TREASURES = [
    { type: 'double', label: 'Double Points!', icon: '⚡' },
    { type: 'bonus', label: 'Bonus +20', icon: '💰' },
    { type: 'half', label: 'Bad Luck! Half Points', icon: '🥀' },
    { type: 'swap', label: 'SWAP Total Scores!', icon: '🔄' },
    { type: 'drop', label: 'Drop 50%!', icon: '📉' }
];

function openTreasureBox(boxEl) {
    if (gameState.answered === 'completed') return; // Prevent double clicks
    
    boxEl.classList.add('opened');
    const outcome = TREASURES[Math.floor(Math.random() * TREASURES.length)];
    const playerIdx = gameState.currentPlayer - 1;
    let currentRound = gameState.roundScores[playerIdx];
    
    // Apply Logic
    if (outcome.type === 'double') currentRound *= 2;
    if (outcome.type === 'bonus') currentRound += 20;
    if (outcome.type === 'half') currentRound = Math.floor(currentRound / 2);
    if (outcome.type === 'drop') currentRound = Math.floor(currentRound * 0.5);
    
    gameState.roundScores[playerIdx] = currentRound;
    
    // Render
    boxEl.textContent = outcome.icon;
    document.getElementById('powerup-result').innerHTML = `
        <div class="powerup-display">
            <h3>${outcome.label}</h3>
            <p>Final Round Score: ${currentRound}</p>
        </div>`;
        
    // Special Case: SWAP applies to TOTAL scores immediately
    if (outcome.type === 'swap') {
        const p1 = gameState.scores[0];
        const p2 = gameState.scores[1];
        gameState.scores[0] = p2;
        gameState.scores[1] = p1;
        showCelebration('🔄 SCORES SWAPPED!', 'warning');
    }

    // Auto-Stand after box
    setTimeout(() => stand(), 2000);
}

// ========== RISK / HIT LOGIC ==========

function hitMe() {
    const playerIdx = gameState.currentPlayer - 1;
    let current = gameState.roundScores[playerIdx];
    
    // Add 50% of current score
    const increase = Math.ceil(current * 0.5);
    current += increase;
    gameState.roundScores[playerIdx] = current;
    
    createCoinExplosion(document.getElementById('hit-btn').getBoundingClientRect());

    if (current > gameState.targetScore) {
        // BUST
        gameState.roundScores[playerIdx] = 0; // Lose round points
        updateRiskUI();
        showCelebration(`💥 BUST! Score ${current} > 50`, 'danger');
        
        setTimeout(() => {
            finishTurn(); // Turn ends, no points banked
        }, 2000);
    } else {
        // SAFE
        showCelebration(`🔥 HIT! +${increase} pts`, 'warning');
        updateRiskUI();
    }
}

function updateRiskUI() {
    const playerIdx = gameState.currentPlayer - 1;
    document.getElementById('current-round-total').textContent = gameState.roundScores[playerIdx];
}

function stand() {
    // Bank points
    const playerIdx = gameState.currentPlayer - 1;
    const points = gameState.roundScores[playerIdx];
    
    gameState.scores[playerIdx] += points;
    updateScores();
    showCelebration(`✅ BANKED ${points} POINTS!`, 'success');
    
    setTimeout(finishTurn, 1500);
}

// ========== TURN MANAGEMENT ==========

function finishTurn() {
    // Switch Player (Only happens after a Correct Answer -> Sequence)
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.currentQuestion++;
    
    loadQuestion();
}

function updatePlayerTurn() {
    document.getElementById('current-player').textContent = `Player ${gameState.currentPlayer}'s Turn`;
    document.getElementById('player1').classList.toggle('active', gameState.currentPlayer === 1);
    document.getElementById('player2').classList.toggle('active', gameState.currentPlayer === 2);
}

function updateScores() {
    document.getElementById('score1').textContent = gameState.scores[0];
    document.getElementById('score2').textContent = gameState.scores[1];
}

// ... [Keep UTILITIES like createCoinExplosion, showCelebration, endGame, etc.] ...
// (Ensure addDigit, clearPin, showScreen, etc. are included from the original file or copied here)
// For brevity in this response, I assume the Utility functions (Celebration, Game Over, etc) remain valid.