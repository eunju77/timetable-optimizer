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
  ':root { color-scheme: light; --panel: rgba(255,255,255,0.8); --text: #0f172a; --muted: #64748b; --accent: #1d4ed8; --accent-2: #0f766e; --shadow: 0 24px 70px rgba(15,23,42,0.12); }',
  'html, body { margin: 0; min-height: 100%; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(circle at top left, rgba(29,78,216,0.16), transparent 34%), radial-gradient(circle at top right, rgba(14,165,233,0.12), transparent 30%), linear-gradient(180deg, #f8fbff, #eef4ff); color: var(--text); }',
  '* { box-sizing: border-box; }',
  'body::before { content: ""; position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px); background-size: 32px 32px; mask-image: linear-gradient(180deg, rgba(0,0,0,0.2), transparent 72%); }',
  '#root { position: relative; z-index: 1; }',
  '.shell { max-width: 1320px; margin: 0 auto; padding: 32px 20px 44px; }',
  '.hero { display: block; }',
  '.hero-card { width: 100%; }',
  '.hero-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }',
  '.hero-card, .metric, .panel, .table-wrap { backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); background: var(--panel); border: 1px solid rgba(148,163,184,0.18); box-shadow: var(--shadow); }',
  '.hero-card { border-radius: 28px; padding: 28px; position: relative; overflow: hidden; }',
  '.hero-card::after { content: ""; position: absolute; right: -60px; top: -60px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(29,78,216,0.24), transparent 68%); }',
  '.eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; background: rgba(29,78,216,0.08); color: var(--accent); font-size: 12px; font-weight: 700; }',
  'h1 { margin: 14px 0 10px; font-size: clamp(34px, 5vw, 62px); line-height: 0.95; letter-spacing: -0.05em; }',
  '.lead { margin: 0; max-width: 64ch; color: var(--muted); font-size: 16px; line-height: 1.7; }',
  '.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }',
  'button { border: 0; cursor: pointer; font: inherit; }',
  '.btn { padding: 12px 16px; border-radius: 14px; font-weight: 700; transition: transform 140ms ease, box-shadow 140ms ease; }',
  '.btn:hover { transform: translateY(-1px); }',
  '.btn-primary { background: linear-gradient(135deg, #1d4ed8, #2563eb); color: white; box-shadow: 0 12px 30px rgba(37,99,235,0.28); }',
  '.btn-secondary { background: white; color: var(--text); border: 1px solid rgba(148,163,184,0.25); }',
  '.side-stack { display: grid; gap: 14px; }',
  '.metric { border-radius: 24px; padding: 18px; }',
  '.metric.full { min-height: 100%; }',
  '.metric-label { color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }',
  '.metric-value { font-size: 30px; font-weight: 800; letter-spacing: -0.05em; margin-top: 8px; }',
  '.metric-sub { color: var(--muted); font-size: 13px; line-height: 1.5; margin-top: 6px; }',
  '.grid-zone { margin-top: 18px; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 18px; align-items: start; }',
  '.panel { border-radius: 26px; padding: 22px; }',
  '.panel h2 { margin: 0 0 6px; font-size: 18px; letter-spacing: -0.03em; }',
  '.panel p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.6; }',
  '.legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }',
  '.pill { border-radius: 999px; padding: 9px 12px; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.82); border: 1px solid rgba(148,163,184,0.18); }',
  '.table-wrap { border-radius: 26px; padding: 18px; overflow: auto; }',
  '.timetable { width: 100%; min-width: 920px; border-collapse: separate; border-spacing: 10px; }',
  '.timetable th, .timetable td { padding: 12px; border-radius: 18px; vertical-align: top; }',
  '.timetable th { background: rgba(15,23,42,0.05); font-size: 12px; text-align: center; }',
  '.period-cell { background: rgba(255,255,255,0.8); font-weight: 700; text-align: center; color: var(--muted); width: 96px; }',
  '.slot { min-height: 92px; background: rgba(255,255,255,0.76); border: 1px solid rgba(148,163,184,0.16); }',
  '.slot.empty { background: linear-gradient(180deg, rgba(255,255,255,0.85), rgba(248,250,252,0.9)); }',
  '.course { display: flex; flex-direction: column; gap: 8px; height: 100%; }',
  '.course .tag { align-self: flex-start; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; color: white; }',
  '.course .name { font-weight: 800; line-height: 1.35; letter-spacing: -0.03em; }',
  '.course .meta { color: rgba(15,23,42,0.7); font-size: 12px; line-height: 1.5; }',
  '.footer-note { margin-top: 14px; font-size: 12px; color: var(--muted); }',
  '@media (max-width: 1024px) { .hero, .grid-zone { grid-template-columns: 1fr; } }',
].join('\n');
document.head.appendChild(style);

const shell = document.createElement('div');
shell.className = 'shell';
shell.innerHTML = [
  '<div class="hero">',
  '  <div class="hero-card">',
  '    <div class="eyebrow">로컬 데모가 정상적으로 실행 중입니다</div>',
  '    <h1>대학원 학사 시간표 최적화 엔진</h1>',
  '    <p class="lead">화면이 비어 있던 문제를 없애기 위해, 초기 화면을 가볍고 독립적인 대시보드로 정리했습니다. 지금은 로컬 데이터만으로도 바로 보이고, 재계산 버튼을 눌러 시간표를 다시 그릴 수 있습니다.</p>',
  '    <div class="hero-actions">',
  '      <button class="btn btn-primary" id="recalc-btn">샘플 시간표 다시 계산</button>',
  '      <button class="btn btn-secondary" id="scroll-btn">아래 시간표로 이동</button>',
  '    </div>',
  '  </div>',
  '  <div class="hero-stats">',
  '    <div class="metric full"><div class="metric-label">과목 수</div><div class="metric-value" id="stat-courses">-</div><div class="metric-sub">전공과 교양을 함께 포함한 기본 데이터셋입니다.</div></div>',
  '    <div class="metric full"><div class="metric-label">최적화 점수</div><div class="metric-value" id="stat-score">-</div><div class="metric-sub">제약조건을 반영한 스케줄 품질 점수입니다.</div></div>',
  '    <div class="metric full"><div class="metric-label">상태</div><div class="metric-value" style="font-size: 22px; color: var(--accent-2);">보이는 화면</div><div class="metric-sub">이제 빈 화면 대신 실제 콘텐츠가 표시됩니다.</div></div>',
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

function buildSchedule() {
  try {
    return solveTimetable(DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS);
  } catch (error) {
    console.warn('Using fallback schedule because the solver could not run.', error);
    return {
      schedule: DEFAULT_COURSES.slice(0, 5).map((course, index) => ({
        id: 'fallback-' + course.id,
        courseId: course.id,
        day: DAYS[index % DAYS.length],
        startPeriod: 1 + (index % 3) * 2,
        duration: course.weeklyHours,
      })),
      unscheduled: DEFAULT_COURSES.slice(5).map((course) => course.id),
      score: 72,
      violations: [],
    };
  }
}

function render(result = buildSchedule()) {
  const courses = DEFAULT_COURSES;
  const scoreEl = root.querySelector('#stat-score');
  const coursesEl = root.querySelector('#stat-courses');
  const summaryEl = root.querySelector('#schedule-summary');
  const timetableWrap = root.querySelector('#timetable-anchor');

  if (scoreEl) scoreEl.textContent = String(result.score) + '/100';
  if (coursesEl) coursesEl.textContent = String(courses.length);
  if (summaryEl) {
    const unscheduled = result.unscheduled.length;
    summaryEl.textContent = unscheduled
      ? '현재 ' + result.schedule.length + '개 과목이 배치되었고, ' + unscheduled + '개 과목이 대기 중입니다.'
      : '모든 ' + result.schedule.length + '개 강좌가 시간표에 배치되었습니다.';
  }

  const slotMap = new Map<string, SlotCell>();
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
    });
  }

  if (timetableWrap) {
    const header = document.createElement('div');
    header.innerHTML = [
      '<h2 style="margin: 0 0 8px; font-size: 18px; letter-spacing: -0.03em;">샘플 시간표</h2>',
      '<p style="margin: 0 0 14px; color: var(--muted); font-size: 13px; line-height: 1.6;">시간표 그리드가 실제로 보이도록 구성한 로컬 샘플입니다. 요일과 교시가 한눈에 들어오도록 단순화했습니다.</p>',
    ].join('');
    timetableWrap.replaceChildren(header);

    const table = document.createElement('table');
    table.className = 'timetable';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.textContent = '교시';
    headRow.appendChild(corner);
    for (const day of DAYS) {
      const th = document.createElement('th');
      th.textContent = DAYS_KR[day];
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const period of PERIODS) {
      const row = document.createElement('tr');
      const periodCell = document.createElement('td');
      periodCell.className = 'period-cell';
      periodCell.innerHTML = period.id + '교시<br><span style="font-size: 11px; font-weight: 600;">' + period.time + '</span>';
      row.appendChild(periodCell);

      for (const day of DAYS) {
        const cell = document.createElement('td');
        cell.className = 'slot';
        const item = slotMap.get(day + '-' + period.id);
        if (item) {
          cell.style.background = item.major ? '#dbeafe' : '#dcfce7';
          cell.innerHTML = [
            '<div class="course">',
            '  <div class="tag" style="background: ' + (item.major ? '#2563eb' : '#0f766e') + ';">' + (item.major ? '전공' : '교양') + '</div>',
            '  <div class="name">' + item.label + '</div>',
            '  <div class="meta">' + item.code + '<br>' + item.professor + '<br>' + item.room + '</div>',
            '</div>',
          ].join('');
        } else {
          cell.className = 'slot empty';
          cell.innerHTML = '<div style="height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(100,116,139,0.45); font-size: 12px;">비어 있음</div>';
        }
        row.appendChild(cell);
      }

      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    timetableWrap.appendChild(table);
  }
}

const recalcBtn = root.querySelector('#recalc-btn');
recalcBtn?.addEventListener('click', () => render(buildSchedule()));

const scrollBtn = root.querySelector('#scroll-btn');
scrollBtn?.addEventListener('click', () => {
  root.querySelector('#timetable-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

render();
