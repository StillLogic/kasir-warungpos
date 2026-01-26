export interface Employee {
  id: string;
  name: string;
  position: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export type IncomeType = 
  | "gaji_pokok" 
  | "bonus" 
  | "lembur" 
  | "komisi" 
  | "tunjangan" 
  | "lainnya";

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  gaji_pokok: "Gaji Pokok",
  bonus: "Bonus",
  lembur: "Lembur",
  komisi: "Komisi",
  tunjangan: "Tunjangan",
  lainnya: "Lainnya",
};

export interface EmployeeIncome {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  type: IncomeType;
  description?: string;
  amount: number;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DebtPaymentMethod = "terpisah" | "potong_gaji";

export interface EmployeeDebt {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  description: string;
  amount: number;
  isPaid: boolean;
  paidAt?: string;
  paymentMethod?: DebtPaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  totalIncome: number;
  totalPaidIncome: number;
  totalUnpaidIncome: number;
  totalDebt: number;
  totalPaidDebt: number;
  totalUnpaidDebt: number;
  netIncome: number; // totalIncome - totalDebt
}
