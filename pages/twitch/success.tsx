'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '@/app/api/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Box, Typography } from '@mui/material';

export default function TwitchSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const processConnection = async () => {
      try {
        // Check if user is already authenticated
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          // Wait for auth state to be ready
          const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
              unsubscribe();
              await saveConnection(user.uid);
            }
          });
          
          // Timeout after 10 seconds
          setTimeout(() => unsubscribe(), 10000);
          return;
        }

        await saveConnection(currentUser.uid);
      } catch (error) {
        console.error('Error:', error);
        setStatus('Error processing connection');
      }
    };

    const saveConnection = async (userId: string) => {
      try {
        const userData = router.query.user as string;
        if (!userData) {
          setStatus('No user data received');
          return;
        }

        const twitchData = JSON.parse(Buffer.from(userData, 'base64').toString());

        const response = await fetch(`/api/user/connections/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'twitch',
            id: twitchData.id,
            username: twitchData.username,
            displayName: twitchData.displayName,
            avatar: twitchData.avatar,
            connectedAt: twitchData.connectedAt,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save connection');
        }

        setStatus('Connected successfully!');
        setTimeout(() => router.push('/profile'), 1000);
      } catch (error) {
        console.error('Connection error:', error);
        setStatus('Failed to save connection');
      }
    };

    if (router.isReady) {
      processConnection();
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
