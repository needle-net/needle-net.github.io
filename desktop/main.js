// Needle для Windows: отдельное окно с сайтом needle-net.github.io.
// Безопасность: никакого Node.js внутри страницы, изоляция и песочница,
// открываются только сайт Needle и Supabase, всё остальное уходит в обычный браузер.
const { app, BrowserWindow, Menu, Tray, shell, session, nativeImage, Notification, dialog } = require("electron");
const path = require("path"), fs = require("fs");

// если что-то сломалось при запуске: пишем в журнал и показываем окно с ошибкой, а не молчим
function logErr(e) {
  const t = new Date().toISOString() + " " + (e && e.stack || e) + "\n";
  try { fs.appendFileSync(path.join(app.getPath("userData"), "needle-log.txt"), t); } catch {}
  try { dialog.showErrorBox("Needle", "Программа не смогла запуститься.\n\n" + String(e && e.message || e) + "\n\nЖурнал: " + path.join(app.getPath("userData"), "needle-log.txt")); } catch {}
}
process.on("uncaughtException", logErr);
process.on("unhandledRejection", logErr);

const HOME = "https://needle-net.github.io/";
const SITE_HOST = "needle-net.github.io";
// кроме самого сайта странице нужны: база, шрифты и две библиотеки с jsDelivr (их проверяет SRI в index.html)
const NET_OK = [/^https:\/\/needle-net\.github\.io\//, /^https:\/\/[a-z0-9]+\.supabase\.co\//, /^wss:\/\/[a-z0-9]+\.supabase\.co\//,
  /^https:\/\/cdn\.jsdelivr\.net\/npm\//, /^https:\/\/fonts\.googleapis\.com\//, /^https:\/\/fonts\.gstatic\.com\//];
const ICON = path.join(__dirname, "icon.png");

let win = null, tray = null, quitting = false, unread = 0;

if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => showWin());
app.setAppUserModelId("io.github.needle-net.desktop");

function showWin() { if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); }

function isSite(u) { try { const x = new URL(u); return x.protocol === "https:" && x.host === SITE_HOST; } catch { return false; } }

function createWin() {
  win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 380, minHeight: 560, show: true, backgroundColor: "#1b1c1e",
    title: "Needle", icon: ICON, autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: true,
      allowRunningInsecureContent: false, webviewTag: false, navigateOnDragDrop: false, devTools: !app.isPackaged },
  });
  Menu.setApplicationMenu(null);
  win.loadURL(HOME).catch(() => {});
  // нет интернета или сайт не открылся: своя страница с кнопкой «Повторить»
  win.webContents.on("did-fail-load", (e, code, desc, url, main) => {
    if (!main || code === -3) return;
    const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh;display:grid;place-items:center;background:#1b1c1e;color:#e8e8e8;font:15px system-ui,sans-serif;text-align:center"><div><h2 style="font-weight:500">Не получилось открыть Needle</h2><p style="color:#9a9a9a">Проверь интернет. Ошибка: ${String(desc).replace(/[<>&]/g, "")}</p><a href="${HOME}" style="display:inline-block;margin-top:8px;padding:10px 22px;border-radius:10px;background:#e8e8e8;color:#1b1c1e;text-decoration:none">Повторить</a></div>`;
    win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html)).catch(() => {});
  });
  win.webContents.on("render-process-gone", (e, d) => logErr(new Error("страница упала: " + d.reason)));

  // ссылки на другие сайты открываем в обычном браузере, а не в программе
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url) && !isSite(url)) shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!isSite(url)) { e.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); } });
  win.webContents.on("will-redirect", (e, url) => { if (!isSite(url)) e.preventDefault(); });
  win.webContents.on("will-attach-webview", e => e.preventDefault());

  // непрочитанные: сайт пишет число в заголовок «(3) Needle» — мигаем в панели задач и показываем в трее
  win.on("page-title-updated", (e, t) => {
    const n = +((t.match(/^\((\d+)\)/) || [])[1] || 0);
    if (n > unread && !win.isFocused()) {
      win.flashFrame(true);
      if (Notification.isSupported()) { const no = new Notification({ title: "Needle", body: n === 1 ? "Новое сообщение" : `Непрочитанных: ${n}`, icon: ICON, silent: true }); no.on("click", showWin); no.show(); }
    }
    unread = n; if (tray) tray.setToolTip(n ? `Needle: ${n} непрочит.` : "Needle");
  });
  win.on("focus", () => win.flashFrame(false));
  // крестик прячет в трей, как в Telegram; выйти — через меню в трее
  win.on("close", e => { if (!quitting) { e.preventDefault(); win.hide(); } });
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 }));
  tray.setToolTip("Needle");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Открыть Needle", click: showWin },
    { label: "Запускать вместе с Windows", type: "checkbox", checked: app.getLoginItemSettings().openAtLogin, click: m => app.setLoginItemSettings({ openAtLogin: m.checked }) },
    { type: "separator" },
    { label: "Выйти", click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on("click", showWin);
}

app.whenReady().then(() => {
  const ses = session.defaultSession;
  // разрешения: только уведомления, звук/видео (запись голосовых, QR-сканер) и копирование; остальное запрещено
  const allow = new Set(["notifications", "media", "clipboard-sanitized-write", "fullscreen"]);
  ses.setPermissionRequestHandler((wc, perm, cb, d) => cb(allow.has(perm) && isSite(d.requestingUrl || wc.getURL())));
  ses.setPermissionCheckHandler((wc, perm, origin) => allow.has(perm) && isSite(origin + "/"));
  // сеть: только нужные адреса (на случай, если в страницу что-то подсунут)
  ses.webRequest.onBeforeRequest((d, cb) => cb({ cancel: !(NET_OK.some(r => r.test(d.url)) || d.url.startsWith("devtools:") || d.url.startsWith("data:") || d.url.startsWith("blob:")) }));
  // загрузки файлов из чатов: спрашивать, куда сохранить
  ses.on("will-download", (e, item) => item.setSaveDialogOptions({ title: "Сохранить файл" }));
  createWin();
  try { createTray(); } catch (e) { logErr(e); quitting = true; }
}).catch(logErr);
app.on("before-quit", () => { quitting = true; });
app.on("window-all-closed", () => {});
app.on("web-contents-created", (e, wc) => { wc.on("will-attach-webview", ev => ev.preventDefault()); });
