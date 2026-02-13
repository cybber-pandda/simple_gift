/**
 * THE VAULT - CORE LOGIC
 */

// --- CONFIG & GLOBAL STATE ---
const START_DATE = new Date('2024-10-08');
let autoScrollIntervals = []; // Global scope for gallery scrolling
let attempts = 0;
let isSecondPhase = false;

let state = {
    stage: parseInt(sessionStorage.getItem('valentine_stage')) || 1,
    memoriesViewed: false,
    statsViewed: false,
    portraitViewed: false,
    gameActive: false
};

// --- CATCH GAME GLOBALS ---
let canvas, ctx;
let score = 0;
let items = [];
let player = { x: 0, y: 0, w: 80, h: 20 };

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    goToStage(state.stage);
    updateStats();
    setupInputListener();
});

/**
 * Handles input monitoring to enable/disable the button
 */
function setupInputListener() {
    const gateInput = document.getElementById('gatekeeper-input');
    const unlockBtn = document.getElementById('unlock-btn');

    if (gateInput && unlockBtn) {
        gateInput.addEventListener('input', function () {
            if (this.value.trim().length > 0) {
                unlockBtn.disabled = false;
                unlockBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                unlockBtn.classList.add('opacity-100', 'cursor-pointer');
            } else {
                unlockBtn.disabled = true;
                unlockBtn.classList.add('opacity-50', 'cursor-not-allowed');
                unlockBtn.classList.remove('opacity-100', 'cursor-pointer');
            }
        });

        gateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !unlockBtn.disabled) handleAuth();
        });
    }
}

/**
 * Stage 1 Authentication
 */
function handleAuth() {
    const inputField = document.getElementById('gatekeeper-input');
    const val = inputField.value;

    const isCorrect = (val === "10/08/24" || val === "10/08/2024" || val === "2024-10-08" || val === "10-08-24" || val === "10-08-2024");

    if (isCorrect) {
        const msg = attempts < 2 && !isSecondPhase
            ? "Wow, Lakas ng Chamba! HAHAHAHA"
            : "Wow tumama na! jke I love you!";

        showResponseModal(msg, "💖", "Proceed");

        document.getElementById('modal-btn').onclick = () => {
            closeModal();
            goToStage(2);
        };
    } else {
        attempts++;
        shakeBox();

        if (attempts >= 2 && !isSecondPhase) {
            showAnnoyingModal();
            switchToDatePicker();
        } else {
            inputField.value = "";
        }
    }
}

/**
 * Stage Transitions
 */
function goToStage(num) {
    const stages = document.querySelectorAll('.stage');
    stages.forEach(s => s.classList.add('hidden'));

    const currentStage = document.getElementById(`stage-${num}`);
    if (currentStage) {
        currentStage.classList.remove('hidden');
    }

    state.stage = num;
    sessionStorage.setItem('valentine_stage', num);

    switch (num) {
        case 2: initMemoryGame(); break;
        case 3: initCatchGame(); break;
        case 4: triggerIntermission(); break;
        case 5: 
            showTab('memories');
            break;
    }
}

// --- STAGE 2: MEMORY GAME LOGIC ---
function initMemoryGame() {
    const suits = ['♥', '♦', '♣', '♠', 'Q', 'K'];
    const grid = document.getElementById('memory-grid');

    let deck = [...suits, ...suits].sort(() => Math.random() - 0.5);
    let flipped = [];
    let matched = 0;

    grid.innerHTML = '';
    deck.forEach(symbol => {
        const card = document.createElement('div');
        card.className = 'card';
        let colorClass = (symbol === '♥' || symbol === '♦') ? 'card-red' : (symbol === 'Q' || symbol === 'K' ? 'card-gold' : '');

        card.innerHTML = `
            <div class="card-inner w-full h-full">
                <div class="card-front glass"></div>
                <div class="card-back ${colorClass}">${symbol}</div>
            </div>`;

        card.onclick = function () {
            if (flipped.length < 2 && !this.classList.contains('flipped') && !this.classList.contains('match-glow')) {
                this.classList.add('flipped');
                flipped.push(this);

                if (flipped.length === 2) {
                    const val1 = flipped[0].querySelector('.card-back').innerText;
                    const val2 = flipped[1].querySelector('.card-back').innerText;

                    if (val1 === val2) {
                        matched++;
                        flipped.forEach(c => c.classList.add('match-glow'));
                        flipped = [];
                        if (matched === suits.length) {
                            setTimeout(() => {
                                const nextBtn = document.getElementById('next-stage-2');
                                nextBtn.classList.remove('hidden');
                                nextBtn.onclick = () => {
                                    showResponseModal("Life is a deck of cards, and I’m so lucky I found my perfect partner in you. ❤️", "🃏", "Next Game");
                                    document.getElementById('modal-btn').onclick = () => {
                                        closeModal();
                                        goToStage(3);
                                    };
                                };
                            }, 600);
                        }
                    } else {
                        setTimeout(() => {
                            flipped.forEach(c => c.classList.remove('flipped'));
                            flipped = [];
                        }, 800);
                    }
                }
            }
        };
        grid.appendChild(card);
    });
}

// --- STAGE 3: CATCH GAME ---
function initCatchGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    score = 0;
    items = [];
    state.gameActive = false;
    document.getElementById('score-display').innerText = `Score: 0 / 15`;

    player.w = 80;
    player.h = 15;
    player.x = canvas.width / 2 - player.w / 2;
    player.y = canvas.height - 30;

    const moveHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        player.x = clientX - rect.left - player.w / 2;
        player.x = Math.max(0, Math.min(player.x, canvas.width - player.w));
    };

    canvas.addEventListener('mousemove', moveHandler);
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); moveHandler(e); }, { passive: false });

    startCountdown();
}

function startCountdown() {
    let count = 3;
    const modalBtn = document.getElementById('modal-btn');
    const countInterval = setInterval(() => {
        showResponseModal(`Game starting in...<br><b class="text-4xl text-rose-500">${count}</b>`, "🎮", "Get Ready!");
        modalBtn.classList.add('hidden');
        count--;
        if (count < 0) {
            clearInterval(countInterval);
            closeModal();
            modalBtn.classList.remove('hidden');
            state.gameActive = true;
            gameLoop();
        }
    }, 1000);
}

function gameLoop() {
    if (!state.gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Math.random() < (0.04 + score * 0.005)) {
        items.push({
            x: Math.random() * (canvas.width - 20), y: 0,
            s: (3 + Math.random() * 2) * (1 + score * 0.03),
            t: Math.random() < 0.15 ? '💔' : (Math.random() < 0.05 ? '✨' : '❤️'),
            sway: Math.random() * 0.05, offset: Math.random() * Math.PI * 2
        });
    }

    ctx.fillStyle = '#FF85A1';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 10);
    ctx.fill();

    items.forEach((item, i) => {
        item.y += item.s;
        item.x += Math.sin(item.y * item.sway + item.offset) * 2;
        ctx.font = "24px serif";
        ctx.fillText(item.t, item.x, item.y);

        if (item.y > player.y && item.y < player.y + player.h + 20 &&
            item.x > player.x - 10 && item.x < player.x + player.w + 10) {
            if (item.t === '❤️') score++;
            else if (item.t === '✨') score += 3;
            else score = Math.max(0, score - 2);
            items.splice(i, 1);
            document.getElementById('score-display').innerText = `Score: ${score} / 15`;
            if (score >= 15) {
                state.gameActive = false;
                showVictoryModal(score);
            }
        }
        if (item.y > canvas.height) items.splice(i, 1);
    });

    if (state.gameActive) requestAnimationFrame(gameLoop);
}

function showVictoryModal(finalScore) {
    const rizz = ["You caught every heart... but you only needed mine. ❤️", "Score: Perfect. My heart? Also yours. 👑"];
    showResponseModal(`<span class="text-rose-400 font-bold">You Scored ${finalScore}!</span><br><br>${rizz[Math.floor(Math.random() * rizz.length)]}`, "🏆", "Continue");
    document.getElementById('modal-btn').onclick = () => { closeModal(); goToStage(4); };
}

// --- STAGE 4: INTERMISSION ---
function triggerIntermission() {
    const text = "I hope those made you smile... but I have something more to show you.";
    const el = document.getElementById('intermission-text');
    let i = 0; el.innerHTML = "";
    const typewriter = setInterval(() => {
        el.innerHTML += text[i];
        i++;
        if (i >= text.length) {
            clearInterval(typewriter);
            setTimeout(() => goToStage(5), 2500);
        }
    }, 60);
}

// --- STAGE 5: DASHBOARD ---
function showTab(tabName) {
    const stage5 = document.getElementById('stage-5');

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    // Deactivate all nav links
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active-tab'));

    // Show selected tab
    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetBtn = document.getElementById(`btn-${tabName}`);

    if (targetTab) targetTab.classList.remove('hidden');
    if (targetBtn) targetBtn.classList.add('active-tab');

    // Stop scrolling when switching away from memories
    autoScrollIntervals.forEach(clearInterval);
    autoScrollIntervals = [];

    // --- Dynamic Background Transition ---
    if (tabName === 'portrait') {
        state.portraitViewed = true;
        if (stage5) {
            stage5.style.backgroundColor = "#000";
            stage5.style.transition = "background-color 0.8s ease";
        }

        const lyricsEl = document.getElementById('lyrics');
        if (lyricsEl && !lyricsEl.dataset.processed) {
            lyricsEl.innerText = (lyricsEl.innerText + ' ').repeat(150);
            lyricsEl.dataset.processed = "true";
        }
    } else {
        if (stage5) {
            stage5.style.backgroundColor = "#fffafa";
        }
    }

    // Tab Specific Logic
    if (tabName === 'memories') {
        state.memoriesViewed = true;
        // Small delay to ensure DOM visibility before calculating scroll widths
        setTimeout(startGalleryAutoScroll, 100);
    }
    if (tabName === 'stats') state.statsViewed = true;

    // Unlock logic
    if (state.memoriesViewed && state.statsViewed && state.portraitViewed) {
        const lockBtn = document.getElementById('final-letter-nav');
        if (lockBtn) {
            lockBtn.classList.remove('opacity-40', 'cursor-not-allowed');
            lockBtn.innerHTML = "Letter";
            lockBtn.onclick = () => showTab('letter');
        }
    }
}

function startGalleryAutoScroll() {
    // Clear any existing intervals
    autoScrollIntervals.forEach(clearInterval);
    autoScrollIntervals = [];

    const containers = document.querySelectorAll('.horizontal-scroll-container');
    
    containers.forEach(container => {
        // Skip if container has no overflow
        if (container.scrollWidth <= container.clientWidth) return;

        const interval = setInterval(() => {
            if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) {
                container.scrollLeft = 0;
            } else {
                container.scrollLeft += 1;
            }
        }, 30); 
        
        autoScrollIntervals.push(interval);

        // Manage hover states specifically for this container
        container.onmouseenter = () => {
            // Clearing all intervals on hover prevents weird jumping
            autoScrollIntervals.forEach(clearInterval);
        };
        
        container.onmouseleave = () => {
            startGalleryAutoScroll();
        };
    });
}

function updateStats() {
    const today = new Date();
    const timeDiff = Math.abs(today - START_DATE);
    const dayCount = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const counter = document.getElementById('stat-counter');
    if (counter) counter.innerText = dayCount;
}

// --- UTILITIES ---
function showResponseModal(msg, emoji, btnText) {
    const modal = document.getElementById('response-modal');
    document.getElementById('modal-message').innerHTML = msg;
    document.getElementById('modal-emoji').innerText = emoji;
    document.getElementById('modal-btn').innerText = btnText;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('response-modal').classList.add('hidden');
}

function shakeBox() {
    const box = document.querySelector('.gate-box');
    if (box) {
        box.classList.add('shake');
        setTimeout(() => box.classList.remove('shake'), 500);
    }
}

function showAnnoyingModal() {
    const msg = `Do you think it's the date na naging <b>officially</b> in a relationship tayo? Hmm, <b>MALI</b> HAHAHA<br><br>
                 <span class="text-[10px] uppercase tracking-wider opacity-70">Hint: The day we started our conversation… backread ka muna 😏</span>`;
    showResponseModal(msg, "🧐", "Try Again 🙄");
}

function switchToDatePicker() {
    isSecondPhase = true;
    const instruction = document.getElementById('gate-instruction');
    if(instruction) instruction.innerText = "When did our story start?";
    
    const container = document.getElementById('input-container');
    const today = new Date().toISOString().split('T')[0];
    if(container) {
        container.innerHTML = `<input type="date" id="gatekeeper-input" max="${today}" class="bg-transparent border-b-2 border-rose-300 p-2 text-lg outline-none text-rose-600 focus:border-rose-500 transition-all text-center w-full">`;
    }
    setTimeout(setupInputListener, 10);
}


function celebrateSuccess() {
    // 1. Play the Music
    const music = document.getElementById('valentine-music');
    if (music) {
        music.volume = 0; // Start at 0 for fade-in
        music.play().catch(error => {
            console.log("Music play blocked or file not found:", error);
        });

        // Optional: Smoothly fade in the volume over 2 seconds
        let vol = 0;
        const fadeIn = setInterval(() => {
            if (vol < 0.5) { // Sets max volume to 50%
                vol += 0.05;
                music.volume = vol;
            } else {
                clearInterval(fadeIn);
            }
        }, 200);
    }

    // 2. Trigger Confetti
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: 999
        });
    }

    // 3. Show Modal
    const modal = document.getElementById('response-modal');
    if (modal) {
        document.getElementById('modal-emoji').innerText = "💖✨";
        document.getElementById('modal-message').innerHTML = "<strong>I knew you'd say yes!</strong><br>I've locked it in. I love you, Bebe! 🌹";
        modal.classList.remove('hidden');
    }
}