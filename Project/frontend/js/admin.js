let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('/api/admin/session');
  const data = await res.json();
  if (!data.authenticated) {
    window.location.href = '/';
    return;
  }
  currentUser = data.admin;
  document.getElementById('adminUserBadge').textContent = `👤 ${data.admin.login}`;

  if (!data.admin.superAdmin) {
    document.getElementById('adminsTab').style.display = 'none';
  }

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
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
  if (currentUser.superAdmin) loadTabData('admins');
  loadDebugInfo();
});

async function loadTabData(type) {
  try {
    const res = await fetch(`/api/${type}`);
    const data = await res.json();
    const list = document.getElementById(`${type}List`);

    if (data.length === 0) {
      list.innerHTML = '<p style="color:#888;padding:20px;text-align:center">Нет данных</p>';
      return;
    }

    list.innerHTML = data.map(item => {
      let title = item.name || item.title || item.login || item.dayOfWeek || '';
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
  document.getElementById('adminModal').classList.add('show');
  initEditor();
}

function openEditModal(type, id) {
  document.getElementById('adminModalTitle').textContent = `Редактировать ${getTypeLabel(type)}`;
  document.getElementById('adminForm').dataset.type = type;
  document.getElementById('adminForm').dataset.id = id;
  document.getElementById('adminFormFields').innerHTML = getFormFields(type, true);
  document.getElementById('adminModal').classList.add('show');
  initEditor();

  // Load data
  fetch(`/api/${type}/${id}`)
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
      // Sync textarea value to editor
      const editorEl = document.getElementById('editorContent');
      const textarea = document.querySelector('[name="content"]');
      if (editorEl && textarea && textarea.value) {
        editorEl.innerHTML = textarea.value;
      }
      // Show current file
      const filePath = item.filePath || item.photo;
      if (filePath) {
        const container = document.getElementById('adminFormFields');
        const displayName = filePath.replace(/^\d+-\d+-/, '');
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(139,0,0,0.06);border:1px solid rgba(139,0,0,0.12);border-radius:6px;margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:10px">
              <i class="fas fa-file" style="color:var(--accent);font-size:1.2rem"></i>
              <span style="color:var(--text);font-size:0.9rem">${displayName}</span>
            </div>
            <a href="/api/download/${encodeURIComponent(filePath.replace(/^\/uploads\//, ''))}" style="color:var(--gold);padding:6px 12px;border:1px solid var(--gold);border-radius:4px;text-decoration:none;font-size:0.8rem" download><i class="fas fa-download"></i> Скачать</a>
          </div>`;
        container.insertBefore(el, container.firstChild);
      }
    })
    .catch(console.error);
}

function getTypeLabel(type) {
  const labels = { articles: 'статью', news: 'новость', schedule: 'расписание', instructors: 'инструктора', admins: 'администратора' };
  return labels[type] || type;
}

function getFormFields(type, isEdit) {
  switch (type) {
    case 'articles':
    case 'news':
      return `
        <div class="form-group">
          <label>Заголовок</label>
          <input type="text" name="title" class="form-input" required>
        </div>
        <div class="form-group">
          <label>Текст</label>
          <div class="editor-toolbar" id="editorToolbar">
            <button type="button" data-cmd="bold" title="Жирный"><i class="fas fa-bold"></i></button>
            <button type="button" data-cmd="italic" title="Курсив"><i class="fas fa-italic"></i></button>
            <button type="button" data-cmd="underline" title="Подчеркнутый"><i class="fas fa-underline"></i></button>
            <button type="button" data-cmd="strikeThrough" title="Зачеркнутый"><i class="fas fa-strikethrough"></i></button>
            <span class="editor-sep"></span>
            <select data-cmd="fontName" title="Шрифт">
              <option value="Roboto,sans-serif">Roboto</option>
              <option value="Noto Sans JP,sans-serif">Noto Sans JP</option>
              <option value="Oswald,sans-serif">Oswald</option>
              <option value="Georgia,serif">Georgia</option>
              <option value="'Courier New',monospace">Courier New</option>
            </select>
            <select data-cmd="fontSize" title="Размер">
              <option value="3">Нормальный</option>
              <option value="1">Очень мелкий</option>
              <option value="2">Мелкий</option>
              <option value="4">Крупный</option>
              <option value="5">Очень крупный</option>
              <option value="6">Огромный</option>
              <option value="7">Максимальный</option>
            </select>
            <span class="editor-sep"></span>
            <input type="color" data-cmd="foreColor" title="Цвет текста" value="#1a1a1a">
            <span class="editor-sep"></span>
            <button type="button" data-cmd="insertUnorderedList" title="Список"><i class="fas fa-list-ul"></i></button>
            <button type="button" data-cmd="insertOrderedList" title="Нумерованный список"><i class="fas fa-list-ol"></i></button>
            <span class="editor-sep"></span>
            <button type="button" data-cmd="justifyLeft" title="По левому краю"><i class="fas fa-align-left"></i></button>
            <button type="button" data-cmd="justifyCenter" title="По центру"><i class="fas fa-align-center"></i></button>
            <button type="button" data-cmd="justifyRight" title="По правому краю"><i class="fas fa-align-right"></i></button>
            <span class="editor-sep"></span>
            <button type="button" data-cmd="createLink" title="Ссылка"><i class="fas fa-link"></i></button>
            <button type="button" data-cmd="formatBlock" title="Цитата" data-value="blockquote"><i class="fas fa-quote-right"></i></button>
            <span class="editor-sep"></span>
            <button type="button" data-cmd="undo" title="Отменить"><i class="fas fa-undo"></i></button>
            <button type="button" data-cmd="redo" title="Повторить"><i class="fas fa-redo"></i></button>
          </div>
          <div class="editor-content" contenteditable="true" id="editorContent"></div>
          <textarea name="content" class="form-input editor-textarea" style="display:none"></textarea>
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
          <textarea name="description" class="form-input" rows="4"></textarea>
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
  // Sync editor content to hidden textarea
  const editorEl = document.getElementById('editorContent');
  const textarea = document.querySelector('[name="content"]');
  if (editorEl && textarea) textarea.value = editorEl.innerHTML;

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Save failed');
    } else {
      const formData = new FormData(e.target);
      if (isEdit) {
        method = 'PUT';
      }
      const res = await fetch(url, { method, body: formData });
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
    const res = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    loadTabData(type);
  } catch (err) {
    alert('Ошибка удаления');
  }
}

async function loadDebugInfo() {
  const div = document.getElementById('debugInfo');
  try {
    const [articles, news, schedule, instructors] = await Promise.all([
      fetch('/api/articles').then(r => r.json()),
      fetch('/api/news').then(r => r.json()),
      fetch('/api/schedule').then(r => r.json()),
      fetch('/api/instructors').then(r => r.json())
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

/* ===== Rich Text Editor ===== */
function initEditor() {
  const toolbar = document.getElementById('editorToolbar');
  const editor = document.getElementById('editorContent');
  if (!toolbar || !editor) return;

  document.execCommand('defaultParagraphSeparator', false, 'p');
  document.execCommand('styleWithCSS', false, true);

  editor.removeEventListener('mouseup', updateEditorUI);
  editor.removeEventListener('keyup', updateEditorUI);
  editor.addEventListener('mouseup', updateEditorUI);
  editor.addEventListener('keyup', updateEditorUI);

  toolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = newBtn.dataset.cmd;
      const value = newBtn.dataset.value || null;
      if (cmd === 'createLink') {
        const url = prompt('Введите URL:', 'https://');
        if (url) document.execCommand(cmd, false, url);
      } else {
        document.execCommand(cmd, false, value);
      }
      editor.focus();
    });
  });

  toolbar.querySelectorAll('select[data-cmd]').forEach(sel => {
    const newSel = sel.cloneNode(true);
    sel.parentNode.replaceChild(newSel, sel);
    newSel.addEventListener('change', () => {
      document.execCommand(newSel.dataset.cmd, false, newSel.value);
      editor.focus();
    });
  });

  toolbar.querySelectorAll('input[type="color"]').forEach(input => {
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    newInput.addEventListener('change', () => {
      document.execCommand(newInput.dataset.cmd, false, newInput.value);
      editor.focus();
    });
  });
}

function updateEditorUI() {
  const toolbar = document.getElementById('editorToolbar');
  if (!toolbar) return;
  toolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
    const cmd = btn.dataset.cmd;
    if (['bold', 'italic', 'underline', 'strikeThrough'].includes(cmd)) {
      try { btn.classList.toggle('active', document.queryCommandState(cmd)); } catch (_) {}
    }
  });
}
