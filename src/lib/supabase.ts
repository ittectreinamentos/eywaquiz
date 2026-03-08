import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cjmlyxunvidfyhqotcqz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbWx5eHVudmlkZnlocW90Y3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDIzNzIsImV4cCI6MjA4ODU3ODM3Mn0.UuwHS7vHKw2oX2zV8yOb1rhBoFOsmJI84AMqUoXCIW8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
