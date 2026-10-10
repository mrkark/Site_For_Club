/**
 * Cookie Consent Management System
 * Compliant with the Law of the Republic of Belarus of 07.05.2021 No. 99-Z
 * "On Personal Data Protection" and recommendations of the NCZPD of Belarus.
 */

(function () {
  const STORAGE_KEY = 'cookie_consent';

  // Injects the necessary HTML for banner and modals if they are not already present
  function injectCookieDOM() {
    if (document.getElementById('cookieBanner')) return;

    const html = `
      <!-- Cookie Banner -->
      <aside id="cookieBanner" class="cookie-banner" role="region" aria-label="Уведомление об использовании cookie">
        <div class="container cookie-banner-inner">
          <div class="cookie-banner-text-wrap">
            <div class="cookie-banner-icon" aria-hidden="true">
              <i class="fas fa-cookie-bite"></i>
            </div>
            <div>
              <div class="cookie-banner-title">Мы используем файлы cookie</div>
              <p class="cookie-banner-desc">
                В соответствии с Законом Республики Беларусь от 07.05.2021 № 99-З «О защите персональных данных», 
                мы используем обязательные (технические) файлы cookie для корректной работы сайта, а также аналитические 
                файлы cookie (только с вашего согласия). Подробнее — в нашей 
                <a href="#" id="cookieBannerPolicyLink">Политике обработки файлов cookie</a>.
              </p>
            </div>
          </div>
          <div class="cookie-banner-actions">
            <button type="button" class="cookie-btn cookie-btn-accept" id="cookieAcceptAllBtn">Принять все</button>
            <button type="button" class="cookie-btn cookie-btn-reject" id="cookieRejectOptionalBtn">Только необходимые</button>
            <button type="button" class="cookie-btn cookie-btn-settings" id="cookieOpenSettingsBtn">Настроить</button>
          </div>
        </div>
      </aside>

      <!-- Cookie Settings Modal -->
      <div id="cookieSettingsModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="cookieSettingsTitle">
        <div class="modal-content" style="max-width: 680px;">
          <div class="modal-header">
            <h2 id="cookieSettingsTitle"><i class="fas fa-sliders-h" style="color:var(--gold-primary);margin-right:10px;"></i>Настройки файлов cookie</h2>
            <span class="modal-close" id="cookieSettingsCloseBtn">&times;</span>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <p style="color:var(--text-secondary);font-size:0.92rem;line-height:1.6;margin-bottom:18px;">
              Вы можете настроить, какие категории файлов cookie разрешено использовать при посещении сайта МОО «СК «СЭНКЁ». 
              Технические cookie необходимы для функционирования сайта и не могут быть отключены.
            </p>

            <div class="cookie-categories-list">
              <!-- Category: Necessary -->
              <div class="cookie-category-card">
                <div class="cookie-category-header">
                  <div class="cookie-category-title-wrap">
                    <h3 class="cookie-category-title">Технические (необходимые)</h3>
                    <span class="cookie-badge-required">Обязательные</span>
                  </div>
                  <label class="cookie-switch" aria-label="Технические cookie всегда включены">
                    <input type="checkbox" checked disabled id="cookieCheckboxNecessary">
                    <span class="cookie-slider"></span>
                  </label>
                </div>
                <p class="cookie-category-desc">
                  Обеспечивают базовую навигацию по сайту, безопасность передачи данных, сохранение сессии администратора 
                  и фиксацию вашего выбора согласия. Без них работа веб-ресурса невозможна.
                </p>
              </div>

              <!-- Category: Analytics -->
              <div class="cookie-category-card">
                <div class="cookie-category-header">
                  <div class="cookie-category-title-wrap">
                    <h3 class="cookie-category-title">Аналитические и статистические</h3>
                  </div>
                  <label class="cookie-switch" aria-label="Включить аналитические cookie">
                    <input type="checkbox" id="cookieCheckboxAnalytics">
                    <span class="cookie-slider"></span>
                  </label>
                </div>
                <p class="cookie-category-desc">
                  Позволяют оценивать посещаемость разделов, популярность расписания и статей, а также улучшать 
                  структуру и удобство сайта. Данные собираются в обезличенном виде.
                </p>
              </div>

              <!-- Category: Functional -->
              <div class="cookie-category-card">
                <div class="cookie-category-header">
                  <div class="cookie-category-title-wrap">
                    <h3 class="cookie-category-title">Функциональные предпочтения</h3>
                  </div>
                  <label class="cookie-switch" aria-label="Включить функциональные cookie">
                    <input type="checkbox" id="cookieCheckboxFunctional">
                    <span class="cookie-slider"></span>
                  </label>
                </div>
                <p class="cookie-category-desc">
                  Запоминают ваши индивидуальные настройки (например, выбранный сезон тренировок «зима/лето» 
                  или закрытые информационные плашки).
                </p>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-top:24px;border-top:1px solid var(--border-glass);padding-top:18px;">
              <a href="#" id="cookieSettingsPolicyLink" style="color:var(--gold-bright);font-size:0.86rem;text-decoration:underline;">
                <i class="fas fa-file-alt"></i> Читать Политику cookie
              </a>
              <div style="display:flex;gap:10px;">
                <button type="button" class="cookie-btn cookie-btn-reject" id="cookieSaveCustomBtn">Сохранить выбор</button>
                <button type="button" class="cookie-btn cookie-btn-accept" id="cookieAcceptAllFromModalBtn">Принять все</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cookie Policy Modal -->
      <div id="cookiePolicyModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="cookiePolicyTitle">
        <div class="modal-content" style="max-width: 760px;">
          <div class="modal-header">
            <h2 id="cookiePolicyTitle"><i class="fas fa-shield-alt" style="color:var(--gold-primary);margin-right:10px;"></i>Политика обработки файлов cookie</h2>
            <span class="modal-close" id="cookiePolicyCloseBtn">&times;</span>
          </div>
          <div class="modal-body cookie-policy-content" style="padding: 24px; max-height: 70vh; overflow-y: auto;">
            <p><strong>МОО «Спортивный клуб «СЭНКЁ» (г. Минск, Республика Беларусь)</strong></p>
            <p>
              Настоящая Политика разъясняет пользователям сайта порядок сбора и обработки файлов cookie в соответствии 
              с Законом Республики Беларусь от 07.05.2021 № 99-З «О защите персональных данных» и рекомендациями 
              Национального центра защиты персональных данных Республики Беларусь (НЦЗПД).
            </p>

            <h3>1. Что такое файлы cookie</h3>
            <p>
              Куки (cookie) — это небольшие текстовые файлы, сохраняемые на вашем устройстве (компьютере, смартфоне, планшете) 
              веб-браузером при посещении страниц сайта. Они позволяют распознавать ваше устройство и сохранять информацию 
              о ваших предпочтениях и действиях на сайте.
            </p>

            <h3>2. Цели использования и категории cookie</h3>
            <p>На сайте клуба используются следующие категории файлов cookie:</p>

            <div class="cookie-table-wrap">
              <table class="cookie-table">
                <thead>
                  <tr>
                    <th>Категория</th>
                    <th>Цель обработки</th>
                    <th>Правовое основание</th>
                    <th>Срок хранения</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Технические (необходимые)</strong></td>
                    <td>Обеспечение функционирования сайта, сохранение безопасности и фиксация выбора согласия пользователя.</td>
                    <td>Закон № 99-З (без согласия, обязательное уведомление)</td>
                    <td>Сессия браузера / до 12 месяцев</td>
                  </tr>
                  <tr>
                    <td><strong>Аналитические</strong></td>
                    <td>Сбор обезличенной статистики о посещаемости сайта, наиболее популярных страницах и расписании.</td>
                    <td>Согласие пользователя (ст. 5 Закона № 99-З)</td>
                    <td>До 12 месяцев</td>
                  </tr>
                  <tr>
                    <td><strong>Функциональные</strong></td>
                    <td>Сохранение пользовательских предпочтений (выбранный сезон в расписании, параметры отображения).</td>
                    <td>Согласие пользователя (ст. 5 Закона № 99-З)</td>
                    <td>До 6 месяцев</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>3. Срок действия согласия и порядок его отзыва</h3>
            <p>
              Согласие на обработку файлов cookie действует в течение <strong>12 месяцев</strong> с момента фиксации вашего выбора. 
              По истечении этого срока вам будет повторно предложено подтвердить или изменить параметры.
            </p>
            <p>
              В соответствии со статьёй 5 и статьёй 10 Закона Республики Беларусь № 99-З, 
              <strong>вы имеете право в любой момент изменить свой выбор или полностью отозвать согласие</strong>.
            </p>
            <p>
              Для этого нажмите на ссылку <strong>«Настройки cookie»</strong> в нижней части любой страницы сайта (подвале/футере). 
              В открывшемся окне вы можете снять отметки с необязательных категорий и нажать «Сохранить выбор».
            </p>

            <h3>4. Управление cookie через браузер</h3>
            <p>
              Вы также можете заблокировать или удалить файлы cookie непосредственно через настройки используемого веб-браузера 
              (Chrome, Firefox, Safari, Edge, Яндекс.Браузер). Обратите внимание, что отключение технических файлов cookie 
              может нарушить работу отдельных функций сайта.
            </p>

            <h3>5. Контактная информация</h3>
            <p>
              По вопросам защиты персональных данных вы можете обратиться к администрации клуба:<br>
              Электронная почта: <a href="mailto:senko@bk.ru" class="contact-link">senko@bk.ru</a><br>
              Телефон: <a href="tel:+375296117907" class="contact-link">+375 29 611 79 07</a><br>
              Адрес: г. Минск, ул. Некрасова, 7, 6 этаж.
            </p>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  }

  // Gets current stored consent
  function getConsent() {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (!item) return null;
      return JSON.parse(item);
    } catch (_) {
      return null;
    }
  }

  // Saves consent to localStorage and updates UI
  function saveConsent(data) {
    const consent = {
      necessary: true,
      analytics: !!data.analytics,
      functional: !!data.functional,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch (_) {}

    hideBanner();
    closeAllModals();

    // Custom event dispatch for analytics scripts if installed
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: consent }));
  }

  function showBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
      setTimeout(() => {
        banner.classList.add('show');
      }, 400);
    }
  }

  function hideBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
      banner.classList.remove('show');
    }
  }

  function openSettings() {
    const modal = document.getElementById('cookieSettingsModal');
    if (!modal) return;

    const consent = getConsent();
    const analyticsCheckbox = document.getElementById('cookieCheckboxAnalytics');
    const functionalCheckbox = document.getElementById('cookieCheckboxFunctional');

    if (analyticsCheckbox) {
      analyticsCheckbox.checked = consent ? !!consent.analytics : false;
    }
    if (functionalCheckbox) {
      functionalCheckbox.checked = consent ? !!consent.functional : false;
    }

    modal.classList.add('show');
  }

  function openPolicy() {
    const modal = document.getElementById('cookiePolicyModal');
    if (modal) {
      modal.classList.add('show');
    }
  }

  function closeAllModals() {
    document.querySelectorAll('#cookieSettingsModal, #cookiePolicyModal').forEach(m => {
      m.classList.remove('show');
    });
  }

  // Initialize event listeners
  function initEvents() {
    // Banner buttons
    const acceptAllBtn = document.getElementById('cookieAcceptAllBtn');
    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', () => {
        saveConsent({ analytics: true, functional: true });
      });
    }

    const rejectOptionalBtn = document.getElementById('cookieRejectOptionalBtn');
    if (rejectOptionalBtn) {
      rejectOptionalBtn.addEventListener('click', () => {
        saveConsent({ analytics: false, functional: false });
      });
    }

    const openSettingsBtn = document.getElementById('cookieOpenSettingsBtn');
    if (openSettingsBtn) {
      openSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSettings();
      });
    }

    const bannerPolicyLink = document.getElementById('cookieBannerPolicyLink');
    if (bannerPolicyLink) {
      bannerPolicyLink.addEventListener('click', (e) => {
        e.preventDefault();
        openPolicy();
      });
    }

    // Modal buttons
    const saveCustomBtn = document.getElementById('cookieSaveCustomBtn');
    if (saveCustomBtn) {
      saveCustomBtn.addEventListener('click', () => {
        const analytics = document.getElementById('cookieCheckboxAnalytics')?.checked || false;
        const functional = document.getElementById('cookieCheckboxFunctional')?.checked || false;
        saveConsent({ analytics, functional });
      });
    }

    const acceptAllFromModalBtn = document.getElementById('cookieAcceptAllFromModalBtn');
    if (acceptAllFromModalBtn) {
      acceptAllFromModalBtn.addEventListener('click', () => {
        saveConsent({ analytics: true, functional: true });
      });
    }

    const settingsPolicyLink = document.getElementById('cookieSettingsPolicyLink');
    if (settingsPolicyLink) {
      settingsPolicyLink.addEventListener('click', (e) => {
        e.preventDefault();
        openPolicy();
      });
    }

    // Modal close buttons
    const settingsCloseBtn = document.getElementById('cookieSettingsCloseBtn');
    if (settingsCloseBtn) {
      settingsCloseBtn.addEventListener('click', () => {
        document.getElementById('cookieSettingsModal')?.classList.remove('show');
      });
    }

    const policyCloseBtn = document.getElementById('cookiePolicyCloseBtn');
    if (policyCloseBtn) {
      policyCloseBtn.addEventListener('click', () => {
        document.getElementById('cookiePolicyModal')?.classList.remove('show');
      });
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
      if (e.target.id === 'cookieSettingsModal' || e.target.id === 'cookiePolicyModal') {
        e.target.classList.remove('show');
      }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });

    // Global delegation for footer links
    document.addEventListener('click', (e) => {
      const settingsTrigger = e.target.closest('#cookieSettingsBtn, .cookie-settings-link, [data-open-cookies]');
      if (settingsTrigger) {
        e.preventDefault();
        openSettings();
        return;
      }

      const policyTrigger = e.target.closest('#cookiePolicyBtn, .cookie-policy-link, [data-open-cookie-policy]');
      if (policyTrigger) {
        e.preventDefault();
        openPolicy();
      }
    });
  }

  // Setup on page load
  function init() {
    injectCookieDOM();
    initEvents();

    if (window.location.hash === '#open-cookies') {
      openSettings();
    } else if (window.location.hash === '#cookie-policy') {
      openPolicy();
    } else if (!consent) {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global methods
  window.openCookieSettings = openSettings;
  window.openCookiePolicy = openPolicy;
  window.getCookieConsent = getConsent;
})();
