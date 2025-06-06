import { Dispatch, SetStateAction } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EditPictureProps {
  setIsMenuVisible: Dispatch<SetStateAction<boolean>>; // Correct type
}

const EditPicture = ({ setIsMenuVisible }: EditPictureProps) => {
  return (
    <View>
      <TouchableOpacity>
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
