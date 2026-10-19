(function(){
  // A page missing under /es/ or /pt/ is answered in that language: its header, text and footer come from the template below.
  var l=/^\/(es|pt)\//.exec(location.pathname),t=l&&document.getElementById('nf-'+l[1]);
  if(!t)return;
  var d=t.content,put=function(sel,k){var n=document.importNode(d.querySelector('[data-p="'+k+'"]'),true);document.querySelector(sel).replaceChildren.apply(document.querySelector(sel),[].slice.call(n.childNodes))};
  document.documentElement.lang=l[1]==='pt'?'pt-BR':'es';
  document.title=d.querySelector('title').textContent;
  document.querySelector('.skip').textContent=d.querySelector('[data-p="skip"]').textContent;
  put('header.site','header');put('.lot .txt','txt');put('.vacant figcaption','cap');put('footer','footer');
})();
