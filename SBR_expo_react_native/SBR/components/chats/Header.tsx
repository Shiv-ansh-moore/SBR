import Entypo from "@expo/vector-icons/Entypo";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Header = () => {
  return (
    <View>
      <View style={styles.container}>
        <Text style={styles.heading}>Chats:</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.proofButton}>
            <Text style={styles.proofButtonText}>Proof</Text>
            <Entypo name="camera" size={25} color="#3ECF8E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.options}>
            <SimpleLineIcons name="options-vertical" size={25} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
export default Header;
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    fontFamily: "SemiBold",
    color: "white",
    fontSize: 24,
    marginLeft: 20,
  },
  buttonContainer: { flexDirection: "row", alignItems: "center" },
  proofButton: {
    backgroundColor: "#242424",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    borderRadius: 20,
    height: 40,
    width: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 10,
    marginRight: 10,
  },
  proofButtonText: { fontFamily: "Bold", color: "white", fontSize: 15 },
  options: { marginRight: 10 },
});
