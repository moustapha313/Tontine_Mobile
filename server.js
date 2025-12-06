require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const APP_PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const app = express();
app.use(cors());
app.use(express.json());

function uid(){ return crypto.randomBytes(8).toString('hex') }

// -- Auth helpers
function sign(user){ return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' }) }
function authMiddleware(req,res,next){ const h = req.headers.authorization; if(!h) return res.status(401).json({error:'missing auth'}); const token = h.replace(/^Bearer\s+/i,''); try{ const payload = jwt.verify(token, JWT_SECRET); req.user = payload; next() }catch(e){ return res.status(401).json({error:'invalid token'}) } }

function requireAdmin(req,res,next){ if(!req.user) return res.status(401).json({error:'missing auth'}); if(req.user.role !== 'admin') return res.status(403).json({error:'admin required'}); next(); }

// -- Simple public endpoints
app.get('/', (req,res)=> res.json({ok:true, msg:'tontine backend'}));

// Signup (create user) - very simple: accepts name + email or phone
app.post('/auth/signup', (req,res)=>{
  const { name, email, phone, password, role } = req.body;
  if(!email && !phone) return res.status(400).json({error:'email or phone required'});
  const id = uid();
  const created_at = Date.now();
  const pwdHash = password ? bcrypt.hashSync(password, 8) : null;
  const stmt = db.prepare('INSERT INTO users (id,name,email,phone,password_hash,role,created_at) VALUES (?,?,?,?,?,?,?)');
  try{
    stmt.run(id, name||null, email||null, phone||null, pwdHash, role||'member', created_at);
    const user = { id, name, email, phone, role: role||'member' };
    return res.json({ok:true, user, token: sign(user)});
  }catch(err){ return res.status(400).json({error:err.message}) }
});

// Login (email) - for prototype, login by email and password optional
app.post('/auth/login', (req,res)=>{
  const { email, password } = req.body;
  if(!email) return res.status(400).json({error:'email required'});
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if(!row) return res.status(404).json({error:'user not found'});
  if(row.password_hash && password){ if(!bcrypt.compareSync(password, row.password_hash)) return res.status(401).json({error:'invalid credentials'}) }
  const user = { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role };
  return res.json({ok:true, user, token: sign(user)});
});

// --- Groups CRUD
app.post('/groups', authMiddleware, requireAdmin, (req,res)=>{
  const { name, contribution, frequency } = req.body; if(!name) return res.status(400).json({error:'name required'});
  const id = uid(); const created_at = Date.now();
  const stmt = db.prepare('INSERT INTO groups (id,name,owner_id,contribution,frequency,created_at) VALUES (?,?,?,?,?,?)');
  stmt.run(id, name, req.user.id, contribution||0, frequency||null, created_at);
  const g = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
  res.json({ok:true, group:g});
});

app.get('/groups', authMiddleware, (req,res)=>{
  const rows = db.prepare('SELECT * FROM groups').all(); res.json({ok:true, groups:rows});
});

app.get('/groups/:id', authMiddleware, (req,res)=>{
  const g = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if(!g) return res.status(404).json({error:'not found'});
  res.json({ok:true, group:g});
});

app.put('/groups/:id', authMiddleware, (req,res)=>{
  const { name, contribution, frequency } = req.body; const id = req.params.id;
  const stmt = db.prepare('UPDATE groups SET name = COALESCE(?, name), contribution = COALESCE(?, contribution), frequency = COALESCE(?, frequency) WHERE id = ?');
  stmt.run(name, contribution, frequency, id);
  const g = db.prepare('SELECT * FROM groups WHERE id = ?').get(id); res.json({ok:true, group:g});
});

app.delete('/groups/:id', authMiddleware, requireAdmin, (req,res)=>{
  db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
  res.json({ok:true});
});

// Members CRUD (members belong to a group)
app.post('/groups/:id/members', authMiddleware, requireAdmin, (req,res)=>{
  const groupId = req.params.id; const { user_id, name, contact } = req.body;
  const id = uid(); const joined_at = Date.now();
  db.prepare('INSERT INTO members (id,group_id,user_id,name,contact,joined_at) VALUES (?,?,?,?,?,?)').run(id, groupId, user_id||null, name||null, contact||null, joined_at);
  const m = db.prepare('SELECT * FROM members WHERE id = ?').get(id); res.json({ok:true, member:m});
});

app.get('/groups/:id/members', authMiddleware, (req,res)=>{
  const rows = db.prepare('SELECT * FROM members WHERE group_id = ?').all(req.params.id); res.json({ok:true, members:rows});
});

app.delete('/groups/:id/members/:memberId', authMiddleware, requireAdmin, (req,res)=>{
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.memberId); res.json({ok:true});
});

// Cycle endpoints (simple)
app.post('/groups/:id/cycle/start', authMiddleware, requireAdmin, (req,res)=>{
  const groupId = req.params.id; const { order } = req.body; // order = array of member ids
  if(!Array.isArray(order) || order.length===0) return res.status(400).json({error:'order required'});
  const id = uid(); const started_at = Date.now();
  db.prepare('INSERT INTO cycles (id,group_id,order_json,idx,started_at,frequency) VALUES (?,?,?,?,?,?)').run(id, groupId, JSON.stringify(order), 0, started_at, null);
  const c = db.prepare('SELECT * FROM cycles WHERE id = ?').get(id); res.json({ok:true, cycle:c});
});

app.post('/groups/:id/cycle/advance', authMiddleware, requireAdmin, (req,res)=>{
  const groupId = req.params.id; const c = db.prepare('SELECT * FROM cycles WHERE group_id = ? ORDER BY started_at DESC LIMIT 1').get(groupId);
  if(!c) return res.status(404).json({error:'no cycle'});
  const order = JSON.parse(c.order_json);
  const idx = (c.idx + 1) % order.length;
  db.prepare('UPDATE cycles SET idx = ? WHERE id = ?').run(idx, c.id);
  const updated = db.prepare('SELECT * FROM cycles WHERE id = ?').get(c.id);
  res.json({ok:true, cycle:updated});
});

app.get('/groups/:id/cycle', authMiddleware, (req,res)=>{
  const c = db.prepare('SELECT * FROM cycles WHERE group_id = ? ORDER BY started_at DESC LIMIT 1').get(req.params.id);
  if(!c) return res.json({ok:true, cycle:null});
  c.order = JSON.parse(c.order_json);
  res.json({ok:true, cycle:c});
});

// Payments
app.post('/groups/:id/payments', authMiddleware, (req,res)=>{
  const groupId = req.params.id; const { member_id, amount, round } = req.body;
  const id = uid(); const date = Date.now();
  db.prepare('INSERT INTO payments (id,group_id,member_id,user_id,amount,date,round,status) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, groupId, member_id, req.user.id, amount||0, date, round||null, 'confirmed');
  const p = db.prepare('SELECT * FROM payments WHERE id = ?').get(id); res.json({ok:true, payment:p});
});

app.get('/groups/:id/payments', authMiddleware, (req,res)=>{
  const rows = db.prepare('SELECT * FROM payments WHERE group_id = ? ORDER BY date DESC').all(req.params.id); res.json({ok:true, payments:rows});
});

// Webhook simulateur de paiement (externe)
app.post('/payments/webhook', (req,res)=>{
  // body expects: { external_ref, group_id, member_id, amount, status }
  const { external_ref, group_id, member_id, amount, status } = req.body;
  // create or update payment record
  const id = uid(); const date = Date.now();
  db.prepare('INSERT INTO payments (id,group_id,member_id,amount,date,round,status,external_ref) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, group_id, member_id, amount||0, date, null, status||'confirmed', external_ref||null);
  res.json({ok:true, recorded:true, id});
});

// Import/Export (simple)
app.get('/groups/:id/export', authMiddleware, (req,res)=>{
  const groupId = req.params.id;
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  const members = db.prepare('SELECT * FROM members WHERE group_id = ?').all(groupId);
  const cycles = db.prepare('SELECT * FROM cycles WHERE group_id = ?').all(groupId);
  const payments = db.prepare('SELECT * FROM payments WHERE group_id = ?').all(groupId);
  res.json({ok:true, export: { group, members, cycles, payments }});
});

app.post('/groups/import', authMiddleware, requireAdmin, (req,res)=>{
  // Accept an export-like object and insert. (naïf)
  const payload = req.body;
  if(!payload || !payload.group) return res.status(400).json({error:'invalid payload'});
  const g = payload.group; db.prepare('INSERT INTO groups (id,name,owner_id,contribution,frequency,created_at) VALUES (?,?,?,?,?,?)')
    .run(g.id, g.name, g.owner_id, g.contribution, g.frequency, g.created_at);
  (payload.members||[]).forEach(m=>{ db.prepare('INSERT INTO members (id,group_id,user_id,name,contact,joined_at) VALUES (?,?,?,?,?,?)').run(m.id,m.group_id,m.user_id,m.name,m.contact,m.joined_at) });
  res.json({ok:true});
});

// Start server
app.listen(APP_PORT, ()=> console.log('Server listening on', APP_PORT));
