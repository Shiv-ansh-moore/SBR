import { Redirect, Stack } from "expo-router";
import { useContext } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthProvider, { AuthContext } from "../providers/AuthProvider";
import "./global.css";

export default function RootLayout() {
  function AuthGate({ children }: { children: React.ReactNode }) {
    const { session, loading, isUser } = useContext(AuthContext);
    if (loading) return <Text>Loading...</Text>;
    if (!session) return <Redirect href={"/(auth)"} />;
    if (!isUser) return <Redirect href={"/(makeUser)"} />;
    return <Redirect href={"/(tabs)"} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AuthProvider>
        <AuthGate>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(makeUser)" options={{ headerShown: false }} />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </SafeAreaView>
  );
}
