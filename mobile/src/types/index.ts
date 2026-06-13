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
  quantity: number;
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

export interface ShoppingList {
  id: number;
  name: string;
  description: string | null;
  product_count: number;
  total_current: number | null;
  total_ref: number | null;
  created_at: string;
}

export interface ListItem {
  id: number;
  product_id: number;
  article_no: string;
  name: string;
  image_url: string | null;
  quantity: number;
  current_price: number | null;
  ref_price: number;
  ikea_url: string;
}

export interface ListDetailResponse extends ShoppingList {
  items: ListItem[];
}

export interface ScraperStatus {
  last_run: {
    finished_at: string;
    checked: number;
    price_changes: number;
    tag_changes: number;
    errors: number;
  } | null;
  is_running: boolean;
}

export interface PriceSummary {
  product_count: number;
  total_ref: number;
  total_current: number | null;
  savings: number | null;
  promo_count: number;
  recent_changes_7d: number;
}
