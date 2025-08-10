/* CodeLingo App (vanilla JS) */
(function() {
  'use strict';

  const STORAGE_KEY = 'codelingo_state_v1';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const todayISO = () => new Date().toISOString().slice(0, 10);
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / (1000*60*60*24));

  const defaultState = () => ({
    theme: 'light',
    selectedCourse: 'python',
    xp: 0,
    hearts: 5,
    streak: 0,
    lastPlayDate: null,
    courses: {
      cpp: initCourse('cpp'),
      python: initCourse('python'),
      java: initCourse('java'),
    },
    badges: [],
  });

  function initCourse(id) {
    return {
      id,
      units: generateUnits(),
      lastUnitIndex: 0,
      lastLessonIndex: 0,
      unlockedUnits: 1,
    };
  }

  const UNIT_TITLES = [
    'Intro & Tooling', 'Variables', 'Expressions & Operators', 'Console I/O', 'Conditionals', 'Loops',
    'Functions/Methods', 'Strings', 'Arrays/Lists', 'Maps/Dictionaries', 'Debugging', 'Big‑O Intuition',
    'File I/O', 'Classes & Objects', 'Testing & Edge Cases', 'Recursion', 'Search', 'Sort', 'Errors/Exceptions', 'Final Review'
  ];

  function generateUnits() {
    return UNIT_TITLES.map((title, idx) => ({
      index: idx,
      title,
      lessons: generateLessonsForUnit(title),
      completedLessons: 0,
    }));
  }

  function generateLessonsForUnit(title) {
    const base = [
      { type: 'mcq', prompt: `${title}: Pick the correct answer`, options: ['A', 'B', 'C'], correctIndex: 1, hint: 'Think fundamentals.' },
      { type: 'fill', prompt: `${title}: Fill the blank`, code: 'print( __ )', answer: '"Hello"', hint: 'Strings use quotes.' },
      { type: 'tf', prompt: `${title}: True or False?`, statement: 'A variable stores data.', answer: true, hint: 'By definition...' },
    ];
    return base;
  }

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // Ensure structure
      return { ...defaultState(), ...parsed };
    } catch {
      return defaultState();
    }
  }

  let state = loadState();

  // Theme
  document.body.setAttribute('data-theme', state.theme);
  const themeToggle = $('#themeToggle');
  const themeToggleSwitch = $('#themeToggleSwitch');
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    state.theme = theme; saveState();
    if (themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'dark');
    if (themeToggleSwitch) themeToggleSwitch.checked = theme === 'dark';
  }
  themeToggle?.addEventListener('click', () => applyTheme(state.theme === 'light' ? 'dark' : 'light'));
  themeToggleSwitch?.addEventListener('change', (e) => applyTheme(e.target.checked ? 'dark' : 'light'));

  // Router
  const views = $$('.view');
  function showView(name) {
    views.forEach(v => v.hidden = v.dataset.route !== name);
    // Tabs ARIA
    $$('.tab').forEach(t => t.setAttribute('aria-current', t.dataset.nav === name ? 'page' : 'false'));
    $('#app')?.focus();
  }
  function navigate(hash) {
    const [route, course, unit, lesson] = hash.replace('#', '').split('/');
    switch (route) {
      case 'home': renderHome(); showView('home'); break;
      case 'courses': renderCourses(); showView('courses'); break;
      case 'map': if (course) { renderMap(course); showView('map'); } else { location.hash = '#courses'; } break;
      case 'lesson': if (course && unit && lesson) { startLesson(course, Number(unit), Number(lesson)); showView('lesson'); } else { location.hash = '#home'; } break;
      case 'profile': renderProfile(); showView('profile'); break;
      default: location.hash = '#home';
    }
  }
  window.addEventListener('hashchange', () => navigate(location.hash || '#home'));

  // Event wiring for static controls
  $('#continueBtn')?.addEventListener('click', () => continueLesson());
  $('#pickPathBtn')?.addEventListener('click', () => { location.hash = '#courses'; });
  $('#backToCourses')?.addEventListener('click', () => { location.hash = '#courses'; });
  $('#backToMap')?.addEventListener('click', () => { location.hash = `#map/${state.selectedCourse}`; });
  $('#resetProgressBtn')?.addEventListener('click', () => { resetProgress(); });
  $('#refillHeartsBtn')?.addEventListener('click', () => { state.hearts = 5; renderHearts(); saveState(); toast('Hearts refilled ❤️'); });

  // Stats
  function updateStatsUI() {
    $('#stat-streak').textContent = `🔥 ${state.streak}-day streak`;
    $('#stat-xp').textContent = `⭐ ${state.xp} XP`;
    $('#stat-hearts').textContent = `❤️ ${state.hearts}`;
  }

  // Streak handling
  function updateStreakOnOpen() {
    const today = todayISO();
    const last = state.lastPlayDate;
    if (!last) {
      state.streak = 1;
    } else {
      const gap = daysBetween(last, today);
      if (gap === 0) {
        // same day, keep streak
      } else if (gap === 1) {
        state.streak += 1;
      } else if (gap > 1) {
        state.streak = 1;
      }
    }
    state.lastPlayDate = today;
    saveState();
  }
  updateStreakOnOpen();

  // Courses rendering
  function renderHome() {
    updateStatsUI();
    const courseId = state.selectedCourse;
    const course = state.courses[courseId];
    const unit = course.units[course.lastUnitIndex] || course.units[0];
    const completed = unit.completedLessons;
    const total = unit.lessons.length;
    $('#lastUnitCard').innerHTML = `
      <div class="unit-head"><span class="tile-badge">${courseLabel(courseId)}</span></div>
      <div class="unit-title">${unit.title}</div>
      <div class="unit-progress" aria-label="Progress">
        ${Array.from({length: total}).map((_,i)=>`<span class="progress-dot ${i<completed?'done':''}"></span>`).join('')}
      </div>
      <div style="margin-top:12px; display:flex; gap:10px;">
        <button class="btn" id="homeStart">Start lesson</button>
        <button class="btn btn-ghost" id="homeMap">View map</button>
      </div>
    `;
    $('#homeStart')?.addEventListener('click', () => startLesson(courseId, course.lastUnitIndex, unit.completedLessons));
    $('#homeMap')?.addEventListener('click', () => { location.hash = `#map/${courseId}`; });

    // wire pick path tiles
    $$('#view-home .course-tile').forEach(btn => btn.addEventListener('click', () => {
      state.selectedCourse = btn.dataset.course; saveState(); location.hash = `#map/${btn.dataset.course}`;
    }));
  }

  function renderCourses() {
    $$('#view-courses .course-tile').forEach(btn => btn.addEventListener('click', () => {
      state.selectedCourse = btn.dataset.course; saveState(); location.hash = `#map/${btn.dataset.course}`;
    }));
  }

  function renderMap(courseId) {
    const course = state.courses[courseId];
    state.selectedCourse = courseId; saveState();
    const grid = $('#unitGrid');
    grid.innerHTML = '';
    course.units.forEach((u, idx) => {
      const card = document.createElement('button');
      card.className = 'unit-card';
      card.setAttribute('role','listitem');
      const unlocked = idx < course.unlockedUnits;
      card.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
      card.innerHTML = `
        <span class="tile-badge" style="background:${idx===0?'var(--sky)':'var(--mint)'}">${idx+1}</span>
        <span class="unit-title">${u.title}</span>
        <span class="unit-progress">${u.lessons.map((_,i)=>`<span class="progress-dot ${i<u.completedLessons?'done':''}"></span>`).join('')}</span>
      `;
      if (unlocked) {
        card.addEventListener('click', () => {
          const lessonIndex = Math.min(u.completedLessons, u.lessons.length-1);
          startLesson(courseId, idx, lessonIndex);
        });
      }
      grid.appendChild(card);
    });
  }

  function courseLabel(id) {
    return id === 'cpp' ? 'C++' : id === 'python' ? 'Python' : 'Java';
  }

  function continueLesson() {
    const c = state.courses[state.selectedCourse];
    const u = c.lastUnitIndex;
    const l = c.lastLessonIndex;
    location.hash = `#lesson/${state.selectedCourse}/${u}/${l}`;
  }

  // Lesson Engine
  let lessonContext = null;

  function startLesson(courseId, unitIndex, lessonIndex) {
    const course = state.courses[courseId];
    lessonContext = { courseId, unitIndex, lessonIndex, tryCount: 0, hinted: false };
    course.lastUnitIndex = unitIndex; course.lastLessonIndex = lessonIndex; saveState();
    renderLesson();
    showView('lesson');
  }

  function renderHearts() {
    const hearts = $('#hearts');
    hearts.innerHTML = '';
    const total = 5;
    for (let i=0;i<total;i++) {
      const el = document.createElement('span');
      el.className = 'heart';
      el.textContent = i < state.hearts ? '❤️' : '🖤';
      hearts.appendChild(el);
    }
    $('#stat-hearts') && updateStatsUI();
  }

  function renderLesson() {
    const { courseId, unitIndex, lessonIndex } = lessonContext;
    const unit = state.courses[courseId].units[unitIndex];
    const lesson = unit.lessons[lessonIndex];

    // progress
    const total = unit.lessons.length;
    const doneCount = unit.completedLessons;
    $('#progressFill').style.width = `${(doneCount/total)*100}%`;
    renderHearts();

    const container = $('#exerciseContainer');
    container.innerHTML = '';

    const prompt = document.createElement('div');
    prompt.className = 'prompt';
    prompt.textContent = lesson.prompt || 'Answer the question';
    container.appendChild(prompt);

    const hintNote = $('#hintNote');
    hintNote.textContent = '';

    if (lesson.type === 'mcq') {
      const answers = document.createElement('div'); answers.className = 'answers';
      lesson.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'answer'; btn.type='button'; btn.textContent = opt; btn.setAttribute('aria-pressed','false');
        btn.addEventListener('click', () => {
          $$('.answer', answers).forEach(b => b.setAttribute('aria-pressed','false'));
          btn.setAttribute('aria-pressed','true');
          container.dataset.selectedIndex = String(idx);
        });
        answers.appendChild(btn);
      });
      container.appendChild(answers);
    } else if (lesson.type === 'fill') {
      const code = document.createElement('pre'); code.className='code-block'; code.textContent = lesson.code;
      const input = document.createElement('input'); input.type='text'; input.className='answer'; input.placeholder='Type your answer'; input.setAttribute('aria-label','Fill the blank');
      input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') checkAnswer(); });
      container.appendChild(code); container.appendChild(input);
    } else if (lesson.type === 'tf') {
      const statement = document.createElement('div'); statement.className='code-block'; statement.textContent = lesson.statement;
      const answers = document.createElement('div'); answers.className='answers';
      ['True','False'].forEach((label, idx) => {
        const btn = document.createElement('button'); btn.className='answer'; btn.type='button'; btn.textContent=label; btn.setAttribute('aria-pressed','false');
        btn.addEventListener('click', ()=>{
          $$('.answer', answers).forEach(b => b.setAttribute('aria-pressed','false'));
          btn.setAttribute('aria-pressed','true');
          container.dataset.selectedValue = String(idx===0);
        });
        answers.appendChild(btn);
      });
      container.appendChild(statement); container.appendChild(answers);
    }

    $('#hintBtn').onclick = () => {
      if (!lesson.hint) { hintNote.textContent = 'No hint available'; return; }
      hintNote.textContent = `Hint: ${lesson.hint}`;
      lessonContext.hinted = true;
    };

    const check = () => checkAnswer();
    $('#checkBtn').onclick = check; $('#checkBtnMobile').onclick = check;
    const skip = () => nextStep();
    $('#skipBtn').onclick = skip; $('#skipBtnMobile').onclick = skip;
  }

  function checkAnswer() {
    const { courseId, unitIndex, lessonIndex } = lessonContext;
    const lesson = state.courses[courseId].units[unitIndex].lessons[lessonIndex];
    let correct = false;

    if (lesson.type === 'mcq') {
      const i = Number($('#exerciseContainer').dataset.selectedIndex ?? -1);
      correct = i === lesson.correctIndex;
    } else if (lesson.type === 'fill') {
      const val = ($('input.answer')?.value ?? '').trim();
      correct = val === lesson.answer;
    } else if (lesson.type === 'tf') {
      const val = $('#exerciseContainer').dataset.selectedValue;
      correct = String(lesson.answer) === String(val);
    }

    if (correct) {
      onCorrect();
    } else {
      onWrong();
    }
  }

  function onCorrect() {
    const { courseId, unitIndex } = lessonContext;
    const unit = state.courses[courseId].units[unitIndex];
    const tryCount = lessonContext.tryCount;
    let gain = 10;
    if (lessonContext.hinted) gain = 5;
    if (tryCount > 0) gain = 0;
    state.xp += gain;
    playConfetti();
    toast(gain > 0 ? `+${gain} XP!` : 'Nice!');

    if (unit.completedLessons < unit.lessons.length) {
      unit.completedLessons += 1;
    }

    // Unlock next unit if finished
    if (unit.completedLessons === unit.lessons.length) {
      const course = state.courses[courseId];
      if (unit.index + 1 > course.lastUnitIndex) course.lastUnitIndex = unit.index; // keep track
      if (course.unlockedUnits < course.units.length && unit.index + 1 === course.unlockedUnits) {
        course.unlockedUnits += 1;
      }
    }

    lessonContext.tryCount = 0; lessonContext.hinted = false;
    saveState();
    nextStep();
  }

  function onWrong() {
    const container = $('#exerciseContainer');
    const selected = $('.answer[aria-pressed="true"]', container) || $('input.answer', container);
    selected && selected.classList.add('wrong');
    setTimeout(()=> selected && selected.classList.remove('wrong'), 400);

    state.hearts = Math.max(0, state.hearts - 1);
    renderHearts(); saveState();
    toast('Try again');
    lessonContext.tryCount += 1;
  }

  function nextStep() {
    const { courseId, unitIndex } = lessonContext;
    const course = state.courses[courseId];
    const unit = course.units[unitIndex];
    if (unit.completedLessons >= unit.lessons.length) {
      // move to next unit
      const nextUnit = Math.min(unitIndex + 1, course.units.length - 1);
      course.lastUnitIndex = nextUnit; course.lastLessonIndex = 0;
      saveState();
      location.hash = `#map/${courseId}`;
      return;
    } else {
      course.lastLessonIndex = unit.completedLessons;
      saveState();
      startLesson(courseId, unitIndex, course.lastLessonIndex);
    }
  }

  // Confetti
  function playConfetti() {
    const container = $('#confetti-container');
    for (let i=0; i<20; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti';
      piece.style.left = `${Math.random()*100}%`;
      piece.style.top = '-10px';
      const colors = ['#00C385', '#4F5DFF', '#FFCB03', '#E91E63'];
      piece.style.background = colors[i % colors.length];
      piece.style.opacity = '1';
      const duration = 1200 + Math.random()*800;
      piece.style.animation = `confettiFall ${duration}ms ease-out forwards`;
      container.appendChild(piece);
      setTimeout(()=>piece.remove(), duration + 100);
    }
  }

  // Toast
  let toastTimeout = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(()=> el.hidden = true, 1500);
  }

  // Accessibility: button ripple coordinates
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--x', `${e.clientX - rect.left}px`);
    btn.style.setProperty('--y', `${e.clientY - rect.top}px`);
  });

  // Keyboard navigation improvements
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#view-home').hidden) return;
      if (!$('#view-lesson').hidden) { location.hash = `#map/${state.selectedCourse}`; }
    }
  });

  function renderProfile() {
    $('#profileStreak').textContent = `${state.streak} days`;
    $('#profileXP').textContent = `${state.xp}`;
    const badgesWrap = $('#badges');
    badgesWrap.innerHTML = '';
    if (state.xp >= 10) badgesWrap.appendChild(makeBadge('First Steps'));
    if (state.streak >= 3) badgesWrap.appendChild(makeBadge('3‑Day Streak'));
    if (state.xp >= 100) badgesWrap.appendChild(makeBadge('Centurion'));
  }
  function makeBadge(label) {
    const el = document.createElement('span'); el.className='badge'; el.innerHTML = `<span class="dot"></span>${label}`; return el;
  }

  function resetProgress() {
    if (!confirm('Reset all progress?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    applyTheme(state.theme);
    navigate('#home');
    toast('Progress reset');
  }

  // Boot
  navigate(location.hash || '#home');
})();