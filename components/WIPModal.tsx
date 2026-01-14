"use client";

import React, { useState, useRef } from 'react';
import { Modal, Box, Typography, Button, Snackbar, Backdrop, Fade } from '@mui/material';
import { Construction, Check } from 'lucide-react';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 400,
  bgcolor: '#0f0f0f',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 0 50px rgba(0,0,0,0.8)',
  borderRadius: '16px',
  color: 'white',
  outline: 'none',
  p: 4,
};

interface WIPModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WIPModal({ open, onClose }: WIPModalProps) {
  const [showToast, setShowToast] = useState(false);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleConfirm = () => {
    setShowToast(true);
    if (notificationAudioRef.current) {
      notificationAudioRef.current.currentTime = 0;
      notificationAudioRef.current.play().catch(() => {});
    }
    onClose();
  };

  return (
    <>
      <audio ref={notificationAudioRef} src="/notifications.mp3" />
      <Modal
        open={open}
        onClose={onClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.8)' }
          },
        }}
      >
        <Fade in={open}>
          <Box sx={style}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 rounded-full bg-amber-500/10 text-amber-500 mb-2">
                <Construction className="w-12 h-12" />
              </div>
              <Typography variant="h5" fontWeight="bold">
                Work In Progress
              </Typography>
              <Typography variant="body1" color="grey.400">
                This website is currently under active development. You may encounter bugs or incomplete features.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={handleConfirm}
                sx={{
                  mt: 2,
                  bgcolor: '#a855f7',
                  '&:hover': { bgcolor: '#9333ea' },
                  fontWeight: 'bold',
                  py: 1.5,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                I Understand
              </Button>
            </div>
          </Box>
        </Fade>
      </Modal>

      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{
          bgcolor: '#171717',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '99px',
          pl: 1,
          pr: 3,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-500">
            <Check className="w-5 h-5" />
          </div>
          <Typography sx={{ color: 'white', fontWeight: 500, fontSize: '0.95rem' }}>Confirmed</Typography>
        </Box>
      </Snackbar>
    </>
  );
}