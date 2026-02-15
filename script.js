const state = {pin: [], questions: [], currQIndex: 0, currPlayer: 1, scores: [0, 0], roundScore: 0, isAnswered: false, selectedOption: null};

document.addEventListener('DOMContentLoaded', function() {
    setupPinPad();
    setupGame();
    setupAdmin();
});

function setupPinPad() {
    document.querySelectorAll('.key[data-key]').forEach(btn => {
        btn.onclick = () => {
            if (state.pin.length < 6) {
                state.pin.push(btn.dataset.key);
                updatePinDisplay();
            }
        };
    });
    document.getElementById('clear-btn').onclick = () => {state.pin = []; updatePinDisplay();};
    document.getElementById('submit-pin').onclick = () => {
        const code = state.pin.join('');
        if (code.length === 6) loadQuiz(code);
        else alert("Enter 6 digits");
    };
    document.getElementById('json-upload').onchange = handleFileUpload;
}

function setupGame() {
    document.getElementById('submit-answer').onclick = submitAnswer;
    document.getElementById('btn-choose-box').onclick = startTreasure;
    document.getElementById('btn-choose-risk').onclick = startRisk;
    document.getElementById('btn-hit').onclick = handleHit;
    document.getElementById('btn-stand').onclick = handleStand;
    document.getElementById('btn-home').onclick = () => location.reload();
    document.querySelectorAll('.t-box').forEach(box => {
        box.onclick = () => handleTreasure(box);
    });
}

function setupAdmin() {
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            document.body.classList.toggle('admin-mode');
            alert('Admin Mode ' + (document.body.classList.contains('admin-mode') ? 'ON' : 'OFF'));
        }
    });
}

function updatePinDisplay() {
    for (let i = 1; i <= 6; i++) {
        document.querySelector('#digit' + i + ' .digit-number').textContent = state.pin[i - 1] || '_';
    }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showFeedback(msg, type) {
    const el = document.getElementById('feedback-area');
    el.textContent = msg;
    el.className = 'feedback-area show ' + type;
}

function showPhase(id) {
    document.getElementById('choice-section').classList.remove('show');
    document.getElementById('treasure-section').classList.remove('show');
    document.getElementById('risk-section').classList.remove('show');
    if (id) document.getElementById(id).classList.add('show');
}

function loadQuiz(code) {
    showScreen('loading-screen');
    const levels = {1: 'primary', 2: 'lower-secondary', 3: 'upper-secondary'};
    const subjects = {0: 'math', 1: 'science'};
    const digits = code.split('').map(Number);
    const path = 'Questions/' + (levels[digits[0]] || 'primary') + '/' + (subjects[digits[1]] || 'math') + '/' + code + '.json';
    
    fetch(path)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
            if (data.questions && data.questions.length > 0) startQuiz(data.questions);
            else alert('No questions');
        })
        .catch(() => {
            alert('Quiz not found! Use Ctrl+Shift+A for admin mode.');
            showScreen('pin-screen');
        });
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
        try {
            const data = JSON.parse(evt.target.result);
            if (data.questions && data.questions.length > 0) startQuiz(data.questions);
            else alert('Invalid JSON');
        } catch (err) {
            alert('Invalid file');
        }
    };
    reader.readAsText(file);
}

function startQuiz(questions) {
    state.questions = questions;
    state.currQIndex = 0;
    state.currPlayer = 1;
    state.scores = [0, 0];
    updateScoreboard();
    loadQuestion();
    showScreen('game-screen');
}

function loadQuestion() {
    const q = state.questions[state.currQIndex];
    if (!q) {endGame(); return;}
    
    state.isAnswered = false;
    state.roundScore = 0;
    state.selectedOption = null;
    
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('current-q').textContent = state.currQIndex + 1;
    document.getElementById('total-q').textContent = state.questions.length;
    
    const cont = document.getElementById('options-container');
    cont.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.textContent = String.fromCharCode(65 + idx) + ') ' + opt;
        div.onclick = () => selectOption(div, idx);
        cont.appendChild(div);
    });
    
    document.getElementById('submit-answer').style.display = 'block';
    showPhase(null);
    updateTurnIndicator();
}

function selectOption(el, idx) {
    if (state.isAnswered) return;
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    state.selectedOption = idx;
}

function submitAnswer() {
    if (state.selectedOption === null || state.isAnswered) return;
    state.isAnswered = true;
    
    const q = state.questions[state.currQIndex];
    const options = document.querySelectorAll('.option');
    const isCorrect = state.selectedOption === q.correct;
    
    if (isCorrect) {
        options[state.selectedOption].classList.add('correct');
        state.roundScore = q.points || 10;
        showFeedback('CORRECT! ' + state.roundScore + ' pts', 'success');
        setTimeout(() => showPhase('choice-section'), 1500);
    } else {
        options[state.selectedOption].classList.add('incorrect');
        options[q.correct].classList.add('correct');
        showFeedback('WRONG! Answer: ' + String.fromCharCode(65 + q.correct), 'error');
        setTimeout(() => {state.currQIndex++; loadQuestion();}, 2500);
    }
    document.getElementById('submit-answer').style.display = 'none';
}

function startTreasure() {
    showPhase('treasure-section');
    document.querySelectorAll('.t-box').forEach(b => {
        b.textContent = '?';
        b.classList.remove('opened');
    });
}

function startRisk() {
    showPhase('risk-section');
    document.getElementById('risk-display').textContent = state.roundScore;
}

function handleTreasure(box) {
    if (box.classList.contains('opened')) return;
    const effects = [{l: 'Double!', v: 'x2'}, {l: '+20', v: '+20'}, {l: 'Half', v: '/2'}];
    const effect = effects[Math.floor(Math.random() * effects.length)];
    
    if (effect.v === 'x2') state.roundScore *= 2;
    if (effect.v === '+20') state.roundScore += 20;
    if (effect.v === '/2') state.roundScore = Math.floor(state.roundScore / 2);
    
    box.textContent = effect.l;
    box.classList.add('opened');
    document.getElementById('treasure-result').textContent = 'Score: ' + state.roundScore;
    
    setTimeout(() => {
        state.scores[state.currPlayer - 1] += state.roundScore;
        updateScoreboard();
        switchPlayer();
        state.currQIndex++;
        loadQuestion();
    }, 2000);
}

function handleHit() {
    const add = Math.ceil(state.roundScore * 0.5);
    state.roundScore += add;
    document.getElementById('risk-display').textContent = state.roundScore;
    
    if (state.roundScore > 50) {
        showFeedback('BUST!', 'error');
        setTimeout(() => {switchPlayer(); state.currQIndex++; loadQuestion();}, 2000);
    } else if (state.roundScore === 50) {
        showFeedback('PERFECT 50!', 'success');
        setTimeout(handleStand, 1500);
    } else {
        showFeedback('Hit! +' + add, 'info');
    }
}

function handleStand() {
    state.scores[state.currPlayer - 1] += state.roundScore;
    updateScoreboard();
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
    const p1 = document.getElementById('player1');
    const p2 = document.getElementById('player2');
    if (state.currPlayer === 1) {
        p1.classList.add('active');
        p2.classList.remove('active');
        document.getElementById('current-player-name').textContent = "Player 1's Turn";
    } else {
        p2.classList.add('active');
        p1.classList.remove('active');
        document.getElementById('current-player-name').textContent = "Player 2's Turn";
    }
}

function endGame() {
    showScreen('game-over-screen');
    document.getElementById('final-p1').textContent = state.scores[0];
    document.getElementById('final-p2').textContent = state.scores[1];
    document.getElementById('winner-text').textContent = state.scores[0] > state.scores[1] ? 'Player 1 Wins!' : state.scores[1] > state.scores[0] ? 'Player 2 Wins!' : "It's a Tie!";
}