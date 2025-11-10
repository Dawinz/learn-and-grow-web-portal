// Supabase configuration constants
// These are safe to expose in the browser (they're public keys)
export const SUPABASE_URL = 
  typeof window !== 'undefined' 
    ? (window as any).__NEXT_PUBLIC_SUPABASE_URL__ || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iscqpvwtikwqquvxlpsr.supabase.co'
    : process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iscqpvwtikwqquvxlpsr.supabase.co'

export const SUPABASE_ANON_KEY = 
  typeof window !== 'undefined'
    ? (window as any).__NEXT_PUBLIC_SUPABASE_ANON_KEY__ || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0'
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0'

