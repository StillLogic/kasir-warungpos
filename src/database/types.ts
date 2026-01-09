// Tipe data ringan untuk penyimpanan lokal
// Menggunakan ID pendek dan timestamp Unix untuk menghemat ruang

export interface ProductRecord {
  i: string;      // id (8 karakter)
  n: string;      // name
  s: string;      // sku
  c: string;      // category
  cp: number;     // costPrice
  rp: number;     // retailPrice
  wp: number;     // wholesalePrice
  wq: number;     // wholesaleMinQty
  st: number;     // stock
  u: string;      // unit
  ca: number;     // createdAt (Unix timestamp)
  ua: number;     // updatedAt (Unix timestamp)
}

export interface CartItemRecord {
  pi: string;     // productId
  pn: string;     // productName
  pp: number;     // price per unit
  q: number;      // quantity
  pt: 0 | 1;      // priceType (0 = retail, 1 = wholesale)
  sb: number;     // subtotal
}

export interface TransactionRecord {
  i: string;      // id (8 karakter)
  it: CartItemRecord[]; // items
  t: number;      // total
  p: number;      // payment
  ch: number;     // change
  ca: number;     // createdAt (Unix timestamp)
  cn?: string;    // customerName (optional)
  ci?: string;    // customerId (optional)
}

// Customer Record
export interface CustomerRecord {
  i: string;      // id
  n: string;      // name
  p?: string;     // phone
  a?: string;     // address
  d: number;      // debt (hutang)
  ca: number;     // createdAt
  ua: number;     // updatedAt
}

// Supplier Record
export interface SupplierRecord {
  i: string;      // id
  n: string;      // name
  p?: string;     // phone
  a?: string;     // address
  ca: number;     // createdAt
  ua: number;     // updatedAt
}

// Purchase Record (pembelian dari supplier)
export interface PurchaseRecord {
  i: string;      // id
  si: string;     // supplierId
  sn: string;     // supplierName
  it: PurchaseItemRecord[]; // items
  t: number;      // total
  ca: number;     // createdAt
  nt?: string;    // notes
}

export interface PurchaseItemRecord {
  pi: string;     // productId
  pn: string;     // productName
  q: number;      // quantity
  pp: number;     // pricePerUnit (harga beli)
  sb: number;     // subtotal
}

// Expense Record (pengeluaran operasional)
export interface ExpenseRecord {
  i: string;      // id
  c: string;      // category
  d: string;      // description
  a: number;      // amount
  ca: number;     // createdAt
}

// Cash Session Record (rekonsiliasi kas)
export interface CashSessionRecord {
  i: string;      // id
  oa: number;     // openingAmount (modal awal)
  ca: number;     // closingAmount (kas akhir - diisi saat tutup)
  ea: number;     // expectedAmount (seharusnya)
  df: number;     // difference (selisih)
  st: 0 | 1;      // status (0 = open, 1 = closed)
  ot: number;     // openedAt (Unix timestamp)
  ct?: number;    // closedAt (Unix timestamp)
  nt?: string;    // notes
}
