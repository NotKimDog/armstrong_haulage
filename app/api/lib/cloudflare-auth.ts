import crypto from 'crypto';

interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}

export class CloudflareAuthService {
  private db: any;
  private r2: any;

  constructor(db: any, r2: any) {
    this.db = db;
    this.r2 = r2;
  }

  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    const existingUser = await this.db.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUser.results?.length > 0) {
      throw new Error('User already exists');
    }

    const passwordHash = await this.hashPassword(password);
    const userId = crypto.randomUUID();

    await this.db.query(
      `INSERT INTO users (id, email, displayName, createdAt, updatedAt) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, email, displayName || email.split('@')[0]]
    );

    await this.storePasswordHash(userId, passwordHash);

    return { id: userId, email, displayName: displayName || email.split('@')[0], createdAt: new Date() };
  }

  async signIn(email: string, password: string): Promise<AuthUser & { token: string }> {
    const result = await this.db.query('SELECT id, displayName, photoURL FROM users WHERE email = ?', [email]);

    if (!result.results?.length) throw new Error('Invalid email or password');

    const user = result.results[0];
    const storedHash = await this.getPasswordHash(user.id);

    if (!storedHash || !(await this.verifyPassword(password, storedHash))) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.db.query(
      `INSERT INTO auth_sessions (id, userId, token, expiresAt, createdAt)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [crypto.randomUUID(), user.id, token, expiresAt.toISOString()]
    );

    return { id: user.id, email, displayName: user.displayName, photoURL: user.photoURL, token, createdAt: new Date() };
  }

  async signOut(token: string): Promise<void> {
    await this.db.query('DELETE FROM auth_sessions WHERE token = ?', [token]);
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    const session = await this.db.query(`SELECT userId, expiresAt FROM auth_sessions WHERE token = ? AND expiresAt > CURRENT_TIMESTAMP`, [token]);
    if (!session.results?.length) return null;
    const userId = session.results[0].userId;
    const user = await this.db.query('SELECT id, email, displayName, photoURL FROM users WHERE id = ?', [userId]);
    if (!user.results?.length) return null;
    return user.results[0];
  }

  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (updates.displayName) {
      fields.push('displayName = ?');
      values.push(updates.displayName);
    }
    if (updates.photoURL) {
      fields.push('photoURL = ?');
      values.push(updates.photoURL);
    }
    if (fields.length === 0) return;
    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(userId);
    await this.db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.db.query('DELETE FROM users WHERE id = ?', [userId]);
  }

  private async hashPassword(password: string): Promise<string> {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return hash;
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const computedHash = crypto.createHash('sha256').update(password).digest('hex');
    return computedHash === hash;
  }

  private async storePasswordHash(userId: string, hash: string): Promise<void> {
    // implement KV storage if available
  }

  private async getPasswordHash(userId: string): Promise<string | null> {
    return null;
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

let authServiceInstance: CloudflareAuthService | null = null;

export async function getAuthService(): Promise<CloudflareAuthService> {
  if (!authServiceInstance) {
    const { getCloudflareDB, getR2Client } = await import('./cloudflare');
    const db = await getCloudflareDB();
    const r2 = await getR2Client();
    authServiceInstance = new CloudflareAuthService(db, r2);
  }
  return authServiceInstance;
}
