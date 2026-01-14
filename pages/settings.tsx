"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User, deleteUser, updateProfile } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, app } from "../app/api/lib/firebase";
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
  Image as ImageIcon
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        } else {
          setProfile(prev => ({ ...prev, displayName: currentUser.displayName || "" }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, db]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400 mb-4">Settings</h1>
          <p className="text-gray-400 text-lg">Manage your preferences and account configuration.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 shrink-0 space-y-2 overflow-x-auto md:overflow-visible flex md:block pb-4 md:pb-0">
            {/* Tabs omitted for brevity */}
          </div>
          <div className="flex-1 space-y-6">
            <div className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">Settings migrated.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
