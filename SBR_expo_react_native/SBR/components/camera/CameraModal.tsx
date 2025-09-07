import { Ionicons } from "@expo/vector-icons";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    // TODO: Open a preview of the image
    console.log("Photo URI:", photo?.uri);
    // For now, let's close the camera after taking a picture
    setShowCameraModal(false);
  };

  // --- Renders a loading state ---
  if (!permission) {
    return <View />;
  }

  // --- Renders the permission request screen ---
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Renders the Camera UI ---
  // --- Renders the Camera UI ---
  return (
    <Modal visible={showCameraModal} animationType="slide" transparent={false}>
      <View style={styles.modalContainer}>
        {/* This new container holds the camera and the overlayed controls */}
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={camera}
            flash={flash}
          />
          <View style={styles.headerControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCameraModal(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* The bottom controls remain unchanged */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={toggleFlash} style={styles.controlButton}>
            <Ionicons
              name={flash === "on" ? "flash" : "flash-off"}
              size={24}
              color={flash === "on" ? "#3ECF8E" : "white"}
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
      </View>
    </Modal>
  );
};

export default CameraModal;

// --- New styles inspired by PersonalTasks.tsx ---
const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#171717", // Match app background
  },
  message: {
    textAlign: "center",
    paddingBottom: 20,
    color: "white", // Match app text color
    fontSize: 18,
    fontFamily: "Light", // Match app font
  },
  permissionButton: {
    backgroundColor: "#3ECF8E", // Accent color
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "SemiBold", // Match app font
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#171717", // Match app background
  },
  cameraContainer: {
    flex: 1, // This makes the container take up the available space
  },
  camera: {
    flex: 1,
  },
  headerControls: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  closeButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#242424", // Match button background
    justifyContent: "center",
    alignItems: "center",
    borderColor: "rgba(77, 61, 61, 0.50)", // Match border color
    borderWidth: 1,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: "#171717",
  },
  controlButton: {
    backgroundColor: "#242424", // Match taskProofButton style
    width: 55,
    height: 55,
    borderRadius: 27.5,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
  },
  takePictureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#3ECF8E",
  },
  takePictureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#3ECF8E",
  },
});
