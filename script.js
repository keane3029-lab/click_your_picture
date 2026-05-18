let clicks = parseInt(localStorage.getItem('clicks')) || 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let activeFilter = localStorage.getItem('activeFilter') || 'none';
let activeTheme = localStorage.getItem('activeTheme') || 'linear-gradient(135deg, #12121f, #1a1a2e)';

// Auto Clicker Tracking
let autoClickers = JSON.parse(localStorage.getItem('autoClickers')) || { type1: 0, type2: 0 };
let currentCPS = 0;

// Combo variables
let combo = 0;
let comboTimer = null;

const scoreDisplay = document.getElementById('score');
const cpsDisplay = document.getElementById('cps-display');
const highScoreDisplay = document.getElementById('high-score');
const targetImg = document.getElementById('target-img');
const imageWrapper = document.getElementById('image-wrapper');
const fileInput = document.getElementById('file-input');

// Create combo element dynamically
const comboDisplay = document.createElement('div');
comboDisplay.className = 'combo-box';
document.querySelector('.header-container').appendChild(comboDisplay);

// Init views
scoreDisplay.textContent = clicks;
highScoreDisplay.textContent = highScore;
targetImg.style.filter = activeFilter;
document.body.style.background = activeTheme;
updateAutoClickerUI();

// Synthesizes dynamic retro sounds
function playInteractiveSound(isAuto = false) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = combo > 5 && !isAuto ? 'sawtooth' : 'sine';
    const baseFreq = isAuto ? 200 : 300 + (combo * 40); 
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    
    gain.gain.setValueAtTime(isAuto ? 0.03 : 0.15, ctx.currentTime); // Auto clicks are quieter
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
}

// Manual User Click Trigger
targetImg.addEventListener('click', (e) => {
    handleCombo();
    
    const pointsGained = 1 + Math.floor(combo / 5);
    clicks += pointsGained;
    
    processScoreUpdate();

    playInteractiveSound(false);
    calculateTiltPhysics(e);
    spawnSparks(e);
    spawnFloatingText(e, `+${pointsGained}`);
});

function processScoreUpdate() {
    scoreDisplay.textContent = clicks;
    localStorage.setItem('clicks', clicks);

    if (clicks > highScore) {
        highScore = clicks;
        highScoreDisplay.textContent = highScore;
        localStorage.setItem('highScore', highScore);
    }
    updateShopButtons();
}

// 1. Interactive Combo Engine
function handleCombo() {
    combo++;
    clearTimeout(comboTimer);
    
    if (combo >= 5) {
        comboDisplay.textContent = `🔥 COMBO x${Math.floor(combo/5) + 1}! 🔥`;
        comboDisplay.classList.add('combo-active');
        document.documentElement.style.setProperty('--accent-color', '#ff3e6c');
    }

    comboTimer = setTimeout(() => {
        combo = 0;
        comboDisplay.textContent = '';
        comboDisplay.classList.remove('combo-active');
        document.documentElement.style.setProperty('--accent-color', '#4ef083');
    }, 1200);
}

// 2. 3D Tilt Physics Engine
function calculateTiltPhysics(e) {
    const rect = targetImg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotX = (-y * 45).toFixed(1); 
    const rotY = (x * 45).toFixed(1);
    
    targetImg.style.transform = `scale(0.92) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    setTimeout(() => {
        targetImg.style.transform = 'scale(1) rotateX(0deg) rotateY(0deg)';
    }, 80);
}

// 3. Particle Engine
function spawnSparks(e) {
    const rect = imageWrapper.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let i = 0; i < 8; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.left = `${clickX}px`;
        spark.style.top = `${clickY}px`;

        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 60;
        const mx = `${Math.cos(angle) * distance}px`;
        const my = `${Math.sin(angle) * distance}px`;
        
        spark.style.setProperty('--mx', mx);
        spark.style.setProperty('--my', my);
        spark.style.backgroundColor = combo > 5 ? '#ff3e6c' : `hsl(${Math.random() * 360}, 100%, 70%)`;

        imageWrapper.appendChild(spark);
        setTimeout(() => spark.remove(), 400);
    }
}

// 4. Score Pop-up Text Generator
function spawnFloatingText(e, text) {
    let x, y;
    if (e) {
        const rect = imageWrapper.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    } else {
        // Center offsets for automatic text pops
        x = 110 + (Math.random() * 40 - 20);
        y = 110 + (Math.random() * 40 - 20);
    }

    const float = document.createElement('div');
    float.className = 'floating-text';
    float.textContent = text;
    float.style.left = `${x}px`;
    float.style.top = `${y}px`;
    if(!e) float.style.color = '#6be0ff'; // Blue numbers for bot clicks

    imageWrapper.appendChild(float);
    setTimeout(() => float.remove(), 400);
}

// --- AUTO CLICKER LOGIC ---

function buyAutoClicker(cpsValue, baseCost, countId, btnId) {
    // Scaling Cost Formula: Cost rises based on infrastructure size
    const currentOwned = cpsValue === 1 ? autoClickers.type1 : autoClickers.type2;
    const calculatedCost = Math.floor(baseCost * Math.pow(1.15, currentOwned));

    if (clicks >= calculatedCost) {
        clicks -= calculatedCost;
        
        if (cpsValue === 1) autoClickers.type1++;
        else autoClickers.type2++;
        
        localStorage.setItem('autoClickers', JSON.stringify(autoClickers));
        
        processScoreUpdate();
        updateAutoClickerUI();
    }
}

function updateAutoClickerUI() {
    // Calculate current cost dynamically
    const cost1 = Math.floor(20 * Math.pow(1.15, autoClickers.type1));
    const cost2 = Math.floor(100 * Math.pow(1.15, autoClickers.type2));

    document.getElementById('count-auto1').textContent = autoClickers.type1;
    document.getElementById('btn-auto1').textContent = `Cost: ${cost1}`;

    document.getElementById('count-auto2').textContent = autoClickers.type2;
    document.getElementById('btn-auto2').textContent = `Cost: ${cost2}`;

    currentCPS = (autoClickers.type1 * 1) + (autoClickers.type2 * 5);
    cpsDisplay.textContent = currentCPS;
}

// Core Game Loop Execution - Triggers every 1 second
setInterval(() => {
    if (currentCPS > 0) {
        clicks += currentCPS;
        processScoreUpdate();
        playInteractiveSound(true);
        spawnFloatingText(null, `+${currentCPS}`);
        
        // Minor visual pop effect on the target image to show bot interaction
        targetImg.style.transform = 'scale(0.97)';
        setTimeout(() => targetImg.style.transform = 'scale(1)', 50);
    }
}, 1000);

// Cosmetic Operations
function buyFilter(filterStyle, btnId, cost) {
    if (clicks >= cost) {
        clicks -= cost;
        activeFilter = filterStyle;
        targetImg.style.filter = filterStyle;
        localStorage.setItem('activeFilter', filterStyle);
        processScoreUpdate();
    }
}

function buyTheme(themeStyle, btnId, cost) {
    if (clicks >= cost) {
        clicks -= cost;
        activeTheme = themeStyle;
        document.body.style.background = themeStyle;
        localStorage.setItem('activeTheme', themeStyle);
        processScoreUpdate();
    }
}

function updateShopButtons() {
    const cost1 = Math.floor(20 * Math.pow(1.15, autoClickers.type1));
    const cost2 = Math.floor(100 * Math.pow(1.15, autoClickers.type2));

    document.getElementById('btn-auto1').disabled = clicks < cost1;
    document.getElementById('btn-auto2').disabled = clicks < cost2;
    document.getElementById('btn-invert').disabled = clicks < 15;
    document.getElementById('btn-sepia').disabled = clicks < 30;
    document.getElementById('btn-hue').disabled = clicks < 50;
    document.getElementById('btn-theme').disabled = clicks < 200;
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => targetImg.src = event.target.result;
        reader.readAsDataURL(file);
    }
});

updateShopButtons();