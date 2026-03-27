document.addEventListener('DOMContentLoaded', () => {
    // --- 1. LENIS SMOOTH SCROLL ---
    let lenis;
    const isMobile = window.innerWidth <= 768;

    if (!isMobile && typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 0.9,
            touchMultiplier: 1.8,
        });

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
    }

    // --- 2. THE UNFOLD (Loader) ---
    const loader = document.getElementById('loader');
    const loaderTop = loader.querySelector('.loader-top');
    const loaderBottom = loader.querySelector('.loader-bottom');
    const loaderContent = loader.querySelector('.loader-content');
    const loaderCounter = document.getElementById('loader-counter');
    const loaderProgress = document.getElementById('loader-progress');
    const skipBtn = document.getElementById('loader-skip');

    let count = 0;
    // Non-linear counter: rushes 0-35, eases 35-85, sprints 85-100
    const counterInterval = setInterval(() => {
        let increment = 1;
        if (count < 35) increment = 3;
        else if (count >= 35 && count < 85) increment = 1;
        else if (count >= 85) increment = 4;

        count += increment;
        if (count >= 100) {
            count = 100;
            clearInterval(counterInterval);
            setTimeout(unfold, 400);
        }
        loaderCounter.textContent = count.toString().padStart(3, '0');
        loaderProgress.style.width = `${count}%`;
    }, 25);

    function unfold() {
        const tl = gsap.timeline({
            onComplete: () => {
                loader.style.display = 'none';
                initAnimations();
            }
        });

        tl.to(loaderContent, { opacity: 0, scale: 0.94, duration: 0.35, ease: "power2.in" })
          .to(loaderTop, { y: "-100%", duration: 0.8, ease: "power3.inOut" }, "+=0.2")
          .to(loaderBottom, { y: "100%", duration: 0.8, ease: "power3.inOut" }, "<")
          .set(loader, { pointerEvents: "none" });
    }

    skipBtn.addEventListener('click', () => {
        clearInterval(counterInterval);
        unfold();
    });

    // --- 3. GSAP SPLITTEXT & REVEALS ---
    function initAnimations() {
        gsap.registerPlugin(SplitText, ScrollTrigger, CustomEase);
        CustomEase.create("reveal", "0.625, 0.05, 0, 1"); // The Osmo Ease

        // Masked Line Reveals
        document.querySelectorAll('.reveal-text').forEach(el => {
            const split = new SplitText(el, { type: "lines", mask: "lines" });
            gsap.from(split.lines, {
                yPercent: 110,
                duration: 0.85,
                stagger: 0.09,
                ease: "reveal",
                scrollTrigger: {
                    trigger: el,
                    start: "top 82%",
                    toggleActions: "play none none none"
                }
            });
        });

        // Cascade Reveals (Eyebrows, CTAs)
        document.querySelectorAll('.reveal-cascade').forEach(el => {
            gsap.from(el, {
                y: 16,
                opacity: 0,
                duration: 0.6,
                ease: "reveal",
                scrollTrigger: {
                    trigger: el,
                    start: "top 88%"
                }
            });
        });

        // Word-opacity Scrub (Body Text)
        if (typeof SplitType !== 'undefined') {
            document.querySelectorAll('.scrub-reveal').forEach(el => {
                const split = new SplitType(el, { types: 'words' });
                gsap.from(split.words, {
                    opacity: 0.15,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 80%",
                        end: "bottom 50%",
                        scrub: 0.5
                    }
                });
            });
        }

        // Signature Animation
        document.querySelectorAll('.sig-dot').forEach((dot, i) => {
            gsap.to(dot, {
                opacity: 1,
                scale: 1,
                duration: 0.6,
                delay: i * 0.1,
                ease: "elastic.out(1.2, 0.5)",
                scrollTrigger: {
                    trigger: dot,
                    start: "top 95%"
                }
            });
        });

        // --- FIX 6 — ADDITIVE PARALLAX ---
        
        // 6a — Services Section Depth
        gsap.to('.services-label', {
            yPercent: -18,
            ease: 'none',
            scrollTrigger: {
                trigger: '.services-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2
            }
        });
        gsap.to('.services-subtext', {
            yPercent: -10,
            ease: 'none',
            scrollTrigger: {
                trigger: '.services-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5
            }
        });

        // 6b — Process Section Diagonal Depth
        gsap.to('.process-col--left', {
            yPercent: -12,
            ease: 'none',
            scrollTrigger: {
                trigger: '.process-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.0
            }
        });
        gsap.to('.process-col--right', {
            yPercent: -8,
            ease: 'none',
            scrollTrigger: {
                trigger: '.process-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.4
            }
        });

        // 6c — Demos Section Separation
        gsap.to('.demo-item:nth-child(1)', {
            yPercent: -14,
            ease: 'none',
            scrollTrigger: {
                trigger: '.demos-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.0
            }
        });
        gsap.to('.demo-item:nth-child(2)', {
            yPercent: -8,
            ease: 'none',
            scrollTrigger: {
                trigger: '.demos-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.4
            }
        });

        // 6d — Closer Section Drift
        gsap.to('.closer-headline', {
            yPercent: -20,
            ease: 'none',
            scrollTrigger: {
                trigger: '.closer-section',
                start: 'top bottom',
                end: 'center top',
                scrub: 0.8
            }
        });
        gsap.to('.closer-body', {
            yPercent: -10,
            ease: 'none',
            scrollTrigger: {
                trigger: '.closer-section',
                start: 'top bottom',
                end: 'center top',
                scrub: 1.2
            }
        });

        // 6e — Marquee Label Float
        gsap.to('.marquee-label', {
            yPercent: -30,
            ease: 'none',
            scrollTrigger: {
                trigger: '#partners',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.8
            }
        });
    }

    if (isMobile) initAnimations();

    // --- 4. CUSTOM CURSOR ---
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    const ringText = ring.querySelector('.cursor-text');
    
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    const LERP = 0.09;

    if (!isMobile) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            gsap.set(dot, { x: mouseX - 5, y: mouseY - 5 });

            // Dark Section Detection (Foolproof)
            const target = document.elementFromPoint(mouseX, mouseY);
            if (target?.closest('[data-dark-nav]')) {
                document.body.classList.add('dark-cursor');
            } else {
                document.body.classList.remove('dark-cursor');
            }
        });

        function animateRing() {
            ringX += (mouseX - ringX) * LERP;
            ringY += (mouseY - ringY) * LERP;
            gsap.set(ring, { x: ringX - 22, y: ringY - 22 });
            requestAnimationFrame(animateRing);
        }
        animateRing();

        // Cursor States
        document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
            el.addEventListener('mouseenter', () => {
                const type = el.getAttribute('data-cursor');
                if (type === 'cta') {
                    gsap.to(dot, { scale: 0, duration: 0.2 });
                    gsap.to(ring, { width: 72, height: 72, background: "rgba(200,68,26,0.1)", borderColor: "#C8441A", duration: 0.3 });
                    ringText.style.opacity = '1';
                } else if (type === 'card') {
                    gsap.to(dot, { scale: 0, duration: 0.2 });
                    gsap.to(ring, { width: 60, height: 60, background: "rgba(200,68,26,0.06)", borderColor: "#C8441A", duration: 0.3 });
                } else {
                    gsap.to(dot, { scale: 0.6, duration: 0.2 });
                    gsap.to(ring, { width: 28, height: 28, borderColor: "rgba(200,68,26,0.5)", duration: 0.2 });
                }
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(dot, { scale: 1, duration: 0.2 });
                gsap.to(ring, { width: 44, height: 44, background: "transparent", borderColor: "rgba(200,68,26,0.35)", duration: 0.3 });
                ringText.style.opacity = '0';
            });
        });

        document.addEventListener('mouseleave', () => {
            gsap.to([dot, ring], { opacity: 0, duration: 0.3 });
        });
        document.addEventListener('mouseenter', () => {
            gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
        });

        if (window.matchMedia('(pointer: coarse)').matches) {
            dot.style.display = 'none';
            ring.style.display = 'none';
            document.documentElement.style.cursor = 'auto';
            document.querySelectorAll('*').forEach(el => {
                el.style.cursor = '';
            });
        }
    }

    // --- 5. MAGNETIC ELEMENTS ---
    function magneticElement(el) {
        const PULL_STRENGTH = 0.38;
        const RADIUS = 80;

        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < RADIUS) {
                gsap.to(el, {
                    x: dx * PULL_STRENGTH,
                    y: dy * PULL_STRENGTH,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        });

        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                x: 0, y: 0,
                duration: 0.6,
                ease: 'elastic.out(1, 0.4)'
            });
        });
    }
    document.querySelectorAll('[data-magnetic]').forEach(magneticElement);

    // --- 6. 3D TILT ON CARDS ---
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 25;
            const rotateY = (centerX - x) / 20;
            
            gsap.to(card, { 
                rotateX: rotateX, 
                rotateY: rotateY, 
                duration: 0.5, 
                ease: "power2.out"
            });

            const px = (x / rect.width) * 100;
            const py = (y / rect.height) * 100;
            card.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(200,68,26,0.05), #FFFFFF 65%)`;
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "cubic-bezier(0.34,1.56,0.64,1)" });
            card.style.background = '#FFFFFF';
        });
    });

    // --- 7. AUDIO WAVEFORM VISUALIZER ---
    const visualWaveform = document.querySelector('.visual-waveform');
    if (visualWaveform) {
        const barCount = 32;
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        visualWaveform.appendChild(g);
        const bars = [];
        for(let i=0; i<barCount; i++) {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            const x = (i / barCount) * 100 + "%";
            rect.setAttribute("x", x);
            rect.setAttribute("width", "2");
            rect.setAttribute("fill", "rgba(0,0,0,0.12)");
            rect.setAttribute("y", "40");
            rect.setAttribute("height", "20");
            rect.setAttribute("rx", "1");
            g.appendChild(rect);
            bars.push(rect);
        }

        function animateHeroWave() {
            const time = Date.now() / 300;
            const isActive = (Math.sin(time / 4) > 0.5); // "Active" state every 6s back and forth
            bars.forEach((bar, i) => {
                let h;
                if (isActive) {
                    h = Math.abs(Math.sin(time + i * 0.2)) * 60 + 20;
                    bar.setAttribute("fill", "#C8441A");
                } else {
                    h = Math.abs(Math.sin(time + i * 0.1)) * 15 + 15;
                    bar.setAttribute("fill", "rgba(0,0,0,0.12)");
                }
                bar.setAttribute("y", 50 - h/2);
                bar.setAttribute("height", h);
            });
            requestAnimationFrame(animateHeroWave);
        }
        animateHeroWave();
    }

    // --- 8. DEMO PLAYER (Web Audio API) ---
    const players = document.querySelectorAll('.audio-player');
    players.forEach(player => {
        const btn = player.querySelector('.play-btn');
        const waveform = player.querySelector('.waveform');
        const durationText = player.querySelector('.duration-text');
        const audio = new Audio(player.dataset.audio);
        const barCount = 48;
        const bars = [];

        for(let i=0; i<barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'waveform-bar';
            waveform.appendChild(bar);
            bars.push(bar);
        }

        let context, analyser, src, data;

        audio.addEventListener('timeupdate', () => {
            const m = Math.floor(audio.currentTime / 60);
            const s = Math.floor(audio.currentTime % 60);
            durationText.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        });

        audio.addEventListener('ended', () => {
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="white"/></svg>';
            bars.forEach(b => { b.style.height = '20%'; b.style.background = 'rgba(244,239,230,0.18)'; });
        });

        btn.addEventListener('click', () => {
            if (!context) {
                context = new (window.AudioContext || window.webkitAudioContext)();
                analyser = context.createAnalyser();
                src = context.createMediaElementSource(audio);
                src.connect(analyser);
                analyser.connect(context.destination);
                analyser.fftSize = 256;
                data = new Uint8Array(analyser.frequencyBinCount);
            }

            if (audio.paused) {
                document.querySelectorAll('audio').forEach(a => {
                    a.pause();
                    // Reset other buttons
                    const otherBtn = a.parentElement?.querySelector('.play-btn');
                    if(otherBtn) otherBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="white"/></svg>';
                });
                audio.play();
                btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="white"/></svg>';
                renderFrame();
            } else {
                audio.pause();
                btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="white"/></svg>';
            }
        });

        function renderFrame() {
            if (!audio.paused) {
                analyser.getByteFrequencyData(data);
                for(let i=0; i<barCount; i++) {
                    const h = (data[i] / 255) * 80 + 20;
                    bars[i].style.height = `${h}%`;
                    bars[i].style.background = 'rgba(244,239,230,0.85)';
                }
                requestAnimationFrame(renderFrame);
            } else {
                bars.forEach(b => { b.style.height = '20%'; b.style.background = 'rgba(244,239,230,0.18)'; });
            }
        }
    });

    // --- 9. LIVE COUNTER & MODAL ---
    const autoCounter = document.getElementById('auto-counter');
    let baseCount = 841;
    setInterval(() => {
        baseCount += 1;
        gsap.to(autoCounter, { y: -12, opacity: 0, duration: 0.25, onComplete: () => {
            autoCounter.textContent = `${baseCount} TODAY`;
            gsap.fromTo(autoCounter, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25 });
        }});
    }, 3200);

    const modal = document.getElementById('modal-overlay');
    const openBtns = document.querySelectorAll('.open-modal');
    const closeBtn = document.getElementById('modal-close');
    const form = document.getElementById('discoveryForm');
    const success = document.getElementById('modal-success');

    openBtns.forEach(b => b.addEventListener('click', () => {
        modal.style.display = 'flex';
        gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.4 });
        gsap.fromTo(modal.querySelector('.modal-panel'), { y: 28, scale: 0.96 }, { y: 0, scale: 1, duration: 0.4, ease: "reveal" });
        if (lenis) lenis.stop();
    }));

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

    function closeModal() {
        gsap.to(modal, { opacity: 0, duration: 0.3, onComplete: () => { modal.style.display = 'none'; }});
        if (lenis) lenis.start();
        setTimeout(() => { form.style.display = 'block'; success.style.display = 'none'; form.reset(); }, 400);
    }

    // Form Loading State + API Connection
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            form.classList.add('is-loading');

            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: `${formData.get('country_code')} ${formData.get('phone')}`,
                query: formData.get('situation') || 'No details provided'
            };

            try {
                const response = await fetch('http://localhost:3000/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (result.success) {
                    form.classList.remove('is-loading');
                    form.style.display = 'none';
                    success.style.display = 'block';
                } else {
                    throw new Error(result.error || 'Failed to send email');
                }
            } catch (error) {
                console.error('Submission error:', error);
                form.classList.remove('is-loading');
                alert('Connection error: Make sure the server is running on port 3000.');
            }
        });
    }
    
    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });
});
