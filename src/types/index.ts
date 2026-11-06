export interface Discount {
  id: string;
  company: string;
  title: string;
  description: string;
  category: 'Alla' | 'Lunch & Mat' | 'Verktyg & Kläder' | 'Fordon & Drivmedel' | 'Mobil & Vardag' | string;
  discount_badge: string;
  discount_code: string | null;
  external_url: string | null;
  image_url?: string | null;
  is_local: boolean;
  location: string | null;
  created_at?: string;
  // Visual & UX enrichments
  icon_name?: string;
  highlight_tag?: string;
  distance?: string;
  expires_in?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  company_name: string;
  id06_number: string;
  created_at?: string;
  profession?: string;
  id06_status?: 'pending' | 'verified' | 'rejected' | string;
}

export type TabType = 'discounts' | 'local' | 'card' | 'profile';
export type AdminTabType = 'discounts' | 'members';
