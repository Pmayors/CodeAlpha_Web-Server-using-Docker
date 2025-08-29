// Advanced Animations for Docker Web Server

class AnimationController {
    constructor() {
        this.init();
        this.setupPerformanceMonitoring();
    }

    init() {
        this.observers = new Map();
        this.animationQueue = [];
        this.isAnimating = false;
        this.performanceMetrics = {
            fps: 0,
            lastFrameTime: performance.now()
        };

        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupHoverAnimations();
        this.setupLoadingAnimations();
    }

    setupIntersectionObserver() {
        // Enhanced intersection observer with different thresholds
        const fadeInObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target, 'fadeInUp');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        const slideInObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const direction = entry.target.dataset.slideDirection || 'left';
                    this.animateElement(entry.target, `slideIn${direction.charAt(0).toUpperCase() + direction.slice(1)}`);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -100px 0px'
        });

        // Store observers
        this.observers.set('fadeIn', fadeInObserver);
        this.observers.set('slideIn', slideInObserver);

        // Observe elements
        document.querySelectorAll('[data-animate="fade"]').forEach(el => {
            fadeInObserver.observe(el);
        });

        document.querySelectorAll('[data-animate="slide"]').forEach(el => {
            slideInObserver.observe(el);
        });
    }

    setupScrollAnimations() {
        let ticking = false;

        const updateScrollAnimations = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;

            // Parallax effect for hero background
            const hero = document.querySelector('.hero');
            if (hero) {
                const parallaxSpeed = 0.5;
                hero.style.transform = `translateY(${scrollY * parallaxSpeed}px)`;
            }

            // Progressive reveal for sections
            document.querySelectorAll('[data-scroll-reveal]').forEach(element => {
                const elementTop = element.offsetTop;
                const elementHeight = element.offsetHeight;
                const revealPoint = 150;

                if (scrollY + windowHeight - revealPoint > elementTop && 
                    scrollY < elementTop + elementHeight) {
                    element.classList.add('revealed');
                }
            });

            ticking = false;
        };

        const requestScrollUpdate = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollAnimations);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    }

    setupHoverAnimations() {
        // Enhanced hover effects with performance optimization
        const cards = document.querySelectorAll('.about-card, .service-card, .status-card');
        
        cards.forEach(card => {
            let hoverTimeout;

            card.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
                this.animateElement(card, 'hoverIn');
            });

            card.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(() => {
                    this.animateElement(card, 'hoverOut');
                }, 50);
            });
        });

        // Button hover animations
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', (e) => {
                this.createRippleEffect(e);
            });
        });
    }

    setupLoadingAnimations() {
        // Page load animation sequence
        window.addEventListener('load', () => {
            this.playLoadSequence();
        });

        // Lazy loading for images
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    animateElement(element, animationType, options = {}) {
        const defaultOptions = {
            duration: 600,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            delay: 0,
            fillMode: 'both'
        };

        const config = { ...defaultOptions, ...options };
        
        // Animation definitions
        const animations = {
            fadeInUp: [
                { opacity: 0, transform: 'translateY(30px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ],
            fadeInDown: [
                { opacity: 0, transform: 'translateY(-30px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ],
            slideInLeft: [
                { opacity: 0, transform: 'translateX(-50px)' },
                { opacity: 1, transform: 'translateX(0)' }
            ],
            slideInRight: [
                { opacity: 0, transform: 'translateX(50px)' },
                { opacity: 1, transform: 'translateX(0)' }
            ],
            hoverIn: [
                { transform: 'scale(1) translateY(0)' },
                { transform: 'scale(1.02) translateY(-5px)' }
            ],
            hoverOut: [
                { transform: 'scale(1.02) translateY(-5px)' },
                { transform: 'scale(1) translateY(0)' }
            ],
            pulse: [
                { transform: 'scale(1)' },
                { transform: 'scale(1.05)' },
                { transform: 'scale(1)' }
            ],
            bounce: [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-10px)' },
                { transform: 'translateY(0)' }
            ]
        };

        if (animations[animationType]) {
            const animation = element.animate(
                animations[animationType],
                {
                    duration: config.duration,
                    easing: config.easing,
                    delay: config.delay,
                    fill: config.fillMode
                }
            );

            // Add to animation queue for performance monitoring
            this.animationQueue.push(animation);
            
            animation.addEventListener('finish', () => {
                const index = this.animationQueue.indexOf(animation);
                if (index > -1) {
                    this.animationQueue.splice(index, 1);
                }
                element.classList.add('animation-complete');
            });

            return animation;
        }
    }

    createRippleEffect(event) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            pointer-events: none;
        `;

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        const animation = ripple.animate([
            { transform: 'scale(0)', opacity: 1 },
            { transform: 'scale(1)', opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        });

        animation.addEventListener('finish', () => {
            ripple.remove();
        });
    }

    playLoadSequence() {
        const sequence = [
            { selector: '.nav-logo', delay: 100 },
            { selector: '.nav-menu li', delay: 150, stagger: 100 },
            { selector: '.hero-content', delay: 300 },
            { selector: '.hero-visual', delay: 500 },
            { selector: '.docker-animation .container-box', delay: 700, stagger: 200 }
        ];

        sequence.forEach(({ selector, delay, stagger = 0 }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element, index) => {
                setTimeout(() => {
                    this.animateElement(element, 'fadeInUp', {
                        delay: stagger * index
                    });
                }, delay);
            });
        });
    }

    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();

        const measureFPS = (currentTime) => {
            frameCount++;
            
            if (currentTime >= lastTime + 1000) {
                this.performanceMetrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    // Public API
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            activeAnimations: this.animationQueue.length
        };
    }

    pauseAllAnimations() {
        this.animationQueue.forEach(animation => animation.pause());
    }

    resumeAllAnimations() {
        this.animationQueue.forEach(animation => animation.play());
    }

    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.animationQueue.forEach(animation => animation.cancel());
    }
}

// Initialize animations
document.addEventListener('DOMContentLoaded', () => {
    window.animationController = new AnimationController();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.animationController) {
        window.animationController.cleanup();
    }
});