import { useState, useRef, useEffect } from 'react';

type Message = {
  role: string;
  content: string;
};

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (msg: string) => void;
  isComplete: boolean;
}

export default function ChatInterface({ messages, onSendMessage, isComplete }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Re-enable input when new assistant message arrives
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      setIsLoading(false);
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isComplete) return;

    onSendMessage(input.trim());
    setInput('');
    setIsLoading(true);
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white border text-gray-800 shadow-sm rounded-tl-sm'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🤖</span>
                  <span className="text-xs font-semibold text-gray-500">KOBI</span>
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-2">
              <span className="text-xl animate-bounce">🤖</span>
              <span className="text-gray-400 text-sm">typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isComplete}
            placeholder={isComplete ? "Standup complete, waiting for confirmation..." : "Type your response..."}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || isComplete}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-sm disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
