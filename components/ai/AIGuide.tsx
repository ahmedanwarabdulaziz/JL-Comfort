'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Fab,
  Paper,
  Typography,
  IconButton,
  Chip,
  TextField,
  Stack,
  Backdrop,
  Button,
  Divider,
  Badge,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  CATEGORY_OPTIONS,
  FABRIC_QUESTIONS,
  ShoppingCategory,
  QuestionnaireAnswers,
  FabricQuestion,
} from '@/lib/ai/businessRules';
import { AIChatMessage, AIFabricResult, AIGuideResponse } from '@/lib/types/ai';

// ─── Phase types ─────────────────────────────────────────────────────────────

type AssistantPhase =
  | 'welcome-typing'
  | 'welcome-ready'
  | 'farewell-typing'
  | 'farewell-slide'
  | 'fab'
  | 'panel';

const PANEL_WIDTH = 380;
const PANEL_EXPANDED_WIDTH = 740;
const SESSION_STORAGE_KEY = 'jlc_ai_session_id';
const WELCOMED_KEY = 'jlc_yousha_welcomed';
const TYPING_SPEED = 32;
const TYPING_SPEED_FAST = 22;

// ─── Keyframes ──────────────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes yousha-fade-in {
  from { opacity: 0; transform: scale(0.92) translateY(12px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);     }
}
@keyframes yousha-pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(227,194,154,0.45); }
  70%  { box-shadow: 0 0 0 14px rgba(227,194,154,0);  }
  100% { box-shadow: 0 0 0 0 rgba(227,194,154,0);     }
}
@keyframes yousha-fab-entrance {
  from { opacity: 0; transform: scale(0) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0);    }
}
@keyframes yousha-typing-dot {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
@keyframes yousha-blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes yousha-slide-to-corner {
  0%   { opacity: 1; transform: translate(0, 0) scale(1); }
  60%  { opacity: 0.8; transform: translate(0, 0) scale(0.5); }
  100% { opacity: 0; transform: translate(calc(50vw - 60px), calc(50vh - 60px)) scale(0.1); }
}
@keyframes yousha-buttons-appear {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes yousha-slide-in-right {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0);    }
}
`;

let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
  keyframesInjected = true;
}

// ─── Typing effect hook ─────────────────────────────────────────────────────

function useTypingEffect(text: string, speed: number, startImmediately: boolean) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(startImmediately);
  const [isDone, setIsDone] = useState(false);
  const indexRef = useRef(0);

  const start = useCallback(() => {
    setStarted(true);
    setDisplayed('');
    indexRef.current = 0;
    setIsDone(false);
  }, []);

  useEffect(() => {
    if (!started || isDone) return;
    if (indexRef.current >= text.length) {
      setIsDone(true);
      return;
    }
    const timer = setTimeout(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
    }, speed);
    return () => clearTimeout(timer);
  }, [started, displayed, text, speed, isDone]);

  return { displayed, isDone, start };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  return id;
}

function wasAlreadyWelcomed(): boolean {
  if (typeof window === 'undefined') return true;
  return window.sessionStorage.getItem(WELCOMED_KEY) === '1';
}

function markWelcomed(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(WELCOMED_KEY, '1');
  }
}

// ─── Welcome text ───────────────────────────────────────────────────────────

const WELCOME_LINE1 = "Hi! I'm Yousha ✨";
const WELCOME_LINE2 = "Your personal shopping assistant at JL Comfort. We offer premium Fabric, Foam, and Custom Pillows & Cushions.";
const WELCOME_LINE3 = "Would you like me to help you find what you need?";
const FAREWELL_TEXT = "No worries! I'm right here if you need me — just click me at the bottom right corner anytime! 😊";

// ─── Small components ───────────────────────────────────────────────────────

function TypingDots() {
  return (
    <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center', py: 0.5, justifyContent: 'center' }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 7, height: 7, borderRadius: '50%', bgcolor: '#e3c29a',
            animation: `yousha-typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </Box>
  );
}

function BlinkingCursor() {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block', width: 2, height: '1em', bgcolor: '#e3c29a',
        ml: 0.3, verticalAlign: 'text-bottom',
        animation: 'yousha-blink-cursor 0.8s step-end infinite',
      }}
    />
  );
}

/** Yousha's chat bubble in the panel. */
function YoushaBubble({ children, animate }: { children: React.ReactNode; animate?: boolean }) {
  return (
    <Box
      sx={{
        alignSelf: 'flex-start',
        bgcolor: '#f5f0ea',
        color: 'text.primary',
        px: 1.5, py: 1, borderRadius: 2, maxWidth: '90%',
        ...(animate ? { animation: 'yousha-fade-in 0.3s ease-out forwards' } : {}),
      }}
    >
      {children}
    </Box>
  );
}

/** User's answer bubble. */
function UserBubble({ text }: { text: string }) {
  return (
    <Box
      sx={{
        alignSelf: 'flex-end',
        bgcolor: '#e3c29a', color: '#0d0b09',
        px: 1.5, py: 1, borderRadius: 2, maxWidth: '85%',
        animation: 'yousha-fade-in 0.2s ease-out forwards',
      }}
    >
      <Typography variant="body2">{text}</Typography>
    </Box>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function AIGuide() {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Phase state ─────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<AssistantPhase>('fab');
  const [mounted, setMounted] = useState(false);
  const [showInitialDots, setShowInitialDots] = useState(true);
  const [showFarewellDots, setShowFarewellDots] = useState(false);

  // ── Guided shopping state ──────────────────────────────────────────────
  const [category, setCategory] = useState<ShoppingCategory | null>(null);
  const [fabricQIndex, setFabricQIndex] = useState(-1); // -1 = not started, 0..3 = question index
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [showingQuestionDots, setShowingQuestionDots] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // ── Conversation log (for display) ─────────────────────────────────────
  type ChatEntry =
    | { type: 'yousha'; text: string }
    | { type: 'user'; text: string }
    | { type: 'options'; question: FabricQuestion; answered: boolean }
    | { type: 'category-select'; answered: boolean }
    | { type: 'dots' }
    | { type: 'results' };
  const [chatLog, setChatLog] = useState<ChatEntry[]>([]);

  // ── Results state ──────────────────────────────────────────────────────
  const [products, setProducts] = useState<AIFabricResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);

  // ── Free-chat state (for "other" category) ────────────────────────────
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatProducts, setChatProducts] = useState<AIFabricResult[]>([]);

  const [sessionId] = useState(getSessionId);

  // ── Typing effects for welcome/farewell ────────────────────────────────
  const line1 = useTypingEffect(WELCOME_LINE1, TYPING_SPEED, false);
  const line2 = useTypingEffect(WELCOME_LINE2, TYPING_SPEED_FAST, false);
  const line3 = useTypingEffect(WELCOME_LINE3, TYPING_SPEED, false);
  const farewellTyping = useTypingEffect(FAREWELL_TEXT, TYPING_SPEED_FAST, false);

  // ── Welcome typing chain ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'welcome-typing') return;
    if (showInitialDots) {
      const t = setTimeout(() => { setShowInitialDots(false); line1.start(); }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase, showInitialDots]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (line1.isDone && !line2.isDone) { const t = setTimeout(() => line2.start(), 300); return () => clearTimeout(t); }
  }, [line1.isDone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (line2.isDone && !line3.isDone) { const t = setTimeout(() => line3.start(), 300); return () => clearTimeout(t); }
  }, [line2.isDone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (line3.isDone && phase === 'welcome-typing') { const t = setTimeout(() => setPhase('welcome-ready'), 200); return () => clearTimeout(t); }
  }, [line3.isDone, phase]);

  // ── Farewell typing chain ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'farewell-typing') return;
    if (showFarewellDots) {
      const t = setTimeout(() => { setShowFarewellDots(false); farewellTyping.start(); }, 1000);
      return () => clearTimeout(t);
    }
  }, [phase, showFarewellDots]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (farewellTyping.isDone && phase === 'farewell-typing') { const t = setTimeout(() => setPhase('farewell-slide'), 1200); return () => clearTimeout(t); }
  }, [farewellTyping.isDone, phase]);

  useEffect(() => {
    if (phase !== 'farewell-slide') return;
    const t = setTimeout(() => setPhase('fab'), 900);
    return () => clearTimeout(t);
  }, [phase]);

  // ── Mount + initial welcome ────────────────────────────────────────────
  useEffect(() => {
    injectKeyframes();
    setMounted(true);
    if (isHomePage && !wasAlreadyWelcomed()) {
      const timer = setTimeout(() => setPhase('welcome-typing'), 600);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll chat ──────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, showingQuestionDots]);

  // ── Reset everything ──────────────────────────────────────────────────
  const fullReset = useCallback(() => {
    setCategory(null);
    setFabricQIndex(-1);
    setAnswers({});
    setChatLog([]);
    setProducts([]);
    setShowSidePanel(false);
    setLoadingResults(false);
    setShowingQuestionDots(false);
    setCustomInput('');
    setNavigatingTo(null);
    setChatMessages([]);
    setChatInput('');
    setChatLoading(false);
    setChatProducts([]);
  }, []);

  // ── Phase transitions ─────────────────────────────────────────────────

  const handleAcceptHelp = useCallback(() => {
    markWelcomed();
    fullReset();
    setPhase('panel');
    // Start with Yousha's first question after a brief delay
    setTimeout(() => {
      setChatLog([
        { type: 'yousha', text: 'Great! What are you looking for today? 😊' },
        { type: 'category-select', answered: false },
      ]);
    }, 400);
  }, [fullReset]);

  const handleDeclineHelp = useCallback(() => {
    markWelcomed();
    setShowFarewellDots(true);
    setPhase('farewell-typing');
  }, []);

  const openPanel = useCallback(() => {
    setPhase('panel');
    if (chatLog.length === 0) {
      setTimeout(() => {
        setChatLog([
          { type: 'yousha', text: 'Hi again! What are you looking for today? 😊' },
          { type: 'category-select', answered: false },
        ]);
      }, 400);
    }
  }, [chatLog.length]);

  const closePanel = useCallback(() => {
    setPhase('fab');
    setShowSidePanel(false);
  }, []);

  // ── Category selection ────────────────────────────────────────────────

  const handleCategorySelect = useCallback((cat: ShoppingCategory) => {
    const option = CATEGORY_OPTIONS.find((o) => o.value === cat);
    if (!option) return;

    setCategory(cat);
    // Mark category question as answered
    setChatLog((prev) =>
      prev.map((e) => (e.type === 'category-select' ? { ...e, answered: true } : e))
    );
    // Show user's answer
    setChatLog((prev) => [...prev, { type: 'user', text: `${option.emoji} ${option.label}` }]);

    if (option.navigateTo) {
      // Navigate to Foam / Cushions
      setChatLog((prev) => [...prev, { type: 'yousha', text: `Let me take you there! 🚀` }]);
      setNavigatingTo(option.navigateTo);
      setTimeout(() => {
        router.push(option.navigateTo!);
        setTimeout(() => setPhase('fab'), 1500);
      }, 1000);
      return;
    }

    if (cat === 'other') {
      // Free-text chat mode
      setChatLog((prev) => [...prev, { type: 'yousha', text: 'Sure! Tell me what you need and I\'ll help you find it.' }]);
      return;
    }

    // Fabric flow — start questions
    if (cat === 'fabric') {
      setShowingQuestionDots(true);
      setTimeout(() => {
        setShowingQuestionDots(false);
        setFabricQIndex(0);
        const q = FABRIC_QUESTIONS[0];
        setChatLog((prev) => [
          ...prev,
          { type: 'yousha', text: q.question },
          { type: 'options', question: q, answered: false },
        ]);
      }, 800);
    }
  }, [router]);

  // ── Fabric question answer ────────────────────────────────────────────

  const handleFabricAnswer = useCallback((questionId: string, value: string, displayLabel: string) => {
    // Save answer
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Mark options as answered
    setChatLog((prev) =>
      prev.map((e) =>
        e.type === 'options' && e.question.id === questionId
          ? { ...e, answered: true }
          : e
      )
    );
    // Show user's choice
    setChatLog((prev) => [...prev, { type: 'user', text: displayLabel }]);

    const nextIndex = fabricQIndex + 1;

    if (nextIndex < FABRIC_QUESTIONS.length) {
      // Next question with typing dots
      setShowingQuestionDots(true);
      setTimeout(() => {
        setShowingQuestionDots(false);
        setFabricQIndex(nextIndex);
        const q = FABRIC_QUESTIONS[nextIndex];
        setChatLog((prev) => [
          ...prev,
          { type: 'yousha', text: q.question },
          { type: 'options', question: q, answered: false },
        ]);
      }, 700);
    } else {
      // All questions answered — fetch results!
      fetchQuestionnaireResults(newAnswers);
    }
  }, [answers, fabricQIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Custom text answer for fabric questions ───────────────────────────

  const handleCustomAnswer = useCallback((questionId: string) => {
    const text = customInput.trim();
    if (!text) return;
    setCustomInput('');

    // For custom answers, we use the text as a keyword search
    const newAnswers = { ...answers };
    // Don't map to a predefined filter — add as keyword
    newAnswers[questionId] = ''; // Empty = skipped for chip mapping
    // We'll add keywords to the final filters
    const existingKeywords = newAnswers._keywords ? newAnswers._keywords + ',' + text : text;
    newAnswers._keywords = existingKeywords;
    setAnswers(newAnswers);

    // Mark as answered + show user bubble
    setChatLog((prev) =>
      prev.map((e) =>
        e.type === 'options' && e.question.id === questionId ? { ...e, answered: true } : e
      )
    );
    setChatLog((prev) => [...prev, { type: 'user', text: `✍️ ${text}` }]);

    const nextIndex = fabricQIndex + 1;
    if (nextIndex < FABRIC_QUESTIONS.length) {
      setShowingQuestionDots(true);
      setTimeout(() => {
        setShowingQuestionDots(false);
        setFabricQIndex(nextIndex);
        const q = FABRIC_QUESTIONS[nextIndex];
        setChatLog((prev) => [
          ...prev,
          { type: 'yousha', text: q.question },
          { type: 'options', question: q, answered: false },
        ]);
      }, 700);
    } else {
      fetchQuestionnaireResults(newAnswers);
    }
  }, [customInput, answers, fabricQIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch results from API ────────────────────────────────────────────

  const fetchQuestionnaireResults = useCallback(async (finalAnswers: QuestionnaireAnswers) => {
    setLoadingResults(true);
    setShowingQuestionDots(true);
    setChatLog((prev) => [...prev, { type: 'yousha', text: 'Let me find the perfect fabrics for you... ✨' }]);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'questionnaire', answers: finalAnswers, sessionId }),
      });
      const data: AIGuideResponse = await res.json();

      setShowingQuestionDots(false);
      setProducts(data.products ?? []);

      setChatLog((prev) => [
        ...prev,
        { type: 'yousha', text: data.message },
        ...(data.products && data.products.length > 0 ? [{ type: 'results' as const }] : []),
      ]);

      if (data.products && data.products.length > 0) {
        setTimeout(() => setShowSidePanel(true), 300);
      }
    } catch {
      setShowingQuestionDots(false);
      setChatLog((prev) => [
        ...prev,
        { type: 'yousha', text: "Something went wrong — you can still browse fabrics normally." },
      ]);
    } finally {
      setLoadingResults(false);
    }
  }, [sessionId]);

  // ── Free-text chat (for "other" category) ─────────────────────────────

  const sendFreeChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');

    const userMsg: AIChatMessage = { role: 'user', content: text };
    const nextHistory = [...chatMessages, userMsg];
    setChatMessages(nextHistory);
    setChatLog((prev) => [...prev, { type: 'user', text }]);
    setChatLoading(true);
    setShowingQuestionDots(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'chat', history: nextHistory, sessionId }),
      });
      const data: AIGuideResponse = await res.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      setChatLog((prev) => [...prev, { type: 'yousha', text: data.message }]);

      if (data.products && data.products.length > 0) {
        setChatProducts(data.products);
        setProducts(data.products);
        setChatLog((prev) => [...prev, { type: 'results' }]);
        setTimeout(() => setShowSidePanel(true), 300);
      }
    } catch {
      setChatLog((prev) => [
        ...prev,
        { type: 'yousha', text: "Something went wrong — you can still browse fabrics normally." },
      ]);
    } finally {
      setChatLoading(false);
      setShowingQuestionDots(false);
    }
  }, [chatInput, chatLoading, chatMessages, sessionId]);

  if (!mounted) return null;

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Welcome / Farewell modal
  // ═══════════════════════════════════════════════════════════════════════

  const isWelcomePhase = phase === 'welcome-typing' || phase === 'welcome-ready';
  const isFarewellPhase = phase === 'farewell-typing' || phase === 'farewell-slide';

  if (isWelcomePhase || isFarewellPhase) {
    return (
      <>
        <Backdrop
          open
          sx={{
            zIndex: 1400, bgcolor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            transition: 'opacity 0.4s ease',
            opacity: phase === 'farewell-slide' ? 0 : 1,
          }}
          onClick={isWelcomePhase ? handleDeclineHelp : undefined}
        />
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 1401, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, pointerEvents: 'none' }}>
          <Paper
            elevation={24}
            sx={{
              pointerEvents: 'auto', maxWidth: 460, width: '100%', borderRadius: 4, overflow: 'hidden',
              animation: phase === 'farewell-slide'
                ? 'yousha-slide-to-corner 0.85s cubic-bezier(0.4,0,0.2,1) forwards'
                : 'yousha-fade-in 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
              background: 'linear-gradient(160deg, #1a1714 0%, #0d0b09 100%)',
              border: '1px solid rgba(227,194,154,0.2)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(227,194,154,0.08)',
            }}
          >
            <Box sx={{ height: 3, background: 'linear-gradient(90deg, transparent, #e3c29a, transparent)' }} />
            <Box sx={{ px: { xs: 3, sm: 4 }, pt: 4, pb: 3.5, textAlign: 'center' }}>
              {/* Avatar */}
              <Box sx={{ width: 100, height: 100, borderRadius: '50%', mx: 'auto', mb: 2.5, position: 'relative', animation: 'yousha-pulse-ring 2.5s ease-out infinite' }}>
                <Box sx={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '3px solid #e3c29a', boxShadow: '0 0 30px rgba(227,194,154,0.25)' }}>
                  <img src="/images/yousha-avatar.png" alt="Yousha" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              </Box>

              {/* Welcome typing */}
              {isWelcomePhase && (
                <>
                  {showInitialDots && <TypingDots />}
                  {!showInitialDots && (
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' }, minHeight: '1.8em' }}>
                      {line1.displayed.split("Yousha").map((part, i, arr) => (
                        <span key={i}>{part}{i < arr.length - 1 && <Box component="span" sx={{ color: '#e3c29a' }}>Yousha</Box>}</span>
                      ))}
                      {!line1.isDone && <BlinkingCursor />}
                    </Typography>
                  )}
                  {line1.isDone && (
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.65)', mb: line2.isDone ? 2 : 0, fontSize: { xs: '0.9rem', sm: '1rem' }, lineHeight: 1.6, minHeight: '3.2em' }}>
                      {line2.displayed}{!line2.isDone && <BlinkingCursor />}
                    </Typography>
                  )}
                  {line2.isDone && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: line3.isDone ? 3 : 0, fontStyle: 'italic', minHeight: '1.5em' }}>
                      {line3.displayed}{!line3.isDone && <BlinkingCursor />}
                    </Typography>
                  )}
                  {phase === 'welcome-ready' && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ animation: 'yousha-buttons-appear 0.4s ease-out forwards' }}>
                      <Button variant="contained" onClick={handleAcceptHelp}
                        sx={{ bgcolor: '#e3c29a', color: '#0d0b09', fontWeight: 700, px: 4, py: 1.3, borderRadius: 2.5, fontSize: '0.95rem', textTransform: 'none', boxShadow: '0 4px 20px rgba(227,194,154,0.3)', '&:hover': { bgcolor: '#d4b087', boxShadow: '0 6px 28px rgba(227,194,154,0.4)' } }}>
                        Yes, help me! ✨
                      </Button>
                      <Button variant="outlined" onClick={handleDeclineHelp}
                        sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.15)', fontWeight: 500, px: 3, py: 1.3, borderRadius: 2.5, fontSize: '0.9rem', textTransform: 'none', '&:hover': { borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.85)', bgcolor: 'rgba(255,255,255,0.04)' } }}>
                        I&apos;ll browse on my own
                      </Button>
                    </Stack>
                  )}
                </>
              )}

              {/* Farewell typing */}
              {isFarewellPhase && (
                <>
                  {showFarewellDots && <TypingDots />}
                  {!showFarewellDots && (
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, minHeight: '3em' }}>
                      {farewellTyping.displayed}{!farewellTyping.isDone && <BlinkingCursor />}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: FAB
  // ═══════════════════════════════════════════════════════════════════════

  if (phase === 'fab') {
    return (
      <Box onClick={openPanel} sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300, cursor: 'pointer', animation: 'yousha-fab-entrance 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}>
        <Box sx={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #e3c29a', boxShadow: '0 4px 24px rgba(227,194,154,0.3), 0 2px 8px rgba(0,0,0,0.3)', transition: 'transform 0.25s ease, box-shadow 0.25s ease', '&:hover': { transform: 'scale(1.1)', boxShadow: '0 6px 32px rgba(227,194,154,0.45), 0 4px 12px rgba(0,0,0,0.4)' } }}>
          <img src="/images/yousha-avatar.png" alt="Chat with Yousha" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
        <Box sx={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', bgcolor: '#e3c29a', color: '#0d0b09', fontSize: '0.6rem', fontWeight: 700, px: 0.8, py: 0.15, borderRadius: 1, whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
          Yousha
        </Box>
      </Box>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Chat Panel (+ Side Panel for results)
  // ═══════════════════════════════════════════════════════════════════════

  const panelWidth = showSidePanel ? PANEL_EXPANDED_WIDTH : PANEL_WIDTH;
  const isChatMode = category === 'other';

  return (
    <>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 96, right: 24,
          width: panelWidth,
          maxWidth: 'calc(100vw - 32px)',
          height: 560,
          maxHeight: 'calc(100vh - 140px)',
          display: 'flex', flexDirection: 'row',
          borderRadius: 3, overflow: 'hidden', zIndex: 1300,
          animation: 'yousha-fade-in 0.3s ease-out forwards',
          border: '1px solid rgba(227,194,154,0.15)',
          transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* ── LEFT: Chat Column ──────────────────────────────────────── */}
        <Box sx={{ width: showSidePanel ? PANEL_WIDTH : '100%', display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'width 0.4s ease' }}>
          {/* Header */}
          <Box sx={{ px: 2, py: 1.5, background: 'linear-gradient(135deg, #1a1714, #0d0b09)', color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <IconButton size="small" onClick={() => { fullReset(); openPanel(); }} sx={{ color: 'inherit' }} aria-label="Start over">
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #e3c29a', flexShrink: 0 }}>
              <img src="/images/yousha-avatar.png" alt="Yousha" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Yousha</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>Your shopping assistant</Typography>
            </Box>
            {showSidePanel && (
              <Badge badgeContent={products.length} color="warning" sx={{ mr: 1 }}>
                <Typography variant="caption" sx={{ color: '#e3c29a', fontSize: '0.7rem' }}>Results</Typography>
              </Badge>
            )}
            <IconButton size="small" onClick={closePanel} sx={{ color: 'inherit' }} aria-label="Minimize">
              <KeyboardArrowDownIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => { fullReset(); closePanel(); }} sx={{ color: 'inherit' }} aria-label="Close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Chat body */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {chatLog.map((entry, idx) => {
              if (entry.type === 'yousha') {
                return (
                  <YoushaBubble key={idx} animate>
                    <Typography variant="body2">{entry.text}</Typography>
                  </YoushaBubble>
                );
              }
              if (entry.type === 'user') {
                return <UserBubble key={idx} text={entry.text} />;
              }
              if (entry.type === 'category-select' && !entry.answered) {
                return (
                  <Box key={idx} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, animation: 'yousha-buttons-appear 0.3s ease-out forwards' }}>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <Chip
                        key={opt.value}
                        label={`${opt.emoji} ${opt.label}`}
                        onClick={() => handleCategorySelect(opt.value)}
                        clickable
                        sx={{
                          fontWeight: 500,
                          '&:hover': { bgcolor: 'rgba(227,194,154,0.15)', borderColor: '#e3c29a' },
                        }}
                      />
                    ))}
                  </Box>
                );
              }
              if (entry.type === 'options' && !entry.answered) {
                const q = entry.question;
                return (
                  <Box key={idx} sx={{ animation: 'yousha-buttons-appear 0.3s ease-out forwards' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7, mb: 1 }}>
                      {q.options.map((opt) => (
                        <Chip
                          key={opt.value}
                          label={opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label}
                          onClick={() => handleFabricAnswer(q.id, opt.value, opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label)}
                          clickable
                          size="small"
                          sx={{ fontWeight: 500, '&:hover': { bgcolor: 'rgba(227,194,154,0.15)', borderColor: '#e3c29a' } }}
                        />
                      ))}
                      {q.allowSkip && (
                        <Chip
                          label={`❌ ${q.skipLabel}`}
                          onClick={() => handleFabricAnswer(q.id, '', q.skipLabel!)}
                          clickable
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 400, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
                        />
                      )}
                    </Box>
                    {/* Open answer input */}
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Or tell me..."
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCustomAnswer(q.id); }}
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleCustomAnswer(q.id)}
                        disabled={!customInput.trim()}
                        sx={{ color: '#e3c29a' }}
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                );
              }
              if (entry.type === 'results' && products.length > 0 && !showSidePanel) {
                return (
                  <Box key={idx} sx={{ animation: 'yousha-fade-in 0.3s ease-out forwards' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setShowSidePanel(true)}
                      sx={{
                        borderColor: '#e3c29a', color: '#e3c29a',
                        textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                        '&:hover': { bgcolor: 'rgba(227,194,154,0.08)', borderColor: '#d4b087' },
                      }}
                    >
                      View {products.length} fabric{products.length !== 1 ? 's' : ''} →
                    </Button>
                  </Box>
                );
              }
              return null;
            })}

            {/* Typing dots */}
            {showingQuestionDots && (
              <Box sx={{ alignSelf: 'flex-start' }}>
                <YoushaBubble><TypingDots /></YoushaBubble>
              </Box>
            )}

            <div ref={chatEndRef} />
          </Box>

          {/* Free-chat input (for "other" category) */}
          {isChatMode && (
            <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, flexShrink: 0 }}>
              <TextField
                fullWidth size="small"
                placeholder="Tell Yousha what you need…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendFreeChat(); }}
                disabled={chatLoading}
              />
              <IconButton color="primary" onClick={sendFreeChat} disabled={chatLoading || !chatInput.trim()} aria-label="Send">
                <SendIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* ── RIGHT: Results Side Panel ───────────────────────────────── */}
        {showSidePanel && products.length > 0 && (
          <>
            <Divider orientation="vertical" flexItem />
            <Box
              sx={{
                width: PANEL_EXPANDED_WIDTH - PANEL_WIDTH,
                display: 'flex', flexDirection: 'column',
                animation: 'yousha-slide-in-right 0.35s ease-out forwards',
                bgcolor: '#faf8f5',
                position: 'relative',
              }}
            >
              {(chatLoading || loadingResults) && (
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(250,248,245,0.6)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(1px)', borderRadius: 2 }}>
                  <CircularProgress size={32} sx={{ color: '#e3c29a' }} />
                </Box>
              )}

              {/* Side panel header */}
              <Box sx={{ px: 2, py: 1.2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1, color: '#1a1714' }}>
                  Yousha&apos;s Picks
                </Typography>
                <Badge badgeContent={products.length} color="warning" sx={{ mr: 1 }} />
                <IconButton size="small" onClick={() => setShowSidePanel(false)} aria-label="Close results">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Fabric cards */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {products.map((p) => (
                  <Paper
                    key={p.id}
                    variant="outlined"
                    onClick={() => router.push(`/fabrics/${p.id}`)}
                    sx={{
                      p: 1, display: 'flex', gap: 1.5, alignItems: 'center',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: 'rgba(227,194,154,0.08)', transform: 'translateX(2px)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      width={56} height={56}
                      style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {p.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {p.pricePerYard != null ? `$${p.pricePerYard.toFixed(2)}/yd` : 'See details'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.3, mt: 0.3, flexWrap: 'wrap' }}>
                        {p.color.slice(0, 2).map((c) => (
                          <Chip key={c} label={c.split('-')[0]} size="small"
                            sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(227,194,154,0.12)' }}
                          />
                        ))}
                      </Box>
                    </Box>
                    <OpenInNewIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
                  </Paper>
                ))}
              </Box>

              {/* Browse all link */}
              <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                <Button
                  component={Link}
                  href="/fabrics"
                  fullWidth size="small" variant="outlined"
                  sx={{
                    textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                    borderColor: '#e3c29a', color: '#1a1714',
                    '&:hover': { bgcolor: 'rgba(227,194,154,0.1)', borderColor: '#d4b087' },
                  }}
                >
                  Browse all fabrics →
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Paper>

      {/* Minimize FAB */}
      <Fab
        onClick={closePanel}
        sx={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
          width: 52, height: 52, bgcolor: '#1a1714',
          border: '2px solid #e3c29a', '&:hover': { bgcolor: '#2a2520' },
        }}
        aria-label="Minimize Yousha"
      >
        <KeyboardArrowDownIcon sx={{ color: '#e3c29a' }} />
      </Fab>
    </>
  );
}
