import { useState, useEffect } from 'react';
import { Course, Professor, Classroom, TimetableEntry, SchedulingConstraints } from './types';
import { DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS } from './mockData';
import { solveTimetable } from './solver';
import ConfigPanel from './components/ConfigPanel';
import TimetableGrid from './components/TimetableGrid';
import AnalyticsPanel from './components/AnalyticsPanel';
import AIReviewer from './components/AIReviewer';
import { Sparkles, RefreshCw, RotateCcw, Printer, GraduationCap, Server, HelpCircle, FileText } from 'lucide-react';

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [constraints, setConstraints] = useState<SchedulingConstraints>(DEFAULT_CONSTRAINTS);
  const [schedule, setSchedule] = useState<TimetableEntry[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [unscheduledCourses, setUnscheduledCourses] = useState<string[]>([]);
  const [optimizationScore, setOptimizationScore] = useState<number>(0);

  // Load initial CS department mock data
  useEffect(() => {
    // Check if there is data in localStorage
    const savedCourses = localStorage.getItem('cs_courses');
    const savedProfs = localStorage.getItem('cs_professors');
    const savedRooms = localStorage.getItem('cs_classrooms');
    const savedConstraints = localStorage.getItem('cs_constraints');
    const savedSchedule = localStorage.getItem('cs_schedule');

    if (savedCourses && savedProfs && savedRooms && savedConstraints && savedSchedule) {
      setCourses(JSON.parse(savedCourses));
      setProfessors(JSON.parse(savedProfs));
      setClassrooms(JSON.parse(savedRooms));
      setConstraints(JSON.parse(savedConstraints));
      setSchedule(JSON.parse(savedSchedule));
    } else {
      handleResetToDefault();
    }
  }, []);

  // Sync to localStorage
  const saveStateToLocalStorage = (
    c: Course[],
    p: Professor[],
    r: Classroom[],
    ct: SchedulingConstraints,
    s: TimetableEntry[]
  ) => {
    localStorage.setItem('cs_courses', JSON.stringify(c));
    localStorage.setItem('cs_professors', JSON.stringify(p));
    localStorage.setItem('cs_classrooms', JSON.stringify(r));
    localStorage.setItem('cs_constraints', JSON.stringify(ct));
    localStorage.setItem('cs_schedule', JSON.stringify(s));
  };

  const handleResetToDefault = () => {
    setCourses(DEFAULT_COURSES);
    setProfessors(DEFAULT_PROFESSORS);
    setClassrooms(DEFAULT_CLASSROOMS);
    setConstraints(DEFAULT_CONSTRAINTS);

    // Solve immediately on mock load
    setIsOptimizing(true);
    setTimeout(() => {
      const result = solveTimetable(DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS);
      setSchedule(result.schedule);
      setUnscheduledCourses(result.unscheduled);
      setOptimizationScore(result.score);
      setIsOptimizing(false);
      saveStateToLocalStorage(DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS, result.schedule);
    }, 400);
  };

  const handleClearAll = () => {
    setCourses([]);
    setProfessors([]);
    setClassrooms([]);
    setSchedule([]);
    setUnscheduledCourses([]);
    setOptimizationScore(0);
    saveStateToLocalStorage([], [], [], constraints, []);
  };

  // Run fullstack or fallback optimization
  const handleOptimizeSchedule = async () => {
    setIsOptimizing(true);
    try {
      // 1. Try backend API optimization
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses,
          professors,
          classrooms,
          constraints,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSchedule(result.schedule);
        setUnscheduledCourses(result.unscheduled);
        setOptimizationScore(result.score);
      } else {
        throw new Error('Backend offline or failed');
      }
    } catch (error) {
      console.warn("Backend optimization failed, falling back to clientside solver", error);
      // 2. Fallback to offline clientside solver (resilient design)
      const result = solveTimetable(courses, professors, classrooms, constraints);
      setSchedule(result.schedule);
      setUnscheduledCourses(result.unscheduled);
      setOptimizationScore(result.score);
    } finally {
      setIsOptimizing(false);
      saveStateToLocalStorage(courses, professors, classrooms, constraints, schedule);
    }
  };

  // Direct manual schedule update (e.g. from Drag & Drop)
  const handleUpdateSchedule = (newSchedule: TimetableEntry[]) => {
    setSchedule(newSchedule);
    saveStateToLocalStorage(courses, professors, classrooms, constraints, newSchedule);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" id="app-root">
      {/* Premium Navigation Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-6 py-4" id="main-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-ku-crimson-50 text-ku-crimson-500 rounded-xl">
                <GraduationCap className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight font-sans">
                대학 학사 시간표 최적화 엔진
              </h1>
              <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 font-bold rounded">
                MVP v1.0
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-sans">
              [학년별 전공 분배], [교수 일일 시수제한] 등 비즈니스 규칙과 제약 조건을 엄수하는 지능형 시간표 배치 시스템
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto" id="header-action-buttons">
            <button
              onClick={handleResetToDefault}
              className="px-3.5 py-2 border border-gray-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="컴퓨터공학과 기본 데이터로 초기화합니다."
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>샘플 데이터 로드</span>
            </button>
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 border border-gray-200 hover:bg-slate-50 text-ku-crimson-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <span>전체 비우기</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 border border-gray-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄</span>
            </button>
            <button
              onClick={handleOptimizeSchedule}
              disabled={isOptimizing || courses.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                courses.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-ku-crimson-500 hover:bg-ku-crimson-600 text-white shadow-md shadow-ku-crimson-500/10 active:scale-95'
              }`}
              id="btn-optimize-main"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>최적화 계산 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>새로운 최적화 일정 생성</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8" id="main-content">
        {/* Unscheduled warning bar if any courses could not be fitted */}
        {unscheduledCourses.length > 0 && (
          <div className="p-4 bg-ku-gold-50 border border-ku-gold-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="unscheduled-warning">
            <div className="flex items-start gap-2.5 text-xs text-ku-gold-500 font-sans">
              <span className="p-1 rounded-lg bg-ku-gold-100 text-ku-gold-500 font-bold font-mono">
                !
              </span>
              <div>
                <strong className="block">미배치 강좌 {unscheduledCourses.length}건 발생</strong>
                <span className="block mt-0.5">
                  주어진 제약조건(교수 일일 강의제한, 전공 분배 등) 범위 안에서 아래 {unscheduledCourses.length}개 강좌의 여유 시간 슬롯을 찾지 못했습니다.
                </span>
                <span className="block font-mono text-[10px] mt-1 text-amber-600 bg-amber-100/50 p-1.5 rounded">
                  미배치 목록: {unscheduledCourses.map(id => courses.find(c => c.id === id)?.name).join(', ')}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                // Open constraints to help them solve it
                alert("규칙 및 제약설정 탭에서 '[Rule 1] 동일 학년 전공 시간대 중복 불가' 또는 '[Rule 2] 교수당 하루 최대 강의 시간 제한'을 해제하시면 배치가 수월해집니다.");
              }}
              className="text-xs text-amber-700 hover:underline font-bold font-sans self-end sm:self-center"
            >
              해결법 확인
            </button>
          </div>
        )}

        {/* Analytics Highlights */}
        <AnalyticsPanel
          schedule={schedule}
          courses={courses}
          professors={professors}
          classrooms={classrooms}
          constraints={constraints}
        />

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8" id="workspace-layout">
          {/* Left Column: Management & Configurations */}
          <div className="space-y-6" id="left-sidebar">
            <ConfigPanel
              courses={courses}
              professors={professors}
              classrooms={classrooms}
              constraints={constraints}
              onUpdateCourses={(updatedCourses) => {
                setCourses(updatedCourses);
                saveStateToLocalStorage(updatedCourses, professors, classrooms, constraints, schedule);
              }}
              onUpdateProfessors={(updatedProfs) => {
                setProfessors(updatedProfs);
                saveStateToLocalStorage(courses, updatedProfs, classrooms, constraints, schedule);
              }}
              onUpdateClassrooms={(updatedRooms) => {
                setClassrooms(updatedRooms);
                saveStateToLocalStorage(courses, professors, updatedRooms, constraints, schedule);
              }}
              onUpdateConstraints={(updatedConstraints) => {
                setConstraints(updatedConstraints);
                saveStateToLocalStorage(courses, professors, classrooms, updatedConstraints, schedule);
              }}
            />

            {/* Help & System Card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs" id="help-card">
              <h4 className="text-xs font-bold text-gray-800 font-sans flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>시간표 백트래킹(CSP) 아키텍처</span>
              </h4>
              <p className="text-[11px] text-gray-500 mt-2 font-sans leading-relaxed">
                본 MVP는 학과 교수 시수 제한 및 동학년 전공 배타 배치를 해결하기 위해 **제약 충족 문제(Constraint Satisfaction Problem) 백트래킹 알고리즘**을 활용합니다.
              </p>
              <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500 font-sans">아키텍처 모드</span>
                  <span className="text-slate-700 font-bold font-sans">Full-Stack (Vite + Node.js)</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500 font-sans">안정성 처리</span>
                  <span className="text-slate-700 font-bold font-sans">비차단(Non-blocking) 계산 시뮬레이션</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Timetable & AI feedback */}
          <div className="space-y-8" id="right-workspace">
            <TimetableGrid
              schedule={schedule}
              courses={courses}
              professors={professors}
              classrooms={classrooms}
              constraints={constraints}
              onUpdateSchedule={handleUpdateSchedule}
            />

            <AIReviewer
              schedule={schedule}
              courses={courses}
              professors={professors}
              classrooms={classrooms}
              constraints={constraints}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
