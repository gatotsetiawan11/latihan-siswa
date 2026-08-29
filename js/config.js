const SUPABASE_URL =
    "MASUKKAN_PROJECT_URL_ANDA";

const SUPABASE_KEY =
    "MASUKKAN_PUBLISHABLE_KEY_ANDA";


window.db =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: false
            }
        }
    );
