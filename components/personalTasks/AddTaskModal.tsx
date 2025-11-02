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
// <<< MODIFIED: Import DateTimePicker
import DateTimePicker from "@react-native-community/datetimepicker";

interface TaskFormModalProps {
  setShowAddTask: Dispatch<SetStateAction<boolean>>;
  showAddTask: boolean;
  goalId?: number | null; // Optional: To associate the task with a goal
}
interface UserGoal {
  id: number;
  title: string;
}

const AddTaskModal = ({
  setShowAddTask,
  showAddTask,
  goalId = null,
}: TaskFormModalProps) => {
  const context = useContext(AuthContext);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [taskTitle, setTaskTitle] = useState<string | null>();
  const [taskDescription, setTaskDescription] = useState<string | null>();
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const userId = context.session?.user.id;
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(
    goalId || null
  );

  const [showGoalPicker, setShowGoalPicker] = useState<boolean>(false);

  // <<< START: New state for the description modal
  const [showDescriptionModal, setShowDescriptionModal] =
    useState<boolean>(false);
  // <<< END: New state

  useEffect(() => {
    const fetchUserGoals = async () => {
      if (userId) {
        const { data, error } = await supabase
          .from("goals")
          .select("id, title")
          .eq("user_id", userId);

        if (error) {
          console.log("Error fetching goals:", error);
        } else if (data) {
          setUserGoals(data);
        }
      }
    };

    fetchUserGoals();
  }, [userId]);

  // Reset local state when modal is opened or closed
  useEffect(() => {
    if (showAddTask) {
      // When modal opens, reset to defaults or passed-in goalId
      setSelectedGoalId(goalId || null);
      setTaskTitle(null);
      setDueDate(null);
      setTaskDescription(null); // <<< Also resets description
    }
  }, [showAddTask, goalId]);

 const handleDateChange = (event: any, selectedDate?: Date) => {
        // Get the selected date, or fallback to the existing dueDate
        const currentDate = selectedDate || dueDate;

        // Hide picker immediately after a choice or dismissal (especially for Android)
        setShowPicker(false); 

        if (event.type === "set" && currentDate) {
            // User confirmed a selection
            if (pickerMode === "time") {
                // 1. They just set the TIME. Now, set the state
                // and show the DATE picker next.
                setDueDate(currentDate);
                setPickerMode("date");
                setShowPicker(true); // Re-open for DATE
            } else {
                // 2. They just set the DATE. This is the final step.
                setDueDate(currentDate);
                // Picker is already hidden, we are done.
            }
        }
        // If event.type is 'dismissed' (cancel), picker is already hidden, so do nothing.
    };

    // ---
    // ⬇️ MODIFIED: showDatePicker now starts with "time"
    // ---
    const showDatePicker = () => {
        // Start the process by showing the TIME picker first
        setPickerMode("time"); 
        setShowPicker(true);
    };

  const addTaskSubmitted = async () => {
    if (userId) {
      if (taskTitle) {
        const { error } = await supabase.from("task").insert({
          user_id: userId,
          goal_id: selectedGoalId,
          title: taskTitle,
          description: taskDescription, // <<< This was already here and correct
          due_date: dueDate?.toISOString(),
          completed: false,
          is_public: true,
        });
        setShowAddTask(false);
        if (error) {
          console.log("Error adding task:", error.message);
          alert("Failed to add task.");
        }
      } else {
        alert("Title is required");
      }
    }
  };

  const selectedGoal = userGoals.find((g) => g.id === selectedGoalId);

  return (
    <View>
      <Modal transparent={true} visible={showAddTask} animationType="fade">
        <Pressable
          style={styles.centeredView}
          onPress={() => setShowAddTask(false)} // closes when clicking outside
        >
          <Pressable
            style={styles.mainView}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddTask(false)}
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
              {/* <<< START: Updated Description Button */}
              <TouchableOpacity
                style={[styles.inputButtons, styles.buttons]}
                onPress={() => setShowDescriptionModal(true)} // <<< Show description modal
              >
                <Text style={styles.buttonText} numberOfLines={1}>
                  {taskDescription
                    ? "Edit Description"
                    : "Add Description"}
                </Text>
                <Ionicons
                  name={taskDescription ? "pencil" : "add-circle"} // <<< Dynamic icon
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
              {/* <<< END: Updated Description Button */}

              <TouchableOpacity
                style={[styles.addTaskButton, styles.buttons]}
                onPress={addTaskSubmitted}
              >
                <Text style={styles.buttonText}>Add Task</Text>
                <AntDesign name="checkcircle" size={21} color="white" />
              </TouchableOpacity>
            </View>
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
        {/* Use KeyboardAvoidingView for better behavior when keyboard shows */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredView}
        >
          <Pressable
            style={styles.centeredView} // Fullscreen pressable to close
            onPress={() => setShowDescriptionModal(false)}
          >
            <Pressable
              style={styles.descriptionContainer} // Modal content
              onPress={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <Text style={styles.descriptionTitle}>Task Description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Add more details..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline={true}
                value={taskDescription || ""}
                onChangeText={setTaskDescription} // <<< Update state directly
                autoFocus={true} // <<< Open keyboard immediately
              />
              <TouchableOpacity
                style={styles.descriptionDoneButton}
                onPress={() => setShowDescriptionModal(false)} // <<< Just close the modal
              >
                <Text style={styles.descriptionDoneText}>Done</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      {/* <<< END: DESCRIPTION MODAL */}

      {/* <<< MODIFIED: Uncommented and activated DateTimePicker */}
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
export default AddTaskModal;
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
    height: 210,
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
    alignSelf: "center", // centers both input and line horizontally
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
  addTaskButton: { backgroundColor: "#3ECF8E" },
  buttonText: {
    fontFamily: "Regular",
    color: "white",
    fontSize: 16,
    marginLeft: 0,
    maxWidth: "80%", // <<< Ensure long goal titles don't overflow
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

  // <<< STYLES FOR GOAL PICKER
  pickerContainer: {
    width: 300,
    maxHeight: 400,
    backgroundColor: "#242424", // Match button color
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

  // <<< START: NEW STYLES FOR DESCRIPTION MODAL
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
    minHeight: 150, // Give space for multiple lines
    backgroundColor: "#171717",
    borderRadius: 8,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 10,
    color: "white",
    fontFamily: "Regular",
    fontSize: 16,
    textAlignVertical: "top", // For Android multiline
    marginBottom: 15,
  },
  descriptionDoneButton: {
    backgroundColor: "#3ECF8E", // Match "Add Task" button
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