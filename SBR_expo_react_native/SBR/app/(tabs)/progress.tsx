import CameraModal from "@/components/camera/CameraModal";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
const progress = () => {
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      <CameraModal
        setShowCameraModal={setShowCameraModal}
        showCameraModal={showCameraModal}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});
export default progress;
