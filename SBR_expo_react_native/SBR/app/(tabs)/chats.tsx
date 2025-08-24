// chats.tsx
import Header from "@/components/chats/Header";
import Search from "@/components/chats/Search";
import { StyleSheet, View } from "react-native"; // Import StyleSheet

const chats = () => {
  return (
    <View style={styles.container}>
      <Header />
      <Search />
    </View>
  );
};

// Add styles to make the container fill the screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});

export default chats;
