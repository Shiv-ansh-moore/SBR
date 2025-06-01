import Camera from "@/components/camera/Camera";
import React, { useState } from "react";
import { Button, View } from "react-native";
import { supabase } from "../../lib/supabaseClient";

const profile = () => {
  const [showCamera, setShowCamera] = useState(false);

  if (showCamera) {
    return <Camera setShowCamera = {setShowCamera} />;
  }
  if (!showCamera) {
    return (
      <View>
        <Button title="Open Camera" onPress={() => setShowCamera(true)} />
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
  }
};
export default profile;