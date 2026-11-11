-- Money Lending Business Automation - Sample Data
-- Run via: wrangler d1 execute money-lending-db --file=seed.sql

INSERT OR IGNORE INTO settings (key, value, description) VALUES
  ("business_name", "Sharma Lending", "Business name displayed on dashboard and reminders"),
  ("business_phone", "9876543210", "Business contact phone number"),
  ("business_email", "sharma@lending.com", "Business contact email"),
  ("business_address", "123 Main Street, Mumbai, Maharashtra 400001", "Business address"),
  ("currency", "INR", "Default currency code"),
  ("currency_symbol", "INR", "Currency symbol for display"),
  ("default_interest_rate", "12", "Default annual interest rate percentage"),
  ("default_interest_type", "reducing", "Default interest calculation method"),
  ("default_tenure_months", "12", "Default loan tenure in months"),
  ("default_due_day", "5", "Default day of month for EMI payment"),
  ("default_grace_days", "3", "Default grace period in days"),
  ("default_late_fee_percent", "2", "Default late fee percentage per month"),
  ("reminder_days_before_due", "3", "Days before due date to send reminders"),
  ("reminder_template_due_soon", "Hi {{customer_name}}, reminder: Your EMI of INR{{emi}} for loan #{{loan_id}} is due on {{due_date}}. Please pay to avoid late fees. - {{business_name}}", "Template for due soon reminders"),
  ("reminder_template_due_today", "Hi {{customer_name}}, your EMI of INR{{emi}} for loan #{{loan_id}} is DUE TODAY. Please pay immediately. - {{business_name}}", "Template for due today reminders"),
  ("reminder_template_overdue", "Hi {{customer_name}}, your payment of INR{{amount}} for loan #{{loan_id}} is {{days_overdue}} days overdue. Please pay immediately to avoid further charges. - {{business_name}}", "Template for overdue reminders"),
  ("reminder_template_payment_confirmed", "Hi {{customer_name}}, we received INR{{amount}} for loan #{{loan_id}} on {{date}}. Thank you! - {{business_name}}", "Template for payment confirmation"),
  ("auto_default_days", "90", "Days after which a loan is marked as defaulted"),
  ("session_timeout_hours", "24", "Session timeout in hours"),
  ("sms_gateway_url", "", "SMS gateway API URL (optional)"),
  ("whatsapp_api_token", "", "WhatsApp Cloud API token (optional)"),
  ("whatsapp_phone_number_id", "", "WhatsApp Cloud API phone number ID (optional)"),
  ("backup_email", "", "Email for automated backups (optional)"),
  ("fiscal_year_start_month", "4", "Fiscal year start month (April = 4)");

INSERT OR IGNORE INTO users (username, password_hash, role, is_active) VALUES
  ("admin", "admin123", "admin", 1);

INSERT OR IGNORE INTO customers (name, phone, email, address, id_proof, id_proof_type, notes) VALUES
  ("Rajesh Kumar", "9876543210", "rajesh@email.com", "Sector 14, Noida, UP", "AADHAR12345678", "aadhar", "Regular customer"),
  ("Priya Sharma", "8765432109", "priya@email.com", "Koramangala, Bangalore", "AADHAR87654321", "aadhar", "Preferred customer"),
  ("Amit Patel", "7654321098", "amit@email.com", "Navrangpura, Ahmedabad", "PANABCD1234", "pan", "New customer"),
  ("Sunita Reddy", "6543210987", "sunita@email.com", "Banjara Hills, Hyderabad", "AADHAR76543210", "aadhar", ""),
  ("Vijay Singh", "5432109876", "vijay@email.com", "Civil Lines, Jaipur", "AADHAR54321098", "aadhar", "Government contractor"),
  ("Meera Joshi", "4321098765", "meera@email.com", "Vashi, Navi Mumbai", "AADHAR43210987", "aadhar", "Small business owner"),
  ("Anil Verma", "3210987654", "anil@email.com", "Lalbagh, Lucknow", "AADHAR32109876", "aadhar", ""),
  ("Kavita Nair", "2109876543", "kavita@email.com", "Paltan Bazaar, Dehradun", "AADHAR21098765", "aadhar", "Doctor"),
  ("Rohit Agarwal", "1098765432", "rohit@email.com", "Sodepur, Kolkata", "AADHAR10987654", "aadhar", "Trader"),
  ("Pooja Iyer", "9876543211", "pooja@email.com", "T. Nagar, Chennai", "AADHAR98765432", "aadhar", "IT professional");

