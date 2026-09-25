document.addEventListener('DOMContentLoaded', async function() {
  const root = document.getElementById('afterlife-shop-root');
  if (!root) return;

  // Загрузка JSON через CDN jsDelivr (используем @main, чтобы изменения подтягивались автоматически)
  const DATA_URL = 'https://cdn.jsdelivr.net/gh/onigozen/ftr404-afterlife-shop@main/afterlife-shop-items.json';

  let data = {};
  try {
    const response = await fetch(DATA_URL + '?v=' + Date.now()); // ?v= обходит кэш браузера
    data = await response.json();
  } catch (err) {
    console.error('Ошибка загрузки данных Посмертия:', err);
    root.innerHTML = '<div style="color:red; text-align:center; padding: 20px;">Не удалось загрузить каталог товаров.</div>';
    return;
  }

  // Конфигурация вкладок аккордеона
  const tabConfigs = [
    { id: 'general', title: 'ИНФОРМАЦИЯ', active: true, info: data.general_info, type: 'info' },
    { id: 'weapons', title: 'Оружейная Лавка', info: "<b>NETDIR://[ПУШКИ]</b>", items: data.weapons, mode: 'mode-shop', type: 'shop' },
    { id: 'medtech', title: 'МЕДТЕХИ И РИПЕРЫ', info: "<b>NETDIR://[ИМПЛАНТЫ_И_РАСХОДНИКИ]</b>", items: data.medtech, mode: 'mode-shop', type: 'shop' },
    { id: 'souvenirs', title: 'СУВЕНИРЫ И РОСКОШЬ', info: "<b>NETDIR://[СУВЕНИРЫ]</b>", items: data.souvenirs, mode: 'mode-shop', type: 'shop' },
    { id: 'food_drinks', title: 'ЕДА И НАПИТКИ', info: "<b>NETDIR://[ЕДА_И_НАПИТКИ]</b>", items: data.food_drinks, mode: 'mode-shop', type: 'shop' },
    { id: 'flea_market', title: 'БАРАХОЛКА', info: "<b>NETDIR://[БАРАХОЛКА]</b>", items: data.flea_market, mode: 'mode-shop', type: 'shop' },
    { id: 'achievements', title: 'АЧИВКИ', items: data.achievements, mode: 'mode-achiv', type: 'achiv' }
  ];

  // Генератор карточек
  function createCardHTML(item, type) {
    const isAchiv = type === 'achiv';
    const btnLabel = isAchiv ? 'Забрать ачивку' : 'Заказать';
    const descPrefix = isAchiv ? '<b>Условие:</b> ' : '<b>Получить:</b> ';
    
    const loreHTML = item.lore ? `
      <div class="cp-info-icon">i
        <div class="cp-lore-popup"><i>${item.lore}</i></div>
      </div>` : '';

    return `
      <div class="cp-card">
        <div class="cp-tag ${item.tagClass}">${item.price}</div>
        ${loreHTML}
        <!-- ТУТ: Добавлены lazy loading и асинхронное декодирование -->
        <div class="cp-img"><img src="${item.img}" alt="${item.title}" loading="lazy" decoding="async"></div>
        <div class="cp-title">${item.title}</div>
        <div class="cp-arrow"></div>
        <div class="cp-desc">${descPrefix}${item.desc}</div>
        <button class="cp-action-btn" 
                data-type="${type}" 
                data-title="${item.title}" 
                data-price="${item.price}">
          ${btnLabel}
        </button>
      </div>
    `;
  }

  // Сборка общей структуры HTML
  let html = '<div class="cp-box">';

  tabConfigs.forEach(tab => {
    const isActive = tab.active ? 'i_active' : '';
    const displayStyle = tab.active ? 'style="display: block;"' : '';

    html += `
      <div class="cp-tab">
        <div class="cp-btn ${isActive}">${tab.title} <i class="cp-mark"></i></div>
        <div class="cp-list" ${displayStyle}>`;

    if (tab.type === 'info') {
      html += `
        <div class="cp-info" style="text-align: left; font-size: 13px; background: transparent;">
          ${tab.info}
        </div>`;
    } else {
      if (tab.info) {
        html += `<div class="cp-info">${tab.info}</div>`;
      }
      if (tab.items && tab.items.length) {
        html += `<div class="cp-grid ${tab.mode}">`;
        tab.items.forEach(item => {
          html += createCardHTML(item, tab.type);
        });
        html += `</div>`;
      }
    }

    html += `
        </div>
      </div>`;
  });

  html += '</div>';
  root.innerHTML = html;

  // Обработка кликов (Аккордеон + Заказ в 1 клик)
  root.addEventListener('click', function(e) {
    // 1. Клики по переключению вкладок
    const btn = e.target.closest('.cp-btn');
    if (btn) {
      e.preventDefault();
      const list = btn.nextElementSibling;
      const isOpened = btn.classList.contains('i_active');

      root.querySelectorAll('.cp-btn.i_active').forEach(activeBtn => {
        if (activeBtn !== btn) {
          activeBtn.classList.remove('i_active');
          if (activeBtn.nextElementSibling) {
            activeBtn.nextElementSibling.style.display = 'none';
          }
        }
      });

      if (!list) return;

      if (isOpened) {
        list.style.display = 'none';
        btn.classList.remove('i_active');
      } else {
        list.style.display = 'block';
        btn.classList.add('i_active');

        setTimeout(() => {
          const offset = 5; 
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = btn.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }, 200);
      }
      return;
    }

    // 2. Клики по кнопкам быстрых заявок
    const actionBtn = e.target.closest('.cp-action-btn');
    if (actionBtn) {
      e.preventDefault();
      const type = actionBtn.dataset.type;
      const title = actionBtn.dataset.title;
      const price = actionBtn.dataset.price;

      const replyField = document.querySelector('#main-reply') || document.querySelector('textarea[name="req_message"]');
      if (!replyField) return;

      let template = '';
      if (type === 'achiv') {
        template = `[b]Название ачивки:[/b] ${title}\n[b]Получатель:[/b] \n[b]Пруфы:[/b] `;
      } else {
        template = `[b]Что нужно:[/b] ${title} (${price})\n[b]Получатель:[/b] \n[b]Сообщение к подарку:[/b] \n[b]Анонимность:[/b] нет`;
      }

      replyField.value = template;
      replyField.focus();
      replyField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});
