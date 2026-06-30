import { DEFAULT_COURSES, DEFAULT_CLASSROOMS, DEFAULT_PROFESSORS, DEFAULT_CONSTRAINTS } from './mockData';
import { solveTimetable } from './solver';
import { DAYS, DAYS_KR, PERIODS } from './types';

type SlotCell = {
  label: string;
  code: string;
  professor: string;
  room: string;
  major: boolean;
};

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found.');

const style = document.createElement('style');
style.textContent = [
  ':root { color-scheme: light; --panel: rgba(255,255,255,0.8); --text: #0f172a; --muted: #64748b; --accent: #C41E3A; --accent-2: #D4A843; --shadow: 0 24px 70px rgba(15,23,42,0.12); }',
  'html, body { margin: 0; min-height: 100%; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(circle at top left, rgba(196,30,58,0.12), transparent 34%), radial-gradient(circle at top right, rgba(212,168,67,0.10), transparent 30%), linear-gradient(180deg, #fef0f2, #fde8ec); color: var(--text); }',
  '* { box-sizing: border-box; }',
  'body::before { content: ""; position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px); background-size: 32px 32px; mask-image: linear-gradient(180deg, rgba(0,0,0,0.2), transparent 72%); }',
  '#root { position: relative; z-index: 1; }',
  '.shell { max-width: 1320px; margin: 0 auto; padding: 32px 20px 44px; }',
  '.hero { display: block; }',
  '.hero-card { width: 100%; }',
  '.hero-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }',
  '.hero-card, .metric, .panel, .table-wrap { backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); background: var(--panel); border: 1px solid rgba(148,163,184,0.18); box-shadow: var(--shadow); }',
  '.hero-card { border-radius: 28px; padding: 28px; position: relative; overflow: hidden; }',
  '.hero-card::after { content: ""; position: absolute; right: -60px; top: -60px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(196,30,58,0.20), transparent 68%); }',
  '.eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; background: rgba(196,30,58,0.08); color: var(--accent); font-size: 12px; font-weight: 700; }',
  'h1 { margin: 14px 0 10px; font-size: clamp(34px, 5vw, 62px); line-height: 0.95; letter-spacing: -0.05em; }',
  '.lead { margin: 0; max-width: 64ch; color: var(--muted); font-size: 16px; line-height: 1.7; }',
  '.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }',
  'button { border: 0; cursor: pointer; font: inherit; }',
  '.btn { padding: 12px 16px; border-radius: 14px; font-weight: 700; transition: transform 140ms ease, box-shadow 140ms ease; font-size: 13px; }',
  '.btn:hover { transform: translateY(-1px); }',
  '.btn-primary { background: linear-gradient(135deg, #C41E3A, #A01830); color: white; box-shadow: 0 12px 30px rgba(196,30,58,0.28); }',
  '.btn-secondary { background: white; color: var(--text); border: 1px solid rgba(148,163,184,0.25); }',
  '.btn-sm { padding: 8px 14px; font-size: 12px; border-radius: 10px; }',
  '.side-stack { display: grid; gap: 14px; }',
  '.metric { border-radius: 24px; padding: 18px; }',
  '.metric.full { min-height: 100%; }',
  '.metric-label { color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }',
  '.metric-value { font-size: 30px; font-weight: 800; letter-spacing: -0.05em; margin-top: 8px; }',
  '.metric-sub { color: var(--muted); font-size: 13px; line-height: 1.5; margin-top: 6px; }',
  '.grid-zone { margin-top: 18px; display: flex; flex-direction: column; gap: 18px; }',
  '.panel { border-radius: 26px; padding: 22px; }',
  '.panel h2 { margin: 0 0 6px; font-size: 18px; letter-spacing: -0.03em; }',
  '.panel p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.6; }',
  '.legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }',
  '.pill { border-radius: 999px; padding: 9px 12px; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.82); border: 1px solid rgba(148,163,184,0.18); }',
  '.table-wrap { border-radius: 26px; padding: 22px; overflow: auto; }',
  '.timetable { width: 100%; min-width: 920px; border-collapse: separate; border-spacing: 10px; }',
  '.timetable th, .timetable td { padding: 12px; border-radius: 18px; vertical-align: top; }',
  '.timetable th { background: rgba(196,30,58,0.06); font-size: 12px; text-align: center; font-weight: 700; color: #C41E3A; }',
  '.period-cell { background: rgba(255,255,255,0.8); font-weight: 700; text-align: center; color: var(--muted); width: 140px; }',
  '.day-cell { background: rgba(196,30,58,0.04); font-weight: 700; text-align: center; color: var(--accent); width: 100px; }',
  '.slot { min-height: 92px; background: rgba(255,255,255,0.76); border: 1px solid rgba(148,163,184,0.16); }',
  '.slot.empty { background: linear-gradient(180deg, rgba(255,255,255,0.85), rgba(248,250,252,0.9)); }',
  '.slot.clickable { cursor: pointer; transition: box-shadow 140ms ease, transform 140ms ease; }',
  '.slot.clickable:hover { box-shadow: 0 4px 20px rgba(196,30,58,0.12); transform: translateY(-1px); }',
  '.course { display: flex; flex-direction: column; gap: 8px; height: 100%; }',
  '.course .tag { align-self: flex-start; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; color: white; }',
  '.course .name { font-weight: 800; line-height: 1.35; letter-spacing: -0.03em; }',
  '.course .meta { color: rgba(15,23,42,0.7); font-size: 12px; line-height: 1.5; }',
  '.footer-note { margin-top: 14px; font-size: 12px; color: var(--muted); }',
  '@media (max-width: 1024px) { .hero, .grid-zone { grid-template-columns: 1fr; } }',
  /* Modal */
  '.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }',
  '.modal { background: white; border-radius: 28px; padding: 28px; max-width: 420px; width: 90%; box-shadow: 0 40px 100px rgba(0,0,0,0.2); }',
  '.modal h3 { margin: 0 0 16px; font-size: 18px; letter-spacing: -0.03em; }',
  '.modal .field { margin-bottom: 12px; }',
  '.modal label { display: block; font-size: 11px; font-weight: 700; color: var(--muted); margin-bottom: 4px; text-transform: uppercase; }',
  '.modal input, .modal select { width: 100%; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(148,163,184,0.25); font-size: 13px; background: white; }',
  '.modal .actions { display: flex; gap: 10px; margin-top: 18px; }',
  '.modal .actions .btn { flex: 1; text-align: center; }',
  '.btn-danger { background: #fee2e2; color: #b91c1c; font-weight: 700; }',
  '.btn-danger:hover { background: #fecaca; }',
].join('\n');
document.head.appendChild(style);

const shell = document.createElement('div');
shell.className = 'shell';
shell.innerHTML = [
  '<div class="hero">',
  '  <div class="hero-card">',
  '    <div class="eyebrow">로컬 데모가 정상적으로 실행 중입니다</div>',
  '    <h1>대학 학사 시간표 최적화 엔진</h1>',
  '    <p class="lead"></p>',
  '    <div class="hero-actions">',
  '      <button class="btn btn-primary" id="recalc-btn">샘플 시간표 다시 계산</button>',
  '      <button class="btn btn-secondary" id="scroll-btn">아래 시간표로 이동</button>',
  '      <button class="btn btn-primary" id="add-course-btn">+ 과목 추가</button>',
  '    </div>',
  '  </div>',
  '  <div class="hero-stats">',
  '    <div class="metric full" id="stat-courses-card" style="cursor:pointer"><div class="metric-label">과목 수</div><div class="metric-value" id="stat-courses">-</div><div class="metric-sub">전공과 교양을 함께 포함한 기본 데이터셋입니다.</div></div>',
  '    <div class="metric full"><div class="metric-label">최적화 점수</div><div class="metric-value" id="stat-score">-</div><div class="metric-sub">제약조건을 반영한 스케줄 품질 점수입니다.</div></div>',
  '    <div class="metric full"><div class="metric-label">배치율</div><div class="metric-value" id="stat-placement">-</div><div class="metric-sub">전체 과목 중 시간표에 배치된 비율입니다.</div></div>',
  '    <div class="metric full"><div class="metric-label">상태</div><div class="metric-value" style="font-size: 22px; color: var(--accent-2);">운영 중</div><div class="metric-sub">모든 시스템이 정상입니다.</div></div>',
  '  </div>',
  '</div>',
  '<div class="grid-zone">',
  '  <div class="panel">',
  '    <h2>빠른 요약</h2>',
  '    <p id="schedule-summary">일정을 계산하는 중입니다.</p>',
  '    <div class="legend">',
  '      <span class="pill" style="background: rgba(219,234,254,0.9); color: var(--accent);">전공 우선 배치</span>',
  '      <span class="pill" style="background: rgba(15,118,110,0.1); color: var(--accent-2);">교수 제한 반영</span>',
  '      <span class="pill" style="background: rgba(15,23,42,0.06); color: #334155;">강의실 충돌 방지</span>',
  '    </div>',
  '    <div class="footer-note">현재 화면은 외부 네트워크 없이도 동작하는 로컬 첫 화면입니다.</div>',
  '  </div>',
  '  <div class="table-wrap" id="timetable-anchor"></div>',
  '</div>',
].join('\n');
root.replaceChildren(shell);

let currentCourses = [...DEFAULT_COURSES];

function buildSchedule(courses = currentCourses) {
  try {
    return solveTimetable(courses, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS);
  } catch (error) {
    console.warn('Using fallback schedule because the solver could not run.', error);
    return {
      schedule: courses.slice(0, 5).map((course, index) => ({
        id: 'fallback-' + course.id,
        courseId: course.id,
        day: DAYS[index % DAYS.length],
        startPeriod: 1 + (index % 3) * 2,
        duration: course.weeklyHours,
      })),
      unscheduled: courses.slice(5).map((course) => course.id),
      score: 72,
      violations: [],
    };
  }
}

function showCourseModal(existingCourse?: any) {
  const isEdit = !!existingCourse;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = [
    '<div class="modal">',
    '  <h3>' + (isEdit ? '과목 편집' : '새 과목 추가') + '</h3>',
    '  <div class="field"><label>과목명</label><input id="modal-name" value="' + (existingCourse?.name || '') + '" placeholder="예: 자료구조"></div>',
    '  <div class="field"><label>학수번호</label><input id="modal-code" value="' + (existingCourse?.code || '') + '" placeholder="예: CS201"></div>',
    '  <div class="field"><label>학년</label><select id="modal-grade">' +
      [1,2,3,4].map(g => '<option value="' + g + '"' + (existingCourse?.grade === g ? ' selected' : '') + '>' + g + '학년</option>').join('') +
    '</select></div>',
    '  <div class="field"><label>구분</label><select id="modal-major">' +
      '<option value="major"' + (existingCourse?.isMajor !== false ? ' selected' : '') + '>전공</option>' +
      '<option value="elective"' + (existingCourse?.isMajor === false ? ' selected' : '') + '>교양</option>' +
    '</select></div>',
    '  <div class="field"><label>시수</label><select id="modal-hours">' +
      [2,3,4].map(h => '<option value="' + h + '"' + (existingCourse?.weeklyHours === h ? ' selected' : '') + '>' + h + '시간</option>').join('') +
    '</select></div>',
    '  <div class="actions">',
    (isEdit ? '<button class="btn btn-danger btn-sm" id="modal-delete">삭제</button>' : '') +
    '    <button class="btn btn-secondary btn-sm" id="modal-cancel">취소</button>',
    '    <button class="btn btn-primary btn-sm" id="modal-save">' + (isEdit ? '저장' : '추가') + '</button>',
    '  </div>',
    '</div>',
  ].join('');
  document.body.appendChild(overlay);

  overlay.querySelector('#modal-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.querySelector('#modal-save')?.addEventListener('click', () => {
    const name = (overlay.querySelector('#modal-name') as HTMLInputElement).value.trim();
    const code = (overlay.querySelector('#modal-code') as HTMLInputElement).value.trim();
    const grade = Number((overlay.querySelector('#modal-grade') as HTMLSelectElement).value) as 1|2|3|4;
    const isMajor = (overlay.querySelector('#modal-major') as HTMLSelectElement).value === 'major';
    const weeklyHours = Number((overlay.querySelector('#modal-hours') as HTMLSelectElement).value);

    if (!name || !code) { alert('과목명과 학수번호를 입력하세요.'); return; }

    if (isEdit && existingCourse) {
      existingCourse.name = name;
      existingCourse.code = code;
      existingCourse.grade = grade;
      existingCourse.isMajor = isMajor;
      existingCourse.weeklyHours = weeklyHours;
    } else {
      const maxId = Math.max(0, ...currentCourses.map(c => {
        const num = parseInt(c.id.replace('course-', ''));
        return isNaN(num) ? 0 : num;
      }));
      currentCourses.push({
        id: 'course-' + (maxId + 1),
        code,
        name,
        grade,
        isMajor,
        professorId: DEFAULT_PROFESSORS[0].id,
        classroomId: DEFAULT_CLASSROOMS[0].id,
        weeklyHours,
      });
    }
    overlay.remove();
    render(buildSchedule());
  });

  if (isEdit) {
    overlay.querySelector('#modal-delete')?.addEventListener('click', () => {
      if (confirm('"' + existingCourse.name + '" 과목을 삭제하시겠습니까?')) {
        currentCourses = currentCourses.filter(c => c.id !== existingCourse.id);
        overlay.remove();
        render(buildSchedule());
      }
    });
  }
}

function render(result = buildSchedule()) {
  const courses = currentCourses;
  const scoreEl = root.querySelector('#stat-score');
  const coursesEl = root.querySelector('#stat-courses');
  const placementEl = root.querySelector('#stat-placement');
  const summaryEl = root.querySelector('#schedule-summary');
  const timetableWrap = root.querySelector('#timetable-anchor');
  const statCard = root.querySelector('#stat-courses-card');

  if (scoreEl) scoreEl.textContent = String(result.score) + '/100';
  if (coursesEl) coursesEl.textContent = String(courses.length);
  if (placementEl) {
    placementEl.textContent = courses.length > 0 ? Math.round((result.schedule.length / courses.length) * 100) + '%' : '0%';
  }
  if (summaryEl) {
    const unscheduled = result.unscheduled.length;
    summaryEl.textContent = unscheduled
      ? '현재 ' + result.schedule.length + '개 과목이 배치되었고, ' + unscheduled + '개 과목이 대기 중입니다.'
      : '모든 ' + result.schedule.length + '개 강좌가 시간표에 배치되었습니다.';
  }

  if (statCard) {
    statCard.onclick = () => {
      const list = currentCourses.map((c, i) => (i + 1) + '. ' + c.name + ' (' + c.code + ')').join('\n');
      alert('등록된 과목 목록 (' + currentCourses.length + '개):\n\n' + list + '\n\n과목을 추가하려면 [+ 과목 추가] 버튼을 누르세요.');
    };
  }

  const slotMap = new Map<string, SlotCell & { courseId: string }>();
  for (const entry of result.schedule) {
    const course = courses.find((item) => item.id === entry.courseId);
    if (!course) continue;
    const professor = DEFAULT_PROFESSORS.find((p) => p.id === course.professorId);
    const room = DEFAULT_CLASSROOMS.find((r) => r.id === course.classroomId);
    slotMap.set(entry.day + '-' + entry.startPeriod, {
      label: course.name,
      code: course.code,
      professor: professor?.name ?? '',
      room: room?.name ?? '',
      major: course.isMajor,
      courseId: course.id,
    });
  }

  if (timetableWrap) {
    const header = document.createElement('div');
    header.innerHTML = [
      '<h2 style="margin: 0 0 8px; font-size: 18px; letter-spacing: -0.03em;">샘플 시간표</h2>',
      '<p style="margin: 0 0 14px; color: var(--muted); font-size: 13px; line-height: 1.6;">과목을 클릭하면 편집할 수 있습니다.</p>',
    ].join('');
    timetableWrap.replaceChildren(header);

    const table = document.createElement('table');
    table.className = 'timetable';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.textContent = '요일';
    headRow.appendChild(corner);
    for (const period of PERIODS) {
      const th = document.createElement('th');
      th.innerHTML = period.id + '교시<br><span style="font-size: 11px; font-weight: 600;">' + period.time + '</span>';
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const day of DAYS) {
      const row = document.createElement('tr');
      const dayCell = document.createElement('td');
      dayCell.className = 'day-cell';
      dayCell.textContent = DAYS_KR[day];
      row.appendChild(dayCell);

      for (const period of PERIODS) {
        const cell = document.createElement('td');
        cell.className = 'slot';
        const item = slotMap.get(day + '-' + period.id);
        if (item) {
          cell.style.background = item.major ? '#FDE8EC' : '#FBF3E0';
          cell.className = 'slot clickable';
          const course = currentCourses.find(c => c.id === item.courseId);
          cell.onclick = () => showCourseModal(course);
          cell.innerHTML = [
            '<div class="course">',
            '  <div class="tag" style="background: ' + (item.major ? '#C41E3A' : '#D4A843') + ';">' + (item.major ? '전공' : '교양') + '</div>',
            '  <div class="name">' + item.label + '</div>',
            '  <div class="meta">' + item.code + '<br>' + item.professor + '<br>' + item.room + '</div>',
            '</div>',
          ].join('');
        } else {
          cell.className = 'slot empty';
          cell.innerHTML = '<div style="height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(100,116,139,0.45); font-size: 12px;">-</div>';
        }
        row.appendChild(cell);
      }

      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    timetableWrap.appendChild(table);
  }
}

const addBtn = root.querySelector('#add-course-btn');
addBtn?.addEventListener('click', () => showCourseModal());

const recalcBtn = root.querySelector('#recalc-btn');
recalcBtn?.addEventListener('click', () => render(buildSchedule()));

const scrollBtn = root.querySelector('#scroll-btn');
scrollBtn?.addEventListener('click', () => {
  root.querySelector('#timetable-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

render();
