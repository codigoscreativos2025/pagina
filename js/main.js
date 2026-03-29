/* ========================================
   Pivot AI - JavaScript con Animaciones
   ======================================== */

gsap.registerPlugin(ScrollTrigger);

// ========================================
// 1. Fondo Ambiental con Partículas
// ========================================
class ParticleNetwork {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.particleCount = 50;
        this.connectionDistance = 150;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createParticles();
        this.animate();
        this.addEventListeners();
    }
    
    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 2 + 1,
                color: Math.random() > 0.5 ? 'rgba(37, 99, 235, 0.4)' : 'rgba(6, 182, 212, 0.4)'
            });
        }
    }
    
    addEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }
    
    animate() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            if (this.mouse.x && this.mouse.y) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    const force = (150 - distance) / 150;
                    particle.vx += (dx / distance) * force * 0.01;
                    particle.vy += (dy / distance) * force * 0.01;
                }
            }
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();
            
            for (let j = index + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.strokeStyle = `rgba(37, 99, 235, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// 2. Animación Tipográfica (Typing Effect)
// ========================================
function initTypingEffect() {
    const textElement = document.querySelector('.typing-text');
    if (!textElement) return;
    
    const phrases = [
        'humanos que se cansan',
        'humanos que se enferman', 
        'humanos que se van de vacaciones',
        'empleados costosos'
    ];
    
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;
    
    function type() {
        const currentPhrase = phrases[phraseIndex];
        
        if (isDeleting) {
            textElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 40;
        } else {
            textElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 80;
        }
        
        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typingSpeed = 2000;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = 500;
        }
        
        setTimeout(type, typingSpeed);
    }
    
    type();
}

// ========================================
// 3. Animaciones del Hero
// ========================================
function initHeroAnimations() {
    const tl = gsap.timeline();
    
    tl.from('nav', {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
    })
    .to('.hero-badge', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
    })
    .to('.hero-title', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.3')
    .to('.hero-subtitle', {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.4')
    .to('.hero-cta', {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.3')
    .to('.hero-stats', {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.3');
    
    // Contadores animados
    gsap.from('.counter', {
        scrollTrigger: {
            trigger: '.hero-stats',
            start: 'top 80%'
        },
        textContent: 0,
        duration: 2,
        ease: 'power1.out',
        snap: { textContent: 1 },
        onUpdate: function() {
            const target = this.targets()[0];
            target.textContent = Math.round(target.textContent);
        }
    });
}

// ========================================
// 4. Animaciones Scroll Reveal
// ========================================
function initScrollAnimations() {
    // Todos los elementos con clase scroll-reveal
    const scrollElements = document.querySelectorAll('.scroll-reveal');
    
    scrollElements.forEach((el, index) => {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: index * 0.05,
            ease: 'power2.out'
        });
    });
    
    // Procesos - stagger animation
    gsap.from('.process-item', {
        scrollTrigger: {
            trigger: '#procesos .space-y-6',
            start: 'top 80%'
        },
        opacity: 0,
        x: -30,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out'
    });
    
    // Comparación
    gsap.from('#problema .grid > div', {
        scrollTrigger: {
            trigger: '#problema .grid',
            start: 'top 80%'
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: 'power2.out'
    });
    
    // Servicios
    gsap.from('#servicios .grid > div', {
        scrollTrigger: {
            trigger: '#servicios .grid',
            start: 'top 80%'
        },
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
    });
}

// ========================================
// 5. Smooth Scroll
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                gsap.to(window, {
                    duration: 0.8,
                    scrollTo: {
                        y: target,
                        offsetY: 80
                    },
                    ease: 'power2.inOut'
                });
            }
        });
    });
}

// ========================================
// 6. Inicialización
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar partículas
    new ParticleNetwork();
    
    // Tipografía expresiva
    initTypingEffect();
    
    // Hero animations
    initHeroAnimations();
    
    // Scroll animations
    initScrollAnimations();
    
    // Smooth scroll
    initSmoothScroll();
});

// ========================================
// Juego CRM - Demo Interactiva
// ========================================
const crmGame = {
    leads: 0,
    citas: 0,
    ventas: 0,
    dinero: 0,
    maxLeads: 10,
    maxCitas: 5,
    
    messages: {
        inicio: [
            "¡Bienvenido! Elige una acción para comenzar.",
            "¡Hola! Estoy aquí para ayudarte. ¿Qué quieres hacer?",
            "Con mi ayuda, gestionarás todo más rápido. ¡Elige una opción!"
        ],
        leads: [
            "¡Nuevo lead capturado! La IA analiza su perfil...",
            "Perfecto, el cliente está interesado. ¡Vamos!",
            "¡Alto potencial detectado! ¡Sigue así!"
        ],
        citas: [
            "¡Cita agendada! La IA envió recordatorio automático.",
            "¡Excelente! El cliente confirmó. Muy eficiente.",
            "¡La IA optimizó el horario perfectamente!"
        ],
        ventas: [
            "¡Venta cerrada! La IA automatizó todo. ¡Felicidades!",
            "¡Otro cliente satisfecho! La IA hizo el trabajo.",
            "¡Excelente gestión! La IA te ayudó a convertir otro prospecto."
        ]
    },
    
    play(action) {
        const messageEl = document.getElementById('game-message');
        const levelEl = document.getElementById('game-level');
        const progressEl = document.getElementById('game-progress');
        
        let msg = '';
        
        switch(action) {
            case 'leads':
                if (this.leads < this.maxLeads) {
                    this.leads++;
                    msg = this.messages.leads[Math.floor(Math.random() * this.messages.leads.length)];
                } else {
                    msg = "¡Ya tienes suficientes leads! Prueba las citas.";
                }
                break;
                
            case 'citas':
                if (this.leads >= 3 && this.citas < this.maxCitas) {
                    this.citas++;
                    this.dinero += Math.floor(Math.random() * 500) + 200;
                    msg = this.messages.citas[Math.floor(Math.random() * this.messages.citas.length)];
                } else if (this.leads < 3) {
                    msg = "¡Necesitas más leads primero! Ve a gestionar contactos.";
                } else {
                    msg = "¡Todas las citas del día están completas!";
                }
                break;
                
            case 'ventas':
                if (this.citas >= 2) {
                    this.ventas++;
                    msg = this.messages.ventas[Math.floor(Math.random() * this.messages.ventas.length)];
                } else if (this.citas < 1) {
                    msg = "¡Agenda al menos una cita primero!";
                } else {
                    msg = "¡Has cerrado todas las ventas posibles!";
                }
                break;
        }
        
        const total = this.leads + this.citas + this.ventas;
        const maxTotal = this.maxLeads + this.maxCitas + 3;
        const progress = (total / maxTotal) * 100;
        
        messageEl.textContent = msg;
        levelEl.textContent = Math.floor(progress / 25) + 1;
        progressEl.style.width = `${Math.min(progress, 100)}%`;
        
        document.getElementById('leads-count').textContent = `${this.leads}/${this.maxLeads}`;
        document.getElementById('citas-count').textContent = `${this.citas}/${this.maxCitas}`;
        document.getElementById('ventas-count').textContent = `$${this.dinero.toLocaleString()}`;
        
        gsap.from(messageEl, {
            scale: 0.95,
            opacity: 0.5,
            duration: 0.3,
            ease: 'power2.out'
        });
    }
};

// ScrollToPlugin
gsap.registerPlugin(ScrollToPlugin);
