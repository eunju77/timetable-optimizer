import { describe, it, expect } from 'vitest';
import { solveTimetable, isValidSlot } from '../src/solver';
import { DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS } from '../src/mockData';
import type { TimetableEntry } from '../src/types';

describe('solveTimetable', () => {
  it('모든 과목이 배치되어야 함 (unscheduled가 비어있어야 함)', () => {
    const result = solveTimetable(DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS);
    expect(result.unscheduled).toEqual([]);
  });

  it('모든 과목이 schedule에 포함되어야 함', () => {
    const result = solveTimetable(DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS);
    const scheduledIds = result.schedule.map(e => e.courseId);
    const allIds = DEFAULT_COURSES.map(c => c.id);
    for (const id of allIds) {
      expect(scheduledIds).toContain(id);
    }
  });

  it('동일한 courseId가 schedule에 중복되지 않아야 함', () => {
    const result = solveTimetable(DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS);
    const ids = result.schedule.map(e => e.courseId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('schedule에 등장하는 모든 courseId는 유효한 Course여야 함', () => {
    const result = solveTimetable(DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS);
    const validIds = new Set(DEFAULT_COURSES.map(c => c.id));
    for (const entry of result.schedule) {
      expect(validIds.has(entry.courseId)).toBe(true);
    }
  });

  it('score가 0 이상이어야 함', () => {
    const result = solveTimetable(DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

describe('isValidSlot - Rule violations', () => {
  it('동일 학년 전공 과목이 같은 시간대에 배치될 수 없음 (Rule 1)', () => {
    const course1 = DEFAULT_COURSES.find(c => c.id === 'course-201')!;
    const course2 = DEFAULT_COURSES.find(c => c.id === 'course-202')!;
    const entry1: TimetableEntry = { id: 'e1', courseId: course1.id, day: 'Monday', startPeriod: 1, duration: 3 };
    const entry2: TimetableEntry = { id: 'e2', courseId: course2.id, day: 'Monday', startPeriod: 1, duration: 3 };
    const result = isValidSlot(course2, 'Monday', 1, 3, [entry1], DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, DEFAULT_CONSTRAINTS);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('전공 중복');
  });

  it('같은 교수의 같은 시간대 중복 배치 불가', () => {
    const course1 = DEFAULT_COURSES.find(c => c.id === 'course-201')!;
    const course2 = DEFAULT_COURSES.find(c => c.id === 'course-301')!;
    const entry: TimetableEntry = { id: 'e1', courseId: course1.id, day: 'Monday', startPeriod: 1, duration: 3 };
    const result = isValidSlot(course2, 'Monday', 1, 3, [entry], DEFAULT_COURSES, DEFAULT_PROFESSORS, DEFAULT_CLASSROOMS, { ...DEFAULT_CONSTRAINTS, avoidProfessorClash: true });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('교수 중복');
  });
});