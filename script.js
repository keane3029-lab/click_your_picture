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

// Audio System Variables (UNLOCKED LOUD MODE)
let audioCtx = null;
let musicInterval = null;
let isMusicPlaying = false;
let currentStep = 0;
const melody = [261.63, 293.66, 329.63, 392.00, 349.23, 329.63, 293.66, 392.00]; 

const scoreDisplay = document.getElementById('score');
const cpsDisplay = document.getElementById('cps-display');
const highScoreDisplay = document.getElementById('high-score');
const targetImg = document.getElementById('target-img');
const imageWrapper = document.getElementById('image-wrapper');
const fileInput = document.getElementById('file-input');
const resetBtn = document.getElementById('reset-game-btn');
const musicBtn = document.getElementById('music-toggle-btn');

// Create combo element dynamically
const comboDisplay = document.createElement('div');
comboDisplay.className = 'combo-box';
const headerContainer = document.querySelector('.header-container');
if (headerContainer) {
    headerContainer.appendChild(comboDisplay);
}

// Initialize application views
if (scoreDisplay) scoreDisplay.textContent = clicks;
if (highScoreDisplay) highScoreDisplay.textContent = highScore;
if (targetImg) targetImg.style.filter = activeFilter;
document.body.style.background = activeTheme;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// DOUBLE-AMPLIFIED LOUD Click Sounds
window.playInteractiveSound = function(isAuto = false) {
    initAudio();
    if (!audioCtx) return;

    for (let i = 0; i < 3; i++) {
        const osc = audioCtx.createOscillator();
        const stage1Gain = audioCtx.createGain();
        const stage2Gain = audioCtx.createGain(); 
        
        osc.type = 'sawtooth'; 
        const baseFreq = isAuto ? (150 + i * 10) : (300 + (combo * 40) + i * 15); 
        osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
        
        stage1Gain.gain.setValueAtTime(isAuto ? 0.4 : 1.0, audioCtx.currentTime);
        stage1Gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        
        stage2Gain.gain.setValueAtTime(isAuto ? 1.5 : 3.0, audioCtx.currentTime);
        
        osc.connect(stage1Gain);
        stage1Gain.connect(stage2Gain);
        stage2Gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    }
}

// DOUBLE-AMPLIFIED LOUD Background Music Loop
function startBackgroundMusic() {
    initAudio();
    if (isMusicPlaying) return;
    isMusicPlaying = true;
    if (musicBtn) musicBtn.textContent = "🎵 Music: ON";

    musicInterval = setInterval(() => {
        if (!audioCtx) return;
        
        [0, 4].forEach((detuneOffset) => {
            const osc = audioCtx.createOscillator();
            const amp1 = audioCtx.createGain();
            const amp2 = audioCtx.createGain(); 
            
            osc.type = 'square'; 
            
            let freq = melody[currentStep];
            if (combo > 5) freq *= 1.5; 
            
            osc.frequency.setValueAtTime(freq + detuneOffset, audioCtx.currentTime);
            
            amp1.gain.setValueAtTime(0.8, audioCtx.currentTime);
            amp1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.24);
            
            amp2.gain.setValueAtTime(2.5, audioCtx.currentTime); 
            
            osc.connect(amp1);
            amp1.connect(amp2);
            amp2.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
        });
        
        currentStep = (currentStep + 1) % melody.length;
    }, 250);
}

function stopBackgroundMusic() {
    clearInterval(musicInterval);
    isMusicPlaying = false;
    if (musicBtn) musicBtn.textContent = "🎵 Music: OFF";
}

if (musicBtn) {
    musicBtn.addEventListener('click', () => {
        if (isMusicPlaying) {
            stopBackgroundMusic();
        } else {
            startBackgroundMusic();
        }
    });
}

// Manual User Click Trigger
if (targetImg) {
    targetImg.addEventListener('click', (e) => {
        handleCombo();
        
        const pointsGained = 1 + Math.floor(combo / 5);
        clicks += pointsGained;
        
        processScoreUpdate();
        window.playInteractiveSound(false);
        calculateTiltPhysics(e);
        spawnSparks(e);
        spawnFloatingText(e, `+${pointsGained}`);
    });
}

function processScoreUpdate() {
    if (scoreDisplay) scoreDisplay.textContent = clicks;
    localStorage.setItem('clicks', clicks);

    if (clicks > highScore) {
        highScore = clicks;
        if (highScoreDisplay) highScoreDisplay.textContent = highScore;
        localStorage.setItem('highScore', highScore);
    }
    updateShopButtons();
}

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

function calculateTiltPhysics(e) {
    if (!targetImg) return;
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

function spawnSparks(e) {
    if (!imageWrapper) return;
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

function spawnFloatingText(e, text) {
    if (!imageWrapper) return;
    let x, y;
    if (e) {
        const rect = imageWrapper.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    } else {
        x = 110 + (Math.random() * 40 - 20);
        y = 110 + (Math.random() * 40 - 20);
    }

    const float = document.createElement('div');
    float.className = 'floating-text';
    float.textContent = text;
    float.style.left = `${x}px`;
    float.style.top = `${y}px`;
    if(!e) float.style.color = '#6be0ff';

    imageWrapper.appendChild(float);
    setTimeout(() => float.remove(), 400);
}

// Exposed globally to match HTML onclick properties
window.buyAutoClicker = function(cpsValue, baseCost, countId, btnId) {
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
    const cost1 = Math.floor(20 * Math.pow(1.15, autoClickers.type1));
    const cost2 = Math.floor(100 * Math.pow(1.15, autoClickers.type2));

    const el1 = document.getElementById('count-auto1');
    const btn1 = document.getElementById('btn-auto1');
    const el2 = document.getElementById('count-auto2');
    const btn2 = document.getElementById('btn-auto2');

    if(el1) el1.textContent = autoClickers.type1;
    if(btn1) btn1.textContent = `Cost: ${cost1}`;
    if(el2) el2.textContent = autoClickers.type2;
    if(btn2) btn2.textContent = `Cost: ${cost2}`;

    currentCPS = (autoClickers.type1 * 1) + (autoClickers.type2 * 5);
    if(cpsDisplay) cpsDisplay.textContent = currentCPS;
}

// Game Core Loop
setInterval(() => {
    if (currentCPS > 0) {
        clicks += currentCPS;
        processScoreUpdate();
        window.playInteractiveSound(true);
        spawnFloatingText(null, `+${currentCPS}`);
        
        if (targetImg) {
            targetImg.style.transform = 'scale(0.97)';
            setTimeout(() => targetImg.style.transform = 'scale(1)', 50);
        }
    }
}, 1000);

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset your clicks and shop upgrades? Your High Score will be saved!")) {
            clicks = 0;
            autoClickers = { type1: 0, type2: 0 };
            
            localStorage.setItem('clicks', clicks);
            localStorage.setItem('autoClickers', JSON.stringify(autoClickers));
            
            activeFilter = 'none';
            activeTheme = 'linear-gradient(135deg, #12121f, #1a1a2e)';
            if (targetImg) targetImg.style.filter = activeFilter;
            document.body.style.background = activeTheme;
            localStorage.setItem('activeFilter', activeFilter);
            localStorage.setItem('activeTheme', activeTheme);

            stopBackgroundMusic();
            processScoreUpdate();
            updateAutoClickerUI();
        }
    });
}

window.buyFilter = function(filterStyle, btnId, cost) {
    if (clicks >= cost) {
        clicks -= cost;
        activeFilter = filterStyle;
        if (targetImg) targetImg.style.filter = filterStyle;
        localStorage.setItem('activeFilter', filterStyle);
        processScoreUpdate();
    }
}

window.buyTheme = function(themeStyle, btnId, cost) {
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

    const btn1 = document.getElementById('btn-auto1');
    const btn2 = document.getElementById('btn-auto2');
    const btnInvert = document.getElementById('btn-invert');
    const btnSepia = document.getElementById('btn-sepia');
    const btnHue = document.getElementById('btn-hue');
    const btnTheme = document.getElementById('btn-theme');

    if(btn1) btn1.disabled = clicks < cost1;
    if(btn2) btn2.disabled = clicks < cost2;
    if(btnInvert) btnInvert.disabled = clicks < 15;
    if(btnSepia) btnSepia.disabled = clicks < 30;
    if(btnHue) btnHue.disabled = clicks < 50;
    if(btnTheme) btnTheme.disabled = clicks < 200;
}

if(fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (targetImg) targetImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

updateAutoClickerUI();
updateShopButtons();
