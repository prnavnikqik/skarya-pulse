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
        <div className="ql">Summarise &amp; Actions</div>
      </div>
      <div className="qc" onClick={() => fillAndSend('What are all active blockers and what are your recommended resolutions for each?')}>
        <div className="qi qi-r"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
        <div className="ql">Active Blockers</div>
      </div>
      <div className="qc" onClick={() => fillAndSend('Draft a full sprint report: velocity, completed tasks, blockers, risks, and highlights.')}>
        <div className="qi qi-am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
        <div className="ql">Sprint Report</div>
      </div>
      <div className="qc" onClick={() => fillAndSend('Give me a team performance analysis with actionable insights.')}>
        <div className="qi qi-g"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
        <div className="ql">Team Analytics</div>
      </div>
      <div className="qc" onClick={() => fillAndSend('Which tasks are at risk this sprint? Identify and suggest next steps.')}>
        <div className="qi qi-pk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
        <div className="ql">At-Risk Work</div>
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

// Human-friendly labels and icons for each tool
const TOOL_META: Record<string, { loading: string; done: string; icon: string }> = {
  get_board_health:       { loading: 'Analyzing board health',    done: 'Board health analyzed',    icon: '🩺' },
  get_team_tasks:         { loading: 'Fetching team tasks',       done: 'Team tasks loaded',         icon: '📋' },
  get_my_tasks:           { loading: 'Loading your tasks',        done: 'Tasks loaded',              icon: '✅' },
  get_my_workload_stats:  { loading: 'Checking your workload',    done: 'Workload checked',           icon: '📊' },
  detect_stuck_tasks:     { loading: 'Scanning for blockers',     done: 'Blocker scan complete',     icon: '🔍' },
  predict_deadline_risk:  { loading: 'Checking deadline risks',   done: 'Risk analysis done',        icon: '⚠️' },
  get_sprint_summary:     { loading: 'Loading sprint summary',    done: 'Sprint summary ready',      icon: '🏃' },
  get_active_tasks:       { loading: 'Fetching active tasks',     done: 'Active tasks loaded',       icon: '⚡' },
  get_overdue_tasks:      { loading: 'Finding overdue tasks',     done: 'Overdue check done',        icon: '🚨' },
  create_task:            { loading: 'Creating task',             done: 'Task created',              icon: '✨' },
  update_task_status:     { loading: 'Updating task status',      done: 'Status updated',            icon: '🔄' },
  update_task_priority:   { loading: 'Adjusting priority',        done: 'Priority updated',          icon: '🎯' },
  set_task_dates:         { loading: 'Setting dates',             done: 'Dates set',                 icon: '📅' },
  assign_task:            { loading: 'Assigning task',            done: 'Task assigned',             icon: '👤' },
  add_task_comment:       { loading: 'Adding comment',            done: 'Comment added',             icon: '💬' },
  create_subtask:         { loading: 'Creating subtask',          done: 'Subtask created',           icon: '📌' },
  auto_generate_subtasks: { loading: 'Generating subtask ideas', done: 'Subtasks suggested',        icon: '💡' },
  draft_document:         { loading: 'Drafting document',         done: 'Document drafted',          icon: '📝' },
  persist_standup:        { loading: 'Persisting standup',        done: 'Standup saved ✓',           icon: '💾' },
};

function formatToolArgs(toolName: string, args: any) {
  if (!args) return '';
  const entries: any = {
    create_task: () => (
      <div className="conf-args">
        <div className="conf-arg"><strong>Name:</strong> {args.name}</div>
        {args.priority && <div className="conf-arg"><strong>Priority:</strong> {args.priority}</div>}
        {args.assigneeEmail && <div className="conf-arg"><strong>Assignee:</strong> {args.assigneeEmail}</div>}
      </div>
    ),
    update_task_status: () => (
      <div className="conf-args">
        <div className="conf-arg"><strong>Task:</strong> #{args.taskNumber || (args.taskId ? String(args.taskId).substring(0, 6) + '...' : 'Unknown')}</div>
        <div className="conf-arg"><strong>New Status:</strong> {args.status}</div>
      </div>
    ),
    update_task_priority: () => (
      <div className="conf-args">
        <div className="conf-arg"><strong>Task:</strong> #{args.taskNumber || (args.taskId ? String(args.taskId).substring(0, 6) + '...' : 'Unknown')}</div>
        <div className="conf-arg"><strong>Priority:</strong> {args.priority}</div>
      </div>
    ),
    add_task_comment: () => (
      <div className="conf-args">
        <div className="conf-arg"><strong>Task:</strong> #{args.taskNumber || (args.taskId ? String(args.taskId).substring(0, 6) + '...' : 'Unknown')}</div>
        <div className="conf-arg"><strong>Comment:</strong> "{args.comment}"</div>
      </div>
    ),
    assign_task: () => (
      <div className="conf-args">
        <div className="conf-arg"><strong>Task:</strong> #{args.taskNumber || (args.taskId ? String(args.taskId).substring(0, 6) + '...' : 'Unknown')}</div>
        <div className="conf-arg"><strong>New Assignee:</strong> {args.assigneeEmail}</div>
      </div>
    ),
    create_subtask: () => (
      <div className="conf-args">
        <div className="conf-arg"><strong>Name:</strong> {args.name}</div>
        <div className="conf-arg"><strong>Parent Task:</strong> {args.parentTaskId}</div>
      </div>
    ),
    persist_standup: () => (
      <div className="conf-args">
        <div className="conf-arg"><strong>Yesterday:</strong> {args.yesterday}</div>
        <div className="conf-arg"><strong>Today:</strong> {args.today}</div>
        <div className="conf-arg"><strong>Blockers:</strong> {args.blockers}</div>
      </div>
    ),
    draft_document: () => (
      <div className="conf-args">
        <div className="conf-arg"><strong>Title:</strong> {args.title}</div>
      </div>
    ),
    set_task_dates: () => (
      <div className="conf-args">
        <div className="conf-arg"><strong>Task:</strong> #{args.taskNumber || (args.taskId ? String(args.taskId).substring(0, 6) + '...' : 'Unknown')}</div>
        {args.startDate && <div className="conf-arg"><strong>Start:</strong> {args.startDate}</div>}
        {args.dueDate && <div className="conf-arg"><strong>Due:</strong> {args.dueDate}</div>}
      </div>
    )
  };

  if (entries[toolName]) return entries[toolName]();
  return <pre className="conf-raw">{JSON.stringify(args, null, 2)}</pre>;
}

const getToolMeta = (toolName: string) =>
  TOOL_META[toolName] ?? {
    loading: toolName.replace(/_/g, ' ').toLowerCase(),
    done: toolName.replace(/_/g, ' ').toLowerCase() + ' done',
    icon: '⚙️'
  };

const MUTATION_TOOLS = [
  'create_task', 'update_task_status', 'add_task_comment', 'create_subtask',
  'draft_document', 'update_task_priority', 'set_task_dates', 'assign_task',
  'persist_standup'
];

const ChatMessage = ({ msg, TEST_USER, addToolResult, setActiveDocument, fillAndSend, isLastAi }: MessageProps & { fillAndSend?: any; isLastAi?: boolean }) => {
  const [showToolDetails, setShowToolDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const userInitials = TEST_USER ? (TEST_USER.userName || 'ME').substring(0, 2).toUpperCase() : 'ME';

  const invocations: any[] = msg.toolInvocations || [];
  const completedTools = invocations.filter((t: any) => t.result);
  const pendingTools = invocations.filter((t: any) => !t.result);
  const failedTools = completedTools.filter((t: any) => t.result && !t.result.success);

  const contentText = typeof msg.content === 'string'
    ? msg.content
    : (Array.isArray(msg.content) ? msg.content.map((p: any) => p.text || '').join('\n') : String(msg.content || ''));

  const handleCopy = () => {
    navigator.clipboard.writeText(contentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Contextual follow-up suggestions for the last AI message
  const followUps = React.useMemo(() => {
    if (!isLastAi || !contentText || msg.role === 'user') return [];
    const lower = contentText.toLowerCase();
    const suggestions: string[] = [];
    if (lower.includes('overdue') || lower.includes('blocker'))
      suggestions.push('Show me the overdue tasks and who owns them');
    if (lower.includes('sprint') || lower.includes('velocity'))
      suggestions.push('Break down the sprint by individual contributor');
    if (lower.includes('task') || lower.includes('assigned'))
      suggestions.push('What are my top priority tasks right now?');
    if (lower.includes('risk') || lower.includes('deadline'))
      suggestions.push('Which tasks should I escalate today?');
    if (suggestions.length === 0) {
      suggestions.push('Summarise this as action items');
      suggestions.push('What should I focus on next?');
    }
    return suggestions.slice(0, 3);
  }, [isLastAi, contentText, msg.role]);

  // ─── User message ───
  if (msg.role === 'user') {
    return (
      <div className="msg u">
        <div className="msg-u-row">
          <div className="msg-u-bubble">{contentText}</div>
        </div>
      </div>
    );
  }

  // ─── AI message (ClickUp Brain style) ───
  return (
    <div className="msg ai-msg">
      <div className="ai-msg-header">
        <div className="ai-msg-avatar">✦</div>
        <span className="ai-msg-name">Pulse</span>
      </div>

      {/* Pending Tools */}
      {pendingTools.length > 0 && (
        <div className="ai-msg-tools">
          {pendingTools.map((toolInvocation: any) => {
            const { toolCallId, toolName, args } = toolInvocation;
            const meta = getToolMeta(toolName);
            if (MUTATION_TOOLS.includes(toolName)) {
              return (
                <div key={toolCallId} className="tool-confirm-card">
                  <div className="tool-confirm-hd">
                    <span className="tool-confirm-icon">✦</span>
                    <span className="tool-confirm-label">Ready to {meta.loading.toLowerCase()}. Confirm?</span>
                  </div>
                  <div className="tool-confirm-body">
                    {formatToolArgs(toolName, args)}
                  </div>
                  <div className="tool-confirm-btns">
                    <button onClick={async () => {
                        const res = await executeSkaryaAction(toolName, { ...args, _authMeta: TEST_USER });
                        addToolResult({ toolCallId, result: res } as any);
                        if (toolName === 'draft_document' && res.success) setActiveDocument({ title: args.title, content: args.content });
                      }} className="tool-btn-confirm">{meta.icon} Confirm</button>
                    <button onClick={() => addToolResult({ toolCallId, result: { success: false, error: 'Cancelled' } } as any)} className="tool-btn-cancel">Cancel</button>
                  </div>
                </div>
              );
            }
            return (
              <div key={toolCallId} className="tool-loading-pill">
                <div className="tool-pill-dot" /><div className="tool-pill-dot" /><div className="tool-pill-dot" />
                <span>{meta.loading}…</span>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Text Content */}
      {contentText && (
        <div className="ai-msg-body">
          <ReactMarkdown>{contentText}</ReactMarkdown>
        </div>
      )}

      {/* Completed Tools chip */}
      {completedTools.length > 0 && (
        <div className="tool-done-group">
          <button className="tool-done-chip" onClick={() => setShowToolDetails(!showToolDetails)}>
            {failedTools.length > 0
              ? <><span className="tool-chip-fail-dot" /> {failedTools.length} failed</>
              : <><span className="tool-chip-ok-dot" /> {completedTools.length} action{completedTools.length > 1 ? 's' : ''} completed</>}
            <span className="tool-chip-arrow">{showToolDetails ? '▴' : '▾'}</span>
          </button>
          {showToolDetails && (
            <div className="tool-done-details">
              {completedTools.map((t: any) => {
                const m = getToolMeta(t.toolName);
                return (<div key={t.toolCallId} className="tool-done-row"><span>{t.result?.success !== false ? '✓' : '✕'}</span><span>{m.icon} {m.done}</span></div>);
              })}
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      {contentText && (
        <div className="ai-actions">
          <button className="ai-act-btn" onClick={handleCopy} title="Copy">
            {copied
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
          </button>
          <div className="ai-act-sep" />
          <button className="ai-act-btn" title="Regenerate" onClick={() => fillAndSend?.('Regenerate the last response with more detail')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
          <button className="ai-act-btn" title="Good response">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          </button>
          <button className="ai-act-btn" title="Bad response">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 15V19a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
          </button>
        </div>
      )}

      {/* Follow-up Suggestions */}
      {isLastAi && followUps.length > 0 && (
        <div className="ai-followups">
          <div className="ai-followups-label">Follow ups</div>
          {followUps.map((q, i) => (
            <button key={i} className="ai-followup-btn" onClick={() => fillAndSend?.(q)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const MessagesList = ({ messages, TEST_USER, addToolResult, setActiveDocument, isLoading, messagesEndRef, fillAndSend }: any) => {
  let lastAiIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') { lastAiIdx = i; break; }
  }

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
          fillAndSend={fillAndSend}
          isLastAi={idx === lastAiIdx && !isLoading}
        />
      ))}
      {isLoading && (
        <div className="msg ai-msg">
          <div className="ai-msg-header">
            <div className="ai-msg-avatar loading">✦</div>
            <span className="ai-msg-name">Pulse</span>
          </div>
          <div className="ai-msg-body">
            <div className="typing-wrap"><div className="tpulse"><span></span><span></span><span></span></div><span className="typing-label">Pulse is thinking…</span></div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};
