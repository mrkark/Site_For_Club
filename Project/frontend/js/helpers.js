function fileUrl(fp) {
  if (!fp) return '';
  return '/api/download/' + encodeURIComponent(fp.replace(/^\/uploads\//, ''));
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
}
