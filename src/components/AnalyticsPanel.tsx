import { DAYS } from '../types';
import type { Course, Professor, Classroom, TimetableEntry, SchedulingConstraints } from '../types';
import { evaluateScheduleScore } from '../solver';
import { AlertTriangle, CheckCircle, Shield, Award, Users, BookOpen } from 'lucide-react';

interface AnalyticsPanelProps {
  schedule: TimetableEntry[];
  courses: Course[];
  professors: Professor[];
  classrooms: Classroom[];
  constraints: SchedulingConstraints;
}

export default function AnalyticsPanel({
  schedule,
  courses,
  professors,
  classrooms,
  constraints,
}: AnalyticsPanelProps) {
  const { score, violations } = evaluateScheduleScore(schedule, courses, professors, classrooms, constraints);

  // 1. Calculate Classroom Utilization rate
  // Total available slots = rooms * 5 days * 9 periods = classrooms.length * 45
  const totalSlots = classrooms.length * 45;
  const occupiedSlots = schedule.reduce((sum, s) => sum + s.duration, 0);
  const utilizationRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  // 2. Count major overlap per grade conflicts manually if constraints are turned off (to show status)
  let gradeMajorOverlaps = 0;
  for (const grade of [1, 2, 3, 4] as const) {
    for (const day of DAYS) {
      const periods = Array.from({ length: 9 }, () => 0);
      for (const s of schedule) {
        const c = courses.find(course => course.id === s.courseId);
        if (c && c.grade === grade && c.isMajor && s.day === day) {
          for (let p = s.startPeriod; p < s.startPeriod + s.duration; p++) {
            if (p >= 1 && p <= 9) {
              periods[p - 1]++;
              if (periods[p - 1] > 1) {
                gradeMajorOverlaps++;
              }
            }
          }
        }
      }
    }
  }

  // 3. Count professor overwork (hours exceeded)
  let overworkingProfessors = 0;
  for (const prof of professors) {
    let hasExceeded = false;
    for (const day of DAYS) {
      let dailyHours = 0;
      for (const s of schedule) {
        const c = courses.find(course => course.id === s.courseId);
        if (c && c.professorId === prof.id && s.day === day) {
          dailyHours += s.duration;
        }
      }
      if (dailyHours > prof.maxHoursPerDay) {
        hasExceeded = true;
      }
    }
    if (hasExceeded) {
      overworkingProfessors++;
    }
  }

  // 4. Score grading
  let gradeLetter = 'F';
  let gradeColor = 'text-red-500 bg-red-50';
  if (score >= 95) {
    gradeLetter = 'A+';
    gradeColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  } else if (score >= 85) {
    gradeLetter = 'A';
    gradeColor = 'text-teal-600 bg-teal-50 border-teal-200';
  } else if (score >= 70) {
    gradeLetter = 'B';
    gradeColor = 'text-indigo-600 bg-indigo-50 border-indigo-200';
  } else if (score >= 50) {
    gradeLetter = 'C';
    gradeColor = 'text-amber-600 bg-amber-50 border-amber-200';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="analytics-panel">
      {/* 1. Timetable Health Score */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between" id="health-score-card">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-500 font-sans">시간표 무결성 및 적합도</h3>
            <span className="p-1.5 rounded-lg bg-gray-50 text-gray-400">
              <Shield className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-bold text-gray-900 tracking-tight font-sans">{score}</span>
            <span className="text-sm text-gray-400 font-sans">/ 100점</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-sans">
            제약조건 위반 사항, 과로 위험도, 강의실 사용 효율 등을 종합적으로 평가한 수치입니다.
          </p>
        </div>
        <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between ${gradeColor}`}>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-semibold font-sans">종합 평가 등급</span>
          </div>
          <span className="text-lg font-black font-sans">{gradeLetter}</span>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs grid grid-cols-2 gap-4" id="metrics-card">
        <div className="p-4 bg-slate-50/60 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-medium text-gray-500 font-sans">강의실 이용률</span>
          <div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight font-sans">{utilizationRate}%</div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-slate-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(utilizationRate, 100)}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-indigo-50/40 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-medium text-indigo-700 font-sans">동일학년 전공 중복</span>
          <div>
            <div className={`text-2xl font-bold tracking-tight font-sans ${gradeMajorOverlaps > 0 ? 'text-amber-600' : 'text-indigo-800'}`}>
              {gradeMajorOverlaps}건
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">동일학년 전공 간 시간대 중복</span>
          </div>
        </div>

        <div className="p-4 bg-rose-50/40 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-medium text-rose-700 font-sans">교수 일일 초과강의</span>
          <div>
            <div className={`text-2xl font-bold tracking-tight font-sans ${overworkingProfessors > 0 ? 'text-rose-600' : 'text-gray-800'}`}>
              {overworkingProfessors}명
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">개별 교수 일일 제한시간 초과</span>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/40 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-medium text-emerald-700 font-sans">배치율</span>
          <div>
            <div className="text-2xl font-bold text-emerald-800 tracking-tight font-sans">
              {courses.length > 0 ? Math.round((schedule.length / courses.length) * 100) : 0}%
            </div>
            <span className="text-[10px] text-emerald-600 font-medium block mt-1">
              ({schedule.length}/{courses.length} 과목 배치 완료)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Violation Alerts & Warnings */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col" id="warnings-card">
        <h3 className="text-sm font-medium text-gray-800 mb-3 font-sans flex items-center space-x-1.5">
          <span>제약조건 및 경고 내역</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-500 font-mono">
            {violations.length}
          </span>
        </h3>
        <div className="flex-1 overflow-y-auto max-h-[140px] pr-1 space-y-2 scrollbar-thin">
          {violations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-6">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-xs font-sans text-center">모든 제약조건이 충족되었습니다!<br />완벽한 무결성 시간표입니다.</p>
            </div>
          ) : (
            violations.map((violation, idx) => (
              <div 
                key={idx} 
                className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-xl flex items-start space-x-2 text-xs text-amber-800 font-sans"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{violation}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
