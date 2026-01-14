"use client";
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Shield, AlertCircle, CheckCircle, Copy } from 'lucide-react';

export default function AdminBootstrapPage() {
  const [userId, setUserId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, secretKey })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Successfully set as admin!');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
      } else {
        setError(data.error || 'Failed to set admin status');
      }
    } catch (err) {
      setError('Network error. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(userId);
    setMessage('User ID copied to clipboard!');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Warning Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm">
              <p className="font-bold text-yellow-500 mb-1">Security Warning</p>
              <p className="text-neutral-300">
                This page is for first-time admin setup only. After creating your first admin,
                delete this page and the bootstrap API endpoint for security.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-red-500" size={32} />
            <div>
              <h1 className="text-2xl font-bold">Admin Bootstrap</h1>
              <p className="text-neutral-400 text-sm">Set up your first admin user</p>
            </div>
          </div>

          {currentUser ? (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="font-medium text-green-500 mb-1">Logged in as:</p>
                  <p className="text-sm text-neutral-300">{currentUser.email}</p>
                  <p className="text-xs text-neutral-400 mt-1">UID: {currentUser.uid}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-neutral-300">
                Please <a href="/login" className="text-blue-400 underline">login</a> first to auto-fill your user ID
              </p>
            </div>
          )}

          <form onSubmit={handleBootstrap} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">User ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Your Firebase user ID"
                  required
                  className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
                />
                {userId && (
                  <button
                    type="button"
                    onClick={copyUserId}
                    className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition"
                  >
                    <Copy size={20} />
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Your user ID will be auto-filled if you're logged in
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bootstrap Secret Key</label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Set in ADMIN_BOOTSTRAP_SECRET env variable"
                required
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
              />
              <p className="text-xs text-neutral-500 mt-1">
                This should match the value in your .env.local file
              </p>
            </div>

            {message && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <p className="text-sm text-green-500">{message}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg font-medium transition"
            >
              {loading ? 'Setting Admin...' : 'Set as Admin'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-800">
            <h3 className="font-bold mb-3">Alternative Methods:</h3>
            <div className="space-y-2 text-sm text-neutral-400">
              <p>1. Set directly in Firebase Console under users/{'{userId}'}/admin = true</p>
              <p>2. Use Firebase Admin SDK server-side</p>
              <p>3. Check <code className="bg-neutral-800 px-2 py-1 rounded">ADMIN_SETUP.md</code> for detailed instructions</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500">
            After setup, delete <code className="bg-neutral-800 px-2 py-1 rounded">/pages/admin-bootstrap.tsx</code> and{' '}
            <code className="bg-neutral-800 px-2 py-1 rounded">/app/api/admin/bootstrap/route.ts</code>
          </p>
        </div>
      </div>
    </div>
  );
}
