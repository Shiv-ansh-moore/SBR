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
    // setLoading(true) is not needed here as it's the initial state.

    // onAuthStateChange returns a subscription object.
    // It's crucial to unsubscribe when the component unmounts.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        // Only check for a user if a session exists
        await checkIsUser(session);
      } else {
        // If no session, they are definitely not a user in the DB
        setIsUser(false);
      }
      setLoading(false);
    });

    // The cleanup function for the useEffect hook
    return () => {
      subscription.unsubscribe();
    };

    // The async checkIsUser function remains the same
    async function checkIsUser(session: Session) {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single(); // .single() is more efficient if you expect 1 or 0 rows

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error here
        console.error("Error checking user:", error);
        setIsUser(false);
      } else if (data) {
        setIsUser(true);
      } else {
        setIsUser(false);
      }
    }
  }, []);

  const value = { session, loading, isUser, setIsUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };