// Cloudflare D1 Database & R2 Storage Configuration

// Type definitions for Cloudflare bindings (available in Edge Runtime)
declare global {
  var CF: {
    KV: any;
    D1: any;
    R2: any;
    ENV: {
      CLOUDFLARE_ACCOUNT_ID: string;
      CLOUDFLARE_API_TOKEN: string;
      CLOUDFLARE_ZONE_ID: string;
      D1: any;
      R2: any;
    };
  };
}

// Initialize Cloudflare clients
export const getCloudflareDB = async () => {
  // If running in Cloudflare Worker environment, use the D1 binding directly
  // (globalThis.CF.ENV.D1 is declared in our ambient types above).
  try {
    // @ts-ignore
    if (typeof globalThis !== 'undefined' && (globalThis as any).CF && (globalThis as any).CF.ENV && (globalThis as any).CF.ENV.D1) {
      // use the native D1 binding
      const nativeDb = (globalThis as any).CF.ENV.D1;
      return {
        query: async (sql: string, params?: any[]) => {
          return await nativeDb.query(sql, params);
        },
      };
    }
  } catch (e) {
    // fallthrough to fetch-based approach
  }

  // Fallback for local/dev: call the internal API route using an absolute origin.
  const origin = process.env.NEXT_PUBLIC_SITE || process.env.SITE_URL || process.env.BASE_URL || 'http://localhost:3000';
  return {
    query: async (sql: string, params?: any[]) => {
      const response = await fetch(`${origin.replace(/\/$/, '')}/api/db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params }),
      });
      return response.json();
    },
  };
};

export const getR2Client = async () => {
  return {
    put: async (key: string, value: ReadableStream | ArrayBuffer | string) => {
      const formData = new FormData();
      formData.append('file', value as any);
      const origin = process.env.NEXT_PUBLIC_SITE || process.env.SITE_URL || process.env.BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${origin.replace(/\/$/, '')}/api/r2?key=${key}`, {
        method: 'PUT',
        body: formData,
      });
      return response.json();
    },
    get: async (key: string) => {
      const origin = process.env.NEXT_PUBLIC_SITE || process.env.SITE_URL || process.env.BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${origin.replace(/\/$/, '')}/api/r2?key=${key}`);
      if (!response.ok) return null;
      return response;
    },
    delete: async (key: string) => {
      const origin = process.env.NEXT_PUBLIC_SITE || process.env.SITE_URL || process.env.BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${origin.replace(/\/$/, '')}/api/r2?key=${key}`, { method: 'DELETE' });
      return response.ok;
    },
  };
};

// Database schema initialization
export const initializeDatabase = async (db: any) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      displayName TEXT,
      photoURL TEXT,
      bio TEXT,
      location TEXT,
      website TEXT,
      bannerURL TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      userId TEXT PRIMARY KEY,
      emailNotifications BOOLEAN DEFAULT true,
      pushNotifications BOOLEAN DEFAULT false,
      marketingEmails BOOLEAN DEFAULT false,
      publicProfile BOOLEAN DEFAULT true,
      showStats BOOLEAN DEFAULT true,
      theme TEXT DEFAULT 'dark',
      accentColor TEXT DEFAULT 'blue',
      showUserId BOOLEAN DEFAULT false,
      showEmail BOOLEAN DEFAULT false,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_stats (
      userId TEXT PRIMARY KEY,
      distance REAL DEFAULT 0,
      deliveries INTEGER DEFAULT 0,
      earnings REAL DEFAULT 0,
      rating REAL DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_slugs (
      slug TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expiresAt DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
};

export type CloudflareDB = ReturnType<typeof getCloudflareDB>;
export type R2Client = ReturnType<typeof getR2Client>;
