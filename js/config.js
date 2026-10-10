// =====================================================
// КОНФИГУРАЦИЯ SUPABASE
// =====================================================

const SUPABASE_URL = 'https://xoouaazntzbkjwyzggiz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb3VhYXpudHpia2p3eXpnZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMDQ4MzUsImV4cCI6MjA1MTU4MDgzNX0.NEv4wb8ErPkNk5e8OVf-5A_XRaVFW6-';

// Инициализация Supabase клиента
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Глобальное состояние приложения
window.state = window.state || {
    isEditMode: false,
    currentFarm: 'Все',
    activeModule: 'dashboard'
};