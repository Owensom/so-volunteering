import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";   

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function createClient() {
  const cookieStore = await cookies();  

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },

      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /*
            Supabase may try to refresh auth cookies while a Server Component
            is rendering. Next.js only allows cookie writes in Server Actions,
            Route Handlers or middleware.

            It is safe to ignore this here because Server Components only need
            to read the current session/user. Cookie refresh writes should be
            handled by middleware or route/action contexts when available.
          */
        }
      }
    }
  });
}
