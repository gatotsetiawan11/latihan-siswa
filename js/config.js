const SUPABASE_URL =
    "https://rvstyakujwbthjkadiwk.supabase.co/rest/v1/";

const SUPABASE_KEY =
    "sb_publishable_HR6BBVA64HvmRvDaq68RJQ_ma2VgEW3";


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
