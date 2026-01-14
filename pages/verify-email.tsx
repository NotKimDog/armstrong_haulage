"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "../../app/api/lib/firebase";
import { updateProfile } from "firebase/auth";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams?.get("token");
        const email = searchParams?.get("email");
        const uid = searchParams?.get("uid");

        if (!token || !email) {
          setStatus("error");
          setMessage("Invalid verification link");
          return;
        }

        // Decode token to verify it
        try {
          const decoded = Buffer.from(token, "base64").toString("utf-8");
          const [tokenUid, timestamp] = decoded.split(":");
          const tokenTime = parseInt(timestamp);
          const now = Date.now();
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (now - tokenTime > twentyFourHours) {
            setStatus("error");
            setMessage("Verification link has expired. Please sign up again.");
            return;
          }

          // Token is valid - update Firebase with verified status
          try {
            const response = await fetch("/api/user/profile/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, uid: tokenUid }),
            // Redirect after 2 seconds
            setTimeout(() => {
              router.push("/");
            }, 2000);
          } catch (err) {
            console.error("Firebase update error:", err);
            setStatus("error");
            setMessage("Failed to update verification status. Please try again.");
          }
        } catch (err) {
          console.error("Token decode error:", err);
          setStatus("error");
          setMessage("Invalid verification token");
        }
      } catch (error: unknown) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "An error occurred during verification"
        );
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl text-center">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-4 border-white/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Verifying Email
            </h1>
            <p className="text-gray-400">Please wait...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-400">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => router.push("/?mode=register")}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Back to Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  );
}
