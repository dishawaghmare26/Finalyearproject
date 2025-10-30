document.addEventListener('DOMContentLoaded', () => {
    const passwordToggles = document.querySelectorAll('.password-toggle');

    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.previousElementSibling;
            const eyeIcon = toggle.querySelector('.eye-icon');
            const eyeOffIcon = toggle.querySelector('.eye-off-icon');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.classList.add('hidden');
                eyeOffIcon.classList.remove('hidden');
            } else {
                passwordInput.type = 'password';
                eyeIcon.classList.remove('hidden');
                eyeOffIcon.classList.add('hidden');
            }
        });
    });

    // Handle Signup Form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData.entries());

            if (data.password !== data.confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            const response = await fetch('api/signup.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            alert(result.message);
            if (result.success) {
                window.location.href = 'login.html';
            }
        });
    }

    // Handle Login Form Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            const response = await fetch('api/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.success) {
                alert("Success");
                window.location.href = 'index.html';
            } else {
                alert("Failed: " + result.message);
            }
        });
    }

    // Handle Logout
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.location.href = 'api/logout.php';
        });
    }
    
    const mobileLogoutButton = document.getElementById('mobileLogoutButton');
    if (mobileLogoutButton) {
        mobileLogoutButton.addEventListener('click', () => {
            window.location.href = 'api/logout.php';
        });
    }

    // Fetch and display profile data
    if (window.location.pathname.endsWith('profile.html')) {
        fetch('api/profile.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.querySelector('.profile-name').textContent = `${data.user.first_name} ${data.user.last_name}`;
                    document.querySelector('.profile-email').textContent = data.user.email;
                } else {
                    // If not logged in, redirect to login page
                    window.location.href = 'login.html';
                }
            });
    }

    // Check login status to show/hide elements
    fetch('api/profile.php')
        .then(response => response.json())
        .then(data => {
            const isLoggedIn = data.success;

            const guestActions = document.querySelectorAll('#guest-actions, #mobile-guest-actions');
            const userActions = document.querySelectorAll('#user-actions, #mobile-user-actions');

            if (isLoggedIn) {
                guestActions.forEach(el => el.classList.add('hidden'));
                userActions.forEach(el => el.classList.remove('hidden'));
            } else {
                guestActions.forEach(el => el.classList.remove('hidden'));
                userActions.forEach(el => el.classList.add('hidden'));
            }
        });
});
