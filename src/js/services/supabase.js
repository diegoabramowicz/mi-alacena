import { SUPABASE_KEY, SUPABASE_URL } from "../config.js";

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
