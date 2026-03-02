'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { executeSkaryaAction } from '@/app/actions';
import { Brain, Sparkles, Send, CheckCircle2, XCircle, Bot, User, Loader2, AlertCircle } from 'lucide-react';

// Hardcoded for demo/staging testing against pulse.karyaa.ai
const TEST_USER = {
  workspaceId: '69a202afcf1d73e568280529',
  boardId: '69a2118ecf1d73e568280ba5',
  userEmail: 'pranav.patil@nikqik.com',
  userName: 'Pranav Patil'
};

export default function PulsePage() {
  const chatControls = useChat({
    api: '/api/chat',
    body: {
      workspaceId: TEST_USER.workspaceId,
      boardId: TEST_USER.boardId,
      userEmail: TEST_USER.userEmail
    },
    maxSteps: 3, // Support multi-step tool calls
  } as any);

  const { messages, status, addToolResult } = chatControls;
  const append = (chatControls as any).append || (chatControls as any).sendMessage;

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Support either append or sendMessage depending on version
    if (append) {
      append({ role: 'user', content: input });
    }
    setInput('');
  };

  // Handle client-side manual tool confirmations
  const [toolConfirmations, setToolConfirmations] = useState<Record<string, boolean>>({});

  return (
    <main className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 py-3 px-6 flex items-center justify-between z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2 rounded-xl shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-indigo-700 tracking-tight">
            Skarya Pulse AI
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            {TEST_USER.userName}
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-4 py-8 pb-32 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-200 blur-3xl opacity-50 rounded-full"></div>
              <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-6 rounded-3xl shadow-xl relative z-10 transform hover:scale-105 transition-transform">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Meet your new AI PM.</h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                I can summarize tasks, update statuses, add comments, and keep your entire Skarya Pulse workspace organized.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              <button onClick={() => setInput("What are my tasks for today?")} className="text-sm text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-violet-300 hover:shadow-sm transition-all text-gray-700">
                <span className="font-semibold text-violet-600 block mb-1">My Tasks</span>
                What are my tasks for today?
              </button>
              <button onClick={() => setInput("Create a new task to fix the login bug")} className="text-sm text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-violet-300 hover:shadow-sm transition-all text-gray-700">
                <span className="font-semibold text-indigo-600 block mb-1">Create Work</span>
                Create a task to fix the login bug
              </button>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {messages.map((msg: any, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {/* Bot Avatar */}
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Text Bubble */}
                {msg.content && (
                  <div
                    className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed relative group ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-tr-sm shadow-md'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                )}

                {/* Tool Invocations */}
                {msg.toolInvocations?.map((toolInvocation: any) => {
                  const { toolCallId, toolName, args } = toolInvocation;

                  // 1. Tool Call Pending Server Execution (e.g. get_user_tasks)
                  if (!('result' in toolInvocation)) {
                    // It's a client-side execution tool if it's one of our write tools
                    if (['create_task', 'update_task_status', 'add_task_comment'].includes(toolName)) {
                      return (
                        <div key={toolCallId} className="w-full mt-2 bg-white border border-violet-200 rounded-2xl shadow-md overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                          <div className="flex items-center gap-2 bg-violet-50/50 px-4 py-3 border-b border-violet-100">
                            <AlertCircle className="w-5 h-5 text-violet-600" />
                            <span className="font-semibold text-violet-900 text-sm">Action Suggested: {toolName.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="p-4">
                            <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                              <pre className="text-xs font-mono text-gray-600 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(args, null, 2)}
                              </pre>
                            </div>
                            
                            {toolConfirmations[toolCallId] ? (
                              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg text-sm font-medium border border-green-100">
                                <CheckCircle2 className="w-4 h-4" /> Action Confirmed and Executed
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={async () => {
                                    try {
                                       const res = await executeSkaryaAction(toolName, args);
                                       setToolConfirmations(prev => ({...prev, [toolCallId]: true}));
                                       addToolResult({ toolCallId, result: res } as any);
                                    } catch (e: any) {
                                       addToolResult({ toolCallId, result: { success: false, error: e.message } } as any);
                                    }
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-sm"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Confirm
                                </button>
                                <button
                                  onClick={() => {
                                    addToolResult({ toolCallId, result: { success: false, error: 'User cancelled the action.' } } as any);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                                >
                                  <XCircle className="w-4 h-4" /> Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    // Otherwise it's a server-side tool currently running
                    return (
                      <div key={toolCallId} className="flex items-center gap-3 mt-2 bg-gray-50 border border-gray-200 text-gray-500 text-sm font-medium px-4 py-2.5 rounded-xl w-fit animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                        Executing {toolName.replace(/_/g, ' ')}...
                      </div>
                    );
                  }

                  // 2. Tool Executed Successfully (Server-side)
                  return (
                    <div key={toolCallId} className="flex items-center gap-2 mt-2 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[13px] font-medium px-3 py-1.5 rounded-lg w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Data retrieved from Skarya Integration
                    </div>
                  );
                })}
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role !== 'assistant' && (
             <div className="flex items-start gap-3 justify-start animate-in fade-in duration-300">
               <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white" />
               </div>
               <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                 <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                 <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          <div className="absolute inset-0 bg-violet-500/10 rounded-2xl blur-md transition-opacity opacity-0 group-focus-within:opacity-100"></div>
          <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-2xl shadow-lg transition-colors focus-within:border-violet-400 overflow-hidden">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Ask Skarya Pulse to summarize, update, or create a task..."
              className="flex-1 px-6 py-4 text-[15px] bg-transparent focus:outline-none placeholder:text-gray-400 text-gray-800 disabled:opacity-60"
            />
            <div className="pr-3 flex items-center">
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white transition-colors"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
          <div className="text-center mt-2 text-xs text-gray-400 font-medium">
            Skarya Pulse AI • Staging Environment (pulse.karyaa.ai)
          </div>
        </form>
      </div>
    </main>
  );
}

