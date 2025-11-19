import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as FileSystem from "expo-file-system";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
  taskId?: number;
  groupId?: number;
}

const CameraModal = ({
  setShowCameraModal,
  showCameraModal,
  taskId,
  groupId,
}: CameraModalProps) => {
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [imageUri, setImageUri] = useState<string>();
  const userId = useContext(AuthContext).session?.user.id;
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [groups, setGroups] = useState<Groups[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>();
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState(""); // [NEW]
  const [isCreatingTask, setIsCreatingTask] = useState(false); // [NEW]

  useEffect(() => {
    if (showCameraModal) {
      fetchGroups();
      fetchTasks();
    }
  }, [showCameraModal]);

  useEffect(() => {
    if (imageUri && groupId && groups.length > 0) {
      const groupExists = groups.some((g) => g.id === groupId);
      if (groupExists) {
        // Add the group to selectedGroups if it's not already there
        setSelectedGroups((prevSelected) => {
          if (!prevSelected.includes(groupId)) {
            return [...prevSelected, groupId];
          }
          return prevSelected;
        });
      } else {
        console.warn(
          `groupId ${groupId} provided to CameraModal, but user is not a member.`
        );
      }
    }
  }, [imageUri, groupId, groups]);

  useEffect(() => {
    if (taskId && tasks && tasks.length > 0) {
      const taskToSelect = tasks.find((t) => t.id === taskId);
      if (taskToSelect) {
        setSelectedTask(taskToSelect);
      } else if (tasks.length > 0) {
        console.warn(`Task with id ${taskId} not found in the incomplete task list.`);
      }
    }
  }, [taskId, tasks]);
  
  

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

  const handleRetake = () => {
    setImageUri(undefined);
    setSelectedGroups([]);
    setSelectedTask(null);
    setNewTaskTitle("");
  };

  const toggleGroupSelection = (groupId: number) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectTask = (task: Task) => {
    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
    } else {
      setSelectedTask(task);
      setNewTaskTitle("");
    }
    setShowTaskSelector(false);
  };

  const handleCreateQuickTask = async () => {
    if (!newTaskTitle.trim() || !userId || isCreatingTask) return;

    setIsCreatingTask(true);
    try {
      const { data: newTask, error } = await supabase
        .from("task")
        .insert({
          user_id: userId,
          title: newTaskTitle.trim(),
          completed: false, // Will be marked completed in handleSend
          is_public: true, 
        })
        .select("id, title") // Select fields matching the Task interface
        .single();

      if (error) {
        throw error;
      }

      if (newTask) {
        // Add new task to our local tasks list
        setTasks((prevTasks) => [...(prevTasks || []), newTask]);
        // Set it as the selected task
        setSelectedTask(newTask);
        // Clean up and close modal
        setNewTaskTitle("");
        setShowTaskSelector(false);
      }
    } catch (error: any) {
      Alert.alert("Error", "Could not create task: " + error.message);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleSend = async () => {
    if (!imageUri || !selectedTask || isSending) return;

    setIsSending(true);

    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: "base64",
      });
      const fileExt = imageUri.split(".").pop() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;
      const contentType = `image/${fileExt}`;
      const filePath = `${userId}/${selectedTask.id}/${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("proof-media")
        .upload(filePath, decode(base64), {
          contentType,
        });

      if (uploadError) {
        Alert.alert("Upload Failed", uploadError.message);
        throw uploadError;
      }

      // Insert submission record into the database
      const { data: proofData, error: insertError } = await supabase
        .from("proof_submission")
        .insert({
          task_id: selectedTask.id,
          proof_media: filePath,
          proof_type: "image",
        })
        .select()
        .single();

      if (insertError) {
        Alert.alert("Submission Failed", insertError.message);
        throw insertError;
      }

      const { error: updateTaskError } = await supabase
        .from("task")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", selectedTask.id);
      if (updateTaskError) {
        Alert.alert("Task Update Failed", updateTaskError.message);
        throw updateTaskError;
      }

      // TODO Add proof to selected chats
      if (selectedGroups.length > 0 && userId) {
        for (const groupId of selectedGroups) {
          const { error: chatInsertError } = await supabase
            .from("chat_messages")
            .insert({
              user_id: userId,
              group_id: groupId, // Use the selected ID
              message_type: "proof",
              proof_id: proofData.id,
            });
          
          if (chatInsertError) {
             console.error("Error sending to group", groupId, chatInsertError);
          }
        }
      }
      // Reset state and close modal on success
      handleRetake();
      setShowCameraModal(false);
    } catch (error) {
      console.error("An error occurred during proof submission:", error);
    } finally {
      setIsSending(false);
    }
  };

  // --- RENDER LOGIC ---

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
          <TouchableWithoutFeedback onPress={() => setShowGroupSelector(false)}>
            <View style={styles.selectorContainer}>
              <TouchableWithoutFeedback>
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
                            selectedGroups.includes(item.id)
                              ? "#3ECF8E"
                              : "white"
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
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* --- Task Selector Modal --- */}
        <Modal
          visible={showTaskSelector}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowTaskSelector(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowTaskSelector(false)}>
            <View style={styles.selectorContainer}>
              <TouchableWithoutFeedback>
                <View style={styles.selectorContent}>
                  <Text style={styles.selectorTitle}>Select a Task</Text>
                  <View style={styles.quickTaskContainer}>
                    <TextInput
                      style={styles.quickTaskInput}
                      placeholder="Or create a new task..."
                      placeholderTextColor="#888"
                      value={newTaskTitle}
                      onChangeText={setNewTaskTitle}
                      editable={!isCreatingTask}
                    />
                    <TouchableOpacity
                      style={[
                        styles.quickTaskButton,
                        (!newTaskTitle.trim() || isCreatingTask) &&
                          styles.quickTaskButtonDisabled,
                      ]}
                      onPress={handleCreateQuickTask}
                      disabled={!newTaskTitle.trim() || isCreatingTask}
                    >
                      {isCreatingTask ? (
                        <ActivityIndicator size="small" color="#171717" />
                      ) : (
                        <Text style={styles.quickTaskButtonText}>Add</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.divider} />
                  {/* --- End Quick Task UI --- */}
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
                        <Text style={styles.selectorItemText}>
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <Text style={styles.selectorEmptyText}>
                        No incomplete tasks found.
                      </Text>
                    }
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* --- Image Preview --- */}
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <View style={styles.headerControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                handleRetake();
                setShowCameraModal(false);
              }}
              disabled={isSending}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity
              onPress={handleRetake}
              style={styles.controlButton}
              disabled={isSending}
            >
              <Ionicons name="refresh" size={24} color="white" />
              <Text style={styles.controlButtonText}>Retake</Text>
            </TouchableOpacity>

            <View style={styles.selectionButtonsContainer}>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setShowGroupSelector(true)}
                disabled={isSending}
              >
                <Ionicons name="people" size={20} color="white" />
                <Text style={styles.selectionButtonText}>
                  Groups ({selectedGroups.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setShowTaskSelector(true)}
                disabled={isSending}
              >
                <Ionicons name="checkbox-outline" size={20} color="white" />
                <Text style={styles.selectionButtonText}>
                  {selectedTask
                    ? selectedTask.title.length > 8
                      ? `${selectedTask.title.substring(0, 8)}...`
                      : selectedTask.title
                    : "Task"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSend}
              style={[
                styles.sendButton,
                !selectedTask && { backgroundColor: "#ccc" }, // Grey out if no task selected
              ]}
              disabled={isSending || !selectedTask}
            >
              {isSending ? (
                <ActivityIndicator color="#171717" />
              ) : (
                <Ionicons name="send" size={24} color="#171717" />
              )}
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
    top: 30,
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
    width: 130,
    justifyContent: "center",
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
  quickTaskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  quickTaskInput: {
    flex: 1,
    backgroundColor: "#3a3a3a",
    color: "white",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
    marginRight: 10,
  },
  quickTaskButton: {
    backgroundColor: "#3ECF8E",
    padding: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    height: 44, // Match input height
    minWidth: 50,
  },
  quickTaskButtonDisabled: {
    backgroundColor: "#555",
  },
  quickTaskButtonText: {
    color: "#171717",
    fontWeight: "bold",
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#3a3a3a",
    marginVertical: 10,
  },
});
