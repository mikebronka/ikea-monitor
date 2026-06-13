export interface Product {
  id: number;
  article_no: string;
  name: string;
  image_url: string | null;
  ref_price: number;
  priority: string;
  category: string;
  ikea_url: string;
  current_price: number | null;
  latest_tags: string[];
  price_vs_ref: number | null;
  last_checked: string | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
}

export interface SearchResult {
  article_no: string;
  name: string;
  type_name: string;
  price: number | null;
  tags: string[];
  image_url: string;
  ikea_url: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export interface PricePoint {
  date: string;
  price: number;
  tags: string[];
}

export interface PriceHistoryResponse {
  product_id: number;
  history: PricePoint[];
}
