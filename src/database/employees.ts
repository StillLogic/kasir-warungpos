import { Employee, EmployeeEarning, EmployeeDebt, EmployeeDebtPayment } from "@/types/employee";
import { generateId, toUnix, fromUnix } from "./utils";

const EMPLOYEES_KEY = "db_employees";
const EARNINGS_KEY = "db_employee_earnings";
const EMPLOYEE_DEBTS_KEY = "db_employee_debts";
const EMPLOYEE_DEBT_PAYMENTS_KEY = "db_employee_debt_payments";

// ============ Employee Records ============
interface EmployeeRecord {
  i: string; // id
  n: string; // name
  p: string; // position
  ph?: string; // phone
  bs: number; // baseSalary
  cr: number; // commissionRate
  ca: number; // createdAt
  ua: number; // updatedAt
}

function employeeToRecord(e: Employee): EmployeeRecord {
  return {
    i: e.id,
    n: e.name,
    p: e.position,
    ph: e.phone,
    bs: e.baseSalary,
    cr: e.commissionRate,
    ca: toUnix(new Date(e.createdAt)),
    ua: toUnix(new Date(e.updatedAt)),
  };
}

function employeeFromRecord(r: EmployeeRecord): Employee {
  return {
    id: r.i,
    name: r.n,
    position: r.p,
    phone: r.ph,
    baseSalary: r.bs,
    commissionRate: r.cr,
    createdAt: fromUnix(r.ca),
    updatedAt: fromUnix(r.ua),
  };
}

function loadEmployees(): EmployeeRecord[] {
  try {
    const data = localStorage.getItem(EMPLOYEES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveEmployees(employees: EmployeeRecord[]) {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
}

// ============ Earning Records ============
interface EarningRecord {
  i: string; // id
  ei: string; // employeeId
  en: string; // employeeName
  ti?: string; // transactionId
  t: 0 | 1 | 2 | 3; // type (0=salary, 1=commission, 2=bonus, 3=other)
  d: string; // description
  a: number; // amount
  ip: boolean; // isPaid
  pa?: number; // paidAt
  ca: number; // createdAt
}

function earningTypeToNumber(type: EmployeeEarning["type"]): 0 | 1 | 2 | 3 {
  switch (type) {
    case "salary": return 0;
    case "commission": return 1;
    case "bonus": return 2;
    case "other": return 3;
  }
}

function earningTypeFromNumber(n: 0 | 1 | 2 | 3): EmployeeEarning["type"] {
  switch (n) {
    case 0: return "salary";
    case 1: return "commission";
    case 2: return "bonus";
    case 3: return "other";
  }
}

function earningToRecord(e: EmployeeEarning): EarningRecord {
  return {
    i: e.id,
    ei: e.employeeId,
    en: e.employeeName,
    ti: e.transactionId,
    t: earningTypeToNumber(e.type),
    d: e.description,
    a: e.amount,
    ip: e.isPaid,
    pa: e.paidAt ? toUnix(new Date(e.paidAt)) : undefined,
    ca: toUnix(new Date(e.createdAt)),
  };
}

function earningFromRecord(r: EarningRecord): EmployeeEarning {
  return {
    id: r.i,
    employeeId: r.ei,
    employeeName: r.en,
    transactionId: r.ti,
    type: earningTypeFromNumber(r.t),
    description: r.d,
    amount: r.a,
    isPaid: r.ip,
    paidAt: r.pa ? fromUnix(r.pa) : undefined,
    createdAt: fromUnix(r.ca),
  };
}

function loadEarnings(): EarningRecord[] {
  try {
    const data = localStorage.getItem(EARNINGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveEarnings(earnings: EarningRecord[]) {
  localStorage.setItem(EARNINGS_KEY, JSON.stringify(earnings));
}

// ============ Debt Records ============
interface DebtRecord {
  i: string; // id
  ei: string; // employeeId
  en: string; // employeeName
  d: string; // description
  a: number; // amount
  pa: number; // paidAmount
  ra: number; // remainingAmount
  st: 0 | 1 | 2; // status (0=unpaid, 1=partial, 2=paid)
  ca: number; // createdAt
  ua: number; // updatedAt
  pat?: number; // paidAt
}

function debtStatusToNumber(status: EmployeeDebt["status"]): 0 | 1 | 2 {
  switch (status) {
    case "unpaid": return 0;
    case "partial": return 1;
    case "paid": return 2;
  }
}

function debtStatusFromNumber(n: 0 | 1 | 2): EmployeeDebt["status"] {
  switch (n) {
    case 0: return "unpaid";
    case 1: return "partial";
    case 2: return "paid";
  }
}

function debtToRecord(d: EmployeeDebt): DebtRecord {
  return {
    i: d.id,
    ei: d.employeeId,
    en: d.employeeName,
    d: d.description,
    a: d.amount,
    pa: d.paidAmount,
    ra: d.remainingAmount,
    st: debtStatusToNumber(d.status),
    ca: toUnix(new Date(d.createdAt)),
    ua: toUnix(new Date(d.updatedAt)),
    pat: d.paidAt ? toUnix(new Date(d.paidAt)) : undefined,
  };
}

function debtFromRecord(r: DebtRecord): EmployeeDebt {
  return {
    id: r.i,
    employeeId: r.ei,
    employeeName: r.en,
    description: r.d,
    amount: r.a,
    paidAmount: r.pa,
    remainingAmount: r.ra,
    status: debtStatusFromNumber(r.st),
    createdAt: fromUnix(r.ca),
    updatedAt: fromUnix(r.ua),
    paidAt: r.pat ? fromUnix(r.pat) : undefined,
  };
}

function loadDebts(): DebtRecord[] {
  try {
    const data = localStorage.getItem(EMPLOYEE_DEBTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveDebts(debts: DebtRecord[]) {
  localStorage.setItem(EMPLOYEE_DEBTS_KEY, JSON.stringify(debts));
}

// ============ Debt Payment Records ============
interface PaymentRecord {
  i: string; // id
  di: string; // debtId
  ei: string; // employeeId
  a: number; // amount
  m: 0 | 1; // method (0=cash, 1=salary_deduction)
  ca: number; // createdAt
}

function paymentMethodToNumber(method: EmployeeDebtPayment["method"]): 0 | 1 {
  return method === "cash" ? 0 : 1;
}

function paymentMethodFromNumber(n: 0 | 1): EmployeeDebtPayment["method"] {
  return n === 0 ? "cash" : "salary_deduction";
}

function paymentToRecord(p: EmployeeDebtPayment): PaymentRecord {
  return {
    i: p.id,
    di: p.debtId,
    ei: p.employeeId,
    a: p.amount,
    m: paymentMethodToNumber(p.method),
    ca: toUnix(new Date(p.createdAt)),
  };
}

function paymentFromRecord(r: PaymentRecord): EmployeeDebtPayment {
  return {
    id: r.i,
    debtId: r.di,
    employeeId: r.ei,
    amount: r.a,
    method: paymentMethodFromNumber(r.m),
    createdAt: fromUnix(r.ca),
  };
}

function loadPayments(): PaymentRecord[] {
  try {
    const data = localStorage.getItem(EMPLOYEE_DEBT_PAYMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function savePayments(payments: PaymentRecord[]) {
  localStorage.setItem(EMPLOYEE_DEBT_PAYMENTS_KEY, JSON.stringify(payments));
}

// ============ Employee CRUD ============
export function getEmployees(): Employee[] {
  return loadEmployees()
    .map(employeeFromRecord)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getEmployeeById(id: string): Employee | undefined {
  const records = loadEmployees();
  const record = records.find((r) => r.i === id);
  return record ? employeeFromRecord(record) : undefined;
}

export function createEmployee(data: Omit<Employee, "id" | "createdAt" | "updatedAt">): Employee {
  const now = toUnix(new Date());
  const newEmployee: EmployeeRecord = {
    i: generateId(),
    n: data.name,
    p: data.position,
    ph: data.phone,
    bs: data.baseSalary,
    cr: data.commissionRate,
    ca: now,
    ua: now,
  };

  const employees = loadEmployees();
  employees.push(newEmployee);
  saveEmployees(employees);

  return employeeFromRecord(newEmployee);
}

export function updateEmployee(id: string, data: Partial<Omit<Employee, "id" | "createdAt" | "updatedAt">>): Employee | undefined {
  const employees = loadEmployees();
  const index = employees.findIndex((e) => e.i === id);
  if (index === -1) return undefined;

  const now = toUnix(new Date());
  const updated = { ...employees[index], ua: now };

  if (data.name !== undefined) updated.n = data.name;
  if (data.position !== undefined) updated.p = data.position;
  if (data.phone !== undefined) updated.ph = data.phone;
  if (data.baseSalary !== undefined) updated.bs = data.baseSalary;
  if (data.commissionRate !== undefined) updated.cr = data.commissionRate;

  employees[index] = updated;
  saveEmployees(employees);

  return employeeFromRecord(updated);
}

export function deleteEmployee(id: string): boolean {
  const employees = loadEmployees();
  const filtered = employees.filter((e) => e.i !== id);
  if (filtered.length === employees.length) return false;
  saveEmployees(filtered);
  return true;
}

// ============ Earnings CRUD ============
export function getEarnings(): EmployeeEarning[] {
  return loadEarnings()
    .map(earningFromRecord)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getEarningsByEmployeeId(employeeId: string): EmployeeEarning[] {
  return getEarnings().filter((e) => e.employeeId === employeeId);
}

export function getUnpaidEarnings(): EmployeeEarning[] {
  return getEarnings().filter((e) => !e.isPaid);
}

export function getUnpaidEarningsByEmployeeId(employeeId: string): EmployeeEarning[] {
  return getEarnings().filter((e) => e.employeeId === employeeId && !e.isPaid);
}

export function createEarning(data: Omit<EmployeeEarning, "id" | "createdAt" | "isPaid" | "paidAt">): EmployeeEarning {
  const now = toUnix(new Date());
  const newEarning: EarningRecord = {
    i: generateId(),
    ei: data.employeeId,
    en: data.employeeName,
    ti: data.transactionId,
    t: earningTypeToNumber(data.type),
    d: data.description,
    a: data.amount,
    ip: false,
    ca: now,
  };

  const earnings = loadEarnings();
  earnings.push(newEarning);
  saveEarnings(earnings);

  return earningFromRecord(newEarning);
}

export function markEarningAsPaid(id: string): EmployeeEarning | undefined {
  const earnings = loadEarnings();
  const index = earnings.findIndex((e) => e.i === id);
  if (index === -1) return undefined;

  const now = toUnix(new Date());
  earnings[index].ip = true;
  earnings[index].pa = now;

  saveEarnings(earnings);
  return earningFromRecord(earnings[index]);
}

export function deleteEarning(id: string): boolean {
  const earnings = loadEarnings();
  const filtered = earnings.filter((e) => e.i !== id);
  if (filtered.length === earnings.length) return false;
  saveEarnings(filtered);
  return true;
}

// ============ Employee Debts CRUD ============
export function getEmployeeDebts(): EmployeeDebt[] {
  return loadDebts()
    .map(debtFromRecord)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getEmployeeDebtById(id: string): EmployeeDebt | undefined {
  const records = loadDebts();
  const record = records.find((r) => r.i === id);
  return record ? debtFromRecord(record) : undefined;
}

export function getDebtsByEmployeeId(employeeId: string): EmployeeDebt[] {
  return getEmployeeDebts().filter((d) => d.employeeId === employeeId);
}

export function getUnpaidEmployeeDebts(): EmployeeDebt[] {
  return getEmployeeDebts().filter((d) => d.status !== "paid");
}

export function getUnpaidDebtsByEmployeeId(employeeId: string): EmployeeDebt[] {
  return getEmployeeDebts().filter((d) => d.employeeId === employeeId && d.status !== "paid");
}

export function createEmployeeDebt(data: { employeeId: string; employeeName: string; description: string; amount: number }): EmployeeDebt {
  const now = toUnix(new Date());
  const newDebt: DebtRecord = {
    i: generateId(),
    ei: data.employeeId,
    en: data.employeeName,
    d: data.description,
    a: data.amount,
    pa: 0,
    ra: data.amount,
    st: 0,
    ca: now,
    ua: now,
  };

  const debts = loadDebts();
  debts.push(newDebt);
  saveDebts(debts);

  return debtFromRecord(newDebt);
}

export function payEmployeeDebt(
  debtId: string,
  amount: number,
  method: EmployeeDebtPayment["method"]
): { debt: EmployeeDebt; payment: EmployeeDebtPayment } | undefined {
  const debts = loadDebts();
  const index = debts.findIndex((d) => d.i === debtId);
  if (index === -1) return undefined;

  const debt = debts[index];
  const now = toUnix(new Date());

  // Create payment record
  const paymentRecord: PaymentRecord = {
    i: generateId(),
    di: debtId,
    ei: debt.ei,
    a: amount,
    m: paymentMethodToNumber(method),
    ca: now,
  };

  const payments = loadPayments();
  payments.push(paymentRecord);
  savePayments(payments);

  // Update debt
  debt.pa += amount;
  debt.ra = Math.max(0, debt.a - debt.pa);
  debt.ua = now;

  if (debt.ra === 0) {
    debt.st = 2; // paid
    debt.pat = now;
  } else if (debt.pa > 0) {
    debt.st = 1; // partial
  }

  saveDebts(debts);

  return {
    debt: debtFromRecord(debt),
    payment: paymentFromRecord(paymentRecord),
  };
}

export function getEmployeeDebtPayments(debtId: string): EmployeeDebtPayment[] {
  return loadPayments()
    .filter((p) => p.di === debtId)
    .map(paymentFromRecord)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteEmployeeDebt(id: string): boolean {
  const debts = loadDebts();
  const filtered = debts.filter((d) => d.i !== id);
  if (filtered.length === debts.length) return false;
  saveDebts(filtered);
  return true;
}

// ============ Summary Functions ============
export function getEmployeeTotalDebt(employeeId: string): number {
  return getDebtsByEmployeeId(employeeId)
    .filter((d) => d.status !== "paid")
    .reduce((sum, d) => sum + d.remainingAmount, 0);
}

export function getEmployeeTotalUnpaidEarnings(employeeId: string): number {
  return getEarningsByEmployeeId(employeeId)
    .filter((e) => !e.isPaid)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getEmployeesWithDebt(): { employeeId: string; employeeName: string; totalDebt: number; debtCount: number }[] {
  const debts = getUnpaidEmployeeDebts();
  const employeeMap = new Map<string, { employeeName: string; totalDebt: number; debtCount: number }>();

  for (const debt of debts) {
    const existing = employeeMap.get(debt.employeeId);
    if (existing) {
      existing.totalDebt += debt.remainingAmount;
      existing.debtCount += 1;
    } else {
      employeeMap.set(debt.employeeId, {
        employeeName: debt.employeeName,
        totalDebt: debt.remainingAmount,
        debtCount: 1,
      });
    }
  }

  return Array.from(employeeMap.entries())
    .map(([employeeId, data]) => ({ employeeId, ...data }))
    .sort((a, b) => b.totalDebt - a.totalDebt);
}
