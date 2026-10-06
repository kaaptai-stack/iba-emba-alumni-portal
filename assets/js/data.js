/* IBA Executive Alumni Forum — simulated backend.
 * All state lives in localStorage so the member app and the admin panel share it.
 * Swap the functions on `API` for real HTTP calls when the server is built;
 * the screens only talk to `API`, never to `state` directly. */
(function () {
  // Bump the key (not just `version`) when the data shape changes, so an old tab
  // still running previous code can never overwrite or reseed the new data.
  const KEY = 'iba-exec-forum-v2';
  try { localStorage.removeItem('iba-emba-portal-v1'); } catch (e) { /* storage blocked */ }
  const DAY = 86400000;

  const INDUSTRIES = [
    'Banking and financial services', 'Fintech and MFS', 'Telecom', 'FMCG', 'Textiles and RMG',
    'Pharmaceuticals', 'Energy and power', 'IT and software', 'Consulting', 'Manufacturing',
    'Real estate and construction', 'Logistics and shipping', 'Media and advertising',
    'Development sector and NGOs', 'Government and public sector', 'Education',
  ];
  const INDUSTRY_SHORT = {
    'Banking and financial services': 'Banking', 'Fintech and MFS': 'Fintech', 'Textiles and RMG': 'Textiles and RMG',
    'Real estate and construction': 'Real estate', 'Logistics and shipping': 'Logistics', 'Media and advertising': 'Media',
    'Development sector and NGOs': 'Development', 'Government and public sector': 'Government',
  };
  const FUNCTIONS = ['Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'IT', 'General mgmt'];
  const CITIES = ['Dhaka', 'Chattogram', 'Gazipur', 'Narayanganj', 'Sylhet', 'Khulna', 'Rajshahi', 'Barishal', 'Rangpur', 'Mymensingh', 'Cumilla'];
  const COUNTRIES = ['Bangladesh', 'Australia', 'Canada', 'Germany', 'India', 'Malaysia', 'Qatar', 'Saudi Arabia', 'Singapore', 'United Arab Emirates', 'United Kingdom', 'United States', 'Other'];
  const ABROAD = [['Toronto', 'Canada'], ['London', 'United Kingdom'], ['Dubai', 'United Arab Emirates'], ['Sydney', 'Australia'], ['Kuala Lumpur', 'Malaysia'], ['New York', 'United States']];
  const BLOOD = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // ---------- deterministic seed data ----------
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = rng(4021);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const chance = (p) => R() < p;

  const FIRST_M = ['Ahsan', 'Rakib', 'Imran', 'Shafiq', 'Faisal', 'Zahid', 'Mizanur', 'Habib', 'Rashed', 'Sohel', 'Tareq', 'Nayeem', 'Jubayer', 'Kawsar', 'Monir', 'Asif', 'Sabbir', 'Rezaul', 'Anisur', 'Fahim', 'Shakil', 'Murad', 'Rubel', 'Sajjad', 'Ehsan', 'Mostafa', 'Rafsan', 'Towhid', 'Shamim', 'Nazmul'];
  const FIRST_F = ['Nusrat', 'Tahmina', 'Sharmin', 'Farzana', 'Rumana', 'Shahida', 'Nasrin', 'Sabrina', 'Mehnaz', 'Ishrat', 'Fahmida', 'Lamia', 'Tasnim', 'Rokeya', 'Afsana', 'Sumaiya', 'Jannatul', 'Maliha', 'Nadia', 'Rubina'];
  const LAST = ['Rahman', 'Hossain', 'Islam', 'Ahmed', 'Chowdhury', 'Khan', 'Karim', 'Hasan', 'Uddin', 'Alam', 'Sultana', 'Begum', 'Akter', 'Siddiqui', 'Haque', 'Talukder', 'Mahmud', 'Sarker', 'Bhuiyan', 'Jahan', 'Kabir', 'Majumder'];
  const ORGS = {
    'Banking and financial services': ['Padma Bank', 'Surma Bank', 'Teesta Bank', 'Bangla Trust Bank', 'Meghna Capital', 'Jamuna Finance'],
    'Fintech and MFS': ['Nodi Pay', 'TakaKhata', 'Dhaka Pay', 'Bondhu Wallet'],
    Telecom: ['Karnaphuli Telecom Ltd', 'Shapla Mobile', 'Delta Towers'],
    FMCG: ['Sonar Foods', 'Rupali Consumer', 'Golden Harvest Beverages'],
    'Textiles and RMG': ['Jamuna Textiles', 'Ashulia Knit', 'Meghna Denim', 'Rupsha Apparels'],
    Pharmaceuticals: ['Sundarban Pharma', 'Shitalakshya Labs', 'Orion Healthcare'],
    'Energy and power': ['Bijoy Power', 'Kushiara Gas', 'Sunshine Solar'],
    'IT and software': ['Brain Station Labs', 'CodeNodi', 'Bengal Cloud'],
    Consulting: ['Lighthouse Advisory', 'Delta Partners BD', 'Matrix Consulting'],
    Manufacturing: ['Bengal Steel', 'Polymer Industries', 'Chattala Cement'],
    'Real estate and construction': ['Shanta Homes', 'Concord Builders', 'Navana Estates'],
    'Logistics and shipping': ['Karnaphuli Shipping', 'Bay Logistics', 'Swift Freight'],
    'Media and advertising': ['Ekattor Media', 'Red Dot Communications', 'Asiatic Ads'],
    'Development sector and NGOs': ['Shakti Foundation', 'Udoy Development', 'Prottasha'],
    'Government and public sector': ['Bangladesh Bank', 'Ministry of Commerce', 'BIDA'],
    Education: ['North Valley University', 'Dhaka School of Economics', 'Ideal College'],
  };
  const TITLES = {
    Marketing: ['Head of Marketing', 'Brand Manager', 'Marketing Director'], Sales: ['Head of Corporate Sales', 'Regional Sales Manager', 'Key Account Manager'],
    Finance: ['Chief Financial Officer', 'VP Treasury', 'Finance Manager', 'Risk Manager', 'Head of Audit'], HR: ['Head of HR', 'HR Business Partner', 'Talent Lead'],
    Operations: ['Head of Operations', 'Supply Chain Manager', 'Plant Manager'], IT: ['Chief Technology Officer', 'IT Manager', 'Head of Digital'],
    'General mgmt': ['Managing Director', 'Country Lead', 'General Manager', 'Deputy Managing Director'],
  };
  const EXPERTISE = {
    Marketing: ['Brand strategy', 'Digital marketing', 'Market research', 'Consumer insights'], Sales: ['B2B sales', 'Key accounts', 'Negotiation', 'Channel sales'],
    Finance: ['Corporate finance', 'Treasury', 'Audit', 'Risk management', 'Export finance'], HR: ['Talent acquisition', 'Compensation', 'Org design'],
    Operations: ['Supply chain', 'Lean', 'Procurement', 'Quality'], IT: ['ERP', 'Cloud', 'Cybersecurity', 'Data analytics'],
    'General mgmt': ['Strategy', 'P&L management', 'Business development', 'Startups'],
  };
  const INTERESTS = ['Travel', 'Book club', 'Cricket', 'Golf', 'Photography', 'Angel investing', 'Mentoring', 'Running', 'Cooking', 'Badminton'];

  function slugEmail(name, i) {
    const [f, l] = name.toLowerCase().split(' ');
    const dom = pick(['gmail.com', 'gmail.com', 'gmail.com', 'yahoo.com', 'outlook.com']);
    return `${f}.${l}${i % 3 === 0 ? '' : i % 97}@${dom}`;
  }
  function phone() { return `+880 1${pick(['711', '713', '819', '552', '670', '914', '755', '611'])}-${String(100000 + Math.floor(R() * 899999))}`; }
  function isoDaysAgo(d) { return new Date(Date.now() - d * DAY).toISOString(); }

  function baseMember(o) {
    return Object.assign({
      id: '', name: '', email: '', batch: 40, gradYear: 2019, country: 'Bangladesh', city: 'Dhaka', photo: null,
      designation: '', org: '', industry: '', func: '', expertise: [], bio: '', interests: [],
      whatsapp: '', phone: '', phoneSameAsWhatsapp: true, linkedin: '', facebook: '',
      blood: '', donor: false, showBlood: false, lastDonation: null,
      visible: { email: true, whatsapp: true, phone: false, linkedin: true, facebook: false },
      password: null, emailVerified: true, setupDone: true,
      paid: true, paidOn: null, txn: null, payVia: 'Bangla QR', paymentStatus: 'paid',
      registeredOn: isoDaysAgo(30), lastSignIn: null, enabled: true, disabledReason: '',
      approval: 'approved', paused: false, invitedBy: null, inviteChannel: 'Email', role: 'member',
      notify: { blood: true, announcements: true, messages: true },
    }, o);
  }

  function slug(name) { return name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''); }

  function genMember(i, overrides) {
    const female = chance(0.32);
    const name = overrides && overrides.name || `${pick(female ? FIRST_F : FIRST_M)} ${pick(LAST)}`;
    const industry = pick(INDUSTRIES);
    const func = pick(FUNCTIONS);
    const batch = 22 + Math.floor(R() * 24);
    const abroad = chance(0.08) ? pick(ABROAD) : null;
    const city = abroad ? abroad[0] : chance(0.72) ? 'Dhaka' : pick(CITIES);
    const country = abroad ? abroad[1] : 'Bangladesh';
    const regDays = Math.floor(R() * 120);
    const paid = chance(0.93);
    const wa = phone();
    const donor = chance(0.45);
    const exp = EXPERTISE[func].slice().sort(() => R() - 0.5).slice(0, 2 + Math.floor(R() * 2));
    return baseMember(Object.assign({
      id: slug(name) + '-' + i, name, email: slugEmail(name, i), batch, gradYear: 1990 + batch - 10 + Math.floor(R() * 2),
      country, city, designation: pick(TITLES[func]), org: pick(ORGS[industry]), industry, func,
      expertise: exp, bio: '', interests: chance(0.5) ? [pick(INTERESTS), pick(INTERESTS)].filter((v, k, a) => a.indexOf(v) === k) : [],
      whatsapp: wa, phone: wa, linkedin: chance(0.7) ? `linkedin.com/in/${slug(name).replace(/-/g, '')}` : '',
      visible: { email: true, whatsapp: chance(0.78), phone: chance(0.4), linkedin: true, facebook: false },
      blood: pick(BLOOD), donor, showBlood: donor && chance(0.5), lastDonation: donor && chance(0.4) ? isoDaysAgo(Math.floor(R() * 200)) : null,
      paid, paymentStatus: paid ? 'paid' : 'unpaid', paidOn: paid ? isoDaysAgo(Math.max(0, regDays - 1)) : null,
      txn: paid ? 'TXN' + Math.random().toString(36).slice(2, 11).toUpperCase() : null,
      registeredOn: isoDaysAgo(regDays), lastSignIn: isoDaysAgo(Math.floor(R() * 40)), invitedBy: 'admin',
      enabled: true,
    }, overrides || {}));
  }

  function seed() {
    const named = [
      { id: 'farhana-rahman', name: 'Farhana Rahman', email: 'farhana.rahman@gmail.com', batch: 38, gradYear: 2017, city: 'Dhaka', designation: 'Head of Retail Banking', org: 'Padma Bank', industry: 'Banking and financial services', func: 'General mgmt', expertise: ['Retail banking', 'Branch network', 'Digital channels'], interests: ['Travel', 'Book club'], bio: '18 years in retail and SME banking. Happy to help alumni exploring careers in banking.', whatsapp: '+880 1713-552211', phone: '+880 1713-552211', visible: { email: true, whatsapp: true, phone: true, linkedin: true, facebook: false }, linkedin: 'linkedin.com/in/farhanarahman', blood: 'A+', donor: true, showBlood: true, registeredOn: '2026-09-02T09:00:00Z', paidOn: '2026-09-02T09:20:00Z', invitedBy: 'admin', role: 'member', password: 'demo1234' },
      { id: 'tanvir-islam', name: 'Tanvir Islam', email: 'tanvir.islam@yahoo.com', batch: 41, gradYear: 2020, city: 'Gazipur', designation: 'Chief Financial Officer', org: 'Jamuna Textiles', industry: 'Textiles and RMG', func: 'Finance', expertise: ['Corporate finance', 'Export finance', 'Audit'], bio: 'Finance lead in export-oriented garments. Interested in startups and angel investing.', visible: { email: true, whatsapp: false, phone: false, linkedin: true, facebook: false }, linkedin: 'linkedin.com/in/tanvirislam', registeredOn: '2026-09-05T09:00:00Z', paidOn: '2026-09-05T10:00:00Z', blood: 'B+', donor: false },
      { id: 'sadia-karim', name: 'Sadia Karim', email: 'sadia.karim@gmail.com', batch: 35, gradYear: 2014, designation: 'Country Lead', org: 'Nodi Pay', industry: 'Fintech and MFS', func: 'General mgmt', expertise: ['Payments', 'Startups', 'Partnerships'], visible: { email: true, whatsapp: true, phone: false, linkedin: true, facebook: false }, registeredOn: '2026-09-03T09:00:00Z', paidOn: '2026-09-03T09:30:00Z' },
      { id: 'mahmud-hasan', name: 'Mahmud Hasan', email: 'mahmud.hasan@gmail.com', batch: 36, gradYear: 2015, designation: 'VP Treasury', org: 'Surma Bank', industry: 'Banking and financial services', func: 'Finance', expertise: ['Treasury', 'ALM', 'FX'], blood: 'O-', donor: true, lastDonation: isoDaysAgo(150), visible: { email: true, whatsapp: true, phone: true, linkedin: false, facebook: false } },
      { id: 'nazia-jahan', name: 'Nazia Jahan', email: 'nazia.jahan@outlook.com', batch: 40, gradYear: 2019, designation: 'Risk Manager', org: 'Teesta Bank', industry: 'Banking and financial services', func: 'Finance', expertise: ['Risk management', 'Basel III'], linkedin: 'linkedin.com/in/naziajahan', visible: { email: true, whatsapp: true, phone: false, linkedin: true, facebook: false } },
      { id: 'arif-rahman', name: 'Arif Rahman', email: 'arif.rahman@gmail.com', batch: 39, gradYear: 2018, designation: 'SME Head', org: 'Bangla Trust Bank', industry: 'Banking and financial services', func: 'Sales', expertise: ['SME lending', 'Credit'] },
      { id: 'nasir-uddin', name: 'Nasir Uddin', email: 'nasir.uddin@gmail.com', batch: 33, gradYear: 2012, designation: 'General Manager', org: 'Bay Logistics', industry: 'Logistics and shipping', func: 'Operations', blood: 'O-', donor: true, lastDonation: isoDaysAgo(30) },
      { id: 'shirin-akter', name: 'Shirin Akter', email: 'shirin.akter@gmail.com', batch: 37, gradYear: 2016, designation: 'Head of HR', org: 'Sonar Foods', industry: 'FMCG', func: 'HR', blood: 'O-', donor: true, visible: { email: true, whatsapp: true, phone: false, linkedin: true, facebook: false } },
      { id: 'kamrul-bashar', name: 'Kamrul Bashar', email: 'kamrul.bashar@yahoo.com', batch: 34, gradYear: 2013, designation: 'Deputy Managing Director', org: 'Meghna Capital', industry: 'Banking and financial services', func: 'General mgmt', blood: 'O-', donor: true, visible: { email: true, whatsapp: false, phone: true, linkedin: true, facebook: false } },
      { id: 'liza-chowdhury', name: 'Liza Chowdhury', email: 'liza.chowdhury@outlook.com', batch: 40, designation: 'Brand Manager', org: 'Rupali Consumer', industry: 'FMCG', func: 'Marketing', approval: 'pending', invitedBy: 'nazia-jahan', paid: false, paymentStatus: 'unpaid', paidOn: null, txn: null, registeredOn: '2026-10-01T08:00:00Z' },
      { id: 'imtiaz-ali', name: 'Imtiaz Ali', email: 'imtiaz.ali@gmail.com', batch: 44, designation: 'IT Manager', org: 'Bengal Cloud', industry: 'IT and software', func: 'IT', approval: 'pending', invitedBy: 'sadia-karim', paid: false, paymentStatus: 'failed', paidOn: null, txn: null, registeredOn: '2026-10-02T08:00:00Z' },
      { id: 'selina-parvin', name: 'Selina Parvin', email: 'selina.parvin@gmail.com', batch: 40, designation: 'Talent Lead', org: 'Shapla Mobile', industry: 'Telecom', func: 'HR', invitedBy: 'nazia-jahan', registeredOn: '2026-09-30T08:00:00Z' },
      { id: 'masud-rana', name: 'Masud Rana', email: 'masud.rana@yahoo.com', batch: 31, designation: 'Plant Manager', org: 'Bengal Steel', industry: 'Manufacturing', func: 'Operations', invitedBy: 'admin', paid: false, paymentStatus: 'unpaid', paidOn: null, txn: null, registeredOn: '2026-09-03T08:00:00Z' },
      { id: 'kamal-hossain', name: 'Kamal Hossain', email: 'kamal.h@gmail.com', batch: 29, designation: 'Managing Director', org: 'Navana Estates', industry: 'Real estate and construction', func: 'General mgmt', invitedBy: 'tariq-aziz', registeredOn: '2026-09-10T08:00:00Z', enabled: false, disabledReason: 'Reported for spam: bulk property promotions' },
      { id: 'tariq-aziz', name: 'Tariq Aziz', email: 'tariq.aziz@gmail.com', batch: 30, designation: 'Managing Director', org: 'Lighthouse Advisory', industry: 'Consulting', func: 'General mgmt' },
    ];
    const members = named.map((o, i) => genMember(i, o));
    const names = new Set(members.map((m) => m.name));
    for (let i = 0; members.length < 285; i++) { const m = genMember(100 + i); if (!names.has(m.name)) { names.add(m.name); members.push(m); } }
    // ensure some O- donors in Dhaka for the blood finder demo
    members.slice(20, 34).forEach((m, k) => { m.blood = 'O-'; m.donor = true; m.country = 'Bangladesh'; m.city = 'Dhaka'; if (k < 3) m.lastDonation = isoDaysAgo(20 + k * 10); });
    members.forEach((m) => {
      const reg = new Date(m.registeredOn).getTime();
      if (m.paidOn && new Date(m.paidOn).getTime() < reg) m.paidOn = new Date(reg + 20 * 60000).toISOString();
      if (m.lastSignIn && new Date(m.lastSignIn).getTime() < reg) m.lastSignIn = new Date(Math.min(Date.now(), reg + 3 * DAY)).toISOString();
    });
    members.forEach((m) => { if (m.paid && !m.txn) m.txn = 'TXN' + Math.random().toString(36).slice(2, 11).toUpperCase(); if (m.paid && !m.paidOn) m.paidOn = m.registeredOn; });

    const audit = [
      { at: isoDaysAgo(1), actor: 'Admin', action: 'Disabled account', target: 'Kamal Hossain', detail: 'Reported for spam: bulk property promotions' },
      { at: isoDaysAgo(4), actor: 'Admin', action: 'Sent bulk invite', target: '1,000 addresses', detail: '' },
      { at: isoDaysAgo(11), actor: 'Admin', action: 'Sent bulk invite', target: '418 addresses', detail: '' },
      { at: isoDaysAgo(33), actor: 'Admin', action: 'Uploaded founding members', target: '120 members', detail: 'CSV' },
    ];
    return {
      version: 2,
      members,
      invites: [
        { code: 'K7F2Q9', email: 'rafiq.ahmed@gmail.com', name: 'Rafiq Ahmed', invitedBy: 'farhana-rahman', note: 'Rafiq bhai, we are all joining here. Easy to find batchmates and blood donors. See you inside!', channel: 'WhatsApp', createdAt: isoDaysAgo(0), expiresAt: isoDaysAgo(-30), status: 'sent', batch: 40 },
      ],
      bulkInvites: [
        { id: 'b2', at: '2026-10-01T09:00:00Z', sent: 1000, opened: 612, joined: 268 },
        { id: 'b1', at: '2026-09-24T09:00:00Z', sent: 418, opened: 371, joined: 244 },
      ],
      bloodRequests: [
        { id: 'br-seed', by: 'arif-rahman', group: 'B+', units: 1, hospital: 'Square Hospital', city: 'Dhaka', contact: '+880 1711-908070', neededBy: new Date(Date.now() + 8 * 3600000).toISOString(), createdAt: isoDaysAgo(0.1), status: 'open', notified: 9, offers: [] },
      ],
      messages: [],
      reports: [
        { id: 'rp1', target: 'kamal-hossain', by: 'nazia-jahan', reason: 'Spam', note: 'Sending property promotions to members', at: isoDaysAgo(2), status: 'open' },
        { id: 'rp2', target: 'masud-rana', by: 'sadia-karim', reason: 'Wrong batch', note: 'Listed as EMBA 31, I think 32', at: isoDaysAgo(1), status: 'open' },
      ],
      notifications: [],
      announcements: [
        { id: 'an1', title: 'Annual reunion on 14 November', body: 'Save the date: the EMBA alumni reunion will be held at the IBA auditorium on 14 November 2026, 6 PM onwards.', at: isoDaysAgo(3), sent: 1190 },
      ],
      audit,
      groups: seedGroups(),
      settings: { fee: 200, eligibilityDays: 90, msgLimit: 20, inviteDays: 30, requestHours: 72, approvalForMemberInvites: true },
      session: null,
      admin: { email: 'admin@ibaexecutivemba.com', password: 'admin1234', signedIn: false },
    };
  }

  // ---------- community groups ----------
  const PLATFORMS = {
    whatsapp: { label: 'WhatsApp', match: /(chat\.whatsapp\.com|wa\.me|whatsapp\.com)/ },
    facebook: { label: 'Facebook', match: /(facebook\.com|fb\.com|fb\.me)/ },
    messenger: { label: 'Messenger', match: /(m\.me|messenger\.com)/ },
    telegram: { label: 'Telegram', match: /(t\.me|telegram\.me|telegram\.org)/ },
    linkedin: { label: 'LinkedIn', match: /linkedin\.com/ },
    viber: { label: 'Viber', match: /(viber\.com|vb\.me|invite\.viber)/ },
    signal: { label: 'Signal', match: /signal\.(group|me|org)/ },
    discord: { label: 'Discord', match: /(discord\.gg|discord\.com)/ },
    website: { label: 'Website', match: /./ },
  };
  function detectPlatform(url) {
    const u = String(url).toLowerCase();
    return Object.keys(PLATFORMS).find((k) => k !== 'website' && PLATFORMS[k].match.test(u)) || 'website';
  }
  /** Only plain web links are allowed, so a group link can never run script. */
  function cleanUrl(url) {
    let u = String(url || '').trim();
    if (!u) throw new Error('Add the group link.');
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
    let parsed; try { parsed = new URL(u); } catch (e) { throw new Error('That link does not look right.'); }
    if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname.includes('.')) throw new Error('Use a web link starting with https://');
    return parsed.href;
  }
  function seedGroups() {
    const g = (id, name, platform, url, description, status, days) => ({ id, name, platform, url, description, status, createdAt: isoDaysAgo(days), createdBy: 'Admin' });
    return [
      g('g-all', 'IBA EMBA Alumni · all batches', 'whatsapp', 'https://chat.whatsapp.com/IBAEMBAalumniSample', 'Main community for announcements and quick help.', 'active', 60),
      g('g-fb', 'IBA EMBA Alumni Network', 'facebook', 'https://www.facebook.com/groups/ibaembaalumni.sample', 'Photos, events and long-form posts.', 'active', 58),
      g('g-blood', 'EMBA Blood Donors', 'whatsapp', 'https://chat.whatsapp.com/EMBABloodDonorsSample', 'For urgent blood requests. Please keep it on-topic.', 'active', 40),
      g('g-li', 'IBA EMBA Professionals', 'linkedin', 'https://www.linkedin.com/groups/0000000-sample/', 'Jobs, hiring and career moves.', 'active', 35),
      g('g-tg', 'EMBA Sports and Golf', 'telegram', 'https://t.me/embasportssample', 'Cricket, golf and badminton meet-ups.', 'disabled', 20),
      g('g-reunion', 'Reunion 2026 volunteers', 'messenger', 'https://m.me/j/reunion2026sample', 'Organising team for the November reunion.', 'hidden', 5),
    ];
  }

  // ---------- persistence ----------
  let state;
  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
    if (!state || state.version !== 2) { state = seed(); save(); }
    if (!state.groups) { state.groups = seedGroups(); save(); } // data saved before groups existed
    return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota or private mode */ } }
  window.addEventListener('storage', (e) => { if (e.key === KEY) { load(); window.dispatchEvent(new Event('portal:sync')); } });
  load();

  // ---------- helpers ----------
  const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 9);
  const byId = (id) => state.members.find((m) => m.id === id);
  const byEmail = (e) => state.members.find((m) => m.email.toLowerCase() === String(e).trim().toLowerCase());
  function audit(action, target, detail, actor) { state.audit.unshift({ at: new Date().toISOString(), actor: actor || 'Admin', action, target, detail: detail || '' }); }
  function notify(memberId, n) { state.notifications.unshift(Object.assign({ id: uid('n'), to: memberId, at: new Date().toISOString(), read: false }, n)); }
  function eligible(m) { return !m.lastDonation || (Date.now() - new Date(m.lastDonation).getTime()) > state.settings.eligibilityDays * DAY; }
  function listed(m) { return m.enabled && !m.paused && m.approval === 'approved' && m.paid; }

  /** What other members are allowed to see. Hidden fields are removed here, the
   *  equivalent of the server never sending them to the browser. */
  function publicView(m) {
    if (!m) return null;
    const v = m.visible;
    const out = {
      id: m.id, name: m.name, batch: m.batch, gradYear: m.gradYear, country: m.country, city: m.city, photo: m.photo,
      designation: m.designation, org: m.org, industry: m.industry, func: m.func, expertise: m.expertise.slice(),
      bio: m.bio, interests: m.interests.slice(), registeredOn: m.registeredOn, donor: m.donor,
      canEmail: true, hidden: [],
    };
    if (v.email) out.email = m.email; else out.hidden.push('email address');
    if (v.whatsapp && m.whatsapp) out.whatsapp = m.whatsapp; else if (m.whatsapp) out.hidden.push('WhatsApp');
    const ph = m.phoneSameAsWhatsapp ? m.whatsapp : m.phone;
    if (v.phone && ph) out.phone = ph; else if (ph) out.hidden.push('phone for calls');
    if (v.linkedin && m.linkedin) out.linkedin = m.linkedin; else if (m.linkedin) out.hidden.push('LinkedIn');
    if (v.facebook && m.facebook) out.facebook = m.facebook; else if (m.facebook) out.hidden.push('Facebook');
    if (m.showBlood && m.blood) out.blood = m.blood; else if (m.blood) out.hidden.push('blood group');
    return out;
  }
  /** Donor card: blood group and eligibility, never the donation date. */
  function donorView(m) { const p = publicView(m); p.blood = m.blood; p.eligible = eligible(m); return p; }

  // ---------- fuzzy search ----------
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) { dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1); }
    return dp[a.length][b.length];
  }
  function matchScore(m, q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return 1;
    const hay = [m.name, m.org, m.designation, m.industry, ...m.expertise, 'emba ' + m.batch].join(' ').toLowerCase();
    const words = hay.split(/[^a-z0-9&+]+/).filter(Boolean);
    let score = 0;
    for (const t of terms) {
      if (hay.includes(t)) { score += 3; continue; }
      const tol = t.length >= 7 ? 2 : t.length >= 4 ? 1 : 0;
      if (tol && words.some((w) => lev(t, w.slice(0, t.length + 1)) <= tol || lev(t, w) <= tol)) { score += 1; continue; }
      return 0;
    }
    return score;
  }

  // ---------- API ----------
  const API = {
    INDUSTRIES, INDUSTRY_SHORT, FUNCTIONS, CITIES, COUNTRIES, BLOOD,
    place(m) { return !m.country || m.country === 'Bangladesh' ? m.city : `${m.city ? m.city + ', ' : ''}${m.country}`; },
    get settings() { return state.settings; },
    reset() { state = seed(); save(); },
    reload: load,

    // session
    me() { return state.session ? byId(state.session) : null; },
    signIn(email, password) {
      if (String(email).trim().toLowerCase() === state.admin.email) { const e = new Error('This is the admin account. Sign in on the admin panel instead.'); e.code = 'admin'; throw e; }
      const m = byEmail(email);
      if (!m || m.password !== String(password).trim()) throw new Error('Email or password is incorrect.');
      if (!m.enabled) throw new Error('This account has been turned off by the alumni committee.');
      m.lastSignIn = new Date().toISOString(); state.session = m.id; save(); return m;
    },
    signOut() { state.session = null; save(); },

    // invites & joining
    invite(code) {
      const inv = state.invites.find((i) => i.code === String(code).toUpperCase());
      if (!inv) return null;
      return Object.assign({}, inv, { inviter: inv.invitedBy === 'admin' ? null : publicView(byId(inv.invitedBy)), expired: new Date(inv.expiresAt) < new Date() });
    },
    sendCode(code) {
      const inv = state.invites.find((i) => i.code === code);
      inv.otp = String(Math.floor(100000 + Math.random() * 900000)); inv.otpAt = Date.now(); inv.status = inv.status === 'sent' ? 'opened' : inv.status; save();
      return inv.otp; // in production this goes by email only
    },
    verifyCode(code, otp) {
      const inv = state.invites.find((i) => i.code === code);
      if (!inv || String(otp).trim() !== inv.otp) throw new Error('That code is not right. Check the latest email and try again.');
      inv.verified = true; save();
    },
    createAccount(code, password) {
      const inv = state.invites.find((i) => i.code === code);
      if (!inv || !inv.verified) throw new Error('Please confirm your email first.');
      if (byEmail(inv.email)) throw new Error('An account already exists for this email. Sign in instead.');
      const name = inv.name && inv.name.length > 1 ? inv.name : '';
      const id = slug(name || inv.email.split('@')[0]) + '-' + Math.random().toString(36).slice(2, 5);
      const m = baseMember({
        id, name, email: inv.email, batch: inv.batch || 40, city: 'Dhaka', password: password, setupDone: false,
        paid: false, paymentStatus: 'unpaid', paidOn: null, txn: null, registeredOn: new Date().toISOString(), lastSignIn: new Date().toISOString(),
        invitedBy: inv.invitedBy, inviteChannel: inv.channel, approval: inv.invitedBy !== 'admin' && state.settings.approvalForMemberInvites ? 'pending' : 'approved',
        visible: { email: true, whatsapp: true, phone: false, linkedin: true, facebook: false },
      });
      state.members.push(m); inv.status = 'joined'; inv.joinedAt = new Date().toISOString(); state.session = m.id;
      if (inv.invitedBy !== 'admin') notify(inv.invitedBy, { kind: 'joined', text: `${m.name || m.email} joined the portal from your invite.` });
      audit('Created account', m.name || m.email, 'Invited by ' + (inv.invitedBy === 'admin' ? 'admin' : byId(inv.invitedBy).name), 'System');
      save(); return m;
    },
    myInvites() { const me = API.me(); return state.invites.filter((i) => i.invitedBy === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
    createInvite({ email, name, note, channel, batch }, by) {
      email = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) throw new Error('Enter a valid email address.');
      if (byEmail(email)) throw new Error('This person is already a member.');
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const inv = { code, email, name: name || '', note: note || '', channel: channel || 'Email', invitedBy: by || API.me().id, batch: batch || null, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + state.settings.inviteDays * DAY).toISOString(), status: 'sent' };
      state.invites.push(inv); save(); return inv;
    },

    // profile
    updateMe(patch) { const m = API.me(); Object.assign(m, patch); save(); return m; },
    completeness(m) {
      const checks = [['photo', !!m.photo], ['name', !!m.name], ['designation', !!m.designation], ['organisation', !!m.org], ['industry', !!m.industry], ['expertise', m.expertise.length > 0], ['WhatsApp number', !!m.whatsapp], ['LinkedIn', !!m.linkedin], ['blood group', !!m.blood], ['short bio', !!m.bio], ['interests', m.interests.length > 0]];
      const done = checks.filter((c) => c[1]).length;
      const missing = checks.filter((c) => !c[1]).map((c) => c[0]);
      return { pct: Math.round((done / checks.length) * 100 / 5) * 5, missing };
    },

    // payment
    startPayment() {
      const m = API.me(); const ref = `IBA-${m.batch}-${String(state.members.indexOf(m) + 1).padStart(4, '0')}`;
      m.payRef = ref; m.payExpires = Date.now() + 10 * 60000; save();
      return { ref, amount: state.settings.fee, expires: m.payExpires, payload: `00020101021226380010bd.bangla0118IBAEXECALUMNI${ref}5204829953030505406${state.settings.fee}.005802BD5926IBA EXECUTIVE ALUMNI FORUM6005DHAKA62${String(ref.length + 4).padStart(2, '0')}05${String(ref.length).padStart(2, '0')}${ref}6304` };
    },
    /** Called by the payment gateway webhook in production. */
    confirmPayment(memberId, via, manual) {
      const m = byId(memberId);
      m.paid = true; m.paymentStatus = 'paid'; m.paidOn = new Date().toISOString(); m.payVia = via || 'Bangla QR';
      m.txn = manual ? 'MANUAL-' + Math.random().toString(36).slice(2, 7).toUpperCase() : 'TXN' + Math.random().toString(36).slice(2, 11).toUpperCase();
      if (manual) audit('Marked as paid manually', m.name, via);
      save(); return m;
    },

    // directory
    search({ q = '', batches = null, industries = [], cities = [], reach = [], sort = 'name', isNew = false } = {}) {
      const me = API.me();
      let list = state.members.filter((m) => listed(m) && (!me || m.id !== me.id));
      if (isNew) list = list.filter((m) => Date.now() - new Date(m.registeredOn) < 30 * DAY);
      if (batches) list = list.filter((m) => m.batch >= batches[0] && m.batch <= batches[1]);
      if (industries.length) list = list.filter((m) => industries.includes(m.industry));
      if (cities.length) list = list.filter((m) => {
        const bd = !m.country || m.country === 'Bangladesh';
        return (bd && cities.includes(m.city)) || (!bd && cities.includes('Abroad')) || (bd && cities.includes('More') && !['Dhaka', 'Chattogram'].includes(m.city));
      });
      if (reach.includes('WhatsApp')) list = list.filter((m) => m.visible.whatsapp && m.whatsapp);
      if (reach.includes('Phone')) list = list.filter((m) => m.visible.phone && (m.phone || m.whatsapp));
      let scored = list.map((m) => [m, matchScore(m, q)]).filter((x) => x[1] > 0);
      if (q) scored.sort((a, b) => b[1] - a[1]);
      if (sort === 'recent') scored.sort((a, b) => b[0].registeredOn.localeCompare(a[0].registeredOn));
      else if (sort === 'batch') scored.sort((a, b) => b[0].batch - a[0].batch || a[0].name.localeCompare(b[0].name));
      else if (!q) scored.sort((a, b) => a[0].name.localeCompare(b[0].name));
      return scored.map((x) => publicView(x[0]));
    },
    stats() {
      const L = state.members.filter(listed);
      const batches = {}; const inds = {};
      L.forEach((m) => { batches[m.batch] = (batches[m.batch] || 0) + 1; inds[m.industry] = (inds[m.industry] || 0) + 1; });
      return { total: L.length, batches, industries: inds, newThisMonth: L.filter((m) => Date.now() - new Date(m.registeredOn) < 30 * DAY).length };
    },
    member(id) { const m = byId(id); return m && (listed(m) || (API.me() && API.me().id === id)) ? publicView(m) : null; },
    previewMe() { return publicView(API.me()); },

    // messaging
    messagesLeft() { const me = API.me(); const today = new Date().toDateString(); return state.settings.msgLimit - state.messages.filter((x) => x.from === me.id && new Date(x.at).toDateString() === today).length; },
    sendMessage(to, subject, body) {
      if (API.messagesLeft() <= 0) throw new Error('You have reached today\'s message limit.');
      if (!subject.trim() || !body.trim()) throw new Error('Add a subject and a message.');
      const me = API.me();
      state.messages.push({ id: uid('msg'), from: me.id, to, subject, body, at: new Date().toISOString() });
      notify(to, { kind: 'message', text: `${me.name} sent you a portal email: “${subject}”` });
      save();
    },
    report(target, reason, note) {
      state.reports.unshift({ id: uid('rp'), target, by: API.me().id, reason, note, at: new Date().toISOString(), status: 'open' }); save();
    },

    // blood
    donors({ group, city }) {
      const me = API.me();
      return state.members.filter((m) => listed(m) && m.donor && m.blood === group && (!city || m.city === city) && (!me || m.id !== me.id))
        .map(donorView).sort((a, b) => (b.eligible - a.eligible) || a.name.localeCompare(b.name));
    },
    eligibleCount(group, city) { const me = API.me(); return state.members.filter((m) => listed(m) && m.donor && m.blood === group && m.city === city && eligible(m) && m.id !== (me && me.id)).length; },
    openRequestsFor(m) { return state.bloodRequests.filter((r) => r.status === 'open' && r.by !== m.id && (r.city === m.city)).map(API._req); },
    _req(r) { if (r.status === 'open' && Date.now() - new Date(r.createdAt) > state.settings.requestHours * 3600000) { r.status = 'closed'; save(); } return r; },
    request(id) { const r = state.bloodRequests.find((x) => x.id === id); return r ? API._req(r) : null; },
    myRequests() { const me = API.me(); return state.bloodRequests.filter((r) => r.by === me.id).map(API._req); },
    createRequest(d) {
      const me = API.me();
      if (!d.hospital.trim() || !d.contact.trim()) throw new Error('Add the hospital and a contact number.');
      const targets = state.members.filter((m) => listed(m) && m.donor && m.blood === d.group && m.city === d.city && eligible(m) && m.id !== me.id);
      const r = Object.assign({ id: uid('br'), by: me.id, createdAt: new Date().toISOString(), status: 'open', notified: targets.length, offers: [] }, d);
      state.bloodRequests.unshift(r);
      targets.forEach((t) => notify(t.id, { kind: 'blood', ref: r.id, text: `Urgent: ${d.group} blood needed at ${d.hospital}, ${d.units} unit${d.units > 1 ? 's' : ''}.` }));
      save(); return r;
    },
    offer(reqId) {
      const r = state.bloodRequests.find((x) => x.id === reqId); const me = API.me();
      if (!r.offers.find((o) => o.by === me.id)) { r.offers.push({ by: me.id, at: new Date().toISOString() }); notify(r.by, { kind: 'blood', ref: r.id, text: `${me.name} offered to donate ${r.group}.` }); save(); }
    },
    /** Demo only: simulates donors tapping “I can donate” from their alert. */
    simulateOffer(reqId) {
      const r = state.bloodRequests.find((x) => x.id === reqId); if (!r || r.status !== 'open') return false;
      const pool = state.members.filter((m) => listed(m) && m.donor && m.blood === r.group && m.city === r.city && eligible(m) && m.id !== r.by && !r.offers.find((o) => o.by === m.id));
      if (!pool.length) return false;
      r.offers.push({ by: pool[Math.floor(Math.random() * pool.length)].id, at: new Date().toISOString() }); save(); return true;
    },
    offerer(id) { const m = byId(id); return m ? publicView(m) : null; },
    fulfil(reqId) { const r = state.bloodRequests.find((x) => x.id === reqId); r.status = 'fulfilled'; r.closedAt = new Date().toISOString(); save(); },
    recordDonation(date) { API.me().lastDonation = date; save(); },

    // notifications
    notifications() { const me = API.me(); return state.notifications.filter((n) => n.to === me.id); },
    markRead() { const me = API.me(); state.notifications.forEach((n) => { if (n.to === me.id) n.read = true; }); save(); },
    announcements() { return state.announcements; },

    // community groups: members never receive hidden groups, or links of disabled ones
    PLATFORMS, detectPlatform,
    groups() { return state.groups.filter((g) => g.status !== 'hidden').map((g) => Object.assign({}, g, { url: g.status === 'active' ? g.url : null })); },

    exportMyData() {
      const me = API.me();
      const copy = Object.assign({}, me); delete copy.password;
      return { profile: copy, invitesSent: API.myInvites(), messagesSent: state.messages.filter((x) => x.from === me.id), bloodRequests: API.myRequests(), exportedAt: new Date().toISOString() };
    },
    deleteAccount() { const me = API.me(); state.members = state.members.filter((m) => m.id !== me.id); audit('Deleted own account', me.name, '', me.name); state.session = null; save(); },

    // ---------- admin ----------
    admin: {
      signedIn() { return state.admin.signedIn; },
      signIn(email, pw) {
        const e = String(email).trim().toLowerCase();
        if (e !== state.admin.email) throw new Error(byEmail(e) ? 'That is a member account. Use the admin email to sign in here.' : 'Email or password is incorrect.');
        if (String(pw).trim() !== state.admin.password) throw new Error('Email or password is incorrect. Your browser may have filled in a saved member password.');
        state.admin.signedIn = true; save();
      },
      signOut() { state.admin.signedIn = false; save(); },
      members() { return state.members; },
      member: byId,
      invites() { return state.invites; },
      bulkInvites() { return state.bulkInvites; },
      reports() { return state.reports; },
      audit() { return state.audit; },
      announcements() { return state.announcements; },
      requests() { return state.bloodRequests.map(API._req); },
      dashboard() {
        const M = state.members; const sent = state.invites.length + state.bulkInvites.reduce((s, b) => s + b.sent, 0);
        const joined = state.invites.filter((i) => i.status === 'joined').length + state.bulkInvites.reduce((s, b) => s + b.joined, 0);
        const active = M.filter((m) => m.lastSignIn && Date.now() - new Date(m.lastSignIn) < 30 * DAY).length;
        const paid = M.filter((m) => m.paid).length;
        const req = state.bloodRequests.map(API._req);
        return {
          total: M.length, newMonth: M.filter((m) => Date.now() - new Date(m.registeredOn) < 30 * DAY).length,
          sent, joined, acceptance: sent ? Math.round(joined / sent * 100) : 0, active, activePct: Math.round(active / M.length * 100),
          fees: paid * state.settings.fee, paid, unpaid: M.length - paid,
          reqTotal: req.filter((r) => r.status !== 'open').length, reqFulfilled: req.filter((r) => r.status === 'fulfilled').length, reqOpen: req.filter((r) => r.status === 'open').length,
          pending: M.filter((m) => m.approval === 'pending').length, openReports: state.reports.filter((r) => r.status === 'open').length,
          disabled: M.filter((m) => !m.enabled).length,
        };
      },
      approve(id) { const m = byId(id); m.approval = 'approved'; notify(m.id, { kind: 'approved', text: 'The alumni committee approved your membership. You are now listed in the directory.' }); audit('Approved member', m.name); save(); },
      reject(id) { const m = byId(id); m.approval = 'rejected'; m.enabled = false; m.disabledReason = 'Membership not approved'; audit('Rejected member', m.name); save(); },
      setEnabled(id, on, reason) {
        const m = byId(id);
        if (!on && !String(reason || '').trim()) throw new Error('A reason is required to disable an account.');
        m.enabled = on; m.disabledReason = on ? '' : reason;
        if (!on && state.session === id) state.session = null;
        audit(on ? 'Enabled account' : 'Disabled account', m.name, on ? '' : reason); save();
      },
      resolveReport(id, outcome) { const r = state.reports.find((x) => x.id === id); r.status = outcome; audit('Report ' + outcome, byId(r.target) ? byId(r.target).name : r.target, r.reason); save(); },
      markPaid(id, via) { API.confirmPayment(id, via, true); },
      resendReceipt(id) { audit('Resent receipt', byId(id).name); save(); },
      checkInvites(text) {
        const raw = text.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
        const seen = new Set(); const out = { total: raw.length, ready: [], members: [], dupes: [], invalid: [] };
        const typo = /@((gmial|gmal|gamil|gnail|yaho|yahooo|yhoo|hotmial|outlok)\.|gmail\.co$|yahoo\.co$)/;
        raw.forEach((e) => {
          if (seen.has(e)) { out.dupes.push(e); return; } seen.add(e);
          if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) || typo.test(e)) { out.invalid.push(e); return; }
          if (byEmail(e)) { out.members.push(e); return; }
          out.ready.push(e);
        });
        return out;
      },
      sendBulk(emails, batch) {
        emails.forEach((e) => { const inv = API.createInvite({ email: e, channel: 'Email', batch }, 'admin'); inv.bulk = true; });
        const b = { id: uid('b'), at: new Date().toISOString(), sent: emails.length, opened: 0, joined: 0 };
        state.bulkInvites.unshift(b); audit('Sent bulk invite', emails.length.toLocaleString('en-IN') + ' addresses', batch ? 'EMBA ' + batch : 'Mixed batches'); save(); return b;
      },
      uploadFounding(rows) {
        let added = 0;
        // Founding members get a personal invite; their account is pre-approved.
        rows.forEach((r) => { try { const inv = API.createInvite({ email: r.email, name: r.name, channel: 'Admin upload', batch: +r.batch || null }, 'admin'); inv.founding = true; added++; } catch (e) { /* already a member or invalid */ } });
        audit('Uploaded founding members', added + ' members', 'CSV'); save(); return added;
      },
      announce(title, body) {
        const recipients = state.members.filter((m) => m.enabled && m.notify.announcements);
        state.announcements.unshift({ id: uid('an'), title, body, at: new Date().toISOString(), sent: recipients.length });
        recipients.forEach((m) => notify(m.id, { kind: 'announcement', text: title }));
        audit('Sent announcement', title, recipients.length + ' recipients'); save();
      },
      groups() { return state.groups; },
      saveGroup(d) {
        const name = String(d.name || '').trim(); if (!name) throw new Error('Add the group name.');
        const url = cleanUrl(d.url); const platform = PLATFORMS[d.platform] ? d.platform : detectPlatform(url);
        const fields = { name, url, platform, description: String(d.description || '').trim() };
        if (d.id) { Object.assign(state.groups.find((g) => g.id === d.id), fields); audit('Edited group', name); }
        else { state.groups.push(Object.assign({ id: uid('g'), status: d.status || 'active', createdAt: new Date().toISOString(), createdBy: 'Admin' }, fields)); audit('Added group', name, PLATFORMS[platform].label); }
        save();
      },
      setGroupStatus(id, status) { const g = state.groups.find((x) => x.id === id); g.status = status; audit({ active: 'Enabled group', disabled: 'Disabled group', hidden: 'Hid group' }[status], g.name); save(); },
      moveGroup(id, dir) { const i = state.groups.findIndex((x) => x.id === id); const j = i + dir; if (j < 0 || j >= state.groups.length) return; [state.groups[i], state.groups[j]] = [state.groups[j], state.groups[i]]; save(); },
      deleteGroup(id) { const g = state.groups.find((x) => x.id === id); state.groups = state.groups.filter((x) => x.id !== id); audit('Deleted group', g.name); save(); },
      saveSettings(s) { Object.assign(state.settings, s); audit('Changed settings', 'Portal settings', Object.keys(s).join(', ')); save(); },
      reset() { API.reset(); },
    },
    _save: save,
  };
  window.API = API;
})();
