'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { executeSkaryaAction } from '@/app/actions';

// Hardcoded for demo
const TEST_USER = {
  workspaceId: '692ba14ce2552a8b5afe6e9a',
  boardId: '694a87f7e6aa80a347e86e5a',
  userEmail: 'pranav.patil@nikqik.com',
  userName: 'Pranav Patil'
};

export default function BrainPage() {
  const { messages, status, addToolResult, sendMessage } = useChat({
    api: '/api/brain/chat',
    body: TEST_USER,
    maxSteps: 3, // Support multi-step tool calls
  } as any);

  const [input, setInput] = useState('');
  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ role: 'user', content: input } as any);
    setInput('');
  };

  // Handle client-side manual tool confirmations
  const [toolConfirmations, setToolConfirmations] = useState<Record<string, boolean>>({});

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center">
      <header className="w-full bg-white shadow-sm border-b py-4 px-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <span>🧠</span> Skarya Brain
        </h1>
        <div className="text-sm text-gray-500">
          Demo User: {TEST_USER.userName}
        </div>
      </header>

      <div className="flex-1 w-full max-w-4xl p-6 flex flex-col bg-white rounded-2xl shadow-sm border mt-6 mb-10 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto space-y-6 pb-20 p-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <span className="text-5xl block mb-4">🧠</span>
              <h2 className="text-2xl font-bold text-gray-700">How can I help you today?</h2>
              <p>Ask me about your tasks, your board, or tell me to update something.</p>
            </div>
          )}

          {messages.map((msg: any, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-gray-50 border text-gray-800 shadow-sm rounded-tl-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 border-b pb-2">
                    <span className="text-lg">🧠</span>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Brain</span>
                  </div>
                )}
                
                {/* Regular text content */}
                {msg.content && <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>}

                {/* Tool Invocations */}
                {msg.toolInvocations?.map((toolInvocation: any) => {
                  const { toolCallId, toolName, args } = toolInvocation;

                  // 1. Tool Call Pending Server Execution (e.g. get_user_tasks)
                  if (!('result' in toolInvocation)) {
                    // It's a client-side execution tool if it's one of our write tools
                    if (['create_task', 'update_task_status', 'add_task_comment'].includes(toolName)) {
                      return (
                        <div key={toolCallId} className="mt-4 p-4 bg-white border border-indigo-200 rounded-xl shadow-md">
                          <div className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                            <span>⚡️</span> Action Required: {toolName.replace(/_/g, ' ')}
                          </div>
                          <pre className="text-xs bg-gray-50 p-2 rounded mb-4 overflow-x-auto text-gray-600">
                            {JSON.stringify(args, null, 2)}
                          </pre>
                          
                          {toolConfirmations[toolCallId] ? (
                            <div className="text-sm font-medium text-green-600 flex items-center gap-1">
                              ✅ Confirmed & Executed
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                     // Call real server action to update Skarya
                                     const res = await executeSkaryaAction(toolName, args);
                                     
                                     setToolConfirmations(prev => ({...prev, [toolCallId]: true}));
                                     addToolResult({ 
                                       toolCallId, 
                                       result: res 
                                     } as any);
                                  } catch (e: any) {
                                     addToolResult({ toolCallId, result: { success: false, error: e.message } } as any);
                                  }
                                }}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                              >
                                Confirm Action
                              </button>
                              <button
                                onClick={() => {
                                  addToolResult({ toolCallId, result: { success: false, error: 'User cancelled the action.' } } as any);
                                }}
                                className="bg-white border text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // Otherwise it's a server-side tool currently running
                    return (
                      <div key={toolCallId} className="text-sm text-gray-500 italic flex items-center gap-2 my-2 bg-gray-100 p-2 rounded-md">
                        <span className="animate-spin text-lg">⏳</span> Calling {toolName.replace(/_/g, ' ')}...
                      </div>
                    );
                  }

                  // 2. Tool Executed Successfully (Server-side)
                  return (
                    <div key={toolCallId} className="text-sm text-gray-500 my-2 bg-green-50 text-green-800 p-2 rounded-md border border-green-100 flex items-center gap-2 font-medium">
                      <span>✅</span> Finished researching {toolName.replace(/_/g, ' ')}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role !== 'assistant' && (
             <div className="flex justify-start">
               <div className="bg-gray-50 border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-2">
                 <span className="text-xl animate-bounce">🧠</span>
                 <span className="text-gray-400 text-sm">Thinking...</span>
               </div>
             </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Ask Skarya Brain..."
              className="flex-1 px-5 py-3 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-all shadow-md disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
