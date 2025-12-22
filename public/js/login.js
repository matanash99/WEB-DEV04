const form = document.getElementById('loginForm');

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    console.log("Submitted login.")

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Login failed');
            return;
        }

        // Save current user in sessionStorage
        sessionStorage.setItem('currentUser', JSON.stringify(data));

        // Redirect to search page
        window.location.href = 'search.html';
    } catch (err) {
        console.error(err);
        alert('Server error. Please try again later.');
    }
});