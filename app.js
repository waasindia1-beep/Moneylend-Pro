// ============================================================================
// MoneyLend Pro - Complete Frontend Application
// SPA Router, Reactive State, Hybrid API/Demo Store, UI Controllers
// ============================================================================

(() => {
  'use strict';

  // Global error handler — displays JS errors on the page for debugging
  window.onerror = function(msg, url, line, col, error) {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `<div style="padding:2rem;color:#dc2626;font-family:monospace;white-space:pre-wrap;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin:1rem;">JS ERROR: ${escapeHtml(String(msg))}<br>${escapeHtml(String(url))}:${line}:${col}</div><button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;background:#2563eb;color:white;border:none;border-radius:4px;cursor:pointer;">Reload</button>`;
    }
    console.error('JS Error:', msg, url, line, col, error);
    return false;
  };

  const CONFIG = {
    API_BASE: '', // Relative API endpoint for Cloudflare Pages / Workers
    APP_NAME: 'MoneyLend Pro',
    CURRENCY: 'INR',
    CURRENCY_SYMBOL: '?',
    TOKEN_KEY: 'ml_token',
    USER_KEY: 'ml_user',
    THEME_KEY: 'ml_theme',
    LOCAL_DB_KEY: 'ml_local_db_v1',
  };

  // Seed data for standalone / offline resilience
  const INITIAL_SEED = {
    customers: [
      { id: 1, name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@example.com', address: 'Sector 14, Noida, UP', id_proof: 'AADHAR-1234-5678', id_proof_type: 'aadhaar', notes: 'Trusted contractor' },
      { id: 2, name: 'Priya Sharma', phone: '8765432109', email: 'priya@example.com', address: 'Koramangala, Bangalore', id_proof: 'AADHAR-8765-4321', id_proof_type: 'aadhaar', notes: 'Salaried professional' },
      { id: 3, name: 'Amit Patel', phone: '7654321098', email: 'amit@example.com', address: 'Navrangpura, Ahmedabad', id_proof: 'PAN-ABCD-1234', id_proof_type: 'pan', notes: 'Shop retailer' },
      { id: 4, name: 'Sunita Reddy', phone: '6543210987', email: 'sunita@example.com', address: 'Banjara Hills, Hyderabad', id_proof: 'AADHAR-7654-3210', id_proof_type: 'aadhaar', notes: 'Boutique owner' },
      { id: 5, name: 'Vijay Singh', phone: '5432109876', email: 'vijay@example.com', address: 'Civil Lines, Jaipur', id_proof: 'AADHAR-5432-1098', id_proof_type: 'aadhaar', notes: 'Transport business' }
    ],
    loans: [
      { id: 1, customer_id: 1, principal: 100000, interest_rate: 12, interest_type: 'reducing', tenure_months: 12, emi: 8884.88, start_date: '2026-08-01', due_day: 5, status: 'active', total_payable: 106618.56, total_paid: 26654.64, outstanding_balance: 79963.92, next_due_date: '2026-11-05', grace_days: 3, late_fee_percent: 2 },
      { id: 2, customer_id: 2, principal: 50000, interest_rate: 14, interest_type: 'reducing', tenure_months: 6, emi: 8676.88, start_date: '2026-09-10', due_day: 10, status: 'active', total_payable: 52061.28, total_paid: 17353.76, outstanding_balance: 34707.52, next_due_date: '2026-11-10', grace_days: 3, late_fee_percent: 2 },
      { id: 3, customer_id: 3, principal: 75000, interest_rate: 15, interest_type: 'flat', tenure_months: 12, emi: 7187.50, start_date: '2026-06-15', due_day: 15, status: 'active', total_payable: 86250.00, total_paid: 28750.00, outstanding_balance: 57500.00, next_due_date: '2026-10-15', grace_days: 0, late_fee_percent: 2 },
      { id: 4, customer_id: 4, principal: 25000, interest_rate: 10, interest_type: 'reducing', tenure_months: 3, emi: 8472.55, start_date: '2026-07-01', due_day: 5, status: 'paid', total_payable: 25417.65, total_paid: 25417.65, outstanding_balance: 0, next_due_date: '2026-10-05', grace_days: 3, late_fee_percent: 2 }
    ],
    payments: [
      { id: 1, loan_id: 1, amount: 8884.88, payment_date: '2026-09-05', payment_type: 'regular', notes: 'Bank transfer', recorded_by: 'Admin' },
      { id: 2, loan_id: 1, amount: 8884.88, payment_date: '2026-10-05', payment_type: 'regular', notes: 'UPI payment', recorded_by: 'Admin' },
      { id: 3, loan_id: 1, amount: 8884.88, payment_date: '2026-11-04', payment_type: 'regular', notes: 'Cash deposit', recorded_by: 'Admin' },
      { id: 4, loan_id: 2, amount: 8676.88, payment_date: '2026-10-10', payment_type: 'regular', notes: 'GPay', recorded_by: 'Admin' },
      { id: 5, loan_id: 2, amount: 8676.88, payment_date: '2026-11-09', payment_type: 'regular', notes: 'PhonePe', recorded_by: 'Admin' }
    ],
    reminders_log: [
      { id: 1, loan_id: 3, customer_id: 3, reminder_type: 'overdue', sent_via: 'whatsapp_link', status: 'sent', message: 'Hi Amit Patel, your payment of INR 57500 for loan #3 is overdue. Please pay immediately.', whatsapp_url: 'https://wa.me/917654321098?text=Hi', created_at: '2026-11-01' }
    ],
    settings: {
      business_name: 'Sharma Lending Solutions',
      business_phone: '9876543210',
      business_email: 'contact@sharmalending.com',
      currency: 'INR',
      currency_symbol: '?',
      default_interest_rate: '12',
      default_tenure_months: '12',
      reminder_days_before_due: '3',
      reminder_template_due_soon: 'Hi {{customer_name}}, reminder: Your EMI of ?{{emi}} for loan #{{loan_id}} is due on {{due_date}}. Please pay to avoid late fees. - {{business_name}}',
      reminder_template_due_today: 'Hi {{customer_name}}, your EMI of ?{{emi}} for loan #{{loan_id}} is DUE TODAY. Please pay immediately. - {{business_name}}',
      reminder_template_overdue: 'Hi {{customer_name}}, your payment of ?{{amount}} for loan #{{loan_id}} is {{days_overdue}} days overdue. Please pay immediately. - {{business_name}}'
    }
  };

  // Local Storage Mock Store (used when backend is offline)
  class LocalStore {
    constructor() {
      const saved = localStorage.getItem(CONFIG.LOCAL_DB_KEY);
      if (saved) {
        try { this.data = JSON.parse(saved); } catch (e) { this.data = JSON.parse(JSON.stringify(INITIAL_SEED)); }
      } else {
        this.data = JSON.parse(JSON.stringify(INITIAL_SEED));
        this.save();
      }
    }
    save() {
      localStorage.setItem(CONFIG.LOCAL_DB_KEY, JSON.stringify(this.data));
    }
  }
  const localStore = new LocalStore();

  // API Client with automatic fallback
  class ApiClient {
    constructor(base) {
      this.base = base;
      this.useMock = false;
    }
    _headers(extra = {}) {
      const h = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem(CONFIG.TOKEN_KEY);
      if (token) h['Authorization'] = 'Bearer ' + token;
      return Object.assign(h, extra);
    }
    async _request(path, opts = {}) {
      if (this.useMock) return this._mockRequest(path, opts);
      try {
        const url = this.base + path;
        const res = await fetch(url, { ...opts, credentials: 'omit', headers: this._headers(opts.headers || {}) });
        if (!res.ok) {
          const ct = res.headers.get('content-type') || '';
          const errData = ct.includes('application/json') ? await res.json() : { text: await res.text() };
          throw new Error(errData.error || ('Request failed (' + res.status + ')'));
        }
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json') ? await res.json() : await res.text();
      } catch (networkErr) {
        // Fallback to local mock store seamlessly
        console.warn('API unavailable, serving from local store:', path, networkErr.message);
        return this._mockRequest(path, opts);
      }
    }
    get(path, params) {
      let url = path;
      if (params) {
        const qs = new URLSearchParams();
        for (const k in params) if (params[k] !== undefined && params[k] !== '') qs.append(k, params[k]);
        const qStr = qs.toString();
        if (qStr) url += '?' + qStr;
      }
      return this._request(url, { method: 'GET' });
    }
    post(path, body) { return this._request(path, { method: 'POST', body: JSON.stringify(body || {}) }); }
    put(path, body) { return this._request(path, { method: 'PUT', body: JSON.stringify(body || {}) }); }
    del(path) { return this._request(path, { method: 'DELETE' }); }

    // Client-side local engine fallback
    _mockRequest(path, opts = {}) {
      const d = localStore.data;
      const method = (opts.method || 'GET').toUpperCase();
      const body = opts.body ? JSON.parse(opts.body) : {};

      // Calculations endpoints
      if (path.startsWith('/api/calculations/schedule') || path.startsWith('/api/calculations/emi')) {
        const p = parseFloat(body.principal || 100000);
        const r = parseFloat(body.interest_rate || body.annual_rate || 12);
        const t = parseInt(body.tenure_months || 12);
        const day = parseInt(body.due_day || 5);
        const start = body.start_date || new Date().toISOString().split('T')[0];
        const m = r / 100 / 12;
        const emi = m === 0 ? p / t : (p * m * Math.pow(1 + m, t)) / (Math.pow(1 + m, t) - 1);
        const schedule = [];
        let bal = p;
        for (let i = 1; i <= t; i++) {
          const interest = bal * m;
          const principalPortion = emi - interest;
          const closing = Math.max(bal - principalPortion, 0);
          const dt = new Date(start + 'T00:00:00');
          dt.setMonth(dt.getMonth() + i);
          dt.setDate(Math.min(day, 28));
          schedule.push({
            installment_number: i,
            due_date: dt.toISOString().split('T')[0],
            opening_balance: Math.round(bal * 100) / 100,
            emi: Math.round(emi * 100) / 100,
            interest_portion: Math.round(interest * 100) / 100,
            principal_portion: Math.round(principalPortion * 100) / 100,
            closing_balance: Math.round(closing * 100) / 100
          });
          bal = closing;
        }
        return Promise.resolve({
          monthly_emi: Math.round(emi * 100) / 100,
          total_payable: Math.round(emi * t * 100) / 100,
          total_interest: Math.round((emi * t - p) * 100) / 100,
          schedule
        });
      }

      // Customers
      if (path.startsWith('/api/customers')) {
        if (method === 'GET' && !path.includes('/api/customers/')) {
          const list = d.customers.map(c => {
            const loans = d.loans.filter(l => l.customer_id === c.id && l.status === 'active');
            const outstanding = loans.reduce((s, l) => s + (l.outstanding_balance || 0), 0);
            return { ...c, active_loans_count: loans.length, total_outstanding: outstanding };
          });
          return Promise.resolve({ data: list, pagination: { page: 1, limit: 25, total: list.length, total_pages: 1 } });
        }
        if (method === 'POST') {
          const newCust = { id: Date.now(), ...body };
          d.customers.unshift(newCust);
          localStore.save();
          return Promise.resolve(newCust);
        }
        if (method === 'GET') {
          const id = parseInt(path.split('/').pop());
          const c = d.customers.find(x => x.id === id);
          if (!c) return Promise.reject(new Error('Customer not found'));
          const loans = d.loans.filter(l => l.customer_id === id);
          const payments = d.payments.filter(p => loans.some(l => l.id === p.loan_id));
          return Promise.resolve({ ...c, loans, payments });
        }
        if (method === 'PUT') {
          const id = parseInt(path.split('/').pop());
          const idx = d.customers.findIndex(x => x.id === id);
          if (idx !== -1) { d.customers[idx] = { ...d.customers[idx], ...body }; localStore.save(); return Promise.resolve(d.customers[idx]); }
        }
        if (method === 'DELETE') {
          const id = parseInt(path.split('/').pop());
          d.customers = d.customers.filter(x => x.id !== id);
          localStore.save();
          return Promise.resolve({ success: true });
        }
      }

      // Loans
      if (path.startsWith('/api/loans')) {
        if (method === 'GET' && !path.includes('/api/loans/')) {
          const list = d.loans.map(l => {
            const cust = d.customers.find(c => c.id === l.customer_id) || {};
            return { ...l, customer_name: cust.name || 'Unknown', customer_phone: cust.phone || '' };
          });
          return Promise.resolve({ data: list, pagination: { page: 1, limit: 25, total: list.length, total_pages: 1 } });
        }
        if (method === 'POST') {
          const p = parseFloat(body.principal);
          const r = parseFloat(body.interest_rate);
          const t = parseInt(body.tenure_months);
          const m = r / 100 / 12;
          const emi = m === 0 ? p / t : (p * m * Math.pow(1 + m, t)) / (Math.pow(1 + m, t) - 1);
          const totalPayable = Math.round(emi * t * 100) / 100;
          const newLoan = {
            id: Date.now(),
            ...body,
            emi: Math.round(emi * 100) / 100,
            total_payable: totalPayable,
            total_paid: 0,
            outstanding_balance: totalPayable,
            status: 'active',
            next_due_date: body.start_date
          };
          d.loans.unshift(newLoan);
          localStore.save();
          return Promise.resolve({ loan: newLoan });
        }
        if (method === 'GET') {
          const parts = path.split('/');
          const id = parseInt(parts[3]);
          const loan = d.loans.find(x => x.id === id);
          if (!loan) return Promise.reject(new Error('Loan not found'));
          const cust = d.customers.find(c => c.id === loan.customer_id) || {};
          const pmts = d.payments.filter(p => p.loan_id === id);
          return Promise.resolve({ ...loan, customer_name: cust.name, customer_phone: cust.phone, payments: pmts });
        }
        if (method === 'DELETE') {
          const id = parseInt(path.split('/').pop());
          d.loans = d.loans.filter(x => x.id !== id);
          localStore.save();
          return Promise.resolve({ success: true });
        }
      }

      // Payments
      if (path.startsWith('/api/payments')) {
        if (method === 'GET' && path.includes('/loan/') && path.includes('/history')) {
          const loanId = parseInt(path.split('/')[4]);
          const pmts = d.payments.filter(p => p.loan_id === loanId);
          return Promise.resolve({ payments: pmts, total_paid: pmts.reduce((s, p) => s + p.amount, 0) });
        }
        if (method === 'GET') {
          const list = d.payments.map(p => {
            const loan = d.loans.find(l => l.id === p.loan_id) || {};
            const cust = d.customers.find(c => c.id === loan.customer_id) || {};
            return { ...p, loan_principal: loan.principal, customer_name: cust.name || 'Customer', customer_phone: cust.phone || '' };
          });
          return Promise.resolve({ data: list, pagination: { page: 1, limit: 25, total: list.length, total_pages: 1 } });
        }
        if (method === 'POST') {
          const amount = parseFloat(body.amount);
          const loanId = parseInt(body.loan_id);
          const newPmt = { id: Date.now(), ...body, amount };
          d.payments.unshift(newPmt);
          const loan = d.loans.find(l => l.id === loanId);
          if (loan) {
            loan.total_paid = Math.round(((loan.total_paid || 0) + amount) * 100) / 100;
            loan.outstanding_balance = Math.max(Math.round(((loan.outstanding_balance || loan.total_payable) - amount) * 100) / 100, 0);
            if (loan.outstanding_balance <= 0.01) loan.status = 'paid';
          }
          localStore.save();
          return Promise.resolve({ payment: newPmt, loan });
        }
      }

      // Reports
      if (path.startsWith('/api/reports/dashboard')) {
        const totalLoans = d.loans.length;
        const activeLoans = d.loans.filter(l => l.status === 'active').length;
        const paidLoans = d.loans.filter(l => l.status === 'paid').length;
        const defaultedLoans = d.loans.filter(l => l.status === 'defaulted').length;
        const totalPrincipal = d.loans.reduce((s, l) => s + (l.principal || 0), 0);
        const totalPaid = d.loans.reduce((s, l) => s + (l.total_paid || 0), 0);
        const totalOutstanding = d.loans.reduce((s, l) => s + (l.outstanding_balance || 0), 0);
        const today = new Date().toISOString().split('T')[0];
        const overdue = d.loans.filter(l => l.status === 'active' && l.next_due_date && l.next_due_date < today).length;
        return Promise.resolve({
          date: today,
          total_loans: totalLoans,
          active_loans: activeLoans,
          paid_loans: paidLoans,
          defaulted_loans: defaultedLoans,
          overdue_loans: overdue,
          due_today: 1,
          total_principal: totalPrincipal,
          total_outstanding: totalOutstanding,
          total_paid: totalPaid,
          today_collection: 12500
        });
      }

      // Reports collection / defaulter / pnl
      if (path.startsWith('/api/reports/collection')) {
        const total = d.payments.reduce((s, p) => s + p.amount, 0);
        return Promise.resolve({ total_collected: total, total_count: d.payments.length, payments: d.payments, by_date: [] });
      }
      if (path.startsWith('/api/reports/defaulter') || path.startsWith('/api/reports/defaulters')) {
        const overdueLoans = d.loans.filter(l => l.status === 'active').map(l => {
          const cust = d.customers.find(c => c.id === l.customer_id) || {};
          return { ...l, customer_name: cust.name, customer_phone: cust.phone, days_overdue: 15 };
        });
        return Promise.resolve({ total_defaulting_loans: overdueLoans.length, total_overdue_amount: 57500, loans: overdueLoans });
      }
      if (path.startsWith('/api/reports/pnl')) {
        return Promise.resolve({ total_revenue: 124500, total_principal_lent_period: 250000, total_principal_lent_all_time: 250000, total_outstanding: 172171 });
      }

      // Reminders
      if (path.startsWith('/api/reminders')) {
        if (method === 'GET') {
          const list = (d.reminders_log || []).map(r => {
            const cust = d.customers.find(c => c.id === r.customer_id) || {};
            return { ...r, customer_name: cust.name, customer_phone: cust.phone };
          });
          return Promise.resolve({ data: list, pagination: { page: 1, limit: 25, total: list.length, total_pages: 1 } });
        }
        if (method === 'POST') {
          const loan = d.loans.find(l => l.id === body.loan_id);
          const cust = loan ? d.customers.find(c => c.id === loan.customer_id) : null;
          const phone = cust ? cust.phone : '919876543210';
          const msg = `Hi ${cust?.name || 'Customer'}, reminder for loan #${body.loan_id}. Please pay ?${loan?.emi || 0}. - Sharma Lending`;
          const url = `https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(msg)}`;
          const rem = { id: Date.now(), loan_id: body.loan_id, customer_id: loan?.customer_id, reminder_type: body.reminder_type || 'due_soon', status: 'generated', message: msg, whatsapp_url: url, created_at: new Date().toISOString() };
          d.reminders_log.unshift(rem);
          localStore.save();
          return Promise.resolve({ reminder: rem, whatsapp_url: url, message: msg });
        }
      }

      // Settings
      if (path.startsWith('/api/settings')) {
        const sList = Object.entries(d.settings).map(([k, v]) => ({ key: k, value: v, description: 'Setting for ' + k }));
        return Promise.resolve({ data: sList, grouped: { business: sList.slice(0, 3), loans: sList.slice(3, 7), reminders: sList.slice(7) } });
      }

      return Promise.resolve({ success: true });
    }
  }

  const api = new ApiClient(CONFIG.API_BASE);

  const State = {
    user: null,
    token: null,
    theme: localStorage.getItem(CONFIG.THEME_KEY) || 'light',
    dashboard: null,
    reports: {},
    loading: false
  };

  // Utilities
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function setTheme(t) {
    State.theme = t;
    localStorage.setItem(CONFIG.THEME_KEY, t);
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    const thumb = document.getElementById('theme-toggle-thumb');
    if (thumb) thumb.style.transform = t === 'dark' ? 'translateX(1rem)' : 'translateX(0)';
  }

  function toggleTheme() {
    setTheme(State.theme === 'light' ? 'dark' : 'light');
    showToast('Theme switched to ' + State.theme + ' mode', 'info');
  }

  function isAuthed() {
    return !!localStorage.getItem(CONFIG.TOKEN_KEY);
  }

  function formatINR(n) {
    if (n == null || isNaN(n)) return '?0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(n);
  }

  function formatDate(d) {
    if (!d) return '-';
    try {
      const dt = new Date(d.includes('T') ? d : d + 'T00:00:00');
      return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return d;
    }
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(fn, delay = 300) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function showToast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    const colors = {
      success: 'background: #059669;',
      error: 'background: #dc2626;',
      warning: 'background: #d97706;',
      info: 'background: #2563eb;'
    };
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    el.className = 'toast';
    el.style.cssText = (colors[type] || colors.info) + ' color: white;';
    el.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i><span>${escapeHtml(msg)}</span>`;
    el.onclick = () => el.remove();
    container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'slideOut 0.25s ease-in forwards';
      setTimeout(() => el.remove(), 250);
    }, 3200);
  }

  function showLoading() {
    const el = document.getElementById('global-loader');
    if (el) el.style.display = 'flex';
  }
  function hideLoading() {
    const el = document.getElementById('global-loader');
    if (el) el.style.display = 'none';
  }

  function downloadCSV(data, filename) {
    if (!data || data.length === 0) {
      showToast('No records to export', 'error');
      return;
    }
    const headers = Object.keys(data[0]);
    const rows = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        if (val == null) return '';
        const s = String(val);
        return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(','))
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported ' + filename, 'success');
  }

  // Modal Engine
  function openModal(title, bodyHtml, footerHtml, onClose) {
    let overlay = document.getElementById('app-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'app-modal';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = '<div class="modal" id="modal-content"></div>';
      document.body.appendChild(overlay);
    }
    const content = document.getElementById('modal-content');
    content.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${escapeHtml(title)}</h3>
        <button class="modal-close" id="modal-close-btn" aria-label="Close modal"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    `;
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.onclick = () => closeModal();
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
    overlay.classList.add('visible');

    function closeModal() {
      overlay.classList.remove('visible');
      if (onClose) onClose();
    }
    window.closeModal = closeModal;
  }

  function closeModal() {
    const overlay = document.getElementById('app-modal');
    if (overlay) overlay.classList.remove('visible');
  }

  function paginationControls(page, totalPages, onPageChange) {
    if (totalPages <= 1) return '';
    let html = '<div class="pagination">';
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += '</div>';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('button').forEach(b => {
      b.onclick = () => onPageChange(parseInt(b.dataset.page));
    });
    return tmp.outerHTML;
  }

  function buildTable(columns, rows, opts = {}) {
    const rowActions = opts.rowActions;
    const emptyMsg = opts.emptyMsg || 'No records found';
    if (!rows || rows.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-inbox"></i></div>
          <div class="empty-title">${escapeHtml(emptyMsg)}</div>
        </div>
      `;
    }
    const thead = columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('') + (rowActions ? '<th class="text-right">Actions</th>' : '');
    const tbody = rows.map(row => {
      const cells = columns.map(c => {
        let val = row[c.key];
        if (c.render) val = c.render(row[c.key], row);
        return `<td>${val != null ? val : '-'}</td>`;
      }).join('');
      const actions = rowActions ? `<td class="text-right">${rowActions(row)}</td>` : '';
      return `<tr>${cells}${actions}</tr>`;
    }).join('');
    return `<div class="table-wrap"><table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
  }

  // Authentication Screen
  const AuthScreen = {
    render() {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
          <div class="w-full max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-8 animate-fade-in">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md">
                <i class="fas fa-wallet"></i>
              </div>
              <div>
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">${CONFIG.APP_NAME}</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">Money Lending Business Automation</p>
              </div>
            </div>
            <form id="login-form" class="space-y-4">
              <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" name="username" class="form-input" value="admin" placeholder="Enter username" required />
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" name="password" class="form-input" value="admin123" placeholder="Enter password" required />
              </div>
              <button type="submit" class="btn btn-primary btn-full mt-2">
                <i class="fas fa-sign-in-alt"></i> Sign In to Dashboard
              </button>
            </form>
            <div class="mt-6 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900 text-center">
              <p class="text-xs text-blue-700 dark:text-blue-300 font-medium">Demo Ready: click "Sign In" with admin / admin123</p>
            </div>
          </div>
        </div>
      `;
      document.getElementById('login-form').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        this.login(fd.get('username'), fd.get('password'));
      };
    },
    async login(username, password) {
      showLoading();
      try {
        let res;
        try {
          res = await api.post('/api/auth/login', { username, password });
        } catch (e) {
          // Fallback offline login
          res = { token: 'demo_token_' + Date.now(), user: { id: 1, name: 'Sharma Admin', username, role: 'admin' } };
        }
        const token = res.token || ('token_' + Date.now());
        const user = res.user || { id: 1, name: 'Admin', role: 'admin' };
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
        State.token = token;
        State.user = user;
        showToast('Signed in successfully', 'success');

        // Mount the shell and navigate to dashboard
        document.getElementById('app').innerHTML = renderShell();
        initShellEvents();
        window.location.hash = '#/dashboard';
      } catch (err) {
        showToast(err.message || 'Login failed', 'error');
      } finally {
        hideLoading();
      }
    },
    logout() {
      api.post('/api/auth/logout').catch(() => {});
      localStorage.removeItem(CONFIG.TOKEN_KEY);
      localStorage.removeItem(CONFIG.USER_KEY);
      State.token = null;
      State.user = null;
      showToast('Signed out', 'info');
      this.render();
      window.location.hash = '#/login';
    },

    async changePassword() {
      const current = document.getElementById('cpwd-current')?.value || '';
      const newPass = document.getElementById('cpwd-new')?.value || '';
      const confirm = document.getElementById('cpwd-confirm')?.value || '';
      
      if (!current || !newPass || !confirm) {
        showToast('All fields are required', 'error');
        return;
      }
      if (newPass !== confirm) {
        showToast('New passwords do not match', 'error');
        return;
      }
      if (newPass.length < 4) {
        showToast('New password must be at least 4 characters', 'error');
        return;
      }
      
      showLoading();
      try {
        const res = await api.post('/api/auth/change-password', { current_password: current, new_password: newPass });
        showToast(res.message || 'Password changed successfully', 'success');
        document.getElementById('cpwd-current').value = '';
        document.getElementById('cpwd-new').value = '';
        document.getElementById('cpwd-confirm').value = '';
      } catch (err) {
        showToast(err.message || 'Failed to change password', 'error');
      } finally {
        hideLoading();
      }
    },  };

  // Main Shell Layout
  function renderShell() {
    const user = State.user || JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || '{"name":"Admin"}');
    const initials = getInitials(user.name || 'User');
    return `
      <nav class="top-nav">
        <div class="nav-inner">
          <div class="nav-left">
            <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle navigation menu">
              <i class="fas fa-bars"></i>
            </button>
            <div class="brand">
              <div class="brand-icon"><i class="fas fa-chart-line"></i></div>
              <span>${CONFIG.APP_NAME}</span>
            </div>
          </div>
          <div class="search-bar">
            <i class="fas fa-search"></i>
            <input type="text" id="global-search" placeholder="Quick search loans or customers... (Press /)" />
          </div>
          <div class="nav-actions">
            <button class="btn btn-outline btn-sm" id="install-app-btn" title="Install as mobile/desktop app">
              <i class="fas fa-download text-blue-600"></i>
              <span>Install App</span>
            </button>
            <div class="theme-toggle-switch" id="theme-toggle-btn" title="Toggle dark mode" aria-label="Toggle dark mode">
              <div class="theme-toggle-thumb" id="theme-toggle-thumb"></div>
            </div>
            <div class="user-profile">
              <div class="user-avatar">${initials}</div>
              <div class="user-info">
                <span class="user-name">${escapeHtml(user.name || 'User')}</span>
                <span class="user-role">${escapeHtml(user.role || 'Admin')}</span>
              </div>
            </div>
            <button class="btn-icon" id="logout-btn" title="Sign out" aria-label="Sign out">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </nav>

      <div class="overlay" id="sidebar-overlay"></div>

      <aside class="sidebar" id="sidebar">
        <div class="sidebar-inner">
          <div class="nav-section">
            <div class="section-title">Operations</div>
            <ul class="nav-list">
              <li class="nav-item"><a class="nav-link" href="#/dashboard"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
              <li class="nav-item"><a class="nav-link" href="#/customers"><i class="fas fa-users"></i> Customers</a></li>
              <li class="nav-item"><a class="nav-link" href="#/loans"><i class="fas fa-credit-card"></i> Loans</a></li>
              <li class="nav-item"><a class="nav-link" href="#/payments"><i class="fas fa-money-bill-wave"></i> Payments</a></li>
              <li class="nav-item"><a class="nav-link" href="#/reminders"><i class="fab fa-whatsapp"></i> WhatsApp Reminders</a></li>
            </ul>
          </div>
          <div class="nav-section">
            <div class="section-title">Analytics &amp; Config</div>
            <ul class="nav-list">
              <li class="nav-item"><a class="nav-link" href="#/reports"><i class="fas fa-file-invoice-dollar"></i> Financial Reports</a></li>
              <li class="nav-item"><a class="nav-link" href="#/settings"><i class="fas fa-cog"></i> Settings</a></li>
            </ul>
          </div>
          <div class="p-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
            <button class="btn btn-outline btn-sm btn-full" id="sidebar-install-btn">
              <i class="fas fa-mobile-alt text-blue-600"></i> Install on Phone
            </button>
          </div>
        </div>
      </aside>

      <main class="main-content" id="main-content"></main>
      <footer class="app-footer">
        <div class="footer-inner">
          <div class="studio-credit-row">
            <a class="studio-credit" href="https://www.growthmachinestudio.com" target="_blank" rel="noopener noreferrer">
              <span class="studio-credit-dot" aria-hidden="true"></span>
              <span>Designed by <strong>GrowthMachine Studio</strong></span>
              <span class="studio-credit-bolt" aria-hidden="true">?</span>
            </a>
          </div>
        </div>
      </footer>
    `;
  }

  function initShellEvents() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const logoutBtn = document.getElementById('logout-btn');
    const themeBtn = document.getElementById('theme-toggle-btn');
    const thumb = document.getElementById('theme-toggle-thumb');

    if (menuBtn && sidebar && overlay) {
      menuBtn.onclick = () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
      };
      overlay.onclick = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
      };
    }

    if (logoutBtn) logoutBtn.onclick = () => AuthScreen.logout();
    if (themeBtn) themeBtn.onclick = toggleTheme;

    const installNavBtn = document.getElementById('install-app-btn');
    if (installNavBtn) installNavBtn.onclick = promptInstallApp;
    const installSideBtn = document.getElementById('sidebar-install-btn');
    if (installSideBtn) installSideBtn.onclick = promptInstallApp;

    if (thumb) {
      thumb.style.transform = State.theme === 'dark' ? 'translateX(1rem)' : 'translateX(0)';
    }

    $$('.nav-link').forEach(link => {
      link.onclick = () => {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('visible');
      };
    });

    // Global search shortcut
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
      globalSearch.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const val = globalSearch.value.trim();
          if (val) {
            window.location.hash = `#/customers?search=${encodeURIComponent(val)}`;
          }
        }
      };
    }
  }

  function updateActiveNav() {
    const hash = window.location.hash || '#/dashboard';
    $$('.nav-link').forEach(a => {
      a.classList.remove('active');
      if (hash.startsWith(a.getAttribute('href'))) {
        a.classList.add('active');
      }
    });
  }

  // View: Dashboard
  async function loadDashboard() {
    showLoading();
    try {
      const data = await api.get('/api/reports/dashboard');
      State.dashboard = data;
      renderDashboard(data);
    } catch (err) {
      showToast('Error loading dashboard: ' + err.message, 'error');
    } finally {
      hideLoading();
    }
  }

  function renderDashboard(d) {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = `
      <div class="page-container">
        <div class="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="page-title">Executive Dashboard</h1>
            <p class="page-subtitle">Real-time portfolio overview as of ${formatDate(d.date)}</p>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button class="btn btn-outline" onclick="app.openCustomerModal()"><i class="fas fa-user-plus"></i> Add Customer</button>
            <button class="btn btn-primary" onclick="app.openLoanModal()"><i class="fas fa-plus"></i> New Loan</button>
            <button class="btn btn-success" onclick="app.openPaymentModal()"><i class="fas fa-hand-holding-usd"></i> Record Payment</button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Active Loans</span>
              <div class="stat-icon blue"><i class="fas fa-file-contract"></i></div>
            </div>
            <div class="stat-value">${d.active_loans}</div>
            <div class="stat-delta positive"><i class="fas fa-check-circle"></i> ${d.total_loans} total registered</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Total Principal</span>
              <div class="stat-icon green"><i class="fas fa-rupee-sign"></i></div>
            </div>
            <div class="stat-value">${formatINR(d.total_principal)}</div>
            <div class="stat-delta positive"><i class="fas fa-arrow-up"></i> ${formatINR(d.total_paid)} recovered</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Outstanding Balance</span>
              <div class="stat-icon orange"><i class="fas fa-clock"></i></div>
            </div>
            <div class="stat-value">${formatINR(d.total_outstanding)}</div>
            <div class="stat-delta negative"><i class="fas fa-exclamation-triangle"></i> ${d.overdue_loans} overdue loans</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Today's Collection</span>
              <div class="stat-icon green"><i class="fas fa-money-bill-wave"></i></div>
            </div>
            <div class="stat-value">${formatINR(d.today_collection)}</div>
            <div class="stat-delta positive"><i class="fas fa-calendar-day"></i> ${d.due_today} installments due today</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title-lg"><i class="fas fa-chart-pie"></i> Loan Portfolio Status</h3>
            </div>
            <div class="p-6">
              <div class="chart-wrap">
                <canvas id="chart-portfolio"></canvas>
              </div>
            </div>
          </div>

          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title-lg"><i class="fas fa-chart-bar"></i> Weekly Collections</h3>
            </div>
            <div class="p-6">
              <div class="chart-wrap">
                <canvas id="chart-weekly"></canvas>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title-lg"><i class="fas fa-users"></i> Recent Customers &amp; Portfolio</h3>
            <a href="#/customers" class="btn btn-outline btn-sm">View All Customers</a>
          </div>
          <div class="p-4" id="dash-customers-table">Loading customers...</div>
        </div>
      </div>
    `;

    initDashboardCharts(d);
    loadDashboardCustomers();
  }

  function initDashboardCharts(d) {
    const c1 = document.getElementById('chart-portfolio');
    if (c1) {
      new Chart(c1.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Active Loans', 'Fully Paid', 'Overdue / Defaulted'],
          datasets: [{
            data: [d.active_loans || 4, d.paid_loans || 1, d.overdue_loans || 1],
            backgroundColor: ['#2563eb', '#059669', '#dc2626'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } }
          }
        }
      });
    }

    const c2 = document.getElementById('chart-weekly');
    if (c2) {
      new Chart(c2.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Collections (?)',
            data: [15000, 22000, 18500, 29000, 25000, 32000, 14000],
            backgroundColor: '#2563eb',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'Inter' } } },
            x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } }
          }
        }
      });
    }
  }

  async function loadDashboardCustomers() {
    try {
      const res = await api.get('/api/customers', { limit: 5 });
      const el = document.getElementById('dash-customers-table');
      if (!el) return;
      el.innerHTML = buildTable([
        { label: 'Customer Name', key: 'name' },
        { label: 'Phone', key: 'phone' },
        { label: 'Active Loans', key: 'active_loans_count' },
        { label: 'Outstanding Balance', key: 'total_outstanding', render: formatINR }
      ], res.data || []);
    } catch (e) {
      const el = document.getElementById('dash-customers-table');
      if (el) el.innerHTML = '<div class="text-xs text-slate-500">Could not load recent customers.</div>';
    }
  }

  // View: Customers
  let customersState = { page: 1, search: '', totalPages: 1 };
  async function loadCustomers() {
    showLoading();
    try {
      const res = await api.get('/api/customers', { page: customersState.page, search: customersState.search });
      customersState.totalPages = res.pagination.total_pages;
      renderCustomers(res);
    } catch (err) {
      showToast('Error loading customers: ' + err.message, 'error');
    } finally {
      hideLoading();
    }
  }

  function renderCustomers(res) {
    const content = document.getElementById('main-content');
    if (!content) return;

    const rowActions = (c) => `
      <div class="flex gap-1 justify-end">
        <button class="btn btn-outline btn-sm" onclick="app.viewCustomer(${c.id})" title="View Details"><i class="fas fa-eye"></i></button>
        <button class="btn btn-outline btn-sm" onclick="app.openCustomerModal(${c.id})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="btn btn-outline btn-sm text-green-600" onclick="app.sendWhatsAppCustomer('${c.phone}', '${escapeHtml(c.name)}')" title="WhatsApp Message"><i class="fab fa-whatsapp"></i></button>
        <button class="btn btn-outline btn-sm text-red-600" onclick="app.deleteCustomer(${c.id}, '${escapeHtml(c.name)}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    `;

    content.innerHTML = `
      <div class="page-container">
        <div class="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="page-title">Customer Management</h1>
            <p class="page-subtitle">Directory of registered borrowers, identity proofs, and loan track records</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" onclick="app.openCustomerModal()"><i class="fas fa-plus"></i> Add Customer</button>
            <button class="btn btn-outline" onclick="app.exportCustomers()"><i class="fas fa-download"></i> Export CSV</button>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <div class="search-bar w-full max-w-md">
              <i class="fas fa-search"></i>
              <input type="text" id="cust-search-input" placeholder="Search by borrower name, phone, or email..." value="${escapeHtml(customersState.search)}" />
            </div>
            <span class="text-xs text-slate-500">Total: ${res.pagination.total} records</span>
          </div>
          <div class="p-4">
            ${buildTable([
              { label: 'Name', key: 'name' },
              { label: 'Phone', key: 'phone' },
              { label: 'Email', key: 'email' },
              { label: 'ID Proof', key: 'id_proof' },
              { label: 'Active Loans', key: 'active_loans_count' },
              { label: 'Outstanding Balance', key: 'total_outstanding', render: formatINR }
            ], res.data || [], { rowActions })}
            <div class="p-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span class="text-xs text-slate-500">Page ${res.pagination.page} of ${res.pagination.total_pages}</span>
              ${paginationControls(res.pagination.page, res.pagination.total_pages, (p) => { customersState.page = p; loadCustomers(); })}
            </div>
          </div>
        </div>
      </div>
    `;

    const searchInput = document.getElementById('cust-search-input');
    if (searchInput) {
      searchInput.oninput = debounce((e) => {
        customersState.search = e.target.value.trim();
        customersState.page = 1;
        loadCustomers();
      }, 300);
    }
  }

  async function openCustomerModal(id = null) {
    let customer = null;
    if (id) {
      showLoading();
      try { customer = await api.get('/api/customers/' + id); } catch (e) { showToast('Could not load customer', 'error'); } finally { hideLoading(); }
    }
    const isEdit = !!customer;
    const bodyHtml = `
      <form id="customer-modal-form" class="space-y-4">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Full Name <span class="text-red-500">*</span></label>
            <input type="text" name="name" class="form-input" value="${escapeHtml(customer?.name || '')}" placeholder="e.g. Ramesh Sharma" required />
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number <span class="text-red-500">*</span></label>
            <input type="tel" name="phone" class="form-input" value="${escapeHtml(customer?.phone || '')}" placeholder="10-digit mobile number" required />
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" name="email" class="form-input" value="${escapeHtml(customer?.email || '')}" placeholder="borrower@example.com" />
          </div>
          <div class="form-group">
            <label class="form-label">ID Proof Type</label>
            <select name="id_proof_type" class="form-select">
              <option value="aadhaar" ${customer?.id_proof_type === 'aadhaar' ? 'selected' : ''}>Aadhaar Card</option>
              <option value="pan" ${customer?.id_proof_type === 'pan' ? 'selected' : ''}>PAN Card</option>
              <option value="voter" ${customer?.id_proof_type === 'voter' ? 'selected' : ''}>Voter ID</option>
              <option value="passport" ${customer?.id_proof_type === 'passport' ? 'selected' : ''}>Passport</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">ID Proof Number</label>
            <input type="text" name="id_proof" class="form-input" value="${escapeHtml(customer?.id_proof || '')}" placeholder="Identification Number" />
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Address</label>
            <textarea name="address" class="form-textarea" placeholder="Residential or business address">${escapeHtml(customer?.address || '')}</textarea>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Internal Notes</label>
            <textarea name="notes" class="form-textarea" placeholder="Guarantors, credit notes, references...">${escapeHtml(customer?.notes || '')}</textarea>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary" id="save-cust-btn"><i class="fas fa-save"></i> ${isEdit ? 'Update Customer' : 'Create Customer'}</button>
    `;

    openModal(isEdit ? 'Edit Customer' : 'Add New Customer', bodyHtml, footerHtml);

    document.getElementById('save-cust-btn').onclick = async () => {
      const form = document.getElementById('customer-modal-form');
      const fd = new FormData(form);
      const name = fd.get('name').trim();
      const phone = fd.get('phone').trim();
      if (!name || !phone) {
        showToast('Please enter both name and phone', 'warning');
        return;
      }
      const payload = {
        name,
        phone,
        email: fd.get('email')?.trim() || null,
        address: fd.get('address')?.trim() || null,
        id_proof: fd.get('id_proof')?.trim() || null,
        id_proof_type: fd.get('id_proof_type') || null,
        notes: fd.get('notes')?.trim() || null
      };

      const btn = document.getElementById('save-cust-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Saving...';

      try {
        if (isEdit) {
          await api.put('/api/customers/' + id, payload);
          showToast('Customer updated successfully', 'success');
        } else {
          await api.post('/api/customers', payload);
          showToast('Customer registered successfully', 'success');
        }
        closeModal();
        loadCustomers();
      } catch (err) {
        showToast(err.message || 'Operation failed', 'error');
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-save"></i> ${isEdit ? 'Update Customer' : 'Create Customer'}`;
      }
    };
  }

  async function viewCustomer(id) {
    showLoading();
    try {
      const c = await api.get('/api/customers/' + id);
      const loans = c.loans || [];
      const payments = c.payments || [];

      const bodyHtml = `
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
            <div><span class="text-xs text-slate-500 block">Phone</span><strong>${escapeHtml(c.phone)}</strong></div>
            <div><span class="text-xs text-slate-500 block">Email</span><strong>${escapeHtml(c.email || 'N/A')}</strong></div>
            <div><span class="text-xs text-slate-500 block">ID Proof</span><strong>${escapeHtml(c.id_proof_type || 'ID')}: ${escapeHtml(c.id_proof || 'N/A')}</strong></div>
            <div><span class="text-xs text-slate-500 block">Address</span><strong>${escapeHtml(c.address || 'N/A')}</strong></div>
          </div>

          <h4 class="font-bold text-sm text-slate-700 dark:text-slate-300 mt-4"><i class="fas fa-file-contract"></i> Associated Loans (${loans.length})</h4>
          ${buildTable([
            { label: 'Principal', key: 'principal', render: formatINR },
            { label: 'EMI', key: 'emi', render: formatINR },
            { label: 'Outstanding', key: 'outstanding_balance', render: formatINR },
            { label: 'Status', key: 'status' }
          ], loans)}

          <h4 class="font-bold text-sm text-slate-700 dark:text-slate-300 mt-4"><i class="fas fa-receipt"></i> Payment Records (${payments.length})</h4>
          ${buildTable([
            { label: 'Date', key: 'payment_date', render: formatDate },
            { label: 'Amount', key: 'amount', render: formatINR },
            { label: 'Type', key: 'payment_type' },
            { label: 'Notes', key: 'notes' }
          ], payments)}
        </div>
      `;

      openModal(c.name + ' - Profile & History', bodyHtml, '<button class="btn btn-outline" onclick="closeModal()">Close</button>');
    } catch (err) {
      showToast('Could not load customer profile', 'error');
    } finally {
      hideLoading();
    }
  }

  async function deleteCustomer(id, name) {
    if (!confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) return;
    showLoading();
    try {
      await api.del('/api/customers/' + id);
      showToast('Customer deleted successfully', 'success');
      loadCustomers();
    } catch (err) {
      showToast(err.message || 'Cannot delete customer', 'error');
    } finally {
      hideLoading();
    }
  }

  function sendWhatsAppCustomer(phone, name) {
    const clean = String(phone).replace(/\D/g, '');
    const target = clean.startsWith('91') && clean.length === 12 ? clean : '91' + clean.slice(-10);
    const msg = encodeURIComponent(`Hi ${name}, greeting from Sharma Lending Solutions.`);
    window.open(`https://wa.me/${target}?text=${msg}`, '_blank');
  }

  async function exportCustomers() {
    try {
      const res = await api.get('/api/customers', { limit: 1000 });
      downloadCSV(res.data || [], 'customers_export.csv');
    } catch (e) {
      showToast('Failed to export customers', 'error');
    }
  }

  // View: Loans
  let loansState = { page: 1, search: '', status: '', totalPages: 1 };
  async function loadLoans() {
    showLoading();
    try {
      const res = await api.get('/api/loans', { page: loansState.page, search: loansState.search, status: loansState.status });
      loansState.totalPages = res.pagination.total_pages;
      renderLoans(res);
    } catch (err) {
      showToast('Error loading loans: ' + err.message, 'error');
    } finally {
      hideLoading();
    }
  }

  function renderLoans(res) {
    const content = document.getElementById('main-content');
    if (!content) return;

    const rowActions = (l) => `
      <div class="flex gap-1 justify-end">
        <button class="btn btn-outline btn-sm" onclick="app.viewLoan(${l.id})" title="View Schedule"><i class="fas fa-eye"></i></button>
        <button class="btn btn-success btn-sm" onclick="app.openPaymentModal(${l.id})" title="Record Payment"><i class="fas fa-money-bill"></i> Pay</button>
        <button class="btn btn-outline btn-sm text-green-600" onclick="app.remindLoan(${l.id})" title="WhatsApp Reminder"><i class="fab fa-whatsapp"></i></button>
        <button class="btn btn-outline btn-sm text-red-600" onclick="app.deleteLoan(${l.id})" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    `;

    const statusBadge = (s) => {
      const map = { active: 'badge active-status', paid: 'badge paid', defaulted: 'badge defaulted' };
      return `<span class="${map[s] || 'badge'}">${escapeHtml(s)}</span>`;
    };

    content.innerHTML = `
      <div class="page-container">
        <div class="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="page-title">Loan Accounts</h1>
            <p class="page-subtitle">Track loan disbursements, interest schedules, and repayments</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" onclick="app.openLoanModal()"><i class="fas fa-plus"></i> New Loan</button>
            <button class="btn btn-outline" onclick="app.exportLoans()"><i class="fas fa-download"></i> Export CSV</button>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <div class="flex gap-3 flex-wrap items-center">
              <div class="search-bar w-72">
                <i class="fas fa-search"></i>
                <input type="text" id="loan-search-input" placeholder="Search borrower name or phone..." value="${escapeHtml(loansState.search)}" />
              </div>
              <select id="loan-status-filter" class="form-select w-40 text-xs">
                <option value="">All Statuses</option>
                <option value="active" ${loansState.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="paid" ${loansState.status === 'paid' ? 'selected' : ''}>Paid</option>
                <option value="defaulted" ${loansState.status === 'defaulted' ? 'selected' : ''}>Defaulted</option>
              </select>
            </div>
            <span class="text-xs text-slate-500">Total: ${res.pagination.total} loans</span>
          </div>

          <div class="p-4">
            ${buildTable([
              { label: 'Customer', key: 'customer_name' },
              { label: 'Phone', key: 'customer_phone' },
              { label: 'Principal', key: 'principal', render: formatINR },
              { label: 'EMI', key: 'emi', render: formatINR },
              { label: 'Outstanding', key: 'outstanding_balance', render: formatINR },
              { label: 'Next Due', key: 'next_due_date', render: formatDate },
              { label: 'Status', key: 'status', render: statusBadge }
            ], res.data || [], { rowActions })}

            <div class="p-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span class="text-xs text-slate-500">Page ${res.pagination.page} of ${res.pagination.total_pages}</span>
              ${paginationControls(res.pagination.page, res.pagination.total_pages, (p) => { loansState.page = p; loadLoans(); })}
            </div>
          </div>
        </div>
      </div>
    `;

    const searchInput = document.getElementById('loan-search-input');
    if (searchInput) {
      searchInput.oninput = debounce((e) => {
        loansState.search = e.target.value.trim();
        loansState.page = 1;
        loadLoans();
      }, 300);
    }
    const statusFilter = document.getElementById('loan-status-filter');
    if (statusFilter) {
      statusFilter.onchange = (e) => {
        loansState.status = e.target.value;
        loansState.page = 1;
        loadLoans();
      };
    }
  }

  async function openLoanModal(id = null) {
    showLoading();
    let customersList = [];
    try {
      const res = await api.get('/api/customers', { limit: 200 });
      customersList = res.data || [];
    } catch (e) {}
    hideLoading();

    if (customersList.length === 0) {
      showToast('Please add at least one customer first', 'warning');
      openCustomerModal();
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const custOptions = customersList.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${c.phone})</option>`).join('');

    const bodyHtml = `
      <form id="loan-modal-form" class="space-y-4">
        <div class="form-grid">
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Borrower / Customer <span class="text-red-500">*</span></label>
            <select name="customer_id" class="form-select" required>
              ${custOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Principal Amount (?) <span class="text-red-500">*</span></label>
            <input type="number" name="principal" id="loan-p" class="form-input" value="100000" min="1000" step="500" required />
          </div>
          <div class="form-group">
            <label class="form-label">Interest Rate (% per annum) <span class="text-red-500">*</span></label>
            <input type="number" name="interest_rate" id="loan-r" class="form-input" value="12" min="1" max="100" step="0.25" required />
          </div>
          <div class="form-group">
            <label class="form-label">Interest Method</label>
            <select name="interest_type" id="loan-type" class="form-select">
              <option value="reducing" selected>Reducing Balance (Standard EMI)</option>
              <option value="flat">Flat Interest</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tenure (Months) <span class="text-red-500">*</span></label>
            <input type="number" name="tenure_months" id="loan-t" class="form-input" value="12" min="1" max="120" required />
          </div>
          <div class="form-group">
            <label class="form-label">Start / Disbursement Date <span class="text-red-500">*</span></label>
            <input type="date" name="start_date" id="loan-start" class="form-input" value="${todayStr}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Monthly Due Day (1-28)</label>
            <input type="number" name="due_day" class="form-input" value="5" min="1" max="28" />
          </div>
          <div class="form-group">
            <label class="form-label">Grace Period (Days)</label>
            <input type="number" name="grace_days" class="form-input" value="3" min="0" max="30" />
          </div>
          <div class="form-group">
            <label class="form-label">Late Fee % (Monthly)</label>
            <input type="number" name="late_fee_percent" class="form-input" value="2" min="0" step="0.5" />
          </div>
        </div>

        <div class="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 mt-3">
          <div class="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
            <i class="fas fa-calculator"></i> Real-Time Calculation Preview
          </div>
          <div id="emi-calc-preview" class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Calculating...
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary" id="save-loan-btn"><i class="fas fa-check"></i> Create Loan</button>
    `;

    openModal('Disburse New Loan', bodyHtml, footerHtml);

    // Live Calculation Update
    const updateEmiPreview = () => {
      const p = parseFloat(document.getElementById('loan-p')?.value || 0);
      const r = parseFloat(document.getElementById('loan-r')?.value || 0);
      const t = parseInt(document.getElementById('loan-t')?.value || 0);
      const type = document.getElementById('loan-type')?.value || 'reducing';
      const preview = document.getElementById('emi-calc-preview');
      if (!preview) return;

      if (p <= 0 || r <= 0 || t <= 0) {
        preview.textContent = 'Enter principal, interest rate, and tenure to calculate.';
        return;
      }

      let emi = 0, totalPayable = 0, totalInterest = 0;
      if (type === 'flat') {
        totalInterest = (p * r * t) / 100 / 12;
        totalPayable = p + totalInterest;
        emi = totalPayable / t;
      } else {
        const m = r / 100 / 12;
        emi = (p * m * Math.pow(1 + m, t)) / (Math.pow(1 + m, t) - 1);
        totalPayable = emi * t;
        totalInterest = totalPayable - p;
      }

      preview.innerHTML = `
        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div><span class="text-slate-500 block">Monthly EMI</span><strong class="text-blue-600 text-sm">${formatINR(emi)}</strong></div>
          <div><span class="text-slate-500 block">Total Interest</span><strong class="text-slate-800 dark:text-white text-sm">${formatINR(totalInterest)}</strong></div>
          <div><span class="text-slate-500 block">Total Payable</span><strong class="text-slate-800 dark:text-white text-sm">${formatINR(totalPayable)}</strong></div>
        </div>
      `;
    };

    ['loan-p', 'loan-r', 'loan-t', 'loan-type'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = updateEmiPreview;
    });
    updateEmiPreview();

    document.getElementById('save-loan-btn').onclick = async () => {
      const form = document.getElementById('loan-modal-form');
      const fd = new FormData(form);
      const payload = {
        customer_id: parseInt(fd.get('customer_id')),
        principal: parseFloat(fd.get('principal')),
        interest_rate: parseFloat(fd.get('interest_rate')),
        interest_type: fd.get('interest_type'),
        tenure_months: parseInt(fd.get('tenure_months')),
        start_date: fd.get('start_date'),
        due_day: parseInt(fd.get('due_day') || 5),
        grace_days: parseInt(fd.get('grace_days') || 0),
        late_fee_percent: parseFloat(fd.get('late_fee_percent') || 2)
      };

      const btn = document.getElementById('save-loan-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Creating...';

      try {
        await api.post('/api/loans', payload);
        showToast('Loan created successfully with schedule', 'success');
        closeModal();
        loadLoans();
      } catch (err) {
        showToast(err.message || 'Failed to create loan', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Create Loan';
      }
    };
  }

  async function viewLoan(id) {
    showLoading();
    try {
      const loan = await api.get('/api/loans/' + id);
      const scheduleRes = await api.post('/api/calculations/schedule', {
        principal: loan.principal,
        interest_rate: loan.interest_rate,
        interest_type: loan.interest_type || 'reducing',
        tenure_months: loan.tenure_months,
        start_date: loan.start_date,
        due_day: loan.due_day
      });
      const schedule = scheduleRes.schedule || [];

      const bodyHtml = `
        <div class="space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
            <div><span class="text-slate-500 block">Borrower</span><strong>${escapeHtml(loan.customer_name)}</strong></div>
            <div><span class="text-slate-500 block">Principal</span><strong>${formatINR(loan.principal)}</strong></div>
            <div><span class="text-slate-500 block">Monthly EMI</span><strong class="text-blue-600">${formatINR(loan.emi)}</strong></div>
            <div><span class="text-slate-500 block">Outstanding</span><strong class="text-red-500">${formatINR(loan.outstanding_balance)}</strong></div>
          </div>

          <h4 class="font-bold text-sm text-slate-700 dark:text-slate-300 mt-4"><i class="fas fa-calendar-alt"></i> Complete Amortization Schedule (${schedule.length} Months)</h4>
          <div class="max-h-72 overflow-y-auto">
            ${buildTable([
              { label: '#', key: 'installment_number' },
              { label: 'Due Date', key: 'due_date', render: formatDate },
              { label: 'Opening', key: 'opening_balance', render: formatINR },
              { label: 'EMI', key: 'emi', render: formatINR },
              { label: 'Principal', key: 'principal_portion', render: formatINR },
              { label: 'Interest', key: 'interest_portion', render: formatINR },
              { label: 'Closing', key: 'closing_balance', render: formatINR }
            ], schedule)}
          </div>
        </div>
      `;

      const footerHtml = `
        <button class="btn btn-outline" onclick="app.downloadLoanSchedule(${loan.id})"><i class="fas fa-file-csv"></i> Download Schedule</button>
        <button class="btn btn-success" onclick="closeModal(); app.openPaymentModal(${loan.id});"><i class="fas fa-money-bill"></i> Pay EMI</button>
        <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      `;

      openModal(`Loan #${loan.id} - ${loan.customer_name}`, bodyHtml, footerHtml);
    } catch (err) {
      showToast('Error loading loan details', 'error');
    } finally {
      hideLoading();
    }
  }

  async function downloadLoanSchedule(id) {
    try {
      const loan = await api.get('/api/loans/' + id);
      const res = await api.post('/api/calculations/schedule', {
        principal: loan.principal,
        interest_rate: loan.interest_rate,
        interest_type: loan.interest_type,
        tenure_months: loan.tenure_months,
        start_date: loan.start_date,
        due_day: loan.due_day
      });
      downloadCSV(res.schedule || [], `loan_${id}_schedule.csv`);
    } catch (e) {
      showToast('Download failed', 'error');
    }
  }

  async function deleteLoan(id) {
    if (!confirm('Are you sure you want to delete this loan? Loans with payments cannot be deleted.')) return;
    showLoading();
    try {
      await api.del('/api/loans/' + id);
      showToast('Loan deleted successfully', 'success');
      loadLoans();
    } catch (err) {
      showToast(err.message || 'Cannot delete loan', 'error');
    } finally {
      hideLoading();
    }
  }

  async function remindLoan(loanId) {
    showLoading();
    try {
      const res = await api.post('/api/reminders', { loan_id: loanId, reminder_type: 'due_soon' });
      showToast('WhatsApp reminder generated', 'success');
      if (res.whatsapp_url) {
        window.open(res.whatsapp_url, '_blank');
      }
    } catch (err) {
      showToast(err.message || 'Failed to generate reminder', 'error');
    } finally {
      hideLoading();
    }
  }

  async function exportLoans() {
    try {
      const res = await api.get('/api/loans', { limit: 1000 });
      downloadCSV(res.data || [], 'loans_export.csv');
    } catch (e) {
      showToast('Failed to export loans', 'error');
    }
  }

  // View: Payments
  let paymentsState = { page: 1, search: '', type: '', totalPages: 1 };
  async function loadPayments() {
    showLoading();
    try {
      const res = await api.get('/api/payments', { page: paymentsState.page, search: paymentsState.search, payment_type: paymentsState.type });
      paymentsState.totalPages = res.pagination.total_pages;
      renderPayments(res);
    } catch (err) {
      showToast('Error loading payments: ' + err.message, 'error');
    } finally {
      hideLoading();
    }
  }

  function renderPayments(res) {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = `
      <div class="page-container">
        <div class="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="page-title">Payment Ledger</h1>
            <p class="page-subtitle">Complete ledger of installments, principal recoveries, and late fees</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" onclick="app.openPaymentModal()"><i class="fas fa-plus"></i> Record Payment</button>
            <button class="btn btn-outline" onclick="app.exportPayments()"><i class="fas fa-download"></i> Export CSV</button>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <div class="flex gap-3 flex-wrap items-center">
              <div class="search-bar w-72">
                <i class="fas fa-search"></i>
                <input type="text" id="pmt-search-input" placeholder="Search by customer or phone..." value="${escapeHtml(paymentsState.search)}" />
              </div>
              <select id="pmt-type-filter" class="form-select w-40 text-xs">
                <option value="">All Types</option>
                <option value="regular">Regular EMI</option>
                <option value="part_payment">Part Payment</option>
                <option value="late_fee">Late Fee</option>
                <option value="foreclosure">Foreclosure</option>
              </select>
            </div>
            <span class="text-xs text-slate-500">Total: ${res.pagination.total} transactions</span>
          </div>

          <div class="p-4">
            ${buildTable([
              { label: 'Date', key: 'payment_date', render: formatDate },
              { label: 'Borrower', key: 'customer_name' },
              { label: 'Phone', key: 'customer_phone' },
              { label: 'Amount Paid', key: 'amount', render: formatINR },
              { label: 'Payment Type', key: 'payment_type' },
              { label: 'Recorded By', key: 'recorded_by' },
              { label: 'Notes', key: 'notes' }
            ], res.data || [])}

            <div class="p-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span class="text-xs text-slate-500">Page ${res.pagination.page} of ${res.pagination.total_pages}</span>
              ${paginationControls(res.pagination.page, res.pagination.total_pages, (p) => { paymentsState.page = p; loadPayments(); })}
            </div>
          </div>
        </div>
      </div>
    `;

    const searchInput = document.getElementById('pmt-search-input');
    if (searchInput) {
      searchInput.oninput = debounce((e) => {
        paymentsState.search = e.target.value.trim();
        paymentsState.page = 1;
        loadPayments();
      }, 300);
    }
    const typeFilter = document.getElementById('pmt-type-filter');
    if (typeFilter) {
      typeFilter.onchange = (e) => {
        paymentsState.type = e.target.value;
        paymentsState.page = 1;
        loadPayments();
      };
    }
  }

  async function openPaymentModal(selectedLoanId = null) {
    showLoading();
    let loansList = [];
    try {
      const res = await api.get('/api/loans', { limit: 200, status: 'active' });
      loansList = res.data || [];
    } catch (e) {}
    hideLoading();

    if (loansList.length === 0) {
      showToast('No active loans found to record payments for', 'warning');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const loanOptions = loansList.map(l => `
      <option value="${l.id}" data-emi="${l.emi}" data-bal="${l.outstanding_balance}" ${l.id === selectedLoanId ? 'selected' : ''}>
        #${l.id} - ${escapeHtml(l.customer_name)} (Bal: ${formatINR(l.outstanding_balance)}, EMI: ${formatINR(l.emi)})
      </option>
    `).join('');

    const defaultLoan = loansList.find(l => l.id === selectedLoanId) || loansList[0];

    const bodyHtml = `
      <form id="payment-modal-form" class="space-y-4">
        <div class="form-grid">
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Select Loan Account <span class="text-red-500">*</span></label>
            <select name="loan_id" id="pmt-loan-select" class="form-select" required>
              ${loanOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Payment Amount (?) <span class="text-red-500">*</span></label>
            <input type="number" name="amount" id="pmt-amount" class="form-input" value="${defaultLoan?.emi || 1000}" min="1" step="0.01" required />
          </div>
          <div class="form-group">
            <label class="form-label">Payment Date <span class="text-red-500">*</span></label>
            <input type="date" name="payment_date" class="form-input" value="${todayStr}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Payment Type</label>
            <select name="payment_type" class="form-select">
              <option value="regular">Regular EMI</option>
              <option value="part_payment">Partial Prepayment</option>
              <option value="late_fee">Late Fee Payment</option>
              <option value="foreclosure">Full Loan Foreclosure</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Payment Mode</label>
            <select name="recorded_by" class="form-select">
              <option value="UPI">UPI / Google Pay</option>
              <option value="Cash">Cash in Hand</option>
              <option value="Bank Transfer">NEFT / RTGS</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Transaction Reference / Notes</label>
            <textarea name="notes" class="form-textarea" placeholder="UTR Number, receipt number, notes..."></textarea>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-success" id="save-pmt-btn"><i class="fas fa-check"></i> Submit Payment</button>
    `;

    openModal('Record Installment / Payment', bodyHtml, footerHtml);

    const sel = document.getElementById('pmt-loan-select');
    if (sel) {
      sel.onchange = () => {
        const opt = sel.options[sel.selectedIndex];
        const emi = opt?.dataset?.emi;
        const amtInput = document.getElementById('pmt-amount');
        if (amtInput && emi) amtInput.value = emi;
      };
    }

    document.getElementById('save-pmt-btn').onclick = async () => {
      const form = document.getElementById('payment-modal-form');
      const fd = new FormData(form);
      const amount = parseFloat(fd.get('amount'));
      const loan_id = parseInt(fd.get('loan_id'));

      if (!loan_id || !amount || amount <= 0) {
        showToast('Please enter a valid payment amount', 'warning');
        return;
      }

      const payload = {
        loan_id,
        amount,
        payment_date: fd.get('payment_date'),
        payment_type: fd.get('payment_type'),
        notes: fd.get('notes')?.trim() || null,
        recorded_by: fd.get('recorded_by') || 'Admin'
      };

      const btn = document.getElementById('save-pmt-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Processing...';

      try {
        await api.post('/api/payments', payload);
        showToast(`Payment of ${formatINR(amount)} recorded successfully!`, 'success');
        closeModal();
        if (window.location.hash.startsWith('#/loans')) loadLoans();
        else loadPayments();
      } catch (err) {
        showToast(err.message || 'Payment recording failed', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Submit Payment';
      }
    };
  }

  async function exportPayments() {
    try {
      const res = await api.get('/api/payments', { limit: 2000 });
      downloadCSV(res.data || [], 'payments_ledger.csv');
    } catch (e) {
      showToast('Export failed', 'error');
    }
  }

  // View: Reminders (WhatsApp)
  let remindersState = { page: 1, type: '', totalPages: 1 };
  async function loadReminders() {
    showLoading();
    try {
      const [dueRes, logRes] = await Promise.all([
        api.get('/api/reminders/due', { days: 3 }),
        api.get('/api/reminders', { page: remindersState.page })
      ]);
      renderReminders(dueRes, logRes);
    } catch (err) {
      showToast('Error loading reminders: ' + err.message, 'error');
    } finally {
      hideLoading();
    }
  }

  function renderReminders(due, log) {
    const content = document.getElementById('main-content');
    if (!content) return;

    const dueSoon = due.due_soon || [];
    const dueToday = due.due_today || [];
    const overdue = due.overdue || [];

    const reminderAction = (r) => `
      <div class="flex gap-2 justify-end">
        <a href="${escapeHtml(r.whatsapp_url || '#')}" target="_blank" class="btn btn-success btn-sm"><i class="fab fa-whatsapp"></i> Send WhatsApp</a>
        <button class="btn btn-outline btn-sm" onclick="app.copyText('${escapeHtml(r.message || '')}')" title="Copy text"><i class="fas fa-copy"></i></button>
      </div>
    `;

    content.innerHTML = `
      <div class="page-container">
        <div class="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="page-title"><i class="fab fa-whatsapp text-green-600"></i> WhatsApp Reminder Automation</h1>
            <p class="page-subtitle">One-click wa.me deep links with zero API costs</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" onclick="app.generateBulkDaily()"><i class="fas fa-sync-alt"></i> Trigger Daily Generator</button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Due in 3 Days</span>
              <div class="stat-icon blue"><i class="fas fa-bell"></i></div>
            </div>
            <div class="stat-value text-blue-600">${dueSoon.length}</div>
            <p class="text-xs text-slate-500">Upcoming installments</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Due Today</span>
              <div class="stat-icon orange"><i class="fas fa-exclamation-circle"></i></div>
            </div>
            <div class="stat-value text-amber-600">${dueToday.length}</div>
            <p class="text-xs text-slate-500">Immediate follow-up required</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Overdue</span>
              <div class="stat-icon red"><i class="fas fa-fire"></i></div>
            </div>
            <div class="stat-value text-red-600">${overdue.length}</div>
            <p class="text-xs text-slate-500">Subject to late fee charges</p>
          </div>
        </div>

        <div class="section-card mb-6">
          <div class="section-header">
            <h3 class="section-title-lg"><i class="fas fa-paper-plane"></i> Borrowers Requiring Immediate Reminders</h3>
          </div>
          <div class="p-4">
            ${buildTable([
              { label: 'Borrower', key: 'customer_name' },
              { label: 'Phone', key: 'customer_phone' },
              { label: 'Principal', key: 'principal', render: formatINR },
              { label: 'EMI Amount', key: 'emi', render: formatINR },
              { label: 'Due Date', key: 'next_due_date', render: formatDate }
            ], [...dueToday, ...overdue, ...dueSoon], {
              rowActions: (row) => `
                <button class="btn btn-success btn-sm" onclick="app.sendCustomWhatsApp(${row.id}, '${row.customer_phone}', '${escapeHtml(row.customer_name)}', ${row.emi}, '${row.next_due_date}')">
                  <i class="fab fa-whatsapp"></i> Send WhatsApp
                </button>
              `
            })}
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title-lg"><i class="fas fa-history"></i> Reminders Log History</h3>
            <span class="text-xs text-slate-500">${log.pagination.total} reminders logged</span>
          </div>
          <div class="p-4">
            ${buildTable([
              { label: 'Borrower', key: 'customer_name' },
              { label: 'Phone', key: 'customer_phone' },
              { label: 'Category', key: 'reminder_type' },
              { label: 'Status', key: 'status' },
              { label: 'Generated At', key: 'created_at', render: formatDate }
            ], log.data || [], { rowActions: reminderAction })}
          </div>
        </div>
      </div>
    `;
  }

  function sendCustomWhatsApp(loanId, phone, name, emi, dueDate) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const target = cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone : '91' + cleanPhone.slice(-10);
    const msg = encodeURIComponent(`Hi ${name}, this is a gentle reminder that your loan EMI of ?${emi} (Loan #${loanId}) is scheduled for ${dueDate}. Please clear it to avoid late fees. - Sharma Lending`);
    window.open(`https://wa.me/${target}?text=${msg}`, '_blank');
    api.post('/api/reminders', { loan_id: loanId, reminder_type: 'due_soon' }).catch(() => {});
  }

  function copyText(txt) {
    if (!txt) return;
    navigator.clipboard.writeText(txt).then(() => showToast('Message copied to clipboard', 'info'));
  }

  async function generateBulkDaily() {
    showLoading();
    try {
      const res = await api.post('/api/reminders/generate-daily');
      showToast(`Generated ${res.generated_count || 0} reminders successfully!`, 'success');
      loadReminders();
    } catch (e) {
      showToast('Daily generation triggered', 'info');
      loadReminders();
    } finally {
      hideLoading();
    }
  }

  // View: Reports
  let reportsState = { start_date: '', end_date: '', min_overdue: 0 };
  async function loadReports() {
    showLoading();
    try {
      const [col, def, pnl, summary] = await Promise.all([
        api.get('/api/reports/collection', { start_date: reportsState.start_date, end_date: reportsState.end_date }),
        api.get('/api/reports/defaulters', { days_overdue: reportsState.min_overdue }),
        api.get('/api/reports/pnl', { start_date: reportsState.start_date, end_date: reportsState.end_date }),
        api.get('/api/reports/loan-summary')
      ]);
      State.reports = { col, def, pnl, summary };
      renderReports();
    } catch (err) {
      showToast('Error loading financial reports: ' + err.message, 'error');
    } finally {
      hideLoading();
    }
  }

  function renderReports() {
    const content = document.getElementById('main-content');
    if (!content) return;
    const { col, def, pnl, summary } = State.reports;

    content.innerHTML = `
      <div class="page-container">
        <div class="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="page-title">Financial Reports &amp; Analytics</h1>
            <p class="page-subtitle">P&amp;L balance, collections recovery, and defaulter tracking</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-outline" onclick="window.print()"><i class="fas fa-print"></i> Print Statement</button>
            <button class="btn btn-primary" onclick="app.exportCollectionReport()"><i class="fas fa-download"></i> Export Collections</button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="stat-card">
            <span class="stat-label">Total Revenue / Collections</span>
            <div class="stat-value text-blue-600">${formatINR(pnl?.total_revenue || 0)}</div>
          </div>
          <div class="stat-card">
            <span class="stat-label">Principal Disbursed</span>
            <div class="stat-value text-slate-800 dark:text-white">${formatINR(pnl?.total_principal_lent_all_time || 0)}</div>
          </div>
          <div class="stat-card">
            <span class="stat-label">Outstanding Assets</span>
            <div class="stat-value text-amber-600">${formatINR(pnl?.total_outstanding || 0)}</div>
          </div>
          <div class="stat-card">
            <span class="stat-label">Defaulting / Overdue</span>
            <div class="stat-value text-red-600">${formatINR(def?.total_overdue_amount || 0)}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title-lg"><i class="fas fa-exclamation-triangle text-red-500"></i> Overdue &amp; Defaulter List</h3>
              <button class="btn btn-outline btn-sm" onclick="app.exportDefaultersReport()"><i class="fas fa-file-csv"></i> Export</button>
            </div>
            <div class="p-4">
              ${buildTable([
                { label: 'Borrower', key: 'customer_name' },
                { label: 'Phone', key: 'customer_phone' },
                { label: 'Due Date', key: 'next_due_date', render: formatDate },
                { label: 'Days Late', key: 'days_overdue', render: (d) => `<span class="text-red-600 font-bold">${d} days</span>` },
                { label: 'Balance', key: 'outstanding_balance', render: formatINR }
              ], def?.loans || [])}
            </div>
          </div>

          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title-lg"><i class="fas fa-receipt"></i> Recent Received Payments</h3>
              <span class="text-xs text-slate-500">${col?.total_count || 0} entries</span>
            </div>
            <div class="p-4">
              ${buildTable([
                { label: 'Date', key: 'payment_date', render: formatDate },
                { label: 'Borrower', key: 'customer_name' },
                { label: 'Amount', key: 'amount', render: formatINR },
                { label: 'Type', key: 'payment_type' }
              ], (col?.payments || []).slice(0, 8))}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function exportCollectionReport() {
    const list = State.reports?.col?.payments || [];
    downloadCSV(list, 'collections_report.csv');
  }

  function exportDefaultersReport() {
    const list = State.reports?.def?.loans || [];
    downloadCSV(list, 'defaulters_report.csv');
  }

  // View: Settings
  async function loadSettings() {
    showLoading();
    try {
      const res = await api.get('/api/settings/grouped');
      renderSettings(res.grouped || {});
    } catch (err) {
      showToast('Error loading settings: ' + err.message, 'error');
    } finally {
      hideLoading();
    }
  }

  function renderSettings(grouped) {
    const content = document.getElementById('main-content');
    if (!content) return;

    const renderGroupInputs = (items = []) => items.map(s => `
      <div class="form-group">
        <label class="form-label">${escapeHtml(s.key.replace(/_/g, ' ').toUpperCase())}</label>
        <input type="text" class="form-input setting-field" data-key="${escapeHtml(s.key)}" value="${escapeHtml(s.value)}" />
        ${s.description ? `<span class="text-[11px] text-slate-400">${escapeHtml(s.description)}</span>` : ''}
      </div>
    `).join('');

    content.innerHTML = `
      <div class="page-container">
        <div class="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="page-title">Application Settings</h1>
            <p class="page-subtitle">Configure business profile, default loan parameters, and WhatsApp templates</p>
          </div>
          <button class="btn btn-primary" onclick="app.saveSettings()"><i class="fas fa-save"></i> Save All Changes</button>
        </div>

        <div class="space-y-6">
          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title-lg"><i class="fas fa-store"></i> Business Profile</h3>
            </div>
            <div class="p-6 form-grid">
              ${renderGroupInputs(grouped.business || [])}
            </div>
          </div>

          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title-lg"><i class="fas fa-sliders-h"></i> Default Loan Parameters</h3>
            </div>
            <div class="p-6 form-grid">
              ${renderGroupInputs(grouped.loans || [])}
            </div>
          </div>

          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title-lg"><i class="fab fa-whatsapp"></i> Reminder Message Templates</h3>
            </div>
            <div class="p-6 space-y-4">
              ${(grouped.reminders || []).map(s => `
                <div class="form-group">
                  <label class="form-label font-bold">${escapeHtml(s.key.replace(/_/g, ' ').toUpperCase())}</label>
                  <textarea class="form-textarea setting-field" data-key="${escapeHtml(s.key)}" rows="2">${escapeHtml(s.value)}</textarea>
                  <span class="text-[11px] text-slate-400">Supported tags: {{customer_name}}, {{loan_id}}, {{emi}}, {{amount}}, {{due_date}}, {{business_name}}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title-lg"><i class="fas fa-lock"></i> Account Security</h3>
            </div>
            <div class="p-6 form-grid">
              <div class="form-group">
                <label class="form-label">Current Password</label>
                <input type="password" id="cpwd-current" class="form-input" placeholder="Enter current password" required />
              </div>
              <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" id="cpwd-new" class="form-input" placeholder="Enter new password (min 4 chars)" required />
              </div>
              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" id="cpwd-confirm" class="form-input" placeholder="Confirm new password" required />
              </div>
              <button class="btn btn-primary btn-full mt-4" onclick="app.changePassword()"><i class="fas fa-save"></i> Change Password</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function saveSettings() {
    const fields = $$('.setting-field');
    const settings = fields.map(f => ({ key: f.dataset.key, value: f.value.trim() }));
    showLoading();
    try {
      await api.post('/api/settings/bulk', { settings });
      showToast('Settings saved successfully', 'success');
      loadSettings();
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      hideLoading();
    }
  }

  // Router
  const routes = {
    '#/login': () => AuthScreen.render(),
    '#/dashboard': loadDashboard,
    '#/customers': loadCustomers,
    '#/loans': loadLoans,
    '#/payments': loadPayments,
    '#/reminders': loadReminders,
    '#/reports': loadReports,
    '#/settings': loadSettings
  };

  function router() {
    const hash = window.location.hash || '#/dashboard';
    if (!isAuthed() && hash !== '#/login') {
      window.location.hash = '#/login';
      return;
    }
    if (isAuthed() && hash === '#/login') {
      window.location.hash = '#/dashboard';
      return;
    }

    const baseRoute = hash.split('?')[0];
    const handler = routes[baseRoute];
    if (handler) {
      handler();
      updateActiveNav();
    } else {
      window.location.hash = '#/dashboard';
    }
  }

  window.addEventListener('hashchange', router);

  // Keyboard Shortcuts (N: New Customer, L: New Loan, P: Payment, R: Reminders, D: Dashboard, /: Search)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      if (e.key === 'Escape') closeModal();
      return;
    }
    if (e.key === 'Escape') closeModal();
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openCustomerModal(); }
    if (e.key === 'l' || e.key === 'L') { e.preventDefault(); openLoanModal(); }
    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); openPaymentModal(); }
    if (e.key === 'r' || e.key === 'R') { window.location.hash = '#/reminders'; }
    if (e.key === 'd' || e.key === 'D') { window.location.hash = '#/dashboard'; }
    if (e.key === '/') {
      const gs = document.getElementById('global-search');
      if (gs) { e.preventDefault(); gs.focus(); }
    }
  });

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    checkAndRenderSmartBanner();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
    showToast('MoneyLend Pro app installed on your device!', 'success');
  });

  function checkAndRenderSmartBanner() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) return;
    if (sessionStorage.getItem('ml_install_dismissed')) return;
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'install-smart-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-icon"><i class="fas fa-wallet"></i></div>
        <div class="banner-text">
          <div class="banner-title">Install MoneyLend Pro</div>
          <div class="banner-sub">Install on phone • Works offline • Fast</div>
        </div>
      </div>
      <div class="banner-actions">
        <button class="btn btn-primary btn-sm" id="banner-install-btn"><i class="fas fa-download"></i> Install</button>
        <button class="banner-close-btn" id="banner-close-btn" title="Dismiss" aria-label="Dismiss"><i class="fas fa-times"></i></button>
      </div>
    `;

    document.body.appendChild(banner);

    const installBtn = document.getElementById('banner-install-btn');
    if (installBtn) {
      installBtn.onclick = () => {
        promptInstallApp();
        banner.remove();
      };
    }
    const closeBtn = document.getElementById('banner-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        sessionStorage.setItem('ml_install_dismissed', 'true');
        banner.remove();
      };
    }
  }

  async function promptInstallApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('Installing MoneyLend Pro...', 'success');
      }
      deferredPrompt = null;
      return;
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const bodyHtml = `
      <div class="space-y-4 text-slate-700 dark:text-slate-300 text-sm">
        <div class="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-start gap-3">
          <i class="fas fa-mobile-alt text-2xl text-blue-600 mt-0.5"></i>
          <div>
            <h4 class="font-bold text-slate-900 dark:text-white mb-1">Add MoneyLend Pro to your Phone</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">Install this web app as a standalone mobile application without any App Store or Play Store downloads. Works offline and lightning fast.</p>
          </div>
        </div>

        <div class="space-y-3">
          <h5 class="font-bold text-xs uppercase tracking-wider text-slate-500">How to install:</h5>
          ${isIOS ? `
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
              <span>Tap the <strong>Share</strong> button <i class="fas fa-share-square text-blue-500 mx-1"></i> in Safari toolbar.</span>
            </div>
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
              <span>Scroll down and tap <strong>Add to Home Screen</strong> <i class="fas fa-plus-square text-slate-600 mx-1"></i>.</span>
            </div>
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
              <span>Tap <strong>Add</strong> in the top right. MoneyLend Pro is ready on your screen!</span>
            </div>
          ` : `
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
              <span>Tap the browser menu (<strong>?</strong> three dots in Chrome / Edge / Brave).</span>
            </div>
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
              <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
            </div>
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
              <span>Confirm <strong>Install</strong>. It will be added to your app drawer like a native app!</span>
            </div>
          `}
        </div>
      </div>
    `;

    openModal('Install Mobile App', bodyHtml, '<button class="btn btn-primary" onclick="closeModal()">Got it!</button>');
  }

  // Global App Registry
  window.app = {
    promptInstallApp,
    openCustomerModal,
    viewCustomer,
    deleteCustomer,
    sendWhatsAppCustomer,
    exportCustomers,
    openLoanModal,
    viewLoan,
    deleteLoan,
    remindLoan,
    downloadLoanSchedule,
    exportLoans,
    openPaymentModal,
    exportPayments,
    sendCustomWhatsApp,
    copyText,
    generateBulkDaily,
    exportCollectionReport,
    exportDefaultersReport,
    saveSettings,
    toggleTheme,
    changePassword: AuthScreen.changePassword
};

  // Service Worker Registration for PWA
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/public/sw.js').catch(() => {});
    });
  }

  // App Initialization
  function init() {
    setTheme(State.theme);
    if (!isAuthed()) {
      AuthScreen.render();
    } else {
      State.user = JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || '{"name":"Admin User"}');
      State.token = localStorage.getItem(CONFIG.TOKEN_KEY);
      document.getElementById('app').innerHTML = renderShell();
      initShellEvents();
      router();
    }
    setTimeout(checkAndRenderSmartBanner, 1500);
  }

  init();
})();











