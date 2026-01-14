import React, { useState, useRef, useEffect } from 'react';
import { Modal, Box, Typography, IconButton, Button, Snackbar, Backdrop, Fade, Slider, MobileStepper } from '@mui/material';
import { X, Copy, Download, Radio, Server, Play, Pause, Maximize, Minimize, Volume2, VolumeX, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Draggable from 'react-draggable';

const CB_DOWNLOAD_LINK = 'https://www.dropbox.com/scl/fi/u4uynzzg971xcnazlecbw/CB_Radio_Armstrong_VTC.zip?rlkey=4lgmlmq03mdr4brzpd05kr50o&dl=1';
const SERVER_IP = '94.250.223.26:15080';

const style = {
  position: 'relative',
  width: '95%',
  maxWidth: 500,
  bgcolor: '#0f0f0f',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 0 50px rgba(0,0,0,0.8)',
  borderRadius: '16px',
  color: 'white',
  outline: 'none',
  maxHeight: '90vh',
  overflowY: 'auto',
  '@media (max-width: 600px)': { // Adjust for smaller screens
    width: '90%',
    maxWidth: 'none', // Removes the maximum width on smaller screens
  overflowY: 'auto',
}};

interface PublicCBModalProps {
  open: boolean;
  onClose: () => void;
}


const PublicCBModal = ({ open, onClose }: PublicCBModalProps) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (showToast && notificationAudioRef.current) {
      notificationAudioRef.current.currentTime = 0;
      notificationAudioRef.current.play().catch(() => {});
    }
  }, [showToast]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const draggableNodeRef = useRef(null);

  const stepsConfig = [
    {
      title: 'Download & Install',
      content: (
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <Typography variant="body2" sx={{ color: 'grey.300', mb: 2 }}>
            Download the CB Radio plugin and extract it to your plugins folder.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Download className="w-4 h-4" />}
            href={CB_DOWNLOAD_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              setToastMessage('Download Started!');
              setShowToast(true);
            }}
            sx={{
              bgcolor: '#7c3aed',
              '&:hover': { bgcolor: '#6d28d9' },
              textTransform: 'none',
              fontWeight: 'bold',
              py: 1.5,
              borderRadius: '8px'
            }}
          >
            Download Public CB Radio
          </Button>
        </div>
      )
    },
    {
      title: 'How to Install',
      content: (
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
          <Typography variant="body2" sx={{ color: 'grey.300' }}>
            • Extract the downloaded <strong>CB_Radio_Armstrong_VTC.zip</strong> file.
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.300' }}>
            • Install <strong>TeamSpeak 3</strong> using the installer included in the extracted folder. Follow the standard installation prompts.
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.300' }}>
            • Once TeamSpeak 3 is installed, ensure it is <strong>closed</strong>. Then, install the <strong>Radio FX Plugin</strong> included in the folder.
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.300' }}>
            • Move the provided <strong>.wav files</strong> to: <code className="bg-black/30 px-1 rounded">C:\Program Files\TeamSpeak 3 Client\sound\default</code>
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.300' }}>
            • Open TeamSpeak 3 and configure your microphone and audio output under <strong>Tools &gt; Options</strong>.
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.300' }}>
            • <strong>Important:</strong> Under the <strong>Capture</strong> tab, ensure &quot;Remove background noise&quot; is <strong>disabled</strong> for the best audio quality.
          </Typography>
        </div>
      )
    },
        {
      title: 'Optional Settings',
      content: (
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
          <Typography variant="body2" sx={{ color: 'grey.300' }}>
            • To configure the Radio FX Plugin, go to <strong>Plugins &gt; Radio FX &gt; Radio FX</strong> in TeamSpeak.
          </Typography>
        </div>
      )
    },
        {
      title: 'Connect to Server',
      content: (
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <Typography variant="body2" sx={{ color: 'grey.300', mb: 2 }}>Open the radio in-game and connect to:</Typography>
          <div className="flex items-center justify-between gap-3 bg-black/40 p-3 rounded-lg border border-white/5">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                <Server className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <Typography variant="caption" sx={{ color: 'grey.500', display: 'block' }}>Server IP</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {SERVER_IP}
                </Typography>
              </div>
            </div>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(SERVER_IP);
                setToastMessage('IP Address Copied!');
                setShowToast(true);
              }}
              sx={{
                minWidth: 'auto',
                borderColor: 'rgba(255,255,255,0.1)',
                color: 'grey.300',
                '&:hover': { borderColor: 'rgba(255,255,255,0.3)', color: 'white', bgcolor: 'white/5' },
                borderRadius: '8px',
                height: '40px',
                width: '40px'
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )
    },
  ];

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const val = Array.isArray(newValue) ? newValue[0] : newValue;
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      const newMuted = val === 0;
      if (videoRef.current.muted !== newMuted) {
        videoRef.current.muted = newMuted;
        setIsMuted(newMuted);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
      // If unmuting and volume was 0, set it to a default.
      if (!newMuted && videoRef.current.volume === 0) {
        const newVolume = 0.5;
        videoRef.current.volume = newVolume;
        setVolume(newVolume);
      }
    }
  };

  const handleSeek = (clientX: number) => {
    if (progressBarRef.current && videoRef.current && duration > 0) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const width = rect.width;
      const newTime = (x / width) * duration;
      
      videoRef.current.currentTime = newTime;
      setProgress((newTime / duration) * 100);
      setCurrentTime(newTime);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    handleSeek(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleSeek(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (!open) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      // Use a timeout to allow the modal to close before resetting state
      setTimeout(() => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setVolume(1);
        setIsMuted(false);
        setIsVolumeHovered(false);
        setShowControls(true);
        setIsBuffering(false);
      }, 0);
    }
  }, [open]);
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!open || !container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (videoRef.current) {
          const currentVolume = videoRef.current.muted ? 0 : videoRef.current.volume;
          const newVolume = e.key === 'ArrowUp'
            ? Math.min(currentVolume + 0.05, 1)
            : Math.max(currentVolume - 0.05, 0);
          videoRef.current.volume = newVolume;
          videoRef.current.muted = newVolume === 0;
          setVolume(newVolume);
          setIsMuted(newVolume === 0);
        }
      }
    };
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [open]);
  

  useEffect(() => {
    const containerElement = containerRef.current
    const videoElement = videoRef.current;

    if (!open || !containerElement || !videoElement) {
      return;
    }

    const handleActivity = () => {
      setShowControls(true);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        if (!videoElement.paused) {
          setShowControls(false);
        }
      }, 3000); // 3 seconds of inactivity
    };

    const handlePause = () => {
      setShowControls(true);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };

    containerElement.addEventListener('mousemove', handleActivity);
    videoElement.addEventListener('play', handleActivity);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      containerElement.removeEventListener('mousemove', handleActivity);
      videoElement.removeEventListener('play', handleActivity);
      videoElement.removeEventListener('pause', handlePause);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [open]);

  const handleNext = () => {
    if (activeStep < stepsConfig.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
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
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            outline: 'none',
            pointerEvents: 'none' // Allow clicks to pass through the wrapper to backdrop
          }}>
            <Draggable handle="#draggable-dialog-title" nodeRef={draggableNodeRef}>
              <Box ref={draggableNodeRef} sx={{ ...style, pointerEvents: 'auto' }}>
            {/* Header */}
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), transparent)' }}>
              <Typography variant="h6" component="h2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Radio className="w-5 h-5 text-purple-500" />
                Public CB Radio Setup
              </Typography>
              <IconButton onClick={onClose} sx={{ color: 'grey.500', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <X className="w-5 h-5" />
              </IconButton>
            </Box>

            {/* Body */}
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {stepsConfig.map((step, index) => (
                activeStep === index && (
                  <Box key={index}>
                    <Typography variant="subtitle2" sx={{ color: 'grey.400', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">{index + 1}</span>
                      {step.title}
                    </Typography>
                    {step.content}
                  </Box>
                )
              ))}

              <Box ref={containerRef} tabIndex={-1} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '16/9', bgcolor: 'black' }}>
                  <video
                    ref={videoRef}
                    width="100%"
                    height="100%"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => {
                      if (videoRef.current && !videoRef.current.seeking) {
                        setIsPlaying(false);
                      }
                    }}
                    onEnded={() => setIsPlaying(false)}
                    onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                    onTimeUpdate={() => {
                      // Hide spinner when time updates, as it means playback is progressing.
                      if (isBuffering) setIsBuffering(false);
                      if (videoRef.current && !isDragging) {
                        setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
                        setCurrentTime(videoRef.current.currentTime);
                      }
                    }}
                    poster="/cb_radio_poster.png"
                    preload="metadata"
                    onClick={togglePlayPause}
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => setIsBuffering(false)}
                  >
                    <source src="/cb_radio_video_tutuorial.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {isBuffering && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                    }}>
                      <Loader2 className="w-10 h-10 animate-spin text-white" />
                    </Box>
                  )}

                  {/* Big Play Button Overlay */}
                  {!isPlaying && !isBuffering && (
                    <Box // Added !showToast to prevent overlay from reappearing when toast shows
                      sx={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        transition: 'background-color 0.2s ease',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' },
                        '&:hover .play-icon-wrapper': {
                          transform: 'scale(1.1)',
                        }
                      }}
                      onClick={togglePlayPause}
                    >
                      <Box
                        className="play-icon-wrapper"
                        sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 64, height: 64, borderRadius: '50%',
                          bgcolor: 'rgba(124, 58, 237, 0.7)', backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.2s ease-in-out',
                          boxShadow: '0 0 30px rgba(124, 58, 237, 0.5)'
                        }}
                      ><Play className="w-8 h-8 text-white translate-x-0.5" fill="white" /></Box>
                    </Box>
                  )}

                  {/* Custom Controls */}
                  <Box
                    className="custom-controls"
                    sx={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                      opacity: !isPlaying || showControls ? 1 : 0,
                      transform: !isPlaying || showControls ? 'translateY(0)' : 'translateY(100%)',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <IconButton onClick={togglePlayPause} sx={{ color: 'white', p: 0.5 }}>
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </IconButton>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: '45px' }}>
                        {formatTime(currentTime)}
                      </Typography>
                      <Box ref={progressBarRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} sx={{ flex: 1, height: '6px', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '3px', cursor: 'pointer', position: 'relative', touchAction: 'none', '&:hover .progress-bar-fill': { height: '8px' }, '&:hover .progress-bar-thumb': { opacity: 1 } }}>
                        <Box className="progress-bar-fill" sx={{ width: `${progress}%`, height: '100%', bgcolor: '#a855f7', borderRadius: '3px', transition: 'width 0.1s linear, height 0.1s ease' }} />
                        <Box className="progress-bar-thumb" sx={{ position: 'absolute', top: '50%', left: `${progress}%`, transform: 'translate(-50%, -50%)', width: '14px', height: '14px', borderRadius: '50%', bgcolor: 'white', opacity: 0, transition: 'opacity 0.1s ease' }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: '45px' }}>
                        {formatTime(duration)}
                      </Typography>
                      <Box
                        onMouseEnter={() => setIsVolumeHovered(true)}
                        onMouseLeave={() => setIsVolumeHovered(false)}
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <IconButton onClick={toggleMute} sx={{ color: 'white', p: 0.5 }}>
                          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </IconButton>
                        <Box sx={{
                          width: isVolumeHovered ? '120px' : '0px',
                          opacity: isVolumeHovered ? 1 : 0,
                          transition: 'width 0.2s ease-in-out, opacity 0.2s ease-in-out',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Slider
                            size="small"
                            value={isMuted ? 0 : volume}
                            min={0} max={1} step={0.01}
                            onChange={handleVolumeChange}
                            sx={{
                              width: 80,
                              color: '#a855f7',
                              '& .MuiSlider-thumb': { width: 12, height: 12, '&:hover, &.Mui-focusVisible': { boxShadow: '0px 0px 0px 8px rgb(168 85 247 / 16%)' } },
                              '& .MuiSlider-rail': { opacity: 0.28 },
                            }}
                          />
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'white', minWidth: '35px', textAlign: 'right' }}>{Math.round((isMuted ? 0 : volume) * 100)}%</Typography>
                        </Box>
                      </Box>
                      <IconButton onClick={toggleFullscreen} sx={{ color: 'white', p: 0.5 }}>
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button 
                onClick={handleBack} 
                disabled={activeStep === 0}
                startIcon={<ChevronLeft className="w-4 h-4" />}
                sx={{ color: 'grey.400', '&:hover': { color: 'white' }, '&.Mui-disabled': { color: 'rgba(255,255,255,0.1)' } }}
              >
                Back
              </Button>
              <MobileStepper
                variant="dots"
                steps={stepsConfig.length}
                position="static"
                activeStep={activeStep}
                sx={{ bgcolor: 'transparent', '& .MuiMobileStepper-dot': { bgcolor: 'rgba(255,255,255,0.2)' }, '& .MuiMobileStepper-dotActive': { bgcolor: '#a855f7' } }}
                nextButton={null}
                backButton={null}
              />
              <Button 
                onClick={handleNext} 
                endIcon={activeStep === stepsConfig.length - 1 ? null : <ChevronRight className="w-4 h-4" />}
                variant="contained"
                sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, fontWeight: 'bold' }}
              >
                {activeStep === stepsConfig.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </Box>
              </Box>
            </Draggable>
          </Box>
        </Fade>
      </Modal>
      <Snackbar
        open={showToast}
        autoHideDuration={2000}
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
          <div className="checkmark-wrapper">
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <Typography sx={{ color: 'white', fontWeight: 500, fontSize: '0.95rem' }}>{toastMessage}</Typography>
        </Box>
      </Snackbar>
      <style>{`
        .checkmark-wrapper { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
        .checkmark { width: 24px; height: 24px; border-radius: 50%; display: block; stroke-width: 3; stroke: #a855f7; stroke-miterlimit: 10; box-shadow: inset 0px 0px 0px #a855f7; animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both; }
        .checkmark__circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 2; stroke-miterlimit: 10; stroke: #a855f7; fill: none; animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
        .checkmark__check { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards; }
        @keyframes stroke { 100% { stroke-dashoffset: 0; } }
        @keyframes scale { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1, 1.1, 1); } }
        @keyframes fill { 100% { box-shadow: inset 0px 0px 0px 30px transparent; } }
      `}</style>
    </>


  );
};

export default PublicCBModal;