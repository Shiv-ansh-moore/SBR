import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ztlcibzhveaudrrpcslc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bGNpYnpodmVhdWRycnBjc2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDQ0MDAsImV4cCI6MjA2MzU4MDQwMH0.kPdZvTfctPEIW4_nIqievxnJbRrUQVIpfdtJVshoAKE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
