"use client";

import { useState, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";

export default function CookiesPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookiesAccepted = localStorage.getItem("cookies_accepted");
    if (!cookiesAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookies_accepted", "true");
    localStorage.setItem("cookies_accepted_at", new Date().toISOString());
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookies_accepted", "false");
    localStorage.setItem("cookies_accepted_at", new Date().toISOString());
    setIsVisible(false);
  };

  const handleReset = () => {
    localStorage.removeItem("cookies_accepted");
    localStorage.removeItem("cookies_accepted_at");
    setIsVisible(true);
  };

  if (!isVisible) {
    return (
      <button
        onClick={handleReset}
        className="fixed bottom-4 right-4 z-40 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition tooltip-trigger"
        title="Reset cookie preferences"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-neutral-900/95 border-t border-white/10 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">
                🍪 Cookie Preferences
              </h3>
              <p className="text-sm text-gray-400">
                We use cookies to enhance your experience and analyze site traffic. By clicking "Accept All", you consent to our use of cookies. You can manage your preferences at any time.
              </p>
            </div>

            <div className="flex gap-3 sm:flex-shrink-0">
              <button
                onClick={handleReject}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition whitespace-nowrap"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition whitespace-nowrap"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
