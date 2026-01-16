import { NextResponse } from 'next/server';
import { getDb } from '../lib/firebaseDb';
import { ref, set, update, get, child } from 'firebase/database';

export async function POST(request: Request) {
  try {
    // 1. Parse the incoming JSON from the plugin
    const data = await request.json();
    const { userId } = data;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log("🚚 [ATS-VTC] Telemetry Received:", data);

    const database = getDb();
    const timestamp = Date.now();

    // 2. Handle specific event types
    if (data.type === 'job_start') {
        console.log(`--> New Job: ${data.cargo} from ${data.source} to ${data.destination}`);
        // Save to database
        const jobId = `job_${userId}_${timestamp}`;
        const jobData = {
          jobId,
          userId,
          cargo: data.cargo,
          source: data.source,
          destination: data.destination,
          startedAt: timestamp,
          status: 'in_progress',
        };
        await set(ref(database, `jobs/${jobId}`), jobData);
        console.log(`✅ Job saved: ${jobId}`);
    } 
    else if (data.type === 'job_delivered') {
        console.log(`--> Job Finished: Earned ${data.revenue} EUR`);
        // Update user balance/xp in database
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);
        const currentBalance = snapshot.exists() ? (snapshot.val().balance || 0) : 0;
        
        const newBalance = currentBalance + data.revenue;
        await update(userRef, {
          balance: newBalance,
          updatedAt: timestamp,
          lastJobDelivered: timestamp,
        });
        
        // Also log this as a completed job
        const jobDeliveryId = `delivery_${userId}_${timestamp}`;
        const deliveryData = {
          deliveryId: jobDeliveryId,
          userId,
          revenue: data.revenue,
          completedAt: timestamp,
          newBalance,
        };
        await set(ref(database, `job_deliveries/${jobDeliveryId}`), deliveryData);
        console.log(`✅ User balance updated: +${data.revenue} EUR (new balance: ${newBalance} EUR)`);
    }
    else if (data.type === 'job_cancelled') {
        console.log(`--> Job Cancelled`);
        // Log cancellation
        const jobCancellationId = `cancellation_${userId}_${timestamp}`;
        const cancellationData = {
          cancellationId: jobCancellationId,
          userId,
          cancelledAt: timestamp,
        };
        await set(ref(database, `job_cancellations/${jobCancellationId}`), cancellationData);
        console.log(`✅ Job cancellation logged: ${jobCancellationId}`);
    }

    // 3. Return success to the plugin
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error processing telemetry:", error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
