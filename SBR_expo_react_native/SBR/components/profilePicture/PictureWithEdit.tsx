import { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import EditPicture from "./EditPicture";
import Picture from "./Picture"; // Assuming Picture.js defines a component with its own size

export default function PictureWithEdit() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isPic, setIsPic] = useState(true);

  return (
    // Add 'styles.container' to this View
    <View style={styles.container}>
      <Picture isPic={isPic} />
      <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
        <Image
          source={require("../../assets/images/profilePic/edit.png")}
          style={styles.editImage}
        />
      </TouchableOpacity>
      {isMenuVisible && (
        <EditPicture setIsMenuVisible={setIsMenuVisible} setIsPic={setIsPic} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
  },
  editImage: {
    width: 40,
    height: 40,
    position: "absolute",
    bottom: 0,
    right: 0,
    zIndex: 2,
  },
});
