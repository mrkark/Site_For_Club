async function fetchAPI(url) {
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(url + sep + '_t=' + Date.now());
  return res.json();
}
