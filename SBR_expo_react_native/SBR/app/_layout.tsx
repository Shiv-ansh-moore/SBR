// app/_layout.tsx  ─ root-level layout
import { Stack, useRouter } from "expo-router";
import { useContext, useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthProvider, { AuthContext } from "../providers/AuthProvider";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, isUser } = useContext(AuthContext);
  const router = useRouter();

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
    backgroundColor: "#121212", },
});

export default function RootLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(makeUser)" />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </SafeAreaView>
  );
}
