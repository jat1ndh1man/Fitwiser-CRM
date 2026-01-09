// /app/api/facebook/fetchForms/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { 
  FacebookPageToken, 
  FacebookForm, 
  FacebookFormResponse 
} from '../../../../types/facebook';

interface RequestBody {
  user_id: string;
}

interface PageWithForms {
  pageId: string;
  pageName: string;
  forms: FacebookForm[];
}

interface ApiResponse {
  forms: PageWithForms[];
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    console.log(`Received request to fetch forms for user_id: ${user_id}`);

    // Fetch Facebook credentials
    const { data: totalData, error } = await supabase
      .from("facebook_ad_creds")
      .select("*")
      .match({ user_id });

    if (error) {
      console.error("Error fetching Facebook credentials:", error.message);
      return NextResponse.json(
        { error: "Internal server error", details: error.message },
        { status: 500 }
      );
    }

    const userAccessToken: FacebookPageToken[] = totalData?.[0]?.page_tokens;
    if (!userAccessToken || userAccessToken.length === 0) {
      console.warn(`No user access token found for user_id: ${user_id}`);
      return NextResponse.json(
        { error: "User access token not found" },
        { status: 404 }
      );
    }

    // Fetch lead forms for each Facebook page concurrently
    const aggregatedFormsData: PageWithForms[] = await Promise.all(
      userAccessToken.map(async (page: FacebookPageToken) => {
        const { id: pageId, name: pageName, access_token: pageAccessToken } = page;
        console.log(`Fetching forms for page: ${pageName} (ID: ${pageId})`);

        // Fetch the lead forms managed by this page
        const formsResponse = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}/leadgen_forms?access_token=${pageAccessToken}`
        );
        
        const formsData: FacebookFormResponse = await formsResponse.json();
        
        if (!formsResponse.ok) {
          throw new Error(
            `Failed to fetch forms for page ${pageName}: ${(formsData as any).error?.message || "Unknown error"}`
          );
        }

        const forms: FacebookForm[] = formsData.data || [];
        console.log(`Fetched ${forms.length} forms for page: ${pageName} (ID: ${pageId})`);

        return {
          pageId,
          pageName,
          forms,
        };
      })
    );

    console.log(`Forms fetch complete. Total pages processed: ${aggregatedFormsData.length}`);

    const response: ApiResponse = {
      forms: aggregatedFormsData,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Error fetching forms from Facebook API:", error.message);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}