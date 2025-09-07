import { Ionicons } from "@expo/vector-icons";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import {
  Button,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// No hooks here

interface CameraModalProps {
  setShowCameraModal: Dispatch<SetStateAction<boolean>>;
  showCameraModal: boolean;
}

const CameraModal = ({
  setShowCameraModal,
  showCameraModal,
}: CameraModalProps) => {
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [imageUri, setImageUri] = useState<string>();

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const takePicture = async () => {
    if (!camera.current) return;
    const photo = await camera.current.takePictureAsync();
    setImageUri(photo?.uri);
    //TODO Open a preview of Image
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  return (
    <Modal visible={showCameraModal} animationType="slide">
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={camera}
          flash={flash}
        />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowCameraModal(false)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={toggleFlash} style={styles.controlButton}>
          <Ionicons
            name={flash === "on" ? "flash" : "flash-off"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={takePicture}
          style={styles.takePictureButtonOuter}
        >
          <View style={styles.takePictureButtonInner} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleCameraFacing}
          style={styles.controlButton}
        >
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default CameraModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "black",
  },

  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#121212",
    paddingBottom: 40,
    paddingTop: 20,
  },
  controlButton: {
    padding: 10,
  },

  takePictureButtonOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  takePictureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
});
