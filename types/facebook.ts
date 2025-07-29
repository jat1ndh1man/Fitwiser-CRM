// /types/facebook.ts

export interface FacebookPageToken {
  id: string;
  name: string;
  access_token: string;
}

export interface FacebookCredentials {
  user_id: string;
  page_tokens: FacebookPageToken[];
}

export interface FacebookFieldData {
  name: string;
  values: string[];
}

export interface FacebookLead {
  id: string;
  created_time: string;
  field_data: FacebookFieldData[];
}

export interface FacebookForm {
  id: string;
  name: string;
}

export interface FacebookFormResponse {
  data: FacebookForm[];
  paging?: {
    next?: string;
    previous?: string;
  };
}

export interface FacebookLeadResponse {
  data: FacebookLead[];
  paging?: {
    next?: string;
    previous?: string;
  };
  summary?: {
    total_count: number;
  };
}

export interface ProcessedFormData {
  pageId: string;
  pageName: string;
  formId: string;
  formName: string;
  leads: FacebookLead[];
}

export interface ExtractedLeadInfo {
  name: string | null;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  profession: string | null;
  budget: string | null;
  timeline: string | null;
  notes: string | null;
}

export interface LeadRow {
  name: string;
  email: string;
  phone_number: string;
  city: string | null;
  profession: string | null;
  status: string;
  source: string;
  counselor: string | null;
  priority: string;
  lead_score: number;
  conversion_probability: number;
  follow_up_date: string | null;
  last_activity_date: string;
  budget: string | null;
  timeline: string | null;
  notes: string;
}

export interface SkippedLead {
  leadId: string;
  reason: string;
  email?: string;
  phone?: string;
  formName?: string;
}

export interface SyncSummary {
  totalFormsProcessed: number;
  totalLeadsProcessed: number;
  leadsInserted: number;
  leadsSkipped: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  summary: SyncSummary;
  skippedLeads?: SkippedLead[];
  aggregatedData: ProcessedFormData[];
}

export interface WebhookEntry {
  id: string;
  time: number;
  changes: WebhookChange[];
}

export interface WebhookChange {
  field: string;
  value: WebhookLeadgenData;
}

export interface WebhookLeadgenData {
  leadgen_id: string;
  page_id: string;
  form_id: string;
  adgroup_id?: string;
  ad_id?: string;
  created_time: number;
}