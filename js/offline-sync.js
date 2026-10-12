/* =====================================================
   ОФЛАЙН-СИНХРОНИЗАЦИЯ «Великополье»
   Очередь операций сохраняется в localStorage.
   При потере связи клиентские запросы Supabase
   дублируются в очередь; при восстановлении —
   автоматически отправляются на сервер с
   уведомлением «Данные успешно отправлены на сервер».
   ===================================================== */
(function () {
    'use strict';

    var QUEUE_KEY = 'velpol_offline_queue';
    var MAX_QUEUE = 100;
    var isSyncing = false;

    function loadQueue() {
        try {
            return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveQueue(queue) {
        try {
            /* Ограничение размера очереди: самые старые
               операции отбрасываются, чтобы localStorage
               не переполнился. */
            localStorage.setItem(
                QUEUE_KEY,
                JSON.stringify(queue.slice(-MAX_QUEUE))
            );
        } catch (e) {
            console.warn('Offline queue: не удалось сохранить', e);
        }
    }

    function queueSize() {
        return loadQueue().length;
    }

    /* Ставит операцию в очередь и сразу пытается отправить. */
    function enqueue(op) {
        var queue = loadQueue();
        queue.push(op);
        saveQueue(queue);

        if (navigator.onLine) {
            flushQueue();
        }
    }

    /* Обёртки: сохранить операцию в очередь,
       если сеть недоступна. Возвращают true,
       если операция принята в офлайн-очередь. */
    function saveOffline(op) {
        if (navigator.onLine) {
            return false;
        }
        enqueue(op);
        return true;
    }

    function pickClient(db, clientFn) {
        if (typeof clientFn === 'function') {
            return clientFn();
        }
        if (typeof db !== 'undefined' && db) {
            return db;
        }
        if (window.db) {
            return window.db;
        }
        if (window._supabase) {
            return window._supabase;
        }
        return null;
    }

    function applyOp(client, op) {
        var table = client.from(op.table);

        if (op.type === 'insert') {
            return table.insert(op.payload);
        }
        if (op.type === 'update') {
            return table.update(op.payload).match(op.match || {});
        }
        if (op.type === 'delete') {
            return table.delete().match(op.match || {});
        }
        if (op.type === 'hours') {
            /* Наработка часов суммируется: читаем
               текущее значение и прибавляем. */
            return client
                .from(op.table)
                .select('current_hours')
                .match(op.match || {})
                .single()
                .then(function (res) {
                    if (res.error) return { error: res.error };
                    var current = res.data.current_hours || 0;
                    return client
                        .from(op.table)
                        .update({ current_hours: current + op.hours })
                        .match(op.match || {});
                });
        }
        return Promise.resolve({ error: new Error('Неизвестный тип операции: ' + op.type) });
    }

    /* Отправка накопленных операций на сервер. */
    async function flushQueue() {
        if (isSyncing || !navigator.onLine) {
            return;
        }

        var queue = loadQueue();
        if (queue.length === 0) {
            return;
        }

        var client = pickClient();
        if (!client) {
            return;
        }

        isSyncing = true;

        var remaining = [];

        for (var i = 0; i < queue.length; i++) {
            var op = queue[i];
            try {
                var result = await applyOp(client, op);

                if (result && result.error) {
                    /* Ошибки RLS/валидации не ретраятся:
                       операция потеряна, но очередь
                       продолжается. */
                    console.warn('Offline sync: ошибка операции', op, result.error);
                }
            } catch (e) {
                /* Сеть снова недоступна — операция
                   остаётся в очереди. */
                console.warn('Offline sync: сеть потеряна', e);
                remaining = queue.slice(i);
                break;
            }
        }

        if (remaining.length === 0) {
            saveQueue([]);
            notifySynced(queue.length);
        } else {
            saveQueue(remaining);
        }

        isSyncing = false;
    }

    function notifySynced(count) {
        var message = 'Данные успешно отправлены на сервер';

        if (count > 1) {
            message += ' (' + count + ' опер.)';
        }

        if (typeof window.showSimpleMessage === 'function') {
            window.showSimpleMessage('Синхронизация', message);
        } else {
            showToast(message);
        }
    }

    function showToast(text) {
        var toast = document.createElement('div');
        toast.className = 'offline-sync-toast';
        toast.textContent = '✓ ' + text;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        document.body.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add('visible');
        });

        setTimeout(function () {
            toast.classList.remove('visible');
            setTimeout(function () {
                toast.remove();
            }, 350);
        }, 4000);
    }

    window.OfflineSync = {
        saveOffline: saveOffline,
        enqueue: enqueue,
        flush: flushQueue,
        size: queueSize,
        showToast: showToast
    };

    window.addEventListener('online', function () {
        flushQueue();
    });

    window.addEventListener('offline', function () {
        if (queueSize() > 0) {
            showToast('Нет соединения — данные сохраняются локально');
        }
    });
})();
