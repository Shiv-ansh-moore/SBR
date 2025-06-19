// chats.tsx
import AddFriends from "@/components/Social/Friends/AddFriends";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"; // Import StyleSheet

const chats = () => {
  const [showAddFriends, setShowAddFriends] = useState<boolean>(false);

  return (
    <View>
      {showAddFriends && <AddFriends setShowAddFriends={setShowAddFriends} />}
      <Text>Chats</Text>
      <TouchableOpacity onPress={() => setShowAddFriends(true)}>
        <Text>Add Friends</Text>
      </TouchableOpacity>
    </View>
  );
};

// Add styles to make the container fill the screen
const styles = StyleSheet.create({});

export default chats;
