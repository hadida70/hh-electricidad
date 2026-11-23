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
const cameraFileInput = document.getElementById('cameraFileInput');
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
// 4. עמודת הערות — תפריט נפתח למוצרים + סידורי + תמונה (רשימת To-Do בלחיצה כפולה)
// ==========================================
function quickAddProductToTodo(prodName) {
  const product = String(prodName || '').trim();
  if (!product || product === '__ADD_NEW__') return;
  const serial = itemSerialInput.value.trim();
  addedProductSerialItems.push({ product, serial });
  itemSerialInput.value = '';
  itemProductSelect.value = '';
  renderAddedProductsTable();
  renderProductsDropdown('');
}

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

  const addedCounts = {};
  addedProductSerialItems.forEach((it) => {
    addedCounts[it.product] = (addedCounts[it.product] || 0) + 1;
  });

  catalogProductsList.innerHTML = mutzarimCatalogList
    .map((p) => {
      const count = addedCounts[p.shem] || 0;
      const badge = count > 0 ? ` <strong>(✓${count > 1 ? count : ''})</strong>` : '';
      return `
      <div class="menahel-name-chip${count > 0 ? ' is-in-todo' : ''}" data-select-prod="${escapeHtml(p.shem)}" title="לחיצה כפולה להוספה מהירה לרשימה">
        <span>${count > 0 ? '✅' : '📦'} ${escapeHtml(p.shem)}${badge}</span>
        <button type="button" class="chip-del-btn" data-del-prod-id="${p.id}" title="מחק">✕</button>
      </div>
    `;
    })
    .join('');

  catalogProductsList.querySelectorAll('.menahel-name-chip').forEach((chip) => {
    let lastTapTime = 0;
    chip.addEventListener('click', (e) => {
      if (e.target.closest('.chip-del-btn')) return;
      const now = Date.now();
      if (now - lastTapTime < 380) {
        // Double click / double tap en móvil o PC -> agrega directo al To-Do
        lastTapTime = 0;
        quickAddProductToTodo(chip.dataset.selectProd);
        return;
      }
      lastTapTime = now;
      itemProductSelect.value = chip.dataset.selectProd;
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

itemProductSelect.addEventListener('dblclick', () => {
  if (itemProductSelect.value && itemProductSelect.value !== '__ADD_NEW__') {
    quickAddProductToTodo(itemProductSelect.value);
  }
});

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
      <li class="todo-product-item">
        <div class="todo-product-main">
          <input type="checkbox" class="todo-product-check no-print" data-remove-ps-idx="${idx}" checked title="הסר מהרשימה" />
          <strong>${idx + 1}. ${escapeHtml(item.product)}</strong>
          ${
            item.serial
              ? `<span class="todo-serial-badge" dir="ltr">סידורי: ${escapeHtml(item.serial)}</span>`
              : ''
          }
        </div>
        <button type="button" class="chip-del-btn no-print" data-remove-ps-idx="${idx}" title="הסר">✕</button>
      </li>
    `
    )
    .join('');

  addedProductsTbody.querySelectorAll('[data-remove-ps-idx]').forEach((el) => {
    const handler = () => {
      const idx = Number(el.dataset.removePsIdx);
      addedProductSerialItems.splice(idx, 1);
      renderAddedProductsTable();
      renderProductsDropdown();
    };
    if (el.tagName === 'INPUT') {
      el.addEventListener('change', handler);
    } else {
      el.addEventListener('click', handler);
    }
  });
}

function addProductAndSerialRow() {
  const product = itemProductSelect.value.trim();
  const serial = itemSerialInput.value.trim();

  if (!product || product === '__ADD_NEW__') {
    showAlert('נא לבחור מוצר מהתפריט הנפתח (או לחיצה כפולה על מוצר)', 'error');
    itemProductSelect.focus();
    return;
  }

  addedProductSerialItems.push({ product, serial });
  itemSerialInput.value = '';
  itemProductSelect.value = '';
  renderAddedProductsTable();
  renderProductsDropdown('');
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

function compressImageFile(file, maxDim = 1280, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_error'));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return reject(new Error('empty_data'));

      const img = new Image();
      img.onload = () => {
        try {
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (!w || !h) return resolve(dataUrl);
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

async function handleSelectedPhotoFiles(inputEl) {
  const files = Array.from(inputEl.files || []);
  for (const file of files) {
    if (file.type && !file.type.startsWith('image/')) continue;
    try {
      const compressed = await compressImageFile(file);
      if (compressed) {
        addedPhotosList.push(compressed);
        renderAddedPhotos();
      }
    } catch {
      showAlert('שגיאה בטעינת התמונה מהמצלמה/גלריה', 'error');
    }
  }
  inputEl.value = '';
}

if (cameraFileInput) {
  cameraFileInput.addEventListener('change', () => handleSelectedPhotoFiles(cameraFileInput));
}

// ==========================================
// 5. שם המחסנאי המאשר וחתימה — בחירת מדור (עם PIN לכל מדור) תחילה ואז בחירת שם
// ==========================================
const MADORES_LIST = ['8120', '8150', '8110', '8130', '8330'];
const madorLockStatus = document.getElementById('madorLockStatus');
let configuredMadores = {};
const unlockedMadorPins = {};

function updateMadorUiState() {
  document.querySelectorAll('.btn-mador-tab').forEach((b) => {
    const m = b.dataset.mador || '';
    const isActive = m === currentMador;
    const isLocked = Boolean(configuredMadores[m]) && !unlockedMadorPins[m];
    b.classList.toggle('active', isActive);
    b.textContent = isLocked ? `🔒 ${m}` : m;
  });

  if (madorLockStatus) {
    if (!currentMador) {
      madorLockStatus.textContent = '🔒 יש לבחור קודם את המדור שאליו אתה שייך (8120 / 8150 / 8110 / 8130 / 8330)';
      madorLockStatus.classList.remove('is-unlocked');
    } else {
      madorLockStatus.textContent = `🔓 מדור ${currentMador} פתוח — בחר את שמך מהרשימה`;
      madorLockStatus.classList.add('is-unlocked');
    }
  }
}

document.querySelectorAll('.btn-mador-tab').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const clickedMador = btn.dataset.mador || '';
    if (!clickedMador) return;

    if (currentMador === clickedMador) {
      currentMador = '';
      updateMadorUiState();
      renderMachsanaimDropdown('');
      return;
    }

    if (configuredMadores[clickedMador] && !unlockedMadorPins[clickedMador]) {
      const entered = window.prompt(`נא להזין קוד PIN של מדור ${clickedMador}:`);
      if (entered === null) return;
      try {
        const res = await fetch('/api/verify-mador-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mador: clickedMador, pin: entered.trim() })
        });
        if (!res.ok) {
          window.alert(`❌ קוד PIN שגוי עבור מדור ${clickedMador}!`);
          return;
        }
        unlockedMadorPins[clickedMador] = entered.trim();
      } catch {
        window.alert('שגיאת תקשורת עם השרת.');
        return;
      }
    }

    currentMador = clickedMador;
    updateMadorUiState();
    renderMachsanaimDropdown('');
  });
});

function renderMachsanaimDropdown(selectedVal) {
  updateMadorUiState();

  if (!currentMador) {
    shemMachsanai.innerHTML = `<option value="">-- יש לבחור מדור תחילה --</option>`;
    shemMachsanai.disabled = true;
    machsanaiNamesList.innerHTML = '';
    return;
  }

  shemMachsanai.disabled = false;
  const current = selectedVal !== undefined ? selectedVal : shemMachsanai.value;
  const filtered = machsanaimList.filter((m) => String(m.shem).includes(currentMador));

  shemMachsanai.innerHTML =
    `<option value="">-- בחר שם המחסנאי המאשר (${currentMador}) --</option>` +
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
  renderMachsanaimDropdown('');
  renderProductsDropdown('');
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
const waContactsList = document.getElementById('waContactsList');
const waPhoneSavedStatus = document.getElementById('waPhoneSavedStatus');

const whatsappConfirmCard = document.getElementById('whatsappConfirmCard');
const whatsappRecipientsButtons = document.getElementById('whatsappRecipientsButtons');
const whatsappMessagePreview = document.getElementById('whatsappMessagePreview');

const adminRecordsCount = document.getElementById('adminRecordsCount');
const adminRecordsTbody = document.getElementById('adminRecordsTbody');
const adminSearchInput = document.getElementById('adminSearchInput');

let whatsappContacts = [];
let editingWhatsappContacts = [];
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
      const serialPart = it.serial ? ` | סידורי: ${it.serial}` : '';
      lines.push(`  ${idx + 1}. ${it.product}${serialPart}`);
    });
  }

  if (rec.hearot && rec.hearot.trim()) {
    lines.push(`📝 *הערות:* ${rec.hearot.trim()}`);
  }

  if (photos.length > 0) {
    const origin = window.location.origin;
    lines.push(`📷 *תמונות מצורפות (${photos.length}):*`);
    photos.forEach((_, idx) => {
      if (rec.id) {
        lines.push(`${origin}/photo/${rec.id}/${idx + 1}.jpg`);
      }
    });
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

  const contactsWithPhone = whatsappContacts.filter((c) => c && String(c.phone || '').trim() !== '');
  const activeContact =
    contactsWithPhone.find((c) => Boolean(c.active)) || contactsWithPhone[0] || null;

  const waMsg = buildWhatsappMessage(currentSavedRecordForWa);
  whatsappMessagePreview.textContent = waMsg;

  if (!activeContact) {
    const fallbackUrl = buildWhatsappUrlForPhone(currentSavedRecordForWa, '');
    whatsappRecipientsButtons.innerHTML = `
      <a href="${fallbackUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-send">
        📲 שלח אישור ב-WhatsApp
      </a>
      <span style="font-size:0.88rem; color:#14532d; align-self:center;">
        (ניתן להגדיר אנשי קשר בכפתור ⚙️ למעלה עם קוד PIN)
      </span>
    `;
    return;
  }

  // מציג כפתור אחד בלבד עבור איש הקשר הפעיל שנבחר בהגדרות
  const url = buildWhatsappUrlForPhone(currentSavedRecordForWa, activeContact.phone);
  const label = activeContact.name
    ? `📲 שלח אישור ב-WhatsApp ל-${escapeHtml(activeContact.name)}`
    : '📲 שלח אישור ב-WhatsApp';
  whatsappRecipientsButtons.innerHTML = `
    <a href="${url}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-send">
      ${label}
    </a>
  `;
}

function collectEditingContactsFromDom() {
  if (!waContactsList) return [];
  return Array.from(waContactsList.querySelectorAll('.wa-contact-row')).map((row) => ({
    name: (row.querySelector('.wa-name-input')?.value || '').trim(),
    phone: (row.querySelector('.wa-phone-input')?.value || '').trim(),
    active: Boolean(row.querySelector('.wa-active-radio')?.checked)
  }));
}

function renderWhatsappContactsEditor() {
  if (!waContactsList) return;
  const list = editingWhatsappContacts.length
    ? editingWhatsappContacts
    : [{ name: '', phone: '', active: true }];

  waContactsList.innerHTML = list
    .map((c, idx) => {
      const isChecked = Boolean(c.active);
      return `
        <div class="wa-contact-row${isChecked ? ' is-active' : ''}" data-idx="${idx}">
          <label class="wa-active-label" title="בחר כאיש קשר פעיל לשליחת הודעות">
            <input type="radio" name="waActiveContact" class="wa-active-radio" ${isChecked ? 'checked' : ''} />
            <span>פעיל</span>
          </label>
          <input type="text" class="wa-name-input" value="${escapeHtml(c.name || '')}" placeholder="שם איש קשר ${idx + 1}..." autocomplete="off" />
          <input type="text" class="wa-phone-input" dir="ltr" value="${escapeHtml(c.phone || '')}" placeholder="מספר WhatsApp (כגון: 0501234567)..." autocomplete="off" />
          <button type="button" class="chip-del-btn wa-del-row" data-del-wa-idx="${idx}" title="מחק איש קשר">✕</button>
        </div>
      `;
    })
    .join('');

  waContactsList.querySelectorAll('.wa-active-radio').forEach((radio) => {
    radio.addEventListener('change', () => {
      waContactsList.querySelectorAll('.wa-contact-row').forEach((row) => {
        const r = row.querySelector('.wa-active-radio');
        row.classList.toggle('is-active', Boolean(r && r.checked));
      });
    });
  });

  waContactsList.querySelectorAll('[data-del-wa-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingWhatsappContacts = collectEditingContactsFromDom();
      const idx = Number(btn.dataset.delWaIdx);
      const removedWasActive = Boolean(editingWhatsappContacts[idx]?.active);
      editingWhatsappContacts.splice(idx, 1);
      if (editingWhatsappContacts.length === 0) {
        editingWhatsappContacts.push({ name: '', phone: '', active: true });
      } else if (removedWasActive) {
        editingWhatsappContacts[0].active = true;
      }
      renderWhatsappContactsEditor();
    });
  });
}

function populateContactsInputs() {
  editingWhatsappContacts = whatsappContacts.map((c) => ({
    name: c.name || '',
    phone: c.phone || '',
    active: Boolean(c.active)
  }));
  if (editingWhatsappContacts.length === 0) {
    editingWhatsappContacts.push({ name: '', phone: '', active: true });
  }
  renderWhatsappContactsEditor();
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.whatsapp_contacts)) {
        whatsappContacts = data.whatsapp_contacts;
      }
      if (data.configured_madores && typeof data.configured_madores === 'object') {
        configuredMadores = data.configured_madores;
        updateMadorUiState();
      }
      if (typeof data.admin_name === 'string') {
        currentAdminName = data.admin_name || 'מנהל המערכת';
        if (adminNameDisplay) adminNameDisplay.textContent = currentAdminName;
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

async function loadAdminMadorPins() {
  try {
    const res = await fetch('/api/admin/mador-pins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: verifiedPin })
    });
    if (res.ok) {
      const data = await res.json();
      const pins = data.mador_pins || {};
      MADORES_LIST.forEach((m) => {
        const el = document.getElementById(`madorPin${m}`);
        if (el) el.value = pins[m] || '';
      });
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
  await loadAdminMadorPins();
  whatsappConfigBox.classList.remove('hidden');
  const firstInput = waContactsList.querySelector('.wa-name-input');
  if (firstInput) firstInput.focus();
});

document.getElementById('btnCloseWhatsappConfig').addEventListener('click', () => {
  whatsappConfigBox.classList.add('hidden');
});

document.getElementById('btnAddWhatsappContact').addEventListener('click', () => {
  editingWhatsappContacts = collectEditingContactsFromDom();
  const hasActive = editingWhatsappContacts.some((c) => c.active);
  editingWhatsappContacts.push({ name: '', phone: '', active: !hasActive });
  renderWhatsappContactsEditor();
  const inputs = waContactsList.querySelectorAll('.wa-name-input');
  if (inputs.length) inputs[inputs.length - 1].focus();
});

document.getElementById('btnSaveWhatsappContacts').addEventListener('click', async () => {
  const rawContacts = collectEditingContactsFromDom();
  const newContacts = rawContacts.filter((c) => c.name !== '' || c.phone !== '');
  const madorPinsPayload = {};
  MADORES_LIST.forEach((m) => {
    const el = document.getElementById(`madorPin${m}`);
    madorPinsPayload[m] = el ? el.value.trim() : '';
  });

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pin: verifiedPin,
        whatsapp_contacts: newContacts,
        mador_pins: madorPinsPayload
      })
    });
    const data = await res.json();
    if (!res.ok) {
      showAlert(data.error || 'שגיאה בשמירת ההגדרות', 'error');
      return;
    }

    whatsappContacts = data.whatsapp_contacts || newContacts;
    if (data.configured_madores && typeof data.configured_madores === 'object') {
      configuredMadores = data.configured_madores;
      // Limpiar sesiones desbloqueadas si cambió o se activó PIN
      Object.keys(unlockedMadorPins).forEach((m) => {
        if (madorPinsPayload[m] !== unlockedMadorPins[m]) {
          delete unlockedMadorPins[m];
          if (currentMador === m) currentMador = '';
        }
      });
      renderMachsanaimDropdown();
    }
    populateContactsInputs();
    if (currentSavedRecordForWa) {
      renderCurrentEntryWhatsappButtons();
    }
    waPhoneSavedStatus.textContent = '✅ ההגדרות נשמרו בהצלחה!';
    setTimeout(() => {
      waPhoneSavedStatus.textContent = '';
      whatsappConfigBox.classList.add('hidden');
    }, 1800);
  } catch {
    showAlert('שגיאת תקשורת עם השרת.', 'error');
  }
});

const publicOperationsSection = document.getElementById('publicOperationsSection');
const btnOpenAdminAccess = document.getElementById('btnOpenAdminAccess');
const btnCloseAdminAccess = document.getElementById('btnCloseAdminAccess');
const adminNameDisplay = document.getElementById('adminNameDisplay');
const btnEditAdminName = document.getElementById('btnEditAdminName');
const adminNameEditWrap = document.getElementById('adminNameEditWrap');
const adminNameInput = document.getElementById('adminNameInput');
const btnSaveAdminName = document.getElementById('btnSaveAdminName');
const btnCancelAdminName = document.getElementById('btnCancelAdminName');

const adminFilterMador = document.getElementById('adminFilterMador');
const adminFilterDateFrom = document.getElementById('adminFilterDateFrom');
const adminFilterDateTo = document.getElementById('adminFilterDateTo');
const adminFilterMenahel = document.getElementById('adminFilterMenahel');
const adminFilterNahag = document.getElementById('adminFilterNahag');
const btnClearAdminFilters = document.getElementById('btnClearAdminFilters');

let isAdminUnlocked = false;
let currentAdminName = 'מנהל המערכת';

if (btnOpenAdminAccess) {
  btnOpenAdminAccess.addEventListener('click', async () => {
    if (isAdminUnlocked && publicOperationsSection) {
      publicOperationsSection.classList.remove('hidden');
      publicOperationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const enteredPin = window.prompt('נא להזין קוד PIN לכניסת מנהל:');
    if (enteredPin === null) return;
    const okPin = await verifyPinOnServer(enteredPin);
    if (!okPin) {
      window.alert('❌ קוד PIN שגוי!');
      return;
    }
    verifiedPin = enteredPin.trim();
    isAdminUnlocked = true;
    if (publicOperationsSection) {
      publicOperationsSection.classList.remove('hidden');
    }
    await loadAllSavedRecords();
    if (publicOperationsSection) {
      publicOperationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

if (btnCloseAdminAccess) {
  btnCloseAdminAccess.addEventListener('click', () => {
    isAdminUnlocked = false;
    allSavedRecords = [];
    if (publicOperationsSection) {
      publicOperationsSection.classList.add('hidden');
    }
  });
}

if (btnEditAdminName) {
  btnEditAdminName.addEventListener('click', () => {
    adminNameInput.value = currentAdminName === 'מנהל המערכת' ? '' : currentAdminName;
    adminNameEditWrap.classList.remove('hidden');
    adminNameInput.focus();
  });
}

if (btnCancelAdminName) {
  btnCancelAdminName.addEventListener('click', () => {
    adminNameEditWrap.classList.add('hidden');
  });
}

if (btnSaveAdminName) {
  btnSaveAdminName.addEventListener('click', async () => {
    const newName = adminNameInput.value.trim();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: verifiedPin, admin_name: newName })
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error || 'שגיאה בשמירת שם המנהל');
        return;
      }
      currentAdminName = data.admin_name || 'מנהל המערכת';
      adminNameDisplay.textContent = currentAdminName;
      adminNameEditWrap.classList.add('hidden');
    } catch {
      window.alert('שגיאת תקשורת עם השרת.');
    }
  });
}

document.getElementById('btnRefreshAdmin').addEventListener('click', loadAllSavedRecords);
adminSearchInput.addEventListener('input', renderAdminRecordsTable);
[adminFilterMador, adminFilterDateFrom, adminFilterDateTo, adminFilterMenahel, adminFilterNahag].forEach((el) => {
  if (el) el.addEventListener('change', renderAdminRecordsTable);
});
if (btnClearAdminFilters) {
  btnClearAdminFilters.addEventListener('click', () => {
    if (adminFilterMador) adminFilterMador.value = '';
    if (adminFilterDateFrom) adminFilterDateFrom.value = '';
    if (adminFilterDateTo) adminFilterDateTo.value = '';
    if (adminFilterMenahel) adminFilterMenahel.value = '';
    if (adminFilterNahag) adminFilterNahag.value = '';
    if (adminSearchInput) adminSearchInput.value = '';
    renderAdminRecordsTable();
  });
}

function populateAdminFilterDropdowns() {
  if (adminFilterMenahel) {
    const prev = adminFilterMenahel.value;
    const names = Array.from(new Set(allSavedRecords.map((r) => (r.machsan_sholeach || '').trim()).filter(Boolean))).sort();
    adminFilterMenahel.innerHTML =
      `<option value="">כל מנהלי העבודה</option>` +
      names.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
    if (prev && names.includes(prev)) adminFilterMenahel.value = prev;
  }
  if (adminFilterNahag) {
    const prev = adminFilterNahag.value;
    const drivers = Array.from(new Set(allSavedRecords.map((r) => (r.shem_nahag || '').trim()).filter(Boolean))).sort();
    adminFilterNahag.innerHTML =
      `<option value="">כל הנהגים</option>` +
      drivers.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
    if (prev && drivers.includes(prev)) adminFilterNahag.value = prev;
  }
}

function getFilteredAdminRecords() {
  const madorVal = adminFilterMador ? adminFilterMador.value : '';
  const dateFrom = adminFilterDateFrom ? adminFilterDateFrom.value : '';
  const dateTo = adminFilterDateTo ? adminFilterDateTo.value : '';
  const menahelVal = adminFilterMenahel ? adminFilterMenahel.value : '';
  const nahagVal = adminFilterNahag ? adminFilterNahag.value : '';
  const q = (adminSearchInput.value || '').trim().toLowerCase();

  return allSavedRecords.filter((r) => {
    if (madorVal && !String(r.shem_machsanai || '').includes(madorVal)) return false;
    const recDate = String(r.taarich_prika || '').slice(0, 10);
    if (dateFrom && (!recDate || recDate < dateFrom)) return false;
    if (dateTo && (!recDate || recDate > dateTo)) return false;
    if (menahelVal && String(r.machsan_sholeach || '').trim() !== menahelVal) return false;
    if (nahagVal && String(r.shem_nahag || '').trim() !== nahagVal) return false;
    if (q) {
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
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

function renderAdminRecordsTable() {
  const filtered = getFilteredAdminRecords();
  if (adminRecordsCount) {
    adminRecordsCount.textContent =
      filtered.length === allSavedRecords.length
        ? String(allSavedRecords.length)
        : `${filtered.length} / ${allSavedRecords.length}`;
  }

  if (filtered.length === 0) {
    adminRecordsTbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 1.2rem; color: #64748b;">
          לא נמצאו פעולות התואמות לסינון.
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
        .map((it) =>
          it.serial
            ? `<div>📦 <strong>${escapeHtml(it.product)}</strong> — סידורי: <code dir="ltr">${escapeHtml(it.serial)}</code></div>`
            : `<div>📦 <strong>${escapeHtml(it.product)}</strong></div>`
        )
        .join('');

      const noteHtml = r.hearot ? `<div>📝 ${escapeHtml(r.hearot)}</div>` : '';

      const photosHtml =
        photos.length > 0
          ? `<div style="display:flex; gap:4px; flex-wrap:wrap;">` +
            photos
              .map(
                (p, i) =>
                  `<a href="/photo/${r.id}/${i + 1}.jpg" target="_blank" title="פתיחת תמונה"><img src="${p}" alt="תמונה ${i + 1}" style="width:48px;height:40px;object-fit:cover;border-radius:4px;border:1px solid #cbd5e1;" /></a>`
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
        populateAdminFilterDropdowns();
        renderAdminRecordsTable();
      } else {
        const errData = await res.json().catch(() => ({}));
        window.alert(errData.error || 'שגיאה במחיקת הפעולה');
      }
    });
  });
}

async function loadAllSavedRecords() {
  if (!isAdminUnlocked || !verifiedPin) return;
  try {
    const res = await fetch('/api/ishur-prika', {
      headers: { 'x-admin-pin': verifiedPin }
    });
    if (res.ok) {
      allSavedRecords = await res.json();
      populateAdminFilterDropdowns();
      renderAdminRecordsTable();
    }
  } catch {
    // ignore
  }
}

document.getElementById('btnExportCsv').addEventListener('click', () => {
  const exportList = getFilteredAdminRecords();
  if (exportList.length === 0) return;
  const headers = ['ID', 'שם מנהל עבודה', 'שם הנהג', 'תאריך פריקה', 'מוצרים וסידורי', 'הערות', 'שם המחסנאי המאשר', 'תאריך יצירה'];
  const rows = exportList.map((r) => {
    let items = [];
    try {
      items = JSON.parse(r.mutzarim_json || '[]');
    } catch {
      items = [];
    }
    const itemsStr = items.map((i) => (i.serial ? `${i.product} (${i.serial})` : i.product)).join(' | ');
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

  // Tomar automáticamente lo escrito en las cajas ➕ aunque el usuario no haya tocado 'שמור' / 'הוסף'
  if (newMenahelNameInput && newMenahelNameInput.value.trim()) {
    await addNewMenahelName();
  }
  if (newNahagNameInput && newNahagNameInput.value.trim()) {
    await addNewNahagName();
  }
  if (newCatalogProductInput && newCatalogProductInput.value.trim()) {
    await addNewCatalogProduct();
  }
  if (currentMador && newMachsanaiNameInput && newMachsanaiNameInput.value.trim()) {
    await addNewMachsanaiName();
  }

  const pendingProd = (itemProductSelect.value || '').trim();
  const pendingSerial = (itemSerialInput.value || '').trim();
  if (
    pendingProd &&
    pendingProd !== '__ADD_NEW__' &&
    (addedProductSerialItems.length === 0 || pendingSerial !== '')
  ) {
    addedProductSerialItems.push({ product: pendingProd, serial: pendingSerial });
    renderAddedProductsTable();
    itemSerialInput.value = '';
  }

  const payload = {
    machsan_sholeach: machsanSholeach.value.trim(),
    shem_nahag: shemNahag.value.trim(),
    taarich_prika: taarichPrika.value,
    hearot: hearot.value.trim(),
    mutzarim_items: addedProductSerialItems,
    tmunot: addedPhotosList,
    shem_machsanai: shemMachsanai.value.trim(),
    mador: currentMador,
    mador_pin: unlockedMadorPins[currentMador] || '',
    chatima_data_url: hasSignature ? canvas.toDataURL('image/png') : ''
  };

  if (!payload.machsan_sholeach) {
    showAlert('נא לבחור או להזין שם מנהל עבודה', 'error');
    machsanSholeach.focus();
    return;
  }
  if (!payload.shem_nahag) {
    showAlert('נא לבחור או להזין שם הנהג', 'error');
    shemNahag.focus();
    return;
  }
  if (!payload.taarich_prika) {
    showAlert('נא למלא תאריך', 'error');
    taarichPrika.focus();
    return;
  }
  if (!payload.mutzarim_items || payload.mutzarim_items.length === 0) {
    showAlert('נא לבחור או להזין לפחות מוצר אחד', 'error');
    itemProductSelect.focus();
    return;
  }
  if (!currentMador || !payload.shem_machsanai) {
    showAlert('נא לבחור מדור, להזין את ה-PIN של המדור ולבחור שם המחסנאי המאשר', 'error');
    shemMachsanai.focus();
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

    if (isAdminUnlocked) {
      await loadAllSavedRecords();
    }

    showAlert('✅ אישור הפריקה נשמר! שלח את ההודעה ב-WhatsApp למטה.', 'success');
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

// ==========================================
// 7. PWA: רישום Service Worker וכפתור התקנה ל-iPhone ו-Android
// ==========================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js?v=3')
    .then((reg) => reg.update().catch(() => {}))
    .catch(() => {});
}

(function initPwaInstall() {
  const btnInstallPwa = document.getElementById('btnInstallPwa');
  const pwaInstallBox = document.getElementById('pwaInstallBox');
  const btnClosePwaInstall = document.getElementById('btnClosePwaInstall');
  const pwaDirectInstallWrap = document.getElementById('pwaDirectInstallWrap');
  const btnTriggerNativeInstall = document.getElementById('btnTriggerNativeInstall');
  const pwaGuideAndroid = document.getElementById('pwaGuideAndroid');
  const pwaGuideIos = document.getElementById('pwaGuideIos');
  const pwaInAppWarning = document.getElementById('pwaInAppWarning');
  const btnOpenInChrome = document.getElementById('btnOpenInChrome');
  if (!btnInstallPwa || !pwaInstallBox) return;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) {
    btnInstallPwa.classList.add('hidden');
    pwaInstallBox.classList.add('hidden');
    return;
  }

  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isInAppBrowser = /WhatsApp|FBAN|FBAV|Instagram|Line\/|wv\)/i.test(ua);
  const hostAndPath = window.location.host + window.location.pathname + window.location.search;
  const chromeIntentUrl = `intent://${hostAndPath}#Intent;scheme=https;package=com.android.chrome;end`;

  if (isIos && pwaGuideIos) pwaGuideIos.classList.add('is-highlighted');
  if (isAndroid && pwaGuideAndroid) pwaGuideAndroid.classList.add('is-highlighted');

  if (isInAppBrowser && pwaInAppWarning) {
    pwaInAppWarning.classList.remove('hidden');
    if (isAndroid && btnOpenInChrome) {
      btnOpenInChrome.href = chromeIntentUrl;
    } else if (btnOpenInChrome) {
      btnOpenInChrome.classList.add('hidden');
    }
  }

  // Asegurar que el botón y el panel "התקן כאפליקציה" estén visibles en el celular
  btnInstallPwa.classList.remove('hidden');
  if (pwaDirectInstallWrap) pwaDirectInstallWrap.classList.remove('hidden');
  if (sessionStorage.getItem('pwa_banner_dismissed') === '1') {
    pwaInstallBox.classList.add('hidden');
  } else {
    pwaInstallBox.classList.remove('hidden');
  }

  let deferredPrompt = window.__deferredPwaPrompt || null;

  function syncDeferredPrompt() {
    if (window.__deferredPwaPrompt) {
      deferredPrompt = window.__deferredPwaPrompt;
    }
  }

  window.addEventListener('pwa-prompt-ready', () => {
    syncDeferredPrompt();
    if (pwaDirectInstallWrap) pwaDirectInstallWrap.classList.remove('hidden');
    pwaInstallBox.classList.remove('hidden');
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__deferredPwaPrompt = e;
    deferredPrompt = e;
    if (pwaDirectInstallWrap) pwaDirectInstallWrap.classList.remove('hidden');
    pwaInstallBox.classList.remove('hidden');
  });

  window.addEventListener('appinstalled', () => {
    window.__deferredPwaPrompt = null;
    deferredPrompt = null;
    pwaInstallBox.classList.add('hidden');
    btnInstallPwa.classList.add('hidden');
  });

  async function handleInstallAction() {
    syncDeferredPrompt();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => ({ outcome: 'dismissed' }));
      if (choice && choice.outcome === 'accepted') {
        window.__deferredPwaPrompt = null;
        deferredPrompt = null;
        pwaInstallBox.classList.add('hidden');
      }
      return;
    }

    // Si se abrió dentro del navegador interno de WhatsApp en Android, abrir directo en Chrome
    if (isInAppBrowser && isAndroid) {
      window.location.href = chromeIntentUrl;
      return;
    }

    pwaInstallBox.classList.remove('hidden');
    pwaInstallBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (isIos) {
      window.alert(
        '🍎 להתקנה באייפון (Safari):\n1. לחץ על כפתור השיתוף ⬆️ בתחתית המסך\n2. גלול ובחר "הוסף למסך הבית" (Add to Home Screen)'
      );
    } else {
      window.alert(
        '📲 להתקנה כאפליקציה:\nלחץ על תפריט 3 הנקודות (⋮) בפינה העליונה של הדפדפן ובחר "התקן אפליקציה" (Install app) או "הוסף למסך הבית".'
      );
    }
  }

  btnInstallPwa.addEventListener('click', handleInstallAction);
  if (btnTriggerNativeInstall) {
    btnTriggerNativeInstall.addEventListener('click', handleInstallAction);
  }
  if (btnClosePwaInstall) {
    btnClosePwaInstall.addEventListener('click', () => {
      sessionStorage.setItem('pwa_banner_dismissed', '1');
      pwaInstallBox.classList.add('hidden');
    });
  }
})();
