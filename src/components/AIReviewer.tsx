import { useState } from 'react';
import type { Course, Professor, Classroom, TimetableEntry, SchedulingConstraints } from '../types';
import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface AIReviewerProps {
  schedule: TimetableEntry[];
  courses: Course[];
  professors: Professor[];
  classrooms: Classroom[];
  constraints: SchedulingConstraints;
}

export default function AIReviewer({
  schedule,
  courses,
  professors,
  classrooms,
  constraints,
}: AIReviewerProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAIFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule,
          courses,
          professors,
          classrooms,
          constraints,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'AI 피드백 요청에 실패했습니다.');
      }

      const data = await response.json();
      setFeedback(data.feedback);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '네트워크 오류가 발생했습니다. 서버가 실행 중인지 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-md" id="ai-reviewer">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white font-sans flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
            Gemini AI 학사 시간표 종합 피드백
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            제약조건 적합성과 교육적 효과, 교수·학생 편의성을 다각도로 검토해 종합 리포트를 제공합니다.
          </p>
        </div>
        <button
          onClick={getAIFeedback}
          disabled={loading || schedule.length === 0}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            schedule.length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-xs shadow-indigo-500/20'
          }`}
          id="btn-get-ai-feedback"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>분석 보고서 작성 중...</span>
            </>
          ) : feedback ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>피드백 재작성</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 시간표 피드백 받기</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-xl flex items-start space-x-3 text-xs text-rose-300 font-sans mb-4">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">피드백 실패</p>
            <p className="mt-1">{error}</p>
            <p className="text-[10px] text-rose-400/80 mt-1">
              * 서버 환경변수(GEMINI_API_KEY)가 제대로 설정되었는지 확인해 주세요.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300 font-sans">강의 일정을 다차원 검토 중입니다</p>
            <p className="text-xs text-slate-500 font-sans mt-1">
              "동일 학년 전공 중복" 및 "교수 일일 제한시간" 등 비즈니스 룰을 분석하고 있습니다.
            </p>
          </div>
        </div>
      )}

      {!loading && !feedback && !error && (
        <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 py-12">
          <Sparkles className="w-10 h-10 mx-auto text-slate-700 mb-3" />
          <p className="text-sm font-medium text-slate-400 font-sans">아직 AI 피드백이 생성되지 않았습니다</p>
          <p className="text-xs text-slate-600 font-sans mt-1 max-w-md mx-auto">
            시간표를 변경하거나 최적화한 뒤, 상단의 버튼을 눌러 Gemini 인텔리전스가 분석한 맞춤 학사 자문 리포트를 받아보세요.
          </p>
        </div>
      )}

      {!loading && feedback && (
        <div 
          className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-6 font-sans text-sm text-slate-300 leading-relaxed max-h-[420px] overflow-y-auto scrollbar-thin prose prose-invert prose-sm max-w-none"
          id="ai-feedback-content"
        >
          {/* Simple custom markdown renderer inside the component to avoid react-markdown issues */}
          {feedback.split('\n').map((line, idx) => {
            // Headers
            if (line.startsWith('### ')) {
              return <h4 key={idx} className="text-base font-bold text-white mt-4 mb-2">{line.replace('### ', '')}</h4>;
            }
            if (line.startsWith('## ')) {
              return <h3 key={idx} className="text-lg font-bold text-white mt-6 mb-3 border-b border-slate-800 pb-1">{line.replace('## ', '')}</h3>;
            }
            if (line.startsWith('# ')) {
              return <h2 key={idx} className="text-xl font-black text-indigo-400 mt-6 mb-4">{line.replace('# ', '')}</h2>;
            }
            // List item
            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
              const cleaned = line.replace(/^\s*[\*\-]\s+/, '');
              return (
                <ul key={idx} className="list-disc pl-5 my-1 text-slate-300">
                  <li>{renderInlineStyles(cleaned)}</li>
                </ul>
              );
            }
            // Number list
            if (/^\s*\d+\.\s+/.test(line)) {
              const cleaned = line.replace(/^\s*\d+\.\s+/, '');
              return (
                <ol key={idx} className="list-decimal pl-5 my-1 text-slate-300">
                  <li>{renderInlineStyles(cleaned)}</li>
                </ol>
              );
            }
            // Empty line
            if (line.trim() === '') {
              return <div key={idx} className="h-2" />;
            }
            // Normal paragraph
            return <p key={idx} className="my-1.5">{renderInlineStyles(line)}</p>;
          })}
        </div>
      )}
    </div>
  );
}

// Simple inline styling helper for bold (**text**)
function renderInlineStyles(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.substring(2, part.length - 2)}
        </strong>
      );
    }
    return part;
  });
}
