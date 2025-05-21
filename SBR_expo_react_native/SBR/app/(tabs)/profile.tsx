import { View, Text, Button } from "react-native";
import { supabase } from "../../lib/supabaseClient";

const profile = () => {
  return (
    <View>
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
    </View>
  );
};
export default profile;