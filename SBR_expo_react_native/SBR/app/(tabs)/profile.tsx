import PictureWithEdit from "@/components/profilePicture/PictureWithEdit";
import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { supabase } from "../../lib/supabaseClient";

const profile = () => {
  return (
    <View style={styles.container}>
      <PictureWithEdit />
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
