"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User, deleteUser, updateProfile } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, app } from "../app/api/lib/firebase";
import StatusSelector from "../components/StatusSelector";
import {
  Loader2,
  Save,
  Bell,
  Shield,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Globe,
  Mail,
  User as UserIcon,
  Trash2,
  Palette,
  MapPin,
  Link as LinkIcon,
  Type,
  Image as ImageIcon,
  Activity
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [userStatus, setUserStatus] = useState<string>('online');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    publicProfile: true,
    showStats: true,
    theme: "dark",
    accentColor: "blue",
    showUserId: false,
    showEmail: false,
  });
  const [profile, setProfile] = useState({
    displayName: "",
    bio: "",
    location: "",
    website: "",
    bannerURL: ""
  });
  const [activeTab, setActiveTab] = useState("profile");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      try {
        const docRef = doc(db, "settings", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }

      try {
        const rtdb = getDatabase(app);
        const snapshot = await get(dbRef(rtdb, `users/${currentUser.uid}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setProfile(prev => ({
            ...prev,
            ...data,
            displayName: currentUser.displayName || data.displayName || "",
            bannerURL: data.bannerURL || ""
          }));
          // Set user status from database
          setUserStatus(data.status || 'online');
        } else {
          setProfile(prev => ({ ...prev, displayName: currentUser.displayName || "" }));
          setUserStatus('online');
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, db]);

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;
    
    setStatusUpdating(true);
    try {
      const rtdb = getDatabase(app);
      await update(dbRef(rtdb, `users/${user.uid}`), {
        status: newStatus,
        lastActive: Date.now(),
      });
      
      // Also update the admin active-users endpoint
      await fetch('/api/admin/active-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, status: newStatus }),
      });
      
      setUserStatus(newStatus);
      showToast(`Status changed to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 relative overflow-hidden pt-32">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400 mb-4">Settings</h1>
          <p className="text-gray-400 text-lg">Manage your preferences and account configuration.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 shrink-0 space-y-2 overflow-x-auto md:overflow-visible flex md:block pb-4 md:pb-0">
            {/* Tabs */}
          </div>
          <div className="flex-1 space-y-6">
            {/* Status Section */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="text-green-500" size={24} />
                <h2 className="text-2xl font-bold">User Status</h2>
              </div>
              <p className="text-gray-400 mb-6">Set your current status so others know your availability</p>
              <StatusSelector 
                currentStatus={userStatus}
                onStatusChange={handleStatusChange}
                loading={statusUpdating}
              />
              <p className="text-xs text-gray-500 mt-4">Your status will be automatically set to offline if you don't interact with the platform for 30 minutes.</p>
            </div>

            {toast && (
              <div className={`p-4 rounded-lg ${toast.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-red-500/20 text-red-400 border border-red-500'}`}>
                {toast.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
