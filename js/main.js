/* ========================================
   Pivot AI - JavaScript Simplificado
   ======================================== */

gsap.registerPlugin(ScrollTrigger);

// Animaciones al cargar
document.addEventListener('DOMContentLoaded', () => {
    initHeroAnimations();
    initScrollAnimations();
    initSmoothScroll();
});

// Animaciones del Hero
function initHeroAnimations() {
    const tl = gsap.timeline();
    
    tl.from('nav', {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
    })
    .from('#hero > div > *', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out'
    }, '-=0.2');
}

// Animaciones al hacer scroll
function initScrollAnimations() {
    // Sección de comparación
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
    
    // Tarjetas de servicios
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
    
    // Sección referidos
    gsap.from('#referidos > div', {
        scrollTrigger: {
            trigger: '#referidos',
            start: 'top 80%'
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
    });
    
    // Demo CRM
    gsap.from('#demo > div', {
        scrollTrigger: {
            trigger: '#demo',
            start: 'top 80%'
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
    });
}

// Smooth scroll
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
        
        // Calcular progreso
        const total = this.leads + this.citas + this.ventas;
        const maxTotal = this.maxLeads + this.maxCitas + 3;
        const progress = (total / maxTotal) * 100;
        
        // Actualizar UI
        messageEl.textContent = msg;
        levelEl.textContent = Math.floor(progress / 25) + 1;
        progressEl.style.width = `${Math.min(progress, 100)}%`;
        
        // Actualizar contadores
        document.getElementById('leads-count').textContent = `${this.leads}/${this.maxLeads}`;
        document.getElementById('citas-count').textContent = `${this.citas}/${this.maxCitas}`;
        document.getElementById('ventas-count').textContent = `$${this.dinero.toLocaleString()}`;
        
        // Animación
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
