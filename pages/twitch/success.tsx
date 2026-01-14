'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { Box, Typography } from '@mui/material';

export default function TwitchSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Try to get the new auth_data (contains token)
        const authDataParam = router.query.auth_data as string;
        if (authDataParam) {
          try {
            const decoded = atob(decodeURIComponent(authDataParam));
            const authData = JSON.parse(decoded);
            const { user, token, twitchData } = authData;

            console.log('Twitch success - received auth token for user:', user.uid);

            // Store user info in localStorage
            const mapped = {
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              uid: user.uid,
            };
            try {
              localStorage.setItem('user', JSON.stringify(mapped));
            } catch {}

            // Dispatch auth event
            try {
              window.dispatchEvent(new CustomEvent('auth-change', { detail: mapped }));
            } catch {}

            // Store auth token in localStorage for persistence
            try {
              localStorage.setItem('authToken', token);
            } catch {}

            setStatus('Connected successfully!');
            // Redirect to home
            setTimeout(() => {
              router.replace('/');
            }, 1000);
          } catch (e) {
            console.error('Failed to parse auth_data payload', e);
            setStatus('Error processing authentication');
            setTimeout(() => {
              router.replace('/login');
            }, 2000);
          }
          return;
        }

        // Fallback: try old user param (for backward compatibility)
        const userParam = router.query.user as string;
        if (userParam) {
          try {
            const twitchData = JSON.parse(Buffer.from(userParam, 'base64').toString());
            const mapped = {
              displayName: twitchData.displayName,
              email: undefined,
              photoURL: twitchData.avatar,
              uid: twitchData.id,
            };
            try {
              localStorage.setItem('user', JSON.stringify(mapped));
            } catch {}

            try {
              window.dispatchEvent(new CustomEvent('auth-change', { detail: mapped }));
            } catch {}

            console.log('Twitch success: using legacy mode');
            setStatus('Connected successfully!');
            setTimeout(() => {
              router.replace('/profile');
            }, 1000);
          } catch (e) {
            console.error('Failed to parse user payload', e);
            setStatus('Error processing authentication');
            setTimeout(() => {
              router.replace('/login');
            }, 2000);
          }
          return;
        }

        // No auth data found
        setStatus('No authentication data received');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      } catch (e) {
        console.error('Twitch success error:', e);
        setStatus('Error processing authentication');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    };

    if (router.isReady) {
      processAuth();
    }
  }, [router.isReady, router.query]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.95)',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(0, 0, 0, 0.95) 100%)',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: 'rgba(139, 92, 246, 0.8)' }} />
        <Typography sx={{ color: '#fff', fontSize: '1.1rem', fontWeight: 500 }}>
          {status}
        </Typography>
      </Box>
    </Box>
  );
}
