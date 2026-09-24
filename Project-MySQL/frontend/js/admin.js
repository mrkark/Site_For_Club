let currentUser = null;

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('adminToken');
  const headers = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/';
    return;
  }

  try {
    const res = await fetch('/api/admin/session', {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!data.authenticated) {
      localStorage.removeItem('adminToken');
      window.location.href = '/';
      return;
    }
    currentUser = data.admin;
    document.getElementById('adminUserBadge').textContent = `👤 ${data.admin.login}`;

    if (!data.admin.superAdmin) {
      document.getElementById('adminsTab').style.display = 'none';
    }
  } catch (err) {
    localStorage.removeItem('adminToken');
    window.location.href = '/';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (_) {}
    localStorage.removeItem('adminToken');
    window.location.href = '/';
  });

  // Sidebar tabs
  document.querySelectorAll('.sidebar-link').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Add buttons
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => openAddModal(btn.dataset.type));
  });

  // Form submit
  document.getElementById('adminForm').addEventListener('submit', handleFormSubmit);

  // Modal close
  document.querySelector('.admin-modal-close').addEventListener('click', () => document.getElementById('adminModal').classList.remove('show'));
  document.getElementById('adminModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('adminModal')) document.getElementById('adminModal').classList.remove('show');
  });

  loadTabData('articles');
  loadTabData('news');
  loadTabData('schedule');
  loadTabData('instructors');
  loadTabData('reviews');
  if (currentUser.superAdmin) loadTabData('admins');
  loadDebugInfo();
});

async function loadTabData(type) {
  try {
    const res = await fetch(`/api/${type}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    const list = document.getElementById(`${type}List`);

    if (data.length === 0) {
      list.innerHTML = '<p style="color:#888;padding:20px;text-align:center">Нет данных</p>';
      return;
    }

    list.innerHTML = data.map(item => {
      let title = item.name || item.author || item.title || item.login || item.dayOfWeek || '';
      let date = item.createdAt || '';
      return `
        <div class="admin-item">
          <div class="admin-item-title">${title}</div>
          <div class="admin-item-date">${date ? formatDate(date) : ''}</div>
          <div class="admin-item-actions">
            <button class="btn-edit" onclick="openEditModal('${type}', ${item.id})"><i class="fas fa-edit"></i></button>
            <button class="btn-delete" onclick="deleteItem('${type}', ${item.id})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error(`Error loading ${type}:`, err);
  }
}

function openAddModal(type) {
  document.getElementById('adminModalTitle').textContent = `Добавить ${getTypeLabel(type)}`;
  document.getElementById('adminForm').dataset.type = type;
  document.getElementById('adminForm').dataset.id = '';
  document.getElementById('adminFormFields').innerHTML = getFormFields(type);
  initRichEditors(document.getElementById('adminFormFields'));
  document.getElementById('adminModal').classList.add('show');
}

function openEditModal(type, id) {
  document.getElementById('adminModalTitle').textContent = `Редактировать ${getTypeLabel(type)}`;
  document.getElementById('adminForm').dataset.type = type;
  document.getElementById('adminForm').dataset.id = id;
  document.getElementById('adminFormFields').innerHTML = getFormFields(type, true);
  document.getElementById('adminModal').classList.add('show');

  // Load data
  fetch(`/api/${type}/${id}`, {
    headers: getAuthHeaders()
  })
    .then(r => r.json())
    .then(data => {
      const item = data.article || data;
      Object.keys(item).forEach(key => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
          if (input.type === 'checkbox') input.checked = !!item[key];
          else input.value = item[key] || '';
        }
      });
      initRichEditors(document.getElementById('adminFormFields'));
      // Show current file
      const filePath = item.filePath || item.photo;
      if (filePath) {
        const container = document.getElementById('adminFormFields');
        const displayName = filePath.replace(/^\d+-\d+-/, '');
        const isImage = /\.(png|jpe?g|gif|svg|webp)$/i.test(filePath);
        const el = document.createElement('div');
        el.innerHTML = `
          <div class="current-file-card">
            <div class="current-file-info">
              <div class="current-file-icon"><i class="fas ${isImage ? 'fa-image' : 'fa-file-lines'}"></i></div>
              <div class="current-file-text">
                <div class="current-file-label">Текущий файл</div>
                <div class="current-file-name" title="${displayName}">${displayName}</div>
              </div>
            </div>
            <a href="/api/download/${encodeURIComponent(filePath.replace(/^\/uploads\//, ''))}" class="current-file-download" download><i class="fas fa-download"></i> Скачать</a>
          </div>`;
        container.insertBefore(el, container.firstChild);
      }
    })
    .catch(console.error);
}

function getTypeLabel(type) {
  const labels = { articles: 'статью', news: 'новость', schedule: 'расписание', instructors: 'инструктора', reviews: 'отзыв', admins: 'администратора' };
  return labels[type] || type;
}

function getFormFields(type, isEdit) {
  switch (type) {
    case 'articles':
      return `
        <div class="form-group">
          <label>Заголовок</label>
          <input type="text" name="title" class="form-input" required>
        </div>
        <div class="form-group">
          <label>Текст статьи</label>
          <textarea name="content" class="form-input" rows="8" data-rich placeholder="Текст статьи..."></textarea>
        </div>
        <div class="form-group">
          <label>${isEdit ? 'Заменить файл' : 'Файл для скачивания'}</label>
          <input type="file" name="file" class="form-input">
          ${isEdit ? '<label style="font-size:0.85rem;color:var(--text-light);display:flex;align-items:center;gap:6px;margin-top:4px"><input type="checkbox" name="removeFile" value="1"> Удалить текущий файл</label>' : ''}
        </div>
      `;
    case 'news':
      return `
        <div class="form-group">
          <label>Заголовок</label>
          <input type="text" name="title" class="form-input" required>
        </div>
        <div class="form-group">
          <label>Текст новости</label>
          <textarea name="content" class="form-input" rows="5" data-rich placeholder="Текст новости..."></textarea>
        </div>
        <div class="form-group">
          <label>${isEdit ? 'Заменить файл' : 'Файл для скачивания'}</label>
          <input type="file" name="file" class="form-input">
          ${isEdit ? '<label style="font-size:0.85rem;color:var(--text-light);display:flex;align-items:center;gap:6px;margin-top:4px"><input type="checkbox" name="removeFile" value="1"> Удалить текущий файл</label>' : ''}
        </div>
      `;
    case 'schedule':
      return `
        <div class="form-group">
          <label>День недели</label>
          <select name="dayOfWeek" class="form-input" required>
            <option value="Понедельник">Понедельник</option>
            <option value="Вторник">Вторник</option>
            <option value="Среда">Среда</option>
            <option value="Четверг">Четверг</option>
            <option value="Пятница">Пятница</option>
            <option value="Суббота">Суббота</option>
            <option value="Воскресенье">Воскресенье</option>
          </select>
        </div>
        <div class="form-group">
          <label>Время</label>
          <input type="text" name="time" class="form-input" placeholder="18:00-19:30" required>
        </div>
        <div class="form-group">
          <label>Группа</label>
          <input type="text" name="group_name" class="form-input" placeholder="Дети 7-12 лет">
        </div>
        <div class="form-group">
          <label>Описание</label>
          <input type="text" name="description" class="form-input">
        </div>
        <div class="form-group">
          <label>Сезон</label>
          <select name="isSummer" class="form-input">
            <option value="0">Зима</option>
            <option value="1">Лето</option>
          </select>
        </div>
      `;
    case 'instructors':
      return `
        <div class="form-group">
          <label>Имя</label>
          <input type="text" name="name" class="form-input" required>
        </div>
        <div class="form-group">
          <label>Звание / Должность</label>
          <input type="text" name="title" class="form-input" placeholder="5 дан, мастер спорта">
        </div>
        <div class="form-group">
          <label>Фото</label>
          <input type="file" name="photo" class="form-input" accept="image/*">
        </div>
        <div class="form-group">
          <label>Описание</label>
          <textarea name="description" class="form-input" rows="4" data-rich placeholder="Описание..."></textarea>
        </div>
      `;
    case 'reviews':
      return `
        <div class="form-group">
          <label>Автор</label>
          <input type="text" name="author" class="form-input" required>
        </div>
        <div class="form-group">
          <label>Текст отзыва</label>
          <textarea name="text" class="form-input" rows="6" required></textarea>
        </div>
        <div class="form-group">
          <label>Фото</label>
          <input type="file" name="photo" class="form-input" accept="image/*">
        </div>
      `;
    case 'admins':
      return `
        <div class="form-group">
          <label>Логин</label>
          <input type="text" name="login" class="form-input" required>
        </div>
        <div class="form-group">
          <label>Пароль</label>
          <input type="password" name="password" class="form-input" ${isEdit ? '' : 'required'}>
          ${isEdit ? '<span style="font-size:0.8rem;color:#888">Оставьте пустым, чтобы не менять</span>' : ''}
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="superAdmin" value="1"> Супер-администратор
          </label>
        </div>
      `;
    default:
      return '';
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const type = document.getElementById('adminForm').dataset.type;
  const id = document.getElementById('adminForm').dataset.id;
  const isEdit = !!id;
  const noFileTypes = ['schedule', 'admins'];

  try {
    let url = `/api/${type}`;
    let method = 'POST';

    if (isEdit) url += `/${id}`;

    if (noFileTypes.includes(type)) {
      const data = {};
      new FormData(e.target).forEach((v, k) => { data[k] = v; });
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Save failed');
    } else {
      const formData = new FormData(e.target);
      if (isEdit) {
        method = 'PUT';
      }
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: formData
      });
      if (!res.ok) throw new Error('Save failed');
    }

    document.getElementById('adminModal').classList.remove('show');
    loadTabData(type);
  } catch (err) {
    alert('Ошибка сохранения');
  }
}

async function deleteItem(type, id) {
  if (!confirm('Удалить этот элемент?')) return;
  try {
    const res = await fetch(`/api/${type}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Delete failed');
    loadTabData(type);
  } catch (err) {
    alert('Ошибка удаления');
  }
}

async function loadDebugInfo() {
  const div = document.getElementById('debugInfo');
  try {
    const [articles, news, schedule, instructors, reviews] = await Promise.all([
      fetch('/api/articles').then(r => r.json()),
      fetch('/api/news').then(r => r.json()),
      fetch('/api/schedule').then(r => r.json()),
      fetch('/api/instructors').then(r => r.json()),
      fetch('/api/reviews').then(r => r.json())
    ]);
    div.innerHTML = `
      <div class="debug-grid">
        <div class="debug-card">
          <div class="debug-label">Администратор</div>
          <div class="debug-value">${currentUser.login} ${currentUser.superAdmin ? '(super)' : ''}</div>
        </div>
        <div class="debug-card">
          <div class="debug-label">Статьи</div>
          <div class="debug-value">${articles.length}</div>
        </div>
        <div class="debug-card">
          <div class="debug-label">Новости</div>
          <div class="debug-value">${news.length}</div>
        </div>
        <div class="debug-card">
          <div class="debug-label">Расписание</div>
          <div class="debug-value">${schedule.length}</div>
        </div>
        <div class="debug-card">
          <div class="debug-label">Инструкторы</div>
          <div class="debug-value">${instructors.length}</div>
        </div>
        <div class="debug-card">
          <div class="debug-label">Отзывы</div>
          <div class="debug-value">${reviews.length}</div>
        </div>
      </div>
    `;
  } catch (err) {
    div.innerHTML = '<div class="debug-card"><div class="debug-label">Ошибка</div><div class="debug-value">' + err.message + '</div></div>';
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' });
}
