import { useState } from 'react';
import { Activity, Circle } from 'lucide-react';

interface StatusSelectorProps {
  currentStatus?: string;
  onStatusChange: (status: string) => void;
  loading?: boolean;
}

export default function StatusSelector({ currentStatus = 'online', onStatusChange, loading = false }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statuses = [
    { id: 'online', label: 'Online', color: 'text-green-500', bgColor: 'bg-green-500/20', borderColor: 'border-green-500' },
    { id: 'away', label: 'Away', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500' },
    { id: 'dnd', label: 'Do Not Disturb', color: 'text-red-500', bgColor: 'bg-red-500/20', borderColor: 'border-red-500' },
    { id: 'offline', label: 'Offline', color: 'text-gray-500', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500' },
  ];

  const currentStatusObj = statuses.find(s => s.id === currentStatus) || statuses[0];

  const handleStatusChange = (statusId: string) => {
    onStatusChange(statusId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
          currentStatusObj.bgColor
        } ${currentStatusObj.borderColor} border-2 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
      >
        <Circle size={12} className={`${currentStatusObj.color} fill-current`} />
        <span className="text-sm font-medium">{currentStatusObj.label}</span>
        <Activity size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg z-50 w-56">
          {statuses.map(status => (
            <button
              key={status.id}
              onClick={() => handleStatusChange(status.id)}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-neutral-800 transition border-b border-neutral-800 last:border-b-0 ${
                currentStatus === status.id ? 'bg-neutral-800' : ''
              }`}
            >
              <Circle size={12} className={`${status.color} fill-current`} />
              <div>
                <p className="text-sm font-medium">{status.label}</p>
                {status.id === 'online' && <p className="text-xs text-neutral-500">Show as available</p>}
                {status.id === 'away' && <p className="text-xs text-neutral-500">You&apos;re inactive</p>}
                {status.id === 'dnd' && <p className="text-xs text-neutral-500">Don&apos;t notify me</p>}
                {status.id === 'offline' && <p className="text-xs text-neutral-500">Show as offline</p>}
              </div>
              {currentStatus === status.id && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
