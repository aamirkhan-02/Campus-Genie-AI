import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, Trash2, BellOff } from 'lucide-react';
import { notificationService } from '../../services/notificationService';

const TYPE_COLORS = {
    welcome: { bg: 'bg-violet-100 dark:bg-violet-900/30', dot: 'bg-violet-500' },
    security: { bg: 'bg-red-100 dark:bg-red-900/30', dot: 'bg-red-500' },
    profile: { bg: 'bg-blue-100 dark:bg-blue-900/30', dot: 'bg-blue-500' },
    default: { bg: 'bg-gray-100 dark:bg-dark-600', dot: 'bg-gray-400' },
};

function timeAgo(dateStr) {
    const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationDropdown() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Poll unread count every 60s
    const fetchCount = useCallback(async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchCount();
        const timer = setInterval(fetchCount, 60000);
        return () => clearInterval(timer);
    }, [fetchCount]);

    // Load full list when opened
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        notificationService.getAll()
            .then(data => setNotifications(data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [open]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleMarkRead = async (id) => {
        await notificationService.markAsRead(id).catch(() => { });
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllRead = async () => {
        await notificationService.markAllAsRead().catch(() => { });
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        await notificationService.delete(id).catch(() => { });
        const n = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (n && !n.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleClick = (n) => {
        if (!n.is_read) handleMarkRead(n.id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-xl relative transition-colors"
                aria-label="Notifications"
            >
                <Bell className={`w-5 h-5 transition-transform ${open ? 'text-purple-500 scale-110' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white
                        text-[10px] font-bold rounded-full flex items-center justify-center px-0.5
                        ring-2 ring-white dark:ring-dark-700 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-1rem)]
                    bg-white dark:bg-dark-700 rounded-2xl shadow-2xl border border-gray-100
                    dark:border-dark-500 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-500">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-purple-500" />
                            <span className="font-bold text-sm">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold
                                    rounded-full px-1.5 py-0.5">{unreadCount} new</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400
                                        hover:text-purple-800 dark:hover:text-purple-200 px-2 py-1 rounded-lg
                                        hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    All read
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col gap-3 p-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3 animate-pulse">
                                        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-dark-500 shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-gray-200 dark:bg-dark-500 rounded w-3/4" />
                                            <div className="h-2.5 bg-gray-100 dark:bg-dark-600 rounded w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                                <div className="w-14 h-14 bg-gray-100 dark:bg-dark-600 rounded-2xl
                                    flex items-center justify-center mb-3">
                                    <BellOff className="w-7 h-7 text-gray-400" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-dark-200">
                                    All caught up!
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    No notifications yet
                                </p>
                            </div>
                        ) : (
                            <div>
                                {notifications.map((n) => {
                                    const colors = TYPE_COLORS[n.type] || TYPE_COLORS.default;
                                    return (
                                        <div
                                            key={n.id}
                                            onClick={() => handleClick(n)}
                                            className={`group flex gap-3 px-4 py-3 cursor-pointer transition-colors
                                                border-b border-gray-50 dark:border-dark-600 last:border-0
                                                hover:bg-gray-50 dark:hover:bg-dark-600
                                                ${!n.is_read ? 'bg-purple-50/40 dark:bg-purple-900/10' : ''}`}
                                        >
                                            {/* Icon */}
                                            <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center
                                                justify-center text-lg shrink-0 mt-0.5`}>
                                                {n.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm leading-snug truncate
                                                        ${!n.is_read
                                                            ? 'font-semibold text-gray-900 dark:text-white'
                                                            : 'font-medium text-gray-700 dark:text-dark-200'
                                                        }`}>
                                                        {n.title}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {!n.is_read && (
                                                            <span className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDelete(e, n.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-0.5
                                                                hover:bg-gray-200 dark:hover:bg-dark-500 rounded
                                                                transition-all text-gray-400 hover:text-red-500"
                                                            title="Remove"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-dark-300 mt-0.5 leading-relaxed line-clamp-2">
                                                    {n.message}
                                                </p>
                                                <p className="text-[11px] text-gray-400 dark:text-dark-400 mt-1">
                                                    {timeAgo(n.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-dark-500 text-center">
                            <p className="text-xs text-gray-400">
                                Showing latest {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
