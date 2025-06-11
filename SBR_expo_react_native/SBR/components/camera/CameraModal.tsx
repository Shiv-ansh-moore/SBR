import { useState } from "react";
import { Modal, StyleSheet } from "react-native";
import Camera from "./Camera";
import ImagePreview from "./ImagePreview";

interface CameraModalProps {
  setShowCamera: (show: boolean) => void;
  onUsePicture: (uri: string) => void;
}

const CameraModal = ({ setShowCamera, onUsePicture }: CameraModalProps) => {
  const [uri, setUri] = useState<string | null>(null);

  return (
    <Modal animationType="slide">
      {uri ? (
        <ImagePreview
          uri={uri}
          onRetake={() => setUri(null)}
          onUsePicture={onUsePicture}
        />
      ) : (
        <Camera setShowCamera={setShowCamera} setUri={setUri} />
      )}
    </Modal>
  );
};
export default CameraModal;
const styles = StyleSheet.create({});
