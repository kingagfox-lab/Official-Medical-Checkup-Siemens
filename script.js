class DNAHelix {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.time = 0;
        this.speed = options.speed || 0.012;
        this.radius = options.radius || 90;
        this.numPoints = options.numPoints || 80;
        this.isDark = options.isDark || false;
        this.grainIntensity = options.grainIntensity || 0.08;
        this.strandWidth = options.strandWidth || 8;
        this.colorA = options.colorA || { r: 200, g: 30, b: 40 };
        this.colorB = options.colorB || { r: 30, g: 80, b: 200 };
        this.particles = [];
        this.initParticles();
        this.animate();
    }

    initParticles() {
        for (let i = 0; i < 80; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.15,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    lerpColor(c1, c2, t) {
        return {
            r: Math.round(c1.r + (c2.r - c1.r) * t),
            g: Math.round(c1.g + (c2.g - c1.g) * t),
            b: Math.round(c1.b + (c2.b - c1.b) * t)
        };
    }

    drawStrandSegment(x, y, depth, color, width) {
        const brightness = 0.3 + (depth + 1) * 0.35;
        const lit = {
            r: Math.min(255, Math.round(color.r * brightness + (depth + 1) * 40)),
            g: Math.min(255, Math.round(color.g * brightness + (depth + 1) * 30)),
            b: Math.min(255, Math.round(color.b * brightness + (depth + 1) * 40))
        };
        const size = width * (0.6 + (depth + 1) * 0.25);
        const grad = this.ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
        grad.addColorStop(0, `rgba(${Math.min(255, lit.r + 80)}, ${Math.min(255, lit.g + 60)}, ${Math.min(255, lit.b + 80)}, ${0.9 * brightness})`);
        grad.addColorStop(0.4, `rgba(${lit.r}, ${lit.g}, ${lit.b}, ${0.85 * brightness})`);
        grad.addColorStop(0.7, `rgba(${Math.round(lit.r * 0.5)}, ${Math.round(lit.g * 0.4)}, ${Math.round(lit.b * 0.5)}, ${0.5 * brightness})`);
        grad.addColorStop(1, `rgba(${Math.round(lit.r * 0.2)}, ${Math.round(lit.g * 0.15)}, ${Math.round(lit.b * 0.2)}, 0)`);
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawBasePair(x1, y1, x2, y2, depth1, depth2) {
        const avgDepth = (depth1 + depth2) / 2;
        const brightness = 0.2 + (avgDepth + 1) * 0.3;
        const alpha = 0.15 + brightness * 0.35;
        const width = 1.5 + (avgDepth + 1) * 1;
        const grad = this.ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `rgba(${this.colorA.r}, ${this.colorA.g}, ${this.colorA.b}, ${alpha})`);
        grad.addColorStop(0.35, `rgba(180, 180, 200, ${alpha * 0.5})`);
        grad.addColorStop(0.5, `rgba(220, 220, 240, ${alpha * 0.7})`);
        grad.addColorStop(0.65, `rgba(180, 180, 200, ${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(${this.colorB.r}, ${this.colorB.g}, ${this.colorB.b}, ${alpha})`);
        this.ctx.strokeStyle = grad;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        if (avgDepth > 0) {
            const nodeGrad = this.ctx.createRadialGradient(midX, midY, 0, midX, midY, 3);
            nodeGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.6})`);
            nodeGrad.addColorStop(1, `rgba(200, 200, 220, 0)`);
            this.ctx.fillStyle = nodeGrad;
            this.ctx.beginPath();
            this.ctx.arc(midX, midY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawStrandCurve(points, color) {
        if (points.length < 2) return;
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const depth = (p1.depth + p2.depth) / 2;
            const brightness = 0.3 + (depth + 1) * 0.35;
            const size = this.strandWidth * (0.5 + (depth + 1) * 0.3);
            const lit = {
                r: Math.min(255, Math.round(color.r * brightness + (depth + 1) * 50)),
                g: Math.min(255, Math.round(color.g * brightness + (depth + 1) * 40)),
                b: Math.min(255, Math.round(color.b * brightness + (depth + 1) * 50))
            };
            const grad = this.ctx.createLinearGradient(
                p1.x - size, p1.y, p1.x + size, p1.y
            );
            grad.addColorStop(0, `rgba(${Math.round(lit.r * 0.3)}, ${Math.round(lit.g * 0.2)}, ${Math.round(lit.b * 0.3)}, ${0.3 * brightness})`);
            grad.addColorStop(0.3, `rgba(${lit.r}, ${lit.g}, ${lit.b}, ${0.8 * brightness})`);
            grad.addColorStop(0.5, `rgba(${Math.min(255, lit.r + 60)}, ${Math.min(255, lit.g + 50)}, ${Math.min(255, lit.b + 60)}, ${0.95 * brightness})`);
            grad.addColorStop(0.7, `rgba(${lit.r}, ${lit.g}, ${lit.b}, ${0.8 * brightness})`);
            grad.addColorStop(1, `rgba(${Math.round(lit.r * 0.3)}, ${Math.round(lit.g * 0.2)}, ${Math.round(lit.b * 0.3)}, ${0.3 * brightness})`);
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = size;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            if (i < points.length - 2) {
                const p3 = points[i + 2];
                const cpx = p2.x;
                const cpy = p2.y;
                this.ctx.quadraticCurveTo(cpx, cpy, (p2.x + p3.x) / 2, (p2.y + p3.y) / 2);
            } else {
                this.ctx.lineTo(p2.x, p2.y);
            }
            this.ctx.stroke();
        }
    }

    drawGlow(x, y, depth, color, size) {
        const brightness = (depth + 1) * 0.5;
        const glowGrad = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        glowGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 * brightness})`);
        glowGrad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        this.ctx.fillStyle = glowGrad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawParticles() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += 0.02;
            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;
            const flicker = p.alpha * (0.5 + Math.sin(p.pulse) * 0.5);
            const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            grad.addColorStop(0, `rgba(150, 180, 255, ${flicker})`);
            grad.addColorStop(1, `rgba(100, 140, 220, 0)`);
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawGrain() {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 8) {
            const noise = (Math.random() - 0.5) * this.grainIntensity * 255;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        this.ctx.putImageData(imageData, 0, 0);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const cx = this.width / 2;
        const cy = this.height / 2;
        const totalHeight = this.height * 0.85;
        const spacing = totalHeight / this.numPoints;
        const startY = cy - totalHeight / 2;

        const strandA = [];
        const strandB = [];
        const pairs = [];

        for (let i = 0; i < this.numPoints; i++) {
            const y = startY + i * spacing;
            const angle = (i * 0.22) + this.time;
            const xA = cx + Math.cos(angle) * this.radius;
            const xB = cx + Math.cos(angle + Math.PI) * this.radius;
            const depthA = Math.sin(angle);
            const depthB = Math.sin(angle + Math.PI);
            strandA.push({ x: xA, y, depth: depthA });
            strandB.push({ x: xB, y, depth: depthB });
            pairs.push({ a: { x: xA, y, depth: depthA }, b: { x: xB, y, depth: depthB } });
        }

        for (let i = 0; i < this.numPoints; i += 3) {
            this.drawGlow(strandA[i].x, strandA[i].y, strandA[i].depth, this.colorA, 30);
            this.drawGlow(strandB[i].x, strandB[i].y, strandB[i].depth, this.colorB, 30);
        }

        const drawables = [];

        for (let i = 0; i < pairs.length; i += 2) {
            const p = pairs[i];
            const avgDepth = (p.a.depth + p.b.depth) / 2;
            drawables.push({ type: 'pair', data: p, depth: avgDepth });
        }

        for (let i = 0; i < strandA.length - 1; i++) {
            const avgDepthA = (strandA[i].depth + strandA[i + 1].depth) / 2;
            const avgDepthB = (strandB[i].depth + strandB[i + 1].depth) / 2;
            drawables.push({ type: 'strandA', index: i, depth: avgDepthA });
            drawables.push({ type: 'strandB', index: i, depth: avgDepthB });
        }

        for (let i = 0; i < strandA.length; i++) {
            drawables.push({ type: 'nodeA', index: i, depth: strandA[i].depth });
            drawables.push({ type: 'nodeB', index: i, depth: strandB[i].depth });
        }

        drawables.sort((a, b) => a.depth - b.depth);

        drawables.forEach(d => {
            if (d.type === 'pair') {
                this.drawBasePair(d.data.a.x, d.data.a.y, d.data.b.x, d.data.b.y, d.data.a.depth, d.data.b.depth);
            } else if (d.type === 'strandA') {
                const i = d.index;
                const p1 = strandA[i], p2 = strandA[i + 1];
                this.drawStrandCurve([p1, p2], this.colorA);
            } else if (d.type === 'strandB') {
                const i = d.index;
                const p1 = strandB[i], p2 = strandB[i + 1];
                this.drawStrandCurve([p1, p2], this.colorB);
            } else if (d.type === 'nodeA') {
                const p = strandA[d.index];
                this.drawStrandSegment(p.x, p.y, p.depth, this.colorA, this.strandWidth * 0.7);
            } else if (d.type === 'nodeB') {
                const p = strandB[d.index];
                this.drawStrandSegment(p.x, p.y, p.depth, this.colorB, this.strandWidth * 0.7);
            }
        });

        this.drawParticles();
        this.drawGrain();

        this.time += this.speed;
        requestAnimationFrame(() => this.animate());
    }
}

class BrainPixel {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.time = 0;
        this.animate();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const cx = this.width / 2;
        const cy = this.height / 2;
        const pixelSize = 4;

        for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {

            const r = 80 + Math.sin(angle * 3 + this.time) * 15 + Math.cos(angle * 5) * 10;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r * 0.85;
            const alpha = 0.4 + Math.sin(angle + this.time) * 0.3;
            this.ctx.fillStyle = `rgba(0, 153, 153, ${alpha})`;
            const sx = Math.round(x / pixelSize) * pixelSize;
            const sy = Math.round(y / pixelSize) * pixelSize;
            this.ctx.fillRect(sx, sy, pixelSize, pixelSize);
        }

        for (let i = 0; i < 8; i++) {
            const startAngle = (i / 8) * Math.PI * 2;
            for (let t = 0; t < 1; t += 0.02) {
                const angle = startAngle + t * 0.8;
                const r = t * 70 + Math.sin(t * 6 + this.time + i) * 10;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r * 0.85;
                const alpha = 0.15 + Math.sin(t * 4 + this.time) * 0.1;
                this.ctx.fillStyle = `rgba(230, 126, 34, ${alpha})`;
                const sx = Math.round(x / pixelSize) * pixelSize;
                const sy = Math.round(y / pixelSize) * pixelSize;
                this.ctx.fillRect(sx, sy, pixelSize, pixelSize);
            }
        }

        const pulseR = 90 + Math.sin(this.time * 2) * 20;
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
            const x = cx + Math.cos(angle) * pulseR;
            const y = cy + Math.sin(angle) * pulseR * 0.85;
            const alpha = 0.1 + Math.sin(this.time * 2) * 0.05;
            this.ctx.fillStyle = `rgba(230, 126, 34, ${alpha})`;
            const sx = Math.round(x / pixelSize) * pixelSize;
            const sy = Math.round(y / pixelSize) * pixelSize;
            this.ctx.fillRect(sx, sy, pixelSize - 1, pixelSize - 1);
        }

        this.time += 0.015;
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {

    new DNAHelix('dna-canvas', {
        speed: 0.012,
        radius: 95,
        numPoints: 70,
        strandWidth: 9,
        grainIntensity: 0.06,
        colorA: { r: 230, g: 126, b: 34 },
        colorB: { r: 0, g: 153, b: 153 }
    });

    new DNAHelix('dna-canvas-2', {
        speed: 0.015,
        radius: 85,
        numPoints: 65,
        strandWidth: 8,
        isDark: false,
        grainIntensity: 0.08,
        colorA: { r: 230, g: 126, b: 34 },
        colorB: { r: 0, g: 153, b: 153 }
    });

    new BrainPixel('brain-canvas');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                animateCounter(el, target);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

    function animateCounter(el, target) {
        let current = 0;
        const duration = 2000;
        const stepTime = 16;
        const steps = duration / stepTime;
        const increment = target / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = Math.round(current).toLocaleString();
        }, stepTime);
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });

    const themeToggle = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');

    window.setTheme = function(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            if (moonIcon) moonIcon.classList.add('hidden');
            if (sunIcon) sunIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            if (moonIcon) moonIcon.classList.remove('hidden');
            if (sunIcon) sunIcon.classList.add('hidden');
        }
        localStorage.setItem('theme', theme);
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            setTheme(isDark ? 'light' : 'dark');
        });
    }

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            navbar.classList.add('shadow-xl', 'glass');
        } else {
            navbar.classList.remove('shadow-xl', 'glass');
        }
        lastScroll = currentScroll;
    });

    const particlesContainer = document.getElementById('hero-particles');
    if (particlesContainer) {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.width = (Math.random() * 4 + 2) + 'px';
            particle.style.height = particle.style.width;
            particlesContainer.appendChild(particle);
        }
    }
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileBtn && mobileMenu) {
        let menuOpen = false;
        const spans = mobileBtn.querySelectorAll('span');

        function toggleMenu() {
            menuOpen = !menuOpen;
            if (menuOpen) {
                mobileMenu.classList.remove('hidden');
                mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
                mobileMenu.style.opacity = '1';
                spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(3px, -3px)';
                spans[2].style.width = '1.5rem';
            } else {
                mobileMenu.style.maxHeight = '0px';
                mobileMenu.style.opacity = '0';
                setTimeout(() => mobileMenu.classList.add('hidden'), 300);
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                spans[2].style.width = '1rem';
            }
        }

        mobileBtn.addEventListener('click', toggleMenu);

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (menuOpen) toggleMenu();
            });
        });
    }

    const translations = {
        en: {
            nav_home: "Home",
            nav_packages: "Packages",
            nav_booking: "Book Now",
            nav_tools: "Health Tools",
            nav_login: "Portal",
            nav_request: "Request Consultation",
            hero_badge: "Trusted Worldwide",
            hero_title_1: "We Pioneer",
            hero_title_2: "Breakthroughs",
            hero_title_3: "in Healthcare",
            hero_desc: "At Siemens Healthineers, we enable healthcare providers worldwide to deliver high-quality, efficient patient care through advanced medical technology.",
            hero_btn_request: "Request Consultation",
            hero_btn_explore: "Explore Products",
            stat_1: "Countries Served",
            stat_2: "Systems Installed",
            stat_3: "R&D Engineers",
            testimonial: "\"Behind every one of these <strong class='text-white'>20,000+</strong> scans is a human story.\"",
            clinical_badge: "Discovery",
            clinical_title: "Pioneering breakthroughs are in our",
            clinical_desc: "From AI-powered diagnostics to precision imaging, our relentless pursuit of innovation drives every breakthrough in modern healthcare.",
            clinical_stat1: "AI Algorithms",
            clinical_stat2: "Patents Filed",
            products_title1: "Empowering Care.",
            products_title2: "Sustaining the Future.",
            products_desc: "Technology is only as powerful as the lives it touches.",
            tab_1: "01 Patient Focus",
            tab_2: "02 Innovation",
            tab_3: "03 Sustainability",
            tab1_title: "Patient Focus",
            tab1_desc: "At Siemens Healthineers, we design our diagnostic and therapeutic solutions around the human experience. By streamlining clinical workflows and reducing scan times, we help eliminate patient anxiety while empowering healthcare professionals to focus on what truly matters: delivering compassionate, personalized care.",
            tab1_feat1: "Reduced scan times by up to 50%",
            tab1_feat2: "AI-enhanced image clarity",
            tab1_feat3: "Ergonomic patient-first design",
            tab2_title: "Innovation at Scale",
            tab2_desc: "Our R&D investment of over €2 billion annually fuels groundbreaking advancements. From photon-counting CT to AI-native workflows, we push the boundaries of what's possible in healthcare technology.",
            tab3_title: "Sustainable Healthcare",
            tab3_desc: "We commit to reducing our environmental footprint while expanding access to care. Our energy-efficient systems and circular economy initiatives lead the way toward a greener healthcare industry.",
            platform_badge: "Platform Overview",
            platform_title: "How Our Website",
            platform_title2: "Works",
            platform_desc: "Our interactive platform is designed to provide seamless access to advanced healthcare technology. Explore our tools, discover cutting-edge solutions, and learn how we empower medical professionals with data-driven insights.",
            platform_step1_title: "1. Interactive Exploration",
            platform_step1_desc: "Navigate through our dynamic 3D modules and interactive data visualizations. Our intuitive interface allows you to explore complex medical technologies, MRI systems, and product specifications with ease.",
            platform_step2_title: "2. AI-Powered Insights",
            platform_step2_desc: "Leverage our built-in AI demonstrations to see automated diagnostics in action. We provide real-time feedback and intelligent recommendations to showcase how our technology enhances clinical decision-making.",
            platform_step3_title: "3. Seamless Connectivity",
            platform_step3_desc: "Connect directly with our specialists and request detailed product guides through our integrated contact portal. Our support network ensures you have the resources you need, exactly when you need them.",
            transform_title: "Transform Your Diagnostic Imaging Capabilities",
            transform_desc: "Empower your healthcare facility with Siemens MRI technology designed for precision imaging, intelligent workflows, and exceptional patient comfort.",
            transform_btn1: "Request a Product Guide",
            transform_btn2: "Contact Our Specialists",
            contact_title: "Ready to Transform Healthcare?",
            contact_desc: "Partner with us to bring cutting-edge medical technology to your facility. Our team is ready to help you take the next step.",
            contact_name: "Full Name",
            contact_age: "Age",
            contact_email: "Email Address",
            contact_opt_def: "What would you like to ask about?",
            contact_opt1: "General Health Care",
            contact_opt2: "Weight Conditioning",
            contact_opt3: "Medical Equipment",
            contact_opt4: "Book a Consultation",
            contact_opt5: "Other Inquiry",
            contact_submit: "Submit Inquiry",
            footer_desc: "Pioneering breakthroughs in healthcare. For everyone. Everywhere. sustainably. We enable healthcare providers to increase value by empowering them on their journey towards expanding precision medicine, transforming care delivery, and improving patient experience.",
            footer_desc_2: "We are committed to building a world where healthcare has no limits. Through our circular economy initiatives and energy-efficient systems, we lead the way toward a greener healthcare industry while ensuring access to life-saving technology for underserved communities.",
            footer_hq: "Global Headquarters: Erlangen, Germany. | Serving healthcare providers in over 180 countries.",
            footer_prod: "Products",
            footer_prod1: "MRI Systems",
            footer_prod2: "CT Scanners",
            footer_prod3: "Ultrasound",
            footer_prod4: "X-ray",
            footer_conn: "Connect",
            footer_conn_desc: "Join our global community and stay updated with the latest breakthroughs in medical technology.",
            footer_copy: "&copy; 2026 Siemens Healthineers. All rights reserved.",
            footer_link1: "Privacy",
            footer_link2: "Terms",
            footer_link3: "Cookies",
            pkg_title: "Premium Checkup Packages",
            pkg_desc: "Choose the right path for your health journey with our specialized screening packages enabled by advanced technology.",
            pkg_basic_title: "Basic Wellness",
            pkg_basic_desc: "Essential screenings for a baseline understanding of your current health status.",
            pkg_exec_title: "Executive Plus",
            pkg_exec_desc: "Advanced imaging and comprehensive lab tests for complete peace of mind.",
            pkg_cardiac_title: "Cardiac Excellence",
            pkg_cardiac_desc: "Specialized focus on heart health using advanced Siemens MRI/CT cardiac imaging.",
            pkg_prep_title: "Preparation Guidelines",
            book_title: "Select Your Package",
            book_desc: "Choose the health screening that fits your needs.",
            book_date_title: "Pick a Date",
            book_date_desc: "Select your preferred appointment date and time.",
            book_info_title: "Your Information",
            book_info_desc: "We'll use these details to confirm your appointment.",
            book_success_title: "Booking Confirmed!",
            book_success_desc: "Your appointment has been scheduled. A confirmation email has been sent to your inbox.",
            tools_title: "Health Assessment Tools",
            tools_desc: "Quickly assess your health status and find the right checkup plan for you.",
            bmi_title: "BMI Calculator",
            quiz_title: "Smart Package Finder",
            quiz_desc: "Answer a few questions and our AI will recommend the most suitable checkup package for you.",
            portal_title: "Welcome Back, Alex",
            portal_subtitle: "Manage your health records and appointments in one place.",
            portal_stat1: "Upcoming Appt",
            portal_stat2: "Last Checkup",
            portal_stat3: "Health Score",
            loc_title: "Our Clinics",
            loc_desc: "Find the nearest Valerium Healthcare certified diagnostic center near you.",
            loc_count: "Clinics Found",
            loc_sort: "Sort:",
            loc_nearest: "Nearest",
            loc_load_more: "Load More",
            placeholder_loc: "Jakarta, Indonesia",
            placeholder_search: "Search clinics...",
            nav_loc: "Locations",
            btn_detail: "Detail",
            btn_select: "Book",
            loc_jakarta: "Valerium Jakarta",
            loc_open: "Open",
            loc_hours: "Open until 20:00",
            feat_rad: "Radiology",
            feat_lab: "Lab Test",
            feat_vac: "Vaccination",
            ai_assistant: "Ask our AI Specialist",
            prep_fasting: "Fasting",
            prep_fasting_desc: "Fast for at least 8-10 hours. Only plain water is allowed.",
            prep_med: "Medication",
            prep_med_desc: "Inform us of any regular medication you are taking.",
            prep_attire: "Attire",
            prep_attire_desc: "Wear loose, comfortable clothing. Bring sports shoes for ECG.",
            prep_history: "History",
            prep_history_desc: "Bring any previous medical reports or radiology scans.",
            btn_prev: "Previous",
            btn_next: "Next Step",
            btn_confirm: "Confirm Booking",
            btn_back_home: "Back to Home",
            book_label_date: "Appointment Date",
            book_label_time: "Preferred Time",
            pkg_basic_desc_short: "General screening & consultation",
            pkg_exec_desc_short: "Advanced imaging & lab tests",
            pkg_cardiac_desc_short: "Specialized heart screening",
            contact_phone: "Phone Number",
            contact_special: "Special Requirements (Optional)",
            success_step_1: "STEP 1",
            success_flow_1: "Check your email for the confirmation details.",
            success_step_2: "STEP 2",
            success_flow_2: "Our coordinator will contact you within 24 hours.",
            success_step_3: "STEP 3",
            success_flow_3: "Visit our clinic on the scheduled date."
        },
        id: {
            nav_home: "Beranda",
            nav_packages: "Paket",
            nav_booking: "Pesan Sekarang",
            nav_tools: "Alat Kesehatan",
            nav_login: "Portal",
            nav_request: "Minta Konsultasi",
            hero_badge: "Dipercaya di Seluruh Dunia",
            hero_title_1: "Kami Memelopori",
            hero_title_2: "Terobosan Baru",
            hero_title_3: "dalam Perawatan Kesehatan",
            hero_desc: "Di Siemens Healthineers, kami memberdayakan penyedia layanan kesehatan di seluruh dunia untuk memberikan perawatan pasien berkualitas tinggi dan efisien melalui teknologi medis mutakhir.",
            hero_btn_request: "Minta Konsultasi",
            hero_btn_explore: "Jelajahi Produk",
            stat_1: "Negara Dilayani",
            stat_2: "Sistem Terpasang",
            stat_3: "Insinyur R&D",
            testimonial: "\"Di balik setiap <strong class='text-white'>20.000+</strong> pemindaian ini ada kisah manusia.\"",
            clinical_badge: "Penemuan",
            clinical_title: "Terobosan perintis ada dalam",
            clinical_desc: "Dari diagnostik berbasis AI hingga pencitraan presisi, upaya tanpa henti kami untuk berinovasi mendorong setiap terobosan dalam perawatan kesehatan modern.",
            clinical_stat1: "Algoritma AI",
            clinical_stat2: "Paten Terdaftar",
            products_title1: "Memberdayakan Perawatan.",
            products_title2: "Menjaga Masa Depan.",
            products_desc: "Teknologi hanya sekuat dampaknya pada kehidupan manusia.",
            tab_1: "01 Fokus pada Pasien",
            tab_2: "02 Inovasi",
            tab_3: "03 Keberlanjutan",
            tab1_title: "Fokus pada Pasien",
            tab1_desc: "Di Siemens Healthineers, kami merancang solusi diagnostik dan terapeutik dengan mengutamakan pengalaman manusia. Dengan menyederhanakan alur kerja klinis dan mengurangi waktu pemindaian, kami membantu menghilangkan kecemasan pasien dan memberdayakan tenaga medis untuk fokus pada hal yang paling penting: memberikan perawatan yang penuh kasih dan personal.",
            tab1_feat1: "Waktu pemindaian berkurang hingga 50%",
            tab1_feat2: "Kejernihan gambar yang ditingkatkan AI",
            tab1_feat3: "Desain ergonomis mengutamakan pasien",
            tab2_title: "Inovasi Skala Besar",
            tab2_desc: "Investasi R&D kami lebih dari &euro;2 miliar setiap tahun mendorong kemajuan yang luar biasa. Dari CT photon-counting hingga alur kerja berbasis AI, kami mendobrak batas-batas kemungkinan teknologi perawatan kesehatan.",
            tab3_title: "Kesehatan Berkelanjutan",
            tab3_desc: "Kami berkomitmen untuk mengurangi jejak lingkungan kami sembari memperluas akses perawatan. Sistem hemat energi dan inisiatif ekonomi sirkular kami memimpin menuju industri kesehatan yang lebih hijau.",
            platform_badge: "Ikhtisar Platform",
            platform_title: "Cara Kerja",
            platform_title2: "Website Kami",
            platform_desc: "Platform interaktif kami dirancang untuk memberikan akses lancar ke teknologi perawatan kesehatan mutakhir. Jelajahi alat kami, temukan solusi terkini, dan pelajari bagaimana kami memberdayakan tenaga medis dengan wawasan berbasis data.",
            platform_step1_title: "1. Eksplorasi Interaktif",
            platform_step1_desc: "Navigasi melalui modul 3D dinamis dan visualisasi data interaktif kami. Antarmuka intuitif kami memungkinkan Anda menjelajahi teknologi medis yang kompleks, sistem MRI, dan spesifikasi produk dengan mudah.",
            platform_step2_title: "2. Wawasan Berbasis AI",
            platform_step2_desc: "Manfaatkan demonstrasi AI bawaan kami untuk melihat diagnostik otomatis beraksi. Kami memberikan umpan balik waktu nyata dan rekomendasi cerdas untuk menunjukkan bagaimana teknologi kami meningkatkan pengambilan keputusan klinis.",
            platform_step3_title: "3. Konektivitas Tanpa Batas",
            platform_step3_desc: "Terhubung langsung dengan spesialis kami dan minta panduan produk yang detail melalui portal kontak terpadu kami. Jaringan dukungan kami memastikan Anda memiliki sumber daya yang Anda butuhkan, tepat saat Anda membutuhkannya.",
            transform_title: "Ubah Kemampuan Pencitraan Diagnostik Anda",
            transform_desc: "Berdayakan fasilitas kesehatan Anda dengan teknologi MRI Siemens yang dirancang untuk pencitraan presisi, alur kerja cerdas, dan kenyamanan pasien yang luar biasa.",
            transform_btn1: "Minta Panduan Produk",
            transform_btn2: "Hubungi Spesialis Kami",
            contact_title: "Siap Mengubah Layanan Kesehatan?",
            contact_desc: "Bermitralah dengan kami untuk menghadirkan teknologi medis mutakhir ke fasilitas Anda. Tim kami siap membantu Anda mengambil langkah berikutnya.",
            contact_name: "Nama Lengkap",
            contact_age: "Umur",
            contact_email: "Alamat Email",
            contact_opt_def: "Apa yang ingin Anda tanyakan?",
            contact_opt1: "Kesehatan Umum",
            contact_opt2: "Pengaturan Berat Badan",
            contact_opt3: "Peralatan Medis",
            contact_opt4: "Pesan Konsultasi",
            contact_opt5: "Pertanyaan Lainnya",
            contact_submit: "Kirim Permintaan",
            footer_desc: "Mempelopori terobosan dalam kesehatan. Untuk semua orang. Di mana saja. Secara berkelanjutan. Kami memberdayakan penyedia layanan kesehatan untuk meningkatkan nilai dengan mendukung perjalanan mereka dalam memperluas kedokteran presisi, mentransformasi penyampaian perawatan, dan meningkatkan pengalaman pasien.",
            footer_desc_2: "Kami berkomitmen untuk membangun dunia di mana layanan kesehatan tidak memiliki batas. Melalui inisiatif ekonomi sirkular dan sistem hemat energi, kami memimpin jalan menuju industri kesehatan yang lebih ramah lingkungan sembari memastikan akses ke teknologi penyelamat jiwa bagi komunitas yang membutuhkan.",
            footer_hq: "Kantor Pusat Global: Erlangen, Jerman. | Melayani penyedia layanan kesehatan di lebih dari 180 negara.",
            footer_prod: "Produk",
            footer_prod1: "Sistem MRI",
            footer_prod2: "Pemindai CT",
            footer_prod3: "USG",
            footer_prod4: "Sinar-X",
            footer_conn: "Terhubung",
            footer_conn_desc: "Bergabunglah dengan komunitas global kami dan dapatkan informasi terbaru tentang terobosan teknologi medis.",
            footer_copy: "&copy; 2026 Siemens Healthineers. Hak Cipta Dilindungi Undang-Undang.",
            footer_link1: "Privasi",
            footer_link2: "Syarat",
            footer_link3: "Cookie",
            pkg_title: "Paket Pemeriksaan Premium",
            pkg_desc: "Pilih jalur yang tepat untuk perjalanan kesehatan Anda dengan paket skrining khusus kami yang didukung oleh teknologi canggih.",
            pkg_basic_title: "Kesehatan Dasar",
            pkg_basic_desc: "Skrining esensial untuk pemahaman dasar tentang status kesehatan Anda saat ini.",
            pkg_exec_title: "Eksekutif Plus",
            pkg_exec_desc: "Pencitraan canggih dan tes laboratorium komprehensif untuk ketenangan pikiran sepenuhnya.",
            pkg_cardiac_title: "Keunggulan Jantung",
            pkg_cardiac_desc: "Fokus khusus pada kesehatan jantung menggunakan pencitraan jantung MRI/CT Siemens yang canggih.",
            pkg_prep_title: "Panduan Persiapan",
            book_title: "Pilih Paket Anda",
            book_desc: "Pilih skrining kesehatan yang sesuai dengan kebutuhan Anda.",
            book_date_title: "Pilih Tanggal",
            book_date_desc: "Pilih tanggal dan waktu janji temu yang Anda inginkan.",
            book_info_title: "Informasi Anda",
            book_info_desc: "Kami akan menggunakan detail ini untuk mengonfirmasi janji temu Anda.",
            book_success_title: "Pemesanan Dikonfirmasi!",
            book_success_desc: "Janji temu Anda telah dijadwalkan. Email konfirmasi telah dikirim ke kotak masuk Anda.",
            tools_title: "Alat Penilaian Kesehatan",
            tools_desc: "Nilai status kesehatan Anda dengan cepat dan temukan rencana pemeriksaan yang tepat untuk Anda.",
            bmi_title: "Kalkulator BMI",
            quiz_title: "Pencari Paket Pintar",
            quiz_desc: "Jawab beberapa pertanyaan dan AI kami akan merekomendasikan paket pemeriksaan yang paling cocok untuk Anda.",
            portal_title: "Selamat Datang Kembali, Alex",
            portal_subtitle: "Kelola catatan kesehatan dan janji temu Anda di satu tempat.",
            portal_stat1: "Janji Mendatang",
            portal_stat2: "Pemeriksaan Terakhir",
            portal_stat3: "Skor Kesehatan",
            loc_title: "Klinik Kami",
            loc_desc: "Temukan pusat diagnostik bersertifikat Valerium Healthcare terdekat dari Anda.",
            loc_count: "Klinik Ditemukan",
            loc_sort: "Urutkan:",
            loc_nearest: "Terdekat",
            loc_load_more: "Muat Lebih Banyak",
            placeholder_loc: "Jakarta, Indonesia",
            placeholder_search: "Cari klinik...",
            nav_loc: "Lokasi",
            btn_detail: "Detail",
            btn_select: "Pesan",
            loc_jakarta: "Valerium Jakarta",
            loc_open: "Buka",
            loc_hours: "Buka sampai 20:00",
            feat_rad: "Radiologi",
            feat_lab: "Tes Lab",
            feat_vac: "Vaksinasi",
            ai_assistant: "Tanya Spesialis AI kami",
            prep_fasting: "Puasa",
            prep_fasting_desc: "Berpuasa setidaknya 8-10 jam. Hanya air putih yang diperbolehkan.",
            prep_med: "Obat-obatan",
            prep_med_desc: "Informasikan kepada kami tentang obat rutin apa pun yang Anda minum.",
            prep_attire: "Pakaian",
            prep_attire_desc: "Kenakan pakaian yang longgar dan nyaman. Bawa sepatu olahraga untuk EKG.",
            prep_history: "Riwayat",
            prep_history_desc: "Bawa laporan medis atau hasil radiologi sebelumnya.",
            btn_prev: "Sebelumnya",
            btn_next: "Langkah Selanjutnya",
            btn_confirm: "Konfirmasi Pemesanan",
            btn_back_home: "Kembali ke Beranda",
            book_label_date: "Tanggal Janji Temu",
            book_label_time: "Waktu yang Diinginkan",
            pkg_basic_desc_short: "Skrining & konsultasi umum",
            pkg_exec_desc_short: "Pencitraan canggih & tes lab",
            pkg_cardiac_desc_short: "Skrining jantung khusus",
            contact_phone: "Nomor Telepon",
            contact_special: "Persyaratan Khusus (Opsional)",
            success_step_1: "LANGKAH 1",
            success_flow_1: "Periksa email Anda untuk detail konfirmasi.",
            success_step_2: "LANGKAH 2",
            success_flow_2: "Koordinator kami akan menghubungi Anda dalam 24 jam.",
            success_step_3: "LANGKAH 3",
            success_flow_3: "Kunjungi klinik kami pada tanggal yang dijadwalkan."
        }
    };

    let currentLang = localStorage.getItem('language') || 'en';

    window.setLanguage = function(lang) {
        currentLang = lang;
        localStorage.setItem('language', lang);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            if (!el.style.transition) {
                el.style.transition = 'opacity 0.3s ease';
            }
        });

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang] && translations[lang][key]) {
                el.setAttribute('placeholder', translations[lang][key]);
            }
        });

        document.querySelectorAll('.lang-toggle').forEach(btn => {
            if (btn.classList.contains('w-full')) {
                btn.textContent = lang === 'en' ? 'Switch to Indonesian (ID)' : 'Ubah ke Bahasa Inggris (EN)';
            } else {
                btn.textContent = lang === 'en' ? 'ID' : 'EN';
            }
        });
    }

    document.querySelectorAll('.lang-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const newLang = currentLang === 'en' ? 'id' : 'en';
            setLanguage(newLang);
        });
    });

    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -80px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });

    
    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0px, 0px)';
        });
    });

    if (currentLang === 'id') {
        setLanguage('id');
    }
});
