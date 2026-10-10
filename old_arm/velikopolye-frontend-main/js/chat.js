// js/chat.js – Финальная версия

// ===== СОСТОЯНИЕ =====
const state = {
    currentRoom: 'general',
    messages: [],
    users: [],
    subscription: null,
    isOpen: false,
    unreadCount: 0,
    selectedUser: null,
    currentUser: null
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
export async function init() {
    console.log('💬 Чат запущен');

    state.currentUser = {
        name: localStorage.getItem('user_name') || 'Сотрудник',
        role: localStorage.getItem('user_role') || 'Сотрудник'
    };

    if (!document.getElementById('chatRoot')) {
        document.body.insertAdjacentHTML('beforeend', getChatHTML());
    }

    bindEvents();

    await loadUsers();
    await loadMessages('general');
    renderMessages();
    renderUserList();
    subscribeToRoom('general');
    await updateOnlineStatus(true);

    setInterval(checkNewMessages, 10000);
    setInterval(updateOnlineStatus, 30000);

    window.toggleChat = toggleChat;
    window.closeChat = closeChat;
    window.sendMessage = sendMessage;
    window.switchRoom = switchRoom;
    window.startPrivateChat = startPrivateChat;
    window.openChatMenu = openChatMenu;
    window.closeChatMenu = closeChatMenu;
    window.minimizeChat = minimizeChat;
    window.deleteMessage = deleteMessage;
}

// ===== HTML =====
function getChatHTML() {
    return `
        <div id="chatRoot" class="fixed inset-0 z-[999] pointer-events-none">
            <!-- Плавающая кнопка -->
            <button id="chatFab" class="fixed bottom-6 right-6 pointer-events-auto bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center w-14 h-14 backdrop-blur-sm hover:scale-105 active:scale-95">
                <span class="text-2xl">💬</span>
                <span id="chatBadge" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center hidden shadow-lg">0</span>
            </button>

            <!-- Окно чата -->
            <div id="chatWindow" class="fixed inset-0 md:inset-auto md:left-4 md:bottom-20 md:w-[min(80vw,800px)] md:h-[60vh] bg-white shadow-2xl border border-gray-200/80 pointer-events-auto flex flex-col hidden transition-all duration-300 transform scale-95 opacity-0 md:rounded-2xl overflow-hidden">
                <!-- Шапка -->
                <div class="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white p-3 flex justify-between items-center flex-shrink-0">
                    <div class="flex items-center gap-2">
                        <button id="chatMenuBtn" class="text-white hover:text-gray-200 text-xl leading-none md:hidden">☰</button>
                        <span class="text-xl">💬</span>
                        <span class="font-bold text-base">Чат</span>
                        <span id="chatRoomName" class="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">Общий</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="chatMinimizeBtn" class="text-white hover:text-gray-200 text-lg leading-none transition">−</button>
                        <button id="chatCloseBtn" class="text-white hover:text-gray-200 text-lg leading-none transition">✕</button>
                    </div>
                </div>

                <!-- Основная панель -->
                <div class="flex flex-1 overflow-hidden relative">
                    <!-- Боковое меню -->
                    <div id="chatSidebar" class="absolute md:relative z-20 w-64 h-full bg-gray-50/95 backdrop-blur-sm border-r border-gray-200 flex-shrink-0 overflow-y-auto transition-transform duration-300 -translate-x-full md:translate-x-0 md:block">
                        <div class="p-3 border-b border-gray-200 bg-white/80">
                            <div class="flex items-center gap-2 text-xs font-bold text-gray-700">
                                <span>👥</span> Комнаты
                            </div>
                        </div>
                        <div class="p-2 space-y-1">
                            <button onclick="window.switchRoom('general')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-cyan-100/50 transition flex items-center gap-2 text-sm font-medium" id="room-general">
                                <span class="text-base">💬</span> Общий
                            </button>
                            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 pt-2 pb-1">Личные</div>
                            <div id="chatUserList" class="space-y-1"></div>
                        </div>
                    </div>

                    <!-- Оверлей для мобильного меню -->
                    <div id="chatMenuOverlay" class="fixed inset-0 bg-black/30 z-10 hidden pointer-events-auto" onclick="closeChatMenu()"></div>

                    <!-- Область сообщений -->
                    <div class="flex-1 flex flex-col bg-gray-50/80">
                        <div id="chatMessages" class="flex-1 p-3 overflow-y-auto space-y-2">
                            <div class="text-center text-gray-400 py-6 text-sm">Загрузка...</div>
                        </div>

                        <!-- Поле ввода -->
                        <div class="border-t border-gray-200 p-2 flex gap-2 items-center bg-white">
                            <input type="text" id="chatInput" placeholder="Введите сообщение..." class="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-400 outline-none transition">
                            <button id="chatSendBtn" class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-md hover:shadow-lg active:scale-95">➤</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== ОБРАБОТЧИКИ =====
function bindEvents() {
    document.getElementById('chatFab').addEventListener('click', toggleChat);
    document.getElementById('chatCloseBtn').addEventListener('click', closeChat);
    document.getElementById('chatMinimizeBtn').addEventListener('click', minimizeChat);
    document.getElementById('chatSendBtn').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('chatMenuBtn').addEventListener('click', openChatMenu);
}

// ===== УПРАВЛЕНИЕ ОКНОМ =====
function toggleChat() {
    const win = document.getElementById('chatWindow');
    if (win.classList.contains('hidden')) {
        openChat();
    } else {
        closeChat();
    }
}

function openChat() {
    const win = document.getElementById('chatWindow');
    const fab = document.getElementById('chatFab');
    win.classList.remove('hidden', 'scale-95', 'opacity-0');
    win.classList.add('scale-100', 'opacity-100');
    fab.classList.add('hidden');
    state.isOpen = true;
    clearBadge();
    loadMessages(state.currentRoom);
    renderMessages();
    updateOnlineStatus(true);
}

function closeChat() {
    const win = document.getElementById('chatWindow');
    const fab = document.getElementById('chatFab');
    win.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        win.classList.add('hidden');
        win.classList.remove('scale-100', 'opacity-100');
        fab.classList.remove('hidden');
        state.isOpen = false;
    }, 300);
}

function minimizeChat() {
    const win = document.getElementById('chatWindow');
    const fab = document.getElementById('chatFab');
    win.classList.add('hidden');
    fab.classList.remove('hidden');
    state.isOpen = false;
}

// ===== МЕНЮ =====
function openChatMenu() {
    const sidebar = document.getElementById('chatSidebar');
    const overlay = document.getElementById('chatMenuOverlay');
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
}

function closeChatMenu() {
    const sidebar = document.getElementById('chatSidebar');
    const overlay = document.getElementById('chatMenuOverlay');
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
}

// ===== ПОЛЬЗОВАТЕЛИ =====
async function loadUsers() {
    if (!window._supabase) return;
    try {
        const { data, error } = await window._supabase
            .from('chat_users')
            .select('*')
            .order('name');
        if (error) throw error;
        state.users = data || [];
        renderUserList();
    } catch (err) {
        console.error('Ошибка загрузки пользователей:', err);
    }
}

function renderUserList() {
    const container = document.getElementById('chatUserList');
    if (!container) return;
    const currentName = state.currentUser.name;
    const filtered = state.users.filter(u => u.name !== currentName);
    if (filtered.length === 0) {
        container.innerHTML = '<div class="text-xs text-gray-400 px-2 py-1">Нет пользователей</div>';
        return;
    }
    container.innerHTML = filtered.map(u => {
        const online = u.online ? '🟢' : '⚪';
        const isActive = state.selectedUser === u.name;
        const shortRole = u.role.replace('Инженер по ЭМТП', 'Инж.').replace('Заместитель директора', 'Зам. дир.');
        return `
            <button onclick="window.startPrivateChat('${u.name}')" class="w-full text-left px-3 py-1.5 rounded-xl hover:bg-cyan-100/50 transition flex items-center gap-2 text-sm ${isActive ? 'bg-cyan-100' : ''}">
                <span class="text-base">${online}</span>
                <span class="flex-1 truncate font-medium text-sm">${u.name}</span>
                <span class="text-[10px] text-gray-400 bg-gray-200/70 px-1.5 py-0.5 rounded-full">${shortRole}</span>
            </button>
        `;
    }).join('');
}

// ===== ПЕРЕКЛЮЧЕНИЕ КОМНАТ =====
window.switchRoom = function(room) {
    state.currentRoom = room;
    state.selectedUser = null;
    document.getElementById('chatRoomName').textContent = room === 'general' ? 'Общий' : room;
    closeChatMenu();
    if (state.subscription) {
        state.subscription.unsubscribe();
        state.subscription = null;
    }
    loadMessages(room);
    renderMessages();
    subscribeToRoom(room);
    document.querySelectorAll('#room-general, #chatUserList button').forEach(el => el.classList.remove('bg-cyan-100'));
    if (room === 'general') {
        document.getElementById('room-general').classList.add('bg-cyan-100');
    }
};

window.startPrivateChat = function(userName) {
    const room = `private_${userName}`;
    state.currentRoom = room;
    state.selectedUser = userName;
    document.getElementById('chatRoomName').textContent = `Личное: ${userName}`;
    closeChatMenu();
    if (state.subscription) {
        state.subscription.unsubscribe();
        state.subscription = null;
    }
    loadMessages(room);
    renderMessages();
    subscribeToRoom(room);
    document.querySelectorAll('#room-general, #chatUserList button').forEach(el => el.classList.remove('bg-cyan-100'));
    document.querySelectorAll('#chatUserList button').forEach(el => {
        if (el.textContent.includes(userName)) {
            el.classList.add('bg-cyan-100');
        }
    });
};

// ===== СООБЩЕНИЯ =====
async function loadMessages(room) {
    if (!window._supabase) return;
    try {
        const { data, error } = await window._supabase
            .from('chat_messages')
            .select('*')
            .eq('room', room)
            .order('created_at', { ascending: true })
            .limit(100);
        if (error) throw error;
        state.messages = data || [];
    } catch (err) {
        console.error('Ошибка загрузки сообщений:', err);
    }
}

function renderMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    if (state.messages.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-6 text-sm">Нет сообщений</div>';
        return;
    }
    const roleColors = {
        'Директор': 'bg-red-100 text-red-800',
        'Инженер по ЭМТП': 'bg-blue-100 text-blue-800',
        'Техник': 'bg-green-100 text-green-800',
        'Заместитель директора': 'bg-purple-100 text-purple-800'
    };
    const currentName = state.currentUser.name;
    const isEngineer = state.currentUser.role === 'Инженер по ЭМТП';
    container.innerHTML = state.messages.map(msg => {
        const isMe = msg.user_name === currentName;
        const colorClass = roleColors[msg.user_role] || 'bg-gray-100 text-gray-800';
        const time = new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const date = new Date(msg.created_at).toLocaleDateString('ru-RU');
        const shortRole = msg.user_role.replace('Инженер по ЭМТП', 'Инж.').replace('Заместитель директора', 'Зам. дир.');
        return `
            <div class="flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''} animate-fade-in-up">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xs shadow-sm">
                    ${msg.user_name ? msg.user_name.charAt(0) : '?'}
                </div>
                <div class="flex-1 ${isMe ? 'items-end' : ''}">
                    <div class="flex items-center gap-1.5 ${isMe ? 'justify-end' : ''} flex-wrap">
                        <span class="font-bold text-gray-800 text-sm">${msg.user_name || 'Неизвестный'}</span>
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colorClass}">${shortRole}</span>
                        <span class="text-[10px] text-gray-400">${date} ${time}</span>
                        ${isEngineer ? `<button onclick="window.deleteMessage('${msg.id}')" class="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>` : ''}
                    </div>
                    <div class="text-sm text-gray-700 mt-0.5 break-words bg-white p-2 rounded-xl shadow-sm max-w-[85%] ${isMe ? 'ml-auto bg-cyan-50' : ''}">
                        ${msg.message}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

// ===== УДАЛЕНИЕ СООБЩЕНИЯ =====
window.deleteMessage = async function(msgId) {
    if (!confirm('Удалить это сообщение?')) return;
    if (!window._supabase) return;
    try {
        const { error } = await window._supabase
            .from('chat_messages')
            .delete()
            .eq('id', msgId);
        if (error) throw error;
        // Удаляем из локального состояния
        state.messages = state.messages.filter(m => m.id !== msgId);
        renderMessages();
    } catch (err) {
        alert('Ошибка удаления: ' + err.message);
    }
};

// ===== REALTIME =====
function subscribeToRoom(room) {
    if (!window._supabase) return;
    if (state.subscription) {
        state.subscription.unsubscribe();
        state.subscription = null;
    }
    state.subscription = window._supabase
        .channel(`chat_${room}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room=eq.${room}`
        }, (payload) => {
            state.messages.push(payload.new);
            renderMessages();
            if (!state.isOpen) {
                showBadge(state.unreadCount + 1);
            }
        })
        .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'chat_messages'
        }, () => {
            // При удалении перезагружаем сообщения (для синхронизации)
            loadMessages(state.currentRoom);
            renderMessages();
        })
        .subscribe();
}

// ===== ОТПРАВКА =====
window.sendMessage = async function() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    const user_name = state.currentUser.name;
    const user_role = state.currentUser.role;
    const payload = {
        room: state.currentRoom,
        user_name: user_name,
        user_role: user_role,
        message: text,
        created_at: new Date().toISOString()
    };
    if (!window._supabase) {
        alert('Ошибка: Supabase не инициализирован');
        return;
    }
    try {
        const { error } = await window._supabase
            .from('chat_messages')
            .insert([payload]);
        if (error) throw error;
        input.value = '';
    } catch (err) {
        console.error('Ошибка отправки:', err);
        alert('Ошибка отправки: ' + err.message);
    }
};

// ===== ОНЛАЙН =====
async function updateOnlineStatus(force = false) {
    if (!window._supabase) return;
    const name = state.currentUser.name;
    try {
        const { error } = await window._supabase
            .from('chat_users')
            .update({ last_seen: new Date().toISOString(), online: true })
            .eq('name', name);
        if (error) {
            await window._supabase
                .from('chat_users')
                .insert([{ name: name, role: state.currentUser.role, online: true }]);
        }
    } catch (e) {}
    setTimeout(loadUsers, 1000);
}

// ===== УВЕДОМЛЕНИЯ =====
function showBadge(count) {
    const badge = document.getElementById('chatBadge');
    if (badge) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    }
    state.unreadCount = count;
}

function clearBadge() {
    const badge = document.getElementById('chatBadge');
    if (badge) {
        badge.classList.add('hidden');
        badge.textContent = '0';
    }
    state.unreadCount = 0;
}

async function checkNewMessages() {
    if (!window._supabase) return;
    if (state.isOpen) {
        clearBadge();
        return;
    }
    try {
        const { count, error } = await window._supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room', state.currentRoom)
            .gt('created_at', new Date(Date.now() - 60000).toISOString());
        if (error) throw error;
        if (count > 0) {
            showBadge(count);
        }
    } catch (err) {}
}