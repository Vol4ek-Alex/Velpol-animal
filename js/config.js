const SUPABASE_URL = 'https://aeeqqakkhrpozlfizwih.supabase.co';

const SUPABASE_KEY = 'sb_publishable_ZeO_xOgmH9Y860gDUJfWOA_JylyCK_i';

const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

window.state = window.state || {
    isEditMode: false,
    currentFarm: 'Все',
    activeModule: 'dashboard'
};