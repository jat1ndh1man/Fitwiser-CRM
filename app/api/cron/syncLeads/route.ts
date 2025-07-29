// /app/api/cron/syncLeads/route.ts

import { NextRequest, NextResponse } from 'next/server';

interface CronResponse {
  success: boolean;
  message: string;
  timestamp: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Vercel (optional additional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    console.log('Starting scheduled lead sync...');
    
    // Get base URL for internal API calls
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000';

    // Call the automated sync endpoint
    const response = await fetch(`${baseUrl}/api/facebook/automatedLeadSync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': process.env.CRON_API_KEY || ''
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${result.error || 'Unknown error'}`);
    }

    console.log('Scheduled sync completed successfully');

    const cronResponse: CronResponse = {
      success: true,
      message: 'Scheduled lead sync completed successfully',
      timestamp: new Date().toISOString(),
      ...result
    };

    return NextResponse.json(cronResponse);

  } catch (error: any) {
    console.error('Scheduled sync error:', error.message);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle GET requests too (for manual testing)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      message: 'Cron endpoint is active. Use POST to trigger sync.',
      timestamp: new Date().toISOString()
    }
  );
}