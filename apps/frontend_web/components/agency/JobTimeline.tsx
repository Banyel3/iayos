import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

interface TimelineItem {
  status: 'completed' | 'current' | 'pending';
  label: string;
  date?: string;
  notes?: string;
}

interface JobTimelineProps {
  clientConfirmedWorkStarted: boolean;
  workerMarkedComplete: boolean;
  clientMarkedComplete: boolean;
  createdAt: string;
  completionNotes?: string;
}

export default function JobTimeline({
  clientConfirmedWorkStarted,
  workerMarkedComplete,
  clientMarkedComplete,
  createdAt,
  completionNotes,
}: JobTimelineProps) {
  const timeline: TimelineItem[] = [
    {
      status: 'completed',
      label: 'Job Created',
      date: new Date(createdAt).toLocaleString(),
    },
    {
      status: 'completed',
      label: 'Assigned to Employee',
      date: new Date(createdAt).toLocaleString(),
    },
    {
      status: clientConfirmedWorkStarted ? 'completed' : 'current',
      label: 'Work Started',
      notes: clientConfirmedWorkStarted ? 'Client confirmed work has begun' : 'Waiting for work to begin',
    },
    {
      status: workerMarkedComplete ? 'completed' : clientConfirmedWorkStarted ? 'current' : 'pending',
      label: 'Worker Marked Complete',
      notes: workerMarkedComplete ? completionNotes || 'Worker submitted completion' : 'Waiting for worker to complete',
    },
    {
      status: clientMarkedComplete ? 'completed' : workerMarkedComplete ? 'current' : 'pending',
      label: 'Client Approved',
      notes: clientMarkedComplete ? 'Payment released to worker' : 'Waiting for client approval',
    },
  ];

  const getIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="text-green-600" size={24} />;
    if (status === 'current') return <Clock className="text-blue-600" size={24} />;
    return <Circle className="text-gray-400" size={24} />;
  };

  return (
    <div className="space-y-6">
      {timeline.map((item, index) => (
        <div key={index} className="flex gap-4">
          {/* Icon Column */}
          <div className="flex flex-col items-center">
            <div className="flex-shrink-0">{getIcon(item.status)}</div>
            {index < timeline.length - 1 && (
              <div
                className={`w-0.5 h-full mt-2 ${
                  item.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>

          {/* Content Column */}
          <div className="flex-1 pb-6">
            <h3
              className={`font-semibold ${
                item.status === 'completed'
                  ? 'text-gray-900'
                  : item.status === 'current'
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              {item.label}
            </h3>
            {item.date && <p className="text-sm text-gray-600 mt-1">{item.date}</p>}
            {item.notes && (
              <p className={`text-sm mt-2 ${item.status === 'current' ? 'text-blue-700' : 'text-gray-600'}`}>
                {item.notes}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
