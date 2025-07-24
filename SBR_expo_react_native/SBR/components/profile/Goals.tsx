import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Dispatch, SetStateAction } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GoalsProps {
  setShowAddGoal: Dispatch<SetStateAction<boolean>>;
}

const Goals = ({ setShowAddGoal }: GoalsProps) => {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Goals</Text>
      <View>
        <Text style={styles.listText}>• Get to 80kg</Text>
        <Text style={styles.listText}>• £500000000</Text>
        <Text style={styles.listText}>• Get Active</Text>
        <Text style={styles.listText}>• Get First Class Honours</Text>
      </View>
      <View style={styles.crudBox}>
        <TouchableOpacity onPress={() => setShowAddGoal(true)}>
          <Ionicons name="add-circle" size={25} color="#3ECF8E" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Feather name="edit" size={25} color="#3ECF8E" />
        </TouchableOpacity>
        <TouchableOpacity>
          <MaterialCommunityIcons name="delete" size={25} color="#3ECF8E" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default Goals;
const styles = StyleSheet.create({
  box: {
    height: 255,
    width: 333,
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    backgroundColor: "#171717",
  },
  title: {
    fontSize: 24,
    color: "white",
    fontFamily: "SemiBold",
    marginLeft: 10,
  },
  listText: {
    fontSize: 16,
    color: "white",
    fontFamily: "Light",
    marginLeft: 5,
  },
  crudBox: {
    width: 313,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#242424",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 5,
    alignSelf: "center",
    position: "absolute",
    bottom: 0,
  },
});
