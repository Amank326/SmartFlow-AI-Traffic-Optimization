// ==================== SMOOTH SCROLLING & ANIMATIONS ==================== //

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    setupScrollAnimations();
    setupInteractiveElements();
});

// ==================== INITIALIZE ANIMATIONS ==================== //
function initializeAnimations() {
    // Navbar animations
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });

    // Hero title animation
    gsap.fromTo(
        '.hero-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.3 }
    );

    // Hero subtitle animation
    gsap.fromTo(
        '.hero-subtitle',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.5 }
    );

    // Hero buttons animation
    gsap.fromTo(
        '.hero-buttons',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.7 }
    );

    // Rotating globe animation
    const globe = document.querySelector('.rotating-globe');
    if (globe) {
        gsap.to(globe, {
            rotationY: 360,
            duration: 20,
            repeat: -1,
            ease: 'linear'
        });
    }

    // Floating cards animation
    const cards = document.querySelectorAll('.data-card');
    cards.forEach((card, index) => {
        gsap.fromTo(
            card,
            { opacity: 0, scale: 0.8 },
            {
                opacity: 1,
                scale: 1,
                duration: 0.8,
                delay: 0.3 + index * 0.2
            }
        );
    });
}

// ==================== SCROLL ANIMATIONS ==================== //
function setupScrollAnimations() {
    // Feature cards scroll animation
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        gsap.fromTo(
            card,
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                scrollTrigger: {
                    trigger: card,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                },
                delay: index * 0.1
            }
        );
    });

    // Timeline items animation
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
        gsap.fromTo(
            item,
            { opacity: 0, x: index % 2 === 0 ? -50 : 50 },
            {
                opacity: 1,
                x: 0,
                duration: 0.8,
                scrollTrigger: {
                    trigger: item,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    // Benefit items animation
    const benefitItems = document.querySelectorAll('.benefit-item');
    benefitItems.forEach((item, index) => {
        gsap.fromTo(
            item,
            { opacity: 0, scale: 0.9 },
            {
                opacity: 1,
                scale: 1,
                duration: 0.8,
                scrollTrigger: {
                    trigger: item,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                },
                delay: index * 0.1
            }
        );
    });

    // Stats items animation
    const stats = document.querySelectorAll('.stat-item');
    stats.forEach((stat, index) => {
        gsap.fromTo(
            stat,
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                scrollTrigger: {
                    trigger: stat,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                },
                delay: index * 0.1
            }
        );
    });

    // CTA section animation
    gsap.fromTo(
        '.cta-container',
        { opacity: 0, scale: 0.95 },
        {
            opacity: 1,
            scale: 1,
            duration: 1,
            scrollTrigger: {
                trigger: '.cta-container',
                start: 'top 80%',
                toggleActions: 'play none none none'
            }
        }
    );

    // Number counter animation for stats
    const statNumbers = document.querySelectorAll('.stat-item h3, .benefit-number');
    statNumbers.forEach(element => {
        const text = element.textContent;
        const number = parseInt(text.replace(/\D/g, ''));
        
        if (!isNaN(number)) {
            gsap.fromTo(
                { value: 0 },
                { value: number, duration: 2,
                    scrollTrigger: {
                        trigger: element,
                        start: 'top 80%',
                        toggleActions: 'play none none none'
                    },
                    onUpdate: function() {
                        let currentValue = Math.round(this.targets()[0].value);
                        let displayText = text.replace(number, currentValue);
                        element.textContent = displayText;
                    }
                }
            );
        }
    });
}

// ==================== INTERACTIVE ELEMENTS ==================== //
function setupInteractiveElements() {
    // Smooth scroll for links
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                gsap.to(window, {
                    scrollTo: target,
                    duration: 1.5
                });
            }
        });
    });

    // Button hover animations
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            gsap.to(this, {
                duration: 0.3,
                boxShadow: '0 20px 50px rgba(0, 212, 255, 0.3)'
            });
        });

        button.addEventListener('mouseleave', function() {
            gsap.to(this, {
                duration: 0.3,
                boxShadow: 'none'
            });
        });
    });

    // Feature card hover animations
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            gsap.to(this, {
                duration: 0.3,
                y: -10,
                boxShadow: '0 20px 40px rgba(0, 212, 255, 0.2)'
            });

            gsap.to(this.querySelector('.icon-3d'), {
                duration: 0.3,
                scale: 1.2,
                rotation: 20
            });
        });

        card.addEventListener('mouseleave', function() {
            gsap.to(this, {
                duration: 0.3,
                y: 0,
                boxShadow: 'none'
            });

            gsap.to(this.querySelector('.icon-3d'), {
                duration: 0.3,
                scale: 1,
                rotation: 0
            });
        });
    });

    // Benefit item hover
    const benefitItems = document.querySelectorAll('.benefit-item');
    benefitItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            gsap.to(this.querySelector('.benefit-number'), {
                duration: 0.3,
                scale: 1.1,
                color: '#00d4ff'
            });
        });

        item.addEventListener('mouseleave', function() {
            gsap.to(this.querySelector('.benefit-number'), {
                duration: 0.3,
                scale: 1
            });
        });
    });
}

// ==================== SCROLL TO SECTION FUNCTION ==================== //
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        gsap.to(window, {
            scrollTo: element,
            duration: 1.5,
            ease: 'power2.inOut'
        });
    }
}

// ==================== PARALLAX SCROLL EFFECT ==================== //
function setupParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    window.addEventListener('scroll', () => {
        parallaxElements.forEach(element => {
            const speed = element.getAttribute('data-parallax') || 0.5;
            element.style.transform = `translateY(${window.scrollY * speed}px)`;
        });
    });
}

// ==================== DYNAMIC BACKGROUND ==================== //
function setupDynamicBackground() {
    const blobs = document.querySelectorAll('.blob');
    
    blobs.forEach((blob, index) => {
        gsap.to(blob, {
            duration: Math.random() * 5 + 5,
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    });
}

// Initialize on page load
window.addEventListener('load', () => {
    setupParallax();
    setupDynamicBackground();
});

// ==================== PERFORMANCE OPTIMIZATION ==================== //
// Reduce animation complexity on low-performance devices
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.globalTimeline.timeScale(0);
}

// Console messages
console.log('%c🚦 SmartFlow AI Landing Page', 'color: #00d4ff; font-size: 16px; font-weight: bold;');
console.log('%cWelcome! Experience the future of traffic optimization.', 'color: #64b5f6;');
console.log('%cBuilt with GSAP & Modern Web Technologies', 'color: #4caf50;');
