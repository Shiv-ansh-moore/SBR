import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabaseClient";

const logIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) Alert.alert(error.message);
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
      <Button title="Log in" onPress={() => signInWithEmail()} />
      <Text>
        Don't have an account?{" "}
        <Text
          onPress={() => {
            router.navigate("/(auth)/logIn");
          }}
          style={{ color: "blue" }}
        >
          Sign up
        </Text>
      </Text>
    </View>
  );
};
export default logIn;
