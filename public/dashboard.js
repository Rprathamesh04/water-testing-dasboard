if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

let nextCursor = null;

document.getElementById('userInfo').textContent =
  localStorage.getItem('name') + ' (' + (localStorage.getItem('role') || '').toLowerCase() + ')  ';
document.getElementById('logoutBtn').onclick = logout;
document.getElementById('applyBtn').onclick = function () { loadResults(true); };
document.getElementById('moreBtn').onclick = function () { loadResults(false); };

async function loadStats() {
  const s = await callApi('/api/stats');
  if (!s) return;
  document.getElementById('total').textContent = s.total.toLocaleString('en-IN');
  document.getElementById('unsafe').textContent = s.unsafe.toLocaleString('en-IN');
  document.getElementById('percent').textContent =
    s.total ? ((s.unsafe / s.total) * 100).toFixed(1) + '%' : '0%';
}

async function loadVillages() {
  const list = await callApi('/api/villages');
  if (!list) return;
  const select = document.getElementById('village');
  list.forEach(function (v) {
    const opt = document.createElement('option');
    opt.value = v._id;
    opt.textContent = v.name;
    select.appendChild(opt);
  });
  // a village user has only one village, no need for the dropdown
  if (list.length <= 1) {
    document.getElementById('villageBox').classList.add('hidden');
  }
}

async function loadResults(fresh) {
  const body = document.getElementById('tableBody');
  if (fresh) {
    body.innerHTML = '';
    nextCursor = null;
  }

  const params = new URLSearchParams({ limit: 50 });
  const village = document.getElementById('village').value;
  const status = document.getElementById('status').value;
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  if (village) params.set('village', village);
  if (status) params.set('status', status);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (nextCursor) params.set('cursor', nextCursor);

  const data = await callApi('/api/results?' + params.toString());
  if (!data) return;

  data.rows.forEach(function (r) {
    const tr = document.createElement('tr');
    if (!r.isSafe) tr.className = 'unsafe-row';
    const mapLink = 'https://www.google.com/maps?q=' + r.gps.lat + ',' + r.gps.lng;
    tr.innerHTML =
      '<td>' + r.deviceId + '</td>' +
      '<td>' + (r.village ? r.village.name : '') + '</td>' +
      '<td>' + r.district + '</td>' +
      '<td><a href="' + mapLink + '" target="_blank">' + r.gps.lat.toFixed(4) + ', ' + r.gps.lng.toFixed(4) + '</a></td>' +
      '<td>' + r.ph + '</td>' +
      '<td>' + r.fluoride + '</td>' +
      '<td>' + r.nitrate + '</td>' +
      '<td>' + r.chlorine + '</td>' +
      '<td>' + new Date(r.testedAt).toLocaleString('en-IN') + '</td>' +
      '<td class="' + (r.isSafe ? 'safe' : 'unsafe') + '">' + (r.isSafe ? 'Safe' : 'Unsafe') + '</td>' +
      '<td>' + (r.operator || '') + '</td>';
    body.appendChild(tr);
  });

  nextCursor = data.nextCursor;
  document.getElementById('moreBtn').classList.toggle('hidden', !nextCursor);
  document.getElementById('noData').classList.toggle('hidden', body.children.length > 0);
}

loadStats();
loadVillages();
loadResults(true);
