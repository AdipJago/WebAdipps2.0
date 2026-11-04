# Personal Digital Portfolio — Ahnaf Adib Yunan

## Struktur Proyek
```
Portfolio/
  app.py                  -> Backend Flask (routing, database, admin)
  templates/index.html    -> Halaman utama (Jinja2)
  static/style.css        -> Seluruh desain & animasi CSS
  static/script.js        -> Seluruh interaksi & animasi JS
  assets/                 -> Foto profil, CV, upload proposal/sertifikat/galeri
  requirements.txt        -> Daftar dependensi Python
  src/                    -> Sumber animasi JSX (React) — lihat bagian "Animasi JSX"
  static/animations.css   -> Style untuk animasi tambahan
  static/animations.bundle.js -> Hasil build dari src/ (sudah disertakan)
  package.json, build.mjs -> Untuk membangun ulang bundel animasi
```

## Cara Menjalankan (Lokal)

1. **Buat virtual environment (disarankan)**
   ```bash
   python3 -m venv venv
   source venv/bin/activate      # Windows: venv\Scripts\activate
   ```

2. **Install dependensi**
   ```bash
   pip install -r requirements.txt
   ```

3. **Siapkan file aset wajib** di dalam folder `assets/`:
   - `profile.jpg` — foto profil untuk section About & Open Graph
   - `favicon.png` — favicon
   - `cv.pdf` — file CV untuk tombol "Download CV"

4. **Inisialisasi database** (membuat `database.db` + akun admin default)
   ```bash
   flask --app app.py init-db
   ```
   Ini akan membuat akun admin:
   - **Username:** `admin`
   - **Password:** `gantipassword123`

   ⚠️ **Segera login dan ganti password ini** — saat ini belum ada halaman ganti password otomatis, bisa diganti lewat shell:
   ```bash
   flask --app app.py shell
   >>> from app import db, AdminUser
   >>> u = AdminUser.query.filter_by(username="admin").first()
   >>> u.set_password("password-baru-yang-kuat")
   >>> db.session.commit()
   ```

5. **Jalankan server**
   ```bash
   python app.py
   ```
   Buka `http://127.0.0.1:5000` untuk halaman publik, dan
   `http://127.0.0.1:5000/admin/login` untuk dashboard admin.

## Mengisi Konten
Semua konten (Projects, Experience, Proposal, Certificates, Gallery, Biodata)
diisi lewat **dashboard admin** — tidak perlu edit HTML/CSS/JS secara manual.
Data tersimpan di `database.db` (SQLite) dan file yang diunggah tersimpan
otomatis di `assets/<kategori>/`.

## Sebelum Deploy ke Produksi
- Ganti `SECRET_KEY` di `app.py` (atau set environment variable `SECRET_KEY`).
- Set `debug=False` pada `app.run()`.
- Gunakan server produksi seperti **gunicorn** di belakang Nginx, bukan `flask run`.
- Pertimbangkan HTTPS dan backup rutin untuk `database.db` serta folder `assets/`.


## Animasi JSX (React)
Lapisan animasi ditulis dengan JSX di folder `src/` dan di-bundle menjadi satu
file `static/animations.bundle.js`. Flask & HTML tetap seperti semula — bundel ini
hanya "menempel" di atas halaman (progressive enhancement). Jika file bundel
tidak termuat, website tetap tampil normal.

| Komponen | Efek |
|---|---|
| `SmoothScroll` | Scroll ber-inersia + anchor menu meluncur halus (desktop) |
| `ScrollReveal` | Reveal dengan stagger (tanpa zoom), judul hero huruf-per-huruf, judul section kata-per-kata, angka skill naik 0→N% |
| `Parallax` | Blob/grid hero mengikuti mouse & scroll, garis timeline tergambar |
| `TiltCard` | Tilt 3D + kilau cahaya di kartu project, sertifikat, proposal, foto |
| `DocumentaryIntro` | Intro film dokumenter: grain, REC + timecode, judul huruf-per-huruf, layar terbelah membuka website (bisa di-skip) |
| `CursorTrail` | Jejak cahaya + percikan di belakang kursor (desktop) |
| `InteractiveBackground` | Partikel aksen yang menjauh dari kursor/jari, ikut mode gelap/terang |
| `ScrollBlurShield` | Tepi atas/bawah layar memudar dengan blur saat scroll |
| `TouchEffects` | Ripple di tombol/kartu + cincin sentuhan di layar sentuh |
| `GalleryFlip` | Foto galeri meluncur ke posisi baru saat filter diganti |

Klik gambar galeri, thumbnail project, atau sertifikat membuka lightbox yang tajam (tanpa blur).
Intro dokumenter bisa dilewati lewat tombol "Lewati", klik, Enter, Spasi, atau Esc.

Semua efek otomatis mati bila pengunjung mengaktifkan *reduce motion*; efek mouse
tidak dipakai di layar sentuh.

### Mengubah / membangun ulang animasi
```bash
npm install
npm run build     # menghasilkan static/animations.bundle.js
npm run dev       # mode watch saat mengedit src/
```
Setelah `npm run build`, commit `static/animations.bundle.js` — Vercel/Flask hanya
menyajikan file hasil build, jadi tidak perlu Node di server.
