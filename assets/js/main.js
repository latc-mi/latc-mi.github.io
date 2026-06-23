/**
 * LATC Training Calendar
 * Renders an interactive monthly calendar for training plans.
 */
(function () {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────
  let currentDate = new Date();
  let trainingData = [];   // populated from inline JSON

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map intensity strings to CSS modifier classes
  function intensityClass(str) {
    if (!str) return 'easy';
    const s = str.toLowerCase();
    if (s.includes('rest')) return 'rest';
    if (s.includes('hard')) return 'hard';
    if (s.includes('moderate')) return 'moderate';
    return 'easy';
  }

  // Escape text for safe use inside HTML attributes / markup
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Build the full-detail tooltip text shown on hover over a day's pills
  function eventTooltip(ev) {
    const parts = [];
    if (ev.title) parts.push(ev.title);
    if (ev.workout && ev.workout !== ev.title) parts.push(ev.workout);
    if (ev.distance && ev.distance !== '0') parts.push('📏 ' + ev.distance);
    if (ev.focus) parts.push('🎯 ' + ev.focus);
    if (ev.intensity) parts.push('Intensity: ' + ev.intensity);
    return parts.join('\n');
  }

  // Parse "YYYY-MM-DD" → Date (local midnight, avoids UTC offset issues)
  function parseDate(str) {
    const parts = str.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }

  // Format a Date to "YYYY-MM-DD"
  function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Build a flat map: date string → array of event objects
  function buildEventMap() {
    const map = {};

    // Training days
    trainingData.forEach(function (week) {
      if (!week.days) return;
      week.days.forEach(function (day) {
        if (!day.date) return;
        const key = day.date;
        if (!map[key]) map[key] = [];
        map[key].push({
          type: 'training',
          title: day.title || day.workout,
          intensity: day.intensity || 'Easy',
          workout: day.workout,
          distance: day.distance,
          focus: day.focus,
          weekTheme: week.theme,
          dayLabel: day.day
        });
      });
    });

    return map;
  }

  // ─── Rendering ───────────────────────────────────────────────────────────

  function renderCalendar() {
    const calGrid = document.getElementById('cal-body');
    const monthLabel = document.getElementById('cal-month-label');
    if (!calGrid || !monthLabel) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

    const eventMap = buildEventMap();
    const today = formatDate(new Date());

    // First day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-cell cal-cell--empty"><div class="cal-date"></div></div>';
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const events = eventMap[dateStr] || [];
      const isToday = dateStr === today;
      const hasEvents = events.length > 0;

      let classes = 'cal-cell';
      if (isToday) classes += ' cal-cell--today';
      if (hasEvents) classes += ' cal-cell--has-event';

      let eventsHtml = '';
      events.forEach(function (ev) {
        const ic = intensityClass(ev.intensity);
        const label = ev.title || ev.dayLabel || 'Training';
        const tip = eventTooltip(ev) || label;
        eventsHtml += `<span class="cal-event-pill cal-event-pill--${ic}" title="${escapeHtml(tip)}">${escapeHtml(label)}</span>`;
      });

      let cellAttrs = '';
      if (hasEvents) {
        const cellTip = events.map(eventTooltip).join('\n\n');
        cellAttrs = ` data-date="${dateStr}" title="${escapeHtml(cellTip)}"`;
      }

      html += `<div class="${classes}"${cellAttrs}>`;
      html += `<div class="cal-date">${d}</div>`;
      html += eventsHtml;
      html += '</div>';
    }

    calGrid.innerHTML = html;

    // Attach click events
    calGrid.querySelectorAll('.cal-cell--has-event').forEach(function (cell) {
      cell.addEventListener('click', function () {
        openDetail(this.dataset.date, eventMap);
      });
    });
  }

  function openDetail(dateStr, eventMap) {
    const events = eventMap[dateStr] || [];
    if (!events.length) return;

    const modal = document.getElementById('cal-detail');
    const modalHeader = document.getElementById('cal-detail-title');
    const modalBody = document.getElementById('cal-detail-body');

    if (!modal || !modalHeader || !modalBody) return;

    const d = parseDate(dateStr);
    const dayName = DAY_NAMES[d.getDay()];
    const monthName = MONTH_NAMES[d.getMonth()];
    modalHeader.textContent = `${dayName}, ${monthName} ${d.getDate()}, ${d.getFullYear()}`;

    let bodyHtml = '';
    events.forEach(function (ev) {
      const ic = intensityClass(ev.intensity);
      bodyHtml += `
        <div style="margin-bottom:1rem">
          <div style="margin-bottom:0.4rem">
            <strong style="font-family:var(--font-heading,Oswald,sans-serif);font-size:1.05rem;color:#0d1b55;text-transform:uppercase">${ev.title || 'Training Session'}</strong>
          </div>
          ${ev.weekTheme ? `<div style="font-size:0.8rem;color:#6b6b8a;margin-bottom:0.5rem;font-style:italic">Week Theme: ${ev.weekTheme}</div>` : ''}
          <p style="font-size:0.95rem;color:#3a3a5c;margin-bottom:0.5rem">${ev.workout || ''}</p>
          <div style="display:flex;gap:1rem;flex-wrap:wrap;font-size:0.85rem;color:#6b6b8a">
            ${ev.distance && ev.distance !== '0' ? `<span>📏 ${ev.distance}</span>` : ''}
            ${ev.focus ? `<span>🎯 ${ev.focus}</span>` : ''}
            ${ev.intensity ? `<span class="intensity intensity--${ic}">${ev.intensity}</span>` : ''}
          </div>
        </div>`;
    });

    modalBody.innerHTML = bodyHtml;
    modal.classList.add('is-open');

    // Lock background scroll without shifting layout: reserve the width the
    // scrollbar occupied so removing it doesn't reflow the calendar.
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarW > 0) {
      document.body.style.paddingRight = scrollbarW + 'px';
    }
  }

  function closeDetail() {
    const modal = document.getElementById('cal-detail');
    if (modal) modal.classList.remove('is-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  // ─── List View: hide past weeks ──────────────────────────────────────────

  // Hides weeks that have already ended and inserts a toggle to reveal them.
  function setupListPastToggle() {
    const listView = document.getElementById('training-list-view');
    if (!listView) return;

    const weeks = Array.prototype.slice.call(
      listView.querySelectorAll('.training-week')
    );
    if (!weeks.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastWeeks = weeks.filter(function (w) {
      const end = w.getAttribute('data-end-date');
      if (!end) return false;
      return parseDate(end) < today;
    });

    if (!pastWeeks.length) return; // nothing in the past — no toggle needed

    pastWeeks.forEach(function (w) { w.hidden = true; });

    let expanded = false;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'past-weeks-toggle';

    function update() {
      const n = pastWeeks.length;
      toggle.textContent = expanded
        ? '▾ Hide previous weeks'
        : '▸ Show ' + n + ' previous week' + (n === 1 ? '' : 's');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      expanded = !expanded;
      pastWeeks.forEach(function (w) { w.hidden = !expanded; });
      update();
    });

    update();
    listView.insertBefore(toggle, listView.firstChild);
  }

  // ─── View Toggle ─────────────────────────────────────────────────────────

  function setupViewToggle() {
    const btnList = document.getElementById('view-list-btn');
    const btnCal = document.getElementById('view-cal-btn');
    const listView = document.getElementById('training-list-view');
    const calView = document.getElementById('training-cal-view');

    if (!btnList || !btnCal || !listView || !calView) return;

    function showList() {
      listView.hidden = false;
      calView.hidden = true;
      btnList.classList.add('is-active');
      btnCal.classList.remove('is-active');
      localStorage.setItem('latc-training-view', 'list');
    }

    function showCal() {
      listView.hidden = true;
      calView.hidden = false;
      btnCal.classList.add('is-active');
      btnList.classList.remove('is-active');
      renderCalendar();
      localStorage.setItem('latc-training-view', 'calendar');
    }

    btnList.addEventListener('click', showList);
    btnCal.addEventListener('click', showCal);

    // Restore saved preference
    const saved = localStorage.getItem('latc-training-view');
    if (saved === 'calendar') {
      showCal();
    } else {
      showList();
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    // Load data from embedded JSON script tag
    const trainingJson = document.getElementById('training-plans-data');

    if (trainingJson) {
      try { trainingData = JSON.parse(trainingJson.textContent); } catch (e) { trainingData = []; }
    }

    // Default the calendar to the current month. Past months stay reachable
    // via the ← previous-month arrow, so old training dates are hidden by
    // default but never lost.
    const now = new Date();
    currentDate = new Date(now.getFullYear(), now.getMonth(), 1);

    // Hide past weeks in the list view behind a "Show previous weeks" toggle.
    setupListPastToggle();

    // Calendar navigation
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        renderCalendar();
      });
    }

    // Modal close
    const closeBtn = document.getElementById('cal-detail-close');
    const closeBtnFooter = document.getElementById('cal-detail-close-footer');
    const modal = document.getElementById('cal-detail');

    if (closeBtn) closeBtn.addEventListener('click', closeDetail);
    if (closeBtnFooter) closeBtnFooter.addEventListener('click', closeDetail);
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeDetail();
      });
    }

    // Keyboard close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDetail();
    });

    setupViewToggle();
  }

  // ─── Mobile Nav Toggle ───────────────────────────────────────────────────

  function setupNav() {
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ─── QR Share ──────────────────────────────────────────────────────────────
  // Shows a QR code for the current page so it can be shared by having someone
  // scan it with a phone camera.

  function setupQrShare() {
    const btn = document.getElementById('qr-share-btn');
    const modal = document.getElementById('qr-modal');
    const closeBtn = document.getElementById('qr-modal-close');
    const codeEl = document.getElementById('qr-modal-code');
    const urlEl = document.getElementById('qr-modal-url');

    if (!btn || !modal || !codeEl) return;

    let rendered = false;

    function renderCode() {
      if (rendered) return;
      const url = window.location.href;

      if (urlEl) {
        urlEl.href = url;
        urlEl.textContent = url;
      }

      // typeNumber 0 = auto-size; 'M' = ~15% error correction (robust for print/screen)
      if (typeof qrcode === 'function') {
        try {
          const qr = qrcode(0, 'M');
          qr.addData(url);
          qr.make();
          // Render as a raster <img> (data URL) rather than an inline SVG.
          // Chrome's "Auto Dark Theme" on Android rewrites the colors of inline
          // SVG / vector content, which turns the QR into an invisible
          // white-on-white square. It leaves raster <img> elements alone, so
          // rendering the code as an image keeps it scannable in dark mode.
          // cellSize 8 + margin 16 gives a high-res image that the CSS scales
          // down crisply (image-rendering: pixelated).
          const img = new Image();
          img.alt = 'QR code to open this page';
          img.src = qr.createDataURL(8, 16);
          codeEl.innerHTML = '';
          codeEl.appendChild(img);
        } catch (e) {
          codeEl.textContent = 'Unable to generate QR code.';
        }
      } else {
        codeEl.textContent = 'Unable to generate QR code.';
      }
      rendered = true;
    }

    function open() {
      renderCode();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');

      // Lock background scroll without shifting layout.
      const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarW > 0) document.body.style.paddingRight = scrollbarW + 'px';

      if (closeBtn) closeBtn.focus();
    }

    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      btn.focus();
    }

    btn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupNav();
    setupQrShare();
    if (document.getElementById('training-list-view') || document.getElementById('training-cal-view')) {
      init();
    }
  });

})();
