// chats.tsx
import Camera from "@/components/camera/Camera";
import { View, StyleSheet } from "react-native"; // Import StyleSheet

const chats = () => {
  return (
    // Apply the style to the container View
    <View style={styles.container}>
      <Camera />
    </View>
  );
};

// Add styles to make the container fill the screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default chats;