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
        this.buttonFallDuration = 2000; // 2 seconds for buttons to fall
        this.flickerDuration = 1500; // 1.5 seconds for flicker sequence
        this.buildDuration = 2000; // 2 seconds for rebuild
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
        
        // Hide current page immediately
        const currentPage = document.querySelector('.page.active');
        if (currentPage) {
            currentPage.style.opacity = '0';
        }
        
        // Start with white screen
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.animate();
    }

    animate() {
        if (!this.isActive || !this.canvas || !this.ctx) return;
        
        const elapsed = Date.now() - this.startTime;
        
        // PHASE 1: BUILD UP BLACK FROM BOTTOM (0-2 seconds)
        if (elapsed < this.buildDuration) {
            const buildProgress = elapsed / this.buildDuration;
            
            // Fill with white first
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
        // PHASE 2: Complete
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
        'projects': document.getElementById('projects-page'),
        'contact': document.getElementById('contact-page')
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

// Contact Form
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const message = contactForm.querySelector('textarea').value;
        
        console.log('Form submitted:', { name, email, message });
        alert('MESSAGE SENT. THANK YOU.');
        
        contactForm.reset();
    });
}

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
