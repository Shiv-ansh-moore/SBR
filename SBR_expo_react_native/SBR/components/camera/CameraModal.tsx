import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { Button, Modal, StyleSheet, Text, View } from "react-native";
const camera = useRef<CameraView>(null);

interface CameraModalProps {
  setShowCameraModal: Dispatch<SetStateAction<boolean>>;
  showCameraModal: boolean;
}
const CameraModal = ({
  setShowCameraModal,
  showCameraModal,
}: CameraModalProps) => {
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
    const photo = await camera.current?.takePictureAsync();
    setImageUri(photo?.uri);
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
    <Modal visible={showCameraModal}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={camera}
      ></CameraView>
      <View></View>
    </Modal>
  );
};
export default CameraModal;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: { flex: 1 },
});
