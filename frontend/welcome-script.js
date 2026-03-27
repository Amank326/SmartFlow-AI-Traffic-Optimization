// ==================== WELCOME PAGE INITIALIZATION ==================== //

document.addEventListener('DOMContentLoaded', function() {
    // Display user greeting
    displayUserGreeting();
    
    // Setup animations
    setupAnimations();
});

// ==================== DISPLAY USER GREETING ==================== //
function displayUserGreeting() {
    const user = sessionStorage.getItem('user') || 'Guest';
    const userDisplay = document.getElementById('userDisplay');
    
    if (userDisplay) {
        // Capitalize first letter
        const displayName = user.charAt(0).toUpperCase() + user.slice(1).toLowerCase();
        userDisplay.textContent = displayName;
    }
}

// ==================== NAVIGATION FUNCTIONS ==================== //
function goToHome() {
    // Add click animation
    const btn = event.target.closest('.welcome-btn');
    
    // Disable button temporarily
    btn.disabled = true;
    btn.style.opacity = '0.7';

    // Add loading animation
    const btnContent = btn.querySelector('.btn-content');
    btnContent.innerHTML = '<span class="loading-text">Loading Dashboard...</span>';

    // Simulate loading and then navigate
    setTimeout(() => {
        // Store last visit time
        sessionStorage.setItem('lastVisit', new Date().toISOString());
        
        // Redirect to dashboard/home page
        window.location.href = 'index.html';
    }, 800);
}

function logout(event) {
    event.preventDefault();
    
    if (confirm('Are you sure you want to go back to home?')) {
        // Redirect to landing page
        window.location.href = 'landing.html';
    }
}

// ==================== ANIMATIONS ==================== //
function setupAnimations() {
    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            this.style.animation = 'none';
            setTimeout(() => {
                this.style.animation = `fadeInUp 0.6s ease both`;
                this.style.animationDelay = `${0.3 + index * 0.1}s`;
            }, 10);
        });

        // Add click interaction
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Add parallax effect on mouse move
    document.addEventListener('mousemove', function(e) {
        const shapes = document.querySelectorAll('.shape');
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        shapes.forEach((shape, index) => {
            const offset = 20 * (index + 1);
            shape.style.transform = `translate(${x * offset}px, ${y * offset}px)`;
        });
    });

    // Button hover effect enhancement
    const welcomeBtn = document.querySelector('.welcome-btn');
    if (welcomeBtn) {
        welcomeBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });

        welcomeBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    }
}

// ==================== LOADING TEXT ANIMATION ==================== //
const style = document.createElement('style');
style.textContent = `
    @keyframes dots {
        0%, 20% { content: '.'; }
        40% { content: '..'; }
        60%, 100% { content: '...'; }
    }
`;
document.head.appendChild(style);

// ==================== CONSOLE MESSAGES ==================== //
console.log('%c✅ Welcome to SmartFlow!', 'color: #1976d2; font-size: 16px; font-weight: bold;');
console.log('%cVersion: 1.0.0 | Status: Active', 'color: #64b5f6;');
console.log('%c🚦 AI Traffic Optimization System', 'color: #4caf50; font-weight: bold;');
