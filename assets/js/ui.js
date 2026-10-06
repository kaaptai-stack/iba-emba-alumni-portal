/* Shared helpers for the member app and the admin panel. */
(function () {
  const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a2 2 0 003.4 0"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    wa: '<path d="M3.5 20.5l1.2-4.3A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4.2-1.1z"/><path d="M9 8.5c0 3 2.5 6 6 6.5l1-1.5-2-1-1 .8c-1-.5-2-1.5-2.4-2.5l.8-1-1-2z"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 005 5L15 12l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 10v7"/>',
    facebook: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M15 8h-1.5A1.5 1.5 0 0012 9.5V21M9.5 13H15"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14a6.5 6.5 0 013.5 6"/>',
    drop: '<path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 01-13 0C5.5 10 12 3 12 3z"/>',
    invite: '<rect x="3" y="5" width="15" height="13" rx="2"/><path d="M3 7l7.5 5L18 7M19 3v6M16 6h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 00-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
    out: '<path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 2h6l1-2h5"/>',
    megaphone: '<path d="M3 10v4h4l8 5V5L7 10z"/><path d="M19 9a4 4 0 010 6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    telegram: '<path d="M21 4L3 11l6 2.5M21 4l-3 16-9-6.5M21 4L9 13.5V19l3-3.5"/>',
    messenger: '<path d="M12 3C7 3 3 6.7 3 11.4c0 2.6 1.2 4.9 3.2 6.4V21l2.9-1.6c.9.3 1.9.4 2.9.4 5 0 9-3.7 9-8.4S17 3 12 3z"/><path d="M7.5 13.5l3-3.2 2.2 2 3.8-2.8-3 3.3-2.2-2z"/>',
    viber: '<path d="M12 3c-5 0-8 1.5-8 7.5 0 3.5 1 5.5 3 6.5V21l3-2.5c6.5.5 10-1 10-8C20 4.5 17 3 12 3z"/><path d="M9.5 8.5c0 2.5 2 5 4.5 5.5l.8-1.2-1.5-.8-.8.6c-.8-.4-1.5-1.1-1.8-1.9l.6-.8-.8-1.5z"/>',
    signal: '<path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.5-1.2A9 9 0 1012 3z"/>',
    discord: '<path d="M7 6.5c3-1 7-1 10 0 1.8 2.6 2.7 5.6 2.5 9-1.5 1.1-3 1.8-4.5 2.2l-1-1.7M7 6.5C5.2 9.1 4.3 12.1 4.5 15.5 6 16.6 7.5 17.3 9 17.7l1-1.7M7.5 15c3 1.3 6 1.3 9 0"/><circle cx="9.5" cy="12" r=".8"/><circle cx="14.5" cy="12" r=".8"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z"/>',
    groups: '<circle cx="12" cy="8" r="3"/><circle cx="5" cy="10" r="2.2"/><circle cx="19" cy="10" r="2.2"/><path d="M6.5 20a5.5 5.5 0 0111 0M1.5 19a3.6 3.6 0 015.5-3M22.5 19a3.6 3.6 0 00-5.5-3"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 6.1A10 10 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3.2 3.9M6.6 6.6A16.5 16.5 0 002 12s3.5 6 10 6a9.6 9.6 0 004.4-1.1M9.9 9.9a3 3 0 004.2 4.2"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  };
  const BRAND = { whatsapp: ['wa', '#25D366'], facebook: ['facebook', '#1877F2'], messenger: ['messenger', '#0084FF'], telegram: ['telegram', '#229ED9'], linkedin: ['linkedin', '#0A66C2'], viber: ['viber', '#7360F2'], signal: ['signal', '#3A76F0'], discord: ['discord', '#5865F2'], website: ['globe', '#34428A'] };
  /** Round, brand-coloured icon for a group's platform. */
  const brand = (platform, size) => { const [ic, col] = BRAND[platform] || BRAND.website; return `<span class="brand ${size || ''}" style="background:${col}" aria-hidden="true">${icon(ic)}</span>`; };
  const icon = (n, cls) => `<svg class="ico ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = (name) => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const hue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return 'c' + (Math.abs(h) % 6 + 1); };
  const avatar = (m, size) => `<span class="av ${size || ''} ${hue(m.name || m.id)}">${m.photo ? `<img src="${m.photo}" alt="">` : esc(initials(m.name || m.email))}</span>`;

  const taka = (n) => '৳' + Number(n).toLocaleString('en-IN');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = (iso) => { if (!iso) return '--'; const d = new Date(iso); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const fmtDateTime = (iso) => `${fmtDate(iso)}, ${fmtTime(iso)}`;
  const ago = (iso) => {
    const s = (Date.now() - new Date(iso)) / 1000;
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    if (s < 172800) return 'yesterday'; return fmtDate(iso);
  };
  const waLink = (num, text) => `https://wa.me/${String(num).replace(/\D/g, '')}${text ? '?text=' + encodeURIComponent(text) : ''}`;
  const telLink = (num) => 'tel:' + String(num).replace(/[^\d+]/g, '');
  const liLink = (u) => 'https://' + String(u).replace(/^https?:\/\//, '');

  function toast(msg, err) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), 3600);
  }
  function download(name, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  /** Square-crop and compress a photo to a small JPEG data URL. */
  function compressPhoto(file, size) {
    size = size || 320;
    return new Promise((res, rej) => {
      const img = new Image(); const r = new FileReader();
      r.onload = () => { img.src = r.result; }; r.onerror = rej;
      img.onload = () => {
        const s = Math.min(img.width, img.height); const c = document.createElement('canvas'); c.width = c.height = size;
        c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        res(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = rej; r.readAsDataURL(file);
    });
  }
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const split = (l) => l.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
    const head = split(lines[0]).map((h) => h.toLowerCase());
    if (!head.includes('email')) return lines.map((l) => ({ email: split(l)[0] }));
    return lines.slice(1).map((l) => { const v = split(l); const o = {}; head.forEach((h, i) => { o[h] = v[i]; }); return o; });
  }

  window.UI = { brand, icon, esc, initials, avatar, taka, fmtDate, fmtTime, fmtDateTime, ago, waLink, telLink, liLink, toast, download, compressPhoto, parseCSV };
})();
