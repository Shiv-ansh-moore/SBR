import { View, Button } from "react-native";
import { useRouter } from 'expo-router';
const index = () => {
  const router = useRouter();
  return (
    <View>
      <Button title="Sign up" onPress={() => router.navigate("/(auth)/signUp")} />
      <Button title="Log In" onPress={() => router.navigate("/(auth)/logIn")} />
    </View>
  );
};
export default index;