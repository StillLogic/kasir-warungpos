import { Expense } from '@/types/business';
import { ExpenseRecord } from './types';
import { generateId, toUnix, fromUnix } from './utils';
import { getDB } from './db';

function toRecord(expense: Expense): ExpenseRecord {
  return {
    i: expense.id,
    c: expense.category,
    d: expense.description,
    a: expense.amount,
    ca: toUnix(new Date(expense.createdAt)),
  };
}

function fromRecord(r: ExpenseRecord): Expense {
  return {
    id: r.i,
    category: r.c,
    description: r.d,
    amount: r.a,
    createdAt: fromUnix(r.ca),
  };
}

export async function getExpensesAsync(): Promise<Expense[]> {
  const db = await getDB();
  const records = await db.getAll('expenses');
  return records.map(fromRecord).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function saveExpenseAsync(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const db = await getDB();
  
  const expense: Expense = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  await db.put('expenses', toRecord(expense));
  return expense;
}

export async function deleteExpenseAsync(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('expenses', id);
  return true;
}

export async function getExpensesByDateRangeAsync(startDate: Date, endDate: Date): Promise<Expense[]> {
  const expenses = await getExpensesAsync();
  return expenses.filter(e => {
    const date = new Date(e.createdAt);
    return date >= startDate && date <= endDate;
  });
}

export async function getTodayExpensesAsync(): Promise<Expense[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return getExpensesByDateRangeAsync(today, tomorrow);
}

export async function getExpensesByCategoryAsync(): Promise<Record<string, number>> {
  const expenses = await getExpensesAsync();
  return expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);
}
