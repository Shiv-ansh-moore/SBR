// chats.tsx
import Picture from "@/components/profilePicture/Picture";
import { StyleSheet, Text, View } from "react-native"; // Import StyleSheet

const chats = () => {
  return (
    <View>
      <Text>Chats</Text>
      <Picture isPic={true} />
    </View>
  );
};

// Add styles to make the container fill the screen
const styles = StyleSheet.create({});

export default chats;