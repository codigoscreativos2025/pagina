/* ========================================
   Pivot AI - JavaScript Principal
   ======================================== */

// Inicializar GSAP
gsap.registerPlugin(ScrollTrigger);

// ========================================
// 1. Fondo Ambiental con Partículas
// ========================================
class ParticleNetwork {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.particleCount = 80;
        this.connectionDistance = 150;
        this.particleColor = 'rgba(139, 92, 246, 0.5)';
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createParticles();
        this.animate();
        this.addEventListeners();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                color: Math.random() > 0.5 ? 'rgba(6, 182, 212, 0.6)' : 'rgba(139, 92, 246, 0.6)'
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Actualizar y dibujar partículas
        this.particles.forEach((particle, index) => {
            // Movimiento
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Rebotar en los bordes
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            // Interacción con mouse
            if (this.mouse.x && this.mouse.y) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) {
                    const force = (200 - distance) / 200;
                    particle.vx += (dx / distance) * force * 0.02;
                    particle.vy += (dy / distance) * force * 0.02;
                }
            }
            
            // Dibujar partícula
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();
            
            // Conexiones
            for (let j = index + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// 2. Animaciones de Navegación
// ========================================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ========================================
// 3. Animaciones Tipográficas Hero
// ========================================
function initHeroAnimations() {
    const tl = gsap.timeline();
    
    tl.from('.hero-badge', {
        y: -20,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
    })
    .from('.hero-title span', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out'
    }, '-=0.3')
    .from('.hero-subtitle', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.4')
    .from('.hero-cta', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.3')
    .from('.hero-stats > div', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
    }, '-=0.3');
    
    // Animación de números en stats
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
            this.targets()[0].textContent = Math.round(this.targets()[0].textContent);
        }
    });
}

// ========================================
// 4. Scrollytelling
// ========================================
function initScrollytelling() {
    const steps = document.querySelectorAll('.scrollytell-step');
    
    steps.forEach((step, index) => {
        gsap.to(step, {
            scrollTrigger: {
                trigger: step,
                start: 'top 80%',
                end: 'top 50%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            y: 0,
            x: 0,
            duration: 0.8,
            ease: 'power2.out'
        });
    });
}

// ========================================
// 5. Animaciones Sección Condominios
// ========================================
function initCondominios() {
    // Animación de tarjetas
    const cards = document.querySelectorAll('.condominio-card');
    
    cards.forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 90%'
            },
            y: 40,
            opacity: 0,
            duration: 0.6,
            delay: index * 0.1,
            ease: 'power2.out'
        });
    });
    
    // Contadores animados
    gsap.from('.condominio-stats .counter', {
        scrollTrigger: {
            trigger: '.condominio-stats',
            start: 'top 80%'
        },
        textContent: 0,
        duration: 2,
        ease: 'power1.out',
        snap: { textContent: 1 },
        onUpdate: function() {
            const target = this.targets()[0];
            const suffix = target.dataset.suffix || '';
            target.textContent = Math.round(this.targets()[0].textContent) + suffix;
        }
    });
}

// ========================================
// 6. Animaciones Sección Odontólogos
// ========================================
function initOdontologos() {
    const steps = document.querySelectorAll('.odontologo-step');
    
    steps.forEach((step, index) => {
        gsap.from(step, {
            scrollTrigger: {
                trigger: step,
                start: 'top 85%'
            },
            x: index % 2 === 0 ? -50 : 50,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        });
    });
    
    const benefits = document.querySelectorAll('.odontologo-benefit');
    
    benefits.forEach((benefit, index) => {
        gsap.from(benefit, {
            scrollTrigger: {
                trigger: benefit,
                start: 'top 90%'
            },
            y: 30,
            opacity: 0,
            duration: 0.6,
            delay: index * 0.15,
            ease: 'power2.out'
        });
    });
}

// ========================================
// 7. Demo CRM - Juego Interactivo
// ========================================
const crmGame = {
    level: 1,
    leads: 0,
    citas: 0,
    ventas: 0,
    dinero: 0,
    maxLeads: 10,
    maxCitas: 5,
    
    messages: {
        inicio: [
            "¡Bienvenido! Elige una acción para comenzar a gestionar tu negocio con IA.",
            "¡Hola! Estoy aquí para ayudarte. ¿Qué quieres hacer hoy?",
            "Con mi ayuda, podrás gestionar todo mucho más rápido. ¡Elige una opción!"
        ],
        leads: [
            "¡Nuevo lead capturado! La IA está analizando su perfil...",
            "Perfecto, el cliente está interesado. ¡Vamos a convertirlo!",
            "La IA ha detectado que este cliente tiene alto potencial. ¡Sigue así!"
        ],
        citas: [
            "¡Cita agendada! La IA envió recordatorio automático al cliente.",
            "¡Excelente! El paciente/residente confirmó su cita. Muy eficiente.",
            "La IA optimizó el horario. ¡Esta cita encaja perfectamente!"
        ],
        ventas: [
            "¡Venta cerrada! La IA automatizó todo el proceso. ¡Felicidades!",
            "¡Otro cliente satisfecho! La IA hizo todo el trabajo pesado.",
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
                    msg = "¡Ya tienes suficientes leads! Espera, veamos las citas...";
                }
                break;
                
            case 'citas':
                if (this.leads >= 3 && this.citas < this.maxCitas) {
                    this.citas++;
                    this.dinero += Math.floor(Math.random() * 500) + 200;
                    msg = this.messages.citas[Math.floor(Math.random() * this.messages.citas.length)];
                } else if (this.leads < 3) {
                    msg = "¡Necesitas más leads primero! Ve a gestionar más contactos.";
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
        
        // Calcular progreso
        const total = this.leads + this.citas + this.ventas;
        const maxTotal = this.maxLeads + this.maxCitas + 3;
        const progress = (total / maxTotal) * 100;
        
        // Actualizar UI
        messageEl.textContent = msg;
        levelEl.textContent = Math.floor(progress / 25) + 1;
        progressEl.style.width = `${Math.min(progress, 100)}%`;
        
        // Actualizar botones
        document.querySelectorAll('.game-btn').forEach(btn => {
            const type = btn.onclick.toString().match(/'([^']+)'/)?.[1];
            if (type === 'leads') {
                btn.querySelector('div:last-child').textContent = `${this.leads}/${this.maxLeads} contactos`;
            } else if (type === 'citas') {
                btn.querySelector('div:last-child').textContent = `${this.citas}/${this.maxCitas} citas`;
            } else if (type === 'ventas') {
                btn.querySelector('div:last-child').textContent = `$${this.dinero.toLocaleString()} generado`;
            }
        });
        
        // Animación de feedback
        gsap.from(messageEl, {
            scale: 0.95,
            opacity: 0.5,
            duration: 0.3,
            ease: 'power2.out'
        });
    }
};

// ========================================
// 8. Smooth Scroll para enlaces
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                gsap.to(window, {
                    duration: 1,
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
// 9. Efecto Cursor Glow
// ========================================
function initCursorGlow() {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-glow';
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.3,
            ease: 'power2.out'
        });
    });
}

// ========================================
// Inicialización
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar partículas
    new ParticleNetwork();
    
    // Inicializar navbar
    initNavbar();
    
    // Inicializar animaciones hero
    initHeroAnimations();
    
    // Inicializar scrollytelling
    initScrollytelling();
    
    // Inicializar secciones
    initCondominios();
    initOdontologos();
    
    // Smooth scroll
    initSmoothScroll();
    
    // Cursor glow (solo desktop)
    if (window.innerWidth > 768) {
        initCursorGlow();
    }
    
    // Actualizar cursor en resize
    window.addEventListener('resize', () => {
        const existingCursor = document.querySelector('.cursor-glow');
        if (window.innerWidth <= 768 && existingCursor) {
            existingCursor.remove();
        } else if (window.innerWidth > 768 && !existingCursor) {
            initCursorGlow();
        }
    });
});

// ScrollToPlugin para GSAP
gsap.registerPlugin(ScrollToPlugin);
