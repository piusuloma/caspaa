/* ============================================================
   ENHANCED PAYMENT GATEWAY MODULE
   Redefines processPayment() from parent.js (loads after it).
   Adds: card-input step → OTP verification → receipt download.
   Transfer flow gets proper virtual account details.
   ============================================================ */

function processPayment(invoiceId) {
  const amountEl = document.getElementById('pay_amount');
  const methodEl = document.querySelector('input[name="payMethod"]:checked');
  if (!amountEl || !methodEl) { toast('Payment form error — please try again', 'danger'); return; }

  const amount = parseInt(amountEl.value);
  const method = methodEl.value;
  const inv = DB.find('invoices', invoiceId);
  if (!inv) { toast('Invoice not found', 'danger'); return; }
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'danger'); return; }

  // Show processing state on button
  const btn = document.getElementById('proceedPay');
  if (btn) { btn.innerHTML = '<div class="spinner inline-block w-4 h-4 mr-2"></div> Processing…'; btn.disabled = true; }

  if (method === 'ussd') {
    setTimeout(() => {
      document.getElementById('modalBackdrop').click();
      modal({
        title: 'Dial This USSD Code',
        body: `<div class="text-center py-4">
          <div class="text-xs text-slate-500 mb-2">On your phone, dial:</div>
          <div class="text-4xl font-extrabold text-brand-700 font-mono">*737*50*${amount}#</div>
          <p class="text-sm text-slate-500 mt-4">Follow the prompts on your phone. The system will confirm automatically once completed.</p>
          <button class="btn btn-primary mt-6 w-full" onclick="completePayment('${invoiceId}', ${amount}, 'ussd')">
            I've completed the USSD payment
          </button>
        </div>`
      });
    }, 800);
    return;
  }

  if (method === 'transfer') {
    setTimeout(() => {
      document.getElementById('modalBackdrop').click();
      const student = DB.find('students', inv.studentId);
      const studentName = student ? student.name : inv.studentId;
      const schoolName = (DB.find('schools', AUTH.current.schoolId || 'sch_brightlights') || {}).name || 'School';
      modal({
        title: 'Pay via Bank Transfer',
        body: `<div class="space-y-4">
          <div class="bg-brand-50 rounded-2xl p-5 text-center">
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Transfer exactly</div>
            <div class="text-3xl font-extrabold text-brand-700">${money(amount)}</div>
            <div class="text-xs text-slate-400 mt-1">to this dedicated account</div>
          </div>
          <div class="card p-4 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Bank</span>
              <span class="font-semibold text-slate-900">Wema Bank</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Account Number</span>
              <span class="font-bold text-xl font-mono text-brand-700">0087 6543 21</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Account Name</span>
              <span class="font-semibold text-slate-900">${schoolName}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Narration</span>
              <span class="font-semibold text-slate-900">${studentName} School Fees</span>
            </div>
          </div>
          <div class="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
            This is a dedicated virtual account. Use the narration above so your payment is matched automatically within 5 minutes of transfer.
          </div>
        </div>`,
        footer: `<button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
                 <button class="btn btn-primary" onclick="document.getElementById('modalBackdrop').click(); completePayment('${invoiceId}', ${amount}, 'transfer')">
                   I've made the transfer
                 </button>`
      });
    }, 800);
    return;
  }

  // Card flow — show Paystack-like card input UI
  const txFee   = Math.round(amount * 0.015);
  const charged = amount + txFee;
  setTimeout(() => {
    document.getElementById('modalBackdrop').click();
    pay_showCardInput(invoiceId, amount, txFee, charged);
  }, 400);
}

// ── Card input step ──────────────────────────────────────────────────────────

function pay_showCardInput(invoiceId, amount, txFee, charged) {
  const schoolName = (DB.find('schools', AUTH.current.schoolId || 'sch_brightlights') || {}).name || 'School';
  modal({
    size: 'sm',
    title: '',
    body: `
      <div class="text-center mb-5 pt-2">
        <div class="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          Secure Payment
        </div>
        <div class="text-3xl font-extrabold text-slate-900">${money(charged)}</div>
        ${txFee > 0 ? `<div class="text-xs text-slate-400 mt-1">Includes transaction fee: ${money(txFee)} (1.5%)</div>` : ''}
        <div class="text-sm text-slate-500 mt-1">${schoolName}</div>
      </div>

      <div class="space-y-3">
        <div>
          <label class="input-label text-xs">Card Number</label>
          <input id="pay_card_num" class="input font-mono tracking-widest" maxlength="19"
            placeholder="0000  0000  0000  0000"
            oninput="
              let v=this.value.replace(/\\D/g,'').slice(0,16);
              this.value=v.replace(/(\\d{4})/g,'$1 ').trim();
            ">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label text-xs">Expiry (MM/YY)</label>
            <input id="pay_card_exp" class="input font-mono" maxlength="5" placeholder="MM/YY"
              oninput="
                let v=this.value.replace(/\\D/g,'');
                if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2,4);
                this.value=v;
              ">
          </div>
          <div>
            <label class="input-label text-xs">CVV</label>
            <input id="pay_card_cvv" class="input font-mono tracking-widest" maxlength="3" placeholder="•••" type="password">
          </div>
        </div>
        <div>
          <label class="input-label text-xs">Cardholder Name</label>
          <input id="pay_card_name" class="input" placeholder="As printed on card">
        </div>
      </div>

      <div class="flex items-center justify-center gap-3 mt-4 text-xs text-slate-400">
        <span class="font-semibold">Visa</span>
        <span class="w-px h-3 bg-slate-300"></span>
        <span class="font-semibold">Mastercard</span>
        <span class="w-px h-3 bg-slate-300"></span>
        <span class="font-semibold">Verve</span>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button id="pay_card_btn" class="btn btn-primary flex-1" onclick="pay_processCard('${invoiceId}',${amount},${txFee},${charged})">
        Pay ${money(charged)}
      </button>
    `
  });
}

function pay_processCard(invoiceId, amount, txFee, charged) {
  const num  = (document.getElementById('pay_card_num')  || {}).value.replace(/\s/g, '');
  const exp  = (document.getElementById('pay_card_exp')  || {}).value;
  const cvv  = (document.getElementById('pay_card_cvv')  || {}).value;
  const name = ((document.getElementById('pay_card_name') || {}).value || '').trim();

  if (num.length < 16)  { toast('Enter a valid 16-digit card number', 'danger'); return; }
  if (!/^\d{2}\/\d{2}$/.test(exp)) { toast('Enter expiry as MM/YY', 'danger'); return; }
  if (cvv.length < 3)   { toast('Enter the 3-digit CVV', 'danger'); return; }
  if (!name)            { toast('Enter the cardholder name', 'danger'); return; }

  const btn = document.getElementById('pay_card_btn');
  if (btn) { btn.innerHTML = '<div class="spinner inline-block w-4 h-4 mr-2"></div> Verifying card…'; btn.disabled = true; }

  setTimeout(() => {
    document.getElementById('modalBackdrop').click();
    pay_showOTP(invoiceId, amount, txFee);
  }, 1600);
}

// ── OTP step ─────────────────────────────────────────────────────────────────

function pay_showOTP(invoiceId, amount, txFee) {
  const charged = amount + txFee;
  modal({
    size: 'sm',
    title: 'Verify Transaction',
    body: `
      <div class="text-center space-y-4 py-2">
        <div class="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center mx-auto text-2xl">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <div>
          <div class="font-bold text-slate-900 text-lg">OTP Verification</div>
          <div class="text-sm text-slate-500 mt-1 leading-relaxed">
            A one-time PIN has been sent to your bank-registered phone number ending in <strong>**4567</strong>.
            Enter it below to authorise ${money(charged)}.
          </div>
        </div>
        <div>
          <input id="pay_otp" class="input text-center text-2xl font-mono tracking-[0.4em]" maxlength="6"
            placeholder="— — — — — —" type="text" autocomplete="one-time-code"
            oninput="this.value=this.value.replace(/\\D/g,'')">
          <div class="mt-2 text-xs text-brand-600 bg-brand-50 rounded-lg px-3 py-1.5">
            Demo hint: enter <strong>123456</strong> to complete
          </div>
        </div>
        <button class="text-xs text-brand-600 underline" onclick="pay_resendOTP()">Resend OTP</button>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modalBackdrop').click()">Cancel</button>
      <button id="pay_otp_btn" class="btn btn-primary flex-1" onclick="pay_confirmOTP('${invoiceId}',${amount})">
        Confirm Payment
      </button>
    `
  });
}

function pay_resendOTP() {
  toast('A new OTP has been sent to your phone', 'info');
}

function pay_confirmOTP(invoiceId, amount) {
  const otp = ((document.getElementById('pay_otp') || {}).value || '').trim();
  if (otp.length !== 6) { toast('Enter the 6-digit OTP', 'danger'); return; }

  if (otp !== '123456') {
    toast('Incorrect OTP. Check your phone and try again.', 'danger');
    const inp = document.getElementById('pay_otp');
    if (inp) { inp.value = ''; inp.focus(); }
    return;
  }

  const btn = document.getElementById('pay_otp_btn');
  if (btn) { btn.innerHTML = '<div class="spinner inline-block w-4 h-4 mr-2"></div> Completing…'; btn.disabled = true; }

  setTimeout(() => {
    document.getElementById('modalBackdrop').click();
    pay_showReceipt(invoiceId, amount);
  }, 1200);
}

// ── Receipt step (success) ────────────────────────────────────────────────────

function pay_showReceipt(invoiceId, amount) {
  // Complete the payment in DB first
  completePayment(invoiceId, amount, 'card');

  // After completePayment() closes its modal, show the receipt download prompt
  // completePayment shows its own success modal — we add a "Download Receipt" footer action
  // by overriding the footer after completePayment opens the modal
  setTimeout(() => {
    const footer = document.querySelector('#modalBackdrop .modal-footer');
    if (footer) {
      const dl = document.createElement('button');
      dl.className = 'btn btn-secondary';
      dl.innerHTML = `<svg class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> Download Receipt`;
      dl.onclick = () => pay_downloadReceipt(invoiceId, amount);
      footer.insertBefore(dl, footer.firstChild);
    }
  }, 100);
}

function pay_downloadReceipt(invoiceId, amount) {
  const inv = DB.find('invoices', invoiceId);
  const student = inv ? DB.find('students', inv.studentId) : null;
  const ref = 'CSP-' + Date.now().toString(36).toUpperCase().slice(-8);
  const schoolName = (DB.find('schools', AUTH.current.schoolId || 'sch_brightlights') || {}).name || 'School';
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Receipt — ${ref}</title>
      <style>
        body{font-family:system-ui,sans-serif;max-width:480px;margin:40px auto;padding:24px;color:#1e293b;}
        .logo{background:#fd5f54;color:#fff;text-align:center;padding:16px;border-radius:12px 12px 0 0;font-size:20px;font-weight:700;}
        .body{border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px;}
        .row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;}
        .label{color:#64748b;}
        .val{font-weight:600;text-align:right;}
        .amount{font-size:28px;font-weight:800;color:#fd5f54;text-align:center;margin:20px 0;padding:16px;background:#ecfdf5;border-radius:8px;}
        .ref{font-family:'Figtree',system-ui,sans-serif;font-size:12px;color:#94a3b8;text-align:center;margin-top:16px;}
        .badge{display:inline-block;background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;}
        @media print{button{display:none;}}
      </style>
    </head>
    <body>
      <div class="logo">${schoolName}</div>
      <div class="body">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:13px;color:#64748b;margin-bottom:4px;">Payment Receipt</div>
          <span class="badge">✓ Successful</span>
        </div>
        <div class="amount">${money(amount)}</div>
        <div class="row"><span class="label">Student</span><span class="val">${student ? student.name : '—'}</span></div>
        <div class="row"><span class="label">Invoice ID</span><span class="val" style="font-family:'Figtree',system-ui,sans-serif;font-size:12px;">${invoiceId}</span></div>
        <div class="row"><span class="label">Payment Method</span><span class="val">Debit / Credit Card</span></div>
        <div class="row"><span class="label">Gateway</span><span class="val">Paystack</span></div>
        <div class="row"><span class="label">Date & Time</span><span class="val">${new Date().toLocaleString('en-NG')}</span></div>
        <div class="ref">Reference: ${ref}</div>
        <div style="text-align:center;margin-top:20px;">
          <button onclick="window.print()" style="background:#fd5f54;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;">Print Receipt</button>
        </div>
        <div style="font-size:11px;color:#94a3b8;text-align:center;margin-top:16px;">
          Keep this receipt as proof of payment.<br>
          Questions? Email accounts@brightlights.edu.ng
        </div>
      </div>
    </body>
    </html>
  `;
  const win = window.open('', '_blank');
  if (win) { win.document.write(receiptHtml); win.document.close(); }
  else { toast('Pop-up blocked. Allow pop-ups to download receipt.', 'danger'); }
}
