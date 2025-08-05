import { authManager } from './auth.js';
import { commentsManager } from './comments.js';

document.addEventListener('DOMContentLoaded', function() {
    authManager;
    
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        commentsManager;
    }
});