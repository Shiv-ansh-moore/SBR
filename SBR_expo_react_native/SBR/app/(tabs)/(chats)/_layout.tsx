import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
const _layout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="chats" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
};
export default _layout;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});
