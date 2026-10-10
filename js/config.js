// =====================================================
// КОНФИГУРАЦИЯ SUPABASE
// =====================================================

const SUPABASE_URL = 'https://xoouaazntzbkjwyzggiz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NEv4wb8ErPkNk5e8OVf-5A_XRaVFW6-';

// Инициализация Supabase клиента
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Глобальное состояние приложения
window.state = window.state || {
    isEditMode: false,
    currentFarm: 'Все',
    activeModule: 'dashboard'
};