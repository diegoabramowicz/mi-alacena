const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  throw new Error("Faltan las variables de entorno de Supabase.");
}

export const SUPABASE_URL = VITE_SUPABASE_URL;
export const SUPABASE_KEY = VITE_SUPABASE_ANON_KEY;
