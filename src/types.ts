export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const DAYS_KR: Record<DayOfWeek, string> = {
  Monday: '월요일',
  Tuesday: '화요일',
  Wednesday: '수요일',
  Thursday: '목요일',
  Friday: '금요일',
};

// 1 period to 9 period (09:00 - 18:00)
export interface Period {
  id: number;
  time: string;
}

export const PERIODS: Period[] = [
  { id: 1, time: '09:00 - 10:00' },
  { id: 2, time: '10:00 - 11:00' },
  { id: 3, time: '11:00 - 12:00' },
  { id: 4, time: '12:00 - 13:00' }, // Lunch period usually
  { id: 5, time: '13:00 - 14:00' },
  { id: 6, time: '14:00 - 15:00' },
  { id: 7, time: '15:00 - 16:00' },
  { id: 8, time: '16:00 - 17:00' },
  { id: 9, time: '17:00 - 18:00' },
];

export interface Professor {
  id: string;
  name: string;
  department: string;
  maxHoursPerDay: number; // e.g. 4 or 6
  unavailableSlots: string[]; // array of "Day-PeriodId" (e.g. "Monday-1", "Friday-9")
}

export type RoomType = 'Lecture' | 'Lab' | 'Seminar';

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  roomType: RoomType;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  grade: 1 | 2 | 3 | 4; // Grade level
  isMajor: boolean; // Major vs. Elective
  professorId: string;
  classroomId: string;
  weeklyHours: number; // Duration (number of consecutive periods required, usually 2 or 3)
}

export interface TimetableEntry {
  id: string; // unique placement ID
  courseId: string;
  day: DayOfWeek;
  startPeriod: number; // 1-indexed
  duration: number; // number of periods
}

export interface SchedulingConstraints {
  preventSameGradeMajorOverlap: boolean; // Rule 1
  limitProfessorMaxHours: boolean; // Rule 2
  limitProfessorDaysPerWeek: boolean; // Rule 3 (NEW: 1인당 주 최대 3일 편성)
  avoidProfessorClash: boolean;
  avoidRoomClash: boolean;
  respectProfessorUnavailable: boolean;
}

export interface TimetableData {
  professors: Professor[];
  classrooms: Classroom[];
  courses: Course[];
  schedule: TimetableEntry[];
}
