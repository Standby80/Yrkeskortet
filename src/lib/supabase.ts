import { createClient } from '@supabase/supabase-js';
import { Discount, Profile } from '../types';

export const SUPABASE_URL = 'https://quvbidcenujaarzhamda.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_6PFBrKhRThMwvIEnUJXu2A_BKC35hVX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper function to get high quality category-specific Unsplash images
export function getCategoryFallbackImage(category?: string, company?: string): string {
  const cat = (category || '').toLowerCase();
  const comp = (company || '').toLowerCase();

  if (comp.includes('tvätt') || comp.includes('biltvätt')) {
    return 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80';
  }
  if (comp.includes('preem') || comp.includes('circle k') || comp.includes('diesel')) {
    return 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80';
  }
  if (comp.includes('kläder') || comp.includes('varsel') || comp.includes('skyddsskor')) {
    return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80';
  }
  if (comp.includes('verktyg') || comp.includes('elverktyg') || comp.includes('batteri')) {
    return 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80';
  }

  if (cat.includes('lunch') || cat.includes('mat')) {
    return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80';
  }
  if (cat.includes('verktyg') || cat.includes('kläder')) {
    return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80';
  }
  if (cat.includes('fordon') || cat.includes('drivmedel')) {
    return 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80';
  }
  if (cat.includes('mobil') || cat.includes('vardag')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80';
  }

  return 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80';
}

// Fallback seed discounts if Supabase table is unreachable or empty
export const FALLBACK_DISCOUNTS: Discount[] = [
  {
    id: "2b3b003b-6d02-4c3c-8b36-f08ac5a5caf7",
    company: "Arbetskläder Express",
    title: "20% på hela sortimentet av varsel och skyddsskor",
    description: "Gäller både online och i butik vid uppvisande av Yrkeskortet.",
    category: "Verktyg & Kläder",
    discount_badge: "20% RABATT",
    discount_code: "YRKES20",
    external_url: "https://arbetskladerexpress.se",
    image_url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
    is_local: false,
    location: "Hela Sverige",
    distance: "Online",
    highlight_tag: "Populärast"
  },
  {
    id: "e50ba607-9cce-44f2-a499-36809b101f5a",
    company: "Preem / Circle K (Förmånsavtal)",
    title: "Rabatt på diesel, bensin och kaffe längs vägen",
    description: "Koppla ditt kort och få upp till 65 öre/liter i rabatt samt var 6:e kaffe gratis.",
    category: "Fordon & Drivmedel",
    discount_badge: "65 ÖRE/L",
    discount_code: "DRIVMEDEL06",
    external_url: null,
    image_url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80",
    is_local: false,
    location: "Alla stationer",
    distance: "1.4 km",
    highlight_tag: "Toppavtal"
  },
  {
    id: "549a8de4-b4ea-4dc2-a3e8-f7d6fbd92a9a",
    company: "Kvarterskrogen & Grillen",
    title: "Dagens lunch inkl. läsk och kaffe för 115 kr",
    description: "Visa upp ditt aktiva Yrkeskort i kassan mellan kl 10:30 och 14:00.",
    category: "Lunch & Mat",
    discount_badge: "115 KR LUNCH",
    discount_code: "VISA KORTET",
    external_url: null,
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    is_local: true,
    location: "Industriområdet",
    distance: "350 m",
    highlight_tag: "Nära dig"
  },
  {
    id: "163795ff-4b4a-4ced-a9c7-119184e4fc31",
    company: "Proffsverktyg.se",
    title: "15% extra rabatt på elverktyg och batterier",
    description: "Gäller elverktyg från ledande märken (Milwaukee, DeWalt, Makita) vid köp över 1 000 kr.",
    category: "Verktyg & Kläder",
    discount_badge: "15% RABATT",
    discount_code: "VERKTYG15",
    external_url: "https://proffsverktyg.se",
    image_url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80",
    is_local: false,
    location: "Online",
    distance: "Online",
    highlight_tag: "Kampanj"
  },
  {
    id: "4d600462-d070-4ee6-a3b1-3585ca938321",
    company: "Snabbtvätten Bilvård",
    title: "Halva priset på Guldtvätt för servicebilar och privatbilar",
    description: "Gäller alla dagar i automattvätten med rabattkod i appen. Skonsam borstfri tvätt.",
    category: "Fordon & Drivmedel",
    discount_badge: "50% RABATT",
    discount_code: "TVATT50",
    external_url: null,
    image_url: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80",
    is_local: true,
    location: "Hantverksgatan 4",
    distance: "850 m",
    highlight_tag: "Halva priset"
  },
  {
    id: "20005c0f-091a-46ae-afa3-797a37e7e2b2",
    company: "Mobiloperatören Pro",
    title: "Obegränsad surf för 249 kr/mån (Ord. pris 399 kr)",
    description: "Ingen bindningstid. Fri roaming i hela EU. Perfekt i servicebilen eller byggboden.",
    category: "Mobil & Vardag",
    discount_badge: "150 KR/MÅN",
    discount_code: "YRKESSURF",
    external_url: "https://mobiloperatorenpro.se",
    image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
    is_local: false,
    location: "Online",
    distance: "Online",
    highlight_tag: "Yrkesavtal"
  }
];

export async function getDiscountsFromSupabase(): Promise<Discount[]> {
  try {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase query error, falling back to local seed:', error.message);
      return FALLBACK_DISCOUNTS;
    }

    if (!data || data.length === 0) {
      return FALLBACK_DISCOUNTS;
    }

    // Merge Supabase data with rich distance/tag enrichments and ensure image_url is present
    return data.map((d: Discount, index: number) => {
      const fallback = FALLBACK_DISCOUNTS.find(f => f.id === d.id || f.company === d.company);
      const imageUrl = d.image_url || fallback?.image_url || getCategoryFallbackImage(d.category, d.company);

      return {
        ...d,
        image_url: imageUrl,
        distance: fallback?.distance || (d.is_local ? `${(index + 1) * 350} m` : 'Hela landet'),
        highlight_tag: fallback?.highlight_tag || (d.is_local ? 'Lokal förmån' : 'Exklusiv')
      };
    });
  } catch (err) {
    console.warn('Network error fetching discounts:', err);
    return FALLBACK_DISCOUNTS;
  }
}

export async function createDiscountInSupabase(discountData: Omit<Discount, 'id' | 'created_at'>): Promise<Discount | null> {
  try {
    const { data, error } = await supabase
      .from('discounts')
      .insert([discountData])
      .select()
      .single();

    if (error) {
      console.error('Supabase discount insert error:', error.message);
      throw error;
    }
    return data as Discount;
  } catch (err) {
    console.error('Failed to create discount in Supabase:', err);
    throw err;
  }
}

export async function deleteDiscountFromSupabase(discountId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('discounts')
      .delete()
      .eq('id', discountId);

    if (error) {
      console.error('Supabase discount delete error:', error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete discount from Supabase:', err);
    throw err;
  }
}

export async function getProfilesFromSupabase(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not load profiles from Supabase:', error.message);
      return [];
    }
    return (data || []) as Profile[];
  } catch (err) {
    console.warn('Error fetching profiles:', err);
    return [];
  }
}

export async function updateProfileStatusInSupabase(id: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ id06_status: status })
      .eq('id', id);

    if (error) {
      console.warn('Error updating profile status in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error updating profile status:', err);
    return false;
  }
}
