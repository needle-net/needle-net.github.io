/*!
 * Needle — мессенджер. © 2026 Needle (toner). Все права защищены.
 * Секретов тут нет: только публичный ключ Supabase. Все права проверяет база (функции nv_*).
 * Личные сообщения шифруются прямо в браузере (ECDH P-256 + AES-GCM).
 */
(() => {
  "use strict";
  const API = "https://knzhaqttibsiyczpfveb.supabase.co";
  const KEY = "sb_publishable_N59Y2_KXDcB9xbmVXrjHMA_Yn3yG_qZ";
  const SITE = location.origin + "/";

  // ================= мелочи =================
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const h = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const tl = s => s;
  const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }, del(k) { try { localStorage.removeItem(k); } catch {} } };
  const isPhone = () => matchMedia("(max-width: 760px)").matches;
  const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? c : d > 1 && d < 5 ? b : d === 1 ? a : c; };
  const fmtN = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(n);
  const hm = d => new Date(d).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  const fmtTime = d => { d = new Date(d); const n = new Date(); if (d.toDateString() === n.toDateString()) return hm(d); if (n - d < 6 * 864e5) return d.toLocaleDateString("ru", { weekday: "short" }); return d.toLocaleDateString("ru", { day: "2-digit", month: "2-digit", year: d.getFullYear() === n.getFullYear() ? undefined : "2-digit" }); };
  const dayLabel = d => { d = new Date(d); const n = new Date(), y = new Date(Date.now() - 864e5); if (d.toDateString() === n.toDateString()) return "Сегодня"; if (d.toDateString() === y.toDateString()) return "Вчера"; return d.toLocaleDateString("ru", { day: "numeric", month: "long", year: d.getFullYear() === n.getFullYear() ? undefined : "numeric" }); };
  const ago = d => { const s = (Date.now() - new Date(d)) / 1000; if (s < 60) return "только что"; if (s < 3600) return Math.floor(s / 60) + " мин назад"; if (s < 86400) return Math.floor(s / 3600) + " ч назад"; return new Date(d).toLocaleDateString("ru", { day: "numeric", month: "long" }); };
  const dateRu = d => new Date(d).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" });
  const debounce = (f, ms) => { let t = 0; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };
  const copy = async (t, msg = "Скопировано") => { try { await navigator.clipboard.writeText(t); toast(msg); } catch { toast(t); } };

  // ================= иконки (свои, тонкие линии) =================
  const svg = (p, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const I = {
    menu: svg('<path d="M4 6.5h16M4 12h16M4 17.5h16"/>'),
    back: svg('<path d="M19 12H5.5M11 5.5L4.5 12l6.5 6.5"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    search: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/>'),
    more: svg('<circle cx="12" cy="5.5" r="1.3" class="f"/><circle cx="12" cy="12" r="1.3" class="f"/><circle cx="12" cy="18.5" r="1.3" class="f"/>'),
    pen: svg('<path d="M4.5 19.5l1-4L15.8 5.2a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.5 18.5z"/><path d="M14 7l3 3"/>'),
    send: svg('<path d="M4 11.6L19.6 4.5c.5-.2 1 .3.8.8L13.3 20.9c-.2.5-1 .5-1.1-.1L10.6 13.4 3.3 11.9c-.6-.1-.6-.9-.1-1.1z"/><path d="M10.6 13.4l4.2-4.2"/>'),
    clip: svg('<path d="M19.5 11.5l-7.6 7.6a4.8 4.8 0 0 1-6.8-6.8l8-8a3.2 3.2 0 0 1 4.5 4.5l-8 8a1.6 1.6 0 0 1-2.3-2.3l7.3-7.3"/>'),
    photo: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 15.5l-4.5-4.5-8.5 8.5"/>'),
    file: svg('<path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><path d="M13.5 3.5V9H19"/>'),
    poll: svg('<path d="M5.5 19.5v-7M12 19.5v-15M18.5 19.5v-10"/>'),
    smile: svg('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14c.8 1.3 2 2 3.5 2s2.7-.7 3.5-2"/><circle cx="9.2" cy="9.8" r=".9" class="f"/><circle cx="14.8" cy="9.8" r=".9" class="f"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    check2: svg('<path d="M2.5 12.5l4.5 4.5 9.5-9.5M11.5 16.8l.2.2 9.5-9.5"/>'),
    pin: svg('<path d="M14.5 4l5.5 5.5-2.2.8-3.6 3.6.4 4.1-1.6 1.6-3.8-3.8L5 20l-.2-.2 4.3-4.3-3.8-3.8 1.6-1.6 4.1.4 3.6-3.6z"/>'),
    unpin: svg('<path d="M14.5 4l5.5 5.5-2.2.8-3.6 3.6.4 4.1-1.6 1.6-3.8-3.8L5 20l-.2-.2 4.3-4.3-3.8-3.8 1.6-1.6 4.1.4 3.6-3.6z"/><path d="M3.5 3.5l17 17"/>'),
    bell: svg('<path d="M6.5 16.5v-5a5.5 5.5 0 0 1 11 0v5l1.5 2h-14z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    mute: svg('<path d="M6.5 16.5v-5a5.5 5.5 0 0 1 8.6-4.5M17.5 11v5.5l1.5 2H8M10 20.5a2 2 0 0 0 4 0"/><path d="M4 4l16 16"/>'),
    archive: svg('<rect x="3.5" y="4.5" width="17" height="4.5" rx="1.2"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>'),
    unarchive: svg('<rect x="3.5" y="4.5" width="17" height="4.5" rx="1.2"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M12 17.5v-6M9.5 14l2.5-2.5 2.5 2.5"/>'),
    trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l.9 12.2a2 2 0 0 0 2 1.8h5.2a2 2 0 0 0 2-1.8l.9-12.2M10 10.5v6M14 10.5v6"/>'),
    reply: svg('<path d="M10 5.5L4 11.5l6 6M4.5 11.5H14a6 6 0 0 1 6 6v1"/>'),
    forward: svg('<path d="M14 5.5l6 6-6 6M19.5 11.5H10a6 6 0 0 0-6 6v1"/>'),
    copy: svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>'),
    user: svg('<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/>'),
    users: svg('<circle cx="9" cy="9" r="3.5"/><path d="M2.5 19.5c1-3.2 3.4-5 6.5-5s5.5 1.8 6.5 5"/><path d="M15 5.7a3.5 3.5 0 0 1 0 6.6M17.5 14.8c2 .6 3.3 2.2 4 4.7"/>'),
    channel: svg('<path d="M4 9.5v5a1 1 0 0 0 1 1h2.5l7.5 4V4.5l-7.5 4H5a1 1 0 0 0-1 1z"/><path d="M18 9a4 4 0 0 1 0 6"/>'),
    saved: svg('<path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.5-6.5 4.5v-16a1 1 0 0 1 1-1z"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2.8l1.6 2.1 2.6-.5 1 2.4 2.5 1-.5 2.6 2.1 1.6-2.1 1.6.5 2.6-2.5 1-1 2.4-2.6-.5L12 21.2l-1.6-2.1-2.6.5-1-2.4-2.5-1 .5-2.6L2.8 12l2.1-1.6-.5-2.6 2.5-1 1-2.4 2.6.5z"/>'),
    moon: svg('<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
    lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
    shield: svg('<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>'),
    devices: svg('<rect x="2.5" y="5" width="13" height="9.5" rx="1.5"/><path d="M1.5 17.5h11"/><rect x="16.5" y="8" width="5.5" height="11" rx="1.3"/>'),
    laptop: svg('<rect x="4.5" y="5" width="15" height="10.5" rx="1.5"/><path d="M2.5 18.5h19"/>'),
    phone: svg('<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>'),
    qr: svg('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 20h1M20 14v1"/>'),
    camera: svg('<path d="M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5L16 6.5h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.5"/>'),
    logout: svg('<path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5"/>'),
    folder: svg('<path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'),
    feed: svg('<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
    heart: svg('<path d="M12 19.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 6.8a4.3 4.3 0 0 1 7.5 2.5c0 5.6-7.5 10.2-7.5 10.2z"/>'),
    comment: svg('<path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.3-4.4A7.5 7.5 0 1 1 20 11.5z"/>'),
    eye: svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeoff: svg('<path d="M9.9 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.5 7.2C3.9 8.9 2.5 12 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 4.7-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>'),
    timer: svg('<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>'),
    block: svg('<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>'),
    link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    at: svg('<circle cx="12" cy="12" r="3.8"/><path d="M15.8 8.5v4.8a2.6 2.6 0 0 0 5.2 0V12a9 9 0 1 0-3.6 7.2"/>'),
    download: svg('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>'),
    read: svg('<path d="M4 12.5l4 4 10-10"/><path d="M4 20h16"/>'),
    unread: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3" class="f"/>'),
    key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.5 2.5M14 9l2 2"/>'),
    mail: svg('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>'),
    star: svg('<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z"/>'),
    admin: svg('<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/>'),
    stop: svg('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
    retry: svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4"/>'),
    chats: svg('<path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.3-4.4A7.5 7.5 0 1 1 20 11.5z"/>'),
    text: svg('<path d="M5 6.5V5h14v1.5M12 5v14M9.5 19h5"/>'),
    calendar: svg('<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>'),
    id: svg('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 15.5c.6-1.3 1.6-2 3-2s2.4.7 3 2M14.5 10h3M14.5 13.5h3"/>'),
    verified: `<span class="vf" title="Подтверждён"><svg viewBox="0 0 24 24"><path class="vb" d="M12 2.5l2.3 1.8 2.9-.3 1 2.7 2.6 1.4-.6 2.8 1.3 2.6-2.2 1.9-.3 2.9-2.8.7-1.6 2.4-2.6-1.2-2.6 1.2-1.6-2.4-2.8-.7-.3-2.9-2.2-1.9 1.3-2.6-.6-2.8 2.6-1.4 1-2.7 2.9.3z"/><path class="vc" d="M8.3 12.2l2.5 2.5 4.9-5"/></svg></span>`,
  };
  const STAR = '<path class="thr" d="M30.5 13.5C20 13.5 8 18 6.5 23.5c-.5 2 .5 3.4 2 4.2" stroke-width="1.3"/><path class="ndl" fill="currentColor" stroke="none" fill-rule="evenodd" d="M12.6 37.6L26.4 6.2C27.3 4.1 29.2 3 30.6 3.6c1.4.6 1.5 2.6.4 4.7L13.2 37.8zM28.3 7.4c-.6 1.3-.7 2.5-.2 2.7.5.2 1.2-.7 1.8-2 .6-1.3.7-2.5.2-2.7-.5-.2-1.2.7-1.8 2z"/><path class="thr" d="M33.2 16.2c2.4 1.7 1.7 4.6-1.8 7.4-3.6 2.8-9.6 5-15.8 5.9" stroke-width="1.3"/>';
  const LOGO = `<svg class="logo" viewBox="0 0 40 40" aria-hidden="true">${STAR}</svg>`;

  // ================= ошибки по-русски =================
  const ERR = {
    "device not trusted": "Подтверди вход кодом", "code expired": "Код устарел, запроси новый", "too many tries": "Слишком много попыток, запроси новый код", "qr expired": "QR-код устарел, обнови его на том устройстве", "too many devices": "Слишком много устройств, отключи лишние в настройках", "no device": "Обнови страницу",
    "blocked": "Этот человек ограничил тебе сообщения", "dm closed": "Этот человек не принимает новые личные сообщения", "banned here": "Тебя забанили в этом чате", "comments off": "Комментарии выключены", "poll closed": "Опрос завершён",
    "no access": "Это закрытый чат: войти можно только по ссылке-приглашению", "no chat": "Ничего не нашлось по этой ссылке",
    "too fast": "Слишком быстро, подожди пару секунд", "no links": "Ссылки и @ники писать нельзя", "limit 3": "Можно создать не больше 3 групп и каналов",
    "bad length": "Слишком длинно или пусто", "join first": "Сначала вступи", "channel owner only": "Писать в канал может только его автор",
    "not signed in": "Нужно войти заново", "banned": "Аккаунт заблокирован", "no anon here": "Здесь нельзя писать анонимно",
    "Invalid login credentials": "Неверная почта или пароль", "User already registered": "Эта почта уже зарегистрирована",
    "Email not confirmed": "Подтверди почту: открой письмо и нажми ссылку", "bad photo": "Фото не загрузилось", "empty": "Пусто",
    "reserved username": "Этот юзернейм занят", "bad username": "Юзернейм: 3–20 символов, латиница, цифры и _", "bad name": "Имя: до 40 символов, без ссылок", "bad birth": "Проверь дату рождения",
    "no request": "Заявка уже обработана", "not yours": "Нет прав", "no user": "Пользователь не найден", "locked": "Сначала открой переписку паролем",
    "file big": "Файл больше 8 МБ", "bad file": "Файл не загрузился", "pin limit": "Можно закрепить до 5 чатов", "no key": "Собеседник ещё не заходил в Needle", "gone": "Файл удалён", "dm must be encrypted": "Сообщение не зашифровалось",
    "Token has expired": "Ссылка устарела, запроси новую", "otp_expired": "Ссылка устарела, запроси новую", "Password should be": "Пароль слишком простой",
  };
  const errText = e => {
    const m = (e && (e.message || e.error_description || e.msg)) || String(e || "");
    const sl = /slow:(\d+)/.exec(m); if (sl) return "Медленный режим: подожди " + sl[1] + " сек.";
    for (const k in ERR) if (m.includes(k)) return ERR[k];
    if (/rate limit|too many/i.test(m)) return "Слишком много попыток, подожди немного";
    if (/fetch|network/i.test(m)) return "Нет связи с сервером";
    return "Ошибка: " + m.slice(0, 120);
  };

  // ================= устройство =================
  // у каждого браузера свой случайный ключ; на сервере лежит только его хэш
  const DEV = (() => { let t = store.get("needle-dev", ""); if (!/^[A-Za-z0-9_-]{43}$/.test(t)) { t = b64u(crypto.getRandomValues(new Uint8Array(32))); store.set("needle-dev", t); } return t; })();
  const devName = () => {
    const u = navigator.userAgent;
    const br = /Edg\//.test(u) ? "Edge" : /OPR\//.test(u) ? "Opera" : /YaBrowser/.test(u) ? "Яндекс Браузер" : /Firefox\//.test(u) ? "Firefox" : /Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : "Браузер";
    const os = /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) ? "iPad" : /Android/.test(u) ? "Android" : /Windows/.test(u) ? "Windows" : /Mac OS X/.test(u) ? "macOS" : /Linux/.test(u) ? "Linux" : "";
    return br + (os ? " · " + os : "");
  };

  // ================= Supabase =================
  const sb = window.supabase ? window.supabase.createClient(API, KEY, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "nova-auth" },
    global: { headers: { "x-needle-device": DEV } },
  }) : null;
  const rpc = async (fn, args = {}) => { const { data, error } = await sb.rpc(fn, args); if (error) throw error; return data; };
  const pub = (bucket, path) => `${API}/storage/v1/object/public/${bucket}/${path}`;
  const PATH_RE = /^[0-9a-f-]{36}\/[0-9]{10,14}\.(webp|jpg)$/;
  let ME = null, session = null, PREFS = { folders: [], priv_seen: "all", priv_dm: "all", blocked: [] };

  // ================= оформление =================
  const CFG = Object.assign({ theme: "system", size: 16, sound: true, preview: true, enter: true }, store.get("needle2-cfg", {}));
  const saveCfg = () => { store.set("needle2-cfg", CFG); applyCfg(); };
  const darkNow = () => CFG.theme === "dark" || (CFG.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  function applyCfg() {
    document.documentElement.dataset.theme = darkNow() ? "dark" : "light";
    document.documentElement.style.setProperty("--fs", CFG.size + "px");
    const m = $('meta[name="theme-color"]'); if (m) m.content = darkNow() ? "#1c1d1f" : "#fbfbfb";
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyCfg);
  applyCfg();

  // ================= всплывашки =================
  function toast(t) {
    const box = $("#toasts"); if (!box) return;
    const el = h(`<div class="toast">${esc(t)}</div>`); box.append(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 250); }, 3000);
  }
  // окно как в Telegram: заголовок, текст, кнопки справа
  function popup({ title = "", text = "", html = "", buttons = [], onMount, wide = false, cls = "" }) {
    return new Promise(res => {
      const el = h(`<div class="pop-wrap"><div class="pop${wide ? " wide" : ""} ${cls}" role="dialog" aria-modal="true">
        ${title ? `<div class="pop-t">${esc(title)}</div>` : ""}${text ? `<div class="pop-x">${esc(text)}</div>` : ""}${html}
        ${buttons.length ? `<div class="pop-b">${buttons.map((b, i) => `<button class="tb${b.danger ? " danger" : ""}${b.main ? " main" : ""}" data-i="${i}">${esc(b.t)}</button>`).join("")}</div>` : ""}</div></div>`);
      const card = el.firstChild;
      const done = v => { if (!el.isConnected) return; el.classList.add("out"); document.removeEventListener("keydown", key); setTimeout(() => el.remove(), 160); res(v); };
      const key = e => { if (e.key === "Escape") done(null); if (e.key === "Enter" && !e.shiftKey && e.target.tagName !== "TEXTAREA") { const m = buttons.findIndex(b => b.main || b.danger); if (m >= 0 && !buttons[m].manual) { e.preventDefault(); $(`[data-i="${m}"]`, card).click(); } } };
      el.addEventListener("pointerdown", e => { if (e.target === el) done(null); });
      document.addEventListener("keydown", key);
      $$(".pop-b [data-i]", card).forEach(b => b.onclick = async () => { const B = buttons[+b.dataset.i]; if (B.click) { const r = await B.click(card); if (r === false) return; done(r === undefined ? B.v ?? +b.dataset.i : r); } else done(B.v ?? +b.dataset.i); });
      document.body.append(el);
      onMount && onMount(card, done);
      const f = $("input:not([type=file]):not([type=checkbox]),textarea", card); if (f && !isPhone()) setTimeout(() => f.focus(), 40);
    });
  }
  const confirmBox = (title, text, yes = "Удалить", danger = true) => popup({ title, text, buttons: [{ t: "Отмена", v: false }, { t: yes, v: true, danger, main: !danger }] }).then(v => v === true);

  // контекстное меню как в Telegram (правый клик / долгое нажатие)
  let menuEl = null;
  function ctxMenu(x, y, items, head = "") {
    closeMenu();
    const list = items.filter(Boolean);
    menuEl = h(`<div class="menu-wrap"><div class="menu">${head}${list.map((it, i) => it === "-" ? `<div class="sep"></div>` : `<button class="mi${it.danger ? " danger" : ""}" data-i="${i}">${it.i || ""}<span>${esc(it.t)}</span></button>`).join("")}</div></div>`);
    const m = menuEl.firstChild; document.body.append(menuEl);
    const r = m.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    m.style.left = Math.max(8, Math.min(x, W - r.width - 8)) + "px";
    m.style.top = Math.max(8, Math.min(y, H - r.height - 8)) + "px";
    m.style.transformOrigin = (x > W - r.width - 8 ? "right " : "left ") + (y > H - r.height - 8 ? "bottom" : "top");
    menuEl.addEventListener("pointerdown", e => { if (e.target === menuEl) closeMenu(); });
    menuEl.addEventListener("contextmenu", e => { e.preventDefault(); closeMenu(); });
    $$("[data-i]", m).forEach(b => b.onclick = () => { const it = list[+b.dataset.i]; closeMenu(); it.f && it.f(); });
    return m;
  }
  function closeMenu() { if (menuEl) { const e = menuEl; menuEl = null; e.classList.add("out"); setTimeout(() => e.remove(), 120); } }
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
  // правый клик и долгое нажатие на телефоне
  function onHold(el, fn) {
    el.addEventListener("contextmenu", e => { e.preventDefault(); fn(e.clientX, e.clientY); });
    let t = 0, sx = 0, sy = 0;
    el.addEventListener("touchstart", e => { const p = e.touches[0]; sx = p.clientX; sy = p.clientY; t = setTimeout(() => { el._held = true; navigator.vibrate && navigator.vibrate(10); fn(sx, sy); }, 480); }, { passive: true });
    el.addEventListener("touchmove", e => { const p = e.touches[0]; if (Math.abs(p.clientX - sx) + Math.abs(p.clientY - sy) > 10) clearTimeout(t); }, { passive: true });
    ["touchend", "touchcancel"].forEach(ev => el.addEventListener(ev, () => clearTimeout(t), { passive: true }));
    el.addEventListener("click", e => { if (el._held) { el._held = false; e.stopPropagation(); e.preventDefault(); } }, true);
  }
  const menuAt = (btn, items) => { const r = btn.getBoundingClientRect(); return ctxMenu(r.right - 220, r.bottom + 4, items); };

  // поле ввода с плавающей подписью, как в Telegram
  const field = (name, label, attrs = "", val = "") => `<label class="fld"><input name="${name}" placeholder=" " value="${esc(val)}" ${attrs}><span>${esc(label)}</span></label>`;
  const areaField = (name, label, attrs = "", val = "") => `<label class="fld"><textarea name="${name}" placeholder=" " rows="3" ${attrs}>${esc(val)}</textarea><span>${esc(label)}</span></label>`;
  const sw = (on, attrs = "") => `<span class="sw${on ? " on" : ""}" ${attrs}></span>`;

  function lightbox(src) {
    const el = h(`<div class="lb"><img alt=""><button class="ib lb-x" aria-label="Закрыть">${I.close}</button></div>`);
    $("img", el).src = src; el.onclick = () => { el.classList.add("out"); setTimeout(() => el.remove(), 160); };
    document.body.append(el);
  }

  // ================= аватарки и имена =================
  const avUrl = p => p && p.avatar && /^[0-9a-f-]{36}\/[0-9]{10,14}\.webp$/.test(p.avatar) ? pub("avatars", p.avatar) : "";
  const initials = s => { const w = String(s || "?").trim().split(/\s+/); return esc(((w[0] || "?")[0] + (w[1] ? w[1][0] : "")).toUpperCase()); };
  const shade = id => { let n = 0; for (const c of String(id || "")) n = (n * 31 + c.charCodeAt(0)) >>> 0; return n % 5; };
  function av(p, cls = "") {
    const u = avUrl(p);
    return `<span class="av s${shade(p && p.id)} ${cls}">${u ? `<img src="${esc(u)}" alt="" loading="lazy">` : initials(p && (p.name || p.username))}</span>`;
  }
  const chatAv = (c, cls = "") => c.saved ? `<span class="av sv ${cls}">${I.saved}</span>` : c.kind === "dm" ? av(c.peer || {}, cls) : `<span class="av s${shade(c.id)} ${cls}">${initials(c.title)}</span>`;
  const pname = p => p ? esc(p.name || p.username) : "Удалённый аккаунт";
  const uname = p => p ? `<span class="nm">${pname(p)}</span>${p.verified || p.is_admin ? I.verified : ""}` : "Удалённый аккаунт";
  const chatTitle = c => c.saved ? "Избранное" : c.kind === "dm" ? (c.peer ? pname(c.peer) : "Удалённый аккаунт") : esc(c.title);
  const chatName = c => c.saved ? "Избранное" : c.kind === "dm" ? uname(c.peer) : `<span class="nm">${esc(c.title)}</span>${c.official ? I.verified : ""}`;
  const anonName = x => `Аноним #${x.tag}`;
  const seenText = t => {
    if (t === undefined) return "";
    if (!t) return "был(а) недавно";
    const m = (Date.now() - new Date(t)) / 60000;
    if (m < 7) return "в сети";
    if (m < 60) return `был(а) ${Math.floor(m)} мин назад`;
    if (sameDay(t, Date.now())) return `был(а) сегодня в ${hm(t)}`;
    if (m < 2880 && sameDay(t, Date.now() - 864e5)) return `был(а) вчера в ${hm(t)}`;
    return `был(а) ${new Date(t).toLocaleDateString("ru", { day: "numeric", month: "long" })}`;
  };
  const members = (c) => `${c.members} ${c.kind === "channel" ? plural(c.members, "подписчик", "подписчика", "подписчиков") : plural(c.members, "участник", "участника", "участников")}`;
  const burnName = s => ({ 60: "1 минуту", 3600: "1 час", 86400: "1 день", 604800: "1 неделю" }[s] || s + " с");

  // ================= звук =================
  let AC = null;
  function beep() {
    if (!CFG.sound) return;
    try { AC = AC || new AudioContext(); const o = AC.createOscillator(), g = AC.createGain(); o.type = "sine"; o.frequency.value = 660; g.gain.setValueAtTime(.0001, AC.currentTime); g.gain.exponentialRampToValueAtTime(.06, AC.currentTime + .02); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + .22); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + .25); } catch {}
  }
  // ================= шифрование ЛС =================
  // Ключ создаётся в браузере. Копия лежит на сервере, зашифрованная паролем входа (PBKDF2 + AES-GCM),
  // поэтому переписка открывается на любом устройстве после входа. Сервер пароля не знает и ключ прочитать не может.
  const E2E = (() => {
    let kp = null, olds = [], uid = "", hasBox = false, backed = false; const cache = new Map();
    const ITER = 310000, ECDH = { name: "ECDH", namedCurve: "P-256" }, te = new TextEncoder();
    const db = () => new Promise((res, rej) => { const r = indexedDB.open("nova", 1); r.onupgradeneeded = () => r.result.createObjectStore("keys"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const idb = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const tx = d.transaction("keys", mode); const r = fn(tx.objectStore("keys")); tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); }); };
    const pubStr = async k => { const j = await crypto.subtle.exportKey("jwk", k); return j.x + "." + j.y; };
    const imp = s => { const [x, y] = s.split("."); return crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", x, y, ext: true }, ECDH, false, []); };
    const fresh = async () => { const k = await crypto.subtle.generateKey(ECDH, true, ["deriveKey"]); return { priv: k.privateKey, pub: await pubStr(k.publicKey) }; };
    const canExport = r => r && r.priv && r.priv.extractable;
    const wrapKey = async (pw, salt, n) => crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: n, hash: "SHA-256" },
      await crypto.subtle.importKey("raw", te.encode(pw), "PBKDF2", false, ["deriveKey"]), { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    async function seal(pw, r) {
      const j = await crypto.subtle.exportKey("jwk", r.priv), salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await wrapKey(pw, salt, ITER), te.encode(JSON.stringify({ d: j.d, x: j.x, y: j.y })));
      return JSON.stringify({ v: 1, n: ITER, s: b64u(salt), i: b64u(iv), c: b64u(ct), p: r.pub });
    }
    async function unseal(pw, box) {
      const b = JSON.parse(box);
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(b.i) }, await wrapKey(pw, unb64u(b.s), +b.n || ITER), unb64u(b.c));
      const j = JSON.parse(new TextDecoder().decode(pt));
      return { priv: await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", x: j.x, y: j.y, d: j.d, ext: true }, ECDH, true, ["deriveKey"]), pub: b.p };
    }
    const boxPub = box => { try { return JSON.parse(box).p; } catch { return null; } };
    const keepOld = async r => { if (!r || olds.some(o => o.pub === r.pub)) return; olds.push(r); await idb("readwrite", s => s.put(olds, "old:" + uid)); };
    const setMe = async r => { kp = r; await idb("readwrite", s => s.put(r, "me:" + uid)); if (ME && ME.pubkey !== r.pub) { await rpc("nv_set_key", { p_key: r.pub }); ME.pubkey = r.pub; } };
    const upload = async (pw, r) => { await rpc("nv_set_box", { p_box: await seal(pw, r) }); hasBox = backed = true; };
    // pw есть только сразу после входа (или когда человек ввёл его в окошке)
    async function init(id, pw) {
      kp = null; olds = []; uid = id; hasBox = backed = false; cache.clear();
      try {
        let rec = await idb("readonly", s => s.get("me:" + uid));
        olds = (await idb("readonly", s => s.get("old:" + uid))) || [];
        let box = null; try { box = await rpc("nv_get_box"); } catch {}
        hasBox = !!box;
        if (box && rec && rec.pub === boxPub(box)) { backed = true; await setMe(rec); return true; }
        if (pw) { await unlock(pw, rec, box); return !!kp; }
        if (box) { await keepOld(rec); return false; }            // ключ на сервере, нужен пароль
        if (!rec) rec = await fresh();
        await setMe(rec); return true;                             // ключ только здесь, сохраним при следующем вводе пароля
      } catch (e) { console.warn("e2e", e); return !!kp; }
    }
    async function unlock(pw, rec, box) {
      if (arguments.length < 2) { rec = kp || (await idb("readonly", s => s.get("me:" + uid))); box = await rpc("nv_get_box").catch(() => null); }
      if (box) {
        try { const r = await unseal(pw, box); if (rec && rec.pub !== r.pub) await keepOld(rec); await setMe(r); backed = true; return true; }
        catch { /* ящик закрыт старым паролем: создадим новый ключ */ }
      }
      if (rec && canExport(rec) && !(box && boxPub(box) === rec.pub)) { await setMe(rec); await upload(pw, rec); return true; }
      if (rec) await keepOld(rec);
      const r = await fresh(); await setMe(r); await upload(pw, r); return true;
    }
    async function shared(other, r) {
      const id = r.pub + "|" + other; if (cache.has(id)) return cache.get(id);
      const k = await crypto.subtle.deriveKey({ name: "ECDH", public: await imp(other) }, r.priv, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      cache.set(id, k); return k;
    }
    return {
      init, get pub() { return kp && kp.pub; }, get locked() { return !kp && hasBox; }, get backed() { return backed; },
      async unlock(pw) { await unlock(pw); return !!kp; },
      async rewrap(pw) { if (kp && canExport(kp)) await upload(pw, kp); else await unlock(pw); },
      async enc(text, peerPub) {
        if (!kp) throw new Error("locked");
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await shared(peerPub, kp), te.encode(text));
        return { p_body: b64u(ct), p_iv: b64u(iv), p_kp: kp.pub, p_kr: peerPub };
      },
      async dec(m) {
        if (!m.iv) return null;
        const mineKey = m.mine ? m.kp : m.kr, other = m.mine ? m.kr : m.kp;
        const r = [kp, ...olds].find(x => x && x.pub === mineKey); if (!r) return null;
        try { const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(m.iv) }, await shared(other, r), unb64u(m.body)); return new TextDecoder().decode(pt); } catch { return null; }
      },
      async code(a, b) {
        if (!a || !b) return "—";
        const d = new Uint8Array(await crypto.subtle.digest("SHA-256", te.encode([a, b].sort().join("|"))));
        return [...d.slice(0, 8)].map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase().match(/.{4}/g).join(" ");
      },
    };
  })();
  let PW = null;   // пароль живёт в памяти только до открытия ключа
  // окошко «введи пароль», чтобы открыть переписку на этом устройстве или сохранить ключ
  // окошко «введи пароль», чтобы открыть переписку на этом устройстве (или сохранить ключ на сервере)
  function keyPrompt(force) {
    if (!force && (E2E.backed || store.get("needle-keyask", 0) > Date.now())) return;
    const locked = E2E.locked;
    popup({
      title: locked ? "Открыть переписку" : "Сохранить ключ шифрования",
      text: locked ? "Личные сообщения зашифрованы. Введи пароль от аккаунта, чтобы открыть их на этом устройстве." : "Введи пароль от аккаунта: ключ шифрования сохранится на сервере закрытым твоим паролем, и переписка откроется на любом твоём устройстве.",
      html: `<div class="pop-f">${field("pw", "Пароль", 'type="password" maxlength="72" autocomplete="current-password"')}<div class="err"></div></div>`,
      buttons: [{ t: "Позже", v: false, click: () => { if (!locked) store.set("needle-keyask", Date.now() + 3 * 864e5); } }, { t: locked ? "Открыть" : "Сохранить", main: true, click: async card => {
        const pw = $("[name=pw]", card).value, er = $(".err", card); if (!pw) return false;
        try {
          const { error } = await sb.auth.signInWithPassword({ email: session.user.email, password: pw }); if (error) throw error;
          await E2E.unlock(pw); toast(locked ? "Переписка открыта" : "Ключ сохранён");
          if (Chat.id) Chat.open(Chat.id); Chats.draw(); return true;
        } catch (x) { er.textContent = errText(x); return false; }
      } }],
    });
  }
  // ================= картинки =================
  const makeImage = (file, size, square) => new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type) || file.size > 25e6) return rej(new Error("bad photo"));
    const img = new Image(), fr = new FileReader();
    img.onload = () => {
      const w = img.naturalWidth, hh = img.naturalHeight, cv = document.createElement("canvas"), x = cv.getContext("2d");
      if (square) { const s = Math.min(w, hh); cv.width = cv.height = size; x.drawImage(img, (w - s) / 2, (hh - s) / 2, s, s, 0, 0, size, size); }
      else { const k = Math.min(1, size / Math.max(w, hh)); cv.width = Math.round(w * k); cv.height = Math.round(hh * k); x.drawImage(img, 0, 0, cv.width, cv.height); }
      const tryQ = q => cv.toBlob(b => {
        if (b && b.type === "image/webp") { if (b.size > 950e3 && q > .4) return tryQ(q - .15); return res({ blob: b, ext: "webp", type: "image/webp" }); }
        if (square) return rej(new Error("bad photo"));
        cv.toBlob(j => j ? res({ blob: j, ext: "jpg", type: "image/jpeg" }) : rej(new Error("bad photo")), "image/jpeg", .8);
      }, "image/webp", q);
      tryQ(square ? .85 : .8);
    };
    img.onerror = fr.onerror = () => rej(new Error("bad photo"));
    fr.onload = () => { img.src = fr.result; };
    fr.readAsDataURL(file);
  });
  const dataUrl = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
  let upSeq = 0;
  async function upload(bucket, blob, ext, type) {
    const path = `${ME.id}/${Date.now() + (upSeq++ % 1000)}.${ext}`;
    const { error } = await sb.storage.from(bucket).upload(path, blob, { contentType: type, upsert: false, cacheControl: "31536000" });
    if (error) throw error; return path;
  }
  // файлы в чатах: до 8 МБ, в личке шифруются отдельным ключом, который лежит внутри зашифрованного сообщения
  const FMAX = 8 * 1024 * 1024;
  const fsize = n => n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(0) + " KB" : (n / 1048576).toFixed(1) + " MB";
  async function upFile(file, dm) {
    if (!file || file.size > FMAX) throw new Error("file big");
    let src = file, type = file.type || "application/octet-stream", name = (file.name || "file").slice(0, 120);
    if (/^image\/(jpeg|png|webp|bmp)$/.test(type)) { try { const im = await makeImage(file, 1600); src = im.blob; type = im.type; name = name.replace(/\.[^.]+$/, "") + "." + im.ext; } catch {} }
    if (!/^[a-z]+\/[A-Za-z0-9.+-]{1,60}$/.test(type)) type = "application/octet-stream";
    let bytes = await src.arrayBuffer(), meta = { name, size: bytes.byteLength, type };
    if (dm) {
      const k = crypto.getRandomValues(new Uint8Array(32)), iv = crypto.getRandomValues(new Uint8Array(12));
      bytes = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await crypto.subtle.importKey("raw", k, "AES-GCM", false, ["encrypt"]), bytes);
      Object.assign(meta, { k: b64u(k), iv: b64u(iv) });
    }
    meta.path = await upload("nova-files", new Blob([bytes], { type: "application/octet-stream" }), "bin", "application/octet-stream");
    return meta;
  }
  const blobCache = new Map();
  async function fileBlob(f) {
    if (blobCache.has(f.path)) return blobCache.get(f.path);
    const r = await fetch(pub("nova-files", f.path)); if (!r.ok) throw new Error("gone");
    let bytes = await r.arrayBuffer();
    if (f.k) bytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(f.iv) }, await crypto.subtle.importKey("raw", unb64u(f.k), "AES-GCM", false, ["decrypt"]), bytes);
    const u = URL.createObjectURL(new Blob([bytes], { type: f.type || "application/octet-stream" })); blobCache.set(f.path, u); return u;
  }
  function fileEl(f) {
    if (!f || !f.path || !/^[0-9a-f-]{36}\/[0-9]{10,14}\.bin$/.test(f.path)) return null;
    const kind = /^image\//.test(f.type) ? "img" : /^audio\//.test(f.type) ? "aud" : "doc";
    const el = h(`<div class="fl ${kind}">${kind === "doc" ? `<button class="fdoc"><span class="fic">${I.file}</span><span class="fdn"><b>${esc(f.name)}</b><small>${fsize(+f.size || 0)}</small></span></button>` : `<div class="spin"></div>`}</div>`);
    const gone = () => { el.innerHTML = `<span class="muted">${tl("Файл удалён: прошло 30 дней")}</span>`; };
    if (kind === "doc") $("button", el).onclick = async () => { try { const a = document.createElement("a"); a.href = await fileBlob(f); a.download = f.name || "file"; a.click(); } catch { gone(); } };
    else fileBlob(f).then(u => {
      if (kind === "img") { el.innerHTML = `<img class="ph" alt="">`; $("img", el).src = u; $("img", el).onclick = () => lightbox(u); }
      else { el.innerHTML = `<div class="aname">♪ ${esc(f.name)}</div><audio controls preload="metadata"></audio>`; $("audio", el).src = u; }
    }).catch(gone);
    return el;
  }
  // свои файлы старше 30 дней удаляются сами (бесплатное место не бесконечное)
  async function cleanFiles() {
    try {
      const { data } = await sb.storage.from("nova-files").list(ME.id, { limit: 300 }); if (!data) return;
      const old = data.filter(x => +x.name.split(".")[0] < Date.now() - 30 * 864e5).map(x => ME.id + "/" + x.name);
      if (old.length) await sb.storage.from("nova-files").remove(old);
    } catch {}
  }

  // ================= вход и регистрация (как в Telegram, по шагам) =================
  const Auth = {
    email: "", pass: "", qrT: 0, qrPoll: 0,
    stop() { clearTimeout(this.qrT); clearTimeout(this.qrPoll); },
    frame(inner, back) {
      this.stop();
      const root = $("#root");
      root.innerHTML = `<div class="auth">${back ? `<button class="ib auth-back" aria-label="Назад">${I.back}</button>` : ""}<div class="auth-c">${inner}</div><div class="auth-foot">Needle · ${new Date().getFullYear()}</div></div>`;
      if (back) $(".auth-back", root).onclick = back;
      const f = $("input", root); if (f && !isPhone()) setTimeout(() => f.focus(), 60);
      return root;
    },
    // шаг: форма с одним действием
    step({ icon = LOGO, title, sub, body, btn, back, links = "", onSubmit }) {
      const root = this.frame(`<div class="auth-ic">${icon}</div><h1>${title}</h1><p class="auth-sub">${sub}</p>
        <form class="auth-f" novalidate>${body}<div class="err"></div><button class="btn wide" type="submit">${btn}</button>${links}</form>`, back);
      const f = $("form", root), er = $(".err", f), b = $("button[type=submit]", f);
      f.onsubmit = async e => {
        e.preventDefault(); er.textContent = ""; b.disabled = true; b.classList.add("busy");
        try { await onSubmit(f, er); } catch (x) { er.textContent = errText(x); }
        if (b.isConnected) { b.disabled = false; b.classList.remove("busy"); }
      };
      $$("[data-eye]", f).forEach(x => x.onclick = () => { const i = $("input", x.parentElement); i.type = i.type === "password" ? "text" : "password"; x.innerHTML = i.type === "password" ? I.eye : I.eyeoff; });
      return root;
    },
    start(note = "") { if (isPhone()) return this.mail(note); this.qr(note); },
    // экран с QR-кодом: сканируешь телефоном, где уже вошёл
    async qr(note = "") {
      const root = this.frame(`<div class="qr-box"><div class="qr-img"><div class="spin"></div></div></div>
        <h1>Вход по QR-коду</h1>
        <ol class="qr-steps"><li><span>Открой Needle на телефоне, где ты уже вошёл</span></li><li><span>Зайди в <b>Настройки → Устройства → Подключить устройство</b></span></li><li><span>Наведи камеру телефона на этот код</span></li></ol>
        ${note ? `<div class="err">${esc(note)}</div>` : ""}
        <button class="btn wide ghost" data-mail>Войти по почте</button><button class="lnk" data-up>Создать аккаунт</button>`);
      $("[data-mail]", root).onclick = () => this.mail();
      $("[data-up]", root).onclick = () => this.signup();
      const box = $(".qr-img", root);
      const make = async () => {
        if (!$(".qr-img")) return;
        try {
          const r = await rpc("nv_qr_new", { p_token: DEV, p_name: devName() });
          const url = SITE + "?qr=" + r.id + "." + r.secret;
          box.innerHTML = qrSvg(url) + `<span class="qr-logo">${LOGO}</span>`;
          box.dataset.id = r.id;
          this.qrT = setTimeout(make, 120000);
        } catch (e) { box.innerHTML = `<div class="qr-off">QR-вход пока недоступен</div>`; return; }
        const poll = async () => {
          if (!$(".qr-img") || box.dataset.id === undefined) return;
          try {
            const st = await rpc("nv_qr_state", { p_id: box.dataset.id, p_token: DEV });
            if (st === "ok") {
              box.innerHTML = `<div class="spin"></div>`; this.stop();
              const res = await fetch(API + "/functions/v1/needle-qr", { method: "POST", headers: { "content-type": "application/json", apikey: KEY }, body: JSON.stringify({ id: box.dataset.id, token: DEV }) });
              const j = await res.json().catch(() => ({}));
              if (!res.ok || !j.token_hash) throw new Error("qr expired");
              const { error } = await sb.auth.verifyOtp({ token_hash: j.token_hash, type: "magiclink" }); if (error) throw error;
              return boot();
            }
          } catch (e) { return this.qr(errText(e)); }
          this.qrPoll = setTimeout(poll, 2000);
        };
        clearTimeout(this.qrPoll); poll();
      };
      make();
    },
    mail(note = "") {
      this.step({
        title: "Вход в Needle", sub: "Введи почту, на которую зарегистрирован аккаунт.",
        body: field("e", "Почта", `type="email" maxlength="254" autocomplete="email" inputmode="email" required`, this.email) + (note ? `<div class="err">${esc(note)}</div>` : ""),
        btn: "Далее", back: isPhone() ? null : () => this.qr(),
        links: `${isPhone() ? "" : ""}<button type="button" class="lnk" data-qr>Войти по QR-коду</button><button type="button" class="lnk" data-up>Создать аккаунт</button>`,
        onSubmit: async f => { const e = f.e.value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error("Проверь адрес почты"); this.email = e; this.password(); },
      });
      $("[data-qr]").onclick = () => this.qr();
      $("[data-up]").onclick = () => this.signup();
    },
    password() {
      this.step({
        icon: `<span class="big-ic">${I.lock}</span>`, title: "Пароль", sub: `Введи пароль от аккаунта <b>${esc(this.email)}</b>.`,
        body: `<div class="pw">${field("p", "Пароль", `type="password" maxlength="72" autocomplete="current-password"`)}<button type="button" class="ib" data-eye>${I.eye}</button></div>`,
        btn: "Далее", back: () => this.mail(),
        links: `<button type="button" class="lnk" data-fg>Забыли пароль?</button>`,
        onSubmit: async f => {
          const p = f.p.value; if (!p) throw new Error("Введи пароль");
          const { error } = await sb.auth.signInWithPassword({ email: this.email, password: p }); if (error) throw error;
          PW = p; await boot();
        },
      });
      $("[data-fg]").onclick = async () => {
        if (!(await confirmBox("Сбросить пароль?", `Пришлём ссылку для нового пароля на ${this.email}.`, "Прислать", false))) return;
        const { error } = await sb.auth.resetPasswordForEmail(this.email, { redirectTo: SITE + "?reset=1" });
        toast(error ? errText(error) : "Если такая почта есть, ссылка уже в пути");
      };
    },
    // новое устройство: нужен код из Needle (с другого устройства) или ссылка на почту
    async code(hello) {
      const others = hello.others;
      if (others) { try { await rpc("nv_dev_code_request"); } catch (e) { if (!/too fast/.test(e.message || "")) toast(errText(e)); } }
      const mailLink = async () => {
        const { error } = await sb.auth.signInWithOtp({ email: session.user.email, options: { shouldCreateUser: false, emailRedirectTo: SITE } });
        if (error) throw error;
        Auth.frame(`<div class="auth-ic"><span class="big-ic">${I.mail}</span></div><h1>Проверь почту</h1><p class="auth-sub">Мы отправили ссылку для входа на <b>${esc(hello.email)}</b>. Открой её <b>в этом же браузере</b>. Письма нет? Загляни в «Спам».</p><button class="lnk" data-b>Назад</button>`);
        $("[data-b]").onclick = () => this.code(hello);
      };
      if (!others) {
        const root = this.frame(`<div class="auth-ic"><span class="big-ic">${I.shield}</span></div><h1>Подтверди вход</h1>
          <p class="auth-sub">Это новое устройство. Чтобы войти, подтверди, что почта <b>${esc(hello.email)}</b> твоя: пришлём на неё ссылку для входа.</p>
          <div class="err"></div><button class="btn wide" data-m>Прислать ссылку на почту</button><button class="lnk" data-out>Войти в другой аккаунт</button>`);
        $("[data-m]", root).onclick = async e => { e.target.disabled = true; try { await mailLink(); } catch (x) { $(".err", root).textContent = errText(x); e.target.disabled = false; } };
        $("[data-out]", root).onclick = () => signOut(true);
        return;
      }
      const root = this.step({
        icon: `<span class="big-ic">${I.devices}</span>`, title: "Код из Needle",
        sub: `Мы отправили код в Needle на другое твоё устройство, где ты уже вошёл. Он придёт как уведомление от Needle.`,
        body: `<div class="code-in"><input name="c" inputmode="numeric" autocomplete="one-time-code" maxlength="5" placeholder="•••••"></div>`,
        btn: "Войти",
        links: `<button type="button" class="lnk" data-again>Отправить код ещё раз</button><button type="button" class="lnk" data-m>Нет доступа? Ссылка на почту</button><button type="button" class="lnk" data-out>Войти в другой аккаунт</button>`,
        onSubmit: async (f) => {
          const c = f.c.value.replace(/\D/g, ""); if (c.length !== 5) throw new Error("Код из 5 цифр");
          const ok = await rpc("nv_dev_code_verify", { p_code: c });
          if (!ok) { f.c.value = ""; f.c.classList.add("shake"); setTimeout(() => f.c.classList.remove("shake"), 400); throw new Error("Неверный код"); }
          await boot();
        },
      });
      const inp = $("input[name=c]", root); inp.oninput = () => { inp.value = inp.value.replace(/\D/g, "").slice(0, 5); if (inp.value.length === 5) $("form", root).requestSubmit(); };
      $("[data-again]", root).onclick = async () => { try { await rpc("nv_dev_code_request"); toast("Новый код отправлен"); } catch (e) { toast(errText(e)); } };
      $("[data-m]", root).onclick = async () => { try { await mailLink(); } catch (e) { toast(errText(e)); } };
      $("[data-out]", root).onclick = () => signOut(true);
    },
    signup() {
      const s = { e: this.email, p: "" };
      const s1 = () => this.step({
        title: "Новый аккаунт", sub: "Номер телефона не нужен. Почту видишь только ты.",
        body: field("e", "Почта", `type="email" maxlength="254" autocomplete="email" inputmode="email"`, s.e),
        btn: "Далее", back: () => this.start(),
        onSubmit: async f => { const e = f.e.value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error("Проверь адрес почты"); s.e = e; s2(); },
      });
      const s2 = () => this.step({
        icon: `<span class="big-ic">${I.lock}</span>`, title: "Придумай пароль", sub: "Минимум 8 символов, латинские буквы и цифры. Им же откроется зашифрованная переписка.",
        body: `<div class="pw">${field("p", "Пароль", `type="password" maxlength="72" autocomplete="new-password"`)}<button type="button" class="ib" data-eye>${I.eye}</button></div>`,
        btn: "Далее", back: s1,
        onSubmit: async f => { const p = f.p.value; if (p.length < 8 || !/[a-z]/i.test(p) || !/\d/.test(p)) throw new Error("Минимум 8 символов, латинские буквы и цифры"); s.p = p; s3(); },
      });
      const s3 = () => { const root = this.step({
        icon: `<span class="big-ic">${I.user}</span>`, title: "Как тебя зовут?", sub: "Имя и юзернейм увидят другие. Поменять можно в любой момент.",
        body: field("n", "Имя", `maxlength="40" autocomplete="nickname"`) + `<div class="at-f">${field("u", "Юзернейм", `maxlength="20" autocomplete="off" autocapitalize="off" spellcheck="false"`)}</div><p class="hint">Латиница, цифры и _. По нему тебя найдут: needle-net.github.io/<i data-uh>юзернейм</i></p>`,
        btn: "Создать аккаунт", back: s2,
        onSubmit: async f => {
          const n = f.n.value.trim(), u = f.u.value.trim().replace(/^@/, "").toLowerCase();
          if (!/^[a-z0-9_]{3,20}$/.test(u)) throw new Error("bad username");
          if (!(await rpc("sn_username_free", { p_name: u }))) throw new Error("reserved username");
          const { data, error } = await sb.auth.signUp({ email: s.e, password: s.p, options: { data: { username: u }, emailRedirectTo: SITE } });
          if (error) throw error;
          PW = s.p; Auth.newName = n;
          if (!data.session) {
            this.frame(`<div class="auth-ic"><span class="big-ic">${I.mail}</span></div><h1>Проверь почту</h1><p class="auth-sub">Мы отправили письмо на <b>${esc(s.e)}</b>. Открой его в этом браузере и нажми ссылку. Письма нет? Загляни в «Спам».</p><button class="lnk" data-b>Ко входу</button>`);
            $("[data-b]").onclick = () => this.start(); return;
          }
          await boot();
        },
      });
        const u = $("[name=u]", root), uh = $("[data-uh]", root); u.oninput = () => { uh.textContent = u.value.replace(/^@/, "").toLowerCase() || "юзернейм"; };
      };
      s1();
    },
    reset() {
      this.step({
        icon: `<span class="big-ic">${I.key}</span>`, title: "Новый пароль", sub: "Минимум 8 символов, латинские буквы и цифры.",
        body: `<div class="pw">${field("p", "Новый пароль", `type="password" maxlength="72" autocomplete="new-password"`)}<button type="button" class="ib" data-eye>${I.eye}</button></div>`,
        btn: "Сохранить",
        onSubmit: async f => {
          const p = f.p.value; if (p.length < 8 || !/[a-z]/i.test(p) || !/\d/.test(p)) throw new Error("Минимум 8 символов, латинские буквы и цифры");
          const { error } = await sb.auth.updateUser({ password: p }); if (error) throw error;
          PW = p; history.replaceState(null, "", SITE); toast("Пароль обновлён"); await boot();
        },
      });
    },
  };
  async function signOut(quiet) {
    if (!quiet && !(await confirmBox("Выйти из аккаунта?", "Чтобы войти снова на этом устройстве, понадобится код или QR.", "Выйти"))) return;
    try { await sb.auth.signOut({ scope: "local" }); } catch {}
    location.replace(SITE);
  }

  // QR-код рисуем сами (библиотека qrcode-generator, MIT)
  function qrSvg(text) {
    if (!window.qrcode) return `<div class="qr-off">QR не загрузился</div>`;
    const q = window.qrcode(0, "M"); q.addData(text); q.make();
    const n = q.getModuleCount(); let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) {
      const fin = (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
      if (!fin) d += `M${c} ${r}h1v1h-1z`;
    }
    const eye = (x, y) => `<rect x="${x + .5}" y="${y + .5}" width="6" height="6" rx="1.6" class="qe"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".8" class="qd"/>`;
    return `<svg class="qr-svg" viewBox="-1 -1 ${n + 2} ${n + 2}"><path d="${d}" class="qp"/>${eye(0, 0)}${eye(n - 7, 0)}${eye(0, n - 7)}</svg>`;
  }

  // ссылка ?qr=... открыта на устройстве, где уже вошли: подтвердить вход на новом
  async function approveQr(raw) {
    const m = /^([0-9a-f-]{36})\.([0-9a-f]{64})$/.exec(raw || ""); if (!m) return toast("Неверный QR-код");
    try {
      const info = await rpc("nv_qr_info", { p_id: m[1], p_secret: m[2] });
      const ok = await popup({
        title: "Войти на новом устройстве?",
        html: `<div class="qr-ask"><span class="big-ic">${I.laptop}</span><b>${esc(info.name || "Устройство")}</b><small>запрос ${ago(info.created_at)}</small></div>
          <p class="pop-x">Подтверждай, только если <b>ты сам</b> сейчас сканируешь QR-код со своего компьютера. Никогда не сканируй коды, которые тебе прислали другие.</p>`,
        buttons: [{ t: "Отмена", v: false }, { t: "Подтвердить", v: true, main: true }],
      });
      if (ok !== true) return;
      await rpc("nv_qr_approve", { p_id: m[1], p_secret: m[2] }); toast("Готово: устройство вошло в аккаунт");
    } catch (e) { toast(errText(e)); }
  }
  // сканер QR в самом Needle (камера телефона)
  async function scanQr() {
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices) {
      return popup({ title: "Подключить устройство", html: `<p class="pop-x">Наведи обычную камеру телефона на QR-код на экране компьютера. Откроется ссылка: открой её в браузере, где ты вошёл в Needle, и подтверди вход.</p>`, buttons: [{ t: "Понятно", main: true }] });
    }
    let stream = null, raf = 0, stop = false;
    const det = new BarcodeDetector({ formats: ["qr_code"] });
    popup({
      title: "Наведи камеру на QR-код", cls: "scan",
      html: `<div class="scan-v"><video playsinline muted></video><i></i></div><p class="pop-x">QR-код показан на экране входа в Needle на компьютере.</p>`,
      buttons: [{ t: "Отмена" }],
      onMount: async (card, done) => {
        try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); } catch { done(); return toast("Нет доступа к камере"); }
        const v = $("video", card); v.srcObject = stream; await v.play().catch(() => {});
        const tick = async () => {
          if (stop || !card.isConnected) { stream.getTracks().forEach(t => t.stop()); return; }
          try { const r = await det.detect(v); const hit = r.map(x => x.rawValue).find(x => /[?&]qr=/.test(x)); if (hit) { stop = true; stream.getTracks().forEach(t => t.stop()); done(); return approveQr(new URL(hit).searchParams.get("qr")); } } catch {}
          raf = setTimeout(tick, 250);
        };
        tick();
      },
    }).then(() => { stop = true; clearTimeout(raf); if (stream) stream.getTracks().forEach(t => t.stop()); });
  }

  // ================= каркас: слева список, справа чат, сбоку информация =================
  const App = {
    mount() {
      $("#root").innerHTML = `<div class="app">
        <aside class="left"><div class="lstack">
          <section class="lp lmain">
            <header class="lh"><button class="ib" data-menu aria-label="Меню">${I.menu}</button>
              <label class="srch">${I.search}<input type="search" placeholder="Поиск" maxlength="40" autocomplete="off"><button type="button" class="ib sm" data-sx hidden>${I.close}</button></label></header>
            <nav class="folders"></nav>
            <div class="lbody"><div class="codes"></div><div class="list"><div class="spin"></div></div><div class="sres" hidden></div></div>
            <button class="fab" data-new aria-label="Новое сообщение">${I.pen}</button>
          </section>
        </div></aside>
        <main class="right"><div class="r-empty"><span class="pill">Выбери чат, чтобы начать общение</span></div></main>
        <aside class="side"></aside>
      </div><div class="drawer-wrap"><nav class="drawer"></nav></div>`;
      const lm = $(".lmain");
      $("[data-menu]", lm).onclick = () => Drawer.open();
      $("[data-new]", lm).onclick = e => newMenu(e.currentTarget);
      const inp = $(".srch input", lm), sx = $("[data-sx]", lm);
      const go = debounce(() => Search.run(inp.value.trim()), 250);
      inp.oninput = () => { sx.hidden = !inp.value; if (!inp.value) Search.close(); else go(); };
      inp.onkeydown = e => { if (e.key === "Escape") { inp.value = ""; sx.hidden = true; Search.close(); inp.blur(); } };
      sx.onclick = () => { inp.value = ""; sx.hidden = true; Search.close(); };
      Drawer.draw();
      Chats.load(true);
      rpc("nv_prefs_get").then(p => { if (p) { PREFS = Object.assign(PREFS, p); Chats.drawFolders(); Chats.draw(); } }).catch(() => {});
      Codes.poll();
      // «в сети»
      let act = Date.now(); ["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, () => { act = Date.now(); }, { passive: true }));
      const ping = () => { if (!document.hidden && Date.now() - act < 300000) rpc("nv_ping").catch(() => {}); };
      ping(); setInterval(ping, 60000);
      window.addEventListener("popstate", () => { if (document.querySelector(".app.r-open") && isPhone()) R.close(true); });
    },
  };
  // левая колонка: страницы поверх списка чатов (настройки и т.п.), как в Telegram
  const L = {
    push(title, render, actions = "") {
      const st = $(".lstack"); if (!st) return;
      const pg = h(`<section class="lp sub"><header class="lh"><button class="ib" data-back aria-label="Назад">${I.back}</button><h2>${esc(title)}</h2><div class="lh-a">${actions}</div></header><div class="lbody"></div></section>`);
      st.append(pg); requestAnimationFrame(() => pg.classList.add("in"));
      $("[data-back]", pg).onclick = () => L.pop(pg);
      render($(".lbody", pg), pg);
      return pg;
    },
    pop(pg) { pg = pg || $$(".lstack .lp.sub").pop(); if (!pg) return; pg.classList.remove("in"); pg.classList.add("out"); setTimeout(() => pg.remove(), 220); },
    clear() { $$(".lstack .lp.sub").forEach(p => p.remove()); },
    top() { return $$(".lstack .lp.sub").pop() || null; },
  };
  // правая часть: чат, лента или профиль
  const R = {
    kind: "",
    show(kind, node) {
      const r = $(".right"); if (!r) return;
      if (this.kind === "chat" && kind !== "chat") Chat.leave();
      this.kind = kind; r.innerHTML = ""; r.append(node);
      const app = $(".app"); if (isPhone() && !app.classList.contains("r-open")) history.pushState({ r: 1 }, ""); app.classList.add("r-open");
      Side.close();
    },
    close(fromPop) {
      const app = $(".app"); if (!app) return;
      if (this.kind === "chat") Chat.leave();
      this.kind = ""; app.classList.remove("r-open");
      $(".right").innerHTML = `<div class="r-empty"><span class="pill">Выбери чат, чтобы начать общение</span></div>`;
      Side.close(); Chats.draw();
      if (isPhone() && !fromPop && history.state && history.state.r) history.back();
    },
  };
  // боковая панель справа (информация о чате)
  const Side = {
    open(title, render) {
      const s = $(".side"); if (!s) return;
      s.innerHTML = `<header class="lh"><button class="ib" data-x aria-label="Закрыть">${isPhone() ? I.back : I.close}</button><h2>${esc(title)}</h2><div class="lh-a"></div></header><div class="sbody"></div>`;
      $("[data-x]", s).onclick = () => this.close();
      $(".app").classList.add("side-open");
      render($(".sbody", s), s);
    },
    close() { const a = $(".app"); if (a) a.classList.remove("side-open"); },
    get on() { const a = $(".app"); return a && a.classList.contains("side-open"); },
  };
  const backBtn = () => `<button class="ib only-phone" data-rback aria-label="Назад">${I.back}</button>`;
  const wireBack = node => { const b = $("[data-rback]", node); if (b) b.onclick = () => R.close(); };

  // ================= меню ☰ =================
  const Drawer = {
    draw() {
      const d = $(".drawer"); if (!d) return;
      d.innerHTML = `<div class="dr-h">${av(ME, "lg")}<button class="ib dr-theme" data-theme title="Ночной режим">${darkNow() ? I.sun : I.moon}</button>
          <div class="dr-n">${uname(ME)}</div><div class="dr-u">@${esc(ME.username)}</div></div>
        <div class="dr-l">
          ${[["me", I.user, "Мой профиль"], ["feed", I.feed, "Лента"], ["saved", I.saved, "Избранное"], "-", ["group", I.users, "Создать группу"], ["channel", I.channel, "Создать канал"], ["people", I.search, "Найти людей и каналы"], "-", ["devices", I.devices, "Устройства"], ["settings", I.gear, "Настройки"]]
            .map(x => x === "-" ? `<div class="sep"></div>` : `<button class="dr-i" data-go="${x[0]}">${x[1]}<span>${x[2]}</span></button>`).join("")}
          <div class="dr-i dr-night" data-night>${I.moon}<span>Ночной режим</span>${sw(darkNow())}</div>
        </div><div class="dr-f">Needle · версия 2</div>`;
      $("[data-theme]", d).onclick = $("[data-night]", d).onclick = () => { CFG.theme = darkNow() ? "light" : "dark"; saveCfg(); this.draw(); };
      $$("[data-go]", d).forEach(b => b.onclick = () => { this.close(); setTimeout(() => this.go(b.dataset.go), 120); });
    },
    go(k) {
      if (k === "me") Profile.open(ME.id);
      else if (k === "feed") Feed.open();
      else if (k === "saved") openSaved();
      else if (k === "group" || k === "channel") createChat(k);
      else if (k === "people") { const i = $(".lmain .srch input"); L.clear(); i.focus(); toast("Начни вводить имя, @юзернейм или название"); }
      else if (k === "devices") { L.clear(); Settings.open(); Settings.devices(); }
      else if (k === "settings") { L.clear(); Settings.open(); }
    },
    open() { this.draw(); const w = $(".drawer-wrap"); w.classList.add("on"); w.onpointerdown = e => { if (e.target === w) this.close(); }; },
    close() { const w = $(".drawer-wrap"); if (w) w.classList.remove("on"); },
  };

  // ================= коды для входа (приходят сюда, как сообщение от Telegram) =================
  const Codes = {
    seen: new Set(), t: 0,
    async poll() {
      clearTimeout(this.t);
      try {
        const list = await rpc("nv_dev_codes");
        const box = $(".lmain .codes");
        if (box) box.innerHTML = list.map(c => `<div class="code-note">${I.shield}<div><b>Код для входа: <span class="mono">${esc(c.code)}</span></b><small>${esc(c.device || "Новое устройство")} просит вход. Никому не сообщай этот код. Если это не ты, смени пароль.</small></div></div>`).join("");
        for (const c of list) { const k = c.code + c.created_at; if (this.seen.has(k)) continue; this.seen.add(k); beep();
          popup({ title: "Код для входа", html: `<div class="code-big mono">${esc(c.code)}</div><p class="pop-x"><b>${esc(c.device || "Новое устройство")}</b> просит вход в твой аккаунт. Введи этот код там. Никому его не сообщай, даже «поддержке». Если это не ты, сразу смени пароль в настройках.</p>`, buttons: [{ t: "Понятно", main: true }] }); }
      } catch {}
      this.t = setTimeout(() => this.poll(), document.hidden ? 15000 : 5000);
    },
  };

  // ================= список чатов =================
  const KINDS = [["all", "Все"], ["dm", "Личные"], ["group", "Группы"], ["channel", "Каналы"]];
  const Chats = {
    list: [], kind: store.get("needle-tab", "all"), timer: 0, unread: 0, seq: 0,
    inKind(c, k) { return k === "archive" ? c.archived : k[0] === "f" ? ((PREFS.folders[+k.slice(1)] || {}).c || []).includes(c.id) : !c.archived && (k === "all" || c.kind === k || (k === "dm" && c.saved)); },
    setKind(k) { this.kind = k; if (k !== "archive") store.set("needle-tab", k); this.drawFolders(); this.draw(); },
    drawFolders() {
      const nav = $(".lmain .folders"); if (!nav) return;
      if (this.kind[0] === "f" && !PREFS.folders[+this.kind.slice(1)]) this.kind = "all";
      const tabs = [...KINDS, ...PREFS.folders.map((f, i) => ["f" + i, f.n])];
      nav.innerHTML = this.kind === "archive" ? `<button class="on" data-k="all">${I.back}<span>Архив</span></button>` : tabs.map(([k, t]) => `<button data-k="${k}" class="${this.kind === k ? "on" : ""}"><span>${esc(t)}</span><i></i></button>`).join("");
      $$("button", nav).forEach(b => {
        b.onclick = () => this.setKind(b.dataset.k);
        if (b.dataset.k[0] === "f") onHold(b, (x, y) => { const i = +b.dataset.k.slice(1); ctxMenu(x, y, [{ i: I.pen, t: "Переименовать", f: () => Folders.rename(i) }, { i: I.trash, t: "Удалить папку", danger: true, f: () => Folders.remove(i) }]); });
      });
      this.counts();
    },
    counts() { $$(".lmain .folders button[data-k] i").forEach(i => { const k = i.parentElement.dataset.k; const n = this.list.filter(c => this.inKind(c, k) && c.id !== Chat.id && !c.muted).reduce((s, c) => s + (+c.unread || 0), 0); i.textContent = n ? (n > 99 ? "99+" : n) : ""; }); },
    async load(first) {
      clearTimeout(this.timer);
      try {
        const list = await rpc("nv_my_chats");
        if (first && !list.length) { try { const f = await rpc("nv_find", { p_q: "needle" }); const off = (f.chats || []).find(c => c.kind === "channel" && c.official); if (off) { await rpc("nv_join", { p_chat: off.id }); return this.load(false); } } catch {} }
        const before = this.unread;
        this.list = list; this.unread = list.reduce((s, c) => s + (c.id === Chat.id || c.muted ? 0 : +c.unread || 0), 0);
        if (this.unread > before && !first) beep();
        document.title = (this.unread ? `(${this.unread}) ` : "") + "Needle";
        await this.draw();
      } catch (e) { if (/not signed in|device not trusted/.test(e.message || "")) return boot(); }
      this.timer = setTimeout(() => this.load(), document.hidden ? 15000 : 5000);
    },
    async preview(c) {
      const m = c.last; if (!m) return c.kind === "dm" ? (c.saved ? "Сохраняй сюда сообщения и заметки" : "Зашифрованный чат") : esc(c.about || (c.kind === "channel" ? "Канал" : "Группа"));
      let t;
      if (m.iv) { t = CFG.preview ? (await E2E.dec(m)) ?? "Зашифрованное сообщение" : "Сообщение"; if (t[0] === "\u0001") { try { const o = JSON.parse(t.slice(1)); t = o.t || "Файл: " + (o.f && o.f.name || ""); } catch { t = "Файл"; } } }
      else t = m.poll ? "Опрос: " + m.body : m.file && !m.body.trim() ? "Файл: " + (m.file.name || "") : m.photo && !m.body.trim() ? "Фото" : m.body;
      const who = c.kind === "group" ? (m.mine ? "Вы" : m.anon ? `Аноним #${m.tag}` : m.a ? (m.a.name || m.a.username) : "") : m.mine && c.kind === "dm" && !c.saved ? "Вы" : "";
      return (who ? `<span class="who">${esc(who)}: </span>` : "") + esc(t);
    },
    row: async function (c) {
      const un = +c.unread && c.id !== Chat.id;
      return `<div class="row${c.id === Chat.id ? " on" : ""}" data-c="${c.id}">${chatAv(c)}
        <div class="rc"><div class="r1"><span class="rn">${chatName(c)}${c.muted ? `<span class="mi-s">${I.mute}</span>` : ""}</span><span class="rt">${c.last && c.last.mine && c.kind !== "channel" && !c.saved ? `<span class="tk">${I.check2}</span>` : ""}${c.last ? fmtTime(c.last.created_at) : ""}</span></div>
        <div class="r2"><span class="rp">${await this.preview(c)}</span>${c.mention && c.id !== Chat.id ? `<span class="bd at">@</span>` : ""}${un ? `<span class="bd${c.muted ? " mu" : ""}">${c.unread}</span>` : c.pin ? `<span class="pin-s">${I.pin}</span>` : ""}</div></div></div>`;
    },
    async draw() {
      const box = $(".lmain .list"); if (!box) return; const seq = ++this.seq;
      const arch = this.list.filter(c => c.archived);
      const list = this.list.filter(c => this.inKind(c, this.kind));
      let html = "";
      if (this.kind === "all" && arch.length) html += `<div class="row arch" data-arch><span class="av sv">${I.archive}</span><div class="rc"><div class="r1"><span class="rn">Архив</span></div><div class="r2"><span class="rp">${arch.slice(0, 4).map(c => esc(c.saved ? "Избранное" : c.kind === "dm" ? (c.peer && (c.peer.name || c.peer.username)) || "" : c.title || "")).join(", ")}</span>${arch.some(c => +c.unread) ? `<span class="bd mu">${arch.reduce((s, c) => s + (+c.unread || 0), 0)}</span>` : ""}</div></div></div>`;
      const rows = await Promise.all(list.map(c => this.row(c)));
      if (seq !== this.seq) return;
      html += rows.join("");
      if (!list.length) html += this.kind === "all" ? `<div class="l-empty"><b>Здесь пока пусто</b><span>Найди людей или каналы через поиск сверху или создай свою группу.</span><button class="btn" data-n>Новый чат</button></div>` : `<div class="l-empty"><span>${this.kind === "archive" ? "В архиве пусто" : "В этой папке пока нет чатов"}</span></div>`;
      box.innerHTML = html;
      const a = $("[data-arch]", box); if (a) a.onclick = () => this.setKind("archive");
      const n = $("[data-n]", box); if (n) n.onclick = e => newMenu(e.currentTarget);
      $$(".row[data-c]", box).forEach(r => {
        const c = this.list.find(x => x.id === +r.dataset.c);
        r.onclick = () => Chat.open(c.id);
        onHold(r, (x, y) => this.menu(c, x, y));
      });
      this.counts();
    },
    menu(c, x, y) {
      ctxMenu(x, y, [
        +c.unread ? { i: I.read, t: "Отметить прочитанным", f: () => this.act(c, "read") } : null,
        { i: c.pin ? I.unpin : I.pin, t: c.pin ? "Открепить" : "Закрепить", f: () => this.act(c, c.pin ? "unpin" : "pin") },
        { i: c.muted ? I.bell : I.mute, t: c.muted ? "Включить звук" : "Без звука", f: () => this.act(c, c.muted ? "unmute" : "mute") },
        { i: c.archived ? I.unarchive : I.archive, t: c.archived ? "Вернуть из архива" : "В архив", f: () => this.act(c, c.archived ? "unarch" : "arch") },
        { i: I.folder, t: "Добавить в папку", f: () => Folders.pick(c) },
        c.kind === "dm" ? { i: I.trash, t: c.saved ? "Очистить Избранное" : "Удалить чат", danger: true, f: () => this.act(c, "del") } : c.owner ? null : { i: I.logout, t: c.kind === "channel" ? "Покинуть канал" : "Покинуть группу", danger: true, f: () => this.act(c, "leave") },
      ]);
    },
    async act(c, a) {
      try {
        if (a === "pin" || a === "unpin") await rpc("nv_pin_chat", { p_chat: c.id, p_on: a === "pin" });
        else if (a === "arch" || a === "unarch") { await rpc("nv_chat_flag", { p_chat: c.id, p_key: "archived", p_on: a === "arch" }); toast(a === "arch" ? "Чат в архиве" : "Чат вернулся из архива"); }
        else if (a === "mute" || a === "unmute") await rpc("nv_chat_flag", { p_chat: c.id, p_key: "muted", p_on: a === "mute" });
        else if (a === "read") await rpc("nv_read_all", { p_chat: c.id });
        else if (a === "leave") { if (!(await confirmBox(c.kind === "channel" ? "Покинуть канал" : "Покинуть группу", `Ты точно хочешь покинуть «${c.title}»?`, "Покинуть"))) return; await rpc("nv_leave", { p_chat: c.id }); if (Chat.id === c.id) R.close(); }
        else if (a === "del") { if (!(await confirmBox(c.saved ? "Очистить Избранное" : "Удалить чат", c.saved ? "Все заметки пропадут." : "Переписка удалится у вас обоих. Вернуть её будет нельзя.", c.saved ? "Очистить" : "Удалить"))) return; await rpc("nv_delete_chat", { p_chat: c.id }); if (Chat.id === c.id) R.close(); }
        this.load();
      } catch (e) { toast(errText(e)); }
    },
  };
  const Folders = {
    save: async f => { await rpc("nv_prefs_set", { p_folders: f }); PREFS.folders = f; Chats.drawFolders(); Chats.draw(); },
    copy: () => PREFS.folders.map(x => ({ n: x.n, c: [...(x.c || [])] })),
    async create(first) {
      const n = await popup({ title: "Новая папка", html: `<div class="pop-f">${field("n", "Название папки", 'maxlength="20"')}</div>`, buttons: [{ t: "Отмена", v: null }, { t: "Создать", main: true, click: card => $("[name=n]", card).value.trim() || false }] });
      if (!n || PREFS.folders.length >= 10) return null;
      const f = [...this.copy(), { n: n.slice(0, 20), c: first ? [first] : [] }]; try { await this.save(f); return f.length - 1; } catch (e) { toast(errText(e)); return null; }
    },
    pick(c) {
      popup({ title: "Добавить в папку", html: `<div class="plist">${PREFS.folders.map((f, i) => `<button class="prow" data-f="${i}">${I.folder}<span>${esc(f.n)}</span>${(f.c || []).includes(c.id) ? I.check : ""}</button>`).join("")}${PREFS.folders.length < 10 ? `<button class="prow" data-new>${I.plus}<span>Новая папка</span></button>` : ""}</div>`, buttons: [{ t: "Закрыть" }],
        onMount: (card, done) => {
          $$("[data-f]", card).forEach(b => b.onclick = async () => { const f = this.copy(), x = f[+b.dataset.f]; x.c = x.c.includes(c.id) ? x.c.filter(i => i !== c.id) : [...x.c, c.id].slice(-200); try { await this.save(f); done(); toast(`Папка «${x.n}» обновлена`); } catch (e) { toast(errText(e)); } });
          const nb = $("[data-new]", card); if (nb) nb.onclick = async () => { done(); await this.create(c.id); };
        } });
    },
    async rename(i) {
      const n = await popup({ title: "Переименовать папку", html: `<div class="pop-f">${field("n", "Название", 'maxlength="20"', PREFS.folders[i].n)}</div>`, buttons: [{ t: "Отмена", v: null }, { t: "Сохранить", main: true, click: card => $("[name=n]", card).value.trim() || false }] });
      if (!n) return; const f = this.copy(); f[i].n = n.slice(0, 20); try { await this.save(f); } catch (e) { toast(errText(e)); }
    },
    async remove(i) {
      if (!(await confirmBox("Удалить папку", `Папка «${PREFS.folders[i].n}» исчезнет, а чаты останутся.`))) return;
      try { await this.save(this.copy().filter((_, j) => j !== i)); if (Chats.kind === "f" + i) Chats.setKind("all"); } catch (e) { toast(errText(e)); }
    },
  };

  // ================= поиск =================
  const Search = {
    seq: 0,
    close() { const s = $(".lmain .sres"), l = $(".lmain .list"); if (s) { s.hidden = true; s.innerHTML = ""; } if (l) l.hidden = false; },
    async run(q) {
      const s = $(".lmain .sres"), l = $(".lmain .list"); if (!s) return; const seq = ++this.seq;
      s.hidden = false; l.hidden = true;
      const lq = q.toLowerCase();
      const local = Chats.list.filter(c => (c.saved ? "избранное" : c.kind === "dm" ? (c.peer ? (c.peer.name || "") + " " + c.peer.username : "") : c.title || "").toLowerCase().includes(lq));
      s.innerHTML = (local.length ? `<div class="sec">Чаты</div>` + (await Promise.all(local.map(c => Chats.row(c)))).join("") : "") + `<div class="sec">Глобальный поиск</div><div class="glob"><div class="spin"></div></div>`;
      $$(".row[data-c]", s).forEach(r => r.onclick = () => Chat.open(+r.dataset.c));
      try {
        const r = await rpc("nv_find", { p_q: q }); if (seq !== this.seq) return;
        const known = new Set(local.map(c => c.id));
        const ppl = (r.people || []).filter(p => p.id !== ME.id), chs = (r.chats || []).filter(c => !known.has(c.id));
        const g = $(".glob", s); if (!g) return;
        g.innerHTML = ppl.map(p => `<div class="row" data-u="${p.id}">${av(p)}<div class="rc"><div class="r1"><span class="rn">${uname(p)}</span></div><div class="r2"><span class="rp">@${esc(p.username)}</span></div></div></div>`).join("")
          + chs.map(c => `<div class="row" data-g="${c.id}">${chatAv(c)}<div class="rc"><div class="r1"><span class="rn">${chatName(c)}</span></div><div class="r2"><span class="rp">${c.handle ? "@" + esc(c.handle) + ", " : ""}${members(c)}</span></div></div></div>`).join("")
          || `<div class="l-empty"><span>Ничего не найдено</span></div>`;
        $$("[data-u]", g).forEach(x => x.onclick = () => Profile.open(x.dataset.u));
        $$("[data-g]", g).forEach(x => x.onclick = () => Chat.open(+x.dataset.g));
      } catch (e) { const g = $(".glob", s); if (g) g.innerHTML = `<div class="l-empty"><span>${esc(errText(e))}</span></div>`; }
    },
  };

  // ================= новый чат =================
  function newMenu(btn) {
    const r = btn.getBoundingClientRect();
    const m = ctxMenu(r.right - 230, r.top - 150, [
      { i: I.channel, t: "Новый канал", f: () => createChat("channel") },
      { i: I.users, t: "Новая группа", f: () => createChat("group") },
      { i: I.user, t: "Новое сообщение", f: () => { const i = $(".lmain .srch input"); i.focus(); toast("Найди человека по имени или @юзернейму"); } },
    ]);
    m.style.top = Math.max(8, r.top - m.offsetHeight - 8) + "px";
  }
  function createChat(kind) {
    L.clear();
    L.push(kind === "channel" ? "Новый канал" : "Новая группа", body => {
      body.innerHTML = `<div class="pad"><div class="new-av">${kind === "channel" ? I.channel : I.users}</div>
        ${field("t", kind === "channel" ? "Название канала" : "Название группы", 'maxlength="40"')}
        ${areaField("a", "Описание (необязательно)", 'maxlength="200" rows="2"')}
        <p class="hint">${kind === "channel" ? "Канал: публикуешь посты ты, остальные читают." : "Группа: общий чат для нескольких людей."} Можно создать до 3 групп и каналов.</p>
        <div class="err"></div><button class="btn wide" data-y>Создать</button></div>`;
      $("[name=t]", body).focus();
      $("[data-y]", body).onclick = async e => {
        const t = $("[name=t]", body).value.trim(), a = $("[name=a]", body).value.trim(), er = $(".err", body);
        if (!t) return er.textContent = "Напиши название";
        e.target.disabled = true;
        try { const id = await rpc("nv_create", { p_kind: kind, p_title: t, p_about: a, p_anon: false }); L.clear(); await Chats.load(); Chat.open(id); toast(kind === "channel" ? "Канал создан" : "Группа создана"); }
        catch (x) { er.textContent = errText(x); e.target.disabled = false; }
      };
    });
  }
  async function openSaved() { try { const id = await rpc("nv_saved"); await Chats.load(); Chat.open(id); } catch (e) { toast(errText(e)); } }
  async function openDm(uid) { try { const id = await rpc("nv_open_dm", { p_user: uid }); await Chats.load(); Chat.open(id); } catch (e) { toast(errText(e)); } }
  // ссылки needle-net.github.io/имя и /+приглашение
  async function goLink(name) {
    try {
      const r = await rpc("nv_resolve", { p_name: name }); if (!r) throw new Error("no chat");
      if (r.user) return Profile.open(r.user);
      Chats.load(); Chat.open(r.chat);
    } catch (e) { toast(errText(e)); }
  }

  // ================= чат =================
  const RX = ["👍", "❤️", "🔥", "😂", "😮", "😢", "🙏", "👎"];
  const can = (c, r) => !!c && (ME.is_admin || c.owner || (c.rights || []).includes(r));
  const isAdm = c => !!c && (ME.is_admin || c.owner || c.role === "admin");
  const Chat = {
    id: 0, c: null, msgs: new Map(), last: 0, first: 0, timer: 0, burnT: new Map(), reply: null, editing: null, since: null, read: 0, typT: 0, sub: "",
    get box() { return $(".right .msgs"); },
    leave() { clearTimeout(this.timer); this.burnT.forEach(t => clearTimeout(t)); this.burnT.clear(); this.id = 0; this.c = null; },
    async open(id) {
      Search.close(); const si = $(".lmain .srch input"); if (si && si.value) { si.value = ""; $(".lmain [data-sx]").hidden = true; }
      if (this.id === id && R.kind === "chat") return;
      this.leave(); this.id = id; this.msgs.clear(); this.last = this.first = 0; this.reply = this.editing = null; this.since = null; this.read = 0;
      const node = h(`<section class="chat"><header class="ch">${backBtn()}<div class="ch-t"></div><div class="ch-a"></div></header>
        <div class="pinbar" hidden></div><div class="ch-search" hidden></div>
        <div class="msgs-w"><div class="msgs"><div class="spin"></div></div><button class="down" hidden aria-label="Вниз">${I.back}</button></div><div class="bottom"></div></section>`);
      R.show("chat", node); wireBack(node);
      Chats.draw();
      const box = $(".msgs", node), down = $(".down", node);
      box.addEventListener("scroll", () => { down.hidden = box.scrollHeight - box.scrollTop - box.clientHeight < 300; if (box.scrollTop < 80 && this.first && !this.loadingOld && !this.noOlder) this.older(); }, { passive: true });
      down.onclick = () => box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
      try {
        this.c = await rpc("nv_chat", { p_chat: id }); if (this.id !== id) return;
        node.classList.toggle("is-chan", this.c.kind === "channel");
        this.head(); this.composer(); this.pinBar();
        const list = await rpc("nv_messages", { p_chat: id }); if (this.id !== id) return;
        box.innerHTML = this.intro(); this.noOlder = list.length < 60; this.loadingOld = false;
        await this.add(list, true);
        this.schedule();
      } catch (e) { box.innerHTML = `<div class="sys"><span>${esc(errText(e))}</span></div>`; }
    },
    intro() {
      const c = this.c;
      if (c.saved) return `<div class="intro">${I.saved}<b>Избранное</b><span>Пересылай сюда сообщения и пиши заметки. Видишь их только ты.</span></div>`;
      if (c.kind === "dm") return `<div class="intro">${I.lock}<b>Сквозное шифрование</b><span>Сообщения в этом чате читаете только вы двое. Сервер хранит лишь зашифрованный текст.</span></div>`;
      return "";
    },
    status() {
      const c = this.c;
      if (c.saved) return "";
      if (c.kind === "dm") return c.peer && !c.peer.pubkey ? "ещё не заходил(а) в Needle" : seenText(c.peer && c.peer.seen_at);
      return members(c);
    },
    head() {
      const c = this.c, node = $(".right .chat"); if (!node) return;
      this.sub = this.status();
      const t = $(".ch-t", node);
      t.innerHTML = `${chatAv(c, "sm")}<div class="ch-n"><b>${chatName(c)}</b><small class="${this.sub === "в сети" ? "on" : ""}">${esc(this.sub)}${c.burn ? ` · ${I.timer} ${burnName(c.burn)}` : ""}</small></div>`;
      t.onclick = () => this.info();
      $(".ch-a", node).innerHTML = `<button class="ib" data-s aria-label="Поиск">${I.search}</button><button class="ib" data-m aria-label="Ещё">${I.more}</button>`;
      $("[data-s]", node).onclick = () => this.search();
      $("[data-m]", node).onclick = e => this.headMenu(e.currentTarget);
    },
    headMenu(btn) {
      const c = this.c, lc = Chats.list.find(x => x.id === c.id) || {};
      menuAt(btn, [
        { i: I.info, t: c.kind === "dm" ? "Профиль" : c.kind === "channel" ? "Информация о канале" : "Информация о группе", f: () => this.info() },
        c.joined ? { i: lc.muted ? I.bell : I.mute, t: lc.muted ? "Включить звук" : "Без звука", f: () => Chats.act(lc.id ? lc : c, lc.muted ? "unmute" : "mute").then(() => {}) } : null,
        c.kind === "dm" || c.owner || ME.is_admin ? { i: I.timer, t: "Автоудаление сообщений", f: () => this.burnMenu() } : null,
        { i: I.photo, t: "Медиа и файлы", f: () => this.info("media") },
        c.kind === "dm" && !c.saved ? { i: I.key, t: "Код шифрования", f: () => this.keyCode() } : null,
        c.kind !== "dm" && can(c, "edit") ? { i: I.pen, t: "Изменить", f: () => this.editChat() } : null,
        "-",
        c.kind === "dm" ? { i: I.trash, t: c.saved ? "Очистить Избранное" : "Удалить чат", danger: true, f: () => Chats.act(c, "del") }
          : c.owner || ME.is_admin ? { i: I.trash, t: c.kind === "channel" ? "Удалить канал" : "Удалить группу", danger: true, f: () => this.deleteChat() }
          : c.joined ? { i: I.logout, t: c.kind === "channel" ? "Покинуть канал" : "Покинуть группу", danger: true, f: () => Chats.act(c, "leave") } : null,
      ].filter((x, i, a) => !(x === "-" && (!a[i + 1] || i === 0))));
    },
    async deleteChat() {
      const c = this.c;
      if (!(await confirmBox(c.kind === "channel" ? "Удалить канал" : "Удалить группу", "Все сообщения пропадут у всех участников. Вернуть будет нельзя."))) return;
      try { await rpc("nv_delete_chat", { p_chat: c.id }); R.close(); Chats.load(); toast("Удалено"); } catch (e) { toast(errText(e)); }
    },
    async keyCode() {
      const c = this.c, code = await E2E.code(E2E.pub, c.peer && c.peer.pubkey);
      popup({ title: "Код шифрования", html: `<div class="code-big mono sm">${esc(code)}</div><p class="pop-x">Сверь этот код с собеседником лично или по звонку. Если он совпадает, никто не подменил ключи и переписку читаете только вы двое.</p>`, buttons: [{ t: "Закрыть", main: true }] });
    },
    // текст и файл сообщения (в личке всё лежит внутри шифра)
    async decode(m) {
      if (m._d) return m._d;
      let t = null, f = null;
      if (m.iv) { t = await E2E.dec(m); if (t && t[0] === "\u0001") { try { const o = JSON.parse(t.slice(1)); t = o.t || ""; f = o.f || null; } catch {} } }
      else { t = (m.body || "").trim(); f = m.file || null; }
      return (m._d = { t, f });
    },
    canWrite() { const c = this.c; return c.joined && (c.kind !== "channel" || can(c, "post")); },
    canPin() { const c = this.c; return c.kind === "dm" || can(c, "pin"); },
    async pinBar() {
      const c = this.c, bar = $(".right .pinbar"); if (!bar) return;
      if (!c.pinned) { bar.hidden = true; return; }
      const d = await this.decode(c.pinned);
      bar.hidden = false;
      bar.innerHTML = `<i class="pl"></i><div class="pb-t"><b>Закреплённое сообщение</b><span>${esc(d.t || (d.f ? d.f.name : "") || (c.pinned.photo ? "Фото" : "Сообщение"))}</span></div>${this.canPin() ? `<button class="ib" aria-label="Открепить">${I.close}</button>` : ""}`;
      bar.onclick = e => { if (e.target.closest("button")) return; this.jump(c.pinned.id); };
      const b = $("button", bar); if (b) b.onclick = () => this.pin(null);
    },
    async pin(m) {
      if (!m && !(await confirmBox("Открепить сообщение", "Сообщение пропадёт из закреплённых у всех.", "Открепить"))) return;
      try { await rpc("nv_pin_msg", { p_chat: this.c.id, p_msg: m ? m.id : null }); this.c.pinned = m; this.pinBar(); toast(m ? "Сообщение закреплено" : "Сообщение откреплено"); } catch (e) { toast(errText(e)); }
    },
    // ---------- сообщения ----------
    async el(m) {
      const c = this.c, mine = m.mine, ch = c.kind === "channel", d = await this.decode(m);
      let body = m.iv && d.t == null ? (E2E.locked ? `<span class="muted unlock">${I.lock} Нажми, чтобы открыть переписку паролем</span>` : `<span class="muted">${I.lock} Сообщение для ключа с другого устройства</span>`) : esc(d.t || "");
      if (body && !m.iv) body = body.replace(/(^|[^a-z0-9_])@([a-z0-9_]{3,20})/gi, (x, a, n) => `${a}<span class="mn" data-mn="${n}">@${n}</span>`);
      body = body.replace(/(https?:\/\/[^\s<]+)/g, u => `<a href="${u}" target="_blank" rel="noopener noreferrer nofollow">${u}</a>`);
      const rd = m.rp ? await this.decode(m.rp) : null;
      const rq = m.rp ? `<div class="rq" data-rq="${m.rp.id}"><b>${m.rp.name ? esc(m.rp.name) : chatTitle(c)}</b><span>${esc(rd.t && rd.t.trim() ? rd.t.slice(0, 120) : rd.f ? "Файл: " + (rd.f.name || "") : m.rp.photo ? "Фото" : rd.t == null ? "Зашифрованное сообщение" : "Сообщение")}</span></div>` : "";
      const rx = m.rx ? `<div class="rx">${Object.entries(m.rx).sort((a, b) => b[1] - a[1]).map(([e, n]) => `<button class="${m.my === e ? "on" : ""}" data-rx="${e}">${e}<i>${n}</i></button>`).join("")}</div>` : "";
      const tick = mine && !ch && !c.saved ? `<span class="tk${m.id <= this.read ? " rd" : ""}">${m.id <= this.read ? I.check2 : I.check}</span>` : "";
      const meta = `<span class="meta">${m.expires_at ? I.timer : ""}${m.edited ? "изменено " : ""}${ch && m.views != null ? `${I.eye}${fmtN(m.views)} ` : ""}${hm(m.created_at)}${tick}</span>`;
      const mw = 42 + (tick ? 20 : 0) + (m.edited ? 62 : 0) + (ch && m.views != null ? 14 + 8 * String(fmtN(m.views)).length : 0) + (m.expires_at ? 16 : 0), fe0 = !!d.f;
      const who = c.kind === "group" && !mine ? (m.anon ? `<span class="nm">${anonName(m)}</span>` : m.a ? `<span class="nm" data-p="${m.a.id}">${pname(m.a)}</span>` : "") : "";
      const photo = m.photo && PATH_RE.test(m.photo) ? `<img class="ph" src="${esc(pub("nova", m.photo))}" alt="" loading="lazy">` : "";
      const pl = m.poll ? this.pollHtml(m) : "";
      const text = m.poll ? "" : body;
      const el = h(`<div class="m ${mine && !ch ? "out" : "in"}${photo && !text ? " media" : ""}" data-id="${m.id}" data-a="${m.anon ? "anon" + m.tag : m.a ? m.a.id : mine ? "me" : "x"}" data-t="${m.created_at}">
        ${c.kind === "group" && !mine ? `<span class="m-av" ${m.a && !m.anon ? `data-p="${m.a.id}"` : ""}>${m.anon ? `<span class="av s0 sm">?</span>` : av(m.a, "sm")}</span>` : ""}
        <div class="bb">${who ? `<div class="au">${who}</div>` : ""}${m.fwd ? `<div class="fwd">Переслано от <b>${esc(m.fwd)}</b></div>` : ""}${rq}${photo}<span class="fslot"></span>${pl}
          ${text ? `<div class="tx">${text}<i class="msp" style="width:${mw}px"></i>${meta}</div>` : meta.replace('class="meta"', 'class="meta' + (photo && !pl && !fe0 ? " on-ph" : " st") + '"')}${rx}
          ${ch && (c.comments !== false || +m.cm) ? `<button class="cmb" data-cm>${I.comment}<span>${+m.cm ? m.cm + " " + plural(+m.cm, "комментарий", "комментария", "комментариев") : "Прокомментировать"}</span>${I.back}</button>` : ""}
        </div></div>`);
      const fe = fileEl(d.f); if (fe) $(".fslot", el).replaceWith(fe); else $(".fslot", el).remove();
      const img = $("img.ph", el); if (img) img.onclick = () => lightbox(img.src);
      const ul = $(".unlock", el); if (ul) ul.onclick = () => keyPrompt(true);
      $$("[data-p]", el).forEach(x => x.onclick = () => Profile.open(x.dataset.p));
      $$("[data-mn]", el).forEach(x => x.onclick = e => { e.stopPropagation(); goLink(x.dataset.mn); });
      const q = $("[data-rq]", el); if (q) q.onclick = () => this.jump(+q.dataset.rq);
      const cmb = $("[data-cm]", el); if (cmb) cmb.onclick = e => { e.stopPropagation(); Comments.open(c, m); };
      $$("[data-vo]", el).forEach(b => b.onclick = e => { e.stopPropagation(); if (!c.joined) return toast(errText("join first")); const o = +b.dataset.vo, my = m.poll.my || [];
        if (m.poll.x) return; if (m.poll.m) this.vote(m, my.includes(o) ? my.filter(x => x !== o) : [...my, o]); else if (!my.length) this.vote(m, [o]); });
      $$("[data-rx]", el).forEach(b => b.onclick = e => { e.stopPropagation(); if (c.joined) this.react(m, b.dataset.rx); });
      const bb = $(".bb", el);
      onHold(bb, (x, y) => this.menu(m, el, x, y));
      if (this.canWrite() && !isPhone()) bb.addEventListener("dblclick", e => { if (e.target.closest("a,button,audio,video,img")) return; getSelection().removeAllRanges(); this.setReply(m, d); });
      if (this.canWrite()) {   // свайп влево = ответить
        let sx = null, sy = 0, dx = 0;
        bb.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; dx = 0; }, { passive: true });
        bb.addEventListener("touchmove", e => { if (sx == null) return; if (Math.abs(e.touches[0].clientY - sy) > 20) { sx = null; bb.style.transform = ""; return; } dx = Math.min(0, e.touches[0].clientX - sx); if (dx < -8) bb.style.transform = `translateX(${Math.max(dx, -64)}px)`; }, { passive: true });
        bb.addEventListener("touchend", () => { bb.style.transform = ""; if (dx < -50 && sx != null) this.setReply(m, d); sx = null; });
      }
      if (m.expires_at) { const left = new Date(m.expires_at) - Date.now(); this.burnT.set(m.id, setTimeout(() => this.burn(el, m.id), Math.max(0, left))); }
      return el;
    },
    // хвостики, аватарки и даты как в Telegram
    regroup() {
      const box = this.box; if (!box) return;
      $$(".day", box).forEach(x => x.remove());
      const ms = $$(".m", box); let prev = null;
      ms.forEach((el, i) => {
        const nx = ms[i + 1], t = new Date(el.dataset.t);
        if (!prev || !sameDay(prev.dataset.t, t)) el.before(h(`<div class="day"><span>${dayLabel(t)}</span></div>`));
        const same = (a, b) => a && b && a.dataset.a === b.dataset.a && a.className.includes(" out") === b.className.includes(" out") && sameDay(a.dataset.t, b.dataset.t) && Math.abs(new Date(b.dataset.t) - new Date(a.dataset.t)) < 600000;
        el.classList.toggle("first", !same(prev, el)); el.classList.toggle("last", !same(el, nx));
        prev = el;
      });
    },
    async add(list, initial) {
      const box = this.box; if (!box) return;
      const near = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
      for (const m of list) {
        if (this.msgs.has(m.id)) continue;
        this.msgs.set(m.id, m); this.last = Math.max(this.last, m.id); this.first = this.first ? Math.min(this.first, m.id) : m.id;
        box.append(await this.el(m));
      }
      this.regroup();
      if (initial && !list.length && this.c && !this.c.saved && this.c.kind !== "dm") box.insertAdjacentHTML("beforeend", `<div class="sys"><span>Сообщений пока нет</span></div>`);
      if (initial || near || list.some(m => m.mine)) box.scrollTop = box.scrollHeight;
      if (this.last) rpc("nv_read", { p_chat: this.id, p_id: this.last }).catch(() => {});
    },
    async older() {
      this.loadingOld = true; const box = this.box;
      try {
        const list = await rpc("nv_messages", { p_chat: this.id, p_before: this.first }); if (!box.isConnected) return;
        const sh = box.scrollHeight, els = [];
        for (const m of list) { if (this.msgs.has(m.id)) continue; this.msgs.set(m.id, m); this.first = Math.min(this.first, m.id); els.push(await this.el(m)); }
        const firstM = $(".m", box); if (firstM) firstM.before(...els); else box.append(...els);
        this.regroup(); box.scrollTop += box.scrollHeight - sh;
        if (list.length < 60) this.noOlder = true;
      } catch {}
      this.loadingOld = false;
    },
    async swap(m) {
      const old = $(`.right .m[data-id="${m.id}"]`); if (!old) return;
      delete m._d; this.msgs.set(m.id, m); const cls = old.className; const n = await this.el(m); n.className = cls; old.replaceWith(n);
    },
    schedule() { clearTimeout(this.timer); this.timer = setTimeout(() => this.tick(), document.hidden ? 8000 : 2000); },
    async tick() {
      const id = this.id; if (!id) return;
      try {
        const r = await rpc("nv_poll", { p_chat: id, p_after: this.last, p_since: this.since });
        if (this.id === id) {
          this.since = r.now;
          if (r.new.length) { await this.add(r.new); if (r.new.some(m => !m.mine) && !(Chats.list.find(x => x.id === id) || {}).muted) beep(); }
          for (const m of r.changed) { if (m.deleted) { const el = $(`.right .m[data-id="${m.id}"]`); if (el) this.burn(el, m.id); } else await this.swap(m); }
          this.state(r);
        }
      } catch {}
      if (this.id === id) this.schedule();
    },
    state(r) {
      const node = $(".right .chat"); if (!node) return; const c = this.c;
      if (r.read != null && +r.read !== this.read) { this.read = +r.read; $$(".m.out[data-id]", node).forEach(x => { const t = $(".tk", x); if (t && +x.dataset.id <= this.read && !t.classList.contains("rd")) { t.classList.add("rd"); t.innerHTML = I.check2; } }); }
      if (c.kind === "dm" && c.peer && r.seen !== undefined) c.peer.seen_at = r.seen;
      const typing = (r.typing || []).length;
      const sub = typing ? (c.kind === "dm" ? "печатает…" : r.typing.slice(0, 2).join(", ") + " печатает…") : this.status();
      const sm = $(".ch-n small", node); if (sm && sm.dataset.v !== sub) { sm.dataset.v = sub; sm.innerHTML = esc(sub) + (c.burn && !typing ? ` · ${I.timer} ${burnName(c.burn)}` : ""); sm.classList.toggle("on", !!typing || sub === "в сети"); }
    },
    async menu(m, el, x, y) {
      const c = this.c, d = await this.decode(m), canDel = m.mine || ME.is_admin || can(c, "del");
      const head = c.joined && !c.saved ? `<div class="rxpick">${RX.map(e => `<button data-e="${e}" class="${m.my === e ? "on" : ""}">${e}</button>`).join("")}</div>` : "";
      const menu = ctxMenu(x, y, [
        this.canWrite() ? { i: I.reply, t: "Ответить", f: () => this.setReply(m, d) } : null,
        m.mine && d.t && !m.expires_at && !m.poll ? { i: I.pen, t: "Изменить", f: () => this.startEdit(m, d) } : null,
        d.t ? { i: I.copy, t: "Копировать текст", f: () => copy(d.t) } : null,
        this.canPin() ? { i: c.pinned && c.pinned.id === m.id ? I.unpin : I.pin, t: c.pinned && c.pinned.id === m.id ? "Открепить" : "Закрепить", f: () => this.pin(c.pinned && c.pinned.id === m.id ? null : m) } : null,
        { i: I.forward, t: "Переслать", f: () => this.forward(m, d) },
        m.poll && !m.poll.x && (m.poll.my || []).length && !m.poll.m ? { i: I.retry, t: "Отменить голос", f: () => this.vote(m, []) } : null,
        m.poll && !m.poll.x && (m.mine || can(c, "del")) ? { i: I.stop, t: "Остановить опрос", f: async () => { try { await this.swap(await rpc("nv_poll_stop", { p_msg: m.id })); } catch (e) { toast(errText(e)); } } } : null,
        canDel ? { i: I.trash, t: "Удалить", danger: true, f: () => this.del(m, el) } : null,
      ], head);
      $$("[data-e]", menu).forEach(b => b.onclick = () => { closeMenu(); this.react(m, b.dataset.e); });
    },
    async del(m, el) {
      const c = this.c;
      if (!(await confirmBox("Удалить сообщение", c.kind === "dm" && !c.saved ? "Сообщение удалится у вас обоих." : "Сообщение удалится у всех."))) return;
      try { await rpc("nv_delete_msg", { p_id: m.id }); this.burn(el, m.id); } catch (e) { toast(errText(e)); }
    },
    burn(el, id) {
      this.burnT.delete(id); this.msgs.delete(id);
      el.classList.add("gone"); setTimeout(() => { el.remove(); this.regroup(); }, 260);
    },
    async react(m, e) { try { await this.swap(await rpc("nv_react", { p_msg: m.id, p_emoji: m.my === e ? null : e })); } catch (x) { toast(errText(x)); } },
    jump(id) {
      const x = $(`.right .m[data-id="${id}"]`); if (!x) return toast("Сообщение выше, пролистай чат");
      x.scrollIntoView({ block: "center", behavior: "smooth" }); x.classList.add("hl"); setTimeout(() => x.classList.remove("hl"), 1500);
    },
    // ---------- поле ввода ----------
    composer() {
      const c = this.c, bot = $(".right .chat .bottom"); if (!bot) return;
      bot.innerHTML = "";
      const bar = (label, fn, ghost) => { const b = h(`<div class="joinbar"><button class="${ghost ? "ghost" : ""}">${esc(label)}</button></div>`); bot.append(b); $("button", b).onclick = fn; };
      if (!c.joined) {
        return bar(c.requested ? "Заявка отправлена · отменить" : c.access === "request" ? "Подать заявку" : c.kind === "channel" ? "Подписаться" : "Вступить в группу", async () => { try {
          if (c.requested) { await rpc("nv_unrequest", { p_chat: c.id }); c.requested = false; return this.composer(); }
          const r = await rpc("nv_join", { p_chat: c.id });
          if (r === "requested") { c.requested = true; toast("Заявка отправлена"); return this.composer(); }
          c.joined = true; c.members++; this.head(); this.composer(); Chats.load(); } catch (e) { toast(errText(e)); } }, c.requested);
      }
      if (c.kind === "channel" && !can(c, "post")) { const lc = Chats.list.find(x => x.id === c.id) || c; return bar(lc.muted ? "Включить звук" : "Выключить звук", async () => { await Chats.act(lc, lc.muted ? "unmute" : "mute"); setTimeout(() => this.composer(), 600); }, true); }
      if (c.blocked) return bar("Разблокировать", async () => { try { await rpc("nv_block", { p_user: c.peer.id, p_on: false }); c.blocked = false; this.composer(); } catch (e) { toast(errText(e)); } });
      if (c.kind === "dm" && !c.saved && (!c.peer || !c.peer.pubkey)) { bot.append(h(`<div class="joinbar"><span>Собеседник ещё не заходил в Needle. Написать получится, когда он зайдёт.</span></div>`)); return; }
      const f = h(`<form class="comp"><div class="extra"></div><div class="comp-r">
        <button type="button" class="ib" data-at aria-label="Прикрепить">${I.clip}</button>
        <textarea rows="1" maxlength="2000" placeholder="${c.kind === "channel" ? "Новый пост" : +c.slow && !isAdm(c) ? "Медленный режим: раз в " + slowName(c.slow) : "Сообщение"}"></textarea>
        <button class="send" aria-label="Отправить">${I.send}</button></div>
        <input type="file" hidden data-ph accept="image/*"><input type="file" hidden data-fl></form>`);
      bot.append(f);
      const ta = $("textarea", f);
      const fit = () => { ta.style.height = "auto"; ta.style.height = Math.min(180, ta.scrollHeight) + "px"; f.classList.toggle("has", !!ta.value.trim()); };
      ta.oninput = () => { fit(); if (c.kind !== "channel" && Date.now() - this.typT > 3500 && ta.value.trim()) { this.typT = Date.now(); rpc("nv_typing", { p_chat: c.id }).catch(() => {}); } if (c.kind === "group") this.mentionPop(ta, f); };
      ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing && (CFG.enter || e.ctrlKey) && !isPhone()) { e.preventDefault(); f.requestSubmit(); } if (e.key === "Escape") { this.clearExtra(); } if (e.key === "ArrowUp" && !ta.value) { const last = [...this.msgs.values()].reverse().find(m => m.mine && !m.poll && !m.expires_at); if (last) this.decode(last).then(d => d.t && this.startEdit(last, d)); } };
      const fi = $("[data-ph]", f), fl = $("[data-fl]", f);
      $("[data-at]", f).onclick = e => menuAt(e.currentTarget, [
        { i: I.photo, t: c.kind === "dm" ? "Фото (зашифровано)" : "Фото", f: () => (c.kind === "dm" ? fl : fi).click() },
        { i: I.file, t: "Файл до 8 МБ", f: () => fl.click() },
        c.kind !== "dm" ? { i: I.poll, t: "Опрос", f: () => this.pollNew() } : null,
      ]).parentElement.classList.add("up");
      fl.onchange = async () => { const file = fl.files[0]; fl.value = ""; if (!file) return; if (file.size > FMAX) return toast("Файл больше 8 МБ"); try { toast("Загружаю файл…"); const meta = await upFile(file, c.kind === "dm"); await this.send(ta.value.trim(), null, meta); ta.value = ""; fit(); } catch (e) { toast(errText(e)); } };
      fi.onchange = async () => { const file = fi.files[0]; fi.value = ""; if (!file) return; try { const im = await makeImage(file, 1600); toast("Загружаю фото…"); const path = await upload("nova", im.blob, im.ext, im.type); await this.send(ta.value.trim(), path); ta.value = ""; fit(); } catch (e) { toast(errText(e)); } };
      f.onsubmit = async e => {
        e.preventDefault(); const t = ta.value.trim(); if (!t) return;
        if (this.editing) { const ed = this.editing; try { await this.saveEdit(ed.m, ed.d, t); ta.value = ""; fit(); this.clearExtra(); } catch (x) { toast(errText(x)); } return; }
        ta.value = ""; fit();
        try { await this.send(t); } catch (x) { ta.value = t; fit(); toast(errText(x)); }
      };
      if (!isPhone()) setTimeout(() => ta.focus(), 60);
    },
    extra(icon, title, text) {
      const ex = $(".right .comp .extra"); if (!ex) return;
      ex.innerHTML = `<div class="ex">${icon}<div class="ex-t"><b>${title}</b><span>${esc(text)}</span></div><button type="button" class="ib" aria-label="Отмена">${I.close}</button></div>`;
      $("button", ex).onclick = () => this.clearExtra();
      const ta = $(".right .comp textarea"); if (ta) ta.focus();
    },
    clearExtra() { this.reply = null; if (this.editing) { const ta = $(".right .comp textarea"); if (ta) { ta.value = ""; ta.dispatchEvent(new Event("input")); } } this.editing = null; const ex = $(".right .comp .extra"); if (ex) ex.innerHTML = ""; },
    setReply(m, d) {
      if (!$(".right .comp")) return; this.editing = null; this.reply = m;
      const name = this.c.kind === "channel" ? chatTitle(this.c) : m.mine ? "себе" : m.anon ? anonName(m) : m.a ? pname(m.a) : "";
      this.extra(I.reply, "Ответ " + (m.mine ? "себе" : name), d.t || (d.f ? "Файл: " + d.f.name : m.photo ? "Фото" : "Сообщение"));
    },
    startEdit(m, d) {
      if (!$(".right .comp")) return; this.reply = null; this.editing = { m, d };
      this.extra(I.pen, "Редактирование", d.t);
      const ta = $(".right .comp textarea"); ta.value = d.t; ta.dispatchEvent(new Event("input")); ta.focus();
    },
    async saveEdit(m, d, t) {
      let args = { p_id: m.id, p_body: t };
      if (this.c.kind === "dm") { const e = await E2E.enc(d.f ? "\u0001" + JSON.stringify({ t, f: d.f }) : t, this.c.saved ? E2E.pub : this.c.peer.pubkey); args = { p_id: m.id, p_body: e.p_body, p_iv: e.p_iv, p_kp: e.p_kp, p_kr: e.p_kr }; }
      const nm = await rpc("nv_edit_msg", args); await this.swap(nm);
    },
    async send(text, photo, file) {
      const c = this.c, rp = this.reply ? this.reply.id : undefined; let args = { p_chat: c.id, p_body: text };
      const peerKey = () => c.saved ? E2E.pub : c.peer.pubkey;
      if (c.kind === "dm") {
        if (!E2E.pub) { if (E2E.locked) { keyPrompt(true); throw new Error("Сначала открой переписку паролем"); } throw new Error("Шифрование недоступно в этом браузере"); }
        args = Object.assign({ p_chat: c.id }, await E2E.enc(file ? "\u0001" + JSON.stringify({ t: text, f: file }) : text, peerKey()), file ? { p_file: { path: file.path } } : {});
      } else { if (photo) args.p_photo = photo; if (file) args.p_file = { path: file.path, name: file.name, size: file.size, type: file.type }; }
      if (rp) args.p_reply = rp; this.clearExtra();
      const m = await rpc("nv_send", args);
      if (this.id === c.id) await this.add([m]);
      Chats.load();
    },
    mentionPop(ta, f) {
      clearTimeout(this.mt); const pop0 = $(".mpop", f);
      const mt = ta.value.slice(0, ta.selectionStart).match(/(^|\s)@([a-z0-9_]{0,20})$/i);
      if (!mt) { if (pop0) pop0.remove(); return; }
      this.mt = setTimeout(async () => {
        let list = []; try { list = await rpc("nv_mention", { p_chat: this.c.id, p_q: mt[2] }); } catch {}
        let pop = $(".mpop", f); if (!list.length) { if (pop) pop.remove(); return; }
        if (!pop) { pop = h(`<div class="mpop"></div>`); f.prepend(pop); }
        pop.innerHTML = list.map(u => `<div class="row sm" data-un="${esc(u.username)}">${av(u, "sm")}<div class="rc"><div class="r1"><span class="rn">${uname(u)}</span></div><div class="r2"><span class="rp">@${esc(u.username)}</span></div></div></div>`).join("");
        $$("[data-un]", pop).forEach(r => r.onmousedown = e => { e.preventDefault(); const pos = ta.selectionStart, before = ta.value.slice(0, pos).replace(/@([a-z0-9_]{0,20})$/i, "@" + r.dataset.un + " "); ta.value = before + ta.value.slice(pos); ta.selectionStart = ta.selectionEnd = before.length; pop.remove(); ta.focus(); });
      }, 200);
    },
    forward(m, d) {
      const from = this.c.kind === "channel" ? this.c.title : m.mine ? (ME.name || ME.username) : m.anon ? "Аноним" : m.a ? (m.a.name || m.a.username) : "";
      const list = Chats.list.filter(c => c.kind !== "channel" || can(c, "post"));
      popup({ title: "Переслать", cls: "tall", html: `<div class="plist">${list.map(c => `<div class="row sm" data-c="${c.id}">${chatAv(c, "sm")}<div class="rc"><div class="r1"><span class="rn">${chatName(c)}</span></div></div></div>`).join("") || `<p class="pop-x">Чатов пока нет</p>`}</div>`, buttons: [{ t: "Отмена" }],
        onMount: (card, done) => $$("[data-c]", card).forEach(r => r.onclick = async () => {
          const c = list.find(x => x.id === +r.dataset.c); done();
          const t = d.t || "";
          try {
            let args;
            if (c.kind === "dm") {
              const key = c.saved ? E2E.pub : c.peer && c.peer.pubkey; if (!key) throw new Error("no key");
              const fileOk = d.f && m.mine;
              args = Object.assign({ p_chat: c.id, p_fwd: from }, await E2E.enc(fileOk ? "\u0001" + JSON.stringify({ t, f: d.f }) : (t || (d.f ? "Файл: " + d.f.name : "")), key), fileOk ? { p_file: { path: d.f.path } } : {});
            } else {
              const fileOk = d.f && m.mine && !d.f.k;
              args = { p_chat: c.id, p_body: t || (d.f && !fileOk ? "Файл: " + d.f.name : ""), p_fwd: from };
              if (fileOk) args.p_file = { path: d.f.path, name: d.f.name, size: d.f.size, type: d.f.type };
              if (m.photo && !d.f) args.p_photo = m.photo;
            }
            await rpc("nv_send", args); toast("Переслано"); Chats.load();
          } catch (e) { toast(errText(e)); }
        }) });
    },
    search() {
      const bar = $(".right .ch-search"); if (!bar) return;
      if (!bar.hidden) { bar.hidden = true; bar.innerHTML = ""; return; }
      bar.hidden = false;
      bar.innerHTML = `<label class="srch">${I.search}<input placeholder="Поиск в чате" maxlength="60"></label><button class="ib" data-x>${I.close}</button><div class="sres2"></div>`;
      const inp = $("input", bar), res = $(".sres2", bar); inp.focus();
      $("[data-x]", bar).onclick = () => { bar.hidden = true; bar.innerHTML = ""; };
      inp.onkeydown = e => { if (e.key === "Escape") $("[data-x]", bar).click(); };
      inp.oninput = debounce(async () => {
        const q = inp.value.trim(); if (q.length < 2) { res.innerHTML = ""; return; }
        let found = [];
        try {
          if (this.c.kind === "dm") { for (const m of [...this.msgs.values()].reverse()) { const d = await this.decode(m); if (d.t && d.t.toLowerCase().includes(q.toLowerCase())) found.push(m); if (found.length >= 50) break; } }
          else found = await rpc("nv_search_msgs", { p_chat: this.c.id, p_q: q });
        } catch (e) { res.innerHTML = `<div class="sr-e">${esc(errText(e))}</div>`; return; }
        if (!found.length) { res.innerHTML = `<div class="sr-e">Ничего не найдено${this.c.kind === "dm" ? ". В личке ищу среди загруженных сообщений." : ""}</div>`; return; }
        res.innerHTML = "";
        for (const m of found) { const d = await this.decode(m); const who = this.c.kind === "channel" ? chatTitle(this.c) : m.mine ? "Вы" : m.a ? pname(m.a) : "Аноним";
          const r = h(`<div class="sr"><div><b>${who}</b><small>${fmtTime(m.created_at)}</small></div><span>${esc((d.t || "").slice(0, 140))}</span></div>`); r.onclick = () => this.jump(m.id); res.append(r); }
      }, 300);
    },
    burnMenu() {
      const c = this.c;
      popup({ title: "Автоудаление", html: `<p class="pop-x">Новые сообщения в этом чате будут исчезать у всех через выбранное время.</p><div class="radios">${[[null, "Выключено"], [86400, "Через 1 день"], [3600, "Через 1 час"], [60, "Через 1 минуту"]].map(([v, t]) => `<label class="radio"><input type="radio" name="b" value="${v ?? ""}" ${(c.burn ?? null) === v ? "checked" : ""}><i></i><span>${t}</span></label>`).join("")}</div>`,
        buttons: [{ t: "Отмена" }, { t: "Сохранить", main: true, click: async card => { const v = $("input:checked", card).value; const sec = v ? +v : null; try { await rpc("nv_set_burn", { p_chat: c.id, p_sec: sec }); c.burn = sec; this.head(); toast(sec ? "Автоудаление: " + burnName(sec) : "Автоудаление выключено"); } catch (e) { toast(errText(e)); } } }] });
    },
    // ---------- опросы ----------
    pollHtml(m) {
      const p = m.poll, n = p.n || [], tot = n.reduce((a, b) => a + b, 0), voted = (p.my || []).length > 0, show = voted || p.x;
      return `<div class="poll${show ? " res" : ""}"><b class="pq">${esc(m.body)}</b><small class="pk">${p.x ? "Опрос завершён" : p.m ? "Можно выбрать несколько" : "Анонимный опрос"}</small>
        ${p.o.map((o, i) => { const pc = tot ? Math.round(n[i] * 100 / tot) : 0, me = (p.my || []).includes(i);
          return `<button class="po${me ? " me" : ""}" data-vo="${i}">${show ? `<span class="pp">${pc}%</span>` : `<span class="pr${p.m ? " sq" : ""}"></span>`}<span class="pt">${esc(o)}</span>${me ? I.check : ""}${show ? `<i style="width:${pc}%"></i>` : ""}</button>`; }).join("")}
        <small class="pv">${p.t ? p.t + " " + plural(p.t, "голос", "голоса", "голосов") : "Пока нет голосов"}</small></div>`;
    },
    async vote(m, opts) { try { await this.swap(await rpc("nv_vote", { p_msg: m.id, p_opts: opts })); } catch (e) { toast(errText(e)); } },
    pollNew() {
      const c = this.c;
      popup({ title: "Новый опрос", html: `<div class="pop-f">${field("q", "Вопрос", 'maxlength="200"')}<div class="sec2">Варианты ответа</div><div class="pops"></div><button type="button" class="lnk left" data-add>${I.plus} Добавить вариант</button>
          <label class="opt">Несколько ответов${sw(false, "data-mu")}</label><div class="err"></div></div>`,
        buttons: [{ t: "Отмена" }, { t: "Создать", main: true, manual: true, click: async card => {
          const q = $("[name=q]", card).value.trim(), o = $$(".pops input", card).map(x => x.value.trim()).filter(Boolean), er = $(".err", card);
          if (!q) { er.textContent = "Напиши вопрос"; return false; } if (o.length < 2) { er.textContent = "Нужно минимум 2 варианта"; return false; }
          try { const m = await rpc("nv_send_poll", { p_chat: c.id, p_q: q, p_opts: o, p_multi: $("[data-mu]", card).classList.contains("on") }); if (this.id === c.id) await this.add([m]); Chats.load(); return true; } catch (e) { er.textContent = errText(e); return false; }
        } }],
        onMount: card => {
          const ops = $(".pops", card), add = () => { const n = $$("input", ops).length; if (n >= 10) return; ops.insertAdjacentHTML("beforeend", field("o" + n, "Вариант " + (n + 1), 'maxlength="100"')); if (n + 1 >= 10) $("[data-add]", card).remove(); };
          add(); add(); $("[data-add]", card).onclick = () => { add(); $$("input", ops).pop().focus(); };
          const mu = $("[data-mu]", card); mu.parentElement.onclick = () => mu.classList.toggle("on");
        } });
    },
    // ---------- информация справа ----------
    info(tab) {
      const c = this.c; if (!c) return;
      if (c.kind === "dm" && !c.saved && c.peer) return UserSide.open(c.peer.id, c, tab);
      Side.open(c.saved ? "Избранное" : c.kind === "channel" ? "Информация о канале" : "Информация о группе", async (b, s) => {
        if (c.kind !== "dm" && can(c, "edit")) { $(".lh-a", s).innerHTML = `<button class="ib" aria-label="Изменить">${I.pen}</button>`; $(".lh-a button", s).onclick = () => this.editChat(); }
        b.innerHTML = `<div class="si-h">${chatAv(c, "xl")}<h3>${chatName(c)}</h3><small>${c.saved ? "Заметки для себя" : esc(members(c))}</small></div>
          ${c.saved ? "" : `<div class="si-l">
            ${c.about ? `<div class="si-r">${I.info}<div><span class="pre">${esc(c.about)}</span><small>Описание</small></div></div>` : ""}
            ${c.handle ? `<div class="si-r click" data-cp="${esc(SITE + c.handle)}">${I.link}<div><span>${esc(SITE.replace(/^https?:\/\//, "") + c.handle)}</span><small>Ссылка</small></div></div>` : ""}
            ${c.joined ? `<label class="si-r">${I.bell}<div><span>Уведомления</span><small>${(Chats.list.find(x => x.id === c.id) || {}).muted ? "Выключены" : "Включены"}</small></div>${sw(!(Chats.list.find(x => x.id === c.id) || {}).muted, "data-mute")}</label>` : ""}
          </div>`}
          ${c.kind !== "dm" && isAdm(c) ? `<div class="si-l"><button class="si-r click" data-ppl>${I.users}<div><span>${c.kind === "channel" ? "Подписчики" : "Участники"}</span><small>${members(c)}${+c.reqs ? ` · заявок: ${c.reqs}` : ""}</small></div></button></div>` : ""}
          <div class="tabs2"><button class="on" data-t="m">Медиа</button><button data-t="f">Файлы</button></div><div class="mgal"><div class="spin"></div></div>`;
        const cp = $("[data-cp]", b); if (cp) cp.onclick = () => copy(cp.dataset.cp, "Ссылка скопирована");
        const mu = $("[data-mute]", b); if (mu) mu.parentElement.onclick = async e => { e.preventDefault(); const lc = Chats.list.find(x => x.id === c.id) || c; await Chats.act(lc, lc.muted ? "unmute" : "mute"); mu.classList.toggle("on"); };
        const pp = $("[data-ppl]", b); if (pp) pp.onclick = () => People.open(c);
        Media.into(c, b, tab === "media" ? "m" : "m");
      });
    },
    editChat() {
      const c = this.c;
      const ACC = { open: "Открытый", request: "По заявке", closed: "Закрытый" };
      const ACCH = { open: "Любой найдёт по @юзернейму и вступит сразу.", request: "Человек подаёт заявку, а админ принимает или отклоняет.", closed: "Не виден в поиске. Попасть можно только по ссылке-приглашению." };
      Side.open(c.kind === "channel" ? "Изменить канал" : "Изменить группу", (b) => {
        b.innerHTML = `<div class="pad">${field("t", "Название", 'maxlength="40"', c.title)}${areaField("a", "Описание", 'maxlength="200" rows="2"', c.about)}
          <div class="at-f">${field("h", "Публичная ссылка (юзернейм)", 'maxlength="20" autocomplete="off" autocapitalize="off"', c.handle || "")}</div>
          <div class="sec2">Тип</div><div class="radios" data-acc>${Object.keys(ACC).map(k => `<label class="radio"><input type="radio" name="acc" value="${k}" ${(c.access || "open") === k ? "checked" : ""}><i></i><span>${ACC[k]}<small>${ACCH[k]}</small></span></label>`).join("")}</div>
          ${can(c, "invite") ? `<div class="sec2">Ссылка-приглашение</div><div class="inv"><span class="mono" data-inv>${c.invite ? esc(SITE + "+" + c.invite) : "нет"}</span><button type="button" class="lnk" data-ic>Копировать</button><button type="button" class="lnk" data-ir>${c.invite ? "Новая" : "Создать"}</button></div>` : ""}
          ${c.kind === "group" ? `<div class="sec2">Медленный режим</div><div class="seg" data-slow>${SLOW.map(([v, t]) => `<button type="button" data-v="${v}" class="${(+c.slow || 0) === v ? "on" : ""}">${t}</button>`).join("")}</div><p class="hint">Участники смогут писать не чаще выбранного. На админов не действует.</p>` : ""}
          ${c.kind === "channel" ? `<label class="opt">Комментарии к постам${sw(c.comments !== false, "data-cmsw")}</label>` : ""}
          <div class="err"></div><button class="btn wide" data-y>Сохранить</button></div>`;
        let slow = +c.slow || 0;
        $$("[data-slow] button", b).forEach(x => x.onclick = () => { slow = +x.dataset.v; $$("[data-slow] button", b).forEach(y => y.classList.toggle("on", y === x)); });
        const cms = $("[data-cmsw]", b); if (cms) cms.parentElement.onclick = e => { e.preventDefault(); cms.classList.toggle("on"); };
        const inv = $("[data-inv]", b);
        if (inv) { $("[data-ic]", b).onclick = () => c.invite ? copy(SITE + "+" + c.invite, "Ссылка скопирована") : toast("Сначала создай ссылку");
          $("[data-ir]", b).onclick = async () => { try { c.invite = await rpc("nv_chat_invite", { p_chat: c.id, p_reset: true }); inv.textContent = SITE + "+" + c.invite; $("[data-ir]", b).textContent = "Новая"; toast("Старая ссылка больше не работает"); } catch (e) { toast(errText(e)); } }; }
        $("[data-y]", b).onclick = async () => {
          try {
            const hd = $("[name=h]", b).value.trim().replace(/^@/, "").toLowerCase(), acc = $("[name=acc]:checked", b).value;
            if (hd && !/^[a-z0-9_]{3,20}$/.test(hd)) throw new Error("bad username");
            if (hd !== (c.handle || "")) await rpc("nv_chat_handle", { p_chat: c.id, p_handle: hd || null });
            if (acc !== (c.access || "open")) await rpc("nv_chat_access", { p_chat: c.id, p_access: acc });
            if (c.kind === "group" && slow !== (+c.slow || 0)) await rpc("nv_chat_slow", { p_chat: c.id, p_sec: slow });
            if (cms && cms.classList.contains("on") !== (c.comments !== false)) await rpc("nv_chat_comments", { p_chat: c.id, p_on: cms.classList.contains("on") });
            await rpc("nv_edit_chat", { p_chat: c.id, p_title: $("[name=t]", b).value, p_about: $("[name=a]", b).value, p_anon: !!c.anon_ok });
            toast("Сохранено"); const id = c.id; this.id = 0; Chats.load(); this.open(id);
          } catch (e) { $(".err", b).textContent = errText(e); }
        };
      });
    },
  };
  const SLOW = [[0, "Выкл"], [10, "10с"], [30, "30с"], [60, "1м"], [300, "5м"], [900, "15м"], [3600, "1ч"]];
  const slowName = v => v >= 3600 ? v / 3600 + " ч" : v >= 60 ? v / 60 + " мин" : v + " сек.";

  // медиа и файлы чата
  const Media = {
    async into(c, b, k) {
      const g = $(".mgal", b); let items = [];
      try {
        const list = await rpc("nv_chat_media", { p_chat: c.id });
        for (const m of list) { const d = await Chat.decode(m); const img = m.photo && PATH_RE.test(m.photo) ? pub("nova", m.photo) : null; if (img || d.f) items.push({ m, d, img, kind: img || (d.f && /^image\//.test(d.f.type)) ? "m" : "f" }); }
      } catch (e) { g.innerHTML = `<div class="l-empty"><span>${esc(errText(e))}</span></div>`; return; }
      const draw = k => {
        const xs = items.filter(x => x.kind === k); g.className = "mgal " + k; g.innerHTML = xs.length ? "" : `<div class="l-empty"><span>${k === "m" ? "Фото пока нет" : "Файлов пока нет"}</span></div>`;
        for (const x of xs) {
          if (x.img) { const im = h(`<img src="${esc(x.img)}" alt="" loading="lazy">`); im.onclick = () => lightbox(x.img); g.append(im); continue; }
          const fe = fileEl(x.d.f); if (fe) g.append(fe);
        }
      };
      draw(k);
      $$(".tabs2 button", b).forEach(x => x.onclick = () => { $$(".tabs2 button", b).forEach(y => y.classList.toggle("on", y === x)); draw(x.dataset.t); });
    },
  };

  // участники, заявки, баны, админы
  const People = {
    open(c) {
      Side.open(c.kind === "channel" ? "Подписчики" : "Участники", (b, s) => {
        $("[data-x]", s).innerHTML = I.back; $("[data-x]", s).onclick = () => Chat.info();
        const draw = async () => {
          try {
            const r = await rpc("nv_chat_people", { p_chat: c.id });
            const boss = ME.is_admin || c.owner, ban = can(c, "ban"), inv = can(c, "invite");
            const role = u => u.role === "owner" ? "владелец" : u.role === "admin" ? "админ" : "";
            const row = (u, extra = "") => `<div class="row sm" data-u="${u.id}">${av(u, "sm")}<div class="rc"><div class="r1"><span class="rn">${uname(u)}</span><span class="rt">${role(u)}</span></div><div class="r2"><span class="rp">@${esc(u.username)}</span></div></div>${extra}</div>`;
            b.innerHTML = (r.reqs.length && inv ? `<div class="sec">Заявки · ${r.reqs.length}</div>` + r.reqs.map(u => row(u, `<button class="btn sm" data-ok="${u.id}">Принять</button><button class="ib" data-no="${u.id}" aria-label="Отклонить">${I.close}</button>`)).join("") : "")
              + `<div class="sec">${c.kind === "channel" ? "Подписчики" : "Участники"} · ${c.members}</div>` + (r.list.map(u => row(u)).join("") || `<div class="l-empty"><span>Пока никого</span></div>`)
              + ((r.bans || []).length ? `<div class="sec">Заблокированы · ${r.bans.length}</div>` + r.bans.map(u => row(u, ban ? `<button class="lnk" data-unban="${u.id}">Разбанить</button>` : "")).join("") : "");
            const act = (sel, fn) => $$(sel, b).forEach(x => x.onclick = async e => { e.stopPropagation(); try { await fn(x); draw(); } catch (er) { if (er.message !== "cancel") toast(errText(er)); } });
            act("[data-ok]", x => rpc("nv_chat_answer", { p_chat: c.id, p_user: x.dataset.ok, p_ok: true }).then(() => { c.members++; c.reqs = Math.max(0, (c.reqs || 1) - 1); }));
            act("[data-no]", x => rpc("nv_chat_answer", { p_chat: c.id, p_user: x.dataset.no, p_ok: false }).then(() => { c.reqs = Math.max(0, (c.reqs || 1) - 1); }));
            act("[data-unban]", x => rpc("nv_chat_ban", { p_chat: c.id, p_user: x.dataset.unban, p_on: false }));
            $$(".row[data-u]", b).forEach(x => {
              const u = r.list.find(y => y.id === x.dataset.u);
              x.onclick = () => Profile.open(x.dataset.u);
              if (!u || u.id === ME.id || u.role === "owner") return;
              onHold(x, (px, py) => ctxMenu(px, py, [
                { i: I.user, t: "Открыть профиль", f: () => Profile.open(u.id) },
                boss ? { i: I.admin, t: u.role === "admin" ? "Права админа" : "Назначить админом", f: () => this.rights(c, u, draw) } : null,
                ban && (u.role !== "admin" || boss) ? { i: I.logout, t: "Исключить", danger: true, f: async () => { if (!(await confirmBox("Исключить", `${u.name || u.username} сможет вернуться по ссылке.`, "Исключить"))) return; try { await rpc("nv_chat_kick", { p_chat: c.id, p_user: u.id }); c.members--; draw(); } catch (e) { toast(errText(e)); } } } : null,
                ban && (u.role !== "admin" || boss) ? { i: I.block, t: "Заблокировать", danger: true, f: async () => { if (!(await confirmBox("Заблокировать", `${u.name || u.username} вылетит из чата и не сможет вернуться, пока не разбанишь.`, "Заблокировать"))) return; try { await rpc("nv_chat_ban", { p_chat: c.id, p_user: u.id, p_on: true }); c.members--; draw(); } catch (e) { toast(errText(e)); } } } : null,
              ]));
            });
          } catch (e) { b.innerHTML = `<div class="l-empty"><span>${esc(errText(e))}</span></div>`; }
        };
        b.innerHTML = `<div class="spin"></div>`; draw();
      });
    },
    rights(c, u, done) {
      const RIGHTS = [["post", "Публиковать посты"], ["edit", "Менять информацию"], ["del", "Удалять сообщения"], ["ban", "Блокировать участников"], ["pin", "Закреплять сообщения"], ["invite", "Приглашения и заявки"]];
      const has = u.role === "admin" ? u.rights || [] : ["del", "ban", "pin", "invite"].concat(c.kind === "channel" ? ["post"] : []);
      const go = async rights => { try { await rpc("nv_chat_admin", { p_chat: c.id, p_user: u.id, p_rights: rights }); toast(rights ? "Админ назначен" : "Админ снят"); done(); } catch (e) { toast(errText(e)); return false; } };
      popup({ title: "Права админа", html: `<div class="row sm">${av(u, "sm")}<div class="rc"><div class="r1"><span class="rn">${uname(u)}</span></div><div class="r2"><span class="rp">@${esc(u.username)}</span></div></div></div>
          ${RIGHTS.filter(([k]) => k !== "post" || c.kind === "channel").map(([k, t]) => `<label class="opt">${t}${sw(has.includes(k), `data-r="${k}"`)}</label>`).join("")}`,
        buttons: [u.role === "admin" ? { t: "Снять админа", danger: true, click: () => go(null) } : { t: "Отмена" }, { t: u.role === "admin" ? "Сохранить" : "Назначить", main: true, click: card => go($$("[data-r].on", card).map(x => x.dataset.r)) }],
        onMount: card => $$("[data-r]", card).forEach(x => x.parentElement.onclick = e => { e.preventDefault(); x.classList.toggle("on"); }) });
    },
  };

  // комментарии к постам канала
  const Comments = {
    open(c, m) {
      Side.open("Комментарии", async (b) => {
        b.innerHTML = `<div class="cml"><div class="spin"></div></div><form class="comp cmf"><div class="extra"></div><div class="comp-r"><textarea rows="1" maxlength="1000" placeholder="Комментарий"></textarea><button class="send" aria-label="Отправить">${I.send}</button></div></form>`;
        b.classList.add("cm-side");
        const list = $(".cml", b), f = $(".cmf", b), ta = $("textarea", f), ex = $(".extra", f); let rp = null, data = null;
        const setRp = x => { rp = x; ex.innerHTML = x ? `<div class="ex">${I.reply}<div class="ex-t"><b>Ответ ${esc(x.a.name || x.a.username)}</b><span>${esc(x.body.slice(0, 80))}</span></div><button type="button" class="ib">${I.close}</button></div>` : ""; if (x) { $("button", ex).onclick = () => setRp(null); ta.focus(); } };
        const draw = async () => {
          try { data = await rpc("nv_post_comments", { p_msg: m.id }); } catch (e) { list.innerHTML = `<div class="l-empty"><span>${esc(errText(e))}</span></div>`; return; }
          f.hidden = !data.on || !data.joined;
          const by = new Map(data.list.map(x => [x.id, x]));
          list.innerHTML = data.list.length ? data.list.map(x => { const q = x.reply_to && by.get(x.reply_to);
            return `<div class="m in first last" data-id="${x.id}"><span class="m-av" data-p="${x.a.id}">${av(x.a, "sm")}</span><div class="bb"><div class="au"><span class="nm" data-p="${x.a.id}">${pname(x.a)}</span></div>${q ? `<div class="rq"><b>${esc(q.a.name || q.a.username)}</b><span>${esc(q.body.slice(0, 80))}</span></div>` : ""}<div class="tx">${esc(x.body)}<i class="msp" style="width:42px"></i><span class="meta">${hm(x.created_at)}</span></div></div></div>`; }).join("")
            : `<div class="sys"><span>${data.on ? "Пока нет комментариев" : "Комментарии выключены"}</span></div>`;
          if (data.on && !data.joined) list.insertAdjacentHTML("beforeend", `<div class="sys"><span>Подпишись на канал, чтобы комментировать</span></div>`);
          list.scrollTop = list.scrollHeight;
          $$("[data-p]", list).forEach(x => x.onclick = () => Profile.open(x.dataset.p));
          $$(".m[data-id]", list).forEach(el => { const x = by.get(+el.dataset.id); onHold($(".bb", el), (px, py) => ctxMenu(px, py, [
            data.on && data.joined ? { i: I.reply, t: "Ответить", f: () => setRp(x) } : null, { i: I.copy, t: "Копировать текст", f: () => copy(x.body) },
            x.del ? { i: I.trash, t: "Удалить", danger: true, f: async () => { if (!(await confirmBox("Удалить комментарий", "Комментарий исчезнет у всех."))) return; try { await rpc("nv_post_comment_del", { p_id: x.id }); m.cm = Math.max(0, (+m.cm || 1) - 1); Chat.swap(m); draw(); } catch (e) { toast(errText(e)); } } } : null])); });
        };
        ta.oninput = () => { ta.style.height = "auto"; ta.style.height = Math.min(140, ta.scrollHeight) + "px"; f.classList.toggle("has", !!ta.value.trim()); };
        ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !isPhone()) { e.preventDefault(); f.requestSubmit(); } };
        f.onsubmit = async e => { e.preventDefault(); const t = ta.value.trim(); if (!t) return; try { await rpc("nv_post_comment", { p_msg: m.id, p_body: t, p_reply: rp ? rp.id : null }); ta.value = ""; ta.oninput(); setRp(null); m.cm = (+m.cm || 0) + 1; Chat.swap(m); draw(); } catch (x) { toast(errText(x)); } };
        draw();
      });
    },
  };

  // ================= профиль человека справа (из личного чата) =================
  const UserSide = {
    async open(uid, c, tab) {
      Side.open("Информация", async (b) => {
        b.innerHTML = `<div class="spin"></div>`;
        try {
          const p = await rpc("nv_profile", { p_user: uid }); if (!p) throw new Error("no user");
          const st = seenText(p.seen_at);
          const lc = Chats.list.find(x => x.id === c.id) || c;
          b.innerHTML = `<div class="si-h">${av(p, "xl")}<h3>${uname(p)}</h3><small class="${st === "в сети" ? "on" : ""}">${esc(st)}</small></div>
            <div class="si-l">
              ${p.bio ? `<div class="si-r">${I.info}<div><span class="pre">${esc(p.bio)}</span><small>О себе</small></div></div>` : ""}
              <div class="si-r click" data-cp>${I.at}<div><span>@${esc(p.username)}</span><small>Юзернейм</small></div></div>
              ${p.birth ? `<div class="si-r">${I.calendar}<div><span>${dateRu(p.birth)}</span><small>День рождения</small></div></div>` : ""}
              <label class="si-r">${I.bell}<div><span>Уведомления</span><small>${lc.muted ? "Выключены" : "Включены"}</small></div>${sw(!lc.muted, "data-mute")}</label>
            </div>
            <div class="si-l"><button class="si-r click" data-prof>${I.user}<div><span>Открыть профиль</span></div></button>
              <button class="si-r click" data-key>${I.key}<div><span>Код шифрования</span><small>Сверить ключи с собеседником</small></div></button>
              <button class="si-r click danger" data-block>${I.block}<div><span>${p.blocked ? "Разблокировать" : "Заблокировать"}</span></div></button></div>
            <div class="tabs2"><button class="on" data-t="m">Медиа</button><button data-t="f">Файлы</button></div><div class="mgal"><div class="spin"></div></div>`;
          $("[data-cp]", b).onclick = () => copy("@" + p.username, "Юзернейм скопирован");
          $("[data-prof]", b).onclick = () => Profile.open(p.id);
          $("[data-key]", b).onclick = () => Chat.keyCode();
          $("[data-mute]", b).parentElement.onclick = async e => { e.preventDefault(); await Chats.act(lc, lc.muted ? "unmute" : "mute"); $("[data-mute]", b).classList.toggle("on"); };
          $("[data-block]", b).onclick = () => blockUser(p, () => this.open(uid, c));
          Media.into(c, b, "m");
        } catch (e) { b.innerHTML = `<div class="l-empty"><span>${esc(errText(e))}</span></div>`; }
      });
    },
  };
  async function blockUser(p, done) {
    if (!p.blocked && !(await confirmBox("Заблокировать", `${p.name || p.username} не сможет писать тебе в личку и не увидит, когда ты в сети.`, "Заблокировать"))) return;
    try { await rpc("nv_block", { p_user: p.id, p_on: !p.blocked }); toast(p.blocked ? "Разблокирован(а)" : "Заблокирован(а)"); PREFS = Object.assign(PREFS, await rpc("nv_prefs_get")); done && done(); } catch (e) { toast(errText(e)); }
  }

  // ================= профиль как во ВКонтакте: обложка, аватарка, стена =================
  const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const coverUrl = p => p && p.cover && PATH_RE.test(p.cover) ? pub("nova", p.cover) : "";
  const Profile = {
    async open(uid) {
      const node = h(`<section class="page prof"><header class="ch">${backBtn()}<div class="ch-t"><div class="ch-n"><b>Профиль</b></div></div><div class="ch-a"></div></header><div class="page-b"><div class="spin"></div></div></section>`);
      R.show("profile", node); wireBack(node); Drawer.close();
      const b = $(".page-b", node), mine = uid === ME.id;
      try {
        const p = await rpc("nv_profile", { p_user: uid }); if (!p) throw new Error("no user");
        if (mine) Object.assign(ME, { cover: p.cover });
        const st = mine ? "в сети" : seenText(p.seen_at);
        $(".ch-n b", node).innerHTML = uname(p);
        const cu = coverUrl(p);
        b.innerHTML = `<div class="pw-wrap">
          <div class="vk-card"><div class="cover${cu ? "" : " none"}">${cu ? `<img src="${esc(cu)}" alt="">` : ""}${mine ? `<label class="cover-btn">${I.camera}<span>${cu ? "Изменить обложку" : "Добавить обложку"}</span><input type="file" accept="image/*" hidden data-cov></label>` : ""}</div>
            <div class="vk-row"><div class="vk-av">${av(p, "xxl")}${mine ? `<label class="av-btn" title="Сменить фото">${I.camera}<input type="file" accept="image/*" hidden data-av></label>` : ""}</div>
              <div class="vk-main"><h1>${uname(p)}</h1><div class="vk-st${st === "в сети" ? " on" : ""}">${esc(st)}</div>${p.bio ? `<div class="vk-bio">${esc(p.bio)}</div>` : ""}</div>
              <div class="vk-btns">${mine ? `<button class="btn ghost" data-edit>Редактировать профиль</button>` : `${p.banned ? "" : `<button class="btn" data-dm>Написать сообщение</button>`}<button class="ib box" data-more aria-label="Ещё">${I.more}</button>`}</div></div>
            <div class="vk-info"><span>${I.at}@${esc(p.username)}</span>${p.birth ? `<span>${I.calendar}${dateRu(p.birth).replace(/ г\.$/, "")}</span>` : ""}<span>${I.id}ID ${p.num}</span><span>${I.star}в Needle с ${MONTHS[new Date(p.created_at).getMonth()]} ${new Date(p.created_at).getFullYear()}</span></div>
            ${p.banned ? `<div class="vk-ban">Аккаунт заблокирован</div>` : ""}
          </div>
          <div class="vk-card wall"><div class="tabs2"><button class="on" data-pt="posts">Записи</button><button data-pt="media">Фото</button></div>
            ${mine ? `<div class="np-mini" data-np>${av(ME, "sm")}<span>Что у вас нового?</span>${I.photo}</div>` : ""}<div class="posts"><div class="spin"></div></div></div></div>`;
        const on = (s, f) => { const x = $(s, b); if (x) x.onclick = f; };
        on("[data-dm]", () => openDm(p.id));
        on("[data-edit]", () => { L.clear(); Settings.open(); Settings.account(); });
        on("[data-np]", () => Feed.compose(() => this.open(uid)));
        on("[data-more]", e => menuAt(e.currentTarget, [
          { i: I.link, t: "Скопировать ссылку", f: () => copy(SITE + p.username, "Ссылка скопирована") },
          { i: I.block, t: p.blocked ? "Разблокировать" : "Заблокировать", danger: !p.blocked, f: () => blockUser(p, () => this.open(uid)) },
          ME.is_admin && !p.is_admin ? { i: I.admin, t: p.banned ? "Разбанить в Needle" : "Забанить в Needle", danger: !p.banned, f: async () => { if (!(await confirmBox(p.banned ? "Разбанить" : "Забанить", `@${p.username}`, p.banned ? "Разбанить" : "Забанить"))) return; try { await rpc("sn_set_ban", { p_username: p.username, p_ban: !p.banned }); this.open(uid); } catch (x) { toast(errText(x)); } } } : null,
        ]));
        const cov = $("[data-cov]", b); if (cov) cov.onchange = async () => { const f = cov.files[0]; cov.value = ""; if (!f) return; try { toast("Загружаю обложку…"); const im = await makeImage(f, 1500); const path = await upload("nova", im.blob, im.ext, im.type); await rpc("nv_set_cover", { p_path: path }); ME.cover = path; this.open(uid); } catch (x) { toast(errText(x)); } };
        const avi = $("[data-av]", b); if (avi) avi.onchange = async () => { const f = avi.files[0]; avi.value = ""; if (!f) return; try { await setAvatar(f); this.open(uid); } catch (x) { toast(errText(x)); } };
        const posts = await rpc("nv_feed", { p_user: p.id }).catch(() => []);
        const box = $(".posts", b);
        const draw = k => {
          $$(".wall .tabs2 button", b).forEach(x => x.classList.toggle("on", x.dataset.pt === k));
          box.innerHTML = ""; box.className = "posts" + (k === "media" ? " pgrid" : "");
          if (k === "media") { const ph = posts.flatMap(x => (x.photos || []).filter(u => PATH_RE.test(u))); box.innerHTML = ph.length ? ph.map(u => `<img src="${esc(pub("nova", u))}" alt="" loading="lazy">`).join("") : `<div class="l-empty"><span>Фото пока нет</span></div>`; $$("img", box).forEach(im => im.onclick = () => lightbox(im.src)); }
          else { if (!posts.length) box.innerHTML = `<div class="l-empty"><span>${mine ? "Здесь будут твои записи" : "Записей пока нет"}</span></div>`; posts.forEach(x => box.append(Feed.post(x))); }
        };
        $$(".wall .tabs2 button", b).forEach(x => x.onclick = () => draw(x.dataset.pt));
        draw("posts");
      } catch (e) { b.innerHTML = `<div class="l-empty"><span>${esc(errText(e))}</span></div>`; }
    },
  };
  async function setAvatar(f) {
    const im = await makeImage(f, 320, true); const path = await upload("avatars", im.blob, im.ext, im.type); const old = ME.avatar;
    await rpc("sn_set_avatar", { p_path: path }); if (old) sb.storage.from("avatars").remove([old]).catch(() => {}); ME.avatar = path; Drawer.draw(); toast("Фото обновлено");
  }

  // ================= лента =================
  const Feed = {
    oldest: null,
    open() {
      const node = h(`<section class="page feedp"><header class="ch">${backBtn()}<div class="ch-t"><div class="ch-n"><b>Лента</b><small>посты всех людей в Needle</small></div></div><div class="ch-a"><button class="ib" data-r aria-label="Обновить">${I.retry}</button></div></header>
        <div class="page-b"><div class="pw-wrap narrow"><div class="vk-card np-mini" data-np>${av(ME, "sm")}<span>Что у вас нового?</span>${I.photo}</div><div class="posts"><div class="spin"></div></div></div></div></section>`);
      R.show("feed", node); wireBack(node);
      $("[data-np]", node).onclick = () => this.compose(() => this.load(node));
      $("[data-r]", node).onclick = () => this.load(node);
      this.load(node);
    },
    async load(node, more) {
      const box = $(".posts", node); if (!box) return;
      try {
        const list = await rpc("nv_feed", { p_before: more ? this.oldest : null });
        if (!more) box.innerHTML = ""; const mb = $(".morep", box); if (mb) mb.remove();
        list.forEach(p => box.append(this.post(p)));
        if (list.length) this.oldest = Math.min(...list.map(p => p.id), more && this.oldest ? this.oldest : Infinity);
        if (!box.children.length) box.innerHTML = `<div class="l-empty"><b>Лента пустая</b><span>Напиши первый пост</span></div>`;
        if (list.length >= 30) { const b = h(`<button class="btn ghost morep">Показать ещё</button>`); box.append(b); b.onclick = () => this.load(node, true); }
      } catch (e) { box.innerHTML = `<div class="l-empty"><span>${esc(errText(e))}</span></div>`; }
    },
    compose(done) {
      const photos = [];
      popup({ title: "Новая запись", wide: true, html: `<div class="pop-f"><textarea class="np-ta" rows="4" maxlength="4000" placeholder="Что у вас нового?"></textarea><div class="thumbs"></div><div class="err"></div></div>`,
        buttons: [{ t: "Фото", click: card => { $("[data-ph]", card).click(); return false; } }, { t: "Отмена" }, { t: "Опубликовать", main: true, manual: true, click: async card => {
          const t = $("textarea", card).value.trim(); if (!t && !photos.length) return false;
          try {
            const paths = []; for (const p of photos) paths.push(await upload("nova", p.blob, p.ext, p.type));
            const p = await rpc("nv_post", { p_text: t, p_photos: paths, p_video: null, p_anon: false });
            if (p && p.junk) { $(".err", card).textContent = "Похоже на спам: пост не опубликован"; return false; }
            toast(p && p.approved === false ? "Отправлено на проверку" : "Опубликовано"); done && done(); return true;
          } catch (e) { $(".err", card).textContent = errText(e); return false; }
        } }],
        onMount: card => {
          card.insertAdjacentHTML("beforeend", `<input type="file" accept="image/*" multiple hidden data-ph>`);
          const th = $(".thumbs", card), fi = $("[data-ph]", card);
          const draw = () => { th.innerHTML = photos.map((p, i) => `<div><img src="${p.url}" alt=""><button data-i="${i}" aria-label="Убрать">${I.close}</button></div>`).join(""); $$("[data-i]", th).forEach(b => b.onclick = () => { photos.splice(+b.dataset.i, 1); draw(); }); };
          fi.onchange = async () => { for (const f of [...fi.files].slice(0, 4 - photos.length)) { try { const im = await makeImage(f, 1600); photos.push(Object.assign(im, { url: await dataUrl(im.blob) })); } catch (x) { toast(errText(x)); } } fi.value = ""; draw(); };
        } });
    },
    post(p) {
      const ph = (p.photos || []).filter(x => PATH_RE.test(x));
      const who = p.anon ? `<span class="av s0">?</span><div><b>${anonName(p)}</b><small>${ago(p.created_at)}</small></div>` : `<span data-p="${p.a && p.a.id}">${av(p.a)}</span><div><b data-p="${p.a && p.a.id}">${uname(p.a)}</b><small>${ago(p.created_at)}</small></div>`;
      const el = h(`<article class="vk-card post${p.approved === false ? " wait" : ""}"><div class="post-h">${who}${p.approved === false ? `<span class="pend">на проверке</span>` : ""}${p.mine || ME.is_admin ? `<button class="ib" data-m aria-label="Ещё">${I.more}</button>` : ""}</div>
        ${p.text ? `<div class="post-t">${esc(p.text)}</div>` : ""}${ph.length ? `<div class="gal n${Math.min(ph.length, 4)}">${ph.map(x => `<img src="${esc(pub("nova", x))}" alt="" loading="lazy">`).join("")}</div>` : ""}
        <div class="post-a"><button data-like class="${p.liked ? "on" : ""}">${I.heart}<span>${p.likes || ""}</span></button><button data-cm>${I.comment}<span>${p.comments || ""}</span></button>
        ${!p.approved && ME.is_admin && p.approved === false ? `<span class="sp"></span><button data-ok>${I.check}<span>Одобрить</span></button>` : ""}</div></article>`);
      $$("[data-p]", el).forEach(x => x.dataset.p && x.dataset.p !== "undefined" && (x.onclick = () => Profile.open(x.dataset.p)));
      $$(".gal img", el).forEach(i => i.onclick = () => lightbox(i.src));
      const lk = $("[data-like]", el);
      lk.onclick = async () => { try { const on = await rpc("nv_like", { p_post: p.id }); p.liked = on; p.likes = (+p.likes || 0) + (on ? 1 : -1); lk.classList.toggle("on", on); $("span", lk).textContent = p.likes || ""; } catch (e) { toast(errText(e)); } };
      $("[data-cm]", el).onclick = () => this.comments(el, p);
      const m = $("[data-m]", el); if (m) m.onclick = e => menuAt(e.currentTarget, [{ i: I.trash, t: "Удалить запись", danger: true, f: async () => { if (!(await confirmBox("Удалить запись", "Запись исчезнет из ленты и профиля."))) return; try { await rpc("nv_delete_post", { p_id: p.id }); el.remove(); } catch (x) { toast(errText(x)); } } }]);
      const ok = $("[data-ok]", el); if (ok) ok.onclick = async () => { try { await rpc("nv_moderate", { p_id: p.id, p_ok: true }); el.classList.remove("wait"); ok.remove(); const pe = $(".pend", el); if (pe) pe.remove(); } catch (x) { toast(errText(x)); } };
      return el;
    },
    async comments(el, p) {
      let box = $(".cmts", el); if (box) return box.remove();
      box = h(`<div class="cmts"><div class="spin"></div></div>`); el.append(box);
      const draw = async () => {
        try {
          const list = await rpc("nv_comments", { p_post: p.id });
          box.innerHTML = list.map(c => `<div class="cmt">${c.anon ? `<span class="av s0 sm">?</span>` : av(c.a, "sm")}<div class="cmt-b"><b>${c.anon ? anonName(c) : uname(c.a)}</b><div>${esc(c.text)}</div><small>${ago(c.created_at)}${c.mine || p.mine || ME.is_admin ? ` · <button class="lnk" data-d="${c.id}">Удалить</button>` : ""}</small></div></div>`).join("")
            + `<form class="cmt-f">${av(ME, "sm")}<input maxlength="500" placeholder="Написать комментарий…"><button class="ib" aria-label="Отправить">${I.send}</button></form>`;
          $$("[data-d]", box).forEach(b => b.onclick = async () => { try { await rpc("nv_delete_comment", { p_id: +b.dataset.d }); p.comments = Math.max(0, p.comments - 1); draw(); } catch (e) { toast(errText(e)); } });
          const f = $("form", box); f.onsubmit = async e => { e.preventDefault(); const t = $("input", f).value.trim(); if (!t) return; try { const j = await rpc("nv_comment", { p_post: p.id, p_text: t, p_anon: false }); if (j) return toast("Похоже на спам: комментарий не опубликован"); p.comments = (+p.comments || 0) + 1; $("[data-cm] span", el).textContent = p.comments; draw(); } catch (x) { toast(errText(x)); } };
          if (!isPhone()) $("input", f).focus();
        } catch (e) { box.innerHTML = `<div class="err">${esc(errText(e))}</div>`; }
      };
      draw();
    },
  };

  // ================= настройки: список, как в Telegram =================
  const Settings = {
    open() {
      Drawer.close();
      L.push("Настройки", b => {
        b.innerHTML = `<div class="set-h">${av(ME, "xl")}<div><h3>${uname(ME)}</h3><small>@${esc(ME.username)}</small></div></div>
          <div class="set-l">
            ${[["account", I.user, "Мой аккаунт", "Имя, юзернейм, фото, о себе"], ["devices", I.devices, "Устройства", "Где ты вошёл, вход по QR"], ["privacy", I.lock, "Конфиденциальность", "Кто видит и кто пишет, пароль"],
               ["notify", I.bell, "Уведомления и звуки", ""], ["look", I.sun, "Оформление", "Тема и размер текста"], ["folders", I.folder, "Папки с чатами", ""]]
              .map(([k, i, t, s]) => `<button class="set-i" data-s="${k}">${i}<div><span>${t}</span>${s ? `<small>${s}</small>` : ""}</div></button>`).join("")}
          </div>
          <div class="set-l"><button class="set-i" data-prof>${I.user}<div><span>Мой профиль</span><small>Как тебя видят другие</small></div></button>
            <button class="set-i danger" data-out>${I.logout}<div><span>Выйти</span></div></button></div>
          <p class="set-f">Needle 2 · мессенджер без номера телефона</p>`;
        $$("[data-s]", b).forEach(x => x.onclick = () => this[x.dataset.s]());
        $("[data-prof]", b).onclick = () => Profile.open(ME.id);
        $("[data-out]", b).onclick = () => signOut();
      });
    },
    account() {
      L.push("Мой аккаунт", b => {
        b.innerHTML = `<div class="pad"><label class="acc-av">${av(ME, "xxl")}<span class="av-btn">${I.camera}</span><input type="file" accept="image/*" hidden></label>
          ${field("n", "Имя", 'maxlength="40"', ME.name || "")}${areaField("bio", "О себе", 'maxlength="160" rows="2"', ME.bio || "")}
          <p class="hint">Пара слов о себе, до 160 символов.</p>
          <div class="at-f">${field("u", "Юзернейм", 'maxlength="20" autocomplete="off" autocapitalize="off" spellcheck="false"', ME.username)}</div>
          <p class="hint">По нему тебя найдут: ${esc(SITE.replace(/^https?:\/\//, ""))}<i data-uh>${esc(ME.username)}</i></p>
          ${field("d", "День рождения", `type="date" min="1900-01-01" max="${new Date(Date.now() - 5 * 365.25 * 864e5).toISOString().slice(0, 10)}"`, ME.birth || "")}
          <div class="err"></div><button class="btn wide" data-save>Сохранить</button>
          <button class="lnk" data-cov>${ME.cover ? "Изменить обложку профиля" : "Добавить обложку профиля"}</button><input type="file" accept="image/*" hidden data-covf></div>`;
        const fi = $(".acc-av input", b); fi.onchange = async () => { const f = fi.files[0]; fi.value = ""; if (!f) return; try { await setAvatar(f); $(".acc-av .av", b).outerHTML = av(ME, "xxl"); } catch (e) { toast(errText(e)); } };
        $("[name=u]", b).oninput = e => { $("[data-uh]", b).textContent = e.target.value.replace(/^@/, "").toLowerCase(); };
        const cf = $("[data-covf]", b); $("[data-cov]", b).onclick = () => cf.click();
        cf.onchange = async () => { const f = cf.files[0]; cf.value = ""; if (!f) return; try { toast("Загружаю обложку…"); const im = await makeImage(f, 1500); const path = await upload("nova", im.blob, im.ext, im.type); await rpc("nv_set_cover", { p_path: path }); ME.cover = path; toast("Обложка обновлена"); } catch (x) { toast(errText(x)); } };
        $("[data-save]", b).onclick = async e => {
          const btn = e.currentTarget, n = $("[name=n]", b).value.trim(), t = $("[name=bio]", b).value.trim(), u = $("[name=u]", b).value.trim().replace(/^@/, "").toLowerCase(), d = $("[name=d]", b).value || null;
          btn.disabled = true; $(".err", b).textContent = "";
          try {
            if (!/^[a-z0-9_]{3,20}$/.test(u)) throw new Error("bad username");
            await rpc("nv_set_profile", { p_name: n, p_username: u, p_birth: d });
            if (t !== (ME.bio || "")) await rpc("sn_update_bio", { p_bio: t });
            Object.assign(ME, { name: n, username: u, birth: d, bio: t }); Drawer.draw(); toast("Сохранено"); L.pop(); L.pop(); this.open();
          } catch (x) { $(".err", b).textContent = errText(x); btn.disabled = false; }
        };
      });
    },
    // устройства: как «Активные сеансы» в Telegram
    devices() {
      L.push("Устройства", b => {
        const draw = async () => {
          b.innerHTML = `<div class="set-l"><button class="set-i strong" data-scan>${I.qr}<div><span>Подключить устройство</span><small>Отсканируй QR-код на экране входа</small></div></button></div><div class="devs"><div class="spin"></div></div>`;
          $("[data-scan]", b).onclick = () => scanQr();
          try {
            const list = await rpc("nv_dev_list"); const cur = list.find(d => d.current), rest = list.filter(d => !d.current);
            const ic = n => /iPhone|Android|iPad/.test(n) ? I.phone : I.laptop;
            const row = d => `<div class="dev" data-d="${d.id}"><span class="dev-ic">${ic(d.name)}</span><div><b>${esc(d.name || "Устройство")}</b><small>${d.current ? "это устройство" : d.trusted ? "был(о) в сети " + fmtTime(d.last_seen) : "ждёт код для входа"}</small></div></div>`;
            $(".devs", b).innerHTML = `<div class="sec">Это устройство</div>${cur ? row(cur) : ""}
              ${rest.length ? `<div class="set-l"><button class="set-i danger" data-all>${I.block}<div><span>Завершить все другие сеансы</span></div></button></div><div class="sec">Другие устройства</div>${rest.map(row).join("")}<p class="hint pad-x">Нажми на устройство, чтобы отключить его. Чтобы войти с нового устройства, понадобится код из Needle, QR-код или ссылка на почту.</p>` : `<p class="hint pad-x">Других устройств нет.</p>`}`;
            $$(".dev[data-d]", b).forEach(x => { const d = rest.find(y => y.id === +x.dataset.d); if (!d) return; x.classList.add("click"); x.onclick = async () => { if (!(await confirmBox("Отключить устройство", `«${d.name}» выйдет из аккаунта.`, "Отключить"))) return; try { await rpc("nv_dev_remove", { p_id: d.id }); draw(); } catch (e) { toast(errText(e)); } }; });
            const all = $("[data-all]", b); if (all) all.onclick = async () => { if (!(await confirmBox("Завершить другие сеансы", "Все устройства, кроме этого, выйдут из аккаунта.", "Завершить"))) return; try { await rpc("nv_dev_remove", { p_id: null }); draw(); } catch (e) { toast(errText(e)); } };
          } catch (e) { $(".devs", b).innerHTML = `<p class="hint pad-x">${esc(errText(e))}</p>`; }
        };
        draw();
      });
    },
    privacy() {
      L.push("Конфиденциальность", b => {
        const seg = (k, v) => `<div class="radios">${[["all", "Все"], ["nobody", "Никто"]].map(([x, t]) => `<label class="radio"><input type="radio" name="${k}" value="${x}" ${v === x ? "checked" : ""}><i></i><span>${t}</span></label>`).join("")}</div>`;
        b.innerHTML = `<div class="sec">Кто видит, когда я в сети</div>${seg("seen", PREFS.priv_seen)}<div class="sec">Кто может написать мне первым</div>${seg("dm", PREFS.priv_dm)}
          <div class="sec">Безопасность</div><div class="set-l">
            <button class="set-i" data-pw>${I.key}<div><span>Сменить пароль</span><small>Им же открывается зашифрованная переписка</small></div></button>
            <button class="set-i" data-e2e>${I.lock}<div><span>Шифрование личных сообщений</span><small>${E2E.locked ? "Закрыто на этом устройстве, нажми чтобы открыть" : E2E.backed ? "Ключ сохранён под твоим паролем" : "Ключ только на этом устройстве"}</small></div></button>
            <button class="set-i" data-dev>${I.devices}<div><span>Устройства</span><small>Новые входы подтверждаются кодом</small></div></button></div>
          <div class="sec">Заблокированные · ${PREFS.blocked.length}</div>
          ${PREFS.blocked.length ? PREFS.blocked.map(u => `<div class="row sm">${av(u, "sm")}<div class="rc"><div class="r1"><span class="rn">${uname(u)}</span></div><div class="r2"><span class="rp">@${esc(u.username)}</span></div></div><button class="lnk" data-unb="${u.id}">Разблокировать</button></div>`).join("") : `<p class="hint pad-x">Заблокировать можно в профиле человека.</p>`}`;
        $$("input[type=radio]", b).forEach(x => x.onchange = async () => { const seen = x.name === "seen"; try { await rpc("nv_prefs_set", seen ? { p_seen: x.value } : { p_dm: x.value }); PREFS[seen ? "priv_seen" : "priv_dm"] = x.value; toast("Сохранено"); } catch (e) { toast(errText(e)); } });
        $("[data-pw]", b).onclick = () => changePw();
        $("[data-e2e]", b).onclick = () => keyPrompt(true);
        $("[data-dev]", b).onclick = () => this.devices();
        $$("[data-unb]", b).forEach(x => x.onclick = async () => { try { await rpc("nv_block", { p_user: x.dataset.unb, p_on: false }); PREFS.blocked = PREFS.blocked.filter(u => u.id !== x.dataset.unb); x.closest(".row").remove(); } catch (e) { toast(errText(e)); } });
      });
    },
    notify() {
      L.push("Уведомления и звуки", b => {
        b.innerHTML = `<div class="set-l"><label class="opt">Звук новых сообщений${sw(CFG.sound, 'data-k="sound"')}</label><label class="opt">Показывать текст в списке чатов${sw(CFG.preview, 'data-k="preview"')}</label></div>
          <p class="hint pad-x">Отдельный чат можно заглушить: правый клик или долгое нажатие на чат → «Без звука».</p>`;
        $$("[data-k]", b).forEach(x => x.parentElement.onclick = e => { e.preventDefault(); CFG[x.dataset.k] = !CFG[x.dataset.k]; x.classList.toggle("on", CFG[x.dataset.k]); saveCfg(); Chats.draw(); });
      });
    },
    look() {
      L.push("Оформление", b => {
        b.innerHTML = `<div class="sec">Тема</div><div class="radios">${[["system", "Как в системе"], ["light", "Светлая"], ["dark", "Тёмная"]].map(([k, t]) => `<label class="radio"><input type="radio" name="th" value="${k}" ${CFG.theme === k ? "checked" : ""}><i></i><span>${t}</span></label>`).join("")}</div>
          <div class="sec">Размер текста</div><div class="pad"><div class="range"><span>A</span><input type="range" min="13" max="20" step="1" value="${CFG.size}"><span class="big">A</span></div>
          <div class="demo"><div class="m in first last"><div class="bb"><div class="tx">Привет! Так будут выглядеть сообщения.<i class="msp" style="width:42px"></i><span class="meta">12:00</span></div></div></div><div class="m out first last"><div class="bb"><div class="tx">Выглядит отлично 👍<i class="msp" style="width:62px"></i><span class="meta">12:01<span class="tk rd">${I.check2}</span></span></div></div></div></div></div>
          <div class="set-l"><label class="opt">Отправлять по Enter<small>Иначе по Ctrl+Enter</small>${sw(CFG.enter, "data-en")}</label></div>`;
        $$("[name=th]", b).forEach(x => x.onchange = () => { CFG.theme = x.value; saveCfg(); });
        $("input[type=range]", b).oninput = e => { CFG.size = +e.target.value; saveCfg(); };
        $("[data-en]", b).parentElement.onclick = e => { e.preventDefault(); CFG.enter = !CFG.enter; $("[data-en]", b).classList.toggle("on", CFG.enter); saveCfg(); };
      });
    },
    folders() {
      L.push("Папки с чатами", b => {
        const draw = () => {
          b.innerHTML = `<div class="fold-ic">${I.folder}</div><p class="hint pad-x center">Разложи чаты по папкам: они появятся вкладками над списком чатов.</p>
            <div class="sec">Мои папки</div><div class="set-l">${PREFS.folders.map((f, i) => `<button class="set-i" data-f="${i}">${I.folder}<div><span>${esc(f.n)}</span><small>${(f.c || []).length} ${plural((f.c || []).length, "чат", "чата", "чатов")}</small></div></button>`).join("")}
            ${PREFS.folders.length < 10 ? `<button class="set-i strong" data-new>${I.plus}<div><span>Создать папку</span></div></button>` : ""}</div>
            <p class="hint pad-x">Чат в папку добавляется правым кликом или долгим нажатием на чат. Нажми на папку, чтобы изменить её.</p>`;
          $$("[data-f]", b).forEach(x => x.onclick = e => { const i = +x.dataset.f; const r = x.getBoundingClientRect(); ctxMenu(r.right - 220, r.bottom, [{ i: I.pen, t: "Переименовать", f: () => Folders.rename(i).then(draw) }, { i: I.trash, t: "Удалить", danger: true, f: () => Folders.remove(i).then(draw) }]); });
          const n = $("[data-new]", b); if (n) n.onclick = () => Folders.create().then(draw);
        };
        draw();
      });
    },
  };
  const changePw = () => popup({ title: "Сменить пароль", html: `<div class="pop-f">${field("p", "Новый пароль", 'type="password" maxlength="72" autocomplete="new-password"')}<p class="hint">Минимум 8 символов, латинские буквы и цифры.</p><div class="err"></div></div>`,
    buttons: [{ t: "Отмена" }, { t: "Сохранить", main: true, click: async card => {
      const p = $("[name=p]", card).value, er = $(".err", card);
      if (p.length < 8 || !/[a-z]/i.test(p) || !/\d/.test(p)) { er.textContent = "Минимум 8 символов, латинские буквы и цифры"; return false; }
      const { error } = await sb.auth.updateUser({ password: p }); if (error) { er.textContent = errText(error); return false; }
      try { await E2E.rewrap(p); } catch (e) { console.warn("e2e", e); }
      toast("Пароль изменён");
    } }] });

  // ================= запуск =================
  let goName = null, qrParam = null;
  try {
    const sp = new URLSearchParams(location.search);
    const g = sp.get("go"); if (g && /^\+?[A-Za-z0-9_]{3,40}$/.test(g)) sessionStorage.setItem("needle-go", g);
    const q = sp.get("qr"); if (q) sessionStorage.setItem("needle-qr", q);
  } catch {}
  async function boot() {
    Auth.stop();
    if (!sb) { $("#root").innerHTML = `<div class="boot-err">Не загрузилась библиотека. Обнови страницу.</div>`; return; }
    session = (await sb.auth.getSession()).data.session;
    if (/[?&]reset=1/.test(location.search) && session) return Auth.reset();
    if (!session) return Auth.start(/error_description=([^&]+)/.test(location.hash + location.search) ? "Ссылка устарела, войди заново" : "");
    // устройство: доверенное или нужен код
    let hello = null;
    try { hello = await rpc("nv_dev_hello", { p_name: devName() }); }
    catch (e) {
      const m = (e && (e.message || e.code)) || "";
      if (/nv_dev_hello|PGRST202|does not exist|Could not find/.test(m + (e.code || ""))) hello = { trusted: true };   // база ещё без устройств
      else if (/not signed in|JWT|jwt/.test(m)) { await sb.auth.signOut({ scope: "local" }).catch(() => {}); return Auth.start("Войди заново"); }
      else { $("#root").innerHTML = `<div class="boot-err">Нет связи с сервером. Обнови страницу чуть позже.</div>`; return; }
    }
    if (!hello.trusted) return Auth.code(hello);
    const { data, error } = await sb.from("profiles").select("id,num,username,name,birth,bio,avatar,verified,is_admin,banned,pubkey,created_at").eq("id", session.user.id).maybeSingle();
    if (error || !data) { if (error && /fetch|network/i.test(error.message || "")) { $("#root").innerHTML = `<div class="boot-err">Нет связи с сервером. Обнови страницу чуть позже.</div>`; return; } await sb.auth.signOut({ scope: "local" }); return Auth.start("Профиль не найден, войди заново"); }
    ME = data;
    try { const p = await rpc("nv_profile", { p_user: ME.id }); if (p) ME.cover = p.cover || null; } catch {}
    if (Auth.newName) { try { await rpc("nv_set_profile", { p_name: Auth.newName, p_username: ME.username, p_birth: null }); ME.name = Auth.newName; } catch {} Auth.newName = null; }
    if (location.search || location.hash) history.replaceState(null, "", SITE);
    await E2E.init(ME.id, PW); PW = null;
    App.mount();
    setTimeout(() => { if (!$(".pop-wrap")) keyPrompt(E2E.locked); }, 1200);
    setTimeout(cleanFiles, 5000);
    try { const g = sessionStorage.getItem("needle-go"); if (g) { sessionStorage.removeItem("needle-go"); setTimeout(() => goLink(g), 500); } } catch {}
    try { const q = sessionStorage.getItem("needle-qr"); if (q) { sessionStorage.removeItem("needle-qr"); setTimeout(() => approveQr(q), 600); } } catch {}
    if (ME.banned) toast("Аккаунт заблокирован: писать нельзя");
  }
  if (sb) sb.auth.onAuthStateChange(ev => { if (ev === "PASSWORD_RECOVERY") Auth.reset(); if (ev === "SIGNED_OUT" && ME) location.replace(SITE); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !$(".pop-wrap") && !menuEl) { if ($(".drawer-wrap.on")) return Drawer.close(); if (Side.on) return Side.close(); if (L.top()) return L.pop(); if (R.kind && !isPhone()) return R.close(); }
  });
  boot();
})();
