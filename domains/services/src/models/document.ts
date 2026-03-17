export interface DocumentRecord {
  id: string;
  title: string;
  desc: string;
  cover: string;
  /** 序列化后的 Document JSON 字符串 */
  data: string;
  created_at: number;
  updated_at: number;
}

export interface DocumentListItem {
  id: string;
  title: string;
  desc: string;
  cover: string;
  updated_at: number;
}
