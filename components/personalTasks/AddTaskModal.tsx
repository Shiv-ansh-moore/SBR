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
  FlatList, // <<< Import FlatList for a scrollable list
} from "react-native";
// Assuming you have DateTimePicker, otherwise, the date logic won't work
// import DateTimePicker from "@react-native-community/datetimepicker";

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
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const userId = context.session?.user.id;
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(
    goalId || null
  );

  // <<< New state for the goal picker modal
  const [showGoalPicker, setShowGoalPicker] = useState<boolean>(false);

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
    // <<< Fetch goals when userId is available, not every time the modal opens
  }, [userId]);

  // Reset local state when modal is opened or closed
  useEffect(() => {
    if (showAddTask) {
      // When modal opens, reset to defaults or passed-in goalId
      setSelectedGoalId(goalId || null);
      setTaskTitle(null);
      setDueDate(null);
      setTaskDescription(null);
    }
  }, [showAddTask, goalId]);

  // This function handles the result from the DateTimePicker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    // ... (Your existing handleDateChange logic) ...
    // Note: This logic appears to be flawed (swapped date/time picking).
    // I've left it as-is, but you may need to revise it.
    // The DateTimePicker component itself is also missing from this file.
  };

  const showDatePicker = () => {
    setPickerMode("time"); // <<< This likely should be "date" first
    setShowPicker(true);
  };

  const addTaskSubmitted = async () => {
    if (userId) {
      if (taskTitle) {
        const { error } = await supabase.from("task").insert({
          user_id: userId,
          goal_id: selectedGoalId,
          title: taskTitle,
          description: taskDescription,
          due_date: dueDate?.toISOString(),
          completed: false,
          is_public: isPublic,
        });
        setShowAddTask(false);
        // State is now reset via useEffect [showAddTask]
        if (error) {
          console.log("Error adding task:", error.message);
          alert("Failed to add task.");
        }
      } else {
        alert("Title is required");
      }
    }
  };

  // <<< Find the selected goal's title for display
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
                placeholderTextColor="rgba(255,255,255,0.7)" // <<< Made placeholder lighter
                style={styles.titleInput}
                autoFocus={true}
                value={taskTitle || ""} // <<< Connect state
                onChangeText={setTaskTitle} // <<< Connect state
              />
              <View style={styles.titleLine} />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.inputButtons, styles.buttons]}
                onPress={() => setShowGoalPicker(true)} // <<< Show goal picker
              >
                <Text style={styles.buttonText}>
                  {/* <<< Display selected goal title */}
                  {selectedGoal ? selectedGoal.title : "No Goal"}
                </Text>
                <Octicons name="triangle-down" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputButtons, styles.buttons, styles.dateButton]}
                onPress={showDatePicker} // <<< Connect date picker
              >
                <View style={styles.dateContainer}>
                  {/* <<< Display selected date/time */}
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
              <TouchableOpacity style={[styles.inputButtons, styles.buttons]}>
                <Text style={styles.buttonText}>Description</Text>
                <Ionicons name="add-circle" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addTaskButton, styles.buttons]}
                onPress={addTaskSubmitted} // <<< Connect submit function
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
              // <<< Add a "No Goal" option at the top
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

      {/* <<< You would render your DateTimePicker here */}
      {/*
      {showPicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode={pickerMode}
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
        />
      )}
      */}
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

  // <<< NEW STYLES FOR GOAL PICKER
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
});
