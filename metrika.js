// Яндекс Метрика для всех страниц сайта: счётчик (вебвизор, карта кликов) и цели.
// ID — номер счётчика (113874075, выдан 29.10.2026). Если поставить 0, Метрика не загружается, а вызовы целей ничего не делают.
// Цели: form_book, form_gift, form_edu (успешная отправка формы — вызывают app.js и страницы услуг через mgGoal),
// tryon_open (запустилась 3D-примерка), tel_click (клик по tel:), messenger_click (Telegram, WhatsApp, MAX, Авито, Яндекс Карты, Instagram).
(function () {
  var ID = 113874075;
  window.mgGoal = function (name) { try { if (ID && window.ym) ym(ID, 'reachGoal', name); } catch (e) {} };
  if (!ID) return;
  (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date();
    k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a); })
  (window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + ID, 'ym');
  window.dataLayer = window.dataLayer || [];   // электронная коммерция Метрики (магазин /shop/)
  ym(ID, 'init', { ssr: true, webvisor: true, clickmap: true, ecommerce: 'dataLayer', referrer: document.referrer, url: location.href, accurateTrackBounce: true, trackLinks: true });
  var MSG = /^https?:\/\/([\w-]+\.)*(t\.me|telegram\.me|wa\.me|api\.whatsapp\.com|max\.ru|avito\.ru|instagram\.com)\/|^https?:\/\/(yandex\.ru|yandex\.com)\/maps/i;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('tel:') === 0) mgGoal('tel_click');
    else if (MSG.test(a.href)) mgGoal('messenger_click');
  }, true);
})();
