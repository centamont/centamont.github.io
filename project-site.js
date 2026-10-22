// The specimen project site's register form (project-site.html). A demonstration: it checks what is typed and shows the
// confirmation a buyer would see, on the page. Nothing is sent, stored or counted, and the page's policy (form-action
// 'none', connect-src 'self') would refuse it anyway. It answers in the page's language, from <html lang>.
// the form's words in each language; the residence types follow the select's options, in order
const WORDS = {
  en: {
    name: 'Please write your name.', email: 'Please write your email address.', bad: 'This email address looks incomplete.',
    want: 'Please choose a residence, or Not sure yet.', one: 'One field needs an answer.', many: (n) => n + ' fields need an answer.',
    plans: ['the one-bedroom plans', 'the two-bedroom plans', 'the three-bedroom plans', 'the penthouse plans'], all: 'the plans for every residence',
    thanks: (n) => 'Thank you, ' + n + '.',
    broker: (w) => 'On a live site, the sales gallery would write within one business day with the broker kit, ' + w + ' and a co-op registration to sign.',
    buyer: (w, both) => 'On a live site, the sales gallery would write within one business day with ' + w + ' and the current price list' + (both ? ', and copy your broker once you name them.' : '.'),
  },
  es: {
    name: 'Escriba su nombre.', email: 'Escriba su correo electrónico.', bad: 'Este correo electrónico parece incompleto.',
    want: 'Elija una residencia, o Aún no lo sé.', one: 'Falta responder un campo.', many: (n) => 'Falta responder ' + n + ' campos.',
    plans: ['los planos de un dormitorio', 'los planos de dos dormitorios', 'los planos de tres dormitorios', 'los planos de los penthouses'], all: 'los planos de todas las residencias',
    thanks: (n) => 'Gracias, ' + n + '.',
    broker: (w) => 'En un sitio real, la galería de ventas le escribiría en un día hábil con el kit para corredores, ' + w + ' y un registro de colaboración para firmar.',
    buyer: (w, both) => 'En un sitio real, la galería de ventas le escribiría en un día hábil con ' + w + ' y la lista de precios vigente' + (both ? ', y pondría en copia a su corredor en cuanto nos diga quién es.' : '.'),
  },
  pt: {
    name: 'Escreva o seu nome.', email: 'Escreva o seu e-mail.', bad: 'Este e-mail parece incompleto.',
    want: 'Escolha uma residência, ou Ainda não sei.', one: 'Um campo precisa de resposta.', many: (n) => n + ' campos precisam de resposta.',
    plans: ['as plantas de um quarto', 'as plantas de dois quartos', 'as plantas de três quartos', 'as plantas das coberturas'], all: 'as plantas de todas as residências',
    thanks: (n) => 'Obrigado, ' + n + '.',
    broker: (w) => 'Num site real, a central de vendas escreveria em até um dia útil com o kit para corretores, ' + w + ' e um cadastro de cooperação para assinar.',
    buyer: (w, both) => 'Num site real, a central de vendas escreveria em até um dia útil com ' + w + ' e a tabela de preços atual' + (both ? ', com cópia para o seu corretor assim que você disser quem é.' : '.'),
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('psForm');
  if (!form) return;
  const done = document.getElementById('psDone'), say = document.getElementById('psSay');
  const f = form.elements;
  const W = WORDS[(document.documentElement.lang || 'en').slice(0, 2)] || WORDS.en;
  const checks = [
    [f.name, (v) => v.trim() ? '' : W.name],
    [f.email, (v) => !v.trim() ? W.email : /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v.trim()) ? '' : W.bad],
    [f.want, (v) => v ? '' : W.want],
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
      say.textContent = bad.length === 1 ? W.one : W.many(bad.length);
      bad[0][0].focus();
      return;
    }
    // the options after Choose one: four residence types, then Not sure yet
    const first = f.name.value.trim().split(/\s+/)[0], as = f.as.value, what = W.plans[f.want.selectedIndex - 1] || W.all;
    document.getElementById('psThanks').textContent = W.thanks(first);
    document.getElementById('psNext').textContent = as === 'broker' ? W.broker(what) : W.buyer(what, as === 'both');
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
