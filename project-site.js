// The specimen project site's register form (project-site.html). A demonstration: it checks what is typed and shows the
// confirmation a buyer would see, on the page. Nothing is sent, stored or counted, and the page's policy (form-action
// 'none', connect-src 'self') would refuse it anyway.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('psForm');
  if (!form) return;
  const done = document.getElementById('psDone'), say = document.getElementById('psSay');
  const f = form.elements;
  const checks = [
    [f.name, (v) => v.trim() ? '' : 'Please write your name.'],
    [f.email, (v) => !v.trim() ? 'Please write your email address.' : /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v.trim()) ? '' : 'This email address looks incomplete.'],
    [f.want, (v) => v ? '' : 'Please choose a residence, or Not sure yet.'],
  ];
  const mark = (el, msg) => {
    const err = document.getElementById(el.getAttribute('aria-describedby'));
    err.textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    return !msg;
  };
  // a field already marked answers as it is corrected, not before the first try
  checks.forEach(([el, test]) => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { if (el.hasAttribute('aria-invalid')) mark(el, test(el.value)); }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = checks.filter(([el, test]) => !mark(el, test(el.value)));
    if (bad.length) {
      say.textContent = bad.length === 1 ? 'One field needs an answer.' : bad.length + ' fields need an answer.';
      bad[0][0].focus();
      return;
    }
    const first = f.name.value.trim().split(/\s+/)[0], as = f.as.value, want = f.want.value;
    const what = { 'One bedroom': 'the one-bedroom plans', 'Two bedrooms': 'the two-bedroom plans', 'Three bedrooms': 'the three-bedroom plans', 'A penthouse': 'the penthouse plans' }[want] || 'the plans for every residence';
    document.getElementById('psThanks').textContent = 'Thank you, ' + first + '.';
    document.getElementById('psNext').textContent = as === 'broker'
      ? 'On a live site, the sales gallery would write within one business day with the broker kit, ' + what + ' and a co-op registration to sign.'
      : 'On a live site, the sales gallery would write within one business day with ' + what + ' and the current price list' + (as === 'both' ? ', and copy your broker once you name them.' : '.');
    form.hidden = true;
    done.hidden = false;
    say.textContent = '';
    done.focus();
  });

  document.getElementById('psAgain').addEventListener('click', () => {
    form.reset();
    checks.forEach(([el]) => mark(el, ''));
    done.hidden = true;
    form.hidden = false;
    f.name.focus();
  });

  // Register as a broker: the form opens with A broker chosen
  document.querySelectorAll('a[data-as]').forEach((a) => a.addEventListener('click', () => {
    const r = form.querySelector('input[name="as"][value="' + a.dataset.as + '"]');
    if (r && !form.hidden) r.checked = true;
  }));
});
