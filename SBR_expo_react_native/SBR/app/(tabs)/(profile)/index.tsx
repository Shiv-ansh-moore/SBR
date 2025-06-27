import PictureWithEdit from "@/components/profilePicture/PictureWithEdit";
import { AuthContext } from "@/providers/AuthProvider";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabaseClient";

const profile = () => {
  const { session } = useContext(AuthContext);
  const user_id = session?.user.id;
  const [username, setUsername] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (session) {
      const getUsername = async () => {
        if (user_id) {
          const { data, error } = await supabase
            .from("users")
            .select("username")
            .eq("id", user_id)
            .single();
          if (error) {
            console.log(error);
          }
          if (data?.username) {
            setUsername(data.username);
          }
        }
      };
      getUsername();
    }
  }, [session]);

  return (
    <View style={styles.container}>
      <Text>New profile page</Text>
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
      <TouchableOpacity
        onPress={() => {
          router.navigate("/goals");
        }}
      >
        <Text>Goals</Text>
      </TouchableOpacity>
    </View>
  );
};
export default profile;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
