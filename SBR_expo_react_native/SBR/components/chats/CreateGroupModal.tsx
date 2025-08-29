// src/components/CreateGroupModal.tsx

import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { decode } from "base64-arraybuffer";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import GroupImagePicker, { NewImageData } from "./GroupImagePicker"; // Import the new component

interface CreateGroupModalProps {
  showAddGroup: boolean;
  setShowAddGroup: Dispatch<SetStateAction<boolean>>;
}

const CreateGroupModal = ({
  showAddGroup,
  setShowAddGroup,
}: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState<string>("");
  const [groupImageData, setGroupImageData] = useState<NewImageData | null>(
    null
  ); // State for the image
  const [isCreating, setIsCreating] = useState(false); // Loading state
  const context = useContext(AuthContext);

  const resetForm = () => {
    setGroupName("");
    setGroupImageData(null);
    setIsCreating(false);
  };

  const addGroupSubmitted = async () => {
    if (!groupName.trim()) {
      Alert.alert("Validation Error", "Group name is required.");
      return;
    }
    if (!context.session?.user.id) {
      Alert.alert(
        "Authentication Error",
        "You must be logged in to create a group."
      );
      return;
    }

    setIsCreating(true);

    try {
      let groupAvatarPath: string | undefined = undefined;

      // 1. Upload image if one was selected
      if (groupImageData) {
        const fileExt = groupImageData.mimeType.split("/").pop();
        const filePath = `${
          context.session.user.id
        }-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("group-pics")
          .upload(filePath, decode(groupImageData.base64), {
            contentType: groupImageData.mimeType,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get the public URL to store in the database
        const { data: urlData } = supabase.storage
          .from("group-pics")
          .getPublicUrl(filePath);

        groupAvatarPath = urlData.publicUrl;
      }

      // 2. Insert group data into the 'groups' table
      const { error: insertError } = await supabase.from("groups").insert({
        name: groupName.trim(),
        created_by: context.session.user.id,
        group_pic : groupAvatarPath
      });

      if (insertError) throw insertError;

      Alert.alert("Success", "Group created successfully!");
      handleClose();
    } catch (error: any) {
      console.error("Error creating group:", error.message);
      Alert.alert("Error", "Failed to create group. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setShowAddGroup(false);
  };

  return (
    <Modal transparent={true} visible={showAddGroup} animationType="fade">
      <Pressable style={styles.centeredView} onPress={handleClose}>
        <Pressable style={styles.modalView}>
          <Text style={styles.heading}>Create Group</Text>
          {/* Group Image Picker Component */}
          <GroupImagePicker onImageSelected={setGroupImageData} />
          {/* Group Name Input */}
          <Text style={styles.title}>Name:</Text>
          <TextInput
            style={styles.titleInput}
            value={groupName}
            autoCapitalize="words"
            autoFocus={true}
            onChangeText={setGroupName}
            placeholder="Enter group name..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            editable={!isCreating}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.buttons, styles.closeButton]}
              onPress={handleClose}
              disabled={isCreating}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttons, styles.addButton]}
              onPress={addGroupSubmitted}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Create Group</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CreateGroupModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    minHeight: 300, // Increased height to accommodate the image picker
    width: "95%",
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 15,
  },
  heading: {
    fontSize: 24,
    fontFamily: "SemiBold",
    color: "white",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: "Regular",
    color: "white",
    marginTop: 5,
    marginBottom: 5,
  },
  titleInput: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 10,
    color: "white",
    fontFamily: "Light",
    height: 45,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 10, // Added margin
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: "auto",
    paddingTop: 20,
    justifyContent: "space-between",
  },
  buttons: {
    height: 45, // Increased height
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Regular",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#D32F2F",
    marginRight: 10,
    opacity: 0.9,
  },
  addButton: {
    backgroundColor: "#3ECF8E",
    marginLeft: 10,
    opacity: 0.9,
  },
});
