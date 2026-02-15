const state = {
    pin: [],
    questions: [],
    currQIndex: 0,
    currPlayer: 1,
    scores: [0, 0],
    roundScore: 0,
    isAnswered: false,
    selectedOption: null,
    hitCount: 0,
    maxHits: 3
};

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
    document.getElementById('clear-btn').onclick = () => {
        state.pin = [];
        updatePinDisplay();
    };
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
    const subjects = {0: 'math', 1: 'science', 2: 'combined-physics', 3: 'pure-physics', 4: 'combined-chemistry', 5: 'pure-chemistry'};
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
    if (!q) {
        endGame();
        return;
    }
    
    state.isAnswered = false;
    state.roundScore = 0;
    state.selectedOption = null;
    state.hitCount = 0;
    
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
    document.getElementById('submit-answer').disabled = false;
    document.getElementById('btn-hit').disabled = false;
    document.getElementById('btn-stand').disabled = false;
    
    showPhase(null);
    document.getElementById('feedback-area').className = 'feedback-area';
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
    document.getElementById('submit-answer').disabled = true;
    
    const q = state.questions[state.currQIndex];
    const options = document.querySelectorAll('.option');
    const isCorrect = state.selectedOption === q.correct;
    
    if (isCorrect) {
        options[state.selectedOption].classList.add('correct');
        state.roundScore = q.points || 10;
        
        let msg = 'CORRECT! Base: ' + state.roundScore + ' pts';
        if (q.explanation) {
            msg += '\n\n' + q.explanation;
        }
        showFeedback(msg, 'success');
        setTimeout(() => showPhase('choice-section'), q.explanation ? 3000 : 1500);
    } else {
        options[state.selectedOption].classList.add('incorrect');
        options[q.correct].classList.add('correct');
        
        let msg = 'WRONG! Answer: ' + String.fromCharCode(65 + q.correct) + ') ' + q.options[q.correct];
        if (q.explanation) {
            msg += '\n\n' + q.explanation;
        }
        showFeedback(msg, 'error');
        setTimeout(() => {
            state.currQIndex++;
            loadQuestion();
        }, q.explanation ? 4000 : 2500);
    }
    document.getElementById('submit-answer').style.display = 'none';
}

function startTreasure() {
    showPhase('treasure-section');
    document.querySelectorAll('.t-box').forEach(b => {
        b.textContent = '?';
        b.classList.remove('opened');
        b.style.pointerEvents = 'auto';
    });
    document.getElementById('treasure-result').textContent = '';
}

function startRisk() {
    showPhase('risk-section');
    state.hitCount = 0;
    updateRiskDisplay();
}

function handleTreasure(box) {
    if (box.classList.contains('opened')) return;
    
    const effects = [
        {lbl: '🎯 Double!', val: 'x2'},
        {lbl: '💰 +20 pts!', val: '+20'},
        {lbl: '🎁 +15 pts!', val: '+15'},
        {lbl: '😱 Half!', val: '/2'},
        {lbl: '🔄 Swap!', val: 'swap'}
    ];
    
    const effect = effects[Math.floor(Math.random() * effects.length)];
    
    if (effect.val === 'x2') state.roundScore *= 2;
    if (effect.val === '+20') state.roundScore += 20;
    if (effect.val === '+15') state.roundScore += 15;
    if (effect.val === '/2') state.roundScore = Math.floor(state.roundScore / 2);
    if (effect.val === 'swap') {
        const temp = state.scores[0];
        state.scores[0] = state.scores[1];
        state.scores[1] = temp;
        updateScoreboard();
    }
    
    // Cap at 50
    if (state.roundScore > 50) state.roundScore = 50;
    
    box.textContent = effect.val === 'swap' ? '🔄' : '💰';
    box.classList.add('opened');
    
    document.querySelectorAll('.t-box').forEach(b => b.style.pointerEvents = 'none');
    document.getElementById('treasure-result').innerHTML = effect.lbl + '<br>Score: ' + state.roundScore + ' pts';
    
    setTimeout(() => {
        state.scores[state.currPlayer - 1] += state.roundScore;
        updateScoreboard();
        switchPlayer();
        state.currQIndex++;
        loadQuestion();
    }, 2500);
}

function updateRiskDisplay() {
    const display = document.getElementById('risk-display');
    display.textContent = state.roundScore;
    
    // Color based on score
    if (state.roundScore >= 40) {
        display.style.color = '#48bb78'; // Green - high score!
    } else if (state.roundScore >= 25) {
        display.style.color = '#ed8936'; // Orange - medium
    } else {
        display.style.color = '#d69e2e'; // Gold - low
    }
    
    // Update hit counter display
    const hitBtn = document.getElementById('btn-hit');
    const hitsLeft = state.maxHits - state.hitCount;
    
    if (hitsLeft <= 0 || state.roundScore >= 50) {
        hitBtn.disabled = true;
        hitBtn.textContent = state.roundScore >= 50 ? 'MAX 50!' : 'NO HITS LEFT';
    } else {
        hitBtn.disabled = false;
        hitBtn.textContent = '🎲 HIT (' + hitsLeft + ' left)';
    }
}

function handleHit() {
    // Check if can still hit
    if (state.hitCount >= state.maxHits) {
        showFeedback('No hits remaining!', 'error');
        return;
    }
    
    if (state.roundScore >= 50) {
        showFeedback('Already at MAX 50!', 'info');
        return;
    }
    
    state.hitCount++;
    
    // Random effects: can go UP or DOWN
    const effects = [
        {type: 'add', min: 5, max: 20, label: '+'},      // Add 5-20 points
        {type: 'add', min: 3, max: 15, label: '+'},      // Add 3-15 points
        {type: 'add', min: 10, max: 25, label: '+'},     // Add 10-25 points (lucky!)
        {type: 'subtract', min: 3, max: 10, label: '-'}, // Lose 3-10 points
        {type: 'subtract', min: 5, max: 15, label: '-'}, // Lose 5-15 points
        {type: 'multiply', val: 1.5, label: 'x1.5'},     // Multiply by 1.5
        {type: 'multiply', val: 2, label: 'x2'},         // Double (rare lucky)
        {type: 'multiply', val: 0.5, label: '÷2'},       // Halve (unlucky)
        {type: 'set', min: 15, max: 40, label: '🎲'}     // Random set between 15-40
    ];
    
    const effect = effects[Math.floor(Math.random() * effects.length)];
    let change = 0;
    let newScore = state.roundScore;
    let msg = '';
    let feedbackType = 'info';
    
    switch(effect.type) {
        case 'add':
            change = Math.floor(Math.random() * (effect.max - effect.min + 1)) + effect.min;
            newScore = state.roundScore + change;
            msg = '⬆️ +' + change + ' pts!';
            feedbackType = 'success';
            break;
            
        case 'subtract':
            change = Math.floor(Math.random() * (effect.max - effect.min + 1)) + effect.min;
            newScore = Math.max(1, state.roundScore - change); // Minimum 1 point
            msg = '⬇️ -' + change + ' pts!';
            feedbackType = 'error';
            break;
            
        case 'multiply':
            newScore = Math.floor(state.roundScore * effect.val);
            if (effect.val > 1) {
                msg = '🚀 ' + effect.label + ' = ' + newScore + ' pts!';
                feedbackType = 'success';
            } else {
                msg = '😱 ' + effect.label + ' = ' + newScore + ' pts!';
                feedbackType = 'error';
            }
            newScore = Math.max(1, newScore); // Minimum 1 point
            break;
            
        case 'set':
            newScore = Math.floor(Math.random() * (effect.max - effect.min + 1)) + effect.min;
            if (newScore > state.roundScore) {
                msg = '🎲 Random: ' + newScore + ' pts! (Lucky!)';
                feedbackType = 'success';
            } else {
                msg = '🎲 Random: ' + newScore + ' pts!';
                feedbackType = newScore < state.roundScore ? 'error' : 'info';
            }
            break;
    }
    
    // Cap at 50
    if (newScore > 50) {
        newScore = 50;
        msg += ' (Capped at 50!)';
    }
    
    state.roundScore = newScore;
    
    // Add hits remaining info
    const hitsLeft = state.maxHits - state.hitCount;
    msg += '\n\nHits left: ' + hitsLeft;
    
    showFeedback(msg, feedbackType);
    updateRiskDisplay();
    
    // Auto-stand if at 50 or no hits left
    if (state.roundScore >= 50) {
        showFeedback('🎯 MAX 50! Auto-banking...', 'success');
        document.getElementById('btn-hit').disabled = true;
        document.getElementById('btn-stand').disabled = true;
        setTimeout(handleStand, 2000);
    } else if (state.hitCount >= state.maxHits) {
        showFeedback(msg + '\n\n⚠️ No hits left! Click STAND to bank.', feedbackType);
    }
}

function handleStand() {
    document.getElementById('btn-hit').disabled = true;
    document.getElementById('btn-stand').disabled = true;
    
    showFeedback('✅ Banking ' + state.roundScore + ' points!', 'success');
    
    setTimeout(() => {
        state.scores[state.currPlayer - 1] += state.roundScore;
        updateScoreboard();
        switchPlayer();
        state.currQIndex++;
        loadQuestion();
    }, 1500);
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
    
    let winner;
    if (state.scores[0] > state.scores[1]) {
        winner = '🏆 Player 1 Wins! 🏆';
    } else if (state.scores[1] > state.scores[0]) {
        winner = '🏆 Player 2 Wins! 🏆';
    } else {
        winner = "🤝 It's a Tie! 🤝";
    }
    document.getElementById('winner-text').textContent = winner;
}