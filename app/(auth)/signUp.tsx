import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabaseClient";

const signUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithEmail() {
    setLoading(true);
    const {
      error,
      data: { session },
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) Alert.alert(error.message);
    if (!session) {
      Alert.alert("Please check your inbox for email verification!");
      router.navigate("/(auth)/logIn");
    }
    setLoading(false);
  }
  return (
    <View>
      <View>
        <TextInput
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          placeholder="Enter your password"
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          onChangeText={(text) => setPassword(text)}
        />
      </View>
      <Button title="Sign up" onPress={() => signUpWithEmail()} />
      <Text>
        Have an account?{" "}
        <Text
          onPress={() => {
            router.navigate("/(auth)/logIn");
          }}
          style={{ color: "blue" }}
        >
          Login
        </Text>
      </Text>
    </View>
  );
};
export default signUp;
