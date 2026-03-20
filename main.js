// --- CONFIGURATION ---

const slides = [
    {
        id: "intro",
        title: "Wave Mechanics",
        text: "The fundamental study of oscillations that propagate through a medium. Everything in the universe can be interpreted as an interference of waves.",
        mode: "grid",
        params: { freq: 40, amp: 20, damping: 0 }
    },
    {
        id: "traveling",
        title: "Traveling Waves",
        text: "Observe how energy moves through the field. Use the Frequency slider to change the wavelength, and Amplitude to change energy intensity.",
        mode: "wave",
        params: { freq: 60, amp: 50, damping: 5 }
    },
    {
        id: "resonance",
        title: "Standing Waves",
        text: "When reflections interfere perfectly, resonance occurs. This creates stable patterns with stationary nodes—the basis of musical instruments and atomic orbitals.",
        mode: "standing",
        params: { freq: 30, amp: 70, damping: 2 }
    },
    {
        id: "schrodinger",
        title: "The Wave Function",
        text: "In the quantum realm, matter is a localized wave of probability. Look at the complex components—real and imaginary—that form a quantum state.",
        mode: "schrodinger",
        params: { freq: 80, amp: 85, damping: 10 }
    },
    {
        id: "interference",
        title: "Emergence",
        text: "Multiple waves colliding create constructive and destructive interference. This is how structure emerges from chaos in the physical world.",
        mode: "interference",
        params: { freq: 50, amp: 40, damping: 0 }
    }
];

const availableModules = [
    { title: "Wave Mechanics", category: "Physics", icon: "≈" },
    { title: "Quantum Entanglement", category: "Physics", icon: "⨂" },
    { title: "Thermodynamics", category: "Engineering", icon: "♨" },
    { title: "Fractal Geometry", category: "Mathematics", icon: "❄" },
    { title: "Relativity", category: "Physics", icon: "⌚" },
    { title: "Signal Analysis", category: "Engineering", icon: "⚡" }
];

// --- APP CORE ---

class App {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentSlide = 0;
        this.time = 0;
        
        // UI Elements
        this.slideTitle = document.getElementById('slide-title');
        this.slideText = document.getElementById('slide-text');
        this.slideNum = document.getElementById('slide-count');
        this.progressFill = document.getElementById('progress-fill');
        this.currentModuleName = document.getElementById('module-name');
        
        // Params
        this.freqParam = document.getElementById('param-freq');
        this.ampParam = document.getElementById('param-amp');
        this.dampingParam = document.getElementById('param-damping');
        this.fpsVal = document.getElementById('fps-val');
        this.phaseVal = document.getElementById('phase-val');

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Nav
        document.getElementById('btn-next').onclick = () => this.nextSlide();
        document.getElementById('btn-prev').onclick = () => this.prevSlide();
        document.getElementById('btn-reset').onclick = () => this.updateSlide();

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
        requestAnimationFrame((t) => this.loop(t));
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
        
        // Trigger Page Turn Animation
        const container = document.getElementById('slide-container');
        container.classList.remove('page-turn');
        void container.offsetWidth; // Force reflow
        container.classList.add('page-turn');

        // Update Text
        this.slideTitle.innerText = slide.title;
        this.slideText.innerText = slide.text;
        this.slideNum.innerText = `0${this.currentSlide + 1} / 0${slides.length}`;
        
        // Update Progress
        this.progressFill.style.width = `${((this.currentSlide + 1) / slides.length) * 100}%`;

        // Update Params
        this.freqParam.value = slide.params.freq;
        this.ampParam.value = slide.params.amp;
        this.dampingParam.value = slide.params.damping;
    }

    loop(timestamp) {
        const delta = timestamp - (this.lastTime || timestamp);
        this.lastTime = timestamp;
        this.fpsVal.innerText = Math.round(1000 / delta);

        const freq = parseFloat(this.freqParam.value) / 100;
        this.time += freq * 0.1;

        this.phaseVal.innerText = `${(this.time % (Math.PI * 2) / Math.PI).toFixed(2)}π`;

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Background grid is handled by SVG in HTML now
        
        const slide = slides[this.currentSlide];
        const amp = parseFloat(this.ampParam.value) * 1.5; // Larger
        const freq = parseFloat(this.freqParam.value);
        const damping = parseFloat(this.dampingParam.value);

        // Ink Style
        this.ctx.strokeStyle = '#1a1a1a'; // Dark gray/black
        this.ctx.lineWidth = 3; // Thicker pen look
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (slide.mode === 'wave') this.renderWave(amp, freq, damping);
        else if (slide.mode === 'standing') this.renderStanding(amp, freq, damping);
        else if (slide.mode === 'schrodinger') this.renderSchrodinger(amp, freq, damping);
        else if (slide.mode === 'interference') this.renderInterference(amp, freq, damping);
    }

    // Helper for "Hand-drawn" jitter
    jitter() { return (Math.random() - 0.5) * 1.5; }

    renderWave(amp, freq, damping) {
        this.ctx.beginPath();
        const centerY = this.canvas.height / 2 + 100; // Shift to bottom background
        const f = freq / 40;

        for (let x = 0; x < this.canvas.width; x += 5) { // Larger step for sketch feel
            const ratio = x / this.canvas.width;
            const dampFactor = Math.exp(-ratio * damping / 10);
            const y = centerY + Math.sin(x * 0.01 * f - this.time) * amp * dampFactor;
            
            if (x === 0) this.ctx.moveTo(x, y + this.jitter());
            else this.ctx.lineTo(x, y + this.jitter());
        }
        this.ctx.stroke();
    }

    renderStanding(amp, freq, damping) {
        const centerY = this.canvas.height / 2 + 100;
        const nodes = Math.floor(freq / 10) + 1;
        const envelope = Math.sin(this.time);

        // Main ink line
        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 5) {
            const y = centerY + Math.sin((x / this.canvas.width) * Math.PI * nodes) * amp * envelope;
            if (x === 0) this.ctx.moveTo(x, y + this.jitter());
            else this.ctx.lineTo(x, y + this.jitter());
        }
        this.ctx.stroke();

        // Sketchy ghost lines
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'rgba(30, 58, 95, 0.1)';
        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 10) {
            const y = centerY + Math.sin((x / this.canvas.width) * Math.PI * nodes) * amp;
            this.ctx.moveTo(x, centerY);
            this.ctx.lineTo(x, y + this.jitter());
        }
        this.ctx.stroke();
    }

    renderSchrodinger(amp, freq, damping) {
        const centerY = this.canvas.height / 2 + 100;
        const centerX = this.canvas.width / 2;
        const focus = freq / 15;

        // Ink Stroke (Real Part)
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#1e3a5f';
        this.ctx.lineWidth = 3;
        for (let x = 0; x < this.canvas.width; x += 3) {
            const dx = (x - centerX) / 120;
            const gaussian = Math.exp(-dx * dx * focus);
            const y = centerY + Math.sin(x * 0.1 + this.time) * amp * gaussian;
            if (x === 0) this.ctx.moveTo(x, y + this.jitter());
            else this.ctx.lineTo(x, y + this.jitter());
        }
        this.ctx.stroke();

        // Pencil Shadow (Probability)
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(30, 58, 95, 0.04)';
        for (let x = 0; x < this.canvas.width; x += 5) {
            const dx = (x - centerX) / 120;
            const gaussian = Math.exp(-dx * dx * focus);
            const h = amp * gaussian;
            if (x === 0) this.ctx.moveTo(x, centerY - h);
            else this.ctx.lineTo(x, centerY - h);
        }
        for (let x = this.canvas.width; x >= 0; x -= 5) {
            const dx = (x - centerX) / 120;
            const gaussian = Math.exp(-dx * dx * focus);
            const h = amp * gaussian;
            this.ctx.lineTo(x, centerY + h);
        }
        this.ctx.fill();
    }

    renderInterference(amp, freq, damping) {
        const centerY = this.canvas.height / 2 + 100;
        const f = freq / 40;

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#1e3a5f';
        this.ctx.lineWidth = 3;
        for (let x = 0; x < this.canvas.width; x += 4) {
            const y1 = Math.sin(x * 0.01 * f + this.time) * amp;
            const y2 = Math.sin(x * 0.02 * f - this.time * 0.7) * (amp * 0.5);
            const y = centerY + y1 + y2;
            if (x === 0) this.ctx.moveTo(x, y + this.jitter());
            else this.ctx.lineTo(x, y + this.jitter());
        }
        this.ctx.stroke();
    }

    renderIdle() {
        // Just a subtle paper base line
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        this.ctx.moveTo(0, this.canvas.height / 2 + 100);
        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2 + 100);
        this.ctx.stroke();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
