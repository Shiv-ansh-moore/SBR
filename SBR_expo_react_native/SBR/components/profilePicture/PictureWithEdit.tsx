import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import Picture from "./Picture"; // Assuming Picture.js defines a component with its own size

export default function PictureWithEdit() {
  return (
    // Add 'styles.container' to this View
    <View style={styles.container}>
      <Picture />
      <TouchableOpacity>
        {/* The existing styles.editImage will now work as intended
            because its positioning context (styles.container) is sized
            to the Picture component. */}
        <Image
          source={require("../../assets/images/profilePic/edit.png")}
          style={styles.editImage}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // This is the crucial style:
    // It makes this View only as wide as the <Picture /> component.
    // 'position: "relative"' is the default for View, which is necessary
    // for the absolute positioning of 'editImage' to be relative to this container.
    alignSelf: "flex-start",

  },
  editImage: {
    width: 40,
    height: 40,
    position: "absolute",
    bottom: 0,
    right: 0, // This will now be 0px from the right edge of 'container',
    // which matches the right edge of <Picture />.
  },
});
