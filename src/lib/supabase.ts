import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types para o banco de dados
export type UserProfile = {
  id: string;
  addiction_type: string;
  addiction_duration: string;
  main_trigger: string;
  main_goal: string;
  created_at: string;
  updated_at: string;
};

export type Streak = {
  id: string;
  user_id: string;
  start_date: string;
  end_date?: string;
  days_count: number;
  is_active: boolean;
  created_at: string;
};

export type Relapse = {
  id: string;
  user_id: string;
  relapse_date: string;
  trigger?: string;
  notes?: string;
  created_at: string;
};

export type Trigger = {
  id: string;
  user_id: string;
  trigger_type: string;
  intensity: number;
  notes?: string;
  created_at: string;
};
