// Professional Docker Web Server JavaScript

class DockerWebServer {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.startStatusMonitoring();
        this.initializeAnimations();
    }

    init() {
        // Initialize navigation
        this.navbar = document.getElementById('navbar');
        this.navToggle = document.getElementById('mobile-menu');
        this.navMenu = document.getElementById('nav-menu');
        
        // Initialize status elements
        this.statusElements = {
            webStatus: document.getElementById('web-status'),
            dockerStatus: document.getElementById('docker-status'),
            healthCheck: document.getElementById('health-check'),
            sslCheck: document.getElementById('ssl-check'),
            uptime: document.getElementById('uptime'),
            responseTime: document.getElementById('response-time'),
            requests: document.getElementById('requests')
        };

        // Configuration
        this.config = {
            healthCheckInterval: 30000, // 30 seconds
            metricsUpdateInterval: 5000, // 5 seconds
            animationDuration: 300
        };

        // State
        this.state = {
            isMenuOpen: false,
            lastHealthCheck: null,
            startTime: Date.now()
        };
    }

    setupEventListeners() {
        // Navigation toggle
        if (this.navToggle) {
            this.navToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });

        // Scroll event for navbar
        window.addEventListener('scroll', () => this.handleScroll());

        // Resize event
        window.addEventListener('resize', () => this.handleResize());

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    toggleMobileMenu() {
        this.state.isMenuOpen = !this.state.isMenuOpen;
        
        if (this.navMenu) {
            this.navMenu.classList.toggle('active', this.state.isMenuOpen);
        }
        
        if (this.navToggle) {
            this.navToggle.classList.toggle('active', this.state.isMenuOpen);
        }

        // Prevent body scroll when menu is open
        document.body.style.overflow = this.state.isMenuOpen ? 'hidden' : '';
    }

    handleSmoothScroll(e) {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });

            // Update active nav link
            this.updateActiveNavLink(targetId);

            // Close mobile menu if open
            if (this.state.isMenuOpen) {
                this.toggleMobileMenu();
            }
        }
    }

    handleScroll() {
        // Add scrolled class to navbar
        if (this.navbar) {
            this.navbar.classList.toggle('scrolled', window.scrollY > 50);
        }

        // Update active navigation based on scroll position
        this.updateActiveNavOnScroll();
    }

    handleResize() {
        // Close mobile menu on resize to larger screen
        if (window.innerWidth > 768 && this.state.isMenuOpen) {
            this.toggleMobileMenu();
        }
    }

    handleOutsideClick(e) {
        if (this.state.isMenuOpen && 
            !this.navMenu.contains(e.target) && 
            !this.navToggle.contains(e.target)) {
            this.toggleMobileMenu();
        }
    }

    handleKeydown(e) {
        // Close mobile menu with Escape key
        if (e.key === 'Escape' && this.state.isMenuOpen) {
            this.toggleMobileMenu();
        }
    }

    updateActiveNavLink(targetId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === targetId) {
                link.classList.add('active');
            }
        });
    }

    updateActiveNavOnScroll() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                this.updateActiveNavLink(`#${sectionId}`);
            }
        });
    }

    startStatusMonitoring() {
        // Initial status check
        this.checkSystemStatus();
        this.updateMetrics();

        // Set up intervals
        setInterval(() => this.checkSystemStatus(), this.config.healthCheckInterval);
        setInterval(() => this.updateMetrics(), this.config.metricsUpdateInterval);
    }

    async checkSystemStatus() {
        try {
            // Check web server status
            await this.checkWebServerStatus();
            
            // Check health endpoint
            await this.checkHealthEndpoint();
            
            // Update SSL status
            this.checkSSLStatus();
            
            this.state.lastHealthCheck = new Date();
        } catch (error) {
            console.error('Status check failed:', error);
        }
    }

    async checkWebServerStatus() {
        try {
            const response = await fetch(window.location.origin, {
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            this.updateStatusIndicator('web-status', response.ok ? 'online' : 'offline');
        } catch (error) {
            this.updateStatusIndicator('web-status', 'offline');
        }
    }

    async checkHealthEndpoint() {
        try {
            const startTime = performance.now();
            const response = await fetch('/health', {
                cache: 'no-cache'
            });
            const endTime = performance.now();
            
            const isHealthy = response.ok && response.status === 200;
            this.updateStatusIndicator('health-check', isHealthy ? 'online' : 'offline');
            
            // Update response time
            const responseTime = Math.round(endTime - startTime);
            if (this.statusElements.responseTime) {
                this.statusElements.responseTime.textContent = `${responseTime}ms`;
            }
        } catch (error) {
            this.updateStatusIndicator('health-check', 'offline');
        }
    }

    checkSSLStatus() {
        const isHTTPS = window.location.protocol === 'https:';
        this.updateStatusIndicator('ssl-check', isHTTPS ? 'online' : 'offline');
    }

    updateStatusIndicator(elementId, status) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const dot = element.querySelector('.status-dot');
        const text = element.querySelector('.status-text');

        if (dot) {
            dot.className = `status-dot ${status}`;
        }

        if (text) {
            const statusTexts = {
                online: 'Online',
                offline: 'Offline',
                checking: 'Checking...'
            };
            text.textContent = statusTexts[status] || 'Unknown';
        }
    }

    updateMetrics() {
        // Update uptime
        if (this.statusElements.uptime) {
            const uptime = Date.now() - this.state.startTime;
            const hours = Math.floor(uptime / (1000 * 60 * 60));
            const days = Math.floor(hours / 24);
            
            if (days > 0) {
                this.statusElements.uptime.textContent = `${days}d ${hours % 24}h`;
            } else {
                this.statusElements.uptime.textContent = `${hours}h`;
            }
        }

        // Simulate request counter (in a real app, this would come from analytics)
        if (this.statusElements.requests) {
            const baseRequests = 1200;
            const variance = Math.floor(Math.random() * 200) - 100;
            this.statusElements.requests.textContent = `${(baseRequests + variance).toLocaleString()}`;
        }
    }

    initializeAnimations() {
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.about-card, .service-card, .status-card').forEach(el => {
            observer.observe(el);
        });
    }

    // Public API methods
    getSystemStatus() {
        return {
            lastHealthCheck: this.state.lastHealthCheck,
            uptime: Date.now() - this.state.startTime,
            isOnline: true // This would be determined by actual checks
        };
    }

    refreshStatus() {
        this.checkSystemStatus();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dockerWebServer = new DockerWebServer();
});

// Add animation CSS
const animationStyles = `
    .about-card,
    .service-card,
    .status-card {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .about-card.animate-in,
    .service-card.animate-in,
    .status-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
`;

// Inject animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);