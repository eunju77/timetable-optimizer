import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { solveTimetable } from "./src/solver";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Initialize Gemini API Client
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API client initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY environment variable is not set. AI Features will be disabled.");
  }
} catch (error) {
  console.error("Error initializing Gemini API:", error);
}

// 1. API: Optimize Timetable
app.post("/api/optimize", (req, res) => {
  try {
    const { courses, professors, classrooms, constraints } = req.body;
    
    if (!courses || !professors || !classrooms || !constraints) {
      return res.status(400).json({ error: "Missing required parameters: courses, professors, classrooms, and constraints are required." });
    }

    const result = solveTimetable(courses, professors, classrooms, constraints);
    return res.json(result);
  } catch (error: any) {
    console.error("Optimization Error:", error);
    return res.status(500).json({ error: error.message || "시간표 최적화 중 오류가 발생했습니다." });
  }
});

// 2. API: Get AI Timetable Feedback
app.post("/api/ai-feedback", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: "Gemini API Client가 설정되지 않았습니다. 관리자에게 문의하세요." });
    }

    const { professors, classrooms, courses, schedule, constraints } = req.body;

    const systemPrompt = `You are an expert academic affairs scheduler and university administrator.
Your task is to analyze the generated university timetable and provide a comprehensive, constructive, and highly professional critique in Korean (한국어).
Focus on:
1. Hard constraint validation: check if there are double-bookings, if any same-grade major classes overlap (Rule 1), if any professor's daily max hours exceed 3 hours (Rule 2), or if any professor is scheduled to teach more than 3 days per week (Rule 3).
2. Pedagogical and scheduling quality: evaluate if same-grade major classes are distributed well (no overlap), student gap times (lunch breaks, long breaks), and professor workloads.
3. Suggest practical tips: highlight any potentially cramped days (e.g. professor with back-to-back 3-hour courses) or classrooms with very high usage.
4. Give an overall administrative "Grade" (e.g. A+, A, B, etc.) with detailed justifications.

Format your output nicely with clean markdown, headers, bullet points, and high readability. Do not output raw JSON. Speak in a respectful, expert tone.`;

    const formattedData = {
      professors: professors.map((p: any) => ({ name: p.name, maxHoursPerDay: p.maxHoursPerDay, dept: p.department })),
      classrooms: classrooms.map((r: any) => ({ name: r.name, capacity: r.capacity, type: r.roomType })),
      courses: courses.map((c: any) => ({ 
        name: c.name, 
        grade: `${c.grade}학년`, 
        type: c.isMajor ? "전공선택" : "교양선택", 
        weeklyHours: `${c.weeklyHours}시간`,
        professor: professors.find((p: any) => p.id === c.professorId)?.name,
        room: classrooms.find((r: any) => r.id === c.classroomId)?.name
      })),
      schedule: schedule.map((entry: any) => {
        const c = courses.find((course: any) => course.id === entry.courseId);
        const profName = professors.find((p: any) => p.id === c?.professorId)?.name;
        const roomName = classrooms.find((r: any) => r.id === c?.classroomId)?.name;
        return {
          course: c?.name,
          grade: c ? `${c.grade}학년` : undefined,
          isMajor: c?.isMajor,
          professor: profName,
          room: roomName,
          day: entry.day,
          timeSlot: `${entry.startPeriod}교시 - ${entry.startPeriod + entry.duration - 1}교시`
        };
      }),
      constraints
    };

    const prompt = `Here is the university timetable data:
${JSON.stringify(formattedData, null, 2)}

Please provide your critique and suggestions in beautiful Korean markdown. Use bullet points and bold sections.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const text = response.text;
    return res.json({ feedback: text });
  } catch (error: any) {
    console.error("Gemini Feedback Error:", error);
    return res.status(500).json({ error: error.message || "AI 피드백 생성 중 오류가 발생했습니다." });
  }
});

// Serve Vite in dev mode, Static in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
