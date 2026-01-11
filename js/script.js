// BRUTALIST WEBSITE SCRIPT

// Custom Cursor - DISABLED
/*
const cursor = document.getElementById('cursor');
const cursorCoords = document.getElementById('cursor-coords');
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;

// Initialize cursor position
if (cursor) {
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursor.style.display = 'block';
    cursor.style.visibility = 'visible';
    cursor.style.opacity = '1';
}
*/

// Cursor coordinates only
let cursorCoords = null;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    cursorCoords = document.getElementById('cursor-coords');
});

document.addEventListener('mousemove', (e) => {
    // Update coordinates display
    if (!cursorCoords) {
        cursorCoords = document.getElementById('cursor-coords');
    }
    if (cursorCoords) {
        cursorCoords.textContent = `(${Math.round(e.clientX)}, ${Math.round(e.clientY)})`;
    }
});

/*
function updateCursor() {
    if (!cursor) return;
    
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursor.style.display = 'block';
    cursor.style.visibility = 'visible';
    requestAnimationFrame(updateCursor);
}
updateCursor();
*/

// Decay Canvas Setup
let canvas = null;
let ctx = null;

// Initialize canvas when DOM is ready
function initCanvas() {
    canvas = document.getElementById('decay-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

// Try to initialize immediately
initCanvas();

// Also try when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
});

window.addEventListener('resize', () => {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

// Decay Effect Class - Simplified
class DecayEffect {
    constructor() {
        this.isActive = false;
        this.targetPage = null;
        this.startTime = 0;
        this.buttonFallDuration = 800; // 0.8 seconds for buttons to fall
        this.whiteLayerDuration = 600; // 0.6 seconds for white layer sweep
        this.buildDuration = 600; // 0.6 second for rebuild
        this.buttons = [];
        this.canvas = null;
        this.ctx = null;
    }
    
    setCanvas(canvasElement, ctxElement) {
        this.canvas = canvasElement;
        this.ctx = ctxElement;
    }

    startDecay(targetPage) {
        if (this.isActive) return;
        
        // Make sure canvas is initialized
        if (!this.canvas || !this.ctx) {
            initCanvas();
            this.setCanvas(canvas, ctx);
            if (!this.canvas || !this.ctx) {
                console.error('Canvas not initialized!');
                return;
            }
        }
        
        this.isActive = true;
        this.targetPage = targetPage;
        this.startTime = Date.now();
        this.canvas.style.opacity = '1';
        this.canvas.style.zIndex = '10000';
        
        // Capture buttons from current page (home page hex buttons or back buttons)
        const currentPage = document.querySelector('.page.active');
        if (currentPage) {
            // Get hex buttons from home page
            const hexButtons = currentPage.querySelectorAll('.hex-button');
            // Get back buttons from content pages
            const backButtons = currentPage.querySelectorAll('.back-button');
            // Combine both
            const allButtons = [...hexButtons, ...backButtons];
            
            allButtons.forEach((button) => {
                const rect = button.getBoundingClientRect();
                this.buttons.push({
                    element: button,
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    width: rect.width,
                    height: rect.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 2 + 1,
                    rotation: 0,
                    rotationSpeed: (Math.random() - 0.5) * 0.1,
                    broken: false,
                    breakTime: Math.random() * 1000 + 500
                });
                button.classList.add('falling');
            });
        }
        
        // Hide current page
        if (currentPage) {
            currentPage.style.opacity = '0';
        }
        
        this.animate();
    }

    animate() {
        if (!this.isActive || !this.canvas || !this.ctx) return;
        
        const elapsed = Date.now() - this.startTime;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // PHASE 1: BUTTONS FALLING (0-2 seconds)
        if (elapsed < this.buttonFallDuration) {
            const progress = elapsed / this.buttonFallDuration;
            
            // Animate falling buttons
            this.buttons.forEach((button) => {
                if (elapsed > button.breakTime && !button.broken) {
                    button.broken = true;
                }
                
                if (!button.broken) {
                    button.y += button.vy * (1 + progress * 2);
                    button.x += button.vx * (1 + progress);
                    button.rotation += button.rotationSpeed;
                    button.vy += 0.3; // Gravity
                    
                    // Draw button
                    this.ctx.save();
                    this.ctx.translate(button.x, button.y);
                    this.ctx.rotate(button.rotation);
                    this.ctx.strokeStyle = '#FFFFFF';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(-button.width / 2, -button.height / 2, button.width, button.height);
                    this.ctx.restore();
                }
            });
            
            requestAnimationFrame(() => this.animate());
        }
        // PHASE 2: WHITE LAYER SWEEP (2-3 seconds)
        else if (elapsed < this.buttonFallDuration + this.whiteLayerDuration) {
            const whiteElapsed = elapsed - this.buttonFallDuration;
            const whiteProgress = whiteElapsed / this.whiteLayerDuration;
            
            // Start with black background
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Build white chunks from bottom (same style as black rebuild)
            const chunkSize = 40;
            const cols = Math.ceil(this.canvas.width / chunkSize);
            const rows = Math.ceil(this.canvas.height / chunkSize);
            
            for (let y = rows - 1; y >= 0; y--) {
                for (let x = 0; x < cols; x++) {
                    const chunkY = y * chunkSize;
                    const distanceFromBottom = this.canvas.height - chunkY;
                    const maxDistance = this.canvas.height;
                    const chunkProgress = Math.max(0, (whiteProgress * maxDistance - distanceFromBottom) / chunkSize);
                    
                    if (chunkProgress > 0) {
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.globalAlpha = Math.min(1, chunkProgress);
                        this.ctx.fillRect(x * chunkSize, chunkY, chunkSize, chunkSize);
                    }
                }
            }
            
            this.ctx.globalAlpha = 1;
            requestAnimationFrame(() => this.animate());
        }
        // PHASE 3: BUILD UP BLACK FROM BOTTOM (3-5 seconds)
        else if (elapsed < this.buttonFallDuration + this.whiteLayerDuration + this.buildDuration) {
            const buildElapsed = elapsed - (this.buttonFallDuration + this.whiteLayerDuration);
            const buildProgress = buildElapsed / this.buildDuration;
            
            // Fill with white first (from previous phase)
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Build black chunks from bottom
            const chunkSize = 40;
            const cols = Math.ceil(this.canvas.width / chunkSize);
            const rows = Math.ceil(this.canvas.height / chunkSize);
            
            for (let y = rows - 1; y >= 0; y--) {
                for (let x = 0; x < cols; x++) {
                    const chunkY = y * chunkSize;
                    const distanceFromBottom = this.canvas.height - chunkY;
                    const maxDistance = this.canvas.height;
                    const chunkProgress = Math.max(0, (buildProgress * maxDistance - distanceFromBottom) / chunkSize);
                    
                    if (chunkProgress > 0) {
                        this.ctx.fillStyle = '#000000';
                        this.ctx.globalAlpha = Math.min(1, chunkProgress);
                        this.ctx.fillRect(x * chunkSize, chunkY, chunkSize, chunkSize);
                    }
                }
            }
            
            this.ctx.globalAlpha = 1;
            requestAnimationFrame(() => this.animate());
        }
        // PHASE 4: Complete
        else {
            this.completeTransition();
        }
    }

    completeTransition() {
        this.isActive = false;
        if (this.canvas) {
            this.canvas.style.opacity = '0';
            this.canvas.style.zIndex = '9999';
        }
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Reset buttons
        this.buttons.forEach(button => {
            if (button.element) {
                button.element.classList.remove('falling');
            }
        });
        this.buttons = [];
        
        // Switch pages
        console.log('Switching to page:', this.targetPage);
        switchPage(this.targetPage);
    }
}

const decayEffect = new DecayEffect();

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    initPages();
    if (canvas && ctx) {
        decayEffect.setCanvas(canvas, ctx);
    }
    setupButtons();
    switchPage('home');
});

// Also try immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded
    initCanvas();
    initPages();
    if (canvas && ctx) {
        decayEffect.setCanvas(canvas, ctx);
    }
    setupButtons();
    switchPage('home');
}

// Page Management
let pages = {};

function initPages() {
    pages = {
        'home': document.getElementById('home-page'),
        'about': document.getElementById('about-page'),
        'resume': document.getElementById('resume-page'),
        'writing': document.getElementById('writing-page'),
        'music': document.getElementById('music-page')
    };
}

function switchPage(pageId) {
    // Hide all pages
    Object.values(pages).forEach(page => {
        if (page) {
            page.classList.remove('active');
        }
    });

    // Show target page
    if (pages[pageId]) {
        pages[pageId].classList.add('active');
        pages[pageId].style.opacity = '1';
    } else {
        console.error('Page not found:', pageId);
    }
}

// Navigation Buttons
function setupButtons() {
    document.querySelectorAll('.hex-button, .back-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetPage = button.getAttribute('data-page');
            
            if (targetPage && !decayEffect.isActive) {
                // Make sure canvas is set
                if (!decayEffect.canvas || !decayEffect.ctx) {
                    initCanvas();
                    if (canvas && ctx) {
                        decayEffect.setCanvas(canvas, ctx);
                    }
                }
                // Start decay transition
                decayEffect.startDecay(targetPage);
            }
        });

        // Hover effect - don't override transform, let CSS handle it
        // The CSS :hover already handles the box-shadow effect
    });
}

// Music page - add any interactive features here if needed

// Prevent default cursor on interactive elements - DISABLED
/*
document.querySelectorAll('button, input, textarea, a').forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1.2)';
    });
    
    el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
    });
});
*/

// Initialize - show home page (will be called in DOMContentLoaded)
