// EditTaskModal.tsx

import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import Octicons from "@expo/vector-icons/Octicons";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Alert, // Keep Alert for the delete confirmation
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// Interface for the full task object
interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  is_public: boolean;
  goal_id: number | null;
  completed: boolean;
}

interface EditTaskModalProps {
  setShowEditModal: Dispatch<SetStateAction<boolean>>;
  showEditModal: boolean;
  task: Task | null;
  onTaskDeleted: (taskId: number) => void;
}

interface UserGoal {
  id: number;
  title: string;
}

const EditTaskModal = ({
  setShowEditModal,
  showEditModal,
  task,
  onTaskDeleted,
}: EditTaskModalProps) => {
  const context = useContext(AuthContext);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const userId = context.session?.user.id;
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  // <<< START: State for new Modals
  const [showGoalPicker, setShowGoalPicker] = useState<boolean>(false);
  const [showDescriptionModal, setShowDescriptionModal] =
    useState<boolean>(false);
  // <<< END: State for new Modals

  // Effect to populate the form when a task is passed in
  useEffect(() => {
    if (task) {
      setTaskTitle(task.title);
      setTaskDescription(task.description);
      setDueDate(task.due_date ? new Date(task.due_date) : null);
      setIsPublic(task.is_public);
      setSelectedGoalId(task.goal_id);
    }
  }, [task]);

  // Fetch user goals when the modal becomes visible
  useEffect(() => {
    const fetchUserGoals = async () => {
      if (userId) {
        const { data, error } = await supabase
          .from("goals")
          .select("id, title")
          .eq("user_id", userId);
        if (error) console.log("Error fetching goals:", error);
        else if (data) setUserGoals(data);
      }
    };
    if (showEditModal) fetchUserGoals();
  }, [showEditModal, userId]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowPicker(false);

    if (event.type === "set" && currentDate) {
      if (pickerMode === "time") {
        setDueDate(currentDate);
        setPickerMode("date");
        setShowPicker(true);
      } else {
        setDueDate(currentDate);
      }
    }
  };

  const showDatePicker = () => {
    setPickerMode("time");
    setShowPicker(true);
  };

  const handleUpdateTask = async () => {
    if (!task) return alert("No task selected.");
    if (taskTitle) {
      const { error } = await supabase
        .from("task")
        .update({
          goal_id: selectedGoalId,
          title: taskTitle,
          description: taskDescription,
          due_date: dueDate?.toISOString(),
          is_public: isPublic,
        })
        .eq("id", task.id);
      if (error) alert("Failed to update task.");
      else {
        setShowEditModal(false);
      }
    } else {
      alert("Title is required");
    }
  };

  const handleDeleteTask = () => {
    if (!task) return alert("No task selected.");

    Alert.alert("Delete Task", "Are you sure? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("task")
            .delete()
            .eq("id", task.id);
          if (error) {
            alert("Failed to delete task.");
          } else {
            onTaskDeleted(task.id);
            setShowEditModal(false);
          }
        },
      },
    ]);
  };

  // Find the goal title for display
  const selectedGoal = userGoals.find((g) => g.id === selectedGoalId);

  return (
    <View>
      <Modal
        transparent={true}
        visible={showEditModal} // <<< Use showEditModal
        animationType="fade"
      >
        <Pressable
          style={styles.centeredView}
          onPress={() => setShowEditModal(false)} // <<< Use setShowEditModal
        >
          <Pressable
            style={styles.mainView}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEditModal(false)} // <<< Use setShowEditModal
            >
              <AntDesign
                name="closecircleo"
                size={22}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <TextInput
                placeholder="Title"
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={styles.titleInput}
                autoFocus={true}
                value={taskTitle || ""}
                onChangeText={setTaskTitle}
              />
              <View style={styles.titleLine} />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.inputButtons, styles.buttons]}
                onPress={() => setShowGoalPicker(true)}
              >
                <Text style={styles.buttonText} numberOfLines={1}>
                  {selectedGoal ? selectedGoal.title : "No Goal"}
                </Text>
                <Octicons name="triangle-down" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputButtons, styles.buttons, styles.dateButton]}
                onPress={showDatePicker}
              >
                <View style={styles.dateContainer}>
                  <Text style={styles.timeText}>
                    {dueDate
                      ? dueDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </Text>
                  <Text style={styles.dateText}>
                    {dueDate ? dueDate.toLocaleDateString() : "--/--/--"}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.inputButtons, styles.buttons]}
                onPress={() => setShowDescriptionModal(true)}
              >
                <Text style={styles.buttonText} numberOfLines={1}>
                  {taskDescription
                    ? "Edit Description"
                    : "Add Description"}
                </Text>
                <Ionicons
                  name={taskDescription ? "pencil" : "add-circle"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              {/* <<< START: MODIFIED "DELETE" BUTTON */}
              <TouchableOpacity
                style={[styles.deleteTaskButton, styles.buttons]} // <<< Use delete style
                onPress={handleDeleteTask} // <<< Call delete function
              >
                <Text style={styles.buttonText}>Delete</Text>
                <AntDesign name="delete" size={21} color="white" />
              </TouchableOpacity>
              {/* <<< END: MODIFIED "DELETE" BUTTON */}
            </View>

            {/* <<< START: NEW "UPDATE" BUTTON */}
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdateTask}
            >
              <Text style={styles.updateButtonText}>Update Task</Text>
            </TouchableOpacity>
            {/* <<< END: NEW "UPDATE" BUTTON */}
          </Pressable>
        </Pressable>
      </Modal>

      {/* <<< START: GOAL PICKER MODAL */}
      <Modal
        transparent={true}
        visible={showGoalPicker}
        animationType="fade"
        onRequestClose={() => setShowGoalPicker(false)}
      >
        <Pressable
          style={styles.centeredView}
          onPress={() => setShowGoalPicker(false)}
        >
          <Pressable
            style={styles.pickerContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <FlatList
              data={userGoals}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedGoalId(item.id);
                    setShowGoalPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.title}</Text>
                </TouchableOpacity>
              )}
              ListHeaderComponent={
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedGoalId(null);
                    setShowGoalPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>No Goal</Text>
                </TouchableOpacity>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
      {/* <<< END: GOAL PICKER MODAL */}

      {/* <<< START: DESCRIPTION MODAL */}
      <Modal
        transparent={true}
        visible={showDescriptionModal}
        animationType="fade"
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredView}
        >
          <Pressable
            style={styles.centeredView}
            onPress={() => setShowDescriptionModal(false)}
          >
            <Pressable
              style={styles.descriptionContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.descriptionTitle}>Task Description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Add more details..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline={true}
                value={taskDescription || ""}
                onChangeText={setTaskDescription}
                autoFocus={true}
              />
              <TouchableOpacity
                style={styles.descriptionDoneButton}
                onPress={() => setShowDescriptionModal(false)}
              >
                <Text style={styles.descriptionDoneText}>Done</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      {/* <<< END: DESCRIPTION MODAL */}

      {/* DateTimePicker */}
      {showPicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode={pickerMode}
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};
export default EditTaskModal;

// --- STYLES (Copied from AddTaskModal and modified) ---
const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    top: 7,
    right: 17,
    zIndex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  mainView: {
    height: 285, // <<< MODIFIED: Increased height for new button
    width: 380,
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
  },
  titleInput: {
    fontSize: 20,
    fontFamily: "Regular",
    color: "#FFFFFF",
    paddingVertical: 0,
    height: 30,
    marginLeft: 17,
  },
  titleLine: {
    width: 340,
    height: 1,
    backgroundColor: "#D9D9D9",
    alignSelf: "center",
  },
  buttons: {
    width: 170,
    height: 50,
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  inputButtons: { backgroundColor: "#242424" },
  // <<< MODIFIED: Renamed addTaskButton to deleteTaskButton and changed color
  deleteTaskButton: { backgroundColor: "#E53E3E" }, // Red color for delete
  buttonText: {
    fontFamily: "Regular",
    color: "white",
    fontSize: 16,
    marginLeft: 0,
    maxWidth: "80%",
  },
  dateButton: {},
  dateContainer: { justifyContent: "center", alignItems: "center" },
  timeText: { color: "white", fontFamily: "Regular", fontSize: 16 },
  dateText: { color: "white", fontFamily: "Medium", fontSize: 10 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 15,
  },
  titleContainer: {
    marginTop: 15,
  },

  // <<< NEW: Styles for the full-width update button
  updateButton: {
    backgroundColor: "#3ECF8E", // Green color for update/confirm
    width: 340, // Match title line width
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 10, // Space above it
  },
  updateButtonText: {
    fontFamily: "Regular",
    color: "white",
    fontSize: 18,
  },
  // <<< END: New button styles

  // STYLES FOR GOAL PICKER
  pickerContainer: {
    width: 300,
    maxHeight: 400,
    backgroundColor: "#242424",
    borderRadius: 10,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  pickerItemText: {
    color: "white",
    fontFamily: "Regular",
    fontSize: 16,
  },

  // STYLES FOR DESCRIPTION MODAL
  descriptionContainer: {
    width: 350,
    backgroundColor: "#242424",
    borderRadius: 10,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 20,
  },
  descriptionTitle: {
    color: "white",
    fontFamily: "Regular",
    fontSize: 18,
    marginBottom: 15,
  },
  descriptionInput: {
    minHeight: 150,
    backgroundColor: "#171717",
    borderRadius: 8,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 10,
    color: "white",
    fontFamily: "Regular",
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 15,
  },
  descriptionDoneButton: {
    backgroundColor: "#3ECF8E",
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  descriptionDoneText: {
    color: "white",
    fontFamily: "Regular",
    fontSize: 16,
  },
});