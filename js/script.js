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
const cursorCoords = document.getElementById('cursor-coords');
document.addEventListener('mousemove', (e) => {
    // Update coordinates display
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
const canvas = document.getElementById('decay-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
    }

    startDecay(targetPage) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.targetPage = targetPage;
        this.startTime = Date.now();
        canvas.style.opacity = '1';
        canvas.style.zIndex = '10000';
        
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
        const currentPage = document.querySelector('.page.active');
        if (currentPage) {
            currentPage.style.opacity = '0';
        }
        
        this.animate();
    }

    animate() {
        if (!this.isActive) return;
        
        const elapsed = Date.now() - this.startTime;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
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
                    ctx.save();
                    ctx.translate(button.x, button.y);
                    ctx.rotate(button.rotation);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-button.width / 2, -button.height / 2, button.width, button.height);
                    ctx.restore();
                }
            });
            
            requestAnimationFrame(() => this.animate());
        }
        // PHASE 2: FLICKER SEQUENCE (2-3.5 seconds)
        else if (elapsed < this.buttonFallDuration + this.flickerDuration) {
            const flickerElapsed = elapsed - this.buttonFallDuration;
            
            // Flicker sequence: white → black → white → black → white (stays white)
            // Timing: 0-300ms white, 300-600ms black, 600-900ms white, 900-1200ms black, 1200ms+ white
            let isWhite = false;
            if (flickerElapsed < 300) {
                isWhite = true;
            } else if (flickerElapsed < 600) {
                isWhite = false;
            } else if (flickerElapsed < 900) {
                isWhite = true;
            } else if (flickerElapsed < 1200) {
                isWhite = false;
            } else {
                isWhite = true; // Stay white
            }
            
            ctx.fillStyle = isWhite ? '#FFFFFF' : '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            requestAnimationFrame(() => this.animate());
        }
        // PHASE 3: BUILD UP (3.5-5.5 seconds)
        else if (elapsed < this.buttonFallDuration + this.flickerDuration + this.buildDuration) {
            const buildElapsed = elapsed - (this.buttonFallDuration + this.flickerDuration);
            const buildProgress = buildElapsed / this.buildDuration;
            
            // Fill with white first
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Build black chunks from bottom
            const chunkSize = 40;
            const cols = Math.ceil(canvas.width / chunkSize);
            const rows = Math.ceil(canvas.height / chunkSize);
            
            for (let y = rows - 1; y >= 0; y--) {
                for (let x = 0; x < cols; x++) {
                    const chunkY = y * chunkSize;
                    const distanceFromBottom = canvas.height - chunkY;
                    const maxDistance = canvas.height;
                    const chunkProgress = Math.max(0, (buildProgress * maxDistance - distanceFromBottom) / chunkSize);
                    
                    if (chunkProgress > 0) {
                        ctx.fillStyle = '#000000';
                        ctx.globalAlpha = Math.min(1, chunkProgress);
                        ctx.fillRect(x * chunkSize, chunkY, chunkSize, chunkSize);
                    }
                }
            }
            
            ctx.globalAlpha = 1;
            requestAnimationFrame(() => this.animate());
        }
        // PHASE 4: Complete
        else {
            this.completeTransition();
        }
    }

    completeTransition() {
        this.isActive = false;
        canvas.style.opacity = '0';
        canvas.style.zIndex = '9999';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset buttons
        this.buttons.forEach(button => {
            if (button.element) {
                button.element.classList.remove('falling');
            }
        });
        this.buttons = [];
        
        // Switch pages
        switchPage(this.targetPage);
        
        // Show new page with fade in
        const newPage = pages[this.targetPage];
        if (newPage) {
            newPage.style.opacity = '0';
            setTimeout(() => {
                newPage.style.opacity = '1';
            }, 50);
        }
    }
}

const decayEffect = new DecayEffect();

// Page Management
const pages = {
    'home': document.getElementById('home-page'),
    'about': document.getElementById('about-page'),
    'resume': document.getElementById('resume-page'),
    'projects': document.getElementById('projects-page'),
    'contact': document.getElementById('contact-page')
};

function switchPage(pageId) {
    // Hide all pages
    Object.values(pages).forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
    if (pages[pageId]) {
        pages[pageId].classList.add('active');
    }
}

// Navigation Buttons
document.querySelectorAll('.hex-button, .back-button').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = button.getAttribute('data-page');
        
        if (targetPage && !decayEffect.isActive) {
            // Start decay transition
            decayEffect.startDecay(targetPage);
        }
    });

    // Add glitch on hover
    button.addEventListener('mouseenter', () => {
        if (!button.classList.contains('falling')) {
            const position = button.getAttribute('data-position');
            if (position === 'north') {
                button.style.transform = 'translate(-50%, -50%) translateX(2px) translateY(-1px)';
            } else if (position === 'south') {
                button.style.transform = 'translate(-50%, 50%) translateX(2px) translateY(-1px)';
            } else if (position === 'east') {
                button.style.transform = 'translate(50%, -50%) translateX(2px) translateY(-1px)';
            } else if (position === 'west') {
                button.style.transform = 'translate(-50%, -50%) translateX(2px) translateY(-1px)';
            }
        }
    });

    button.addEventListener('mouseleave', () => {
        if (!button.classList.contains('falling')) {
            // Reset to original position based on data-position
            const position = button.getAttribute('data-position');
            if (position === 'north') {
                button.style.transform = 'translate(-50%, -50%)';
            } else if (position === 'south') {
                button.style.transform = 'translate(-50%, 50%)';
            } else if (position === 'east') {
                button.style.transform = 'translate(50%, -50%)';
            } else if (position === 'west') {
                button.style.transform = 'translate(-50%, -50%)';
            }
        }
    });
});

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

// Initialize - show home page
switchPage('home');
