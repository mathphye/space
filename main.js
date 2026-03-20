// --- CONFIGURATION ---

const i18n = {
    en: {
        module: "Wave Mechanics",
        lab: "LABORATORY_",
        current: "Current Module:",
        freq: "Frequency (f)",
        amp: "Amplitude (A)",
        damping: "Damping (γ)",
        reset: "RESET SIM",
        phase: "PHASE",
        shm: "Harmonic Source",
        time_space: "Time (t) → Space (x)",
        y_axis: "Amplitude (A)",
        next: "Next →",
        prev: "← Prev"
    },
    es: {
        module: "Mecánica de Ondas",
        lab: "LABORATORIO_",
        current: "Módulo Actual:",
        freq: "Frecuencia (f)",
        amp: "Amplitud (A)",
        damping: "Amortiguación (γ)",
        reset: "REINICIAR SIM",
        phase: "FASE",
        shm: "Fuente Armónica",
        time_space: "Tiempo (t) → Espacio (x)",
        y_axis: "Amplitud (A)",
        next: "Siguiente →",
        prev: "← Anterior"
    }
};

const slides = [
    {
        id: "intro",
        title: { en: "Wave Mechanics", es: "Mecánica de Ondas" },
        text: {
            en: "The fundamental study of oscillations that propagate through a medium. Everything in the universe can be interpreted as an interference of waves.",
            es: "El estudio fundamental de las oscilaciones que se propagan a través de un medio. Todo en el universo puede interpretarse como una interferencia de ondas."
        },
        mode: "grid",
        params: { freq: 40, amp: 20, damping: 0 }
    },
    {
        id: "traveling",
        title: { en: "Traveling Waves", es: "Ondas Viajeras" },
        text: {
            en: "An oscillation propagating through space. Notice how energy moves while the medium only oscillates locally. (Matches the next slide's source)",
            es: "Una oscilación que se propaga. Observa cómo la energía se mueve mientras el medio solo oscila localmente. (Coincide con la siguiente fuente)"
        },
        mode: "wave",
        params: { freq: 40, amp: 60, damping: 0 }
    },
    {
        id: "traveling_shm",
        title: { en: "The Harmonic Source", es: "La Fuente Armónica" },
        text: {
            en: "Every complex wave starts with a simple oscillator. This is the mechanical reality behind the profile you saw in the previous card.",
            es: "Toda onda compleja comienza con un oscilador simple. Esta es la realidad mecánica tras el perfil que viste en la tarjeta anterior."
        },
        mode: "spring-wave",
        params: { freq: 40, amp: 60, damping: 0 }
    },
    {
        id: "resonance",
        title: { en: "Standing Waves", es: "Ondas Estacionarias" },
        text: {
            en: "When reflections interfere perfectly, resonance occurs. This creates stable patterns with stationary nodes—the basis of musical instruments and atomic orbitals.",
            es: "Cuando las reflexiones interfieren perfectamente, ocurre la resonancia. Esto crea patrones estables con nodos estacionarios, base de los instrumentos musicales."
        },
        mode: "standing",
        params: { freq: 30, amp: 70, damping: 2 }
    },
    {
        id: "schrodinger",
        title: { en: "The Wave Function", es: "La Función de Onda" },
        text: {
            en: "In the quantum realm, matter is a localized wave of probability. Look at the complex components—real and imaginary—that form a quantum state.",
            es: "En el reino cuántico, la materia es una onda de probabilidad localizada. Mira los componentes complejos —reales e imaginarios— que forman un estado cuántico."
        },
        mode: "schrodinger",
        params: { freq: 80, amp: 85, damping: 10 }
    },
    {
        id: "interference",
        title: { en: "Wave Interference", es: "Interferencia de Ondas" },
        text: { en: "When two waves meet, their amplitudes add up. This creates regions of constructive and destructive interference, the basis of wave optics.", es: "Cuando dos ondas se encuentran, sus amplitudes se suman. Esto genera zonas de interferencia constructiva y destructiva, la base de la óptica ondulatoria." },
        mode: "interference",
        params: { freq: 40, amp: 80, damping: 0 }
    },
    {
        id: "fourier",
        title: { en: "Spectral Synthesis", es: "Síntesis Espectral" },
        text: {
            en: "Decomposition into phasors. Every emergent pattern is a sum of circular data. (This is exactly the interference from the previous slide analyzed).",
            es: "Descomposición en fasores. Cada patrón emergente es una suma de datos circulares. (Es exactamente la interferencia anterior analizada)."
        },
        mode: "fourier",
        params: { freq: 40, amp: 80, damping: 0 }
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
            labelFreq: document.querySelector('label[for="param-freq"]') || document.querySelectorAll('.control-group label')[0],
            labelAmp: document.querySelectorAll('.control-group label')[1],
            labelDamping: document.querySelectorAll('.control-group label')[2],
            btnReset: document.getElementById('btn-reset'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            labPhase: document.querySelectorAll('.stat-box .lab')[1]
        };

        // Params
        this.freqParam = document.getElementById('param-freq');
        this.ampParam = document.getElementById('param-amp');
        this.dampingParam = document.getElementById('param-damping');
        this.fpsVal = document.getElementById('fps-val');
        this.phaseVal = document.getElementById('phase-val');

        this.init();

        // Stats smoothing
        this.fpsHistory = [];
        this.maxHistory = 80;

        // Interactive Ripples
        this.ripples = [];
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Nav
        document.getElementById('btn-next').onclick = () => this.nextSlide();
        document.getElementById('btn-prev').onclick = () => this.prevSlide();
        document.getElementById('btn-reset').onclick = () => this.resetParams();
        document.getElementById('btn-random').onclick = () => this.randomizeParams();

        // Click to Ripple
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.ripples.push({ x, y, t: 0, life: 1.0 });
        });

        // Lang
        document.getElementById('btn-en').onclick = () => this.setLanguage('en');
        document.getElementById('btn-es').onclick = () => this.setLanguage('es');

        // Sync Sliders Visuals (Ink Fill)
        [this.freqParam, this.ampParam, this.dampingParam].forEach(slider => {
            const updateVal = () => {
                const ratio = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
                slider.style.setProperty('--v', `${ratio}%`);
            };
            slider.oninput = () => { updateVal(); this.updateSlide(); };
            updateVal(); // Initial call
        });

        this.updateSlide();
        this.setupIdleTimer();
        requestAnimationFrame((t) => this.loop(t));
    }

    setLanguage(l) {
        this.lang = l;
        document.getElementById('btn-en').classList.toggle('active', l === 'en');
        document.getElementById('btn-es').classList.toggle('active', l === 'es');
        this.updateSlide();
    }

    randomizeParams() {
        this.freqParam.value = Math.floor(Math.random() * 200) + 20;
        this.ampParam.value = Math.floor(Math.random() * 150) + 30;
        this.dampingParam.value = Math.floor(Math.random() * 40);
        this.updateSlide();
    }

    resetParams() {
        this.freqParam.value = 50;
        this.ampParam.value = 70;
        this.dampingParam.value = 0;
        this.updateSlide();
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

    updateSlide() {
        const slide = slides[this.currentSlide];
        const dict = i18n[this.lang];

        // Trigger Page Turn Animation
        const container = document.getElementById('slide-container');
        container.classList.remove('page-turn');
        void container.offsetWidth; // Force reflow
        container.classList.add('page-turn');

        // Update Text
        this.slideTitle.innerText = slide.title[this.lang];
        this.slideText.innerText = slide.text[this.lang];
        this.slideNum.innerText = `0${this.currentSlide + 1} / 0${slides.length}`;

        // Update Static HUD
        this.ui.mainTitle.innerHTML = `${dict.module} <span class="ink-sub">${dict.lab}</span>`;
        this.ui.topicLabel.innerHTML = `${dict.current} <span id="module-name">${dict.module}</span>`;
        this.ui.labelFreq.innerText = dict.freq;
        this.ui.labelAmp.innerText = dict.amp;
        this.ui.labelDamping.innerText = dict.damping;
        this.ui.btnReset.innerText = dict.reset;
        this.ui.btnPrev.innerText = dict.prev;
        this.ui.btnNext.innerText = dict.next;
        this.ui.labPhase.innerText = dict.phase;

        // Update Progress
        this.progressFill.style.width = `${((this.currentSlide + 1) / slides.length) * 100}%`;

        // Update Params
        this.freqParam.value = slide.params.freq;
        this.ampParam.value = slide.params.amp;
        this.dampingParam.value = slide.params.damping;
    }

    setupIdleTimer() {
        let timer;
        this.formulasOpacity = 0;
        this.ghostFormulas = [
            { text: "∂²u/∂t² = v² ∇²u", x: 150, y: 350 },
            { text: "iħ ∂/∂t Ψ = Ĥ Ψ", x: 800, y: 200 },
            { text: "E = hf", x: 1200, y: 750 },
            { text: "eⁱᶿ = cos θ + i sin θ", x: 450, y: 850 },
            { text: "λ = h / p", x: 1500, y: 300 }
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
            }, 6000); // 6 seconds
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

        // Moving Average para FPS
        const currentFps = 1000 / delta;
        if (currentFps > 0 && currentFps < 1000) {
            this.fpsHistory.push(currentFps);
            if (this.fpsHistory.length > this.maxHistory) this.fpsHistory.shift();
        }

        const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        this.fpsVal.innerText = Math.round(avgFps);

        const freq = parseFloat(this.freqParam.value) / 100;
        this.time += freq * 0.1;

        this.phaseVal.innerText = `${(this.time % (Math.PI * 2) / Math.PI).toFixed(2)}π`;

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderGhostFormulas();
        this.ctx.globalAlpha = 1;

        const slide = slides[this.currentSlide];
        const amp = parseFloat(this.ampParam.value);
        const freq = parseFloat(this.freqParam.value);
        const damping = parseFloat(this.dampingParam.value);

        if (slide.mode === "wave") this.renderWave(amp, freq, damping);
        if (slide.mode === "spring-wave") this.renderSpringWave(amp, freq, damping);
        if (slide.mode === "standing") this.renderStanding(amp, freq, damping);
        if (slide.mode === "schrodinger") this.renderSchrodinger(amp, freq, damping);
        if (slide.mode === "interference") this.renderInterference(amp, freq, damping);
        if (slide.mode === "fourier") this.renderFourier(amp, freq, damping);
        if (slide.mode === "grid") this.renderIntro(amp, freq);

        this.renderRipples();
    }

    getInk(alpha = 1) {
        return `rgba(26,26,26,${alpha})`;
    }

    renderGhostFormulas() {
        if (document.body.classList.contains('user-idle')) {
            this.formulasOpacity = Math.min(this.formulasOpacity + 0.005, 0.12); // Very subtle
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

    renderRipples() {
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

            // Second ring
            if (r.t > 0.2) {
                this.ctx.beginPath();
                this.ctx.arc(r.x, r.y, radius * 0.7, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
    }

    jitter() { return (Math.random() - 0.5) * 1.5; }

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

    renderWave(amp, freq, damping) {
        this.ctx.beginPath();
        const centerY = this.canvas.height / 2 + 100;
        const f = freq / 40;
        const k = 0.01 * f;

        // --- Draw the Ink Wave ---
        this.ctx.strokeStyle = this.getInk();
        for (let x = 0; x < this.canvas.width; x += 5) {
            const ratio = x / this.canvas.width;
            const dampFactor = Math.exp(-ratio * damping / 10);
            const y = centerY + Math.sin(x * k - this.time) * amp * dampFactor;
            if (x === 0) this.ctx.moveTo(x, y + this.jitter());
            else this.ctx.lineTo(x, y + this.jitter());
        }
        this.ctx.stroke();

        // Surfer tracker
        let valleyX = ((1.5 * Math.PI + this.time) / k) % this.canvas.width;
        if (valleyX < 0) valleyX += this.canvas.width;

        const ratio = valleyX / this.canvas.width;
        const dampFactor = Math.exp(-ratio * damping / 10);
        const valleyY = centerY + Math.sin(valleyX * k - this.time) * amp * dampFactor;

        this.ctx.font = '32px serif';
        this.ctx.textAlign = 'center';
        this.ctx.save();
        this.ctx.translate(valleyX, valleyY - 5);
        const slope = Math.cos(valleyX * k - this.time);
        this.ctx.rotate(slope * 0.2);
        this.ctx.fillText('🦆🏄‍♂️', 0, 0);
        this.ctx.restore();
        this.ctx.textAlign = 'left';
    }

    renderSpringWave(amp, freq, damping) {
        const dict = i18n[this.lang];
        const centerY = this.canvas.height / 2 + 100;
        const originX = this.canvas.width * 0.3;
        const f = freq / 40;
        const k = 0.01 * f;

        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = this.getInk(0.4);
        this.ctx.beginPath();
        this.ctx.moveTo(originX - 80, centerY);
        this.ctx.lineTo(this.canvas.width - 80, centerY);
        this.ctx.lineTo(this.canvas.width - 100, centerY - 8);
        this.ctx.moveTo(this.canvas.width - 80, centerY);
        this.ctx.lineTo(this.canvas.width - 100, centerY + 8);

        this.ctx.moveTo(originX, centerY + amp + 140);
        this.ctx.lineTo(originX, centerY - amp - 140);
        this.ctx.lineTo(originX - 8, centerY - amp - 120);
        this.ctx.moveTo(originX, centerY - amp - 140);
        this.ctx.lineTo(originX + 8, centerY - amp - 120);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        [-amp, amp].forEach(yPos => {
            this.ctx.moveTo(originX - 10, centerY + yPos);
            this.ctx.lineTo(originX + 10, centerY + yPos);
        });
        this.ctx.stroke();

        const massY = centerY + Math.sin(-this.time) * amp;

        this.ctx.strokeStyle = this.getInk(0.8);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        const springTop = centerY - amp - 100;
        const turns = 12;
        const spacing = (massY - springTop) / turns;
        this.ctx.moveTo(originX, springTop);
        for (let i = 0; i <= turns; i++) {
            const ty = springTop + i * spacing;
            const tx = originX + (i > 0 && i < turns ? (i % 2 === 0 ? 15 : -15) : 0);
            this.ctx.lineTo(tx, ty);
        }
        this.ctx.stroke();

        this.ctx.fillStyle = this.getInk();
        this.ctx.beginPath();
        this.ctx.arc(originX, massY, 20, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this.ctx.beginPath();
        this.ctx.arc(originX - 6, massY - 6, 6, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = this.getInk();
        for (let x = originX; x < this.canvas.width - 100; x += 5) {
            const localX = x - originX;
            const y = centerY + Math.sin(localX * k - this.time) * amp;
            if (x === originX) this.ctx.moveTo(x, y + this.jitter());
            else this.ctx.lineTo(x, y + this.jitter());
        }
        this.ctx.stroke();

        this.ctx.setLineDash([5, 10]);
        this.ctx.strokeStyle = this.getInk(0.2);
        this.ctx.beginPath();
        this.ctx.moveTo(originX, massY);
        this.ctx.lineTo(originX + 200, massY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.font = '26px "Gloria Hallelujah"';
        this.ctx.fillStyle = this.getInk();
        this.ctx.fillText(dict.y_axis, originX + 20, centerY - amp - 120);

        this.ctx.font = '22px "Architects Daughter"';
        this.ctx.fillText(dict.time_space, this.canvas.width - 320, centerY + 45);

        this.ctx.font = 'italic 18px "Architects Daughter"';
        this.ctx.fillText('+A', originX - 35, centerY - amp + 10);
        this.ctx.fillText('-A', originX - 35, centerY + amp + 10);

        this.ctx.save();
        this.ctx.translate(originX - 160, massY);
        this.ctx.rotate(-0.05);
        this.ctx.font = 'bold 20px "Gloria Hallelujah"';
        this.ctx.fillText(dict.shm, 0, 0);
        this.ctx.restore();
    }

    renderStanding(amp, freq, damping) {
        const dict = i18n[this.lang];
        const centerY = this.canvas.height / 2 + 100;
        const f = freq / 40;
        const k = 0.01 * f;

        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([5, 5]);

        // Muted Component Waves 
        const redComp = this.isBlueprint ? 'rgba(255, 100, 100, 0.15)' : 'rgba(210, 40, 40, 0.25)';
        const blueComp = this.isBlueprint ? 'rgba(100, 200, 255, 0.15)' : 'rgba(40, 40, 210, 0.25)';

        this.ctx.strokeStyle = redComp;
        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 10) {
            const y1 = centerY + Math.sin(x * k - this.time) * (amp / 2);
            if (x === 0) this.ctx.moveTo(x, y1);
            else this.ctx.lineTo(x, y1);
        }
        this.ctx.stroke();

        this.ctx.strokeStyle = blueComp;
        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 10) {
            const y2 = centerY + Math.sin(x * k + this.time) * (amp / 2);
            if (x === 0) this.ctx.moveTo(x, y2);
            else this.ctx.lineTo(x, y2);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.lineWidth = 3.5;
        this.ctx.strokeStyle = this.getInk();
        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 5) {
            const y1 = Math.sin(x * k - this.time) * (amp / 2);
            const y2 = Math.sin(x * k + this.time) * (amp / 2);
            const y = centerY + y1 + y2;
            if (x === 0) this.ctx.moveTo(x, y + this.jitter());
            else this.ctx.lineTo(x, y + this.jitter());
        }
        this.ctx.stroke();

        const wavelength = 2 * Math.PI / k;
        let tx1 = ((1.5 * Math.PI + this.time) / k) % this.canvas.width;
        if (tx1 < 0) tx1 += this.canvas.width;
        const ty1 = centerY + Math.sin(tx1 * k - this.time) * (amp / 2);

        let tx2 = ((1.5 * Math.PI - this.time) / k) % this.canvas.width;
        if (tx2 < 0) tx2 += this.canvas.width;
        const ty2 = centerY + Math.sin(tx2 * k + this.time) * (amp / 2);

        this.ctx.font = '24px serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔴', tx1, ty1 + 5);
        this.ctx.fillText('🔵', tx2, ty2 + 5);
        this.ctx.textAlign = 'left';

        this.ctx.font = 'italic 16px "Architects Daughter"';
        this.ctx.fillStyle = redComp;
        this.ctx.fillText(this.lang === 'en' ? 'Traveling wave →' : 'Onda viajera →', 50, centerY - (amp / 2) - 40);
        this.ctx.fillStyle = blueComp;
        this.ctx.fillText(this.lang === 'en' ? '← Traveling wave' : '← Onda viajera', this.canvas.width - 200, centerY - (amp / 2) - 40);

        const nodeSpacing = wavelength / 2;
        this.ctx.strokeStyle = this.getInk(0.15);
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        for (let nx = 0; nx < this.canvas.width; nx += nodeSpacing) {
            this.ctx.moveTo(nx, centerY - amp - 20);
            this.ctx.lineTo(nx, centerY + amp + 20);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        for (let nx = nodeSpacing; nx < this.canvas.width; nx += nodeSpacing) {
            const y1 = Math.sin(nx * k - this.time) * (amp / 2);
            const y2 = Math.sin(nx * k + this.time) * (amp / 2);
            this.drawArrow(nx, centerY, nx, centerY + y1, redComp);
            this.drawArrow(nx, centerY, nx, centerY + y2, blueComp);
        }
    }

    renderSchrodinger(amp, freq, damping) {
        const dict = i18n[this.lang];
        const centerY = this.canvas.height / 2 + 50;
        const centerX = this.canvas.width / 2;
        const f = (freq / 40) / 3; // Reduced frequency by 3x
        const focus = freq / 40;

        // --- 1. Draw 3D Axes System ---
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'rgba(26, 26, 26, 0.15)';
        this.ctx.beginPath();
        // X-axis (Real Space)
        this.ctx.moveTo(50, centerY);
        this.ctx.lineTo(this.canvas.width - 50, centerY);
        // Re-axis (Vertical)
        this.ctx.moveTo(centerX, centerY - amp * 2 - 100);
        this.ctx.lineTo(centerX, centerY + amp * 2 + 100);
        // Im-axis (Lateral/Perspective)
        const tiltX = 0.5;
        const tiltY = -0.4;
        this.ctx.moveTo(centerX - 300 * tiltX, centerY - 300 * tiltY);
        this.ctx.lineTo(centerX + 300 * tiltX, centerY + 300 * tiltY);
        this.ctx.stroke();

        const displayAmp = amp * 1.5; // 1.5x of original amp

        // --- 2. Projected 3D Helix (Quantum Wavefunction) ---
        // Blue Shadow (Imaginary part on depth plane)
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'rgba(40, 40, 210, 0.15)';
        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 5) {
            const dx = (x - centerX) / 600; // Tripled width denominator (was 200)
            const gaussian = Math.exp(-dx * dx * focus);
            const im = Math.sin(x * 0.05 * f - this.time) * displayAmp * gaussian;
            this.ctx.lineTo(x + im * tiltX, centerY + im * tiltY);
        }
        this.ctx.stroke();

        // Red Shadow (Real part on vertical plane)
        this.ctx.strokeStyle = 'rgba(210, 40, 40, 0.15)';
        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 5) {
            const dx = (x - centerX) / 600;
            const gaussian = Math.exp(-dx * dx * focus);
            const re = Math.cos(x * 0.05 * f - this.time) * displayAmp * gaussian;
            this.ctx.lineTo(x, centerY + re);
        }
        this.ctx.stroke();

        // Main Helical Ink Line
        this.ctx.lineWidth = 3.5;
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 2) {
            const dx = (x - centerX) / 600;
            const gaussian = Math.exp(-dx * dx * focus);
            const re = Math.cos(x * 0.05 * f - this.time) * displayAmp * gaussian;
            const im = Math.sin(x * 0.05 * f - this.time) * displayAmp * gaussian;

            const px = x + im * tiltX;
            const py = centerY + re + im * tiltY;

            if (x === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.stroke();

        // --- 3. Integrated Complex Phasor (3D rotation path) ---
        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.15) {
            const rc = Math.cos(a) * displayAmp;
            const ic = Math.sin(a) * displayAmp;
            const px = centerX + ic * tiltX;
            const py = centerY + rc + ic * tiltY;
            if (a === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Rotating Phasor in 3D perspective (Synchronized at centerX)
        const phase0 = centerX * 0.05 * f - this.time;
        const re0 = Math.cos(phase0) * displayAmp;
        const im0 = Math.sin(phase0) * displayAmp;

        const phasorX = centerX + im0 * tiltX;
        const phasorY = centerY + re0 + im0 * tiltY;
        this.drawArrow(centerX, centerY, phasorX, phasorY, 'rgba(0,0,0,0.8)');

        // Labels
        this.ctx.font = '16px "Gloria Hallelujah"';
        this.ctx.fillStyle = 'rgba(210, 40, 40, 0.6)';
        this.ctx.fillText('Re [ψ]', centerX + 10, centerY - displayAmp - 60);
        this.ctx.fillStyle = 'rgba(40, 40, 210, 0.6)';
        this.ctx.fillText('Im [ψ]', centerX + 150, centerY + 80);

        this.ctx.font = '18px "Architects Daughter"';
        this.ctx.fillStyle = this.getInk();
        this.ctx.fillText(this.lang === 'en' ? 'Phase (Rotating Helix)' : 'Fase (Hélice Rotativa)', centerX - 100, centerY + displayAmp + 80);
    }

    renderInterference(amp, freq, damping) {
        const centerY = this.canvas.height / 2 + 100;
        const f = freq / 40;
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.getInk();
        this.ctx.lineWidth = 3.5;
        for (let x = 0; x < this.canvas.width; x += 4) {
            const y1 = Math.sin(x * 0.01 * f + this.time) * amp;
            const y2 = Math.sin(x * 0.02 * f - this.time * 0.7) * (amp * 0.5);
            const y3 = Math.sin(x * 0.03 * f + this.time * 0.4) * (amp * 0.25);
            const y = centerY + y1 + y2 + y3;
            if (x === 0) this.ctx.moveTo(x, y + this.jitter());
            else this.ctx.lineTo(x, y + this.jitter());
        }
        this.ctx.stroke();
    }

    renderFourier(amp, freq, damping) {
        const dict = i18n[this.lang];
        const centerY = this.canvas.height / 2;
        const f0 = freq / 40;

        // --- 3 Component Waves ---
        const components = [
            { f: 1.0, k: 0.01, speed: 1, a: 1.0, color: this.isBlueprint ? 'rgba(255,100,100,0.5)' : 'rgba(210, 40, 40, 0.5)', lab: 'W1' },
            { f: 2.0, k: 0.02, speed: -0.7, a: 0.5, color: this.isBlueprint ? 'rgba(100,150,255,0.5)' : 'rgba(40, 40, 210, 0.5)', lab: 'W2' },
            { f: 3.0, k: 0.03, speed: 0.4, a: 0.25, color: this.isBlueprint ? 'rgba(100,255,100,0.5)' : 'rgba(40, 210, 40, 0.5)', lab: 'W3' }
        ];

        // --- DASHBOARD (Inset to avoid controls) ---
        const dashX = this.canvas.width - 1100;
        const dashY = this.canvas.height - 180;
        const colWidth = 160;

        this.ctx.font = 'bold 16px "Architects Daughter"';
        this.ctx.fillStyle = this.getInk();
        this.ctx.fillText(this.lang === 'en' ? 'PHASOR SPECTRAL DATA' : 'DATOS ESPECTRALES (FASORES)', dashX, dashY - 140);

        components.forEach((c, i) => {
            const bx = dashX + i * colWidth;
            const by = dashY;

            const maxH = 100;
            const currentH = c.a * amp * 1.5;
            this.ctx.fillStyle = this.getInk(0.05);
            this.ctx.fillRect(bx, by, 30, -maxH);
            this.ctx.fillStyle = c.color;
            this.ctx.fillRect(bx, by, 30, -currentH);
            this.ctx.strokeStyle = this.getInk(0.3);
            this.ctx.strokeRect(bx, by, 30, -maxH);

            const dialX = bx + 80;
            const dialY = by - maxH / 2;
            const currentPhase = this.time * 2 * c.speed;
            const px = Math.sin(currentPhase) * 40;
            const py = Math.cos(currentPhase) * 40;

            this.ctx.strokeStyle = this.getInk(0.1);
            this.ctx.beginPath();
            this.ctx.arc(dialX, dialY, 40, 0, Math.PI * 2);
            this.ctx.stroke();
            this.drawArrow(dialX, dialY, dialX + px, dialY + py, c.color);

            this.ctx.font = 'bold 13px monospace';
            this.ctx.fillStyle = this.getInk();
            this.ctx.fillText(`${c.lab}`, bx + 40, by - maxH - 20);
            this.ctx.font = '11px monospace';
            this.ctx.fillText(`A: ${(c.a * amp).toFixed(0)}`, bx + 40, by - maxH + 10);
            this.ctx.fillText(`f: ${c.f}ω`, bx + 40, by - maxH + 25);
        });

        // --- WAVE SUMMATION (Full Width) ---
        this.ctx.setLineDash([3, 3]);
        this.ctx.lineWidth = 1.5;
        components.forEach((c) => {
            this.ctx.strokeStyle = c.color;
            this.ctx.beginPath();
            for (let x = 0; x < this.canvas.width; x += 10) {
                const phase = x * c.k * f0 + this.time * c.speed;
                const y = centerY + Math.sin(phase) * (amp * c.a);
                if (x === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();
        });
        this.ctx.setLineDash([]);

        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = this.getInk();
        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 5) {
            let sumY = 0;
            components.forEach(c => {
                const phase = x * c.k * f0 + this.time * c.speed;
                sumY += Math.sin(phase) * (amp * c.a);
            });
            const y = centerY + sumY;
            if (x === 0) this.ctx.moveTo(x, y + this.jitter());
            else this.ctx.lineTo(x, y + this.jitter());
        }
        this.ctx.stroke();
    }

    renderIntro(amp, freq) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const f = freq / 40;

        // 1. Expanding Ink Ripples
        this.ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const timeOffset = (this.time * 2 + i * 2) % 10;
            const radius = timeOffset * (amp * 2);
            const alpha = 0.2 * (1 - timeOffset / 10);

            this.ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
            this.ctx.beginPath();
            // Scribbly circle
            for (let a = 0; a < Math.PI * 2; a += 0.1) {
                const r = radius + Math.sin(a * 10) * 5;
                const x = centerX + Math.cos(a) * r;
                const y = centerY + Math.sin(a) * r;
                if (a === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }

        // 2. Converging Particles
        for (let i = 0; i < 30; i++) {
            const angle = (i * 137.5) * (Math.PI / 180); // Fibonacci spiral start
            const dist = ((this.time * 50 + i * 20) % (amp * 4));
            const x = centerX + Math.cos(angle + this.time * 0.2) * dist;
            const y = centerY + Math.sin(angle + this.time * 0.2) * dist;

            const size = 2 + (i % 6);
            this.ctx.fillStyle = `rgba(0,0,0,${0.05 + (dist / (amp * 4)) * 0.1})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 3. Central Branding
        this.ctx.save();
        this.ctx.font = 'bold 120px "Gloria Hallelujah"';
        this.ctx.fillStyle = 'rgba(0,0,0,0.06)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(Math.sin(this.time * 0.5) * 0.05);
        this.ctx.fillText('Mathphye', 0, 0);
        this.ctx.restore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
