import { StyleSheet, Text, View } from "react-native";
const TaskCounter = () => {
  return (
    <View style={styles.box}>
      <Text>TaskCounter</Text>
    </View>
  );
};
export default TaskCounter;
const styles = StyleSheet.create({
  box: {
    height: 120,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    backgroundColor: "#171717",
  },
});
