import { useContext, useState } from "react";
import {
  Alert,
  TextInput,
  View,
  StyleSheet, // <<< IMPORT
  TouchableOpacity, // <<< IMPORT
  ActivityIndicator, // <<< IMPORT
  KeyboardAvoidingView, // <<< IMPORT
  Platform, // <<< IMPORT
  Text, // <<< IMPORT
} from "react-native";
import { supabase } from "../../lib/supabaseClient";
import { AuthContext } from "../../providers/AuthProvider";

const index = () => {
  const { session, setIsUser } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false); // <<< ADDED
  const [signOutLoading, setSignOutLoading] = useState(false); // <<< ADDED

  // --- Extracted logic into its own function ---
  async function makeAccount() {
    if (loading) return;
    setLoading(true);

    if (session?.user.id) {
      const { error } = await supabase.from("users").insert({
        id: session?.user.id,
        username: username,
        nickname: nickname,
      });
      if (error) {
        console.error("Error creating user:", error);
        if (error.code === "23505") {
          Alert.alert("Username already in use");
        } else {
          Alert.alert(error.message); // Show other errors
        }
      } else {
        console.log("User created successfully!");
        setIsUser(true);
      }
    }
    setLoading(false);
  }

  // --- Extracted logic for sign out ---
  async function handleSignOut() {
    if (signOutLoading) return;
    setSignOutLoading(true);
    try {
      await supabase.auth.signOut();
      // setIsUser(false);
    } catch (error) {
      // <-- 'error' is 'unknown' here
      console.error("Error signing out:", error);

      // --- FIX: Check the type before using ---
      if (error instanceof Error) {
        Alert.alert(error.message);
      } else if (typeof error === "string") {
        Alert.alert(error);
      } else {
        Alert.alert("An unknown error occurred while signing out.");
      }
    }
    setSignOutLoading(false);
  }

  return (
    // --- Replaced View with KeyboardAvoidingView ---
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Text style={styles.title}>Create Your Profile</Text>

      {/* --- Added input container --- */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input} // <<< STYLE
          placeholder="Enter a unique username"
          placeholderTextColor="rgba(255,255,255,0.5)" // <<< STYLE
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          onChangeText={(text) => setUsername(text)}
        />
        <TextInput
          style={styles.input} // <<< STYLE
          placeholder="Enter your nickname"
          placeholderTextColor="rgba(255,255,255,0.5)" // <<< STYLE
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="nickname"
          onChangeText={(text) => setNickname(text)}
        />
      </View>

      {/* --- Replaced Button with TouchableOpacity --- */}
      <TouchableOpacity
        style={styles.button}
        onPress={makeAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Make Account</Text>
        )}
      </TouchableOpacity>

      {/* --- Replaced Button with styled Text link --- */}
      <Text style={styles.secondaryText}>
        Not ready?{" "}
        <Text onPress={handleSignOut} style={styles.linkText}>
          {signOutLoading ? "Signing out..." : "Sign Out"}
        </Text>
      </Text>
    </KeyboardAvoidingView>
  );
};
export default index;

// --- STYLES (Copied from other files) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#171717",
  },
  title: {
    fontFamily: "SemiBold",
    color: "white",
    fontSize: 32,
    textAlign: "center",
    marginBottom: 40,
  },
  inputContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "#242424",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    borderRadius: 20,
    height: 50,
    paddingHorizontal: 20,
    color: "white",
    fontFamily: "Regular",
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#3ECF8E",
    width: "100%",
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontFamily: "Regular",
    color: "white",
    fontSize: 18,
  },
  secondaryText: {
    fontFamily: "Regular",
    color: "#AAAAAA",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  linkText: {
    fontFamily: "Regular",
    color: "#3ECF8E",
    fontSize: 16,
  },
});
