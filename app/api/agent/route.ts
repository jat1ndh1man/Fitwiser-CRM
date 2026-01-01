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
- Generate ANY type of Supabase query (SELECT, INSERT, UPDATE, DELETE) based on user request
- For SELECT queries, DO NOT apply LIMIT unless specifically requested by the user
- Use intelligent joins to get names instead of IDs when possible
- Return ONLY the JavaScript code without explanations or markdown
- For UPDATE/DELETE queries, include proper WHERE clauses to prevent accidental mass updates
- For INSERT queries, include all required fields from the schema

ACTUAL DATABASE SCHEMA:

1. users table (clients and coaches):
   - id (uuid, primary key), email (unique), phone, first_name, last_name, role_id (uuid, foreign key)
   - is_active (boolean), age, gender, height, current_weight, target_weight
   - fitness_level, primary_goal, fitness_goal, activity_level, bio, specialty
   - created_at, updated_at, last_login

2. user_roles table:
   - id (uuid, primary key), name, description, created_at

3. leads table:
   - id (uuid, primary key), name, email, phone_number, city, profession
   - status ('New', 'Contacted', 'Qualified', 'Converted', 'Lost')
   - source, counselor, priority ('High', 'Medium', 'Low')
   - lead_score (0-100), conversion_probability (0-100)
   - follow_up_date, last_activity_date, budget, timeline, notes
   - created_at, updated_at

4. manual_payment table:
   - id (uuid, primary key), user_id (uuid, foreign key to users), lead_id (uuid, foreign key to leads)
   - amount, currency, description, payment_method, status
   - payment_date, plan, plan_expiry, created_at

5. payment_links table:
   - id (uuid, primary key), user_id (uuid, foreign key to users), lead_id (uuid, foreign key to leads)
   - amount, currency, description, status, payment_date
   - plan, plan_expiry, is_manual, created_at

6. client_coach_relationships table:
   - id (uuid, primary key), client_id (uuid, foreign key to users), coach_id (uuid, foreign key to users)
   - start_date, end_date, status ('active', 'inactive')
   - created_at, updated_at

QUERY EXAMPLES:

SELECT QUERIES (without limits unless specified):
"Show me all leads" -> supabase.from('leads').select('*').order('created_at', { ascending: false })
"Show me 50 users" -> supabase.from('users').select('id, first_name, last_name, email, phone, specialty, primary_goal, is_active, created_at').order('created_at', { ascending: false }).limit(50)
"Count all users" -> supabase.from('users').select('*', { count: 'exact', head: true })

INSERT QUERIES:
"Add a new user named John Doe" -> supabase.from('users').insert([{ first_name: 'John', last_name: 'Doe', email: 'john@example.com', is_active: true, created_at: new Date().toISOString() }])
"Create a new lead" -> supabase.from('leads').insert([{ name: 'New Lead', email: 'lead@example.com', status: 'New', created_at: new Date().toISOString() }])

UPDATE QUERIES:
"Update user status to inactive" -> supabase.from('users').update({ is_active: false }).eq('id', 'specific-user-id-here')
"Mark lead as converted" -> supabase.from('leads').update({ status: 'Converted', updated_at: new Date().toISOString() }).eq('id', 'specific-lead-id-here')

DELETE QUERIES:
"Delete a specific user" -> supabase.from('users').delete().eq('id', 'specific-user-id-here')
"Remove old inactive leads" -> supabase.from('leads').delete().eq('status', 'Lost').lt('updated_at', new Date(Date.now() - 90*24*60*60*1000).toISOString())

JOIN EXAMPLES:
"Show payments with user names" -> supabase.from('manual_payment').select('*, users!inner(first_name, last_name, email)').order('payment_date', { ascending: false })
"Show all client-coach relationships" -> supabase.from('client_coach_relationships').select('*, client:users!client_id(first_name, last_name, email), coach:users!coach_id(first_name, last_name, specialty)')

COMPLEX QUERIES:
"Find users without coaches" -> supabase.from('users').select('*').not('id', 'in', supabase.from('client_coach_relationships').select('client_id')).eq('is_active', true)
"Get leads with high conversion probability" -> supabase.from('leads').select('*').gt('conversion_probability', 75).order('conversion_probability', { ascending: false })

IMPORTANT:
- Always use .eq() or .in() for UPDATE/DELETE to avoid mass updates
- For INSERT, include created_at timestamp
- For UPDATE, include updated_at timestamp
- Use proper error handling in production

Return ONLY the JavaScript query code.
`;

const rateLimitMap = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 100; // Increased limit
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
    console.log('=== Enhanced CRM API Started ===');
    
    // Rate limiting (increased limits)
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const { message, actionType = 'query' } = body;
    console.log('User message:', message, 'Action type:', actionType);

    if (!message || typeof message !== 'string' || message.length > 2000) {
      return NextResponse.json(
        { error: 'Please provide a valid request (under 2000 characters).' },
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

    console.log('Generating AI response...');

    // Generate query using OpenAI
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: DATABASE_SCHEMA },
          { role: "user", content: `Convert this to a Supabase query: "${message}"` }
        ],
        temperature: 0.1,
        max_tokens: 1000,
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

    // Execute the query
    console.log('Executing database query...');
    const result = await executeSupabaseQuery(queryCode);
    
    console.log('Query executed successfully:', { 
      dataLength: Array.isArray(result.data) ? result.data.length : 'single object',
      count: result.count,
      total: result.total,
      hasData: !!(result.data)
    });
    
    // Format comprehensive response
    const humanResponse = await formatComprehensiveResponse(result, message, queryCode);
    console.log('Response formatted successfully');

    return NextResponse.json({ 
      success: true,
      message: humanResponse,
      data: result.data,
      recordCount: result.total || 0,
      query: queryCode,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('=== API Error ===', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    // Provide detailed error information
    let publicError = 'An error occurred while processing your request.';
    let statusCode = 500;
    
    if (error.message.includes('timeout')) {
      publicError = 'The query timed out. Please try a more specific request or contact support.';
      statusCode = 408;
    } else if (error.message.includes('permission denied')) {
      publicError = 'You don\'t have permission to perform this action.';
      statusCode = 403;
    } else if (error.message.includes('invalid input')) {
      publicError = 'Invalid input provided. Please check your request parameters.';
      statusCode = 400;
    }

    return NextResponse.json(
      { 
        error: publicError,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

async function executeSupabaseQuery(queryCode: string): Promise<any> {
  try {
    console.log('Raw query code:', queryCode);
    
    // Clean the query
    const cleanQuery = queryCode
      .replace(/```javascript|```js|```/g, '')
      .replace(/[\n\r\t]/g, ' ')
      .trim();
    
    console.log('Cleaned query:', cleanQuery);
    
    if (!cleanQuery || cleanQuery.length < 5) {
      throw new Error('Generated query is invalid');
    }

    // Enhanced validation
    const validOperations = ['.select(', '.insert(', '.update(', '.delete(', '.upsert('];
    const isValidOperation = validOperations.some(op => cleanQuery.includes(op));
    
    if (!isValidOperation) {
      throw new Error('Invalid query operation');
    }

    // Security check: Prevent mass UPDATE/DELETE without WHERE clause
    if (cleanQuery.includes('.update(') || cleanQuery.includes('.delete(')) {
      if (!cleanQuery.includes('.eq(') && !cleanQuery.includes('.in(') && !cleanQuery.includes('.match(')) {
        throw new Error('UPDATE/DELETE queries must include a WHERE clause (eq, in, or match)');
      }
    }

    console.log('Executing query with Supabase...');
    
    let query;
    try {
      const executeQuery = new Function(
        'supabase', 
        'Date', 
        `
        try {
          const query = ${cleanQuery};
          if (!query) throw new Error('Query returned undefined');
          return query;
        } catch (e) {
          throw new Error('Query execution error: ' + e.message);
        }
        `
      );
      
      query = executeQuery(supabase, Date);
    } catch (syntaxError: any) {
      console.error('Query syntax error:', syntaxError);
      throw new Error(`Query syntax error: ${syntaxError.message}`);
    }

    if (!query || typeof query.then !== 'function') {
      throw new Error('Generated code is not a valid Supabase query');
    }

    // Execute with generous timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout (30s)')), 30000)
    );

    const result = await Promise.race([query, timeoutPromise]);
    
    if (!result) {
      throw new Error('Database returned no response');
    }

    const { data, error, count } = result as any;

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message || 'Unknown database error'}`);
    }

    // For INSERT/UPDATE/DELETE operations, data might be an array of affected rows
    const totalCount = count || (Array.isArray(data) ? data.length : (data ? 1 : 0));
    
    return {
      data: data || [],
      count: count,
      total: totalCount,
      raw: result
    };

  } catch (error: any) {
    console.error('Query execution error:', error);
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

async function formatComprehensiveResponse(result: any, originalQuery: string, queryCode: string): Promise<string> {
  const { data, count, total } = result;
  const lowerQuery = originalQuery.toLowerCase();
  
  let response = '## 📊 CRM Query Results\n\n';

  // Check operation type
  const isSelect = queryCode.includes('.select(');
  const isInsert = queryCode.includes('.insert(');
  const isUpdate = queryCode.includes('.update(');
  const isDelete = queryCode.includes('.delete(');

  // Operation-specific messaging
  if (isInsert) {
    response += `✅ **Records Inserted Successfully**\n\n`;
    response += `Added ${total} new record${total !== 1 ? 's' : ''} to the database.\n\n`;
  } else if (isUpdate) {
    response += `🔄 **Records Updated Successfully**\n\n`;
    response += `Updated ${total} record${total !== 1 ? 's' : ''} in the database.\n\n`;
  } else if (isDelete) {
    response += `🗑️ **Records Deleted Successfully**\n\n`;
    response += `Removed ${total} record${total !== 1 ? 's' : ''} from the database.\n\n`;
  }

  // Handle empty results
  if (!data || (Array.isArray(data) && data.length === 0)) {
    if (isSelect) {
      return response + getEmptyResultMessage(originalQuery);
    }
    return response + 'No records were affected by this operation.';
  }

  // Handle count-only queries
  if (count !== undefined && count !== null && (!data || data.length === 0)) {
    return response + getCountMessage(count, originalQuery);
  }

  // Handle data results
  if (Array.isArray(data) && data.length > 0) {
    if (isSelect) {
      response += formatArrayResults(data, originalQuery);
    } else {
      response += `**Operation completed successfully.**\n\n`;
      response += `Affected records:\n`;
      
      data.slice(0, 10).forEach((record: any, index: number) => {
        response += `${index + 1}. ${formatOperationRecord(record)}\n`;
      });
      
      if (data.length > 10) {
        response += `\n... and ${data.length - 10} more record${data.length - 10 !== 1 ? 's' : ''}.`;
      }
    }
  } else if (data && typeof data === 'object') {
    response += `**Single Record Result**\n\n`;
    response += formatSingleRecord(data);
  }

  // Add metadata
  response += `\n\n---\n`;
  response += `**Query Summary:**\n`;
  response += `• Total records: ${total || 'N/A'}\n`;
  response += `• Operation: ${getOperationType(queryCode)}\n`;
  response += `• Timestamp: ${new Date().toLocaleString()}\n`;
  
  // Add insights for SELECT queries
  if (isSelect && Array.isArray(data) && data.length > 0) {
    response += getEnhancedInsights(data, originalQuery);
  }

  return response;
}

function formatOperationRecord(record: any): string {
  if (record.id) {
    let formatted = `ID: ${record.id.substring(0, 8)}...`;
    
    // Add meaningful fields based on table
    if (record.name) formatted += ` | Name: ${record.name}`;
    if (record.first_name || record.last_name) {
      formatted += ` | Name: ${record.first_name || ''} ${record.last_name || ''}`.trim();
    }
    if (record.email) formatted += ` | Email: ${record.email}`;
    if (record.status) formatted += ` | Status: ${record.status}`;
    if (record.amount) formatted += ` | Amount: ₹${record.amount}`;
    
    return formatted;
  }
  
  // For operations that return minimal data
  const keys = Object.keys(record).slice(0, 3);
  return keys.map(key => `${key}: ${record[key]}`).join(' | ');
}

function getOperationType(queryCode: string): string {
  if (queryCode.includes('.select(')) return 'SELECT';
  if (queryCode.includes('.insert(')) return 'INSERT';
  if (queryCode.includes('.update(')) return 'UPDATE';
  if (queryCode.includes('.delete(')) return 'DELETE';
  return 'UNKNOWN';
}

function getEmptyResultMessage(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  const messages = [
    "📭 No records found matching your criteria.",
    "🔍 Your search returned zero results.",
    "📋 No data available for the specified parameters.",
    "👀 Nothing found. Try broadening your search criteria."
  ];
  
  let specific = '';
  
  if (lowerQuery.includes('today') || lowerQuery.includes('recent')) {
    specific = " No activity recorded for the specified time period.";
  } else if (lowerQuery.includes('lead')) {
    specific = " No leads match your search criteria.";
  } else if (lowerQuery.includes('client') || lowerQuery.includes('user')) {
    specific = " No users found with those parameters.";
  } else if (lowerQuery.includes('payment')) {
    specific = " No payment records found.";
  }
  
  return messages[Math.floor(Math.random() * messages.length)] + specific;
}

function getCountMessage(count: number, query: string): string {
  const lowerQuery = query.toLowerCase();
  
  let entity = 'records';
  if (lowerQuery.includes('lead')) entity = 'leads';
  else if (lowerQuery.includes('client') || lowerQuery.includes('user')) entity = 'users';
  else if (lowerQuery.includes('coach')) entity = 'coaches';
  else if (lowerQuery.includes('payment')) entity = 'payments';
  
  return `**${count}** ${entity} found in total.`;
}

function formatArrayResults(data: any[], query: string): string {
  const lowerQuery = query.toLowerCase();
  const recordCount = data.length;
  
  let response = '';
  
  // Determine entity type
  if (lowerQuery.includes('lead')) {
    response += `📋 **${recordCount} Leads**\n\n`;
  } else if (lowerQuery.includes('client') || lowerQuery.includes('user')) {
    if (lowerQuery.includes('coach')) {
      response += `💪 **${recordCount} Coaches**\n\n`;
    } else {
      response += `👥 **${recordCount} Users**\n\n`;
    }
  } else if (lowerQuery.includes('payment')) {
    response += `💰 **${recordCount} Payments**\n\n`;
  } else if (lowerQuery.includes('relationship')) {
    response += `🤝 **${recordCount} Relationships**\n\n`;
  } else {
    response += `📊 **${recordCount} Records**\n\n`;
  }

  // Display all records (no truncation)
  data.forEach((record, index) => {
    response += `${index + 1}. ${formatRecord(record)}\n`;
  });

  return response;
}

function formatRecord(record: any): string {
  // Enhanced lead formatting
  if (record.name && (record.email || record.phone_number)) {
    let formatted = `**${record.name}**`;
    if (record.email) formatted += ` (${record.email})`;
    if (record.phone_number) formatted += ` 📱${record.phone_number}`;
    if (record.status) formatted += ` | Status: **${record.status}**`;
    if (record.priority) formatted += ` | Priority: ${record.priority}`;
    if (record.lead_score !== undefined) formatted += ` | Score: ${record.lead_score}`;
    if (record.city) formatted += ` | Location: ${record.city}`;
    if (record.profession) formatted += ` | Profession: ${record.profession}`;
    if (record.follow_up_date) formatted += ` | Follow-up: ${new Date(record.follow_up_date).toLocaleDateString()}`;
    return formatted;
  }
  
  // Enhanced user formatting
  if (record.first_name || record.last_name || record.email) {
    let name = `${record.first_name || ''} ${record.last_name || ''}`.trim();
    if (!name && record.email) name = record.email;
    
    let formatted = `**${name}**`;
    if (record.email && name !== record.email) formatted += ` (${record.email})`;
    if (record.phone) formatted += ` 📱${record.phone}`;
    if (record.specialty) formatted += ` | Specialty: ${record.specialty}`;
    if (record.primary_goal) formatted += ` | Goal: ${record.primary_goal}`;
    if (record.current_weight && record.target_weight) {
      formatted += ` | Weight: ${record.current_weight}kg → ${record.target_weight}kg`;
    }
    if (record.fitness_level) formatted += ` | Level: ${record.fitness_level}`;
    if (record.is_active !== undefined) formatted += ` | ${record.is_active ? '✅ Active' : '❌ Inactive'}`;
    return formatted;
  }
  
  // Enhanced payment formatting
  if (record.amount !== undefined) {
    let formatted = `💰 **₹${parseFloat(record.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**`;
    
    if (record.payment_date) {
      formatted += ` on ${new Date(record.payment_date).toLocaleDateString()}`;
    }
    
    // Check for joined user data
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
  
  // Relationship formatting
  if (record.client_id && record.coach_id) {
    let formatted = '';
    
    if (record.client && (record.client.first_name || record.client.last_name)) {
      formatted += `**Client:** ${record.client.first_name || ''} ${record.client.last_name || ''}`.trim();
    } else {
      formatted += `Client ID: ${record.client_id.substring(0, 8)}...`;
    }
    
    formatted += ' → ';
    
    if (record.coach && (record.coach.first_name || record.coach.last_name)) {
      formatted += `**Coach:** ${record.coach.first_name || ''} ${record.coach.last_name || ''}`.trim();
      if (record.coach.specialty) formatted += ` (${record.coach.specialty})`;
    } else {
      formatted += `Coach ID: ${record.coach_id.substring(0, 8)}...`;
    }
    
    if (record.status) formatted += ` | Status: ${record.status}`;
    if (record.start_date) formatted += ` | Started: ${new Date(record.start_date).toLocaleDateString()}`;
    if (record.end_date) formatted += ` | Ended: ${new Date(record.end_date).toLocaleDateString()}`;
    return formatted;
  }
  
  // Generic formatting with more fields
  const keys = Object.keys(record).filter(key => 
    !key.includes('created_at') && 
    !key.includes('updated_at') &&
    typeof record[key] !== 'object'
  );
  
  const values = keys.slice(0, 5).map(key => {
    const value = record[key];
    if (value === null || value === undefined) return '';
    
    let formattedValue = value;
    if (typeof value === 'string' && value.length > 30) {
      formattedValue = `${value.substring(0, 27)}...`;
    } else if (typeof value === 'boolean') {
      formattedValue = value ? '✅ Yes' : '❌ No';
    } else if (key.toLowerCase().includes('date')) {
      formattedValue = new Date(value).toLocaleDateString();
    } else if (key.toLowerCase().includes('amount')) {
      formattedValue = `₹${parseFloat(value).toLocaleString('en-IN')}`;
    }
    
    return `**${key}:** ${formattedValue}`;
  }).filter(v => v);
  
  return values.join(' | ');
}

function formatSingleRecord(record: any): string {
  let response = '';
  
  Object.keys(record).forEach(key => {
    if (typeof record[key] === 'object') return;
    
    const value = record[key];
    let displayValue = value;
    
    if (value === null || value === undefined) {
      displayValue = 'N/A';
    } else if (typeof value === 'boolean') {
      displayValue = value ? '✅ Yes' : '❌ No';
    } else if (key.toLowerCase().includes('date')) {
      displayValue = new Date(value).toLocaleString();
    } else if (key.toLowerCase().includes('amount')) {
      displayValue = `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
    
    response += `**${key.replace(/_/g, ' ').toUpperCase()}:** ${displayValue}\n`;
  });
  
  return response;
}

function getEnhancedInsights(data: any[], query: string): string {
  let insights = '\n\n## 📈 **Insights & Analytics**\n\n';
  
  if (query.toLowerCase().includes('lead')) {
    // Lead status distribution
    const statusCounts = data.reduce((acc: any, lead: any) => {
      if (lead.status) {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
      }
      return acc;
    }, {});
    
    if (Object.keys(statusCounts).length > 0) {
      insights += '**Lead Status Distribution:**\n';
      Object.entries(statusCounts).forEach(([status, count]: [string, any]) => {
        const percentage = ((count / data.length) * 100).toFixed(1);
        insights += `• ${status}: ${count} (${percentage}%)\n`;
      });
    }
    
    // Average lead score
    const scoresData = data.filter((l: any) => l.lead_score !== undefined && l.lead_score !== null);
    if (scoresData.length > 0) {
      const avgScore = scoresData.reduce((sum: number, l: any) => sum + l.lead_score, 0) / scoresData.length;
      insights += `\n**Lead Quality:** Average score: ${avgScore.toFixed(1)}/100\n`;
    }
    
    // Priority analysis
    const highPriority = data.filter((l: any) => l.priority === 'High').length;
    const mediumPriority = data.filter((l: any) => l.priority === 'Medium').length;
    const lowPriority = data.filter((l: any) => l.priority === 'Low').length;
    
    insights += `\n**Priority Breakdown:**\n`;
    insights += `• High: ${highPriority} leads\n`;
    insights += `• Medium: ${mediumPriority} leads\n`;
    insights += `• Low: ${lowPriority} leads\n`;
  }
  
  if (query.toLowerCase().includes('payment') && data.some((p: any) => p.amount)) {
    const totalRevenue = data.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0);
    const avgPayment = totalRevenue / data.length;
    
    insights += '\n**Financial Summary:**\n';
    insights += `• Total Revenue: **₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}**\n`;
    insights += `• Average Payment: **₹${avgPayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}**\n`;
    insights += `• Number of Transactions: **${data.length}**\n`;
    
    // Payment status breakdown
    const statusCounts = data.reduce((acc: any, payment: any) => {
      if (payment.status) {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
      }
      return acc;
    }, {});
    
    if (Object.keys(statusCounts).length > 0) {
      insights += '\n**Payment Status:**\n';
      Object.entries(statusCounts).forEach(([status, count]: [string, any]) => {
        insights += `• ${status}: ${count} payments\n`;
      });
    }
  }
  
  if (query.toLowerCase().includes('user')) {
    // Active vs inactive
    const activeUsers = data.filter((u: any) => u.is_active).length;
    const inactiveUsers = data.length - activeUsers;
    
    insights += '\n**User Activity:**\n';
    insights += `• Active Users: ${activeUsers}\n`;
    insights += `• Inactive Users: ${inactiveUsers}\n`;
    
    // Coaches vs clients
    const coaches = data.filter((u: any) => u.specialty).length;
    const clients = data.length - coaches;
    
    if (coaches > 0) {
      insights += '\n**User Roles:**\n';
      insights += `• Coaches: ${coaches}\n`;
      insights += `• Clients: ${clients}\n`;
    }
  }
  
  if (query.toLowerCase().includes('relationship')) {
    const activeRels = data.filter((r: any) => r.status === 'active').length;
    const inactiveRels = data.length - activeRels;
    
    insights += '\n**Relationship Status:**\n';
    insights += `• Active: ${activeRels}\n`;
    insights += `• Inactive: ${inactiveRels}\n`;
  }
  
  return insights;
}

// Enhanced health check endpoint
export async function GET() {
  try {
    // Test database connection
    const { data: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { data: leadCount, error: leadError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    const isDbHealthy = !userError && !leadError;
    
    return NextResponse.json({ 
      status: 'healthy',
      message: 'Enhanced CRM AI Assistant API is fully operational',
      timestamp: new Date().toISOString(),
      version: '7.0.0',
      features: [
        'Full query support (SELECT, INSERT, UPDATE, DELETE)',
        'No artificial limits on results',
        'Comprehensive data formatting',
        'Enhanced insights and analytics',
        'Advanced error handling'
      ],
      database: {
        connected: isDbHealthy,
        userCount: userCount || 'N/A',
        leadCount: leadCount || 'N/A'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      message: 'API is running but database connection failed',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}