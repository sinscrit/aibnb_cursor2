export interface Property {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  address: string | null;
  property_type: 'house' | 'apartment' | 'office' | 'warehouse' | 'other';
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePropertyData {
  name: string;
  description?: string;
  address?: string;
  property_type: Property['property_type'];
  settings?: Record<string, unknown>;
}

export type UpdatePropertyData = Partial<CreatePropertyData>;