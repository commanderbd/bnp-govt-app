import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jeygimupxuzalqnkeddf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleWdpbXVweHV6YWxxbmtlZGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NTE4NTQsImV4cCI6MjA5ODIyNzg1NH0.HBs_2nXS7uZsNgyxHspTfhAoz3G2u6UIWde5ufUJK0A';

export const supabase = createClient(supabaseUrl, supabaseKey);