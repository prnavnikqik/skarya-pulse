'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { InputBar } from './InputBar';
import { FallbackView, HomeView, StandupHistoryLayout, MessagesList } from './PulseViews';
import { BlockerRadarView, TeamAnalyticsView, SprintReportsView } from './DashboardViews';
import './pulse.css';
import { XCircle, History } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const TEST_USER = {
  workspaceId: '69a202afcf1d73e568280529',
  boardId: '69a2118ecf1d73e568280ba5',
  userEmail: 'pranav.patil@nikqik.com',
  userName: 'Pranav Patil'
};

const AVAILABLE_MODELS = [
  // GROQ (Verified Working)
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', badge: 'FAST', color: '#ec4899' },
  { id: 'llama3-70b-8192', name: 'Llama 3 70B', badge: '', color: '#ec4899' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', badge: '', color: '#ec4899' },

  // OPENAI
  { id: 'gpt-4o', name: 'GPT-4o', badge: '', color: '#10a37f' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: '', color: '#10a37f' },
  { id: 'o1', name: 'o1', badge: '', color: '#10a37f' },

  // ANTHROPIC
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', badge: '', color: '#8b5cf6' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', badge: 'BEST', color: '#8b5cf6' },

  // GEMINI
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', badge: '', color: '#3b82f6' },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', badge: '', color: '#3b82f6' },
];

export default function PulsePage() {
  const [activeView, setActiveView] = useState('home');
  const [activeCtx, setActiveCtx] = useState<'home' | 'standup'>('home');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [isModelDropdownOpen, setModelDropdownOpen] = useState(false);
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat Persistence State
  const [showHistory, setShowHistory] = useState(false);
  const [pastChats, setPastChats] = useState<any[]>([]);
  const [homeChatId, setHomeChatId] = useState<string>('');
  const [standupChatId, setStandupChatId] = useState<string>('');

  useEffect(() => {
    setHomeChatId(uuidv4());
    setStandupChatId(uuidv4());
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const res = await fetch(`/api/chats?userEmail=${TEST_USER.userEmail}&workspaceId=${TEST_USER.workspaceId}`);
      const data = await res.json();
      if (data.success) {
        setPastChats(data.sessions);
      }
    } catch (e) { console.error('Failed to fetch chats', e); }
  };

  const fetchChats = async () => {
    await loadChatHistory();
    setShowHistory(true);
  };

  const deleteChat = async (id: string, e: any) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      await loadChatHistory();
      if (homeChatId === id) newSession();
      if (standupChatId === id) newSession();
    } catch (err) { console.error('Failed to delete chat', err); }
  };

  const renameChat = async (id: string, newTitle: string, e?: any) => {
    if (e) e.stopPropagation();
    if (!newTitle.trim()) return;
    try {
      await fetch(`/api/chats/${id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      });
      await loadChatHistory();
    } catch (err) { console.error('Failed to rename chat', err); }
  };

  const loadChat = async (id: string) => {
    try {
      const res = await fetch(`/api/chats/${id}`);
      const data = await res.json();
      if (data.success) {
        if (data.type === 'standup') {
          setStandupChatId(id);
          setStandupMsgs(data.messages || []);
          setActiveCtx('standup');
          navTo('standup-chat');
        } else {
          setHomeChatId(id);
          setHomeMsgs(data.messages || []);
          setActiveCtx('home');
          navTo('home');
        }
        setShowHistory(false);
      }
    } catch (e) { console.error('Failed to load chat', e); }
  };

  const { messages: homeMsgs, status: homeStatus, setMessages: setHomeMsgs, append: appendHome, addToolResult: authToolResHome } = useChat({
    id: 'home',
    api: '/api/chat',
    body: { ...TEST_USER, modelId: selectedModel.id, chatId: homeChatId, chatType: 'chat' },
    maxSteps: 7,
    onFinish: () => {
      loadChatHistory();
    }
  } as any);

  const { messages: standupMsgs, status: standupStatus, setMessages: setStandupMsgs, append: appendStandup, addToolResult: authToolResStandup } = useChat({
    id: 'standup',
    api: '/api/chat',
    body: { ...TEST_USER, modelId: selectedModel.id, chatId: standupChatId, chatType: 'standup' },
    maxSteps: 7,
    onFinish: () => {
      loadChatHistory();
    }
  } as any);

  const isLoading = homeStatus === 'submitted' || homeStatus === 'streaming' || standupStatus === 'submitted' || standupStatus === 'streaming';
  const showHomeChat = homeMsgs.length > 0;
  
  const [activeDocument, setActiveDocument] = useState<{ title: string; content: string } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [homeMsgs, standupMsgs, homeStatus, standupStatus, activeView]);

  const navTo = (id: string) => {
    setActiveView(id);
    if (id !== 'standup-chat' && id !== 'standup') {
        setActiveCtx('home');
    }
  };

  const newSession = () => {
    if (activeCtx === 'home') {
      setHomeChatId(uuidv4());
      setHomeMsgs([]);
    } else {
      setStandupChatId(uuidv4());
      setStandupMsgs([]);
    }
    navTo('home');
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const txt = input.trim();
    setInput('');
    
    if (activeCtx === 'home') {
      if (activeView !== 'home') navTo('home');
      appendHome({ role: 'user', content: txt });
    } else {
      if (activeView !== 'standup-chat') navTo('standup-chat');
      appendStandup({ role: 'user', content: txt });
    }
  };

  const fillAndSend = (txt: string) => {
    setInput('');
    setActiveCtx('home');
    navTo('home');
    appendHome({ role: 'user', content: txt });
  };

  const startStandup = () => {
    setStandupChatId(uuidv4());
    setStandupMsgs([
      { 
        id: uuidv4(), 
        role: 'assistant', 
        content: "Good morning! Let's get started with your daily standup.\n\nTo begin, **what did you accomplish yesterday?**" 
      }
    ]);
    setActiveCtx('standup');
    navTo('standup-chat');
  };

  let title = 'Pulse';
  if (activeView === 'standup') title = 'Daily Standup';
  if (activeView === 'summaries') title = 'Summaries';
  if (activeView === 'reports') title = 'Sprint Reports';
  if (activeView === 'analytics') title = 'Team Analytics';
  if (activeView === 'blockers') title = 'Blocker Radar';
  if (activeView === 'integrations') title = 'Integrations';
  if (activeView === 'settings') title = 'Settings';
  if (activeView === 'standup-chat') title = 'Daily Standup — Live';

  return (
    <div className="pulse-container font-sans text-[#111] bg-[#f7f8fa] w-full h-screen overflow-hidden flex">
      <Sidebar 
         isSidebarCollapsed={isSidebarCollapsed} 
         toggleSB={() => setSidebarCollapsed(!isSidebarCollapsed)} 
         activeView={activeView} 
         navTo={navTo} 
         user={TEST_USER}
         pastChats={pastChats}
         loadChat={loadChat}
         onDeleteChat={deleteChat}
         onRenameChat={renameChat}
      />

      <div className="main">
        <div className="dotbg"></div>
        <Topbar 
          currentTitle={title} 
          navTo={navTo} 
          showBackBtn={activeView === 'standup-chat'} 
          selectedModel={selectedModel}
          onModelSelect={(m: any) => setSelectedModel(m)}
          isModelDropdownOpen={isModelDropdownOpen}
          toggleModelDropdown={(e: any) => {
             e.stopPropagation();
             setModelDropdownOpen(!isModelDropdownOpen);
          }}
          newSession={newSession}
          fetchChats={fetchChats}
          AVAILABLE_MODELS={AVAILABLE_MODELS}
        />

        <div className="varea" onClick={() => setModelDropdownOpen(false)}>
           <div className={`view ${activeView === 'home' ? 'active' : ''} ${showHomeChat && activeView === 'home' ? 'flex flex-col' : ''}`}>
             {!showHomeChat && <HomeView fillAndSend={fillAndSend} user={TEST_USER} startStandup={startStandup} />}
             {showHomeChat && (
                <MessagesList 
                  messages={homeMsgs} 
                  TEST_USER={TEST_USER} 
                  addToolResult={authToolResHome} 
                  setActiveDocument={setActiveDocument} 
                  isLoading={homeStatus === 'submitted' || homeStatus === 'streaming'}
                  messagesEndRef={messagesEndRef}
                />
             )}
           </div>

           <div className={`view pview ${activeView === 'standup' ? 'active' : ''}`}>
             <StandupHistoryLayout 
               startStandup={startStandup} 
               pastStandups={pastChats.filter((c: any) => c.type === 'standup')}
               loadChat={loadChat}
             />
           </div>

           <div className={`view ${activeView === 'standup-chat' ? 'active flex flex-col' : ''}`}>
             <MessagesList 
                  messages={standupMsgs} 
                  TEST_USER={TEST_USER} 
                  addToolResult={authToolResStandup} 
                  setActiveDocument={setActiveDocument} 
                  isLoading={standupStatus === 'submitted' || standupStatus === 'streaming'}
                  messagesEndRef={messagesEndRef}
                />
           </div>

           <div className={`view pview ${activeView === 'summaries' ? 'active' : ''}`}>
             <FallbackView title="Summaries" desc="AI-generated summaries after every session." />
           </div>

           <div className={`view pview ${activeView === 'reports' ? 'active' : ''}`}>
             <SprintReportsView workspaceId={TEST_USER.workspaceId} boardId={TEST_USER.boardId} fillAndSend={fillAndSend} />
           </div>

           <div className={`view pview ${activeView === 'analytics' ? 'active' : ''}`}>
             <TeamAnalyticsView workspaceId={TEST_USER.workspaceId} boardId={TEST_USER.boardId} fillAndSend={fillAndSend} />
           </div>

           <div className={`view pview ${activeView === 'blockers' ? 'active' : ''}`}>
             <BlockerRadarView workspaceId={TEST_USER.workspaceId} boardId={TEST_USER.boardId} fillAndSend={fillAndSend} />
           </div>

           <div className={`view pview ${activeView === 'integrations' ? 'active' : ''}`}>
             <FallbackView title="Integrations" desc="Pulse connects with your existing tools." />
           </div>

           <div className={`view pview ${activeView === 'settings' ? 'active' : ''}`}>
             <FallbackView title="Settings" desc="Pulse preferences for your workspace." />
           </div>
        </div>

        <InputBar 
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          busy={isLoading}
          activeCtx={activeCtx}
          fillInput={(txt: string) => setInput(txt)}
        />
      </div>
      
      {/* Document Modal */}
      {activeDocument && (
        <div className="fixed inset-0 bg-[#312e81]/40 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
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

      {showHistory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto relative">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Chat History
              </h2>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 max-h-[60vh]">
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
    </div>
  );
}
