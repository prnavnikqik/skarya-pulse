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
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="ptl">Blocker Radar</div>
          <div className="psb text-slate-500">Tasks with no movement in the last 7 days.</div>
        </div>
        <button 
          onClick={() => fillAndSend('What are the active blockers here and what are your recommended resolutions for each?')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors"
        >
          <AlertCircle className="w-5 h-5" /> Ask Pulse for Resolutions
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">Clear Skies!</h3>
          <p className="text-slate-500">No stuck tasks currently detected.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map(t => (
            <div key={t.id} className="bg-white border border-rose-100 p-5 rounded-2xl shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">{t.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {t.assignee}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Stuck since {new Date(t.lastActive).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">{t.status}</span>
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="ptl">Team Analytics</div>
          <div className="psb text-slate-500">Board health and task distribution.</div>
        </div>
        <button 
          onClick={() => fillAndSend('Give me a team performance analysis with actionable insights.')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors"
        >
          <TrendingUp className="w-5 h-5" /> Analyze with Pulse
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Total Active</div>
          <div className="text-4xl font-black text-slate-800">{health?.activeTasks || 0}</div>
        </div>
        <div className="bg-white border border-orange-200 p-6 rounded-3xl shadow-sm bg-orange-50/30">
          <div className="text-orange-500 text-sm font-bold uppercase tracking-wider mb-2">Overdue</div>
          <div className="text-4xl font-black text-orange-600">{health?.overdue?.length || 0}</div>
        </div>
        <div className="bg-white border border-emerald-200 p-6 rounded-3xl shadow-sm bg-emerald-50/30">
          <div className="text-emerald-600 text-sm font-bold uppercase tracking-wider mb-2">Due Soon</div>
          <div className="text-4xl font-black text-emerald-600">{health?.dueSoon?.length || 0}</div>
        </div>
      </div>
      
      {/* List Overdue tasks quickly */}
      {health?.overdue?.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-700 mb-4">Overdue Tasks</h3>
          <div className="grid gap-3">
            {health.overdue.map((t: any) => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between shadow-sm">
                <span className="font-medium">{t.name}</span>
                <span className="text-sm text-slate-400">{t.assignee}</span>
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
