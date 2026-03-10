'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { executeSkaryaAction } from '@/app/actions';
import { Brain, Sparkles, Send, CheckCircle2, XCircle, Bot, User, Loader2, AlertCircle, ChevronDown, History, MessageSquare, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Hardcoded for demo/staging testing against pulse.karyaa.ai
const TEST_USER = {
  workspaceId: '69a202afcf1d73e568280529',
  boardId: '69a2118ecf1d73e568280ba5',
  userEmail: 'pranav.patil@nikqik.com',
  userName: 'Pranav Patil'
};

const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash' }
];

export default function PulsePage() {
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [showHistory, setShowHistory] = useState(false);
  const [pastChats, setPastChats] = useState<any[]>([]);
  const [chatId, setChatId] = useState<string>('');

  useEffect(() => {
    // Initialize a new chat session ID on mount
    setChatId(uuidv4());
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch(`/api/chats?userEmail=${TEST_USER.userEmail}&workspaceId=${TEST_USER.workspaceId}`);
      const data = await res.json();
      if (data.success) {
        setPastChats(data.sessions);
        setShowHistory(true);
      }
    } catch (e) { console.error('Failed to fetch chats', e); }
  };

  const loadChat = async (id: string) => {
    try {
      const res = await fetch(`/api/chats/${id}`);
      const data = await res.json();
      if (data.success) {
        setChatId(id);
        setMessages(data.messages || []);
        setShowHistory(false);
      }
    } catch (e) { console.error('Failed to load chat', e); }
  };

  const startNewChat = () => {
    setChatId(uuidv4());
    setMessages([]);
  };

  const [localInput, setLocalInput] = useState('');

  const {
    messages,
    status,
    error,
    append,
    setMessages,
    addToolResult
  } = useChat({
    api: '/api/chat',
    body: {
      workspaceId: TEST_USER.workspaceId,
      boardId: TEST_USER.boardId,
      userEmail: TEST_USER.userEmail,
      modelId: selectedModel,
      chatId: chatId
    },
    maxSteps: 7, // Matches agent-engine for multi-step reasoning
  } as any) as any;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!localInput?.trim() || isLoading) return;

    if (append) {
      append({ role: 'user', content: localInput });
    }
    setLocalInput('');
  };

  // ─── UI State For Enhanced Rendering ───────────────────────────────────
  const [toolConfirmations, setToolConfirmations] = useState<Record<string, boolean>>({});
  const [activeDocument, setActiveDocument] = useState<{ title: string; content: string } | null>(null);

  return (
    <main className="h-screen bg-[#FAFAFC] flex flex-col font-sans overflow-hidden selection:bg-indigo-200">

      {/* Premium Header */}
      <header className="flex-shrink-0 w-full bg-transparent backdrop-blur-xl border-none border-indigo-100/50 py-2 px-8 flex items-center justify-between z-20 sticky top-0 ">
        <div className="flex items-center gap-3">
          <div className=" flex items-center justify-center bg-white">
            <img src="/sample-logo.png" alt="Skarya Pulse Logo" className="w-8 h-8 object-contain " />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900 tracking-tight leading-none bg-[length:200%_auto] animate-gradient">
              Skarya Pulse
            </h1>
            <span className="text-[10px] font-semibold tracking-widest text-indigo-400 uppercase mt-1">Autonomous Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group/model">
            <select
              title="Select Model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none bg-white/50 border border-indigo-100 hover:border-indigo-300 px-4 py-2 pr-10 rounded-full shadow-sm text-xs font-semibold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer inline-block"
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 bg-white/50 border border-indigo-50 px-4 py-2 rounded-full shadow-sm hover:bg-white transition-all cursor-pointer text-slate-600 hover:text-indigo-600" onClick={startNewChat} title="New Chat">
            <Plus className="w-4 h-4" />
            <span className="text-xs font-semibold hidden md:inline">New</span>
          </div>

          <div className="flex items-center gap-2 bg-white/50 border border-indigo-50 px-4 py-2 rounded-full shadow-sm hover:bg-white transition-all cursor-pointer text-slate-600 hover:text-indigo-600" onClick={fetchChats}>
            <History className="w-4 h-4" />
            <span className="text-xs font-semibold">History</span>
          </div>

          <div className="flex items-center gap-2 bg-white/50 border border-indigo-50 px-4 py-2 rounded-full shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-600 truncate max-w-[100px]">{TEST_USER.userName}</span>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="relative flex-1 w-full overflow-hidden flex justify-center">
        {/* Decorative Background Orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-300/20 blur-[100px] animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-300/20 blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-pink-300/20 blur-[120px] animate-blob animation-delay-4000"></div>
        </div>

        <div className="w-full max-w-4xl h-full flex flex-col relative z-10">
          <div className="flex-1 overflow-y-auto px-4 py-8 pb-40 scroll-smooth custom-scrollbar">

            {/* Error Banner */}
            {error && (
              <div className="mb-6 mx-auto max-w-2xl bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs font-semibold">
                  <span className="font-bold">Protocol Error:</span> {error.message || 'AI service returned invalid format.'}
                  <button onClick={() => window.location.reload()} className="ml-3 underline hover:text-red-900 transition-colors">Retry</button>
                </div>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight">Meet <span className="text-indigo-600">Pulse.</span></h2>
                  <p className="text-slate-500 text-lg leading-relaxed font-medium">Your autonomous AI PM inspired by ClickUp Brain.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button onClick={() => setLocalInput("Start my daily standup.")} className="col-span-2 p-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl text-left transform active:scale-[0.98] transition-all">
                    <span className="font-bold block text-sm mb-1 uppercase tracking-tight">🚀 Start Daily Standup</span>
                    <span className="text-white/80 text-xs font-medium">Auto-sync your progress, blockers, and update board tasks.</span>
                  </button>

                  <button onClick={() => setLocalInput("Analyze board health and identify stuck tasks")} className="p-4 bg-white/80 backdrop-blur-md border border-indigo-50 rounded-2xl hover:bg-white hover:border-indigo-200 transition-all text-left group">
                    <span className="font-bold text-indigo-600 block text-[11px] mb-1 uppercase tracking-wider group-hover:text-indigo-700">🩺 Board Health</span>
                    <span className="text-slate-500 text-[10px] leading-tight">Identify bottlenecks, idle tasks, and overdue items.</span>
                  </button>

                  <button onClick={() => setLocalInput("Draft a daily digest for the team")} className="p-4 bg-white/80 backdrop-blur-md border border-purple-50 rounded-2xl hover:bg-white hover:border-purple-200 transition-all text-left group">
                    <span className="font-bold text-purple-600 block text-[11px] mb-1 uppercase tracking-wider group-hover:text-purple-700">📄 Daily Digest</span>
                    <span className="text-slate-500 text-[10px] leading-tight">Generate a structured executive summary of today's work.</span>
                  </button>

                  <button onClick={() => setLocalInput("Show me the current sprint metrics and summary")} className="p-4 bg-white/80 backdrop-blur-md border border-emerald-50 rounded-2xl hover:bg-white hover:border-emerald-200 transition-all text-left group">
                    <span className="font-bold text-emerald-600 block text-[11px] mb-1 uppercase tracking-wider group-hover:text-emerald-700">📊 Sprint Metrics</span>
                    <span className="text-slate-500 text-[10px] leading-tight">Deep dive into velocity, carryover, and completion rates.</span>
                  </button>

                  <button onClick={() => setLocalInput("Identify tasks at risk of missing their deadlines")} className="p-4 bg-white/80 backdrop-blur-md border border-amber-50 rounded-2xl hover:bg-white hover:border-amber-200 transition-all text-left group">
                    <span className="font-bold text-amber-600 block text-[11px] mb-1 uppercase tracking-wider group-hover:text-amber-700">⚠️ Risk Radar</span>
                    <span className="text-slate-500 text-[10px] leading-tight">Predictive analysis on tasks likely to miss deadlines.</span>
                  </button>

                  <button onClick={() => setLocalInput("Auto-generate subtasks for my most complex task")} className="p-4 bg-white/80 backdrop-blur-md border border-rose-50 rounded-2xl hover:bg-white hover:border-rose-200 transition-all text-left group">
                    <span className="font-bold text-rose-600 block text-[11px] mb-1 uppercase tracking-wider group-hover:text-rose-700">🛠️ Subtask Architect</span>
                    <span className="text-slate-500 text-[10px] leading-tight">Break down high-level tasks into actionable sub-items.</span>
                  </button>

                  <button onClick={() => setLocalInput("Check my standup history for any inconsistencies")} className="p-4 bg-white/80 backdrop-blur-md border border-sky-50 rounded-2xl hover:bg-white hover:border-sky-200 transition-all text-left group">
                    <span className="font-bold text-sky-600 block text-[11px] mb-1 uppercase tracking-wider group-hover:text-sky-700">🔍 Alignment Audit</span>
                    <span className="text-slate-500 text-[10px] leading-tight">Verify past standups vs actual task updates for parity.</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {messages.map((msg: any, idx: number) => (
                <div key={idx} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md mb-1">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.content && (
                      <div className={`px-5 py-4 text-[15px] font-medium leading-relaxed relative ${msg.role === 'user'
                        ? 'bg-indigo-600 text-white shadow-md rounded-[24px] rounded-br-[8px]'
                        : 'bg-white/80 backdrop-blur-md border border-white shadow-sm text-slate-800 rounded-[24px] rounded-bl-[8px]'
                        }`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    )}

                    {msg.toolInvocations?.map((toolInvocation: any) => {
                      const { toolCallId, toolName, args, result } = toolInvocation;

                      // 1. CONFIRMATION UI FOR MUTATIONS
                      if (!result) {
                        const isMutation = [
                          'create_task', 'update_task_status', 'add_task_comment', 'create_subtask',
                          'draft_document', 'update_task_priority', 'set_task_dates', 'assign_task'
                        ].includes(toolName);

                        if (isMutation) {
                          return (
                            <div key={toolCallId} className="w-full mt-3 bg-white border border-indigo-100 rounded-2xl shadow-xl overflow-hidden">
                              <div className="bg-indigo-50 px-4 py-2.5 border-b border-indigo-100 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider">Action: {toolName.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="p-4">
                                <pre className="text-[10px] font-mono bg-slate-50 p-3 rounded-lg text-slate-600 mb-4 max-h-32 overflow-y-auto">
                                  {JSON.stringify(args, null, 2)}
                                </pre>
                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      const res = await executeSkaryaAction(toolName, { ...args, _authMeta: TEST_USER });
                                      addToolResult({ toolCallId, result: res } as any);
                                      if (toolName === 'draft_document' && res.success) {
                                        setActiveDocument({ title: args.title, content: args.content });
                                      }
                                    }}
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700"
                                  > Confirm </button>
                                  <button
                                    onClick={() => addToolResult({ toolCallId, result: { success: false, error: 'Cancelled' } } as any)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
                                  > Cancel </button>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={toolCallId} className="flex items-center gap-2 mt-3 text-indigo-500 text-xs font-bold animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" /> {toolName.replace(/_/g, ' ')}...
                          </div>
                        );
                      }

                      // 2. ANALYTICS / READ RENDERING
                      if (result && result.success) {
                        return (
                          <div key={toolCallId} className="w-full mt-2">
                            {/* Special visualizer for Board Health */}
                            {toolName === 'get_board_health' && (
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="bg-red-50 p-2 rounded-xl border border-red-100">
                                  <div className="text-[9px] font-black text-red-600 uppercase">Overdue</div>
                                  <div className="text-xl font-black text-red-700">{result.health?.overdue?.length || 0}</div>
                                </div>
                                <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                                  <div className="text-[9px] font-black text-amber-600 uppercase">Stuck/Inactive</div>
                                  <div className="text-xl font-black text-amber-700">{result.health?.stuck?.length || 0}</div>
                                </div>
                              </div>
                            )}
                            {/* Document Preview */}
                            {toolName === 'draft_document' && (
                              <button
                                onClick={() => setActiveDocument({ title: args.title, content: args.content })}
                                className="w-full bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100 flex items-center justify-between hover:bg-emerald-100 transition-colors"
                              >
                                <span className="text-[11px] font-bold">📄 VIEW DOCUMENT: {args.title}</span>
                                <Sparkles className="w-4 h-4" />
                              </button>
                            )}
                            <div className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">✓ {toolName} Computed</div>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner mb-1">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} className="h-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="flex-shrink-0 p-6 bg-transparent sticky bottom-0 z-30">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-center bg-white border border-indigo-100 rounded-2xl shadow-lg focus-within:ring-2 ring-indigo-500/20 overflow-hidden px-4">
          <input
            type="text"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            disabled={isLoading}
            placeholder="Talk to Pulse..."
            className="flex-1 py-5 text-sm font-medium bg-transparent focus:outline-none text-slate-800 disabled:opacity-50"
          />
          <button type="submit" disabled={!localInput?.trim() || isLoading} className="p-2 bg-indigo-600 text-white rounded-xl active:scale-95 transition-all">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Document Modal */}
      {activeDocument && (
        <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-white overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{activeDocument.title}</h2>
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Autonomous Generated Document</span>
              </div>
              <button onClick={() => setActiveDocument(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <XCircle className="w-8 h-8 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 p-12 overflow-y-auto prose prose-indigo max-w-none prose-sm font-medium text-slate-700">
              <div className="whitespace-pre-wrap font-sans text-lg leading-relaxed">
                {activeDocument.content}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => window.print()} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Print to PDF</button>
              <button onClick={() => setActiveDocument(null)} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Past Chats Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Chat History
              </h2>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {pastChats.length === 0 ? (
                <div className="text-center text-slate-500 py-10">No chat history recorded yet.</div>
              ) : (
                pastChats.map((chat: any, i) => (
                  <button key={i} onClick={() => loadChat(chat.chatId)} className="w-full text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden transition-all hover:border-indigo-300 hover:shadow-md group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {new Date(chat.createdAt).toLocaleDateString()} at {new Date(chat.createdAt).toLocaleTimeString()}
                    </div>
                    <div>
                      <span className="font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors">{chat.title}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
