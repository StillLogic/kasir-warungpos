import { CashSession } from '@/types/business';
import { CashSessionRecord } from './types';
import { generateId, toUnix, fromUnix } from './utils';
import { getDB } from './db';

function toRecord(session: CashSession): CashSessionRecord {
  return {
    i: session.id,
    oa: session.openingAmount,
    ca: session.closingAmount,
    ea: session.expectedAmount,
    df: session.difference,
    st: session.status === 'open' ? 0 : 1,
    ot: toUnix(new Date(session.openedAt)),
    ct: session.closedAt ? toUnix(new Date(session.closedAt)) : undefined,
    nt: session.notes,
  };
}

function fromRecord(r: CashSessionRecord): CashSession {
  return {
    id: r.i,
    openingAmount: r.oa,
    closingAmount: r.ca,
    expectedAmount: r.ea,
    difference: r.df,
    status: r.st === 0 ? 'open' : 'closed',
    openedAt: fromUnix(r.ot),
    closedAt: r.ct ? fromUnix(r.ct) : undefined,
    notes: r.nt,
  };
}

export async function getCashSessionsAsync(): Promise<CashSession[]> {
  const db = await getDB();
  const records = await db.getAll('cashSessions');
  return records.map(fromRecord).sort((a, b) => 
    new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
  );
}

export async function getActiveCashSessionAsync(): Promise<CashSession | null> {
  const sessions = await getCashSessionsAsync();
  return sessions.find(s => s.status === 'open') || null;
}

export async function openCashSessionAsync(openingAmount: number): Promise<CashSession> {
  const db = await getDB();
  
  // Check if there's already an open session
  const activeSession = await getActiveCashSessionAsync();
  if (activeSession) {
    throw new Error('Ada sesi kasir yang masih aktif. Tutup sesi sebelumnya terlebih dahulu.');
  }

  const session: CashSession = {
    id: generateId(),
    openingAmount,
    closingAmount: 0,
    expectedAmount: 0,
    difference: 0,
    status: 'open',
    openedAt: new Date().toISOString(),
  };

  await db.put('cashSessions', toRecord(session));
  return session;
}

export async function closeCashSessionAsync(
  id: string, 
  closingAmount: number, 
  expectedAmount: number,
  notes?: string
): Promise<CashSession | null> {
  const db = await getDB();
  const existing = await db.get('cashSessions', id);
  
  if (!existing) return null;

  const session = fromRecord(existing);
  const updated: CashSession = {
    ...session,
    closingAmount,
    expectedAmount,
    difference: closingAmount - expectedAmount,
    status: 'closed',
    closedAt: new Date().toISOString(),
    notes,
  };

  await db.put('cashSessions', toRecord(updated));
  return updated;
}

export async function getCashSessionByIdAsync(id: string): Promise<CashSession | null> {
  const db = await getDB();
  const record = await db.get('cashSessions', id);
  return record ? fromRecord(record) : null;
}
