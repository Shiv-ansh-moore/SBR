import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { decode } from "base64-arraybuffer";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
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
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AntDesign from "@expo/vector-icons/AntDesign";

interface GroupSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: number;
  currentName: string;
  currentPic: string | null;
  onGroupUpdated: (newName: string, newPic: string | null) => void;
}

interface NewImageData {
  base64: string;
  mimeType: string;
}

const GroupSettingsModal = ({
  visible,
  onClose,
  groupId,
  currentName,
  currentPic,
  onGroupUpdated,
}: GroupSettingsModalProps) => {
  const { session } = useContext(AuthContext);
  const router = useRouter();

  const [name, setName] = useState<string>(currentName);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageData, setImageData] = useState<NewImageData | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(currentName);
      setImageUri(currentPic);
      setImageData(null);
    }
  }, [visible, currentName, currentPic]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.uri && asset.base64 && asset.mimeType) {
        setImageUri(asset.uri);
        setImageData({ base64: asset.base64, mimeType: asset.mimeType });
      } else {
        Alert.alert("Error", "Could not read the selected image data.");
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Group name is required.");
      return;
    }
    setIsUploading(true);

    try {
      let finalAvatarUrl = currentPic;

      if (imageData) {
        const fileExt = imageData.mimeType.split("/").pop();
        const filePath = `group-${groupId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("group-pics")
          .upload(filePath, decode(imageData.base64), {
            contentType: imageData.mimeType,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("group-pics")
          .getPublicUrl(filePath);

        finalAvatarUrl = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("groups")
        .update({
          name: name.trim(),
          group_pic: finalAvatarUrl,
        })
        .eq("id", groupId);

      if (updateError) throw updateError;

      onGroupUpdated(name.trim(), finalAvatarUrl);
      Alert.alert("Success", "Group updated successfully.");
      onClose();
    } catch (error: any) {
      console.error("Group update failed:", error);
      Alert.alert("Error", "Failed to update group.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure? You won't receive messages anymore.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            if (!session?.user) return;
            setIsUploading(true);
            try {
              const { error } = await supabase
                .from("chat_members")
                .delete()
                .match({ group_id: groupId, user_id: session.user.id });

              if (error) throw error;

              onClose();
              router.replace("/(tabs)/(chats)");
            } catch (error) {
              Alert.alert("Error", "Could not leave group.");
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Outer Pressable closes modal when clicking background */}
      <Pressable style={styles.centeredView} onPress={onClose}>
        {/* Inner Pressable prevents closing when clicking the modal content */}
        <Pressable
          style={styles.modalView}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header: Title on Left, Close Icon on Right */}
          <View style={styles.header}>
            <Text style={styles.heading}>Group Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <AntDesign name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Image Section */}
          <View style={styles.profilePicContainer}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.profilePicPreview}
              />
            ) : (
              <View style={[styles.profilePicPreview, styles.placeholder]}>
                <FontAwesome name="group" size={40} color="#555" />
              </View>
            )}

            <TouchableOpacity
              style={styles.changePicButton}
              onPress={pickImage}
              disabled={isUploading}
            >
              <Text style={styles.changePicButtonText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Input Section */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Group Name:</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter group name"
              placeholderTextColor="#666"
              editable={!isUploading}
            />
          </View>

          {/* Cancel / Save Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isUploading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Leave Group Button */}
          <TouchableOpacity
            style={styles.leaveGroupButton}
            onPress={handleLeaveGroup}
            disabled={isUploading}
          >
            <Text style={styles.leaveGroupText}>Leave Group</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default GroupSettingsModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalView: {
    width: "90%",
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  // Updated Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Pushes Title to left, X to right
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  heading: {
    fontSize: 22,
    color: "white",
    fontFamily: "SemiBold",
  },
  closeIcon: {
    padding: 5,
  },
  profilePicContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  profilePicPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  changePicButton: {
    marginTop: 12,
    backgroundColor: "#242424",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  changePicButtonText: {
    color: "#3ECF8E",
    fontSize: 14,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "white",
    marginLeft: 5,
    marginBottom: 8,
    fontFamily: "Regular",
  },
  input: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 15,
    color: "white",
    padding: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15,
  },
  button: {
    height: 50,
    width: "48%",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "SemiBold",
  },
  cancelButton: {
    backgroundColor: "#444",
  },
  saveButton: {
    backgroundColor: "#3ECF8E",
  },
  leaveGroupButton: {
    width: "100%",
    height: 50,
    borderRadius: 15,
    backgroundColor: "rgba(211, 47, 47, 0.15)",
    borderWidth: 1,
    borderColor: "#D32F2F",
    justifyContent: "center",
    alignItems: "center",
  },
  leaveGroupText: {
    color: "#D32F2F",
    fontSize: 16,
    fontFamily: "SemiBold",
  },
});