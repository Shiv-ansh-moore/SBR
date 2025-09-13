import FriendProofOverViewList from "@/components/proof/FriendProofOverViewList";
import { StyleSheet, View } from "react-native";
const progress = () => {
  return (
    <View style={styles.container}>
      <FriendProofOverViewList />
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
