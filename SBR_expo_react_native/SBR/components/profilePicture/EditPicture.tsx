import { decode } from "base64-arraybuffer";
import { EncodingType, readAsStringAsync } from "expo-file-system";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabaseClient";
import { AuthContext } from "../../providers/AuthProvider";
import CameraModal from "../camera/CameraModal";

interface EditPictureProps {
  setIsMenuVisible: Dispatch<SetStateAction<boolean>>;
  setIsPic: Dispatch<SetStateAction<boolean>>; // Correct type
}

const EditPicture = ({ setIsMenuVisible, setIsPic}: EditPictureProps) => {
  const [showCamera, setShowCamera] = useState(false);
  const context = useContext(AuthContext);

  const onUsePicture = async (uri: string) => {
    setIsPic(false)
    setShowCamera(false)
    if (context.session?.user.id) {
      // Uploads file
      // * Might refactor to use helper function instead
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });
      const fileExtenstion = uri.split(".").pop();
      console.log(fileExtenstion);
      const filePath = `${context.session.user.id}.${fileExtenstion}`;
      const contentType = `image/${fileExtenstion}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profilepic")
        .upload(filePath, decode(base64), { contentType, upsert: true });
      if (uploadError) {
        console.log("Error uploading new profile picture:", uploadError);
      }
      // Updates database
      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_pic: filePath })
        .eq("id", context.session.user.id);
    }
    setIsPic(true)
  };

  return (
    <View>
      {showCamera && (
        <CameraModal
          setShowCamera={setShowCamera}
          onUsePicture={onUsePicture}
        />
      )}
      <TouchableOpacity onPress={() => setShowCamera(true)}>
        <Text>Camera</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Text>Gallery</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsMenuVisible(false)}>
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
  );
};
export default EditPicture;
const styles = StyleSheet.create({});
