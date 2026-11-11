const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'devoluciones.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Tablas para טופס אישור פריקה y sus 4 subcarpetas:
// 1. menahalei_avoda (שם מנהל עבודה)
// 2. nahagim (שם הנהג)
// 3. mutzarim (מוצרים תחת הערות)
// 4. machsanaim (שם המחסנאי המאשר)
db.exec(`
  CREATE TABLE IF NOT EXISTS menahalei_avoda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shem TEXT NOT NULL UNIQUE,
    creado_en TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS nahagim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shem TEXT NOT NULL UNIQUE,
    creado_en TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS mutzarim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shem TEXT NOT NULL UNIQUE,
    creado_en TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS machsanaim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shem TEXT NOT NULL UNIQUE,
    creado_en TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS mador_machsanaim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mador TEXT NOT NULL,
    shem TEXT NOT NULL,
    creado_en TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(mador, shem)
  );

  CREATE TABLE IF NOT EXISTS ishur_prika (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machsan_sholeach TEXT NOT NULL,
    shem_nahag TEXT NOT NULL,
    taarich_prika TEXT NOT NULL,
    mispar_teudat_mishloach TEXT NOT NULL DEFAULT '',
    hearot TEXT DEFAULT '',
    mutzarim_json TEXT DEFAULT '[]',
    tmunot_json TEXT DEFAULT '[]',
    shem_machsanai TEXT DEFAULT '',
    chatima_data_url TEXT DEFAULT '',
    creado_en TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

try {
  db.exec(`ALTER TABLE ishur_prika ADD COLUMN mutzarim_json TEXT DEFAULT '[]';`);
} catch {
  // ya existe
}
try {
  db.exec(`ALTER TABLE ishur_prika ADD COLUMN tmunot_json TEXT DEFAULT '[]';`);
} catch {
  // ya existe
}

// Asegurar datos iniciales cargados por el usuario si la base de datos es nueva
const INITIAL_MENAHALEI = [
  'משה אבוחצירה',
  'אשר בנשלומון',
  'משה ביטון',
  'דוד נגר',
  'דני בו חיים',
  'אמיתי שרעבי',
  'יוסי קרסקס',
  'מאיר מועלם',
  'מאיר אשר'
];
const countMenahalei = db.prepare(`SELECT COUNT(*) AS c FROM menahalei_avoda`).get().c;
if (countMenahalei === 0) {
  const insM = db.prepare(`INSERT OR IGNORE INTO menahalei_avoda (shem) VALUES (?)`);
  INITIAL_MENAHALEI.forEach((s) => insM.run(s));
}

const countNahagim = db.prepare(`SELECT COUNT(*) AS c FROM nahagim`).get().c;
if (countNahagim === 0) {
  db.prepare(`INSERT OR IGNORE INTO nahagim (shem) VALUES (?)`).run('JAIME');
}

const INITIAL_MUTZARIM = [
  'פסולת עץ',
  'עמוד',
  'תוף',
  'כבלים תפזורת',
  'שנאי',
  'SF6',
  'ארון'
];
const countMutzarim = db.prepare(`SELECT COUNT(*) AS c FROM mutzarim`).get().c;
if (countMutzarim === 0) {
  const insP = db.prepare(`INSERT OR IGNORE INTO mutzarim (shem) VALUES (?)`);
  INITIAL_MUTZARIM.forEach((s) => insP.run(s));
} else {
  db.prepare(`INSERT OR IGNORE INTO mutzarim (shem) VALUES (?)`).run('כבלים תפזורת');
}

const INITIAL_MACHSANAIM = [
  'חיים הדידה 8110',
  'מאור לב 8110',
  'זלמה רובין 8110',
  'לאור ליברטי 8110',
  'אידן דהן 8110',
  'איילין טגניה 8150',
  'אדיב איניואו 8150',
  'מניקס מנטס 8150',
  'איליה גולדשטיין 8150',
  'גדי יברחן 8150',
  'דוד זנזורי 8130',
  'יוגב אזוט 8130',
  'אור אבינו 8130',
  'שי איזנברג 8120',
  'עודד בלום 8120',
  'מאור מיטרני 8120',
  'אושרי כהן 8120',
  'איציק ידב 8120'
];
const countMachsanaim = db.prepare(`SELECT COUNT(*) AS c FROM machsanaim`).get().c;
if (countMachsanaim === 0) {
  const insMa = db.prepare(`INSERT OR IGNORE INTO machsanaim (shem) VALUES (?)`);
  INITIAL_MACHSANAIM.forEach((s) => insMa.run(s));
}

// El PIN se define SOLO en la variable de entorno ADMIN_PIN (nunca en el código).
// Si no está definida, las operaciones protegidas quedan bloqueadas.
const ADMIN_PIN = String(process.env.ADMIN_PIN || '').trim();

function verifyPin(pin) {
  return ADMIN_PIN !== '' && String(pin || '').trim() === ADMIN_PIN;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT DEFAULT ''
  );
`);

db.prepare(
  `INSERT OR IGNORE INTO settings (key, value) VALUES ('whatsapp_contacts', ?)`
).run(
  JSON.stringify([
    {
      name: process.env.DEFAULT_WA_NAME || '',
      phone: String(process.env.DEFAULT_WA_PHONE || '').replace(/\D/g, '')
    },
    { name: '', phone: '' },
    { name: '', phone: '' }
  ])
);

function getSettings() {
  const row = db.prepare(`SELECT value FROM settings WHERE key = 'whatsapp_contacts'`).get();
  let contacts = [];
  try {
    contacts = JSON.parse((row && row.value) || '[]');
  } catch {
    contacts = [];
  }
  while (contacts.length < 3) {
    contacts.push({ name: '', phone: '' });
  }
  return {
    whatsapp_contacts: contacts.slice(0, 3).map((c) => ({
      name: String((c && c.name) || '').trim(),
      phone: String((c && c.phone) || '').trim()
    }))
  };
}

function updateSettings(newSettings = {}) {
  const pin = String(newSettings.pin || '').trim();
  if (!verifyPin(pin)) {
    throw new Error('קוד PIN שגוי (נדרש קוד PIN תקין לעדכון ההגדרות)');
  }

  if (Array.isArray(newSettings.whatsapp_contacts)) {
    const cleanContacts = newSettings.whatsapp_contacts.slice(0, 3).map((c) => ({
      name: String((c && c.name) || '').trim(),
      phone: String((c && c.phone) || '').replace(/[^\d+]/g, '').trim()
    }));
    while (cleanContacts.length < 3) {
      cleanContacts.push({ name: '', phone: '' });
    }
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('whatsapp_contacts', ?)`).run(
      JSON.stringify(cleanContacts)
    );
  }
  return getSettings();
}

function getMenahaleiAvoda() {
  return db
    .prepare(`SELECT id, shem, creado_en FROM menahalei_avoda ORDER BY id ASC`)
    .all();
}

function addMenahelAvoda(shem) {
  const clean = String(shem || '').trim();
  if (!clean) {
    throw new Error('נא להזין שם מנהל עבודה');
  }
  db.prepare(`INSERT OR IGNORE INTO menahalei_avoda (shem) VALUES (?)`).run(clean);
  return getMenahaleiAvoda();
}

function deleteMenahelAvoda(id) {
  db.prepare(`DELETE FROM menahalei_avoda WHERE id = ?`).run(Number(id));
  return getMenahaleiAvoda();
}

function getNahagim() {
  return db
    .prepare(`SELECT id, shem, creado_en FROM nahagim ORDER BY id ASC`)
    .all();
}

function addNahag(shem) {
  const clean = String(shem || '').trim();
  if (!clean) {
    throw new Error('נא להזין שם נהג');
  }
  db.prepare(`INSERT OR IGNORE INTO nahagim (shem) VALUES (?)`).run(clean);
  return getNahagim();
}

function deleteNahag(id) {
  db.prepare(`DELETE FROM nahagim WHERE id = ?`).run(Number(id));
  return getNahagim();
}

function getMutzarim() {
  return db
    .prepare(`SELECT id, shem, creado_en FROM mutzarim ORDER BY id ASC`)
    .all();
}

function addMutzar(shem) {
  const clean = String(shem || '').trim();
  if (!clean) {
    throw new Error('נא להזין שם מוצר');
  }
  db.prepare(`INSERT OR IGNORE INTO mutzarim (shem) VALUES (?)`).run(clean);
  return getMutzarim();
}

function deleteMutzar(id) {
  db.prepare(`DELETE FROM mutzarim WHERE id = ?`).run(Number(id));
  return getMutzarim();
}

function getMachsanaim() {
  return db
    .prepare(`SELECT id, shem, creado_en FROM machsanaim ORDER BY id ASC`)
    .all();
}

function addMachsanai(shem, mador = '') {
  let cleanShem = String(shem || '').trim();
  const cleanMador = String(mador || '').trim();
  if (!cleanShem) {
    throw new Error('נא להזין שם מחסנאי מאשר');
  }
  if (cleanMador && !cleanShem.includes(cleanMador)) {
    cleanShem = `${cleanShem} ${cleanMador}`;
  }
  db.prepare(`INSERT OR IGNORE INTO machsanaim (shem) VALUES (?)`).run(cleanShem);
  return getMachsanaim();
}

function deleteMachsanai(id) {
  db.prepare(`DELETE FROM machsanaim WHERE id = ?`).run(Number(id));
  return getMachsanaim();
}

function getAllRecords() {
  return db
    .prepare(`
      SELECT
        id,
        machsan_sholeach,
        shem_nahag,
        taarich_prika,
        mispar_teudat_mishloach,
        hearot,
        mutzarim_json,
        tmunot_json,
        shem_machsanai,
        chatima_data_url,
        creado_en
      FROM ishur_prika
      ORDER BY id DESC
    `)
    .all();
}

function createRecord({
  machsan_sholeach = '',
  shem_nahag = '',
  taarich_prika = '',
  mispar_teudat_mishloach = '',
  hearot = '',
  mutzarim_items = [],
  tmunot = [],
  shem_machsanai = '',
  chatima_data_url = ''
}) {
  if (!machsan_sholeach.trim()) {
    throw new Error('נא למלא: שם מנהל עבודה');
  }
  if (!shem_nahag.trim()) {
    throw new Error('נא למלא: שם הנהג');
  }
  if (!taarich_prika.trim()) {
    throw new Error('נא למלא: תאריך פריקה');
  }

  db.prepare(`INSERT OR IGNORE INTO menahalei_avoda (shem) VALUES (?)`).run(
    machsan_sholeach.trim()
  );
  db.prepare(`INSERT OR IGNORE INTO nahagim (shem) VALUES (?)`).run(
    shem_nahag.trim()
  );
  if (shem_machsanai && shem_machsanai.trim()) {
    db.prepare(`INSERT OR IGNORE INTO machsanaim (shem) VALUES (?)`).run(
      shem_machsanai.trim()
    );
  }

  const cleanItems = Array.isArray(mutzarim_items) ? mutzarim_items : [];
  for (const item of cleanItems) {
    if (item && item.product && String(item.product).trim()) {
      db.prepare(`INSERT OR IGNORE INTO mutzarim (shem) VALUES (?)`).run(
        String(item.product).trim()
      );
    }
  }

  const cleanPhotos = Array.isArray(tmunot) ? tmunot : [];

  const stmt = db.prepare(`
    INSERT INTO ishur_prika (
      machsan_sholeach,
      shem_nahag,
      taarich_prika,
      mispar_teudat_mishloach,
      hearot,
      mutzarim_json,
      tmunot_json,
      shem_machsanai,
      chatima_data_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    machsan_sholeach.trim(),
    shem_nahag.trim(),
    taarich_prika.trim(),
    mispar_teudat_mishloach.trim(),
    (hearot || '').trim(),
    JSON.stringify(cleanItems),
    JSON.stringify(cleanPhotos),
    (shem_machsanai || '').trim(),
    chatima_data_url || ''
  );

  return db
    .prepare(`SELECT * FROM ishur_prika WHERE id = ?`)
    .get(Number(result.lastInsertRowid));
}

function deleteRecord(id, pin = '') {
  if (!verifyPin(pin)) {
    throw new Error('קוד PIN שגוי — לא ניתן למחוק את הפעולה');
  }
  db.prepare(`DELETE FROM ishur_prika WHERE id = ?`).run(Number(id));
  return getAllRecords();
}

module.exports = {
  verifyPin,
  getSettings,
  updateSettings,
  getMenahaleiAvoda,
  addMenahelAvoda,
  deleteMenahelAvoda,
  getNahagim,
  addNahag,
  deleteNahag,
  getMutzarim,
  addMutzar,
  deleteMutzar,
  getMachsanaim,
  addMachsanai,
  deleteMachsanai,
  getAllRecords,
  createRecord,
  deleteRecord
};
