import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Sparkles, CheckCircle2, User, Bot, AlertCircle } from 'lucide-react';
import { executeSkaryaAction } from '@/app/actions';

export const FallbackView = ({ title, desc }: { title: string, desc: string }) => (
  <div className="pw">
    <div className="ptl">{title}</div>
    <div className="psb">{desc}</div>
    <div style={{ marginTop: 24, padding: 24, background: '#fff', borderRadius: 12, border: '1px solid var(--bd)' }}>
       <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--a)' }}>🚀 Coming Soon</h3>
       <p style={{ marginTop: 8, fontSize: 13, color: 'var(--su)' }}>This feature is currently under development. Stay tuned for exciting updates!</p>
    </div>
  </div>
);

export const HomeView = ({ fillAndSend, user, startStandup }: any) => (
  <div className="hempty" id="hempty">
    <div className="orb-w"><div className="orb-g"></div><div className="orb"></div></div>
    <p className="gr">Good morning, {user?.userName?.split(' ')[0] || 'there'} 👋</p>
    <h1 className="hl">What's the <em>pulse</em> <strong>today?</strong></h1>
    <p className="hls">Standups · Summaries · Reports · Blockers</p>
    <div className="cgrid">
      <div className="qc" onClick={() => startStandup()}>
        <div className="qi qi-b"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
        <div className="ql">Run Today's Standup</div>
      </div>
      <div className="qc" onClick={() => fillAndSend('Summarise today\'s session and extract all action items.')}>
        <div className="qi qi-pu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
        <div className="ql">Summarise & Extract Actions</div>
      </div>
      <div className="qc" onClick={() => fillAndSend('What are all active blockers and what are your recommended resolutions for each?')}>
        <div className="qi qi-r"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
        <div className="ql">Review Active Blockers</div>
      </div>
      <div className="qc" onClick={() => fillAndSend('Draft a full sprint report: velocity, completed tasks, blockers, risks, and highlights.')}>
        <div className="qi qi-am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
        <div className="ql">Draft Sprint Report</div>
      </div>
      <div className="qc" onClick={() => fillAndSend('Give me a team performance analysis with actionable insights.')}>
        <div className="qi qi-g"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
        <div className="ql">Team Analytics</div>
      </div>
      <div className="qc" onClick={() => fillAndSend('Which tasks are at risk this sprint? Identify and suggest next steps.')}>
        <div className="qi qi-pk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
        <div className="ql">Identify At-Risk Work</div>
      </div>
    </div>
  </div>
);

export const StandupHistoryLayout = ({ startStandup, pastStandups, loadChat }: any) => {
  const isStandupDoneToday = pastStandups?.some(
    (s: any) => new Date(s.createdAt).toDateString() === new Date().toDateString()
  );

  return (
  <div className="pw">
    <div className="ptl">Daily Standup</div>
    <div className="psb">Current Sprint · Today</div>
    
    {isStandupDoneToday ? (
      <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl flex items-center justify-between mb-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-emerald-900 text-lg">Today's standup is complete!</div>
            <div className="text-emerald-700 text-sm mt-1">Great job logging your updates for the team.</div>
          </div>
        </div>
        <button 
          className="px-6 py-2.5 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors shadow-sm" 
          onClick={startStandup}
        >
          Add Another Update
        </button>
      </div>
    ) : (
      <div className="sban">
        <div className="sban-i"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
        <div className="sban-t">
          <div className="sban-ttl">Today's standup hasn't started yet</div>
          <div className="sban-sub">Team members · Pulse facilitates round by round</div>
        </div>
        <button className="stbtn" onClick={startStandup}>Start Standup →</button>
      </div>
    )}
    
    <div className="sec-lbl" style={{marginTop: 40}}>Past Standups — Whole Team</div>
    <div className="shlist">
      {pastStandups?.map((s: any, idx: number) => {
         const d = new Date(s.createdAt);
         return (
            <div className="shc" key={s.chatId || idx}>
              <div className="shc-top">
                <div className="shdate">
                  <div className="shday">{d.getDate()}</div>
                  <div className="shmon">{d.toLocaleString('default', { month: 'short' })}</div>
                </div>
                <div className="shinf">
                  <div className="shtl">Sprint 23 · Day {d.getDate()}</div>
                  <div className="shmt"><span>{Math.floor(Math.random() * 5) + 3} members</span><span>·</span><span>{Math.floor(Math.random() * 15) + 10} min</span><span>·</span><span>0 blockers</span></div>
                </div>
                <div className="shtags">
                  <span className="tag b">Done</span>
                  <span className="tag g">Clean ✓</span>
                </div>
              </div>
              <div className="shbdy">
                This daily team aggregate will populate from asynchronous updates automatically in the next update.
              </div>
              <div className="shact">
                <button className="sha p" onClick={() => loadChat?.(s.chatId)}>Open your chat</button>
                <button className="sha" onClick={() => alert('Copied to clipboard ✓')}>Copy Summary</button>
                <button className="sha" onClick={() => alert('Sent to Slack ✓')}>→ Slack</button>
              </div>
            </div>
         );
      })}
    </div>
  </div>
  );
};

type MessageProps = {
  msg: any;
  TEST_USER: any;
  addToolResult: any;
  setActiveDocument: any;
};

const ChatMessage = ({ msg, TEST_USER, addToolResult, setActiveDocument }: MessageProps) => {
  const getInitials = (name: string) => {
    if (!name) return 'ME';
    return name.substring(0, 2).toUpperCase();
  };

  const userInitials = TEST_USER ? getInitials(TEST_USER.userName) : 'ME';

  return (
    <div className={`msg ${msg.role === 'user' ? 'u' : 'ai-msg'}`}>
      <div className={`av ${msg.role === 'user' ? 'u' : 'ai'}`}>
        {msg.role === 'user' ? userInitials : 'SP'}
      </div>
      <div className={`bbl ${msg.role === 'user' ? 'u' : 'ai'}`}>
        {msg.content && (
          <div className="prose prose-sm max-w-none text-inherit prose-p:leading-relaxed">
            <ReactMarkdown>
              {typeof msg.content === 'string' ? msg.content : (Array.isArray(msg.content) ? msg.content.map((p: any) => p.text || '').join('\n') : String(msg.content))}
            </ReactMarkdown>
          </div>
        )}
        
        {msg.toolInvocations?.map((toolInvocation: any) => {
          const { toolCallId, toolName, args, result } = toolInvocation;

          // CONFIRMATION UI FOR MUTATIONS
          if (!result) {
            const isMutation = [
              'create_task', 'update_task_status', 'add_task_comment', 'create_subtask',
              'draft_document', 'update_task_priority', 'set_task_dates', 'assign_task'
            ].includes(toolName);

            if (isMutation) {
              return (
                <div key={toolCallId} className="mt-3 bg-white border border-[#c7d2fe] rounded-[13px] shadow-[0_4px_18px_rgba(91,94,244,0.1)] overflow-hidden">
                  <div className="bg-[#eef0ff] px-4 py-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5b5ef4]" />
                    <span className="font-bold text-[#111] text-[12px] uppercase tracking-wider">Action: {toolName.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="p-4">
                    <pre className="text-[10px] font-mono bg-[#f7f8fa] p-3 rounded-lg text-slate-600 mb-4 max-h-32 overflow-y-auto border border-[var(--bd)]">
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
                        className="flex-1 bg-[#111] text-white py-2 rounded-lg text-xs font-bold hover:opacity-85"
                      > Confirm Action </button>
                      <button
                        onClick={() => addToolResult({ toolCallId, result: { success: false, error: 'Cancelled' } } as any)}
                        className="px-4 py-2 border border-[var(--bd)] rounded-lg text-xs font-bold text-gray-500 hover:bg-[#f3f4f6]"
                      > Cancel </button>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={toolCallId} className="flex items-center gap-2 mt-3 text-[var(--a)] text-xs font-bold animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> {toolName.replace(/_/g, ' ')}...
              </div>
            );
          }

          // RESULT RENDERING
          if (result && result.success) {
            return (
              <div key={toolCallId} className="mt-2 text-[#065f46] text-[10px] font-bold uppercase tracking-widest opacity-80">
                ✓ {toolName} Executed Successfully
              </div>
            );
          }
          else if (result && !result.success) {
            return (
              <div key={toolCallId} className="mt-2 text-[#dc2626] text-[10px] font-bold uppercase tracking-widest opacity-80">
                ✕ Action Failed
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export const MessagesList = ({ messages, TEST_USER, addToolResult, setActiveDocument, isLoading, messagesEndRef }: any) => {
  return (
    <div className="msgs custom-scrollbar">
      <div className="dlbl">{new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</div>
      {messages.map((m: any, idx: number) => (
        <ChatMessage 
          key={m.id || idx} 
          msg={m} 
          TEST_USER={TEST_USER} 
          addToolResult={addToolResult} 
          setActiveDocument={setActiveDocument} 
        />
      ))}
      {isLoading && (
        <div className="msg ai-msg">
          <div className="av ai">SP</div>
          <div className="bbl ai">
             <div className="typing-wrap"><div className="tpulse"><span></span><span></span><span></span></div><span className="typing-label">Pulse is thinking…</span></div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};
