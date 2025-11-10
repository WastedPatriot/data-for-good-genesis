export interface ESIMPlan {
  id: string;
  country: string;
  countryCode: string;
  dataAmount: string;
  duration: number;
  price: number;
  coverage: string[];
  networkType: string;
}

export interface ESIMPurchase {
  id: string;
  user_id: string;
  plan_id: string;
  country: string;
  data_amount: string;
  duration: number;
  price: number;
  status: "pending" | "active" | "expired" | "cancelled";
  payment_method: "stripe" | "crypto";
  esim_iccid?: string;
  esim_activation_code?: string;
  esim_qr_code?: string;
  data_used?: number;
  activated_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface VirtualLocation {
  id: string;
  country: string;
  countryCode: string;
  city: string;
  available: boolean;
}
