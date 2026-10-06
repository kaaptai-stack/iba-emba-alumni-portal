/* IBA Executive Alumni Forum — member app (mobile-first SPA, hash routing). */
(function () {
  const { brand, icon, esc, avatar, taka, fmtDate, fmtDateTime, ago, waLink, telLink, liLink, toast, download } = UI;
  const app = document.getElementById('app');
  const $ = (s, el) => (el || app).querySelector(s);
  const $$ = (s, el) => Array.from((el || app).querySelectorAll(s));
  const first = (name) => String(name || '').split(' ')[0];
  const short = (ind) => API.INDUSTRY_SHORT[ind] || ind;
  let cleanup = [];
  const onLeave = (fn) => cleanup.push(fn);

  // ---------- routing ----------
  function parse() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    return { path: path || '', q: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  const go = (h) => { location.hash = h; };
  const PUBLIC = /^(splash|signin|i\/|verify\/|create\/|demo\/)/;

  const routes = [
    [/^signin$/, signin], [/^i\/(\w+)$/, verify], [/^verify\/(\w+)$/, verify], [/^create\/(\w+)$/, createAccount],
    [/^demo\/email\/(\w+)$/, demoEmail], [/^demo\/whatsapp\/(\w+)$/, demoWhatsApp],
    [/^setup\/([123])$/, setup], [/^fee$/, fee], [/^pay$/, pay], [/^paid$/, paid],
    [/^directory$/, directory], [/^browse\/(batch|industry)$/, browse], [/^m\/([\w-]+)\/message$/, compose], [/^m\/([\w-]+)$/, profile],
    [/^blood$/, blood], [/^blood\/new$/, bloodNew], [/^blood\/r\/([\w-]+)$/, bloodReq],
    [/^groups$/, groups], [/^invite$/, invite], [/^me$/, me], [/^me\/privacy$/, privacy], [/^me\/preview$/, preview], [/^me\/settings$/, notifSettings], [/^notifications$/, notifications],
  ];

  function render() {
    cleanup.forEach((f) => f()); cleanup = [];
    document.querySelectorAll('.sheet, .sheet-bg').forEach((n) => n.remove());
    const { path, q } = parse();
    const m = API.me();
    if (!PUBLIC.test(path)) {
      if (!m) return go('#/signin');
      if (!m.enabled) { API.signOut(); toast('Your account has been turned off by the alumni committee.', true); return go('#/signin'); }
      if (!m.paid && !/^(setup|fee|pay|paid)/.test(path)) return go(m.setupDone ? '#/fee' : '#/setup/1');
    }
    if (!path) return go(m ? (m.paid ? '#/directory' : '#/fee') : '#/signin');
    for (const [re, fn] of routes) {
      const mt = path.match(re);
      if (mt) { fn(...mt.slice(1).concat([q])); window.scrollTo(0, 0); return; }
    }
    go('#/directory');
  }
  window.addEventListener('hashchange', render);
  window.addEventListener('portal:sync', () => { const { path } = parse(); if (/^(pay|blood\/r|notifications|directory)/.test(path)) render(); });

  // ---------- layout pieces ----------
  function tabbar(active) {
    const t = (h, ic, label, key) => `<a href="#/${h}" class="${active === key ? 'on' : ''}">${icon(ic)}<span>${label}</span></a>`;
    return `<nav class="tabbar">${t('directory', 'users', 'Directory', 'dir')}${t('blood', 'drop', 'Blood', 'blood')}${t('groups', 'groups', 'Groups', 'groups')}${t('invite', 'invite', 'Invite', 'invite')}${t('me', 'user', 'Me', 'me')}</nav>`;
  }
  const backBtn = (href) => `<a class="iconbtn back" href="${href}" aria-label="Back">${icon('back')}</a>`;
  function screen(html, opts) {
    opts = opts || {};
    app.innerHTML = `<main class="screen ${opts.tab ? 'tabbed' : ''}">${html}</main>${opts.tab ? tabbar(opts.tab) : ''}`;
  }
  function bell() {
    const unread = API.notifications().some((n) => !n.read);
    return `<a class="iconbtn" href="#/notifications" aria-label="Notifications">${icon('bell')}${unread ? '<span class="dot"></span>' : ''}</a>`;
  }
  function sheet(html) {
    const bg = document.createElement('div'); bg.className = 'sheet-bg';
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog');
    sh.innerHTML = '<div class="grab"></div>' + html;
    const close = () => { bg.remove(); sh.remove(); };
    bg.onclick = close; document.body.append(bg, sh);
    return { el: sh, close };
  }
  function contactPills(p, opts) {
    opts = opts || {};
    const greet = `Assalamu alaikum ${first(p.name)}, I found you on the IBA Executive Alumni Forum.`;
    let h = `<a class="pill" href="#/m/${p.id}/message">${icon('mail')}Email</a>`;
    if (p.whatsapp) h += `<a class="pill wa" href="${waLink(p.whatsapp, greet)}" target="_blank" rel="noopener">${icon('wa')}WhatsApp</a>`;
    if (p.phone) h += `<a class="pill" href="${telLink(p.phone)}">${icon('phone')}Call</a>`;
    if (opts.linkedin && p.linkedin) h += `<a class="pill" href="${liLink(p.linkedin)}" target="_blank" rel="noopener">${icon('linkedin')}LinkedIn</a>`;
    if (!p.whatsapp && !p.phone && !opts.noPrivate) h += `<span class="pill off">${icon('lock')}Number private</span>`;
    return h;
  }
  const memberCard = (p, opts) => `
    <div class="mcard">
      <a href="#/m/${p.id}">${avatar(p)}</a>
      <div class="grow">
        <a href="#/m/${p.id}" style="color:inherit"><div class="name">${esc(p.name)}</div>
        <div class="meta">EMBA ${p.batch} · ${esc(p.designation)}${p.org ? ', ' + esc(p.org) : ''}</div></a>
        <div class="actions">${contactPills(p, opts)}</div>
      </div>
    </div>`;

  // ---------- 1 splash ----------
  function splash(next) {
    app.innerHTML = `<div class="splash">
      <div style="margin-top:auto"></div>
      <div class="logo"><img src="assets/img/logo.png" alt="IBA Executive MBA"></div>
      <h1>IBA Executive<br>Alumni Forum</h1>
      <p>Executive MBA alumni of the Institute of Business Administration, University of Dhaka</p>
      <div class="foot"><div class="loadbar"><i></i></div><div class="small muted">Members only · by invitation</div></div>
    </div>`;
    setTimeout(next, 1500);
  }

  // ---------- sign in ----------
  function signin() {
    if (API.me()) return go('#/directory');
    screen(`
      <div class="auth-head"><img class="logo-sm" src="assets/img/logo.png" alt=""><h1>Sign in</h1><p>IBA Executive Alumni Forum</p></div>
      <form id="f" class="stack" novalidate>
        <label class="field"><span>Email</span><input class="input" name="email" type="email" autocomplete="email" required></label>
        <label class="field"><span>Password</span><input class="input" name="pw" type="password" autocomplete="current-password" required></label>
        <div id="err" class="hint bad"></div>
        <button class="btn block">Sign in</button>
        <button type="button" class="btn link" id="forgot" style="margin:14px auto 0;display:block">Forgot password?</button>
      </form>
      <div class="footer-cta"><p class="cap">New here? Membership is by invitation from an alumnus or the alumni committee. Open the personal link in your invite to join.</p>
      <div class="demo-note" style="margin-top:12px">Demo: sign in as <b>farhana.rahman@gmail.com</b> / <b>demo1234</b>, or open the <a href="#/demo/email/K7F2Q9">invite for Rafiq Ahmed</a> to try joining.</div></div>`);
    $('#f').onsubmit = (e) => {
      e.preventDefault(); const f = e.target;
      try { API.signIn(f.email.value, f.pw.value); go('#/directory'); }
      catch (err) { if (err.code === 'admin') $('#err').innerHTML = `${esc(err.message)} <a href="admin.html">Open admin panel</a>`; else $('#err').textContent = err.message; }
    };
    $('#forgot').onclick = () => { const e = $('#f').email.value; toast(e ? `If ${e} is a member, a reset link is on its way.` : 'Enter your email first.', !e); };
  }

  // ---------- 2 joining (external email / WhatsApp previews for the demo) ----------
  function demoEmail(code) {
    const inv = API.invite(code); if (!inv) return go('#/signin');
    const by = inv.inviter;
    app.innerHTML = `<main class="screen" style="background:#fff">
      <div class="topbar"><a class="iconbtn back" href="#/signin">${icon('back')}</a><h2>Inbox</h2></div>
      <div class="banner blue">Demo: this is the email the invitee receives in Gmail, Yahoo or any mail app.</div>
      <h2 style="font-size:19px;margin:8px 0 6px">${by ? esc(by.name) + ' invited you to the' : 'You\'re invited to the'} IBA Executive Alumni Forum</h2>
      <div class="small muted" style="margin-bottom:16px"><b style="color:var(--ink)">IBA Executive Alumni Forum</b><br>to ${esc(inv.email)} · ${UI.fmtTime(inv.createdAt)}</div>
      <div class="card" style="padding:22px;text-align:center">
        ${by ? avatar(by, 'lg') : '<img src="assets/img/logo.png" style="width:64px;border-radius:50%">'}
        <p style="margin:14px 0">${by ? `${esc(by.name)} (EMBA ${by.batch}) has invited you` : 'The IBA EMBA Alumni Forum has invited you'} to join the private members portal for IBA Executive MBA alumni.</p>
        ${inv.note ? `<p class="note" style="font-style:italic">“${esc(inv.note)}”</p>` : ''}
        <a class="btn block" style="margin:16px 0 10px" href="#/i/${inv.code}">Join the portal</a>
        <div class="small muted">This link works only for ${esc(inv.email)} and expires on ${fmtDate(inv.expiresAt)}.</div>
      </div>
      <p class="cap">You received this because an alumnus invited you. Not an IBA EMBA alumnus? Ignore this email.</p>
      <a class="btn ghost block" href="#/demo/whatsapp/${inv.code}" style="margin-top:12px">${icon('wa')}See the WhatsApp version</a>
    </main>`;
  }
  function demoWhatsApp(code) {
    const inv = API.invite(code); if (!inv) return go('#/signin');
    const by = inv.inviter || { name: 'IBA EMBA Alumni Forum', id: 'x' };
    const link = `${location.origin}${location.pathname}#/i/${inv.code}`;
    app.innerHTML = `<main class="screen" style="background:#ECE5DD;padding-top:0">
      <div class="topbar" style="background:#075E54;color:#fff;margin:0 -16px;padding:6px 12px"><a class="iconbtn back" style="color:#fff" href="#/demo/email/${code}">${icon('back')}</a>${avatar(by, 'sm')}<div class="grow"><b>${esc(by.name)}</b><div class="small" style="opacity:.8">online</div></div></div>
      <div class="center small" style="margin:14px 0"><span style="background:#fff;padding:3px 10px;border-radius:8px">Today</span></div>
      <div style="background:#fff;border-radius:10px;padding:8px 10px;max-width:85%;margin-left:auto;background:#DCF8C6">${esc(first(inv.name) || 'Hi')}${inv.name ? ' bhai' : ''}, sending you the alumni forum invite<div class="small muted" style="text-align:right">9:10 AM</div></div>
      <div style="border-radius:10px;padding:8px;max-width:85%;margin:8px 0 0 auto;background:#DCF8C6">
        <div style="background:#fff;border-radius:8px;padding:10px;display:flex;gap:10px;align-items:center"><img src="assets/img/logo.png" style="width:40px;border-radius:6px"><div><b>IBA Executive Alumni Forum</b><div class="small">You're invited to join<br>ibaexecutivemba.com</div></div></div>
        <p style="margin:8px 0">Hello! I’ve invited you to the IBA Executive Alumni Forum. Join here:<br><a href="#/i/${inv.code}" style="word-break:break-all">${esc(link)}</a></p>
        <div class="small">Link works for ${esc(inv.email)} and expires on ${fmtDate(inv.expiresAt).replace(/ \d{4}$/, '')}.</div>
        <div class="small muted" style="text-align:right">9:12 AM ✓✓</div>
      </div>
      <div class="banner blue" style="margin-top:auto">Demo: the same personal link shared from WhatsApp. Tap it to open the portal.</div>
    </main>`;
  }

  function verify(code) {
    const inv = API.invite(code);
    if (!inv) return screen(`<div class="auth-head"><h1>Invite not found</h1><p>Check the link in your invitation, or ask the person who invited you to send a new one.</p></div><a class="btn block" href="#/signin">Go to sign in</a>`);
    if (inv.status === 'joined') return screen(`<div class="auth-head"><h1>Already joined</h1><p>This invitation has been used. Sign in with ${esc(inv.email)}.</p></div><a class="btn block" href="#/signin">Sign in</a>`);
    if (inv.expired) return screen(`<div class="auth-head"><h1>Invite expired</h1><p>This link expired on ${fmtDate(inv.expiresAt)}. Ask ${inv.inviter ? esc(inv.inviter.name) : 'the alumni committee'} to send a new one.</p></div>`);
    if (inv.verified) return go('#/create/' + code);
    let otp = API.sendCode(code);
    screen(`
      <div class="topbar"><h2>Confirm your email</h2></div>
      <p class="sub" style="margin-top:0">We sent a 6-digit code to the email your invite was sent to.</p>
      <form id="f" class="stack">
        <label class="field"><span>Email</span><input class="input" value="${esc(inv.email)}" readonly style="background:var(--tint)"></label>
        <label class="field"><span>Enter code</span><input class="input otp" name="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" autofocus></label>
        <div id="err" class="hint bad"></div>
        <div class="center small muted" id="resend"></div>
        <div class="demo-note" id="demo">Demo: no email is sent from this prototype. Your code is <b>${otp}</b>.</div>
        <div class="footer-cta"><button class="btn block">Verify email</button></div>
      </form>
      ${inv.inviter ? `<div class="inviter">${avatar(inv.inviter, 'sm')} Invited by ${esc(inv.inviter.name)} · EMBA ${inv.inviter.batch}</div>` : ''}
      <p class="cap">The link is tied to the invited email, so a forwarded link cannot be used by someone else.</p>`);
    let left = 60;
    const tick = () => {
      const r = $('#resend'); if (!r) return;
      if (left > 0) { r.textContent = `Resend code in 0:${String(left).padStart(2, '0')}`; left--; }
      else { r.innerHTML = '<button type="button" class="btn link">Resend code</button>'; r.firstChild.onclick = () => { otp = API.sendCode(code); $('#demo').innerHTML = `Demo: new code is <b>${otp}</b>.`; left = 60; toast('A new code is on its way.'); }; }
    };
    tick(); const t = setInterval(tick, 1000); onLeave(() => clearInterval(t));
    $('#f').onsubmit = (e) => { e.preventDefault(); try { API.verifyCode(code, e.target.otp.value); go('#/create/' + code); } catch (err) { $('#err').textContent = err.message; } };
  }

  function createAccount(code) {
    const inv = API.invite(code); if (!inv || !inv.verified) return go('#/i/' + code);
    screen(`
      <div class="topbar"><h2>${inv.name ? 'Welcome, ' + esc(first(inv.name)) : 'Welcome'}</h2></div>
      <p class="sub" style="margin-top:0">Email confirmed. Create a password to sign in next time.</p>
      <form id="f" class="stack" novalidate>
        <label class="field"><span>Email</span><input class="input" value="${esc(inv.email)}" readonly style="background:var(--tint)"></label>
        <label class="field"><span>Password</span><input class="input" name="pw" type="password" autocomplete="new-password"><div class="strength" id="str"><i></i><i></i><i></i></div><div class="hint" id="strt">At least 8 characters with a number.</div></label>
        <label class="field"><span>Confirm password</span><input class="input" name="pw2" type="password" autocomplete="new-password"></label>
        <label class="check"><input type="checkbox" name="agree"> <span>I agree to the <a href="#" id="rules">community rules and privacy policy</a>, and will not use member details for bulk marketing.</span></label>
        <div id="err" class="hint bad"></div>
        <div class="footer-cta"><button class="btn block" id="go" disabled>Create account</button></div>
      </form>`);
    const f = $('#f');
    const check = () => {
      const p = f.pw.value; const s = (p.length >= 8) + /\d/.test(p) + (/[A-Z]/.test(p) || /[^\w]/.test(p) || p.length >= 12);
      $('#str').className = 'strength s' + (p ? Math.max(1, s) : 0);
      $('#strt').textContent = !p ? 'At least 8 characters with a number.' : s >= 3 ? 'Strong. At least 8 characters with a number.' : p.length < 8 || !/\d/.test(p) ? 'Use at least 8 characters with a number.' : 'Good.';
      $('#strt').className = 'hint ' + (s >= 2 && p.length >= 8 && /\d/.test(p) ? 'ok' : '');
      $('#go').disabled = !(p.length >= 8 && /\d/.test(p) && p === f.pw2.value && f.agree.checked);
    };
    f.oninput = check; f.onchange = check;
    $('#rules').onclick = (e) => { e.preventDefault(); sheet(`<h3 style="font-size:17px">Community rules</h3><ol style="padding-left:18px;color:var(--ink-2)"><li>The portal is for IBA Executive MBA alumni only. Do not share your account.</li><li>Contact details are shared for personal, professional networking. Never use them for bulk marketing, sales lists or spam.</li><li>Blood requests must be genuine and urgent.</li><li>Be respectful. Reported profiles are reviewed by the alumni committee.</li></ol><h3>Privacy</h3><p style="color:var(--ink-2)">You choose which contact details members see. Hidden details are never sent to other members. You can pause your listing, download your data or delete your account at any time from the Me tab.</p>`); };
    f.onsubmit = (e) => {
      e.preventDefault();
      if (f.pw.value !== f.pw2.value) return ($('#err').textContent = 'Passwords do not match.');
      try { API.createAccount(code, f.pw.value); go('#/setup/1'); } catch (err) { $('#err').textContent = err.message; }
    };
  }

  // ---------- 3 profile set-up (also used for Edit profile) ----------
  function setup(step, q) {
    step = +step; const edit = q.edit === '1'; const m = API.me();
    const next = () => { if (step < 3) go(`#/setup/${step + 1}${edit ? '?edit=1' : ''}`); else if (edit) { toast('Profile saved'); go('#/me'); } else { API.updateMe({ setupDone: true }); go(m.paid ? '#/directory' : '#/fee'); } };
    const head = `<div class="topbar">${edit ? backBtn(step === 1 ? '#/me' : `#/setup/${step - 1}?edit=1`) : step > 1 ? backBtn(`#/setup/${step - 1}`) : ''}<h2>${edit ? 'Edit profile' : 'Set up your profile'}</h2>${edit ? '' : '<button class="btn link" id="skip">Skip</button>'}</div>
      <div class="progress"><i class="on"></i><i class="${step >= 2 ? 'on' : ''}"></i><i class="${step >= 3 ? 'on' : ''}"></i></div>`;
    const cta = (label) => `<div class="footer-cta"><button class="btn block" id="save">${label}</button></div>`;

    if (step === 1) {
      const years = []; for (let y = 2026; y >= 1985; y--) years.push(y);
      const batches = []; for (let b = 45; b >= 1; b--) batches.push(b);
      screen(`${head}<p class="sub">Step 1 of 3 · Basics</p>
        <div class="photo-pick"><label for="ph" id="phl">${m.photo ? `<img src="${m.photo}" alt="">` : 'Add photo'}</label><input id="ph" type="file" accept="image/*" hidden><div class="hint center">A clear face photo helps batchmates recognise you</div></div>
        <div class="stack" style="margin-top:12px">
          <label class="field"><span>Full name</span><input class="input" id="name" value="${esc(m.name)}" autocomplete="name"></label>
          <label class="field"><span>EMBA batch</span><select class="select" id="batch">${batches.map((b) => `<option value="${b}" ${m.batch === b ? 'selected' : ''}>EMBA ${b}</option>`).join('')}</select></label>
          <label class="field"><span>Graduation year</span><select class="select" id="grad">${years.map((y) => `<option ${m.gradYear === y ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
          <label class="field"><span>Country</span><select class="select" id="country">${API.COUNTRIES.map((c) => `<option ${(m.country || 'Bangladesh') === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
          <label class="field"><span>City</span><span id="citybox"></span></label>
        </div>${cta(edit ? 'Save and continue' : 'Continue')}`);
      let photo = m.photo;
      $('#ph').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { photo = await UI.compressPhoto(f); $('#phl').innerHTML = `<img src="${photo}" alt="">`; } catch (err) { toast('Could not read that image.', true); } };
      // Bangladesh: pick a city; abroad: type it
      const cityField = (country, val) => {
        $('#citybox').innerHTML = country === 'Bangladesh'
          ? `<select class="select" id="city">${API.CITIES.map((c) => `<option ${val === c ? 'selected' : ''}>${c}</option>`).join('')}</select>`
          : `<input class="input" id="city" value="${esc(API.CITIES.includes(val) ? '' : val || '')}" placeholder="e.g. Toronto" autocomplete="address-level2">`;
      };
      cityField(m.country || 'Bangladesh', m.city);
      $('#country').onchange = (e) => cityField(e.target.value, '');
      $('#save').onclick = () => {
        const name = $('#name').value.trim(); if (!name) return toast('Add your full name.', true);
        API.updateMe({ photo, name, batch: +$('#batch').value, gradYear: +$('#grad').value, country: $('#country').value, city: $('#city').value.trim() }); next();
      };
    }
    if (step === 2) {
      let func = m.func; let exp = m.expertise.slice();
      screen(`${head}<p class="sub">Step 2 of 3 · Work</p>
        <div class="stack">
          <label class="field"><span>Current designation</span><input class="input" id="des" value="${esc(m.designation)}" placeholder="e.g. Head of Corporate Sales"></label>
          <label class="field"><span>Organisation</span><input class="input" id="org" value="${esc(m.org)}" placeholder="e.g. Karnaphuli Telecom Ltd"></label>
          <label class="field"><span>Industry</span><select class="select" id="ind"><option value="">Choose industry</option>${API.INDUSTRIES.map((i) => `<option ${m.industry === i ? 'selected' : ''}>${i}</option>`).join('')}</select></label>
          <div class="field"><span>Functional area</span><div class="chips" id="func">${API.FUNCTIONS.map((f) => `<button type="button" class="chip ${func === f ? 'on' : ''}" data-v="${f}">${f}</button>`).join('')}</div></div>
          <div class="field"><span>Expertise (up to 8)</span><div class="tag-input" id="exp"></div></div>
          <label class="field"><span>Short bio (optional)</span><textarea class="textarea" id="bio" maxlength="300" placeholder="What you do, in a line or two">${esc(m.bio)}</textarea></label>
          <div class="field"><span>Interests (optional)</span><div class="tag-input" id="intr"></div></div>
        </div>${cta(edit ? 'Save and continue' : 'Continue')}`);
      $$('#func .chip').forEach((b) => { b.onclick = () => { func = b.dataset.v; $$('#func .chip').forEach((x) => x.classList.toggle('on', x === b)); }; });
      const expBox = tagInput($('#exp'), exp, 8, 'Add...');
      const intBox = tagInput($('#intr'), m.interests.slice(), 8, 'Travel, Golf...');
      $('#save').onclick = () => {
        API.updateMe({ designation: $('#des').value.trim(), org: $('#org').value.trim(), industry: $('#ind').value, func, expertise: expBox(), bio: $('#bio').value.trim(), interests: intBox() }); next();
      };
    }
    if (step === 3) {
      const v = Object.assign({}, m.visible); let blood = m.blood;
      const row = (key, label, val, ph, type) => `<label class="field"><span>${label}</span><div class="priv-row"><input class="input" id="v-${key}" value="${esc(val)}" placeholder="${ph}" type="${type || 'text'}" ${key === 'email' ? 'readonly style="background:var(--tint)"' : ''}><label class="switch" title="Show to members"><input type="checkbox" data-k="${key}" ${v[key] ? 'checked' : ''}><i></i></label><span class="state" id="s-${key}">${v[key] ? 'Shown' : 'Hidden'}</span></div></label>`;
      screen(`${head}<p class="sub">Step 3 of 3 · Contact and privacy. You choose what other members see.</p>
        <div class="stack">
          ${row('whatsapp', 'WhatsApp number', m.whatsapp, '+880 1711-234567', 'tel')}
          <div class="field"><span>Phone for calls</span><div class="priv-row"><select class="select" id="same" style="flex:1"><option value="1" ${m.phoneSameAsWhatsapp ? 'selected' : ''}>Same as WhatsApp</option><option value="0" ${!m.phoneSameAsWhatsapp ? 'selected' : ''}>A different number</option></select><label class="switch"><input type="checkbox" data-k="phone" ${v.phone ? 'checked' : ''}><i></i></label><span class="state" id="s-phone">${v.phone ? 'Shown' : 'Hidden'}</span></div>
            <input class="input" id="v-phone" type="tel" placeholder="+880 1..." value="${esc(m.phoneSameAsWhatsapp ? '' : m.phone)}" style="margin-top:8px;${m.phoneSameAsWhatsapp ? 'display:none' : ''}"></div>
          ${row('email', 'Email', m.email, '')}
          ${row('linkedin', 'LinkedIn', m.linkedin, 'linkedin.com/in/...')}
          ${row('facebook', 'Facebook', m.facebook, 'facebook.com/...')}
          <div class="field"><span>Blood group</span><div class="bloodgrid blue" id="bg">${API.BLOOD.map((b) => `<button type="button" class="${blood === b ? 'on' : ''}">${b}</button>`).join('')}</div></div>
          <label class="check" style="align-items:center"><span class="grow" style="color:var(--ink);font-size:14px">List me as a blood donor<br><span class="small muted">Members searching your group can find and contact you.</span></span><span class="switch"><input type="checkbox" id="donor" ${m.donor ? 'checked' : ''}><i></i></span></label>
        </div>${cta(edit ? 'Save' : 'Finish and enter')}`);
      $$('[data-k]').forEach((c) => { c.onchange = () => { v[c.dataset.k] = c.checked; $('#s-' + c.dataset.k).textContent = c.checked ? 'Shown' : 'Hidden'; }; });
      $('#same').onchange = (e) => { $('#v-phone').style.display = e.target.value === '1' ? 'none' : ''; };
      $$('#bg button').forEach((b) => { b.onclick = () => { blood = blood === b.textContent ? '' : b.textContent; $$('#bg button').forEach((x) => x.classList.toggle('on', x.textContent === blood)); }; });
      $('#save').onclick = () => {
        const same = $('#same').value === '1'; const wa = $('#v-whatsapp').value.trim();
        if (wa && !/^\+?[\d\s-]{8,}$/.test(wa)) return toast('Check the WhatsApp number.', true);
        if ($('#donor').checked && !blood) return toast('Pick your blood group to list as a donor.', true);
        API.updateMe({ whatsapp: wa, phoneSameAsWhatsapp: same, phone: same ? wa : $('#v-phone').value.trim(), linkedin: $('#v-linkedin').value.trim(), facebook: $('#v-facebook').value.trim(), visible: v, blood, donor: $('#donor').checked });
        next();
      };
    }
    const sk = $('#skip'); if (sk) sk.onclick = next;
  }
  function tagInput(box, values, max, ph) {
    const draw = () => {
      box.innerHTML = values.map((t, i) => `<span class="chip on">${esc(t)}<button type="button" class="x" data-i="${i}" style="background:none;border:0;color:#fff;padding:0" aria-label="Remove">×</button></span>`).join('') + (values.length < max ? `<input placeholder="${ph}" aria-label="Add">` : '');
      $$('.x', box).forEach((b) => { b.onclick = () => { values.splice(+b.dataset.i, 1); draw(); }; });
      const inp = $('input', box);
      if (inp) {
        const add = () => { const t = inp.value.trim().replace(/,$/, ''); if (t && !values.includes(t)) { values.push(t); draw(); $('input', box) && $('input', box).focus(); } else inp.value = ''; };
        inp.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } else if (e.key === 'Backspace' && !inp.value && values.length) { values.pop(); draw(); $('input', box).focus(); } };
        inp.onblur = () => { if (inp.value.trim()) add(); };
      }
    };
    draw(); return () => values;
  }

  // ---------- 4 registration fee ----------
  function fee() {
    const m = API.me(); if (m.paid) return go('#/directory');
    screen(`<div class="topbar">${backBtn('#/setup/3')}<h2>Registration fee</h2></div>
      <div class="progress" style="margin-top:0"><i class="on"></i><i class="on"></i><i class="on"></i></div>
      <p class="small muted" style="margin:0 0 12px">Profile saved. One last step to unlock the portal.</p>
      <div class="fee-card"><div class="muted">One-time payment</div><div class="amt">${taka(API.settings.fee)}</div><b>Registration fee</b></div>
      <ul class="ticks"><li>${icon('check')}Search and browse all members</li><li>${icon('check')}Email, WhatsApp and call alumni</li><li>${icon('check')}Blood finder and urgent requests</li></ul>
      <div class="small" style="font-weight:500;color:var(--ink-2);margin-bottom:6px">Pay with</div>
      <div class="payopt"><span class="qrb">QR</span><span>Bangla QR · any bank or MFS app</span><span class="radio"></span></div>
      <div class="footer-cta"><a class="btn block" href="#/pay">Pay ${taka(API.settings.fee)}</a><p class="cap">A receipt is emailed to ${esc(m.email)}</p>
      <button class="btn link" id="out" style="display:block;margin:6px auto 0;font-size:13px">Sign out</button></div>`);
    $('#out').onclick = () => { API.signOut(); go('#/signin'); };
  }
  function pay() {
    const m = API.me(); if (m.paid) return go('#/paid');
    const p = API.startPayment();
    screen(`<div class="topbar">${backBtn('#/fee')}<h2>Scan to pay</h2></div>
      <div class="center"><div class="small muted">Amount</div><div style="font-family:var(--serif);font-size:30px;font-weight:700">${taka(p.amount)}.00</div><div class="small muted">IBA Executive Alumni Forum · Ref ${p.ref}</div></div>
      <div class="qrbox"><div id="qr"></div><img class="qrlogo" src="assets/img/icon-192.png" alt=""></div>
      <div class="center" style="color:var(--crimson);font-weight:600;font-size:13px">Bangla QR</div>
      <div class="steps"><ol><li>Open any bank or MFS app with Bangla QR</li><li>Scan this code and confirm ${taka(p.amount)}</li><li>This screen updates by itself once paid</li></ol></div>
      <div class="row"><button class="btn ghost grow" id="save">${icon('download')}Save QR</button><span class="btn ghost grow" style="cursor:default">${icon('clock')}<span id="exp">Expires 10:00</span></span></div>
      <div class="center small muted" style="margin-top:12px"><span class="spinner"></span> &nbsp;Waiting for payment...</div>
      <div class="demo-note" style="margin-top:14px">Demo: no payment gateway is connected. <button class="btn link" id="sim" style="font-size:12.5px">Simulate a successful payment</button></div>
      <p class="cap">Paying on the same phone: Save QR, then use your app's scan-from-gallery option.</p>`);
    const el = $('#qr');
    if (window.QRCode) new QRCode(el, { text: p.payload, width: 512, height: 512, colorDark: '#B42329', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
    else el.innerHTML = '<div class="center muted" style="padding:80px 0">QR library could not load. Check your connection.</div>';
    $('#save').onclick = () => { const c = $('canvas', el); if (!c) return; c.toBlob((b) => download(`IBA-EMBA-${p.ref}.png`, b)); };
    $('#sim').onclick = () => { API.confirmPayment(m.id, 'Bangla QR'); };
    const t = setInterval(() => {
      const me = API.me(); if (me && me.paid) { clearInterval(t); go('#/paid'); return; }
      const s = Math.max(0, Math.round((p.expires - Date.now()) / 1000)); const e = $('#exp');
      if (e) e.textContent = s ? `Expires ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : 'Expired · tap back';
    }, 1000);
    onLeave(() => clearInterval(t));
  }
  function receiptHTML(m) {
    return `<!doctype html><meta charset="utf-8"><title>Receipt ${m.txn}</title><body style="font-family:Arial,sans-serif;max-width:520px;margin:40px auto;color:#161B2E">
<h2 style="color:#34428A">IBA Executive Alumni Forum</h2><p>Payment receipt</p><table style="width:100%;border-collapse:collapse">
${[['Member', m.name], ['Email', m.email], ['Amount paid', '৳' + API.settings.fee + '.00'], ['Payment for', 'Registration fee'], ['Paid via', m.payVia], ['Transaction ID', m.txn], ['Date', fmtDateTime(m.paidOn)]].map(([a, b]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #E3E6EC;color:#7B8196">${a}</td><td style="text-align:right;border-bottom:1px solid #E3E6EC"><b>${esc(b)}</b></td></tr>`).join('')}
</table><p style="color:#7B8196;font-size:12px">Institute of Business Administration, University of Dhaka · Executive MBA alumni</p></body>`;
  }
  function paid() {
    const m = API.me(); if (!m.paid) return go('#/fee');
    screen(`<div class="success-ico">${icon('check')}</div>
      <h1 class="center" style="font-size:26px">Payment successful</h1>
      <p class="center muted" style="margin:6px 0 18px">Welcome to the IBA Executive Alumni Forum, ${esc(first(m.name))}.</p>
      <div class="receipt"><div><span>Amount paid</span><b>${taka(API.settings.fee)}.00</b></div><div><span>Payment for</span><b>Registration fee</b></div><div><span>Paid via</span><b>${esc(m.payVia)}</b></div><div><span>Transaction ID</span><b>${esc(m.txn)}</b></div><div><span>Date</span><b>${fmtDateTime(m.paidOn)}</b></div></div>
      <p class="cap">Receipt sent to ${esc(m.email)}</p>
      <div class="footer-cta stack"><button class="btn ghost block" id="dl">${icon('download')}Download receipt</button><a class="btn block" href="#/directory">Go to directory</a></div>`);
    $('#dl').onclick = () => download(`receipt-${m.txn}.html`, receiptHTML(m), 'text/html');
  }

  // ---------- 5 directory ----------
  const BATCH_RANGES = [['All', null], ['36–40', [36, 40]], ['41–45', [41, 45]], ['31–35', [31, 35]], ['Up to 30', [1, 30]]];
  function readFilters(q) {
    return {
      q: q.q || '', batches: q.b ? q.b.split('-').map(Number) : null, industries: q.i ? q.i.split('|') : [],
      cities: q.c ? q.c.split('|') : [], reach: q.r ? q.r.split('|') : [], sort: q.s || (q.q ? 'relevance' : 'name'), isNew: q.n === '1',
    };
  }
  function writeFilters(f) {
    const p = new URLSearchParams();
    if (f.q) p.set('q', f.q); if (f.batches) p.set('b', f.batches.join('-')); if (f.industries.length) p.set('i', f.industries.join('|'));
    if (f.cities.length) p.set('c', f.cities.join('|')); if (f.reach.length) p.set('r', f.reach.join('|')); if (f.sort && f.sort !== 'name' && f.sort !== 'relevance') p.set('s', f.sort); if (f.isNew) p.set('n', '1');
    const s = p.toString(); return '#/directory' + (s ? '?' + s : '');
  }
  const batchLabel = (b) => b[0] === b[1] ? `EMBA ${b[0]}` : b[0] === 1 ? `Batch up to ${b[1]}` : `Batch ${b[0]}–${b[1]}`;
  function directory(q) {
    const m = API.me(); const f = readFilters(q); const st = API.stats();
    const active = !!(f.q || f.batches || f.industries.length || f.cities.length || f.reach.length || f.isNew);
    const results = API.search(f);
    const chips = [];
    if (f.batches) chips.push(['b', batchLabel(f.batches)]);
    f.industries.forEach((i) => chips.push(['i:' + i, short(i)]));
    f.cities.forEach((c) => chips.push(['c:' + c, c]));
    f.reach.forEach((r) => chips.push(['r:' + r, r]));
    if (f.isNew) chips.push(['n', 'New this month']);
    screen(`<div class="topbar"><h1>Directory</h1>${bell()}</div>
      ${m.approval === 'pending' ? '<div class="banner">Your membership is awaiting approval by the alumni committee. You can browse now; you will appear in the directory once approved.</div>' : ''}
      ${m.paused ? '<div class="banner blue">Your listing is paused. Other members cannot find you. <a href="#/me">Change</a></div>' : ''}
      <form class="search" id="sf" role="search">${icon('search')}<input class="input" id="q" type="search" placeholder="Search name, company, role" value="${esc(f.q)}" autocomplete="off" aria-label="Search members">${f.q ? `<button type="button" class="iconbtn clear" id="clr" aria-label="Clear">${icon('x')}</button>` : ''}</form>
      ${active ? `<div class="chips" style="margin-top:10px">${chips.map(([k, l]) => `<button class="fchip" data-rm="${esc(k)}">${esc(l)} ×</button>`).join('')}</div>
        <div class="row between count"><span>${results.length.toLocaleString('en-IN')} member${results.length === 1 ? '' : 's'}</span>
        <label class="row small" style="gap:4px">Sort: <select id="sort" style="border:0;background:none;color:var(--ink-2)"><option value="relevance" ${f.sort === 'relevance' ? 'selected' : ''}>${f.q ? 'Best match' : 'Name'}</option><option value="recent" ${f.sort === 'recent' ? 'selected' : ''}>Recently joined</option><option value="batch" ${f.sort === 'batch' ? 'selected' : ''}>Batch</option></select></label></div>`
      : `<div class="quick"><a href="#/browse/batch"><b>By batch</b><span>${Object.keys(st.batches).length} batches</span></a><a href="#/browse/industry"><b>By industry</b><span>${Object.keys(st.industries).length} industries</span></a><a href="${writeFilters(Object.assign(readFilters({}), { isNew: true, sort: 'recent' }))}"><b>New</b><span>${st.newThisMonth} this month</span></a></div>
        <div class="hscroll"><button class="pill" id="fbtn">${icon('filter')}Filters</button><a class="pill" href="${writeFilters(Object.assign(readFilters({}), { batches: [m.batch, m.batch] }))}">My batch</a><a class="pill" href="#/directory?c=Dhaka">Dhaka</a><a class="pill" href="#/directory?c=Abroad">Abroad</a><a class="pill" href="#/directory?c=Chattogram">Chattogram</a></div>
        <div class="count">${st.total.toLocaleString('en-IN')} members</div>`}
      ${active ? `<div class="hscroll" style="margin-bottom:8px"><button class="pill" id="fbtn">${icon('filter')}Filters</button><a class="pill" href="#/directory">Clear all</a></div>` : ''}
      <div id="list"></div><div class="sentinel" id="more"></div>`, { tab: 'dir' });

    let shown = 0; const list = $('#list');
    const more = () => {
      if (shown >= results.length) { $('#more').innerHTML = results.length ? '' : ''; return; }
      list.insertAdjacentHTML('beforeend', results.slice(shown, shown + 20).map((p) => memberCard(p)).join(''));
      shown += 20;
      $('#more').innerHTML = shown < results.length ? '<span class="spinner"></span>' : '';
    };
    if (!results.length) list.innerHTML = `<div class="empty">No members match${f.q ? ` “${esc(f.q)}”` : ''}.<br><a href="#/directory">Clear search and filters</a></div>`;
    more();
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) more(); }, { rootMargin: '300px' }); io.observe($('#more')); onLeave(() => io.disconnect());

    let deb; $('#q').oninput = (e) => { clearTimeout(deb); deb = setTimeout(() => { const v = e.target.value; history.replaceState(null, '', writeFilters(Object.assign(f, { q: v.trim(), sort: v.trim() ? 'relevance' : 'name' }))); render(); const i = $('#q'); i.focus(); i.setSelectionRange(v.length, v.length); }, 250); };
    $('#sf').onsubmit = (e) => { e.preventDefault(); $('#q').blur(); };
    if ($('#clr')) $('#clr').onclick = () => go(writeFilters(Object.assign(f, { q: '' })));
    if ($('#sort')) $('#sort').onchange = (e) => go(writeFilters(Object.assign(f, { sort: e.target.value })));
    $$('[data-rm]').forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.rm; const [t, v] = [k.split(':')[0], k.slice(2)];
        if (t === 'b') f.batches = null; if (t === 'n') f.isNew = false;
        if (t === 'i') f.industries = f.industries.filter((x) => x !== v); if (t === 'c') f.cities = f.cities.filter((x) => x !== v); if (t === 'r') f.reach = f.reach.filter((x) => x !== v);
        go(writeFilters(f));
      };
    });
    $('#fbtn').onclick = () => filterSheet(f);
  }
  function filterSheet(f0) {
    const f = JSON.parse(JSON.stringify(f0)); let showAll = false;
    const counts = API.stats().industries;
    const s = sheet('<div id="fs"></div>');
    const draw = () => {
      const n = API.search(f).length;
      const inds = API.INDUSTRIES.slice().sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
      $('#fs', s.el).innerHTML = `
        <div class="row between"><h3 style="font-size:17px;margin:0;font-family:var(--serif)">Filters</h3><button class="btn link" id="ca">Clear all</button></div>
        <h3>EMBA batch</h3><div class="chips">${BATCH_RANGES.map(([l, r]) => `<button class="chip ${JSON.stringify(f.batches) === JSON.stringify(r) ? 'on' : ''}" data-b='${JSON.stringify(r)}'>${l}</button>`).join('')}
          <select class="chip" id="pick" style="padding-right:8px"><option value="">Pick batch</option>${Array.from({ length: 45 }, (_, i) => 45 - i).map((b) => `<option ${f.batches && f.batches[0] === b && f.batches[1] === b ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
        <h3>Industry</h3>${(showAll ? inds : inds.slice(0, 5)).map((i) => `<label class="chk"><input type="checkbox" data-i="${esc(i)}" ${f.industries.includes(i) ? 'checked' : ''}>${esc(i)}<span class="n">${counts[i] || 0}</span></label>`).join('')}
        ${showAll ? '' : `<button class="btn link small" id="sa">Show all ${inds.length}</button>`}
        <h3>City</h3><div class="chips">${['Dhaka', 'Chattogram', 'Abroad', 'More'].map((c) => `<button class="chip ${f.cities.includes(c) ? 'on' : ''}" data-c="${c}">${c}</button>`).join('')}</div>
        <h3>Reachable on</h3><div class="chips">${['WhatsApp', 'Phone'].map((c) => `<button class="chip ${f.reach.includes(c) ? 'on' : ''}" data-r="${c}">${c}</button>`).join('')}</div>
        <div class="sticky"><button class="btn block" id="apply" ${n ? '' : 'disabled'}>Show ${n.toLocaleString('en-IN')} member${n === 1 ? '' : 's'}</button></div>`;
      const tog = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : arr.concat(v));
      $$('[data-b]', s.el).forEach((b) => { b.onclick = () => { f.batches = JSON.parse(b.dataset.b); draw(); }; });
      $('#pick', s.el).onchange = (e) => { const v = +e.target.value; f.batches = v ? [v, v] : null; draw(); };
      $$('[data-i]', s.el).forEach((b) => { b.onchange = () => { f.industries = tog(f.industries, b.dataset.i); draw(); }; });
      $$('[data-c]', s.el).forEach((b) => { b.onclick = () => { f.cities = tog(f.cities, b.dataset.c); draw(); }; });
      $$('[data-r]', s.el).forEach((b) => { b.onclick = () => { f.reach = tog(f.reach, b.dataset.r); draw(); }; });
      if ($('#sa', s.el)) $('#sa', s.el).onclick = () => { showAll = true; draw(); };
      $('#ca', s.el).onclick = () => { Object.assign(f, { batches: null, industries: [], cities: [], reach: [], isNew: false }); draw(); };
      $('#apply', s.el).onclick = () => { s.close(); go(writeFilters(f)); };
    };
    draw();
  }
  function browse(kind) {
    const st = API.stats();
    const rows = kind === 'batch'
      ? Object.entries(st.batches).sort((a, b) => b[0] - a[0]).map(([b, n]) => [`EMBA ${b}`, n, `#/directory?b=${b}-${b}&s=name`])
      : Object.entries(st.industries).sort((a, b) => b[1] - a[1]).map(([i, n]) => [i, n, `#/directory?i=${encodeURIComponent(i)}`]);
    screen(`<div class="topbar">${backBtn('#/directory')}<h2>By ${kind}</h2></div>
      <div class="browse-list">${rows.map(([l, n, h]) => `<a href="${h}">${esc(l)}<span>${n} ${icon('chev')}</span></a>`).join('')}</div>`, { tab: 'dir' });
  }

  // ---------- 6 member profile & portal email ----------
  function profile(id) {
    const p = API.member(id); const me = API.me();
    if (!p) return screen(`<div class="topbar">${backBtn('#/directory')}</div><div class="empty">This member is not available.</div>`, { tab: 'dir' });
    const greet = `Assalamu alaikum ${first(p.name)}, I found you on the IBA Executive Alumni Forum.`;
    const btns = [`<a class="cbtn" href="#/m/${p.id}/message">${icon('mail')}Email</a>`];
    if (p.whatsapp) btns.push(`<a class="cbtn wa" href="${waLink(p.whatsapp, greet)}" target="_blank" rel="noopener">${icon('wa')}WhatsApp</a>`);
    if (p.phone) btns.push(`<a class="cbtn" href="${telLink(p.phone)}">${icon('phone')}Call</a>`);
    if (p.linkedin) btns.push(`<a class="cbtn" href="${liLink(p.linkedin)}" target="_blank" rel="noopener">${icon('linkedin')}LinkedIn</a>`);
    if (p.facebook && btns.length < 4) btns.push(`<a class="cbtn" href="${liLink(p.facebook)}" target="_blank" rel="noopener">${icon('facebook')}Facebook</a>`);
    const privateNums = !p.whatsapp && !p.phone;
    screen(`<div class="topbar">${backBtn('javascript:history.back()')}<span class="grow"></span></div>
      <div class="prof-head">${avatar(p, 'lg')}<h2>${esc(p.name)}</h2><div class="role">${esc(p.designation)}${p.org ? ', ' + esc(p.org) : ''}</div>
        <div class="tags"><span class="tag blue">EMBA ${p.batch}</span>${p.industry ? `<span class="tag">${esc(short(p.industry))}</span>` : ''}<span class="tag">${esc(API.place(p))}</span>${p.blood ? `<span class="tag red">${esc(p.blood)}</span>` : ''}</div></div>
      <div class="contact-grid n${Math.min(btns.length, 4)}">${btns.slice(0, 4).join('')}</div>
      ${privateNums ? `<div class="note">${esc(first(p.name))} keeps phone and WhatsApp private. You can still reach ${esc(first(p.name))} with a portal email.</div>` : ''}
      <div class="section">
        ${p.bio ? `<h4>About</h4><p>${esc(p.bio)}</p>` : ''}
        ${p.expertise.length ? `<h4>Expertise</h4><div class="chips">${p.expertise.map((e) => `<span class="tag">${esc(e)}</span>`).join('')}</div>` : ''}
        ${p.interests.length ? `<h4>Interests</h4><div class="chips">${p.interests.map((e) => `<span class="tag">${esc(e)}</span>`).join('')}</div>` : ''}
        <h4>Details</h4><p class="small">EMBA ${p.batch}${p.gradYear ? ' · graduated ' + p.gradYear : ''} · ${esc(API.place(p))} · member since ${fmtDate(p.registeredOn)}</p>
      </div>
      ${me.id !== p.id ? '<button class="report-link" id="rep">Report profile</button>' : ''}`, { tab: 'dir' });
    if ($('#rep')) $('#rep').onclick = () => {
      const s = sheet(`<h3 style="font-size:17px;font-family:var(--serif)">Report ${esc(p.name)}</h3><p class="small muted">Reports go to the alumni committee. ${esc(first(p.name))} is not told who reported.</p>
        <div class="stack"><select class="select" id="rr"><option>Spam or bulk marketing</option><option>Not an IBA EMBA alumnus</option><option>Wrong or misleading details</option><option>Harassment</option><option>Other</option></select>
        <textarea class="textarea" id="rn" placeholder="Anything the committee should know (optional)"></textarea><button class="btn danger block" id="rs">Send report</button></div>`);
      $('#rs', s.el).onclick = () => { API.report(p.id, $('#rr', s.el).value, $('#rn', s.el).value); s.close(); toast('Thanks. The alumni committee will review this profile.'); };
    };
  }
  function compose(id) {
    const p = API.member(id); const me = API.me(); if (!p) return go('#/directory');
    const left = API.messagesLeft();
    screen(`<div class="topbar">${backBtn('#/m/' + id)}<h2>New message</h2><button class="btn sm" id="send" ${left <= 0 ? 'disabled' : ''}>${icon('send')}Send</button></div>
      <div class="compose">
        <div class="line"><span>To</span>${avatar(p, 'sm')}<b class="grow">${esc(p.name)}</b><span class="tag">${icon('lock')} address private</span></div>
        <div class="line"><span>From</span><span>${esc(me.name)} · EMBA ${me.batch}</span></div>
        <input class="bare" id="sub" placeholder="Subject" maxlength="120" style="border-bottom:1px solid var(--line)">
        <textarea class="bare" id="body">Assalamu alaikum ${esc(first(p.name))},\n\n\n\nThanks,\n${esc(first(me.name))}</textarea>
      </div>
      <p class="small muted" style="margin-top:auto">${esc(first(p.name))} receives this by email. Your name and email are set as reply-to, so ${esc(first(p.name))} can answer you directly.</p>
      <p class="small center" style="color:${left > 3 ? 'var(--ink-3)' : 'var(--crimson)'}">${Math.max(left, 0)} of ${API.settings.msgLimit} messages left today</p>`);
    const b = $('#body'); b.focus(); const pos = b.value.indexOf('\n\n') + 2; b.setSelectionRange(pos, pos);
    $('#send').onclick = () => {
      try { API.sendMessage(p.id, $('#sub').value, $('#body').value); toast(`Sent to ${p.name}`); go('#/m/' + id); } catch (e) { toast(e.message, true); }
    };
  }

  // ---------- 7 blood finder ----------
  function blood(q) {
    const me = API.me(); const group = q.g || me.blood || 'O-'; const city = q.c || (API.CITIES.includes(me.city) ? me.city : 'Dhaka');
    const donors = API.donors({ group, city }); const elig = donors.filter((d) => d.eligible).length;
    const urgent = API.openRequestsFor(me); const mine = API.myRequests();
    const url = (o) => '#/blood?' + new URLSearchParams(Object.assign({ g: group, c: city }, o)).toString();
    screen(`<div class="topbar"><h1>Find blood</h1>${bell()}</div>
      ${urgent.length ? `<a class="urgent" href="#/blood/r/${urgent[0].id}"><span class="grow"><b>${urgent.length} urgent request${urgent.length > 1 ? 's' : ''}</b> near you · ${esc(urgent[0].group)} at ${esc(urgent[0].hospital)}</span>${icon('chev')}</a>` : ''}
      ${mine.filter((r) => r.status === 'open').map((r) => `<a class="urgent" style="background:var(--blue-50);color:var(--blue)" href="#/blood/r/${r.id}"><span class="grow"><b>Your request</b> · ${esc(r.group)} · ${r.offers.length} offer${r.offers.length === 1 ? '' : 's'} so far</span>${icon('chev')}</a>`).join('')}
      <div class="bloodgrid" id="bg">${API.BLOOD.map((b) => `<a href="${url({ g: b })}" class="${b === group ? 'on' : ''}">${b}</a>`).join('')}</div>
      <div class="row" style="margin-top:10px"><select class="select grow" id="city" aria-label="City">${API.CITIES.map((c) => `<option ${c === city ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="count">${donors.length} ${esc(group)} donor${donors.length === 1 ? '' : 's'} in ${esc(city)} · ${elig} eligible</div>
      <div id="dl">${donors.slice(0, 40).map((d) => `<div class="dcard">${avatar(d)}<div class="grow"><div class="row"><a href="#/m/${d.id}" style="color:inherit;font-weight:600">${esc(d.name)}</a><span class="grp">${esc(d.blood)}</span></div>
          <div class="small muted">EMBA ${d.batch} · ${esc(d.city)}</div><div style="margin:5px 0 7px">${d.eligible ? '<span class="tag green">Eligible to donate</span>' : '<span class="tag">Donated recently</span>'}</div>
          <div class="actions row wrap" style="gap:6px">${contactPills(d, { noPrivate: true })}</div></div></div>`).join('') || '<div class="empty">No donors listed for this group here yet. Try another city, or post an urgent request.</div>'}</div>
      <a class="btn danger-ghost block" href="#/blood/new?g=${encodeURIComponent(group)}&c=${encodeURIComponent(city)}" style="margin-top:6px">Post an urgent request</a>
      ${mine.length ? `<div class="group-title">Your past requests</div>${mine.map((r) => `<a class="prow" href="#/blood/r/${r.id}" style="color:inherit"><span class="grow"><b>${esc(r.group)} · ${r.units} unit${r.units > 1 ? 's' : ''} · ${esc(r.hospital)}</b><span>${fmtDate(r.createdAt)}</span></span><span class="tag ${r.status === 'open' ? 'red' : r.status === 'fulfilled' ? 'green' : ''}">${r.status}</span></a>`).join('')}` : ''}`, { tab: 'blood' });
    $('#city').onchange = (e) => go(url({ c: e.target.value }));
  }
  function bloodNew(q) {
    const me = API.me(); let group = q.g || 'O-'; let units = 1;
    const def = new Date(Date.now() + 6 * 3600000); def.setMinutes(0, 0, 0);
    const local = new Date(def.getTime() - def.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    screen(`<div class="topbar">${backBtn('#/blood')}<h2>Urgent blood request</h2></div>
      <div class="stack">
        <div class="field"><span>Blood group needed</span><div class="bloodgrid" id="bg">${API.BLOOD.map((b) => `<button type="button" class="${b === group ? 'on' : ''}">${b}</button>`).join('')}</div></div>
        <div class="row" style="align-items:flex-end"><div class="field grow"><span>Units</span><div class="counter"><button type="button" id="dn">−</button><b id="u">1</b><button type="button" id="up">+</button></div></div>
          <label class="field grow"><span>Needed by</span><input class="input" type="datetime-local" id="by" value="${local}"></label></div>
        <label class="field"><span>Hospital</span><input class="input" id="hosp" placeholder="e.g. Dhaka Medical College Hospital"></label>
        <label class="field"><span>City</span><select class="select" id="city">${API.CITIES.map((c) => `<option ${c === (q.c || me.city) ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="field"><span>Contact number at hospital</span><input class="input" id="ct" type="tel" value="${esc(me.whatsapp)}"></label>
        <div class="alert-red" id="info"></div>
        <button class="btn danger block" id="send">Send request</button>
      </div>`, { tab: 'blood' });
    const info = () => { const n = API.eligibleCount(group, $('#city').value); $('#info').textContent = `${n} eligible ${group} donor${n === 1 ? '' : 's'} in ${$('#city').value} will get an email and an in-app alert. The request closes after ${API.settings.requestHours} hours.`; };
    $$('#bg button').forEach((b) => { b.onclick = () => { group = b.textContent; $$('#bg button').forEach((x) => x.classList.toggle('on', x === b)); info(); }; });
    $('#dn').onclick = () => { units = Math.max(1, units - 1); $('#u').textContent = units; };
    $('#up').onclick = () => { units = Math.min(10, units + 1); $('#u').textContent = units; };
    $('#city').onchange = info; info();
    $('#send').onclick = () => {
      try {
        const r = API.createRequest({ group, units, neededBy: new Date($('#by').value).toISOString(), hospital: $('#hosp').value.trim(), city: $('#city').value, contact: $('#ct').value.trim() });
        r.demo = true; API._save(); toast(`Request sent to ${r.notified} donors`); go('#/blood/r/' + r.id);
      } catch (e) { toast(e.message, true); }
    };
  }
  function bloodReq(id) {
    const r = API.request(id); const me = API.me();
    if (!r) return go('#/blood');
    const mine = r.by === me.id;
    const left = Math.max(0, Math.round((new Date(r.createdAt).getTime() + API.settings.requestHours * 3600000 - Date.now()) / 3600000));
    const head = `<div class="req-card ${r.status !== 'open' ? 'done' : ''}"><div class="row between"><h2>${esc(r.group)} · ${r.units} unit${r.units > 1 ? 's' : ''}</h2><span class="tag ${r.status === 'open' ? 'red' : r.status === 'fulfilled' ? 'green' : ''}">${r.status === 'open' ? 'Open' : r.status === 'fulfilled' ? 'Fulfilled' : 'Closed'}</span></div>
      <div style="color:var(--ink-2);margin-top:4px">${esc(r.hospital)}, ${esc(r.city)} · by ${fmtDateTime(r.neededBy)}</div>
      <div class="small muted" style="margin-top:6px">${r.status === 'open' ? `Sent to ${r.notified} donors · closes automatically in ${left} hours` : r.closedAt ? 'Closed ' + ago(r.closedAt) : 'Closed'}</div></div>`;
    if (mine) {
      screen(`<div class="topbar">${backBtn('#/blood')}<h2>Your request</h2></div>${head}
        <b style="font-size:13px">${r.offers.length} member${r.offers.length === 1 ? '' : 's'} offered to donate</b>
        <div style="margin-top:8px">${r.offers.map((o) => { const p = API.offerer(o.by); return p ? `<div class="dcard">${avatar(p)}<div class="grow"><a href="#/m/${p.id}" style="color:inherit;font-weight:600">${esc(p.name)}</a><div class="small muted">${esc(p.city)} · offered ${ago(o.at)}</div><div class="row wrap" style="gap:6px;margin-top:6px">${contactPills(p, { noPrivate: true })}</div></div></div>` : ''; }).join('') || `<div class="empty">${r.status === 'open' ? '<span class="spinner"></span><br><br>Waiting for donors to respond. You will get an alert when someone offers.' : 'No offers were made.'}</div>`}</div>
        <div class="footer-cta">${r.status === 'open' ? '<button class="btn block" id="done">' + icon('check') + 'Mark as fulfilled</button>' : ''}<p class="cap">Donors follow the hospital's own screening before donating.</p></div>`, { tab: 'blood' });
      if ($('#done')) $('#done').onclick = () => { API.fulfil(r.id); toast('Request closed. Thank you, donors!'); render(); };
      if (r.status === 'open' && r.demo) { // demo: donors respond over the next few seconds
        const timers = [4000, 9000, 15000].slice(r.offers.length).map((ms, i) => setTimeout(() => { if (API.simulateOffer(r.id)) render(); }, ms));
        onLeave(() => timers.forEach(clearTimeout));
      }
    } else {
      const offered = r.offers.some((o) => o.by === me.id); const req = API.offerer(r.by);
      screen(`<div class="topbar">${backBtn('#/blood')}<h2>Urgent request</h2></div>${head}
        ${req ? `<div class="dcard">${avatar(req)}<div class="grow"><b>${esc(req.name)}</b><div class="small muted">EMBA ${req.batch} · requested ${ago(r.createdAt)}</div></div></div>` : ''}
        <div class="prow"><span class="grow"><b>Contact at hospital</b><span>${esc(r.contact)}</span></span><a class="pill" href="${telLink(r.contact)}">${icon('phone')}Call</a></div>
        <div class="footer-cta">${r.status !== 'open' ? '<p class="center muted">This request is closed.</p>' : offered ? `<div class="banner blue center">Thank you. ${req ? esc(first(req.name)) : 'The requester'} has your contact details and will reach out.</div>` : me.blood !== r.group ? `<p class="center muted small">You are listed as ${esc(me.blood || 'no blood group')}; this request needs ${esc(r.group)}.</p>` : '<button class="btn danger block" id="offer">I can donate</button>'}
        <p class="cap">Donors follow the hospital's own screening before donating.</p></div>`, { tab: 'blood' });
      if ($('#offer')) $('#offer').onclick = () => { API.offer(r.id); toast('Thank you. Your contact has been shared with the requester.'); render(); };
    }
  }

  // ---------- groups ----------
  function groups() {
    const L = API.groups(); const label = (p) => (API.PLATFORMS[p] || API.PLATFORMS.website).label;
    screen(`<div class="topbar"><h1>Groups</h1>${bell()}</div>
      <p class="sub">Official alumni groups. Tap one to open it in ${L.some((g) => g.platform === 'whatsapp') ? 'WhatsApp, Facebook or the app it lives in' : 'the app it lives in'}.</p>
      ${L.map((g) => g.url
        ? `<a class="gcard" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(g.name)} in ${label(g.platform)}">${brand(g.platform)}
            <span class="grow"><b>${esc(g.name)}</b>${g.description ? `<span class="desc">${esc(g.description)}</span>` : ''}<span class="plat">${label(g.platform)}</span></span>${icon('external', 'go')}</a>`
        : `<div class="gcard off">${brand(g.platform)}<span class="grow"><b>${esc(g.name)}</b>${g.description ? `<span class="desc">${esc(g.description)}</span>` : ''}<span class="plat">Temporarily unavailable</span></span>${icon('lock', 'go')}</div>`).join('')
        || '<div class="empty">No groups yet. The alumni committee will add them here.</div>'}
      <p class="cap">Groups are run by the alumni committee. Contact details you share in a group follow that app's own privacy rules, not the portal's.</p>`, { tab: 'groups' });
  }

  // ---------- invite ----------
  function invite() {
    const mine = API.myInvites(); const me = API.me();
    const st = (i) => (i.status === 'joined' ? '<span class="tag green">Joined</span>' : new Date(i.expiresAt) < new Date() ? '<span class="tag">Expired</span>' : i.status === 'opened' ? '<span class="tag blue">Opened</span>' : '<span class="tag amber">Sent</span>');
    screen(`<div class="topbar"><h1>Invite</h1>${bell()}</div>
      <p class="sub">Invite an IBA EMBA alumnus. Each invite is a personal link that works only for their email and expires in ${API.settings.inviteDays} days.</p>
      <form id="f" class="stack" novalidate>
        <label class="field"><span>Their email</span><input class="input" name="email" type="email" placeholder="name@gmail.com" required></label>
        <div class="row"><label class="field grow"><span>Name (optional)</span><input class="input" name="name" placeholder="Full name"></label><label class="field" style="width:120px"><span>Batch</span><select class="select" name="batch"><option value="">Unsure</option>${Array.from({ length: 45 }, (_, i) => 45 - i).map((b) => `<option>${b}</option>`).join('')}</select></label></div>
        <label class="field"><span>Personal note (optional)</span><textarea class="textarea" name="note" style="min-height:70px" placeholder="We are all joining here. See you inside!"></textarea></label>
        <div class="field"><span>Send by</span><div class="row"><button type="submit" class="btn grow" data-ch="Email">${icon('mail')}Email</button><button type="submit" class="btn grow" data-ch="WhatsApp" style="background:var(--green)">${icon('wa')}WhatsApp</button></div></div>
        <div id="err" class="hint bad"></div>
      </form>
      ${me.approval === 'pending' ? '' : `<p class="cap">${API.settings.approvalForMemberInvites ? 'People you invite are approved by the alumni committee before they appear in the directory.' : ''}</p>`}
      <div class="group-title">Your invites (${mine.length})</div>
      ${mine.map((i) => `<div class="prow"><span class="grow"><b>${esc(i.name || i.email)}</b><span>${esc(i.email)} · ${i.channel} · ${fmtDate(i.createdAt)}</span></span>${st(i)}${i.status !== 'joined' ? `<button class="iconbtn" data-copy="${i.code}" aria-label="Copy link">${icon('copy')}</button>` : ''}</div>`).join('') || '<p class="small muted">No invites yet.</p>'}`, { tab: 'invite' });
    let ch = 'Email';
    $$('[data-ch]').forEach((b) => { b.onclick = () => { ch = b.dataset.ch; }; });
    $('#f').onsubmit = (e) => {
      e.preventDefault(); const f = e.target;
      try {
        const inv = API.createInvite({ email: f.email.value, name: f.name.value.trim(), note: f.note.value.trim(), channel: ch, batch: +f.batch.value || null });
        const link = `${location.origin}${location.pathname}#/i/${inv.code}`;
        if (ch === 'WhatsApp') window.open(waLink('', `Hello! I’ve invited you to the IBA Executive Alumni Forum. Join here: ${link}\nLink works for ${inv.email} and expires on ${fmtDate(inv.expiresAt)}.`), '_blank');
        else toast(`Invitation emailed to ${inv.email}`);
        invite();
      } catch (err) { $('#err').textContent = err.message; }
    };
    $$('[data-copy]').forEach((b) => { b.onclick = async () => { const link = `${location.origin}${location.pathname}#/i/${b.dataset.copy}`; try { await navigator.clipboard.writeText(link); toast('Invite link copied'); } catch (e) { prompt('Copy this link', link); } }; });
  }

  // ---------- 8 me, privacy, preview ----------
  function me() {
    const m = API.me(); const c = API.completeness(m);
    const next = c.missing.slice(0, 2).join(' and ');
    screen(`<div class="topbar"><h1>Me</h1>${bell()}</div>
      <div class="me-head">${avatar(m, 'lg')}<div><h2 style="font-size:20px">${esc(m.name || m.email)}</h2><div class="small" style="color:var(--ink-2)">EMBA ${m.batch} · ${esc(m.designation || 'Add your designation')}</div>
        ${m.invitedBy && m.invitedBy !== 'admin' && API.offerer(m.invitedBy) ? `<div class="small muted">Invited by ${esc(API.offerer(m.invitedBy).name)}</div>` : ''}</div></div>
      ${c.pct < 100 ? `<div class="meter"><div class="row between"><b>Profile ${c.pct}% complete</b><a href="#/setup/${/bio|interests|expertise|designation|organisation|industry/.test(c.missing[0]) ? 2 : /WhatsApp|LinkedIn|blood/.test(c.missing[0]) ? 3 : 1}?edit=1" class="small" style="font-weight:600">Finish</a></div><div class="bar"><i style="width:${c.pct}%"></i></div><div class="small muted">Add ${esc(next)}</div></div>` : '<div class="meter"><b>Profile complete</b> <span class="small muted">· thanks for keeping it up to date</span></div>'}
      <div class="row" style="margin-top:10px">${m.paid ? `<span class="tag green">${icon('check')} Registration fee paid · ${taka(API.settings.fee)}</span>` : ''}${m.approval === 'pending' ? '<span class="tag amber">Awaiting approval</span>' : ''}</div>
      <div class="menu">
        <a href="#/setup/1?edit=1">${icon('edit')}<span>Edit profile</span>${icon('chev', 'chev')}</a>
        <a href="#/me/privacy">${icon('shield')}<span>Privacy<small>Choose what members can see</small></span>${icon('chev', 'chev')}</a>
        <a href="#/me/preview">${icon('eye')}<span>Preview my profile</span>${icon('chev', 'chev')}</a>
        <a href="#/me/settings">${icon('bell')}<span>Notifications</span>${icon('chev', 'chev')}</a>
        <label class="menu-row" style="display:flex;align-items:center;gap:12px;padding:14px 2px;border-bottom:1px solid var(--line);cursor:pointer">${icon('pause')}<span class="grow">Pause my listing<small>${m.paused ? 'Hidden from the directory and blood finder' : 'You are visible to members'}</small></span><span class="switch"><input type="checkbox" id="pause" ${m.paused ? 'checked' : ''}><i></i></span></label>
        <button id="dl">${icon('download')}<span>Download my data</span></button>
        ${m.paid ? `<button id="rcpt">${icon('card')}<span>Registration receipt</span></button>` : ''}
        <button id="out">${icon('out')}<span>Sign out</span></button>
        <button id="del" class="red">${icon('trash')}<span class="red">Delete account</span></button>
      </div>`, { tab: 'me' });
    $('#pause').onchange = (e) => { API.updateMe({ paused: e.target.checked }); toast(e.target.checked ? 'Listing paused. Members cannot find you.' : 'You are listed again.'); me(); };
    $('#dl').onclick = () => { download(`my-iba-emba-data-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(API.exportMyData(), null, 2), 'application/json'); };
    if ($('#rcpt')) $('#rcpt').onclick = () => download(`receipt-${m.txn}.html`, receiptHTML(m), 'text/html');
    $('#out').onclick = () => { API.signOut(); go('#/signin'); };
    $('#del').onclick = () => {
      const s = sheet(`<h3 style="font-size:17px;font-family:var(--serif)">Delete your account?</h3><p class="small" style="color:var(--ink-2)">Your profile, invites and requests are removed. The registration fee is not refunded. This cannot be undone. Consider pausing your listing instead.</p>
        <label class="field"><span>Type DELETE to confirm</span><input class="input" id="cf"></label><button class="btn danger block" id="go" style="margin-top:12px" disabled>Delete my account</button>`);
      $('#cf', s.el).oninput = (e) => { $('#go', s.el).disabled = e.target.value.trim() !== 'DELETE'; };
      $('#go', s.el).onclick = () => { API.deleteAccount(); s.close(); toast('Your account has been deleted.'); go('#/signin'); };
    };
  }
  function privacy() {
    const m = API.me();
    const sw = (k, label, val, on) => `<div class="prow"><span class="grow"><b>${label}</b><span>${esc(val) || '<i>Not added</i>'}</span></span><label class="switch"><input type="checkbox" data-k="${k}" ${on ? 'checked' : ''} ${val ? '' : 'disabled'}><i></i></label></div>`;
    const lastD = m.lastDonation ? m.lastDonation.slice(0, 10) : '';
    screen(`<div class="topbar">${backBtn('#/me')}<h2>Privacy</h2></div>
      <p class="sub" style="margin-top:0">Hidden details are never sent to other members. Everyone can still reach you through a portal email.</p>
      <div class="group-title">Contact details</div>
      ${sw('email', 'Email address', m.email, m.visible.email)}
      ${sw('whatsapp', 'WhatsApp', m.whatsapp, m.visible.whatsapp)}
      ${sw('phone', 'Phone for calls', m.phoneSameAsWhatsapp ? (m.whatsapp ? 'Same as WhatsApp' : '') : m.phone, m.visible.phone)}
      ${sw('linkedin', 'LinkedIn', m.linkedin, m.visible.linkedin)}
      ${sw('facebook', 'Facebook', m.facebook, m.visible.facebook)}
      <div class="group-title">Blood donation</div>
      <div class="prow"><span class="grow"><b>List me in blood finder</b><span>${m.blood ? `Shown to members searching ${esc(m.blood)}` : 'Add your blood group in Edit profile first'}</span></span><label class="switch"><input type="checkbox" id="donor" ${m.donor ? 'checked' : ''} ${m.blood ? '' : 'disabled'}><i></i></label></div>
      <div class="prow"><span class="grow"><b>Show blood group on profile</b><span>Visible on your main profile</span></span><label class="switch"><input type="checkbox" id="sb" ${m.showBlood ? 'checked' : ''} ${m.blood ? '' : 'disabled'}><i></i></label></div>
      <div class="prow"><span class="grow"><b>Last donation date</b><span>Used only to work out eligibility (${API.settings.eligibilityDays} days)</span></span><span class="tag">Never shown</span></div>
      <input class="input" type="date" id="ld" value="${lastD}" max="${new Date().toISOString().slice(0, 10)}" style="margin-top:8px">`);
    $$('[data-k]').forEach((c) => { c.onchange = () => { const v = Object.assign({}, API.me().visible, { [c.dataset.k]: c.checked }); API.updateMe({ visible: v }); toast(`${c.closest('.prow').querySelector('b').textContent} ${c.checked ? 'shown to' : 'hidden from'} members`); }; });
    $('#donor').onchange = (e) => { API.updateMe({ donor: e.target.checked }); toast(e.target.checked ? 'You are listed in blood finder' : 'Removed from blood finder'); };
    $('#sb').onchange = (e) => API.updateMe({ showBlood: e.target.checked });
    $('#ld').onchange = (e) => { API.updateMe({ lastDonation: e.target.value ? new Date(e.target.value).toISOString() : null }); toast('Saved'); };
  }
  function preview() {
    const p = API.previewMe();
    const btns = [`<span class="cbtn">${icon('mail')}Email</span>`];
    if (p.whatsapp) btns.push(`<span class="cbtn wa">${icon('wa')}WhatsApp</span>`);
    if (p.phone) btns.push(`<span class="cbtn">${icon('phone')}Call</span>`);
    if (p.linkedin) btns.push(`<span class="cbtn">${icon('linkedin')}LinkedIn</span>`);
    screen(`<div class="topbar">${backBtn('#/me')}<h2>How members see you</h2></div>
      <div class="prof-head">${avatar(p, 'lg')}<h2>${esc(p.name)}</h2><div class="role">${esc(p.designation)}${p.org ? ', ' + esc(p.org) : ''}</div>
        <div class="tags"><span class="tag blue">EMBA ${p.batch}</span>${p.industry ? `<span class="tag">${esc(short(p.industry))}</span>` : ''}<span class="tag">${esc(API.place(p))}</span>${p.blood ? `<span class="tag red">${esc(p.blood)}</span>` : ''}</div></div>
      <div class="contact-grid n${Math.min(btns.length, 4)}">${btns.slice(0, 4).join('')}</div>
      ${p.hidden.length ? `<div class="note">Hidden from members: ${esc(p.hidden.join(', '))}.</div>` : ''}
      <div class="section">${p.bio ? `<h4>About</h4><p>${esc(p.bio)}</p>` : ''}${p.expertise.length ? `<h4>Expertise</h4><div class="chips">${p.expertise.map((e) => `<span class="tag">${esc(e)}</span>`).join('')}</div>` : ''}</div>
      <div class="footer-cta"><a class="btn ghost block" href="#/me/privacy">Change privacy settings</a></div>`);
  }
  function notifSettings() {
    const m = API.me();
    const row = (k, t, s) => `<div class="prow"><span class="grow"><b>${t}</b><span>${s}</span></span><label class="switch"><input type="checkbox" data-k="${k}" ${m.notify[k] ? 'checked' : ''}><i></i></label></div>`;
    screen(`<div class="topbar">${backBtn('#/me')}<h2>Notifications</h2></div>
      ${row('blood', 'Urgent blood requests', 'Email and in-app alert when someone near you needs your group')}
      ${row('messages', 'Portal emails', 'In-app alert when a member emails you (the email itself always arrives)')}
      ${row('announcements', 'Committee announcements', 'Reunions, events and portal news')}`);
    $$('[data-k]').forEach((c) => { c.onchange = () => { API.updateMe({ notify: Object.assign({}, API.me().notify, { [c.dataset.k]: c.checked }) }); toast('Saved'); }; });
  }
  function notifications() {
    const list = API.notifications(); const ann = API.announcements();
    const ic = { blood: 'drop', message: 'mail', joined: 'invite', approved: 'check', announcement: 'megaphone' };
    screen(`<div class="topbar">${backBtn('javascript:history.back()')}<h2>Notifications</h2></div>
      ${list.map((n) => `<a class="notif ${n.read ? '' : 'unread'}" href="${n.kind === 'blood' && n.ref ? '#/blood/r/' + n.ref : '#/notifications'}" style="color:inherit">${icon(ic[n.kind] || 'bell')}<span>${esc(n.text)}<time>${ago(n.at)}</time></span></a>`).join('') || '<p class="muted small">No notifications yet.</p>'}
      <div class="group-title">From the alumni committee</div>
      ${ann.map((a) => `<div class="notif">${icon('megaphone')}<span><b>${esc(a.title)}</b><br><span class="small" style="color:var(--ink-2)">${esc(a.body)}</span><time>${fmtDate(a.at)}</time></span></div>`).join('')}`);
    API.markRead();
  }

  // ---------- demo helper ----------
  function demoMenu() {
    const d = document.createElement('details'); d.className = 'demo-fab';
    d.innerHTML = `<summary>Demo</summary><div class="panel"><p>Prototype with sample data. Nothing is emailed or charged.</p>
      <a href="#/demo/email/K7F2Q9">Open Rafiq's invite email</a>
      <a href="#/demo/whatsapp/K7F2Q9">Open Rafiq's WhatsApp invite</a>
      <button data-a="farhana">Sign in as Farhana (member)</button>
      <a href="admin.html" target="_blank">Open admin panel ↗</a>
      <button data-a="reset" style="color:var(--crimson)">Reset all demo data</button></div>`;
    document.body.appendChild(d);
    d.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a], a'); if (!a) return; d.open = false;
      if (a.dataset.a === 'farhana') { API.signOut(); API.signIn('farhana.rahman@gmail.com', 'demo1234'); go('#/directory'); render(); }
      if (a.dataset.a === 'reset' && confirm('Reset all demo data to the starting sample?')) { API.reset(); location.hash = '#/signin'; location.reload(); }
    });
  }

  demoMenu();
  splash(() => { if (!location.hash || location.hash === '#/' || location.hash === '#/splash') location.hash = API.me() ? '#/directory' : '#/signin'; render(); });
})();
