// /app/api/facebook/aggregateLeads/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  FacebookPageToken,
  FacebookLead,
  FacebookLeadResponse,
  FacebookFormResponse,
  ProcessedFormData,
  ExtractedLeadInfo,
  LeadRow,
  SkippedLead,
  SyncResult,
  SyncSummary
} from '@/types/facebook';

interface RequestBody {
  user_id: string;
}

/**
 * Helper function that fetches all lead pages for a given form.
 */
async function fetchAllPages(
  formId: string, 
  pageAccessToken: string, 
  formName: string
): Promise<FacebookLead[]> {
  let leads: FacebookLead[] = [];
  const limit = 1000;
  const initialUrl = `https://graph.facebook.com/v19.0/${formId}/leads?access_token=${pageAccessToken}&limit=${limit}`;
  
  const initialResponse = await fetch(initialUrl);
  const initialData: FacebookLeadResponse = await initialResponse.json();
  
  if (!initialResponse.ok) {
    throw new Error(
      `Failed to fetch leads for form ${formName}: ${(initialData as any).error?.message || "Unknown error"}`
    );
  }
  
  leads = leads.concat(initialData.data || []);

  // If the API provides summary info for concurrent pagination.
  if (initialData.summary && initialData.summary.total_count) {
    const totalCount = initialData.summary.total_count;
    const totalPages = Math.ceil(totalCount / limit);
    
    const fetchPromises: Promise<FacebookLead[]>[] = [];
    
    for (let i = 1; i < totalPages; i++) {
      const url = `https://graph.facebook.com/v19.0/${formId}/leads?access_token=${pageAccessToken}&limit=${limit}&offset=${i * limit}`;
      fetchPromises.push(
        fetch(url).then(async (res) => {
          const pageData: FacebookLeadResponse = await res.json();
          if (!res.ok) {
            throw new Error(
              `Failed to fetch leads for form ${formName}: ${(pageData as any).error?.message || "Unknown error"}`
            );
          }
          return pageData.data || [];
        })
      );
    }
    
    const pagesData = await Promise.all(fetchPromises);
    pagesData.forEach(pageLeads => {
      leads = leads.concat(pageLeads);
    });
  } else {
    // Fallback sequential paging
    let nextUrl = initialData.paging?.next || null;
    while (nextUrl) {
      const res = await fetch(nextUrl);
      const data: FacebookLeadResponse = await res.json();
      if (!res.ok) {
        throw new Error(
          `Failed to fetch leads for form ${formName}: ${(data as any).error?.message || "Unknown error"}`
        );
      }
      leads = leads.concat(data.data || []);
      nextUrl = data.paging?.next || null;
    }
  }

  return leads;
}

/**
 * Helper function to extract lead information from Facebook field_data
 */
function extractLeadInfo(fieldData: any[]): ExtractedLeadInfo {
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

  if (Array.isArray(fieldData)) {
    for (let field of fieldData) {
      if (field.name && typeof field.name === "string" && field.values && field.values.length > 0) {
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
 * Check if a lead already exists in the database
 */
async function checkLeadExists(email: string | null, phone: string | null): Promise<boolean> {
  if (!email && !phone) return false;

  let query = supabase.from("leads").select("id").limit(1);

  if (email && phone) {
    query = query.or(`email.eq.${email},phone_number.eq.${phone}`);
  } else if (email) {
    query = query.eq('email', email);
  } else if (phone) {
    query = query.eq('phone_number', phone);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error checking lead existence:", error.message);
    return false;
  }

  return data && data.length > 0;
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

    console.log(`Received request for user_id: ${user_id}`);

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
    if (!userAccessToken) {
      console.warn(`No user access token found for user_id: ${user_id}`);
      return NextResponse.json(
        { error: "User access token not found" },
        { status: 404 }
      );
    }

    // Process each Facebook page concurrently
    const aggregatedData: ProcessedFormData[][] = await Promise.all(
      userAccessToken.map(async (page: FacebookPageToken) => {
        const { id: pageId, name: pageName, access_token: pageAccessToken } = page;
        console.log(`Processing page: ${pageName} (ID: ${pageId})`);

        // Retrieve lead forms managed by this page
        const formsResponse = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}/leadgen_forms?access_token=${pageAccessToken}`
        );
        const formsData: FacebookFormResponse = await formsResponse.json();
        
        if (!formsResponse.ok) {
          throw new Error(
            `Failed to fetch forms for page ${pageName}: ${(formsData as any).error?.message || "Unknown error"}`
          );
        }

        const forms = formsData.data || [];
        console.log(`Fetched ${forms.length} forms for page: ${pageName} (ID: ${pageId})`);

        // Process each lead form concurrently
        const formsDataWithLeads: ProcessedFormData[] = await Promise.all(
          forms.map(async (form) => {
            const { id: formId, name: formName } = form;
            console.log(`Processing form: ${formName} (ID: ${formId}) for page: ${pageName}`);

            const leads = await fetchAllPages(formId, pageAccessToken, formName);
            console.log(`Total leads fetched for form ${formName} (ID: ${formId}): ${leads.length}`);

            return {
              pageId,
              pageName,
              formId,
              formName,
              leads,
            };
          })
        );

        return formsDataWithLeads;
      })
    );

    // Flatten the data
    const flattenedData: ProcessedFormData[] = aggregatedData.flat();
    console.log(`Aggregation complete. Total forms processed: ${flattenedData.length}`);

    // Process leads for database insertion
    const leadRows: LeadRow[] = [];
    const skippedLeads: SkippedLead[] = [];
    
    for (const form of flattenedData) {
      const { pageId, pageName, formId, formName, leads } = form;
      
      for (const lead of leads) {
        const leadInfo = extractLeadInfo(lead.field_data);
        
        // Skip if no required fields
        if (!leadInfo.name || (!leadInfo.email && !leadInfo.phone_number)) {
          skippedLeads.push({
            leadId: lead.id,
            reason: "Missing required fields (name, email, or phone)",
            formName
          });
          continue;
        }

        // Check if lead already exists
        const leadExists = await checkLeadExists(leadInfo.email, leadInfo.phone_number);
        if (leadExists) {
          skippedLeads.push({
            leadId: lead.id,
            reason: "Lead already exists",
            email: leadInfo.email || undefined,
            phone: leadInfo.phone_number || undefined
          });
          continue;
        }

        // Build the row object
        const leadRow: LeadRow = {
          name: leadInfo.name,
          email: leadInfo.email || '',
          phone_number: leadInfo.phone_number || '',
          city: leadInfo.city,
          profession: leadInfo.profession,
          status: 'New',
          source: `Facebook - ${pageName}`,
          counselor: null,
          priority: 'Medium',
          lead_score: 0,
          conversion_probability: 0,
          follow_up_date: null,
          last_activity_date: new Date().toISOString().split('T')[0],
          budget: leadInfo.budget,
          timeline: leadInfo.timeline,
          notes: `Form: ${formName}\nFacebook Lead ID: ${lead.id}\nCreated: ${lead.created_time}\n${leadInfo.notes || ''}`
        };

        leadRows.push(leadRow);
      }
    }

    console.log(`Prepared ${leadRows.length} leads for insertion, skipped ${skippedLeads.length} leads`);

    // Bulk insert leads
    let insertedCount = 0;
    if (leadRows.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from("leads")
        .insert(leadRows)
        .select('id');

      if (insertError) {
        console.error("Error inserting leads:", insertError.message);
        return NextResponse.json(
          { error: "Internal server error", details: insertError.message },
          { status: 500 }
        );
      }

      insertedCount = insertedData ? insertedData.length : 0;
    }

    const summary: SyncSummary = {
      totalFormsProcessed: flattenedData.length,
      totalLeadsProcessed: leadRows.length + skippedLeads.length,
      leadsInserted: insertedCount,
      leadsSkipped: skippedLeads.length,
    };

    const result: SyncResult = {
      success: true,
      message: "Lead aggregation completed successfully",
      summary,
      skippedLeads: skippedLeads.length > 0 ? skippedLeads : undefined,
      aggregatedData: flattenedData
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error fetching data from Facebook API:", error.message);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}