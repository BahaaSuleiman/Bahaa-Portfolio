/* ============================================
   PORTFOLIO WEBSITE — MAIN SCRIPT
   Clean, well-commented, beginner-friendly
   ============================================ */

(function () {
  'use strict';

  /* ------------------------------------------
     DOM REFERENCES
     ------------------------------------------ */
  const html = document.documentElement;
  const clearSketchBtn = document.getElementById('clearSketch');
  const saveSketchBtn = document.getElementById('saveSketch');
  const themeToggle = document.getElementById('themeToggle');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('overlay');
  const navbar = document.getElementById('navbar');
  const heroCanvas = document.getElementById('heroCanvas');
  const sketchCanvas = document.getElementById('sketchCanvas');
  const modal = document.getElementById('projectModal');
  const modalClose = document.getElementById('modalClose');
  const modalContent = document.getElementById('modalContent');
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');


  /* ------------------------------------------
     1. THEME TOGGLE (Dark / Light)
     ------------------------------------------ */

  function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      html.setAttribute('data-theme', saved);
    }
  }

  function toggleTheme() {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  initTheme();
  themeToggle.addEventListener('click', toggleTheme);


  /* ------------------------------------------
     2. MOBILE NAVIGATION
     ------------------------------------------ */

  function openMobileMenu() {
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('active');
    mobileMenu.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent scroll
  }

  function closeMobileMenu() {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('active');
    mobileMenu.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    const isOpen = mobileMenu.classList.contains('active');
    isOpen ? closeMobileMenu() : openMobileMenu();
  });

  // Close menu when clicking overlay
  overlay.addEventListener('click', closeMobileMenu);

  // Close menu when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close menu on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMobileMenu();
      closeModal();
    }
  });


  /* ------------------------------------------
     3. NAVBAR — SCROLL BEHAVIOR
     Add a solid background on scroll
     ------------------------------------------ */

  let lastScroll = 0;

  window.addEventListener('scroll', function () {
    const scrollY = window.scrollY;

    // Add shadow when scrolled
    if (scrollY > 50) {
      navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
      navbar.style.boxShadow = 'none';
    }

    lastScroll = scrollY;
  }, { passive: true });


  /* ------------------------------------------
     4. HERO CANVAS — ANIMATED BACKGROUND
     Lightweight particle animation
     ------------------------------------------ */

  function initHeroCanvas() {
    if (!heroCanvas) return;

    const ctx = heroCanvas.getContext('2d');
    const sketchCtx = sketchCanvas.getContext('2d');
    const heroSection = document.getElementById('hero');
    let width, height;
    let particles = [];
    let animationId;

    // Mouse state for particle repulsion and sketching
    let mouse = { x: -1000, y: -1000, active: false };
    let mouseDown = false;
    let strokes = [];
    let currentStroke = null;

    // --- Persist permanent strokes in localStorage ---

    function saveStrokes() {
      const permanent = strokes.filter(function (s) { return s.permanent; });
      try {
        localStorage.setItem('sketch', JSON.stringify(permanent));
      } catch (_) { /* quota exceeded — silently ignore */ }
    }

    function loadStrokes() {
      try {
        const raw = localStorage.getItem('sketch');
        if (raw) {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved)) {
            saved.forEach(function (s) { s.permanent = true; });
            strokes = saved;
          }
        }
      } catch (_) { /* corrupt data — start fresh */ }
    }

    loadStrokes();

    // Responsive canvas sizing (both canvases)
    function resize() {
      width = heroCanvas.width = heroCanvas.offsetWidth;
      height = heroCanvas.height = heroCanvas.offsetHeight;
      sketchCanvas.width = width;
      sketchCanvas.height = height;
    }

    // Create particles with base velocities for smooth repulsion return
    function createParticles() {
      particles = [];
      const count = Math.min(80, Math.floor((width * height) / 15000));

      for (let i = 0; i < count; i++) {
        const vx = (Math.random() - 0.5) * 0.5;
        const vy = (Math.random() - 0.5) * 0.5;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: vx,
          vy: vy,
          baseVx: vx,
          baseVy: vy,
          radius: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
    }

    // --- Mouse event handlers ---

    heroSection.addEventListener('mousemove', function (e) {
      const rect = heroCanvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;

      const now = Date.now();

      // Start new stroke only after a genuine pause (time-based only,
      // no distance check — fast 240 Hz movement must not break strokes)
      if (currentStroke && currentStroke.points.length > 0) {
        const last = currentStroke.points[currentStroke.points.length - 1];
        if (now - last.t > 300) {
          currentStroke = null;
        }
      }

      if (currentStroke) {
        currentStroke.points.push({ x: mouse.x, y: mouse.y, t: now });
      } else {
        currentStroke = {
          points: [{ x: mouse.x, y: mouse.y, t: now }],
          permanent: mouseDown,
        };
        strokes.push(currentStroke);
      }
    });

    heroSection.addEventListener('mousedown', function (e) {
      if (e.button === 0 && !e.target.closest('a, button, input, textarea')) {
        mouseDown = true;
        currentStroke = {
          points: [{ x: mouse.x, y: mouse.y, t: Date.now() }],
          permanent: true,
        };
        strokes.push(currentStroke);
      }
    });

    heroSection.addEventListener('mouseup', function (e) {
      if (e.button === 0) {
        mouseDown = false;
        currentStroke = null;
      }
    });

    heroSection.addEventListener('mouseleave', function () {
      mouse.active = false;
      currentStroke = null;
    });

    // --- Touch event handlers (mobile / tablet drawing) ---

    var touchDrawing = false; // true when current touch is a draw gesture

    heroSection.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;

      var touch = e.touches[0];
      var scrollZone = 60; // px from left edge reserved for scrolling

      // Let taps on interactive elements (links, buttons) work normally
      if (touch.target.closest('a, button, input, textarea')) {
        touchDrawing = false;
        return;
      }

      if (touch.clientX < scrollZone || touch.clientX > window.innerWidth - scrollZone) {
        // Finger near left or right edge — let the browser scroll normally
        touchDrawing = false;
        return;
      }

      // Claim the touch so the browser doesn't scroll
      e.preventDefault();

      // Start drawing
      touchDrawing = true;
      var rect = heroCanvas.getBoundingClientRect();
      mouse.x = touch.clientX - rect.left;
      mouse.y = touch.clientY - rect.top;
      mouse.active = true;
      mouseDown = true;

      currentStroke = {
        points: [{ x: mouse.x, y: mouse.y, t: Date.now() }],
        permanent: true,
      };
      strokes.push(currentStroke);
    }, { passive: false });

    heroSection.addEventListener('touchmove', function (e) {
      if (!touchDrawing || e.touches.length !== 1) return;

      e.preventDefault(); // block scroll while drawing

      var touch = e.touches[0];
      var rect = heroCanvas.getBoundingClientRect();
      mouse.x = touch.clientX - rect.left;
      mouse.y = touch.clientY - rect.top;
      mouse.active = true;

      var now = Date.now();
      if (currentStroke) {
        currentStroke.points.push({ x: mouse.x, y: mouse.y, t: now });
      }
    }, { passive: false }); // passive:false needed for preventDefault

    heroSection.addEventListener('touchend', function () {
      if (touchDrawing) {
        mouseDown = false;
        mouse.active = false;
        currentStroke = null;
        touchDrawing = false;
      }
    });

    heroSection.addEventListener('touchcancel', function () {
      mouseDown = false;
      mouse.active = false;
      currentStroke = null;
      touchDrawing = false;
    });

    // --- Sketch stroke rendering ---

    function renderStrokes() {
      const now = Date.now();
      const isDark = html.getAttribute('data-theme') === 'dark';
      const strokeColor = isDark ? '255, 255, 255' : '0, 0, 0';
      const fadeTime = 2000;     // 2 seconds total lifetime
      const fadeDuration = 1800;  // fade over almost the full duration for a smooth trail

      // Remove fully expired temporary strokes
      strokes = strokes.filter(function (stroke) {
        if (stroke.permanent) return true;
        if (stroke.points.length === 0) return false;
        const lastTime = stroke.points[stroke.points.length - 1].t;
        return now - lastTime < fadeTime;
      });

      // Trim old expired points from temporary strokes
      strokes.forEach(function (stroke) {
        if (!stroke.permanent) {
          while (stroke.points.length > 0 && now - stroke.points[0].t >= fadeTime) {
            stroke.points.shift();
          }
        }
      });

      sketchCtx.lineCap = 'round';
      sketchCtx.lineJoin = 'round';

      strokes.forEach(function (stroke) {
        const pts = stroke.points;
        if (pts.length < 2) return;

        const isPermanent = stroke.permanent;

        // Calculate average speed for consistent line width across the stroke
        var totalDist = 0;
        for (var i = 1; i < pts.length; i++) {
          var dx = pts[i].x - pts[i - 1].x;
          var dy = pts[i].y - pts[i - 1].y;
          totalDist += Math.sqrt(dx * dx + dy * dy);
        }
        var avgSpeed = totalDist / (pts.length - 1);
        var lineWidth = isPermanent
          ? Math.max(1.5, Math.min(3.5, 5 - avgSpeed * 0.08))
          : Math.max(1, Math.min(2.5, 4 - avgSpeed * 0.1));

        // Single opacity per stroke
        var opacity = isPermanent ? 0.6 : 0.4;
        if (!isPermanent) {
          var newestAge = now - pts[pts.length - 1].t;
          var oldestAge = now - pts[0].t;
          var age = (newestAge + oldestAge) / 2;
          if (age >= fadeTime) return;
          if (age > fadeTime - fadeDuration) {
            opacity *= (fadeTime - age) / fadeDuration;
          }
        }

        // Subtle glow for permanent strokes
        if (isPermanent) {
          sketchCtx.shadowColor = isDark
            ? 'rgba(255, 255, 255, 0.25)'
            : 'rgba(0, 0, 0, 0.12)';
          sketchCtx.shadowBlur = 6;
        } else {
          sketchCtx.shadowColor = 'transparent';
          sketchCtx.shadowBlur = 0;
        }

        sketchCtx.strokeStyle = 'rgba(' + strokeColor + ', ' + opacity + ')';
        sketchCtx.lineWidth = lineWidth;

        // Draw smooth curve using quadratic bezier through midpoints
        sketchCtx.beginPath();
        sketchCtx.moveTo(pts[0].x, pts[0].y);

        if (pts.length === 2) {
          sketchCtx.lineTo(pts[1].x, pts[1].y);
        } else {
          // First segment: line to midpoint of first two points
          var midX = (pts[0].x + pts[1].x) / 2;
          var midY = (pts[0].y + pts[1].y) / 2;
          sketchCtx.lineTo(midX, midY);

          // Middle segments: quadratic bezier using actual points as controls
          for (var i = 1; i < pts.length - 1; i++) {
            var cpX = pts[i].x;
            var cpY = pts[i].y;
            midX = (pts[i].x + pts[i + 1].x) / 2;
            midY = (pts[i].y + pts[i + 1].y) / 2;
            sketchCtx.quadraticCurveTo(cpX, cpY, midX, midY);
          }

          // Last segment: line to final point
          var last = pts[pts.length - 1];
          sketchCtx.lineTo(last.x, last.y);
        }

        sketchCtx.stroke();
      });

      // Reset shadow state
      sketchCtx.shadowColor = 'transparent';
      sketchCtx.shadowBlur = 0;
    }

    // --- Animation loop ---

    function animate() {
      ctx.clearRect(0, 0, width, height);
      sketchCtx.clearRect(0, 0, width, height);

      const isDark = html.getAttribute('data-theme') === 'dark';
      const particleColor = isDark ? '0, 229, 255' : '0, 102, 255';
      const lineColor = isDark ? '0, 229, 255' : '0, 102, 255';

      // Update and draw particles
      particles.forEach(function (p, i) {
        // Mouse repulsion — particles flee from cursor
        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const distSq = mdx * mdx + mdy * mdy;
          const repRadius = 120;

          if (distSq < repRadius * repRadius && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / repRadius) * 3;
            p.vx += (mdx / dist) * force;
            p.vy += (mdy / dist) * force;
          }
        }

        // Ease velocity back to base drift
        p.vx += (p.baseVx - p.vx) * 0.05;
        p.vy += (p.baseVy - p.vy) * 0.05;

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + particleColor + ', ' + p.opacity + ')';
        ctx.fill();

        // Draw connections to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(' + lineColor + ', ' + (0.15 * (1 - dist / 120)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      // Draw sketch strokes on overlay canvas
      renderStrokes();

      animationId = requestAnimationFrame(animate);
    }

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function startCanvas() {
      if (prefersReducedMotion.matches) {
        // Draw a single static frame
        resize();
        createParticles();
        const isDark = html.getAttribute('data-theme') === 'dark';
        const particleColor = isDark ? '0, 229, 255' : '0, 102, 255';
        particles.forEach(function (p) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + particleColor + ', ' + p.opacity + ')';
          ctx.fill();
        });
        return;
      }

      resize();
      createParticles();
      animate();
    }

    // Clear sketch button
    if (clearSketchBtn) {
      clearSketchBtn.addEventListener('click', function () {
        strokes.length = 0;
        currentStroke = null;
        localStorage.removeItem('sketch');
      });
    }

    // Save sketch button — exports canvas as PNG download
    if (saveSketchBtn) {
      saveSketchBtn.addEventListener('click', function () {
        var exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        var expCtx = exportCanvas.getContext('2d');

        // Draw background color + sketch only (no particles)
        var isDark = html.getAttribute('data-theme') === 'dark';
        expCtx.fillStyle = isDark ? '#0f0f0f' : '#ffffff';
        expCtx.fillRect(0, 0, width, height);
        expCtx.drawImage(sketchCanvas, 0, 0);

        // Trigger download
        var link = document.createElement('a');
        link.download = 'sketch.png';
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
      });
    }

    // Auto-save permanent strokes when leaving the page
    window.addEventListener('beforeunload', saveStrokes);

    // Handle resize
    window.addEventListener('resize', function () {
      cancelAnimationFrame(animationId);
      startCanvas();
    });

    startCanvas();
  }

  initHeroCanvas();


  /* ------------------------------------------
     5. SCROLL REVEAL ANIMATIONS
     Fade in elements as they enter viewport
     ------------------------------------------ */

  function initScrollReveal() {
    // Mark elements for animation
    const targets = document.querySelectorAll(
      '.card-3d, .card-2d, .about-grid, .contact-grid, .section-title, .section-subtitle'
    );

    targets.forEach(function (el) {
      el.classList.add('fade-in');
    });

    // Use IntersectionObserver for performance
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target); // Only animate once
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -40px 0px',
        }
      );

      targets.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback: show everything immediately
      targets.forEach(function (el) {
        el.classList.add('visible');
      });
    }
  }

  initScrollReveal();


  /* ------------------------------------------
     6. PROJECT MODAL (Fullscreen Viewer)
     ------------------------------------------ */

  function openModal(card) {
    // Get info from the clicked card
    const title = card.querySelector('h3')
      ? card.querySelector('h3').textContent
      : 'Project';
    const desc = card.querySelector('p')
      ? card.querySelector('p').textContent
      : '';

    // Check if the card has a real image
    const img = card.querySelector('img');
    var previewHTML;

    if (img) {
      // Show the actual image in the modal
      previewHTML = '<div class="modal-preview">' +
        '<img src="' + escapeHTML(img.src) + '" alt="' + escapeHTML(img.alt || title) + '">' +
        '</div>';
    } else {
      // Fallback: gradient placeholder for cards without images
      var bgStyle = card.querySelector('.card-2d__placeholder')
        ? card.querySelector('.card-2d__placeholder').getAttribute('style')
        : 'background: linear-gradient(135deg, var(--bg-secondary), var(--bg-card));';
      previewHTML = '<div class="modal-preview" style="' + bgStyle + '">' +
        '<span>Full Preview Area</span>' +
        '</div>';
    }

    modalContent.innerHTML =
      previewHTML +
      '<div class="modal-body">' +
      '  <h2>' + escapeHTML(title) + '</h2>' +
      '  <p>' + escapeHTML(desc) + '</p>' +
      '</div>';

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus the close button for accessibility
    modalClose.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Escape HTML to prevent XSS
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Attach click handlers to project cards
  document.querySelectorAll('.card-3d, .card-2d').forEach(function (card) {
    card.addEventListener('click', function () {
      openModal(card);
    });

    // Also open on Enter key
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        openModal(card);
      }
    });
  });

  modalClose.addEventListener('click', closeModal);

  // Close modal when clicking outside content
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });


  /* ------------------------------------------
     7. CONTACT FORM
     Basic client-side validation
     ------------------------------------------ */

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const message = document.getElementById('contactMessage').value.trim();

      // Simple validation
      if (!name || !email || !message) {
        formStatus.textContent = 'Please fill in all fields.';
        formStatus.className = 'form-status error';
        return;
      }

      // Basic email format check
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        formStatus.textContent = 'Please enter a valid email address.';
        formStatus.className = 'form-status error';
        return;
      }

      // Success feedback (no backend — replace with your form handler)
      formStatus.textContent = 'Message sent successfully! (Demo — connect a backend to make this functional)';
      formStatus.className = 'form-status success';
      contactForm.reset();

      // Clear message after 5 seconds
      setTimeout(function () {
        formStatus.textContent = '';
        formStatus.className = 'form-status';
      }, 5000);
    });
  }


  /* ------------------------------------------
     8. SMOOTH SCROLL for anchor links
     (Enhanced browser-native scroll)
     ------------------------------------------ */

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'));
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });


  /* ------------------------------------------
     9. LAZY LOADING (for future images)
     Native lazy loading is set via HTML attr.
     This adds a fallback for older browsers.
     ------------------------------------------ */

  if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading — nothing to do
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  } else if ('IntersectionObserver' in window) {
    // Fallback: use IntersectionObserver
    var imgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          imgObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      imgObserver.observe(img);
    });
  }

})();
