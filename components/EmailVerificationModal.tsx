"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface EmailVerificationModalProps {
  isOpen: boolean;
  userEmail?: string | null;
  userId?: string | null;
  verified?: boolean;
  onClose: () => void;
}

export default function EmailVerificationModal({
  isOpen,
  userEmail,
  userId,
  verified,
  onClose,
}: EmailVerificationModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForVerification, setIsWaitingForVerification] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState("Waiting for email verification...");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  // Cleanup timeouts on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
      }
    };
  }, []);

  const checkVerificationStatus = async () => {
    if (!userId) return false;
    
    try {
      const response = await fetch(`/api/user/profile/${encodeURIComponent(userId)}`);
      if (response.ok) {
        const data = await response.json();
        return data.verified === true;
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
    return false;
  };

  const pollForVerification = () => {
    let elapsedTime = 0;
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const pollInterval = 2000; // Check every 2 seconds

    const poll = async () => {
      elapsedTime += pollInterval;

      // Check if email is now verified
      const isVerified = await checkVerificationStatus();
      
      if (isVerified) {
        // Email verified! Redirect
        if (pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          window.location.href = "/";
          onClose();
        }, 500);
        return;
      }

      // Update waiting message with elapsed time
      const minutes = Math.floor(elapsedTime / 60000);
      const seconds = Math.floor((elapsedTime % 60000) / 1000);
      const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      setWaitingMessage(`Waiting for email verification... (${timeString})`);

      if (elapsedTime >= maxWaitTime) {
        // Timeout after 5 minutes
        setIsWaitingForVerification(false);
        setIsLoading(false);
        return;
      }

      // Schedule next poll
      pollIntervalRef.current = setTimeout(poll, pollInterval);
    };

    // Start polling
    poll();
  };

  const handleGotIt = async () => {
    setIsLoading(true);
    
    // First check if already verified
    const isVerified = await checkVerificationStatus();
    
    if (isVerified) {
      // Already verified, redirect immediately
      timeoutRef.current = setTimeout(() => {
        window.location.href = "/";
        onClose();
      }, 500);
    } else {
      // Not verified yet, start waiting for verification
      setIsWaitingForVerification(true);
      pollForVerification();
    }
  };

  const handleClose = () => {
    // Prevent closing while loading
    if (isLoading) return;
    // Clear timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (pollIntervalRef.current) {
      clearTimeout(pollIntervalRef.current);
    }
    setIsLoading(false);
    setIsWaitingForVerification(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Prevent closing by clicking backdrop while loading
    if (isLoading || e.target === e.currentTarget) {
      if (isLoading) {
        e.preventDefault();
        return;
      }
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${isLoading ? "bg-black/80" : "bg-black/60"}`}
      onClick={handleBackdropClick}
    >
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${isLoading ? "bg-green-500/20" : "bg-yellow-500/20"} rounded-full flex items-center justify-center transition-colors`}>
            {isLoading ? (
              <svg
                className="w-6 h-6 text-green-500 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={isLoading ? "Cannot close while processing" : "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {isWaitingForVerification ? "Checking Verification..." : isLoading ? "Processing..." : "Verify Your Email"}
        </h2>
        <p className="text-gray-400 mb-6">
          {isWaitingForVerification ? (
            <span className="text-blue-400">{waitingMessage}</span>
          ) : isLoading ? (
            <span>Preparing to redirect...</span>
          ) : (
            <>
              We sent a verification link to <span className="text-green-400 font-semibold">{userEmail}</span>. Click the link in your email to verify your account.
            </>
          )}
        </p>

        {!isLoading && !isWaitingForVerification && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">
              <span className="font-semibold text-white">Didn't receive it?</span>
            </p>
            <ul className="text-sm text-gray-400 space-y-1 ml-4">
              <li>• Check your spam folder</li>
              <li>• Resend verification email</li>
              <li>• Update your email address</li>
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Remind Later
          </button>
          <button
            onClick={handleGotIt}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isWaitingForVerification ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Waiting...
              </>
            ) : isLoading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              "Got It"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
