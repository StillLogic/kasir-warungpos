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
}
