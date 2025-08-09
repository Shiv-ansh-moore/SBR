import { StyleSheet, Text, TouchableOpacity } from "react-native";
const EditProfileButton = () => {
  return (
    <TouchableOpacity style={styles.button}>
      <Text style={styles.buttonText}>Edit Profile</Text>
    </TouchableOpacity>
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
