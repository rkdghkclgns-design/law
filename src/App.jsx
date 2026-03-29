import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  FileSearch,
  Gavel,
  History,
  Scale,
  Send,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ChevronRight,
  User,
  Users,
  FileText,
  Search,
  CheckCircle2,
  X,
  LayoutDashboard,
  Clock,
  Briefcase,
  FileSignature,
  Globe,
  RotateCcw,
  Zap,
  Home,
  ShieldAlert,
  Building,
  Heart,
  Wallet,
  Hammer,
  HelpCircle,
  Plus,
  Download,
  Copy,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Target,
  FileDown,
  LineChart,
  List,
  Eraser,
  Landmark
} from 'lucide-react';

/**
 * 1. CONFIGURATION
 * Supabase Edge Function(law-gemini)을 프록시로 사용하여 Gemini API 호출
 */
const GEMINI_PROXY_URL = 'https://pkwbqbxuujpcvndpacsc.supabase.co/functions/v1/law-gemini';

// --- 2. 동적 문서 양식 및 서비스 정의 ---
const DOC_CATEGORIES = [
  {
    id: 'labor', cat: '계약서', title: '표준 근로계약서', icon: Briefcase, color: 'bg-blue-600', desc: '상세 급여 및 근로조건 지정 양식',
    fields: [
      { id: 'employer', label: '사용자 (갑)', type: 'text', placeholder: '회사명 및 대표자 성명', width: 'full' },
      { id: 'employee', label: '근로자 (을)', type: 'text', placeholder: '근로자 성명 및 주민번호', width: 'full' },
      { id: 'contractType', label: '계약 형태', type: 'select', options: ['정규직 (기간의 정함 없음)', '계약직 (1년)', '단시간 근로자', '직접 입력'], width: 'half' },
      { id: 'workHours', label: '근로 시간', type: 'select', options: ['주 40시간 (1일 8시간)', '주 35시간', '오전 10시 ~ 오후 7시', '직접 입력'], width: 'half' },
      { id: 'baseSalary', label: '기본급 (월)', type: 'text', placeholder: '예: 3,000,000원', width: 'half' },
      { id: 'bonus', label: '상여금 및 수당 (옵션)', type: 'text', placeholder: '예: 식대 20만원', width: 'half' },
    ]
  },
  {
    id: 'nda', cat: '계약서', title: '비밀유지계약서(NDA)', icon: ShieldCheck, color: 'bg-indigo-600', desc: '세부 보안 등급 및 위약금 설정',
    fields: [
      { id: 'partyA', label: '정보제공자 (갑)', type: 'text', placeholder: '회사명 또는 성함', width: 'half' },
      { id: 'partyB', label: '정보수령자 (을)', type: 'text', placeholder: '회사명 또는 성함', width: 'half' },
      { id: 'purpose', label: '계약 목적', type: 'text', placeholder: '예) 신규 솔루션 공동 개발 및 실사', width: 'full' },
      { id: 'duration', label: '비밀유지 기간', type: 'select', options: ['계약 종료 후 1년', '계약 종료 후 3년', '영구 유지', '직접 입력'], width: 'half' },
      { id: 'penalty', label: '위반 시 손해배상 예정', type: 'text', placeholder: '예) 위반 1건당 5,000만원', width: 'half' }
    ]
  },
  {
    id: 'loan', cat: '계약서', title: '금전소비대차계약서', icon: Wallet, color: 'bg-emerald-600', desc: '차용증 및 대여금 상환 계약',
    fields: [
      { id: 'lender', label: '대여인 (채권자)', type: 'text', placeholder: '성명, 주소, 연락처', width: 'half' },
      { id: 'borrower', label: '차용인 (채무자)', type: 'text', placeholder: '성명, 주소, 연락처', width: 'half' },
      { id: 'amount', label: '대여 원금', type: 'text', placeholder: '예) 금 50,000,000원', width: 'full' },
      { id: 'interest', label: '이자율 (연)', type: 'select', options: ['무이자', '연 5%', '연 10%', '법정 최고 이자율 (연 20%)', '직접 입력'], width: 'half' },
      { id: 'repaymentDate', label: '변제 기일', type: 'text', placeholder: '예) 2025년 12월 31일', width: 'half' },
      { id: 'specialTerms', label: '특약 사항', type: 'textarea', placeholder: '기한의 이익 상실 조건 등 기입', width: 'full' }
    ]
  },
  {
    id: 'debt', cat: '내용증명', title: '대여금 반환 독촉', icon: FileText, color: 'bg-amber-600', desc: '미수금 상환 요구 및 조치 통보',
    fields: [
      { id: 'sender', label: '발신인', type: 'text', placeholder: '성명, 주소, 연락처', width: 'half' },
      { id: 'receiver', label: '수신인', type: 'text', placeholder: '성명, 주소, 연락처', width: 'half' },
      { id: 'amount', label: '대여 금액 및 일시', type: 'text', placeholder: '예) 2023.01.01 대여 1,500만원', width: 'full' },
      { id: 'deadline', label: '최종 변제 기한', type: 'text', placeholder: '예) 수령 후 7일 이내', width: 'half' },
      { id: 'action', label: '미이행 시 조치', type: 'select', options: ['민사소송 즉시 제기', '사기죄 형사 고소', '가압류 진행', '직접 입력'], width: 'half' }
    ]
  },
  {
    id: 'suit', cat: '소장', title: '민사 소액 소장', icon: Gavel, color: 'bg-red-600', desc: '직접 제출하는 소액 심판 청구',
    fields: [
      { id: 'plaintiff', label: '원고', type: 'text', placeholder: '원고 성명, 연락처, 주소', width: 'half' },
      { id: 'defendant', label: '피고', type: 'text', placeholder: '피고 성명, 연락처, 주소', width: 'half' },
      { id: 'claimType', label: '청구의 종류', type: 'select', options: ['대여금 반환 청구', '물품대금 청구', '손해배상(기) 청구', '직접 입력'], width: 'full' },
      { id: 'reason', label: '청구 원인 (요지)', type: 'textarea', placeholder: '거래 경위 및 상대방의 채무 불이행 사실을 육하원칙으로 기재', width: 'full' }
    ]
  }
];

const PREPARATION_TYPES = [
  "법인 파산 절차 및 준비 서류",
  "개인 회생 신청 자격 및 준비",
  "합의 이혼 및 재산분할 소송 준비",
  "민사 대여금 반환 소송 준비",
  "상가/주택 임대차 분쟁 내용증명 준비",
  "부당해고 구제신청(노동위원회) 준비"
];

// --- LocalStorage 기반 히스토리 헬퍼 ---
const STORAGE_KEY = 'legalai_history';

const saveToHistory = (item) => {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.unshift({ ...item, id: Date.now().toString(), timestamp: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
};

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

// --- 3. UI 컴포넌트 ---

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: 'bg-slate-800 text-slate-400 border border-slate-700',
    primary: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${styles[variant] || styles.default}`}>{children}</span>;
};

const MarkdownRenderer = ({ text, onCaseClick }) => {
  if (!text || typeof text !== 'string') return null;

  const parseInline = (lineContent) => {
    const boldParsed = lineContent.split(/(\*\*.*?\*\*)/).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`b-${i}`} className="text-purple-300 font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return boldParsed.map((part, i) => {
      if (typeof part !== 'string') return part;
      const casePattern = /(대법원|서울고등법원|서울중앙지방법원|특허법원|행정법원)?\s?\d{4}\.\s?\d{1,2}\.\s?\d{1,2}\.?\s?(선고|자)?\s?\d{4}[가-힣]+\d+\s?(판결|결정)?/g;
      const partsArray = [];
      let lastIndex = 0;
      let match;
      while ((match = casePattern.exec(part)) !== null) {
        partsArray.push(part.substring(lastIndex, match.index));
        const caseName = match[0];
        partsArray.push(
          <button key={`case-${i}-${match.index}`} onClick={() => onCaseClick?.(caseName)} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded text-[10px] font-bold transition-all mx-0.5 border border-purple-500/30 group shadow-sm active:scale-95">
            <Gavel size={10} className="group-hover:rotate-12 transition-transform" /> <span className="underline decoration-purple-500/50 underline-offset-2">{caseName}</span>
          </button>
        );
        lastIndex = casePattern.lastIndex;
      }
      partsArray.push(part.substring(lastIndex));
      return partsArray;
    });
  };

  const lines = text.split('\n');
  const elements = [];
  let tableBuffer = [];

  const renderTable = (rows, key) => {
    if (rows.length === 0) return null;

    const parseRow = (r) => {
      let cells = r.split('|');
      if (cells[0].trim() === '') cells.shift();
      if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
      return cells.map(c => c.trim());
    };

    const headers = parseRow(rows[0]);
    const bodyRows = rows.slice(1).map(parseRow);

    return (
      <div key={key} className="overflow-x-auto my-6 rounded-2xl border border-slate-700/50 bg-slate-900/50">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="bg-slate-800 text-purple-300 font-black">
            <tr>{headers.map((h, i) => <th key={i} className="px-5 py-4 border-b border-slate-700 whitespace-nowrap">{parseInline(h)}</th>)}</tr>
          </thead>
          <tbody>
            {bodyRows.map((row, i) => (
              <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                {row.map((cell, j) => <td key={j} className="px-5 py-4 leading-relaxed">{parseInline(cell)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const isTableLine = line.includes('|') && line.length > 2 && !line.startsWith('<h') && !line.startsWith('#') && !line.startsWith('>');

    if (isTableLine) {
      const isSeparator = /^[|\s\-:]+$/.test(line) && line.includes('-');
      if (!isSeparator) tableBuffer.push(line);

      let isNextTableLine = false;
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        isNextTableLine = nextLine.includes('|') && nextLine.length > 2 && !nextLine.startsWith('<h') && !nextLine.startsWith('#') && !nextLine.startsWith('>');
      }

      if (!isNextTableLine && tableBuffer.length > 0) {
        elements.push(renderTable(tableBuffer, `table-${i}`));
        tableBuffer = [];
      }
      continue;
    }

    if (line.startsWith('### ')) elements.push(<h3 key={i} className="text-base font-black text-white mt-6 border-l-4 border-purple-500 pl-3 leading-tight">{parseInline(line.replace('### ', ''))}</h3>);
    else if (line.startsWith('## ')) elements.push(<h2 key={i} className="text-lg font-black text-white mt-8 border-b border-slate-700 pb-2 mb-2">{parseInline(line.replace('## ', ''))}</h2>);
    else if (line.startsWith('# ')) elements.push(<h1 key={i} className="text-2xl font-black text-white mt-8 border-b-2 border-purple-500 pb-2 mb-4">{parseInline(line.replace('# ', ''))}</h1>);
    else if (line.match(/^[-*]\s/) || line.match(/^\d+\.\s/)) {
      const isNumbered = line.match(/^\d+\.\s/);
      const contentStr = line.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '');
      elements.push(
        <div key={i} className="flex gap-3 ml-2 mt-2">
          {isNumbered ? (
            <span className="text-purple-400 font-bold mt-0.5 shrink-0">{line.match(/^\d+\./)[0]}</span>
          ) : (
            <span className="text-purple-500 mt-2 h-1.5 w-1.5 rounded-full bg-current shrink-0 shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
          )}
          <span className="leading-relaxed text-slate-300">{parseInline(contentStr)}</span>
        </div>
      );
    }
    else if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} className="border-l-4 border-slate-500 pl-4 py-2 text-slate-400 italic bg-slate-800/30 rounded-r-lg my-3">{parseInline(line.replace('> ', ''))}</blockquote>);
    }
    else if (line !== '') {
      elements.push(<p key={i} className="min-h-[1em] text-slate-300 leading-relaxed mt-2">{parseInline(line)}</p>);
    } else {
      elements.push(<div key={i} className="h-2"></div>);
    }
  }

  return <div className="report-preview space-y-1">{elements}</div>;
};

const generateCleanHTML = (markdown) => {
  let html = markdown
    .replace(/### (.*$)/gim, '<h3>$1</h3>')
    .replace(/## (.*$)/gim, '<h2>$1</h2>')
    .replace(/# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');

  const lines = html.split('\n');
  let finalHtml = '';
  let tableBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableLine = line.includes('|') && line.length > 2 && !line.startsWith('<h') && !line.startsWith('<li');

    if (isTableLine) {
      const isSeparator = /^[|\s\-:]+$/.test(line) && line.includes('-');
      if (!isSeparator) tableBuffer.push(line);

      let isNextTableLine = false;
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        isNextTableLine = nextLine.includes('|') && nextLine.length > 2 && !nextLine.startsWith('<h') && !nextLine.startsWith('<li');
      }

      if (!isNextTableLine && tableBuffer.length > 0) {
        finalHtml += '<table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;" border="1">\n';

        const parseRow = (r) => {
          let cells = r.split('|');
          if (cells[0].trim() === '') cells.shift();
          if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
          return cells.map(c => c.trim());
        };

        const headers = parseRow(tableBuffer[0]);
        finalHtml += '<tr>' + headers.map(c => `<th style="background-color: #f8f9fa; font-weight: bold; border: 1px solid #333; padding: 12px; text-align: center;">${c}</th>`).join('') + '</tr>\n';

        for (let j = 1; j < tableBuffer.length; j++) {
          const rowCells = parseRow(tableBuffer[j]);
          finalHtml += '<tr>' + rowCells.map(c => `<td style="border: 1px solid #333; padding: 12px; text-align: left;">${c}</td>`).join('') + '</tr>\n';
        }

        finalHtml += '</table>\n';
        tableBuffer = [];
      }
      continue;
    }

    if (line !== '') {
      if (!line.startsWith('<li>') && !line.startsWith('<h')) {
        finalHtml += line + '<br/>\n';
      } else {
        finalHtml += line + '\n';
      }
    }
  }

  finalHtml = finalHtml.replace(/(<li>.*<\/li>\n?)+/g, '<ul style="padding-left: 20px; margin-bottom: 15px;">$&</ul>');
  return finalHtml;
};

// --- 4. MAIN APP COMPONENT ---

export default function App() {
  const [bootStatus, setBootStatus] = useState('ready');
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [historyItems, setHistoryItems] = useState([]);

  const [caseForm, setCaseForm] = useState({ victim: '', perpetrator: '', details: '', damage: '', caseNumber: '' });
  const [trackNumber, setTrackNumber] = useState('');
  const [trackCount, setTrackCount] = useState('3');
  const [caseResult, setCaseResult] = useState(null);
  const [caseResultTitle, setCaseResultTitle] = useState('분석 리포트');

  const [prepType, setPrepType] = useState('');
  const [prepCustom, setPrepCustom] = useState('');
  const [prepResult, setPrepResult] = useState(null);

  const [docWizard, setDocWizard] = useState({ step: 0, tpl: null, inputs: {}, result: '' });
  const [caseModal, setCaseModal] = useState({ open: false, title: '', content: '' });

  const scrollRef = useRef(null);

  // 히스토리 로드
  useEffect(() => {
    setHistoryItems(loadHistory());
  }, []);

  const callGemini = async (prompt, systemInstruction, useSearch = true) => {
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] }
    };
    if (useSearch) payload.tools = [{ "google_search": {} }];

    const tryFetch = async (body) => {
      const response = await fetch(GEMINI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw { status: response.status, data };
      }
      return data;
    };

    try {
      // 첫 시도: google_search 포함
      const data = await tryFetch(payload);
      return {
        text: data.candidates?.[0]?.content?.parts?.[0]?.text || "데이터를 도출할 수 없습니다.",
        sources: data.candidates?.[0]?.groundingMetadata?.groundingAttributions || []
      };
    } catch (e) {
      // google_search가 지원되지 않는 경우 도구 없이 재시도
      if (useSearch) {
        try {
          const fallbackPayload = { ...payload };
          delete fallbackPayload.tools;
          const data = await tryFetch(fallbackPayload);
          return {
            text: data.candidates?.[0]?.content?.parts?.[0]?.text || "데이터를 도출할 수 없습니다.",
            sources: []
          };
        } catch (e2) {
          throw new Error(e2?.data?.error?.message || "AI 서비스 연결에 실패했습니다.");
        }
      }
      throw new Error(e?.data?.error?.message || "AI 서비스 연결에 실패했습니다.");
    }
  };

  const refreshHistory = () => setHistoryItems(loadHistory());

  const handleConsultation = async (customPayload) => {
    if (loading) return;
    const input = customPayload || chatInput;
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setChatInput('');
    setLoading(true);
    setActiveTab('chat');

    const systemPrompt = `대한민국 법률 전문가 AI입니다. 민법, 형법, 상법을 근거로 자문을 제공하세요. 마크다운 사용 필수.`;

    try {
      const { text } = await callGemini(input, systemPrompt, true);
      setMessages(prev => [...prev, { role: 'assistant', text }]);
      saveToHistory({ type: 'chat', query: input, response: text });
      refreshHistory();
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: "오류 발생. 잠시 후 시도해 주세요.", error: true }]);
    } finally { setLoading(false); }
  };

  const handleCaseStrategyAnalysis = async () => {
    if (loading || !caseForm.details.trim()) return;
    setLoading(true);
    setCaseResult(null);
    setCaseResultTitle('개요 기반 승소 전략 리포트');

    const compiledSummary = `피해자: ${caseForm.victim || '미상'}\n가해자: ${caseForm.perpetrator || '미상'}\n사건 경위: ${caseForm.details}\n피해 상태: ${caseForm.damage || '미상'}\n사건 번호: ${caseForm.caseNumber || '없음'}`;
    const prompt = `[중요: 반드시 Google 검색을 사용하여 실제 대한민국 법원(종합법률정보, 대법원 등)에 등록된 '실제 사건번호'를 찾아야 합니다. 데이터가 없다고 하거나 가상의 판례를 생성하지 마세요.]\n\n다음 사건 개요를 바탕으로 유사한 실제 판례를 3~5개 찾고 승소 전략을 세워주세요.\n${compiledSummary}\n\n가장 먼저 해당 사건의 쟁점과 종합적인 법적 소견을 제시하고, 그 다음 찾은 실제 유사 판례들을 사건번호와 함께 제시해 주세요. 판례는 원고 승/패소 여부와 판결 요약을 포함해야 합니다. 마지막으로 구체적인 승소 전략을 마크다운으로 상세히 작성해 주세요.`;

    try {
      const { text } = await callGemini(prompt, "대한민국 최고 수준의 판례 분석 변호사 AI", true);
      setCaseResult(text);
      saveToHistory({ type: 'case_strategy', query: '사건 개요 분석 및 다중 판례', response: text, summary: compiledSummary });
      refreshHistory();
    } catch (e) { setCaseResult("데이터 분석 중 오류가 발생했습니다."); } finally { setLoading(false); }
  };

  const handleCaseTracking = async () => {
    if (loading || !trackNumber.trim()) return;
    setLoading(true);
    setCaseResult(null);
    setCaseResultTitle(`[${trackNumber}] 유사 사건 추적 리포트`);

    const prompt = `[중요: 반드시 Google 검색을 사용하여 실제 대한민국 법원에 등록된 판례만 찾아야 합니다.]\n\n사건번호 [${trackNumber}]와 유사한 쟁점을 다룬 실제 판례를 정확히 ${trackCount}개 찾아서 리스트업해 주세요.\n\n1. **[AI 종합 소견]**: 가장 먼저 법리적 흐름을 분석한 종합 소견을 상세히 작성해 주세요.\n2. **[유사 판례 리스트]**: 각 판례별로 실제 사건번호, 승소/패소 결과, 판결 요약을 명확히 구분하여 작성하세요.`;

    try {
      const { text } = await callGemini(prompt, "판례 추적 및 법리 해석 전문 AI", true);
      setCaseResult(text);
      saveToHistory({ type: 'case_strategy', query: `${trackNumber} 사건 추적 (${trackCount}건)`, response: text, summary: trackNumber });
      refreshHistory();
    } catch (e) { setCaseResult("사건 추적 중 오류가 발생했습니다."); } finally { setLoading(false); }
  };

  const handlePreparation = async () => {
    const targetQuery = prepType === '직접 입력' ? prepCustom : prepType;
    if (loading || !targetQuery.trim()) return;
    setLoading(true);
    setPrepResult(null);

    const prompt = `사용자가 [${targetQuery}] 절차를 준비 중입니다.
    다음 내용을 반드시 포함하여 가이드를 작성해주세요.
    1. **진행 절차 단계**: 시간 흐름에 따른 절차를 반드시 완벽한 Markdown Table 문법(| 단계 | 내용 | 비고 |)으로 도식화해 주세요. (가짜 점선 --- 단독 사용 금지)
    2. **필수 준비 서류 및 구비 방법**: 각 서류를 어디서(주민센터, 정부24, 대법원 등) 어떻게 발급받는지 리스트 형태로 꼼꼼히 기재해 주세요.
    3. **법적 유의사항 및 팁**: 절차 진행 시 주의할 점을 서술해 주세요.`;

    try {
      const { text } = await callGemini(prompt, "대한민국 송무 및 행정 전문가 AI", true);
      setPrepResult(text);
      saveToHistory({ type: 'preparation', query: `${targetQuery} 가이드`, response: text });
      refreshHistory();
    } catch (e) { setPrepResult("가이드 생성 중 오류가 발생했습니다."); } finally { setLoading(false); }
  };

  const handleWizardInputChange = (fieldId, value) => {
    setDocWizard(prev => ({ ...prev, inputs: { ...prev.inputs, [fieldId]: value } }));
  };

  const createOfficialDraft = async () => {
    if (loading || !docWizard.tpl) return;
    setLoading(true);
    let inputDetails = '';
    docWizard.tpl.fields.forEach(field => {
      let val = docWizard.inputs[field.id] || '미기재';
      if (val === '직접 입력') val = docWizard.inputs[`${field.id}_custom`] || '미기재';
      inputDetails += `- ${field.label}: ${val}\n`;
    });

    const prompt = `[${docWizard.tpl.title}] 작성을 요청합니다.\n[조건]\n${inputDetails}\n대한민국 법령에 부합하는 정식 초안을 마크다운으로 상세히 작성하세요. 서명란 필수.`;

    try {
      const { text } = await callGemini(prompt, "대한민국 법률 문서 작성 전문가 AI", false);
      setDocWizard(prev => ({ ...prev, result: text, step: 2 }));
      saveToHistory({ type: 'document', query: `${docWizard.tpl.title} 생성`, response: text, inputs: docWizard.inputs });
      refreshHistory();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCaseDetailClick = async (caseName) => {
    setCaseModal({ open: true, title: caseName, content: '' });
    try {
      const { text } = await callGemini(`[${caseName}] 심층 법리 분석 및 판결 요지를 작성하세요.`, "판례 전문 분석 전문가");
      setCaseModal(prev => ({ ...prev, content: text }));
    } catch (e) { setCaseModal(prev => ({ ...prev, content: "데이터 연동 실패." })); }
  };

  const exportFile = (content, filename, format) => {
    if (!content) return;

    const htmlContent = generateCleanHTML(content);

    if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>${filename}</title>
        <style>
          body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; line-height: 1.8; color: #000; padding: 40px; max-width: 800px; margin: auto; }
          h1 { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; font-size: 24px;}
          h2 { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; font-size: 20px;}
          h3 { margin-top: 20px; font-size: 16px;}
          ul { padding-left: 20px; margin-bottom: 15px; }
          li { margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; font-size: 14px; }
          th, td { border: 1px solid #333; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
        </head><body><h1>${filename.replace(/_/g, ' ')}</h1><div>${htmlContent}</div></body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
      return;
    }

    if (format === 'hwp' || format === 'docx') {
      const officeHtml = `<!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <meta charset="utf-8">
          <title>${filename}</title>
        </head>
        <body style="font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #000;">
          <h1>${filename.replace(/_/g, ' ')}</h1>
          ${htmlContent}
        </body></html>
      `;
      const mimeType = format === 'hwp' ? 'application/octet-stream' : 'application/msword';
      const blob = new Blob(['\ufeff' + officeHtml], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadHistoryItem = (item) => {
    if (item.type === 'chat') {
      setActiveTab('chat');
      setMessages([{ role: 'user', text: item.query }, { role: 'assistant', text: item.response }]);
    } else if (item.type === 'document') {
      setActiveTab('doc');
      setDocWizard({ step: 2, tpl: { title: item.query.replace(' 생성', '') }, inputs: item.inputs || {}, result: item.response });
    } else if (item.type === 'preparation') {
      setActiveTab('prep');
      setPrepResult(item.response);
    } else if (item.type === 'case_strategy') {
      if (item.query.includes('추적')) {
        setActiveTab('track');
        setTrackNumber(item.summary || '');
      } else {
        setActiveTab('case');
      }
      setCaseResultTitle('과거 분석 리포트 복원');
      setCaseResult(item.response);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0f172a] text-slate-200 overflow-hidden font-sans select-none touch-pan-y">

      {/* 판례 모달 */}
      {caseModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#1e293b] w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="bg-purple-600 p-2 rounded-xl shadow-lg"><Gavel className="text-white" size={18} /></div>
                <h3 className="font-black text-white text-base truncate tracking-tighter leading-none">{caseModal.title}</h3>
              </div>
              <button onClick={() => setCaseModal({ ...caseModal, open: false })} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900/30">
              {caseModal.content ? <MarkdownRenderer text={caseModal.content} /> : <div className="flex flex-col items-center py-20 gap-4 opacity-40"><Loader2 className="animate-spin text-purple-500" size={32} /><p className="font-black uppercase tracking-[0.2em] text-[10px]">Processing...</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* 상단 바 */}
      <header className="h-16 flex items-center justify-between px-6 bg-[#1e293b] border-b border-slate-700 shrink-0 z-50 shadow-2xl">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2 rounded-xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
            <Scale className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none italic">LegalAI</h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Enterprise Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="primary">SECURE NODE</Badge>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative min-h-0">

        {/* 사이드바 */}
        <nav className="hidden md:flex flex-col w-64 bg-[#0f172a] border-r border-slate-800 p-6 gap-2 shrink-0 overflow-y-auto custom-scrollbar z-40">
          {[
            { id: 'home', label: '법률 서비스 홈', icon: Home },
            { id: 'chat', label: '지능형 법률상담', icon: MessageSquare },
            { id: 'case', label: '사건 전략 분석', icon: Target },
            { id: 'track', label: '유사 사건 추적', icon: Search },
            { id: 'doc', label: '전문 문서 제작', icon: FileSignature },
            { id: 'prep', label: '소송 절차 준비', icon: List },
            { id: 'history', label: '업무 기록 관리', icon: History },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); }}
              className={`flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all border ${
                activeTab === item.id
                  ? 'bg-purple-600 border-purple-400 text-white shadow-2xl shadow-purple-900/50 font-black'
                  : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200 font-bold'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-600 group-hover:text-purple-400'} />
              <span className="text-sm tracking-tight leading-none">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* 뷰 컨트롤러 */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative overflow-hidden">

          {/* 1. 홈 뷰 */}
          {activeTab === 'home' && (
            <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32 space-y-10 custom-scrollbar scroll-smooth">

              <div className="relative w-full h-48 md:h-64 rounded-[2.5rem] overflow-hidden shadow-2xl flex items-center justify-center border border-slate-700/50">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                  alt="법무법인 예우"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
                />
                <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent opacity-80"></div>
                <div className="relative z-10 text-center flex flex-col items-center">
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 flex items-center gap-4 shadow-2xl">
                    <div className="bg-[#1e3a8a] text-white font-black text-3xl p-3 rounded-xl leading-none tracking-tighter">예우</div>
                    <div className="text-left">
                      <h2 className="text-3xl font-black text-white tracking-widest leading-none">법무법인 예우</h2>
                      <p className="text-[10px] text-blue-200 font-bold tracking-[0.3em] mt-2">LAWFIRM YEWOO</p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => { setActiveTab('doc'); setDocWizard({ step: 0, tpl: null, inputs: {}, result: '' }); }}
                className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer border border-white/10"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                <div className="relative z-10 space-y-6">
                  <Badge variant="success">Lawform Engine</Badge>
                  <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">세부 조건 반영<br/>법률 문서 자동 생성</h3>
                  <p className="text-[10px] text-indigo-100/60 font-bold leading-relaxed">계약 조건, 급여, 보안 등급 등을 도표화된 입력창에 작성하면 AI가 완벽한 문서를 생성합니다.</p>
                  <div className="flex items-center gap-2 text-xs font-black text-white bg-black/20 w-fit px-6 py-3.5 rounded-2xl border border-white/5">
                    제작 시작 <ArrowRight size={14} />
                  </div>
                </div>
              </div>

              <div
                onClick={() => { setActiveTab('case'); }}
                className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer border border-white/10"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                <div className="relative z-10 space-y-6">
                  <Badge variant="warning">Case Strategy & Tracker</Badge>
                  <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">사건 개요 기반<br/>승소 전략 분석기</h3>
                  <p className="text-[10px] text-amber-100/60 font-bold leading-relaxed">현재 상황을 입력하면 유사 판례(사건번호)를 스캔하고 최적의 승소 전략을 도출합니다.</p>
                  <div className="flex items-center gap-2 text-xs font-black text-white bg-black/20 w-fit px-6 py-3.5 rounded-2xl border border-white/5">
                    사건 분석 시작 <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. 사건 분석 뷰 */}
          {activeTab === 'case' && (
            <div className="flex-1 flex flex-col min-h-0 p-5 md:p-10 max-w-7xl mx-auto w-full gap-6 animate-in fade-in duration-500">
              <header className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-600 p-4 rounded-2xl shadow-xl shadow-amber-900/30"><Target size={28} className="text-white" /></div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none italic">Case Strategy</h2>
                    <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">사건 개요 기반 다중 판례 및 승소 전략 도출</p>
                  </div>
                </div>
                <button
                  onClick={() => { setCaseForm({ victim: '', perpetrator: '', details: '', damage: '', caseNumber: '' }); setCaseResult(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <Eraser size={14} /> 폼 초기화
                </button>
              </header>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 overflow-hidden">
                <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar pb-10">
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-inner space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">피해자</label>
                      <input value={caseForm.victim} onChange={e => setCaseForm({...caseForm, victim: e.target.value})} placeholder="본인 또는 의뢰인" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">가해자 (상대방)</label>
                      <input value={caseForm.perpetrator} onChange={e => setCaseForm({...caseForm, perpetrator: e.target.value})} placeholder="상대방 특정" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">사건 경위 (필수)</label>
                      <textarea value={caseForm.details} onChange={e => setCaseForm({...caseForm, details: e.target.value})} placeholder="육하원칙에 따라 사건이 발생한 과정을 상세히 적어주세요." className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500 h-28 resize-none custom-scrollbar" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">피해 상태 / 청구 취지</label>
                      <input value={caseForm.damage} onChange={e => setCaseForm({...caseForm, damage: e.target.value})} placeholder="예: 금전 액수 500만원, 상해 3주 등" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">사건 번호 (선택)</label>
                      <input value={caseForm.caseNumber} onChange={e => setCaseForm({...caseForm, caseNumber: e.target.value})} placeholder="현재 진행 중인 소송이 있다면 기입" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>
                  <button
                    onClick={handleCaseStrategyAnalysis}
                    disabled={loading || !caseForm.details.trim()}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-700 py-5 rounded-[2rem] font-black text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />} 개요 분석 및 전략 도출
                  </button>
                </div>

                <div className="bg-slate-800/30 border border-slate-700/50 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative min-h-[500px]">
                  <div className="p-5 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={16} className="text-amber-400" />
                      <span className="text-[11px] font-black text-white uppercase tracking-widest">{caseResultTitle}</span>
                    </div>
                    {caseResult && (
                      <div className="flex gap-1">
                        <button onClick={() => exportFile(caseResult, '사건_전략_리포트', 'pdf')} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 transition-colors text-white text-[10px] font-black rounded-lg shadow-md flex items-center gap-1"><FileDown size={12}/> PDF</button>
                        <button onClick={() => exportFile(caseResult, '사건_전략_리포트', 'hwp')} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 transition-colors text-white text-[10px] font-black rounded-lg shadow-md flex items-center gap-1"><FileDown size={12}/> HWP</button>
                        <button onClick={() => exportFile(caseResult, '사건_전략_리포트', 'md')} className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 transition-colors text-white text-[10px] font-black rounded-lg shadow-md flex items-center gap-1"><FileDown size={12}/> MD</button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900/10 relative">
                    {caseResult ? <MarkdownRenderer text={caseResult} onCaseClick={handleCaseDetailClick} /> : (
                      <div className="h-full flex flex-col items-center justify-center text-center px-10 space-y-4 opacity-20">
                        <Target size={64} className="text-slate-700" />
                        <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">구조화된 폼을 입력하시면<br/>다중 판례와 승소 전략이 도출됩니다.</p>
                      </div>
                    )}
                  </div>
                  {loading && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-20"><Loader2 className="animate-spin text-amber-500" size={48} /></div>}
                </div>
              </div>
            </div>
          )}

          {/* 2-1. 사건 추적 뷰 */}
          {activeTab === 'track' && (
            <div className="flex-1 flex flex-col min-h-0 p-5 md:p-10 max-w-7xl mx-auto w-full gap-6 animate-in fade-in duration-500">
              <header className="flex items-center gap-4 shrink-0">
                <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-900/30"><Search size={28} className="text-white" /></div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none italic">Case Tracker</h2>
                  <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">특정 사건번호 유사 판례 추적 및 종합 소견</p>
                </div>
              </header>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 overflow-hidden">
                <div className="flex flex-col gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-inner space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">기준 사건 번호</label>
                      <input
                        value={trackNumber}
                        onChange={(e) => setTrackNumber(e.target.value)}
                        placeholder="예: 2021다12345"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-base text-white font-bold focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">추적할 유사 사건 개수</label>
                      <select
                        value={trackCount}
                        onChange={(e) => setTrackCount(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                      >
                        <option value="1">1개</option>
                        <option value="3">3개</option>
                        <option value="5">5개 (상세 추적)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleCaseTracking}
                    disabled={loading || !trackNumber.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-6 rounded-[2rem] font-black text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <LineChart size={24} />} 추적 및 소견 도출
                  </button>
                </div>

                <div className="bg-slate-800/30 border border-slate-700/50 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative min-h-[500px]">
                  <div className="p-5 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={16} className="text-blue-400" />
                      <span className="text-[11px] font-black text-white uppercase tracking-widest">{caseResultTitle}</span>
                    </div>
                    {caseResult && (
                      <div className="flex gap-1">
                        <button onClick={() => exportFile(caseResult, '사건_추적_리포트', 'pdf')} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1 shadow-md"><FileDown size={12}/> PDF</button>
                        <button onClick={() => exportFile(caseResult, '사건_추적_리포트', 'hwp')} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1 shadow-md"><FileDown size={12}/> HWP</button>
                        <button onClick={() => exportFile(caseResult, '사건_추적_리포트', 'md')} className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1 shadow-md"><FileDown size={12}/> MD</button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900/10">
                    {caseResult ? <MarkdownRenderer text={caseResult} onCaseClick={handleCaseDetailClick} /> : (
                      <div className="h-full flex flex-col items-center justify-center text-center px-10 space-y-4 opacity-20">
                        <Search size={64} className="text-slate-700" />
                        <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">사건번호를 입력하면 AI 종합 소견이 최상단에 노출되고<br/>그 아래로 유사 판례가 리스트업됩니다.</p>
                      </div>
                    )}
                  </div>
                  {loading && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-20"><Loader2 className="animate-spin text-blue-500" size={48} /></div>}
                </div>
              </div>
            </div>
          )}

          {/* 소송 절차 준비 */}
          {activeTab === 'prep' && (
            <div className="flex-1 flex flex-col min-h-0 p-5 md:p-10 max-w-6xl mx-auto w-full gap-6 animate-in fade-in duration-500">
              <header className="flex items-center gap-4 shrink-0">
                <div className="bg-emerald-600 p-4 rounded-2xl shadow-xl shadow-emerald-900/30"><List size={28} className="text-white" /></div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none italic">Preparation</h2>
                  <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">소송 및 법적 절차 준비 가이드 (도식화)</p>
                </div>
              </header>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 overflow-hidden">
                <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-inner space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">준비할 절차 선택</label>
                      <select
                        value={prepType}
                        onChange={(e) => setPrepType(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none"
                      >
                        <option value="" disabled>어떤 절차를 준비하시나요?</option>
                        {PREPARATION_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        <option value="직접 입력">기타 직접 입력 (특수 소송/절차)</option>
                      </select>

                      {prepType === '직접 입력' && (
                        <input
                          value={prepCustom}
                          onChange={(e) => setPrepCustom(e.target.value)}
                          placeholder="준비하고자 하는 소송이나 절차를 입력하세요."
                          className="w-full bg-slate-800 border border-emerald-500/50 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handlePreparation}
                    disabled={loading || !prepType || (prepType === '직접 입력' && !prepCustom.trim())}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 py-6 rounded-[2rem] font-black text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <List size={24} />} 준비 가이드 생성
                  </button>
                </div>

                <div className="bg-slate-800/30 border border-slate-700/50 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative min-h-[500px]">
                  <div className="p-5 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span className="text-[11px] font-black text-white uppercase tracking-widest">Preparation Guide</span>
                    </div>
                    {prepResult && (
                      <div className="flex gap-1">
                        <button onClick={() => exportFile(prepResult, '준비_가이드', 'pdf')} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1 shadow-md"><FileDown size={12}/> PDF</button>
                        <button onClick={() => exportFile(prepResult, '준비_가이드', 'hwp')} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1 shadow-md"><FileDown size={12}/> HWP</button>
                        <button onClick={() => exportFile(prepResult, '준비_가이드', 'md')} className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1 shadow-md"><FileDown size={12}/> MD</button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900/10">
                    {prepResult ? <MarkdownRenderer text={prepResult} /> : (
                      <div className="h-full flex flex-col items-center justify-center text-center px-10 space-y-4 opacity-20">
                        <List size={64} className="text-slate-700" />
                        <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">절차를 선택하시면 필요 서류(발급처 포함)와<br/>진행 단계가 표로 도식화되어 안내됩니다.</p>
                      </div>
                    )}
                  </div>
                  {loading && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>}
                </div>
              </div>
            </div>
          )}

          {/* 3. 문서 제작 마법사 */}
          {activeTab === 'doc' && (
            <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32 space-y-10 custom-scrollbar animate-in fade-in duration-500">
              <header className="flex items-center justify-between max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-900/30"><FileSignature size={28} className="text-white" /></div>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none italic">Doc Wizard</h2>
                </div>
                {docWizard.step > 0 && <button onClick={() => setDocWizard({...docWizard, step: 0, inputs: {}})} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-white active:scale-90 transition-all shadow-lg"><RotateCcw size={18} /></button>}
              </header>

              <div className="max-w-5xl mx-auto w-full">
                {docWizard.step === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DOC_CATEGORIES.map(t => (
                      <button key={t.id} onClick={() => setDocWizard({ ...docWizard, step: 1, tpl: t, inputs: {} })} className="bg-slate-800/40 border border-slate-700 p-8 rounded-[2.5rem] text-left hover:bg-slate-800 hover:border-indigo-500/40 transition-all group flex items-start justify-between shadow-2xl relative overflow-hidden flex-col gap-4">
                        <Badge variant="primary">{t.cat}</Badge>
                        <div>
                          <h4 className="text-xl font-black text-white leading-tight mt-2 uppercase tracking-tighter">{t.title}</h4>
                          <p className="text-[11px] text-slate-500 font-bold mt-2 leading-relaxed">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {docWizard.step === 1 && docWizard.tpl && (
                  <div className="bg-slate-800/40 border border-slate-700 rounded-[3rem] p-6 md:p-12 space-y-10 shadow-2xl animate-in slide-in-from-right duration-300">
                    <div className="flex items-center gap-3 border-b border-slate-700 pb-6">
                      <Badge variant="primary">Step 02</Badge>
                      <h3 className="font-black text-white text-lg">세부 조건 표 양식 입력 ({docWizard.tpl.title})</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                      {docWizard.tpl.fields.map(field => (
                        <div key={field.id} className={`space-y-3 ${field.width === 'full' ? 'col-span-2' : 'col-span-2 md:col-span-1'}`}>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{field.label}</label>

                          {field.type === 'select' ? (
                            <div className="space-y-3">
                              <select
                                value={docWizard.inputs[field.id] || ''}
                                onChange={(e) => handleWizardInputChange(field.id, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all shadow-inner appearance-none cursor-pointer"
                              >
                                <option value="" disabled>선택하세요</option>
                                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                              {docWizard.inputs[field.id] === '직접 입력' && (
                                <input
                                  type="text"
                                  placeholder={`${field.label} 관련 직접 입력 내용`}
                                  value={docWizard.inputs[`${field.id}_custom`] || ''}
                                  onChange={(e) => handleWizardInputChange(`${field.id}_custom`, e.target.value)}
                                  className="w-full bg-slate-900 border border-indigo-500/50 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all shadow-inner"
                                />
                              )}
                            </div>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              value={docWizard.inputs[field.id] || ''}
                              onChange={(e) => handleWizardInputChange(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] p-6 text-sm text-white focus:ring-2 focus:ring-indigo-600 focus:outline-none h-32 resize-none custom-scrollbar placeholder:text-slate-700 leading-relaxed"
                            />
                          ) : (
                            <input
                              value={docWizard.inputs[field.id] || ''}
                              onChange={(e) => handleWizardInputChange(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all shadow-inner placeholder:text-slate-700"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-slate-700">
                      <button
                        onClick={createOfficialDraft}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 py-6 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-tighter disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={28} />} 정식 초안 자동 작성
                      </button>
                    </div>
                  </div>
                )}

                {docWizard.step === 2 && (
                  <div className="space-y-6 animate-in zoom-in-95 duration-500 pb-20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                      <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter italic leading-none"><CheckCircle2 className="text-emerald-500" /> Completed Draft</h3>
                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <button onClick={() => exportFile(docWizard.result, docWizard.tpl.title, 'pdf')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-2xl shadow-lg transition-colors"><FileDown size={16}/> PDF</button>
                        <button onClick={() => exportFile(docWizard.result, docWizard.tpl.title, 'hwp')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-2xl shadow-lg transition-colors"><FileDown size={16}/> HWP</button>
                        <button onClick={() => exportFile(docWizard.result, docWizard.tpl.title, 'md')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-black rounded-2xl shadow-lg transition-colors"><FileDown size={16}/> MD</button>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 md:p-14 shadow-inner relative min-h-[600px] border-t-8 border-t-indigo-600">
                      <MarkdownRenderer text={docWizard.result} />
                      <div className="absolute bottom-10 right-10 flex gap-3">
                        <button onClick={() => {navigator.clipboard.writeText(docWizard.result)}} className="p-4 bg-slate-800 rounded-[1.5rem] text-slate-400 hover:text-white transition-all shadow-2xl border border-white/5 active:scale-90"><Copy size={20} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. AI 실시간 상담 센터 */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 relative">
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-10 space-y-10 custom-scrollbar scroll-smooth">
                {(!messages || messages.length === 0) && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                    <Globe size={100} className="text-purple-500 mb-10 animate-pulse" />
                    <h2 className="text-4xl font-black text-white mb-3 uppercase tracking-tighter leading-none italic">Legal Brain Pro</h2>
                    <p className="text-[11px] max-w-sm font-bold leading-relaxed px-10">실시간 법령 및 대법원 판례 검색을 통합한<br/> 하이엔드 법률 자문 솔루션입니다.</p>
                  </div>
                )}
                {messages?.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[95%] md:max-w-[85%] p-8 rounded-[2.5rem] shadow-2xl border ${
                      m.role === 'user' ? 'bg-gradient-to-br from-purple-600 to-indigo-700 border-purple-400/30 text-white rounded-tr-none' : 'bg-slate-800 border-slate-700 text-slate-200 rounded-tl-none ring-1 ring-white/5'
                    }`}>
                      <MarkdownRenderer text={m.text} onCaseClick={handleCaseDetailClick} />
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-slate-700 p-8 rounded-[2.5rem] flex items-center gap-5 animate-pulse shadow-xl border-purple-500/20">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" size={28} /></div>
                      <span className="text-sm font-black text-slate-200 block uppercase tracking-tight tracking-widest leading-none">AI Thinking</span>
                    </div>
                  </div>
                )}
                <div className="h-32 md:h-0" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/95 to-transparent pt-16">
                <div className="flex gap-4 bg-slate-800 border border-slate-700 p-4 rounded-[3.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.8)] focus-within:ring-2 focus-within:ring-purple-600 transition-all max-w-4xl mx-auto mb-20 md:mb-0 group">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleConsultation()} placeholder="법률 고민이나 상담 내용을 구체적으로 입력하세요..." className="flex-1 bg-transparent px-6 py-2 text-sm focus:outline-none placeholder:text-slate-600 font-bold" />
                  <button onClick={() => handleConsultation()} disabled={loading || !chatInput.trim()} className="p-5 bg-purple-600 text-white rounded-[2.5rem] shadow-xl active:scale-95 disabled:opacity-50 transition-all hover:bg-purple-500 shadow-purple-900/40"><Send size={20} /></button>
                </div>
              </div>
            </div>
          )}

          {/* 5. 통합 업무 기록 관리 */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto px-6 py-10 pb-32 space-y-8 custom-scrollbar">
              <header className="flex items-center justify-between px-2 max-w-5xl mx-auto w-full">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-5 tracking-tighter uppercase leading-none italic"><History className="text-purple-500" /> Vault</h2>
                  <p className="text-[10px] text-slate-500 font-black mt-2 uppercase tracking-widest italic leading-none">Local Data Storage</p>
                </div>
                <Badge variant="indigo">LocalStorage</Badge>
              </header>
              <div className="space-y-4 max-w-5xl mx-auto w-full">
                {(historyItems || []).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="bg-slate-800/40 border border-slate-700 p-10 rounded-[3rem] group hover:border-purple-500/50 active:bg-slate-800 transition-all duration-300 shadow-2xl relative overflow-hidden cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-6 min-w-0">
                        <div className={`p-4 rounded-3xl ${item.type === 'chat' ? 'bg-blue-600/10 text-blue-400' : item.type === 'document' ? 'bg-indigo-600/10 text-indigo-400' : item.type === 'preparation' ? 'bg-emerald-600/10 text-emerald-400' : 'bg-amber-600/10 text-amber-400'} border border-white/5 shadow-xl transition-transform group-hover:scale-105 duration-300`}>
                          {item.type === 'chat' ? <MessageSquare size={24} /> : item.type === 'document' ? <FileSignature size={24} /> : item.type === 'preparation' ? <List size={24} /> : <Target size={24} />}
                        </div>
                        <div className="min-w-0">
                          <Badge variant={item.type === 'chat' ? 'primary' : item.type === 'document' ? 'success' : item.type === 'preparation' ? 'success' : 'warning'}>
                            {item.type === 'chat' ? '일반 상담' : item.type === 'document' ? '문서 제작' : item.type === 'preparation' ? '소송 준비' : '전략/추적'}
                          </Badge>
                          <h4 className="text-xl font-extrabold text-white mt-2 leading-tight line-clamp-1 uppercase tracking-tighter group-hover:text-purple-400 transition-colors">{item.query}</h4>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-8 italic font-medium">{typeof item.response === 'string' ? item.response : String(item.response)}</p>
                    <div className="flex justify-between items-center relative z-10 border-t border-slate-700/50 pt-6">
                      <span className="text-[10px] font-mono text-slate-600 font-black uppercase tracking-widest leading-none">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent'}
                      </span>
                      <div className="text-[10px] font-black text-purple-500 flex items-center gap-2 uppercase tracking-widest transition-colors group-hover:text-purple-400">
                        해당 작업으로 돌아가기 <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                      </div>
                    </div>
                  </div>
                ))}
                {(!historyItems || historyItems.length === 0) && (
                  <div className="h-[500px] flex flex-col items-center justify-center text-center opacity-20 bg-slate-800/10 rounded-[4rem] border border-dashed border-slate-700 py-20">
                    <History size={100} className="text-slate-700 mb-6" />
                    <p className="font-black text-2xl uppercase tracking-tighter text-white leading-none tracking-widest">Archive Empty</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* 모바일 하단 탭 바 */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e293b]/95 backdrop-blur-xl border-t border-slate-700 px-2 py-6 flex justify-around items-center z-[80] shadow-[0_-20px_70px_rgba(0,0,0,0.8)] overflow-x-auto custom-scrollbar">
        {[
          { id: 'home', icon: Home, label: '홈' },
          { id: 'chat', icon: MessageSquare, label: '상담' },
          { id: 'case', icon: Target, label: '전략' },
          { id: 'track', icon: Search, label: '추적' },
          { id: 'doc', icon: FileSignature, label: '문서' },
          { id: 'prep', icon: List, label: '준비' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setCaseResult(null); }}
            className={`flex flex-col items-center gap-2 transition-all min-w-[50px] mx-1 ${activeTab === tab.id ? 'text-purple-400 scale-110 font-black' : 'text-slate-500'}`}
          >
            <tab.icon size={22} className={activeTab === tab.id ? 'text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]' : ''} />
            <span className="text-[9px] font-black uppercase tracking-[0.1em] leading-none mt-1">{tab.label}</span>
          </button>
        ))}
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        :root { -webkit-tap-highlight-color: transparent; }
        body { background-color: #0f172a; margin: 0; height: 100%; width: 100%; overflow: hidden; }
        #root { height: 100%; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a855f7; }
        .animate-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .overflow-y-auto { -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
        input, select, textarea { outline: none !important; caret-color: #a855f7; }
        ::selection { background: #a855f7; color: white; }
        .report-preview h1 { font-size: 1.5rem; color: white; margin-bottom: 1rem; border-bottom: 2px solid #a855f7; padding-bottom: 0.5rem; }
        .report-preview h2 { font-size: 1.25rem; color: white; margin-top: 1.5rem; margin-bottom: 0.75rem; border-bottom: 1px solid #334155; padding-bottom: 0.25rem; }
        .report-preview h3 { font-size: 1.1rem; color: white; margin-top: 1rem; margin-bottom: 0.5rem; border-left: 4px solid #a855f7; padding-left: 0.5rem; }
        .report-preview p { margin-bottom: 0.75rem; }
        .report-preview ul { margin-left: 1.5rem; margin-bottom: 1rem; list-style-type: disc; }
        .report-preview li { margin-bottom: 0.25rem; }
        .report-preview strong { color: #d8b4fe; font-weight: 800; }
      `}} />
    </div>
  );
}
