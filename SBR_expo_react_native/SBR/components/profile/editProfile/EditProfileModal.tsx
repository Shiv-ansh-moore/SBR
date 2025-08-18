import { AuthContext } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useState,
  useEffect,
} from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";

interface EditProfileModalProps {
  showEditProfile: boolean;
  setShowEditProfile: Dispatch<SetStateAction<boolean>>;
}

interface NewImageData {
  base64: string;
  mimeType: string;
}

const EditProfileModal = ({
  showEditProfile,
  setShowEditProfile,
}: EditProfileModalProps) => {
  const context = useContext(AuthContext);

  const [nickname, setNickname] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageData, setImageData] = useState<NewImageData | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!context.session?.user.id) return;

      const { data, error } = await supabase
        .from("users")
        .select("username, nickname")
        .eq("id", context.session.user.id)
        .single();

      if (error) {
        Alert.alert("Error", "Could not load your profile data.");
        console.error("Error fetching user data:", error);
      } else if (data) {
        setNickname(data.nickname || "");
        setUsername(data.username || "");
      }
    };

    if (showEditProfile) {
      fetchUserData();
    }
  }, [showEditProfile, context.session]);

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
    if (!context.session?.user.id) return;
    setIsUploading(true);

    try {
      let profilePicPath: string | undefined = undefined;

      if (imageData) {
        const fileExt = imageData.mimeType.split("/").pop();
        const filePath = `${
          context.session.user.id
        }-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("profilepic")
          .upload(filePath, decode(imageData.base64), {
            contentType: imageData.mimeType,
            upsert: true,
          });

        if (uploadError) throw uploadError;
        profilePicPath = filePath;
      }

      const updates: {
        nickname?: string;
        username?: string;
        profile_pic?: string;
      } = {};
      if (nickname.trim()) updates.nickname = nickname.trim();
      if (username.trim()) updates.username = username.trim();
      if (profilePicPath) updates.profile_pic = profilePicPath;

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("users")
          .update(updates)
          .eq("id", context.session.user.id);

        if (updateError) throw updateError;

        // *** KEY CHANGE IS HERE ***
        // After a successful update, tell the AuthProvider to refetch the profile data.
        await context.refreshProfile();
      }

      closeModal();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      Alert.alert(
        "Save Error",
        error.message || "Failed to save profile changes."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setImageUri(null);
    setImageData(null);
    setNickname("");
    setUsername("");
    setShowEditProfile(false);
  };

  return (
    <View>
      <Modal transparent={true} visible={showEditProfile} animationType="fade">
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.heading}>Edit Profile</Text>
            <View style={styles.profilePicContainer}>
              <Image
                source={imageUri || context.profilePicLink}
                style={styles.profilePicPreview}
              />
              <TouchableOpacity
                style={styles.changePicButton}
                onPress={pickImage}
                disabled={isUploading}
              >
                <Text style={styles.changePicButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nickname:</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="Enter new nickname"
                editable={!isUploading}
              />
              <Text style={styles.label}>Username:</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter new username"
                editable={!isUploading}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={closeModal}
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
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EditProfileModal;

const styles = StyleSheet.create({
  profilePicPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    height: 500,
    width: "95%",
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
    // fontFamily: "SemiBold",
    color: "white",
    alignSelf: "flex-start",
    marginLeft: 5,
    marginBottom: 10,
  },
  profilePicContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  changePicButton: {
    marginTop: 10,
    backgroundColor: "#242424",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  changePicButtonText: {
    color: "#3ECF8E",
    // fontFamily: "Regular",
    fontSize: 14,
  },
  inputContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 18,
    // fontFamily: "Regular",
    color: "white",
    marginLeft: 5,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    color: "white",
    // fontFamily: "Light",
    padding: 10,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 15,
    justifyContent: "space-between",
    width: "95%",
  },
  button: {
    height: 35,
    width: 150,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    // fontFamily: "Regular",
  },
  cancelButton: {
    backgroundColor: "red",
  },
  saveButton: {
    backgroundColor: "#3ECF8E",
  },
});