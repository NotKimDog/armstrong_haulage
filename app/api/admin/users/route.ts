import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../api/lib/firebaseDb';
import { ref, get } from 'firebase/database';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      return NextResponse.json([]);
    }

    const usersData = snapshot.val();
    const users = Object.keys(usersData).map(key => ({
      id: key,
      ...usersData[key]
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
