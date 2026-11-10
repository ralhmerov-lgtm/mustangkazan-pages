// Интернет-магазин: каталог из data/content.json → shop (ведётся в админке, вкладка «Магазин»), запасной — data/shop.default.json.
// Корзина хранится в браузере (localStorage). Оформление: api/order.php пересчитывает сумму по каталогу на сервере и отдаёт ссылку на оплату Т-Банка.
(() => {
const $ = s => document.querySelector(s);
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rub = n => n.toLocaleString('ru-RU') + ' ₽';
// фото из каталога — «01621» → img/01621.webp (+ -s превью); добавленные в админке — «u…jpg» → img/u….jpg (+ u…-s.jpg)
// ?v= — версия фото каталога: после пересъёмки или новой обработки поднимаем число, чтобы браузеры не держали старые картинки из кэша
const IMG_V = 2;
const img = (p, s) => /\.\w+$/.test(p) ? 'img/' + (s ? p.replace(/(\.\w+)$/, '-s$1') : p) : `img/${p}${s ? '-s' : ''}.webp?v=${IMG_V}`;
const KEY = 'mg-cart';
let SHOP = {cats: [], items: []}, BY = {}, cart = {}, cat = 'all';

const load = () => { try { cart = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { cart = {}; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} };
const buyable = it => it && !it.off && it.price > 0;
const title = it => (it.brand ? it.brand + ' ' : '') + it.name;
const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
const total = () => Object.entries(cart).reduce((s, [id, q]) => s + (BY[id] ? BY[id].price * q : 0), 0);
function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 2600); }

function setQ(id, q) {
  q = Math.max(0, Math.min(50, q));
  if (q) cart[id] = q; else delete cart[id];
  save(); badge();
  document.querySelectorAll(`[data-buy="${CSS.escape(id)}"]`).forEach(el => el.outerHTML = buyCtl(BY[id]));
  if ($('#cart').open) drawCart();
}
function badge() {
  const n = count(); $('#cartN').textContent = n;
  const f = $('#fly'); f.classList.toggle('on', n > 0); document.body.classList.toggle('has-fly', n > 0);
  $('#flyBtn').textContent = `Корзина · ${n} шт. · ${rub(total())}`;
}
function buyCtl(it) {
  if (!buyable(it)) return `<a class="btn btn-g" href="tel:+79668020010" data-buy="${esc(it.id)}">Узнать цену</a>`;
  const q = cart[it.id] || 0;
  return q ? `<span class="step" data-buy="${esc(it.id)}"><button type="button" data-d="-1" aria-label="Меньше">−</button><span>${q}</span><button type="button" data-d="1" aria-label="Больше">+</button></span>`
           : `<button class="btn btn-y" type="button" data-buy="${esc(it.id)}" data-d="1">В корзину</button>`;
}
const priceHtml = it => buyable(it) ? `<span class="price">${rub(it.price)}</span>` : `<span class="price na">Цена по запросу</span>`;
const card = it => `<article class="card">
  <button class="ph" type="button" data-open="${esc(it.id)}" aria-label="Подробнее: ${esc(title(it))}"><img src="${img(it.img[0], 1)}" alt="${esc(title(it))}" loading="lazy" width="384" height="480"></button>
  <div class="bd">${it.brand ? `<div class="br">${esc(it.brand)}</div>` : ''}<h3>${esc(it.name)}</h3>${it.vol ? `<div class="vol">${esc(it.vol)}</div>` : ''}
  <div class="ft">${priceHtml(it)}${buyCtl(it)}</div></div></article>`;

function drawList() {
  const q = $('#q').value.trim().toLowerCase(), only = $('#onlyPrice').checked;
  const ok = it => !it.off && (cat === 'all' || it.cat === cat) && (!only || buyable(it)) && (!q || (title(it) + ' ' + it.vol).toLowerCase().includes(q));
  const html = SHOP.cats.map(([k, name]) => {
    const L = SHOP.items.filter(it => it.cat === k && ok(it)).sort((a, b) => (b.price > 0) - (a.price > 0));
    return L.length ? `<section class="cat" id="c-${k}"><h2>${esc(name)}</h2><div class="grid">${L.map(card).join('')}</div></section>` : '';
  }).join('');
  $('#list').innerHTML = html || '<p class="empty">Ничего не нашлось — попробуйте другое слово или раздел.</p>';
}
function drawChips() {
  const vis = SHOP.items.filter(it => !it.off), n = k => vis.filter(it => it.cat === k).length;
  $('#chips').innerHTML = [['all', 'Все товары', vis.length], ...SHOP.cats.map(([k, t]) => [k, t, n(k)]).filter(c => c[2])]
    .map(([k, t, c]) => `<button type="button" data-cat="${k}" aria-pressed="${k === cat}">${esc(t)}<small>${c}</small></button>`).join('');
}

function drawCart(msg) {
  for (const id in cart) if (!buyable(BY[id])) delete cart[id];
  save(); badge();
  const ids = Object.keys(cart), b = $('#cartBody');
  if (!ids.length) { b.innerHTML = (msg || '') + '<p class="empty">Корзина пуста. Добавьте товары из каталога.</p>'; return; }
  const keep = {}; b.querySelectorAll('input,textarea').forEach(el => keep[el.id] = el.type === 'checkbox' ? el.checked : el.value);
  b.innerHTML = (msg || '') + ids.map(id => { const it = BY[id], q = cart[id];
    return `<div class="line"><img src="${img(it.img[0], 1)}" alt=""><div><div class="nm">${esc(title(it))}${it.vol ? ', ' + esc(it.vol) : ''}</div>
      <div class="row"><span class="step" data-buy="${esc(id)}"><button type="button" data-d="-1" aria-label="Меньше">−</button><span>${q}</span><button type="button" data-d="1" aria-label="Больше">+</button></span><span class="sum">${rub(it.price * q)}</span></div></div></div>`; }).join('')
    + `<div class="tot"><span>Итого</span><b>${rub(total())}</b></div>
    <form id="ord" novalidate>
      <label class="f">Имя<input id="oName" autocomplete="name" maxlength="80" required></label>
      <label class="f">Телефон<input id="oPhone" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" placeholder="+7" required><small>Позвоним, когда заказ будет собран</small></label>
      <label class="f">Эл. почта<input id="oEmail" type="email" autocomplete="email" maxlength="120"><small>Необязательно — пришлём чек и подтверждение</small></label>
      <label class="f">Комментарий<textarea id="oNote" maxlength="400" placeholder="Например: заберу в субботу"></textarea></label>
      <label class="consent" for="oOk"><input type="checkbox" id="oOk"> <span>Согласен с <a href="../oferta.html" target="_blank">офертой</a> и на обработку персональных данных по <a href="../privacy.html" target="_blank">политике конфиденциальности</a></span></label>
      <button class="btn btn-y pay" type="submit" id="payBtn">Оплатить ${rub(total())}</button>
      <p class="err" id="oErr" role="alert" hidden></p>
      <p class="hint">Самовывоз из студии: Казань, ул. Аделя Кутуя, 110Д, корп. 4</p>
    </form>`;
  for (const k in keep) { const el = b.querySelector('#' + k); if (el) el.type === 'checkbox' ? el.checked = keep[k] : el.value = keep[k]; }
  $('#ord').onsubmit = order;
}
async function order(e) {
  e.preventDefault();
  const v = id => $('#' + id).value.trim(), err = $('#oErr'), btn = $('#payBtn');
  const fail = t => { err.textContent = t; err.hidden = false; };
  err.hidden = true;
  if (!v('oName')) return fail('Напишите, как к вам обращаться.');
  if (v('oPhone').replace(/\D/g, '').length < 10) return fail('Проверьте номер телефона.');
  if (v('oEmail') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('oEmail'))) return fail('Проверьте адрес почты или оставьте поле пустым.');
  if (!$('#oOk').checked) return fail('Отметьте согласие с офертой и обработкой данных.');
  btn.disabled = true; btn.textContent = 'Переходим к оплате…';
  try {
    const r = await fetch('../api/order.php', {method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({items: Object.entries(cart).map(([id, q]) => ({id, q})), name: v('oName'), phone: v('oPhone'), email: v('oEmail'), note: v('oNote'), consent: true})});
    const j = await r.json().catch(() => ({}));
    if (j.ok && j.url) { try { sessionStorage.setItem('mg-order', j.num); } catch (x) {} location.href = j.url; return; }
    fail({rate: 'Подождите несколько секунд и нажмите ещё раз.', empty: 'Товаров из корзины сейчас нет в продаже — обновите страницу.', fields: 'Проверьте имя и телефон.'}[j.error]
      || 'Не получилось создать платёж. Позвоните нам: +7 (966) 802-00-10 — оформим заказ по телефону.');
  } catch (x) { fail('Нет связи с сайтом. Проверьте интернет и попробуйте ещё раз.'); }
  btn.disabled = false; btn.textContent = 'Оплатить ' + rub(total());
}

function openProduct(id) {
  const it = BY[id]; if (!it) return; const box = $('#pbox');
  const show = p => { $('#pMain').innerHTML = `<img src="${img(p)}" alt="${esc(title(it))}" width="800" height="1000">`; $('#pThumbs').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === p)); };
  $('#pThumbs').innerHTML = it.img.length > 1 ? it.img.map(p => `<button type="button" data-p="${p}"><img src="${img(p, 1)}" alt=""></button>`).join('') : '';
  $('#pThumbs').onclick = e => { const b = e.target.closest('[data-p]'); if (b) show(b.dataset.p); };
  const catName = (SHOP.cats.find(c => c[0] === it.cat) || [])[1] || '';
  $('#pInfo').innerHTML = `<div class="br" style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">${esc(it.brand || catName)}</div>
    <h2>${esc(it.name)}</h2>${it.vol ? `<p>Объём / комплектация: ${esc(it.vol)}</p>` : ''}${it.d ? `<p>${esc(it.d)}</p>` : ''}
    ${priceHtml(it)}<div>${buyCtl(it)}</div>
    <p style="margin-top:8px">Самовывоз из студии в Казани после оплаты. Вопросы — <a href="tel:+79668020010">+7 (966) 802-00-10</a>.</p>`;
  show(it.img[0]); box.showModal();
}

document.addEventListener('click', e => {
  const d = e.target.closest('[data-d]');
  if (d) { const id = d.closest('[data-buy]').dataset.buy; const was = cart[id] || 0; setQ(id, was + +d.dataset.d); if (!was) toast('Добавлено в корзину'); return; }
  const o = e.target.closest('[data-open]'); if (o) return openProduct(o.dataset.open);
  const c = e.target.closest('[data-cat]'); if (c) { cat = c.dataset.cat; drawChips(); drawList(); window.scrollTo({top: $('#list').offsetTop - 160, behavior: 'smooth'}); return; }
  if (e.target.closest('[data-close]')) e.target.closest('dialog').close();
  if (e.target.tagName === 'DIALOG') e.target.close();   // клик по затемнению
});
const openCart = () => { drawCart(); $('#cart').showModal(); };
$('#cartBtn').onclick = openCart; $('#flyBtn').onclick = openCart;
$('#q').oninput = drawList; $('#onlyPrice').onchange = drawList;
addEventListener('storage', e => { if (e.key === KEY) { load(); badge(); drawList(); } });

(async () => {
  load();
  const get = async u => { try { const r = await fetch(u, {cache: 'no-cache'}); return r.ok ? await r.json() : null; } catch (e) { return null; } };
  const c = await get('../data/content.json');
  SHOP = (c && c.shop && c.shop.items) ? c.shop : (await get('../data/shop.default.json')) || SHOP;
  SHOP.items.forEach(it => BY[it.id] = it);
  drawChips(); drawList(); badge();
  const u = new URLSearchParams(location.search), paid = u.get('paid'), failed = u.get('fail');
  if (paid || failed) {
    history.replaceState(null, '', location.pathname);
    if (paid) { cart = {}; save(); badge(); drawList();
      drawCart(`<div class="msg"><b>Спасибо, заказ № ${esc(paid)} оплачен.</b><br>Мы соберём его и позвоним, когда можно будет забрать в студии.</div>`); }
    else drawCart(`<div class="msg">Оплата не прошла — деньги не списаны. Можно попробовать ещё раз или позвонить нам: <a href="tel:+79668020010">+7 (966) 802-00-10</a>.</div>`);
    $('#cart').showModal();
  }
})();
})();
