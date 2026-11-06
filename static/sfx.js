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
    when(400,  function () { ticks(0, 28, 55); });     // "Sebuah Perjalanan Dokumenter"
    when(1300, SFX.thud);                              // nama muncul
    when(2700, function () { ticks(0, 40, 30); });     // baris mengetik
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

  /* --- klik tombol modern --- */
  var SEL = ".btn, button, .navbar__links a, .navbar__mobile a, .ngl-btn, .gallery__filter, " +
            ".music__toggle, .theme-toggle, .certificate-card, .project-card__links a, .di-skip";
  document.addEventListener("click", function (e) {
    if (!e.target || !e.target.closest) return;
    if (document.documentElement.dataset.intro === "playing" && !e.target.closest(".di-skip")) return;
    if (e.target.closest(SEL)) { ensure(); SFX.click(); }
  }, true);
})();
