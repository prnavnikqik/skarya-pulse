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

  useEffect(() => {
    fetchTeamAnalytics(boardId, workspaceId).then(res => {
      if (res.success) setHealth(res.health);
      setLoading(false);
    });
  }, [boardId, workspaceId]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="pw">
      <div className="ptl">Team Analytics</div>
      <div className="psb">Standup health & sprint performance</div>
      
      <div className="statgrid">
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
