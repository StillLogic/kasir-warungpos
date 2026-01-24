


export interface ProductRecord {
  i: string;      
  n: string;      
  s: string;      
  c: string;      
  cp: number;     
  rp: number;     
  wp: number;     
  wq: number;     
  st: number;     
  u: string;      
  ca: number;     
  ua: number;     
}

export interface CartItemRecord {
  pi: string;     
  pn: string;     
  pp: number;     
  q: number;      
  pt: 0 | 1;      
  sb: number;     
}

export interface TransactionRecord {
  i: string;      
  it: CartItemRecord[]; 
  t: number;      
  p: number;      
  ch: number;     
  ca: number;     
  cn?: string;    
  pt?: 0 | 1;     
  ci?: string;    
}
