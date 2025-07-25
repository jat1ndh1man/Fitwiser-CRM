// app/api/agent/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // ensure Node.js runtime

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const SCHEMA = `
create table public.users (
  id uuid not null default extensions.uuid_generate_v4 (),
  email character varying(255) not null,
  phone character varying(20) null,
  first_name character varying(100) null,
  last_name character varying(100) null,
  profile_image_url text null,
  role_id uuid not null,
  is_active boolean null default true,
  date_of_birth date null,
  gender character varying(20) null,
  height numeric(5, 2) null,
  current_weight numeric(5, 2) null,
  target_weight numeric(5, 2) null,
  fitness_level character varying(20) null,
  health_conditions text[] null,
  dietary_restrictions text[] null,
  primary_goal character varying(50) null,
  secondary_goals text[] null,
  goal_target_date date null,
  last_login timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  age integer null,
  activity_level text null,
  bio character varying null,
  assigned_meal_plan_id integer null,
  fitness_goal text null,
  assigned_meals integer[] null,
  specialty text null,
  address character varying null,
  stage text null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_assigned_meal_plan_id_fkey foreign KEY (assigned_meal_plan_id) references meal_plans (id)
) TABLESPACE pg_default;

create table public.leads (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  name character varying(100) not null,
  email character varying(255) not null,
  phone_number character varying(20) not null,
  city character varying(100) null,
  profession character varying(100) null,
  status character varying(20) null default 'New'::character varying,
  source character varying(30) null,
  counselor character varying(100) null,
  priority character varying(10) null default 'Medium'::character varying,
  lead_score integer null default 0,
  conversion_probability integer null default 0,
  follow_up_date date null,
  last_activity_date date null default CURRENT_DATE,
  budget character varying(50) null,
  timeline character varying(50) null,
  notes text null,
  constraint leads_pkey primary key (id)
) TABLESPACE pg_default;

create table public.lead_assignments (
  id uuid not null default gen_random_uuid (),
  lead_id uuid not null,
  assigned_to uuid not null,
  assigned_by uuid not null,
  assigned_at timestamp with time zone null default now(),
  status character varying(20) null default 'active'::character varying,
  notes text null,
  priority character varying(10) null default 'medium'::character varying,
  due_date timestamp with time zone null,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint lead_assignments_pkey primary key (id),
  constraint lead_assignments_assigned_by_fkey foreign KEY (assigned_by) references users (id),
  constraint lead_assignments_assigned_to_fkey foreign KEY (assigned_to) references users (id),
  constraint lead_assignments_lead_id_fkey foreign KEY (lead_id) references leads (id),
  constraint lead_assignments_priority_check check (
    (
      (priority)::text = any (
        (
          array[
            'High'::character varying,
            'Medium'::character varying,
            'Low'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint lead_assignments_status_check check (
    (
      (status)::text = any (
        (
          array[
            'active'::character varying,
            'completed'::character varying,
            'cancelled'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create table public.manual_payment (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  amount numeric(12, 2) not null,
  currency character(3) not null default 'INR'::bpchar,
  description text not null,
  payment_method text not null default 'cash'::text,
  status text not null default 'completed'::text,
  transaction_id text null,
  payment_date date not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  plan_expiry timestamp without time zone null,
  plan text null,
  lead_id uuid null,
  constraint manual_payment_pkey primary key (id),
  constraint manual_payment_lead_id_fkey foreign KEY (lead_id) references leads (id),
  constraint manual_payment_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint manual_payment_amount_check check ((amount > (0)::numeric))
) TABLESPACE pg_default;

create table public.payment_links (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  payment_link text not null,
  payment_link_id text null,
  amount numeric(10, 2) not null,
  currency text not null default 'INR'::text,
  description text null,
  type text not null default 'one_time'::text,
  expires_at timestamp with time zone null,
  status text not null default 'created'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  payment_id text null,
  is_manual boolean null default false,
  payment_method character varying(50) null,
  transaction_id character varying(255) null,
  payment_date date null,
  plan_expiry timestamp without time zone null,
  plan text null,
  lead_id uuid null,
  constraint payment_links_pkey primary key (id),
  constraint payment_links_lead_id_fkey foreign KEY (lead_id) references leads (id),
  constraint payment_links_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.user_roles (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_roles_pkey primary key (id),
  constraint user_roles_name_key unique (name)
) TABLESPACE pg_default;



`
const runSupabaseCode = async (
  code: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ data: any; error: any }> => {
  const fn = new Function(
    "supabase",
    `
    "use strict";
    return (async () => {
      ${code}
      return { data, error };
    })();
  `
  );
  return fn(supabase) as Promise<{ data: any; error: any }>;
};

export async function POST(req: Request) {
  console.log("=== /api/agent POST invoked ===");

  // 1) parse JSON body
  let body: any;
  try {
    body = await req.json();
    console.log("✔️ Parsed JSON body:", body);
  } catch (err: any) {
    console.error("❌ JSON parse error:", err);
    return NextResponse.json(
      { error: "Invalid JSON", details: err.message },
      { status: 400 }
    );
  }

  const { message } = body;
  if (!message) {
    console.warn("⚠️ No “message” field");
    return NextResponse.json({ error: "No message" }, { status: 400 });
  }
  console.log("📩 User message:", message);

  // 2) build prompt
  const prompt = `You are a Supabase-JS expert. Given the following database schema:
\`\`\`sql
${SCHEMA}
\`\`\`
Generate a JavaScript code snippet using supabase-js (v2) that implements exactly the query described below.
- Do not include any SQL.
- Use only the official supabase-js client (assume it’s already initialized as \`const supabase\`).
- Ensure all query methods like \`.eq()\`, \`.ilike()\`, \`.gt()\`, etc., are called directly on the query builder.
- Return only the executable JavaScript code (no commentary).
Query:"${message}"`;

  console.log("📝 Prompting OpenAI with:\n", prompt);

  // 3) call OpenAI
  let code: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a Supabase-JS expert." },
        { role: "user", content: prompt },
      ],
    });
    code = completion.choices[0].message.content.trim();
    // strip Markdown fences if present
    code = code
      .replace(/^```(?:javascript)?\n?/, "")
      .replace(/\n?```$/, "");
    console.log("✅ Received code from OpenAI:\n", code);
  } catch (err: any) {
    console.error("❌ OpenAI API error:", err);
    return NextResponse.json(
      { error: "OpenAI API error", details: err.message },
      { status: 502 }
    );
  }

  // 4) initialize Supabase server client
  const databaseUrl = process.env.DATABSE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!databaseUrl || !supabaseKey) {
    console.error("❌ Missing DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    return NextResponse.json(
      { error: "Server config error: missing database URL or service key." },
      { status: 500 }
    );
  }

  let supabaseServerClient;
  try {
    supabaseServerClient = createClient(databaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    console.log("✔️ Supabase server client initialized.");
  } catch (err: any) {
    console.error("❌ Supabase client init error:", err);
    return NextResponse.json(
      { error: "Supabase client initialization failed", details: err.message },
      { status: 500 }
    );
  }

  // 5) execute the snippet
  let data: any = null;
  let error: any = null;
  try {
    console.log("🔧 Executing Supabase snippet on server...");
    const result = await runSupabaseCode(code, supabaseServerClient);
    data = result.data;
    error = result.error;
    if (error) {
      console.error("❌ Supabase code execution error:", error);
    } else {
      console.log("✅ Supabase code executed successfully. Data:", data);
    }
  } catch (err: any) {
    console.error("❌ Error during Supabase code execution:", err);
    error = { message: `Failed to execute Supabase query: ${err.message}` };
  }

  // 6) return response
  if (error) {
    return NextResponse.json(
      { error: error.message || "Unknown error during query execution." },
      { status: 500 }
    );
  }
  return NextResponse.json({ data });
}