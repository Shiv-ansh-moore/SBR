import { createContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";

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
    async function fetchSession() {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      setSession(data.session);
    }
    fetchSession();
    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await checkIsUser(session);
      }
      setLoading(false);
    });

    async function checkIsUser(session: Session) {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .limit(1);
      if (Array.isArray(data) && data.length > 0) {
        setIsUser(true);
        console.log("User exists in the database.");
      } else {
        setIsUser(false);
        console.log("User does not exist in the database.");
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, isUser, setIsUser }}>
      {children}
    </AuthContext.Provider>
  );
}
export { AuthContext };