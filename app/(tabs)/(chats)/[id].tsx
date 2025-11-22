import AddGroupMembers from "@/components/chats/messages/AddGroupMembers";
import MessageView from "@/components/chats/messages/MessageView";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useContext, useState, useCallback, useEffect } from "react";
import CameraModal from "@/components/camera/CameraModal";
// IMPORT THE NEW COMPONENT
import GroupSettingsModal from "@/components/chats/GroupSettingsModal"; 
import {
  Alert,
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
  const { session } = useContext(AuthContext);
  
  // --- NEW STATE FOR GROUP SETTINGS ---
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false); // NEW
  
  const groupId = parseInt(id as string);
  
  // Store name/pic in local state so we can update the UI immediately after edit
  const [currentGroupName, setCurrentGroupName] = useState(name as string);
  const [currentGroupPic, setCurrentGroupPic] = useState<string | null>(pic as string);

  const [message, setMessage] = useState("");

  // Ensure local state syncs if params change (unlikely but good practice)
  useEffect(() => {
      if(name) setCurrentGroupName(name as string);
      if(pic) setCurrentGroupPic(pic as string);
  }, [name, pic]);

  const markAsRead = useCallback(async () => {
    if (!session?.user || !groupId) return;
    const { error } = await supabase
      .from("chat_members")
      .update({ last_read: new Date().toISOString() })
      .match({ user_id: session.user.id, group_id: groupId });

    if (error) console.error("Error marking as read:", error);
  }, [session?.user, groupId]);

  useFocusEffect(
    useCallback(() => {
      markAsRead();
    }, [markAsRead])
  );

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!session?.user || !id) return;

    const messageData = {
      user_id: session.user.id,
      group_id: groupId,
      message_type: "text",
      message_content: { text: message.trim() },
    };

    const { error } = await supabase.from("chat_messages").insert(messageData);

    if (error) {
      Alert.alert("Error", "Failed to send message.");
    } else {
      setMessage("");
    }
  };

  // --- NEW: Handler for when the group is updated in the modal ---
  const handleGroupUpdate = (newName: string, newPic: string | null) => {
    setCurrentGroupName(newName);
    setCurrentGroupPic(newPic);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 35}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>

        {/* --- UPDATED: Wrap Image and Text in TouchableOpacity to open Settings --- */}
        <TouchableOpacity 
            style={styles.headerInfoContainer} 
            onPress={() => setShowSettingsModal(true)}
        >
            {currentGroupPic ? (
            <Image style={styles.groupImage} source={currentGroupPic} />
            ) : (
            <View style={[styles.groupImage, styles.placeholderContainer]}>
                <FontAwesome name="group" size={24} color="white" />
            </View>
            )}

            <Text style={styles.title}>{currentGroupName}</Text>
        </TouchableOpacity>
        {/* ----------------------------------------------------------------------- */}

        <TouchableOpacity
          style={styles.groupMembersContainer}
          onPress={() => setShowAddMembersModal(true)}
        >
          <FontAwesome name="group" size={25} color="#3ECF8E" />
        </TouchableOpacity>
      </View>

      <View style={styles.messagesContainer}>
        <MessageView groupId={groupId} />
      </View>

      <View style={styles.inputButtonContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#999"
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
        </View>
        <TouchableOpacity
          style={styles.proofButton}
          onPress={() => setShowCameraModal(true)}
        >
          <Entypo name="camera" size={30} color="#3ECF8E" style={styles.cameraIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Ionicons name="send-sharp" size={30} color="black" style={styles.sendIcon} />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <AddGroupMembers
        showModal={showAddMembersModal}
        setShowModal={setShowAddMembersModal}
        groupId={id as string}
      />
      <CameraModal
        setShowCameraModal={setShowCameraModal}
        showCameraModal={showCameraModal}
        taskId={undefined}
        groupId={groupId}
      />
      
      {/* --- NEW: Settings Modal --- */}
      <GroupSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        groupId={groupId}
        currentName={currentGroupName}
        currentPic={currentGroupPic}
        onGroupUpdated={handleGroupUpdate}
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
  
  // New style for the clickable header area
  headerInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1, // Takes up remaining space so user can click anywhere on name/pic
  },
  
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