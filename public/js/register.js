const form = document.getElementById('registerForm');

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const firstName = document.getElementById('firstName').value.trim();
    const imageURL = document.getElementById('imageURL').value.trim();

    // Client-side validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(password)) {
        alert("Password must contain at least 1 letter, 1 number, 1 special character, and minimum 6 characters.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, firstName, imageURL })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Registration failed');
            return;
        }

        alert(data.message);
        window.location.href = 'login.html';
    } catch (err) {
        console.error(err);
        alert('Server error. Please try again later.');
    }
});
