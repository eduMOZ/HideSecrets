// ?theme=light|dark and ?size=<px>: one template, several renderings
(function () {
  var q = new URLSearchParams(location.search);
  document.documentElement.dataset.theme = q.get('theme') || document.documentElement.dataset.theme || 'light';
  if (q.get('size')) document.documentElement.style.setProperty('--size', q.get('size') + 'px');
})();
