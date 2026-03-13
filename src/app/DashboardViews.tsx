'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, TrendingUp, CheckCircle2, Clock, Users, AlertTriangle, Target, Zap, ArrowUpRight, Shield, BarChart3, Activity } from 'lucide-react';
import { fetchBlockerRadar, fetchTeamAnalytics, fetchSprintSummaries, fetchSummaries } from '@/app/actions/dashboards';

// ════════════════════════════════════════════
// BLOCKER RADAR — Risk Intelligence Dashboard
// ════════════════════════════════════════════
export function BlockerRadarView({ workspaceId, boardId, fillAndSend }: { workspaceId: string, boardId: string, fillAndSend: (txt: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlockerRadar(boardId, workspaceId).then(res => {
      if (res.success) setData(res);
      else setError(res.error || 'Failed to load');
      setLoading(false);
    });
  }, [boardId, workspaceId]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (error) return <div className="p-6 text-red-500 bg-red-50 rounded-xl">{error}</div>;

  const summary = data?.summary || {};
  const tasks = data?.tasks || [];
  const risks = data?.deadlineRisks || [];
  const sevColors: any = { critical: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', dot: '#ef4444' }, high: { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', dot: '#f97316' }, medium: { bg: '#fefce8', border: '#fde047', text: '#854d0e', dot: '#eab308' }, low: { bg: '#f0fdf4', border: '#86efac', text: '#166534', dot: '#22c55e' } };

  return (
    <div className="pw pb-20">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="ptl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'}}><Shield className="w-[18px] h-[18px] text-white" /></div>
            Blocker Radar
          </div>
          <div className="psb">Real-time risk detection across your board — identify and resolve bottlenecks before they cascade</div>
        </div>
      </div>

      {/* Risk Summary Cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, margin:'20px 0'}}>
        {[
          { label: 'Critical', count: summary.criticalCount || 0, color: '#ef4444', bg: '#fef2f2' },
          { label: 'High Risk', count: summary.highCount || 0, color: '#f97316', bg: '#fff7ed' },
          { label: 'At-Risk Deadlines', count: summary.totalRisks || 0, color: '#eab308', bg: '#fefce8' },
          { label: 'Unassigned Work', count: summary.unassignedCount || 0, color: '#6366f1', bg: '#eef2ff' },
        ].map((c, i) => (
          <div key={i} style={{background: c.bg, border: `1px solid ${c.color}22`, borderRadius:16, padding:'18px 20px', position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:c.color}} />
            <div style={{fontSize:28, fontWeight:800, color:c.color, letterSpacing:'-1px'}}>{c.count}</div>
            <div style={{fontSize:11.5, fontWeight:600, color:c.color, opacity:0.8, marginTop:2}}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="prow" style={{marginBottom: 16}}>
        <button className="pb dk" onClick={() => fillAndSend('Analyze all current blockers on this board. For each one, tell me: who is blocked, how long, what the root cause likely is, and your recommended resolution.')}>
          <Zap className="w-3.5 h-3.5" /> AI Resolution Plan
        </button>
        <button className="pb" onClick={() => fillAndSend('Which blockers should I escalate to leadership today? Prioritize by business impact.')}>Escalation Report</button>
        <button className="pb" onClick={() => fillAndSend('What tasks are at risk of missing their deadline this week? Give me a mitigation plan.')}>Deadline Risk Scan</button>
      </div>

      {tasks.length === 0 && risks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-emerald-200 rounded-3xl" style={{background:'#f0fdf4'}}>
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-emerald-800">All Clear — No Blockers Detected</h3>
          <p className="text-emerald-600 text-sm mt-1">Your team is moving at full velocity. No stuck tasks found.</p>
        </div>
      ) : (
        <div>
          {/* Stuck Tasks */}
          {tasks.length > 0 && (
            <div style={{marginBottom: 24}}>
              <div style={{fontSize:13, fontWeight:700, color:'#111', marginBottom:12, display:'flex', alignItems:'center', gap:8}}>
                <AlertTriangle className="w-4 h-4 text-red-500" /> Stuck Tasks — No Movement
              </div>
              <div className="bklist">
                {tasks.map((t: any) => {
                  const sev = sevColors[t.severity] || sevColors.medium;
                  return (
                    <div key={t.id || Math.random()} style={{background:'#fff', border:`1px solid ${sev.border}`, borderLeft:`4px solid ${sev.dot}`, borderRadius:16, padding:'18px 22px', transition:'all .2s'}}>
                      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                            <span style={{fontSize:10, fontWeight:700, padding:'2px 10px', borderRadius:20, background:sev.bg, color:sev.text, border:`1px solid ${sev.border}`, textTransform:'uppercase', letterSpacing:'0.5px'}}>{t.severity}</span>
                            <span style={{fontSize:10, color:'#9ca3af', fontFamily:'monospace'}}>{t.daysStuck}d stuck</span>
                          </div>
                          <div style={{fontSize:14, fontWeight:600, color:'#111', marginBottom:4}}>{t.name}</div>
                          <div style={{fontSize:12, color:'#6b7280', lineHeight:1.6}}>
                            This task has been stalled for <strong>{t.daysStuck} days</strong> with no progress. Current status: <strong>{t.status}</strong>.
                          </div>
                        </div>
                        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0}}>
                          <div style={{display:'flex', alignItems:'center', gap:6}}>
                            <div style={{width:22, height:22, borderRadius:'50%', background:sev.dot, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff'}}>
                              {t.assignee?.substring(0,2).toUpperCase() || 'U'}
                            </div>
                            <span style={{fontSize:11.5, color:'#6b7280'}}>{t.assignee || 'Unassigned'}</span>
                          </div>
                          <button onClick={() => fillAndSend(`What's blocking "${t.name}" and how can we unblock it? Suggest concrete next steps.`)} style={{fontSize:11, fontWeight:600, color:'#6366f1', background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:8, padding:'4px 12px', cursor:'pointer'}}>
                            AI Diagnose →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deadline Risks */}
          {risks.length > 0 && (
            <div>
              <div style={{fontSize:13, fontWeight:700, color:'#111', marginBottom:12, display:'flex', alignItems:'center', gap:8}}>
                <Clock className="w-4 h-4 text-amber-500" /> Deadline Risks — Due Soon, Not On Track
              </div>
              <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden'}}>
                {risks.map((r: any, i: number) => (
                  <div key={r.id || i} style={{display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom: i < risks.length - 1 ? '1px solid #f3f4f6' : 'none'}}>
                    <div style={{width:8, height:8, borderRadius:'50%', background: (r.completion || 0) < 25 ? '#ef4444' : '#eab308', flexShrink:0}} />
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:13, fontWeight:600, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.name}</div>
                      <div style={{fontSize:11, color:'#9ca3af'}}>{r.assignee || 'Unassigned'}</div>
                    </div>
                    <div style={{fontSize:11, fontWeight:600, color:'#ef4444', background:'#fef2f2', padding:'3px 10px', borderRadius:20}}>
                      Due {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-US', {month:'short', day:'numeric'}) : 'Soon'}
                    </div>
                    <div style={{fontSize:11, color:'#9ca3af'}}>{r.completion || 0}% done</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// TEAM ANALYTICS — Workload & Performance
// ════════════════════════════════════════════
export function TeamAnalyticsView({ workspaceId, boardId, fillAndSend }: { workspaceId: string, boardId: string, fillAndSend: (txt: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchTeamAnalytics(boardId, workspaceId).then(res => {
      if (res.success) setData(res);
      setLoading(false);
    });
  }, [boardId, workspaceId]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>;

  const health = data?.health || {};
  const members = data?.members || [];
  const metrics = data?.metrics || {};
  const statusDist = data?.distributions?.status || {};
  const priorityDist = data?.distributions?.priority || {};
  const risks = data?.risks || [];

  const completionPct = metrics.completionRate?.toFixed(0) || 0;
  const totalStatus = Object.values(statusDist).reduce((a: any, b: any) => a + b, 0) as number;

  // Color map for status bars
  const statusColors: any = { 'Done': '#10b981', 'Completed': '#10b981', 'In Progress': '#3b82f6', 'To Do': '#9ca3af', 'Review': '#8b5cf6', 'Testing': '#f59e0b' };

  return (
    <div className="pw pb-20">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="ptl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'}}><BarChart3 className="w-[18px] h-[18px] text-white" /></div>
            Team Analytics
          </div>
          <div className="psb">Team workload distribution, velocity metrics, and performance insights — powered by live board data</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, margin:'20px 0'}}>
        {[
          { label: 'Sprint Velocity', value: `${completionPct}%`, sub: `${metrics.completed || 0} of ${metrics.total || 0} tasks`, color: Number(completionPct) >= 70 ? '#10b981' : '#f59e0b' },
          { label: 'In Progress', value: metrics.inProgress || 0, sub: 'Active right now', color: '#3b82f6' },
          { label: 'Overdue', value: health.overdue?.length || 0, sub: 'Need attention', color: (health.overdue?.length || 0) > 0 ? '#ef4444' : '#10b981' },
          { label: 'Team Size', value: members.length, sub: 'Active contributors', color: '#8b5cf6' },
        ].map((c, i) => (
          <div key={i} style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, padding:'20px', position:'relative'}}>
            <div style={{fontSize:11.5, fontWeight:500, color:'#9ca3af', marginBottom:6}}>{c.label}</div>
            <div style={{fontSize:28, fontWeight:800, color:c.color, letterSpacing:'-1px'}}>{c.value}</div>
            <div style={{fontSize:11, color:'#9ca3af', marginTop:2}}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="prow" style={{marginBottom:20}}>
        <button className="pb dk" onClick={() => fillAndSend('Give me a comprehensive team performance analysis. Who is overloaded? Who has capacity? What tasks should be redistributed?')}>
          <Users className="w-3.5 h-3.5" /> Workload Analysis
        </button>
        <button className="pb" onClick={() => fillAndSend('Based on current velocity, will we meet our sprint commitments? What are the risks?')}>Sprint Forecast</button>
        <button className="pb" onClick={() => fillAndSend('Identify the top 3 bottlenecks slowing down the team and suggest fixes.')}>Find Bottlenecks</button>
      </div>

      {/* Status Distribution */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20}}>
        <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:18, padding:22}}>
          <div style={{fontSize:13, fontWeight:700, color:'#111', marginBottom:16}}>Task Status Distribution</div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {Object.entries(statusDist).map(([status, count]: any) => (
              <div key={status}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4}}>
                  <span style={{color:'#374151', fontWeight:500}}>{status}</span>
                  <span style={{color:'#9ca3af', fontWeight:600}}>{count}</span>
                </div>
                <div style={{height:6, background:'#f3f4f6', borderRadius:3, overflow:'hidden'}}>
                  <div style={{height:'100%', width:`${totalStatus > 0 ? (count/totalStatus)*100 : 0}%`, background: statusColors[status] || '#6366f1', borderRadius:3, transition:'width 0.5s ease'}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:18, padding:22}}>
          <div style={{fontSize:13, fontWeight:700, color:'#111', marginBottom:16}}>Priority Breakdown</div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {Object.entries(priorityDist).map(([priority, count]: any) => {
              const pColors: any = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#10b981', None: '#9ca3af' };
              return (
                <div key={priority}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4}}>
                    <span style={{display:'flex', alignItems:'center', gap:6}}>
                      <span style={{width:8, height:8, borderRadius:'50%', background:pColors[priority] || '#9ca3af'}} />
                      <span style={{color:'#374151', fontWeight:500}}>{priority}</span>
                    </span>
                    <span style={{color:'#9ca3af', fontWeight:600}}>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Workload Table */}
      {members.length > 0 && (
        <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:18, overflow:'hidden'}}>
          <div style={{padding:'18px 22px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontSize:13, fontWeight:700, color:'#111'}}>Team Workload</div>
            <div style={{fontSize:11, color:'#9ca3af'}}>{members.length} contributors</div>
          </div>
          <div>
            {members.map((m: any, i: number) => (
              <div key={m.id || i} style={{display:'flex', alignItems:'center', gap:14, padding:'14px 22px', borderBottom: i < members.length - 1 ? '1px solid #f9fafb' : 'none', transition:'background 0.13s'}} className="hover:bg-slate-50">
                <div style={{width:36, height:36, borderRadius:10, background:m.bg || '#6366f1', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:12, flexShrink:0}}>{m.avatar}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13, fontWeight:600, color:'#111'}}>{m.name}</div>
                  <div style={{fontSize:11, color:'#9ca3af'}}>{m.role} · {m.email}</div>
                </div>
                <div style={{display:'flex', gap:20, alignItems:'center', flexShrink:0}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:16, fontWeight:700, color:'#111'}}>{m.totalTasks}</div>
                    <div style={{fontSize:10, color:'#9ca3af'}}>Total</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:16, fontWeight:700, color:'#10b981'}}>{m.completed}</div>
                    <div style={{fontSize:10, color:'#9ca3af'}}>Done</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:16, fontWeight:700, color:'#3b82f6'}}>{m.active}</div>
                    <div style={{fontSize:10, color:'#9ca3af'}}>Active</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:16, fontWeight:700, color: m.overdue > 0 ? '#ef4444' : '#10b981'}}>{m.overdue}</div>
                    <div style={{fontSize:10, color:'#9ca3af'}}>Overdue</div>
                  </div>
                  <div style={{width:60}}>
                    <div style={{height:5, background:'#f3f4f6', borderRadius:3, overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${m.completionRate}%`, background: m.completionRate >= 70 ? '#10b981' : m.completionRate >= 40 ? '#eab308' : '#ef4444', borderRadius:3}} />
                    </div>
                    <div style={{fontSize:10, color:'#9ca3af', textAlign:'right', marginTop:2}}>{m.completionRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// SPRINT REPORTS — Sprint Intelligence
// ════════════════════════════════════════════
export function SprintReportsView({ workspaceId, boardId, fillAndSend }: { workspaceId: string, boardId: string, fillAndSend: (txt: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchSprintSummaries(boardId, workspaceId).then(res => {
      if (res.success) setData(res);
      setLoading(false);
    });
  }, [boardId, workspaceId]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>;

  const metrics = data?.metrics || {};
  const health = data?.health || {};
  const risks = data?.risks || [];
  const recentlyCompleted = data?.recentlyCompleted || [];
  const highPriority = data?.highPriorityOpen || [];
  const completionPct = metrics.completionRate?.toFixed(1) || 0;

  return (
    <div className="pw pb-20">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="ptl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)'}}><Activity className="w-[18px] h-[18px] text-white" /></div>
            Sprint Report
          </div>
          <div className="psb">Live sprint health snapshot — track velocity, identify risks, and generate stakeholder-ready reports</div>
        </div>
      </div>

      {/* Sprint Health Hero */}
      <div style={{background:'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)', borderRadius:20, padding:'28px 30px', margin:'20px 0', color:'#fff', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:0, right:0, width:200, height:200, background:'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius:'50%'}} />
        <div style={{fontSize:12, fontWeight:600, opacity:0.7, textTransform:'uppercase', letterSpacing:'1px', marginBottom:16}}>Current Sprint · Live</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:20}}>
          {[
            { label: 'Total Tasks', value: metrics.total || 0 },
            { label: 'Completed', value: metrics.completed || 0 },
            { label: 'In Progress', value: metrics.inProgress || 0 },
            { label: 'Not Started', value: metrics.notStarted || 0 },
            { label: 'Velocity', value: `${completionPct}%` },
          ].map((m, i) => (
            <div key={i}>
              <div style={{fontSize:28, fontWeight:800, letterSpacing:'-1px'}}>{m.value}</div>
              <div style={{fontSize:11, opacity:0.6, marginTop:2}}>{m.label}</div>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div style={{marginTop:20, height:6, background:'rgba(255,255,255,0.15)', borderRadius:3, overflow:'hidden'}}>
          <div style={{height:'100%', width:`${completionPct}%`, background:'linear-gradient(90deg, #34d399, #10b981)', borderRadius:3, transition:'width 0.8s ease'}} />
        </div>
      </div>

      <div className="prow" style={{marginBottom:20}}>
        <button className="pb dk" onClick={() => fillAndSend('Generate a comprehensive sprint report with: velocity analysis, completed items, remaining work, blockers, risks, and recommendations for the next sprint.')}>
          <Zap className="w-3.5 h-3.5" /> Generate Full Report
        </button>
        <button className="pb" onClick={() => fillAndSend('Create an executive summary of this sprint suitable for a leadership review meeting. Keep it concise with metrics and key decisions needed.')}>Executive Summary</button>
        <button className="pb" onClick={() => fillAndSend('Compare our current sprint velocity with what would be needed to complete all remaining work on time. Are we on track?')}>Forecast</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        {/* Recently Completed */}
        <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:18, overflow:'hidden'}}>
          <div style={{padding:'16px 20px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:8}}>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span style={{fontSize:13, fontWeight:700, color:'#111'}}>Recently Completed</span>
            <span style={{fontSize:11, color:'#9ca3af', marginLeft:'auto'}}>{recentlyCompleted.length} items</span>
          </div>
          {recentlyCompleted.length > 0 ? recentlyCompleted.map((t: any, i: number) => (
            <div key={t.id || i} style={{display:'flex', alignItems:'center', gap:10, padding:'12px 20px', borderBottom: i < recentlyCompleted.length-1 ? '1px solid #f9fafb' : 'none'}}>
              <div style={{width:6, height:6, borderRadius:'50%', background:'#10b981', flexShrink:0}} />
              <span style={{fontSize:12.5, color:'#374151', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.name}</span>
              <span style={{fontSize:11, color:'#9ca3af', flexShrink:0}}>{t.assignee}</span>
            </div>
          )) : <div style={{padding:'24px 20px', textAlign:'center', color:'#9ca3af', fontSize:12}}>No recently completed tasks</div>}
        </div>

        {/* High Priority Open */}
        <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:18, overflow:'hidden'}}>
          <div style={{padding:'16px 20px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:8}}>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span style={{fontSize:13, fontWeight:700, color:'#111'}}>High Priority — Still Open</span>
            <span style={{fontSize:11, color:'#9ca3af', marginLeft:'auto'}}>{highPriority.length} items</span>
          </div>
          {highPriority.length > 0 ? highPriority.map((t: any, i: number) => (
            <div key={t.id || i} style={{display:'flex', alignItems:'center', gap:10, padding:'12px 20px', borderBottom: i < highPriority.length-1 ? '1px solid #f9fafb' : 'none'}}>
              <div style={{width:6, height:6, borderRadius:'50%', background: t.priority === 'Critical' ? '#ef4444' : '#f97316', flexShrink:0}} />
              <span style={{fontSize:12.5, color:'#374151', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.name}</span>
              <span style={{fontSize:10, fontWeight:600, color: t.priority === 'Critical' ? '#ef4444' : '#f97316', background: t.priority === 'Critical' ? '#fef2f2' : '#fff7ed', padding:'2px 8px', borderRadius:20}}>{t.priority}</span>
            </div>
          )) : <div style={{padding:'24px 20px', textAlign:'center', color:'#9ca3af', fontSize:12}}>No high priority open items ✓</div>}
        </div>
      </div>

      {/* Risks Section */}
      {risks.length > 0 && (
        <div style={{marginTop:20, background:'#fff', border:'1px solid #fde68a', borderRadius:18, padding:22}}>
          <div style={{fontSize:13, fontWeight:700, color:'#92400e', marginBottom:14, display:'flex', alignItems:'center', gap:8}}>
            <AlertCircle className="w-4 h-4" /> Sprint Risks — {risks.length} tasks at risk of missing deadline
          </div>
          {risks.slice(0, 5).map((r: any, i: number) => (
            <div key={r.id || i} style={{display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < Math.min(risks.length, 5) - 1 ? '1px solid #fef3c7' : 'none'}}>
              <span style={{fontSize:12.5, color:'#374151', flex:1}}>{r.name}</span>
              <span style={{fontSize:11, color:'#92400e'}}>Due {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-US', {month:'short', day:'numeric'}) : '—'}</span>
              <span style={{fontSize:11, color:'#9ca3af'}}>{r.completion || 0}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// SUMMARIES — Daily Team Pulse
// ════════════════════════════════════════════
export function SummariesView({ workspaceId, boardId, fillAndSend }: { workspaceId: string, boardId: string, fillAndSend: (txt: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchSummaries(boardId, workspaceId).then(res => {
      if (res.success) setData(res);
      setLoading(false);
    });
  }, [boardId, workspaceId]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>;

  const snapshot = data?.snapshot || {};
  const memberUpdates = data?.memberUpdates || [];
  const blockerCount = data?.blockerCount || 0;
  const stuckTasks = data?.stuckTasks || [];

  return (
    <div className="pw pb-20">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="ptl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}><Target className="w-[18px] h-[18px] text-white" /></div>
            Daily Pulse Summary
          </div>
          <div className="psb">{snapshot.date || 'Today'} — Team-wide activity snapshot and individual progress</div>
        </div>
      </div>

      {/* Daily Pulse Banner */}
      <div style={{background:'linear-gradient(135deg, #065f46 0%, #047857 50%, #10b981 100%)', borderRadius:20, padding:'24px 28px', margin:'20px 0', color:'#fff', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:-30, right:-30, width:150, height:150, background:'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', borderRadius:'50%'}} />
        <div style={{fontSize:12, fontWeight:600, opacity:0.7, textTransform:'uppercase', letterSpacing:'1px', marginBottom:14}}>Today's Pulse</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20}}>
          {[
            { label: 'Active Tasks', value: snapshot.totalActive || 0 },
            { label: 'Completion', value: `${(snapshot.completionRate || 0).toFixed(0)}%` },
            { label: 'Overdue', value: snapshot.overdueCount || 0 },
            { label: 'Due Soon', value: snapshot.dueSoonCount || 0 },
          ].map((m, i) => (
            <div key={i}>
              <div style={{fontSize:26, fontWeight:800, letterSpacing:'-1px'}}>{m.value}</div>
              <div style={{fontSize:11, opacity:0.6, marginTop:2}}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="prow" style={{marginBottom:20}}>
        <button className="pb dk" onClick={() => fillAndSend('Generate a comprehensive daily summary: who\'s working on what, blockers, completed items, and action items for follow-up.')}>
          <Zap className="w-3.5 h-3.5" /> Generate AI Summary
        </button>
        <button className="pb" onClick={() => fillAndSend('What are the top 3 things the team should focus on today based on priorities and deadlines?')}>Today's Focus</button>
        <button className="pb" onClick={() => fillAndSend('Draft a daily standup digest I can share on Slack with the team.')}>Slack Digest</button>
      </div>

      {/* Per-Member Activity */}
      {memberUpdates.length > 0 && (
        <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:18, overflow:'hidden', marginBottom:20}}>
          <div style={{padding:'18px 22px', borderBottom:'1px solid #f3f4f6'}}>
            <div style={{fontSize:13, fontWeight:700, color:'#111'}}>Team Member Activity</div>
            <div style={{fontSize:11, color:'#9ca3af', marginTop:2}}>{memberUpdates.length} contributors on this board</div>
          </div>
          {memberUpdates.map((m: any, i: number) => (
            <div key={m.email || i} style={{padding:'16px 22px', borderBottom: i < memberUpdates.length-1 ? '1px solid #f9fafb' : 'none'}}>
              <div style={{display:'flex', alignItems:'center', gap:14}}>
                <div style={{width:38, height:38, borderRadius:10, background: m.bg || '#6366f1', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13, flexShrink:0}}>{m.avatar}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span style={{fontSize:13, fontWeight:600, color:'#111'}}>{m.name}</span>
                    {m.blocked > 0 && <span style={{fontSize:10, fontWeight:600, color:'#ef4444', background:'#fef2f2', padding:'1px 8px', borderRadius:20}}>⚠ {m.blocked} blocked</span>}
                  </div>
                  <div style={{fontSize:11, color:'#9ca3af', marginTop:2}}>
                    {m.completed} done · {m.inProgress} in progress · {m.totalTasks} total
                  </div>
                </div>
                <div style={{display:'flex', gap:6, flexShrink:0}}>
                  <div style={{width:48, textAlign:'center'}}>
                    <div style={{fontSize:16, fontWeight:700, color:'#10b981'}}>{m.completed}</div>
                    <div style={{fontSize:9, color:'#9ca3af'}}>Done</div>
                  </div>
                  <div style={{width:48, textAlign:'center'}}>
                    <div style={{fontSize:16, fontWeight:700, color:'#3b82f6'}}>{m.inProgress}</div>
                    <div style={{fontSize:9, color:'#9ca3af'}}>WIP</div>
                  </div>
                </div>
              </div>
              {m.topTasks && m.topTasks.length > 0 && (
                <div style={{marginTop:10, marginLeft:52, display:'flex', flexDirection:'column', gap:4}}>
                  {m.topTasks.map((task: string, j: number) => (
                    <div key={j} style={{fontSize:11.5, color:'#6b7280', display:'flex', alignItems:'center', gap:6}}>
                      <div style={{width:5, height:5, borderRadius:'50%', background:'#3b82f6', flexShrink:0}} />
                      {task}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Blockers Alert */}
      {blockerCount > 0 && (
        <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderRadius:18, padding:22}}>
          <div style={{fontSize:13, fontWeight:700, color:'#991b1b', marginBottom:12, display:'flex', alignItems:'center', gap:8}}>
            <AlertTriangle className="w-4 h-4" /> {blockerCount} Potential Blockers Detected
          </div>
          {stuckTasks.slice(0, 4).map((t: any, i: number) => (
            <div key={t.id || i} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < Math.min(stuckTasks.length, 4) - 1 ? '1px solid #fee2e2' : 'none'}}>
              <div style={{width:6, height:6, borderRadius:'50%', background:'#ef4444', flexShrink:0}} />
              <span style={{fontSize:12, color:'#991b1b', flex:1}}>{t.name}</span>
              <span style={{fontSize:11, color:'#b91c1c'}}>{t.assignee || 'Unassigned'}</span>
            </div>
          ))}
          <button className="pb" style={{marginTop:12}} onClick={() => fillAndSend('Analyze these blockers and suggest resolutions for each one.')}>AI Resolve →</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// SETTINGS (unchanged)
// ════════════════════════════════════════════
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
