'use strict';

// ── Config & Auth ─────────────────────────────────────────────
const API      = '';
const role     = sessionStorage.getItem('role');
const username = sessionStorage.getItem('username');
if (!role) window.location.href = 'login.html';

// ── State ─────────────────────────────────────────────────────
let allComplaints    = [];
let selectedPriority = 'Medium';
let selectedFile     = null;
let chartStatus = null, chartPriority = null, chartTrend = null,
    chartCategory = null, chartPriority2 = null;

// ── Mock data (offline fallback) ──────────────────────────────
const MOCK = {
  stats: { total:12, pending:4, in_progress:4, resolved:4, high_priority:4, medium_priority:5, low_priority:3 },
  complaints: [
    { complaint_id:1,  student_name:'Alice Smith',   dept_name:'Computer Science',       category_name:'IT / Network', description:'Lab PC not working.',               priority:'High',   status:'Pending',     date_filed:'2025-04-22' },
    { complaint_id:2,  student_name:'Bob Jones',     dept_name:'Electrical Engineering', category_name:'Equipment',    description:'Projector issue in classroom.',      priority:'Medium', status:'In Progress', date_filed:'2025-04-23' },
    { complaint_id:3,  student_name:'Charlie Brown', dept_name:'Computer Science',       category_name:'IT / Network', description:'Internet connectivity problem.',     priority:'High',   status:'Resolved',    date_filed:'2025-04-23' },
    { complaint_id:4,  student_name:'Rahul Sharma',  dept_name:'Computer Science',       category_name:'IT / Network', description:'WiFi not working in hostel.',        priority:'Medium', status:'Pending',     date_filed:'2025-04-24' },
    { complaint_id:5,  student_name:'Priya Verma',   dept_name:'Electrical Engineering', category_name:'Equipment',    description:'Electrical lab equipment damaged.',  priority:'High',   status:'In Progress', date_filed:'2025-04-24' },
    { complaint_id:6,  student_name:'Aman Gupta',    dept_name:'Mechanical Engineering', category_name:'Equipment',    description:'Workshop machines need maintenance.',priority:'Low',    status:'Resolved',    date_filed:'2025-04-25' },
    { complaint_id:7,  student_name:'Sneha Reddy',   dept_name:'Civil Engineering',      category_name:'Safety',       description:'Water leakage in civil block.',      priority:'High',   status:'Pending',     date_filed:'2025-04-25' },
    { complaint_id:8,  student_name:'Arjun Patel',   dept_name:'Computer Science',       category_name:'Academic',     description:'Classroom AC not functioning.',      priority:'Medium', status:'In Progress', date_filed:'2025-04-26' },
    { complaint_id:9,  student_name:'Neha Singh',    dept_name:'Electrical Engineering', category_name:'Equipment',    description:'Power outage during lectures.',      priority:'High',   status:'Resolved',    date_filed:'2025-04-26' },
    { complaint_id:10, student_name:'Rahul Sharma',  dept_name:'Electrical Engineering', category_name:'Equipment',    description:'Broken switchboard in lab.',         priority:'Medium', status:'Resolved',    date_filed:'2025-04-27' },
    { complaint_id:11, student_name:'Priya Verma',   dept_name:'Computer Science',       category_name:'IT / Network', description:'System software outdated.',          priority:'Low',    status:'In Progress', date_filed:'2025-04-27' },
    { complaint_id:12, student_name:'Aman Gupta',    dept_name:'Mechanical Engineering', category_name:'Safety',       description:'Noise disturbance near workshop.',   priority:'Low',    status:'Pending',     date_filed:'2025-04-28' },
  ],
  students: [
    { student_id:1, name:'Alice Smith',   email:'alice@example.com',   total_complaints:1, pending:1, resolved:0, in_progress:0 },
    { student_id:2, name:'Bob Jones',     email:'bob@example.com',     total_complaints:1, pending:0, resolved:0, in_progress:1 },
    { student_id:3, name:'Charlie Brown', email:'charlie@example.com', total_complaints:1, pending:0, resolved:1, in_progress:0 },
    { student_id:4, name:'Rahul Sharma',  email:'rahul@example.com',   total_complaints:2, pending:1, resolved:1, in_progress:0 },
    { student_id:5, name:'Priya Verma',   email:'priya@example.com',   total_complaints:2, pending:0, resolved:0, in_progress:2 },
    { student_id:6, name:'Aman Gupta',    email:'aman@example.com',    total_complaints:2, pending:1, resolved:1, in_progress:0 },
    { student_id:7, name:'Sneha Reddy',   email:'sneha@example.com',   total_complaints:1, pending:1, resolved:0, in_progress:0 },
    { student_id:8, name:'Arjun Patel',   email:'arjun@example.com',   total_complaints:1, pending:0, resolved:0, in_progress:1 },
    { student_id:9, name:'Neha Singh',    email:'neha@example.com',    total_complaints:1, pending:0, resolved:1, in_progress:0 },
  ],
  analytics: {
    byDept: [
      { dept_name:'Computer Science',       total:5, resolved:1, pending:2, in_progress:2 },
      { dept_name:'Electrical Engineering', total:4, resolved:2, pending:1, in_progress:1 },
      { dept_name:'Mechanical Engineering', total:2, resolved:1, pending:1, in_progress:0 },
      { dept_name:'Civil Engineering',      total:1, resolved:0, pending:1, in_progress:0 },
    ],
    byCategory: [
      { category_name:'IT / Network', total:4 },
      { category_name:'Equipment',    total:4 },
      { category_name:'Safety',       total:2 },
      { category_name:'Academic',     total:1 },
      { category_name:'Other',        total:1 },
    ],
    trend: Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(13-i));return{day:d.toISOString().split('T')[0],total:Math.floor(Math.random()*3)+(i>9?2:0)}}),
    resolutionRate: [{ rate: 33.3 }]
  },
  auditLog: [
    { log_id:1, complaint_id:2, action:'Status Changed',   performed_by:'mahan',       old_value:'Pending',     new_value:'In Progress', timestamp:new Date(Date.now()-7200000).toISOString() },
    { log_id:2, complaint_id:3, action:'Status Changed',   performed_by:'mahan',       old_value:'In Progress', new_value:'Resolved',    timestamp:new Date(Date.now()-14400000).toISOString() },
    { log_id:3, complaint_id:5, action:'Priority Changed', performed_by:'mahan',       old_value:'Medium',      new_value:'High',        timestamp:new Date(Date.now()-21600000).toISOString() },
    { log_id:4, complaint_id:1, action:'Complaint Filed',  performed_by:'alice smith', old_value:null,          new_value:'Pending',     timestamp:new Date(Date.now()-28800000).toISOString() },
  ]
};

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyRoleUI();
  loadDropdowns();
  showPage('dashboard');
});

// ── Role UI ───────────────────────────────────────────────────
function applyRoleUI() {
  const initials = username ? username.split(' ').map(w=>w[0].toUpperCase()).join('').slice(0,2) : '?';
  document.getElementById('user-avatar').textContent       = initials;
  document.getElementById('user-name-display').textContent = toTitleCase(username || 'User');
  document.getElementById('user-role-display').textContent = role;

  const chip = document.getElementById('role-chip');
  chip.textContent = role === 'Admin' ? '🛡 Admin' : '🎒 Student';
  chip.className   = 'role-chip ' + (role === 'Admin' ? 'chip-admin' : 'chip-student');

  if (role === 'Student') {
    document.getElementById('nav-submit').style.display      = '';
    document.getElementById('admin-nav-group').style.display = 'none';
    document.getElementById('nav-students').style.display    = 'none';
    document.getElementById('complaints-heading').textContent    = 'My Complaints';
    document.getElementById('complaints-subheading').textContent = 'Your submitted complaints';
  }
  if (role !== 'Admin') {
    const th = document.getElementById('th-actions');
    if (th) th.style.display = 'none';
  }
}

// ── Page nav ──────────────────────────────────────────────────
const PAGE_TITLES = { dashboard:'Dashboard', complaints:'Complaints', submit:'Submit Complaint', analytics:'Analytics', students:'Students', audit:'Audit Log' };

function showPage(id) {
  if (id === 'submit'   && role === 'Admin')  return;
  if (id === 'audit'    && role !== 'Admin')  return;
  if (id === 'students' && role !== 'Admin')  return;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pg  = document.getElementById('page-' + id);
  const nav = document.getElementById('nav-' + id);
  if (pg)  pg.classList.add('active');
  if (nav) nav.classList.add('active');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[id] || id;

  if (id === 'dashboard')  loadStats();
  if (id === 'complaints') loadComplaints();
  if (id === 'analytics')  loadAnalytics();
  if (id === 'students')   loadStudents();
  if (id === 'audit')      loadAuditLog();
}

// ── Helpers ───────────────────────────────────────────────────
const getHeaders     = () => ({ 'x-role': role, 'x-username': username || 'unknown' });
const getJsonHeaders = () => ({ 'Content-Type':'application/json', ...getHeaders() });

function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function toTitleCase(s){ return (s||'').replace(/\b\w/g, c=>c.toUpperCase()); }
function avatarColor(name) {
  const cols=['#6366f1','#0891b2','#7c3aed','#db2777','#d97706','#16a34a','#dc2626','#2563eb'];
  let h=0; for(const c of(name||'')) h=c.charCodeAt(0)+((h<<5)-h);
  return cols[Math.abs(h)%cols.length];
}
function formatDate(d){ if(!d) return '—'; return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }

// ── Safe fetch ────────────────────────────────────────────────
async function apiFetch(path, mockKey) {
  try {
    const res = await fetch(API+path, { headers: getHeaders() });
    if(!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  } catch(e) {
    console.warn('[offline]', path, '→ mock');
    if(mockKey && MOCK[mockKey] !== undefined) return MOCK[mockKey];
    throw e;
  }
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type='success') {
  const wrap = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className   = 'toast toast-' + type;
  t.textContent = (type==='success'?'✓ ':'✕ ') + msg;
  wrap.appendChild(t);
  setTimeout(()=>t.remove(), 3400);
}

// ── Stats ─────────────────────────────────────────────────────
async function loadStats() {
  try {
    const d = await apiFetch('/stats','stats');
    document.getElementById('stat-total').textContent    = d.total       ?? 0;
    document.getElementById('stat-pending').textContent  = d.pending     ?? 0;
    document.getElementById('stat-progress').textContent = d.in_progress ?? 0;
    document.getElementById('stat-resolved').textContent = d.resolved    ?? 0;
    renderStatusChart(d);
    renderPriorityChart(d,'chart-priority', chartPriority, c=>chartPriority=c);
  } catch(e){ console.error('stats',e); }
}

function renderStatusChart(d) {
  const ctx = document.getElementById('chart-status').getContext('2d');
  if(chartStatus) chartStatus.destroy();
  chartStatus = new Chart(ctx, { type:'doughnut',
    data:{ labels:['Pending','In Progress','Resolved'],
      datasets:[{ data:[d.pending||0,d.in_progress||0,d.resolved||0], backgroundColor:['#fbbf24','#3b82f6','#16a34a'], borderWidth:0, hoverOffset:4 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%',
      plugins:{ legend:{ position:'bottom', labels:{ font:{size:12,family:'Inter'}, padding:14, boxWidth:10 } } } }
  });
}

function renderPriorityChart(d, canvasId, existing, setter) {
  const el = document.getElementById(canvasId); if(!el) return;
  if(existing) existing.destroy();
  setter(new Chart(el.getContext('2d'), { type:'doughnut',
    data:{ labels:['High','Medium','Low'],
      datasets:[{ data:[d.high_priority||0,d.medium_priority||0,d.low_priority||0], backgroundColor:['#ef4444','#f59e0b','#16a34a'], borderWidth:0, hoverOffset:4 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%',
      plugins:{ legend:{ position:'bottom', labels:{ font:{size:12,family:'Inter'}, padding:14, boxWidth:10 } } } }
  }));
}

// ── Dropdowns ─────────────────────────────────────────────────
async function loadDropdowns() {
  let students, depts, cats;
  try {
    [students, depts, cats] = await Promise.all([apiFetch('/students','students'), apiFetch('/departments',null), apiFetch('/categories',null)]);
  } catch(e) {
    students = MOCK.students;
    depts = [{dept_id:1,dept_name:'Computer Science'},{dept_id:2,dept_name:'Electrical Engineering'},{dept_id:3,dept_name:'Mechanical Engineering'},{dept_id:4,dept_name:'Civil Engineering'}];
    cats  = [{category_id:1,category_name:'Infrastructure'},{category_id:2,category_name:'Academic'},{category_id:3,category_name:'IT / Network'},{category_id:4,category_name:'Equipment'},{category_id:5,category_name:'Safety'},{category_id:6,category_name:'Other'}];
  }
  const ss=document.getElementById('f-student');
  students.forEach(s=>ss.innerHTML+=`<option value="${s.student_id}">${esc(toTitleCase(s.name))}</option>`);
  const ds=document.getElementById('f-dept'), fds=document.getElementById('filter-dept');
  depts.forEach(d=>{ ds.innerHTML+=`<option value="${d.dept_id}">${esc(d.dept_name)}</option>`; fds.innerHTML+=`<option value="${esc(d.dept_name)}">${esc(d.dept_name)}</option>`; });
  const cs=document.getElementById('f-category');
  cats.forEach(c=>cs.innerHTML+=`<option value="${c.category_id}">${esc(c.category_name)}</option>`);
}

// ── Priority selector ─────────────────────────────────────────
function selectPriority(p) {
  selectedPriority = p;
  document.querySelectorAll('.priority-opt').forEach(btn => {
    btn.className = 'priority-opt';
    if(btn.dataset.p === p) btn.classList.add('selected-'+p.toLowerCase());
  });
}

// ── Char count ────────────────────────────────────────────────
function updateCharCount() {
  document.getElementById('char-count').textContent = document.getElementById('f-desc').value.length;
}

// ── File upload ───────────────────────────────────────────────
function handleFileSelect(e) {
  const file = e.target.files[0]; if(!file) return;
  if(file.size > 5*1024*1024){ showToast('File too large. Max 5MB.','error'); e.target.value=''; return; }
  const ok=['image/jpeg','image/png','image/gif','application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'];
  if(!ok.includes(file.type)){ showToast('Unsupported type. Use JPG, PNG, PDF, DOC or TXT.','error'); e.target.value=''; return; }
  selectedFile = file;
  document.getElementById('file-name').textContent = file.name;
  document.getElementById('file-size').textContent = file.size>1048576?(file.size/1048576).toFixed(1)+' MB':(file.size/1024).toFixed(0)+' KB';
  document.getElementById('file-icon').textContent = file.type.startsWith('image/')? '🖼' : file.type==='application/pdf'? '📄' : '📎';
  document.getElementById('file-preview').style.display = 'flex';
}
function clearFile(){ selectedFile=null; document.getElementById('f-file').value=''; document.getElementById('file-preview').style.display='none'; }
function triggerFileInput(){ document.getElementById('f-file').click(); }

// ── Submit complaint ──────────────────────────────────────────
async function submitComplaint() {
  const student_id  = document.getElementById('f-student').value;
  const dept_id     = document.getElementById('f-dept').value;
  const category_id = document.getElementById('f-category').value;
  const description = document.getElementById('f-desc').value.trim();
  const btn         = document.getElementById('submit-btn');

  if(!student_id||!dept_id||!description){ showToast('Please fill in all required fields.','error'); return; }
  btn.textContent='Submitting…'; btn.disabled=true;

  try {
    let res;
    if(selectedFile){
      const fd=new FormData();
      fd.append('student_id',student_id); fd.append('dept_id',dept_id);
      if(category_id) fd.append('category_id',category_id);
      fd.append('description',description); fd.append('priority',selectedPriority); fd.append('attachment',selectedFile);
      res = await fetch(API+'/complaints',{method:'POST',headers:getHeaders(),body:fd});
    } else {
      res = await fetch(API+'/complaints',{method:'POST',headers:getJsonHeaders(),body:JSON.stringify({student_id,dept_id,category_id:category_id||null,description,priority:selectedPriority})});
    }
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'Server error');
    showToast('Complaint submitted successfully!');
    document.getElementById('f-desc').value=''; document.getElementById('f-student').selectedIndex=0;
    document.getElementById('f-dept').selectedIndex=0; document.getElementById('f-category').selectedIndex=0;
    document.getElementById('char-count').textContent='0';
    clearFile(); selectPriority('Medium');
  } catch(e) {
    showToast('Complaint submitted! (Demo — server offline)');
    document.getElementById('f-desc').value=''; document.getElementById('f-student').selectedIndex=0;
    document.getElementById('char-count').textContent='0'; clearFile(); selectPriority('Medium');
  } finally { btn.textContent='Submit Complaint'; btn.disabled=false; }
}

// ── Load complaints ───────────────────────────────────────────
async function loadComplaints() {
  try {
    let data = await apiFetch('/complaints','complaints');
    if(role==='Student') data=data.filter(c=>c.student_name.toLowerCase()===username.toLowerCase());
    allComplaints=data; renderComplaints(allComplaints);
  } catch(e) {
    document.getElementById('complaints-tbody').innerHTML=`<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-3);">⚠ Server offline — showing mock data.</td></tr>`;
  }
}

function renderComplaints(data) {
  const tbody=document.getElementById('complaints-tbody'); tbody.innerHTML='';
  if(!data.length){ tbody.innerHTML=`<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-3);">No complaints found.</td></tr>`; return; }
  data.forEach(c=>{
    const sc={'Pending':'badge-pending','In Progress':'badge-progress','Resolved':'badge-resolved'}[c.status]||'';
    const pc={'High':'badge-high','Medium':'badge-medium','Low':'badge-low'}[c.priority]||'';
    const ini=(c.student_name||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const col=avatarColor(c.student_name);
    const act=role==='Admin'?`<td><div class="action-wrap">
      <select class="mini-select" onchange="updateComplaint(${c.complaint_id},'status',this.value)">
        <option ${c.status==='Pending'?'selected':''}>Pending</option>
        <option ${c.status==='In Progress'?'selected':''}>In Progress</option>
        <option ${c.status==='Resolved'?'selected':''}>Resolved</option>
      </select>
      <select class="mini-select" onchange="updateComplaint(${c.complaint_id},'priority',this.value)">
        <option ${c.priority==='High'?'selected':''}>High</option>
        <option ${c.priority==='Medium'?'selected':''}>Medium</option>
        <option ${c.priority==='Low'?'selected':''}>Low</option>
      </select>
      <button class="btn-delete" onclick="deleteComplaint(${c.complaint_id})">Delete</button>
    </div></td>`:`<td style="color:var(--text-3);text-align:center;">—</td>`;
    tbody.innerHTML+=`<tr>
      <td style="color:var(--text-3);font-size:12px;">#${c.complaint_id}</td>
      <td><div style="display:flex;align-items:center;gap:8px;">
        <div style="width:26px;height:26px;border-radius:50%;background:${col};color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${esc(ini)}</div>
        <span style="font-weight:500;">${esc(c.student_name)}</span></div></td>
      <td style="color:var(--text-2);">${esc(c.dept_name)}</td>
      <td>${c.category_name?`<span class="badge badge-cat">${esc(c.category_name)}</span>`:'<span style="color:var(--text-3)">—</span>'}</td>
      <td class="td-complaint"><div class="td-complaint-text" title="${esc(c.description)}">${esc(c.description)}</div></td>
      <td><span class="badge ${pc}">${esc(c.priority)}</span></td>
      <td style="color:var(--text-2);white-space:nowrap;">${formatDate(c.date_filed)}</td>
      <td><span class="badge ${sc}"><span class="badge-dot" style="background:currentColor;"></span>${esc(c.status)}</span></td>
      ${act}</tr>`;
  });
}

function filterComplaints() {
  const s=document.getElementById('search-input').value.toLowerCase();
  const st=document.getElementById('filter-status').value;
  const pr=document.getElementById('filter-priority').value;
  const dp=document.getElementById('filter-dept').value;
  renderComplaints(allComplaints.filter(c=>
    (!s||c.student_name.toLowerCase().includes(s)||c.dept_name.toLowerCase().includes(s)||(c.description||'').toLowerCase().includes(s))&&
    (!st||c.status===st)&&(!pr||c.priority===pr)&&(!dp||c.dept_name===dp)
  ));
}

async function updateComplaint(id,field,value) {
  try {
    const body=field==='status'?{status:value}:{priority:value};
    const res=await fetch(`${API}/complaints/${id}`,{method:'PUT',headers:getJsonHeaders(),body:JSON.stringify(body)});
    const d=await res.json(); if(!res.ok){showToast(d.error||'Denied','error');return;}
    showToast(toTitleCase(field)+' updated.'); loadComplaints(); loadStats();
  } catch(e) {
    const c=allComplaints.find(x=>x.complaint_id===id); if(c) c[field]=value;
    showToast(toTitleCase(field)+' updated (demo).'); renderComplaints(allComplaints);
  }
}

async function deleteComplaint(id) {
  if(!confirm('Delete this complaint?')) return;
  try {
    const res=await fetch(`${API}/complaints/${id}`,{method:'DELETE',headers:getJsonHeaders()});
    const d=await res.json(); if(!res.ok){showToast(d.error||'Denied','error');return;}
    showToast('Deleted.'); loadComplaints(); loadStats();
  } catch(e) {
    allComplaints=allComplaints.filter(x=>x.complaint_id!==id);
    showToast('Deleted (demo).'); renderComplaints(allComplaints);
  }
}

// ── Analytics ─────────────────────────────────────────────────
async function loadAnalytics() {
  try {
    const [a,s]=await Promise.all([apiFetch('/analytics','analytics'),apiFetch('/stats','stats')]);
    renderAnalytics(a,s);
  } catch(e){ renderAnalytics(MOCK.analytics,MOCK.stats); }
}

function renderAnalytics(a,s) {
  renderTrendChart(a.trend||[]);
  renderDeptBreakdown(a.byDept||[]);
  renderCategoryChart(a.byCategory||[]);
  const rate=a.resolutionRate?.[0]?.rate??0;
  document.getElementById('resolution-rate-label').textContent=`${rate}%`;
  document.getElementById('resolution-fill').style.width=`${rate}%`;
  renderPriorityChart(s,'chart-priority-2',chartPriority2,c=>chartPriority2=c);
}

function renderTrendChart(trend) {
  const el=document.getElementById('chart-trend'); if(!el) return;
  if(chartTrend) chartTrend.destroy();
  chartTrend=new Chart(el.getContext('2d'),{type:'line',
    data:{labels:trend.map(r=>new Date(r.day).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})),
      datasets:[{label:'Complaints',data:trend.map(r=>r.total),borderColor:'#2563eb',backgroundColor:'rgba(37,99,235,0.07)',borderWidth:2,tension:0.35,fill:true,pointRadius:3,pointBackgroundColor:'#2563eb'}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{x:{grid:{display:false},ticks:{font:{size:11,family:'Inter'},color:'#9ca3af'}},
              y:{beginAtZero:true,grid:{color:'#f0f2f5'},ticks:{font:{size:11,family:'Inter'},color:'#9ca3af',stepSize:1}}}}});
}

function renderDeptBreakdown(depts) {
  const max=Math.max(...depts.map(d=>d.total),1);
  const cols=['#6366f1','#0891b2','#7c3aed','#16a34a'];
  document.getElementById('dept-breakdown').innerHTML=depts.map((d,i)=>`
    <div class="dept-table-row">
      <div class="dept-name-cell">${esc(d.dept_name)}</div>
      <div class="dept-bar-wrap"><div class="dept-bar-inner" style="width:${(d.total/max*100).toFixed(1)}%;background:${cols[i%4]};"></div></div>
      <div class="dept-count-cell">${d.total}</div>
    </div>`).join('')||'<p style="color:var(--text-3)">No data.</p>';
}

function renderCategoryChart(cats) {
  const el=document.getElementById('chart-category'); if(!el) return;
  if(chartCategory) chartCategory.destroy();
  chartCategory=new Chart(el.getContext('2d'),{type:'bar',
    data:{labels:cats.map(c=>c.category_name),datasets:[{data:cats.map(c=>c.total),backgroundColor:'#818cf8',borderRadius:4,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{x:{grid:{display:false},ticks:{font:{size:11,family:'Inter'},color:'#9ca3af',maxRotation:30}},
              y:{beginAtZero:true,grid:{color:'#f0f2f5'},ticks:{font:{size:11,family:'Inter'},color:'#9ca3af',stepSize:1}}}}});
}

// ── Students (Admin only) ─────────────────────────────────────
async function loadStudents() {
  if(role!=='Admin'){ showPage('dashboard'); return; }
  try { renderStudents(await apiFetch('/students','students')); } catch(e){ renderStudents(MOCK.students); }
}

function renderStudents(students) {
  const g=document.getElementById('students-grid');
  if(!students.length){ g.innerHTML=`<div class="empty-state"><p>No students.</p></div>`; return; }
  g.innerHTML=students.map(s=>{
    const ini=s.name.split(' ').map(w=>w[0].toUpperCase()).join('').slice(0,2);
    const col=avatarColor(s.name);
    return `<div class="student-card">
      <div class="student-avatar" style="background:${col};">${esc(ini)}</div>
      <div class="student-name">${esc(toTitleCase(s.name))}</div>
      <div class="student-email">${esc(s.email)}</div>
      <div class="student-stats">
        <div class="s-stat"><div class="s-stat-num">${s.total_complaints}</div><div class="s-stat-label">Total</div></div>
        <div class="s-stat"><div class="s-stat-num" style="color:var(--amber);">${s.pending}</div><div class="s-stat-label">Pending</div></div>
        <div class="s-stat"><div class="s-stat-num" style="color:var(--green);">${s.resolved}</div><div class="s-stat-label">Resolved</div></div>
      </div></div>`;
  }).join('');
}

// ── Audit Log (Admin only) ────────────────────────────────────
async function loadAuditLog() {
  if(role!=='Admin'){ showPage('dashboard'); return; }
  try { renderAuditLog(await apiFetch('/audit-log','auditLog')); } catch(e){ renderAuditLog(MOCK.auditLog); }
}

function renderAuditLog(logs) {
  const list=document.getElementById('audit-list');
  if(!logs.length){ list.innerHTML=`<div class="empty-state"><p>No entries yet.</p></div>`; return; }
  const ic={'Status Changed':{bg:'#eff6ff',icon:'🔄'},'Priority Changed':{bg:'#fffbeb',icon:'⚡'},'Complaint Filed':{bg:'#f0fdf4',icon:'📋'},'Complaint Deleted':{bg:'#fef2f2',icon:'🗑'}};
  list.innerHTML=logs.map(l=>{
    const m=ic[l.action]||{bg:'#f6f7f9',icon:'📝'};
    const w=new Date(l.timestamp).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    const ch=l.old_value&&l.new_value?` · <span style="color:var(--text-3);">${esc(l.old_value)}</span> → <strong>${esc(l.new_value)}</strong>`:'';
    return `<div class="audit-row">
      <div class="audit-icon" style="background:${m.bg};">${m.icon}</div>
      <div class="audit-body">
        <div class="audit-action">${esc(l.action)}${ch} <span style="color:var(--text-3);font-size:12px;font-weight:400;">on #${l.complaint_id}</span></div>
        <div class="audit-meta">by <strong>${esc(l.performed_by)}</strong> · ${w}</div>
      </div></div>`;
  }).join('');
}

// ── Logout ────────────────────────────────────────────────────
function logout(){ sessionStorage.clear(); window.location.href='login.html'; }