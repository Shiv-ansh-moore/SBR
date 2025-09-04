import AddGroupMembers from "@/components/chats/messages/AddGroupMembers";
import MessageView from "@/components/chats/messages/MessageView";
import TextMessageSentByMember from "@/components/chats/messages/TextMessageSentByMember";
import TextMessageSentByYou from "@/components/chats/messages/TextMessageSentByYou";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react"; // 1. Import useState
import {
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
  // 3. Add state to manage the modal's visibility
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

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
          <Image style={styles.groupImage} source={pic} />
        ) : (
          <View style={[styles.groupImage, styles.placeholderContainer]}>
            <FontAwesome name="group" size={24} color="white" />
          </View>
        )}

        <Text style={styles.title}>{name}</Text>
        {/* 4. Add the onPress event to open the modal */}
        <TouchableOpacity
          style={styles.groupMembersContainer}
          onPress={() => setShowAddMembersModal(true)}
        >
          <FontAwesome name="group" size={25} color="#3ECF8E" />
        </TouchableOpacity>
      </View>
      <View style={styles.messagesContainer}>
        <MessageView groupId={parseInt(id as string)}/>
      </View>
      <View style={styles.inputButtonContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder=""
            placeholderTextColor="#999"
            style={styles.input}
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
        <TouchableOpacity style={styles.sendButton}>
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
