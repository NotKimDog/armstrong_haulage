import { getCloudflareDB } from './cloudflare';

interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: number;
}

interface FirebaseProfile {
  bio?: string;
  location?: string;
  website?: string;
  bannerURL?: string;
}

interface FirebaseStats {
  distance?: number;
  deliveries?: number;
  earnings?: number;
  rating?: number;
}

export class FirestoreToD1Migrator {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async migrateUser(firebaseUser: FirebaseUser, profile: FirebaseProfile, stats: FirebaseStats, settings: any) {
    try {
      await this.db.query(
        `INSERT INTO users (id, email, displayName, photoURL, bio, location, website, bannerURL, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         displayName = excluded.displayName,
         photoURL = excluded.photoURL,
         bio = excluded.bio,
         location = excluded.location,
         website = excluded.website,
         bannerURL = excluded.bannerURL,
         updatedAt = CURRENT_TIMESTAMP`,
        [
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName || null,
          firebaseUser.photoURL || null,
          profile.bio || null,
          profile.location || null,
          profile.website || null,
          profile.bannerURL || null,
          new Date(firebaseUser.createdAt || 0).toISOString(),
        ]
      );

      await this.db.query(
        `INSERT INTO user_settings (userId, emailNotifications, pushNotifications, marketingEmails, publicProfile, showStats, theme, accentColor, showUserId, showEmail, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(userId) DO UPDATE SET
         emailNotifications = excluded.emailNotifications,
         pushNotifications = excluded.pushNotifications,
         marketingEmails = excluded.marketingEmails,
         publicProfile = excluded.publicProfile,
         showStats = excluded.showStats,
         theme = excluded.theme,
         accentColor = excluded.accentColor,
         showUserId = excluded.showUserId,
         showEmail = excluded.showEmail,
         updatedAt = CURRENT_TIMESTAMP`,
        [
          firebaseUser.uid,
          settings.emailNotifications ?? true,
          settings.pushNotifications ?? false,
          settings.marketingEmails ?? false,
          settings.publicProfile ?? true,
          settings.showStats ?? true,
          settings.theme ?? 'dark',
          settings.accentColor ?? 'blue',
          settings.showUserId ?? false,
          settings.showEmail ?? false,
        ]
      );

      await this.db.query(
        `INSERT INTO user_stats (userId, distance, deliveries, earnings, rating, updatedAt)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(userId) DO UPDATE SET
         distance = excluded.distance,
         deliveries = excluded.deliveries,
         earnings = excluded.earnings,
         rating = excluded.rating,
         updatedAt = CURRENT_TIMESTAMP`,
        [
          firebaseUser.uid,
          stats.distance ?? 0,
          stats.deliveries ?? 0,
          stats.earnings ?? 0,
          stats.rating ?? 0,
        ]
      );

      return { success: true, userId: firebaseUser.uid };
    } catch (error) {
      console.error(`Failed to migrate user ${firebaseUser.uid}:`, error);
      throw error;
    }
  }

  async migrateUsers(users: any[]) {
    const results = { successful: 0, failed: 0, errors: [] as any[] };
    for (const user of users) {
      try {
        await this.migrateUser(
          { uid: user.id, email: user.email, displayName: user.displayName, photoURL: user.photoURL, createdAt: user.createdAt },
          { bio: user.bio, location: user.location, website: user.website, bannerURL: user.bannerURL },
          { distance: user.stats?.distance, deliveries: user.stats?.deliveries, earnings: user.stats?.earnings, rating: user.stats?.rating },
          user.settings || {}
        );
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({ userId: user.id, error: String(error) });
      }
    }
    return results;
  }

  async getStatus() {
    try {
      const userCount = await this.db.query('SELECT COUNT(*) as count FROM users');
      const settingsCount = await this.db.query('SELECT COUNT(*) as count FROM user_settings');
      const statsCount = await this.db.query('SELECT COUNT(*) as count FROM user_stats');

      return {
        users: userCount.results?.[0]?.count || 0,
        settings: settingsCount.results?.[0]?.count || 0,
        stats: statsCount.results?.[0]?.count || 0,
      };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      throw error;
    }
  }
}

export async function createFirestoreToD1Migrator() {
  const db = await getCloudflareDB();
  return new FirestoreToD1Migrator(db);
}
