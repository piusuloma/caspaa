// inventory.js — School store / inventory module for CASPAA

function view_adm_inventory() {
  const schoolId = currentSchoolId();
  const items = DB.query('inventory', i => i.schoolId === schoolId);
  const activeCat = APP.params.invCat || 'All';
  const categories = ['All', 'Books', 'Stationery', 'Equipment', 'Uniforms', 'Furniture', 'Sports', 'Other'];

  const totalValue     = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitCost || 0), 0);
  const lowStockItems  = items.filter(i => (i.quantity || 0) < (i.minStock || 0));
  const filtered       = activeCat === 'All' ? items : items.filter(i => i.category === activeCat);

  const tabsHtml = categories.map(cat =>
    `<button class="btn ${cat === activeCat ? 'btn-primary' : 'btn-secondary'} !py-1.5 !px-3 text-sm"
      onclick="APP.params.invCat='${cat}';APP.render();">${cat}</button>`
  ).join('');

  const tableBody = filtered.length === 0
    ? `<tr><td colspan="7" class="border-none p-0">${emptyState({ icon: 'package', title: 'No items found', body: activeCat === 'All' ? 'Add your first inventory item to get started.' : `No items in the "${activeCat}" category.` })}</td></tr>`
    : filtered.map(item => {
        const qty    = item.quantity || 0;
        const minS   = item.minStock || 0;
        const isLow  = qty < minS;
        const val    = qty * (item.unitCost || 0);
        return `<tr>
          <td class="font-medium">${item.name || '—'}</td>
          <td><span class="badge badge-neutral">${item.category || '—'}</span></td>
          <td>
            <span class="font-bold ${isLow ? 'text-rose-600' : ''}">${qty}</span>
            <span class="text-slate-400 text-xs"> / min ${minS}</span>
            ${isLow ? `<span class="badge badge-danger ml-1 text-xs">LOW</span>` : ''}
          </td>
          <td>${money(item.unitCost || 0)}</td>
          <td class="font-mono">${money(val)}</td>
          <td class="text-slate-500 text-sm">${item.supplier || '—'}</td>
          <td>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button class="btn btn-secondary !py-1 !px-2.5 text-xs" onclick="inv_issueModal('${item.id}')">Issue</button>
              <button class="btn btn-primary !py-1 !px-2.5 text-xs" onclick="inv_restockModal('${item.id}')">Restock</button>
              <button class="btn btn-secondary !py-1 !px-2" title="History" onclick="viewInventoryHistory('${item.id}')">${icon('reports','w-3.5 h-3.5')}</button>
              <button class="btn btn-danger !py-1 !px-2" title="Write Off" onclick="inv_writeOffModal('${item.id}')">${icon('trash','w-3.5 h-3.5')}</button>
            </div>
          </td>
        </tr>`;
      }).join('');

  return `
    ${pageHeader({
      title: 'Inventory & Store',
      subtitle: 'Track school supplies, equipment, and resources.',
      actions: `<button class="btn btn-primary" onclick="addInventoryModal()">${icon('plus','w-4 h-4')} Add Item</button>`
    })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      ${statCard({ label: 'Total Items', value: items.length, icon: 'package', color: 'blue' })}
      ${statCard({ label: 'Stock Value', value: money(totalValue), icon: 'fees', color: 'green' })}
      ${statCard({ label: 'Low Stock', value: lowStockItems.length, icon: 'bell', color: lowStockItems.length > 0 ? 'red' : 'green' })}
      ${statCard({ label: 'Categories', value: [...new Set(items.map(i => i.category).filter(Boolean))].length, icon: 'book', color: 'purple' })}
    </div>

    ${lowStockItems.length ? `
      <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
        ${icon('bell','w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5')}
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-amber-900 mb-0.5">Low Stock — ${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} below minimum</div>
          <div class="text-sm text-amber-700">${lowStockItems.map(i => `<strong>${i.name}</strong>`).join(', ')}</div>
        </div>
      </div>` : ''}

    <div class="card p-4">
      <div class="flex gap-2 flex-wrap mb-4">${tabsHtml}</div>
      <div class="overflow-x-auto">
        <table class="tbl w-full">
          <thead>
            <tr><th>Item</th><th>Category</th><th>Stock</th><th>Unit Cost</th><th>Value</th><th>Supplier</th><th>Actions</th></tr>
          </thead>
          <tbody>${tableBody}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ─── Issue Modal ──────────────────────────────────────────────────────────────

function inv_issueModal(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');
  const qty = item.quantity || 0;
  modal({
    title: 'Issue Items — ' + item.name,
    size: 'md',
    body: `
      <div class="bg-slate-100 rounded-xl px-3 py-2.5 text-sm mb-4">
        Current stock: <strong>${qty}</strong>${qty < (item.minStock || 0) ? ` <span class="badge badge-danger ml-1">LOW</span>` : ''}
      </div>
      <div class="space-y-3">
        <div><label class="input-label">Quantity to Issue *</label>
          <input id="inv-issue-qty" class="input" type="number" min="1" max="${qty}" placeholder="e.g. 5" /></div>
        <div><label class="input-label">Issued To *</label>
          <input id="inv-issue-to" class="input" placeholder="e.g. JSS 2A Classroom, Mr. Adamu Ibrahim" /></div>
        <div><label class="input-label">Purpose *</label>
          <input id="inv-issue-purpose" class="input" placeholder="e.g. Classroom setup, New term distribution" /></div>
        <div><label class="input-label">Date</label>
          <input id="inv-issue-date" class="input" type="date" value="${today()}" /></div>
      </div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="inv_doIssue('${itemId}')">Issue Items</button>`
  });
}

function inv_doIssue(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');
  const quantity  = parseInt((document.getElementById('inv-issue-qty') || {}).value, 10);
  const issuedTo  = ((document.getElementById('inv-issue-to') || {}).value || '').trim();
  const purpose   = ((document.getElementById('inv-issue-purpose') || {}).value || '').trim();
  const currentQty = item.quantity || 0;
  if (!quantity || quantity < 1) return toast('Please enter a valid quantity.', 'danger');
  if (!issuedTo)  return toast('Please enter who the items are issued to.', 'danger');
  if (!purpose)   return toast('Please enter the purpose for this issue.', 'danger');
  if (quantity > currentQty) return toast(`Insufficient stock. Only ${currentQty} available.`, 'danger');
  DB.update('inventory', itemId, {
    quantity: currentQty - quantity,
    history: [...(item.history || []), { delta: -quantity, reason: `Issued to: ${issuedTo} — ${purpose}`, type: 'Issue', by: AUTH.current.id, timestamp: now() }]
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`${quantity} item${quantity !== 1 ? 's' : ''} issued.`, 'success');
}

// ─── Restock Modal ────────────────────────────────────────────────────────────

function inv_restockModal(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');
  modal({
    title: 'Restock — ' + item.name,
    size: 'md',
    body: `
      <div class="bg-slate-100 rounded-xl px-3 py-2.5 text-sm mb-4">
        Current stock: <strong>${item.quantity || 0}</strong>
      </div>
      <div class="space-y-3">
        <div><label class="input-label">Quantity Received *</label>
          <input id="inv-restock-qty" class="input" type="number" min="1" placeholder="e.g. 20" /></div>
        <div><label class="input-label">Supplier</label>
          <input id="inv-restock-supplier" class="input" value="${item.supplier || ''}" placeholder="e.g. ABC Supplies Ltd" /></div>
        <div><label class="input-label">Purchase Price per Unit <span class="text-slate-400 text-xs">(optional — updates unit cost)</span></label>
          <input id="inv-restock-price" class="input" type="number" min="0" placeholder="e.g. 450" /></div>
        <div><label class="input-label">Date Received</label>
          <input id="inv-restock-date" class="input" type="date" value="${today()}" /></div>
        <div><label class="input-label">Notes <span class="text-slate-400 text-xs">(optional)</span></label>
          <textarea id="inv-restock-notes" class="input" rows="2" placeholder="Any additional notes…"></textarea></div>
      </div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="inv_doRestock('${itemId}')">Save Restock</button>`
  });
}

function inv_doRestock(itemId) {
  const item     = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');
  const quantity = parseInt((document.getElementById('inv-restock-qty') || {}).value, 10);
  const supplier = ((document.getElementById('inv-restock-supplier') || {}).value || '').trim() || (item.supplier || '');
  const newPrice = (document.getElementById('inv-restock-price') || {}).value;
  const notes    = ((document.getElementById('inv-restock-notes') || {}).value || '').trim();
  if (!quantity || quantity < 1) return toast('Please enter a valid quantity (minimum 1).', 'danger');
  const newQty   = (item.quantity || 0) + quantity;
  const entry    = { delta: quantity, reason: `Restock from ${supplier || 'unknown'}${notes ? ' — ' + notes : ''}`, type: 'Stock-In', by: AUTH.current.id, timestamp: now() };
  const patch    = { quantity: newQty, history: [...(item.history || []), entry] };
  if (supplier) patch.supplier = supplier;
  if (newPrice !== '' && newPrice != null) patch.unitCost = parseFloat(newPrice);
  DB.update('inventory', itemId, patch);
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast(`Stock updated — new total: ${newQty}.`, 'success');
}

// ─── Write-Off Modal ──────────────────────────────────────────────────────────

function inv_writeOffModal(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');
  modal({
    title: 'Write Off — ' + item.name,
    size: 'md',
    body: `
      <div class="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-sm text-rose-900 mb-4">
        ${icon('alert_triangle','w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5')}
        <span><strong>Warning:</strong> Write-offs permanently reduce stock. This action is logged and cannot be undone.</span>
      </div>
      <div class="bg-slate-100 rounded-xl px-3 py-2.5 text-sm mb-4">Current stock: <strong>${item.quantity || 0}</strong></div>
      <div class="space-y-3">
        <div><label class="input-label">Quantity to Write Off *</label>
          <input id="inv-writeoff-qty" class="input" type="number" min="1" max="${item.quantity || 0}" placeholder="e.g. 3" /></div>
        <div><label class="input-label">Reason *</label>
          <select id="inv-writeoff-reason" class="input" onchange="inv_toggleWriteOffNotes()">
            <option value="">— Select a reason —</option>
            <option value="Damaged">Damaged</option>
            <option value="Lost">Lost</option>
            <option value="Expired">Expired</option>
            <option value="Stolen">Stolen</option>
            <option value="Other">Other</option>
          </select></div>
        <div><label class="input-label">Notes <span id="inv-writeoff-notes-req" class="text-slate-400 text-xs">(optional)</span></label>
          <textarea id="inv-writeoff-notes" class="input" rows="2" placeholder="Additional details…"></textarea></div>
      </div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-danger" onclick="inv_doWriteOff('${itemId}')">Confirm Write-Off</button>`
  });
}

function inv_toggleWriteOffNotes() {
  const reasonEl = document.getElementById('inv-writeoff-reason');
  const reqEl    = document.getElementById('inv-writeoff-notes-req');
  if (!reasonEl || !reqEl) return;
  if (reasonEl.value === 'Other') { reqEl.textContent = '(required)'; reqEl.className = 'text-rose-600 text-xs'; }
  else { reqEl.textContent = '(optional)'; reqEl.className = 'text-slate-400 text-xs'; }
}

function inv_doWriteOff(itemId) {
  const item     = DB.find('inventory', itemId);
  if (!item) return toast('Item not found.', 'danger');
  const quantity = parseInt((document.getElementById('inv-writeoff-qty') || {}).value, 10);
  const reason   = ((document.getElementById('inv-writeoff-reason') || {}).value || '');
  const notes    = ((document.getElementById('inv-writeoff-notes') || {}).value || '').trim();
  const currentQty = item.quantity || 0;
  if (!quantity || quantity < 1) return toast('Please enter a valid quantity.', 'danger');
  if (!reason)   return toast('Please select a reason for the write-off.', 'danger');
  if (reason === 'Other' && !notes) return toast('Notes are required when reason is "Other".', 'danger');
  if (quantity > currentQty) return toast(`Cannot write off more than current stock (${currentQty}).`, 'danger');
  DB.update('inventory', itemId, {
    quantity: currentQty - quantity,
    history: [...(item.history || []), { delta: -quantity, reason: reason + (notes ? ': ' + notes : ''), type: 'Write-Off', by: AUTH.current.id, timestamp: now() }]
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Write-off recorded.', 'success');
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────

function addInventoryModal() {
  modal({
    title: 'Add Inventory Item',
    size: 'md',
    body: `<div class="space-y-3">
      <div><label class="input-label">Item Name *</label><input id="inv_name" class="input" placeholder="e.g. A4 Notebooks" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Category</label>
          <select id="inv_cat" class="input">
            ${(DB.settings().inventoryCategories || ['Books','Stationery','Equipment','Uniforms','Furniture','Sports','Other']).map(c => `<option>${c}</option>`).join('')}
          </select></div>
        <div><label class="input-label">Initial Quantity</label><input id="inv_qty" class="input" type="number" min="0" placeholder="0" /></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="input-label">Unit Cost (₦)</label><input id="inv_cost" class="input" type="number" min="0" placeholder="0" /></div>
        <div><label class="input-label">Min. Stock Level</label><input id="inv_min" class="input" type="number" min="0" placeholder="5" /></div>
      </div>
      <div><label class="input-label">Supplier</label><input id="inv_supplier" class="input" placeholder="e.g. ABC Supplies Ltd" /></div>
    </div>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button class="btn btn-primary" onclick="inv_saveNewItem()">Add Item</button>`
  });
}

function inv_saveNewItem() {
  const name = ((document.getElementById('inv_name') || {}).value || '').trim();
  if (!name) { toast('Item name is required', 'danger'); return; }
  DB.insert('inventory', {
    id: uid('inv'), schoolId: currentSchoolId(),
    name,
    category: (document.getElementById('inv_cat') || {}).value,
    quantity: parseInt((document.getElementById('inv_qty') || {}).value) || 0,
    unitCost: parseFloat((document.getElementById('inv_cost') || {}).value) || 0,
    minStock: parseInt((document.getElementById('inv_min') || {}).value) || 5,
    supplier: ((document.getElementById('inv_supplier') || {}).value || '').trim(),
    history: []
  });
  document.getElementById('modalBackdrop').click();
  APP.render();
  toast('Item added to inventory', 'success');
}

// ─── History Modal ────────────────────────────────────────────────────────────

function viewInventoryHistory(itemId) {
  const item = DB.find('inventory', itemId);
  if (!item) return;
  const history = (item.history || []).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  modal({
    title: 'History — ' + item.name,
    size: 'md',
    body: history.length === 0
      ? `<p class="text-slate-500 text-sm p-4 text-center">No history recorded yet.</p>`
      : `<div class="card overflow-hidden">
          <table class="tbl">
            <thead><tr><th>Type</th><th>Change</th><th>Reason</th><th>Date</th></tr></thead>
            <tbody>
              ${history.map(h => `<tr>
                <td><span class="badge ${h.type==='Issue'?'badge-warn':h.type==='Write-Off'?'badge-danger':'badge-success'}">${h.type}</span></td>
                <td class="font-bold font-mono ${h.delta < 0 ? 'text-rose-600' : 'text-emerald-600'}">${h.delta > 0 ? '+' : ''}${h.delta}</td>
                <td class="text-sm">${h.reason || '—'}</td>
                <td class="text-xs text-slate-400">${h.timestamp ? h.timestamp.slice(0,10) : '—'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Close</button>`
  });
}
