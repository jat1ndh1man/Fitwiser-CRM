import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const DATABASE_SCHEMA = `
You are a CRM database assistant for a fitness coaching business. Convert natural language to Supabase queries.

IMPORTANT RULES:
- ONLY generate SELECT queries for data retrieval
- Always include reasonable LIMIT clauses (max 100 records)
- Use simple joins to get names instead of IDs when possible
- Return ONLY the JavaScript code without explanations or markdown

ACTUAL DATABASE SCHEMA:

1. users table (clients and coaches):
   - id (uuid), email, phone, first_name, last_name, role_id (uuid)
   - is_active (boolean), age, gender, height, current_weight, target_weight
   - fitness_level, primary_goal, fitness_goal, activity_level, bio, specialty
   - created_at, updated_at, last_login

2. user_roles table:
   - id (uuid), name, description, created_at

3. leads table:
   - id (uuid), name, email, phone_number, city, profession
   - status ('New', 'Contacted', 'Qualified', 'Converted', 'Lost')
   - source, counselor, priority ('High', 'Medium', 'Low')
   - lead_score (0-100), conversion_probability (0-100)
   - follow_up_date, last_activity_date, budget, timeline, notes
   - created_at, updated_at

4. manual_payment table:
   - id (uuid), user_id (foreign key to users), lead_id (foreign key to leads)
   - amount, currency, description, payment_method, status
   - payment_date, plan, plan_expiry, created_at

5. payment_links table:
   - id (uuid), user_id (foreign key to users), lead_id (foreign key to leads)
   - amount, currency, description, status, payment_date
   - plan, plan_expiry, is_manual, created_at

6. client_coach_relationships table:
   - id, client_id (foreign key to users), coach_id (foreign key to users)
   - start_date, end_date, status ('active', 'inactive')
   - created_at, updated_at

QUERY PATTERNS (Prefer joins to show names instead of IDs):

Basic queries:
"Show me all leads" -> supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(50)

"Show me all users" -> supabase.from('users').select('id, first_name, last_name, email, phone, specialty, primary_goal, is_active, created_at').order('created_at', { ascending: false }).limit(50)

"Show payments with user names" -> supabase.from('manual_payment').select('*, users(first_name, last_name, email)').order('payment_date', { ascending: false }).limit(50)

"Show coach relationships with names" -> supabase.from('client_coach_relationships').select('*, client:users!client_id(first_name, last_name, email), coach:users!coach_id(first_name, last_name, specialty)').eq('status', 'active').limit(50)

Count queries:
"How many leads?" -> supabase.from('leads').select('*', { count: 'exact', head: true })

"How many users?" -> supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true)

Filtered queries:
"High priority leads" -> supabase.from('leads').select('*').eq('priority', 'High').order('created_at', { ascending: false }).limit(30)

"Active users" -> supabase.from('users').select('id, first_name, last_name, email, phone, specialty, primary_goal, is_active').eq('is_active', true).order('created_at', { ascending: false }).limit(50)

"Recent payments" -> supabase.from('manual_payment').select('*, users(first_name, last_name, email)').gte('payment_date', new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]).order('payment_date', { ascending: false }).limit(50)

Date-based queries:
"Today's leads" -> supabase.from('leads').select('*').gte('created_at', new Date().toISOString().split('T')[0]).order('created_at', { ascending: false }).limit(50)

"This month's payments" -> supabase.from('manual_payment').select('*, users(first_name, last_name, email)').gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]).order('payment_date', { ascending: false }).limit(100)

Advanced queries with names:
"Users by role" -> supabase.from('users').select('id, first_name, last_name, email, specialty, primary_goal, is_active, role_id').limit(50)

"Payment links with user names" -> supabase.from('payment_links').select('*, users(first_name, last_name, email)').order('created_at', { ascending: false }).limit(50)

IMPORTANT NOTES:
- Always try to include user names instead of just IDs
- Use joins like users(first_name, last_name, email) to get names
- For relationships, use proper foreign key notation: users!client_id(...)
- Lead status values: 'New', 'Contacted', 'Qualified', 'Converted', 'Lost'
- Priority values: 'High', 'Medium', 'Low'
- Payment status: 'completed', 'pending', 'failed'

Return ONLY the query code without any explanations.
`;

const rateLimitMap = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 30;
  const windowMs = 60000;
  
  const userRequests = rateLimitMap.get(ip) || [];
  const validRequests = userRequests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= limit) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== API Request Started ===');
    
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const { message } = body;
    console.log('User message:', message);

    if (!message || typeof message !== 'string' || message.length > 500) {
      return NextResponse.json(
        { error: 'Please provide a valid question (under 500 characters).' },
        { status: 400 }
      );
    }

    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured.' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Database configuration is missing.' },
        { status: 500 }
      );
    }

    // Check for harmful queries
    const dangerousKeywords = ['drop', 'truncate', 'delete', 'update', 'insert', 'alter', 'create'];
    if (dangerousKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return NextResponse.json(
        { error: 'I can only help you retrieve and analyze data, not modify it.' },
        { status: 400 }
      );
    }

    console.log('Generating AI response...');

    // Generate query using OpenAI
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: DATABASE_SCHEMA },
          { role: "user", content: `Convert this to a Supabase query: "${message}"` }
        ],
        temperature: 0.1,
        max_tokens: 300,
      });
    } catch (openaiError: any) {
      console.error('OpenAI API Error:', openaiError);
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    const queryCode = completion.choices[0]?.message?.content?.trim();
    console.log('Generated query code:', queryCode);

    if (!queryCode) {
      return NextResponse.json(
        { error: 'I couldn\'t understand your request. Could you please rephrase it?' },
        { status: 400 }
      );
    }

    // Execute the query with fallback for relationship errors
    console.log('Executing database query...');
    const result = await executeSupabaseQueryWithFallback(queryCode, message);
    console.log('Query result:', { 
      dataLength: Array.isArray(result.data) ? result.data.length : 'not array',
      count: result.count,
      total: result.total 
    });
    
    // Format the response for human readability
    const humanResponse = await formatHumanReadableResponse(result, message, queryCode);
    console.log('Formatted response generated');

    return NextResponse.json({ 
      success: true,
      message: humanResponse,
      recordCount: result.total || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('=== API Error ===', error);
    console.error('Error stack:', error.stack);
    
    // Return user-friendly error messages
    let publicError = 'I encountered an issue processing your request. Please try again.';
    
    if (error.message.includes('couldn\'t understand') ||
        error.message.includes('can only help you') ||
        error.message.includes('temporarily unavailable')) {
      publicError = error.message;
    } else if (error.message.includes('Database error')) {
      publicError = 'There was an issue accessing the database. Please try again.';
    } else if (error.message.includes('Query execution failed')) {
      publicError = 'I had trouble processing your query. Could you try rephrasing it?';
    }

    return NextResponse.json(
      { error: publicError },
      { status: 500 }
    );
  }
}

async function executeSupabaseQueryWithFallback(queryCode: string, originalMessage: string): Promise<any> {
  try {
    // First try the original query
    return await executeSupabaseQuery(queryCode);
  } catch (error: any) {
    console.log('Primary query failed, trying fallback:', error.message);
    
    // If it's a relationship error, try a simpler fallback query
    if (error.message.includes('relationship') || error.message.includes('foreign key')) {
      console.log('Attempting fallback query without joins...');
      
      const fallbackQuery = generateFallbackQuery(originalMessage);
      if (fallbackQuery) {
        try {
          const fallbackResult = await executeSupabaseQuery(fallbackQuery);
          // Enhance the data with names if possible
          return await enhanceDataWithNames(fallbackResult, originalMessage);
        } catch (fallbackError) {
          console.log('Fallback query also failed:', fallbackError);
          throw error; // Throw original error
        }
      }
    }
    
    throw error;
  }
}

function generateFallbackQuery(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('payment') && lowerMessage.includes('user')) {
    return "supabase.from('manual_payment').select('*').order('payment_date', { ascending: false }).limit(50)";
  }
  
  if (lowerMessage.includes('coach') && lowerMessage.includes('relationship')) {
    return "supabase.from('client_coach_relationships').select('*').eq('status', 'active').limit(50)";
  }
  
  if (lowerMessage.includes('user') && !lowerMessage.includes('count')) {
    return "supabase.from('users').select('id, first_name, last_name, email, phone, specialty, primary_goal, is_active, created_at').order('created_at', { ascending: false }).limit(50)";
  }
  
  return null;
}

async function enhanceDataWithNames(result: any, originalMessage: string): Promise<any> {
  if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
    return result;
  }
  
  const lowerMessage = originalMessage.toLowerCase();
  
  // Enhance payment data with user names
  if (lowerMessage.includes('payment') && result.data.some((item: any) => item.user_id)) {
    console.log('Enhancing payment data with user names...');
    
    try {
      const userIds = [...new Set(result.data.map((item: any) => item.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        
        if (users) {
          const userMap = new Map(users.map(user => [user.id, user]));
          
          result.data = result.data.map((payment: any) => ({
            ...payment,
            user: userMap.get(payment.user_id) || null
          }));
        }
      }
    } catch (enhanceError) {
      console.log('Failed to enhance with user names:', enhanceError);
      // Return original data if enhancement fails
    }
  }
  
  // Enhance coach relationship data with user names
  if (lowerMessage.includes('coach') && lowerMessage.includes('relationship')) {
    console.log('Enhancing relationship data with user names...');
    
    try {
      const allUserIds = new Set();
      result.data.forEach((rel: any) => {
        if (rel.client_id) allUserIds.add(rel.client_id);
        if (rel.coach_id) allUserIds.add(rel.coach_id);
      });
      
      if (allUserIds.size > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, specialty')
          .in('id', Array.from(allUserIds));
        
        if (users) {
          const userMap = new Map(users.map(user => [user.id, user]));
          
          result.data = result.data.map((rel: any) => ({
            ...rel,
            client: userMap.get(rel.client_id) || null,
            coach: userMap.get(rel.coach_id) || null
          }));
        }
      }
    } catch (enhanceError) {
      console.log('Failed to enhance relationship data:', enhanceError);
    }
  }
  
  return result;
}

async function executeSupabaseQuery(queryCode: string): Promise<any> {
  try {
    console.log('Raw query code:', queryCode);
    
    // Clean and validate the query
    const cleanQuery = queryCode
      .replace(/```javascript|```js|```/g, '') // Remove code blocks
      .replace(/[\n\r\t]/g, ' ') // Remove newlines and tabs
      .trim();
    
    console.log('Cleaned query:', cleanQuery);
    
    // Enhanced validation
    if (!cleanQuery || cleanQuery.length < 10) {
      throw new Error('Generated query is too short or empty');
    }

    if (!cleanQuery.includes('supabase.from(')) {
      throw new Error('Query must start with supabase.from()');
    }

    if (!cleanQuery.includes('.select(')) {
      throw new Error('Query must include a .select() method');
    }

    // Check for forbidden operations
    const forbiddenOperations = ['.insert(', '.update(', '.delete(', '.upsert(', 'DROP', 'DELETE', 'UPDATE', 'INSERT'];
    const foundForbidden = forbiddenOperations.find(op => 
      cleanQuery.toUpperCase().includes(op.toUpperCase())
    );
    
    if (foundForbidden) {
      throw new Error(`Forbidden operation detected: ${foundForbidden}`);
    }

    // Execute query
    console.log('Executing query with Supabase...');
    
    let query;
    try {
      const executeQuery = new Function(
        'supabase', 
        'Date', 
        'console',
        `
        try {
          return ${cleanQuery};
        } catch (e) {
          throw new Error('Query syntax error: ' + e.message);
        }
        `
      );
      
      query = executeQuery(supabase, Date, { log: () => {} });
    } catch (syntaxError: any) {
      console.error('Query syntax error:', syntaxError);
      throw new Error(`Invalid query syntax: ${syntaxError.message}`);
    }

    if (!query || typeof query.then !== 'function') {
      throw new Error('Generated query is not a valid Supabase query');
    }

    // Execute with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 15000)
    );

    const result = await Promise.race([query, timeoutPromise]);
    console.log('Raw database result keys:', Object.keys(result || {}));

    if (!result) {
      throw new Error('Database returned no response');
    }

    const { data, error, count } = result as any;

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message || 'Unknown database error'}`);
    }

    return {
      data: data || [],
      count: count,
      total: count !== undefined ? count : (Array.isArray(data) ? data.length : (data ? 1 : 0))
    };

  } catch (error: any) {
    console.error('Query execution error:', error);
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

async function formatHumanReadableResponse(result: any, originalQuery: string, queryCode: string): Promise<string> {
  const { data, count, total } = result;
  const lowerQuery = originalQuery.toLowerCase();

  // Handle empty results
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return getEmptyResultMessage(originalQuery);
  }

  // Handle count queries
  if (count !== undefined && count !== null && (!data || data.length === 0)) {
    return getCountMessage(count, originalQuery);
  }

  // Handle data results
  if (Array.isArray(data) && data.length > 0) {
    return formatArrayResults(data, originalQuery);
  }

  // Handle single object results
  if (data && typeof data === 'object') {
    return `Here's what I found:\n\n${formatSingleRecord(data)}`;
  }

  return `I found ${total || 0} record${total !== 1 ? 's' : ''} for your query.`;
}

function getEmptyResultMessage(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('today') || lowerQuery.includes('recent')) {
    return "📊 No recent activity found. Everything's quiet today!";
  }
  if (lowerQuery.includes('lead')) {
    return "📋 No leads found matching your criteria. Time to boost those marketing efforts!";
  }
  if (lowerQuery.includes('client') || lowerQuery.includes('user')) {
    return "👥 No users found matching your search criteria.";
  }
  if (lowerQuery.includes('payment') || lowerQuery.includes('revenue')) {
    return "💰 No payment records found for your specified criteria.";
  }
  if (lowerQuery.includes('coach')) {
    return "💪 No coaches found matching your criteria.";
  }
  
  return "🔍 No results found for your query. Try adjusting your search criteria.";
}

function getCountMessage(count: number, query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('lead')) {
    return `📋 **${count}** lead${count !== 1 ? 's' : ''} found. ${getLeadInsight(count)}`;
  }
  if (lowerQuery.includes('client') || lowerQuery.includes('user')) {
    return `👥 **${count}** user${count !== 1 ? 's' : ''} found. ${getClientInsight(count)}`;
  }
  if (lowerQuery.includes('coach')) {
    return `💪 **${count}** coach${count !== 1 ? 'es' : ''} found.`;
  }
  if (lowerQuery.includes('payment')) {
    return `💰 **${count}** payment${count !== 1 ? 's' : ''} found.`;
  }
  
  return `📊 Found **${count}** record${count !== 1 ? 's' : ''} matching your criteria.`;
}

function formatArrayResults(data: any[], query: string): string {
  const lowerQuery = query.toLowerCase();
  const recordCount = data.length;
  const showLimit = 5;
  
  let response = '';
  
  // Add context-specific headers
  if (lowerQuery.includes('lead')) {
    response += `📋 Found ${recordCount} Lead${recordCount !== 1 ? 's' : ''}\n\n`;
  } else if (lowerQuery.includes('client') || lowerQuery.includes('user')) {
    response += `👥 Found ${recordCount} User${recordCount !== 1 ? 's' : ''}\n\n`;
  } else if (lowerQuery.includes('coach')) {
    response += `💪 Found ${recordCount} Coach${recordCount !== 1 ? 'es' : ''}\n\n`;
  } else if (lowerQuery.includes('payment') || lowerQuery.includes('revenue')) {
    response += `💰 Found ${recordCount} Payment${recordCount !== 1 ? 's' : ''}\n\n`;
  } else if (lowerQuery.includes('relationship')) {
    response += `🤝 Found ${recordCount} Relationship${recordCount !== 1 ? 's' : ''}\n\n`;
  } else {
    response += `📊 Found ${recordCount} Record${recordCount !== 1 ? 's' : ''}\n\n`;
  }

  // Format the data
  const displayData = data.slice(0, showLimit);
  
  displayData.forEach((record, index) => {
    response += `${index + 1}. ${formatRecord(record)}\n`;
  });

  // Add truncation notice
  if (recordCount > showLimit) {
    response += `\n... and ${recordCount - showLimit} more record${recordCount - showLimit !== 1 ? 's' : ''}.`;
  }

  // Add summary insights
  response += getDataInsights(data, lowerQuery);

  return response;
}

function formatRecord(record: any): string {
  // Lead formatting
  if (record.name && record.email && record.status && record.phone_number) {
    let formatted = `${record.name} (${record.email})`;
    if (record.phone_number) formatted += ` - ${record.phone_number}`;
    if (record.status) formatted += ` | Status: ${record.status}`;
    if (record.counselor) formatted += ` | Counselor: ${record.counselor}`;
    if (record.priority) formatted += ` | Priority: ${record.priority}`;
    if (record.lead_score) formatted += ` | Score: ${record.lead_score}`;
    if (record.city) formatted += ` | City: ${record.city}`;
    return formatted;
  }
  
  // User formatting
  if (record.first_name || record.last_name || record.email) {
    let formatted = `${record.first_name || ''} ${record.last_name || ''}`.trim();
    if (!formatted && record.email) formatted = record.email;
    if (record.email && formatted !== record.email) formatted += ` (${record.email})`;
    if (record.specialty) formatted += ` | Specialty: ${record.specialty}`;
    if (record.primary_goal) formatted += ` | Goal: ${record.primary_goal}`;
    if (record.current_weight && record.target_weight) {
      formatted += ` | Weight: ${record.current_weight} → ${record.target_weight}`;
    }
    if (record.is_active !== undefined) formatted += ` | ${record.is_active ? 'Active' : 'Inactive'}`;
    return formatted;
  }
  
  // Payment formatting with user names
  if (record.amount && record.payment_date) {
    let formatted = `₹${parseFloat(record.amount).toFixed(2)} - ${new Date(record.payment_date).toLocaleDateString()}`;
    
    // Use joined user data or enhanced user data
    if (record.users && (record.users.first_name || record.users.last_name)) {
      formatted += ` | Client: ${record.users.first_name || ''} ${record.users.last_name || ''}`.trim();
    } else if (record.user && (record.user.first_name || record.user.last_name)) {
      formatted += ` | Client: ${record.user.first_name || ''} ${record.user.last_name || ''}`.trim();
    }
    
    if (record.plan) formatted += ` | Plan: ${record.plan}`;
    if (record.status) formatted += ` | Status: ${record.status}`;
    if (record.payment_method) formatted += ` | Method: ${record.payment_method}`;
    return formatted;
  }
  
  // Relationship formatting with names
  if (record.client_id && record.coach_id) {
    let formatted = '';
    
    if (record.client && (record.client.first_name || record.client.last_name)) {
      formatted += `Client: ${record.client.first_name || ''} ${record.client.last_name || ''}`.trim();
    } else {
      formatted += `Client ID: ${record.client_id.substring(0, 8)}...`;
    }
    
    formatted += ' → ';
    
    if (record.coach && (record.coach.first_name || record.coach.last_name)) {
      formatted += `Coach: ${record.coach.first_name || ''} ${record.coach.last_name || ''}`.trim();
      if (record.coach.specialty) formatted += ` (${record.coach.specialty})`;
    } else {
      formatted += `Coach ID: ${record.coach_id.substring(0, 8)}...`;
    }
    
    if (record.status) formatted += ` | Status: ${record.status}`;
    if (record.start_date) formatted += ` | Since: ${new Date(record.start_date).toLocaleDateString()}`;
    return formatted;
  }
  
  // Role formatting
  if (record.name && record.description) {
    return `${record.name} - ${record.description}`;
  }
  
  // Generic formatting
  const keys = Object.keys(record).filter(key => 
    !key.includes('id') && 
    !key.includes('created_at') && 
    !key.includes('updated_at') &&
    typeof record[key] !== 'object'
  );
  const values = keys.slice(0, 3).map(key => {
    const value = record[key];
    if (typeof value === 'string' && value.length > 30) {
      return `${key}: ${value.substring(0, 27)}...`;
    }
    return `${key}: ${value}`;
  });
  return values.join(' | ');
}

function formatSingleRecord(record: any): string {
  return formatRecord(record);
}

function getDataInsights(data: any[], query: string): string {
  if (data.length === 0) return '';
  
  let insights = '\n\n💡 Quick Insights:\n';
  
  if (query.includes('lead')) {
    // Lead status distribution
    const statusCounts = data.reduce((acc, lead) => {
      if (lead.status) acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});
    
    const topStatus = Object.entries(statusCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    if (topStatus) {
      insights += `• Most leads are in "${topStatus[0]}" status (${topStatus[1]} leads)\n`;
    }
    
    // Average lead score
    const scoresData = data.filter(l => l.lead_score);
    if (scoresData.length > 0) {
      const avgScore = scoresData.reduce((sum, l) => sum + l.lead_score, 0) / scoresData.length;
      insights += `• Average lead score: ${avgScore.toFixed(1)}/100\n`;
    }
    
    // Priority distribution
    const highPriority = data.filter(l => l.priority === 'High').length;
    if (highPriority > 0) {
      insights += `• ${highPriority} high-priority lead${highPriority !== 1 ? 's' : ''} need immediate attention\n`;
    }
  }
  
  if (query.includes('payment') && data.some(p => p.amount)) {
    const totalRevenue = data.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    insights += `• Total revenue: ₹${totalRevenue.toFixed(2)}\n`;
    
    const avgPayment = totalRevenue / data.length;
    insights += `• Average payment: ₹${avgPayment.toFixed(2)}\n`;
    
    // Count with names vs without names
    const paymentsWithNames = data.filter(p => (p.users && p.users.first_name) || (p.user && p.user.first_name)).length;
    if (paymentsWithNames > 0) {
      insights += `• ${paymentsWithNames} payment${paymentsWithNames !== 1 ? 's' : ''} linked to client profiles\n`;
    }
  }
  
  if (query.includes('user')) {
    // Active vs inactive
    const activeUsers = data.filter(u => u.is_active).length;
    if (activeUsers !== data.length) {
      insights += `• ${activeUsers} active out of ${data.length} total users\n`;
    }
    
    // Users with specialties (coaches)
    const coaches = data.filter(u => u.specialty).length;
    if (coaches > 0) {
      insights += `• ${coaches} user${coaches !== 1 ? 's' : ''} with coaching specialties\n`;
    }
  }
  
  if (query.includes('relationship')) {
    const activeRels = data.filter(r => r.status === 'active').length;
    if (activeRels > 0) {
      insights += `• ${activeRels} active coaching relationship${activeRels !== 1 ? 's' : ''}\n`;
    }
    
    const relsWithNames = data.filter(r => r.client && r.coach).length;
    if (relsWithNames > 0) {
      insights += `• ${relsWithNames} relationship${relsWithNames !== 1 ? 's' : ''} with full client and coach details\n`;
    }
  }
  
  return insights;
}

function getLeadInsight(count: number): string {
  if (count === 0) return "Time to focus on lead generation!";
  if (count < 10) return "Consider boosting your marketing efforts.";
  if (count < 50) return "Good lead flow, keep it up!";
  return "Great lead generation! Make sure to follow up promptly.";
}

function getClientInsight(count: number): string {
  if (count === 0) return "Focus on converting leads to clients.";
  if (count < 20) return "Growing client base!";
  if (count < 100) return "Solid client foundation.";
  return "Impressive client portfolio!";
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    message: 'CRM AI Assistant API is running with name resolution',
    timestamp: new Date().toISOString(),
    version: '6.0.0'
  });
}