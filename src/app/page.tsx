'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { executeSkaryaAction } from '@/app/actions';
import { Brain, Sparkles, Send, CheckCircle2, XCircle, Bot, User, Loader2, AlertCircle, ChevronDown, History } from 'lucide-react';

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
  const [showStandups, setShowStandups] = useState(false);
  const [pastStandups, setPastStandups] = useState([]);

  const fetchStandups = async () => {
    try {
      const res = await fetch(`/api/standups?userEmail=${TEST_USER.userEmail}&boardId=${TEST_USER.boardId}`);
      const data = await res.json();
      if (data.success) {
        setPastStandups(data.standups);
        setShowStandups(true);
      }
    } catch(e) { console.error('Failed to fetch standups', e); }
  };

  const [localInput, setLocalInput] = useState('');
  
  const { 
    messages, 
    status, 
    error, 
    append, 
    addToolResult 
  } = useChat({
    api: '/api/chat',
    body: {
      workspaceId: TEST_USER.workspaceId,
      boardId: TEST_USER.boardId,
      userEmail: TEST_USER.userEmail,
      modelId: selectedModel
    },
    maxSteps: 3,
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
    
    // Support either append or sendMessage depending on version
    if (append) {
      append({ role: 'user', content: localInput }, { 
        body: { 
          workspaceId: TEST_USER.workspaceId, 
          boardId: TEST_USER.boardId, 
          userEmail: TEST_USER.userEmail, 
          modelId: selectedModel 
        } 
      });
    }
    setLocalInput('');
  };

  // Handle client-side manual tool confirmations
  const [toolConfirmations, setToolConfirmations] = useState<Record<string, boolean>>({});

  return (
    <main className="h-screen bg-[#FAFAFC] flex flex-col font-sans overflow-hidden selection:bg-indigo-200">
      
      {/* Premium Header */}
      <header className="flex-shrink-0 w-full bg-white/70 backdrop-blur-xl border-b border-indigo-100/50 py-4 px-8 flex items-center justify-between z-20 sticky top-0 shadow-[0_4px_24px_-12px_rgba(79,70,229,0.15)]">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-2.5 rounded-2xl shadow-[0_4px_12px_-4px_rgba(99,102,241,0.5)]">
            <Brain className="w-5 h-5 text-white animate-pulse duration-[3000ms]" />
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

          <div className="flex items-center gap-2 bg-white/50 border border-indigo-50 px-4 py-2 rounded-full shadow-sm hover:bg-white transition-all cursor-pointer text-slate-600 hover:text-indigo-600" onClick={fetchStandups}>
            <History className="w-4 h-4" />
            <span className="text-xs font-semibold">History</span>
          </div>

          <div className="flex items-center gap-2 bg-white/50 border border-indigo-50 px-4 py-2 rounded-full shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-600">{TEST_USER.userName}</span>
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
              <div className="mb-6 mx-auto max-w-2xl bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-4 duration-500">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs font-semibold">
                  <span className="font-bold">Protocol Error:</span> {error.message || 'The AI service returned an invalid response format.'}
                  <button onClick={() => window.location.reload()} className="ml-3 underline hover:text-red-900 transition-colors">Retry</button>
                </div>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-8 animate-in slide-in-from-bottom-6 fade-in duration-700">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="bg-white/90 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] shadow-xl relative z-10 transform group-hover:-translate-y-2 transition-transform duration-500">
                    <Sparkles className="w-14 h-14 text-indigo-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight">Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Pulse.</span></h2>
                  <p className="text-slate-500 text-lg leading-relaxed font-medium">
                    Your autonomous PM. I read your tasks, analyze bottlenecks, and keep the team strictly aligned.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full mt-8">
                  <button onClick={() => setLocalInput("Start my daily standup.")} className="col-span-2 group text-left p-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg transition-all duration-300">
                    <span className="font-bold block mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-white animate-pulse" /> Start Daily Standup
                    </span>
                    <span className="text-white/90 text-sm font-medium leading-relaxed">Let Skarya Pulse ask about your progress, blockers, and update your tasks for you.</span>
                  </button>
                  <button onClick={() => setLocalInput("Analyze the board health and find stuck tasks")} className="group text-left p-5 bg-white/60 backdrop-blur-lg border border-indigo-50 rounded-2xl hover:border-indigo-200 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300">
                    <span className="font-bold text-indigo-600 block mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                       <Brain className="w-4 h-4" /> Analyze Health
                    </span>
                    <span className="text-slate-600 text-sm font-medium leading-relaxed group-hover:text-slate-900">Scan entire board for bottlenecks & overdues.</span>
                  </button>
                  <button onClick={() => setLocalInput("Draft a status report for my work today")} className="group text-left p-5 bg-white/60 backdrop-blur-lg border border-purple-50 rounded-2xl hover:border-purple-200 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300">
                    <span className="font-bold text-purple-600 block mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Generate Report
                    </span>
                    <span className="text-slate-600 text-sm font-medium leading-relaxed group-hover:text-slate-900">Compile an executive summary of progress.</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {messages.map((msg: any, idx) => (
                <div key={idx} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {/* Bot Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-[14px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md mb-1 z-10">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {/* Text Bubble */}
                    {msg.content && (
                      <div
                        className={`px-5 py-4 text-[15px] font-medium leading-relaxed relative ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md rounded-[24px] rounded-br-[8px]'
                            : 'bg-white/80 backdrop-blur-md border border-white shadow-sm text-slate-800 rounded-[24px] rounded-bl-[8px]'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    )}

                    {/* Tool Invocations */}
                    {msg.toolInvocations?.map((toolInvocation: any) => {
                      const { toolCallId, toolName, args } = toolInvocation;

                      // 1. Tool Call Pending/Confirm
                      if (!('result' in toolInvocation)) {
                        if (['create_task', 'update_task_status', 'add_task_comment', 'create_subtask', 'draft_document'].includes(toolName)) {
                          return (
                            <div key={toolCallId} className="w-full mt-3 bg-white/90 backdrop-blur-xl border border-indigo-100 rounded-2xl shadow-lg shadow-indigo-500/5 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                              <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-3.5 border-b border-indigo-100/50">
                                <AlertCircle className="w-5 h-5 text-indigo-600" />
                                <span className="font-bold text-indigo-900 text-sm tracking-wide">Action Required: {toolName.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="p-5">
                                <div className="bg-slate-50/50 rounded-xl p-4 mb-5 border border-slate-100 shadow-inner">
                                  <pre className="text-xs font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(args, null, 2)}
                                  </pre>
                                </div>
                                
                                {toolConfirmations[toolCallId] ? (
                                  <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl text-sm font-bold border border-emerald-100">
                                    <CheckCircle2 className="w-5 h-5" /> Executed Successfully
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={async () => {
                                        try {
                                           const enrichedArgs = { 
                                             ...args, 
                                             _authMeta: { 
                                               userEmail: TEST_USER.userEmail, 
                                               workspaceId: TEST_USER.workspaceId, 
                                               boardId: TEST_USER.boardId 
                                             } 
                                           };
                                           const res = await executeSkaryaAction(toolName, enrichedArgs);
                                           setToolConfirmations(prev => ({...prev, [toolCallId]: true}));
                                           addToolResult({ toolCallId, result: res } as any);
                                        } catch (e: any) {
                                           addToolResult({ toolCallId, result: { success: false, error: e.message } } as any);
                                        }
                                      }}
                                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                                    >
                                      <CheckCircle2 className="w-4 h-4" /> Authorize & Send
                                    </button>
                                    <button
                                      onClick={() => addToolResult({ toolCallId, result: { success: false, error: 'User cancelled.' } } as any)}
                                      className="flex justify-center items-center w-12 h-12 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-red-500 transition-colors"
                                    >
                                      <XCircle className="w-5 h-5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={toolCallId} className="flex items-center gap-3 mt-3 ml-2 text-indigo-600 text-sm font-semibold animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {toolName.replace(/_/g, ' ')}...
                          </div>
                        );
                      }

                      // 2. Tool Concluded (System Notification)
                      return (
                        <div key={toolCallId} className="flex items-center gap-2 mt-2 ml-2 text-emerald-600 text-[12px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {toolName.replace(/_/g, ' ')} Computed
                        </div>
                      );
                    })}
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-[14px] bg-slate-200 border border-slate-300 flex items-center justify-center shadow-inner mb-1">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && messages.length > 0 && messages[messages.length - 1].role !== 'assistant' && (
                 <div className="flex items-end gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="flex-shrink-0 w-9 h-9 rounded-[14px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md mb-1 z-10">
                      <Bot className="w-5 h-5 text-white" />
                   </div>
                   <div className="bg-white/80 backdrop-blur-md border border-white shadow-sm rounded-[24px] rounded-bl-[8px] px-5 py-4 flex items-center gap-1.5 h-[52px]">
                     <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                     <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                     <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FAFAFC] via-[#FAFAFC] to-transparent z-20">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative group">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl transition-opacity opacity-0 group-focus-within:opacity-100"></div>
          <div className="relative flex items-center bg-white/90 backdrop-blur-xl border border-indigo-100/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all focus-within:ring-2 ring-indigo-500/20 overflow-hidden">
            <input
              type="text"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              disabled={isLoading}
              placeholder="Ask Skarya Pulse to analyze board health, draft tasks, or report..."
              className="flex-1 px-6 py-5 text-[15px] font-medium bg-transparent focus:outline-none placeholder:text-slate-400 text-slate-800 disabled:opacity-50"
            />
            <div className="pr-4 flex items-center">
              <button
                type="submit"
                disabled={!localInput?.trim() || isLoading}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white transition-all shadow-md group-focus-within:shadow-indigo-500/20"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
          <div className="text-center mt-3 flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 border border-emerald-200"></div>
            Connected to <span>pulse.karyaa.ai</span>
          </div>
        </form>
      </div>

      {/* Past Standups Modal */}
      {showStandups && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Past Standups
              </h2>
              <button onClick={() => setShowStandups(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {pastStandups.length === 0 ? (
                <div className="text-center text-slate-500 py-10">No past standups recorded yet.</div>
              ) : (
                pastStandups.map((s: any, i) => (
                  <div key={i} className="bg-white border text-sm border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {new Date(s.createdAt).toLocaleDateString()} at {new Date(s.createdAt).toLocaleTimeString()}
                    </div>
                    <div>
                      <span className="font-bold text-indigo-900">Yesterday:</span> <span className="text-slate-600">{s.yesterday}</span>
                    </div>
                    <div>
                      <span className="font-bold text-indigo-900">Today:</span> <span className="text-slate-600">{s.today}</span>
                    </div>
                    {s.blockers && s.blockers !== 'None' && (
                       <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 mt-2">
                         <span className="font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Blockers:</span> {s.blockers}
                       </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for custom animations omitted to save space, assuming they are inside globals.css or injected tailwind */}
    </main>
  );
}

