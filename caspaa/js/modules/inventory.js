// inventory.js — Enhanced inventory module for CASPAA
// Redefines view_adm_inventory() from admin.js (this file loads after admin.js)

function view_adm_inventory(params) {
  const schoolId = currentSchoolId();
  const items = DB.query('inventory', i => i.schoolId === schoolId);

  const activeCat = APP.params.invCat || 'All';
  const categories = ['All', 'Books', 'Stationery', 'Equipment', 'Uniforms', 'Furniture', 'Sports', 'Other'];

  // Compute stats
  const totalItems = items.length;
  const totalValue = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitCost || 0), 0);
  const lowStockItems = items.filter(i => (i.quantity || 0) < (i.minStock || 0));
  const totalStockValue = totalValue; // same metric, shown as separate card label

  // Filter by category
  const filtered = activeCat === 'All' ? items : items.filter(i => i.category === activeCat);

  // Low stock alert banner HTML
  let lowStockBanner = '';
  if (lowStockItems.length > 0) {
    const names = lowStockItems.map(i => `<strong>${i.name}</strong>`).join(', ');
    lowStockBanner = `
      <div id="inv-low-stock-banner" class="card p-4" style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;margin-bottom:16px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <span style="color:#d97706;font-size:1.2rem;">&#9888;</span>
            <div>
              <div style="font-weight:600;color:#92400e;margin-bottom:4px;">Low Stock Alert — ${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} below minimum</div>
              <div style="color:#78350f;font-size:0.9rem;">${names}</div>
            </div>
          </div>
          <button onclick="document.getElementById('inv-low-stock-banner').style.display='none'" style="background:none;border:none;cursor:pointer;color:#92400e;font-size:1.1rem;line-height:1;">&times;</button>
        </div>
      </div>
    `;
  }

  // Category tab buttons
  const tabsHtml = categories.map(cat => {
    const isActive = cat === activeCat;
    return `<button
      class="btn ${isActive ? 'btn-primary' : 'btn-secondary'}"
      style="font-size:0.82rem;padding:5px 14px;"
      onclick="APP.params.invCat='${cat}';APP.render();"
    >${cat}</button>`;
  }).join('');

  // Table rows
  let tableBody = '';
  if (filtered.length === 0) {
    tableBody = `<tr><td colspan="7" style="padding:0;border:none;">
      ${emptyState({ icon: 'package', title: 'No items found', body: activeCat === 'All' ? 'Add your first inventory item to get started.' : `No items in the "${activeCat}" category.` })}
    </td></tr>`;
  } else {
    tableBody = filtered.map(item => {
      const qty = item.quantity || 0;
      const minS = item.minStock || 0;
      const isLow = qty < minS;
      const stockValue = qty * (item.unitCost || 0);

      const stockLevelHtml = `
        <span style="font-weight:700;color:${isLow ? '#dc2626' : 'inherit'};">${qty}</span>
        <span style="color:#94a3b8;font-size:0.85rem;"> / min ${minS}</span>
        ${isLow ? ' <span class="badge badge-danger" style="font-size:0.72rem;padding:2px 6px;">LOW</span>' : ''}
      `;

      return `<tr>
        <td style="font-weight:500;">${item.name || '—'}</td>
        <td><span class="badge badge-neutral">${item.category || '—'}</span></td>
        <td>${stockLevelHtml}</td>
        <td>${money(item.unitCost || 0)}</td>
        <td>${money(stockValue)}</td>
        <td style="color:#64748b;font-size:0.9rem;">${item.supplier || '—'}</td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
            <button class="btn btn-secondary" style="font-size:0.78rem;padding:4px 10px;" onclick="inv_issueModal('${item.id}')">Issue</button>
            <button class="btn btn-primary" style="font-size:0.78rem;padding:4px 10px;background:#16a34a;border-color:#16a34a;" onclick="inv_restockModal('${item.id}')">Restock</button>
            <button class="btn btn-secondary" style="font-size:0.78rem;padding:4px 8px;" title="View History" onclick="viewInventoryHistory('${item.id}')">${icon('reports', 'w-4 h-4')}</button>
            <button class="btn btn-danger" style="font-size:0.78rem;padding:4px 8px;" title="Write Off" onclick="inv_writeOffModal('${item.id}')">${icon('trash', 'w-4 h-4')}</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  const html = `
    ${pageHeader({
      title: 'Inventory Management',
      subtitle: 'Track and manage school supplies, equipment, and resources.',
      actions: `<button class="btn btn-primary" onclick="addInventoryModal()">${icon('plus', 'w-4 h-4')} Add Item</button>`
    })}

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;">
      ${statCard({ label: 'Total Items', value: totalItems, icon: 'package', color: 'blue' })}
      ${statCard({ label: 'Total Stock Value', value: money(totalValue), icon: 'fees', color: 'green' })}
      ${statCard({ label: 'Low Stock Items', value: lowStockItems.length, icon: 'bell', color: lowStockItems.length > 0 ? 'red' : 'green' })}
      ${statCard({ label: 'Categories Tracked', value: [...new Set(items.map(i => i.category).filter(Boolean))].length, icon: 'book', color: 'purple' })}
    </div>

    ${lowStockBanner}

    <div class="card p-4">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center;">
        ${tabsHtml}
      </div>

      <div style="overflow-x:auto;">
        <table class="tbl" style="width:100%;">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Stock Level</th>
              <th>Unit Cost</th>
              <th>Stock Value</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tableBody}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return html;
}

// ─── Issue Modal ─────────────────────────────────────────────────────────────

function inv_issueModal(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');

  const qty = item.quantity || 0;

  modal({
    title: 'Issue Items — ' + item.name,
    size: 'md',
    body: `
      <div style="margin-bottom:14px;padding:10px 14px;background:#f1f5f9;border-radius:6px;font-size:0.9rem;">
        Current stock: <strong>${qty}</strong> ${qty < (item.minStock || 0) ? '<span class="badge badge-danger" style="margin-left:6px;">LOW</span>' : ''}
      </div>

      <div style="margin-bottom:14px;">
        <label class="input-label">Quantity to Issue <span style="color:#dc2626;">*</span></label>
        <input id="inv-issue-qty" class="input" type="number" min="1" max="${qty}" placeholder="e.g. 5" />
      </div>

      <div style="margin-bottom:14px;">
        <label class="input-label">Issued To <span style="color:#dc2626;">*</span></label>
        <input id="inv-issue-to" class="input" type="text" placeholder="e.g. JSS 2A Classroom, Mr. Adamu Ibrahim" />
      </div>

      <div style="margin-bottom:14px;">
        <label class="input-label">Purpose <span style="color:#dc2626;">*</span></label>
        <input id="inv-issue-purpose" class="input" type="text" placeholder="e.g. Classroom setup, New term distribution" />
      </div>

      <div style="margin-bottom:4px;">
        <label class="input-label">Date</label>
        <input id="inv-issue-date" class="input" type="date" value="${today()}" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="inv_doIssue('${itemId}')">Issue Items</button>
    `
  });
}

function inv_doIssue(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');

  const qtyInput = document.getElementById('inv-issue-qty');
  const toInput = document.getElementById('inv-issue-to');
  const purposeInput = document.getElementById('inv-issue-purpose');

  const quantity = parseInt(qtyInput ? qtyInput.value : 0, 10);
  const issuedTo = toInput ? toInput.value.trim() : '';
  const purpose = purposeInput ? purposeInput.value.trim() : '';

  const currentQty = item.quantity || 0;

  if (!quantity || quantity < 1) return toast('Please enter a valid quantity.', 'danger');
  if (!issuedTo) return toast('Please enter who the items are issued to.', 'danger');
  if (!purpose) return toast('Please enter the purpose for this issue.', 'danger');

  if (quantity > currentQty) {
    return toast(`Insufficient stock. Only ${currentQty} item${currentQty !== 1 ? 's' : ''} available.`, 'danger');
  }

  const newQty = currentQty - quantity;
  const newEntry = {
    delta: -quantity,
    reason: 'Issued to: ' + issuedTo + ' — ' + purpose,
    type: 'Issue',
    by: AUTH.current.id,
    timestamp: now()
  };

  DB.update('inventory', itemId, {
    quantity: newQty,
    history: [...(item.history || []), newEntry]
  });

  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${quantity} item${quantity !== 1 ? 's' : ''} issued successfully.`, 'success');
}

// ─── Restock Modal ────────────────────────────────────────────────────────────

function inv_restockModal(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');

  const qty = item.quantity || 0;

  modal({
    title: 'Restock / Add Stock — ' + item.name,
    size: 'md',
    body: `
      <div style="margin-bottom:14px;padding:10px 14px;background:#f1f5f9;border-radius:6px;font-size:0.9rem;">
        Current stock: <strong>${qty}</strong>
      </div>

      <div style="margin-bottom:14px;">
        <label class="input-label">Quantity Received <span style="color:#dc2626;">*</span></label>
        <input id="inv-restock-qty" class="input" type="number" min="1" placeholder="e.g. 20" />
      </div>

      <div style="margin-bottom:14px;">
        <label class="input-label">Supplier</label>
        <input id="inv-restock-supplier" class="input" type="text" value="${item.supplier || ''}" placeholder="e.g. ABC Supplies Ltd" />
      </div>

      <div style="margin-bottom:14px;">
        <label class="input-label">Purchase Price per Unit <span style="color:#94a3b8;font-size:0.8rem;">(optional — updates unit cost)</span></label>
        <input id="inv-restock-price" class="input" type="number" min="0" step="0.01" placeholder="e.g. 450" />
      </div>

      <div style="margin-bottom:14px;">
        <label class="input-label">Date Received</label>
        <input id="inv-restock-date" class="input" type="date" value="${today()}" />
      </div>

      <div style="margin-bottom:4px;">
        <label class="input-label">Notes <span style="color:#94a3b8;font-size:0.8rem;">(optional)</span></label>
        <textarea id="inv-restock-notes" class="input" rows="2" style="resize:vertical;" placeholder="Any additional notes..."></textarea>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" style="background:#16a34a;border-color:#16a34a;" onclick="inv_doRestock('${itemId}')">Save Restock</button>
    `
  });
}

function inv_doRestock(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');

  const qtyInput = document.getElementById('inv-restock-qty');
  const supplierInput = document.getElementById('inv-restock-supplier');
  const priceInput = document.getElementById('inv-restock-price');
  const notesInput = document.getElementById('inv-restock-notes');

  const quantity = parseInt(qtyInput ? qtyInput.value : 0, 10);
  const supplier = supplierInput ? supplierInput.value.trim() : (item.supplier || '');
  const newPrice = priceInput && priceInput.value ? parseFloat(priceInput.value) : null;
  const notes = notesInput ? notesInput.value.trim() : '';

  if (!quantity || quantity < 1) return toast('Please enter a valid quantity (minimum 1).', 'danger');

  const currentQty = item.quantity || 0;
  const newQty = currentQty + quantity;

  const reasonParts = ['Restock from ' + (supplier || 'unknown supplier')];
  if (notes) reasonParts.push(notes);

  const newEntry = {
    delta: quantity,
    reason: reasonParts.join(' — '),
    type: 'Stock-In',
    by: AUTH.current.id,
    timestamp: now()
  };

  const updatePayload = {
    quantity: newQty,
    history: [...(item.history || []), newEntry]
  };

  if (supplier) updatePayload.supplier = supplier;
  if (newPrice !== null && newPrice >= 0) updatePayload.unitCost = newPrice;

  DB.update('inventory', itemId, updatePayload);

  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Stock updated — new total: ${newQty} item${newQty !== 1 ? 's' : ''}.`, 'success');
}

// ─── Write-Off Modal ──────────────────────────────────────────────────────────

function inv_writeOffModal(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');

  const qty = item.quantity || 0;

  modal({
    title: 'Write Off Items — ' + item.name,
    size: 'md',
    body: `
      <div style="margin-bottom:14px;padding:10px 14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;font-size:0.875rem;color:#7f1d1d;">
        <strong>Warning:</strong> Write-offs permanently reduce stock. This action is logged and cannot be undone.
      </div>

      <div style="margin-bottom:14px;padding:10px 14px;background:#f1f5f9;border-radius:6px;font-size:0.9rem;">
        Current stock: <strong>${qty}</strong>
      </div>

      <div style="margin-bottom:14px;">
        <label class="input-label">Quantity to Write Off <span style="color:#dc2626;">*</span></label>
        <input id="inv-writeoff-qty" class="input" type="number" min="1" max="${qty}" placeholder="e.g. 3" />
      </div>

      <div style="margin-bottom:14px;">
        <label class="input-label">Reason <span style="color:#dc2626;">*</span></label>
        <select id="inv-writeoff-reason" class="input" onchange="inv_toggleWriteOffNotes()">
          <option value="">— Select a reason —</option>
          <option value="Damaged">Damaged</option>
          <option value="Lost">Lost</option>
          <option value="Expired">Expired</option>
          <option value="Stolen">Stolen</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div style="margin-bottom:4px;">
        <label class="input-label" id="inv-writeoff-notes-label">Notes <span id="inv-writeoff-notes-req" style="color:#94a3b8;font-size:0.8rem;">(optional)</span></label>
        <textarea id="inv-writeoff-notes" class="input" rows="2" style="resize:vertical;" placeholder="Additional details..."></textarea>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-danger" onclick="inv_doWriteOff('${itemId}')">Confirm Write-Off</button>
    `
  });
}

function inv_toggleWriteOffNotes() {
  const reasonEl = document.getElementById('inv-writeoff-reason');
  const reqEl = document.getElementById('inv-writeoff-notes-req');
  if (!reasonEl || !reqEl) return;
  if (reasonEl.value === 'Other') {
    reqEl.textContent = '(required)';
    reqEl.style.color = '#dc2626';
  } else {
    reqEl.textContent = '(optional)';
    reqEl.style.color = '#94a3b8';
  }
}

function inv_doWriteOff(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');

  const qtyInput = document.getElementById('inv-writeoff-qty');
  const reasonInput = document.getElementById('inv-writeoff-reason');
  const notesInput = document.getElementById('inv-writeoff-notes');

  const quantity = parseInt(qtyInput ? qtyInput.value : 0, 10);
  const reason = reasonInput ? reasonInput.value : '';
  const notes = notesInput ? notesInput.value.trim() : '';

  const currentQty = item.quantity || 0;

  if (!quantity || quantity < 1) return toast('Please enter a valid quantity.', 'danger');
  if (!reason) return toast('Please select a reason for the write-off.', 'danger');
  if (reason === 'Other' && !notes) return toast('Notes are required when the reason is "Other".', 'danger');

  if (quantity > currentQty) {
    return toast(`Cannot write off more than current stock. Only ${currentQty} item${currentQty !== 1 ? 's' : ''} available.`, 'danger');
  }

  const newQty = currentQty - quantity;
  const fullReason = reason + (notes ? ': ' + notes : '');

  const newEntry = {
    delta: -quantity,
    reason: fullReason,
    type: 'Write-Off',
    by: AUTH.current.id,
    timestamp: now()
  };

  DB.update('inventory', itemId, {
    quantity: newQty,
    history: [...(item.history || []), newEntry]
  });

  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Write-off recorded successfully.', 'success');
}

// ─── Add Inventory Modal ──────────────────────────────────────────────────────

function addInventoryModal() {
  modal({
    title: 'Add Inventory Item',
    size: 'md',
    body: `<div class="space-y-3">
      <div><label class="input-label">Item Name *</label><input id="inv_name" class="input" placeholder="e.g. A4 Notebooks"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Category</label>
          <select id="inv_cat" class="input">
            <option>Books</option><option>Stationery</option><option>Equipment</option><option>Uniforms</option><option>Furniture</option><option>Sports</option><option>Other</option>
          </select>
        </div>
        <div><label class="input-label">Initial Quantity</label><input id="inv_qty" class="input" type="number" min="0" placeholder="0"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Unit Cost (NGN)</label><input id="inv_cost" class="input" type="number" min="0" placeholder="0"></div>
        <div><label class="input-label">Min. Stock Level</label><input id="inv_min" class="input" type="number" min="0" placeholder="5"></div>
      </div>
      <div><label class="input-label">Supplier</label><input id="inv_supplier" class="input" placeholder="e.g. ABC Supplies Ltd"></div>
    </div>`,
    footer: '<button class="btn btn-secondary" onclick="document.getElementById(\'modalBackdrop\').click()">Cancel</button><button class="btn btn-primary" onclick="inv_saveNewItem()">Add Item</button>'
  });
}

function inv_saveNewItem() {
  const name = (document.getElementById('inv_name') || {}).value.trim();
  if (!name) { toast('Item name is required', 'danger'); return; }
  const schoolId = AUTH.current.schoolId || 'sch_brightlights';
  DB.insert('inventory', {
    id: uid('inv'),
    schoolId,
    name,
    category: (document.getElementById('inv_cat') || {}).value,
    quantity: parseInt((document.getElementById('inv_qty') || {}).value) || 0,
    unitCost: parseFloat((document.getElementById('inv_cost') || {}).value) || 0,
    minStock: parseInt((document.getElementById('inv_min') || {}).value) || 5,
    supplier: (document.getElementById('inv_supplier') || {}).value.trim(),
    history: []
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Item added to inventory', 'success');
}

// ─── View Inventory History ───────────────────────────────────────────────────

function viewInventoryHistory(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return;
  const history = (item.history || []).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  modal({
    title: 'History — ' + item.name,
    size: 'md',
    body: history.length === 0
      ? '<p class="text-slate-500 text-sm p-4 text-center">No history recorded yet.</p>'
      : `<table class="tbl w-full"><thead><tr><th>Type</th><th>Change</th><th>Reason</th><th>Date</th></tr></thead><tbody>${history.map(h => `<tr><td><span class="badge ${h.type === 'Issue' ? 'badge-warn' : h.type === 'Write-Off' ? 'badge-danger' : 'badge-success'}">${h.type}</span></td><td class="font-bold ${h.delta < 0 ? 'text-rose-600' : 'text-emerald-600'}">${h.delta > 0 ? '+' : ''}${h.delta}</td><td class="text-sm">${h.reason || '—'}</td><td class="text-xs text-slate-400">${h.timestamp ? h.timestamp.slice(0, 10) : '—'}</td></tr>`).join('')}</tbody></table>`,
    footer: '<button class="btn btn-secondary" onclick="document.getElementById(\'modalBackdrop\').click()">Close</button>'
  });
}
