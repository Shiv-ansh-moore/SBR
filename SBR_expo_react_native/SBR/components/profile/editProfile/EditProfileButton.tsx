import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import EditProfileModal from "./EditProfileModal";
import { useState } from "react";

const EditProfileButton = () => {
  const [showEditProfile, setShowEditProfile] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowEditProfile(true)}
      >
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <EditProfileModal
        showEditProfile={showEditProfile}
        setShowEditProfile={setShowEditProfile}
      />
    </View>
  );
};

export default EditProfileButton;

const styles = StyleSheet.create({
  button: {
    height: 40,
    width: 140,
    backgroundColor: "#287150",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  buttonText: { fontFamily: "Regular", fontSize: 16, color: "white" },
});