(() => {
  const $ = (id) => document.getElementById(id);

  const launchBtn  = $('launchBtn');
  const liftoff    = $('liftoff');
  const overlay    = $('videoOverlay');
  const video      = $('introVideo');
  const skipBtn    = $('skipBtn');
  const droneMode  = $('droneMode');
  const vMeta      = $('vMeta');
  const tablet     = $('tablet');
  const boot       = $('boot');
  const bootLog    = $('bootLog');
  const bootBar    = $('bootBar');
  const bootStatus = $('bootStatus');
  const consoleEl  = $('consoleLines');
  const soundBtn   = $('soundToggle');
  const soundLbl   = $('soundLabel');

  const MOBILE = 768;
  const VIDEO_PC       = 'assets/videos/intro-drone format pc.mp4';
  const VIDEO_PORTABLE = 'assets/videos/intro-drone format portable.mp4';

  /* ==========================================================
     AUDIO — synthèse Web Audio (aucun fichier requis)
     ========================================================== */
  let ac = null, hum = null, soundOn = false;

  const initAudio = () => {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
  };

  const startHum = () => {
    if (!ac || hum) return;
    const o = ac.createOscillator(); o.type='sawtooth'; o.frequency.value=55;
    const o2 = ac.createOscillator(); o2.type='sine'; o2.frequency.value=110;
    const g = ac.createGain(); g.gain.value=0;
    const filter = ac.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=300;
    o.connect(filter); o2.connect(filter); filter.connect(g); g.connect(ac.destination);
    o.start(); o2.start();
    g.gain.linearRampToValueAtTime(0.04, ac.currentTime + 1.2);
    hum = { o, o2, g };
  };
  const stopHum = () => {
    if (!hum) return;
    hum.g.gain.linearRampToValueAtTime(0, ac.currentTime + 0.3);
    setTimeout(() => { try { hum.o.stop(); hum.o2.stop(); } catch(e){} hum = null; }, 400);
  };

  const beep = (freq=880, dur=.08, type='square', vol=.08) => {
    if (!ac || !soundOn) return;
    const o = ac.createOscillator(); o.type=type; o.frequency.value=freq;
    const g = ac.createGain(); g.gain.value=0;
    o.connect(g); g.connect(ac.destination);
    const t = ac.currentTime;
    g.gain.linearRampToValueAtTime(vol, t+.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.start(t); o.stop(t+dur+.02);
  };

  const whoosh = () => {
    if (!ac || !soundOn) return;
    const o = ac.createOscillator(); o.type='sawtooth';
    const g = ac.createGain(); g.gain.value=0;
    const f = ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=2000;
    o.connect(f); f.connect(g); g.connect(ac.destination);
    const t = ac.currentTime;
    o.frequency.setValueAtTime(80, t);
    o.frequency.exponentialRampToValueAtTime(600, t+1.4);
    f.frequency.exponentialRampToValueAtTime(200, t+1.4);
    g.gain.linearRampToValueAtTime(.18, t+.1);
    g.gain.linearRampToValueAtTime(0, t+1.6);
    o.start(t); o.stop(t+1.7);
  };

  soundBtn.addEventListener('click', () => {
    initAudio();
    if (ac.state === 'suspended') ac.resume();
    soundOn = !soundOn;
    soundBtn.classList.toggle('on', soundOn);
    soundLbl.textContent = soundOn ? 'SON ON' : 'SON OFF';
    if (soundOn) { startHum(); beep(660,.1); } else stopHum();
  });

  /* ==========================================================
     SÉQUENCE DE BOOT
     ========================================================== */
  const bootSequence = [
    { t:  0, p:  0, msg:'> Réveil du tableau de commande...' },
    { t:300, p: 10, msg:'> Vérification du noyau ............. <span class="ok">OK</span>' },
    { t:550, p: 22, msg:'> Initialisation IMU ................ <span class="ok">OK</span>' },
    { t:800, p: 36, msg:'> Calibration boussole .............. <span class="ok">OK</span>' },
    { t:1050,p: 50, msg:'> Acquisition GPS ................... <span class="ok">3D LOCK</span>' },
    { t:1300,p: 64, msg:'> Liaison radio 2.4 GHz ............. <span class="ok">OK</span>' },
    { t:1550,p: 76, msg:'> Caméra 4K UHD ..................... <span class="ok">OK</span>' },
    { t:1800,p: 88, msg:'> Cible verrouillée : <b>GRANDE MOSQUÉE DE DJENNÉ</b>' },
    { t:2050,p: 96, msg:'> Système prêt. En attente du pilote.' },
    { t:2300,p:100, msg:'> <span class="ok">TABLEAU EN LIGNE</span>' },
  ];

  const runBoot = () => {
    bootSequence.forEach(({ t, p, msg }) => {
      setTimeout(() => {
        const line = document.createElement('p');
        line.innerHTML = msg;
        bootLog.appendChild(line);
        bootBar.style.width = p + '%';
        bootStatus.textContent = `BOOT ${p}%`;
        beep(660 + p*8, .05, 'square', .04);
      }, t);
    });
    setTimeout(() => {
      boot.classList.add('done');
      pushConsole('Système opérationnel · attente commande');
    }, 2900);
  };

  /* ==========================================================
     CONSOLE DÉFILANTE
     ========================================================== */
  const msgPool = [
    'IMU stable · drift 0.02°/s',
    'GPS · 12 satellites verrouillés',
    'Vent latéral détecté · NE 04 m/s',
    'Altitude cible : 80 m',
    'Trajectoire calculée vers Djenné',
    'Caméra · exposition auto',
    'Batterie · cellules équilibrées',
    'Liaison vidéo · 4K @ 60 fps',
    'Distance cible · 142 m',
    'Magnétomètre · CAL nominal',
    'Maghrib · lumière dorée optimale',
    'Téléchargement plan de vol · OK',
    'Détection obstacles · CLEAR',
    'Compass heading · 045°',
  ];
  const pushConsole = (txt) => {
    consoleEl.innerHTML = `<span>${txt}</span>`;
  };
  let msgIdx = 0;
  setInterval(() => {
    if (boot && !boot.classList.contains('done')) return;
    pushConsole(msgPool[msgIdx % msgPool.length]);
    msgIdx++;
    beep(1200, .02, 'sine', .02);
  }, 2200);

  /* ==========================================================
     TÉLÉMÉTRIE TEMPS RÉEL
     ========================================================== */
  const stateNodes = {
    signal:  document.querySelector('.bar-row:nth-child(1) .track span'),
    battery: document.querySelector('.bar-row:nth-child(2) .track span'),
    gps:     document.querySelector('.bar-row:nth-child(3) .track span'),
    signalV: document.querySelector('.bar-row:nth-child(1) b'),
    batteryV:document.querySelector('.bar-row:nth-child(2) b'),
    gpsV:    document.querySelector('.bar-row:nth-child(3) b'),
    readyPct:$('readyPct'),
  };
  const miniStats = document.querySelectorAll('.t-mini b');

  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const state = { signal:98, battery:100, gps:92, alt:0, ready:98 };

  const tickTelemetry = () => {
    state.signal  = clamp(state.signal  + (Math.random()-.5)*2, 86, 100);
    state.battery = clamp(state.battery - 0.04, 0, 100);
    state.gps     = clamp(state.gps     + (Math.random()-.5)*1.2, 85, 99);
    state.ready   = Math.round((state.signal + state.gps) / 2);

    const set = (s, v) => { s.style.setProperty('--w', v+'%'); };
    set(stateNodes.signal,  state.signal);
    set(stateNodes.battery, state.battery);
    set(stateNodes.gps,     state.gps);
    stateNodes.signalV.textContent  = Math.round(state.signal)  + '%';
    stateNodes.batteryV.textContent = Math.round(state.battery) + '%';
    stateNodes.gpsV.textContent     = Math.round(state.gps)     + '%';
    stateNodes.readyPct.textContent = state.ready;

    if (miniStats[0]) miniStats[0].textContent = state.alt.toFixed(0).padStart(2,'0') + 'm';
    if (miniStats[1]) miniStats[1].textContent = Math.round(state.signal) + '%';
    if (miniStats[2]) miniStats[2].textContent = Math.round(state.battery) + '%';
  };
  setInterval(tickTelemetry, 600);

  /* ==========================================================
     HORLOGE + MAGHRIB
     ========================================================== */
  const heureRow = document.querySelectorAll('.t-content em')[3];
  const tickClock = () => {
    if (!heureRow) return;
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    const ss = String(d.getSeconds()).padStart(2,'0');
    heureRow.textContent = `${hh}:${mm}:${ss} · MAGHRIB`;
  };
  setInterval(tickClock, 1000);
  tickClock();

  /* ==========================================================
     PARALLAXE SOURIS
     ========================================================== */
  document.addEventListener('mousemove', (e) => {
    if (!tablet || window.innerWidth < 1024) return;
    const x = (e.clientX / window.innerWidth  - 0.5) * 8;
    const y = (e.clientY / window.innerHeight - 0.5) * 6;
    tablet.style.transform = `perspective(1400px) rotateX(${4 - y}deg) rotateY(${-3 + x}deg)`;
  });

  /* ==========================================================
     GLITCH ALÉATOIRE
     ========================================================== */
  const scheduleGlitch = () => {
    const delay = 6000 + Math.random()*8000;
    setTimeout(() => {
      tablet.classList.add('glitch');
      beep(220, .05, 'sawtooth', .03);
      setTimeout(() => tablet.classList.remove('glitch'), 300);
      scheduleGlitch();
    }, delay);
  };
  scheduleGlitch();

  /* ==========================================================
     SONS UI
     ========================================================== */
  document.querySelectorAll('.t-row, .launch, .sound-btn').forEach(el => {
    el.addEventListener('mouseenter', () => beep(1400, .03, 'sine', .04));
  });
  launchBtn.addEventListener('mousedown', () => beep(520, .08, 'square', .08));

  /* ==========================================================
     MODE DRONE (PC / PORTABLE)
     ========================================================== */
  const pickVideo = () => {
    const isMobile = window.innerWidth < MOBILE;
    return {
      src: isMobile ? VIDEO_PORTABLE : VIDEO_PC,
      mode: isMobile ? 'FORMAT PORTABLE' : 'FORMAT PC'
    };
  };
  const updateMode = () => { droneMode.textContent = pickVideo().mode; };
  updateMode();
  window.addEventListener('resize', updateMode);

  /* ==========================================================
     SÉQUENCE DE DÉCOLLAGE + VIDÉO
     ========================================================== */
  const fmt = (s) => {
    s = Math.max(0, Math.floor(s));
    return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  };

  // ===== Compte à rebours de lancement =====
  const loShake  = document.querySelector('.lo-shake');
  const loDigit  = document.getElementById('liftoffDigit');
  const loTminus = document.getElementById('liftoffTminus');
  const loLabel  = document.getElementById('liftoffLabel');
  const loCharge = document.getElementById('liftoffCharge');
  const loFlash  = document.getElementById('liftoffFlash');

  const setDigit = (txt, cls='tick') => {
    if (!loDigit) return;
    loDigit.className = 'lo-digit';
    void loDigit.offsetWidth;        // force reflow pour relancer l'animation
    loDigit.textContent = txt;
    loDigit.classList.add(cls);
  };
  const setLabel  = t => { if (loLabel)  loLabel.textContent = t; };
  const setTminus = t => { if (loTminus) loTminus.textContent = t; };

  const showLiftoff = () => new Promise((resolve) => {
    // reset
    if (loShake)  loShake.classList.remove('shaking','go-shake','spool','go');
    if (loCharge) loCharge.style.strokeDashoffset = '578';
    if (loFlash)  loFlash.classList.remove('fire');
    setLabel('PRÉPARATION'); setTminus('T - 0:03');
    if (loDigit) { loDigit.textContent = ''; loDigit.className = 'lo-digit'; }

    liftoff.classList.add('on');

    // altitude simulée
    let alt = 0;
    const riseId = setInterval(() => {
      alt += 6; state.alt = alt;
      if (alt >= 80) clearInterval(riseId);
    }, 70);

    // T-3
    setTimeout(() => {
      setDigit('3'); setLabel('SPOOL-UP MOTEURS'); setTminus('T - 0:03');
      if (loShake)  loShake.classList.add('shaking','spool');
      if (loCharge) loCharge.style.strokeDashoffset = '385';   // ~33%
      beep(440, .12, 'square', .08);
    }, 200);

    // T-2
    setTimeout(() => {
      setDigit('2'); setLabel('ANNEAUX EN CHARGE'); setTminus('T - 0:02');
      if (loCharge) loCharge.style.strokeDashoffset = '192';   // ~66%
      beep(550, .12, 'square', .08);
    }, 1100);

    // T-1
    setTimeout(() => {
      setDigit('1'); setLabel('VERROUILLAGE CIBLE'); setTminus('T - 0:01');
      if (loCharge) loCharge.style.strokeDashoffset = '40';    // ~93%
      beep(700, .14, 'square', .09);
    }, 2000);

    // GO !
    setTimeout(() => {
      setDigit('GO', 'go'); setLabel('DÉCOLLAGE'); setTminus('T + 0:00');
      if (loShake)  { loShake.classList.remove('spool'); loShake.classList.add('go','go-shake'); }
      if (loCharge) loCharge.style.strokeDashoffset = '0';
      if (loFlash)  loFlash.classList.add('fire');
      // whoosh sonore
      try { whoosh(); } catch(_) {}
      beep(880, .25, 'sawtooth', .14);
    }, 2900);

    // fin de séquence
    setTimeout(() => {
      liftoff.classList.remove('on');
      if (loShake) loShake.classList.remove('shaking','go-shake','go');
      resolve();
    }, 3700);
  });

  const playVideo = async () => {
    const { src } = pickVideo();
    video.src = src;
    overlay.classList.add('on');
    overlay.setAttribute('aria-hidden','false');
    try { await video.play(); }
    catch { video.muted = true; try { await video.play(); } catch(_){} }
  };

  const closeVideo = () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    overlay.classList.remove('on');
    overlay.setAttribute('aria-hidden','true');
    state.alt = 0;
  };

  const CUT_AT = 15; // couper la vidéo à 15s → enchaîne sur la vue mosquée
  video.addEventListener('timeupdate', () => {
    vMeta.textContent = `DRONE · ${fmt(video.currentTime)}`;
    if (video.currentTime >= CUT_AT && !video._cut) {
      video._cut = true;
      video.dispatchEvent(new Event('ended'));
    }
  });
  video.addEventListener('ended', closeVideo);
  skipBtn.addEventListener('click', () => {
    if (video._cut) { closeVideo(); return; }
    video._cut = true;
    video.dispatchEvent(new Event('ended')); // déclenche aussi startMosqueView()
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('on')) closeVideo();
  });

  launchBtn.addEventListener('click', async () => {
    launchBtn.disabled = true;
    launchBtn.classList.add('firing');
    setTimeout(() => launchBtn.classList.remove('firing'), 600);
    pushConsole('Séquence de décollage engagée');
    initAudio(); if (ac.state==='suspended') ac.resume();
    whoosh();
    await showLiftoff();
    pushConsole('Drone en vol · cap vers la Grande Mosquée');
    await playVideo();
    launchBtn.disabled = false;
  });

  /* ==========================================================
     LANCEMENT DU BOOT
     ========================================================== */
  runBoot();
})();
