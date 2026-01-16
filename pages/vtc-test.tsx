import { useState } from 'react';

export default function VTCTestPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sendTestEvent = async (eventType: 'job_start' | 'job_delivered' | 'job_cancelled') => {
    setLoading(true);
    try {
      const payload =
        eventType === 'job_start'
          ? {
              type: 'job_start',
              cargo: 'Fragile Items',
              source: 'Los Angeles',
              destination: 'San Francisco',
            }
          : eventType === 'job_delivered'
          ? {
              type: 'job_delivered',
              revenue: 1250.5,
            }
          : {
              type: 'job_cancelled',
            };

      const response = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setEvents([
          {
            timestamp: new Date().toISOString(),
            ...payload,
          },
          ...events,
        ]);
      }
    } catch (error) {
      console.error('Error sending test event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">🚚 VTC Telemetry Test</h1>
        <p className="text-gray-400 mb-8">Test the ATS plugin telemetry API integration</p>

        {/* Test Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Send Test Events</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => sendTestEvent('job_start')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition"
            >
              Job Start
            </button>
            <button
              onClick={() => sendTestEvent('job_delivered')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition"
            >
              Job Delivered
            </button>
            <button
              onClick={() => sendTestEvent('job_cancelled')}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition"
            >
              Job Cancelled
            </button>
            {events.length > 0 && (
              <button
                onClick={() => setEvents([])}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition"
              >
                Clear Events
              </button>
            )}
          </div>
        </div>

        {/* Events Log */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Telemetry Events ({events.length})
          </h2>
          {events.length === 0 ? (
            <p className="text-gray-400">No events received yet. Send a test event above!</p>
          ) : (
            <div className="space-y-3">
              {events.map((event, index) => (
                <div key={index} className="bg-gray-700 rounded p-4 border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm bg-gray-600 px-2 py-1 rounded">
                      {event.type}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-3">API Endpoint</h3>
          <p className="text-gray-300 font-mono bg-gray-900 p-3 rounded mb-3">
            POST http://localhost:3000/api/telemetry
          </p>
          <p className="text-gray-400 text-sm">
            The ATS plugin will send telemetry data to this endpoint when events occur in-game.
          </p>
        </div>
      </div>
    </div>
  );
}
