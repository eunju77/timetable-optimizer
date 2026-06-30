import React, { useState } from 'react';
import { DAYS, DAYS_KR } from '../types';
import type { Course, Professor, Classroom, SchedulingConstraints, RoomType } from '../types';
import { Plus, Trash2, ShieldAlert, GraduationCap, School, BookOpen, Settings } from 'lucide-react';

interface ConfigPanelProps {
  courses: Course[];
  professors: Professor[];
  classrooms: Classroom[];
  constraints: SchedulingConstraints;
  onUpdateCourses: (courses: Course[]) => void;
  onUpdateProfessors: (professors: Professor[]) => void;
  onUpdateClassrooms: (classrooms: Classroom[]) => void;
  onUpdateConstraints: (constraints: SchedulingConstraints) => void;
}

export default function ConfigPanel({
  courses,
  professors,
  classrooms,
  constraints,
  onUpdateCourses,
  onUpdateProfessors,
  onUpdateClassrooms,
  onUpdateConstraints,
}: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'constraints' | 'courses' | 'professors' | 'classrooms'>('constraints');

  // --- Course Form State ---
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseGrade, setCourseGrade] = useState<1 | 2 | 3 | 4>(1);
  const [courseIsMajor, setCourseIsMajor] = useState(true);
  const [courseProfessor, setCourseProfessor] = useState(professors[0]?.id || '');
  const [courseClassroom, setCourseClassroom] = useState(classrooms[0]?.id || '');
  const [courseHours, setCourseHours] = useState(3);

  // --- Professor Form State ---
  const [profName, setProfName] = useState('');
  const [profDept, setProfDept] = useState('');
  const [profMaxHours, setProfMaxHours] = useState(3);
  const [profUnavailable, setProfUnavailable] = useState<string[]>([]);

  // --- Classroom Form State ---
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState(40);
  const [roomType, setRoomType] = useState<RoomType>('Lecture');

  // --- Add Handlers ---
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !courseName || !courseProfessor || !courseClassroom) return;
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      code: courseCode,
      name: courseName,
      grade: courseGrade,
      isMajor: courseIsMajor,
      professorId: courseProfessor,
      classroomId: courseClassroom,
      weeklyHours: courseHours,
    };
    onUpdateCourses([...courses, newCourse]);
    setCourseCode('');
    setCourseName('');
  };

  const handleAddProfessor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName || !profDept) return;
    const newProf: Professor = {
      id: `prof-${Date.now()}`,
      name: profName,
      department: profDept,
      maxHoursPerDay: profMaxHours,
      unavailableSlots: profUnavailable,
    };
    onUpdateProfessors([...professors, newProf]);
    setProfName('');
    setProfDept('');
    setProfUnavailable([]);
  };

  const handleAddClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) return;
    const newRoom: Classroom = {
      id: `room-${Date.now()}`,
      name: roomName,
      capacity: roomCapacity,
      roomType: roomType,
    };
    onUpdateClassrooms([...classrooms, newRoom]);
    setRoomName('');
  };

  // --- Delete Handlers ---
  const handleDeleteCourse = (id: string) => {
    onUpdateCourses(courses.filter(c => c.id !== id));
  };

  const handleDeleteProf = (id: string) => {
    onUpdateProfessors(professors.filter(p => p.id !== id));
    // Remove courses assigned to this professor or clear them
    onUpdateCourses(courses.filter(c => c.professorId !== id));
  };

  const handleDeleteRoom = (id: string) => {
    onUpdateClassrooms(classrooms.filter(r => r.id !== id));
    // Remove courses assigned to this classroom
    onUpdateCourses(courses.filter(c => c.classroomId !== id));
  };

  const toggleUnavailableSlot = (day: string, period: number) => {
    const slot = `${day}-${period}`;
    if (profUnavailable.includes(slot)) {
      setProfUnavailable(profUnavailable.filter(s => s !== slot));
    } else {
      setProfUnavailable([...profUnavailable, slot]);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden" id="config-panel">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-100 bg-slate-50/50" id="config-tabs">
        <button
          onClick={() => setActiveTab('constraints')}
          className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-all duration-200 ${
            activeTab === 'constraints'
              ? 'border-violet-400 text-violet-700 bg-violet-50/60'
              : 'border-transparent text-slate-500 hover:text-violet-600 hover:bg-violet-50/20'
          }`}
        >
          <Settings className={`w-3.5 h-3.5 ${activeTab === 'constraints' ? 'text-violet-500' : 'text-slate-400'}`} />
          <span>규칙 및 제약설정</span>
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-all duration-200 ${
            activeTab === 'courses'
              ? 'border-sky-400 text-sky-700 bg-sky-50/60'
              : 'border-transparent text-slate-500 hover:text-sky-600 hover:bg-sky-50/20'
          }`}
        >
          <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'courses' ? 'text-sky-500' : 'text-slate-400'}`} />
          <span>과목 설정 ({courses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('professors')}
          className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-all duration-200 ${
            activeTab === 'professors'
              ? 'border-emerald-400 text-emerald-700 bg-emerald-50/60'
              : 'border-transparent text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/20'
          }`}
        >
          <GraduationCap className={`w-3.5 h-3.5 ${activeTab === 'professors' ? 'text-emerald-500' : 'text-slate-400'}`} />
          <span>교수진 설정 ({professors.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('classrooms')}
          className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-all duration-200 ${
            activeTab === 'classrooms'
              ? 'border-amber-400 text-amber-700 bg-amber-50/60'
              : 'border-transparent text-slate-500 hover:text-amber-600 hover:bg-amber-50/20'
          }`}
        >
          <School className={`w-3.5 h-3.5 ${activeTab === 'classrooms' ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>강의실 설정 ({classrooms.length})</span>
        </button>
      </div>

      <div className="p-6">
        {/* TAB 1: Constraints */}
        {activeTab === 'constraints' && (
          <div className="space-y-6" id="constraints-tab-content">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 font-sans flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                시간표 최적화 조건 설정
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-sans">
                과목 배치를 시도할 때 적용할 대학 학사 비즈니스 제약 규칙들을 토글할 수 있습니다.
              </p>
            </div>

            <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {/* Rule 1: No major overlap for same grade */}
              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-white transition-all">
                <input
                  type="checkbox"
                  checked={constraints.preventSameGradeMajorOverlap}
                  onChange={(e) => onUpdateConstraints({ ...constraints, preventSameGradeMajorOverlap: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block font-sans">
                    [Rule 1] 동일 학년 전공 과목 간 시간대 중복 불가
                  </span>
                  <span className="text-[11px] text-gray-500 block mt-0.5 font-sans">
                    같은 학년(예: 1학년)의 전공선택/전공필수 과목들이 동일 요일, 시간대에 겹치지 않게 배치합니다.
                  </span>
                </div>
              </label>

              {/* Rule 2: Max daily teaching hours per professor */}
              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-white transition-all">
                <input
                  type="checkbox"
                  checked={constraints.limitProfessorMaxHours}
                  onChange={(e) => onUpdateConstraints({ ...constraints, limitProfessorMaxHours: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block font-sans">
                    [Rule 2] 교수당 하루 최대 강의 시간 제한 적용
                  </span>
                  <span className="text-[11px] text-gray-500 block mt-0.5 font-sans">
                    하루에 교수가 소화 가능한 최대 강의 시간(예: 교수별 설정된 3시간 이내)으로 강의를 제한하여 무리한 배정을 배제합니다.
                  </span>
                </div>
              </label>

              {/* Rule 3: Max weekly days per professor (1인당 주 최대 3일 출강) */}
              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-white transition-all">
                <input
                  type="checkbox"
                  checked={constraints.limitProfessorDaysPerWeek}
                  onChange={(e) => onUpdateConstraints({ ...constraints, limitProfessorDaysPerWeek: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block font-sans">
                    [Rule 3] 교수당 주간 최대 강의 일수(3일) 제한 적용
                  </span>
                  <span className="text-[11px] text-gray-500 block mt-0.5 font-sans">
                    교수 1인당 주 3일 이하로만 출강이 가능하도록 주간 근무 요일 편성을 제한합니다.
                  </span>
                </div>
              </label>

              {/* General Professor Clashes */}
              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-white transition-all">
                <input
                  type="checkbox"
                  checked={constraints.avoidProfessorClash}
                  onChange={(e) => onUpdateConstraints({ ...constraints, avoidProfessorClash: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block font-sans">
                    교수 분신 방지 (강의 충돌 금지)
                  </span>
                  <span className="text-[11px] text-gray-500 block mt-0.5 font-sans">
                    한 교수가 같은 시간대에 두 군데 이상에서 동시에 강의하는 것을 절대 금지합니다 (기본 하드 콘스트레인트).
                  </span>
                </div>
              </label>

              {/* General Room Clashes */}
              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-white transition-all">
                <input
                  type="checkbox"
                  checked={constraints.avoidRoomClash}
                  onChange={(e) => onUpdateConstraints({ ...constraints, avoidRoomClash: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block font-sans">
                    강의실 대관 충돌 방지
                  </span>
                  <span className="text-[11px] text-gray-500 block mt-0.5 font-sans">
                    동일 강의실에 같은 시간대에 여러 강의가 배정되는 것을 원천 차단합니다.
                  </span>
                </div>
              </label>

              {/* Professor Unavailability */}
              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-white transition-all">
                <input
                  type="checkbox"
                  checked={constraints.respectProfessorUnavailable}
                  onChange={(e) => onUpdateConstraints({ ...constraints, respectProfessorUnavailable: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block font-sans">
                    교수 개인 강의 불가 시간대 엄수
                  </span>
                  <span className="text-[11px] text-gray-500 block mt-0.5 font-sans">
                    교수가 사전에 설정한 연구일, 출장 등 불가 시간대(Unavailable Slots)에는 강의를 배치하지 않습니다.
                  </span>
                </div>
              </label>
            </div>
            <div className="text-[10px] text-gray-400 font-sans italic">
              * 시간표 배치가 너무 어려울 경우(과목 수가 많을 때), 일부 제약 조건을 끈 뒤 최적화하여 "부분 해(Partial Solution)"를 얻을 수도 있습니다.
            </div>
          </div>
        )}

        {/* TAB 2: Course List & Form */}
        {activeTab === 'courses' && (
          <div className="space-y-6" id="courses-tab-content">
            {/* Create form */}
            <form onSubmit={handleAddCourse} className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 block font-sans">신규 강좌 개설</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">학수번호 (Code)</label>
                  <input
                    type="text"
                    placeholder="예: CS202"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] text-gray-500 block mb-1">교과목명 (Name)</label>
                  <input
                    type="text"
                    placeholder="예: 시스템 하드웨어 디자인"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">대상 학년</label>
                  <select
                    value={courseGrade}
                    onChange={(e) => setCourseGrade(Number(e.target.value) as any)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                  >
                    <option value={1}>1학년</option>
                    <option value={2}>2학년</option>
                    <option value={3}>3학년</option>
                    <option value={4}>4학년</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">이수 구분</label>
                  <select
                    value={courseIsMajor ? 'major' : 'elective'}
                    onChange={(e) => setCourseIsMajor(e.target.value === 'major')}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                  >
                    <option value="major">전공선택</option>
                    <option value="elective">교양선택</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">주당 수업 시간 (시수)</label>
                  <select
                    value={courseHours}
                    onChange={(e) => setCourseHours(Number(e.target.value))}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                  >
                    <option value={1}>1시간 (1교시분)</option>
                    <option value={2}>2시간 (2교시 연속)</option>
                    <option value={3}>3시간 (3교시 연속)</option>
                    <option value={4}>4시간 (4교시 연속)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">배정 강의실</label>
                  <select
                    value={courseClassroom}
                    onChange={(e) => setCourseClassroom(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                  >
                    <option value="">선택하세요</option>
                    {classrooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.capacity}명)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block mb-1">담당 교수</label>
                <select
                  value={courseProfessor}
                  onChange={(e) => setCourseProfessor(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                >
                  <option value="">선택하세요</option>
                  {professors.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.department})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>강좌 개설 등록</span>
              </button>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {courses.map((course) => {
                const prof = professors.find(p => p.id === course.professorId);
                const room = classrooms.find(r => r.id === course.classroomId);
                return (
                  <div
                    key={course.id}
                    className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-mono rounded text-slate-600 font-semibold">{course.code}</span>
                        <span className={`px-1.5 py-0.5 text-[10px] rounded font-semibold ${course.isMajor ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {course.grade}학년 · {course.isMajor ? '전공' : '교양'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">({course.weeklyHours}시간)</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-800 block mt-1">{course.name}</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">
                        교수: {prof?.name || '미지정'} | 강의실: {room?.name || '미지정'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Professors List & Form */}
        {activeTab === 'professors' && (
          <div className="space-y-6" id="professors-tab-content">
            <form onSubmit={handleAddProfessor} className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 block font-sans">신규 교수진 등록</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">이름</label>
                  <input
                    type="text"
                    placeholder="예: 홍길동 교수"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">소속 학과</label>
                  <input
                    type="text"
                    placeholder="예: 컴퓨터공학과"
                    value={profDept}
                    onChange={(e) => setProfDept(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block mb-1">
                  하루 최대 강의 허용 시수: <span className="font-bold text-slate-700">{profMaxHours}시간</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={1}
                  value={profMaxHours}
                  onChange={(e) => setProfMaxHours(Number(e.target.value))}
                  className="w-full accent-indigo-600 mt-1 cursor-pointer"
                />
              </div>

              {/* Unavailable schedule matrix preview/editor */}
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">강의 불가 요일/교시 선택 (Unavailable slots)</label>
                <div className="grid grid-cols-6 gap-1 text-[9px] text-center mt-1">
                  <div className="font-semibold text-gray-400 bg-slate-100/50 py-1 rounded">교시</div>
                  {DAYS.map(d => (
                    <div key={d} className="font-semibold text-slate-600 bg-slate-100/50 py-1 rounded">{DAYS_KR[d].substring(0, 1)}</div>
                  ))}
                  {[1, 3, 5, 7, 9].map(p => (
                    <div key={p} className="contents">
                      <div className="text-gray-400 self-center">{p}교시</div>
                      {DAYS.map(d => {
                        const slot = `${d}-${p}`;
                        const isSelected = profUnavailable.includes(slot);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleUnavailableSlot(d, p)}
                            className={`py-1.5 border rounded-sm cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-rose-500 text-white border-rose-500' 
                                : 'bg-white text-gray-400 border-gray-100 hover:bg-slate-50'
                            }`}
                          >
                            불가
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>교수 등록 완료</span>
              </button>
            </form>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {professors.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-all shadow-xs"
                >
                  <div>
                    <span className="text-xs font-bold text-gray-800">{p.name}</span>
                    <span className="text-[10px] text-indigo-600 block">{p.department} · 일일 최대 {p.maxHoursPerDay}시간 제한</span>
                    {p.unavailableSlots.length > 0 && (
                      <span className="text-[9px] text-rose-500 block mt-1">
                        * 출강 불가: {p.unavailableSlots.map(s => {
                          const [d, pr] = s.split('-');
                          return `${DAYS_KR[d as any]?.substring(0, 1)}(${pr})`;
                        }).join(', ')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteProf(p.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Classrooms List & Form */}
        {activeTab === 'classrooms' && (
          <div className="space-y-6" id="classrooms-tab-content">
            <form onSubmit={handleAddClassroom} className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 block font-sans">신규 강의실 등록</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-gray-500 block mb-1">강의실 명칭</label>
                  <input
                    type="text"
                    placeholder="예: 제2공학관 208호"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">최대 수용 인원 (명)</label>
                  <input
                    type="number"
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(Number(e.target.value))}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white"
                    min={5}
                    max={200}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block mb-1">강의실 성격</label>
                <div className="flex gap-2">
                  {(['Lecture', 'Lab', 'Seminar'] as RoomType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRoomType(type)}
                      className={`flex-1 py-2 text-xs rounded-lg border font-semibold cursor-pointer transition-all ${
                        roomType === type
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'Lecture' ? '이론강의실' : type === 'Lab' ? 'SW실습실' : '세미나실'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>강의실 등록 완료</span>
              </button>
            </form>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {classrooms.map((room) => (
                <div
                  key={room.id}
                  className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-all shadow-xs"
                >
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">{room.name}</span>
                    <span className="text-[10px] text-emerald-600">
                      수용량: {room.capacity}명 | 유형: {room.roomType === 'Lecture' ? '이론실' : room.roomType === 'Lab' ? '실습실' : '세미나실'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
