// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const registerModal = document.getElementById('registerModal');
const showRegisterBtn = document.getElementById('showRegister');
const closeRegisterBtn = document.getElementById('closeRegister');
const passwordToggle = document.getElementById('passwordToggle');
const regPasswordToggle = document.getElementById('regPasswordToggle');
const forgotPasswordBtn = document.getElementById('forgotPassword');
const usernameInput = document.getElementById('username');

// Utility Functions
function showAlert(elementId, message, type = 'error') {
    const alertElement = document.getElementById(elementId);
    const alertText = alertElement.querySelector('.alert-text');
    const alertIcon = alertElement.querySelector('.alert-icon');

    alertElement.className = `alert ${type}`;
    alertText.textContent = message;
    alertElement.style.display = 'flex';

    // Auto hide after 5 seconds
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

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    const minLength = password.length >= 6;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return {
        isValid: minLength && hasUpper && hasLower && hasNumber,
        strength: getPasswordStrength(password),
        minLength,
        hasUpper,
        hasLower,
        hasNumber
    };
}

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 3) return 'fair';
    if (score <= 4) return 'good';
    return 'strong';
}

function updatePasswordStrength(password) {
    const strengthElement = document.getElementById('passwordStrength');
    const strengthFill = strengthElement.querySelector('.strength-fill');
    const strengthText = strengthElement.querySelector('.strength-text');

    const validation = validatePassword(password);
    const strength = validation.strength;

    strengthFill.className = `strength-fill ${strength}`;

    const strengthMessages = {
        weak: 'Weak password',
        fair: 'Fair password',
        good: 'Good password',
        strong: 'Strong password'
    };

    strengthText.textContent = strengthMessages[strength] || 'Password strength';
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
        // If not remembering, use sessionStorage instead
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
async function loginUser(username, password) {
    try {
        console.log('Attempting login to:', `${API_BASE_URL}/login`); // Debug log

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        console.log('Login response status:', response.status); // Debug log

        const data = await response.json();

        if (!response.ok) {
            console.error('Login error response:', data); // Debug log
            throw new Error(data.message || 'Login failed');
        }

        console.log('Login response data:', data); // Debug log
        return data;
    } catch (error) {
        console.error('Login fetch error:', error); // Debug log
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Please check if the backend is running.');
        }
        throw error;
    }
}

async function registerUser(userData) {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
    }

    return data;
}

// Event Handlers
function handleLogin(e) {
    e.preventDefault();
    hideAlert('alertMsg');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;

    // Basic validation
    if (!username || !password) {
        showAlert('alertMsg', 'Please fill in all fields', 'error');
        return;
    }

    setButtonLoading('loginBtn', true);

    loginUser(username, password)
        .then(response => {
            if (response.success) {
                saveToken(response.token);
                saveRememberMe(rememberMe);

                showAlert('alertMsg', 'Login successful! Redirecting...', 'success');

                // Store user info
                localStorage.setItem('currentUser', JSON.stringify(response.user));

                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            showAlert('alertMsg', error.message || 'Login failed. Please try again.', 'error');
        })
        .finally(() => {
            setButtonLoading('loginBtn', false);
        });
}

function handleRegister(e) {
    e.preventDefault();
    hideAlert('regAlertMsg');

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('regPassword').value;

    // Validation
    if (!firstName || !lastName || !username || !email || !password) {
        showAlert('regAlertMsg', 'Please fill in all fields', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showAlert('regAlertMsg', 'Please enter a valid email address', 'error');
        return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        showAlert('regAlertMsg', 'Password must be at least 6 characters with uppercase, lowercase, and number', 'error');
        return;
    }

    setButtonLoading('registerBtn', true);

    const userData = {
        firstName,
        lastName,
        username,
        email,
        password
    };

    registerUser(userData)
        .then(response => {
            if (response.success) {
                showAlert('regAlertMsg', 'Registration successful! You can now login.', 'success');

                // Clear form
                registerForm.reset();

                // Close modal after delay
                setTimeout(() => {
                    closeModal();
                    // Pre-fill login form
                    document.getElementById('username').value = username;
                }, 2000);
            }
        })
        .catch(error => {
            console.error('Registration error:', error);
            showAlert('regAlertMsg', error.message || 'Registration failed. Please try again.', 'error');
        })
        .finally(() => {
            setButtonLoading('registerBtn', false);
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

function showModal() {
    registerModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    registerModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    hideAlert('regAlertMsg');
}

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Ensure username is properly set to "Shagun"
    const usernameField = document.getElementById('username');
    if (usernameField) {
        // Force the username to be "Shagun" regardless of browser autocomplete
        usernameField.value = 'Shagun';

        // Also handle any autocomplete changes
        setTimeout(() => {
            if (usernameField.value.toLowerCase() === 'shagun') {
                usernameField.value = 'Shagun';
            }
        }, 100);
    }

    // Check if user is already logged in
    const token = getToken() || sessionStorage.getItem('authToken');
    if (token) {
        // Verify token is still valid by making a request
        fetch(`${API_BASE_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = 'dashboard.html';
            } else {
                // Token is invalid, remove it
                removeToken();
                sessionStorage.removeItem('authToken');
            }
        })
        .catch(() => {
            // Network error or token invalid
            removeToken();
            sessionStorage.removeItem('authToken');
        });
    }

    // Set remember me checkbox
    checkRememberMe();

    // Ensure buttons start in correct state (not loading)
    setButtonLoading('loginBtn', false);
    setButtonLoading('registerBtn', false);

    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Register form
    registerForm.addEventListener('submit', handleRegister);

    // Modal controls
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showModal();
    });

    closeRegisterBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    registerModal.addEventListener('click', (e) => {
        if (e.target === registerModal) {
            closeModal();
        }
    });

    // Password toggles
    passwordToggle.addEventListener('click', () => {
        togglePasswordVisibility('password', 'passwordToggle');
    });

    regPasswordToggle.addEventListener('click', () => {
        togglePasswordVisibility('regPassword', 'regPasswordToggle');
    });

    // Password strength indicator
    document.getElementById('regPassword').addEventListener('input', (e) => {
        updatePasswordStrength(e.target.value);
    });

    // Username capitalization and enforcement
    usernameInput.addEventListener('input', (e) => {
        const value = e.target.value;
        // Always ensure "Shagun" is properly capitalized
        if (value.toLowerCase() === 'shagun') {
            e.target.value = 'Shagun';
        } else if (value && !value.includes('@')) {
            // Capitalize first letter of each word for other names
            const words = value.split(' ');
            const capitalizedWords = words.map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            );
            e.target.value = capitalizedWords.join(' ');
        }
    });

    // Also handle paste events
    usernameInput.addEventListener('paste', (e) => {
        setTimeout(() => {
            if (e.target.value.toLowerCase() === 'shagun') {
                e.target.value = 'Shagun';
            }
        }, 10);
    });

    // Forgot password (placeholder)
    forgotPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showAlert('alertMsg', 'Password reset feature coming soon!', 'warning');
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && registerModal.style.display === 'flex') {
            closeModal();
        }
    });
});
