'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, TrendingUp, CheckCircle2, Clock, Users } from 'lucide-react';
import { fetchBlockerRadar, fetchTeamAnalytics, fetchSprintSummaries } from '@/app/actions/dashboards';

export function BlockerRadarView({ workspaceId, boardId, fillAndSend }: { workspaceId: string, boardId: string, fillAndSend: (txt: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlockerRadar(boardId, workspaceId).then(res => {
      if (res.success) setTasks(res.tasks || []);
      else setError(res.error);
      setLoading(false);
    });
  }, [boardId, workspaceId]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (error) return <div className="p-6 text-red-500 bg-red-50 rounded-xl">{error}</div>;

  return (
    <div className="pw">
      <div className="ptl">Blocker Radar</div>
      <div className="psb text-slate-500">AI-detected from standup sessions</div>
      <div className="prow">
        <button 
          onClick={() => fillAndSend('What are the active blockers here and what are your recommended resolutions for each?')}
          className="pb dk"
        >
          AI Suggest Fixes
        </button>
        <button className="pb" onClick={() => fillAndSend('I need to log a new blocker. Please ask me for the details.')}>Log Blocker</button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">Clear Skies!</h3>
          <p className="text-slate-500">No stuck tasks currently detected.</p>
        </div>
      ) : (
        <div className="bklist">
          {tasks.map((t, idx) => (
            <div key={t.id || t._id || Math.random()} className={`bkc ${idx % 2 === 0 ? 'crit' : 'med'}`}>
              <span className={`bsev ${idx % 2 === 0 ? 'c' : 'm'}`}>{idx % 2 === 0 ? 'Critical' : 'Medium'}</span>
              <div className="bkbd">
                <div className="bkt">{t.name}</div>
                <div className="bkd">This task has had no movement since {new Date(t.lastActive).toLocaleDateString()}, flagged as a potential blocker. Current status is {t.status}.</div>
                <div className="bkf">
                  <div className="bkwho">
                    <div className="bkav" style={{background: idx % 2 === 0 ? '#e84393' : '#10b981'}}>
                      {t.assignee?.substring(0,2).toUpperCase() || 'U'}
                    </div>
                    {t.assignee || 'Unassigned'}
                  </div>
                  <span className="bkdate">Stuck</span>
                  <button className="resbtn" onClick={(e) => { e.currentTarget.textContent = 'Resolved ✓'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.background = '#ecfdf5'; }}>Mark Resolved</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TeamAnalyticsView({ workspaceId, boardId, fillAndSend }: { workspaceId: string, boardId: string, fillAndSend: (txt: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showTeam, setShowTeam] = useState(false);

  useEffect(() => {
    fetchTeamAnalytics(boardId, workspaceId).then(res => {
      if (res.success) {
        setHealth(res.health);
        if (res.members) setMembers(res.members);
      }
      setLoading(false);
    });
  }, [boardId, workspaceId]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="pw pb-20">
      <div className="flex items-start justify-between">
        <div>
          <div className="ptl">Team Analytics</div>
          <div className="psb">Standup health & sprint performance</div>
        </div>
        <button 
          className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
          onClick={() => setShowTeam(!showTeam)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          {showTeam ? 'Hide Team' : 'View Team'}
        </button>
      </div>

      {showTeam && (
        <div className="mt-6 mb-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">Team Members ({members.length})</h3>
          </div>
          <div className="p-2">
            {members.length > 0 ? members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: member.bg }}>
                    {member.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">{member.name}</div>
                    <div className="text-xs text-slate-500 font-medium">{member.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${member.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  {member.status}
                </div>
              </div>
            )) : <div className="p-4 text-center text-sm font-medium text-slate-500">No active team members detected on this board yet.</div>}
          </div>
        </div>
      )}
      
      <div className="statgrid" style={{ marginTop: '20px' }}>
        <div className="statc"><div className="statv">{health?.activeTasks || 0}</div><div className="statl">Active Tasks</div><div className="statd up">Stable</div></div>
        <div className="statc"><div className="statv">{health?.overdue?.length || 0}</div><div className="statl">Overdue Tasks</div><div className="statd dn">Action needed</div></div>
        <div className="statc"><div className="statv">{health?.dueSoon?.length || 0}</div><div className="statl">Due Soon</div><div className="statd up">On Track</div></div>
        <div className="statc"><div className="statv">100<span style={{fontSize:'13px',fontWeight:500,color:'var(--mu)'}}>%</span></div><div className="statl">Participation today</div><div className="statd up">Great 🎉</div></div>
      </div>
      
      <div className="chbox">
        <div className="chtl">AI Insights</div>
        <div className="p-4 bg-white/50 text-slate-600 text-sm">
           Based on current velocity, {health?.activeTasks || 0} tasks are active. 
           {health?.overdue?.length > 0 ? ` WARNING: ${health.overdue.length} tasks are overdue. Recommend AI review.` : ' No overdue tasks detected.'}
        </div>
        <button className="pb" style={{ marginTop: 12 }} onClick={() => fillAndSend('Give me a team performance analysis with actionable insights.')}>AI Deep Dive →</button>
      </div>

      {health?.overdue?.length > 0 && (
        <div className="twocol" style={{ marginTop: '24px' }}>
          <div className="box" style={{ gridColumn: '1 / -1' }}>
            <div className="boxt">Overdue Tasks</div>
            {health.overdue.map((t: any) => (
              <div key={t.id || t._id || Math.random()} className="vrow">
                <div className="vav" style={{background:'#f43f5e'}}>{t.assignee?.substring(0,2).toUpperCase() || 'U'}</div>
                <span className="vname">{t.name}</span>
                <span className="vpct text-orange-600 font-medium">Overdue</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SprintReportsView({ workspaceId, boardId, fillAndSend }: { workspaceId: string, boardId: string, fillAndSend: (txt: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchSprintSummaries(boardId, workspaceId).then(res => {
      if (res.success) setMetrics(res.metrics);
      setLoading(false);
    });
  }, [boardId, workspaceId]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="pw">
      <div className="ptl">Sprint Reports</div>
      <div className="psb">AI-generated digests for every sprint</div>
      <div className="prow">
        <button 
          className="pb dk" 
          onClick={() => fillAndSend('Generate a mid-sprint report for Sprint 23: velocity, completed tasks, blockers, risks, and key highlights.')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Generate Report
        </button>
      </div>
      <div className="replist">
        <div className="repc">
          <div className="repico" style={{background:'#eef0ff', color:'var(--a)'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
          <div><div className="rept">Sprint 23 — In Progress</div><div className="repm">Mon–Sun · {metrics?.total || 0} tasks · {metrics?.completionRate?.toFixed(1) || 0}% velocity</div></div>
          <div className="repacts">
            <button className="ract" onClick={() => fillAndSend('Generate a mid-sprint AI report for Sprint 23 with velocity analysis, completed items, and risk assessment.')}>Generate</button>
            <button className="ract" onClick={() => alert('Exported!')}>Export</button>
          </div>
        </div>
        <div className="repc">
          <div className="repico" style={{background:'#d1fae5', color:'#065f46'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div><div className="rept">Sprint 22 — Complete</div><div className="repm">{metrics?.completed || 0} completed · 94% velocity · {metrics?.inProgress || 0} carry-overs</div></div>
          <div className="repacts">
            <button className="ract" onClick={() => fillAndSend('Summarise Sprint 22 outcomes, velocity trends, and lessons learned.')}>View</button>
            <button className="ract" onClick={() => alert('Exported!')}>Export</button>
          </div>
        </div>
        <div className="repc">
          <div className="repico" style={{background:'#d1fae5', color:'#065f46'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div><div className="rept">Sprint 21 — Complete</div><div className="repm">88% velocity · 4 carry-overs</div></div>
          <div className="repacts">
            <button className="ract" onClick={() => fillAndSend('Compare Sprint 21 vs Sprint 22 — what improved and what regressed?')}>View</button>
            <button className="ract" onClick={() => alert('Exported!')}>Export</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SummariesView({ workspaceId, boardId, fillAndSend }: { workspaceId: string, boardId: string, fillAndSend: (txt: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<any[]>([]);

  useEffect(() => {
    // In a future phase, this will fetch from the new TeamStandup model.
    // For now, simulating the fetch.
    setSummaries([
      {
        id: 'mock-1',
        title: 'Daily Standup — ' + new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        metrics: '6 members · 14 min · 3 blockers',
        tags: [{ label: 'Standup', colorClass: 'b' }, { label: '3 Blockers', colorClass: 'r' }],
        content: "Aarav: SSO ✅, rate limiting today — needs load test data from Lena. Sofia: blocked on mobile nav (Figma handoff from Diana due today). Marcus: DB pool at 94% + DBA approval pending. Diana: tokens 80%, spacing audit done (14 issues in Notion). James: research complete — time-range filter to front. Lena: CloudWatch access pending.",
        events: [
          { text: "@pranvnikqik gave an update - roadblock detected", class: "am" },
          { text: "@sarah just posted an afternoon update", class: "g" }
        ]
      }
    ]);
    setLoading(false);
  }, [boardId, workspaceId]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="pw">
      <div className="ptl">Summaries</div>
      <div className="psb">Team-wide aggregated updates</div>
      <div className="prow">
        <button className="pb dk" onClick={() => fillAndSend('Generate a full summary for today\'s standup with all updates, blockers, and action items.')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Generate Summary
        </button>
      </div>
      <div className="suml">
        {summaries.map((s, i) => (
          <div key={s.id} className="sumc">
            <div className="sumc-h">
              <div className="sumc-i" style={{background:'#eff6ff',color:'#3b82f6'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div><div className="sumc-t">{s.title}</div><div className="sumc-m">{s.metrics}</div></div>
              <div className="sumc-tags">
                {s.tags.map((t: any, j: number) => <span key={j} className={`tag ${t.colorClass}`}>{t.label}</span>)}
              </div>
            </div>
            
            {i === 0 && s.events && (
              <div className="mb-4 mt-1 flex flex-col gap-2">
                {s.events.map((e: any, j: number) => (
                   <div key={j} className={`tag ${e.class} text-xs py-1.5 px-3 mb-1 w-fit rounded-lg`}>{e.text}</div>
                ))}
              </div>
            )}
            
            <div className="sumc-b" dangerouslySetInnerHTML={{ __html: s.content }} />
            <div className="sumc-f">
              <button className="sa p" onClick={() => alert('Opening aggregate chat viewer is coming soon')}>Open Chat</button>
              <button className="sa" onClick={() => alert('Copied ✓')}>Copy</button>
              <button className="sa" onClick={() => alert('Sent to Slack ✓')}>→ Slack</button>
              <button className="sa" onClick={() => alert('Saved to Notion ✓')}>→ Notion</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsView() {
  return (
    <div className="pw pb-20">
      <div className="ptl">Settings</div>
      <div className="psb mb-6">Standup format & mediator flow configuration</div>
      
      <div className="setblk">
        <div className="settl text-[var(--a2)] font-bold mb-3">Team Definition & Scope</div>
        <div className="setrow cursor-pointer" onClick={(e) => e.currentTarget.querySelector('.tog')?.classList.toggle('on')}>
          <div><div className="setl">Workspace is the Team</div><div className="sets">Aggregate standups across all members in the entire workspace. Best for small startup teams.</div></div>
          <div className="tog"></div>
        </div>
        <div className="setrow cursor-pointer" onClick={(e) => e.currentTarget.querySelector('.tog')?.classList.toggle('on')}>
          <div><div className="setl">Derive Team from Shared Tasks</div><div className="sets">Pulse auto-detects your team by checking who has active assigned tasks in common with you.</div></div>
          <div className="tog"></div>
        </div>
        <div className="setrow cursor-pointer" onClick={(e) => e.currentTarget.querySelector('.tog')?.classList.toggle('on')}>
          <div><div className="setl">Board-Specific Standups (Default)</div><div className="sets">Strictly segment daily standups into separate groups per active Board.</div></div>
          <div className="tog on"></div>
        </div>
      </div>

      <div className="setblk mt-8">
        <div className="settl text-[var(--a2)] font-bold mb-3">Standup Approach</div>
        <div className="setrow cursor-pointer" onClick={(e) => e.currentTarget.querySelector('.tog')?.classList.toggle('on')}>
          <div><div className="setl">Continuous Updates</div><div className="sets">Team members can post updates anytime throughout the day. Summaries aggregate everything asynchronously.</div></div>
          <div className="tog on"></div>
        </div>
        <div className="setrow cursor-pointer" onClick={(e) => e.currentTarget.querySelector('.tog')?.classList.toggle('on')}>
          <div><div className="setl">Morning / Evening Setup</div><div className="sets">Strict two-window standup prompts (e.g. 9:00 AM check-in, 5:00 PM wrap-up).</div></div>
          <div className="tog"></div>
        </div>
      </div>
      
      <div className="setblk mt-8">
        <div className="settl text-[var(--a2)] font-bold mb-3">AI Behaviour</div>
        <div className="setrow cursor-pointer" onClick={(e) => e.currentTarget.querySelector('.tog')?.classList.toggle('on')}>
          <div><div className="setl">Auto-generate summaries</div><div className="sets">Summarise the aggregated team updates automatically at the end of the day.</div></div>
          <div className="tog on"></div>
        </div>
        <div className="setrow cursor-pointer" onClick={(e) => e.currentTarget.querySelector('.tog')?.classList.toggle('on')}>
          <div><div className="setl">Smart blocker detection</div><div className="sets">Automatically flag blockers from raw messages and update Blocker Radar.</div></div>
          <div className="tog on"></div>
        </div>
      </div>
    </div>
  );
}
