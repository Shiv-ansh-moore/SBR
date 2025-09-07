import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Task {
  id: number;
  title: string;
}

interface Groups {
  created_at: string;
  created_by: string | null;
  group_pic: string | null;
  id: number;
  name: string;
}

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
  const userId = useContext(AuthContext).session?.user.id;
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [groups, setGroups] = useState<Groups[]>([]);

  // New state for selections and modal visibility
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showTaskSelector, setShowTaskSelector] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    if (userId) {
      const { data, error } = await supabase
        .from("task")
        .select("id, title")
        .eq("user_id", userId)
        .eq("completed", false);
      setTasks(data);
    }
  };

  const fetchGroups = async () => {
    if (userId) {
      const { data, error } = await supabase
        .from("chat_members")
        .select("groups(*)")
        .eq("user_id", userId);
      if (data) {
        const extractedGroups = data
          .map((item) => item.groups)
          .filter((group): group is Groups => group !== null);
        setGroups(extractedGroups);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const takePicture = async () => {
    if (!camera.current) return;
    const photo = await camera.current.takePictureAsync();
    if (photo?.uri) {
      setImageUri(photo.uri);
    }
  };

  // --- New Handler Functions ---

  const handleRetake = () => {
    setImageUri(undefined);
    setSelectedGroups([]);
    setSelectedTask(null);
  };

  const toggleGroupSelection = (groupId: number) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskSelector(false);
  };

  const handleSend = async () => {
    if (!imageUri) return;

    console.log("Sending Picture:", imageUri);
    console.log("To Groups:", selectedGroups);
    console.log("Associated with Task:", selectedTask?.id);

    // TODO: Implement the actual upload and database logic here.
    // 1. Upload the image file (imageUri) to Supabase Storage.
    // 2. If successful, get the public URL.
    // 3. Insert records into your database (e.g., a 'messages' table).
    //    For each selected group, you might insert a message linking the user, image, and task.

    alert("Image sent! (See console for details)");
    setShowCameraModal(false);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal
        visible={showCameraModal}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            We need your permission to use the camera.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButtonPermission}
            onPress={() => setShowCameraModal(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (imageUri) {
    return (
      <Modal visible={showCameraModal} animationType="slide">
        {/* --- Group Selector Modal --- */}
        <Modal
          visible={showGroupSelector}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowGroupSelector(false)}
        >
          <View style={styles.selectorContainer}>
            <View style={styles.selectorContent}>
              <Text style={styles.selectorTitle}>Select Groups</Text>
              <FlatList
                data={groups}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.selectorItem}
                    onPress={() => toggleGroupSelection(item.id)}
                  >
                    <Ionicons
                      name={
                        selectedGroups.includes(item.id)
                          ? "checkbox"
                          : "square-outline"
                      }
                      size={24}
                      color={
                        selectedGroups.includes(item.id) ? "#3ECF8E" : "white"
                      }
                    />
                    <Text style={styles.selectorItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.selectorDoneButton}
                onPress={() => setShowGroupSelector(false)}
              >
                <Text style={styles.permissionButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* --- Task Selector Modal --- */}
        <Modal
          visible={showTaskSelector}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowTaskSelector(false)}
        >
          <View style={styles.selectorContainer}>
            <View style={styles.selectorContent}>
              <Text style={styles.selectorTitle}>Select a Task</Text>
              <FlatList
                data={tasks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.selectorItem}
                    onPress={() => handleSelectTask(item)}
                  >
                    <Ionicons
                      name={
                        selectedTask?.id === item.id
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={24}
                      color={
                        selectedTask?.id === item.id ? "#3ECF8E" : "white"
                      }
                    />
                    <Text style={styles.selectorItemText}>{item.title}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.selectorEmptyText}>
                    No incomplete tasks found.
                  </Text>
                }
              />
            </View>
          </View>
        </Modal>

        {/* --- Image Preview --- */}
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <View style={styles.headerControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCameraModal(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity onPress={handleRetake} style={styles.controlButton}>
              <Ionicons name="refresh" size={24} color="white" />
              <Text style={styles.controlButtonText}>Retake</Text>
            </TouchableOpacity>

            <View style={styles.selectionButtonsContainer}>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setShowGroupSelector(true)}
              >
                <Ionicons name="people" size={20} color="white" />
                <Text style={styles.selectionButtonText}>
                  Groups ({selectedGroups.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setShowTaskSelector(true)}
              >
                <Ionicons name="checkbox-outline" size={20} color="white" />
                <Text style={styles.selectionButtonText}>
                  {selectedTask ? "Task ✓" : "Task"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <Ionicons name="send" size={24} color="#171717" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={showCameraModal} animationType="slide" transparent={false}>
      <View style={styles.modalContainer}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={camera}
            flash={flash}
            mirror={true}
            animateShutter={false}
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

        <View style={styles.bottomControls}>
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

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    backgroundColor: "#171717",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#3ECF8E",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: "#171717",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButtonPermission: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#242424",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#171717",
  },
  cameraContainer: {
    flex: 1,
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
    backgroundColor: "rgba(23, 23, 23, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: "#171717",
    height: 140,
  },
  controlButton: {
    backgroundColor: "#242424",
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
  previewContainer: {
    flex: 1,
    backgroundColor: "#171717",
  },
  previewImage: {
    flex: 1,
  },
  // --- New Styles ---
  controlButtonText: {
    color: "white",
    fontSize: 10,
    marginTop: 4,
  },
  selectionButtonsContainer: {
    alignItems: "center",
    gap: 10,
  },
  selectionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242424",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
  },
  selectionButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "600",
  },
  sendButton: {
    backgroundColor: "#3ECF8E",
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: "center",
    alignItems: "center",
  },
  selectorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  selectorContent: {
    backgroundColor: "#242424",
    width: "85%",
    maxHeight: "70%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  selectorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a3a",
  },
  selectorItemText: {
    color: "white",
    fontSize: 16,
    marginLeft: 15,
  },
  selectorDoneButton: {
    backgroundColor: "#3ECF8E",
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    alignItems: "center",
  },
  selectorEmptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
});