// /app/api/facebook/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { 
  WebhookEntry, 
  WebhookLeadgenData, 
  FacebookPageToken,
  ExtractedLeadInfo,
  LeadRow 
} from '@/types/facebook';

const WEBHOOK_VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

interface WebhookBody {
  object: string;
  entry: WebhookEntry[];
}

interface WebhookProcessResult {
  success: boolean;
  reason?: string;
  leadId?: string;
}

// GET method for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.log('Webhook verification failed');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

/**
 * Verify Facebook webhook signature
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!signature || !APP_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', APP_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

/**
 * Extract lead information from webhook data
 */
function extractWebhookLeadInfo(leadData: any): ExtractedLeadInfo {
  const leadInfo: ExtractedLeadInfo = {
    name: null,
    email: null,
    phone_number: null,
    city: null,
    profession: null,
    budget: null,
    timeline: null,
    notes: null
  };

  if (leadData.field_data && Array.isArray(leadData.field_data)) {
    for (let field of leadData.field_data) {
      if (field.name && field.values && field.values.length > 0) {
        const fieldKey = field.name.toLowerCase();
        const value = field.values[0];
        
        switch (fieldKey) {
          case "email":
            leadInfo.email = value;
            break;
          case "phone_number":
          case "phone":
            leadInfo.phone_number = value;
            break;
          case "full_name":
          case "name":
          case "first_name":
            leadInfo.name = value;
            break;
          case "city":
          case "location":
            leadInfo.city = value;
            break;
          case "job_title":
          case "profession":
          case "occupation":
            leadInfo.profession = value;
            break;
          case "budget":
            leadInfo.budget = value;
            break;
          case "timeline":
            leadInfo.timeline = value;
            break;
          default:
            if (leadInfo.notes) {
              leadInfo.notes += `\n${field.name}: ${value}`;
            } else {
              leadInfo.notes = `${field.name}: ${value}`;
            }
            break;
        }
      }
    }
  }

  return leadInfo;
}

/**
 * Process a single lead from Facebook webhook
 */
async function processWebhookLead(
  leadgenData: WebhookLeadgenData, 
  pageId: string, 
  formId: string
): Promise<WebhookProcessResult> {
  try {
    // Get page information to determine the source
    const { data: credData } = await supabase
      .from("facebook_ad_creds")
      .select("page_tokens")
      .limit(1);

    let pageName = 'Facebook';
    let formName = 'Unknown Form';

    // Find the page name from stored credentials
    if (credData && credData.length > 0) {
      const pageTokens: FacebookPageToken[] = credData[0].page_tokens;
      const page = pageTokens.find(p => p.id === pageId);
      if (page) {
        pageName = page.name;
      }
    }

    // Get the page access token
    const { data: allCredData } = await supabase
      .from("facebook_ad_creds")
      .select("page_tokens");

    let pageAccessToken: string | null = null;
    
    if (allCredData && allCredData.length > 0) {
      for (const cred of allCredData) {
        const pageTokens: FacebookPageToken[] = cred.page_tokens;
        const page = pageTokens.find(p => p.id === pageId);
        if (page) {
          pageAccessToken = page.access_token;
          break;
        }
      }
    }

    if (!pageAccessToken) {
      console.error('No access token found for page:', pageId);
      return { success: false, reason: 'No access token found for page' };
    }

    // Fetch the lead data from Facebook
    const leadResponse = await fetch(
      `https://graph.facebook.com/v19.0/${leadgenData.leadgen_id}?access_token=${pageAccessToken}&fields=id,created_time,field_data`
    );

    if (!leadResponse.ok) {
      const errorData = await leadResponse.json();
      console.error('Error fetching lead data:', errorData);
      return { success: false, reason: 'Failed to fetch lead data from Facebook' };
    }

    const leadData = await leadResponse.json();

    // Extract lead information
    const leadInfo = extractWebhookLeadInfo(leadData);

    // Skip if missing required fields
    if (!leadInfo.name || (!leadInfo.email && !leadInfo.phone_number)) {
      console.log('Skipping lead due to missing required fields:', leadgenData.leadgen_id);
      return { success: false, reason: 'Missing required fields' };
    }

    // Check if lead already exists
    let query = supabase.from("leads").select("id").limit(1);

    if (leadInfo.email && leadInfo.phone_number) {
      query = query.or(`email.eq.${leadInfo.email},phone_number.eq.${leadInfo.phone_number}`);
    } else if (leadInfo.email) {
      query = query.eq('email', leadInfo.email);
    } else if (leadInfo.phone_number) {
      query = query.eq('phone_number', leadInfo.phone_number);
    }

    const { data: existingLead } = await query;

    if (existingLead && existingLead.length > 0) {
      console.log('Lead already exists:', leadInfo.email || leadInfo.phone_number);
      return { success: false, reason: 'Lead already exists' };
    }

    // Insert the new lead
    const leadRow: LeadRow = {
      name: leadInfo.name,
      email: leadInfo.email || '',
      phone_number: leadInfo.phone_number || '',
      city: leadInfo.city,
      profession: leadInfo.profession,
      status: 'New',
      source: `Facebook - ${pageName}`,
      counselor: null,
      priority: 'High', // Webhook leads get high priority
      lead_score: 0,
      conversion_probability: 0,
      follow_up_date: null,
      last_activity_date: new Date().toISOString().split('T')[0],
      budget: leadInfo.budget,
      timeline: leadInfo.timeline,
      notes: `Form: ${formName}\nFacebook Lead ID: ${leadData.id}\nCreated: ${leadData.created_time}\nReceived via Webhook\n${leadInfo.notes || ''}`
    };

    const { data: insertedLead, error: insertError } = await supabase
      .from("leads")
      .insert([leadRow])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting webhook lead:', insertError);
      return { success: false, reason: insertError.message };
    }

    console.log('Successfully inserted webhook lead:', insertedLead.id);
    return { success: true, leadId: insertedLead.id };

  } catch (error: any) {
    console.error('Error processing webhook lead:', error.message);
    return { success: false, reason: error.message };
  }
}

// POST method for webhook events
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const body = await request.text();

    // Verify signature
    if (!signature || !verifySignature(body, signature)) {
      console.log('Invalid webhook signature');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const webhookBody: WebhookBody = JSON.parse(body);

    if (webhookBody.object === 'page') {
      const results: Array<{
        leadgen_id: string;
      } & WebhookProcessResult> = [];

      // Process each entry
      for (const entry of webhookBody.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'leadgen') {
              const leadgenData: WebhookLeadgenData = change.value;
              
              if (leadgenData.leadgen_id && leadgenData.page_id && leadgenData.form_id) {
                // Process the lead
                const result = await processWebhookLead(
                  leadgenData,
                  leadgenData.page_id,
                  leadgenData.form_id
                );
                
                results.push({
                  leadgen_id: leadgenData.leadgen_id,
                  ...result
                });
              }
            }
          }
        }
      }

      console.log('Webhook processing results:', results);
      return NextResponse.json({ success: true, results });
    }

    return new NextResponse('OK', { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}