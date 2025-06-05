import PictureWithEdit from "@/components/profilePicture/PictureWithEdit";
import React from "react";
import { Button, View, Text } from "react-native";
import { supabase } from "../../lib/supabaseClient";

const profile = () => {
  return (
    <View>
      <PictureWithEdit />
      {/* <Button
        title="Sign Out"
        onPress={async () => {
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error("Error signing out:", error);
          }
        }}
      /> */}
      <Text>Profile</Text>
    </View>
  );
};
export default profile;
