export interface Item {
  id: string;
  property_id: string;
  name: string;
  description: string | null;
  location: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'document' | 'audio' | 'other' | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateItemData {
  property_id: string;
  name: string;
  description?: string;
  location?: string;
  media_url?: string;
  media_type?: Item['media_type'];
  metadata?: Record<string, unknown>;
}

export type UpdateItemData = Partial<Omit<CreateItemData, 'property_id'>>;

export interface ItemFilters {
  property_id?: string;
  media_type?: Item['media_type'];
  location?: string;
  sortBy?: 'created_at' | 'updated_at' | 'name' | 'location';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  search?: string;
  [key: string]: unknown;
}