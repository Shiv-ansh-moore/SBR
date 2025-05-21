import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zoldcnqndhxeexryxanw.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvbGRjbnFuZGh4ZWV4cnl4YW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjUzMzksImV4cCI6MjA1NzU0MTMzOX0.snGD1eWA21fn5va-PWA8R7VNWo84csQPuhTZ8qFhssk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
