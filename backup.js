const fs = require('node:fs');
const path = require('node:path');

// Respaldo automático de la base SQLite.
//  - BACKUP_DIR   : carpeta de copias (por defecto <carpeta de la DB>/backups)
//  - BACKUP_KEEP  : cuántas copias conservar (por defecto 14)
//  - BACKUP_HOURS : cada cuántas horas respaldar (por defecto 24)
function startBackups(db, dbPath) {
  const dir = process.env.BACKUP_DIR || path.join(path.dirname(dbPath), 'backups');
  const keep = Math.max(1, Number(process.env.BACKUP_KEEP) || 14);
  const hours = Math.max(1, Number(process.env.BACKUP_HOURS) || 24);
  fs.mkdirSync(dir, { recursive: true });

  function runBackup() {
    try {
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'); // YYYY-MM-DD-HH-MM
      const target = path.join(dir, `devoluciones-${stamp}.db`);
      if (fs.existsSync(target)) return;
      // VACUUM INTO genera una copia consistente aunque la app esté en uso
      db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);

      const files = fs
        .readdirSync(dir)
        .filter((f) => /^devoluciones-.*\.db$/.test(f))
        .sort();
      files.slice(0, Math.max(0, files.length - keep)).forEach((f) => {
        fs.unlinkSync(path.join(dir, f));
      });
      console.log(`[backup] copia creada: ${path.basename(target)} (se conservan ${keep})`);
    } catch (err) {
      console.error('[backup] error:', err.message);
    }
  }

  runBackup();
  const timer = setInterval(runBackup, hours * 60 * 60 * 1000);
  timer.unref();
  return { runBackup, dir };
}

module.exports = { startBackups };
