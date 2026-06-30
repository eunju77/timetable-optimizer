import type { Professor, Classroom, Course, SchedulingConstraints } from './types';

export const DEFAULT_PROFESSORS: Professor[] = [
  {
    id: 'prof-1',
    name: '김철수 교수',
    department: '컴퓨터공학과',
    maxHoursPerDay: 3,
    unavailableSlots: ['Monday-1', 'Monday-2', 'Wednesday-5'],
  },
  {
    id: 'prof-2',
    name: '이영희 교수',
    department: '컴퓨터공학과',
    maxHoursPerDay: 3,
    unavailableSlots: ['Friday-7', 'Friday-8', 'Friday-9'],
  },
  {
    id: 'prof-3',
    name: '박민수 교수',
    department: '정보보호학과',
    maxHoursPerDay: 3,
    unavailableSlots: ['Tuesday-1', 'Tuesday-2'],
  },
  {
    id: 'prof-4',
    name: '최지원 교수',
    department: '인공지능학과',
    maxHoursPerDay: 3,
    unavailableSlots: [],
  },
  {
    id: 'prof-5',
    name: '정우성 교수',
    department: '기초교육원(수학)',
    maxHoursPerDay: 3,
    unavailableSlots: ['Thursday-5', 'Thursday-6'],
  },
];

export const DEFAULT_CLASSROOMS: Classroom[] = [
  { id: 'room-1', name: '공학관 301호 (이론실)', capacity: 60, roomType: 'Lecture' },
  { id: 'room-2', name: '공학관 405호 (대형실)', capacity: 80, roomType: 'Lecture' },
  { id: 'room-3', name: 'IT융합관 502호 (SW실습실)', capacity: 40, roomType: 'Lab' },
  { id: 'room-4', name: '대학원동 201호 (세미나실)', capacity: 20, roomType: 'Seminar' },
];

export const DEFAULT_COURSES: Course[] = [
  // 1학년
  {
    id: 'course-101',
    code: 'CS101',
    name: '프로그래밍 기초 (SW)',
    grade: 1,
    isMajor: true,
    professorId: 'prof-1',
    classroomId: 'room-3',
    weeklyHours: 3,
  },
  {
    id: 'course-102',
    code: 'MATH101',
    name: '대학미적분학',
    grade: 1,
    isMajor: false,
    professorId: 'prof-5',
    classroomId: 'room-1',
    weeklyHours: 3,
  },
  // 2학년
  {
    id: 'course-201',
    code: 'CS201',
    name: '자료구조 및 실습',
    grade: 2,
    isMajor: true,
    professorId: 'prof-2',
    classroomId: 'room-3',
    weeklyHours: 3,
  },
  {
    id: 'course-202',
    code: 'CS202',
    name: '컴퓨터 시스템 구조',
    grade: 2,
    isMajor: true,
    professorId: 'prof-3',
    classroomId: 'room-2',
    weeklyHours: 3,
  },
  {
    id: 'course-203',
    code: 'CS203',
    name: '이산수학',
    grade: 2,
    isMajor: false,
    professorId: 'prof-5',
    classroomId: 'room-1',
    weeklyHours: 2,
  },
  // 3학년
  {
    id: 'course-301',
    code: 'CS301',
    name: '알고리즘 분석',
    grade: 3,
    isMajor: true,
    professorId: 'prof-2',
    classroomId: 'room-1',
    weeklyHours: 3,
  },
  {
    id: 'course-302',
    code: 'CS302',
    name: '데이터베이스 시스템',
    grade: 3,
    isMajor: true,
    professorId: 'prof-3',
    classroomId: 'room-3',
    weeklyHours: 3,
  },
  {
    id: 'course-303',
    code: 'AI301',
    name: '인공지능 개론',
    grade: 3,
    isMajor: true,
    professorId: 'prof-4',
    classroomId: 'room-2',
    weeklyHours: 3,
  },
  // 4학년
  {
    id: 'course-401',
    code: 'AI401',
    name: '머신러닝과 딥러닝 실습',
    grade: 4,
    isMajor: true,
    professorId: 'prof-4',
    classroomId: 'room-3',
    weeklyHours: 3,
  },
  {
    id: 'course-402',
    code: 'CS490',
    name: '산학 캡스톤 디자인',
    grade: 4,
    isMajor: true,
    professorId: 'prof-1',
    classroomId: 'room-4',
    weeklyHours: 2,
  },
  {
    id: 'course-403',
    code: 'CS405',
    name: '빅데이터 통계분석',
    grade: 4,
    isMajor: false,
    professorId: 'prof-4',
    classroomId: 'room-4',
    weeklyHours: 2,
  },
];

export const DEFAULT_CONSTRAINTS: SchedulingConstraints = {
  preventSameGradeMajorOverlap: true, // Rule 1
  limitProfessorMaxHours: true, // Rule 2
  limitProfessorDaysPerWeek: true, // Rule 3 (NEW: 1인당 주 최대 3일 편성)
  avoidProfessorClash: true,
  avoidRoomClash: true,
  respectProfessorUnavailable: true,
};
