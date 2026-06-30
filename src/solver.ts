import { DAYS } from './types';
import type { DayOfWeek, Course, Professor, Classroom, TimetableEntry, SchedulingConstraints } from './types';

export interface SolverResult {
  schedule: TimetableEntry[];
  unscheduled: string[]; // List of Course IDs that could not be scheduled
  success: boolean;
  score: number; // Quality score out of 100
  violations: string[]; // Detailed warnings/errors
}

// Check if a specific slot is valid for a course
export function isValidSlot(
  course: Course,
  day: DayOfWeek,
  startPeriod: number,
  duration: number,
  currentSchedule: TimetableEntry[],
  allCourses: Course[],
  professors: Professor[],
  classrooms: Classroom[],
  constraints: SchedulingConstraints
): { valid: boolean; reason?: string } {
  // 1. Out of bounds check
  if (startPeriod + duration - 1 > 9) {
    return { valid: false, reason: '강의 시간이 일과 시간(9교시)을 초과합니다.' };
  }

  const targetPeriods = Array.from({ length: duration }, (_, i) => startPeriod + i);
  const professor = professors.find(p => p.id === course.professorId);

  // 2. Professor Unavailable check
  if (constraints.respectProfessorUnavailable && professor) {
    for (const p of targetPeriods) {
      if (professor.unavailableSlots.includes(`${day}-${p}`)) {
        return { valid: false, reason: `담당 교수(${professor.name})의 강의 불가능 시간대(${day} ${p}교시)입니다.` };
      }
    }
  }

  // 3. Professor Daily Max Hours limit (Rule 2)
  if (constraints.limitProfessorMaxHours && professor) {
    // Count existing hours for this professor on this day plus the new duration
    let dailyHours = 0;
    for (const entry of currentSchedule) {
      const entryCourse = allCourses.find(c => c.id === entry.courseId);
      if (entryCourse && entryCourse.professorId === course.professorId && entry.day === day) {
        dailyHours += entry.duration;
      }
    }
    if (dailyHours + duration > professor.maxHoursPerDay) {
      return { 
        valid: false, 
        reason: `담당 교수(${professor.name})의 하루 최대 강의 시간(${professor.maxHoursPerDay}시간)을 초과합니다.` 
      };
    }
  }

  // 4. Professor Weekly Max Days limit (Rule 3 - 주 최대 3일 출강)
  if (constraints.limitProfessorDaysPerWeek && professor) {
    const activeDays = new Set<DayOfWeek>();
    for (const entry of currentSchedule) {
      const entryCourse = allCourses.find(c => c.id === entry.courseId);
      if (entryCourse && entryCourse.professorId === course.professorId) {
        activeDays.add(entry.day);
      }
    }
    if (activeDays.size >= 3 && !activeDays.has(day)) {
      return {
        valid: false,
        reason: `담당 교수(${professor.name})의 주간 최대 강의 요일 수(3일)를 초과하여 새로운 요일(${day})에 배정할 수 없습니다.`
      };
    }
  }

  // Loop through current entries to check conflicts
  for (const entry of currentSchedule) {
    const entryCourse = allCourses.find(c => c.id === entry.courseId);
    if (!entryCourse) continue;

    // Check if there is an overlapping period
    const entryPeriods = Array.from({ length: entry.duration }, (_, i) => entry.startPeriod + i);
    const hasOverlap = entry.day === day && targetPeriods.some(p => entryPeriods.includes(p));

    if (hasOverlap) {
      // Room clash check
      if (constraints.avoidRoomClash && course.classroomId === entryCourse.classroomId) {
        const room = classrooms.find(r => r.id === course.classroomId);
        return { 
          valid: false, 
          reason: `강의실 중복: 동일 시간대에 강의실 '${room?.name}'이(가) '${entryCourse.name}'에 사용 중입니다.` 
        };
      }

      // Professor clash check
      if (constraints.avoidProfessorClash && course.professorId === entryCourse.professorId) {
        return { 
          valid: false, 
          reason: `교수 중복: '${professor?.name}' 교수가 동일 시간대에 '${entryCourse.name}' 강의를 진행합니다.` 
        };
      }

      // Grade-level major overlap check (Rule 1)
      if (
        constraints.preventSameGradeMajorOverlap &&
        course.isMajor &&
        entryCourse.isMajor &&
        course.grade === entryCourse.grade
      ) {
        return { 
          valid: false, 
          reason: `전공 중복: 동일 학년(${course.grade}학년) 전공 과목인 '${entryCourse.name}'과(와) 시간대가 겹칩니다.` 
        };
      }
    }
  }

  return { valid: true };
}

// Calculate schedule quality score
export function evaluateScheduleScore(
  schedule: TimetableEntry[],
  courses: Course[],
  professors: Professor[],
  classrooms: Classroom[],
  constraints: SchedulingConstraints
): { score: number; violations: string[] } {
  let score = 100;
  const violations: string[] = [];

  // Deduct for unscheduled courses
  const scheduledIds = new Set(schedule.map(s => s.courseId));
  const unscheduledCount = courses.length - scheduledIds.size;
  if (unscheduledCount > 0) {
    score -= unscheduledCount * 15;
    violations.push(`미배치 과목: ${unscheduledCount}개의 과목이 배치되지 못했습니다.`);
  }

  // Check professor overwork (daily hours limits)
  for (const prof of professors) {
    for (const day of DAYS) {
      let dailyHours = 0;
      for (const entry of schedule) {
        const c = courses.find(course => course.id === entry.courseId);
        if (c && c.professorId === prof.id && entry.day === day) {
          dailyHours += entry.duration;
        }
      }
      if (dailyHours > prof.maxHoursPerDay) {
        score -= 10;
        violations.push(`교수 과로: ${prof.name} 교수가 ${day}에 최대 시간(${prof.maxHoursPerDay}시간)을 초과한 ${dailyHours}시간 강의를 배정받았습니다.`);
      }
    }
  }

  // Check professor weekly days limit (Rule 3)
  if (constraints.limitProfessorDaysPerWeek) {
    for (const prof of professors) {
      const activeDays = new Set<DayOfWeek>();
      for (const entry of schedule) {
        const c = courses.find(course => course.id === entry.courseId);
        if (c && c.professorId === prof.id) {
          activeDays.add(entry.day);
        }
      }
      if (activeDays.size > 3) {
        score -= 15;
        violations.push(`교수 요일 초과: ${prof.name} 교수가 주간 최대 강의 일수(3일)를 초과하여 ${activeDays.size}일 간 강의를 배정받았습니다.`);
      }
    }
  }

  // Check grade lunch break (prefer no lectures during period 4/lunch time for a grade if possible)
  for (const grade of [1, 2, 3, 4] as const) {
    for (const day of DAYS) {
      const lunchOverlap = schedule.some(entry => {
        const c = courses.find(course => course.id === entry.courseId);
        if (!c || c.grade !== grade || entry.day !== day) return false;
        const entryPeriods = Array.from({ length: entry.duration }, (_, i) => entry.startPeriod + i);
        return entryPeriods.includes(4); // 4교시 (12:00 - 13:00)
      });
      if (lunchOverlap) {
        score -= 1; // Soft penalty
      }
    }
  }

  // Check classroom occupancy overlap
  for (const room of classrooms) {
    for (const day of DAYS) {
      const periodsOccupied = new Set<number>();
      for (const entry of schedule) {
        const c = courses.find(course => course.id === entry.courseId);
        if (c && c.classroomId === room.id && entry.day === day) {
          for (let p = entry.startPeriod; p < entry.startPeriod + entry.duration; p++) {
            if (periodsOccupied.has(p)) {
              score -= 20;
              violations.push(`강의실 충돌: ${room.name}에서 ${day} ${p}교시에 강의가 중복 배치되었습니다.`);
            }
            periodsOccupied.add(p);
          }
        }
      }
    }
  }

  // Check professor double-bookings
  for (const prof of professors) {
    for (const day of DAYS) {
      const periodsOccupied = new Set<number>();
      for (const entry of schedule) {
        const c = courses.find(course => course.id === entry.courseId);
        if (c && c.professorId === prof.id && entry.day === day) {
          for (let p = entry.startPeriod; p < entry.startPeriod + entry.duration; p++) {
            if (periodsOccupied.has(p)) {
              score -= 20;
              violations.push(`교수 강의 충돌: ${prof.name} 교수가 ${day} ${p}교시에 중복 배정되었습니다.`);
            }
            periodsOccupied.add(p);
          }
        }
      }
    }
  }

  return {
    score: Math.max(0, score),
    violations,
  };
}

// Solve using Backtracking CSP
export function solveTimetable(
  courses: Course[],
  professors: Professor[],
  classrooms: Classroom[],
  constraints: SchedulingConstraints
): SolverResult {
  const currentSchedule: TimetableEntry[] = [];
  const unscheduled: string[] = [];

  // Sort courses: Majors first, longer courses first, higher grade first (heuristics to make backtracking faster)
  const sortedCourses = [...courses].sort((a, b) => {
    if (a.isMajor && !b.isMajor) return -1;
    if (!a.isMajor && b.isMajor) return 1;
    if (b.weeklyHours !== a.weeklyHours) return b.weeklyHours - a.weeklyHours;
    return b.grade - a.grade;
  });

  // Simple shuffle for days/slots to introduce variety on repeat generation
  const daysPool = [...DAYS];
  const periodsPool = Array.from({ length: 9 }, (_, i) => i + 1);

  function backtrack(courseIndex: number): boolean {
    if (courseIndex >= sortedCourses.length) {
      return true;
    }

    const course = sortedCourses[courseIndex];

    // Try all day/period combinations
    for (const day of daysPool) {
      for (const startPeriod of periodsPool) {
        const check = isValidSlot(
          course,
          day,
          startPeriod,
          course.weeklyHours,
          currentSchedule,
          courses,
          professors,
          classrooms,
          constraints
        );

        if (check.valid) {
          // Place course
          const entry: TimetableEntry = {
            id: `entry-${course.id}-${day}-${startPeriod}`,
            courseId: course.id,
            day,
            startPeriod,
            duration: course.weeklyHours,
          };
          currentSchedule.push(entry);

          // Recurse
          if (backtrack(courseIndex + 1)) {
            return true;
          }

          // Backtrack
          currentSchedule.pop();
        }
      }
    }

    // Fail-soft: If we can't schedule this course, record it and try to schedule remaining
    unscheduled.push(course.id);
    return backtrack(courseIndex + 1);
  }

  backtrack(0);

  const evaluation = evaluateScheduleScore(currentSchedule, courses, professors, classrooms, constraints);

  return {
    schedule: currentSchedule,
    unscheduled: Array.from(new Set(unscheduled)),
    success: unscheduled.length === 0,
    score: evaluation.score,
    violations: evaluation.violations,
  };
}
