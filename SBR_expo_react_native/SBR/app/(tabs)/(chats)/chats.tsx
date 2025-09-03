// chats.tsx
import ChatList from "@/components/chats/chatList/ChatList";
import Header from "@/components/chats/chatList/Header";
import Search from "@/components/chats/chatList/Search";
import { StyleSheet, View } from "react-native"; // Import StyleSheet

const chats = () => {
  return (
    <View style={styles.container}>
      <Header />
      <Search />
      <ChatList />
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
