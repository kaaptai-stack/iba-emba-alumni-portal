/* IBA EMBA Alumni Portal — admin panel (desktop). */
(function () {
  const { brand, icon, esc, avatar, taka, fmtDate, fmtDateTime, ago, toast, download } = UI;
  const A = API.admin;
  const root = document.getElementById('admin');
  const $ = (s, el) => (el || root).querySelector(s);
  const $$ = (s, el) => Array.from((el || root).querySelectorAll(s));
  const num = (n) => Number(n).toLocaleString('en-IN');
  const go = (h) => { location.hash = h; };
  const nameOf = (id) => (id === 'admin' ? 'Admin upload' : (A.member(id) || {}).name || '—');
  let timers = [];

  function parse() { const raw = location.hash.replace(/^#\/?/, ''); const [p, qs] = raw.split('?'); return { path: p || 'dashboard', q: Object.fromEntries(new URLSearchParams(qs || '')) }; }
  const routes = [
    [/^dashboard$/, dashboard], [/^members$/, members], [/^members\/([\w-]+)$/, memberDetail], [/^invite$/, invite], [/^payments$/, payments],
    [/^approvals$/, approvals], [/^reports$/, reports], [/^blood$/, bloodReqs], [/^groups$/, groupsPage], [/^announcements$/, announcements], [/^audit$/, auditLog], [/^settings$/, settings],
  ];
  function render() {
    timers.forEach(clearInterval); timers = [];
    if (!A.signedIn()) return login();
    const { path, q } = parse();
    for (const [re, fn] of routes) { const m = path.match(re); if (m) { layout(path.split('/')[0]); fn(...m.slice(1).concat([q])); return; } }
    go('#/dashboard');
  }
  window.addEventListener('hashchange', render);
  window.addEventListener('portal:sync', render);

  function login() {
    root.innerHTML = `<div class="login"><form class="card stack" id="f" novalidate>
      <div class="center"><img src="assets/img/logo.png" style="width:64px;border-radius:50%"><h1 style="font-size:22px;margin-top:10px">Admin sign in</h1><p class="muted small">IBA EMBA Alumni Committee</p></div>
      <label class="field"><span>Email</span><input class="input" name="email" type="email" autocomplete="username"></label>
      <label class="field"><span>Password</span><input class="input" name="pw" type="password" autocomplete="current-password"></label>
      <div class="hint bad" id="err"></div><button class="btn block">Sign in</button>
      <div class="demo-note small" style="background:var(--amber-50);color:var(--amber);padding:10px;border-radius:10px">Demo: admin@ibaexecutivemba.com / admin1234<br><button type="button" class="btn link" id="fill" style="font-size:12.5px;margin-top:4px">Fill in the demo admin login</button></div>
      <p class="center small muted">Member? <a href="index.html">Go to the member app</a></p></form></div>`;
    const f = $('#f');
    $('#fill').onclick = () => { f.email.value = 'admin@ibaexecutivemba.com'; f.pw.value = 'admin1234'; $('#err').textContent = ''; };
    f.onsubmit = (e) => { e.preventDefault(); try { A.signIn(f.email.value, f.pw.value); render(); } catch (err) { $('#err').textContent = err.message; } };
  }

  function layout(active) {
    const d = A.dashboard();
    const L = (h, ic, label, extra) => `<a href="#/${h}" class="${active === h ? 'on' : ''}">${icon(ic)}${label}${extra || ''}</a>`;
    root.innerHTML = `<div class="layout"><aside class="side"><div class="brand"><img src="assets/img/logo.png" alt="">Admin</div><nav>
      ${L('dashboard', 'grid', 'Dashboard')}${L('members', 'users', 'Members', `<span class="n">${num(d.total)}</span>`)}${L('invite', 'invite', 'Invite members')}
      ${L('payments', 'card', 'Payments')}${L('approvals', 'check', 'Approval queue', d.pending ? `<span class="badge">${d.pending}</span>` : '')}
      ${L('reports', 'flag', 'Reports', d.openReports ? `<span class="badge red">${d.openReports}</span>` : '')}${L('blood', 'drop', 'Blood requests', d.reqOpen ? `<span class="n">${d.reqOpen} open</span>` : '')}
      ${L('groups', 'groups', 'Groups', `<span class="n">${A.groups().filter((g) => g.status === 'active').length}</span>`)}${L('announcements', 'megaphone', 'Announcements')}${L('audit', 'list', 'Audit log')}${L('settings', 'cog', 'Settings')}</nav>
      <div class="foot"><a href="index.html" target="_blank">Open member app ↗</a><button id="reset">Reset demo data</button><button id="out">Sign out</button></div></aside>
      <main class="main" id="main"></main></div>`;
    $('#out').onclick = () => { A.signOut(); render(); };
    $('#reset').onclick = () => { if (confirm('Reset all demo data to the starting sample?')) { A.reset(); A.signIn('admin@ibaexecutivemba.com', 'admin1234'); render(); toast('Demo data reset'); } };
  }
  const main = (html) => { $('#main').innerHTML = html; };
  function modal(html) {
    const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.innerHTML = `<div class="modal" role="dialog">${html}</div>`;
    document.body.appendChild(bg); const close = () => bg.remove();
    bg.onclick = (e) => { if (e.target === bg) close(); }; $$('[data-close]', bg).forEach((b) => { b.onclick = close; });
    return { el: bg, close };
  }
  const statusTag = (m) => !m.enabled ? '<span class="tag">Disabled</span>' : m.approval === 'pending' ? '<span class="tag amber">Waiting approval</span>' : '<span class="tag green">Active</span>';
  const payTag = (m) => m.paid ? `<span class="tag green">Paid ${taka(API.settings.fee)}</span>` : m.paymentStatus === 'failed' ? '<span class="tag red">Payment failed</span>' : '<span class="tag amber">Unpaid</span>';
  const who = (m, sub) => `<div class="who">${avatar(m, 'sm')}<div><b>${esc(m.name || m.email)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`;

  // ---------- dashboard ----------
  function dashboard() {
    const d = A.dashboard(); const M = A.members();
    const attention = [
      ...M.filter((m) => m.approval === 'pending').map((m) => ({ m, kind: 'pending' })),
      ...A.reports().filter((r) => r.status === 'open').map((r) => ({ m: A.member(r.target), kind: 'report', r })).filter((x) => x.m),
      ...M.filter((m) => m.approval === 'approved' && m.invitedBy !== 'admin' && Date.now() - new Date(m.registeredOn) < 7 * 864e5).slice(0, 3).map((m) => ({ m, kind: 'new' })),
    ];
    const batches = {}; M.forEach((m) => { batches[m.batch] = (batches[m.batch] || 0) + 1; });
    const top = Object.entries(batches).sort((a, b) => b[1] - a[1]).slice(0, 8); const max = top.length ? top[0][1] : 1;
    main(`<div class="ph"><div class="grow"><h1>Dashboard</h1><div>Last 30 days · updated ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div></div>
        <button class="btn ghost" id="csv">${icon('upload')}Upload founding members (CSV)</button><a class="btn" href="#/announcements">Send announcement</a></div>
      <div class="tiles">
        <div class="tile"><b>${num(d.total)}</b><span>Registered members</span><small class="up">+${d.newMonth} this month</small></div>
        <div class="tile"><b>${d.acceptance}%</b><span>Invite acceptance</span><small>${num(d.sent)} sent · ${num(d.joined)} joined</small></div>
        <div class="tile"><b>${d.activePct}%</b><span>Monthly active</span><small>${num(d.active)} members</small></div>
        <div class="tile"><b>${taka(d.fees)}</b><span>Fees collected</span><small>${num(d.paid)} paid · ${num(d.unpaid)} unpaid</small></div>
        <div class="tile red"><b>${d.reqFulfilled} / ${d.reqTotal + d.reqOpen}</b><span>Blood requests fulfilled</span><small>${d.reqOpen} open now</small></div>
      </div>
      <div class="grid2">
        <section class="panel"><header><h3>Needs attention</h3><span>Approval queue and reports</span></header>
          <table><thead><tr><th>Member</th><th>Batch</th><th>Invited by</th><th>Status</th><th>Action</th></tr></thead><tbody>
          ${attention.map(({ m, kind, r }) => `<tr><td>${who(m)}</td><td>EMBA ${m.batch}</td><td>${esc(nameOf(m.invitedBy))}</td>
            <td>${kind === 'pending' ? '<span class="tag amber">Waiting approval</span>' : kind === 'report' ? `<span class="tag red">Reported: ${esc(r.reason.split(' ')[0].toLowerCase())}</span>` : '<span class="tag green">Active</span>'}</td>
            <td>${kind === 'pending' ? `<button class="pill wa" data-ap="${m.id}">Approve</button> <button class="pill" data-rj="${m.id}">Reject</button>` : kind === 'report' ? `<a class="pill" style="color:var(--crimson)" href="#/reports">Review</a>` : `<a class="pill" href="#/members/${m.id}">View</a>`}</td></tr>`).join('') || '<tr><td colspan="5" class="muted center" style="padding:30px">Nothing needs attention.</td></tr>'}
          </tbody></table></section>
        <section class="panel"><header><h3>Members by batch</h3><span>Top 8</span></header><div class="body bars">
          ${top.map(([b, n]) => `<div class="r"><span>EMBA ${b}</span><span class="t"><i style="width:${n / max * 100}%"></i></span><span>${n}</span></div>`).join('')}</div></section>
      </div>
      <p class="small muted" style="margin-top:14px">Every admin action is written to the <a href="#/audit">audit log</a>.</p>`);
    bindApprove();
    $('#csv').onclick = foundingUpload;
  }
  function bindApprove() {
    $$('[data-ap]').forEach((b) => { b.onclick = () => { A.approve(b.dataset.ap); toast('Member approved'); render(); }; });
    $$('[data-rj]').forEach((b) => { b.onclick = () => { if (confirm('Reject this member? Their account will be turned off.')) { A.reject(b.dataset.rj); toast('Member rejected'); render(); } }; });
  }
  function foundingUpload() {
    const md = modal(`<h3>Upload founding members</h3><p class="small muted">CSV with columns <b>name, email, batch</b>. Each person gets a personal invite and is approved automatically.</p>
      <input type="file" accept=".csv,text/csv" id="file" class="input" style="padding-top:9px"><textarea class="textarea" id="txt" style="margin-top:10px;font-family:monospace;font-size:12px" placeholder="name,email,batch\nShahida Begum,shahida.begum@gmail.com,32"></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="go">Upload and invite</button></div>`);
    $('#file', md.el).onchange = async (e) => { const f = e.target.files[0]; if (f) $('#txt', md.el).value = await f.text(); };
    $('#go', md.el).onclick = () => { const rows = UI.parseCSV($('#txt', md.el).value); const n = A.uploadFounding(rows); md.close(); toast(`${n} founding member${n === 1 ? '' : 's'} invited`); render(); };
  }

  // ---------- members ----------
  function filteredMembers(q) {
    let L = A.members().slice();
    if (q.q) { const s = q.q.toLowerCase(); L = L.filter((m) => (m.name + ' ' + m.email + ' ' + m.org).toLowerCase().includes(s)); }
    if (q.f === 'paid') L = L.filter((m) => m.paid); if (q.f === 'unpaid') L = L.filter((m) => !m.paid); if (q.f === 'disabled') L = L.filter((m) => !m.enabled);
    if (q.b) L = L.filter((m) => String(m.batch) === q.b);
    if (q.d) { const days = +q.d; L = L.filter((m) => Date.now() - new Date(m.registeredOn) < days * 864e5); }
    return L.sort((a, b) => b.registeredOn.localeCompare(a.registeredOn));
  }
  function members(q) {
    const all = A.members(); const L = filteredMembers(q); const per = 10; const pages = Math.max(1, Math.ceil(L.length / per)); const p = Math.min(+q.p || 1, pages);
    const url = (o) => '#/members?' + new URLSearchParams(Object.fromEntries(Object.entries(Object.assign({}, q, { p: 1 }, o)).filter(([, v]) => v))).toString();
    const paid = all.filter((m) => m.paid).length; const dis = all.filter((m) => !m.enabled).length;
    const batches = [...new Set(all.map((m) => m.batch))].sort((a, b) => b - a);
    const pg = []; for (let i = 1; i <= pages; i++) if (i <= 3 || i === pages || Math.abs(i - p) <= 1) pg.push(i); else if (pg[pg.length - 1] !== '…') pg.push('…');
    main(`<div class="ph"><div class="grow"><h1>Members</h1><div>${num(all.length)} members · ${num(paid)} paid · ${num(all.length - paid)} unpaid · ${dis} disabled</div></div>
        <button class="btn ghost" id="exp">${icon('download')}Export CSV</button><a class="btn" href="#/invite">Invite members</a></div>
      <section class="panel"><div class="toolbar">
        <input class="input" id="s" placeholder="Search name or email" value="${esc(q.q || '')}" style="width:240px">
        <div class="seg">${[['', 'All', all.length], ['paid', 'Paid', paid], ['unpaid', 'Unpaid', all.length - paid], ['disabled', 'Disabled', dis]].map(([k, l, n]) => `<button data-f="${k}" class="${(q.f || '') === k ? 'on' : ''}">${l} ${num(n)}</button>`).join('')}</div>
        <select class="select" id="b" style="width:140px"><option value="">All batches</option>${batches.map((b) => `<option value="${b}" ${q.b === String(b) ? 'selected' : ''}>EMBA ${b}</option>`).join('')}</select>
        <select class="select" id="d" style="width:150px"><option value="">Any date</option>${[[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']].map(([v, l]) => `<option value="${v}" ${q.d === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <table><thead><tr><th>Member</th><th>Batch</th><th>Registered on</th><th>Payment</th><th>Paid on</th><th>Account</th><th></th></tr></thead><tbody>
        ${L.slice((p - 1) * per, p * per).map((m) => `<tr><td>${who(m, m.email)}</td><td>EMBA ${m.batch}</td><td>${fmtDate(m.registeredOn)}</td><td>${payTag(m)}</td><td>${m.paid ? fmtDate(m.paidOn) : '--'}</td>
          <td><label class="row" style="gap:8px"><span class="switch"><input type="checkbox" data-en="${m.id}" ${m.enabled ? 'checked' : ''}><i></i></span><span class="small">${m.enabled ? 'Enabled' : 'Disabled'}</span></label></td>
          <td><a class="pill" href="#/members/${m.id}">View</a></td></tr>`).join('') || '<tr><td colspan="7" class="center muted" style="padding:30px">No members match.</td></tr>'}
        </tbody></table>
        <div class="pager"><span>Showing ${L.length ? (p - 1) * per + 1 : 0}–${Math.min(p * per, L.length)} of ${num(L.length)}</span><div class="pg">
          <button data-p="${p - 1}" ${p <= 1 ? 'disabled' : ''}>‹ Previous</button>${pg.map((i) => i === '…' ? '<span style="padding:0 4px">…</span>' : `<button data-p="${i}" class="${i === p ? 'on' : ''}">${i}</button>`).join('')}<button data-p="${p + 1}" ${p >= pages ? 'disabled' : ''}>Next ›</button></div></div>
      </section>
      <p class="small muted" style="margin-top:12px">Turning an account off signs the member out and hides them from the directory; turning it back on restores everything. Every change is written to the audit log.</p>`);
    let deb; $('#s').oninput = (e) => { clearTimeout(deb); deb = setTimeout(() => { go(url({ q: e.target.value })); setTimeout(() => { const s = $('#s'); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }, 0); }, 300); };
    $$('[data-f]').forEach((b) => { b.onclick = () => go(url({ f: b.dataset.f })); });
    $('#b').onchange = (e) => go(url({ b: e.target.value })); $('#d').onchange = (e) => go(url({ d: e.target.value }));
    $$('[data-p]').forEach((b) => { b.onclick = () => go(url({ p: b.dataset.p })); });
    $$('[data-en]').forEach((c) => { c.onchange = () => toggleAccount(c.dataset.en, c.checked, () => { c.checked = !c.checked; }); });
    $('#exp').onclick = () => {
      const rows = [['name', 'email', 'batch', 'registered_on', 'payment', 'paid_on', 'transaction_id', 'account']].concat(L.map((m) => [m.name, m.email, m.batch, m.registeredOn.slice(0, 10), m.paid ? 'paid' : m.paymentStatus, m.paidOn ? m.paidOn.slice(0, 10) : '', m.txn || '', m.enabled ? 'enabled' : 'disabled']));
      download('iba-emba-members.csv', rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
    };
  }
  function toggleAccount(id, on, revert, onDone) {
    const m = A.member(id);
    if (on) { A.setEnabled(id, true); toast(`${m.name}'s account enabled`); render(); return; }
    const md = modal(`<h3>Disable ${esc(m.name)}?</h3><p class="small" style="color:var(--ink-2)">This signs ${esc(m.name.split(' ')[0])} out and hides the profile from the directory.</p>
      <label class="field"><span>Reason (required to disable)</span><input class="input" id="rs" placeholder="e.g. reported for spam"></label>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn ghost" data-close>Cancel</button><button class="btn danger" id="go">Disable account</button></div>`);
    $$('[data-close]', md.el).forEach((b) => b.addEventListener('click', () => revert && revert()));
    $('#go', md.el).onclick = () => { try { A.setEnabled(id, false, $('#rs', md.el).value); md.close(); if (onDone) onDone(); toast(`${m.name}'s account disabled`); render(); } catch (e) { toast(e.message, true); } };
  }

  function memberDetail(id) {
    const m = A.member(id); if (!m) return main('<p>Member not found. <a href="#/members">Back to members</a></p>');
    const hid = (k) => (m.visible[k] ? '' : '<span class="hid">Hidden from members</span>');
    const ph = m.phoneSameAsWhatsapp ? m.whatsapp : m.phone;
    const inv = A.invites().find((i) => i.email === m.email);
    const log = A.audit().filter((a) => a.target === m.name && a.action !== 'Created account').map((a) => ({ at: a.at, t: a.action + (a.detail ? ' · ' + a.detail : '') }));
    const acts = [...log];
    if (m.paid) acts.push({ at: m.paidOn, t: 'Paid registration fee' });
    if (m.setupDone) acts.push({ at: m.paidOn || m.registeredOn, t: 'Completed profile set-up' });
    acts.push({ at: m.registeredOn, t: 'Created account' });
    if (m.invitedBy) acts.push({ at: inv ? inv.createdAt : m.registeredOn, t: m.invitedBy === 'admin' ? 'Invited by the alumni committee' : 'Invited by ' + nameOf(m.invitedBy) });
    acts.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    main(`<div class="ph"><div class="grow"><h1><span class="crumb"><a href="#/members">Members</a> › </span>${esc(m.name || m.email)}</h1></div></div>
      <div class="grid3">
        <section class="panel"><div class="body">
          <div class="who" style="margin-bottom:14px">${avatar(m, 'lg')}<div><h2 style="font-size:20px">${esc(m.name)}</h2><div style="color:var(--ink-2)">${esc(m.designation)}${m.org ? ', ' + esc(m.org) : ''}</div>
            <div class="row wrap" style="margin-top:6px;gap:6px"><span class="tag blue">EMBA ${m.batch}</span>${m.industry ? `<span class="tag">${esc(API.INDUSTRY_SHORT[m.industry] || m.industry)}</span>` : ''}<span class="tag">${esc(m.city)}</span>${statusTag(m)}</div></div></div>
          <h3 style="font-size:14px;margin:6px 0">Contact details</h3>
          <div class="kv"><span>Email</span><b>${esc(m.email)}${hid('email')}</b><span>WhatsApp</span><b>${esc(m.whatsapp) || 'Not added'}${m.whatsapp ? hid('whatsapp') : ''}</b>
            <span>Phone</span><b>${esc(ph) || 'Not added'}${ph ? hid('phone') : ''}</b><span>LinkedIn</span><b>${esc(m.linkedin) || 'Not added'}${m.linkedin ? hid('linkedin') : ''}</b>
            <span>Facebook</span><b>${esc(m.facebook) || 'Not added'}${m.facebook ? hid('facebook') : ''}</b><span>Blood group</span><b>${esc(m.blood) || 'Not added'}${m.blood && !m.showBlood ? '<span class="hid">Hidden from members</span>' : ''}${m.donor ? '<span class="hid" style="color:var(--green)">Listed as donor</span>' : ''}</b></div>
          ${m.expertise.length ? `<h3 style="font-size:14px;margin:14px 0 6px">Expertise</h3><div class="row wrap" style="gap:6px">${m.expertise.map((e) => `<span class="tag">${esc(e)}</span>`).join('')}</div>` : ''}
        </div></section>
        <section class="panel"><header><h3>Registration</h3></header><div class="body">
          <div class="kv"><span>Registered on</span><b>${fmtDate(m.registeredOn)}</b><span>Invited by</span><b>${esc(nameOf(m.invitedBy))}${m.invitedBy && m.invitedBy !== 'admin' && A.member(m.invitedBy) ? ' · EMBA ' + A.member(m.invitedBy).batch : ''}</b>
            <span>Invite channel</span><b>${esc(m.inviteChannel)}</b><span>Email verified</span><b>${m.emailVerified ? 'Yes' : 'No'}</b><span>Approval</span><b>${esc(m.approval)}</b><span>Last sign-in</span><b>${m.lastSignIn ? fmtDateTime(m.lastSignIn) : '--'}</b></div>
          <h3 style="font-size:14px;margin:16px 0 6px" class="row between">Registration fee ${payTag(m)}</h3>
          <div class="kv"><span>Amount</span><b>${taka(API.settings.fee)}.00</b><span>Paid on</span><b>${m.paid ? fmtDateTime(m.paidOn) : '--'}</b><span>Paid via</span><b>${m.paid ? esc(m.payVia) : '--'}</b><span>Transaction ID</span><b>${esc(m.txn || '--')}</b></div>
          <div class="row" style="margin-top:12px">${m.paid ? '<button class="btn ghost sm" id="rr">Resend receipt</button>' : '<button class="btn sm" id="mp">Mark as paid manually</button>'}</div>
        </div></section>
        <div class="stack" style="margin:0">
          <section class="panel"><header><h3>Account</h3><span class="row" style="gap:8px">${m.enabled ? 'Enabled' : 'Disabled'}<span class="switch"><input type="checkbox" id="en" ${m.enabled ? 'checked' : ''}><i></i></span></span></header><div class="body small" style="color:var(--ink-2)">
            ${m.enabled ? `Turning this off signs ${esc(m.name.split(' ')[0])} out and hides the profile from the directory.` : `Disabled: ${esc(m.disabledReason)}`}
            ${m.approval === 'pending' ? `<div class="row" style="margin-top:12px"><button class="btn sm" data-ap="${m.id}" style="background:var(--green)">Approve</button><button class="btn ghost sm" data-rj="${m.id}">Reject</button></div>` : ''}</div></section>
          <section class="panel"><header><h3>Activity</h3></header><div class="body"><ul class="timeline">${acts.map((a) => `<li>${esc(a.t)}<small>${a.at ? fmtDateTime(a.at) : ''}</small></li>`).join('')}</ul></div></section>
        </div>
      </div>
      <p class="small muted" style="margin-top:14px">Admins see all fields, including those hidden from members, which are labelled. Every action is logged.</p>`);
    $('#en').onchange = (e) => toggleAccount(m.id, e.target.checked, () => { e.target.checked = !e.target.checked; });
    if ($('#rr')) $('#rr').onclick = () => { A.resendReceipt(m.id); toast(`Receipt resent to ${m.email}`); };
    if ($('#mp')) $('#mp').onclick = () => markPaid(m);
    bindApprove();
  }
  function markPaid(m) {
    const md = modal(`<h3>Mark ${esc(m.name || m.email)} as paid</h3><p class="small muted">For cash or bank transfer received outside Bangla QR.</p>
      <label class="field"><span>Paid via</span><select class="select" id="via"><option>Cash</option><option>Bank transfer</option><option>bKash (manual)</option><option>Bangla QR (verified by transaction ID)</option></select></label>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="go">Mark as paid</button></div>`);
    $('#go', md.el).onclick = () => { A.markPaid(m.id, $('#via', md.el).value); md.close(); toast('Payment recorded'); render(); };
  }

  // ---------- invite ----------
  function invite() {
    let mode = 'paste';
    main(`<div class="ph"><div class="grow"><h1>Invite members</h1><div>Send registration invitations to up to 1,000 email addresses at a time</div></div></div>
      <div class="grid2" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)">
        <section class="panel"><div class="body">
          <div class="tabs"><button class="on" data-m="paste">Paste emails</button><button data-m="csv">Upload CSV</button></div>
          <div id="pastebox"><label class="field"><span>Email addresses (one per line, or separated by commas)</span><textarea class="textarea" id="em" style="min-height:200px;font-family:monospace;font-size:12.5px" placeholder="shahida.begum@gmail.com&#10;rezaul.karim@yahoo.com"></textarea></label></div>
          <div id="csvbox" hidden><input type="file" accept=".csv,text/csv,text/plain" id="file" class="input" style="padding-top:9px"><p class="hint">A column named <b>email</b>, or one address per line.</p></div>
          <div class="hint">Maximum 1,000 per send</div>
          <div id="chk" style="margin-top:10px"></div>
          <div class="row" style="margin-top:12px"><label class="field grow"><span>EMBA batch (optional)</span><select class="select" id="batch"><option value="">Mixed batches</option>${Array.from({ length: 50 }, (_, i) => 50 - i).map((b) => `<option>${b}</option>`).join('')}</select></label>
            <label class="field grow"><span>Sent as</span><input class="input" value="IBA EMBA Alumni Committee" readonly style="background:var(--tint)"></label></div>
          <div class="row" style="margin-top:14px"><button class="btn" id="send" disabled>Send invitations</button><span class="small muted">Each address gets its own email and personal link, valid for ${API.settings.inviteDays} days.</span></div>
        </div></section>
        <div class="stack" style="margin:0">
          <section class="panel"><header><h3>Preview: what each person receives</h3></header><div class="body"><div class="emailprev" id="prev"></div></div></section>
          <section class="panel"><header><h3>Recent bulk invites</h3><span>Opened · Joined</span></header><div class="body" id="recent"></div></section>
        </div>
      </div>
      <p class="small muted" style="margin-top:14px">Addresses are checked before sending: existing members are skipped, duplicates removed and typos flagged. Emails go out one by one, never as a group email, so no recipient sees anyone else's address.</p>`);
    let result = null;
    const drawRecent = () => { $('#recent').innerHTML = A.bulkInvites().map((b) => `<div class="checkrow"><span>${fmtDate(b.at)} · ${num(b.sent)} sent</span><span class="muted">${num(b.opened)} opened · ${num(b.joined)} joined</span></div>`).join(''); };
    const prev = (email) => {
      const exp = new Date(Date.now() + API.settings.inviteDays * 864e5);
      $('#prev').innerHTML = `<h4>You're invited to the IBA EMBA alumni portal</h4><div class="small muted">From: IBA EMBA Alumni Committee · To: ${esc(email || 'name@example.com')}</div>
        <p>Dear alumnus,</p><p>You are invited to join the private members portal for Executive MBA alumni of IBA, University of Dhaka. Find batchmates, connect by email or WhatsApp, and find blood donors in an emergency.</p>
        <p>Registration fee: ${taka(API.settings.fee)}, payable by Bangla QR.</p><span class="btn sm" style="cursor:default">Join the portal</span>
        <p class="small muted">This link works only for ${esc(email || 'this address')} and expires on ${fmtDate(exp)}.</p>`;
    };
    const check = () => {
      const text = $('#em').value; if (!text.trim()) { result = null; $('#chk').innerHTML = ''; $('#send').disabled = true; $('#send').textContent = 'Send invitations'; prev(); return; }
      result = A.checkInvites(text);
      const over = result.ready.length > 1000;
      $('#chk').innerHTML = `<div class="checkrow"><span><b>${num(result.total)}</b>addresses entered</span></div>
        <div class="checkrow"><span><b style="color:var(--green)">${num(result.ready.length)}</b>ready to invite</span><span class="tag green">Will be sent</span></div>
        ${result.members.length ? `<div class="checkrow"><span><b>${result.members.length}</b>already members</span><span class="tag">Skipped</span></div>` : ''}
        ${result.dupes.length ? `<div class="checkrow"><span><b>${result.dupes.length}</b>duplicates</span><span class="tag">Removed</span></div>` : ''}
        ${result.invalid.length ? `<div class="checkrow"><span><b style="color:var(--crimson)">${result.invalid.length}</b>invalid: ${esc(result.invalid.slice(0, 4).join(' · '))}${result.invalid.length > 4 ? '…' : ''}</span><span class="tag red">Fix or skip</span></div>` : ''}
        ${over ? '<div class="hint bad">More than 1,000 valid addresses. Split them into two sends.</div>' : ''}`;
      $('#send').disabled = !result.ready.length || over; $('#send').textContent = `Send ${num(result.ready.length)} invitation${result.ready.length === 1 ? '' : 's'}`;
      prev(result.ready[0]);
    };
    $('#em').oninput = check; prev(); drawRecent();
    $$('[data-m]').forEach((b) => { b.onclick = () => { mode = b.dataset.m; $$('[data-m]').forEach((x) => x.classList.toggle('on', x === b)); $('#pastebox').hidden = mode !== 'paste'; $('#csvbox').hidden = mode !== 'csv'; }; });
    $('#file').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; const rows = UI.parseCSV(await f.text()); $('#em').value = rows.map((r) => r.email).filter(Boolean).join('\n'); $$('[data-m]')[0].click(); check(); };
    $('#send').onclick = () => {
      const list = result.ready.slice(); const batch = +$('#batch').value || null;
      $('#send').disabled = true;
      A.sendBulk(list, batch);
      // emails go out one by one; show progress
      let sent = 0; const total = list.length;
      $('#recent').insertAdjacentHTML('afterbegin', `<div id="prog"><div class="row between small"><span>Sending now · <span id="pc">0</span> of ${num(total)}</span><span class="muted" id="pl"></span></div><div class="progressbar"><i id="pb" style="width:0"></i></div></div>`);
      const t = setInterval(() => {
        sent = Math.min(total, sent + Math.max(1, Math.ceil(total / 25)));
        const pc = $('#pc'); if (!pc) return clearInterval(t);
        pc.textContent = num(sent); $('#pb').style.width = (sent / total * 100) + '%'; $('#pl').textContent = sent < total ? `about ${Math.ceil((total - sent) / Math.max(1, total / 25) * 0.15)} s left` : 'Done';
        if (sent >= total) { clearInterval(t); toast(`${num(total)} invitations sent`); $('#em').value = ''; check(); setTimeout(() => { if ($('#prog')) { $('#prog').remove(); drawRecent(); } }, 1200); }
      }, 150);
      timers.push(t);
    };
  }

  // ---------- payments ----------
  function payments(q) {
    const M = A.members(); const paid = M.filter((m) => m.paid).sort((a, b) => b.paidOn.localeCompare(a.paidOn)); const unpaid = M.filter((m) => !m.paid);
    const tab = q.t || 'paid'; const list = tab === 'paid' ? paid : unpaid;
    main(`<div class="ph"><div class="grow"><h1>Payments</h1><div>Registration fee ${taka(API.settings.fee)} · ${taka(paid.length * API.settings.fee)} collected</div></div>
        <div class="row" style="gap:6px"><input class="input" id="tx" placeholder="Check a transaction ID" style="width:220px"><button class="btn ghost" id="chk">Check</button></div></div>
      <div class="tiles" style="grid-template-columns:repeat(3,1fr)"><div class="tile"><b>${num(paid.length)}</b><span>Paid</span></div><div class="tile"><b>${num(unpaid.length)}</b><span>Unpaid</span><small>${unpaid.filter((m) => m.paymentStatus === 'failed').length} failed attempts</small></div><div class="tile"><b>${taka(paid.length * API.settings.fee)}</b><span>Collected</span></div></div>
      <section class="panel"><div class="toolbar"><div class="seg"><button class="${tab === 'paid' ? 'on' : ''}" data-t="paid">Paid ${num(paid.length)}</button><button class="${tab === 'unpaid' ? 'on' : ''}" data-t="unpaid">Unpaid ${num(unpaid.length)}</button></div></div>
        <table><thead><tr><th>Member</th><th>Batch</th><th>Status</th><th>${tab === 'paid' ? 'Paid on' : 'Registered on'}</th><th>${tab === 'paid' ? 'Via' : ''}</th><th>${tab === 'paid' ? 'Transaction ID' : ''}</th><th></th></tr></thead><tbody>
        ${list.slice(0, 60).map((m) => `<tr><td>${who(m, m.email)}</td><td>EMBA ${m.batch}</td><td>${payTag(m)}</td><td>${fmtDate(tab === 'paid' ? m.paidOn : m.registeredOn)}</td><td>${tab === 'paid' ? esc(m.payVia) : ''}</td><td style="font-family:monospace;font-size:12px">${tab === 'paid' ? esc(m.txn) : ''}</td>
          <td>${tab === 'paid' ? `<a class="pill" href="#/members/${m.id}">View</a>` : `<button class="pill" data-mp="${m.id}">Mark as paid</button>`}</td></tr>`).join('')}
        </tbody></table>${list.length > 60 ? `<div class="pager">Showing 60 of ${num(list.length)} · use <a href="#/members?f=${tab}">Members</a> to see all</div>` : ''}</section>`);
    $$('[data-t]').forEach((b) => { b.onclick = () => go('#/payments?t=' + b.dataset.t); });
    $$('[data-mp]').forEach((b) => { b.onclick = () => markPaid(A.member(b.dataset.mp)); });
    $('#chk').onclick = () => { const v = $('#tx').value.trim().toUpperCase(); const m = M.find((x) => x.txn === v); if (m) go('#/members/' + m.id); else toast('No payment found with that transaction ID.', true); };
  }

  // ---------- approvals, reports, blood ----------
  function approvals() {
    const L = A.members().filter((m) => m.approval === 'pending');
    main(`<div class="ph"><div class="grow"><h1>Approval queue</h1><div>Members invited by other members are approved here before they appear in the directory.</div></div></div>
      <section class="panel"><table><thead><tr><th>Member</th><th>Batch</th><th>Organisation</th><th>Invited by</th><th>Registered</th><th>Payment</th><th>Action</th></tr></thead><tbody>
      ${L.map((m) => `<tr><td>${who(m, m.email)}</td><td>EMBA ${m.batch}</td><td>${esc(m.designation)}${m.org ? ', ' + esc(m.org) : ''}</td><td>${esc(nameOf(m.invitedBy))}</td><td>${ago(m.registeredOn)}</td><td>${payTag(m)}</td>
        <td><button class="pill wa" data-ap="${m.id}">Approve</button> <button class="pill" data-rj="${m.id}">Reject</button> <a class="pill" href="#/members/${m.id}">View</a></td></tr>`).join('') || '<tr><td colspan="7" class="center muted" style="padding:30px">The queue is empty.</td></tr>'}
      </tbody></table></section>`);
    bindApprove();
  }
  function reports() {
    const L = A.reports();
    main(`<div class="ph"><div class="grow"><h1>Reports</h1><div>Profiles reported by members. Reporters are never shown to the reported member.</div></div></div>
      <section class="panel"><table><thead><tr><th>Reported member</th><th>Reason</th><th>Note</th><th>Reported by</th><th>When</th><th>Status</th><th>Action</th></tr></thead><tbody>
      ${L.map((r) => { const m = A.member(r.target); return `<tr><td>${m ? who(m, 'EMBA ' + m.batch) : esc(r.target)}</td><td>${esc(r.reason)}</td><td class="small" style="max-width:240px">${esc(r.note)}</td><td>${esc(nameOf(r.by))}</td><td>${ago(r.at)}</td>
        <td>${r.status === 'open' ? '<span class="tag red">Open</span>' : `<span class="tag">${esc(r.status)}</span>`}</td>
        <td>${r.status === 'open' ? `<button class="pill" data-rv="${r.id}" data-o="dismissed">Dismiss</button> ${m && m.enabled ? `<button class="pill" style="color:var(--crimson)" data-dis="${r.target}" data-r="${r.id}">Disable account</button>` : ''}` : ''} ${m ? `<a class="pill" href="#/members/${m.id}">View</a>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="7" class="center muted" style="padding:30px">No reports.</td></tr>'}
      </tbody></table></section>`);
    $$('[data-rv]').forEach((b) => { b.onclick = () => { A.resolveReport(b.dataset.rv, b.dataset.o); toast('Report dismissed'); render(); }; });
    $$('[data-dis]').forEach((b) => { b.onclick = () => toggleAccount(b.dataset.dis, false, null, () => A.resolveReport(b.dataset.r, 'actioned')); });
  }
  function bloodReqs() {
    const L = A.requests();
    main(`<div class="ph"><div class="grow"><h1>Blood requests</h1><div>Requests close automatically after ${API.settings.requestHours} hours.</div></div></div>
      <section class="panel"><table><thead><tr><th>Group</th><th>Hospital</th><th>Requested by</th><th>Created</th><th>Donors notified</th><th>Offers</th><th>Status</th></tr></thead><tbody>
      ${L.map((r) => `<tr><td><b style="color:var(--crimson)">${esc(r.group)}</b> · ${r.units} unit${r.units > 1 ? 's' : ''}</td><td>${esc(r.hospital)}, ${esc(r.city)}</td><td>${esc(nameOf(r.by))}</td><td>${ago(r.createdAt)}</td><td>${r.notified}</td><td>${r.offers.length}</td>
        <td><span class="tag ${r.status === 'open' ? 'red' : r.status === 'fulfilled' ? 'green' : ''}">${esc(r.status)}</span></td></tr>`).join('') || '<tr><td colspan="7" class="center muted" style="padding:30px">No requests yet.</td></tr>'}
      </tbody></table></section>`);
  }

  // ---------- groups ----------
  function groupsPage() {
    const G = A.groups(); const P = API.PLATFORMS;
    const count = (st) => G.filter((g) => g.status === st).length;
    main(`<div class="ph"><div class="grow"><h1>Groups</h1><div>${G.length} groups · ${count('active')} active · ${count('disabled')} disabled · ${count('hidden')} hidden</div></div>
        <button class="btn" id="add">${icon('plus')}Add group</button></div>
      <section class="panel"><table><thead><tr><th style="width:56px">Order</th><th>Group</th><th>Platform</th><th>Link</th><th>Shown to members as</th><th></th></tr></thead><tbody>
      ${G.map((g, i) => `<tr>
        <td><div class="row" style="gap:2px"><button class="iconbtn sm" data-mv="${g.id}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${icon('up')}</button><button class="iconbtn sm" data-mv="${g.id}" data-d="1" ${i === G.length - 1 ? 'disabled' : ''} aria-label="Move down">${icon('down')}</button></div></td>
        <td><div class="who" style="${g.status === 'active' ? '' : 'opacity:.55'}">${brand(g.platform, 'sm')}<div><b>${esc(g.name)}</b><small>${esc(g.description)}</small></div></div></td>
        <td>${(P[g.platform] || P.website).label}</td>
        <td><a href="${esc(g.url)}" target="_blank" rel="noopener noreferrer" class="small" style="display:inline-block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle">${esc(g.url.replace(/^https?:\/\//, ''))}</a></td>
        <td><div class="seg">${[['active', 'Active'], ['disabled', 'Disabled'], ['hidden', 'Hidden']].map(([k, l]) => `<button data-st="${k}" data-id="${g.id}" class="${g.status === k ? 'on' : ''}">${l}</button>`).join('')}</div></td>
        <td style="white-space:nowrap"><button class="pill" data-ed="${g.id}">${icon('edit')}Edit</button> <button class="pill" style="color:var(--crimson)" data-del="${g.id}">${icon('trash')}</button></td></tr>`).join('') || '<tr><td colspan="6" class="center muted" style="padding:30px">No groups yet. Add the first one.</td></tr>'}
      </tbody></table></section>
      <div class="small muted" style="margin-top:12px;line-height:1.7"><b>Active</b>: listed in the member app's Groups tab and opens the group. <b>Disabled</b>: still listed but greyed out, and the link is not sent to members. <b>Hidden</b>: not shown to members at all. Every change is written to the audit log.</div>`);
    $('#add').onclick = () => groupForm();
    $$('[data-ed]').forEach((b) => { b.onclick = () => groupForm(G.find((g) => g.id === b.dataset.ed)); });
    $$('[data-st]').forEach((b) => { b.onclick = () => { const g = G.find((x) => x.id === b.dataset.id); if (g.status === b.dataset.st) return; A.setGroupStatus(g.id, b.dataset.st); toast(`${g.name}: ${b.textContent.toLowerCase()}`); render(); }; });
    $$('[data-mv]').forEach((b) => { b.onclick = () => { A.moveGroup(b.dataset.mv, +b.dataset.d); render(); }; });
    $$('[data-del]').forEach((b) => { b.onclick = () => { const g = G.find((x) => x.id === b.dataset.del); if (confirm(`Delete “${g.name}”? Members will no longer see it. To remove it only for now, use Hidden instead.`)) { A.deleteGroup(g.id); toast('Group deleted'); render(); } }; });
  }
  function groupForm(g) {
    const P = API.PLATFORMS; const editing = !!g; g = g || { name: '', url: '', platform: '', description: '', status: 'active' };
    const md = modal(`<h3>${editing ? 'Edit group' : 'Add group'}</h3><form id="gf" class="stack" novalidate>
      <label class="field"><span>Group name</span><input class="input" name="name" maxlength="80" value="${esc(g.name)}" placeholder="e.g. IBA EMBA Alumni · all batches"></label>
      <label class="field"><span>Group link</span><input class="input" name="url" value="${esc(g.url)}" placeholder="https://chat.whatsapp.com/..."><div class="hint">The invite or page link from WhatsApp, Facebook, Telegram, LinkedIn or any website.</div></label>
      <div class="row" style="align-items:flex-end"><span id="pv">${brand(g.platform || 'website')}</span><label class="field grow"><span>Platform (detected from the link)</span><select class="select" name="platform"><option value="">Detect automatically</option>${Object.keys(P).map((k) => `<option value="${k}" ${editing && g.platform === k ? 'selected' : ''}>${P[k].label}</option>`).join('')}</select></label></div>
      <label class="field"><span>Short description (optional)</span><input class="input" name="description" maxlength="120" value="${esc(g.description)}" placeholder="What the group is for"></label>
      ${editing ? '' : `<label class="field"><span>Status</span><select class="select" name="status"><option value="active">Active: shown to all members</option><option value="disabled">Disabled: shown greyed out</option><option value="hidden">Hidden: not shown yet</option></select></label>`}
      <div class="hint bad" id="err"></div>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">${editing ? 'Save changes' : 'Add group'}</button></div></form>`);
    const f = $('#gf', md.el);
    const pv = () => { $('#pv', md.el).innerHTML = brand(f.platform.value || API.detectPlatform(f.url.value)); };
    f.url.oninput = pv; f.platform.onchange = pv; pv();
    f.onsubmit = (e) => {
      e.preventDefault();
      try { A.saveGroup({ id: editing ? g.id : null, name: f.name.value, url: f.url.value, platform: f.platform.value, description: f.description.value, status: editing ? g.status : f.status.value }); md.close(); toast(editing ? 'Group saved' : 'Group added'); render(); }
      catch (err) { $('#err', md.el).textContent = err.message; }
    };
    f.name.focus();
  }

  // ---------- announcements, audit, settings ----------
  function announcements() {
    const recipients = A.members().filter((m) => m.enabled && m.notify.announcements).length;
    main(`<div class="ph"><div class="grow"><h1>Announcements</h1><div>Sent by email and shown in every member's notifications.</div></div></div>
      <div class="grid2"><section class="panel"><header><h3>New announcement</h3><span>${num(recipients)} recipients</span></header><div class="body stack">
        <label class="field"><span>Title</span><input class="input" id="t" maxlength="100" placeholder="e.g. Annual reunion on 14 November"></label>
        <label class="field"><span>Message</span><textarea class="textarea" id="b" style="min-height:140px"></textarea></label>
        <button class="btn" id="send">${icon('send')}Send to ${num(recipients)} members</button></div></section>
        <section class="panel"><header><h3>Sent</h3></header><div class="body">${A.announcements().map((a) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${esc(a.title)}</b><div class="small muted">${fmtDate(a.at)} · ${num(a.sent)} recipients</div><div class="small" style="color:var(--ink-2);margin-top:4px">${esc(a.body)}</div></div>`).join('') || '<p class="muted">Nothing sent yet.</p>'}</div></section></div>`);
    $('#send').onclick = () => { const t = $('#t').value.trim(), b = $('#b').value.trim(); if (!t || !b) return toast('Add a title and a message.', true); if (!confirm(`Send “${t}” to ${recipients} members?`)) return; A.announce(t, b); toast('Announcement sent'); render(); };
  }
  function auditLog(q) {
    const s = (q.q || '').toLowerCase(); const L = A.audit().filter((a) => !s || JSON.stringify(a).toLowerCase().includes(s));
    main(`<div class="ph"><div class="grow"><h1>Audit log</h1><div>Every admin action, newest first.</div></div><button class="btn ghost" id="exp">${icon('download')}Export CSV</button></div>
      <section class="panel"><div class="toolbar"><input class="input" id="s" placeholder="Filter by action or member" value="${esc(q.q || '')}" style="width:280px"></div>
      <table><thead><tr><th>When</th><th>By</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead><tbody>
      ${L.map((a) => `<tr><td style="white-space:nowrap">${fmtDateTime(a.at)}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td><td>${esc(a.target)}</td><td class="small muted">${esc(a.detail)}</td></tr>`).join('') || '<tr><td colspan="5" class="center muted" style="padding:30px">No entries.</td></tr>'}
      </tbody></table></section>`);
    $('#s').onchange = (e) => go('#/audit?q=' + encodeURIComponent(e.target.value));
    $('#exp').onclick = () => download('iba-emba-audit-log.csv', [['when', 'by', 'action', 'target', 'detail']].concat(L.map((a) => [a.at, a.actor, a.action, a.target, a.detail])).map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
  }
  function settings() {
    const s = API.settings;
    const f = (k, l, h, extra) => `<label class="field"><span>${l}</span><input class="input" type="number" id="${k}" value="${s[k]}" ${extra || ''}><div class="hint">${h}</div></label>`;
    main(`<div class="ph"><div class="grow"><h1>Settings</h1><div>Portal-wide rules. Changes are logged.</div></div></div>
      <section class="panel" style="max-width:640px"><div class="body stack">
        ${f('fee', 'Registration fee (৳)', 'One-time fee paid by Bangla QR after profile set-up.', 'min="0"')}
        ${f('eligibilityDays', 'Blood donation interval (days)', 'Donors are shown as eligible this many days after their last donation.', 'min="30" max="365"')}
        ${f('requestHours', 'Blood request lifetime (hours)', 'Urgent requests close automatically after this.', 'min="6" max="168"')}
        ${f('msgLimit', 'Portal emails per member per day', 'Limits spam through the portal email form.', 'min="1" max="200"')}
        ${f('inviteDays', 'Invite link validity (days)', 'Personal invite links expire after this.', 'min="1" max="60"')}
        <label class="check" style="align-items:center"><input type="checkbox" id="appr" ${s.approvalForMemberInvites ? 'checked' : ''}> Members invited by other members need committee approval before they are listed</label>
        <div><button class="btn" id="save">Save settings</button></div></div></section>`);
    $('#save').onclick = () => {
      const v = {}; ['fee', 'eligibilityDays', 'requestHours', 'msgLimit', 'inviteDays'].forEach((k) => { v[k] = Math.max(0, +$('#' + k).value || 0); }); v.approvalForMemberInvites = $('#appr').checked;
      A.saveSettings(v); toast('Settings saved'); render();
    };
  }

  render();
})();
