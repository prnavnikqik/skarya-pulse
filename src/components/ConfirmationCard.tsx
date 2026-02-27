import { useState } from 'react';
import { StandupOutput } from '@/types';

interface ConfirmationCardProps {
  initialData: StandupOutput;
  onConfirm: (data: StandupOutput) => void;
}

export default function ConfirmationCard({ initialData, onConfirm }: ConfirmationCardProps) {
  const [data, setData] = useState<StandupOutput>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A more robust implementation would allow editing the JSON or form fields,
  // but for the 5-day prototype we'll mostly display the summary and allow basic confirm.

  const handleConfirm = () => {
    setIsSubmitting(true);
    onConfirm(data);
  };

  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden text-gray-800">
      <div className="bg-blue-50 border-b px-6 py-5">
        <h3 className="text-xl font-bold text-blue-900">Review Your Updates</h3>
        <p className="text-blue-700 text-sm mt-1">Please confirm Kobi's summary before these are written back to skarya.ai.</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Task Status Updates */}
        {data.task_updates?.length > 0 && (
          <section>
            <h4 className="font-semibold text-lg border-b pb-2 mb-4">Task Status Updates</h4>
            <div className="space-y-3">
              {data.task_updates.map((tu, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                  <div>
                    <span className="font-medium">{tu.taskNumber}</span>
                  </div>
                  <div className="text-sm font-medium px-3 py-1 bg-white border rounded-full">
                    {tu.status} ({tu.percentageCompletion || 0}%)
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Progress Comments */}
        {data.progress_comments?.length > 0 && (
          <section>
            <h4 className="font-semibold text-lg border-b pb-2 mb-4">Progress Notes</h4>
            <ul className="space-y-3">
              {data.progress_comments.map((pc, i) => (
                <li key={i} className="text-sm bg-green-50/50 p-3 rounded-lg border border-green-100">
                  <span className="font-bold text-green-700 mr-2">{pc.taskNumber}</span>
                  {pc.comment}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Blockers */}
        {data.roadblock_comments?.length > 0 && (
          <section>
            <h4 className="font-semibold text-lg border-b pb-2 mb-4">Blockers</h4>
            <ul className="space-y-3">
              {data.roadblock_comments.map((bc, i) => (
                <li key={i} className="text-sm bg-red-50/50 p-3 rounded-lg border border-red-100 text-red-900">
                  <span className="font-bold mr-2">{bc.taskNumber}</span>
                  {bc.comment}
                  {bc.notifyLead && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Alert Lead</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* New Tasks */}
        {data.new_tasks_to_create?.length > 0 && (
          <section>
            <h4 className="font-semibold text-lg border-b pb-2 mb-4">New Tasks to Create</h4>
            <ul className="space-y-3">
              {data.new_tasks_to_create.map((nt, i) => (
                <li key={i} className="text-sm bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <span className="font-semibold block mb-1">{nt.name}</span>
                  <span className="text-xs text-purple-700">Priority: {nt.priority} | Status: {nt.status}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
        <button 
          className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[140px]"
        >
          {isSubmitting ? 'Updating...' : 'Confirm & Update'}
        </button>
      </div>
    </div>
  );
}
