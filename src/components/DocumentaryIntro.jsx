import { useEffect, useRef, useState } from "react";

/** Teks huruf-per-huruf (animasi diatur lewat CSS: delay = urutan huruf).
 *  Huruf dikelompokkan per kata (tidak boleh patah di tengah kata saat layar sempit). */
function Chars({ text, step = 45, type = false }) {
  let n = 0;
  const words = text.split(" ");
  return (
    <span aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi}>
          <span className="fx-nw" aria-hidden="true">
            {Array.from(word).map((ch, i) => (
              <span
                key={i}
                className={"di-char" + (type ? " di-char--type" : "")}
                style={{ "--i": n++, "--step": step + "ms" }}
              >
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 && (n++, " ")}
        </span>
      ))}
    </span>
  );
}

// Petir terjadi lebih dulu (0 - ~1.6 dtk), baru teks dokumenter muncul.
const SCRIPT = [1700, 2600, 4000, 5000]; // waktu tiap baris muncul (ms)
const END_AT = 7600;                     // mulai "membuka" layar (ms)

/** Petir realistis: jalur zig-zag (midpoint displacement) + cabang acak,
 *  digambar berlapis (glow biru lebar -> inti putih) di canvas, lalu memudar berkedip. */
function makeBolt(x0, y0, x1, y1, disp, out, depth = 0) {
  // Bagi jalur rekursif sampai segmennya pendek
  if (disp < 3) { out.push([x0, y0, x1, y1, depth]); return; }
  const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * disp;
  const my = (y0 + y1) / 2 + (Math.random() - 0.5) * disp * 0.35;
  makeBolt(x0, y0, mx, my, disp / 2, out, depth);
  makeBolt(mx, my, x1, y1, disp / 2, out, depth);
  // Cabang kecil keluar dari titik tengah
  if (depth < 2 && disp > 18 && Math.random() < 0.45) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const len = (y1 - y0) * (0.25 + Math.random() * 0.3);
    makeBolt(mx, my, mx + dir * len * (0.45 + Math.random() * 0.6), my + len, disp * 0.55, out, depth + 1);
  }
}

function strikeLightning(canvas, flash, big) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const c = canvas.getContext("2d");
  c.scale(dpr, dpr);

  const startX = W * (0.18 + Math.random() * 0.64);
  const endX = startX + (Math.random() - 0.5) * W * 0.35;
  const endY = H * (big ? 0.62 + Math.random() * 0.12 : 0.4 + Math.random() * 0.15);
  const segs = [];
  makeBolt(startX, -10, endX, endY, W * (big ? 0.22 : 0.15), segs);

  const draw = (alpha) => {
    c.clearRect(0, 0, W, H);
    // pendaran awan di sekitar titik petir
    const g = c.createRadialGradient(startX, 0, 0, startX, 0, H * 0.9);
    g.addColorStop(0, `rgba(190,210,255,${0.55 * alpha})`);
    g.addColorStop(1, "rgba(190,210,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    c.lineCap = "round"; c.lineJoin = "round";
    const pass = (w, col, blur, scale) => {
      c.shadowColor = col; c.shadowBlur = blur;
      c.strokeStyle = col.replace("A", String(alpha));
      segs.forEach(([ax, ay, bx, by, d]) => {
        c.lineWidth = Math.max(0.6, w * scale * (d === 0 ? 1 : d === 1 ? 0.55 : 0.3));
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
      });
    };
    pass(11, "rgba(90,130,255,A)", 38, 1);   // glow lebar
    pass(5, "rgba(170,200,255,A)", 18, 1);   // glow tengah
    pass(2.2, "rgba(255,255,255,A)", 6, 1);  // inti putih
  };

  // Kilatan layar: kilat utama, redup, kilat susulan, memudar (berkedip seperti petir asli)
  const frames = big
    ? [[0, 1, 0.85], [70, 0.25, 0.1], [130, 1, 1], [210, 0.5, 0.3], [300, 0.9, 0.55], [420, 0.35, 0.16], [560, 0.12, 0.05], [720, 0, 0]]
    : [[0, 0.8, 0.5], [80, 0.2, 0.06], [150, 0.7, 0.4], [260, 0.2, 0.08], [420, 0, 0]];
  frames.forEach(([ms, a, f]) => setTimeout(() => {
    if (!canvas.isConnected) return;
    a > 0 ? draw(a) : c.clearRect(0, 0, W, H);
    flash.style.opacity = String(f);
  }, ms));
  window.dispatchEvent(new CustomEvent("fx:lightning", { detail: { big } }));
}

/**
 * Intro bergaya film dokumenter:
 * layar hitam + grain film, goresan & kedip, vignette, letterbox, HUD kamera (REC + timecode),
 * judul muncul huruf demi huruf, lalu layar terbelah ke atas/bawah menampilkan website.
 * Bisa dilewati: klik, tombol "Lewati", Enter, Spasi, atau Esc
 */
export default function DocumentaryIntro() {
  const [phase, setPhase] = useState("play"); // play | open | gone
  const [step, setStep] = useState(0);
  const phaseRef = useRef("play");
  const timers = useRef([]);
  const tcRef = useRef(null);
  const grainRef = useRef(null);
  const boltRef = useRef(null);
  const flashRef = useRef(null);

  useEffect(() => {
    const after = (fn, ms) => timers.current.push(setTimeout(fn, ms));
    document.body.style.overflow = "hidden";

    const finish = () => {
      if (phaseRef.current !== "play") return;
      phaseRef.current = "open";
      setPhase("open");
      after(() => {
        document.documentElement.dataset.intro = "done";
        window.dispatchEvent(new Event("fx:intro-done"));
      }, 250);
      after(() => {
        phaseRef.current = "gone";
        setPhase("gone");
        document.body.style.overflow = "";
      }, 1700);
    };
    window.__fxSkipIntro = finish;

    // Petir di awal intro: 3 sambaran (kecil -> besar -> kecil)
    const bolt = (ms, big) => after(() => {
      if (phaseRef.current === "play" && boltRef.current && flashRef.current) strikeLightning(boltRef.current, flashRef.current, big);
    }, ms);
    bolt(250, false);
    bolt(700, true);
    bolt(1350, false);

    SCRIPT.forEach((ms, i) => after(() => setStep(i + 1), ms));
    after(finish, END_AT);

    // Timecode 24 fps
    const t0 = performance.now();
    const tc = setInterval(() => {
      if (!tcRef.current) return;
      const ms = performance.now() - t0;
      const f = Math.floor((ms / 1000) * 24) % 24;
      const s = Math.floor(ms / 1000) % 60;
      const m = Math.floor(ms / 60000);
      const p = (n) => String(n).padStart(2, "0");
      tcRef.current.textContent = `TC 00:${p(m)}:${p(s)}:${p(f)}`;
    }, 41);

    // Grain film: noise acak ~15 fps
    const canvas = grainRef.current;
    const g = canvas.getContext("2d");
    const size = 180;
    canvas.width = canvas.height = size;
    const img = g.createImageData(size, size);
    const grain = setInterval(() => {
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = (Math.random() * 46) | 0;
      }
      g.putImageData(img, 0, 0);
    }, 66);

    const onKey = (e) => {
      if (["Escape", "Enter", " "].includes(e.key)) { e.preventDefault(); finish(); }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      timers.current.forEach(clearTimeout);
      clearInterval(tc);
      clearInterval(grain);
      window.removeEventListener("keydown", onKey);
      delete window.__fxSkipIntro;
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={"doc-intro" + (phase === "open" ? " is-opening" : "")}
      onClick={() => window.__fxSkipIntro && window.__fxSkipIntro()}
      role="presentation"
    >
      <div className="doc-intro__half doc-intro__half--top" />
      <div className="doc-intro__half doc-intro__half--bottom" />

      <div className="doc-intro__fx" aria-hidden="true">
        <div className="doc-intro__frame" />
        <canvas className="doc-intro__grain" ref={grainRef} />
        <div className="doc-intro__flicker" />
        <canvas className="doc-intro__bolt" ref={boltRef} />
        <div className="doc-intro__flash" ref={flashRef} />
        <div className="doc-intro__scratch" />
        <div className="doc-intro__scratch doc-intro__scratch--b" />
        <div className="doc-intro__vignette" />
      </div>

      <div className="doc-intro__stage">
        {step >= 1 && <p className="di-caption"><Chars text="Sebuah Dokumenter" step={55} /></p>}
        {step >= 2 && (
          <>
            <h1 className="di-title"><Chars text="Ahnaf Adib Yunan" step={70} /></h1>
            <span className="di-rule" />
          </>
        )}
        {step >= 3 && (
          <p className="di-sub">
            <Chars text="Mahasiswa Sistem Informasi · ITS Surabaya" step={30} type />
            <span className="di-caret">▍</span>
          </p>
        )}
        {step >= 4 && <p className="di-tag"><Chars text="Building Technology. Designing Experiences. Creating Impact." step={18} /></p>}
      </div>

      <div className="doc-intro__hud" aria-hidden="true">
        <span className="di-rec"><i /> REC <span ref={tcRef}>TC 00:00:00:00</span></span>
        <span className="di-cam">CAM 01 · Surabaya</span>
        <span className="di-iso">24 FPS · ISO 400</span>
        <button type="button" className="di-skip" aria-hidden="false" tabIndex={0}
          onClick={(e) => { e.stopPropagation(); window.__fxSkipIntro && window.__fxSkipIntro(); }}>
          Lewati ›
        </button>
      </div>
    </div>
  );
}
