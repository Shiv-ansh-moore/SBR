import AddGroupMembers from "@/components/chats/messages/AddGroupMembers";
import MessageView from "@/components/chats/messages/MessageView";
import { supabase } from "@/lib/supabaseClient"; // 1. Import supabase
import { AuthContext } from "@/providers/AuthProvider"; // 2. Import AuthContext
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useState } from "react"; // 3. Import useContext
import {
  Alert, // Import Alert for error handling
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function chat() {
  const { id, name, pic } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useContext(AuthContext); // 4. Get session from context

  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [message, setMessage] = useState(""); // 5. Add state for the message input

  // 6. Function to handle sending the message
  const handleSendMessage = async () => {
    if (!message.trim()) {
      return; // Don't send empty messages
    }
    if (!session?.user || !id) {
      Alert.alert(
        "Error",
        "Could not send message. User or group not identified."
      );
      return;
    }

    const messageData = {
      user_id: session.user.id,
      group_id: parseInt(id as string),
      message_type: "text",
      message_content: { text: message.trim() },
    };

    const { error } = await supabase.from("chat_messages").insert(messageData);

    if (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message.");
    } else {
      setMessage(""); // Clear the input field on successful send
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={45}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        {pic ? (
          <Image style={styles.groupImage} source={pic as string} />
        ) : (
          <View style={[styles.groupImage, styles.placeholderContainer]}>
            <FontAwesome name="group" size={24} color="white" />
          </View>
        )}

        <Text style={styles.title}>{name}</Text>
        <TouchableOpacity
          style={styles.groupMembersContainer}
          onPress={() => setShowAddMembersModal(true)}
        >
          <FontAwesome name="group" size={25} color="#3ECF8E" />
        </TouchableOpacity>
      </View>
      <View style={styles.messagesContainer}>
        {/* Note: This component won't auto-update without real-time subscriptions */}
        <MessageView groupId={parseInt(id as string)} />
      </View>
      <View style={styles.inputButtonContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#999"
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            // Triggers the send function on keyboard submit
            onSubmitEditing={handleSendMessage}
            // Changes the return key to "send"
            returnKeyType="send"
          />
        </View>
        <TouchableOpacity style={styles.proofButton}>
          <Entypo
            name="camera"
            size={30}
            color="#3ECF8E"
            style={styles.cameraIcon}
          />
        </TouchableOpacity>
        {/* 9. Add onPress handler to the send button */}
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Ionicons
            name="send-sharp"
            size={30}
            color="black"
            style={styles.sendIcon}
          />
        </TouchableOpacity>
      </View>
      <AddGroupMembers
        showModal={showAddMembersModal}
        setShowModal={setShowAddMembersModal}
        groupId={id as string}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242424",
    height: 60,
  },
  backButton: { marginLeft: 5, marginRight: 5 },
  title: { fontFamily: "Light", color: "white", fontSize: 16 },
  groupImage: { height: 50, width: 50, borderRadius: 25, marginRight: 10 },
  groupMembersContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
    marginRight: 5,
  },
  placeholderContainer: {
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 25,
    height: 50,
    width: 50,
    backgroundColor: "#171717",
    justifyContent: "center",
    alignItems: "center",
  },
  messagesContainer: {
    flex: 1,
  },
  input: {
    flex: 1,
    height: 50,
    color: "#fff",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    height: 45,
    alignItems: "center",
    backgroundColor: "#171717",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    borderRadius: 20,
    width: "75%",
    alignSelf: "center",
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  inputButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 10,
    marginRight: 10,
    paddingBottom: 5,
  },
  proofButton: {
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 25,
    backgroundColor: "#171717",
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "space-between",
  },
  sendButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#3ECF8E",
    alignItems: "center",
    alignContent: "center",
  },
  sendIcon: { paddingTop: 4, paddingLeft: 3 },
  cameraIcon: { paddingTop: 2 },
});
