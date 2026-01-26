import { Employee, EmployeeIncome, EmployeeDebt, EmployeeSummary, IncomeType, DebtPaymentMethod } from "@/types/employee";
import { generateId, toUnix, fromUnix } from "./utils";
import { getDB } from "./db";

// ============ Employee CRUD ============

export async function getEmployeesAsync(): Promise<Employee[]> {
  const db = await getDB();
  const records = await db.getAll("employees");
  return records.map(r => ({
    id: r.i,
    name: r.n,
    position: r.p,
    phone: r.ph,
    createdAt: fromUnix(r.ca),
    updatedAt: fromUnix(r.ua),
  }));
}

export async function getEmployeeByIdAsync(id: string): Promise<Employee | undefined> {
  const db = await getDB();
  const record = await db.get("employees", id);
  if (!record) return undefined;
  return {
    id: record.i,
    name: record.n,
    position: record.p,
    phone: record.ph,
    createdAt: fromUnix(record.ca),
    updatedAt: fromUnix(record.ua),
  };
}

export async function saveEmployeeAsync(employee: Omit<Employee, "id" | "createdAt" | "updatedAt">): Promise<Employee> {
  const db = await getDB();
  const now = new Date().toISOString();
  const id = generateId();
  const record = {
    i: id,
    n: employee.name,
    p: employee.position,
    ph: employee.phone,
    ca: toUnix(now),
    ua: toUnix(now),
  };
  await db.put("employees", record);
  return {
    id,
    name: employee.name,
    position: employee.position,
    phone: employee.phone,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateEmployeeAsync(id: string, data: Partial<Omit<Employee, "id" | "createdAt" | "updatedAt">>): Promise<Employee | undefined> {
  const db = await getDB();
  const existing = await db.get("employees", id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    n: data.name ?? existing.n,
    p: data.position ?? existing.p,
    ph: data.phone ?? existing.ph,
    ua: toUnix(now),
  };
  await db.put("employees", updated);
  return {
    id: updated.i,
    name: updated.n,
    position: updated.p,
    phone: updated.ph,
    createdAt: fromUnix(updated.ca),
    updatedAt: now,
  };
}

export async function deleteEmployeeAsync(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete("employees", id);
  return true;
}

// ============ Employee Income CRUD ============

export async function getEmployeeIncomesAsync(): Promise<EmployeeIncome[]> {
  const db = await getDB();
  const records = await db.getAll("employeeIncomes");
  return records.map(r => ({
    id: r.i,
    employeeId: r.ei,
    employeeName: r.en,
    date: fromUnix(r.d),
    type: r.t as IncomeType,
    description: r.desc,
    amount: r.a,
    isPaid: r.ip === 1,
    paidAt: r.pa ? fromUnix(r.pa) : undefined,
    createdAt: fromUnix(r.ca),
    updatedAt: fromUnix(r.ua),
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getEmployeeIncomesByEmployeeAsync(employeeId: string): Promise<EmployeeIncome[]> {
  const all = await getEmployeeIncomesAsync();
  return all.filter(inc => inc.employeeId === employeeId);
}

export async function saveEmployeeIncomeAsync(income: Omit<EmployeeIncome, "id" | "createdAt" | "updatedAt">): Promise<EmployeeIncome> {
  const db = await getDB();
  const now = new Date().toISOString();
  const id = generateId();
  const record = {
    i: id,
    ei: income.employeeId,
    en: income.employeeName,
    d: toUnix(income.date),
    t: income.type,
    desc: income.description,
    a: income.amount,
    ip: income.isPaid ? 1 as const : 0 as const,
    pa: income.paidAt ? toUnix(income.paidAt) : undefined,
    ca: toUnix(now),
    ua: toUnix(now),
  };
  await db.put("employeeIncomes", record);
  return {
    id,
    ...income,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateEmployeeIncomeAsync(id: string, data: Partial<Omit<EmployeeIncome, "id" | "createdAt" | "updatedAt">>): Promise<EmployeeIncome | undefined> {
  const db = await getDB();
  const records = await db.getAll("employeeIncomes");
  const existing = records.find(r => r.i === id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ei: data.employeeId ?? existing.ei,
    en: data.employeeName ?? existing.en,
    d: data.date ? toUnix(data.date) : existing.d,
    t: data.type ?? existing.t,
    desc: data.description ?? existing.desc,
    a: data.amount ?? existing.a,
    ip: data.isPaid !== undefined ? (data.isPaid ? 1 as const : 0 as const) : existing.ip,
    pa: data.paidAt ? toUnix(data.paidAt) : existing.pa,
    ua: toUnix(now),
  };
  await db.put("employeeIncomes", updated);
  return {
    id: updated.i,
    employeeId: updated.ei,
    employeeName: updated.en,
    date: fromUnix(updated.d),
    type: updated.t as IncomeType,
    description: updated.desc,
    amount: updated.a,
    isPaid: updated.ip === 1,
    paidAt: updated.pa ? fromUnix(updated.pa) : undefined,
    createdAt: fromUnix(updated.ca),
    updatedAt: now,
  };
}

export async function deleteEmployeeIncomeAsync(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete("employeeIncomes", id);
  return true;
}

export async function markIncomeAsPaidAsync(id: string): Promise<EmployeeIncome | undefined> {
  return updateEmployeeIncomeAsync(id, {
    isPaid: true,
    paidAt: new Date().toISOString(),
  });
}

// ============ Employee Debt CRUD ============

export async function getEmployeeDebtsAsync(): Promise<EmployeeDebt[]> {
  const db = await getDB();
  const records = await db.getAll("employeeDebts");
  return records.map(r => ({
    id: r.i,
    employeeId: r.ei,
    employeeName: r.en,
    date: fromUnix(r.d),
    description: r.desc,
    amount: r.a,
    isPaid: r.ip === 1,
    paidAt: r.pa ? fromUnix(r.pa) : undefined,
    paymentMethod: r.pm as DebtPaymentMethod | undefined,
    createdAt: fromUnix(r.ca),
    updatedAt: fromUnix(r.ua),
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getEmployeeDebtsByEmployeeAsync(employeeId: string): Promise<EmployeeDebt[]> {
  const all = await getEmployeeDebtsAsync();
  return all.filter(debt => debt.employeeId === employeeId);
}

export async function saveEmployeeDebtAsync(debt: Omit<EmployeeDebt, "id" | "createdAt" | "updatedAt">): Promise<EmployeeDebt> {
  const db = await getDB();
  const now = new Date().toISOString();
  const id = generateId();
  const record = {
    i: id,
    ei: debt.employeeId,
    en: debt.employeeName,
    d: toUnix(debt.date),
    desc: debt.description,
    a: debt.amount,
    ip: debt.isPaid ? 1 as const : 0 as const,
    pa: debt.paidAt ? toUnix(debt.paidAt) : undefined,
    pm: debt.paymentMethod,
    ca: toUnix(now),
    ua: toUnix(now),
  };
  await db.put("employeeDebts", record);
  return {
    id,
    ...debt,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateEmployeeDebtAsync(id: string, data: Partial<Omit<EmployeeDebt, "id" | "createdAt" | "updatedAt">>): Promise<EmployeeDebt | undefined> {
  const db = await getDB();
  const records = await db.getAll("employeeDebts");
  const existing = records.find(r => r.i === id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ei: data.employeeId ?? existing.ei,
    en: data.employeeName ?? existing.en,
    d: data.date ? toUnix(data.date) : existing.d,
    desc: data.description ?? existing.desc,
    a: data.amount ?? existing.a,
    ip: data.isPaid !== undefined ? (data.isPaid ? 1 as const : 0 as const) : existing.ip,
    pa: data.paidAt ? toUnix(data.paidAt) : existing.pa,
    pm: data.paymentMethod ?? existing.pm,
    ua: toUnix(now),
  };
  await db.put("employeeDebts", updated);
  return {
    id: updated.i,
    employeeId: updated.ei,
    employeeName: updated.en,
    date: fromUnix(updated.d),
    description: updated.desc,
    amount: updated.a,
    isPaid: updated.ip === 1,
    paidAt: updated.pa ? fromUnix(updated.pa) : undefined,
    paymentMethod: updated.pm as DebtPaymentMethod | undefined,
    createdAt: fromUnix(updated.ca),
    updatedAt: now,
  };
}

export async function deleteEmployeeDebtAsync(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete("employeeDebts", id);
  return true;
}

export async function markDebtAsPaidAsync(id: string, method: DebtPaymentMethod): Promise<EmployeeDebt | undefined> {
  return updateEmployeeDebtAsync(id, {
    isPaid: true,
    paidAt: new Date().toISOString(),
    paymentMethod: method,
  });
}

// ============ Employee Summary ============

export async function getEmployeeSummaryAsync(employeeId: string): Promise<EmployeeSummary | undefined> {
  const employee = await getEmployeeByIdAsync(employeeId);
  if (!employee) return undefined;

  const incomes = await getEmployeeIncomesByEmployeeAsync(employeeId);
  const debts = await getEmployeeDebtsByEmployeeAsync(employeeId);

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalPaidIncome = incomes.filter(inc => inc.isPaid).reduce((sum, inc) => sum + inc.amount, 0);
  const totalUnpaidIncome = totalIncome - totalPaidIncome;

  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
  const totalPaidDebt = debts.filter(d => d.isPaid).reduce((sum, d) => sum + d.amount, 0);
  const totalUnpaidDebt = totalDebt - totalPaidDebt;

  return {
    employeeId,
    employeeName: employee.name,
    totalIncome,
    totalPaidIncome,
    totalUnpaidIncome,
    totalDebt,
    totalPaidDebt,
    totalUnpaidDebt,
    netIncome: totalIncome - totalDebt,
  };
}

export async function getAllEmployeeSummariesAsync(): Promise<EmployeeSummary[]> {
  const employees = await getEmployeesAsync();
  const summaries = await Promise.all(
    employees.map(emp => getEmployeeSummaryAsync(emp.id))
  );
  return summaries.filter((s): s is EmployeeSummary => s !== undefined);
}
