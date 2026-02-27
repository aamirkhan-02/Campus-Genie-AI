/**
 * Format seconds into a human-readable time string
 * e.g. 3661 -> "1h 1m"
 */
export function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

/**
 * Format a date/timestamp as a relative time string
 * e.g. "2 hours ago", "yesterday", "3 days ago"
 */
export function formatRelativeTime(date) {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
    if (diffDay === 1) return 'yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;

    return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Truncate a string to a max length, appending ellipsis if needed
 * e.g. truncate("Hello World", 8) -> "Hello Wo..."
 */
export function truncate(str, maxLength = 60) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength).trimEnd() + '...';
}

/**
 * Download text content as a file
 * @param {string} content - file content
 * @param {string} filename - file name with extension
 * @param {string} mimeType - MIME type (default: text/plain)
 */
export function downloadAsFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
