// /app/api/facebook/automatedLeadSync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SyncResult } from '@/types/facebook';

interface UserSyncResult extends SyncResult {
  user_id: string;
}

interface AutomationSummary {
  totalUsers: number;
  successfulSyncs: number;
  totalLeadsInserted: number;
}

interface AutomationResult {
  success: boolean;
  message: string;
  summary: AutomationSummary;
  results: UserSyncResult[];
}

interface UserCredentials {
  user_id: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get('api_key');
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    console.log("Starting automated lead sync...");

    // Get all users with Facebook credentials
    const { data: users, error: usersError } = await supabase
      .from("facebook_ad_creds")
      .select("user_id")
      .not("page_tokens", "is", null);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`Found ${users.length} users with Facebook credentials`);

    const results: UserSyncResult[] = [];
    
    // Process each user
    for (const user of users) {
      try {
        console.log(`Processing user: ${user.user_id}`);
        
        // Get base URL for internal API calls
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                       process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                       'http://localhost:3000';
        
        // Call the aggregateLeads API for each user
        const response = await fetch(`${baseUrl}/api/facebook/aggregateLeads`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: user.user_id }),
        });

        const result: SyncResult = await response.json();
        
        results.push({
          user_id: user.user_id,
          success: response.ok,
          ...result
        });

        // Add delay between users to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (userError: any) {
        console.error(`Error processing user ${user.user_id}:`, userError.message);
        results.push({
          user_id: user.user_id,
          success: false,
          message: userError.message,
          summary: {
            totalFormsProcessed: 0,
            totalLeadsProcessed: 0,
            leadsInserted: 0,
            leadsSkipped: 0
          },
          aggregatedData: []
        });
      }
    }

    // Calculate summary
    const successfulSyncs = results.filter(r => r.success).length;
    const totalLeadsInserted = results.reduce((sum, r) => sum + (r.summary?.leadsInserted || 0), 0);
    
    console.log(`Automated sync completed: ${successfulSyncs}/${users.length} users processed, ${totalLeadsInserted} leads inserted`);

    const summary: AutomationSummary = {
      totalUsers: users.length,
      successfulSyncs,
      totalLeadsInserted,
    };

    const automationResult: AutomationResult = {
      success: true,
      message: "Automated lead sync completed",
      summary,
      results
    };

    return NextResponse.json(automationResult);

  } catch (error: any) {
    console.error("Error in automated lead sync:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}