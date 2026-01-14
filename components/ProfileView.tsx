"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { auth, app, STORAGE_GS_URL } from "../app/api/lib/firebase";
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as dbRef, child as dbChild, get as dbGet } from 'firebase/database';
import { Loader2, ShieldCheck, Share2, Camera, Check, X } from "lucide-react";
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

type UserProfile = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  bannerURL?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  slug?: string | null;
  verified?: boolean;
  stats?: {
    followers?: number;
    following?: number;
    views?: number;
  };
};

export default function ProfileView({ overrideUserId }: { overrideUserId?: string | null }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [currentViewerId, setCurrentViewerId] = useState<string | null>(null);

  // slug editor state (temporary UI)
  const [slugInput, setSlugInput] = useState<string>('');
  // slug related state variables removed - not currently used
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  // editing state variables - used in profile editing
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMessage, setSlugMessage] = useState<string | null>(null);
  const [savingSlug, setSavingSlug] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  // photo upload state managed via uploadingType
  const [editBannerURL, setEditBannerURL] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingType, setUploadingType] = useState<'avatar'|'banner'|null>(null);

  // tab state for owner profile
  const [activeTab, setActiveTab] = useState(0);

  // search UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{id: string, displayName?: string, photoURL?: string}>>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimerRef = useRef<number | null>(null);
  const searchUnsubRef = useRef<(() => void) | null>(null);
  
  // localStorage user debug state
  const [lsUserRaw, setLsUserRaw] = useState<Record<string, unknown> | null>(null);

  // Follow system state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  // Performance stats state
  const [performanceStats, setPerformanceStats] = useState<{
    totalMiles: number;
    topSpeed: number;
    avgDistance: number;
    maxDistance: number;
    totalTrips: number;
    fleetSize: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Unit system state (metric or imperial)
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Initialize edit form fields when switching to Edit Profile tab
  useEffect(() => {
    if (activeTab === 1 && profile) {
      setEditDisplayName(profile.displayName || '');
      setEditBio(profile.bio || '');
      setEditPhotoURL(profile.photoURL || '');
      setEditBannerURL(profile.bannerURL || '');
    }
  }, [activeTab, profile]);

  // Simple CountUp component for numeric stats
  const formatNumber = (num: number | string | undefined | null): string => {
    if (!num && num !== 0) return '0';
    
    if (typeof num === 'string') {
      // Remove any non-digit characters and convert to number
      const cleaned = num.replace(/[^0-9]/g, '');
      num = parseInt(cleaned, 10) || 0;
    }
    
    num = Number(num) || 0;
    
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return Math.round(num).toString();
  };

  // Conversion functions for units (memoized)
  const convertDistance = useCallback((km: number | undefined | null) => {
    const value = Number(km) || 0;
    if (unitSystem === 'imperial') {
      return Math.round(value * 0.621371); // km to miles
    }
    return Math.round(value);
  }, [unitSystem]);

  const convertSpeed = useCallback((kmh: number | undefined | null) => {
    const value = Number(kmh) || 0;
    if (unitSystem === 'imperial') {
      return Math.round(value * 0.621371); // km/h to mph
    }
    return Math.round(value);
  }, [unitSystem]);

  const getDistanceUnit = useCallback(() => unitSystem === 'imperial' ? 'MI' : 'KM', [unitSystem]);
  const getSpeedUnit = useCallback(() => unitSystem === 'imperial' ? 'MPH' : 'KMH', [unitSystem]);

  const CountUp = ({ value }: { value: string }) => {
    const [display, setDisplay] = useState<string>(value);
    const prevValueRef = useRef<string>(value);

    useEffect(() => {
      // Only animate if the value actually changed
      if (prevValueRef.current === value) {
        return;
      }
      prevValueRef.current = value;

      const numeric = String(value).replace(/[^0-9]/g, '');
      if (!numeric) { setDisplay(value); return; }
      const target = Number(numeric);
      const suffix = String(value).replace(numeric, '').trim();
      const start = 0;
      const duration = 900;
      let raf = 0;
      const startTime = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - startTime) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const cur = Math.floor(start + (target - start) * eased);
        let formatted: string;
        if (cur >= 1000000000) {
          formatted = (cur / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
        } else if (cur >= 1000000) {
          formatted = (cur / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
        } else if (cur >= 1000) {
          formatted = (cur / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        } else {
          formatted = cur.toString();
        }
        setDisplay(formatted + (suffix ? ' ' + suffix : ''));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [value]);
    return <>{display}</>;
  };

  

  // cropping modal state
  const [cropVisible, setCropVisible] = useState(false);
  const [cropType, setCropType] = useState<'avatar'|'banner'>('avatar');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const draggingRef = useRef<{ down: boolean; x: number; y: number }>({ down: false, x: 0, y: 0 });

  useEffect(() => {
    // populate localStorage snapshot for debugging/robustness
    try {
      const s = localStorage.getItem('user');
      if (s) setLsUserRaw(JSON.parse(s));
    } catch {
      setLsUserRaw(null);
    }

    const run = async () => {
      setLoading(true);

      // Check for explicit userId in query string (shareable URL) unless override provided
      let params: URLSearchParams | null = null;
      try {
        params = new URLSearchParams(window.location.search);
      } catch {}
      const queryUserId = params?.get("userId") || params?.get("uid");

      // Determine current viewer id: prefer override, then Firebase auth.currentUser (wait briefly), fall back to localStorage
      let currentViewerIdLocal: string | null = null;
      if (!overrideUserId) {
        try {
          if (auth) {
            if (auth.currentUser && auth.currentUser.uid) {
              currentViewerIdLocal = auth.currentUser.uid;
            } else {
              const result = await new Promise<string | null>((resolve) => {
                let resolved = false;
                const unsub = onAuthStateChanged(auth, (u) => {
                  if (!resolved) {
                    resolved = true;
                    try {
                      unsub();
                    } catch {}
                    resolve(u?.uid ?? null);
                  }
                });
                setTimeout(() => {
                  if (!resolved) {
                    resolved = true;
                    try {
                      unsub();
                    } catch {}
                    const stored = localStorage.getItem("user");
                    try {
                      const parsed = stored ? JSON.parse(stored) : null;
                      resolve(parsed?.uid ?? null);
                    } catch {
                      resolve(null);
                    }
                  }
                }, 800);
              });
              currentViewerIdLocal = result;
            }
          }
        } catch {
          // ignore
        }

        if (!currentViewerIdLocal) {
          try {
            const stored = localStorage.getItem("user");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed?.uid) {
                currentViewerIdLocal = parsed.uid;
              }
            }
          } catch {}
        }
      }

      // expose the viewer id into state
      setCurrentViewerId(currentViewerIdLocal ?? null);

      const targetId = overrideUserId || queryUserId || currentViewerIdLocal;

      if (!targetId) {
        setLoading(false);
        setProfile(null);
        return;
      }

      try {
        const res = await fetch(`/api/user/profile/${encodeURIComponent(targetId)}`);
        if (!res.ok) {
          setProfile(null);
        } else {
          const data = await res.json();
          setProfile({
            id: data.id,
            displayName: data.displayName,
            email: data.email,
            photoURL: data.photoURL,
            bannerURL: data.bannerURL || null,
            bio: data.bio,
            location: data.location,
            website: data.website,
            slug: data.slug ?? null,
            verified: data.verified ?? false,
            stats: data.stats || { followers: 0, following: 0, views: 0 },
          });
          // prefill slug input if profile has slug
          if (data.slug) {
            setSlugInput(String(data.slug));
            setSavedSlug(String(data.slug));
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch profile", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    const unsub = onAuthStateChanged(auth, () => {
      run();
    });

    run();
    return () => unsub();
  }, [overrideUserId]);

  // perform debounced search for displayName
  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    const q = (searchQuery || '').trim();
    if (!q) {
      // clear any existing snapshot
      if (searchUnsubRef.current) { try { searchUnsubRef.current(); } catch {} searchUnsubRef.current = null; }
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    // debounce before performing RTDB query+filter
    searchTimerRef.current = window.setTimeout(async () => {
      try {
        // clear any previous unsub (not used for RTDB fetch)
        if (searchUnsubRef.current) { try { searchUnsubRef.current(); } catch {} searchUnsubRef.current = null; }
        const database = getDatabase(app);
        const snap = await dbGet(dbChild(dbRef(database), 'users'));
        const arr: any[] = [];
        if (snap.exists()) {
          const usersObj = snap.val() as Record<string, any>;
          const qlower = q.toLowerCase();
          Object.entries(usersObj).forEach(([id, u]) => {
            // copy values to avoid referencing mutable DB objects
            const displayName = String((u && (u.displayName || '')) || '');
            const slug = String((u && (u.slug || '')) || '');
            const photoURL = (u && u.photoURL) || null;
            if (displayName.toLowerCase().includes(qlower) || slug.toLowerCase().includes(qlower)) {
              arr.push({ id, displayName, photoURL, slug: slug || null });
            }
          });
        }
        // dedupe by id just in case
        const deduped: any[] = [];
        const seen = new Set<string>();
        for (const item of arr) {
          if (!seen.has(item.id)) { seen.add(item.id); deduped.push(item); }
        }
        setSearchResults(deduped);
      } catch (e) {
        console.error('RTDB search failed', e);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => {
      if (searchTimerRef.current) { window.clearTimeout(searchTimerRef.current); searchTimerRef.current = null; }
      // note: we keep snapshot active until next query clears it, but also ensure cleanup
      if (searchUnsubRef.current) { try { searchUnsubRef.current(); } catch {} searchUnsubRef.current = null; }
    };
  }, [searchQuery]);

  // Record a view when profile loads
  useEffect(() => {
    if (profile && profile.id && !hasViewed && currentViewerId !== profile.id) {
      const recordView = async () => {
        try {
          await fetch(`/api/user/view/${profile.id}`, { method: 'POST' });
          setHasViewed(true);
        } catch (error) {
          console.error('Failed to record view:', error);
        }
      };
      recordView();
    }
  }, [profile, hasViewed, currentViewerId]);

  // Load performance stats for the viewed user
  useEffect(() => {
    if (!profile || !profile.id) {
      setPerformanceStats(null);
      return;
    }

    const loadPerformanceStats = async () => {
      setStatsLoading(true);
      try {
        const res = await fetch(`/api/user/performance/${profile.id}`);
        if (res.ok) {
          const data = await res.json();
          setPerformanceStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to load performance stats:', error);
        setPerformanceStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    loadPerformanceStats();
  }, [profile?.id, profile]);

  // Load follow status and stats
  useEffect(() => {
    if (!profile?.id || !currentViewerId || currentViewerId === profile.id) {
      setIsFollowing(false);
      return;
    }

    const loadFollowStatus = async () => {
      try {
        const res = await fetch(`/api/user/stats/${profile.id}?currentUserId=${currentViewerId}`);
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.isFollowing || false);
          // Update profile with latest stats
          setProfile(prev => prev ? { ...prev, stats: data.stats } : null);
        }
      } catch (error) {
        console.error('Failed to load follow status:', error);
      }
    };

    loadFollowStatus();
  }, [profile?.id, currentViewerId]);

  const handleFollow = useCallback(async () => {
    if (!profile?.id || !currentViewerId || currentViewerId === profile.id) return;

    setFollowLoading(true);
    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: currentViewerId,
          followingId: profile.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(true);
        setProfile(prev => prev ? {
          ...prev,
          stats: {
            followers: data.followerCount,
            following: prev.stats?.following || 0,
            views: prev.stats?.views || 0,
          },
        } : null);
      } else {
        const error = await res.json();
        console.error('Follow error:', error.error);
      }
    } catch (error) {
      console.error('Failed to follow:', error);
    } finally {
      setFollowLoading(false);
    }
  }, [profile?.id, currentViewerId]);

  const handleUnfollow = useCallback(async () => {
    if (!profile?.id || !currentViewerId || currentViewerId === profile.id) return;

    setFollowLoading(true);
    try {
      const res = await fetch('/api/user/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: currentViewerId,
          followingId: profile.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(false);
        setProfile(prev => prev ? {
          ...prev,
          stats: {
            followers: data.followerCount,
            following: prev.stats?.following || 0,
            views: prev.stats?.views || 0,
          },
        } : null);
      } else {
        const error = await res.json();
        console.error('Unfollow error:', error.error);
      }
    } catch (error) {
      console.error('Failed to unfollow:', error);
    } finally {
      setFollowLoading(false);
    }
  }, [profile?.id, currentViewerId]);

  const handleCopyShare = async () => {
    if (!profile) return;
    const slugOrId = profile.slug || savedSlug || profile.id;
    const url = `${window.location.origin}/profile/${encodeURIComponent(slugOrId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      console.error('Copy failed');
    }
  };

  const handleShareToFacebook = () => {
    if (!profile) return;
    const slugOrId = profile.slug || savedSlug || profile.id;
    const url = `${window.location.origin}/profile/${encodeURIComponent(slugOrId)}`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
  };

  // normalize slug same as server
  const normalizeSlug = (s: string) =>
    String(s || "").trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-');

  // check availability when slugInput changes
  useEffect(() => {
    let cancelled = false;
    const val = normalizeSlug(slugInput);
    if (!val) {
      setSlugAvailable(null);
      setSlugMessage(null);
      return;
    }

    setSlugChecking(true);
    setSlugAvailable(null);
    setSlugMessage(null);

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/slug?slug=${encodeURIComponent(val)}`);
        if (!res.ok) {
          if (!cancelled) setSlugMessage('Error checking slug');
        } else {
          const data = await res.json();
          if (!cancelled) {
            if (data.available) {
              setSlugAvailable(true);
              setSlugMessage('Available');
            } else if (data.owner && data.owner === profile?.id) {
              setSlugAvailable(true);
              setSlugMessage('Already yours');
            } else {
              setSlugAvailable(false);
              setSlugMessage('Taken');
            }
          }
        }
      } catch (err) {
        if (!cancelled) setSlugMessage('Check failed');
      } finally {
        if (!cancelled) setSlugChecking(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slugInput, profile?.id]);

  const handleSaveSlug = async () => {
    if (!profile) return;
    const val = normalizeSlug(slugInput);
    if (!val) return;
    setSavingSlug(true);
    try {
      const res = await fetch('/api/user/slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, slug: val }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedSlug(data.slug || val);
        setProfile((p) => (p ? { ...p, slug: data.slug || val } : p));
        setSlugMessage('Saved');
      } else if (data.owner) {
        setSlugMessage('Taken');
      } else {
        setSlugMessage(data.message || 'Failed');
      }
    } catch (err) {
      setSlugMessage('Save failed');
    } finally {
      setSavingSlug(false);
    }
  };

  // ---------- cropping helpers ----------
  const drawPreview = () => {
    if (!cropCanvasRef.current || !imgRef.current || !cropSrc) return;
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = imgRef.current;
    const previewW = canvas.width;
    const previewH = canvas.height;
    const scaledW = img.naturalWidth * cropScale;
    const scaledH = img.naturalHeight * cropScale;
    // clear
    ctx.clearRect(0, 0, previewW, previewH);
    // draw image at offset
    ctx.drawImage(img, cropOffset.x, cropOffset.y, scaledW, scaledH);
  };

  useEffect(() => {
    if (!cropSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      // setup canvas size based on type
      const canvas = cropCanvasRef.current;
      if (!canvas) return;
      if (cropType === 'avatar') {
        canvas.width = 400;
        canvas.height = 400;
      } else {
        canvas.width = 900;
        canvas.height = 300;
      }
      // scale so image covers canvas
      const minScale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      setCropScale(minScale);
      // center
      const scaledW = img.naturalWidth * minScale;
      const scaledH = img.naturalHeight * minScale;
      setCropOffset({ x: (canvas.width - scaledW) / 2, y: (canvas.height - scaledH) / 2 });
    };
    img.src = cropSrc;
  }, [cropSrc, cropType]);

  useEffect(() => {
    drawPreview();
  }, [cropScale, cropOffset, cropSrc]);

  const clampOffset = (x: number, y: number, canvasW: number, canvasH: number, imgW: number, imgH: number) => {
    const minX = Math.min(0, canvasW - imgW);
    const maxX = 0;
    const minY = Math.min(0, canvasH - imgH);
    const maxY = 0;
    return { x: Math.max(minX, Math.min(maxX, x)), y: Math.max(minY, Math.min(maxY, y)) };
  };

  const applyCropAndUpload = async () => {
    if (!imgRef.current || !cropCanvasRef.current || !profile) return;
    const canvas = cropCanvasRef.current;
    const finalW = cropType === 'avatar' ? 512 : 1200;
    const finalH = cropType === 'avatar' ? 512 : 360;
    // compute scaled sizes relative to preview -> final
    const ratio = finalW / canvas.width;
    const img = imgRef.current;
    const scaledW = img.naturalWidth * cropScale * ratio;
    const scaledH = img.naturalHeight * cropScale * ratio;
    const finalOffsetX = cropOffset.x * ratio;
    const finalOffsetY = cropOffset.y * ratio;
    const out = document.createElement('canvas');
    out.width = finalW;
    out.height = finalH;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,finalW,finalH);
    ctx.drawImage(img, finalOffsetX, finalOffsetY, scaledW, scaledH);
    return new Promise<string | null>(async (resolve) => {
      out.toBlob(async (blob) => {
        if (!blob) { resolve(null); return; }
        try {
          const storage = getStorage(app, STORAGE_GS_URL);
          // use deterministic filename per user so uploads overwrite previous
          const filename = cropType === 'avatar' ? `avatars/${profile.id}.png` : `banners/${profile.id}.jpg`;
          const storageRef = sRef(storage, filename);

          setUploadingType(cropType);
          setUploadProgress(0);

          const task = uploadBytesResumable(storageRef, blob as Blob);
          task.on('state_changed', (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 100);
            setUploadProgress(pct);
          }, (err) => {
            console.error('Upload failed', err);
            alert('Upload failed');
            setUploadProgress(null);
            setUploadingType(null);
            resolve(null);
          }, async () => {
            try {
              const url = await getDownloadURL(storageRef);
              if (cropType === 'avatar') setEditPhotoURL(url); else setEditBannerURL(url);
              setUploadProgress(null);
              setUploadingType(null);
              resolve(url);
            } catch (err) {
              console.error('Upload finalize failed', err);
              alert('Upload failed');
              setUploadProgress(null);
              setUploadingType(null);
              resolve(null);
            }
          });
        } catch (err) {
          console.error('Upload failed', err);
          alert('Upload failed');
          setUploadProgress(null);
          setUploadingType(null);
          resolve(null);
        }
      }, 'image/png');
    });
  };

  // Save profile helper used by modal
  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      const payload: any = {};
      if (editDisplayName !== profile.displayName) payload.displayName = editDisplayName;
      if (editPhotoURL !== profile.photoURL) payload.photoURL = editPhotoURL;
      // compare banner explicitly against empty/defaults to avoid false-negatives
      if ((editBannerURL || '') !== ((profile as any).bannerURL || '')) payload.bannerURL = editBannerURL || null;
      // normalize bio comparison to avoid null/undefined mismatches
      const currentBio = profile.bio ?? '';
      if (editBio !== currentBio) payload.bio = editBio;
      if (Object.keys(payload).length === 0) { setEditingProfile(false); return; }
      const res = await fetch(`/api/user/profile/${encodeURIComponent(profile.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setProfile(p => p ? { ...p, ...payload } : p);
        try {
          const authUser = (auth && (auth.currentUser as any)) || null;
          const toUpdate: any = {};
          if (payload.displayName !== undefined) toUpdate.displayName = payload.displayName;
          if (payload.photoURL !== undefined) toUpdate.photoURL = payload.photoURL;
          if (authUser && Object.keys(toUpdate).length > 0) {
            try {
              await updateProfile(authUser, toUpdate);
            } catch (err) { console.warn('updateProfile failed', err); }
          }
          try {
            const s = localStorage.getItem('user');
            if (s) {
              const parsed = JSON.parse(s);
              if (toUpdate.displayName !== undefined) parsed.displayName = toUpdate.displayName;
              if (toUpdate.photoURL !== undefined) parsed.photoURL = toUpdate.photoURL;
              if (payload.bannerURL !== undefined) parsed.bannerURL = payload.bannerURL;
              localStorage.setItem('user', JSON.stringify(parsed));
            }
            window.dispatchEvent(new CustomEvent('auth-change', { detail: JSON.parse(localStorage.getItem('user') || '{}') }));
            window.dispatchEvent(new CustomEvent('profile-updated', { detail: { userId: profile.id, ...payload } }));
          } catch {}
        } catch (e) { /* ignore */ }
        setEditingProfile(false);
      } else {
        const text = await res.text();
        console.error('Failed saving profile', text);
        alert('Failed to save profile');
      }
    } catch (e) { console.error(e); alert('Save error'); }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>Loading profile...</Typography>
        </Box>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, maxWidth: 400 }}>
          <Box sx={{ width: 100, height: 100, mx: 'auto', mb: 3, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck className="h-12 w-12 text-red-400" />
          </Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>Profile Not Found</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>This profile doesn&apos;t exist or has been removed.</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#000000', color: '#fff', position: 'relative', overflow: 'hidden', pt: 12 }}>

      {/* Owner Tab Navigation */}
      {currentViewerId === profile?.id && (
        <Box sx={{ maxWidth: '900px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                minWidth: 'auto',
                px: 2.5,
                py: 1.5,
                '&:hover': {
                  color: '#fff',
                  bgcolor: 'rgba(168, 85, 247, 0.1)'
                },
                transition: 'all 300ms ease'
              },
              '& .MuiTab-root.Mui-selected': {
                color: '#a855f7'
              },
              '& .MuiTabScrollButton-root': {
                color: 'rgba(255,255,255,0.6)'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#a855f7',
                height: '3px'
              }
            }}
          >
            <Tab label="Home" />
            <Tab label="Edit Profile" />
          </Tabs>
        </Box>
      )}

      {/* Main Content Container */}
      <Box sx={{ position: 'relative', zIndex: 2, maxWidth: '900px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Content based on active tab for owners, always show home for non-owners */}
        {(currentViewerId !== profile?.id || activeTab === 0) && (
          <>
            {/* Header Banner with Overlay - Now inside the container */}
            <Box sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 200, sm: 240, md: 260 },
          overflow: 'hidden',
          zIndex: 1,
          mb: -3,
          borderRadius: '12px',
          border: '3px solid #a855f7',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: profile?.bannerURL
              ? `url(${profile.bannerURL}) center/cover no-repeat`
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.12) 100%)',
            zIndex: 1,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.95) 100%)',
            zIndex: 2
          }
        }}>
          {/* Edit banner button for owner */}
          {currentViewerId === profile.id && (
            <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
              <Button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setCropSrc(String(reader.result));
                      setCropType('banner');
                      setCropScale(1);
                      setCropOffset({ x: 0, y: 0 });
                      setCropVisible(true);
                    };
                    reader.readAsDataURL(f);
                  };
                  input.click();
                }}
                variant="contained"
                size="small"
                sx={{
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)',
                    borderColor: 'rgba(255,255,255,0.4)'
                  },
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  px: 1.5,
                  py: 0.6,
                  transition: 'all 400ms ease'
                }}
                startIcon={<Camera className="w-4 h-4" />}
              >
                Banner
              </Button>
            </Box>
          )}
        </Box>

        {/* Profile Header Section - Overlapping Avatar */}
        <Box sx={{ mt: { xs: 1, sm: 2, md: 5 }, mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 3 }, alignItems: { xs: 'center', sm: 'flex-end' } }}>
            {/* Avatar */}
            <Box sx={{
              position: 'relative',
              flexShrink: 0,
              width: { xs: 100, sm: 120, md: 140 },
              height: { xs: 100, sm: 120, md: 140 }
            }}>
              <Avatar
                sx={{
                  width: '100%',
                  height: '100%',
                  boxShadow: '0 30px 70px rgba(0,0,0,0.85), 0 0 40px rgba(16, 185, 129, 0.2)',
                  border: '3px solid #a855f7',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  fontSize: '3.5rem',
                  fontWeight: 800,
                  transition: 'all 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    boxShadow: '0 40px 90px rgba(0,0,0,0.9), 0 0 60px rgba(16, 185, 129, 0.3)'
                  }
                }}
                src={profile?.photoURL || undefined}
              >
                {!profile?.photoURL && (profile?.displayName ? profile.displayName[0].toUpperCase() : '?')}
              </Avatar>
              {/* Avatar Edit Button */}
              {currentViewerId === profile.id && (
                <Button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setCropSrc(String(reader.result));
                        setCropType('avatar');
                        setCropScale(1);
                        setCropOffset({ x: 0, y: 0 });
                        setCropVisible(true);
                      };
                      reader.readAsDataURL(f);
                    };
                    input.click();
                  }}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'rgba(16, 185, 129, 0.95)',
                    color: '#fff',
                    minWidth: 'auto',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid #0f0f1e',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                    '&:hover': {
                      bgcolor: 'rgba(16, 185, 129, 1)',
                      boxShadow: '0 12px 36px rgba(16, 185, 129, 0.6)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  <Camera className="w-6 h-6" />
                </Button>
              )}
            </Box>

            {/* Profile Info */}
            <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 0.25 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                    letterSpacing: '-0.02em',
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  {profile?.displayName || profile?.email || 'User'}
                </Typography>
              </Box>

              {profile?.slug && (
                <Typography
                  variant="body1"
                  sx={{
                    color: '#10b981',
                    mb: 0.5,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    letterSpacing: '0.3px'
                  }}
                >
                  @{profile.slug}
                </Typography>
              )}

              {profile?.bio && (
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    maxWidth: 600,
                    lineHeight: 1.7,
                    mb: 2,
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                >
                  {profile.bio}
                </Typography>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <Button
                  variant="contained"
                  onClick={handleCopyShare}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 2.5,
                    py: 0.8,
                    fontSize: '0.85rem',
                    letterSpacing: '0.3px',
                    boxShadow: '0 12px 32px rgba(16, 185, 129, 0.3)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 20px 48px rgba(16, 185, 129, 0.4)',
                      background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                    },
                    transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  startIcon={shareCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                >
                  {shareCopied ? 'Copied!' : 'Share'}
                </Button>

                {/* Follow/Unfollow Button - Only show if not own profile */}
                {currentViewerId && currentViewerId !== profile?.id && (
                  <Button
                    variant="contained"
                    onClick={isFollowing ? handleUnfollow : handleFollow}
                    disabled={followLoading}
                    sx={{
                      background: isFollowing 
                        ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                        : 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 2.5,
                      py: 0.8,
                      fontSize: '0.85rem',
                      letterSpacing: '0.3px',
                      boxShadow: isFollowing
                        ? '0 12px 32px rgba(99, 102, 241, 0.3)'
                        : '0 12px 32px rgba(168, 85, 247, 0.3)',
                      border: isFollowing
                        ? '1px solid rgba(99, 102, 241, 0.5)'
                        : '1px solid rgba(168, 85, 247, 0.5)',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: isFollowing
                          ? '0 20px 48px rgba(99, 102, 241, 0.4)'
                          : '0 20px 48px rgba(168, 85, 247, 0.4)',
                        background: isFollowing
                          ? 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)'
                          : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                      },
                      transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '&:disabled': {
                        opacity: 0.7,
                      },
                    }}
                  >
                    {followLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {/* Stats Section */}
          <Box sx={{ display: 'flex', gap: { xs: 3, sm: 4 }, justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#10b981', mb: 0.5 }}>
                {formatNumber(profile?.stats?.followers || 0)}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Followers
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#a855f7', mb: 0.5 }}>
                {formatNumber(profile?.stats?.following || 0)}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Following
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#3b82f6', mb: 0.5 }}>
                {formatNumber(profile?.stats?.views || 0)}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Views
              </Typography>
            </Box>
          </Box>

          {/* Divider */}
          <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.05)' }} />

          {/* Stats Section */}
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.5px' }}>
                Performance Stats
              </Typography>
              {/* Unit Toggle Button */}
              <Button
                variant="outlined"
                size="small"
                onClick={() => setUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric')}
                sx={{
                  borderColor: '#a855f7',
                  color: '#a855f7',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  px: 1.5,
                  py: 0.5,
                  '&:hover': {
                    borderColor: '#9333ea',
                    backgroundColor: 'rgba(168, 85, 247, 0.05)',
                  },
                }}
              >
                {unitSystem === 'metric' ? 'Switch to Imperial' : 'Switch to Metric'}
              </Button>
            </Box>
            {statsLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4, gap: 1.5 }}>
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Loading stats...</Typography>
              </Box>
            ) : performanceStats ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                {[
                  { 
                    label: `Total Distance`, 
                    value: formatNumber(convertDistance(performanceStats.totalMiles)),
                    unit: getDistanceUnit(),
                    color: '#10b981', 
                    darkColor: 'rgba(16, 185, 129, 0.1)' 
                  },
                  { 
                    label: 'Top Speed', 
                    value: formatNumber(convertSpeed(performanceStats.topSpeed)),
                    unit: getSpeedUnit(),
                    color: '#3b82f6', 
                    darkColor: 'rgba(59, 130, 246, 0.1)' 
                  },
                  { 
                    label: 'Avg Distance', 
                    value: formatNumber(convertDistance(performanceStats.avgDistance)),
                    unit: getDistanceUnit(),
                    color: '#f59e0b', 
                    darkColor: 'rgba(245, 158, 11, 0.1)' 
                  },
                  { 
                    label: 'Max Distance', 
                    value: formatNumber(convertDistance(performanceStats.maxDistance)),
                    unit: getDistanceUnit(),
                    color: '#8b5cf6', 
                    darkColor: 'rgba(139, 92, 246, 0.1)' 
                  },
                  { 
                    label: 'Total Trips', 
                    value: formatNumber(performanceStats.totalTrips),
                    unit: 'TRIPS',
                    color: '#ec4899', 
                    darkColor: 'rgba(236, 72, 153, 0.1)' 
                  },
                  { 
                    label: 'Fleet Size', 
                    value: formatNumber(performanceStats.fleetSize),
                    unit: 'VEHICLES',
                    color: '#06b6d4', 
                    darkColor: 'rgba(6, 182, 212, 0.1)' 
                  },
                ].map((stat, idx) => (
                  <Box key={idx} sx={{ display: 'flex' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${stat.darkColor} 0%, rgba(255,255,255,0.02) 100%)`,
                        border: `1.5px solid ${stat.color}33`,
                        backdropFilter: 'blur(12px)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: `0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 ${stat.color}22`,
                        transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`,
                          opacity: 0,
                          transition: 'opacity 400ms ease'
                        },
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          border: `1.5px solid ${stat.color}`,
                          boxShadow: `0 20px 50px ${stat.color}25, inset 0 1px 0 ${stat.color}33`,
                          background: `linear-gradient(135deg, ${stat.darkColor} 0%, rgba(255,255,255,0.04) 100%)`,
                          '&::before': { opacity: 1 }
                        }
                      }}
                    >
                      <Box>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}10)`,
                            border: `1.5px solid ${stat.color}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1,
                            transition: 'all 400ms ease'
                          }}
                        >
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: 0.75,
                              background: `linear-gradient(135deg, ${stat.color}80, ${stat.color}40)`,
                              opacity: 0.8
                            }}
                          />
                        </Box>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 800,
                            background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '1.25rem',
                            mb: 1,
                            letterSpacing: '-0.02em'
                          }}
                        >
                          {stat.value} <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{stat.unit}</span>
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            background: `${stat.color}20`,
                            px: 1,
                            py: 0.4,
                            borderRadius: 0.75,
                            color: stat.color,
                            fontWeight: 700,
                            display: 'inline-block',
                            fontSize: '0.65rem',
                            letterSpacing: '0.5px',
                            border: `1px solid ${stat.color}40`
                          }}
                        >
                          Stats
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.75)',
                          fontWeight: 600,
                          mt: 1.5,
                          fontSize: '0.8rem',
                          letterSpacing: '-0.2px'
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>No performance stats available</Typography>
              </Box>
            )}
          </Box>

          {/* Edit Profile Section - Removed from home, moved to Edit Profile tab */}
          </>
        )}

        {/* Billing Tab Content - Edit Profile Form */}
        {currentViewerId === profile?.id && activeTab === 1 && (
          <Box>
            {/* Header Section */}
            <Box sx={{ mb: 4, position: 'relative' }}>
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
                borderRadius: 3,
                p: 3,
                border: '1.5px solid rgba(168, 85, 247, 0.3)',
                backdropFilter: 'blur(12px)'
              }}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, background: 'linear-gradient(135deg, #a855f7 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.8rem' }}>
                  Edit Your Profile
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                  Make your profile stand out. Update your name, bio, and more!
                </Typography>
              </Box>
            </Box>

            {/* Edit Form */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(168, 85, 247, 0.2)', backdropFilter: 'blur(20px)' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                {/* Display Name Section */}
                <Box>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(168, 85, 247, 0.9)', fontWeight: 800, letterSpacing: '0.8px', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      ✨ Display Name
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {editDisplayName.length}/16
                    </Typography>
                  </Box>
                  <TextField
                    value={editDisplayName}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.length <= 16) setEditDisplayName(v);
                      else setEditDisplayName(v.slice(0, 16));
                    }}
                    fullWidth
                    placeholder="Enter your name"
                    inputProps={{ maxLength: 16 }}
                    InputLabelProps={{ style: { color: 'rgba(255,255,255,0.6)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        borderColor: 'rgba(168, 85, 247, 0.3)',
                        borderRadius: 2,
                        transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                        fontSize: '1rem',
                        py: 1.5,
                        '&:hover': { 
                          borderColor: 'rgba(168, 85, 247, 0.5)',
                          bgcolor: 'rgba(255,255,255,0.06)'
                        },
                        '&.Mui-focused': {
                          borderColor: 'rgba(168, 85, 247, 0.8)',
                          boxShadow: '0 0 30px rgba(168, 85, 247, 0.2)',
                          border: '2px solid rgba(168, 85, 247, 0.8)'
                        }
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(255,255,255,0.4)',
                        opacity: 1
                      }
                    }}
                  />
                </Box>

                {/* Bio Section */}
                <Box>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(168, 85, 247, 0.9)', fontWeight: 800, letterSpacing: '0.8px', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      📝 About You
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {editBio.length}/150
                    </Typography>
                  </Box>
                  <TextField
                    value={editBio}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.length <= 150) setEditBio(v);
                      else setEditBio(v.slice(0, 150));
                    }}
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Tell us about yourself... what makes you unique?"
                    inputProps={{ maxLength: 150 }}
                    InputLabelProps={{ style: { color: 'rgba(255,255,255,0.6)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        borderColor: 'rgba(168, 85, 247, 0.3)',
                        borderRadius: 2,
                        transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                        py: 1.5,
                        px: 2,
                        '&:hover': { 
                          borderColor: 'rgba(168, 85, 247, 0.5)',
                          bgcolor: 'rgba(255,255,255,0.06)'
                        },
                        '&.Mui-focused': {
                          borderColor: 'rgba(168, 85, 247, 0.8)',
                          boxShadow: '0 0 30px rgba(168, 85, 247, 0.2)',
                          border: '2px solid rgba(168, 85, 247, 0.8)'
                        }
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(255,255,255,0.4)',
                        opacity: 1
                      },
                      '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.45)', fontWeight: 500, display: 'none' }
                    }}
                  />
                  {editBio.length > 120 && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mt: 1 }}>
                      {150 - editBio.length} characters remaining
                    </Typography>
                  )}
                </Box>

                {/* Website/URL Section */}
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(168, 85, 247, 0.9)', fontWeight: 800, letterSpacing: '0.8px', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      🔗 Website/URL
                    </Typography>
                  </Box>
                  <TextField
                    value={profile?.website || ''}
                    onChange={(e) => {
                      // Website edit would go here if you want to add it to state
                    }}
                    fullWidth
                    placeholder="https://yourwebsite.com"
                    disabled
                    helperText="Website editing coming soon"
                    InputLabelProps={{ style: { color: 'rgba(255,255,255,0.6)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.02)',
                        color: '#fff',
                        borderColor: 'rgba(168, 85, 247, 0.2)',
                        borderRadius: 2,
                        transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                        py: 1.5,
                        '&:hover': { 
                          borderColor: 'rgba(168, 85, 247, 0.3)',
                          bgcolor: 'rgba(255,255,255,0.03)'
                        }
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(255,255,255,0.4)',
                        opacity: 1
                      },
                      '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: '0.8rem' }
                    }}
                  />
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      fontWeight: 800,
                      textTransform: 'none',
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      borderRadius: 2,
                      boxShadow: '0 12px 40px rgba(16, 185, 129, 0.35)',
                      border: '1px solid rgba(16, 185, 129, 0.6)',
                      transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 60px rgba(16, 185, 129, 0.45)',
                        background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                      }
                    }}
                    startIcon={<Check className="w-5 h-5" />}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditDisplayName(profile.displayName || '');
                      setEditBio(profile.bio || '');
                    }}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 3.5,
                      py: 1.5,
                      fontSize: '1rem',
                      borderRadius: 2,
                      border: '2px solid rgba(255,255,255,0.2)',
                      transition: 'all 300ms ease',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.4)',
                        bgcolor: 'rgba(255,255,255,0.08)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Reset
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Transactions Tab Content */}
        {currentViewerId === profile?.id && activeTab === 2 && (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(168, 85, 247, 0.2)' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Transactions</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Transaction history coming soon...</Typography>
          </Paper>
        )}

        {/* Edit Profile Tab Content */}
        {currentViewerId === profile?.id && activeTab === 3 && (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(168, 85, 247, 0.2)' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Edit Profile</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Click the Edit button on your profile to make changes...</Typography>
          </Paper>
        )}
        {/* Crop Modal */}
        {cropVisible && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 100,
            p: 2,
            animation: 'fadeIn 300ms ease'
          }}
          onClick={() => {
            setCropVisible(false);
            setCropSrc(null);
          }}
        >
          <Paper
            elevation={0}
            onClick={(e) => e.stopPropagation()}
            sx={{
              bgcolor: 'rgba(15,15,30,0.97)',
              border: '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: 4,
              p: 4.5,
              maxWidth: 900,
              boxShadow: '0 30px 80px rgba(0,0,0,0.85), 0 0 40px rgba(16, 185, 129, 0.15)',
              animation: 'slideUp 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 }
              },
              '@keyframes slideUp': {
                from: { transform: 'translateY(40px)', opacity: 0 },
                to: { transform: 'translateY(0)', opacity: 1 }
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.3px' }}>
                Crop {cropType === 'avatar' ? 'Avatar' : 'Banner'}
              </Typography>
              <Button
                onClick={() => {
                  setCropVisible(false);
                  setCropSrc(null);
                }}
                sx={{
                  minWidth: 'auto',
                  p: 0.8,
                  color: 'rgba(255,255,255,0.5)',
                  '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                  transition: 'all 300ms ease',
                  borderRadius: '50%'
                }}
              >
                <X className="w-6 h-6" />
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 3.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <canvas
                ref={(c) => {
                  cropCanvasRef.current = c;
                }}
                style={{
                  background: '#0a0a14',
                  borderRadius: '12px',
                  touchAction: 'none',
                  cursor: 'grab',
                  width: cropType === 'avatar' ? 400 : '100%',
                  height: cropType === 'avatar' ? 400 : 300,
                  flex: 1,
                  minWidth: 300,
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
                }}
                onMouseDown={(e) => {
                  draggingRef.current.down = true;
                  draggingRef.current.x = e.clientX;
                  draggingRef.current.y = e.clientY;
                }}
                onMouseMove={(e) => {
                  if (!draggingRef.current.down || !cropCanvasRef.current || !imgRef.current) return;
                  const dx = e.clientX - draggingRef.current.x;
                  const dy = e.clientY - draggingRef.current.y;
                  draggingRef.current.x = e.clientX;
                  draggingRef.current.y = e.clientY;
                  const canvas = cropCanvasRef.current;
                  const img = imgRef.current;
                  const scaledW = img.naturalWidth * cropScale;
                  const scaledH = img.naturalHeight * cropScale;
                  const newPos = clampOffset(cropOffset.x + dx, cropOffset.y + dy, canvas.width, canvas.height, scaledW, scaledH);
                  setCropOffset(newPos);
                }}
                onMouseUp={() => {
                  draggingRef.current.down = false;
                }}
                onMouseLeave={() => {
                  draggingRef.current.down = false;
                }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: { xs: '100%', sm: 280 } }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', mb: 1.5, fontWeight: 700, letterSpacing: '0.3px' }}>
                    ZOOM LEVEL
                  </Typography>
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.01}
                    value={cropScale}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCropScale(v);
                      if (imgRef.current && cropCanvasRef.current) {
                        const canvas = cropCanvasRef.current;
                        const img = imgRef.current;
                        const scaledW = img.naturalWidth * v;
                        const scaledH = img.naturalHeight * v;
                        setCropOffset({
                          x: (canvas.width - scaledW) / 2,
                          y: (canvas.height - scaledH) / 2
                        });
                      }
                    }}
                    style={{
                      width: '100%',
                      cursor: 'pointer',
                      accentColor: '#10b981',
                      height: '6px'
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 1.5, textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
                    {(cropScale * 100).toFixed(0)}%
                  </Typography>
                </Box>

                {uploadProgress !== null && uploadingType === cropType && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', mb: 1.5, fontWeight: 700, letterSpacing: '0.3px' }}>
                      UPLOADING
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        bgcolor: 'rgba(255,255,255,0.08)',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                          width: `${uploadProgress}%`,
                          transition: 'width 200ms ease'
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 1.5, textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
                      {uploadProgress}%
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
                  <Button
                    variant="contained"
                    onClick={async () => {
                      const url = await applyCropAndUpload();
                      if (url) {
                        if (cropType === 'banner' && profile) {
                          try {
                            setProfile((p) => (p ? { ...p, bannerURL: url } : p));
                            await fetch(`/api/user/profile/${encodeURIComponent(profile.id)}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ bannerURL: url })
                            });
                            try {
                              const stored = localStorage.getItem('user');
                              const parsed = stored ? JSON.parse(stored) : {};
                              parsed.bannerURL = url;
                              localStorage.setItem('user', JSON.stringify(parsed));
                              window.dispatchEvent(new CustomEvent('auth-change', { detail: parsed }));
                            } catch (e) {
                              /* non-fatal */
                            }
                          } catch (err) {
                            console.warn('Failed to persist bannerURL', err);
                          }
                        }
                        if (cropType === 'avatar' && profile) {
                          setProfile((p) => (p ? { ...p, photoURL: url } : p));
                          try {
                            const authUser = (auth && (auth.currentUser as any)) || null;
                            if (authUser) {
                              try {
                                await updateProfile(authUser, { photoURL: url });
                              } catch (e) {
                                /* non-fatal */
                              }
                            }
                            await fetch(`/api/user/profile/${encodeURIComponent(profile.id)}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ photoURL: url })
                            });
                            try {
                              const stored = localStorage.getItem('user');
                              const parsed = stored ? JSON.parse(stored) : {};
                              parsed.photoURL = url;
                              localStorage.setItem('user', JSON.stringify(parsed));
                              window.dispatchEvent(new CustomEvent('auth-change', { detail: parsed }));
                              window.dispatchEvent(new CustomEvent('profile-updated', { detail: { userId: profile.id, photoURL: url } }));
                            } catch (e) {
                              /* non-fatal */
                            }
                          } catch (err) {
                            console.warn('Failed to persist avatar', err);
                          }
                        }
                        setCropVisible(false);
                      }
                    }}
                    fullWidth
                    sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      fontWeight: 700,
                      textTransform: 'none',
                      py: 1.3,
                      fontSize: '1rem',
                      boxShadow: '0 12px 32px rgba(16, 185, 129, 0.3)',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 18px 48px rgba(16, 185, 129, 0.4)'
                      },
                      transition: 'all 400ms ease'
                    }}
                    startIcon={<Check className="w-5 h-5" />}
                  >
                    Apply & Upload
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setCropVisible(false);
                      setCropSrc(null);
                      setUploadProgress(null);
                    }}
                    fullWidth
                    sx={{
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontWeight: 700,
                      textTransform: 'none',
                      py: 1.3,
                      fontSize: '1rem',
                      border: '2px solid rgba(255,255,255,0.2)',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.4)',
                        bgcolor: 'rgba(255,255,255,0.05)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 400ms ease'
                    }}
                    startIcon={<X className="w-5 h-5" />}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
        )}
      </Box>
    </Box>
  );
}