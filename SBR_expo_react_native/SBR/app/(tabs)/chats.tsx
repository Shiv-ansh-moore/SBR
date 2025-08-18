// chats.tsx
import { StyleSheet, View } from "react-native"; // Import StyleSheet

const chats = () => {
  return <View style={styles.container}></View>;
};

// Add styles to make the container fill the screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});

export default chats;
