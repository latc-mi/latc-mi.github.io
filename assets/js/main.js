/**
 * LATC Training Calendar
 * Renders an interactive monthly calendar for training plans.
 */
(function () {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────
  let currentDate = new Date();
  let trainingData = [];   // populated from inline JSON
  let meetData = [];       // populated from inline JSON

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

    // Meet days
    meetData.forEach(function (meet) {
      if (!meet.date) return;
      const key = meet.date;
      if (!map[key]) map[key] = [];
      map[key].push({
        type: 'meet',
        title: meet.name,
        location: meet.location,
        meetType: meet.type,
        description: meet.description,
        isHost: meet.host
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
        if (ev.type === 'training') {
          const ic = intensityClass(ev.intensity);
          eventsHtml += `<span class="cal-event-pill cal-event-pill--${ic}">${ev.title || ev.dayLabel || 'Training'}</span>`;
        } else if (ev.type === 'meet') {
          eventsHtml += `<span class="cal-event-pill cal-event-pill--meet">🏃 ${ev.title}</span>`;
        }
      });

      const dataAttr = hasEvents ? ` data-date="${dateStr}"` : '';

      html += `<div class="${classes}"${dataAttr}>`;
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
      if (ev.type === 'training') {
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
      } else if (ev.type === 'meet') {
        bodyHtml += `
          <div style="margin-bottom:1rem">
            <div style="margin-bottom:0.35rem;display:flex;align-items:center;gap:0.5rem">
              <strong style="font-family:var(--font-heading,Oswald,sans-serif);font-size:1.05rem;color:#0d1b55;text-transform:uppercase">🏆 ${ev.title}</strong>
              ${ev.isHost ? '<span class="badge badge--host">Home Meet</span>' : ''}
            </div>
            <p style="font-size:0.95rem;color:#3a3a5c;margin-bottom:0.4rem">${ev.description || ''}</p>
            <div style="font-size:0.85rem;color:#6b6b8a">
              📍 ${ev.location || ''}
              ${ev.meetType ? ` · <span class="badge badge--blue">${ev.meetType}</span>` : ''}
            </div>
          </div>`;
      }
    });

    modalBody.innerHTML = bodyHtml;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    const modal = document.getElementById('cal-detail');
    if (modal) modal.classList.remove('is-open');
    document.body.style.overflow = '';
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
    // Load data from embedded JSON script tags
    const trainingJson = document.getElementById('training-plans-data');
    const meetJson = document.getElementById('meets-data');

    if (trainingJson) {
      try { trainingData = JSON.parse(trainingJson.textContent); } catch (e) { trainingData = []; }
    }
    if (meetJson) {
      try { meetData = JSON.parse(meetJson.textContent); } catch (e) { meetData = []; }
    }

    // Set calendar to first training month if available
    if (trainingData.length && trainingData[0].start_date) {
      const firstDate = parseDate(trainingData[0].start_date);
      currentDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    }

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

  document.addEventListener('DOMContentLoaded', function () {
    setupNav();
    if (document.getElementById('training-list-view') || document.getElementById('training-cal-view')) {
      init();
    }
  });

})();
