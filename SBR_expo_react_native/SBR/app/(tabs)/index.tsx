import { Text, View, StyleSheet } from "react-native";
const index = () => {
  return (
    <View style={styles.container}>
      <Text>index</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});
export default index;