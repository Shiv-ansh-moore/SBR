import { Session } from "@supabase/supabase-js";
import { createContext, ReactNode, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextProps {
  session: Session | null;
  loading: boolean;
  isUser: boolean;
  setIsUser: (isUser: boolean) => void;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  loading: true,
  isUser: false,
  setIsUser: () => {},
});

export default function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUser, setIsUser] = useState(false);
  useEffect(() => {
    // This async function handles the entire initial authentication check.
    const initializeAuth = async () => {
      // 1. Proactively fetch the initial session.
      const {
        data: { session: initialSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting initial session:", error);
        setLoading(false); // Stop loading even if there's an error.
        return;
      }

      // 2. Check for the user profile based on the initial session.
      // This ensures `session` and `isUser` are in sync from the start.
      await checkIsUser(initialSession);
      setSession(initialSession);

      // 3. IMPORTANT: Set loading to false after the initial check is complete.
      setLoading(false);
    };

    // Helper function to check for a user record in the database.
    const checkIsUser = async (currentSession: Session | null) => {
      if (!currentSession) {
        setIsUser(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", currentSession.user.id)
        .single(); // Use .single() for efficiency and simpler logic.

      // PostgREST error 'PGRST116' means no rows found. This is a valid case, not an application error.
      if (error && error.code !== "PGRST116") {
        console.error("Error checking for user:", error.message);
        setIsUser(false);
      } else {
        // If `data` is not null, a user record was found.
        setIsUser(!!data);
      }
    };

    // Run the initial auth check.
    initializeAuth();

    // Now, set up the listener for any subsequent auth changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      await checkIsUser(newSession);
      setSession(newSession);
    });

    // 4. Return a cleanup function to unsubscribe from the listener. This prevents memory leaks.
    return () => {
      subscription.unsubscribe();
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  const value = { session, loading, isUser, setIsUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };