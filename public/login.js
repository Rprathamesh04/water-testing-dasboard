// already logged in? go straight to the dashboard
if (localStorage.getItem('token')) {
  window.location.href = 'dashboard.html';
}

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const errorBox = document.getElementById('error');
  errorBox.textContent = '';

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    })
  });
  const data = await res.json();

  if (!res.ok) {
    errorBox.textContent = data.message;
    return;
  }

  localStorage.setItem('token', data.token);
  localStorage.setItem('name', data.name);
  localStorage.setItem('role', data.role);
  window.location.href = 'dashboard.html';
});
