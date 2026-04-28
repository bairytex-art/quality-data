// Supabase Configuration
// Replace with your actual Supabase URL and Key in your environment
// For local development, these will be injected or replaced
const SUPABASE_URL = window.CONFIG?.SUPABASE_URL || 'https://lwvrpuyzbypjydghwvlw.supabase.co';
const SUPABASE_ANON_KEY = window.CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3dnJwdXl6YnlwanlkZ2h3dmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDE2NjIsImV4cCI6MjA5Mjk3NzY2Mn0.gKptKtqEmiJ3ITz2B5YrqxU4Ppi3VytCAcJ_D0myTbA';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const els = {
  form: document.getElementById("qualityForm"),
  searchInput: document.getElementById("searchInput"),
  qualityTableBody: document.getElementById("qualityTableBody"),
  qualityCount: document.getElementById("qualityCount"),
  clearFormBtn: document.getElementById("clearFormBtn"),
  addWarpRowBtn: document.getElementById("addWarpRowBtn"),
  addWeftRowBtn: document.getElementById("addWeftRowBtn"),
  warpRows: document.getElementById("warpRows"),
  weftRows: document.getElementById("weftRows"),
  sheetPreview: document.getElementById("sheetPreview"),
  qualityId: document.getElementById("qualityId"),
  mixRowTemplate: document.getElementById("mixRowTemplate"),
  toast: document.getElementById("toast"),
  printCurrentBtn: document.getElementById("printCurrentBtn"),
  downloadCurrentBtn: document.getElementById("downloadCurrentBtn"),
  entryModal: document.getElementById("entryModal"),
  closeEntryModal: document.getElementById("closeEntryModal"),
  cancelEntryBtn: document.getElementById("cancelEntryBtn"),
  previewModal: document.getElementById("previewModal"),
  closePreviewModal: document.getElementById("closePreviewModal"),
  editCurrentBtn: document.getElementById("editCurrentBtn"),
  deleteCurrentBtn: document.getElementById("deleteCurrentBtn"),
  previewTitle: document.getElementById("previewTitle"),
  filterBtns: document.querySelectorAll(".filter-btn"),
  confirmModal: document.getElementById("confirmModal"),
  confirmTitle: document.getElementById("confirmTitle"),
  confirmMessage: document.getElementById("confirmMessage"),
  confirmOkBtn: document.getElementById("confirmOkBtn"),
  confirmCancelBtn: document.getElementById("confirmCancelBtn"),
  closeConfirmModal: document.getElementById("closeConfirmModal"),
};

const fieldIds = [
  "loomNumber",
  "startDate",
  "qualityName",
  "motherName",
  "design",
  "beamType",
  "ends",
  "reedCount",
  "pickLoom",
  "pickTable",
  "width",
  "qualityWeight",
  "nameYarn",
  "zameenYarn",
  "layoutMode",
];

const fields = Object.fromEntries(fieldIds.map((id) => [id, document.getElementById(id)]));

let records = [];
let selectedId = null;
let toastTimer = null;
let previewRecord = null;
let currentFilter = "recent";
let currentPage = 1;
let totalPages = 1;

// Supabase Functions
async function loadRecords(search = '', filter = currentFilter, page = currentPage) {
  if (!supabaseClient) {
    console.error('Supabase client not initialized');
    return [];
  }

  try {
    let query = supabaseClient
      .from('qualities')
      .select('*', { count: 'exact' });

    // Search filter
    if (search) {
      query = query.or(`qualityName.ilike.%${search}%,motherName.ilike.%${search}%,loomNumber.ilike.%${search}%`);
    }

    // Time filter & Sorting
    if (filter === 'recent') {
      query = query.order('startDate', { ascending: false });
    } else if (filter === 'month') {
      const firstDay = new Date();
      firstDay.setDate(1);
      query = query.gte('startDate', firstDay.toISOString().split('T')[0]).order('startDate', { ascending: false });
    } else if (filter === 'year') {
      const firstDay = new Date();
      firstDay.setMonth(0, 1);
      query = query.gte('startDate', firstDay.toISOString().split('T')[0]).order('startDate', { ascending: false });
    }

    // Pagination
    const pageSize = 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    records = data || [];
    totalPages = Math.ceil((count || 0) / pageSize);
    currentPage = page;
    return records;
  } catch (error) {
    console.error('Error loading records:', error);
    showToast('Failed to load records from Supabase', 'error');
    return [];
  }
}

async function saveRecord(record) {
  if (!supabaseClient) {
    showToast('Supabase not configured', 'error');
    throw new Error('Supabase not configured');
  }

  try {
    const isUpdate = !!record.id;
    console.log('Saving record:', record); // Debug log
    
    let result;
    if (isUpdate) {
      result = await supabaseClient
        .from('qualities')
        .update(record)
        .eq('id', record.id)
        .select()
        .single();
    } else {
      result = await supabaseClient
        .from('qualities')
        .insert(record)
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) {
      console.error('Supabase Error:', error);
      showToast(`Database Error: ${error.message}`, 'error');
      throw error;
    }
    
    console.log('Save successful:', data);
    return data;
  } catch (error) {
    console.error('Error saving record:', error);
    showToast('Failed to save record to Supabase', 'error');
    throw error;
  }
}

async function deleteRecord(id) {
  if (!supabaseClient) return;

  try {
    const { error } = await supabaseClient
      .from('qualities')
      .delete()
      .eq('id', id);

    if (error) throw error;
    showToast('Record deleted successfully');
  } catch (error) {
    console.error('Error deleting record:', error);
    showToast('Failed to delete record from Supabase', 'error');
    throw error;
  }
}

function openEntryModal(record = null) {
  els.entryModal.classList.add("active");
  if (record) {
    fillForm(record);
    els.previewTitle.textContent = `Edit ${record.qualityName}`;
  } else {
    resetForm();
  }
  document.body.style.overflow = "hidden";
}

function closeEntryModal() {
  els.entryModal.classList.remove("active");
  document.body.style.overflow = "auto";
}

function openPreviewModal(record) {
  previewRecord = cloneRecord(record);
  selectedId = record.id;
  els.previewTitle.textContent = record.qualityName;
  els.sheetPreview.innerHTML = buildPreviewHtml(record);
  els.previewModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closePreviewModal() {
  els.previewModal.classList.remove("active");
  document.body.style.overflow = "auto";
}

function openConfirmModal({ title, message, onConfirm }) {
  els.confirmTitle.textContent = title || "Confirm Action";
  els.confirmMessage.textContent = message || "Are you sure?";
  els.confirmModal.classList.add("active");
  document.body.style.overflow = "hidden";

  const handleConfirm = async () => {
    await onConfirm();
    closeConfirmModal();
  };

  const handleCancel = () => {
    closeConfirmModal();
  };

  // One-time listeners
  els.confirmOkBtn.onclick = handleConfirm;
  els.confirmCancelBtn.onclick = handleCancel;
  els.closeConfirmModal.onclick = handleCancel;
  els.confirmModal.querySelector(".modal-backdrop").onclick = handleCancel;
}

function closeConfirmModal() {
  els.confirmModal.classList.remove("active");
  document.body.style.overflow = "auto";
}

function showToast(message, type = "success") {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.className = `toast show${type === "error" ? " error" : ""}`;
  toastTimer = setTimeout(() => {
    els.toast.className = "toast";
  }, 2200);
}

function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record));
}

function addMixRow(target, row = { qty: "1", text: "" }) {
  const fragment = els.mixRowTemplate.content.cloneNode(true);
  const tr = fragment.querySelector("tr");

  tr.querySelector(".row-qty").value = row.qty ?? "1";
  tr.querySelector(".row-text").value = row.text ?? "";

  tr.querySelector(".remove-row").addEventListener("click", () => {
    tr.remove();
    if (!target.children.length) addMixRow(target);
  });

  target.appendChild(fragment);
}

function clearMixRows(target) {
  target.innerHTML = "";
  addMixRow(target);
}

function readRows(target) {
  return [...target.querySelectorAll("tr")]
    .map((row) => ({
      qty: row.querySelector(".row-qty").value.trim(),
      text: row.querySelector(".row-text").value.trim(),
    }))
    .filter((row) => row.qty || row.text);
}

function totalRows(rows) {
  return rows.reduce((sum, row) => sum + Number(row.qty || 0), 0);
}

function normalizeRows(rows) {
  return rows
    .filter((row) => row.qty && row.text)
    .map((row) => `${row.qty}|${row.text.toUpperCase()}`)
    .join("||");
}

function detectLayout(record) {
  if (record.layoutMode && record.layoutMode !== "AUTO") return record.layoutMode.toLowerCase();

  const warp = record.warpRows.filter((row) => row.qty && row.text);
  const weft = record.weftRows.filter((row) => row.qty && row.text);

  if (warp.length <= 1 && weft.length <= 1) return "single";
  if (normalizeRows(warp) === normalizeRows(weft)) return "same";
  return "different";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderLine(key, value) {
  return `
    <tr>
      <td class="preview-key">${escapeHtml(key)}</td>
      <td>${escapeHtml(value || "")}</td>
    </tr>
  `;
}

function renderMixLines(rows) {
  return rows
    .filter((row) => row.qty && row.text)
    .map(
      (row) => `
        <tr>
          <td class="preview-mix-qty">${escapeHtml(row.qty)}</td>
          <td>${escapeHtml(row.text)}</td>
        </tr>
      `
    )
    .join("");
}

function buildPreviewHtml(record) {
  const layout = detectLayout(record);
  const warpRows = record.warpRows.filter((row) => row.qty && row.text);
  const weftRows = record.weftRows.filter((row) => row.qty && row.text);
  const warpTotal = totalRows(warpRows);
  const weftTotal = totalRows(weftRows);

  if (layout === "single") {
    return `
      <table class="preview-table">
        <tbody>
          ${renderLine("LOOM", record.loomNumber)}
          ${renderLine("DATE", formatDate(record.startDate))}
          ${renderLine("QUALITY NAME", record.qualityName)}
          ${renderLine("MOTHER NAME", record.motherName)}
          ${renderLine("WARP", warpRows[0]?.text || "")}
          ${renderLine("WEFT", weftRows[0]?.text || "")}
          ${renderLine("DESIGN", record.design)}
          ${renderLine("BEAM TYPE", record.beamType)}
          ${renderLine("ENDS", record.ends)}
          ${renderLine("REED", record.reedCount)}
          ${renderLine("PICK ON LOOM", record.pickLoom)}
          ${renderLine("PICK ON TABLE", record.pickTable)}
          ${renderLine("WIDTH", record.width)}
          ${renderLine("QUALITY WEIGHT", record.qualityWeight)}
          ${renderLine("NAME YARN", record.nameYarn)}
          ${renderLine("ZAMEEN YARN", record.zameenYarn)}
        </tbody>
      </table>
    `;
  }

  if (layout === "same") {
    const combinedRows = warpRows;
    return `
      <table class="preview-grid">
        <tbody>
          <tr><td class="preview-key">LOOM</td><td colspan="3">${escapeHtml(record.loomNumber)}</td></tr>
          <tr><td class="preview-key">DATE</td><td colspan="3">${escapeHtml(formatDate(record.startDate))}</td></tr>
          <tr><td class="preview-key">QUALITY NAME</td><td colspan="3">${escapeHtml(record.qualityName)}</td></tr>
          <tr><td class="preview-key">MOTHER NAME</td><td colspan="3">${escapeHtml(record.motherName)}</td></tr>
          <tr><td colspan="4" class="preview-section-title">WARP&amp;WEFT</td></tr>
          ${combinedRows
            .map(
              (row) => `
                <tr>
                  <td></td>
                  <td class="preview-mix-qty">${escapeHtml(row.qty)}</td>
                  <td colspan="2">${escapeHtml(row.text)}</td>
                </tr>
              `
            )
            .join("")}
          <tr>
            <td></td>
            <td class="preview-mix-qty preview-total">${escapeHtml(String(totalRows(combinedRows)))}</td>
            <td colspan="2" class="preview-total">TOTAL THREADS</td>
          </tr>
          <tr><td class="preview-key">DESIGN</td><td colspan="3">${escapeHtml(record.design)}</td></tr>
          <tr><td class="preview-key">BEAM TYPE</td><td colspan="3">${escapeHtml(record.beamType)}</td></tr>
          <tr><td class="preview-key">ENDS</td><td colspan="3">${escapeHtml(record.ends)}</td></tr>
          <tr><td class="preview-key">REED</td><td colspan="3">${escapeHtml(record.reedCount)}</td></tr>
          <tr><td class="preview-key">PICK ON LOOM</td><td colspan="3">${escapeHtml(record.pickLoom)}</td></tr>
          <tr><td class="preview-key">PICK ON TABLE</td><td colspan="3">${escapeHtml(record.pickTable)}</td></tr>
          <tr><td class="preview-key">WIDTH</td><td colspan="3">${escapeHtml(record.width)}</td></tr>
          <tr><td class="preview-key">QUALITY WEIGHT</td><td colspan="3">${escapeHtml(record.qualityWeight)}</td></tr>
          <tr><td class="preview-key">NAME YARN</td><td colspan="3">${escapeHtml(record.nameYarn)}</td></tr>
          <tr><td class="preview-key">ZAMEEN YARN</td><td colspan="3">${escapeHtml(record.zameenYarn)}</td></tr>
        </tbody>
      </table>
    `;
  }

  return `
    <table class="preview-table">
      <tbody>
        ${renderLine("LOOM", record.loomNumber)}
        ${renderLine("DATE", formatDate(record.startDate))}
        ${renderLine("QUALITY NAME", record.qualityName)}
        ${renderLine("MOTHER NAME", record.motherName)}
        <tr><td colspan="2" class="preview-section-title">WARP</td></tr>
        ${renderMixLines(warpRows)}
        <tr>
          <td class="preview-mix-qty preview-total">${escapeHtml(String(warpTotal))}</td>
          <td class="preview-total">TOTAL THREADS</td>
        </tr>
        <tr><td colspan="2" class="preview-section-title">WEFT</td></tr>
        ${renderMixLines(weftRows)}
        <tr>
          <td class="preview-mix-qty preview-total">${escapeHtml(String(weftTotal))}</td>
          <td class="preview-total">TOTAL THREADS</td>
        </tr>
        ${renderLine("DESIGN", record.design)}
        ${renderLine("BEAM TYPE", record.beamType)}
        ${renderLine("ENDS", record.ends)}
        ${renderLine("REED", record.reedCount)}
        ${renderLine("PICK ON LOOM", record.pickLoom)}
        ${renderLine("PICK ON TABLE", record.pickTable)}
        ${renderLine("WIDTH", record.width)}
        ${renderLine("QUALITY WEIGHT", record.qualityWeight)}
        ${renderLine("NAME YARN", record.nameYarn)}
        ${renderLine("ZAMEEN YARN", record.zameenYarn)}
      </tbody>
    </table>
  `;
}

function resetForm() {
  els.form.reset();
  els.qualityId.value = "";
  clearMixRows(els.warpRows);
  clearMixRows(els.weftRows);
  fields.beamType.value = "SIZING";
  fields.layoutMode.value = "AUTO";
}

function fillForm(record) {
  els.qualityId.value = record.id || "";

  fieldIds.forEach((id) => {
    fields[id].value = record[id] ?? "";
  });

  els.warpRows.innerHTML = "";
  els.weftRows.innerHTML = "";

  (record.warpRows?.length ? record.warpRows : [{ qty: "1", text: "" }]).forEach((row) => addMixRow(els.warpRows, row));
  (record.weftRows?.length ? record.weftRows : [{ qty: "1", text: "" }]).forEach((row) => addMixRow(els.weftRows, row));
}

function getCurrentFormRecord() {
  return {
    id: els.qualityId.value || undefined,
    loomNumber: fields.loomNumber.value.trim(),
    startDate: fields.startDate.value,
    qualityName: fields.qualityName.value.trim(),
    motherName: fields.motherName.value.trim(),
    design: fields.design.value.trim().toUpperCase(),
    beamType: fields.beamType.value.trim().toUpperCase(),
    ends: fields.ends.value.trim(),
    reedCount: fields.reedCount.value.trim(),
    pickLoom: fields.pickLoom.value.trim(),
    pickTable: fields.pickTable.value.trim(),
    width: fields.width.value.trim(),
    qualityWeight: fields.qualityWeight.value.trim(),
    nameYarn: fields.nameYarn.value.trim().toUpperCase(),
    zameenYarn: fields.zameenYarn.value.trim().toUpperCase(),
    layoutMode: fields.layoutMode.value,
    warpRows: readRows(els.warpRows),
    weftRows: readRows(els.weftRows),
  };
}

function getSelectedRecord() {
  return records.find((item) => item.id === selectedId) ?? null;
}

function getActivePreviewRecord() {
  if (previewRecord) return cloneRecord(previewRecord);
  return getCurrentFormRecord();
}

function getFilteredRecords() {
  let filtered = records;

  // Apply search filter
  const query = els.searchInput.value.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((record) =>
      [record.qualityName, record.motherName, record.loomNumber, record.startDate].join(" ").toLowerCase().includes(query)
    );
  }

  // Apply time filter
  if (currentFilter === "recent") {
    filtered = [...filtered].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  } else if (currentFilter === "month") {
    filtered = [...filtered].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  } else if (currentFilter === "year") {
    filtered = [...filtered].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }

  return filtered;
}

async function renderSavedTable() {
  const searchQuery = els.searchInput.value.trim();
  await loadRecords(searchQuery, currentFilter, currentPage);

  els.qualityTableBody.innerHTML = "";

  if (!records.length) {
    els.qualityTableBody.innerHTML = `
      <tr>
        <td colspan="8">No record found.</td>
      </tr>
    `;
    els.qualityCount.textContent = `0 records`;
    return;
  }

  records.forEach((record) => {
    const tr = document.createElement("tr");
    const layout = detectLayout(record).toUpperCase();

    tr.innerHTML = `
      <td>${escapeHtml(record.qualityName)}</td>
      <td>${escapeHtml(record.motherName)}</td>
      <td>${escapeHtml(record.loomNumber)}</td>
      <td>${escapeHtml(formatDate(record.startDate))}</td>
      <td class="mono">${escapeHtml(layout)}</td>
      <td class="mono">${escapeHtml(String(totalRows(record.warpRows || [])))}</td>
      <td class="mono">${escapeHtml(String(totalRows(record.weftRows || [])))}</td>
      <td class="actions-cell">
        <button class="text-button view-btn" type="button">View</button>
        <button class="text-button edit-btn" type="button">Edit</button>
        <button class="text-button print-btn" type="button">Print</button>
        <button class="text-button jpg-btn" type="button">JPG</button>
        <button class="text-button danger delete-btn" type="button">Delete</button>
      </td>
    `;

    tr.querySelector(".view-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openPreviewModal(record);
    });

    tr.querySelector(".edit-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openEntryModal(record);
    });

    tr.querySelector(".print-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      printRecord(record);
    });

    tr.querySelector(".jpg-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      downloadRecordAsJpg(record);
    });

    tr.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openConfirmModal({
        title: "Delete Quality",
        message: `Are you sure you want to delete "${record.qualityName}"? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            await deleteRecord(record.id);
            await renderSavedTable();
          } catch (error) {
            console.error('Delete failed:', error);
          }
        }
      });
    });

    els.qualityTableBody.appendChild(tr);
  });

  els.qualityCount.textContent = `${records.length} records`;
}

function getPrintableDocument(record) {
  const previewHtml = buildPreviewHtml(record);
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(record.qualityName)}</title>
        <style>
          body { font-family: Arial, sans-serif; background: #fff; margin: 0; padding: 18px; }
          .sheet-preview { width: 100%; background: #fff; color: #000; }
          table { width: 100%; border-collapse: collapse; }
          td { border: 1px solid #111; padding: 6px 8px; font-size: 14px; vertical-align: top; }
          .preview-key { width: 160px; white-space: nowrap; font-weight: 600; }
          .preview-section-title { text-align: center; font-style: italic; font-weight: 700; }
          .preview-mix-qty { width: 56px; text-align: right; font-weight: 600; }
          .preview-total { font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="sheet-preview">${previewHtml}</div>
      </body>
    </html>
  `;
}

function printRecord(record) {
  const existingFrame = document.getElementById("printFrame");
  if (existingFrame) existingFrame.remove();

  const frame = document.createElement("iframe");
  frame.id = "printFrame";
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.setAttribute("aria-hidden", "true");
  document.body.appendChild(frame);

  const frameWindow = frame.contentWindow;
  if (!frameWindow) {
    frame.remove();
    showToast("Print preview could not open", "error");
    return;
  }

  frameWindow.document.open();
  frameWindow.document.write(getPrintableDocument(record));
  frameWindow.document.close();

  frame.onload = () => {
    frameWindow.focus();
    frameWindow.print();
    setTimeout(() => frame.remove(), 1500);
  };
  showToast(`Print ready for ${record.qualityName}`);
}

function getSheetRows(record) {
  const layout = detectLayout(record);
  const warpRows = record.warpRows.filter((row) => row.qty && row.text);
  const weftRows = record.weftRows.filter((row) => row.qty && row.text);

  if (layout === "same") {
    const combinedRows = warpRows;
    return [
      { type: "quad", cells: ["LOOM", record.loomNumber, "", ""] },
      { type: "quad", cells: ["DATE", formatDate(record.startDate), "", ""] },
      { type: "quad", cells: ["QUALITY NAME", record.qualityName, "", ""] },
      { type: "quad", cells: ["MOTHER NAME", record.motherName, "", ""] },
      { type: "section", text: "WARP&WEFT" },
      ...combinedRows.map((row) => ({ type: "mixWide", qty: row.qty, text: row.text })),
      { type: "mixWide", qty: String(totalRows(combinedRows)), text: "TOTAL THREADS", bold: true },
      { type: "quad", cells: ["DESIGN", record.design, "", ""] },
      { type: "quad", cells: ["BEAM TYPE", record.beamType, "", ""] },
      { type: "quad", cells: ["ENDS", record.ends, "", ""] },
      { type: "quad", cells: ["REED", record.reedCount, "", ""] },
      { type: "quad", cells: ["PICK ON LOOM", record.pickLoom, "", ""] },
      { type: "quad", cells: ["PICK ON TABLE", record.pickTable, "", ""] },
      { type: "quad", cells: ["WIDTH", record.width, "", ""] },
      { type: "quad", cells: ["QUALITY WEIGHT", record.qualityWeight, "", ""] },
      { type: "quad", cells: ["NAME YARN", record.nameYarn, "", ""] },
      { type: "quad", cells: ["ZAMEEN YARN", record.zameenYarn, "", ""] },
    ];
  }

  if (layout === "single") {
    return [
      { type: "pair", key: "LOOM", value: record.loomNumber },
      { type: "pair", key: "DATE", value: formatDate(record.startDate) },
      { type: "pair", key: "QUALITY NAME", value: record.qualityName },
      { type: "pair", key: "MOTHER NAME", value: record.motherName },
      { type: "pair", key: "WARP", value: warpRows[0]?.text || "" },
      { type: "pair", key: "WEFT", value: weftRows[0]?.text || "" },
      { type: "pair", key: "DESIGN", value: record.design },
      { type: "pair", key: "BEAM TYPE", value: record.beamType },
      { type: "pair", key: "ENDS", value: record.ends },
      { type: "pair", key: "REED", value: record.reedCount },
      { type: "pair", key: "PICK ON LOOM", value: record.pickLoom },
      { type: "pair", key: "PICK ON TABLE", value: record.pickTable },
      { type: "pair", key: "WIDTH", value: record.width },
      { type: "pair", key: "QUALITY WEIGHT", value: record.qualityWeight },
      { type: "pair", key: "NAME YARN", value: record.nameYarn },
      { type: "pair", key: "ZAMEEN YARN", value: record.zameenYarn },
    ];
  }

  return [
    { type: "pair", key: "LOOM", value: record.loomNumber },
    { type: "pair", key: "DATE", value: formatDate(record.startDate) },
    { type: "pair", key: "QUALITY NAME", value: record.qualityName },
    { type: "pair", key: "MOTHER NAME", value: record.motherName },
    { type: "section", text: "WARP" },
    ...warpRows.map((row) => ({ type: "mix", qty: row.qty, text: row.text })),
    { type: "mix", qty: String(totalRows(warpRows)), text: "TOTAL THREADS", bold: true },
    { type: "section", text: "WEFT" },
    ...weftRows.map((row) => ({ type: "mix", qty: row.qty, text: row.text })),
    { type: "mix", qty: String(totalRows(weftRows)), text: "TOTAL THREADS", bold: true },
    { type: "pair", key: "DESIGN", value: record.design },
    { type: "pair", key: "BEAM TYPE", value: record.beamType },
    { type: "pair", key: "ENDS", value: record.ends },
    { type: "pair", key: "REED", value: record.reedCount },
    { type: "pair", key: "PICK ON LOOM", value: record.pickLoom },
    { type: "pair", key: "PICK ON TABLE", value: record.pickTable },
    { type: "pair", key: "WIDTH", value: record.width },
    { type: "pair", key: "QUALITY WEIGHT", value: record.qualityWeight },
    { type: "pair", key: "NAME YARN", value: record.nameYarn },
    { type: "pair", key: "ZAMEEN YARN", value: record.zameenYarn },
  ];
}

function drawSheetToCanvas(record) {
  const rows = getSheetRows(record);
  const width = 1400;
  const margin = 40;
  const rowHeight = 44;
  const sectionHeight = 42;
  const totalHeight =
    margin * 2 +
    rows.reduce((sum, row) => sum + (row.type === "section" ? sectionHeight : rowHeight), 0);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 2;
  ctx.textBaseline = "middle";

  let y = margin;
  const keyCol = 250;
  const pairValueCol = width - margin * 2 - keyCol;
  const quadKey = 220;
  const quadValue = (width - margin * 2 - quadKey * 2) / 2;
  const mixQty = 90;
  const mixText = width - margin * 2 - mixQty;

  function cell(x, top, w, h, text, align = "left", bold = false, italic = false) {
    ctx.strokeRect(x, top, w, h);
    ctx.fillStyle = "#000000";
    const style = `${italic ? "italic " : ""}${bold ? "700" : "400"} 24px Arial`;
    ctx.font = style;
    ctx.textAlign = align;
    const pad = 12;
    const tx = align === "right" ? x + w - pad : align === "center" ? x + w / 2 : x + pad;
    ctx.fillText(text || "", tx, top + h / 2);
  }

  rows.forEach((row) => {
    if (row.type === "section") {
      cell(margin, y, width - margin * 2, sectionHeight, row.text, "center", true, true);
      y += sectionHeight;
      return;
    }

    if (row.type === "pair") {
      cell(margin, y, keyCol, rowHeight, row.key, "left", true);
      cell(margin + keyCol, y, pairValueCol, rowHeight, row.value, "left");
      y += rowHeight;
      return;
    }

    if (row.type === "quad") {
      cell(margin, y, quadKey, rowHeight, row.cells[0], "left", true);
      cell(margin + quadKey, y, quadValue, rowHeight, row.cells[1], "left");
      cell(margin + quadKey + quadValue, y, quadKey, rowHeight, row.cells[2], "left", true);
      cell(margin + quadKey + quadValue + quadKey, y, quadValue, rowHeight, row.cells[3], "left");
      y += rowHeight;
      return;
    }

    if (row.type === "mix" || row.type === "mixWide") {
      cell(margin, y, mixQty, rowHeight, row.qty, "right", !!row.bold);
      cell(margin + mixQty, y, mixText, rowHeight, row.text, "left", !!row.bold);
      y += rowHeight;
    }
  });

  return canvas;
}

function downloadRecordAsJpg(record) {
  try {
    const canvas = drawSheetToCanvas(record);
    const link = document.createElement("a");
    link.download = `${(record.qualityName || "quality-record").replaceAll(" ", "_")}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.96);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(`JPG downloaded for ${record.qualityName}`);
  } catch {
    showToast("JPG export failed", "error");
  }
}

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = getCurrentFormRecord();

  if (!payload.qualityName || !payload.motherName || !payload.loomNumber || !payload.startDate) {
    showToast("Please complete the main fields first", "error");
    return;
  }

  try {
    await saveRecord(payload);
    await renderSavedTable();
    closeEntryModal();
    showToast(`Data saved for ${payload.qualityName}`);
  } catch (error) {
    showToast("Failed to save record", "error");
  }
});

els.searchInput.addEventListener("input", async () => {
  await renderSavedTable();
});

els.clearFormBtn.addEventListener("click", () => {
  openEntryModal();
  showToast("Ready for new entry");
});

els.closeEntryModal.addEventListener("click", closeEntryModal);
els.cancelEntryBtn.addEventListener("click", closeEntryModal);
els.closePreviewModal.addEventListener("click", closePreviewModal);

els.printCurrentBtn.addEventListener("click", () => {
  const record = previewRecord || getSelectedRecord();
  if (record) printRecord(record);
});

els.downloadCurrentBtn.addEventListener("click", () => {
  const record = previewRecord || getSelectedRecord();
  if (record) downloadRecordAsJpg(record);
});

els.editCurrentBtn.addEventListener("click", () => {
  if (previewRecord) {
    closePreviewModal();
    openEntryModal(previewRecord);
  }
});

els.deleteCurrentBtn.addEventListener("click", () => {
  if (previewRecord && previewRecord.id) {
    openConfirmModal({
      title: "Delete Quality",
      message: `Are you sure you want to delete "${previewRecord.qualityName}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteRecord(previewRecord.id);
          closePreviewModal();
          await renderSavedTable();
          showToast(`${previewRecord.qualityName} deleted`);
          previewRecord = null;
        } catch (error) {
          showToast("Failed to delete record", "error");
        }
      }
    });
  }
});

els.filterBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    els.filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    await renderSavedTable();
  });
});

els.entryModal.querySelector(".modal-backdrop").addEventListener("click", closeEntryModal);
els.previewModal.querySelector(".modal-backdrop").addEventListener("click", closePreviewModal);

els.addWarpRowBtn.addEventListener("click", () => addMixRow(els.warpRows));
els.addWeftRowBtn.addEventListener("click", () => addMixRow(els.weftRows));

clearMixRows(els.warpRows);
clearMixRows(els.weftRows);

// Initialize the app
(async () => {
  await renderSavedTable();
})();
