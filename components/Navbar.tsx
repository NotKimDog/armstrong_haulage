"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Home, Info, Images, Menu, X, ChevronRight, LogIn, LogOut, User as UserIcon, ChevronDown, Settings, Search, Loader2, Bell, Shield, Users, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth, app } from "../app/api/lib/firebase";
import { getDatabase, ref as dbRef, child as dbChild, get as dbGet } from "firebase/database";
import CookiesPopup from "./CookiesPopup";

type MappedUser = {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  uid: string;
  verified?: boolean;
  admin?: boolean;
  status?: string;
};

// Cloudflare auth context and hooks

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<MappedUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<number | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        const data = await response.json();
        if (data.authenticated && data.user) {
          const userData = data.user as MappedUser;
          // Fetch admin status from profile
          if (userData.uid) {
            try {
              const profileRes = await fetch(`/api/user/profile/${userData.uid}`);
              if (profileRes.ok) {
                const profileData = await profileRes.json();
                userData.admin = profileData.admin === true;
              }
            } catch (err) {
              console.error('Failed to fetch admin status:', err);
            }
          }
          setUser(userData);
          try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
          console.debug('Navbar: initial auth verified (server)', userData);
        } else {
          const storedUser = localStorage.getItem('user');
          console.debug('Navbar: initial localStorage user', storedUser);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();

    // Also subscribe to Firebase client auth state when available
    let unsub: (() => void) | undefined;
    try {
      if (auth) {
        unsub = onAuthStateChanged(auth, async (u) => {
          if (u) {
            const mapped: MappedUser = { displayName: u.displayName, email: u.email, photoURL: u.photoURL, uid: u.uid };
            // Fetch admin status and user status from profile
            try {
              const profileRes = await fetch(`/api/user/profile/${u.uid}`);
              if (profileRes.ok) {
                const profileData = await profileRes.json();
                mapped.admin = profileData.admin === true;
                mapped.status = profileData.status || 'online';
              }
            } catch (err) {
              console.error('Failed to fetch admin status:', err);
              mapped.status = 'online';
            }
            setUser(mapped);
            try { localStorage.setItem('user', JSON.stringify(mapped)); } catch {}
            console.debug('Navbar:onAuthStateChanged ->', mapped);
          } else {
            setUser(null);
            try { localStorage.removeItem('user'); } catch {}
            console.debug('Navbar:onAuthStateChanged -> logged out');
          }
        });
      }
    } catch {
      // ignore if firebase not configured on client
    }

    // If Discord OAuth redirected back with a discord_user payload, consume it and set local state
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const du = params.get('discord_user');
        if (du) {
          try {
            const decoded = atob(decodeURIComponent(du));
            const parsed = JSON.parse(decoded);
            const mapped = { displayName: parsed.username ? `${parsed.username}#${parsed.discriminator}` : parsed.id, email: parsed.email || undefined, photoURL: parsed.avatar_url || parsed.avatar || undefined, uid: parsed.id };
            console.debug('Navbar: found discord_user query ->', mapped);
            // avoid synchronous setState inside the same effect body
            setTimeout(() => setUser(mapped), 0);
            try { localStorage.setItem('user', JSON.stringify(mapped)); } catch {}
          } catch (e) {
            console.error('Failed to parse discord_user payload', e);
          }

          // Remove the query param without reloading
          params.delete('discord_user');
          const base = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
          window.history.replaceState({}, document.title, base);
        }
      }
    } catch {
      // ignore
    }

    // Listen for storage changes (logout from other tabs) and custom events
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user');
      console.debug('Navbar: storage event ->', storedUser);
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    const handleAuthChangeEvent = (e: Event) => {
      // e can be a CustomEvent with detail containing the mapped user
      try {
        const detail = (e as CustomEvent)?.detail;
        console.debug('Navbar: auth-change/discord-auth event ->', detail);
        if (detail) {
          setUser(detail);
          try { localStorage.setItem('user', JSON.stringify(detail)); } catch {}
          return;
        }
      } catch {
        // ignore
      }
      handleStorageChange();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('discord-auth', handleAuthChangeEvent as EventListener);
    window.addEventListener('auth-change', handleAuthChangeEvent as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('discord-auth', handleAuthChangeEvent as EventListener);
      window.removeEventListener('auth-change', handleAuthChangeEvent as EventListener);
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load notifications when user changes
  useEffect(() => {
    if (user?.uid) {
      loadNotifications(user.uid);
    }
  }, [user?.uid]);

  const loadNotifications = async (userId: string) => {
    try {
      const res = await fetch(`/api/notifications/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid }),
      });
      loadNotifications(user?.uid || '');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/delete/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid }),
      });
      loadNotifications(user?.uid || '');
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (communityRef.current && !communityRef.current.contains(event.target as Node)) {
        setIsCommunityOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setIsResourcesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      try {
        if (auth) await firebaseSignOut(auth);
      } catch {
        // ignore
      }
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navLinks = [
    { name: "Home", href: "/", icon: <Home className="w-4 h-4" /> },
  ];

  const communityLinks = [
    { name: "Leaderboard", href: "/leaderboard", requireAuth: false },
    { name: "Activity Feed", href: "/activity", requireAuth: true },
    { name: "Achievements", href: "/achievements", requireAuth: true },
    { name: "Analytics", href: "/analytics", requireAuth: true },
    { name: "Search Members", href: "/search", requireAuth: false },
  ];

  const resourcesLinks = [
    { name: "About Us", href: "/about", requireAuth: false },
    { name: "Gallery", href: "/gallery", requireAuth: false },
    { name: "Apply Now", href: "https://hub.truckyapp.com/company/40764", requireAuth: false, external: true },
  ];

  const communityRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);

  // Debounced search for profiles
  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    const q = (searchQuery || '').trim();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = window.setTimeout(async () => {
      try {
        const database = getDatabase(app);
        const snap = await dbGet(dbChild(dbRef(database), 'users'));
        const arr: any[] = [];
        if (snap.exists()) {
          const usersObj = snap.val() as Record<string, any>;
          const qlower = q.toLowerCase();
          Object.entries(usersObj).forEach(([id, u]) => {
            const displayName = String((u && (u.displayName || '')) || '');
            const slug = String((u && (u.slug || '')) || '');
            const photoURL = (u && u.photoURL) || null;
            if (displayName.toLowerCase().includes(qlower) || slug.toLowerCase().includes(qlower)) {
              arr.push({ id, displayName, photoURL, slug: slug || null });
            }
          });
        }
        const deduped: any[] = [];
        const seen = new Set<string>();
        for (const item of arr) {
          if (!seen.has(item.id)) { seen.add(item.id); deduped.push(item); }
        }
        setSearchResults(deduped);
      } catch (e) {
        console.error('Profile search failed', e);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => {
      if (searchTimerRef.current) { window.clearTimeout(searchTimerRef.current); searchTimerRef.current = null; }
    };
  }, [searchQuery]);

  return (
    <>
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled || isOpen ? "bg-black/80 backdrop-blur-md border-b border-white/10 py-2" : "bg-transparent py-4"}`}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* Logo - Left */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
                <motion.div 
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className="relative w-10 h-10 overflow-hidden rounded-xl border border-white/10 group-hover:border-purple-500/50 transition-colors"
                >
                    <Image
                    src="/logo.jpg"
                    alt="Armstrong Haulage Logo"
                    fill
                    className="object-cover"
                    />
                </motion.div>
                <span className="text-xl font-bold tracking-wider uppercase text-white group-hover:text-purple-400 transition-colors">Armstrong Haulage</span>
            </Link>
          </div>
          
          {/* Center Search Bar - Hidden on Mobile */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-80" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setShowSearchResults(false);
                  }
                }}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" />
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50"
              >
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => {
                          router.push(`/profile/${encodeURIComponent(result.slug || result.id)}`);
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                      >
                        {result.photoURL ? (
                          <Image
                            src={result.photoURL}
                            alt={result.displayName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {result.displayName[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{result.displayName}</p>
                          {result.slug && <p className="text-xs text-gray-400">@{result.slug}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-gray-400 text-sm">
                    No profiles found
                  </div>
                )}
              </motion.div>
            )}
          </div>
          
          {/* Right Side - Nav Links & User Menu */}
          <div className="hidden md:block shrink-0 ml-auto">
            <div className="flex items-center space-x-2">
              {navLinks.map((link) => (
                <NavLink key={link.href} href={link.href} icon={link.icon} isActive={pathname === link.href}>
                  {link.name}
                </NavLink>
              ))}
              
              {/* Community Dropdown */}
              <div 
                className="relative" 
                ref={communityRef}
                onMouseEnter={() => setIsCommunityOpen(true)}
                onMouseLeave={() => setIsCommunityOpen(false)}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCommunityOpen || (pathname && ['/leaderboard', '/activity', '/achievements', '/analytics', '/search'].includes(pathname))
                      ? 'text-purple-400 bg-white/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Community
                  <ChevronDown className={`w-4 h-4 transition-transform ${
                    isCommunityOpen ? 'rotate-180' : ''
                  }`} />
                </button>
                
                <AnimatePresence>
                  {isCommunityOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-52 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-1">
                        {communityLinks.map((link) => (
                          (!link.requireAuth || user) && (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={`w-full block px-4 py-2.5 text-sm rounded-lg transition-colors ${
                                pathname === link.href
                                  ? 'text-purple-400 bg-white/10'
                                  : 'text-gray-300 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {link.name}
                            </Link>
                          )
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Resources Dropdown */}
              <div 
                className="relative" 
                ref={resourcesRef}
                onMouseEnter={() => setIsResourcesOpen(true)}
                onMouseLeave={() => setIsResourcesOpen(false)}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isResourcesOpen || (pathname && ['/about', '/gallery'].includes(pathname))
                      ? 'text-purple-400 bg-white/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  Resources
                  <ChevronDown className={`w-4 h-4 transition-transform ${
                    isResourcesOpen ? 'rotate-180' : ''
                  }`} />
                </button>
                
                <AnimatePresence>
                  {isResourcesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-1">
                        {resourcesLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            target={link.external ? '_blank' : undefined}
                            className={`w-full block px-4 py-2.5 text-sm rounded-lg transition-colors ${
                              pathname === link.href
                                ? 'text-purple-400 bg-white/10'
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {link.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="w-px h-6 bg-white/10 mx-2" />
              {user ? (
                <>
                  {/* Notifications Bell */}
                  <div className="relative" ref={notificationRef}>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                        >
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                              <div className="p-1">
                                {notifications.map((notif) => (
                                  <div
                                    key={notif.id}
                                    className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                                      !notif.read ? 'bg-white/5' : ''
                                    }`}
                                    onClick={() => {
                                      if (!notif.read) markNotificationAsRead(notif.id);
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-white">
                                          {notif.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                          {notif.message}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                          {new Date(notif.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteNotification(notif.id);
                                        }}
                                        className="text-gray-500 hover:text-red-400 transition-colors"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-6 text-center text-gray-400 text-sm">
                                No notifications
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* User Profile Button */}
                <div 
                  className="relative" 
                  ref={profileRef}
                  onMouseEnter={() => setIsProfileOpen(true)}
                  onMouseLeave={() => setIsProfileOpen(false)}
                >
                  <button
                    className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="relative">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          width={32}
                          height={32}
                          className="rounded-full ring-2 ring-purple-500/50"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                          {user.displayName ? user.displayName[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                        </div>
                      )}
                      {/* Status indicator */}
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        user.status === 'online' ? 'bg-green-500' :
                        user.status === 'away' ? 'bg-yellow-500' :
                        user.status === 'dnd' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></div>
                    </div>
                    <span className="text-sm font-medium text-white hidden sm:flex items-center gap-2">
                      {user.displayName || user.email?.split('@')[0]}
                      {user.verified && (
                        <span className="text-green-500" title="Email verified">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <div className="p-1">
                          <Link
                            href="/profile"
                            className="w-full block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4" />
                              Profile
                            </div>
                          </Link>
                          <Link
                            href="/settings"
                            className="w-full block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              Settings
                            </div>
                          </Link>
                          {user.admin && (
                            <Link
                              href="/admin"
                              className="w-full block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Admin
                              </div>
                            </Link>
                          )}
                          <div className="h-px bg-white/10 my-1" />
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                </>
              ) : (
                <Link href="/login">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
                  >
                    <LogIn className="w-4 h-4" /> Login
                  </motion.div>
                </Link>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-md focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-neutral-900/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link, i) => (
                <MobileNavLink key={link.href} href={link.href} icon={link.icon} index={i} isActive={pathname === link.href}>
                  {link.name}
                </MobileNavLink>
              ))}
              
              {/* Community Section in Mobile */}
              <div className="pt-2 pb-2">
                <div className="flex items-center gap-2 px-4 py-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <Users className="w-4 h-4" />
                  Community
                </div>
                {communityLinks.map((link, i) => (
                  (!link.requireAuth || user) && (
                    <MobileNavLink key={link.href} href={link.href} icon={undefined} index={navLinks.length + i} isActive={pathname === link.href}>
                      {link.name}
                    </MobileNavLink>
                  )
                ))}
              </div>
              
              {/* Resources Section in Mobile */}
              <div className="pt-2 pb-2">
                <div className="flex items-center gap-2 px-4 py-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <Info className="w-4 h-4" />
                  Resources
                </div>
                {resourcesLinks.map((link, i) => (
                  <MobileNavLink 
                    key={link.href} 
                    href={link.href} 
                    icon={undefined} 
                    index={navLinks.length + communityLinks.length + i} 
                    isActive={pathname === link.href}
                    target={link.external ? '_blank' : undefined}
                  >
                    {link.name}
                  </MobileNavLink>
                ))}
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {user ? (
                  <div className="space-y-4 mt-4 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3 px-4">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          width={40}
                          height={40}
                          className="rounded-full ring-2 ring-purple-500/50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                          {user.displayName ? user.displayName[0].toUpperCase() : <UserIcon className="w-5 h-5" />}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{user.displayName || "User"}</span>
                          {user.verified && (
                            <span className="text-green-500" title="Email verified">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{user.email}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 px-4">
                      <Link href="/profile" className="bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                        <UserIcon className="w-4 h-4" /> Profile
                      </Link>
                      <Link href="/settings" className="bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-lg text-base font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <Link 
                    href="/login" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-base font-bold transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    <LogIn className="w-4 h-4" /> Login
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    
    {/* Cookies Popup */}
    <CookiesPopup />
    </>
  );
}

function NavLink({ href, children, icon, isActive, target }: { href: string; children: React.ReactNode; icon: React.ReactNode; isActive: boolean; target?: string }) {
  return (
    <Link href={href} target={target} className="relative group">
      <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 relative z-10 ${isActive ? "text-white" : "text-gray-300 hover:text-white"}`}>
        {icon}
        <span className="relative">
          {children}
          <span className="absolute left-0 -bottom-0.5 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full" />
        </span>
      </div>
      {isActive && (
        <motion.div
          layoutId="navbar-active"
          className="absolute inset-0 bg-white/10 rounded-full"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      {!isActive && (
        <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
    </Link>
  );
}

function MobileNavLink({ href, children, icon, index, isActive, target }: { href: string; children: React.ReactNode; icon: React.ReactNode; index: number; isActive: boolean; target?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      style={{ display: 'block' }}
    >
      <Link 
        href={href} 
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className={`w-full block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}
      >
        <div className="flex items-center gap-3 justify-between">
          <span className="flex items-center gap-3">{icon} {children}</span>
          <span className="flex items-center gap-2">
            {target === '_blank' && <ExternalLink className="w-4 h-4 text-gray-400" />}
            {isActive && <ChevronRight className="w-4 h-4 text-purple-500" />}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}