import { useContext, useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabaseClient";
import { AuthContext } from "../../providers/AuthProvider";

const index = () => {
  const { session, setIsUser } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");

  return (
    <View>
      <TextInput
        placeholder="Enter a unique username"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        onChangeText={(text) => setUsername(text)}
      />
      <TextInput
        placeholder="Enter your nickname"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="nickname"
        onChangeText={(text) => setNickname(text)}
      />
      <Button
        title="Make Account"
        onPress={async () => {
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
              }
            } else {
              console.log("User created successfully!");
              setIsUser(true);
            }
          }
        }}
      />
      <Button
        title="Sign Out"
        onPress={async () => {
          try {
            await supabase.auth.signOut();
            // setIsUser(false);
          } catch (error) {
            console.error("Error signing out:", error);
          }
        }}
      />
    </View>
  );
};
export default index;
