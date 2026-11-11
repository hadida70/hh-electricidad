const form = document.getElementById('ishurPrikaForm');
const machsanSholeach = document.getElementById('machsanSholeach');
const shemNahag = document.getElementById('shemNahag');
const taarichPrika = document.getElementById('taarichPrika');
const hearot = document.getElementById('hearot');
const shemMachsanai = document.getElementById('shemMachsanai');
const formAlert = document.getElementById('formAlert');

// 1. שם מנהל עבודה (Dropdown + Add)
const boxAddMenahel = document.getElementById('boxAddMenahel');
const newMenahelNameInput = document.getElementById('newMenahelNameInput');
const menahelNamesList = document.getElementById('menahelNamesList');

// 2. שם הנהג (Dropdown + Add)
const boxAddNahag = document.getElementById('boxAddNahag');
const newNahagNameInput = document.getElementById('newNahagNameInput');
const nahagNamesList = document.getElementById('nahagNamesList');

// 4. הערות: מוצרים + סידורי + תמונה
const itemProductSelect = document.getElementById('itemProductSelect');
const boxAddProduct = document.getElementById('boxAddProduct');
const newCatalogProductInput = document.getElementById('newCatalogProductInput');
const catalogProductsList = document.getElementById('catalogProductsList');
const itemSerialInput = document.getElementById('itemSerialInput');
const addedProductsTableWrap = document.getElementById('addedProductsTableWrap');
const addedProductsTbody = document.getElementById('addedProductsTbody');
const photoFileInput = document.getElementById('photoFileInput');
const addedPhotosWrap = document.getElementById('addedPhotosWrap');
const photosGalleryList = document.getElementById('photosGalleryList');

// 5. שם המחסנאי המאשר (עם מספר מדור כגון: חיים הדידה 8110)
const boxAddMachsanai = document.getElementById('boxAddMachsanai');
const newMachsanaiNameInput = document.getElementById('newMachsanaiNameInput');
const machsanaiNamesList = document.getElementById('machsanaiNamesList');
let currentMador = '';

const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let hasSignature = false;
let menahaleiList = [];
let nahagimList = [];
let mutzarimCatalogList = [];
let machsanaimList = [];
let addedProductSerialItems = [];
let addedPhotosList = [];

function getNowDateTimeIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showAlert(msg, type = 'error') {
  formAlert.textContent = msg;
  formAlert.className = `form-alert ${type} no-print`;
  if (type === 'success') {
    setTimeout(() => {
      formAlert.className = 'form-alert hidden no-print';
    }, 4500);
  }
}

// ==========================================
// 1. תפריט נפתח: שם מנהל עבודה
// ==========================================
function renderMenahaleiDropdown(selectedVal) {
  const current = selectedVal !== undefined ? selectedVal : machsanSholeach.value;
  machsanSholeach.innerHTML =
    `<option value="">-- בחר שם מנהל עבודה --</option>` +
    menahaleiList
      .map((m) => `<option value="${escapeHtml(m.shem)}">${escapeHtml(m.shem)}</option>`)
      .join('') +
    `<option value="__ADD_NEW__">➕ הוסף שם חדש לתפריט...</option>`;

  if (current && current !== '__ADD_NEW__') {
    machsanSholeach.value = current;
  }

  menahelNamesList.innerHTML = menahaleiList
    .map(
      (m) => `
      <div class="menahel-name-chip" data-select-shem="${escapeHtml(m.shem)}">
        <span>${escapeHtml(m.shem)}</span>
        <button type="button" class="chip-del-btn" data-del-id="${m.id}" title="מחק">✕</button>
      </div>
    `
    )
    .join('');

  menahelNamesList.querySelectorAll('.menahel-name-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      if (e.target.closest('.chip-del-btn')) return;
      machsanSholeach.value = chip.dataset.selectShem;
    });
  });

  menahelNamesList.querySelectorAll('.chip-del-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.delId);
      const res = await fetch(`/api/menahalei-avoda/${id}`, { method: 'DELETE' });
      if (res.ok) {
        menahaleiList = await res.json();
        renderMenahaleiDropdown('');
      }
    });
  });
}

machsanSholeach.addEventListener('change', () => {
  if (machsanSholeach.value === '__ADD_NEW__') {
    machsanSholeach.value = '';
    boxAddMenahel.classList.remove('hidden');
    newMenahelNameInput.focus();
  }
});

document.getElementById('btnOpenAddMenahel').addEventListener('click', () => {
  boxAddMenahel.classList.toggle('hidden');
  if (!boxAddMenahel.classList.contains('hidden')) {
    newMenahelNameInput.focus();
  }
});

async function loadMenahaleiAvoda() {
  try {
    const res = await fetch('/api/menahalei-avoda');
    if (res.ok) {
      menahaleiList = await res.json();
      renderMenahaleiDropdown();
    }
  } catch {
    // ignore
  }
}

async function addNewMenahelName() {
  const shem = newMenahelNameInput.value.trim();
  if (!shem) {
    newMenahelNameInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/menahalei-avoda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shem })
    });
    const data = await res.json();
    if (res.ok) {
      menahaleiList = data;
    }
  } catch {
    // ignore
  }

  newMenahelNameInput.value = '';
  boxAddMenahel.classList.add('hidden');
  renderMenahaleiDropdown(shem);
}

document.getElementById('btnAddMenahelName').addEventListener('click', addNewMenahelName);
newMenahelNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addNewMenahelName();
  }
});

// ==========================================
// 2. תפריט נפתח: שם הנהג
// ==========================================
function renderNahagimDropdown(selectedVal) {
  const current = selectedVal !== undefined ? selectedVal : shemNahag.value;
  shemNahag.innerHTML =
    `<option value="">-- בחר שם הנהג --</option>` +
    nahagimList
      .map((n) => `<option value="${escapeHtml(n.shem)}">${escapeHtml(n.shem)}</option>`)
      .join('') +
    `<option value="__ADD_NEW__">➕ הוסף שם נהג חדש לתפריט...</option>`;

  if (current && current !== '__ADD_NEW__') {
    shemNahag.value = current;
  }

  nahagNamesList.innerHTML = nahagimList
    .map(
      (n) => `
      <div class="menahel-name-chip" data-select-nahag="${escapeHtml(n.shem)}">
        <span>${escapeHtml(n.shem)}</span>
        <button type="button" class="chip-del-btn" data-del-nahag-id="${n.id}" title="מחק">✕</button>
      </div>
    `
    )
    .join('');

  nahagNamesList.querySelectorAll('.menahel-name-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      if (e.target.closest('.chip-del-btn')) return;
      shemNahag.value = chip.dataset.selectNahag;
    });
  });

  nahagNamesList.querySelectorAll('.chip-del-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.delNahagId);
      const res = await fetch(`/api/nahagim/${id}`, { method: 'DELETE' });
      if (res.ok) {
        nahagimList = await res.json();
        renderNahagimDropdown('');
      }
    });
  });
}

shemNahag.addEventListener('change', () => {
  if (shemNahag.value === '__ADD_NEW__') {
    shemNahag.value = '';
    boxAddNahag.classList.remove('hidden');
    newNahagNameInput.focus();
  }
});

document.getElementById('btnOpenAddNahag').addEventListener('click', () => {
  boxAddNahag.classList.toggle('hidden');
  if (!boxAddNahag.classList.contains('hidden')) {
    newNahagNameInput.focus();
  }
});

async function loadNahagim() {
  try {
    const res = await fetch('/api/nahagim');
    if (res.ok) {
      nahagimList = await res.json();
      renderNahagimDropdown();
    }
  } catch {
    // ignore
  }
}

async function addNewNahagName() {
  const shem = newNahagNameInput.value.trim();
  if (!shem) {
    newNahagNameInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/nahagim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shem })
    });
    const data = await res.json();
    if (res.ok) {
      nahagimList = data;
    }
  } catch {
    // ignore
  }

  newNahagNameInput.value = '';
  boxAddNahag.classList.add('hidden');
  renderNahagimDropdown(shem);
}

document.getElementById('btnAddNahagName').addEventListener('click', addNewNahagName);
newNahagNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addNewNahagName();
  }
});

// ==========================================
// 3. עמודת תאריך — תאריך היום והשעה אוטומטיים
// ==========================================
document.getElementById('btnNowDateTime').addEventListener('click', () => {
  taarichPrika.value = getNowDateTimeIso();
  if (typeof taarichPrika.showPicker === 'function') {
    try {
      taarichPrika.showPicker();
    } catch {
      // ignore
    }
  }
});

taarichPrika.addEventListener('click', () => {
  if (!taarichPrika.value) {
    taarichPrika.value = getNowDateTimeIso();
  }
  if (typeof taarichPrika.showPicker === 'function') {
    try {
      taarichPrika.showPicker();
    } catch {
      // ignore
    }
  }
});

// ==========================================
// 4. עמודת הערות — תפריט נפתח למוצרים + סידורי + תמונה
// ==========================================
function renderProductsDropdown(selectedVal) {
  const current = selectedVal !== undefined ? selectedVal : itemProductSelect.value;
  itemProductSelect.innerHTML =
    `<option value="">-- בחר מוצר --</option>` +
    mutzarimCatalogList
      .map((p) => `<option value="${escapeHtml(p.shem)}">${escapeHtml(p.shem)}</option>`)
      .join('') +
    `<option value="__ADD_NEW__">➕ הוסף מוצר חדש לתפריט...</option>`;

  if (current && current !== '__ADD_NEW__') {
    itemProductSelect.value = current;
  }

  catalogProductsList.innerHTML = mutzarimCatalogList
    .map(
      (p) => `
      <div class="menahel-name-chip" data-select-prod="${escapeHtml(p.shem)}">
        <span>📦 ${escapeHtml(p.shem)}</span>
        <button type="button" class="chip-del-btn" data-del-prod-id="${p.id}" title="מחק">✕</button>
      </div>
    `
    )
    .join('');

  catalogProductsList.querySelectorAll('.menahel-name-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      if (e.target.closest('.chip-del-btn')) return;
      itemProductSelect.value = chip.dataset.selectProd;
      itemSerialInput.focus();
    });
  });

  catalogProductsList.querySelectorAll('.chip-del-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.delProdId);
      const res = await fetch(`/api/mutzarim/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mutzarimCatalogList = await res.json();
        renderProductsDropdown('');
      }
    });
  });
}

itemProductSelect.addEventListener('change', () => {
  if (itemProductSelect.value === '__ADD_NEW__') {
    itemProductSelect.value = '';
    boxAddProduct.classList.remove('hidden');
    newCatalogProductInput.focus();
  } else if (itemProductSelect.value) {
    itemSerialInput.focus();
  }
});

document.getElementById('btnOpenAddProduct').addEventListener('click', () => {
  boxAddProduct.classList.toggle('hidden');
  if (!boxAddProduct.classList.contains('hidden')) {
    newCatalogProductInput.focus();
  }
});

async function loadMutzarimCatalog() {
  try {
    const res = await fetch('/api/mutzarim');
    if (res.ok) {
      mutzarimCatalogList = await res.json();
      renderProductsDropdown();
    }
  } catch {
    // ignore
  }
}

async function addNewCatalogProduct() {
  const shem = newCatalogProductInput.value.trim();
  if (!shem) {
    newCatalogProductInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/mutzarim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shem })
    });
    const data = await res.json();
    if (res.ok) {
      mutzarimCatalogList = data;
    }
  } catch {
    // ignore
  }

  newCatalogProductInput.value = '';
  boxAddProduct.classList.add('hidden');
  renderProductsDropdown(shem);
  itemSerialInput.focus();
}

document.getElementById('btnAddCatalogProduct').addEventListener('click', addNewCatalogProduct);
newCatalogProductInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addNewCatalogProduct();
  }
});

function renderAddedProductsTable() {
  if (addedProductSerialItems.length === 0) {
    addedProductsTableWrap.classList.add('hidden');
    addedProductsTbody.innerHTML = '';
    return;
  }

  addedProductsTableWrap.classList.remove('hidden');
  addedProductsTbody.innerHTML = addedProductSerialItems
    .map(
      (item, idx) => `
      <tr>
        <td><strong>${escapeHtml(item.product)}</strong></td>
        <td dir="ltr" style="text-align:right; font-family:monospace; font-weight:700;">${escapeHtml(item.serial)}</td>
        <td class="no-print" style="width:28px; text-align:center;">
          <button type="button" class="chip-del-btn" data-remove-ps-idx="${idx}" title="הסר">✕</button>
        </td>
      </tr>
    `
    )
    .join('');

  addedProductsTbody.querySelectorAll('[data-remove-ps-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.removePsIdx);
      addedProductSerialItems.splice(idx, 1);
      renderAddedProductsTable();
    });
  });
}

function addProductAndSerialRow() {
  const product = itemProductSelect.value.trim();
  const serial = itemSerialInput.value.trim();

  if (!product || product === '__ADD_NEW__') {
    showAlert('נא לבחור מוצר מהתפריט הנפתח (או להוסיף מוצר ב-➕)', 'error');
    itemProductSelect.focus();
    return;
  }
  if (!serial) {
    showAlert('נא להקליד מספר סידורי (Serial)', 'error');
    itemSerialInput.focus();
    return;
  }

  addedProductSerialItems.push({ product, serial });
  renderAddedProductsTable();
  itemSerialInput.value = '';
  itemSerialInput.focus();
}

document.getElementById('btnAddProductSerial').addEventListener('click', addProductAndSerialRow);
itemSerialInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addProductAndSerialRow();
  }
});

function renderAddedPhotos() {
  if (addedPhotosList.length === 0) {
    addedPhotosWrap.classList.add('hidden');
    photosGalleryList.innerHTML = '';
    return;
  }

  addedPhotosWrap.classList.remove('hidden');
  photosGalleryList.innerHTML = addedPhotosList
    .map(
      (dataUrl, idx) => `
      <div class="photo-thumb-card">
        <img src="${dataUrl}" alt="תמונה ${idx + 1}" />
        <button type="button" class="photo-del-btn no-print" data-remove-photo-idx="${idx}" title="הסר">✕</button>
      </div>
    `
    )
    .join('');

  photosGalleryList.querySelectorAll('[data-remove-photo-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.removePhotoIdx);
      addedPhotosList.splice(idx, 1);
      renderAddedPhotos();
    });
  });
}

document.getElementById('btnTriggerPhoto').addEventListener('click', () => {
  photoFileInput.click();
});

photoFileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files || []);
  files.forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        addedPhotosList.push(reader.result);
        renderAddedPhotos();
      }
    };
    reader.readAsDataURL(file);
  });
  photoFileInput.value = '';
});

// ==========================================
// 5. שם המחסנאי המאשר וחתימה — שמות עם מספר מדור (לדוגמה: חיים הדידה 8110)
// ==========================================
document.querySelectorAll('.btn-mador-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    const clickedMador = btn.dataset.mador || '';
    currentMador = currentMador === clickedMador ? '' : clickedMador;
    document.querySelectorAll('.btn-mador-tab').forEach((b) => {
      b.classList.toggle('active', b.dataset.mador === currentMador);
    });
    renderMachsanaimDropdown();
  });
});

function renderMachsanaimDropdown(selectedVal) {
  const current = selectedVal !== undefined ? selectedVal : shemMachsanai.value;
  const filtered = currentMador
    ? machsanaimList.filter((m) => String(m.shem).includes(currentMador))
    : machsanaimList;

  shemMachsanai.innerHTML =
    `<option value="">-- בחר שם המחסנאי המאשר --</option>` +
    filtered
      .map((m) => `<option value="${escapeHtml(m.shem)}">${escapeHtml(m.shem)}</option>`)
      .join('') +
    `<option value="__ADD_NEW__">➕ הוסף שם מאשר חדש לתפריט...</option>`;

  if (current && current !== '__ADD_NEW__') {
    shemMachsanai.value = current;
  }

  machsanaiNamesList.innerHTML = filtered
    .map(
      (m) => `
      <div class="menahel-name-chip" data-select-machsanai="${escapeHtml(m.shem)}">
        <span>${escapeHtml(m.shem)}</span>
        <button type="button" class="chip-del-btn" data-del-machsanai-id="${m.id}" title="מחק">✕</button>
      </div>
    `
    )
    .join('');

  machsanaiNamesList.querySelectorAll('.menahel-name-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      if (e.target.closest('.chip-del-btn')) return;
      shemMachsanai.value = chip.dataset.selectMachsanai;
    });
  });

  machsanaiNamesList.querySelectorAll('.chip-del-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.delMachsanaiId);
      const res = await fetch(`/api/machsanaim/${id}`, { method: 'DELETE' });
      if (res.ok) {
        machsanaimList = await res.json();
        renderMachsanaimDropdown('');
      }
    });
  });
}

shemMachsanai.addEventListener('change', () => {
  if (shemMachsanai.value === '__ADD_NEW__') {
    shemMachsanai.value = '';
    boxAddMachsanai.classList.remove('hidden');
    newMachsanaiNameInput.focus();
  }
});

document.getElementById('btnOpenAddMachsanai').addEventListener('click', () => {
  boxAddMachsanai.classList.toggle('hidden');
  if (!boxAddMachsanai.classList.contains('hidden')) {
    newMachsanaiNameInput.focus();
  }
});

async function loadMachsanaim() {
  try {
    const res = await fetch('/api/machsanaim');
    if (res.ok) {
      machsanaimList = await res.json();
      renderMachsanaimDropdown();
    }
  } catch {
    // ignore
  }
}

async function addNewMachsanaiName() {
  const shem = newMachsanaiNameInput.value.trim();
  if (!shem) {
    newMachsanaiNameInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/machsanaim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shem, mador: currentMador })
    });
    const data = await res.json();
    if (res.ok) {
      machsanaimList = data;
    }
  } catch {
    // ignore
  }

  const finalShem = currentMador && !shem.includes(currentMador) ? `${shem} ${currentMador}` : shem;
  newMachsanaiNameInput.value = '';
  boxAddMachsanai.classList.add('hidden');
  renderMachsanaimDropdown(finalShem);
}

document.getElementById('btnAddMachsanaiName').addEventListener('click', addNewMachsanaiName);
newMachsanaiNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addNewMachsanaiName();
  }
});

// לוח חתימה דיגיטלית
ctx.strokeStyle = '#0f172a';
ctx.lineWidth = 2.2;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function startDraw(e) {
  e.preventDefault();
  isDrawing = true;
  hasSignature = true;
  const { x, y } = getPos(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function draw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const { x, y } = getPos(e);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function endDraw() {
  isDrawing = false;
}

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', endDraw);

canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
window.addEventListener('touchend', endDraw);

function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasSignature = false;
}

document.getElementById('btnClearSignature').addEventListener('click', clearSignature);

function resetForm() {
  machsanSholeach.value = '';
  shemNahag.value = '';
  taarichPrika.value = getNowDateTimeIso();
  hearot.value = '';
  itemProductSelect.value = '';
  itemSerialInput.value = '';
  addedProductSerialItems = [];
  addedPhotosList = [];
  shemMachsanai.value = '';
  clearSignature();
  renderAddedProductsTable();
  renderAddedPhotos();
  formAlert.className = 'form-alert hidden no-print';
  const waCard = document.getElementById('whatsappConfirmCard');
  if (waCard) waCard.classList.add('hidden');
}

document.getElementById('btnResetForm').addEventListener('click', resetForm);

document.getElementById('btnPrintSheet').addEventListener('click', () => {
  window.print();
});

// ==========================================
// 6. הגדרת עד 3 אנשי קשר ל-WhatsApp (עם PIN) + רשימה ציבורית לכל העובדים
// ==========================================
// El PIN real vive solo en el servidor (variable de entorno ADMIN_PIN)
let verifiedPin = '';
async function verifyPinOnServer(pin) {
  try {
    const r = await fetch('/api/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: String(pin || '').trim() })
    });
    return r.ok;
  } catch {
    return false;
  }
}
const whatsappConfigBox = document.getElementById('whatsappConfigBox');
const waName1 = document.getElementById('waName1');
const waPhone1 = document.getElementById('waPhone1');
const waName2 = document.getElementById('waName2');
const waPhone2 = document.getElementById('waPhone2');
const waName3 = document.getElementById('waName3');
const waPhone3 = document.getElementById('waPhone3');
const waPhoneSavedStatus = document.getElementById('waPhoneSavedStatus');

const whatsappConfirmCard = document.getElementById('whatsappConfirmCard');
const whatsappRecipientsButtons = document.getElementById('whatsappRecipientsButtons');
const whatsappMessagePreview = document.getElementById('whatsappMessagePreview');

const adminRecordsCount = document.getElementById('adminRecordsCount');
const adminRecordsTbody = document.getElementById('adminRecordsTbody');
const adminSearchInput = document.getElementById('adminSearchInput');

let whatsappContacts = [
  { name: '', phone: '' },
  { name: '', phone: '' },
  { name: '', phone: '' }
];
let currentSavedRecordForWa = null;
let allSavedRecords = [];

function normalizeWhatsappPhone(rawPhone) {
  let clean = String(rawPhone || '').replace(/[^\d]/g, '');
  if (!clean) return '';
  if (clean.startsWith('05') && clean.length === 10) {
    clean = '972' + clean.slice(1);
  } else if (clean.startsWith('00')) {
    clean = clean.slice(2);
  }
  return clean;
}

function formatDateTimeDisplay(isoStr) {
  if (!isoStr) return '';
  return String(isoStr).replace('T', ' ');
}

function buildWhatsappMessage(rec) {
  let items = [];
  try {
    items = typeof rec.mutzarim_json === 'string' ? JSON.parse(rec.mutzarim_json) : rec.mutzarim_items || [];
  } catch {
    items = [];
  }

  let photos = [];
  try {
    photos = typeof rec.tmunot_json === 'string' ? JSON.parse(rec.tmunot_json) : rec.tmunot || [];
  } catch {
    photos = [];
  }

  const lines = [
    `📋 *אישור פריקה - חברת החשמל*${rec.id ? ` (#${rec.id})` : ''}`,
    `✅ החומר נבדק ומאושר לפריקה.`,
    `━━━━━━━━━━━━━━━━━━`,
    `👷 *שם מנהל עבודה:* ${rec.machsan_sholeach || '-'}`,
    `🚚 *שם הנהג:* ${rec.shem_nahag || '-'}`,
    `🕒 *תאריך פריקה:* ${formatDateTimeDisplay(rec.taarich_prika)}`
  ];

  if (items.length > 0) {
    lines.push(`📦 *מוצרים ומספר סידורי:*`);
    items.forEach((it, idx) => {
      lines.push(`  ${idx + 1}. ${it.product} | סידורי: ${it.serial}`);
    });
  }

  if (rec.hearot && rec.hearot.trim()) {
    lines.push(`📝 *הערות:* ${rec.hearot.trim()}`);
  }

  if (photos.length > 0) {
    lines.push(`📷 *תמונות מצורפות במערכת:* ${photos.length}`);
  }

  lines.push(`✍️ *שם המחסנאי המאשר:* ${rec.shem_machsanai || '-'}`);

  return lines.join('\n');
}

function buildWhatsappUrlForPhone(rec, rawPhone) {
  const msg = buildWhatsappMessage(rec);
  const phone = normalizeWhatsappPhone(rawPhone);
  const encoded = encodeURIComponent(msg);
  return phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

function renderCurrentEntryWhatsappButtons() {
  if (!currentSavedRecordForWa) return;

  const activeContacts = whatsappContacts.filter((c) => c && String(c.phone || '').trim() !== '');
  const waMsg = buildWhatsappMessage(currentSavedRecordForWa);
  whatsappMessagePreview.textContent = waMsg;

  if (activeContacts.length === 0) {
    const fallbackUrl = buildWhatsappUrlForPhone(currentSavedRecordForWa, '');
    whatsappRecipientsButtons.innerHTML = `
      <a href="${fallbackUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-send">
        📲 שלח אישור ב-WhatsApp
      </a>
      <span style="font-size:0.88rem; color:#14532d; align-self:center;">
        (ניתן להגדיר עד 3 אנשי קשר קבועים בכפתור ⚙️ למעלה עם קוד PIN)
      </span>
    `;
    return;
  }

  // מציג כפתור אחד אם הוגדר איש קשר אחד, או 2 / 3 כפתורים לפי אנשי הקשר שהוגדרו (עם השם ומספר ה-WhatsApp)
  whatsappRecipientsButtons.innerHTML = activeContacts
    .map((c) => {
      const url = buildWhatsappUrlForPhone(currentSavedRecordForWa, c.phone);
      const labelName = c.name ? escapeHtml(c.name) : 'איש קשר';
      const labelPhone = escapeHtml(c.phone);
      return `
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-send">
          📲 שלח ל-${labelName} (<span dir="ltr">${labelPhone}</span>)
        </a>
      `;
    })
    .join('');
}

function populateContactsInputs() {
  const c1 = whatsappContacts[0] || { name: '', phone: '' };
  const c2 = whatsappContacts[1] || { name: '', phone: '' };
  const c3 = whatsappContacts[2] || { name: '', phone: '' };
  waName1.value = c1.name || '';
  waPhone1.value = c1.phone || '';
  waName2.value = c2.name || '';
  waPhone2.value = c2.phone || '';
  waName3.value = c3.name || '';
  waPhone3.value = c3.phone || '';
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.whatsapp_contacts)) {
        whatsappContacts = data.whatsapp_contacts;
      }
      populateContactsInputs();
      if (currentSavedRecordForWa) {
        renderCurrentEntryWhatsappButtons();
      }
    }
  } catch {
    // ignore
  }
}

document.getElementById('btnOpenWhatsappConfig').addEventListener('click', async () => {
  if (!whatsappConfigBox.classList.contains('hidden')) {
    whatsappConfigBox.classList.add('hidden');
    return;
  }
  const enteredPin = window.prompt('נא להזין קוד PIN להגדרת אנשי הקשר של WhatsApp:');
  if (enteredPin === null) return;
  const okPin = await verifyPinOnServer(enteredPin);
  if (!okPin) {
    window.alert('❌ קוד PIN שגוי!');
    return;
  }
  verifiedPin = enteredPin.trim();
  populateContactsInputs();
  whatsappConfigBox.classList.remove('hidden');
  waName1.focus();
});

document.getElementById('btnCloseWhatsappConfig').addEventListener('click', () => {
  whatsappConfigBox.classList.add('hidden');
});

document.getElementById('btnSaveWhatsappContacts').addEventListener('click', async () => {
  const newContacts = [
    { name: waName1.value.trim(), phone: waPhone1.value.trim() },
    { name: waName2.value.trim(), phone: waPhone2.value.trim() },
    { name: waName3.value.trim(), phone: waPhone3.value.trim() }
  ];

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pin: verifiedPin,
        whatsapp_contacts: newContacts
      })
    });
    const data = await res.json();
    if (!res.ok) {
      showAlert(data.error || 'שגיאה בשמירת אנשי הקשר', 'error');
      return;
    }

    whatsappContacts = data.whatsapp_contacts || newContacts;
    populateContactsInputs();
    if (currentSavedRecordForWa) {
      renderCurrentEntryWhatsappButtons();
    }
    waPhoneSavedStatus.textContent = '✅ אנשי הקשר נשמרו בהצלחה!';
    setTimeout(() => {
      waPhoneSavedStatus.textContent = '';
      whatsappConfigBox.classList.add('hidden');
    }, 1800);
  } catch {
    showAlert('שגיאת תקשורת עם השרת.', 'error');
  }
});

document.getElementById('btnRefreshAdmin').addEventListener('click', loadAllSavedRecords);
adminSearchInput.addEventListener('input', renderAdminRecordsTable);

function renderAdminRecordsTable() {
  if (adminRecordsCount) {
    adminRecordsCount.textContent = String(allSavedRecords.length);
  }

  const q = (adminSearchInput.value || '').trim().toLowerCase();
  const filtered = q
    ? allSavedRecords.filter((r) => {
        const blob = [
          r.id,
          r.machsan_sholeach,
          r.shem_nahag,
          r.taarich_prika,
          r.hearot,
          r.mutzarim_json,
          r.shem_machsanai
        ]
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      })
    : allSavedRecords;

  if (filtered.length === 0) {
    adminRecordsTbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 1.2rem; color: #64748b;">
          אין עדיין פעולות שמורות במערכת.
        </td>
      </tr>
    `;
    return;
  }

  adminRecordsTbody.innerHTML = filtered
    .map((r) => {
      let items = [];
      try {
        items = JSON.parse(r.mutzarim_json || '[]');
      } catch {
        items = [];
      }

      let photos = [];
      try {
        photos = JSON.parse(r.tmunot_json || '[]');
      } catch {
        photos = [];
      }

      const itemsHtml = items
        .map(
          (it) =>
            `<div>📦 <strong>${escapeHtml(it.product)}</strong> — סידורי: <code dir="ltr">${escapeHtml(it.serial)}</code></div>`
        )
        .join('');

      const noteHtml = r.hearot ? `<div>📝 ${escapeHtml(r.hearot)}</div>` : '';

      const photosHtml =
        photos.length > 0
          ? `<div style="display:flex; gap:4px; flex-wrap:wrap;">` +
            photos
              .map(
                (p, i) =>
                  `<a href="${p}" target="_blank" title="פתיחת תמונה"><img src="${p}" alt="תמונה ${i + 1}" style="width:48px;height:40px;object-fit:cover;border-radius:4px;border:1px solid #cbd5e1;" /></a>`
              )
              .join('') +
            `</div>`
          : '-';

      const sigHtml = r.chatima_data_url
        ? `<div><img src="${r.chatima_data_url}" alt="חתימה" style="max-width:110px; max-height:42px; border:1px solid #e2e8f0; background:#fff;" /></div>`
        : '';

      return `
        <tr>
          <td><strong>#${r.id}</strong></td>
          <td>${escapeHtml(r.machsan_sholeach)}</td>
          <td>${escapeHtml(r.shem_nahag)}</td>
          <td dir="ltr" style="text-align:right;">${escapeHtml(formatDateTimeDisplay(r.taarich_prika))}</td>
          <td>${itemsHtml}${noteHtml || (!itemsHtml ? '-' : '')}</td>
          <td>${photosHtml}</td>
          <td>
            <div><strong>${escapeHtml(r.shem_machsanai || '-')}</strong></div>
            ${sigHtml}
          </td>
          <td style="text-align:center; vertical-align:middle;">
            <button type="button" class="btn-del-row" data-del-rec-id="${r.id}" title="מחק פעולה (דורש קוד PIN)">
              🗑️
            </button>
          </td>
        </tr>
      `;
    })
    .join('');

  adminRecordsTbody.querySelectorAll('[data-del-rec-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.delRecId);
      const enteredPin = window.prompt('נא להזין קוד PIN למחיקת הפעולה:');
      if (enteredPin === null) return;
      // El PIN se valida en el servidor (DELETE responde error si es incorrecto)
      const res = await fetch(`/api/ishur-prika/${id}?pin=${encodeURIComponent(enteredPin.trim())}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: enteredPin.trim() })
      });
      if (res.ok) {
        allSavedRecords = await res.json();
        renderAdminRecordsTable();
      } else {
        const errData = await res.json().catch(() => ({}));
        window.alert(errData.error || 'שגיאה במחיקת הפעולה');
      }
    });
  });
}

async function loadAllSavedRecords() {
  try {
    const res = await fetch('/api/ishur-prika');
    if (res.ok) {
      allSavedRecords = await res.json();
      renderAdminRecordsTable();
    }
  } catch {
    // ignore
  }
}

document.getElementById('btnExportCsv').addEventListener('click', () => {
  if (allSavedRecords.length === 0) return;
  const headers = ['ID', 'שם מנהל עבודה', 'שם הנהג', 'תאריך פריקה', 'מוצרים וסידורי', 'הערות', 'שם המחסנאי המאשר', 'תאריך יצירה'];
  const rows = allSavedRecords.map((r) => {
    let items = [];
    try {
      items = JSON.parse(r.mutzarim_json || '[]');
    } catch {
      items = [];
    }
    const itemsStr = items.map((i) => `${i.product} (${i.serial})`).join(' | ');
    return [
      r.id,
      r.machsan_sholeach,
      r.shem_nahag,
      r.taarich_prika,
      itemsStr,
      r.hearot,
      r.shem_machsanai,
      r.creado_en
    ].map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ishur_prika_records_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    machsan_sholeach: machsanSholeach.value.trim(),
    shem_nahag: shemNahag.value.trim(),
    taarich_prika: taarichPrika.value,
    hearot: hearot.value.trim(),
    mutzarim_items: addedProductSerialItems,
    tmunot: addedPhotosList,
    shem_machsanai: shemMachsanai.value.trim(),
    chatima_data_url: hasSignature ? canvas.toDataURL('image/png') : ''
  };

  if (!payload.machsan_sholeach) {
    showAlert('נא לבחור שם מנהל עבודה מהתפריט הנפתח', 'error');
    machsanSholeach.focus();
    return;
  }
  if (!payload.shem_nahag) {
    showAlert('נא לבחור שם הנהג מהתפריט הנפתח', 'error');
    shemNahag.focus();
    return;
  }
  if (!payload.taarich_prika) {
    showAlert('נא למלא תאריך', 'error');
    taarichPrika.focus();
    return;
  }

  try {
    const res = await fetch('/api/ishur-prika', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'שגיאה בשמירת הטופס', 'error');
      return;
    }

    if (Array.isArray(data.menahalei_avoda)) {
      menahaleiList = data.menahalei_avoda;
      renderMenahaleiDropdown(payload.machsan_sholeach);
    }
    if (Array.isArray(data.nahagim)) {
      nahagimList = data.nahagim;
      renderNahagimDropdown(payload.shem_nahag);
    }
    if (Array.isArray(data.mutzarim)) {
      mutzarimCatalogList = data.mutzarim;
      renderProductsDropdown();
    }
    if (Array.isArray(data.machsanaim)) {
      machsanaimList = data.machsanaim;
      renderMachsanaimDropdown(payload.shem_machsanai);
    }

    currentSavedRecordForWa = data.record || payload;
    renderCurrentEntryWhatsappButtons();
    whatsappConfirmCard.classList.remove('hidden');

    await loadAllSavedRecords();

    showAlert('✅ אישור הפריקה נשמר! בחר למטה למי לשלוח את ההודעה ב-WhatsApp.', 'success');
    whatsappConfirmCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch {
    showAlert('שגיאת תקשורת עם השרת.', 'error');
  }
});

// אתחול
resetForm();
loadSettings();
loadMenahaleiAvoda();
loadNahagim();
loadMutzarimCatalog();
loadMachsanaim();
loadAllSavedRecords();
