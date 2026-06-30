import React, { useState } from 'react';
import { DAYS, DAYS_KR, PERIODS } from '../types';
import type { Course, Professor, Classroom, TimetableEntry, DayOfWeek } from '../types';
import { isValidSlot } from '../solver';
import { Info, HelpCircle, ChevronRight, AlertCircle, Sparkles, Check, X } from 'lucide-react';

interface TimetableGridProps {
  schedule: TimetableEntry[];
  courses: Course[];
  professors: Professor[];
  classrooms: Classroom[];
  constraints: any;
  onUpdateSchedule: (schedule: TimetableEntry[]) => void;
}

export default function TimetableGrid({
  schedule,
  courses,
  professors,
  classrooms,
  constraints,
  onUpdateSchedule,
}: TimetableGridProps) {
  const [viewType, setViewType] = useState<'grade' | 'professor' | 'classroom'>('grade');
  const [selectedGrade, setSelectedGrade] = useState<1 | 2 | 3 | 4>(1);
  const [selectedProfId, setSelectedProfId] = useState<string>(professors[0]?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(classrooms[0]?.id || '');

  // Move flow state
  const [movingEntry, setMovingEntry] = useState<TimetableEntry | null>(null);
  const [violationAlert, setViolationAlert] = useState<{
    entry: TimetableEntry;
    newDay: DayOfWeek;
    newStart: number;
    reason: string;
  } | null>(null);

  // Sync selected IDs if professors or classrooms list changed
  if (selectedProfId === '' && professors.length > 0) {
    setSelectedProfId(professors[0].id);
  }
  if (selectedRoomId === '' && classrooms.length > 0) {
    setSelectedRoomId(classrooms[0].id);
  }

  // Get active courses based on current filter view
  const getFilteredSchedule = () => {
    return schedule.filter(entry => {
      const course = courses.find(c => c.id === entry.courseId);
      if (!course) return false;

      if (viewType === 'grade') {
        return course.grade === selectedGrade;
      } else if (viewType === 'professor') {
        return course.professorId === selectedProfId;
      } else {
        return course.classroomId === selectedRoomId;
      }
    });
  };

  const filteredSchedule = getFilteredSchedule();

  // Find entry occupying a specific cell
  const getEntryAt = (day: DayOfWeek, periodId: number) => {
    return filteredSchedule.find(entry => {
      const start = entry.startPeriod;
      const end = entry.startPeriod + entry.duration - 1;
      return entry.day === day && periodId >= start && periodId <= end;
    });
  };

  // Click handler for cells or items
  const handleCellClick = (day: DayOfWeek, periodId: number) => {
    // If we are currently moving an entry
    if (movingEntry) {
      const course = courses.find(c => c.id === movingEntry.courseId);
      if (!course) {
        setMovingEntry(null);
        return;
      }

      // Check if clicked cell is the start of the same position
      if (movingEntry.day === day && movingEntry.startPeriod === periodId) {
        setMovingEntry(null); // Cancel
        return;
      }

      // Temporary schedule without the moving entry to check validity
      const tempSchedule = schedule.filter(s => s.id !== movingEntry.id);
      const validation = isValidSlot(
        course,
        day,
        periodId,
        movingEntry.duration,
        tempSchedule,
        courses,
        professors,
        classrooms,
        constraints
      );

      if (validation.valid) {
        // Apply relocation immediately
        const updated = schedule.map(s => {
          if (s.id === movingEntry.id) {
            return {
              ...s,
              day,
              startPeriod: periodId,
            };
          }
          return s;
        });
        onUpdateSchedule(updated);
        setMovingEntry(null);
      } else {
        // Trigger manual override confirmation
        setViolationAlert({
          entry: movingEntry,
          newDay: day,
          newStart: periodId,
          reason: validation.reason || '규칙 위반',
        });
      }
    }
  };

  // Perform forced move bypassing hard rules (administrative manual exception)
  const executeForcedMove = () => {
    if (!violationAlert) return;
    const { entry, newDay, newStart } = violationAlert;
    const updated = schedule.map(s => {
      if (s.id === entry.id) {
        return {
          ...s,
          day: newDay,
          startPeriod: newStart,
        };
      }
      return s;
    });
    onUpdateSchedule(updated);
    setViolationAlert(null);
    setMovingEntry(null);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col gap-6" id="timetable-view">
      {/* Grid Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5" id="timetable-filters">
        <div className="flex bg-slate-100 p-1 rounded-xl" id="view-type-toggles">
          <button
            onClick={() => setViewType('grade')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              viewType === 'grade'
                ? 'bg-white text-ku-crimson-500 shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            학년별 일정
          </button>
          <button
            onClick={() => setViewType('professor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              viewType === 'professor'
                ? 'bg-white text-ku-crimson-500 shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            교수별 일정
          </button>
          <button
            onClick={() => setViewType('classroom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              viewType === 'classroom'
                ? 'bg-white text-ku-crimson-500 shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            강의실별 일정
          </button>
        </div>

        {/* Dynamic Detail Selector */}
        <div id="sub-filter-selector">
          {viewType === 'grade' && (
            <div className="flex gap-1.5">
              {([1, 2, 3, 4] as const).map(g => (
                <button
                  key={g}
                  onClick={() => {
                    setSelectedGrade(g);
                    setMovingEntry(null);
                  }}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-50 text-gray-500 hover:bg-slate-100'
                  }`}
                >
                  {g}학년
                </button>
              ))}
            </div>
          )}

          {viewType === 'professor' && (
            <select
              value={selectedProfId}
              onChange={(e) => {
                setSelectedProfId(e.target.value);
                setMovingEntry(null);
              }}
              className="text-xs border border-gray-200 rounded-xl p-2.5 bg-slate-50/50 font-sans cursor-pointer focus:outline-none focus:ring-1 focus:ring-ku-crimson-500"
            >
              {professors.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.department})</option>
              ))}
            </select>
          )}

          {viewType === 'classroom' && (
            <select
              value={selectedRoomId}
              onChange={(e) => {
                setSelectedRoomId(e.target.value);
                setMovingEntry(null);
              }}
              className="text-xs border border-gray-200 rounded-xl p-2.5 bg-slate-50/50 font-sans cursor-pointer focus:outline-none focus:ring-1 focus:ring-ku-crimson-500"
            >
              {classrooms.map(r => (
                <option key={r.id} value={r.id}>{r.name} (수용 {r.capacity}명)</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Manual Drag/Click instructions Banner */}
      {movingEntry ? (
        <div className="p-3 bg-ku-crimson-50 border border-ku-crimson-200 rounded-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 text-xs text-ku-crimson-800">
            <Info className="w-4 h-4 text-ku-crimson-500 flex-shrink-0" />
            <span className="font-sans">
              <strong>[강좌 재배치 모드]</strong> 선택한 '{courses.find(c => c.id === movingEntry.courseId)?.name}' 강의를 배치할 다른 요일/교시 빈 칸을 클릭해 보세요.
            </span>
          </div>
          <button
            onClick={() => setMovingEntry(null)}
            className="text-xs text-ku-crimson-500 font-bold hover:underline cursor-pointer font-sans"
          >
            취소
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 font-sans flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>등록된 시간표 카드를 클릭하면 **원하는 칸으로 즉시 이동(재배치)** 할 수 있으며, 실시간 학사 제약 조건 검증을 진행합니다.</span>
        </p>
      )}

      {/* Forced override / Validation check warning Dialog */}
      {violationAlert && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 shadow-xs">
          <div className="flex gap-2 text-amber-800 text-xs items-start">
            <AlertTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block font-sans">[경고] 학사 관리 규칙 제약 조건 위반</span>
              <span className="mt-1 block font-sans text-amber-700 font-medium">
                {violationAlert.reason}
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button
              onClick={() => setViolationAlert(null)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white cursor-pointer font-sans"
            >
              취소 및 되돌리기
            </button>
            <button
              onClick={executeForcedMove}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer font-sans"
            >
              제약조건을 무시하고 강제 이동 (수동 배치)
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Calendar */}
      <div className="overflow-x-auto" id="timetable-calendar-container">
        <div className="min-w-[760px] grid grid-cols-[80px_repeat(5,1fr)] gap-1.5">
          {/* Header row */}
          <div className="p-2 text-center text-[10px] font-bold text-gray-400 uppercase bg-slate-50 rounded-lg">교시</div>
          {DAYS.map(d => (
            <div key={d} className="p-2 text-center text-xs font-bold text-slate-700 bg-slate-50 rounded-lg font-sans">
              {DAYS_KR[d]}
            </div>
          ))}

          {/* Time & Grid Rows */}
          {PERIODS.map((period) => (
            <div key={period.id} className="contents">
              {/* Time column */}
              <div className="p-3 bg-slate-50/60 rounded-xl flex flex-col justify-center items-center gap-0.5 select-none text-center">
                <span className="text-xs font-bold text-slate-600 font-sans">{period.id}교시</span>
                <span className="text-[9px] text-gray-400 font-mono font-medium">{period.time.split(' ')[0]}</span>
              </div>

              {/* Day cells */}
              {DAYS.map((day) => {
                const entry = getEntryAt(day, period.id);
                const isStartCell = entry && entry.startPeriod === period.id;

                if (entry) {
                  // Only render the block in its starting cell and span it down
                  if (isStartCell) {
                    const course = courses.find(c => c.id === entry.courseId);
                    const prof = professors.find(p => p.id === course?.professorId);
                    const room = classrooms.find(r => r.id === course?.classroomId);

                    const isSelectedForMove = movingEntry?.id === entry.id;

                    // Compute dynamic style based on grade or major status
                    let colorTheme = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800';
                    if (course) {
                      if (course.isMajor) {
                        colorTheme = 'bg-ku-crimson-50/90 hover:bg-ku-crimson-100/90 border-ku-crimson-200 text-ku-crimson-900';
                      } else {
                        colorTheme = 'bg-ku-gold-50/90 hover:bg-ku-gold-100/90 border-ku-gold-200 text-ku-gold-500';
                      }
                    }

                    if (isSelectedForMove) {
                      colorTheme = 'bg-ku-crimson-500 border-ku-crimson-500 text-white animate-pulse ring-2 ring-ku-crimson-300';
                    }

                    return (
                      <div
                        key={day}
                        onClick={() => {
                          if (movingEntry) {
                            handleCellClick(day, period.id);
                          } else {
                            setMovingEntry(entry);
                          }
                        }}
                        style={{ gridRow: `span ${entry.duration}` }}
                        className={`p-3.5 border rounded-xl flex flex-col justify-between shadow-2xs cursor-pointer transition-all relative group select-none min-h-[90px] ${colorTheme}`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isSelectedForMove
                                ? 'bg-indigo-500 text-white'
                                : course?.isMajor ? 'bg-indigo-100/60' : 'bg-emerald-100/60'
                            }`}>
                              {course?.code}
                            </span>
                            <span className="text-[9px] font-medium opacity-70">
                              {course?.grade}학년 · {course?.isMajor ? '전공' : '교양'}
                            </span>
                          </div>
                          <h4 className="text-[12px] font-bold tracking-tight mt-2 line-clamp-2">
                            {course?.name}
                          </h4>
                        </div>
                        <div className="mt-3 pt-2 border-t border-dashed border-black/5 flex flex-col gap-0.5 opacity-80 text-[10px]">
                          <span className="font-sans">담당: {prof?.name}</span>
                          <span className="font-sans">강의실: {room?.name}</span>
                        </div>
                      </div>
                    );
                  } else {
                    // Span occupier, render nothing to allow grid span layout
                    return null;
                  }
                }

                // Render blank interactive grid cell
                return (
                  <div
                    key={day}
                    onClick={() => handleCellClick(day, period.id)}
                    className={`border border-dashed border-gray-100 rounded-xl transition-all min-h-[70px] ${
                      movingEntry 
                        ? 'bg-slate-50 hover:bg-indigo-50 border-indigo-200 cursor-pointer' 
                        : 'bg-white hover:bg-slate-50/40'
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlertTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
