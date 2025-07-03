export interface QRCode {
  id: string;
  item_id: string;
  qr_id: string;
  status: 'active' | 'inactive' | 'expired' | 'deleted';
  scan_count: number;
  last_scanned_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateQRCodeData {
  item_id: string;
  custom_qr_id?: string;
  status?: QRCode['status'];
  metadata?: Record<string, unknown>;
}

export type UpdateQRCodeData = Partial<Omit<CreateQRCodeData, 'item_id'>>;

export interface QRCodeFilters {
  item_id?: string;
  status?: QRCode['status'];
  sortBy?: 'created_at' | 'updated_at' | 'scan_count' | 'last_scanned_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  search?: string;
  [key: string]: unknown;
}

export interface QRCodeWithItem extends QRCode {
  item: {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    property_id: string;
  };
}

export interface QRCodeGenerationResult {
  qrCode: QRCode;
  imageUrl: string;
  downloadUrl: string;
}

export interface QRCodeScanResult {
  qrCode: QRCodeWithItem;
  isValid: boolean;
  message: string;
}