// Camera.tsx
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ImagePreview from "./ImagePreview"; // Import the new component

interface CameraProps {
  setShowCamera?: (show: boolean) => void;
}

const Camera = ({ setShowCamera }: CameraProps) => {
  const [facing, setFacing] = useState<CameraType>("front");
  const [permission, requestPermission] = useCameraPermissions();
  const [uri, setUri] = useState<string | null>(null);
  const camera = useRef<CameraView>(null);

  if (!permission) {
    return <View />; // Permissions still loading
  }

  if (!permission.granted) {
    // Permissions not granted yet
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    const photo = await camera.current?.takePictureAsync();
    setUri(photo?.uri || null);
  };

  // If a picture has been taken, show the preview
  if (uri) {
    return (
      <ImagePreview
        uri={uri}
        onRetake={() => setUri(null)}
      />
    );
  }

  // Otherwise, show the camera
  return (
    <CameraView
      style={styles.camera}
      facing={facing}
      ref={camera}
      mirror={true}
    >
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={takePicture}>
          <Text style={styles.text}>Take Picture</Text>
        </TouchableOpacity>
        {setShowCamera && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.text}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    </CameraView>
  );
};

// Add your original styles here, removing styles only used by the preview
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
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
    justifyContent: "space-between",
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

export default Camera;
