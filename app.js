'use strict';

/* ================= конфигурация ================= */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9wJlQV6N5xvboJv6eT0CmDpFV88wBHkefoVBlxW3_sHaOV6R87jvK0yoAqFTFXZVm/exec';
// ссылка на чат собирается из частей, чтобы не лежать в исходнике целиком
const CHAT_URL_PARTS = ['https://t.me/', '+l61inXuAIvw2MTEy'];
const EVENT_DATE = new Date('2026-08-01T14:00:00+05:00'); // Пермь, UTC+5

const TYPING_LINES = [
  'Wake up, Neo...',
  'The Matrix has you...',
  'Follow the white rabbit.',
  '',
  'Knock, knock, Neo.'
];

const LS = {
  registered: 'hb_registered',
  name: 'hb_name',
  answers: 'hb_answers',
  voted: 'hb_voted'
};

/* ---- голосование «Оскар» ---- */

// голосование открывается автоматически; ?vote в адресе открывает его принудительно (для теста)
const VOTING_OPENS = new Date('2026-08-01T19:00:00+05:00');

const GUESTS = [
  'Ксения Даньшина', 'Мария Малышня', 'Володя Дейнега', 'Александр Блюденов',
  'Ivan K', 'Вячеслав Боровых', 'Диана Дейнега', 'Илья Сыпачев',
  'Надежда Сыпачева', 'Саша Клепцин', 'Егор Занчурин', 'Ксения Боровых',
  'Мария Занчурина', 'Нео Максимович', 'Маша Боброва', 'Алина Баевская',
  'Илья Бобров', 'Александр Висков', 'Арина Вискова'
];

const NOMINATIONS = [
  { key: 'costume', title: 'лучший костюм' },
  { key: 'toast', title: 'лучшее поздравление' },
  { key: 'dish', title: 'лучшее фирменное блюдо' },
  { key: 'footballer', title: 'лучший футболист' },
  { key: 'coach', title: 'лучший онлайн тренер' },
  { key: 'cinema', title: 'лучший киновед' }
];

/* ================= утилиты ================= */

const $ = (sel) => document.querySelector(sel);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// localStorage может быть недоступен (приватный режим, ограничения webview) — не падаем
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* работаем без памяти */ } }
};

function isRegistered() { return store.get(LS.registered) === '1'; }

/* ================= интро №1: печатающийся текст ================= */

function runTypingIntro(onDone) {
  const box = $('#intro-typing');
  const out = $('#typed-text');
  box.hidden = false;

  // до регистрации интро всегда в одном темпе (~11 сек) —
  // быстрая заставка с дождём положена только зарегистрированным
  const speed = 1;
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = ' ';

  let li = 0, ci = 0, finished = false;
  let timer = null;

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    box.hidden = true;
    onDone();
  }

  function tick() {
    if (li >= TYPING_LINES.length) {
      // ровно секунда после финальной фразы — и переход на сайт
      timer = setTimeout(finish, 1000);
      return;
    }
    const line = TYPING_LINES[li];
    if (ci < line.length) {
      cursor.remove();
      out.textContent += line[ci];
      out.appendChild(cursor);
      ci++;
      // человеческий ритм: буквы 45–90 мс, паузы после знаков
      const ch = line[ci - 1];
      let d = 45 + Math.random() * 45;
      if (ch === '.' || ch === ',') d = 300;
      timer = setTimeout(tick, d * speed);
    } else {
      cursor.remove();
      out.textContent += '\n';
      out.appendChild(cursor);
      li++; ci = 0;
      // после последней строки не тянем межстрочную паузу
      const pause = li >= TYPING_LINES.length ? 0 : (line === '' ? 200 : 700) * speed;
      timer = setTimeout(tick, pause);
    }
  }

  $('#skip-typing').addEventListener('click', finish);
  if (reducedMotion) { finish(); return; }
  out.appendChild(cursor);
  timer = setTimeout(tick, 500 * speed);
}

/* ================= интро №2: цифровой дождь ================= */

function runRainIntro(onDone) {
  const box = $('#intro-rain');
  const canvas = $('#rain-canvas');
  box.hidden = false;

  let finished = false;
  let rafId = null;

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(rafId);
    box.hidden = true;
    onDone();
  }

  $('#skip-rain').addEventListener('click', finish);
  if (reducedMotion) { finish(); return; }

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const CHARS = 'アイウエオカキクケコサシスセソ0123456789Z';
  const fontSize = 16;
  const cols = Math.ceil(canvas.width / fontSize);
  const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -40));

  let last = 0;
  function draw(ts) {
    if (ts - last > 50) {
      last = ts;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontSize + 'px monospace';
      for (let i = 0; i < cols; i++) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = Math.random() < 0.1 ? '#c8ffc8' : '#00ff41';
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        drops[i] = drops[i] * fontSize > canvas.height && Math.random() > 0.97 ? 0 : drops[i] + 1;
      }
    }
    rafId = requestAnimationFrame(draw);
  }
  rafId = requestAnimationFrame(draw);
  // дождь идёт бесконечно — выход только по кнопке «вход в матрицу»
}

/* ================= обратный отсчёт ================= */

function startCountdown() {
  const d = $('#cd-d'), h = $('#cd-h'), m = $('#cd-m'), s = $('#cd-s');
  function pad(n) { return String(n).padStart(2, '0'); }
  function update() {
    const diff = EVENT_DATE - Date.now();
    if (diff <= 0) {
      $('#countdown').innerHTML = '<p class="pass-name">СЕАНС НАЧАЛСЯ</p>';
      clearInterval(t);
      return;
    }
    d.textContent = pad(Math.floor(diff / 86400000));
    h.textContent = pad(Math.floor(diff / 3600000) % 24);
    m.textContent = pad(Math.floor(diff / 60000) % 60);
    s.textContent = pad(Math.floor(diff / 1000) % 60);
  }
  update();
  const t = setInterval(update, 1000);
}

/* ================= анкета-мастер ================= */

const TOTAL_STEPS = 3;
let currentStep = 1;

function showStep(n) {
  currentStep = n;
  // строго внутри анкеты — иначе заденет фиелдсеты голосования
  $('#wizard').querySelectorAll('.step').forEach((f) => {
    f.hidden = Number(f.dataset.step) !== n;
  });
  $('#btn-back').hidden = n === 1;
  $('#btn-next').hidden = n === TOTAL_STEPS;
  $('#btn-submit').hidden = n !== TOTAL_STEPS;
  const filled = '█'.repeat(n), empty = '░'.repeat(TOTAL_STEPS - n);
  $('#progress').textContent = `[${filled}${empty}] шаг ${n}/${TOTAL_STEPS}`;
  hideError();
}

function showError(msg) {
  const el = $('#form-error');
  el.textContent = msg;
  el.hidden = false;
}
function hideError() { $('#form-error').hidden = true; }

function validateStep(n) {
  const form = $('#wizard');
  if (n === 1) {
    if (!form.firstName.value.trim()) return 'Введи имя — Матрице нужно знать, кто ты.';
    if (!form.lastName.value.trim()) return 'Введи фамилию.';
  }
  if (n === 2) {
    if (!form.overnight.value) return 'Выбери: остаёшься на ночь или уезжаешь.';
  }
  return null;
}

function collectData() {
  const form = $('#wizard');
  const checked = (name) =>
    Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((i) => i.value);
  const withOther = (name, otherField) => {
    const list = checked(name);
    const other = form[otherField].value.trim();
    if (other) list.push(other);
    return list;
  };
  return {
    firstName: form.firstName.value.trim(),
    lastName: form.lastName.value.trim(),
    overnight: form.overnight.value,
    alcohol: withOther('alcohol', 'alcoholOther'),
    softDrinks: withOther('softDrinks', 'softOther')
  };
}

function prefillForm() {
  let saved;
  try { saved = JSON.parse(store.get(LS.answers) || 'null'); } catch (e) { saved = null; }
  if (!saved) return;
  const form = $('#wizard');
  form.firstName.value = saved.firstName || '';
  form.lastName.value = saved.lastName || '';
  if (saved.overnight) {
    const r = form.querySelector(`input[name="overnight"][value="${saved.overnight}"]`);
    if (r) r.checked = true;
  }
  // отмечаем чекбоксы; значения без своего чекбокса возвращаем в поле «особые пожелания»
  [['alcohol', 'alcoholOther'], ['softDrinks', 'softOther']].forEach(([name, otherField]) => {
    const custom = [];
    (saved[name] || []).forEach((v) => {
      const c = form.querySelector(`input[name="${name}"][value="${v}"]`);
      if (c) c.checked = true; else custom.push(v);
    });
    form[otherField].value = custom.join(', ');
  });
}

async function submitForm() {
  const btn = $('#btn-submit');
  btn.disabled = true;
  btn.textContent = 'отправка...';
  hideError();

  const data = collectData();
  try {
    const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'server error');

    store.set(LS.registered, '1');
    store.set(LS.name, data.firstName);
    store.set(LS.answers, JSON.stringify(data));
    $('#form-screen').hidden = true;
    showAccessScreen(data.firstName);
  } catch (err) {
    showError('Сбой связи с Матрицей. Проверь интернет и нажми «отправить» ещё раз — ответы не потерялись.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'отправить';
  }
}

/* ================= оверлей анкеты ================= */

function openForm() {
  $('#form-screen').hidden = false;
  $('#main').hidden = true;
  $('#form-screen').scrollTop = 0;
}

function closeForm() {
  $('#form-screen').hidden = true;
  $('#main').hidden = false;
}

/* ================= синяя таблетка: фейковое выключение ================= */

const BLUE_LINES = [
  'ты выбрал остаться в матрице, ноль процентов осуждения, правда!',
  'думал наверное, что будешь есть стейки как тот лысый чувак из фильма?',
  'а тут заблокированный интернет, нет бензина и горячей воды из под крана :)',
  'просчитался, но где...'
];
let blueTimers = [];

function runBluePill() {
  const box = $('#blue-screen');
  const flash = $('#crt-flash');
  const out = $('#blue-text');
  const back = $('#blue-return');

  // сброс на случай повторного нажатия
  blueTimers.forEach(clearTimeout);
  blueTimers = [];
  out.textContent = '';
  back.hidden = true;
  box.hidden = false;
  // прячем страницу целиком: в TG-webview fixed-оверлей не всегда перекрывает всё
  $('#main').hidden = true;

  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = ' ';

  function typeLines(li, ci) {
    if (li >= BLUE_LINES.length) {
      back.hidden = false;
      return;
    }
    const line = BLUE_LINES[li];
    cursor.remove();
    if (ci < line.length) {
      out.textContent += line[ci];
      out.appendChild(cursor);
      blueTimers.push(setTimeout(() => typeLines(li, ci + 1), 40 + Math.random() * 35));
    } else {
      out.textContent += '\n';
      out.appendChild(cursor);
      blueTimers.push(setTimeout(() => typeLines(li + 1, 0), 550));
    }
  }

  if (reducedMotion) {
    flash.hidden = true;
    out.textContent = BLUE_LINES.join('\n');
    back.hidden = false;
    return;
  }

  // 1) экран «выключается» (0.5 с) → 2) пару секунд темноты с курсором → 3) печать
  flash.hidden = false;
  blueTimers.push(setTimeout(() => { flash.hidden = true; out.appendChild(cursor); }, 550));
  blueTimers.push(setTimeout(() => typeLines(0, 0), 2500));

  // тап по экрану — промотать печать до конца
  box.onclick = (e) => {
    if (e.target === back || !back.hidden) return;
    blueTimers.forEach(clearTimeout);
    blueTimers = [];
    flash.hidden = true;
    cursor.remove();
    out.textContent = BLUE_LINES.join('\n') + '\n';
    out.appendChild(cursor);
    back.hidden = false;
  };
}

/* ================= голосование «Оскар» ================= */

function votingIsOpen() {
  return location.search.indexOf('vote') > -1 || Date.now() >= VOTING_OPENS;
}

function renderNominations() {
  const box = $('#nominations');
  const me = $('#voter-select').value;
  box.innerHTML = '';
  NOMINATIONS.forEach((nom) => {
    const field = document.createElement('fieldset');
    field.className = 'nom';
    const legend = document.createElement('legend');
    legend.textContent = nom.title;
    field.appendChild(legend);
    GUESTS.forEach((name) => {
      if (name === me) return; // за себя нельзя
      const label = document.createElement('label');
      label.className = 'choice';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = nom.key;
      input.value = name;
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + name));
      field.appendChild(label);
    });
    box.appendChild(field);
  });
}

function initVoting() {
  const sel = $('#voter-select');
  GUESTS.forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  });

  // подставляем себя по имени из регистрации
  const myName = store.get(LS.name);
  if (myName) {
    const guess = GUESTS.find((g) => g.split(' ')[0].toLowerCase() === myName.toLowerCase());
    if (guess) sel.value = guess;
  }
  renderNominations();
  sel.addEventListener('change', renderNominations);

  $('#open-vote').addEventListener('click', () => {
    $('#vote-screen').hidden = false;
    $('#main').hidden = true;
    $('#vote-screen').scrollTop = 0;
  });
  $('#vote-close').addEventListener('click', () => {
    $('#vote-screen').hidden = true;
    $('#main').hidden = false;
  });
  $('#vote-again').addEventListener('click', () => {
    $('#vote-done').hidden = true;
    $('#vote-form').hidden = false;
  });
  $('#vote-form').addEventListener('submit', submitVote);

  if (votingIsOpen()) $('#vote-block').hidden = false;
  if (store.get(LS.voted) === '1') {
    $('#vote-status').hidden = false;
    $('#vote-form').hidden = true;
    $('#vote-done').hidden = false;
  }
}

async function submitVote(e) {
  e.preventDefault();
  const err = $('#vote-error');
  err.hidden = true;

  const form = $('#vote-form');
  const voter = form.voter.value;
  if (!voter) { err.textContent = 'Выбери себя в списке — иначе голос не засчитается.'; err.hidden = false; return; }

  const votes = {};
  const missing = [];
  NOMINATIONS.forEach((nom) => {
    const picked = form.querySelector('input[name="' + nom.key + '"]:checked');
    if (picked) votes[nom.key] = picked.value; else missing.push(nom.title);
  });
  if (missing.length) {
    err.textContent = 'Не выбран номинант: ' + missing.join(', ') + '.';
    err.hidden = false;
    return;
  }

  const btn = $('#vote-submit');
  btn.disabled = true;
  btn.textContent = 'отправка...';

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'vote', voter: voter, votes: votes })
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'server error');
    store.set(LS.voted, '1');
    $('#vote-form').hidden = true;
    $('#vote-done').hidden = false;
    $('#vote-status').hidden = false;
  } catch (ex) {
    err.textContent = 'Голос не ушёл — проверь связь и нажми ещё раз.';
    err.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'отправить голос';
  }
}

/* ================= результаты (экран ведущего) ================= */

const RESULTS_KEY = 'neo';

async function showResults() {
  $('#results-screen').hidden = false;
  $('#main').hidden = true;
  const note = $('#results-note');
  const list = $('#results-list');

  let data;
  try {
    const res = await fetch(APPS_SCRIPT_URL + '?results=' + RESULTS_KEY);
    const json = await res.json();
    if (!json.ok || !json.results) throw new Error('no results');
    data = json.results;
  } catch (e) {
    note.textContent = 'не удалось загрузить результаты — проверь связь и обнови страницу';
    return;
  }

  note.textContent = 'нажимай «вскрыть конверт» по очереди';
  list.innerHTML = '';

  NOMINATIONS.forEach((nom) => {
    const card = document.createElement('div');
    card.className = 'res-card';

    const title = document.createElement('p');
    title.className = 'res-title';
    title.textContent = '> ' + nom.title;
    card.appendChild(title);

    const ranking = data[nom.key] || [];
    const body = document.createElement('div');
    body.hidden = true;

    if (!ranking.length) {
      body.innerHTML = '<p class="res-rest">голосов нет</p>';
    } else {
      const win = document.createElement('p');
      win.className = 'res-winner';
      win.textContent = ranking[0].name.toUpperCase();
      body.appendChild(win);

      const votes = document.createElement('p');
      votes.className = 'res-rest';
      votes.textContent = 'голосов: ' + ranking[0].votes;
      body.appendChild(votes);

      if (ranking.length > 1) {
        const rest = document.createElement('p');
        rest.className = 'res-rest';
        rest.textContent = 'далее: ' + ranking.slice(1, 4)
          .map((r) => r.name + ' (' + r.votes + ')').join(', ');
        body.appendChild(rest);
      }
    }

    const btn = document.createElement('button');
    btn.className = 'btn btn-red';
    btn.textContent = 'вскрыть конверт';
    btn.addEventListener('click', () => { body.hidden = false; btn.hidden = true; }, { once: true });

    card.appendChild(btn);
    card.appendChild(body);
    list.appendChild(card);
  });
}

/* ================= экран «доступ разрешён» ================= */

function showAccessScreen(name) {
  const box = $('#access-screen');
  $('#access-name').textContent = name ? `агент ${name.toUpperCase()}` : 'агент';
  box.hidden = false;
  $('#main').hidden = true;

  // заголовок печатается, как в интро, только быстро
  const title = $('#access-title');
  const full = 'ACCESS\nGRANTED';
  title.textContent = '';
  let i = 0;
  const t = setInterval(() => {
    title.textContent = full.slice(0, ++i);
    if (i >= full.length) clearInterval(t);
  }, reducedMotion ? 0 : 90);

  $('#access-continue').addEventListener('click', () => {
    clearInterval(t);
    box.hidden = true;
    $('#main').hidden = false;
    unlock(name, false);
    // мгновенный скролл: пропуск встаёт ровно на место анкеты
    $('#unlocked').scrollIntoView();
  }, { once: true });
}

/* ================= разблокировка контента ================= */

function unlock(name, scrollTo) {
  $('#unlocked').hidden = false;
  $('#form-screen').hidden = true;
  $('#pill-choice').hidden = true;
  $('#hero-registered').hidden = false;
  $('#pass-name').textContent = name ? `агент ${name.toUpperCase()}` : 'агент';
  $('#chat-link').href = CHAT_URL_PARTS.join('');
  if (scrollTo) $('#unlocked').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
}

function reopenForm() {
  prefillForm();
  $('#form-intro-note').textContent = 'Обнови ответы и отправь анкету заново — учтётся последняя версия.';
  showStep(1);
  openForm();
}

/* ================= инициализация ================= */

function initMain() {
  $('#main').hidden = false;
  startCountdown();
  if (isRegistered()) unlock(store.get(LS.name) || '', false);
}

document.addEventListener('DOMContentLoaded', () => {
  // служебный сброс состояния для тестов: открыть сайт с ?reset
  if (location.search.indexOf('reset') > -1) {
    try { localStorage.clear(); } catch (e) {}
    location.replace(location.pathname);
    return;
  }

  // мастер
  showStep(1);
  $('#btn-next').addEventListener('click', () => {
    const err = validateStep(currentStep);
    if (err) { showError(err); return; }
    showStep(currentStep + 1);
  });
  $('#btn-back').addEventListener('click', () => showStep(currentStep - 1));
  $('#wizard').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = validateStep(currentStep);
    if (err) { showError(err); return; }
    submitForm();
  });
  $('#btn-edit').addEventListener('click', reopenForm);
  initVoting();

  // «не пью алкоголь» исключает остальные варианты
  const noAlc = $('#no-alcohol');
  document.querySelectorAll('input[name="alcohol"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      if (cb === noAlc && cb.checked) {
        document.querySelectorAll('input[name="alcohol"]').forEach((o) => { if (o !== noAlc) o.checked = false; });
      } else if (cb.checked) {
        noAlc.checked = false;
      }
    });
  });

  // выбор таблетки
  $('#pill-red').addEventListener('click', openForm);
  $('#form-close').addEventListener('click', closeForm);
  $('#pill-blue').addEventListener('click', runBluePill);
  $('#blue-return').addEventListener('click', () => {
    blueTimers.forEach(clearTimeout);
    $('#blue-screen').hidden = true;
    $('#main').hidden = false;
    window.scrollTo({ top: 0 });
  });

  // экран ведущего с результатами — минуя интро и всё остальное
  if (location.search.indexOf('results') > -1) { showResults(); return; }

  // интро
  if (isRegistered()) {
    runRainIntro(initMain);
  } else {
    runTypingIntro(initMain);
  }
});
