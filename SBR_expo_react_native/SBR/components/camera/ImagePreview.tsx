// ImagePreview.tsx
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ImagePreviewProps {
  uri: string;
  onRetake: () => void;
}

const ImagePreview = ({ uri, onRetake }: ImagePreviewProps) => {
  const onUsePicture = () => {};

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.previewImage} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onRetake}>
          <Text style={styles.text}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onUsePicture}>
          <Text style={styles.text}>Use Picture</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "black", // A background color is good for previews
  },
  previewImage: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: "space-around",
  },
  button: {
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});

export default ImagePreview;