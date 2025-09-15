import { StyleSheet, Text, View } from "react-native";
const progress = () => {
  return (
    <View style={styles.container}>
      <Text>Todo</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});
export default progress;
