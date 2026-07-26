// Wraps every textarea[data-rich] inside `root` with a Quill WYSIWYG editor.
// By default the admin sees a formatted editor (no visible HTML tags). A
// "HTML" toggle button lets them switch to the raw markup when they need to
// do something the toolbar can't, e.g. paste a custom <img> tag.
let __richEditorSeq = 0;

function initRichEditors(root) {
  if (typeof Quill === 'undefined') return;

  root.querySelectorAll('textarea[data-rich]').forEach(textarea => {
    if (textarea.dataset.richInit) return;
    textarea.dataset.richInit = '1';

    const id = 'rich-' + (__richEditorSeq++);
    const initialValue = textarea.value || '';

    const wrapper = document.createElement('div');
    wrapper.className = 'rich-editor';

    const toolbarRow = document.createElement('div');
    toolbarRow.className = 'rich-editor-toprow';
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'rich-editor-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-code"></i> HTML-код';
    toolbarRow.appendChild(toggleBtn);

    const editorEl = document.createElement('div');
    editorEl.className = 'rich-editor-quill';
    editorEl.id = id;

    textarea.classList.add('rich-editor-source');
    textarea.style.display = 'none';

    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.appendChild(toolbarRow);
    wrapper.appendChild(editorEl);
    wrapper.appendChild(textarea);

    const Font = Quill.import('formats/font');
    Font.whitelist = ['sans-serif', 'serif', 'monospace', 'mincho'];
    Quill.register(Font, true);

    const quill = new Quill(editorEl, {
      theme: 'snow',
      placeholder: textarea.placeholder || '',
      modules: {
        toolbar: [
          [{ font: Font.whitelist }],
          [{ size: ['small', false, 'large', 'huge'] }],
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link', 'image'],
          ['clean']
        ]
      }
    });

    quill.root.innerHTML = initialValue;

    quill.on('text-change', () => {
      textarea.value = quill.root.innerHTML;
    });

    let showingHtml = false;
    toggleBtn.addEventListener('click', () => {
      showingHtml = !showingHtml;
      if (showingHtml) {
        // Switch to raw HTML source editing
        textarea.value = quill.root.innerHTML;
        editorEl.style.display = 'none';
        textarea.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Визуально';
        toggleBtn.classList.add('active');
      } else {
        // Sync any manual HTML edits back into the visual editor
        quill.root.innerHTML = textarea.value;
        textarea.style.display = 'none';
        editorEl.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-code"></i> HTML-код';
        toggleBtn.classList.remove('active');
      }
    });
  });
}
