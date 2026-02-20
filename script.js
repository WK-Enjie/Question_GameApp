// --- NAV ---
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active-section'));
    document.getElementById(id).classList.add('active-section');
}

// FIX: Passed explicit evt parameter to prevent ReferenceErrors
function openTab(evt, id) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-content'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    document.getElementById(id).classList.add('active-content');
    evt.currentTarget.classList.add('active-tab');
}

// --- VIRTUAL LAB ---
const reactions = {
    'zn': {
        'naoh_few': { t: 'White precipitate formed.', c: 'ppt-white', e: 'Zn<sup>2+</sup>(aq) + 2OH<sup>-</sup>(aq) &rarr; Zn(OH)<sub>2</sub>(s)' },
        'naoh_excess': { t: 'Precipitate dissolves (colorless solution).', c: 'clear excess', e: 'Precipitate dissolves (No precipitation equation).' },
        'nh3_few': { t: 'White precipitate formed.', c: 'ppt-white', e: 'Zn<sup>2+</sup>(aq) + 2OH<sup>-</sup>(aq) &rarr; Zn(OH)<sub>2</sub>(s)' },
        'nh3_excess': { t: 'Precipitate dissolves (colorless solution).', c: 'clear excess', e: 'Precipitate dissolves (No precipitation equation).' }
    },
    'al': {
        'naoh_few': { t: 'White precipitate formed.', c: 'ppt-white', e: 'Al<sup>3+</sup>(aq) + 3OH<sup>-</sup>(aq) &rarr; Al(OH)<sub>3</sub>(s)' },
        'naoh_excess': { t: 'Precipitate dissolves (colorless solution).', c: 'clear excess', e: 'Precipitate dissolves (No precipitation equation).' },
        'nh3_few': { t: 'White precipitate formed.', c: 'ppt-white', e: 'Al<sup>3+</sup>(aq) + 3OH<sup>-</sup>(aq) &rarr; Al(OH)<sub>3</sub>(s)' },
        'nh3_excess': { t: 'White precipitate remains (Insoluble).', c: 'ppt-white excess', e: 'Precipitate remains insoluble.' }
    },
    'ca': {
        'naoh_few': { t: 'White precipitate formed.', c: 'ppt-white', e: 'Ca<sup>2+</sup>(aq) + 2OH<sup>-</sup>(aq) &rarr; Ca(OH)<sub>2</sub>(s)' },
        'naoh_excess': { t: 'White precipitate remains (Insoluble).', c: 'ppt-white excess', e: 'Precipitate remains insoluble.' },
        'nh3_few': { t: 'No precipitate formed.', c: 'clear', e: 'No observable reaction.' },
        'nh3_excess': { t: 'No precipitate formed.', c: 'clear excess', e: 'No observable reaction.' }
    },
    'cu': {
        'naoh_few': { t: 'Light blue precipitate formed.', c: 'ppt-blue', e: 'Cu<sup>2+</sup>(aq) + 2OH<sup>-</sup>(aq) &rarr; Cu(OH)<sub>2</sub>(s)' },
        'naoh_excess': { t: 'Light blue precipitate remains.', c: 'ppt-blue excess', e: 'Cu<sup>2+</sup>(aq) + 2OH<sup>-</sup>(aq) &rarr; Cu(OH)<sub>2</sub>(s)' },
        'nh3_few': { t: 'Light blue precipitate formed.', c: 'ppt-blue', e: 'Cu<sup>2+</sup>(aq) + 2OH<sup>-</sup>(aq) &rarr; Cu(OH)<sub>2</sub>(s)' },
        'nh3_excess': { t: 'Deep blue solution formed.', c: 'sol-deep-blue', e: 'Precipitate dissolves (No precipitation equation).' }
    },
    'fe2': {
        'naoh_few': { t: 'Green precipitate formed.', c: 'ppt-green', e: 'Fe<sup>2+</sup>(aq) + 2OH<sup>-</sup>(aq) &rarr; Fe(OH)<sub>2</sub>(s)' },
        'naoh_excess': { t: 'Green precipitate remains.', c: 'ppt-green excess', e: 'Precipitate remains insoluble.' },
        'nh3_few': { t: 'Green precipitate formed.', c: 'ppt-green', e: 'Fe<sup>2+</sup>(aq) + 2OH<sup>-</sup>(aq) &rarr; Fe(OH)<sub>2</sub>(s)' },
        'nh3_excess': { t: 'Green precipitate remains.', c: 'ppt-green excess', e: 'Precipitate remains insoluble.' }
    },
    'fe3': {
        'naoh_few': { t: 'Red-brown precipitate formed.', c: 'ppt-red', e: 'Fe<sup>3+</sup>(aq) + 3OH<sup>-</sup>(aq) &rarr; Fe(OH)<sub>3</sub>(s)' },
        'naoh_excess': { t: 'Red-brown precipitate remains.', c: 'ppt-red excess', e: 'Precipitate remains insoluble.' },
        'nh3_few': { t: 'Red-brown precipitate formed.', c: 'ppt-red', e: 'Fe<sup>3+</sup>(aq) + 3OH<sup>-</sup>(aq) &rarr; Fe(OH)<sub>3</sub>(s)' },
        'nh3_excess': { t: 'Red-brown precipitate remains.', c: 'ppt-red excess', e: 'Precipitate remains insoluble.' }
    },
    'nh4': {
        'naoh_few': { t: 'Ammonia gas produced on warming.', c: 'clear', e: 'NH<sub>4</sub><sup>+</sup>(aq) + OH<sup>-</sup>(aq) &rarr; NH<sub>3</sub>(g) + H<sub>2</sub>O(l)' },
        'naoh_excess': { t: 'Ammonia gas produced on warming.', c: 'clear excess', e: 'NH<sub>4</sub><sup>+</sup>(aq) + OH<sup>-</sup>(aq) &rarr; NH<sub>3</sub>(g) + H<sub>2</sub>O(l)' },
        'nh3_few': { t: 'No reaction.', c: 'clear', e: '-' },
        'nh3_excess': { t: 'No reaction.', c: 'clear excess', e: '-' }
    }
};

function runTest(reagent) {
    const ion = document.getElementById('ionSelect').value;
    const chemical = document.getElementById('chemical');
    const obsText = document.getElementById('obsText');
    const eqText = document.getElementById('eqText');

    const res = reactions[ion][reagent];
    if (res) {
        obsText.innerText = res.t;
        eqText.innerHTML = res.e; 
        chemical.className = 'chemical ' + res.c;
    }
}

function resetLab() {
    const chemical = document.getElementById('chemical');
    const obsText = document.getElementById('obsText');
    const eqText = document.getElementById('eqText');

    chemical.className = 'chemical clear';
    chemical.style.height = '25%';
    obsText.innerText = 'Colorless Solution';
    eqText.innerHTML = 'No reaction yet.';
}

// --- EXTENDED QUIZ BANK (18 Questions) ---
const questionBank = [
    { 
        html: `
            <div class="flowchart-container">
                <div class="flow-step flow-unknown">Unknown Solution P</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Aqueous NaOH (Excess)</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">White precipitate dissolves</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Aqueous Ammonia (Excess)</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">White precipitate remains</div>
            </div>
            <p>Identify Solution P.</p>
        `,
        options: ["Zinc (Zn²⁺)", "Aluminium (Al³⁺)", "Calcium (Ca²⁺)", "Lead (Pb²⁺)"], 
        a: 1 
    },
    { 
        html: `
            <div class="flowchart-container">
                <div class="flow-step flow-unknown">Unknown Solution Q</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Aqueous NaOH</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">Light Blue Precipitate</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Aqueous Ammonia (Excess)</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">Deep Blue Solution</div>
            </div>
            <p>Identify Solution Q.</p>
        `,
        options: ["Iron(II)", "Copper(II)", "Zinc", "Calcium"], 
        a: 1 
    },
    { 
        html: `
            <div class="flowchart-container">
                <div class="flow-step flow-unknown">Unknown Solution R</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Aqueous NaOH (Excess)</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">White precipitate dissolves</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Aqueous Ammonia (Excess)</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">White precipitate dissolves</div>
            </div>
            <p>Identify Solution R.</p>
        `,
        options: ["Zinc (Zn²⁺)", "Aluminium (Al³⁺)", "Calcium (Ca²⁺)", "Copper (Cu²⁺)"], 
        a: 0 
    },
    { 
        html: `
            <div class="flowchart-container">
                <div class="flow-step flow-unknown">Unknown Solution S</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Aqueous NaOH</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">Green Precipitate</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Excess NaOH</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">Precipitate Insoluble</div>
            </div>
            <p>Identify Solution S.</p>
        `,
        options: ["Iron(II)", "Iron(III)", "Copper(II)", "Chromium(III)"], 
        a: 0 
    },
    { 
        html: `
            <div class="flowchart-container">
                <div class="flow-step flow-unknown">Unknown Anion T</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Dilute Nitric Acid</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Silver Nitrate</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">Yellow Precipitate</div>
            </div>
            <p>Identify Anion T.</p>
        `,
        options: ["Chloride", "Sulfate", "Iodide", "Nitrate"], 
        a: 2 
    },
    { 
        html: `
            <div class="flowchart-container">
                <div class="flow-step flow-unknown">Unknown Solution U</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Aqueous NaOH</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">White Precipitate</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-action">+ Aqueous Ammonia</div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">No Precipitate / Very Slight</div>
            </div>
            <p>Identify Solution U.</p>
        `,
        options: ["Zinc", "Aluminium", "Calcium", "Ammonium"], 
        a: 2 
    },
    { q: "Which gas turns damp red litmus paper blue?", options: ["Chlorine", "Ammonia", "Oxygen", "Hydrogen"], a: 1 },
    { q: "Which ion forms a white precipitate with acidified Silver Nitrate?", options: ["Chloride", "Sulfate", "Nitrate", "Carbonate"], a: 0 },
    { q: "What is observed when Aqueous Sodium Hydroxide is added to Iron(III) ions?", options: ["White ppt", "Red-brown ppt", "Green ppt", "Blue ppt"], a: 1 },
    { q: "Which cation produces Ammonia gas when warmed with Aqueous NaOH and Aluminium foil?", options: ["Ammonium", "Nitrate", "Zinc", "Calcium"], a: 1 },
    { q: "Which gas extinguishes a lighted splint with a 'pop' sound?", options: ["Hydrogen", "Oxygen", "Carbon Dioxide", "Ammonia"], a: 0 },
    { q: "Which anion produces carbon dioxide when reacted with dilute acid?", options: ["Chloride", "Carbonate", "Sulfate", "Nitrate"], a: 1 },
    { q: "Which cation forms a precipitate that is soluble in excess Aqueous Ammonia?", options: ["Zinc", "Aluminium", "Iron(II)", "Calcium"], a: 0 },
    { q: "Which gas turns limewater milky?", options: ["Hydrogen", "Ammonia", "Carbon Dioxide", "Chlorine"], a: 2 },
    { q: "To test for Sulfate ions, you add acid followed by...", options: ["Silver Nitrate", "Barium Nitrate", "Sodium Hydroxide", "Ammonia"], a: 1 },
    { q: "Observation: Red-brown precipitate formed with Aqueous Ammonia, insoluble in excess.", options: ["Iron(II)", "Iron(III)", "Copper(II)", "Zinc"], a: 1 },
    { q: "Which gas relights a glowing splint?", options: ["Hydrogen", "Oxygen", "Carbon Dioxide", "Chlorine"], a: 1 },
    { q: "Observation: Green precipitate formed with NaOH, insoluble in excess.", options: ["Iron(II)", "Iron(III)", "Copper(II)", "Chromium"], a: 0 }
];

// --- QUIZ LOGIC (Random Sampling) ---
let currentQuiz = [];
let qIdx = 0;
let score = 0;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startQuiz() {
    qIdx = 0;
    score = 0;
    
    const shuffled = shuffleArray([...questionBank]);
    currentQuiz = shuffled.slice(0, 6);
    
    document.getElementById('totalVal').innerText = currentQuiz.length;
    document.getElementById('scoreVal').innerText = "0";
    
    loadQuestion();
}

function loadQuestion() {
    if(qIdx >= currentQuiz.length) {
        document.getElementById('questionArea').innerHTML = `<h3>Quiz Completed!</h3>`;
        document.getElementById('optionsContainer').innerHTML = `
            <div style="margin-bottom:20px;">You scored ${score} out of ${currentQuiz.length}</div>
            <button type="button" onclick="startQuiz()" style="background:#27ae60; color:white; border:none; padding:15px; cursor:pointer; border-radius:5px;">Restart Quiz</button>`;
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('feedbackText').innerText = "";
        return;
    }

    const q = currentQuiz[qIdx];
    const qArea = document.getElementById('questionArea');
    
    if (q.html) {
        qArea.innerHTML = `<div style="font-weight:bold; margin-bottom:10px;">Question ${qIdx+1}:</div>` + q.html;
    } else {
        qArea.innerHTML = `<div style="font-weight:bold; margin-bottom:10px;">Question ${qIdx+1}:</div><p>${q.q}</p>`;
    }
    
    const opts = document.getElementById('optionsContainer');
    opts.innerHTML = '';
    document.getElementById('feedbackText').innerText = '';
    document.getElementById('nextBtn').style.display = 'none';
    
    q.options.forEach((o, i) => {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.innerText = o;
        btn.onclick = () => check(i, q.a, btn);
        opts.appendChild(btn);
    });
}

function check(sel, corr, btn) {
    const all = document.querySelectorAll('.options-grid button');
    all.forEach(b => b.disabled = true);
    
    if(sel === corr) {
        score++;
        document.getElementById('scoreVal').innerText = score;
        document.getElementById('feedbackText').innerHTML = "Correct! ✅";
        document.getElementById('feedbackText').style.color = "green";
        btn.style.background = "#27ae60";
    } else {
        document.getElementById('feedbackText').innerHTML = "Incorrect. <br>The correct answer was: " + currentQuiz[qIdx].options[corr];
        document.getElementById('feedbackText').style.color = "#c0392b";
        btn.style.background = "#c0392b";
    }
    document.getElementById('nextBtn').style.display = 'inline-block';
}

function nextQuestion() {
    qIdx++;
    loadQuestion();
}

// Ensure DOM is fully loaded before launching the quiz mechanics
document.addEventListener('DOMContentLoaded', startQuiz);