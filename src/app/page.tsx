'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ConfirmationCard from '@/components/ConfirmationCard';
import { StandupOutput } from '@/types';

// Hardcoded for demo
const TEST_USER = {
  workspaceId: '692ba14ce2552a8b5afe6e9a',
  boardId: '694a87f7e6aa80a347e86e5a',
  userEmail: 'pranav.patil@nikqik.com',
  userName: 'Pranav Patil'
};

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [extractedData, setExtractedData] = useState<StandupOutput | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const startStandup = async () => {
    setIsStarting(true);
    try {
      const res = await fetch('/api/standup/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        setSessionId(data.data.sessionId);
        setMessages([{ role: 'assistant', content: data.data.firstMessage }]);
      } else {
        alert('Failed to start session: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error starting standup: ' + e.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!sessionId) return;
    
    // Optimistic UI update
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    try {
      const res = await fetch('/api/standup/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content: text })
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.message }]);
        
        if (data.data.isComplete) {
          setIsComplete(true);
          if (data.data.llmOutput) {
             setExtractedData(data.data.llmOutput);
          }
        }
      } else {
        console.error('Message error:', data.error);
        alert('Failed to send message.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Network error while sending message.');
    }
  };

  const handleConfirm = async (updatedData: StandupOutput) => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/standup/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, confirmedOutput: updatedData })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsConfirmed(true);
      } else {
        alert('Failed to write back: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Network error confirming updates.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center">
      <header className="w-full bg-white shadow-sm border-b py-4 px-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>🎙️</span> Standup Mediator
        </h1>
        <div className="text-sm text-gray-500">
          Demo User: {TEST_USER.userName}
        </div>
      </header>

      <div className="flex-1 w-full max-w-4xl p-6 flex flex-col items-center justify-center">
        {!sessionId ? (
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-semibold text-gray-800">Ready for your daily standup?</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Skip the sync meeting. Tell Kobi what you did, what you are doing, and if you are blocked. We'll update your tasks automatically.
            </p>
            <button
              onClick={startStandup}
              disabled={isStarting}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-md disabled:opacity-50"
            >
              {isStarting ? 'Connecting to skarya.ai...' : 'Start My Standup'}
            </button>
          </div>
        ) : isConfirmed ? (
          <div className="text-center space-y-6 bg-white p-12 rounded-2xl shadow-sm border">
            <div className="text-5xl">✅</div>
            <h2 className="text-2xl font-bold text-gray-800">All Done!</h2>
            <p className="text-gray-500">Your tasks and comments have been updated in skarya.ai.</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:underline"
            >
              Start another session
            </button>
          </div>
        ) : isComplete && extractedData ? (
          <div className="w-full">
            <ConfirmationCard 
              initialData={extractedData} 
              onConfirm={handleConfirm} 
            />
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col max-h-[80vh] bg-white rounded-2xl shadow-sm border overflow-hidden">
            <ChatInterface 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              isComplete={isComplete} 
            />
          </div>
        )}
      </div>
    </main>
  );
}
