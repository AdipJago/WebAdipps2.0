/* ================================================================
   SFX: efek suara intro & klik tombol (disintesis WebAudio, tanpa file)
   - Browser memblokir suara sebelum pengunjung menyentuh layar, jadi suara
     intro mulai otomatis begitu ada sentuhan/klik pertama.
   - Matikan semua suara: window.SFX.muted = true
================================================================ */
(function () {
  "use strict";
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  var ctx = null, master = null;
  var SFX = (window.SFX = { muted: false });

  function ensure() {
    if (!ctx) {
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(function () {});
    return ctx;
  }
  function ready() { return ctx && ctx.state === "running" && !SFX.muted; }

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!ready()) return;
    var t = ctx.currentTime + (delay || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, type, f0, f1, vol, delay) {
    if (!ready()) return;
    var t = ctx.currentTime + (delay || 0);
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = type;
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.05, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.02);
  }

  /* --- bunyi-bunyian --- */
  SFX.click = function () {            // klik tombol: "tik" modern
    tone(1900, 0.05, "sine", 0.07, 1100);
    tone(3200, 0.025, "triangle", 0.03);
  };
  SFX.tick = function () { noise(0.018, "highpass", 3500, null, 0.05); };  // ketikan
  SFX.shutter = function () {          // klik kamera / proyektor
    noise(0.03, "bandpass", 2200, null, 0.16);
    noise(0.04, "bandpass", 1400, null, 0.14, 0.07);
  };
  SFX.thud = function () {             // dentuman sinematik saat nama muncul
    tone(78, 0.9, "sine", 0.5, 38);
    noise(0.5, "lowpass", 400, 80, 0.2);
  };
  SFX.whoosh = function () {           // layar terbelah membuka website
    noise(1.1, "bandpass", 260, 3600, 0.2);
    tone(180, 0.9, "sawtooth", 0.025, 900);
    tone(60, 0.7, "sine", 0.22, 35, 0.05);
  };


  /* --- bunyi-bunyian tambahan --- */
  SFX.thunder = function (big) {       // petir: retakan tajam + gemuruh panjang
    noise(0.12, "highpass", 2500, 900, big ? 0.5 : 0.3);               // retakan
    noise(big ? 2.8 : 1.6, "lowpass", big ? 520 : 380, 50, big ? 0.55 : 0.32, 0.06); // gemuruh
    tone(big ? 55 : 70, big ? 2.2 : 1.2, "sine", big ? 0.5 : 0.3, 28, 0.08);
  };
  SFX.notify = function () {           // notifikasi chat anonim: dua nada "ting-ting"
    tone(1175, 0.22, "sine", 0.13);
    tone(2350, 0.12, "triangle", 0.025);
    tone(1568, 0.5, "sine", 0.13, null, 0.11);
    tone(3136, 0.25, "triangle", 0.025, null, 0.11);
  };
  SFX.bubble = function (dark) {       // ganti tema: suara gelembung "blup-blup"
    var b = dark ? 0.8 : 1.15;         // gelap = nada lebih rendah, terang = lebih tinggi
    tone(380 * b, 0.11, "sine", 0.2, 980 * b);
    tone(520 * b, 0.09, "sine", 0.15, 1300 * b, 0.09);
    tone(300 * b, 0.13, "sine", 0.14, 800 * b, 0.19);
    noise(0.05, "bandpass", 2600, null, 0.025, 0.01);
  };
  SFX.pop = function () {              // buka detail/popup
    tone(520, 0.09, "sine", 0.16, 1040);
    tone(1560, 0.07, "triangle", 0.04, null, 0.05);
  };
  SFX.close = function () {            // tutup popup
    tone(900, 0.1, "sine", 0.12, 420);
  };
  SFX.nav = function () {              // pindah menu: "blip" lembut
    tone(660, 0.07, "sine", 0.1, 880);
    tone(990, 0.09, "sine", 0.08, null, 0.06);
  };
  SFX.filter = function () {           // filter galeri: kilau kecil
    tone(1400, 0.05, "triangle", 0.07);
    tone(1850, 0.05, "triangle", 0.06, null, 0.05);
    tone(2400, 0.08, "triangle", 0.05, null, 0.1);
  };
  SFX.music = function () {            // tombol musik: "power-on"
    tone(330, 0.12, "square", 0.04, 660);
    tone(660, 0.16, "sine", 0.1, 990, 0.08);
  };
  SFX.open = function () {             // buka pratinjau (sertifikat/proposal)
    noise(0.22, "bandpass", 500, 2600, 0.1);
    tone(440, 0.18, "sine", 0.09, 880);
  };

  /* Petir di intro -> suara gemuruh */
  window.addEventListener("fx:lightning", function (e) {
    ensure();
    var big = !!(e.detail && e.detail.big);
    if (ready()) SFX.thunder(big);
    else if (ctx) ctx.resume().then(function () { SFX.thunder(big); }).catch(function () {});
  });

  /* --- intro --- */
  var introStarted = false, timers = [];
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function ticks(startMs, count, stepMs) {
    for (var i = 0; i < count; i++) at(startMs + i * stepMs, SFX.tick);
  }
  var t0 = 0;
  function playIntro() {
    if (introStarted) return;
    introStarted = true;
    t0 = performance.now();
    var elapsed = 0;
    function when(ms, fn) { var d = ms - elapsed; if (d >= -120) at(Math.max(0, d), fn); }
    SFX.shutter();
    when(1700, function () { ticks(0, 17, 55); });     // "Sebuah Dokumenter"
    when(2600, SFX.thud);                              // nama muncul
    when(4000, function () { ticks(0, 40, 30); });     // baris mengetik
  }

  function onIntroDone() {
    timers.forEach(clearTimeout); timers = [];
    ensure();
    SFX.whoosh();
  }
  window.addEventListener("fx:intro-done", onIntroDone);

  /* Buka kunci audio pada sentuhan pertama (aturan autoplay browser) */
  function unlock() {
    ensure();
    if (document.documentElement.dataset.intro === "playing") {
      // intro masih berjalan -> mulai suara intro sekarang
      var iv = setInterval(function () {
        if (ready()) { clearInterval(iv); playIntro(); }
      }, 30);
      setTimeout(function () { clearInterval(iv); }, 1000);
    }
  }
  ["pointerdown", "touchstart", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, unlock, { once: true, passive: true });
  });

  /* Jika browser mengizinkan autoplay, mulai langsung */
  function tryAuto() {
    ensure();
    if (ctx && ctx.state === "running" && document.documentElement.dataset.intro === "playing") playIntro();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tryAuto);
  else tryAuto();

  /* --- klik: tiap jenis elemen punya suara sendiri --- */
  function play(fn) {
    ensure();
    if (!ctx) return;
    if (ctx.state === "running") fn();
    else ctx.resume().then(fn).catch(function () {});
  }
  var MAP = [
    [".di-skip", function () { SFX.click(); }],
    [".ngl-btn", function () { SFX.notify(); }],
    [".theme-toggle", function () {
      // klik ini sudah mengganti tema (handler script.js jalan setelah ini), jadi baca nilai berikutnya
      var nowDark = document.body.getAttribute("data-theme") === "dark";
      SFX.bubble(!nowDark);
    }],
    [".project-card__detail, [data-project-open]", function () { SFX.pop(); }],
    [".certificate-card, [data-preview-pdf]", function () { SFX.open(); }],
    ["[data-modal-close], .project-modal__close, .pdf-modal__close, .lightbox__close", function () { SFX.close(); }],
    [".gallery__filter", function () { SFX.filter(); }],
    [".music__toggle", function () { SFX.music(); }],
    [".navbar__links a, .navbar__mobile a, .mobile-menu__links a, .navbar__burger", function () { SFX.nav(); }],
    [".btn, button, a.btn, .project-card__links a", function () { SFX.click(); }]
  ];
  document.addEventListener("click", function (e) {
    if (!e.target || !e.target.closest) return;
    if (document.documentElement.dataset.intro === "playing" && !e.target.closest(".di-skip")) return;
    for (var i = 0; i < MAP.length; i++) {
      if (e.target.closest(MAP[i][0])) { play(MAP[i][1]); return; }
    }
  }, true);
})();
