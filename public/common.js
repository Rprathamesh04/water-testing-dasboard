// small helpers used by the dashboard page
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

async function callApi(url) {
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  if (res.status === 401) {
    logout();
    return null;
  }
  return res.json();
}
