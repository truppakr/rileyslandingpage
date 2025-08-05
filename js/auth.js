import { auth } from './firebase-config.js';
import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();

export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.updateUI();
            this.handleProtectedRoutes();
        });
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signInWithEmail(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signUpWithEmail(email, password) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signOutUser() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    updateUI() {
        const authButton = document.getElementById('auth-button');
        const userInfo = document.getElementById('user-info');
        const protectedElements = document.querySelectorAll('.protected');

        if (this.currentUser) {
            if (authButton) {
                authButton.textContent = 'Sign Out';
                authButton.onclick = () => this.signOutUser();
            }
            if (userInfo) {
                userInfo.innerHTML = `
                    <span>Welcome, ${this.currentUser.displayName || this.currentUser.email}</span>
                `;
                userInfo.style.display = 'block';
            }
            protectedElements.forEach(el => el.style.display = 'block');
        } else {
            if (authButton) {
                authButton.textContent = 'Sign In';
                authButton.onclick = () => window.location.href = 'signin.html';
            }
            if (userInfo) {
                userInfo.style.display = 'none';
            }
            protectedElements.forEach(el => el.style.display = 'none');
        }
    }

    handleProtectedRoutes() {
        const currentPage = window.location.pathname;
        const protectedPages = ['/chat.html'];
        
        if (protectedPages.some(page => currentPage.includes(page))) {
            if (!this.isAuthenticated()) {
                window.location.href = 'signin.html';
            }
        }
    }
}

export const authManager = new AuthManager();