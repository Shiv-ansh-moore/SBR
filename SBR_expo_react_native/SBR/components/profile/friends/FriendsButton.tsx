import AddFriends from "@/components/profile/friends/AddFriends";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const EditProfileButton = () => {
  const [showFriends, setShowFriends] = useState<boolean>(false);
  return (
    <View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowFriends(true)}
      >
        <Text style={styles.buttonText}>Friends</Text>
      </TouchableOpacity>
      <AddFriends showFriends={showFriends} setShowFriends={setShowFriends} />
    </View>
  );
};
export default EditProfileButton;
const styles = StyleSheet.create({
  button: {
    height: 40,
    width: 140,
    backgroundColor: "#242424",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  buttonText: { fontFamily: "Regular", fontSize: 16, color: "white" },
});
