import { createClient } from "@supabase/supabase-js";

/** Default Studio project (eu-west-1). Anon key must come from env / .env — never commit secrets. */
const PROJECT_REF = "kxibxwvigejfzbhkksgu";
const PROJECT_URL = `https://${PROJECT_REF}.supabase.co`;

function readPublicEnv() {
  try {
    return {
      url: import.meta.env.VITE_SUPABASE_URL || PROJECT_URL,
      key: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
    };
  } catch {
    return { url: PROJECT_URL, key: "" };
  }
}

const { url, key } = readPublicEnv();

export const supabaseProjectRef = PROJECT_REF;
export const supabase = url && key ? createClient(url, key) : null;
export const isRemote = Boolean(supabase);
