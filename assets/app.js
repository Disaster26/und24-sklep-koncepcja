/* UND24 - koncepcja sklepu, logika demonstracyjna (bez backendu) */
(function(){
'use strict';
var D=null, CATS={}, BY={};
var NAV={rocznice:'Medale rocznicowe',symbole:'Medale z symbolem',breloki:'Breloki',bizuteria:'Bransoletki i opaski',znaczki:'Znaczki i przypinki',grupy:'Dla grup',dodatki:'Etui, prezenty i odzież',patriotyczne:'Ryngrafy'};
var SHIP=[
  {id:'inpost',name:'InPost Paczkomat 24/7',note:'Odbiór w wybranym paczkomacie',price:19},
  {id:'dpd',name:'Kurier DPD',note:'Dostawa pod wskazany adres',price:20},
  {id:'pp-eko',name:'Poczta Polska - list polecony ekonomiczny',note:'Dla drobnych przedmiotów',price:10.5},
  {id:'pp-prio',name:'Poczta Polska - list polecony priorytetowy',note:'Szybsza wersja listu poleconego',price:13.5},
  {id:'dpd-cod',name:'Kurier DPD - za pobraniem',note:'Płacisz kurierowi przy odbiorze',price:29}
];
var MINSHIP=10.5;

/* ---------- pamięć (localStorage z zabezpieczeniem) ---------- */
var mem={};
function sget(k,s){try{var st=s?sessionStorage:localStorage;var v=st.getItem(k);return v===null?(mem[k]||null):v}catch(e){return mem[k]||null}}
function sset(k,v,s){mem[k]=v;try{(s?sessionStorage:localStorage).setItem(k,v)}catch(e){}}
function sdel(k,s){delete mem[k];try{(s?sessionStorage:localStorage).removeItem(k)}catch(e){}}

/* ---------- pomocnicze ---------- */
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function zl(n){return n==null?'':n.toFixed(2).replace('.',',')+' zł'}
function qp(n){return new URLSearchParams(location.search).get(n)}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ł/g,'l')}
function pUrl(p,v){return 'produkt.html?id='+p.id+(v!=null&&v!==''?'&w='+v:'')}
function stCls(s){return s==='Ostatnie sztuki'?'st low':(s==='Na zamówienie'?'st ord':'st')}
function vImg(p,v){if(p.variant&&p.variant.imgs&&v!=null&&p.imgs[v])return p.imgs[v];return p.imgs[0]}
function vName(p,v){return p.variant&&v!=null&&v!==''?p.variant.options[v]:''}
function toast(t){var el=$('.toast');if(!el){el=document.createElement('div');el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove('on')},2400)}

/* ---------- ikony rysowane własną kreską (bez bibliotek) ---------- */
var IC={
  search:'<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L22 22"/></svg>',
  user:'<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="13" cy="9" r="4.6"/><path d="M4.5 22.5c1.4-4.4 4.6-6.6 8.5-6.6s7.1 2.2 8.5 6.6"/></svg>',
  bag:'<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M5 9h16l-1.3 13H6.3z"/><path d="M9.2 9V7.6a3.8 3.8 0 0 1 7.6 0V9"/></svg>',
  menu:'<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4 7h18M4 13h18M4 19h12"/></svg>'
};

/* ---------- koszyk ---------- */
function cartGet(){try{var c=JSON.parse(sget('und24_cart')||'[]');return Array.isArray(c)?c:[]}catch(e){return []}}
function cartSet(c){sset('und24_cart',JSON.stringify(c));renderCartBadge();document.dispatchEvent(new CustomEvent('cart'))}
function cartAdd(id,v,q){var c=cartGet();var key=id+'|'+(v==null?'':v);var it=c.find(function(x){return x.key===key});if(it)it.qty=Math.min(99,it.qty+q);else c.push({key:key,id:id,v:v==null?'':v,qty:q});cartSet(c)}
function cartQty(key,q){var c=cartGet();c.forEach(function(x){if(x.key===key)x.qty=Math.max(1,Math.min(99,q))});cartSet(c)}
function cartRm(key){cartSet(cartGet().filter(function(x){return x.key!==key}))}
function cartLines(){return cartGet().map(function(x){var p=BY[x.id];if(!p||p.price==null)return null;return {key:x.key,p:p,v:x.v,qty:x.qty,sum:p.price*x.qty}}).filter(Boolean)}
function cartTotal(){return cartLines().reduce(function(a,l){return a+l.sum},0)}
function cartCount(){return cartLines().reduce(function(a,l){return a+l.qty},0)}
function renderCartBadge(){if(!D)return;$$('.cart-n').forEach(function(e){e.textContent=cartCount()});$$('.cart-sum').forEach(function(e){e.textContent=zl(cartTotal())})}

/* ---------- logo ---------- */
function logo(){return '<a class="logo" href="index.html" aria-label="UND24 - upominek nowej drogi, strona główna"><span class="logo-top"><span class="logo-und">UND</span><span class="logo-24">24</span></span><span class="logo-tag">upominek nowej drogi</span></a>'}

/* ---------- nagłówek / stopka ---------- */
function header(){
  var cur=qp('k'), page=document.body.dataset.page;
  var nav=Object.keys(NAV).map(function(k){return '<li><a href="kategoria.html?k='+k+'"'+(page==='kategoria'&&cur===k?' aria-current="page"':'')+'>'+NAV[k]+'</a></li>'}).join('');
  var srch='<form class="search" role="search" action="kategoria.html"><label class="sr" for="q-%">Szukaj produktów</label><input id="q-%" name="q" type="search" autocomplete="off" placeholder="Szukaj: medal, brelok, opaska" value="'+esc(qp('q')||'')+'"><button type="submit" aria-label="Szukaj">'+IC.search+'</button><div class="sugg" role="listbox"></div></form>';
  var h=''+
  '<div class="topbar"><div class="wrap"><span>Wysyłka w <b>1-2 dni robocze</b></span><span>BLIK, Przelewy24, przelew lub pobranie</span><span>14 dni na zwrot</span><span>Tel. 669 540 932, pon.-pt. 8-16</span></div></div>'+
  '<header class="hdr"><div class="wrap"><div class="hdr-row">'+
   '<button class="hbtn burger" type="button" aria-label="Otwórz menu" aria-expanded="false">'+IC.menu+'</button>'+
   logo()+ srch.replace(/%/g,'d')+
   '<div class="hdr-act"><a class="hbtn" href="konto.html" aria-label="Moje konto">'+IC.user+'<span class="lbl">Konto</span></a>'+
   '<button class="hbtn js-cart" type="button" aria-label="Koszyk"><span class="cart-ico">'+IC.bag+'<span class="cart-n">0</span></span><span class="lbl cart-sum">0,00 zł</span></button></div>'+
  '</div><div class="msearch">'+srch.replace(/%/g,'m')+'</div></div>'+
  '<nav class="nav" aria-label="Kategorie"><div class="wrap"><ul>'+nav+'</ul></div></nav></header>'+
  '<div class="mnav" aria-hidden="true"><div class="shade"></div><div class="panel" role="dialog" aria-label="Menu"><div class="mnav-h">'+logo()+'<button class="x" type="button" aria-label="Zamknij menu">&times;</button></div><ul>'+
   Object.keys(NAV).map(function(k){var n=D.products.filter(function(p){return p.cat===k}).length;return '<li><a href="kategoria.html?k='+k+'"'+(page==='kategoria'&&cur===k?' aria-current="page"':'')+'>'+CATS[k].name+' <span>'+n+'</span></a></li>'}).join('')+
   '<li><a href="informacje.html#dostawa">Dostawa i płatności</a></li><li><a href="informacje.html#hurt">Zamówienia hurtowe</a></li><li><a href="konto.html">Moje konto</a></li></ul>'+
   '<div class="mnav-f"><b>Obsługa klienta, pon.-pt. 8-16</b><br>Tel. <a href="tel:+48669540932">669 540 932</a> lub <a href="tel:+48509798144">509 798 144</a><br>sklep@und24.pl</div></div></div>'+
  '<div class="drawer" aria-hidden="true"><div class="shade"></div><aside class="panel" role="dialog" aria-label="Koszyk"><div class="dr-h"><b>Twój koszyk</b><button class="x" type="button" aria-label="Zamknij koszyk">&times;</button></div><div class="dr-added">Dodano do koszyka</div><div class="dr-list"></div><div class="dr-f"></div></aside></div>';
  $('#hdr').innerHTML=h;
}
var BADGE="<style>\n.wylinka-badge{display:inline-flex;align-items:center;gap:.4em;color:inherit;text-decoration:none;font-size:.875em;line-height:1;opacity:.85}\n.wylinka-badge:hover,.wylinka-badge:focus-visible{opacity:1}\n.wylinka-badge:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:2px}\n.wylinka-badge svg{width:18px;height:18px;flex:none;overflow:visible}\n.wylinka-badge b{font-weight:600}\n.wylinka-badge .wy-old{opacity:.45;transform-origin:40px 30px;transition:transform .32s cubic-bezier(.3,.7,.4,1),opacity .32s ease-out}\n.wylinka-badge .wy-pod{opacity:0;transition:opacity .2s ease-out .08s}\n.wylinka-badge:hover .wy-old,.wylinka-badge:focus-visible .wy-old{transform:translate(9px,7px) rotate(9deg);opacity:0}\n.wylinka-badge:hover .wy-pod,.wylinka-badge:focus-visible .wy-pod{opacity:1}\n@media (prefers-reduced-motion:reduce){.wylinka-badge .wy-old,.wylinka-badge .wy-pod{transition:none}.wylinka-badge:hover .wy-old,.wylinka-badge:focus-visible .wy-old{transform:none;opacity:.45}.wylinka-badge:hover .wy-pod,.wylinka-badge:focus-visible .wy-pod{opacity:0}}\n</style><a class=\"wylinka-badge\" href=\"https://wylinka.pl/?utm_source=und24.pl&amp;utm_medium=stopka&amp;utm_campaign=wykonanie\" rel=\"noopener\" title=\"Strona wykonana przez Wylinka\"><svg viewBox=\"0 0 64 64\" aria-hidden=\"true\" focusable=\"false\" fill=\"currentColor\"><path d=\"M9.8 22.8l-1.2-7.9 2.2-3.7 15.5 4.6-.5 1.5-7.2 5.5 4.7 15.6 5-15.6 7 0 4.1 12.7-4.2-.9-2.6 1.8-.8-2.2-5.3 15.6-4.3 0 .4 .2-2.1 2.8-1.3-1.1 1.1-1.4-3.1 .2-.1-1.7 2.2-.1-5.7-16.5-4.8 .6-.8 3.1 0 .5-.3 .5 .8 2.2-1.6 .5-.4-1.3-.8 1.6-1.5-.8 .8-1.6-1.4 .6-.6-1.6 2.3-.8 .2-.4 1.3-4.8 5.9-.8-2.4-6.9zM15.2 13.7l-.1-.4-.4 .8-.1 .8 .1 1 .1 .4 .3 .7 .3-.9 .1-.7 0-.8z\"/><path class=\"wy-pod\" d=\"M37.1 49.8l-4.5-13.3 2.6-1.8 4.2 .9 .9 2.8 3-9.7 0-.5 .1-.8 3.2-8.4 .5-1 .6-1 .9-1.1 1.3-1 1.1-.7 1.4-.5 1.4-.3 .7 0 .9 0 1.2 .3 1.4 .6 .8 .5 .7 .7 .6 .7 .5 .9 .3 .9 .1 .9 0 .8-.2 .9-.5 .9-.5 .6-.7 .5-.7 .3-.1-.1 0-.1 .5-.5 .3-.7 .2-.5 0-.6-.1-.6-.3-.7-.4-.5-.4-.4-.5-.3-.6-.3-.7 0-.7 .1-.6 .1-.5 .4-.5 .5-.3 .5-.2 .7-.1 1.5-1.4 5.1-.8 3.3-.3 .7-.5 .7-6 17.5 1.9 .1-.1 1.7-3.1-.2 1.1 1.4-1.3 1.1-2.1-2.8 .4-.2z\"/><path class=\"wy-old\" d=\"M40.8 50l.4-.2-4.1 0-4.2-12.5 2.5-1.7 4.3 .9 .6 1.9 .6-1.6 0-.3 2.4-7.8 0-.5 .1-.8 3.2-8.4 .4-.8 .6-.9 .9-1.2 .9-.9 1.3-.8 1.4-.6 1.2-.3 1.4-.1 1.3 .1 .6 .2 .8 .3 1.1 .6 .9 .7 .7 .9 .5 .9 .3 .9 .1 1.1-.1 .9-.3 .9-.4 .7-.6 .7-.6 .4-.6 .2-.1-.1 0-.1 .5-.5 .3-.7 .2-.5 0-.5-.1-.6-.2-.6-.3-.5-.4-.5-.5-.3-.6-.3-.7-.1-.6 0-.6 .1-.6 .3-.6 .5-.3 .4-.2 .5-.1 .5-.1 1.5-1.4 5.1-.8 3.3-.3 .7-.5 .7-6 17.5 1.9 .1-.1 1.7-3.1-.2 1.1 1.4-1.3 1.1zM49.6 17.1l.6 1.7-1.5 1.9 .4 .4 1.8-2.1-.7-2.1zM48.1 28.3l.5 1.8-1.7 1.8 .4 .4 1.9-2-.6-2.2zM37.9 41.7l1.7-1.5-.4-.4-1.7 1.4zM42.6 38.7l-1.5 2.8 1.1 2-1.3 2.6 .5 .2 1.5-2.8-1.1-2 1.4-2.5z\"/></svg><span>wykonanie: <b>Wylinka</b></span></a>";
function footer(){
  var y=new Date().getFullYear();
  $('#ftr').innerHTML='<footer class="ftr"><div class="wrap"><div class="ftr-g">'+
   '<div>'+logo()+'<address><b>Free Spirits sp. z o.o.</b><br>ul. Gen. Władysława Sikorskiego 162 lok. 1<br>42-202 Częstochowa<br>NIP 5732959035, KRS 0001146842<br>Tel. <a href="tel:+48669540932">669 540 932</a>, <a href="tel:+48509798144">509 798 144</a><br>sklep@und24.pl, pon.-pt. 8-16</address></div>'+
   '<div><h4>Kategorie</h4><ul>'+Object.keys(NAV).map(function(k){return '<li><a href="kategoria.html?k='+k+'">'+NAV[k]+'</a></li>'}).join('')+'</ul></div>'+
   '<div><h4>Obsługa klienta</h4><ul><li><a href="informacje.html#dostawa">Dostawa i jej koszt</a></li><li><a href="informacje.html#platnosci">Formy płatności</a></li><li><a href="informacje.html#zwroty">Zwroty i reklamacje</a></li><li><a href="informacje.html#hurt">Zamówienia hurtowe</a></li><li><a href="informacje.html#kontakt">Kontakt</a></li></ul></div>'+
   '<div><h4>Informacje</h4><ul><li><a href="index.html#o-nas">O nas</a></li><li><a href="informacje.html#regulamin">Regulamin</a></li><li><a href="informacje.html#regulamin">Polityka prywatności</a></li><li><a href="konto.html">Moje konto</a></li><li><a href="koszyk.html">Koszyk</a></li></ul></div>'+
  '</div><div class="ftr-b"><span>&copy; '+y+' Free Spirits sp. z o.o. Koncepcja nowego sklepu UND24, wersja demonstracyjna.</span>'+BADGE+'</div></div></footer>';
}

/* ---------- menu, szuflada, wyszukiwarka ---------- */
function overlay(el,on){el.classList.toggle('on',on);el.setAttribute('aria-hidden',on?'false':'true');document.documentElement.style.overflow=on?'hidden':''}
function bindChrome(){
  var mn=$('.mnav'), dr=$('.drawer');
  $('.burger').addEventListener('click',function(){overlay(mn,true);this.setAttribute('aria-expanded','true');$('.x',mn).focus()});
  $$('.shade,.x',mn).forEach(function(b){b.addEventListener('click',function(){overlay(mn,false);$('.burger').setAttribute('aria-expanded','false')})});
  $$('.js-cart').forEach(function(b){b.addEventListener('click',function(){openDrawer(false)})});
  $$('.shade,.x',dr).forEach(function(b){b.addEventListener('click',function(){overlay(dr,false)})});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){overlay(mn,false);overlay(dr,false);var f=$('.filters.on');if(f){f.classList.remove('on');document.documentElement.style.overflow=''}}});
  $$('form.search').forEach(bindSearch);
  document.addEventListener('cart',renderDrawer);
  renderCartBadge();
  var setH=function(){var h=$('.hdr'),t=$('.topbar');if(h){document.documentElement.style.setProperty('--hdr-s',h.offsetHeight+'px');document.documentElement.style.setProperty('--hdr',(h.offsetHeight+(t&&t.offsetParent?t.offsetHeight:0))+'px')}};setH();addEventListener('resize',setH);
}
function search(q){
  var t=norm(q).split(/\s+/).filter(Boolean); if(!t.length)return [];
  return D.products.map(function(p){
    var hay=norm(p.name+' '+p.sub+' '+CATS[p.cat].name+' '+p.code+' '+(p.variant?p.variant.options.join(' '):'')+' '+p.material);
    var ok=t.every(function(w){if(/^\d+$/.test(w))return new RegExp('(^|\\D)'+w+'(\\D|$)').test(hay)||hay.indexOf(w)>=0;return hay.indexOf(w)>=0||(w.length>4&&hay.indexOf(w.slice(0,-1))>=0)});
    if(!ok)return null; var s=0; t.forEach(function(w){if(norm(p.name).indexOf(w)>=0)s+=2});
    return {p:p,s:s};
  }).filter(Boolean).sort(function(a,b){return b.s-a.s}).map(function(x){return x.p});
}
function bindSearch(f){
  var inp=$('input',f), box=$('.sugg',f), act=-1;
  function draw(){
    var q=inp.value.trim(); if(q.length<2){box.classList.remove('on');return}
    var r=search(q); act=-1;
    box.innerHTML=r.length?r.slice(0,5).map(function(p){
      var y=q.match(/\b(\d{1,2})\b/), v=null;
      if(y&&p.variant&&p.variant.imgs){var n=+y[1];if(n>=1&&n<=p.variant.options.length)v=n-1}
      return '<a href="'+pUrl(p,v)+'" role="option"><img src="'+vImg(p,v)+'" alt=""><span class="s-name">'+esc(p.name)+(v!=null?' <b>('+esc(p.variant.options[v])+')</b>':'')+'</span><span class="price">'+(p.price!=null?zl(p.price):'wycena')+'</span></a>'}).join('')+
      '<a class="s-all" href="kategoria.html?q='+encodeURIComponent(q)+'">Pokaż wszystkie wyniki ('+r.length+')</a>':'<div class="s-none">Brak wyników dla "'+esc(q)+'". Spróbuj: medal, brelok, opaska, dromader.</div>';
    box.classList.add('on');
  }
  inp.addEventListener('input',draw); inp.addEventListener('focus',draw);
  inp.addEventListener('keydown',function(e){var a=$$('a',box);if(!a.length)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();act=(act+(e.key==='ArrowDown'?1:-1)+a.length)%a.length;a.forEach(function(x,i){x.classList.toggle('act',i===act)})}else if(e.key==='Enter'&&act>=0){e.preventDefault();location.href=a[act].href}});
  document.addEventListener('click',function(e){if(!f.contains(e.target))box.classList.remove('on')});
}
function lineHTML(l,small){
  var vn=vName(l.p,l.v);
  return '<div class="li" data-key="'+esc(l.key)+'"><a href="'+pUrl(l.p,l.v)+'"><img src="'+vImg(l.p,l.v)+'" alt="'+esc(l.p.name)+'" loading="lazy"></a><div><a class="li-n" href="'+pUrl(l.p,l.v)+'">'+esc(l.p.name)+'</a>'+(vn?'<div class="li-v">'+esc(l.p.variant.label)+': '+esc(vn)+'</div>':'')+'<div class="li-v">'+zl(l.p.price)+' / szt.</div>'+
   '<div class="li-c"><div class="qty"><button type="button" data-d="-1" aria-label="Zmniejsz ilość">&minus;</button><input type="number" min="1" max="99" value="'+l.qty+'" aria-label="Ilość"><button type="button" data-d="1" aria-label="Zwiększ ilość">+</button></div>'+(small?'<b>'+zl(l.sum)+'</b>':'')+'<button class="rm" type="button">Usuń</button></div></div>'+(small?'':'<div class="li-t">'+zl(l.sum)+'</div>')+'</div>';
}
function bindLines(root){
  root.addEventListener('click',function(e){var li=e.target.closest('.li');if(!li)return;var k=li.dataset.key;
    if(e.target.closest('.rm')){cartRm(k);toast('Usunięto z koszyka');return}
    var b=e.target.closest('[data-d]');if(b){var i=$('input',li);cartQty(k,(+i.value||1)+(+b.dataset.d))}});
  root.addEventListener('change',function(e){if(e.target.matches('.qty input')){var li=e.target.closest('.li');cartQty(li.dataset.key,+e.target.value||1)}});
}
function renderDrawer(){
  var dr=$('.drawer');if(!dr)return; var L=cartLines();
  $('.dr-list',dr).innerHTML=L.length?L.map(function(l){return lineHTML(l,true)}).join(''):'<div class="dr-empty"><p><b>Koszyk jest pusty.</b></p><p>Zacznij od medali rocznicowych albo breloków.</p><a class="btn" href="kategoria.html?k=rocznice">Medale rocznicowe</a></div>';
  $('.dr-f',dr).innerHTML=L.length?'<div class="dr-row"><span>Produkty ('+cartCount()+' szt.)</span><b>'+zl(cartTotal())+'</b></div><div class="dr-row"><span>Dostawa</span><span>od '+zl(MINSHIP)+'</span></div><div class="dr-row tot"><span>Razem</span><span>'+zl(cartTotal())+'</span></div><a class="btn btn-block" href="zamowienie.html">Przejdź do zamówienia</a><a class="btn btn-line btn-block" href="koszyk.html">Zobacz koszyk</a>':'';
}
function openDrawer(added){var dr=$('.drawer');renderDrawer();$('.dr-added',dr).classList.toggle('on',!!added);overlay(dr,true);setTimeout(function(){$('.x',dr).focus()},50)}

/* ---------- kafel produktu ---------- */
function card(p){
  var imgs=p.variant&&p.variant.imgs?p.imgs.slice(0,1).concat(p.imgs.length>1?[p.imgs[Math.min(9,p.imgs.length-1)]]:[]):p.imgs.slice(0,4);
  var many=imgs.length>1;
  var btn=p.price==null?'<a class="btn btn-line" href="'+pUrl(p)+'">Zapytaj o wykonanie</a>':(p.variant?'<a class="btn btn-line" href="'+pUrl(p)+'">Wybierz: '+esc(p.variant.label.toLowerCase())+'</a>':'<button class="btn js-add" type="button" data-id="'+p.id+'">Do koszyka</button>');
  return '<article class="pc">'+(p.new?'<span class="tag">Nowość</span>':'')+
   '<div class="pc-im"><div class="pc-sl">'+imgs.map(function(s,i){return '<a href="'+pUrl(p)+'" tabindex="'+(i?'-1':'0')+'" draggable="false"><img src="'+s+'" alt="'+esc(p.name)+(i?' - zdjęcie '+(i+1):'')+'" loading="lazy" draggable="false"></a>'}).join('')+'</div>'+
   (many?'<button class="pc-arr l" type="button" aria-label="Poprzednie zdjęcie">&#8249;</button><button class="pc-arr r" type="button" aria-label="Następne zdjęcie">&#8250;</button><div class="pc-dots">'+imgs.map(function(_,i){return '<i'+(i?'':' class="on"')+'></i>'}).join('')+'</div>':'')+'</div>'+
   '<div class="pc-b"><a class="pc-n" href="'+pUrl(p)+'">'+esc(p.name)+'</a>'+
   (p.variant?'<span class="st" style="color:var(--ink2)">'+(p.variant.imgs?p.variant.options.length+' wariantów':'Rozmiary '+p.variant.options.join(', '))+'</span>':'<span class="'+stCls(p.stock)+'">'+p.stock+'</span>')+
   '<div class="pc-p"><span class="price">'+(p.price!=null?zl(p.price):'wycena indywidualna')+'</span></div>'+btn+'</div></article>';
}
function bindCards(root){
  root.addEventListener('click',function(e){
    var a=e.target.closest('.js-add'); if(a){var p=BY[a.dataset.id];cartAdd(p.id,null,1);openDrawer(true);return}
    var ar=e.target.closest('.pc-arr'); if(ar){var sl=$('.pc-sl',ar.parentNode);sl.scrollBy({left:(ar.classList.contains('r')?1:-1)*sl.clientWidth,behavior:'smooth'})}
  });
  $$('.pc-sl',root).forEach(function(sl){
    if(sl._b)return; sl._b=1;
    sl.addEventListener('scroll',function(){var i=Math.round(sl.scrollLeft/sl.clientWidth);$$('.pc-dots i',sl.parentNode).forEach(function(d,j){d.classList.toggle('on',i===j)})},{passive:true});
    dragScroll(sl,true);
  });
}
/* przeciąganie myszą (palec działa natywnie) */
function dragScroll(el,page){
  var down=false,sx=0,sl=0,moved=false;
  el.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'||e.button!==0)return;down=true;moved=false;sx=e.clientX;sl=el.scrollLeft;el.classList.add('drag')});
  addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-sx;if(Math.abs(dx)>5)moved=true;el.scrollLeft=sl-dx});
  addEventListener('pointerup',function(e){if(!down)return;down=false;el.classList.remove('drag');
    if(page&&moved){var w=el.clientWidth;var dx=e.clientX-sx;var base=Math.round(sl/w);var t=base+(dx<-40?1:dx>40?-1:0);el.scrollTo({left:t*w,behavior:'smooth'})}
    else if(moved){var c=el.firstElementChild;if(c){var cw=c.getBoundingClientRect().width+16;el.scrollTo({left:Math.round(el.scrollLeft/cw)*cw,behavior:'smooth'})}}});
  el.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
}

/* ---------- strony ---------- */
var pages={};
pages.index=function(){
  var cats=$('#cats'); var pic={rocznice:'671-1',symbole:'1037-3',breloki:'261-2',bizuteria:'27-1',znaczki:'1021-1',grupy:'73-1',dodatki:'626-1',patriotyczne:'593-2'};
  cats.innerHTML=D.categories.map(function(c){var n=D.products.filter(function(p){return p.cat===c.key}).length;return '<a class="cat" href="kategoria.html?k='+c.key+'"><div class="cat-im"><img src="img/p/'+pic[c.key]+'.webp" alt="" loading="lazy"></div><div class="cat-t"><b>'+c.name+'</b><span>'+n+' produktów</span></div></a>'}).join('');
  var nw=$('#nowosci'); nw.innerHTML=D.products.filter(function(p){return p.new}).map(card).join(''); bindCards(nw); dragScroll(nw,false);
  $$('.rail-nav button').forEach(function(b){b.addEventListener('click',function(){var r=$('#'+b.dataset.r);var c=r.firstElementChild;r.scrollBy({left:(+b.dataset.d)*(c.offsetWidth+16),behavior:'smooth'})})});
  var pk=['37','13','27','630','1037','621','838','73']; var g=$('#wybrane'); g.innerHTML=pk.map(function(id){return card(BY[id])}).join(''); bindCards(g);
};
pages.kategoria=function(){
  var k=qp('k'), q=qp('q'), cat=CATS[k];
  var base=q?search(q):(cat?D.products.filter(function(p){return p.cat===k}):D.products.slice());
  var title=q?'Wyniki dla "'+q+'"':(cat?cat.name:'Wszystkie produkty');
  document.title=title+' | UND24 - upominek nowej drogi';
  $('#crumbs').innerHTML='<a href="index.html">Strona główna</a><span>/</span>'+(q?'Wyszukiwanie':esc(title));
  $('#cat-h').innerHTML='<h1>'+esc(title)+'</h1>'+(cat?'<p class="lead">'+esc(cat.desc)+'</p>':(q?'<p class="lead">Znaleziono '+base.length+' produktów.</p>':'<p class="lead">Cała oferta wersji demonstracyjnej: '+D.products.length+' produktów z aktualnymi cenami ze sklepu und24.pl.</p>'));
  var subKey=cat?'sub':'cat';
  var subs={}; base.forEach(function(p){var s=cat?p.sub:CATS[p.cat].name;subs[s]=(subs[s]||0)+1});
  var bands=[['do15','do 15 zł',0,15],['15-30','15-30 zł',15.01,30],['30+','powyżej 30 zł',30.01,1e9]];
  var F=$('#filters');
  F.innerHTML='<div class="f-close"><b>Filtry</b><button class="x" type="button" aria-label="Zamknij filtry">&times;</button></div>'+
   '<div class="fbox fcats"><h3>Kategorie</h3>'+D.categories.map(function(c){return '<a href="kategoria.html?k='+c.key+'"'+(c.key===k&&!q?' aria-current="page"':'')+'>'+c.name+' <span>'+D.products.filter(function(p){return p.cat===c.key}).length+'</span></a>'}).join('')+'<a href="kategoria.html?k=all"'+(k==='all'&&!q?' aria-current="page"':'')+'>Wszystkie produkty <span>'+D.products.length+'</span></a></div>'+
   (Object.keys(subs).length>1?'<div class="fbox"><h3>'+(cat?'Rodzaj':'Kategoria')+'</h3>'+Object.keys(subs).map(function(s){return '<label><input type="checkbox" name="sub" value="'+esc(s)+'"> '+esc(s)+' <small>'+subs[s]+'</small></label>'}).join('')+'</div>':'')+
   '<div class="fbox"><h3>Cena</h3>'+bands.map(function(b){var n=base.filter(function(p){return p.price!=null&&p.price>=b[2]&&p.price<=b[3]}).length;return '<label><input type="checkbox" name="price" value="'+b[0]+'"> '+b[1]+' <small>'+n+'</small></label>'}).join('')+'</div>'+
   '<div class="fbox"><h3>Dostępność</h3><label><input type="checkbox" name="stock" value="1"> Dostępne od ręki</label><label><input type="checkbox" name="newf" value="1"> Tylko nowości</label></div>'+
   '<div class="f-apply"><button class="btn btn-block" type="button">Pokaż produkty</button></div>';
  var grid=$('#grid'), cnt=$('#cnt'), sort=$('#sort'), act=$('#active');
  function read(){return {sub:$$('input[name=sub]:checked',F).map(function(i){return i.value}),price:$$('input[name=price]:checked',F).map(function(i){return i.value}),stock:$('input[name=stock]',F).checked,newf:$('input[name=newf]',F).checked,sort:sort.value}}
  function apply(){
    var s=read();
    var r=base.filter(function(p){
      if(s.sub.length&&s.sub.indexOf(cat?p.sub:CATS[p.cat].name)<0)return false;
      if(s.price.length&&!s.price.some(function(b){var x=bands.find(function(y){return y[0]===b});return p.price!=null&&p.price>=x[2]&&p.price<=x[3]}))return false;
      if(s.stock&&p.stock!=='Dostępny od ręki')return false;
      if(s.newf&&!p.new)return false; return true});
    var pr=function(p){return p.price==null?1e9:p.price};
    if(s.sort==='asc')r.sort(function(a,b){return pr(a)-pr(b)});
    if(s.sort==='desc')r.sort(function(a,b){return (b.price||0)-(a.price||0)});
    if(s.sort==='az')r.sort(function(a,b){return a.name.localeCompare(b.name,'pl')});
    if(s.sort==='new')r.sort(function(a,b){return (b.new?1:0)-(a.new?1:0)});
    cnt.textContent=r.length+' '+(r.length===1?'produkt':(r.length%10>=2&&r.length%10<=4&&(r.length%100<10||r.length%100>=20)?'produkty':'produktów'));
    grid.innerHTML=r.length?r.map(card).join(''):'<div class="empty" style="grid-column:1/-1"><b>Brak produktów dla wybranych filtrów.</b><br><button class="btn btn-line js-clear" type="button" style="margin-top:14px">Wyczyść filtry</button></div>';
    bindCards(grid);
    var chips=[].concat(s.sub.map(function(x){return ['sub',x,x]}),s.price.map(function(x){return ['price',x,bands.find(function(y){return y[0]===x})[1]]}),s.stock?[['stock','1','Dostępne od ręki']]:[],s.newf?[['newf','1','Nowości']]:[]);
    act.innerHTML=chips.map(function(c){return '<button type="button" data-n="'+c[0]+'" data-v="'+esc(c[1])+'">'+esc(c[2])+' &times;</button>'}).join('')+(chips.length>1?'<button type="button" class="js-clear">Wyczyść wszystko</button>':'');
    $('#fcount').textContent=chips.length?' ('+chips.length+')':'';
    var u=new URLSearchParams(location.search); ['f','s'].forEach(function(x){u.delete(x)});
    if(chips.length)u.set('f',chips.map(function(c){return c[0]+':'+c[1]}).join('|')); if(s.sort!=='pop')u.set('s',s.sort);
    history.replaceState(null,'','?'+u.toString());
  }
  var f0=qp('f'); if(f0)f0.split('|').forEach(function(x){var i=x.indexOf(':');var n=x.slice(0,i),v=x.slice(i+1);$$('input[name='+n+']',F).forEach(function(inp){if(inp.value===v)inp.checked=true})});
  if(qp('s'))sort.value=qp('s');
  F.addEventListener('change',apply); sort.addEventListener('change',apply);
  act.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.classList.contains('js-clear')){$$('input',F).forEach(function(i){i.checked=false})}else{$$('input[name='+b.dataset.n+']',F).forEach(function(i){if(i.value===b.dataset.v)i.checked=false})}apply()});
  grid.addEventListener('click',function(e){if(e.target.closest('.js-clear')){$$('input',F).forEach(function(i){i.checked=false});apply()}});
  $('#fopen').addEventListener('click',function(){F.classList.add('on');document.documentElement.style.overflow='hidden'});
  $$('.f-close .x, .f-apply .btn',F).forEach(function(b){b.addEventListener('click',function(){F.classList.remove('on');document.documentElement.style.overflow=''})});
  apply();
};
pages.produkt=function(){
  var p=BY[qp('id')]||BY['37']; var hasV=!!p.variant, vi=null;
  if(hasV){var w=parseInt(qp('w'),10);vi=(!isNaN(w)&&w>=0&&w<p.variant.options.length)?w:0}
  var cat=CATS[p.cat];
  document.title=p.name+' | UND24 - upominek nowej drogi';
  $('#crumbs').innerHTML='<a href="index.html">Strona główna</a><span>/</span><a href="kategoria.html?k='+p.cat+'">'+cat.name+'</a><span>/</span>'+esc(p.sub);
  var imgs=p.imgs, N=imgs.length;
  var vHTML='';
  if(hasV){var v=p.variant;
    vHTML='<div class="opt"><div class="opt-l">'+v.label+': <span id="vname">'+esc(v.options[vi])+'</span></div>'+
     (v.type==='select'?'<select class="sel" id="vsel" aria-label="'+v.label+'">'+v.options.map(function(o,i){return '<option value="'+i+'"'+(i===vi?' selected':'')+'>'+esc(o)+'</option>'}).join('')+'</select>':
      '<div class="chips" id="vchips">'+v.options.map(function(o,i){return '<button type="button" data-i="'+i+'" aria-pressed="'+(i===vi)+'">'+esc(o)+'</button>'}).join('')+'</div>')+'</div>';
  }
  var buy=p.price==null?
    '<div class="buy"><a class="btn" href="informacje.html#kontakt">Zapytaj o wykonanie</a></div><p class="pd-vat" style="margin-top:12px">Ryngraf wykonywany ręcznie na zamówienie, cena ustalana indywidualnie. Więcej ryngrafów w pracowni właściciela: ryngrafy.com.pl.</p>':
    '<div class="buy" id="buy"><div class="qty"><button type="button" data-d="-1" aria-label="Zmniejsz ilość">&minus;</button><input id="qty" type="number" min="1" max="99" value="1" aria-label="Ilość"><button type="button" data-d="1" aria-label="Zwiększ ilość">+</button></div><button class="btn js-buy" type="button">Dodaj do koszyka</button></div>';
  var lines=p.desc, body='', list=[];
  lines.forEach(function(l){if(l.indexOf('✔')===0){list.push(l.replace('✔','').trim())}else{if(list.length){body+='<ul>'+list.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>';list=[]}body+='<p>'+esc(l)+'</p>'}});
  if(list.length)body+='<ul>'+list.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>';
  $('#pd').innerHTML=
   '<div class="gal"><div class="gal-main"><div class="gal-sl" id="gsl" tabindex="0" aria-label="Galeria zdjęć">'+imgs.map(function(s,i){return '<figure><img src="'+s+'" alt="'+esc(p.name)+(hasV&&p.variant.imgs?' - '+esc(p.variant.options[i]):' - zdjęcie '+(i+1))+'" '+(i>1?'loading="lazy"':'')+' draggable="false"></figure>'}).join('')+'</div>'+
    (N>1?'<span class="gal-cnt" id="gcnt">1 / '+N+'</span><button class="gal-arr l" type="button" aria-label="Poprzednie zdjęcie">&#8249;</button><button class="gal-arr r" type="button" aria-label="Następne zdjęcie">&#8250;</button>':'')+'</div>'+
    (N>1?'<div class="thumbs" id="thumbs">'+imgs.map(function(s,i){return '<button type="button" data-i="'+i+'" class="'+(i?'':'on')+'" aria-label="Zdjęcie '+(i+1)+'"><img src="'+s+'" alt="" loading="lazy"></button>'}).join('')+'</div>':'')+'</div>'+
   '<div class="pd-info">'+(p.new?'<span class="tag" style="position:static;display:inline-block;margin-bottom:12px">Nowość</span>':'')+'<h1>'+esc(p.name)+'</h1><div class="pd-meta"><span>Kod: '+esc(p.code)+'</span><span>'+esc(cat.name)+'</span></div>'+
    '<div class="pd-price"><span class="price">'+(p.price!=null?zl(p.price):'Wycena indywidualna')+'</span>'+(p.price!=null?'<span class="pd-vat">cena brutto, z VAT</span>':'')+'</div><span class="'+stCls(p.stock)+'">'+p.stock+(p.stock!=='Na zamówienie'?', wysyłka w 1-2 dni robocze':'')+'</span>'+
    vHTML+buy+
    '<ul class="facts"><li><b>Dostawa</b><span>Paczkomat InPost 19,00 zł, kurier DPD 20,00 zł, list polecony od 10,50 zł</span></li><li><b>Płatność</b><span>BLIK i szybki przelew (Przelewy24), przelew tradycyjny, za pobraniem</span></li><li><b>Zwrot</b><span>14 dni na odstąpienie od umowy (nie dotyczy produktów z indywidualnym grawerem)</span></li></ul>'+
    '<div class="acc"><details open><summary>Opis produktu</summary><div class="acc-b">'+body+'</div></details>'+
    '<details><summary>Wymiary i materiał</summary><div class="acc-b"><table class="ship-t dim"><tr><td>Wymiar</td><td>'+esc(p.size||'-')+'</td></tr><tr><td>Materiał</td><td>'+esc(p.material||'-')+'</td></tr><tr><td>Kod produktu</td><td>'+esc(p.code)+'</td></tr></table><p style="margin-top:12px;font-size:14px">Zdjęcia mają charakter poglądowy, odcień może się nieznacznie różnić w zależności od ekranu.</p></div></details>'+
    '<details><summary>Dostawa i zwroty</summary><div class="acc-b"><table class="ship-t">'+SHIP.map(function(s){return '<tr><td>'+s.name+'</td><td>'+zl(s.price)+'</td></tr>'}).join('')+'</table><p style="margin-top:12px">Zamówienia przygotowujemy w 1-2 dni robocze, przesyłki krajowe docierają zwykle w 1-5 dni roboczych od nadania. Produkty grawerowane i na zamówienie mogą wymagać więcej czasu. Wysyłka zagraniczna: List Global Express lub kurier DPD, koszt w koszyku.</p></div></details></div>'+
   '</div>';
  // galeria
  var sl=$('#gsl'), cntEl=$('#gcnt');
  function cur(){return Math.round(sl.scrollLeft/sl.clientWidth)}
  function go(i,smooth){sl.scrollTo({left:i*sl.clientWidth,behavior:smooth===false?'auto':'smooth'})}
  var syncing=false, tmr;
  sl.addEventListener('scroll',function(){var i=cur();if(cntEl)cntEl.textContent=(i+1)+' / '+N;$$('#thumbs button').forEach(function(b,j){b.classList.toggle('on',i===j)});
    clearTimeout(tmr);tmr=setTimeout(function(){var t=$('#thumbs .on');if(t)t.scrollIntoView({block:'nearest',inline:'nearest'});if(hasV&&p.variant.imgs&&!syncing&&i!==vi)setV(i,true);syncing=false},120)},{passive:true});
  dragScroll(sl,true);
  $$('.gal-arr').forEach(function(b){b.addEventListener('click',function(){var i=cur()+(b.classList.contains('r')?1:-1);go((i+N)%N)})});
  sl.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();go(Math.min(N-1,cur()+1))}if(e.key==='ArrowLeft'){e.preventDefault();go(Math.max(0,cur()-1))}});
  var th=$('#thumbs'); if(th)th.addEventListener('click',function(e){var b=e.target.closest('button');if(b)go(+b.dataset.i)});
  function setV(i,fromGal){vi=i;$('#vname').textContent=p.variant.options[i];var s=$('#vsel');if(s)s.value=i;$$('#vchips button').forEach(function(b){b.setAttribute('aria-pressed',+b.dataset.i===i)});
    if(p.variant.imgs&&!fromGal){syncing=true;go(i)}
    var u=new URLSearchParams(location.search);u.set('w',i);history.replaceState(null,'','?'+u.toString());var mn=$('#mbuy-v');if(mn)mn.textContent=p.variant.options[i]}
  if(hasV){var s=$('#vsel');if(s)s.addEventListener('change',function(){setV(+s.value)});var ch=$('#vchips');if(ch)ch.addEventListener('click',function(e){var b=e.target.closest('button');if(b)setV(+b.dataset.i)});
    if(p.variant.imgs&&vi)requestAnimationFrame(function(){syncing=true;go(vi,false)})}
  // ilość i dodawanie
  var q=$('#qty');
  $$('#buy [data-d]').forEach(function(b){b.addEventListener('click',function(){q.value=Math.max(1,Math.min(99,(+q.value||1)+(+b.dataset.d)))})});
  function add(){if(p.price==null)return;cartAdd(p.id,hasV?vi:null,Math.max(1,Math.min(99,+((q&&q.value)||1))));openDrawer(true)}
  $$('.js-buy').forEach(function(b){b.addEventListener('click',add)});
  // pasek mobilny
  if(p.price!=null){
    var mb=document.createElement('div');mb.className='mbuy';mb.innerHTML='<div><span class="price">'+zl(p.price)+'</span><small id="mbuy-v">'+(hasV?esc(p.variant.options[vi]):esc(p.stock))+'</small></div><button class="btn js-buy2" type="button">Dodaj do koszyka</button>';
    document.body.appendChild(mb); $('.js-buy2').addEventListener('click',add);
    var b0=$('#buy'); if('IntersectionObserver' in window)new IntersectionObserver(function(en){var e=en[0];mb.classList.toggle('on',!e.isIntersecting&&e.boundingClientRect.top<0)}).observe(b0);
  }
  // powiązane
  var rel=D.products.filter(function(x){return x.cat===p.cat&&x.id!==p.id}).slice(0,4);
  if(rel.length<4)rel=rel.concat(D.products.filter(function(x){return x.cat!==p.cat&&x.new&&x.id!==p.id}).slice(0,4-rel.length));
  var rg=$('#rel');rg.innerHTML=rel.map(card).join('');bindCards(rg);
};
pages.koszyk=function(){
  var box=$('#cart');
  function draw(){var L=cartLines();
    if(!L.length){box.innerHTML='<div class="empty" style="grid-column:1/-1"><p style="font-size:20px;margin:0 0 8px"><b>Twój koszyk jest pusty.</b></p><p style="margin:0 0 18px">Medale na rocznicę kosztują od 10,00 zł.</p><a class="btn" href="kategoria.html?k=rocznice">Przejdź do medali rocznicowych</a></div>';return}
    box.innerHTML='<div><div class="ct">'+L.map(function(l){return lineHTML(l,false)}).join('')+'</div><p style="margin-top:18px"><a href="kategoria.html?k=all" style="font-weight:700">&larr; Kontynuuj zakupy</a></p></div>'+
     '<aside class="sum"><h2>Podsumowanie</h2><div class="dr-row"><span>Produkty ('+cartCount()+' szt.)</span><b>'+zl(cartTotal())+'</b></div><div class="dr-row"><span>Dostawa</span><span>od '+zl(MINSHIP)+'</span></div><div class="dr-row tot"><span>Do zapłaty</span><span>'+zl(cartTotal())+' + dostawa</span></div>'+
     '<a class="btn btn-block" href="zamowienie.html">Przejdź do zamówienia</a><p class="pay-l">Zakup bez zakładania konta. Płatność: BLIK, szybki przelew Przelewy24, karta, przelew tradycyjny lub za pobraniem.</p><small>Sposób dostawy wybierzesz w następnym kroku: Paczkomat InPost 19,00 zł, kurier DPD 20,00 zł lub list polecony od 10,50 zł.</small></aside>';
  }
  draw(); bindLines(box); document.addEventListener('cart',draw);
};
pages.zamowienie=function(){
  var L=cartLines(); var form=$('#co');
  if(!L.length){$('#co-wrap').innerHTML='<div class="empty"><p><b>Koszyk jest pusty, nie ma czego zamawiać.</b></p><a class="btn" href="kategoria.html?k=rocznice">Wybierz produkty</a></div>';return}
  $('#ship').innerHTML=SHIP.map(function(s,i){return '<label class="ro"><input type="radio" name="ship" value="'+s.id+'"'+(i===0?' checked':'')+'><span><b>'+s.name+'</b><small>'+s.note+'</small>'+(s.id==='inpost'?'<span class="ro-x"><span class="fld"><span style="display:block;font-weight:600;font-size:14.5px;margin-bottom:5px">Numer paczkomatu</span><input id="paczkomat" name="paczkomat" aria-label="Numer paczkomatu" placeholder="np. CZE01M" autocomplete="off"><span class="e">Wpisz numer paczkomatu (w sklepie docelowym wybór z mapy InPost).</span></span></span>':'')+'</span><span class="p">'+zl(s.price)+'</span></label>'}).join('');
  var PAY=[
    {id:'blik',name:'BLIK',note:'Kod z aplikacji banku, obsługa Przelewy24',x:'<span class="blik fld"><input id="blik" inputmode="numeric" maxlength="7" placeholder="000 000" aria-label="Kod BLIK"><small>Demo: wpisz dowolne 6 cyfr</small></span>'},
    {id:'p24',name:'Szybki przelew Przelewy24',note:'Wybierz bank, zapłacisz na jego stronie',x:'<span class="banks">'+['PKO BP','mBank','ING','Pekao','Santander','Millennium','Alior','Inny bank'].map(function(b,i){return '<button type="button" aria-pressed="'+(i===0)+'">'+b+'</button>'}).join('')+'</span>'},
    {id:'card',name:'Karta płatnicza',note:'Visa, Mastercard, obsługa Przelewy24'},
    {id:'transfer',name:'Przelew tradycyjny',note:'Dane do przelewu w podsumowaniu i w e-mailu'},
    {id:'cod',name:'Za pobraniem',note:'Płacisz kurierowi DPD przy odbiorze'}
  ];
  $('#pay').innerHTML=PAY.map(function(p,i){return '<label class="ro" data-pay="'+p.id+'"'+(p.id==='cod'?' hidden':'')+'><input type="radio" name="pay" value="'+p.id+'"'+(i===0?' checked':'')+'><span><b>'+p.name+'</b><small>'+p.note+'</small>'+(p.x?'<span class="ro-x">'+p.x+'</span>':'')+'</span><span></span></label>'}).join('');
  $('#pay').addEventListener('click',function(e){var b=e.target.closest('.banks button');if(b){e.preventDefault();$$('.banks button').forEach(function(x){x.setAttribute('aria-pressed',x===b)})}});
  function summary(){
    var sh=SHIP.find(function(s){return s.id===(($('input[name=ship]:checked')||{}).value)})||SHIP[0];
    var cod=sh.id==='dpd-cod';
    $$('#pay .ro').forEach(function(r){var isC=r.dataset.pay==='cod';r.hidden=cod?!isC:isC});
    var chk=$('input[name=pay]:checked');
    if(cod){$('input[value=cod]').checked=true}else if(!chk||chk.value==='cod'){$('input[value=blik]').checked=true}
    var t=cartTotal()+sh.price;
    $('#co-sum').innerHTML='<h2>Twoje zamówienie</h2>'+L.map(function(l){var vn=vName(l.p,l.v);return '<div class="li"><img src="'+vImg(l.p,l.v)+'" alt=""><div><span class="li-n">'+esc(l.p.name)+'</span><div class="li-v">'+(vn?esc(vn)+', ':'')+l.qty+' szt.</div></div><span class="li-t">'+zl(l.sum)+'</span></div>'}).join('')+
     '<div class="dr-row" style="margin-top:10px"><span>Produkty</span><b>'+zl(cartTotal())+'</b></div><div class="dr-row"><span>'+esc(sh.name)+'</span><b>'+zl(sh.price)+'</b></div><div class="dr-row tot"><span>Do zapłaty</span><span>'+zl(t)+'</span></div>'+
     '<button class="btn btn-block" type="submit" form="co">Zamawiam i płacę '+zl(t)+'</button><small>Wersja demonstracyjna: płatność nie zostanie pobrana, a zamówienie nie trafi do sklepu.</small><p style="margin:14px 0 0"><a href="koszyk.html" style="font-weight:700">&larr; Wróć do koszyka</a></p>';
    return {sh:sh,t:t};
  }
  form.addEventListener('change',function(e){if(e.target.name==='ship'||e.target.name==='pay')summary()});
  form.addEventListener('input',function(e){var w=e.target.closest('.fld');if(w)w.classList.remove('err');var k=e.target.closest('.chk');if(k)k.classList.remove('err')});
  form.addEventListener('click',function(e){if(e.target.closest('.ro-x input'))e.stopPropagation()});
  $('#firma').addEventListener('change',function(){$('#firma-f').hidden=!this.checked});
  summary();
  function fieldErr(id,bad){var f=$('#'+id);if(!f)return false;var w=f.closest('.fld')||f.parentNode;w.classList.toggle('err',bad);f.setAttribute('aria-invalid',bad?'true':'false');return bad}
  form.addEventListener('submit',function(e){
    e.preventDefault(); var errs=[];
    var v=function(id){var x=$('#'+id);return x?x.value.trim():''};
    if(fieldErr('email',!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))))errs.push('email');
    if(fieldErr('imie',v('imie').length<3))errs.push('imie');
    if(fieldErr('tel',v('tel').replace(/\D/g,'').length<9))errs.push('tel');
    var sh=$('input[name=ship]:checked').value;
    if(sh==='inpost'){if(fieldErr('paczkomat',v('paczkomat').length<4))errs.push('paczkomat');['ulica','kod','miasto'].forEach(function(i){fieldErr(i,false)})}
    else{fieldErr('paczkomat',false);if(fieldErr('ulica',v('ulica').length<3))errs.push('ulica');if(fieldErr('kod',!/^\d{2}-?\d{3}$/.test(v('kod'))))errs.push('kod');if(fieldErr('miasto',v('miasto').length<2))errs.push('miasto')}
    if($('#firma').checked){if(fieldErr('nip',v('nip').replace(/\D/g,'').length!==10))errs.push('nip');if(fieldErr('fnazwa',v('fnazwa').length<2))errs.push('fnazwa')}
    var pay=$('input[name=pay]:checked').value;
    if(pay==='blik'&&fieldErr('blik',v('blik').replace(/\D/g,'').length!==6))errs.push('blik');
    var reg=$('#regulamin');reg.closest('.chk').classList.toggle('err',!reg.checked);if(!reg.checked)errs.push('regulamin');
    var box=$('#co-err');
    if(errs.length){box.classList.add('on');box.textContent='Uzupełnij zaznaczone pola ('+errs.length+'), aby złożyć zamówienie.';box.scrollIntoView({behavior:'smooth',block:'center'});return}
    box.classList.remove('on');
    var s=summary(); var payName=PAY.find(function(x){return x.id===pay}).name;
    var order={nr:'UND-DEMO-'+String(Date.now()).slice(-6),lines:L.map(function(l){return {n:l.p.name,v:vName(l.p,l.v),q:l.qty,s:l.sum,img:vImg(l.p,l.v)}}),ship:s.sh.name,shipP:s.sh.price,pay:payName,total:s.t,email:v('email'),paczkomat:sh==='inpost'?v('paczkomat'):'',adres:sh==='inpost'?'':v('ulica')+', '+v('kod')+' '+v('miasto')};
    sset('und24_last',JSON.stringify(order),true); cartSet([]); location.href='dziekujemy.html';
  });
};
pages.dziekujemy=function(){
  var o=null;try{o=JSON.parse(sget('und24_last',true)||'null')}catch(e){}
  var el=$('#thx');
  if(!o){el.innerHTML='<h1>Brak zamówienia do wyświetlenia</h1><p class="lead">Ta strona pojawia się po złożeniu zamówienia w wersji demonstracyjnej.</p><a class="btn" href="index.html" style="margin-top:20px">Wróć do sklepu</a>';return}
  el.innerHTML='<div class="coin" aria-hidden="true">24</div><h1>Dziękujemy za zamówienie (demo)</h1><p class="lead">Numer zamówienia: <b>'+esc(o.nr)+'</b>. W sklepie docelowym potwierdzenie przyjdzie na adres '+esc(o.email)+', a płatność '+esc(o.pay)+' zostanie obsłużona przez Przelewy24.</p>'+
   '<div class="box"><h2>Podsumowanie</h2>'+o.lines.map(function(l){return '<div class="li" style="grid-template-columns:64px minmax(0,1fr) auto;align-items:center"><img src="'+l.img+'" alt="" style="width:64px;height:64px"><div><b class="li-n">'+esc(l.n)+'</b><div class="li-v">'+(l.v?esc(l.v)+', ':'')+l.q+' szt.</div></div><b>'+zl(l.s)+'</b></div>'}).join('')+
   '<div class="dr-row" style="margin-top:12px"><span>Dostawa: '+esc(o.ship)+(o.paczkomat?' ('+esc(o.paczkomat)+')':'')+'</span><b>'+zl(o.shipP)+'</b></div><div class="dr-row"><span>Płatność</span><b>'+esc(o.pay)+'</b></div><div class="dr-row tot" style="border-top:1px solid var(--line);padding-top:12px;margin-top:8px"><span>Razem</span><span>'+zl(o.total)+'</span></div></div>'+
   '<p class="demo-note" style="margin-top:22px">To jest wersja demonstracyjna nowego sklepu: płatność nie została pobrana, a zamówienie nie trafiło do realizacji.</p><a class="btn" href="index.html" style="margin-top:20px">Wróć na stronę główną</a>';
};
pages.konto=function(){
  $('#acct-f').addEventListener('submit',function(e){e.preventDefault();toast('Wersja demonstracyjna: logowanie będzie działać w sklepie WooCommerce')});
};
pages.informacje=function(){};

/* ---------- start ---------- */
function start(){
  fetch('products.json').then(function(r){return r.json()}).then(function(d){
    D=d; d.categories.forEach(function(c){CATS[c.key]=c}); d.products.forEach(function(p){BY[p.id]=p});
    header(); footer(); bindChrome(); renderDrawer();
    var pg=document.body.dataset.page; if(pages[pg])pages[pg]();
  }).catch(function(e){console.warn('Brak danych produktów',e)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
