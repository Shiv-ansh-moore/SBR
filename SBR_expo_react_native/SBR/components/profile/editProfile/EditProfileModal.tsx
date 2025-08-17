import ProfilePicture from "@/components/profile/ProfilePicture";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface EditProfileModalProps {
  showEditProfile: boolean;
  setShowEditProfile: Dispatch<SetStateAction<boolean>>;
}

const EditProfileModal = ({
  showEditProfile,
  setShowEditProfile,
}: EditProfileModalProps) => {
  // State for the text inputs
  const [nickname, setNickname] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const context = useContext(AuthContext);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    console.log(result.assets[0].mimeType);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    uploadProfileNewPic(result);
  };

  const uploadProfileNewPic = async (
    imageUri: ImagePicker.ImagePickerResult
  ) => {
    if (!context.session?.user.id || !imageUri.assets) {
      return;
    }

    const image = imageUri.assets[0];
    if (!image.base64 || !image.mimeType) {
      console.error("Image picker did not return base64 or mimeType");
      return;
    }

    // 1. Get the file extension for the filename
    const fileExt = image.mimeType.split("/").pop();

    // 2. Create the full file path for Supabase Storage
    const filePath = `${context.session.user.id}.${fileExt}`;

    // 3. Use the full, original mimeType for the contentType option
    const contentType = image.mimeType;

    // Now, upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("profilepic")
      .upload(filePath, decode(image.base64), {
        contentType: contentType, // CORRECT: Pass 'image/jpeg'
        upsert: true,
      });

    if (uploadError) {
      console.log("Error uploading new profile picture:", uploadError);
    } else {
      console.log("Successfully uploaded picture:", uploadData);
      // TODO: Add logic here to update the user's profile in your 'users' table
      // with the path to their new picture.
    }
  };

  return (
    <View>
      <Modal transparent={true} visible={showEditProfile} animationType="fade">
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.heading}>Edit Profile</Text>

            {/* Profile Picture and Change Button */}
            <View style={styles.profilePicContainer}>
              <ProfilePicture width={100} height={100} />
              <TouchableOpacity
                style={styles.changePicButton}
                onPress={pickImage}
              >
                <Text style={styles.changePicButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Nickname and Username Inputs */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nickname:</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="words"
                onChangeText={setNickname}
                // value={nickname} // You can bind this to the current nickname
              />
              <Text style={styles.label}>Username:</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                onChangeText={setUsername}
                // value={username} // You can bind this to the current username
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowEditProfile(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                // Add your save logic here
              >
                <Text style={styles.buttonText}>Save</Text>
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
    fontFamily: "SemiBold",
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
    fontFamily: "Regular",
    fontSize: 14,
  },
  inputContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 18,
    fontFamily: "Regular",
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
    fontFamily: "Light",
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
    fontFamily: "Regular",
  },
  cancelButton: {
    backgroundColor: "red",
  },
  saveButton: {
    backgroundColor: "#3ECF8E",
  },
});
