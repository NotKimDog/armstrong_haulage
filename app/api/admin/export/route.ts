import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../api/lib/firebaseDb';
import { ref, get } from 'firebase/database';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const dbRef = ref(db);
    const snapshot = await get(dbRef);
    
    if (!snapshot.exists()) {
      return NextResponse.json({ data: {} });
    }

    const data = snapshot.val();
    return NextResponse.json({
      exportDate: new Date().toISOString(),
      data
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
