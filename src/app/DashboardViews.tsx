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
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="ptl">Sprint Report</div>
          <div className="psb text-slate-500">Current sprint metrics.</div>
        </div>
        <button 
          onClick={() => fillAndSend('Draft a full sprint report: velocity, completed tasks, blockers, risks, and highlights.')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
        >
          <TrendingUp className="w-5 h-5" /> Draft Full Report with Pulse
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="p-6 bg-white border border-slate-200 rounded-3xl">
           <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Tasks</div>
           <div className="text-3xl font-black">{metrics?.total || 0}</div>
         </div>
         <div className="p-6 bg-white border border-emerald-200 rounded-3xl bg-emerald-50/50">
           <div className="text-emerald-600 text-xs font-bold uppercase mb-1">Completed</div>
           <div className="text-3xl font-black text-emerald-600">{metrics?.completed || 0}</div>
         </div>
         <div className="p-6 bg-white border border-amber-200 rounded-3xl bg-amber-50/50">
           <div className="text-amber-600 text-xs font-bold uppercase mb-1">In Progress</div>
           <div className="text-3xl font-black text-amber-600">{metrics?.inProgress || 0}</div>
         </div>
         <div className="p-6 bg-white border border-slate-200 rounded-3xl">
           <div className="text-slate-500 text-xs font-bold uppercase mb-1">Not Started</div>
           <div className="text-3xl font-black">{metrics?.notStarted || 0}</div>
         </div>
      </div>
      
      <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
         <div className="flex justify-between items-center mb-4">
           <div className="font-bold text-slate-700">Completion Rate</div>
           <div className="font-black text-indigo-600 text-2xl">{metrics?.completionRate?.toFixed(1) || 0}%</div>
         </div>
         <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
           <div className="bg-indigo-500 h-4 rounded-full" style={{ width: `${metrics?.completionRate || 0}%` }}></div>
         </div>
      </div>
    </div>
  );
}
