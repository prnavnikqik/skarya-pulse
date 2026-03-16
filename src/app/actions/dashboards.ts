'use server';
import TeamStandup from '@/models/TeamStandup';
import connectToDatabase from '@/lib/mongoose';

import { TaskReader } from '@/integrations/task-reader';

export async function fetchBlockerRadar(boardId: string, workspaceId: string) {
  try {
    const stuckTasks = await TaskReader.detectStuckTasks(boardId, workspaceId, 7);
    const deadlineRisks = await TaskReader.predictDeadlineRisks(boardId, workspaceId);
    const health = await TaskReader.getBoardHealth(boardId, workspaceId);
    
    // Categorize by severity based on real data signals
    const categorized = stuckTasks.map((t: any) => {
      const daysStuck = t.lastActive 
        ? Math.floor((Date.now() - new Date(t.lastActive).getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      
      let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
      if (daysStuck > 14) severity = 'critical';
      else if (daysStuck > 7) severity = 'high';
      else if (daysStuck > 3) severity = 'medium';
      else severity = 'low';

      return { ...t, daysStuck, severity };
    });

    // Sort by severity
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    categorized.sort((a: any, b: any) => severityOrder[a.severity] - severityOrder[b.severity]);

    return { 
      success: true, 
      tasks: categorized, 
      deadlineRisks,
      summary: {
        criticalCount: categorized.filter((t: any) => t.severity === 'critical').length,
        highCount: categorized.filter((t: any) => t.severity === 'high').length,
        mediumCount: categorized.filter((t: any) => t.severity === 'medium').length,
        lowCount: categorized.filter((t: any) => t.severity === 'low').length,
        totalBlockers: categorized.length,
        totalRisks: deadlineRisks.length,
        overdueCount: health.overdue?.length || 0,
        unassignedCount: health.noAssignee?.length || 0
      }
    };
  } catch (error: any) {
    console.error("fetchBlockerRadar error:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchTeamAnalytics(boardId: string, workspaceId: string) {
  try {
    const health = await TaskReader.getBoardHealth(boardId, workspaceId);
    const members = await TaskReader.getTeamMembers(boardId, workspaceId);
    const metrics = await TaskReader.getSprintMetrics(boardId, workspaceId);
    const risks = await TaskReader.predictDeadlineRisks(boardId, workspaceId);

    // Build per-member workload from the full task list
    const response = await (await import('@/integrations/skarya-client')).skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
    const allTasks = Array.isArray(response.data) ? response.data : (response.data?.tasks || []);
    
    // Compute workload distribution
    const memberWorkload = members.map((m: any) => {
      const memberTasks = allTasks.filter((t: any) => {
        return t.assigneePrimary?.email?.toLowerCase() === m.email?.toLowerCase();
      });
      const completed = memberTasks.filter((t: any) => t.statusCategory === 'completed').length;
      const active = memberTasks.filter((t: any) => t.statusCategory !== 'completed').length;
      const overdue = memberTasks.filter((t: any) => {
        if (t.statusCategory === 'completed') return false;
        return t.dueDate && new Date(t.dueDate) < new Date();
      }).length;

      return {
        ...m,
        totalTasks: memberTasks.length,
        completed,
        active,
        overdue,
        completionRate: memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0
      };
    });

    // Status distribution for chart
    const statusMap: Record<string, number> = {};
    allTasks.forEach((t: any) => {
      const status = t.status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    // Priority distribution
    const priorityMap: Record<string, number> = {};
    allTasks.forEach((t: any) => {
      const priority = t.priority || 'None';
      priorityMap[priority] = (priorityMap[priority] || 0) + 1;
    });

    return { 
      success: true, 
      health, 
      members: memberWorkload,
      metrics,
      risks,
      distributions: {
        status: statusMap,
        priority: priorityMap
      }
    };
  } catch (error: any) {
    console.error("fetchTeamAnalytics error:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchSprintSummaries(boardId: string, workspaceId: string) {
  try {
    const metrics = await TaskReader.getSprintMetrics(boardId, workspaceId);
    const health = await TaskReader.getBoardHealth(boardId, workspaceId);
    const risks = await TaskReader.predictDeadlineRisks(boardId, workspaceId);
    const members = await TaskReader.getTeamMembers(boardId, workspaceId);

    // Build a richer sprint snapshot
    const response = await (await import('@/integrations/skarya-client')).skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
    const allTasks = Array.isArray(response.data) ? response.data : (response.data?.tasks || []);

    // Recently completed (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentlyCompleted = allTasks.filter((t: any) => {
      if (t.statusCategory !== 'completed') return false;
      // use updatedAt or startDate as proxy
      const updated = t.updatedAt ? new Date(t.updatedAt) : null;
      return updated && updated > sevenDaysAgo;
    });

    // High priority items still open
    const highPriorityOpen = allTasks.filter((t: any) => 
      (t.priority === 'High' || t.priority === 'Critical') && t.statusCategory !== 'completed'
    );

    return { 
      success: true, 
      metrics,
      health,
      risks,
      recentlyCompleted: recentlyCompleted.slice(0, 8).map((t: any) => ({
        id: t._id, name: t.name, assignee: t.assigneePrimary?.name || 'Unassigned'
      })),
      highPriorityOpen: highPriorityOpen.slice(0, 8).map((t: any) => ({
        id: t._id, name: t.name, status: t.status, priority: t.priority, 
        assignee: t.assigneePrimary?.name || 'Unassigned',
        dueDate: t.dueDate
      })),
      teamSize: members.length,
      totalTasks: allTasks.length
    };
  } catch (error: any) {
    console.error("fetchSprintSummaries error:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchSummaries(boardId: string, workspaceId: string) {
  try {
    const health = await TaskReader.getBoardHealth(boardId, workspaceId);
    const metrics = await TaskReader.getSprintMetrics(boardId, workspaceId);
    const members = await TaskReader.getTeamMembers(boardId, workspaceId);
    const stuckTasks = await TaskReader.detectStuckTasks(boardId, workspaceId, 3);

    // Build daily pulse snapshot from real data
    const response = await (await import('@/integrations/skarya-client')).skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
    const allTasks = Array.isArray(response.data) ? response.data : (response.data?.tasks || []);

    // Group tasks by assignee for individual summaries
    const memberUpdates = members.map((m: any) => {
      const myTasks = allTasks.filter((t: any) => 
        t.assigneePrimary?.email?.toLowerCase() === m.email?.toLowerCase()
      );
      const myCompleted = myTasks.filter((t: any) => t.statusCategory === 'completed');
      const myInProgress = myTasks.filter((t: any) => t.statusCategory === 'in_progress');
      const myBlocked = myTasks.filter((t: any) => {
        if (t.statusCategory === 'completed') return false;
        const lastActive = t.startDate ? new Date(t.startDate) : null;
        return lastActive && (Date.now() - lastActive.getTime()) > 3 * 24 * 60 * 60 * 1000;
      });

      return {
        name: m.name,
        email: m.email,
        avatar: m.avatar,
        bg: m.bg,
        completed: myCompleted.length,
        inProgress: myInProgress.length,
        blocked: myBlocked.length,
        totalTasks: myTasks.length,
        topTasks: myInProgress.slice(0, 3).map((t: any) => t.name)
      };
    });

    return {
      success: true,
      memberUpdates,
      health,
      metrics,
      blockerCount: stuckTasks.length,
      stuckTasks: stuckTasks.slice(0, 5),
      teamSize: members.length,
      snapshot: {
        date: new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        totalActive: metrics.total - metrics.completed,
        completionRate: metrics.completionRate,
        overdueCount: health.overdue?.length || 0,
        dueSoonCount: health.dueSoon?.length || 0,
      }
    };
  } catch (error: any) {
    console.error("fetchSummaries error:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchTeamSynthesis(boardId: string, workspaceId: string) {
  try {
    await connectToDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    let synthesis: any = await TeamStandup.findOne({ boardId, workspaceId, dateString: today }).lean();
    
    // If not found or older than 30 mins, we trigger a background synthesis (fire and forget for this request)
    const isOutdated = synthesis && (Date.now() - new Date(synthesis.summary.lastGeneratedAt).getTime()) > 30 * 60 * 1000;
    
    if (!synthesis || isOutdated) {
      console.log(`[Dashboard-Action] Triggering standup synthesis for ${boardId}`);
      // Using fetch in background to avoid blocking
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/standups/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boardId, workspaceId })
      }).catch(e => console.error("Background synthesis trigger failed", e));
    }

    return { success: true, synthesis: synthesis || null };
  } catch (error: any) {
    console.error("fetchTeamSynthesis error:", error);
    return { success: false, error: error.message };
  }
}
