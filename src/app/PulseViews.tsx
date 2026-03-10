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

export const HomeView = ({ fillAndSend, user }: any) => (
  <div className="hempty" id="hempty">
    <div className="orb-w"><div className="orb-g"></div><div className="orb"></div></div>
    <p className="gr">Good morning, {user?.userName?.split(' ')[0] || 'there'} 👋</p>
    <h1 className="hl">What's the <em>pulse</em> <strong>today?</strong></h1>
    <p className="hls">Standups · Summaries · Reports · Blockers</p>
    <div className="cgrid">
      <div className="qc" onClick={() => fillAndSend('Run today\'s standup — facilitate it round by round for the team.')}>
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

export const StandupHistoryLayout = ({ startStandup, pastStandups, loadChat }: any) => (
  <div className="pw">
    <div className="ptl">Daily Standup</div>
    <div className="psb">Current Sprint · Today</div>
    <div className="sban">
      <div className="sban-i"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
      <div className="sban-t">
        <div className="sban-ttl">Today's standup hasn't started yet</div>
        <div className="sban-sub">Team members · Pulse facilitates round by round</div>
      </div>
      <button className="stbtn" onClick={startStandup}>Start Standup →</button>
    </div>
    
    <div style={{ marginTop: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--a)', letterSpacing: '-0.5px' }}>Past Standup History</h3>
        <div style={{ fontSize: '12px', color: 'var(--mu)', fontWeight: 500 }}>{pastStandups?.length || 0} Sessions recorded</div>
      </div>
      
      {pastStandups && pastStandups.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {pastStandups.map((s: any) => (
             <div 
               key={s.chatId} 
               onClick={() => loadChat(s.chatId)} 
               style={{ 
                 padding: '20px', 
                 background: '#fff', 
                 border: '1px solid var(--bd)', 
                 borderRadius: '16px', 
                 cursor: 'pointer', 
                 transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', 
                 boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '12px',
                 position: 'relative',
                 overflow: 'hidden'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.borderColor = 'var(--a)';
                 e.currentTarget.style.transform = 'translateY(-3px)';
                 e.currentTarget.style.boxShadow = '0 10px 25px rgba(91, 94, 244, 0.08)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.borderColor = 'var(--bd)';
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
               }}
             >
               <div style={{ 
                 position: 'absolute', 
                 top: 0, 
                 right: 0, 
                 width: '4px', 
                 height: '100%', 
                 background: 'linear-gradient(to bottom, var(--a), var(--a2))',
                 opacity: 0.8
               }} />
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(91, 94, 244, 0.06)', color: 'var(--a)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                 </div>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                   {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                 </div>
               </div>

               <div style={{ fontSize: '15px', fontWeight: 600, color: '#111', lineHeight: '1.4' }}>{s.title}</div>
               
               <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--su)' }}>
                 <span>{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 <span style={{ opacity: 0.3 }}>•</span>
                 <span style={{ color: 'var(--a)', fontWeight: 600 }}>Review Standup →</span>
               </div>
             </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          background: 'rgba(255,255,255,0.5)', 
          border: '2px dashed var(--bd)', 
          borderRadius: '20px',
          color: 'var(--su)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>No past standup history available yet.</div>
          <div style={{ fontSize: '12px', color: 'var(--mu)', marginTop: '4px' }}>Complete your first daily standup to see it here.</div>
        </div>
      )}
    </div>
  </div>
);

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
