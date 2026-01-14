import { getDatabase, ref, get, set, update, remove, child, Database } from 'firebase/database';
import { app } from './firebase';

let db: Database | null = null;

export const getDb = () => {
  if (!db) {
    db = getDatabase(app);
  }
  return db;
};

interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  bannerURL?: string;
  createdAt: number;
  updatedAt: number;
  admin?: boolean;
}

interface UserStats {
  miles: number;
  members: number;
  jobsDelivered: number;
  distance?: number;
  deliveries?: number;
  earnings?: number;
  rating?: number;
}

interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  publicProfile: boolean;
  showStats: boolean;
  theme: string;
  accentColor: string;
  showUserId: boolean;
  showEmail: boolean;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const database = getDb();
    const snapshot = await get(child(ref(database), `users/${userId}`));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function getStats(): Promise<UserStats | null> {
  try {
    const database = getDb();
    const snapshot = await get(child(ref(database), 'stats'));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {
      miles: 0,
      members: 0,
      jobsDelivered: 0,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      miles: 0,
      members: 0,
      jobsDelivered: 0,
    };
  }
}

export async function updateStats(stats: Partial<UserStats>): Promise<boolean> {
  try {
    const database = getDb();
    await update(ref(database, 'stats'), stats);
    return true;
  } catch (error) {
    console.error('Error updating stats:', error);
    return false;
  }
}

export async function setUserProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
  try {
    const database = getDb();
    const timestamp = Date.now();
    // Merge incoming partial profile with existing data to avoid overwriting other fields
    const snapshot = await get(child(ref(database), `users/${userId}`));
    const existing = snapshot.exists() ? snapshot.val() : {};
    const merged = {
      ...existing,
      ...profile,
      updatedAt: timestamp,
      createdAt: existing?.createdAt || profile.createdAt || timestamp,
    };
    await set(ref(database, `users/${userId}`), merged);
    return true;
  } catch (error) {
    console.error('Error setting user profile:', error);
    return false;
  }
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const database = getDb();
    const snapshot = await get(child(ref(database), `user_settings/${userId}`));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {
      emailNotifications: true,
      pushNotifications: false,
      marketingEmails: false,
      publicProfile: true,
      showStats: true,
      theme: 'dark',
      accentColor: 'blue',
      showUserId: false,
      showEmail: false,
    };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<boolean> {
  try {
    const database = getDb();
    await update(ref(database, `user_settings/${userId}`), settings);
    return true;
  } catch (error) {
    console.error('Error updating user settings:', error);
    return false;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const database = getDb();
    await remove(ref(database, `users/${userId}`));
    await remove(ref(database, `user_settings/${userId}`));
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

export async function getLivestreamers(): Promise<any[]> {
  try {
    const database = getDb();
    const snapshot = await get(child(ref(database), 'livestreamers'));
    if (snapshot.exists()) {
      const val = snapshot.val();
      // If stored as object, convert to array
      if (Array.isArray(val)) return val;
      if (val && typeof val === 'object') return Object.values(val);
    }
    return [];
  } catch (error) {
    console.error('Error fetching livestreamers:', error);
    return [];
  }
}

export async function setLivestreamers(data: any[]): Promise<boolean> {
  try {
    const database = getDb();
    await set(ref(database, 'livestreamers'), data);
    return true;
  } catch (error) {
    console.error('Error setting livestreamers:', error);
    return false;
  }
}

export async function setUserAdmin(userId: string, isAdmin: boolean): Promise<boolean> {
  try {
    const database = getDb();
    await update(ref(database, `users/${userId}`), {
      admin: isAdmin,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Error setting user admin status:', error);
    return false;
  }
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    return profile?.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
