const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const {
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
} = require('./database');
const dbModule = require('./database');
const { startBackups } = require('./backup');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  const data = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(data);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString('utf8');
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error('גודל הנתונים חורג מהמותר.'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('פורמט נתונים לא תקין.'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // 1. API: Subcarpeta de שם מנהל עבודה
    if (pathname === '/api/menahalei-avoda') {
      if (req.method === 'GET') {
        return sendJson(res, 200, getMenahaleiAvoda());
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const list = addMenahelAvoda(body.shem);
        return sendJson(res, 201, list);
      }
    }

    const matchMenahelId = pathname.match(/^\/api\/menahalei-avoda\/(\d+)$/);
    if (matchMenahelId && req.method === 'DELETE') {
      const list = deleteMenahelAvoda(Number(matchMenahelId[1]));
      return sendJson(res, 200, list);
    }

    // 2. API: Subcarpeta de שם הנהג
    if (pathname === '/api/nahagim') {
      if (req.method === 'GET') {
        return sendJson(res, 200, getNahagim());
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const list = addNahag(body.shem);
        return sendJson(res, 201, list);
      }
    }

    const matchNahagId = pathname.match(/^\/api\/nahagim\/(\d+)$/);
    if (matchNahagId && req.method === 'DELETE') {
      const list = deleteNahag(Number(matchNahagId[1]));
      return sendJson(res, 200, list);
    }

    // 3. API: Subcarpeta de מוצרים (תחת הערות)
    if (pathname === '/api/mutzarim') {
      if (req.method === 'GET') {
        return sendJson(res, 200, getMutzarim());
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const list = addMutzar(body.shem);
        return sendJson(res, 201, list);
      }
    }

    const matchMutzarId = pathname.match(/^\/api\/mutzarim\/(\d+)$/);
    if (matchMutzarId && req.method === 'DELETE') {
      const list = deleteMutzar(Number(matchMutzarId[1]));
      return sendJson(res, 200, list);
    }

    // 4. API: Subcarpeta de שם המחסנאי המאשר
    if (pathname === '/api/machsanaim') {
      if (req.method === 'GET') {
        return sendJson(res, 200, getMachsanaim());
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const list = addMachsanai(body.shem, body.mador);
        return sendJson(res, 201, list);
      }
    }

    const matchMachsanaiId = pathname.match(/^\/api\/machsanaim\/(\d+)$/);
    if (matchMachsanaiId && req.method === 'DELETE') {
      const list = deleteMachsanai(Number(matchMachsanaiId[1]));
      return sendJson(res, 200, list);
    }

    // API: verificación de PIN (la validación ocurre solo en el servidor)
    if (pathname === '/api/verify-pin' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (verifyPin(body.pin)) return sendJson(res, 200, { ok: true });
      return sendJson(res, 403, { error: 'קוד PIN שגוי' });
    }

    // API: הגדרות מערכת (מספר WhatsApp לקבלת אישורים)
    if (pathname === '/api/settings') {
      if (req.method === 'GET') {
        return sendJson(res, 200, getSettings());
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, updateSettings(body));
      }
    }

    // API: טופס אישור פריקה
    if (pathname === '/api/ishur-prika') {
      if (req.method === 'GET') {
        return sendJson(res, 200, getAllRecords());
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const created = createRecord(body);
        return sendJson(res, 201, {
          record: created,
          settings: getSettings(),
          menahalei_avoda: getMenahaleiAvoda(),
          nahagim: getNahagim(),
          mutzarim: getMutzarim(),
          machsanaim: getMachsanaim()
        });
      }
    }

    const matchRecordId = pathname.match(/^\/api\/ishur-prika\/(\d+)$/);
    if (matchRecordId && req.method === 'DELETE') {
      const body = await readJsonBody(req);
      const pin = parsedUrl.searchParams.get('pin') || body.pin || '';
      const list = deleteRecord(Number(matchRecordId[1]), pin);
      return sendJson(res, 200, list);
    }

    let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);

    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('גישה נדחתה');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
      return fs.createReadStream(filePath).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('הנתיב לא נמצא');
  } catch (err) {
    sendJson(res, 400, { error: err.message || 'שגיאה פנימית בשרת' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  startBackups(dbModule.db, dbModule.DB_PATH);
  console.log(`============================================================`);
  console.log(`  חברת החשמל - טופס אישור פריקה (http://localhost:${PORT})`);
  console.log(`============================================================`);
});
