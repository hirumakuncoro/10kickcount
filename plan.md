# Baby Kick Count: Plan & Spesifikasi

> Aplikasi **pencatat** gerakan, bukan alat medis. Tidak memberi diagnosa, saran, atau interpretasi. Aturan 10 gerakan / 2 jam hanyalah *rules* pencatatan.

- **Brand**: Baby Kick Count (short name: KickCount)
- **Domain**: `kickcount.pages.dev` (Cloudflare Pages, HTTPS otomatis)
- **Bahasa UI**: Indonesia (`<html lang="id">`)
- **Stack**: React + TypeScript + Vite, runtime/package manager Bun, pure frontend
- **Storage**: IndexedDB (helper sendiri, tanpa wrapper/library)
- **Platform**: PWA, mobile-first, bisa offline

---

## 1. Ruang Lingkup

- **Fase 1 (sekarang)**: halaman utama (sesi aktif) + PWA
- **Nanti**: halaman riwayat (tabel log), grafik, export/backup JSON, pengingat
- **Di luar lingkup (sengaja)**: saran medis, peringatan, eskalasi, diagnosa, penilaian normal/tidak normal

---

## 2. Prinsip Teknis

- **Semua instant = epoch ms** (`Date.now()`): `startedAt`, `endedAt`, `kicks[]`. Durasi = selisih dua angka, aman lintas WIB/WITA/WIT
- **Timezone hanya di lapisan tampilan** (`Intl.DateTimeFormat('id-ID')`, otomatis ikut zona perangkat)
- **Pengecualian `date`** (`YYYY-MM-DD`): bukan instant, melainkan "hari menurut user". Dihitung **sekali** saat sesi dibuat, disimpan, tidak dihitung ulang
- **Timer = `Date.now() - startedAt`**, bukan counter interval. Tutup app di menit 0, buka di menit 30 → langsung 30:xx, hitungan gerakan tetap
- **Simpan ke IndexedDB di setiap perubahan**, jadi refresh/tutup app tidak kehilangan data
- **Keterbatasan**: jam perangkat yang diubah manual dapat menggeser hasil (wajar untuk app tanpa server)
- **KISS**: tanpa interface repository (hanya 1 implementasi), tanpa library state, tanpa toggle tema manual

---

## 3. Aturan Pencatatan

- 1 sesi per hari (unik per tanggal lokal), dijamin DB lewat `date` sebagai primary key
- Target: 10 gerakan. Batas waktu: 2 jam sejak jam mulai
- Semua tap = 1 gerakan; hint kecil: "Gerakan beruntun dihitung 1, cegukan tidak dihitung"
- Sesi selesai bila:
  1. Gerakan ke-10 tercatat **dan** user konfirmasi "Ya", atau
  2. 2 jam terlewati → selesai otomatis dengan data apa adanya (bisa < 10), tanpa teks tambahan
- Sudah ada data hari ini → tidak bisa mulai sesi baru. Harus **hapus** dulu (dengan konfirmasi)
- Sesi yang menggantung dari hari sebelumnya: tidak ada status khusus. Diselesaikan otomatis oleh aturan 2 jam saat app dibuka
- **Sesi lewat tengah malam** (mulai 23:30, masih berjalan 00:10): tetap dianggap sesi saat ini selama `active` (`isCurrent`)

---

## 4. Prinsip UX

- Satu aksi utama: tombol bulat besar di tengah, satu tangan tanpa melihat layar
- Minim navigasi: halaman utama = sesi; riwayat di halaman terpisah
- Thumb zone: aksi penting di bawah/tengah
- Copy seminimal mungkin
- Feedback tap: **suara + getaran** + angka berubah. **Tanpa animasi** (pengguna sensitif gerak)
- Layar tetap menyala selama sesi
- Dark & light mode mengikuti sistem
- Aksesibilitas: kontras tinggi, tap target ≥ 44px, jangan andalkan warna saja, `aria-label` untuk ikon riwayat
- Jarak aman antara tombol utama dan tombol destruktif (Hapus sesi) agar tidak ke-tap tidak sengaja

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## 5. Layout Halaman Utama

```
┌─────────────────────────┐
│  Baby Kick Count      ⏱ │  ← brand floating (kiri), ikon riwayat (kanan), tanpa blok warna
│                         │
│       Sesi berjalan     │  ← hanya saat berjalan
│        00:42:10         │
│                         │
│        ╭───────╮        │
│        │  🦶   │        │  ← tombol bulat besar + ring progress 10 segmen
│        │ 7/10  │        │
│        ╰───────╯        │
│                         │
│      [ Undo ]           │
│                         │
├─────────────────────────┤
│ Terakhir: kemarin · 10  │  ← ringkasan kecil
│ © 2026 <nama> · GitHub  │
│ Hanya alat pencatat,    │
│ bukan alat medis        │
└─────────────────────────┘
```

### State

| State | Tombol besar | Tambahan |
|---|---|---|
| **Loading** (data belum termuat) | Tidak dirender | Mencegah "Mulai" menimpa sesi yang sudah ada |
| **Idle** (belum ada sesi hari ini) | Label "Mulai", ikon kaki bayi. Tap = mulai timer (belum +1) | Ringkasan sesi terakhir |
| **Berjalan** | `n/10`, tap = +1 | Timer, "Sesi berjalan", Undo, Hapus sesi (kecil) |
| **Konfirmasi 10/10** | Terkunci | Bottom sheet "Selesai?" `[Belum]` `[Ya]` |
| **Selesai** | Tidak ada | Jumlah, mulai, selesai, durasi, Bagikan ke WhatsApp, Hapus sesi (kecil) |

### Konfirmasi 10/10
- Tap ke-10 → bottom sheet **"Selesai?"**
- **Belum** → kembali 9/10, timer lanjut
- **Ya** → `done`, tampil state Selesai
- `endedAt` = timestamp tap ke-10 (bukan waktu klik "Ya")
- Diturunkan dari data (`kicks.length >= 10 && status === 'active'`), jadi muncul kembali jika app ditutup lalu dibuka

### Selesai otomatis 2 jam
- Cek saat app dibuka dan tiap tick: `now - startedAt >= 2 jam` dan `active` → `done`, `endedAt = startedAt + 2 jam`
- Tap setelah batas ditolak (cek `settle` sebelum menambah)
- Timer ditampilkan dengan batas maksimal 2:00:00

### Copy (Indonesia)
`Baby Kick Count` · `Mulai` · `Sesi berjalan` · `Undo` · `Riwayat` · `Selesai?` · `Belum` · `Ya` · `Bagikan ke WhatsApp` · `Hapus sesi` · `Hapus sesi hari ini?` · `Batal` · `Suara: nyala/mati` · `Gerakan beruntun dihitung 1, cegukan tidak dihitung` · `Hanya alat pencatat, bukan alat medis`

### Aset
- Ikon kaki bayi: SVG inline (satu-satunya aset buatan sendiri)
- Ikon PWA 192 & 512 PNG (+ maskable): generate dari SVG dengan `@vite-pwa/assets-generator`
- Suara: disintesis Web Audio API, tanpa file audio

---

## 6. Arsitektur (Pemisahan Layer)

```
src/
├─ domain/session.ts          # business logic, pure, tanpa import apa pun
├─ data/sessionStore.ts       # akses IndexedDB saja
├─ device/feedback.ts         # adapter perangkat: suara, getar, wake lock
├─ lib/format.ts              # format tampilan (waktu, tanggal, durasi)
├─ lib/share.ts               # susun teks + buka WhatsApp
├─ hooks/useTodaySession.ts   # glue: state + orkestrasi
└─ components/
   ├─ KickButton.tsx          # UI murni (props in, event out)
   ├─ ConfirmSheet.tsx
   └─ HomePage.tsx            # menyusun komponen
```

- **Arah dependency**: `components → hooks → (domain, data, device)`. `domain` tidak import siapa pun
- **domain**: aturan bisnis (target, batas 2 jam, tap, undo). Pure → test tanpa mock
- **data**: hanya tahu IndexedDB, tanpa aturan bisnis
- **device** (adapter/infrastructure): bicara dengan API browser/hardware; `AudioContext` dan `navigator.vibrate` tidak tersebar di komponen
- **hook (glue/orchestrator)**: ambil dari store → jalankan fungsi domain → simpan → update state → panggil feedback. Tidak berisi aturan bisnis maupun markup

---

## 7. Kode Inti

### domain/session.ts
```ts
export interface Session {
  date: string          // 'YYYY-MM-DD' lokal, primary key (1 sesi/hari)
  startedAt: number     // epoch ms
  endedAt?: number      // epoch ms
  kicks: number[]       // epoch ms per gerakan
  note?: string
  status: 'active' | 'done'
}

export const TARGET = 10
export const LIMIT_MS = 2 * 60 * 60 * 1000

export const todayKey = () => new Date().toLocaleDateString('sv-SE')

export const newSession = (now = Date.now()): Session =>
  ({ date: todayKey(), startedAt: now, kicks: [], status: 'active' })

export function settle(s: Session, now = Date.now()): Session {
  if (s.status !== 'active' || now - s.startedAt < LIMIT_MS) return s
  return { ...s, status: 'done', endedAt: s.startedAt + LIMIT_MS }
}

export function tap(s: Session, now = Date.now()): Session {
  s = settle(s, now)
  if (s.status !== 'active' || s.kicks.length >= TARGET) return s
  return { ...s, kicks: [...s.kicks, now] }
}

export const undo = (s: Session): Session =>
  s.status === 'active' ? { ...s, kicks: s.kicks.slice(0, -1) } : s

export const needsConfirm = (s: Session) =>
  s.status === 'active' && s.kicks.length >= TARGET

export const confirmDone = (s: Session): Session =>
  ({ ...s, status: 'done', endedAt: s.kicks[TARGET - 1] })

// sesi saat ini: hari ini, atau masih berjalan (lewat tengah malam)
export const isCurrent = (s: Session, today = todayKey()) =>
  s.date === today || s.status === 'active'
```

### data/sessionStore.ts
```ts
import type { Session } from '../domain/session'

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  return (dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('kickcount', 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('sessions', { keyPath: 'date' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }))
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function store(mode: IDBTransactionMode = 'readonly') {
  return (await open()).transaction('sessions', mode).objectStore('sessions')
}

export const sessionStore = {
  async getLatest(): Promise<Session | undefined> {
    const cursor = await wrap((await store()).openCursor(null, 'prev'))
    return cursor?.value
  },
  async getByDate(date: string): Promise<Session | undefined> {
    return wrap((await store()).get(date))
  },
  async getAll(): Promise<Session[]> {
    return wrap((await store()).getAll())
  },
  async save(s: Session) {
    await wrap((await store('readwrite')).put(s)) // put = idempotent per tanggal
  },
  async remove(date: string) {
    await wrap((await store('readwrite')).delete(date))
  },
}

export const requestPersist = () => navigator.storage?.persist?.()
```

- Skema berubah → naikkan versi + handle di `onupgradeneeded`
- Panggil `requestPersist()` sekali di `main.tsx`

### lib/format.ts
```ts
const timeFmt = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit', minute: '2-digit', hour12: false,
})
const dateFmt = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric',
})

export const formatTime = (ms: number) => timeFmt.format(ms)   // contoh: 20.15
export const formatDate = (ms: number) => dateFmt.format(ms)

export function formatDuration(ms: number) {
  const t = Math.floor(Math.max(0, ms) / 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`
}
```

### lib/share.ts
```ts
import { TARGET, type Session } from '../domain/session'
import { formatDate, formatDuration, formatTime } from './format'

export function shareToWhatsApp(s: Session) {
  const end = s.endedAt ?? s.startedAt
  const text =
    `Baby Kick Count ${formatDate(s.startedAt)}\n` +
    `Gerakan: ${s.kicks.length}/${TARGET}\n` +
    `Mulai ${formatTime(s.startedAt)} · Selesai ${formatTime(end)}\n` +
    `Durasi ${formatDuration(end - s.startedAt)}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}
```
Isi pesan hanya data, tanpa interpretasi. Opsional: `navigator.share` dulu, fallback `wa.me`.

### device/feedback.ts
```ts
let ctx: AudioContext | null = null
let muted = localStorage.getItem('kc-muted') === '1'
let lock: WakeLockSentinel | null = null

function beep(freq: number, ms: number) {
  if (muted) return
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + ms / 1000)
}

export const feedback = {
  tap() { navigator.vibrate?.(30); beep(520, 90) },
  complete() { navigator.vibrate?.([60, 40, 60]); beep(780, 250) },
  isMuted: () => muted,
  setMuted(v: boolean) {
    muted = v
    localStorage.setItem('kc-muted', v ? '1' : '0')
  },
  async keepAwake() {
    try { lock = await navigator.wakeLock.request('screen') } catch { /* tidak didukung / ditolak */ }
  },
  release() { lock?.release(); lock = null },
}
```

- Panggil dari handler tap (user gesture, lolos autoplay policy)
- Volume lembut; iOS silent switch juga membisukan Web Audio
- `navigator.vibrate` **tidak didukung iOS Safari** → suara jadi satu-satunya feedback non-visual
- Wake Lock otomatis lepas saat background → re-acquire di `visibilitychange`

### hooks/useTodaySession.ts
```ts
import { useCallback, useEffect, useState } from 'react'
import * as d from '../domain/session'
import { sessionStore } from '../data/sessionStore'
import { feedback } from '../device/feedback'

export function useTodaySession() {
  const [session, setSession] = useState<d.Session | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [now, setNow] = useState(Date.now())
  const active = session?.status === 'active'

  const commit = useCallback(async (next: d.Session) => {
    setSession(next)               // UI langsung berubah
    await sessionStore.save(next)  // lalu persist
  }, [])

  // muat sesi saat app dibuka (termasuk yang melewati tengah malam)
  useEffect(() => {
    sessionStore.getLatest()
      .then(latest => {
        if (!latest) return
        const settled = d.settle(latest)
        if (!d.isCurrent(settled)) return
        setSession(settled)
        if (settled !== latest) sessionStore.save(settled)
      })
      .finally(() => setLoaded(true))
  }, [])

  // timer + selesai otomatis 2 jam
  useEffect(() => {
    if (!session || !active) return
    const id = setInterval(() => {
      setNow(Date.now())
      const settled = d.settle(session)
      if (settled !== session) commit(settled)
    }, 1000)
    return () => clearInterval(id)
  }, [session, active, commit])

  // layar tetap menyala selama sesi
  useEffect(() => {
    if (!active) return
    feedback.keepAwake()
    const onVisible = () =>
      document.visibilityState === 'visible' && feedback.keepAwake()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      feedback.release()
    }
  }, [active])

  return {
    loaded,
    session,
    elapsedMs: session ? now - session.startedAt : 0,
    askConfirm: !!session && d.needsConfirm(session),

    start: () => {
      if (!loaded || session?.date === d.todayKey()) return // 1 sesi/hari
      feedback.tap()
      commit(d.newSession())
    },
    press: () => {
      if (!session) return
      const next = d.tap(session)
      if (next === session) return
      if (next.status === 'active') {
        next.kicks.length >= d.TARGET ? feedback.complete() : feedback.tap()
      }
      commit(next)
    },
    undo: () => session && commit(d.undo(session)),
    confirm: () => session && commit(d.confirmDone(session)),
    remove: async () => {
      if (session) await sessionStore.remove(session.date)
      setSession(null)
    },
  }
}
```

### components
```tsx
// KickButton.tsx (UI murni)
interface Props { count: number; target: number; running: boolean; onPress: () => void }

export function KickButton({ count, target, running, onPress }: Props) {
  return (
    <button className="kick-button" onClick={onPress} aria-label="Catat gerakan">
      {running ? `${count}/${target}` : 'Mulai'}
    </button>
  )
}
```

```tsx
// ConfirmSheet.tsx
interface Props { onNo: () => void; onYes: () => void }

export function ConfirmSheet({ onNo, onYes }: Props) {
  return (
    <div role="dialog" aria-label="Selesai?" className="confirm-sheet">
      <p>Selesai?</p>
      <button onClick={onNo}>Belum</button>
      <button onClick={onYes}>Ya</button>
    </div>
  )
}
```

```tsx
// HomePage.tsx
export function HomePage() {
  const s = useTodaySession()
  if (!s.loaded) return null

  const x = s.session
  const running = x?.status === 'active'
  const done = x?.status === 'done'

  const onRemove = () => {
    if (window.confirm('Hapus sesi hari ini?')) s.remove() // ganti dengan dialog sendiri bila perlu
  }

  return (
    <main>
      {running && <p>Sesi berjalan</p>}
      {running && <time>{formatDuration(Math.min(s.elapsedMs, LIMIT_MS))}</time>}

      {!done && (
        <KickButton
          count={x?.kicks.length ?? 0}
          target={TARGET}
          running={running}
          onPress={running ? s.press : s.start}
        />
      )}

      {running && <button onClick={s.undo}>Undo</button>}
      {s.askConfirm && <ConfirmSheet onNo={s.undo} onYes={s.confirm} />}

      {done && x && (
        <section>
          <p>{x.kicks.length}/{TARGET}</p>
          <p>{formatTime(x.startedAt)} – {formatTime(x.endedAt ?? x.startedAt)}</p>
          <p>{formatDuration((x.endedAt ?? x.startedAt) - x.startedAt)}</p>
          <button onClick={() => shareToWhatsApp(x)}>Bagikan ke WhatsApp</button>
        </section>
      )}

      {x && <button onClick={onRemove}>Hapus sesi</button>}
    </main>
  )
}
```

### Tes domain (`bun test`)
```ts
// domain/session.test.ts
// - tap ke-11 diabaikan (kicks.length tetap 10)
// - settle: sebelum 2 jam tidak berubah; sesudahnya done, endedAt = startedAt + LIMIT_MS
// - tap setelah 2 jam ditolak
// - undo hanya berlaku saat active
// - confirmDone: endedAt = kicks[9]
// - isCurrent: sesi active kemarin = true; sesi done kemarin = false
```

---

## 8. Tema

CSS variables + `prefers-color-scheme`, tanpa toggle manual.

```css
:root { --bg: #ffffff; --fg: #111418; --accent: #e8618c; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #0f1115; --fg: #e8eaed; --accent: #f08aab; }
}
body { background: var(--bg); color: var(--fg); }
```

Manifest hanya punya satu `theme_color`, jadi pakai meta di `index.html`:
```html
<meta name="theme-color" content="#0f1115" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
```

---

## 9. Setup PWA

```bash
bun create vite kickcount --template react-ts
cd kickcount
bun install
bun add -d vite-plugin-pwa
```

**vite.config.ts**
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Baby Kick Count',
        short_name: 'KickCount',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f1115',
        theme_color: '#0f1115',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
})
```

### Syarat installable
- Manifest valid (name, icon 192 & 512, `display: standalone`, `start_url`)
- Service worker terdaftar (di-handle plugin)
- HTTPS (`localhost` dikecualikan)

### Pembuktian
1. `bun run build && bun run preview`, buka di Chrome
2. DevTools → Application:
   - *Manifest*: tanpa error, icon tampil
   - *Service Workers*: "activated and running"
   - *Cache Storage*: ada precache assets
3. Uji offline: centang *Offline*, reload → app tetap jalan
4. Ikon install muncul di address bar → install → buka standalone
5. Lighthouse → Installability lolos
6. Uji di HP: deploy ke Cloudflare Pages → "Add to Home Screen" → matikan data → buka

### Catatan
- `autoUpdate`: versi baru aktif di reload berikutnya
- iOS Safari bisa membersihkan data situs yang lama tidak dibuka jika belum di-install ke Home Screen. Setelah di-install lebih aman, `navigator.storage.persist()` membantu, dan tetap sediakan export/backup JSON nanti

---

## 10. Checklist Implementasi

### Selesai (kode sudah ada di bagian 7)
- [x] Desain layer & aturan domain (`settle` / `tap` / `undo` / `confirmDone` / `isCurrent`)
- [x] `sessionStore` (IndexedDB, `date` sebagai primary key)
- [x] Format waktu, share WhatsApp, feedback (suara, getar, wake lock)
- [x] Hook `useTodaySession` (termasuk loading state)
- [x] Komponen dasar `KickButton`, `ConfirmSheet`, `HomePage`

### Tinggal dikerjakan
- [ ] Scaffold Vite + React TS dengan Bun, salin file dari bagian 7
- [ ] `main.tsx`: render `HomePage`, panggil `requestPersist()`
- [ ] `index.html`: `lang="id"`, meta `theme-color` dark/light
- [ ] Header (brand + ikon riwayat) dan footer (ringkasan terakhir, copyright, GitHub, disclaimer, toggle suara)
- [ ] Ringkasan "Terakhir" di footer: ambil dari `sessionStore.getAll()` / sesi sebelum hari ini
- [ ] Styling: dark/light, tombol bulat besar, ring progress 10 segmen (tanpa animasi), bottom sheet
- [ ] Aset: SVG kaki bayi, ikon PWA (generate), favicon
- [ ] PWA plugin + manifest
- [ ] Tes domain dengan `bun test`
- [ ] Ganti `window.confirm` dengan dialog sendiri (opsional)
- [ ] Deploy Cloudflare Pages (`kickcount.pages.dev`) + uji offline di HP (Android & iOS)
- [ ] (Nanti) halaman riwayat, grafik, export JSON, pengingat

---

## 11. Keputusan & Catatan Penting

- `date` sebagai primary key menggantikan `id` autoIncrement + unique index: menghilangkan risiko baris ganda saat tap cepat sebelum `save` pertama selesai
- Tanpa status `incomplete`: sesi menggantung cukup diselesaikan oleh aturan 2 jam
- Jam `id-ID` memakai titik (`20.15`), bukan titik dua
- `endedAt` selalu timestamp kejadian (tap ke-10 atau batas 2 jam), bukan waktu klik/buka app
- Preferensi mute disimpan di `localStorage` (satu flag kecil, bukan data sesi)