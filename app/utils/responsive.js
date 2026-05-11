const mobileQuery = window.matchMedia('(max-width: 768px), (pointer: coarse)');

export function isMobile() {
  return mobileQuery.matches;
}

export function onMobileChange(cb) {
  const handler = (e) => cb(e.matches);
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', handler);
  else mobileQuery.addListener(handler);
  return () => {
    if (mobileQuery.removeEventListener) mobileQuery.removeEventListener('change', handler);
    else mobileQuery.removeListener(handler);
  };
}

// Marque le body pour styles conditionnels
if (isMobile()) document.body.classList.add('is-mobile');
onMobileChange((m) => document.body.classList.toggle('is-mobile', m));
