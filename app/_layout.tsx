// app/_layout.tsx  ─ root-level layout
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { useContext, useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthProvider, { AuthContext } from "../providers/AuthProvider";
import NotificationProvider, {useNotification} from "@/providers/NotifactionProvider";
import { supabase } from "../lib/supabaseClient"; // Your supabase client


function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, isUser } = useContext(AuthContext);
  const router = useRouter();
  const { expoPushToken } = useNotification();
  const [fontsLoaded, fontError] = useFonts({
    Bold: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-Bold.ttf"),
    BoldItalic: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-BoldItalic.ttf"),
    ExtraLight: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-ExtraLight.ttf"),
    ExtraLightItalic: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-ExtraLightItalic.ttf"),
    Italic: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-Italic.ttf"),
    Light: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-Light.ttf"),
    LightItalic: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-LightItalic.ttf"),
    Medium: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-Medium.ttf"),
    MediumItalic: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-MediumItalic.ttf"),
    Regular: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-Regular.ttf"),
    SemiBold: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-SemiBold.ttf"),
    SemiBoldItalic: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-SemiBoldItalic.ttf"),
    Thin: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-Thin.ttf"),
    ThinItalic: require("../assets/fonts/IBM_Plex_Mono/IBMPlexMono-ThinItalic.ttf"),
  });

  useEffect(() => {
    const savePushToken = async () => {
      if (session?.user?.id && isUser && expoPushToken) {
        try {
          const { error } = await supabase
            .from('users')
            .update({ push_token: expoPushToken })
            .eq('id', session.user.id);

          if (error) {
            console.error("Error saving push token:", error);
          } else {
            console.log("Push token synced to Supabase!");
          }
        } catch (err) {
          console.error("Unexpected error saving token:", err);
        }
      }
    };

    savePushToken();
  }, [session, isUser, expoPushToken]);

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/(auth)");
    } else if (!isUser) {
      router.replace("/(makeUser)");
    } else {
      router.replace("/(tabs)");
    }
  }, [loading, session, isUser, router]);

  if (loading) return <Text>Loading...</Text>;

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});

export default function RootLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthProvider>
        <NotificationProvider>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(makeUser)" />
            </Stack>
          </AuthGate>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaView>
  );
}
