import { Session } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextProps {
  session: Session | null;
  loading: boolean;
  isUser: boolean;
  setIsUser: (isUser: boolean) => void;
  profilePicLink: string | null;
  refreshProfile: () => Promise<void>; // Function to refresh data
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  loading: true,
  isUser: false,
  setIsUser: () => {},
  profilePicLink: null,
  refreshProfile: async () => {}, // Default empty async function
});

export default function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUser, setIsUser] = useState(false);
  const [profilePicLink, setProfilePicLink] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      try {
        const { data: userDataArray, error: userError } = await supabase
          .from("users")
          .select("profile_pic")
          .eq("id", session.user.id);

        if (userError) throw userError;

        // Get the first item from the array (which will be undefined if no row was found)
        const userData = userDataArray?.[0];
        const imagePath = userData?.profile_pic;

        if (imagePath) {
          const { data: urlData } = supabase.storage
            .from("profilepic")
            .getPublicUrl(imagePath);

          // Append a timestamp to the URL to bypass the cache
          const cacheBustedUrl = `${
            urlData.publicUrl
          }?t=${new Date().getTime()}`;
          setProfilePicLink(cacheBustedUrl);
        } else {
          // Handles both "no profile row found" (userData is undefined)
          // and "profile row found but profile_pic is null" (imagePath is null)
          setProfilePicLink(null);
        }
      } catch (error) {
        // This catch block is now primarily for network or permission errors,
        // not for the "0 rows returned" error.
        console.error("Error fetching profile picture:", error);
        setProfilePicLink(null);
      }
    } else {
      setProfilePicLink(null);
    }
  }, [session]);

  // Effect for initial authentication and session listening
  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();
      setSession(initialSession);
      await checkIsUser(initialSession);
      setLoading(false);
    };

    const checkIsUser = async (currentSession: Session | null) => {
      if (!currentSession) {
        setIsUser(false);
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", currentSession.user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking for user:", error.message);
        setIsUser(false);
      } else {
        setIsUser(!!data);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      await checkIsUser(newSession);
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Effect to update profile picture when session changes or on manual refresh
  useEffect(() => {
    if (session) {
      refreshProfile();
    }
  }, [session, refreshProfile]);

  const value = {
    session,
    loading,
    isUser,
    setIsUser,
    profilePicLink,
    refreshProfile, // Expose the function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
