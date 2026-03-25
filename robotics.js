// --- CONFIGURATION ---

const i18n = {
    en: {
        module: "i2D Robot Arms",
        lab: "LABORATORY_",
        current: "Current Module:",
        joint1: "Joint 1 (θ₁)",
        joint2: "Joint 2 (θ₂)",
        length: "Link Length (L)",
        reset: "RESET ARM",
        angle: "ANGLE",
        fk: "Forward Kinematics",
        ik: "Inverse Kinematics",
        trajectory: "Trajectory Planning",
        next: "Next →",
        prev: "← Prev",
        linkL1: "Link L₁",
        linkL2: "Link L₂"
    },
    es: {
        module: "Brazos Robóticos i2D",
        lab: "LABORATORIO_",
        current: "Módulo Actual:",
        joint1: "Articulación 1 (θ₁)",
        joint2: "Articulación 2 (θ₂)",
        length: "Longitud (L)",
        reset: "REINICIAR BRAZO",
        angle: "ÁNGULO",
        fk: "Cinemática Directa",
        ik: "Cinemática Inversa",
        trajectory: "Planeación de Trayectoria",
        next: "Siguiente →",
        prev: "← Anterior",
        linkL1: "Eslabón L₁",
        linkL2: "Eslabón L₂"
    }
};

function sliderToLinkLength(v) {
    return (parseFloat(v) / 100) * 300 + 50;
}

/** Inverse of sliderToLinkLength; slider value clamped 10–100 → length 80–350 px. */
function lengthToSlider(len) {
    return Math.round(((parseFloat(len) - 50) / 300) * 100);
}

/** Radians as α·π with α to 2 decimals and symbolic π (U+03C0). */
function formatAngleAsPiMultiple(rad) {
    const alfa = rad / Math.PI;
    const s = alfa.toFixed(2);
    if (s === "0.00" || s === "-0.00") return "0·π";
    return `${s}·π`;
}

const slides = [
    {
        id: "intro",
        title: { en: "i2D Robotics", es: "Robótica i2D" },
        text: {
            en: "Welcome to the planar robotics laboratory. We'll explore how simple geometry and algebra give life to robotic movement in 2D space.",
            es: "Bienvenido al laboratorio de robótica plana. Exploraremos cómo la geometría y el álgebra simple dan vida al movimiento robótico en 2D."
        },
        mode: "intro",
        params: { theta1: 45, theta2: 45, length: 150 }
    },
    {
        id: "fk",
        title: { en: "Forward Kinematics", es: "Cinemática Directa" },
        text: {
            en: "The mapping from joint space to Cartesian space. Define the angles of each motor to find where the hand (end-effector) will be.",
            es: "El mapeo del espacio de articulaciones al espacio cartesiano. Define los ángulos de cada motor para encontrar dónde estará la mano."
        },
        mode: "fk",
        params: { theta1: 30, theta2: 60, length: 50, l1: 44, l2: 35 }
    },
    {
        id: "ik",
        title: { en: "Inverse Kinematics", es: "Cinemática Inversa" },
        text: {
            en: "The inverse problem: given a target point in space, what joint angles are needed? Move your mouse to see the arm calculate its goals.",
            es: "El problema inverso: dado un punto objetivo, ¿qué ángulos se necesitan? Mueve el ratón para ver al brazo calcular sus metas."
        },
        mode: "ik",
        params: { theta1: 0, theta2: 0, length: 50, l1: 44, l2: 35 }
    },
    {
        id: "joints_multi",
        premium: true,
        title: { en: "Chain Dynamics", es: "Dinámica de Cadena" },
        text: {
            en: "Adding more segments increases the Degrees of Freedom (DoF). (Premium Access required to simulate high-DoF robotic chains).",
            es: "Agregar más segmentos aumenta los Grados de Libertad (DoF). (Acceso Premium para simular cadenas de alta complejidad)."
        },
        mode: "multi",
        params: { theta1: 45, theta2: -45, length: 120 }
    },
    {
        id: "workspace",
        premium: true,
        title: { en: "Operating Envelope", es: "Envolvente de Trabajo" },
        text: {
            en: "The set of all points reachable by the end-effector. (Premium Access unlocks full workspace analysis and singular point detection).",
            es: "El conjunto de puntos alcanzables por el efector final. (Acceso Premium desbloquea el análisis de espacio de trabajo)."
        },
        mode: "workspace",
        params: { theta1: 0, theta2: 0, length: 150 }
    }
];

// --- APP CORE ---

class App {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentSlide = 0;
        this.time = 0;
        this.lang = 'en';

        // UI Elements
        this.slideTitle = document.getElementById('slide-title');
        this.slideText = document.getElementById('slide-text');
        this.slideNum = document.getElementById('slide-count');
        this.progressFill = document.getElementById('progress-fill');
        this.currentModuleName = document.getElementById('module-name');

        // Dynamic UI for translations
        this.ui = {
            mainTitle: document.getElementById('app-main-title'),
            topicLabel: document.querySelector('.topic-indicator'),
            labelJoint1: document.getElementById('label-param-j1'),
            labelJoint2: document.getElementById('label-param-j2'),
            labelLength: document.getElementById('label-param-l'),
            labelL1: document.getElementById('label-param-l1'),
            labelL2: document.getElementById('label-param-l2'),
            btnReset: document.getElementById('btn-reset'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            labAngle: document.querySelectorAll('.stat-box .lab')[1]
        };

        // Params
        this.param1 = document.getElementById('param-freq'); // Reusing IDs
        this.param2 = document.getElementById('param-amp');
        this.param3 = document.getElementById('param-damping');
        this.paramL1 = document.getElementById('param-l1');
        this.paramL2 = document.getElementById('param-l2');
        this.paramL1Num = document.getElementById('param-l1-num');
        this.paramL2Num = document.getElementById('param-l2-num');
        this.fkPhasorDrag = null;
        this.groupLinkSingle = document.getElementById('group-link-single');
        this.fpsVal = document.getElementById('fps-val');
        this.angleVal = document.getElementById('phase-val');

        // --- Persistent State Load ---
        this.currentSlide = parseInt(localStorage.getItem('mathphye_slide_rob')) || 0;
        this.lang = localStorage.getItem('mathphye_lang_rob') || 'en';

        this.mouse = { x: 0, y: 0 };
        this.ripples = [];
        this.hasPaid = localStorage.getItem('mathphye_premium_unlocked') === 'true';

        this.init();

        // Restore params after updateSlide in init
        this.param1.value = localStorage.getItem('mathphye_rob_p1') || this.param1.value;
        this.param2.value = localStorage.getItem('mathphye_rob_p2') || this.param2.value;
        this.param3.value = localStorage.getItem('mathphye_rob_p3') || this.param3.value;
        if (this.paramL1) this.paramL1.value = localStorage.getItem('mathphye_rob_p4') || this.paramL1.value;
        if (this.paramL2) this.paramL2.value = localStorage.getItem('mathphye_rob_p5') || this.paramL2.value;
        this.updateSlide(false); // Reflow with restored params

        this.fpsHistory = [];
        this.maxHistory = 80;
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Nav
        document.getElementById('btn-next').onclick = () => this.nextSlide();
        document.getElementById('btn-prev').onclick = () => this.prevSlide();
        document.getElementById('btn-reset').onclick = () => this.resetParams();
        document.getElementById('btn-random').onclick = () => this.randomizeParams();

        // Click to Ripple (FK phasor drag takes priority)
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.tryStartFkPhasorDrag(e)) {
                e.preventDefault();
                this.canvas.style.cursor = 'grabbing';
                return;
            }
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.ripples.push({ x, y, t: 0, life: 1.0 });
        });

        window.addEventListener('mouseup', () => {
            this.fkPhasorDrag = null;
            this.canvas.style.cursor = '';
        });

        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            if (this.fkPhasorDrag) {
                this.applyFkPhasorDrag(this.mouse.x, this.mouse.y);
                e.preventDefault();
            } else {
                this.updateFkPhasorHoverCursor(this.mouse.x, this.mouse.y);
            }
        });

        // Lang
        document.getElementById('btn-en').onclick = () => this.setLanguage('en');
        document.getElementById('btn-es').onclick = () => this.setLanguage('es');

        // Sync Sliders
        const allParams = [this.param1, this.param2, this.param3, this.paramL1, this.paramL2].filter(Boolean);
        allParams.forEach(slider => {
            const updateVal = () => {
                const ratio = ((parseFloat(slider.value) - parseFloat(slider.min)) / (parseFloat(slider.max) - parseFloat(slider.min))) * 100;
                slider.style.setProperty('--v', `${ratio}%`);
            };
            slider.oninput = () => {
                updateVal();
                this.updateSlide(false);
            };
            updateVal();
        });

        if (this.paramL1Num) {
            this.paramL1Num.addEventListener('input', () => this.applyLinkLengthFromNum(1));
            this.paramL1Num.addEventListener('change', () => this.applyLinkLengthFromNum(1));
        }
        if (this.paramL2Num) {
            this.paramL2Num.addEventListener('input', () => this.applyLinkLengthFromNum(2));
            this.paramL2Num.addEventListener('change', () => this.applyLinkLengthFromNum(2));
        }

        this.updateSlide();
        this.setupIdleTimer();
        this.setupUIStatsPersistence();
        
        const buyBtn = document.getElementById('btn-buy');
        if (buyBtn) {
            buyBtn.onclick = () => {
                if (typeof window.openLemonSqueezyCheckout === 'function' && window.openLemonSqueezyCheckout()) {
                    return;
                }
                alert(this.lang === 'en' ? "Redirecting to Payment Gateway..." : "Redirigiendo a Pasarela de Pago...");
                setTimeout(() => {
                    // Solo en memoria: F5 vuelve a mostrar el paywall (no persistir demo)
                    this.hasPaid = true;
                    this.updateSlide(false);
                    alert(this.lang === 'en' ? "Access Unlocked! Welcome to the Full Lab." : "¡Acceso Desbloqueado! Bienvenido al Lab Completo.");
                }, 2000);
            };
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    setupUIStatsPersistence() {
        const KEY_S = 'mathphye_slides_min_rob';
        const KEY_C = 'mathphye_controls_min_rob';

        if (localStorage.getItem(KEY_S) === 'true') document.body.classList.add('minimized');
        if (localStorage.getItem(KEY_C) === 'true') document.body.classList.add('minimized-controls');

        const btnMinS = document.querySelector('.card-toggle');
        const btnMinC = document.querySelector('.control-toggle');
        const btnResS = document.getElementById('restore-slides');
        const btnResC = document.getElementById('restore-controls');

        if (btnMinS) btnMinS.addEventListener('click', () => { 
            document.body.classList.add('minimized'); 
            localStorage.setItem(KEY_S, 'true'); 
        });
        if (btnResS) btnResS.addEventListener('click', () => { 
            document.body.classList.remove('minimized'); 
            localStorage.setItem(KEY_S, 'false'); 
        });

        if (btnMinC) btnMinC.addEventListener('click', () => { 
            document.body.classList.add('minimized-controls'); 
            localStorage.setItem(KEY_C, 'true'); 
        });
        if (btnResC) btnResC.addEventListener('click', () => { 
            document.body.classList.remove('minimized-controls'); 
            localStorage.setItem(KEY_C, 'false'); 
        });
    }

    setLanguage(l) {
        this.lang = l;
        localStorage.setItem('mathphye_lang_rob', l);
        document.getElementById('btn-en').classList.toggle('active', l === 'en');
        document.getElementById('btn-es').classList.toggle('active', l === 'es');
        this.updateSlide();
    }

    randomizeParams() {
        this.param1.value = Math.floor(Math.random() * 100);
        this.param2.value = Math.floor(Math.random() * 100);
        this.param3.value = Math.floor(Math.random() * 90) + 10;
        const m = slides[this.currentSlide].mode;
        if ((m === 'fk' || m === 'ik') && this.paramL1 && this.paramL2) {
            this.paramL1.value = Math.floor(Math.random() * 90) + 10;
            this.paramL2.value = Math.floor(Math.random() * 90) + 10;
        }
        this.updateSlide(false);
    }

    resetParams() {
        const slide = slides[this.currentSlide];
        this.param1.value = slide.params.theta1;
        this.param2.value = slide.params.theta2;
        this.param3.value = slide.params.length;
        if ((slide.mode === 'fk' || slide.mode === 'ik') && this.paramL1 && this.paramL2) {
            this.paramL1.value = slide.params.l1 != null ? slide.params.l1 : 50;
            this.paramL2.value = slide.params.l2 != null ? slide.params.l2 : 40;
        }
        this.updateSlide(false);
    }

    syncLinkLengthNumFields() {
        if (!this.paramL1Num || !this.paramL1 || !this.paramL2Num || !this.paramL2) return;
        this.paramL1Num.value = String(Math.round(sliderToLinkLength(this.paramL1.value)));
        this.paramL2Num.value = String(Math.round(sliderToLinkLength(this.paramL2.value)));
    }

    applyLinkLengthFromNum(which) {
        const numEl = which === 1 ? this.paramL1Num : this.paramL2Num;
        const slider = which === 1 ? this.paramL1 : this.paramL2;
        if (!numEl || !slider) return;
        let len = parseFloat(numEl.value);
        if (Number.isNaN(len)) return;
        len = Math.max(80, Math.min(350, len));
        let s = lengthToSlider(len);
        s = Math.max(10, Math.min(100, s));
        slider.value = String(s);
        const ratio = ((s - parseFloat(slider.min)) / (parseFloat(slider.max) - parseFloat(slider.min))) * 100;
        slider.style.setProperty('--v', `${ratio}%`);
        this.updateSlide(false);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    nextSlide() {
        if (this.currentSlide < slides.length - 1) {
            this.currentSlide++;
            this.updateSlide();
        }
    }

    prevSlide() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.updateSlide();
        }
    }

    updateSlide(loadParams = true) {
        const slide = slides[this.currentSlide];
        const dict = i18n[this.lang];

        const container = document.getElementById('slide-container');
        if (container && loadParams) {
            container.classList.remove('page-turn');
            void container.offsetWidth;
            container.classList.add('page-turn');
        }

        const paywall = document.getElementById('paywall-overlay');
        const isLocked = slide.premium && !this.hasPaid;

        if (isLocked) {
            paywall.style.display = 'flex';
            this.slideTitle.style.opacity = '0';
            this.slideText.style.opacity = '0';
        } else {
            paywall.style.display = 'none';
            this.slideTitle.style.opacity = '1';
            this.slideText.style.opacity = '1';
            this.slideTitle.innerText = slide.title[this.lang];
            this.slideText.innerText = slide.text[this.lang];
        }

        this.ui.mainTitle.innerHTML = `ROBOTICS <span class="ink-sub">${dict.lab}</span>`;
        if (this.ui.topicLabel) this.ui.topicLabel.innerHTML = `${dict.current} <span id="module-name">${dict.module}</span>`;
        if (this.ui.labelJoint1) this.ui.labelJoint1.innerText = dict.joint1;
        if (this.ui.labelJoint2) this.ui.labelJoint2.innerText = dict.joint2;
        if (this.ui.labelLength) this.ui.labelLength.innerText = dict.length;
        if (this.ui.labelL1) this.ui.labelL1.innerText = dict.linkL1;
        if (this.ui.labelL2) this.ui.labelL2.innerText = dict.linkL2;
        if (this.ui.btnReset) this.ui.btnReset.innerText = dict.reset;
        if (this.ui.btnPrev) this.ui.btnPrev.innerText = dict.prev;
        if (this.ui.btnNext) this.ui.btnNext.innerText = dict.next;
        if (this.ui.labAngle) this.ui.labAngle.innerText = dict.angle;

        this.progressFill.style.width = `${((this.currentSlide + 1) / slides.length) * 100}%`;
        this.slideNum.innerText = `${String(this.currentSlide + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;

        const showDualLinks = (slide.mode === 'fk' || slide.mode === 'ik') && !isLocked;
        if (this.groupLinkSingle) this.groupLinkSingle.style.display = showDualLinks ? 'none' : '';
        document.querySelectorAll('.fk-only').forEach(el => {
            el.style.display = showDualLinks ? 'block' : 'none';
        });

        if (loadParams) {
            this.param1.value = slide.params.theta1;
            this.param2.value = slide.params.theta2;
            if (slide.mode === 'fk' || slide.mode === 'ik') {
                this.param3.value = slide.params.length;
                if (this.paramL1) this.paramL1.value = slide.params.l1 != null ? slide.params.l1 : 50;
                if (this.paramL2) this.paramL2.value = slide.params.l2 != null ? slide.params.l2 : 40;
            } else {
                this.param3.value = slide.params.length;
            }
        }

        [this.param1, this.param2, this.param3, this.paramL1, this.paramL2].filter(Boolean).forEach(slider => {
            const ratio = ((parseFloat(slider.value) - parseFloat(slider.min)) / (parseFloat(slider.max) - parseFloat(slider.min))) * 100;
            slider.style.setProperty('--v', `${ratio}%`);
        });

        this.syncLinkLengthNumFields();

        // Save State
        localStorage.setItem('mathphye_slide_rob', this.currentSlide);
        localStorage.setItem('mathphye_rob_p1', this.param1.value);
        localStorage.setItem('mathphye_rob_p2', this.param2.value);
        localStorage.setItem('mathphye_rob_p3', this.param3.value);
        if (this.paramL1) localStorage.setItem('mathphye_rob_p4', this.paramL1.value);
        if (this.paramL2) localStorage.setItem('mathphye_rob_p5', this.paramL2.value);
    }

    setupIdleTimer() {
        let timer;
        this.formulasOpacity = 0;
        this.ghostFormulas = [
            { text: "x = L₁ cos θ₁ + L₂ cos(θ₁ + θ₂)", x: 150, y: 350 },
            { text: "y = L₁ sin θ₁ + L₂ sin(θ₁ + θ₂)", x: 800, y: 200 },
            { text: "cos θ₂ = (x² + y² - L₁² - L₂²) / (2L₁L₂)", x: 1200, y: 750 },
            { text: "J = [ -y₁-y₂  -y₂ ; x₁+x₂  x₂ ]", x: 450, y: 850 },
            { text: "τ = Jᵀ F", x: 1500, y: 300 }
        ];

        const resetTimer = () => {
            document.body.classList.remove('user-idle');
            clearTimeout(timer);
            timer = setTimeout(() => {
                const isHoveringUI = document.querySelector('.glass-ui:hover, .hud-header:hover, #controls-panel:hover');
                if (!isHoveringUI) {
                    document.body.classList.add('user-idle');
                } else {
                    resetTimer();
                }
            }, 6000);
        };
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('mousedown', resetTimer);
        window.addEventListener('touchstart', resetTimer);
        window.addEventListener('keydown', resetTimer);
        resetTimer();
    }

    loop(timestamp) {
        const delta = timestamp - (this.lastTime || timestamp);
        this.lastTime = timestamp;

        const currentFps = 1000 / delta;
        if (currentFps > 0 && currentFps < 1000) {
            this.fpsHistory.push(currentFps);
            if (this.fpsHistory.length > this.maxHistory) this.fpsHistory.shift();
        }

        const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        this.fpsVal.innerText = Math.round(avgFps);

        this.time += 0.02;

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderGhostFormulas();
        this.ctx.globalAlpha = 1;

        const slide = slides[this.currentSlide];
        if (slide.premium && !this.hasPaid) {
             // Draw something simple in background for paywall
             this.renderArm(0.5, 0.5, 100, 80, true);
             return;
        }

        const theta1 = (parseFloat(this.param1.value) / 100) * Math.PI * 2;
        const theta2 = (parseFloat(this.param2.value) / 100) * Math.PI * 2;
        const length = sliderToLinkLength(this.param3.value);
        let l1 = length;
        let l2 = length * 0.8;
        if ((slide.mode === 'fk' || slide.mode === 'ik') && this.paramL1 && this.paramL2) {
            l1 = sliderToLinkLength(this.paramL1.value);
            l2 = sliderToLinkLength(this.paramL2.value);
        }

        if (slide.mode === "intro") this.renderIntro(length);
        if (slide.mode === "fk") this.renderFK(theta1, theta2, l1, l2);
        if (slide.mode === "ik") this.renderIK(l1, l2);
        if (slide.mode === "multi") this.renderMulti(length);
        if (slide.mode === "workspace") this.renderWorkspace(length);

        this.angleVal.innerText = `θ₁=${formatAngleAsPiMultiple(theta1)}  θ₂=${formatAngleAsPiMultiple(theta2)}`;
        this.renderRipples();
    }

    getInk(alpha = 1) {
        return `rgba(26,26,26,${alpha})`;
    }

    readJointAngles() {
        const twopi = Math.PI * 2;
        const t1 = (parseFloat(this.param1.value) / 100) * twopi;
        const t2 = (parseFloat(this.param2.value) / 100) * twopi;
        return { t1, t2, twopi };
    }

    getFkPhasorLayout() {
        const originX = this.canvas.width / 2;
        const originY = this.canvas.height / 2 + 100;
        const formulaX = originX - 300;
        const formulaY = originY + 150;
        return {
            phasorX: formulaX - 150,
            phasorY: formulaY - 30,
            r: 80
        };
    }

    whichFkPhasorHit(mx, my, t1, t2) {
        const { phasorX, phasorY, r } = this.getFkPhasorLayout();
        const R = 18;
        const px1 = phasorX + Math.cos(t1) * r;
        const py1 = phasorY - Math.sin(t1) * r;
        const sum = t1 + t2;
        const px2 = phasorX + Math.cos(sum) * r;
        const py2 = phasorY - Math.sin(sum) * r;
        const d1 = (mx - px1) ** 2 + (my - py1) ** 2;
        const d2 = (mx - px2) ** 2 + (my - py2) ** 2;
        if (d1 > R * R && d2 > R * R) return null;
        return d2 < d1 ? 'p2' : 'p1';
    }

    tryStartFkPhasorDrag(e) {
        const slide = slides[this.currentSlide];
        if (slide.mode !== 'fk' || (slide.premium && !this.hasPaid)) return false;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const { t1, t2 } = this.readJointAngles();
        const hit = this.whichFkPhasorHit(mx, my, t1, t2);
        if (!hit) return false;
        this.fkPhasorDrag = hit;
        return true;
    }

    applyFkPhasorDrag(mx, my) {
        if (!this.fkPhasorDrag) return;
        const { phasorY, phasorX } = this.getFkPhasorLayout();
        const { t1, twopi } = this.readJointAngles();
        const ang = Math.atan2(-(my - phasorY), mx - phasorX);
        if (this.fkPhasorDrag === 'p1') {
            let nt1 = ang;
            while (nt1 < 0) nt1 += twopi;
            while (nt1 >= twopi) nt1 -= twopi;
            this.param1.value = String(Math.round((nt1 / twopi) * 100));
        } else {
            let sum = ang;
            while (sum < 0) sum += twopi;
            while (sum >= twopi) sum -= twopi;
            let nt2 = sum - t1;
            while (nt2 < 0) nt2 += twopi;
            while (nt2 >= twopi) nt2 -= twopi;
            this.param2.value = String(Math.round((nt2 / twopi) * 100));
        }
        [this.param1, this.param2].forEach(slider => {
            const ratio = ((parseFloat(slider.value) - parseFloat(slider.min)) / (parseFloat(slider.max) - parseFloat(slider.min))) * 100;
            slider.style.setProperty('--v', `${ratio}%`);
        });
        localStorage.setItem('mathphye_rob_p1', this.param1.value);
        localStorage.setItem('mathphye_rob_p2', this.param2.value);
    }

    updateFkPhasorHoverCursor(mx, my) {
        const slide = slides[this.currentSlide];
        if (slide.mode !== 'fk' || (slide.premium && !this.hasPaid)) {
            if (this.canvas.style.cursor === 'grab') this.canvas.style.cursor = '';
            return;
        }
        const { t1, t2 } = this.readJointAngles();
        const hit = this.whichFkPhasorHit(mx, my, t1, t2);
        this.canvas.style.cursor = hit ? 'grab' : '';
    }

    renderFK(t1, t2, l1, l2) {
        const originX = this.canvas.width / 2;
        const originY = this.canvas.height / 2 + 100;

        const x1 = originX + Math.cos(t1) * l1;
        const y1 = originY - Math.sin(t1) * l1;

        const x2 = x1 + Math.cos(t1 + t2) * l2;
        const y2 = y1 - Math.sin(t1 + t2) * l2;

        // Static fake target (decorative): echoes IK target but fixed, not interactive
        const fakeTr = 16;
        const fakeTx = originX + Math.min(260, this.canvas.width * 0.22);
        const fakeTy = originY - Math.min(200, this.canvas.height * 0.18);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(fakeTx, fakeTy, fakeTr, 0, Math.PI * 2);
        this.ctx.fillStyle = "rgba(210, 40, 40, 0.12)";
        this.ctx.fill();
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeStyle = "rgba(210, 40, 40, 0.28)";
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();

        this.renderArm(t1, t2, l1, l2);

        // --- Formula Sync Context ---
        const formulaX = originX - 300;
        const formulaY = originY + 150;

        // --- Phasor Analysis Overlay (Now to the left of the formula) ---
        const phasorX = formulaX - 150;
        const phasorY = formulaY - 30;
        const r = 80;

        this.ctx.save();
        this.ctx.translate(phasorX, phasorY);
        
        // Unit Circle
        this.ctx.strokeStyle = this.getInk(0.15);
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Axes
        this.drawArrow(-r - 20, 0, r + 20, 0, this.getInk(0.1));
        this.drawArrow(0, r + 20, 0, -r - 20, this.getInk(0.1));
        this.ctx.font = '12px "JetBrains Mono"';
        this.ctx.fillStyle = this.getInk(0.4);
        this.ctx.fillText("Re", r + 25, 5);
        this.ctx.fillText("Im", -10, -r - 25);

        // Phasor 1: exp(i * t1)
        const px1 = Math.cos(t1) * r;
        const py1 = -Math.sin(t1) * r;
        this.drawArrow(0, 0, px1, py1, "rgba(210, 40, 40, 0.8)");
        
        // Phasor 2: exp(i * (t1 + t2))
        const px2 = Math.cos(t1 + t2) * r;
        const py2 = -Math.sin(t1 + t2) * r;
        this.drawArrow(0, 0, px2, py2, "rgba(40, 40, 210, 0.8)");

        this.ctx.font = '14px "Gloria Hallelujah"';
        this.ctx.fillStyle = "rgba(210, 40, 40, 0.9)";
        this.ctx.fillText("eⁱᶿ¹", px1 + 5, py1 - 5);
        this.ctx.fillStyle = "rgba(40, 40, 210, 0.9)";
        this.ctx.fillText("eⁱ⁽ᶿ¹⁺ᶿ²⁾", px2 + 5, py2 - 5);
        this.ctx.restore();

        // --- Drawing Formula ---
        this.ctx.save();
        this.ctx.font = 'italic 28px "Architects Daughter"';
        this.ctx.fillStyle = this.getInk(0.8);
        this.ctx.textAlign = 'left';

        const arg1 = formatAngleAsPiMultiple(t1);
        const argSum = formatAngleAsPiMultiple(t1 + t2);

        this.ctx.fillText("Position (Z) Formula:", formulaX, formulaY - 60);

        this.ctx.font = '32px "JetBrains Mono"';
        const zFormula = `Z = ${l1.toFixed(0)}eⁱ(${arg1}) + ${l2.toFixed(0)}eⁱ(${argSum})`;
        this.ctx.fillText(zFormula, formulaX, formulaY);
        
        // Cartesian Result
        const cartX = (x2 - originX).toFixed(1);
        const cartY = (originY - y2).toFixed(1);
        this.ctx.font = '22px "Architects Daughter"';
        this.ctx.fillStyle = this.getInk(0.5);
        this.ctx.fillText(`= ${cartX} + i${cartY}`, formulaX + 40, formulaY + 45);
        
        // Segment end effector → static fake target (same ref as decorative circle)
        this.ctx.setLineDash([2, 4]);
        this.ctx.strokeStyle = "rgba(210, 40, 40, 0.22)";
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(fakeTx, fakeTy);
        this.ctx.stroke();
        this.ctx.restore();
    }

    renderRipples() {
        if (!this.ripples) this.ripples = [];
        this.ripples.forEach((r, idx) => {
            r.t += 0.02;
            r.life -= 0.01;
            if (r.life <= 0) {
                this.ripples.splice(idx, 1);
                return;
            }

            const radius = r.t * 200;
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.getInk(r.life * 0.3);
            this.ctx.lineWidth = 2;
            this.ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        });
    }

    drawArrow(x1, y1, x2, y2, color) {
        const headlen = 8;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
    }

    renderGhostFormulas() {
        if (document.body.classList.contains('user-idle')) {
            this.formulasOpacity = Math.min(this.formulasOpacity + 0.005, 0.12);
        } else {
            this.formulasOpacity = Math.max(this.formulasOpacity - 0.05, 0);
        }

        if (this.formulasOpacity <= 0) return;

        this.ctx.save();
        this.ctx.font = `italic 2.22rem 'Architects Daughter'`;
        this.ctx.fillStyle = this.getInk(this.formulasOpacity);
        this.ctx.textAlign = 'left';

        this.ghostFormulas.forEach(f => {
            this.ctx.fillText(f.text, f.x, f.y);
        });
        this.ctx.restore();
    }

    jitter() { return (Math.random() - 0.5) * 1.5; }

    renderArm(t1, t2, l1, l2, ghost = false) {
        const originX = this.canvas.width / 2;
        const originY = this.canvas.height / 2 + 100;

        const x1 = originX + Math.cos(t1) * l1;
        const y1 = originY - Math.sin(t1) * l1;

        const x2 = x1 + Math.cos(t1 + t2) * l2;
        const y2 = y1 - Math.sin(t1 + t2) * l2;

        this.ctx.save();
        if (ghost) this.ctx.globalAlpha = 0.2;

        // Base
        this.ctx.fillStyle = this.getInk(0.1);
        this.ctx.beginPath();
        this.ctx.rect(originX - 40, originY, 80, 40);
        this.ctx.fill();
        this.ctx.strokeStyle = this.getInk(0.5);
        this.ctx.stroke();

        // Sketchy links
        this.drawSketchyLine(originX, originY, x1, y1);
        this.drawSketchyLine(x1, y1, x2, y2);

        // Joints
        this.ctx.fillStyle = this.getInk();
        this.ctx.beginPath();
        this.ctx.arc(originX, originY, 12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(x1, y1, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // End effector
        this.ctx.strokeStyle = this.getInk();
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x2, y2, 8, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fillStyle = "#fff";
        this.ctx.fill();

        // Labels
        this.ctx.font = '16px "Gloria Hallelujah"';
        this.ctx.fillStyle = this.getInk(0.6);
        this.ctx.fillText("θ₁", originX + 20, originY - 20);
        this.ctx.fillText("θ₂", x1 + 20, y1 - 20);
        this.ctx.fillText("End Effector", x2 + 20, y2);

        this.ctx.restore();
    }

    drawSketchyLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.getInk();
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx*dx + dy*dy);
        const segments = 10;
        
        this.ctx.moveTo(x1, y1);
        for(let i=1; i<=segments; i++){
            const t = i/segments;
            const px = x1 + dx*t + this.jitter()*2;
            const py = y1 + dy*t + this.jitter()*2;
            this.ctx.lineTo(px, py);
        }
        this.ctx.stroke();

        // Inner highlight
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    renderIK(l1, l2) {
        const originX = this.canvas.width / 2;
        const originY = this.canvas.height / 2 + 100;

        const targetX = this.mouse.x;
        const targetY = this.mouse.y;

        const dx = targetX - originX;
        const dy = originY - targetY;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // Clamp distance
        let ikX = targetX;
        let ikY = targetY;
        if (dist > (l1 + l2)) {
            const angle = Math.atan2(-dy, dx);
            ikX = originX + Math.cos(angle) * (l1+l2-1);
            ikY = originY + Math.sin(angle) * (l1+l2-1);
        }
        
        // IK Law of Cosines
        const cosTheta2 = (distSq - l1*l1 - l2*l2) / (2*l1*l2);
        const theta2 = -Math.acos(Math.max(-1, Math.min(1, cosTheta2)));
        
        const k1 = l1 + l2 * Math.cos(theta2);
        const k2 = l2 * Math.sin(theta2);
        const theta1 = Math.atan2(dy, dx) - Math.atan2(k2, k1);

        this.renderArm(theta1, theta2, l1, l2);

        // Target marker
        this.ctx.strokeStyle = "rgba(210, 40, 40, 0.5)";
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(targetX, targetY, 15, 0, Math.PI*2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        this.ctx.font = '14px "JetBrains Mono"';
        this.ctx.fillStyle = "rgba(210, 40, 40, 0.8)";
        this.ctx.fillText(`Target: (${Math.round(dx)}, ${Math.round(dy)})`, targetX + 20, targetY);
    }

    renderIntro(l) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Draw a rotating multi-arm pattern
        for(let i=0; i<8; i++){
            const angle = (i / 8) * Math.PI * 2 + this.time * 0.5;
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(angle);
            this.ctx.globalAlpha = 0.1;
            this.renderArm(Math.sin(this.time), Math.cos(this.time), l / 2, (l / 2) * 0.8, false);
            this.ctx.restore();
        }

        this.ctx.save();
        this.ctx.font = 'bold 120px "Gloria Hallelujah"';
        this.ctx.fillStyle = 'rgba(0,0,0,0.06)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(Math.sin(this.time * 0.5) * 0.05);
        this.ctx.fillText('Robotics', 0, 0);
        this.ctx.restore();
    }

    renderMulti(l) {
        // Just for premium tease
        this.renderArm(this.time, -this.time * 2, l, l * 0.8);
    }

    renderWorkspace(l) {
        // Just for premium tease
        const originX = this.canvas.width / 2;
        const originY = this.canvas.height / 2 + 100;
        this.ctx.fillStyle = "rgba(100, 200, 255, 0.05)";
        this.ctx.beginPath();
        this.ctx.arc(originX, originY, l*1.8, 0, Math.PI*2);
        this.ctx.fill();
        this.renderArm(this.time, this.time * 1.5, l, l * 0.8);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
