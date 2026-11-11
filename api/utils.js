// Money Lending Business Automation - Backend Utility Functions

export function normalizePhone(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "91" + digits.slice(1);
  if (digits.length === 10) return "91" + digits;
  return digits;
}

export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

export function generateWhatsAppUrl(phone, message) {
  const cleanPhone = normalizePhone(phone);
  const encodedMsg = encodeURIComponent(message || "");
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function formatDateISO(date) {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split("T")[0];
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + "T00:00:00");
  const d2 = new Date(dateStr2 + "T00:00:00");
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatIndianNumber(num) {
  if (num === null || num === undefined) return "";
  return new Intl.NumberFormat("en-IN").format(num);
}
