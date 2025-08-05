import { authManager } from './auth.js';

class SignInPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkIfAlreadySignedIn();
    }

    checkIfAlreadySignedIn() {
        if (authManager.isAuthenticated()) {
            window.location.href = 'index.html';
        }
    }

    setupEventListeners() {
        const googleSignInBtn = document.getElementById('google-signin');
        const emailForm = document.getElementById('email-form');
        const signUpBtn = document.getElementById('signup-btn');

        googleSignInBtn.addEventListener('click', () => this.handleGoogleSignIn());
        emailForm.addEventListener('submit', (e) => this.handleEmailSignIn(e));
        signUpBtn.addEventListener('click', () => this.handleEmailSignUp());
    }

    async handleGoogleSignIn() {
        this.showLoading('google-signin');
        const result = await authManager.signInWithGoogle();
        
        if (result.success) {
            window.location.href = 'index.html';
        } else {
            this.showError(result.error);
            this.hideLoading('google-signin');
        }
    }

    async handleEmailSignIn(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        this.showLoading('signin-btn');
        const result = await authManager.signInWithEmail(email, password);
        
        if (result.success) {
            window.location.href = 'index.html';
        } else {
            this.showError(result.error);
            this.hideLoading('signin-btn');
        }
    }

    async handleEmailSignUp() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showError('Please fill in both email and password');
            return;
        }
        
        this.showLoading('signup-btn');
        const result = await authManager.signUpWithEmail(email, password);
        
        if (result.success) {
            window.location.href = 'index.html';
        } else {
            this.showError(result.error);
            this.hideLoading('signup-btn');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showLoading(buttonId) {
        const button = document.getElementById(buttonId);
        const span = button.querySelector('.link-text');
        span.textContent = 'Loading...';
        button.disabled = true;
    }

    hideLoading(buttonId) {
        const button = document.getElementById(buttonId);
        const span = button.querySelector('.link-text');
        button.disabled = false;
        
        if (buttonId === 'google-signin') {
            span.textContent = 'Continue with Google';
        } else if (buttonId === 'signin-btn') {
            span.textContent = 'Sign In';
        } else if (buttonId === 'signup-btn') {
            span.textContent = 'Sign Up';
        }
    }
}

new SignInPage();