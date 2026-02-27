'use client';

import { useEffect, useState } from 'react';

// Hardcoded for demo
const TEST_BOARD = '694a87f7e6aa80a347e86e5a';

export default function SummaryPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/standup/summary?boardId=${TEST_BOARD}`);
        const data = await res.json();
        if (data.success) {
          setSummaryData(data.data);
        }
      } catch (e) {
        console.error('Failed to fetch summary', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 animate-pulse font-medium">Loading summary...</div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-800">No Standup Data Found</h2>
        <p className="text-gray-500 mt-2">Could not retrieve the summary for today.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 pb-20 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Standup Summary</h1>
            <p className="text-gray-500 mt-1">Board ID: {summaryData.boardId} • Date: {summaryData.standupDate}</p>
          </div>
          <div className="text-sm font-medium bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100">
            {summaryData.memberSummaries.filter((m: any) => m.status === 'submitted').length} / {summaryData.memberSummaries.length} Submitted
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-sm text-gray-600 uppercase tracking-wider">
                <th className="p-4 font-medium w-1/5">Team Member</th>
                <th className="p-4 font-medium w-[15%]">Status</th>
                <th className="p-4 font-medium w-2/5">Daily Summary</th>
                <th className="p-4 font-medium w-1/4">Blockers & Risks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaryData.memberSummaries.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No standup sessions recorded yet today.</td>
                </tr>
              )}
              {summaryData.memberSummaries.map((member: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition duration-150">
                  <td className="p-4 align-top">
                    <div className="font-semibold text-gray-900">{member.userName}</div>
                    <div className="text-xs text-gray-500">{member.userEmail}</div>
                  </td>
                  <td className="p-4 align-top">
                    <span 
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full items-center gap-1 ${
                        member.status === 'submitted' ? 'bg-green-100 text-green-700' :
                        member.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {member.status === 'submitted' ? '✅ Submitted' : 
                       member.status === 'pending' ? '⏳ Confirming' : 
                       '🔄 In Progress'}
                    </span>
                    {member.submittedAt && (
                      <div className="text-[10px] text-gray-400 mt-2">
                        {new Date(member.submittedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top text-gray-800 text-sm">
                    {member.summary ? (
                      <div>
                        <p className="mb-2 italic text-gray-600">"{member.summary}"</p>
                        {member.tasksCompleted.length > 0 && (
                          <div className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Done:</span> {member.tasksCompleted.join(', ')}</div>
                        )}
                        {member.tasksInProgress.length > 0 && <div className="text-xs text-gray-500 mt-1"><span className="font-semibold text-gray-700">WIP:</span> {member.tasksInProgress.join(', ')}</div>}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No summary available yet.</span>
                    )}
                  </td>
                  <td className="p-4 align-top">
                    {member.blockers.length > 0 ? (
                      <ul className="space-y-2">
                        {member.blockers.map((b: any, bIdx: number) => (
                          <li key={bIdx} className="text-xs bg-red-50 text-red-900 border border-red-100 rounded-md p-2 shadow-sm">
                            <span className="font-bold underline mb-1 block">Blocked on {b.taskName}:</span>
                            {b.reason}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block font-medium">None reported</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
