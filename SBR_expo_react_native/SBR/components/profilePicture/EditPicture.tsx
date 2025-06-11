import { Dispatch, SetStateAction, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CameraModal from "../camera/CameraModal";

interface EditPictureProps {
  setIsMenuVisible: Dispatch<SetStateAction<boolean>>; // Correct type
}

const EditPicture = ({ setIsMenuVisible }: EditPictureProps) => {
  const [showCamera, setShowCamera] = useState(false);

  const onUsePicture = (uri: string) => {
    console.log(uri);
  };

  return (
    <View>
      {showCamera && <CameraModal setShowCamera={setShowCamera} onUsePicture={onUsePicture} />}
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
