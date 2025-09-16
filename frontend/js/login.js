// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const passwordToggle = document.getElementById('passwordToggle');
const forgotPasswordBtn = document.getElementById('forgotPassword');
const usernameInput = document.getElementById('username');

// Utility Functions
function showAlert(elementId, message, type = 'error') {
    const alertElement = document.getElementById(elementId);
    const alertText = alertElement.querySelector('.alert-text');

    alertElement.className = `alert ${type}`;
    alertText.textContent = message;
    alertElement.style.display = 'flex';

    setTimeout(() => {
        alertElement.style.display = 'none';
    }, 5000);
}

function hideAlert(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (isLoading) {
        button.classList.add('btn-loading');
        button.disabled = true;
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
    }
}

// Token Management
function saveToken(token) {
    localStorage.setItem('authToken', token);
}

function getToken() {
    return localStorage.getItem('authToken');
}

function removeToken() {
    localStorage.removeItem('authToken');
}

function saveRememberMe(remember) {
    if (remember) {
        localStorage.setItem('rememberMe', 'true');
    } else {
        localStorage.removeItem('rememberMe');
        const token = getToken();
        if (token) {
            removeToken();
            sessionStorage.setItem('authToken', token);
        }
    }
}

function checkRememberMe() {
    const rememberMe = localStorage.getItem('rememberMe');
    if (rememberMe) {
        document.getElementById('rememberMe').checked = true;
    }
}

// API Functions
async function loginUser(login, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Please check if the backend is running.');
        }
        throw error;
    }
}

// Event Handlers
function handleLogin(e) {
    e.preventDefault();
    hideAlert('alertMsg');

    const loginValue = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!loginValue || !password) {
        showAlert('alertMsg', 'Please fill in all fields', 'error');
        return;
    }

    setButtonLoading('loginBtn', true);

    loginUser(loginValue, password)
        .then(response => {
            if (response.success) {
                saveToken(response.token);
                saveRememberMe(rememberMe);

                showAlert('alertMsg', 'Login successful! Redirecting...', 'success');
                localStorage.setItem('currentUser', JSON.stringify(response.user));

                setTimeout(() => {
                    // Role-based redirection
                    if (response.user.role === 'admin') {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1500);
            }
        })
        .catch(error => {
            showAlert('alertMsg', error.message || 'Login failed. Please try again.', 'error');
        })
        .finally(() => {
            setButtonLoading('loginBtn', false);
        });
}

function togglePasswordVisibility(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    const icon = toggle.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    const usernameField = document.getElementById('username');
    if (usernameField) {
        usernameField.value = 'Shagun';
        setTimeout(() => {
            if (usernameField.value.toLowerCase() === 'shagun') {
                usernameField.value = 'Shagun';
            }
        }, 100);
    }

    const token = getToken() || sessionStorage.getItem('authToken');
    if (token) {
        fetch(`${API_BASE_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => {
                if (data && data.user) {
                    // Redirect based on role
                    if (data.user.role === 'admin') {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'user-dashboard.html';
                    }
                } else {
                    removeToken();
                    sessionStorage.removeItem('authToken');
                }
            })
            .catch(() => {
                removeToken();
                sessionStorage.removeItem('authToken');
            });
    }

    checkRememberMe();
    setButtonLoading('loginBtn', false);

    loginForm.addEventListener('submit', handleLogin);

    passwordToggle.addEventListener('click', () => {
        togglePasswordVisibility('password', 'passwordToggle');
    });

    usernameInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value.toLowerCase() === 'shagun') {
            e.target.value = 'Shagun';
        } else if (value && !value.includes('@')) {
            const words = value.split(' ');
            const capitalizedWords = words.map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            );
            e.target.value = capitalizedWords.join(' ');
        }
    });

    usernameInput.addEventListener('paste', (e) => {
        setTimeout(() => {
            if (e.target.value.toLowerCase() === 'shagun') {
                e.target.value = 'Shagun';
            }
        }, 10);
    });

    forgotPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showAlert('alertMsg', 'Password reset feature coming soon!', 'warning');
    });
});
