import PersonalTasks from "@/components/profile/tasks/personalTasks/PersonalTasks";
import { Text, View, StyleSheet } from "react-native";
const index = () => {
  return (
    <View style={styles.container}>
      <PersonalTasks/>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent:"center",
    alignItems:"center"
  },
});
export default index;