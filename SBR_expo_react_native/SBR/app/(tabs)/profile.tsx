import PictureWithEdit from "@/components/profilePicture/PictureWithEdit";
import { AuthContext } from "@/providers/AuthProvider";
import React, { useContext, useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabaseClient";

const profile = () => {
  const { session } = useContext(AuthContext);
  const user_id = session?.user.id;
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (session) {
      const getUsername = async () => {
        const { data, error } = await supabase
          .from("users")
          .select("username")
          .eq("id", user_id)
          .single();
        if (error) {
          console.log(error);
        }
        setUsername(data?.username);
      };
      getUsername();
    }
  }, [session]);

  return (
    <View style={styles.container}>
      <PictureWithEdit />
      <Text>{username}</Text>
      <Button
        title="Sign Out"
        onPress={async () => {
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error("Error signing out:", error);
          }
        }}
      />
      <Text>Profile</Text>
    </View>
  );
};
export default profile;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
