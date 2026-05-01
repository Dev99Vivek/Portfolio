/* ================================================================
   DEVIL Portfolio — enhanced front-end (vanilla HTML/CSS/JS)
   Backend: FastAPI at `${window.BACKEND_URL}/api/*`
   ================================================================ */

(() => {
  const API = `${window.BACKEND_URL || ''}/api`;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ----------------- VISITOR ID ----------------- */
  function getVisitorId() {
    let vid = localStorage.getItem('devil_vid');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('devil_vid', vid);
    }
    return vid;
  }
  const visitorId = getVisitorId();

  /* ----------------- YEAR ----------------- */
  $('#year').textContent = new Date().getFullYear();

  /* ----------------- THEME ----------------- */
  const rootEl = document.documentElement;
  const themeBtn = $('#themeToggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    rootEl.setAttribute('data-theme', savedTheme);
    themeBtn.textContent = savedTheme === 'pixelverse' ? 'Cyberpunk' : 'Pixelverse';
  }
  themeBtn.addEventListener('click', () => {
    const cur = rootEl.getAttribute('data-theme') || 'cyberpunk';
    const next = cur === 'cyberpunk' ? 'pixelverse' : 'cyberpunk';
    rootEl.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeBtn.textContent = next === 'pixelverse' ? 'Cyberpunk' : 'Pixelverse';
    sfx('click');
    unlockAchievement('theme_switch', '🎨 Color Override', 'Flipped the visual matrix');
  });

  /* ----------------- LOADER ----------------- */
  const loader = $('#loader');
  const dots = $('#dots');
  const ping = $('#ping');
  let dotCount = 1;
  const dotInterval = setInterval(() => {
    dotCount = (dotCount % 3) + 1;
    dots.textContent = '.'.repeat(dotCount);
    ping.textContent = Math.floor(25 + Math.random() * 40);
  }, 400);
  window.addEventListener('load', () => {
    setTimeout(() => {
      clearInterval(dotInterval);
      loader.style.transition = 'opacity 600ms ease';
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 620);
    }, 1600);
  });

  /* ----------------- SOUND FX ----------------- */
  let audioCtx = null;
  let sfxOn = localStorage.getItem('sfx') !== 'off';
  let musicOn = false;
  const sfxBtn = $('#soundToggle');
  const musicBtn = $('#musicToggle');
  if (sfxOn) sfxBtn.classList.add('active');

  function ensureCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function sfx(type = 'click') {
    if (!sfxOn) return;
    try {
      const ctx = ensureCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === 'click') { o.type = 'square'; o.frequency.setValueAtTime(640, now); o.frequency.exponentialRampToValueAtTime(320, now + 0.08); g.gain.setValueAtTime(0.06, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1); }
      else if (type === 'success') { o.type = 'sine'; o.frequency.setValueAtTime(440, now); o.frequency.linearRampToValueAtTime(880, now + 0.18); g.gain.setValueAtTime(0.07, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22); }
      else if (type === 'error') { o.type = 'sawtooth'; o.frequency.setValueAtTime(200, now); o.frequency.linearRampToValueAtTime(80, now + 0.18); g.gain.setValueAtTime(0.07, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22); }
      else if (type === 'unlock') { [523.25, 659.25, 783.99].forEach((f, i) => { const oo = ctx.createOscillator(); const gg = ctx.createGain(); oo.connect(gg); gg.connect(ctx.destination); oo.type = 'triangle'; oo.frequency.setValueAtTime(f, now + i * 0.08); gg.gain.setValueAtTime(0.05, now + i * 0.08); gg.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.2); oo.start(now + i * 0.08); oo.stop(now + i * 0.08 + 0.22); }); return; }
      else if (type === 'type') { o.type = 'square'; o.frequency.setValueAtTime(1200 + Math.random() * 400, now); g.gain.setValueAtTime(0.02, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04); o.start(now); o.stop(now + 0.05); return; }
      o.start(now); o.stop(now + 0.25);
    } catch (e) { /* noop */ }
  }
  sfxBtn.addEventListener('click', () => {
    sfxOn = !sfxOn;
    localStorage.setItem('sfx', sfxOn ? 'on' : 'off');
    sfxBtn.classList.toggle('active', sfxOn);
    if (sfxOn) sfx('success');
  });

  // Synthwave loop using oscillators
  let musicNodes = null;
  function startMusic() {
    const ctx = ensureCtx();
    const master = ctx.createGain(); master.gain.value = 0.06; master.connect(ctx.destination);
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 1800; filt.connect(master);
    const pad1 = ctx.createOscillator(); pad1.type = 'sawtooth'; pad1.frequency.value = 110;
    const pad2 = ctx.createOscillator(); pad2.type = 'sawtooth'; pad2.frequency.value = 164.81; pad2.detune.value = -7;
    const padG = ctx.createGain(); padG.gain.value = 0.15;
    pad1.connect(padG); pad2.connect(padG); padG.connect(filt);
    pad1.start(); pad2.start();
    // arp
    const arpFreqs = [220, 261.63, 329.63, 392, 329.63, 261.63];
    let step = 0;
    const arpTimer = setInterval(() => {
      if (!musicOn) return;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = arpFreqs[step % arpFreqs.length];
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.connect(g); g.connect(filt);
      o.start(); o.stop(ctx.currentTime + 0.3);
      step++;
    }, 280);
    musicNodes = { pad1, pad2, padG, master, arpTimer };
  }
  function stopMusic() {
    if (!musicNodes) return;
    try { musicNodes.pad1.stop(); musicNodes.pad2.stop(); } catch {}
    clearInterval(musicNodes.arpTimer);
    musicNodes.master.disconnect();
    musicNodes = null;
  }
  musicBtn.addEventListener('click', () => {
    musicOn = !musicOn;
    musicBtn.classList.toggle('active', musicOn);
    if (musicOn) { startMusic(); sfx('success'); unlockAchievement('music_on', '🎵 Synthwave Online', 'Tuned into the frequency'); }
    else stopMusic();
  });

  /* ----------------- CURSOR ----------------- */
  const dot = $('#cursorDot'); const ring = $('#cursorRing');
  let mx = -100, my = -100, rx = -100, ry = -100;
  window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`; });
  function raf() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(raf);
  }
  raf();
  $$('a,button,.card,.slide,.tilt,.chip-btn,.cta,.btn,.input,.guest-card').forEach(el => {
    el.addEventListener('pointerenter', () => ring.classList.add('hover'));
    el.addEventListener('pointerleave', () => ring.classList.remove('hover'));
  });

  /* ----------------- PARTICLES BG ----------------- */
  const pCanvas = $('#particles');
  const pctx = pCanvas.getContext('2d');
  let pW = 0, pH = 0, particles = [];
  function resizeParticles() {
    pW = pCanvas.width = window.innerWidth;
    pH = pCanvas.height = window.innerHeight;
    const count = Math.min(90, Math.floor((pW * pH) / 22000));
    particles = Array.from({ length: count }).map(() => ({
      x: Math.random() * pW, y: Math.random() * pH,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.4,
      hue: Math.random() < 0.5 ? 270 : 190,
    }));
  }
  resizeParticles();
  window.addEventListener('resize', resizeParticles);
  function drawParticles() {
    pctx.clearRect(0, 0, pW, pH);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > pW) p.vx *= -1;
      if (p.y < 0 || p.y > pH) p.vy *= -1;
      pctx.beginPath();
      pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pctx.fillStyle = `hsla(${p.hue}, 100%, 70%, 0.75)`;
      pctx.shadowBlur = 8; pctx.shadowColor = pctx.fillStyle;
      pctx.fill();
    }
    pctx.shadowBlur = 0;
    // connect nearby
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120) {
          pctx.strokeStyle = `rgba(138,92,255,${0.25 * (1 - Math.sqrt(d2) / 120)})`;
          pctx.lineWidth = 0.6;
          pctx.beginPath(); pctx.moveTo(a.x, a.y); pctx.lineTo(b.x, b.y); pctx.stroke();
        }
      }
    }
    requestAnimationFrame(drawParticles);
  }
  drawParticles();

  /* ----------------- REVEAL ON SCROLL ----------------- */
  const revealIo = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); revealIo.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => revealIo.observe(el));

  /* ----------------- SKILL METERS ----------------- */
  const meters = [...document.querySelectorAll('.meter')];
  const mIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const value = Math.max(0, Math.min(100, Number(entry.target.dataset.value) || 0));
        entry.target.querySelector('span').style.width = value + '%';
        mIo.unobserve(entry.target);
      }
    });
  }, { threshold: .4 });
  meters.forEach(m => mIo.observe(m));

  /* ----------------- LIGHTBOX ----------------- */
  const lb = $('#lightbox');
  const lbContent = $('#lightboxContent');
  const closeBtn = $('#lightboxClose');
  function openLightbox(type, src) {
    lb.classList.add('open');
    [...lbContent.querySelectorAll('img,video')].forEach(n => n.remove());
    let el;
    if (type === 'video') { el = document.createElement('video'); el.src = src; el.controls = true; el.autoplay = true; el.playsInline = true; }
    else { el = document.createElement('img'); el.src = src; el.alt = 'Gallery preview'; }
    lbContent.insertBefore(el, closeBtn);
    closeBtn.focus();
    sfx('click');
  }
  function closeLightbox() { lb.classList.remove('open'); }
  closeBtn.addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* ----------------- GALLERY ----------------- */
  const track = $('#track');
  const slides = [...track.querySelectorAll('.slide')];
  slides.forEach((s, i) => {
    s.dataset.idx = i;
    s.addEventListener('click', () => openLightbox(s.dataset.type, s.dataset.src));
  });
  const btnPrev = $('#prev'); const btnNext = $('#next');
  function slideBy(dir = 1) {
    const w = slides[0]?.getBoundingClientRect().width || 320;
    track.scrollBy({ left: dir * (w + 12), behavior: 'smooth' });
    sfx('click');
  }
  btnPrev.addEventListener('click', () => slideBy(-1));
  btnNext.addEventListener('click', () => slideBy(1));
  let isDown = false, startX = 0, scrollLeft = 0;
  track.addEventListener('pointerdown', (e) => { isDown = true; startX = e.clientX; scrollLeft = track.scrollLeft; track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointermove', (e) => { if (!isDown) return; const dx = e.clientX - startX; track.scrollLeft = scrollLeft - dx; });
  track.addEventListener('pointerup', () => { isDown = false; });
  track.addEventListener('pointercancel', () => { isDown = false; });

  /* ----------------- TILT ----------------- */
  const tilts = document.querySelectorAll('.tilt');
  tilts.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const cx = e.clientX - r.left, cy = e.clientY - r.top;
      const rx = ((cy / r.height) - .5) * -8;
      const ry = ((cx / r.width) - .5) * 10;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ----------------- BUTTON SFX ----------------- */
  $$('button, .btn, .btn-ghost, .chip-btn, .cta').forEach(b => b.addEventListener('click', () => sfx('click')));

  /* ----------------- ACHIEVEMENTS ----------------- */
  const achContainer = $('#achievements');
  const unlockedSet = new Set(JSON.parse(localStorage.getItem('achievements') || '[]'));
  function unlockAchievement(id, title, sub) {
    if (unlockedSet.has(id)) return;
    unlockedSet.add(id);
    localStorage.setItem('achievements', JSON.stringify([...unlockedSet]));
    const el = document.createElement('div');
    el.className = 'achievement';
    el.dataset.testid = `achievement-${id}`;
    el.innerHTML = `<div class="ach-icon">🏆</div><div><div class="ach-title">${title}</div><div class="ach-sub">${sub}</div></div>`;
    achContainer.appendChild(el);
    sfx('unlock');
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 500); }, 4200);
  }

  // Total achievements trigger
  window.addEventListener('scroll', () => {
    const scrolled = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
    if (scrolled > 0.95) unlockAchievement('scroll_end', '🏁 Deep Dive', 'Reached end of portfolio');
  }, { passive: true });

  setTimeout(() => unlockAchievement('arrived', '👾 First Contact', 'Welcome to DEVIL\u2019s lobby'), 2400);

  /* ----------------- BACKEND API ----------------- */
  async function apiPost(path, body) {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  async function apiGet(path) {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // Initial visit ping + online/visits poll
  apiPost('/visit', { visitor_id: visitorId, path: location.pathname }).catch(() => {});
  setInterval(() => { apiPost('/visit', { visitor_id: visitorId, path: location.pathname }).catch(() => {}); }, 45000);

  async function refreshHud() {
    try {
      const stats = await apiGet('/stats');
      $('#hudOnline').textContent = stats.online_now;
      $('#hudVisits').textContent = stats.total_visits;
      $('#hudCmds').textContent = stats.commands_run;
    } catch (e) { /* noop */ }
  }
  refreshHud();
  setInterval(refreshHud, 15000);

  /* ----------------- CONTACT FORM ----------------- */
  const contactForm = $('#contactForm');
  const contactStatus = $('#contactStatus');
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    contactStatus.textContent = '> transmitting...';
    contactStatus.classList.remove('error');
    const payload = {
      name: $('#name').value.trim(),
      email: $('#email').value.trim(),
      message: $('#message').value.trim(),
    };
    try {
      await apiPost('/contact', payload);
      contactStatus.textContent = '✔ Message sent. GG! I\u2019ll reach back on Discord vibes.';
      contactForm.reset();
      sfx('success');
      unlockAchievement('first_msg', '📡 Signal Sent', 'Contacted DEVIL');
    } catch (err) {
      contactStatus.textContent = '✖ Transmission failed. Try again.';
      contactStatus.classList.add('error');
      sfx('error');
    }
  });

  /* ----------------- GUESTBOOK ----------------- */
  const guestForm = $('#guestForm');
  const guestWall = $('#guestWall');
  const guestCount = $('#guestCount');

  function renderGuest(entry, prepend = false) {
    const el = document.createElement('div');
    el.className = 'guest-card';
    el.setAttribute('data-color', entry.color || 'cyan');
    el.dataset.testid = 'guestbook-card';
    const time = new Date(entry.created_at).toLocaleString();
    el.innerHTML = `
      <span class="gc-bar"></span>
      <div class="gc-handle">@${escapeHtml(entry.handle)}</div>
      <div class="gc-msg">${escapeHtml(entry.message)}</div>
      <div class="gc-time">${time}</div>
    `;
    if (prepend) guestWall.prepend(el); else guestWall.appendChild(el);
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  async function loadGuestbook() {
    try {
      const list = await apiGet('/guestbook');
      guestWall.innerHTML = '';
      list.forEach(e => renderGuest(e));
      guestCount.textContent = list.length;
    } catch (e) {
      guestWall.innerHTML = '<p style="color:var(--muted)">Signal wall offline. Retry soon.</p>';
    }
  }
  loadGuestbook();

  guestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const handle = $('#guestHandle').value.trim();
    const message = $('#guestMessage').value.trim();
    const color = $('#guestColor').value;
    if (!handle || !message) return;
    try {
      const entry = await apiPost('/guestbook', { handle, message, color });
      renderGuest(entry, true);
      guestCount.textContent = Number(guestCount.textContent || 0) + 1;
      guestForm.reset();
      sfx('success');
      unlockAchievement('guestbook', '✍️ Signal Broadcasted', 'Posted on the wall');
    } catch (err) {
      sfx('error');
    }
  });

  /* ================================================================
     TERMINAL CONSOLE
     ================================================================ */
  const terminalForm = $('#terminalForm');
  const terminalInput = $('#command');
  const terminalOutput = $('#terminalOutput');

  const history = [];
  let historyIndex = -1;

  function tOut(html, cls = '') {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.innerHTML = html;
    terminalOutput.appendChild(p);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    return p;
  }

  async function typeLine(text, delay = 18, cls = '') {
    return new Promise(resolve => {
      const line = document.createElement('p');
      if (cls) line.className = cls;
      terminalOutput.appendChild(line);
      let i = 0;
      const interval = setInterval(() => {
        line.textContent += text[i];
        i++;
        if (i % 3 === 0) sfx('type');
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        if (i >= text.length) { clearInterval(interval); resolve(line); }
      }, delay);
    });
  }

  const COMMANDS = {
    help: 'list available commands',
    'show projects': 'browse projects directory',
    'glitch.dev': 'INITIATE glitch + devil mode',
    stats: 'fetch live server stats',
    visitors: 'show unique visitors',
    online: 'show who is here now',
    whoami: 'identify this terminal session',
    clear: 'clear the console',
    date: 'current server time',
    social: 'print social handles',
    matrix: 'start matrix rain',
    'matrix stop': 'stop matrix rain',
    snake: 'play arcade snake (WASD / arrows)',
    'top commands': 'show most-run commands',
    guestbook: 'jump to signal wall',
    contact: 'jump to contact form',
    history: 'show command history',
    banner: 'print DEVIL banner',
    coffee: '☕',
  };

  async function cmdHelp() {
    await typeLine('Available commands:', 10, 'sys');
    for (const [k, v] of Object.entries(COMMANDS)) {
      tOut(`  <code>${escapeHtml(k)}</code> — <span style="color:#a5b0d6">${escapeHtml(v)}</span>`);
    }
  }

  const projects = [
    { name: 'Neon HUD Dashboard', url: '#projects' },
    { name: 'Night Drive Clip', url: '#projects' },
    { name: 'Pixel Landing', url: '#projects' },
  ];

  async function cmdShowProjects() {
    await typeLine('✔ Projects Available:', 15, 'ok');
    for (const p of projects) await typeLine(`  • ${p.name} — ${p.url}`, 10, '');
  }

  async function cmdStats() {
    await typeLine('Fetching uplink stats...', 12, 'sys');
    try {
      const s = await apiGet('/stats');
      tOut(`  visits_total     : <b>${s.total_visits}</b>`, 'ok');
      tOut(`  unique_visitors  : <b>${s.unique_visitors}</b>`, 'ok');
      tOut(`  online_now       : <b>${s.online_now}</b>`, 'ok');
      tOut(`  messages         : <b>${s.messages}</b>`, 'ok');
      tOut(`  guestbook        : <b>${s.guestbook_entries}</b>`, 'ok');
      tOut(`  commands_run     : <b>${s.commands_run}</b>`, 'ok');
    } catch { await typeLine('Uplink failed.', 10, 'err'); }
  }
  async function cmdVisitors() {
    try { const s = await apiGet('/stats'); await typeLine(`Unique visitors: ${s.unique_visitors} • Total hits: ${s.total_visits}`, 10, 'ok'); }
    catch { await typeLine('Uplink failed.', 10, 'err'); }
  }
  async function cmdOnline() {
    try { const o = await apiGet('/online'); await typeLine(`Operatives online now: ${o.online}`, 10, 'ok'); }
    catch { await typeLine('Uplink failed.', 10, 'err'); }
  }
  async function cmdWhoami() {
    await typeLine(`guest_${visitorId.slice(-6)}@devil.sys`, 10, 'ok');
    await typeLine(`ua: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`, 10, 'sys');
  }
  async function cmdTopCommands() {
    try {
      const s = await apiGet('/stats');
      if (!s.top_commands.length) { await typeLine('No commands logged yet.', 10, 'sys'); return; }
      await typeLine('Top commands:', 10, 'sys');
      s.top_commands.forEach(c => tOut(`  ${c.count.toString().padStart(3)} × <code>${escapeHtml(c.command)}</code>`, 'ok'));
    } catch { await typeLine('Uplink failed.', 10, 'err'); }
  }
  async function cmdDate() { await typeLine(new Date().toString(), 10, 'ok'); }
  async function cmdSocial() {
    await typeLine('Socials:', 10, 'sys');
    tOut('  discord : <a href="#" target="_blank" rel="noopener">@devil</a>');
    tOut('  twitter : <a href="#" target="_blank" rel="noopener">@devil</a>');
    tOut('  insta   : <a href="#" target="_blank" rel="noopener">@devil</a>');
  }
  async function cmdBanner() {
    const banner = [
      '  ____  _______     _____ _ ',
      ' |  _ \\| ____\\ \\   / /_ _| |',
      ' | | | |  _|  \\ \\ / / | || |',
      ' | |_| | |___  \\ V /  | || |___',
      ' |____/|_____|  \\_/  |___|_____|',
    ];
    banner.forEach(l => tOut(`<pre style="margin:0;color:var(--neon-pink);font-family:JetBrains Mono,monospace">${escapeHtml(l)}</pre>`));
  }
  async function cmdClear() { terminalOutput.innerHTML = ''; }
  async function cmdHistory() {
    if (!history.length) { await typeLine('No history yet.', 10, 'sys'); return; }
    history.forEach((h, i) => tOut(`  ${i + 1}  ${escapeHtml(h)}`));
  }

  /* ------- snake mini-game ------- */
  const SNAKE = { size: 15, snake: [], dir: { x: 1, y: 0 }, food: null, loop: null, score: 0, running: false };
  let snakeBoardEl = null, snakeHudEl = null;

  function snakeBuildBoard() {
    const wrap = document.createElement('div');
    snakeHudEl = document.createElement('div');
    snakeHudEl.className = 'snake-hud';
    snakeHudEl.innerHTML = `<span>SNAKE</span><span>Score: <b id="snakeScore">0</b></span><span>Q to quit</span>`;
    snakeBoardEl = document.createElement('div');
    snakeBoardEl.className = 'snake-board';
    snakeBoardEl.style.gridTemplateColumns = `repeat(${SNAKE.size}, 1fr)`;
    for (let i = 0; i < SNAKE.size * SNAKE.size; i++) {
      const c = document.createElement('div'); c.className = 'snake-cell'; snakeBoardEl.appendChild(c);
    }
    wrap.appendChild(snakeHudEl); wrap.appendChild(snakeBoardEl);
    terminalOutput.appendChild(wrap);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }
  function snakeDraw() {
    const cells = snakeBoardEl.children;
    for (let i = 0; i < cells.length; i++) cells[i].className = 'snake-cell';
    SNAKE.snake.forEach((s, i) => {
      const idx = s.y * SNAKE.size + s.x;
      cells[idx].classList.add(i === 0 ? 'h' : 's');
    });
    const fidx = SNAKE.food.y * SNAKE.size + SNAKE.food.x;
    cells[fidx].classList.add('f');
    snakeHudEl.querySelector('#snakeScore').textContent = SNAKE.score;
  }
  function snakeStart() {
    if (SNAKE.running) { typeLine('Snake already running.', 10, 'sys'); return; }
    SNAKE.snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
    SNAKE.dir = { x: 1, y: 0 };
    SNAKE.food = { x: 10, y: 7 };
    SNAKE.score = 0;
    SNAKE.running = true;
    snakeBuildBoard();
    terminalInput.focus();
    SNAKE.loop = setInterval(snakeTick, 130);
  }
  function snakeStop(reason = 'Stopped') {
    clearInterval(SNAKE.loop); SNAKE.running = false;
    typeLine(`Snake ${reason}. Score: ${SNAKE.score}`, 10, 'ok');
    if (SNAKE.score >= 5) unlockAchievement('snake_master', '🐍 Reflex Test', 'Played snake');
  }
  function snakeTick() {
    const head = SNAKE.snake[0];
    const nh = { x: head.x + SNAKE.dir.x, y: head.y + SNAKE.dir.y };
    if (nh.x < 0 || nh.x >= SNAKE.size || nh.y < 0 || nh.y >= SNAKE.size) return snakeStop('Crashed');
    if (SNAKE.snake.some(s => s.x === nh.x && s.y === nh.y)) return snakeStop('Self-bite');
    SNAKE.snake.unshift(nh);
    if (nh.x === SNAKE.food.x && nh.y === SNAKE.food.y) {
      SNAKE.score += 1;
      sfx('success');
      do { SNAKE.food = { x: Math.floor(Math.random() * SNAKE.size), y: Math.floor(Math.random() * SNAKE.size) }; }
      while (SNAKE.snake.some(s => s.x === SNAKE.food.x && s.y === SNAKE.food.y));
    } else {
      SNAKE.snake.pop();
    }
    snakeDraw();
  }
  window.addEventListener('keydown', (e) => {
    if (!SNAKE.running) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q'].includes(k)) e.preventDefault();
    if (k === 'q') return snakeStop('Quit');
    const map = { arrowup: { x: 0, y: -1 }, arrowdown: { x: 0, y: 1 }, arrowleft: { x: -1, y: 0 }, arrowright: { x: 1, y: 0 }, w: { x: 0, y: -1 }, s: { x: 0, y: 1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 } };
    const d = map[k]; if (!d) return;
    // no 180-turn
    if (d.x === -SNAKE.dir.x && d.y === -SNAKE.dir.y) return;
    SNAKE.dir = d;
  });

  /* ------- glitch + devil mode ------- */
  async function triggerGlitchThenDevilMode() {
    document.body.classList.add('glitching');
    const glitchLayer = document.createElement('div');
    glitchLayer.className = 'glitch-overlay';
    document.body.appendChild(glitchLayer);
    await new Promise(r => setTimeout(r, 4000));
    document.body.classList.remove('glitching');
    glitchLayer.remove();
    document.body.classList.add('devil-mode');
    const overlay = document.createElement('div');
    overlay.id = 'devilModeOverlay';
    overlay.innerHTML = `<div class="message">Welcome To DEVIL Mode</div>`;
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.remove();
      document.body.classList.remove('devil-mode');
      startMatrixRain();
    }, 6000);
  }

  /* ------- matrix rain ------- */
  const mCanvas = $('#matrixRain');
  const mctx = mCanvas?.getContext('2d');
  let rainInterval;
  function startMatrixRain() {
    if (!mCanvas || !mctx) return;
    mCanvas.style.display = 'block';
    mCanvas.width = window.innerWidth;
    mCanvas.height = window.innerHeight;
    const letters = 'アァイィウヴエカキクケコサシスセソABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789DEVILN3ON';
    const fontSize = 16;
    const columns = Math.floor(mCanvas.width / fontSize);
    const drops = Array(columns).fill(1);
    function draw() {
      mctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      mctx.fillRect(0, 0, mCanvas.width, mCanvas.height);
      mctx.fillStyle = '#00ff88';
      mctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        mctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > mCanvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }
    clearInterval(rainInterval);
    rainInterval = setInterval(draw, 50);
    unlockAchievement('matrix', '💚 Into the Matrix', 'Unleashed the rain');
  }
  function stopMatrixRain() {
    if (!mCanvas || !mctx) return;
    clearInterval(rainInterval);
    mctx.clearRect(0, 0, mCanvas.width, mCanvas.height);
    mCanvas.style.display = 'none';
  }

  /* ------- command dispatcher ------- */
  async function runCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    history.push(cmd); historyIndex = history.length;
    tOut(`<span class="cmd-echo">&gt; ${escapeHtml(cmd)}</span>`);
    apiPost('/terminal/log', { command: cmd }).catch(() => {});

    if (cmd === 'help' || cmd === '?') { await cmdHelp(); }
    else if (cmd === 'show projects' || cmd === 'ls' || cmd === 'ls projects') { await cmdShowProjects(); }
    else if (cmd === 'glitch.dev') { await typeLine('💥 Glitch Unlocked! Initializing global glitch protocol...', 12, 'err'); unlockAchievement('glitch', '⚡ System Override', 'Triggered glitch.dev'); triggerGlitchThenDevilMode(); }
    else if (cmd === 'stats') { await cmdStats(); unlockAchievement('stats', '📊 Data Mined', 'Queried live stats'); }
    else if (cmd === 'visitors') { await cmdVisitors(); }
    else if (cmd === 'online') { await cmdOnline(); }
    else if (cmd === 'whoami') { await cmdWhoami(); }
    else if (cmd === 'top commands' || cmd === 'top') { await cmdTopCommands(); }
    else if (cmd === 'date') { await cmdDate(); }
    else if (cmd === 'social') { await cmdSocial(); }
    else if (cmd === 'banner') { await cmdBanner(); }
    else if (cmd === 'clear' || cmd === 'cls') { await cmdClear(); }
    else if (cmd === 'history') { await cmdHistory(); }
    else if (cmd === 'matrix') { startMatrixRain(); await typeLine('matrix engaged. type `matrix stop` to end.', 10, 'ok'); }
    else if (cmd === 'matrix stop') { stopMatrixRain(); await typeLine('matrix disengaged.', 10, 'sys'); }
    else if (cmd === 'snake') { snakeStart(); await typeLine('Use WASD / arrow keys. Q to quit.', 10, 'sys'); }
    else if (cmd === 'guestbook') { document.getElementById('guestbook').scrollIntoView({ behavior: 'smooth' }); await typeLine('Scrolling to signal wall...', 10, 'sys'); }
    else if (cmd === 'contact') { contactForm.scrollIntoView({ behavior: 'smooth' }); await typeLine('Scrolling to contact form...', 10, 'sys'); }
    else if (cmd === 'coffee') { await typeLine('☕ delivered. +10 XP', 10, 'ok'); unlockAchievement('coffee', '☕ Caffeinated', 'Fueled the dev'); }
    else if (cmd === 'sudo rm -rf /') { await typeLine('nice try :)', 10, 'err'); }
    else { await typeLine(`❌ Unknown command: ${cmd}. Type \`help\`.`, 10, 'err'); sfx('error'); }

    refreshHud();
  }

  terminalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = terminalInput.value;
    terminalInput.value = '';
    await runCommand(val);
  });

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      if (historyIndex > 0) historyIndex--; else historyIndex = 0;
      if (history[historyIndex]) { terminalInput.value = history[historyIndex]; e.preventDefault(); }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex < history.length - 1) historyIndex++; else { historyIndex = history.length; terminalInput.value = ''; return; }
      if (history[historyIndex]) terminalInput.value = history[historyIndex];
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const partial = terminalInput.value.toLowerCase();
      const match = Object.keys(COMMANDS).find(c => c.startsWith(partial));
      if (match) terminalInput.value = match;
    }
  });

  /* ----------------- KONAMI CODE ----------------- */
  const konami = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let ki = 0;
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === konami[ki]) { ki++; if (ki >= konami.length) { ki = 0; unlockAchievement('konami', '🎮 Konami Code', 'The classic cheat'); triggerGlitchThenDevilMode(); } }
    else ki = (k === konami[0] ? 1 : 0);
  });

  /* ----------------- REDUCED MOTION ----------------- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.glitch').forEach(el => {
      el.style.textShadow = '0 0 24px rgba(138,92,255,.6), 0 0 12px rgba(51,231,255,.4)';
    });
  }
})();
