import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Modal,
  Platform, // Import Platform
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  // State for showing the picker and its mode ('date' or 'time')
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
  }, [showAddTask]);

  // This function handles the result from the DateTimePicker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Always hide the picker after a choice is made on Android
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    // Check if a date was actually set
    if (event.type === "set" && selectedDate) {
      const currentDate = selectedDate;

      if (pickerMode === "date") {
        // On Android, after picking a date, we immediately show the time picker
        if (Platform.OS === "android") {
          setDueDate(currentDate); // Set the date first
          setPickerMode("time"); // Switch mode to time
          setShowPicker(true); // And show the picker again
        } else {
          // On iOS, 'datetime' mode sets both at once
          setDueDate(currentDate);
        }
      } else {
        // This block runs when the time has been picked on Android
        const finalDate = dueDate ? new Date(dueDate) : new Date();
        finalDate.setHours(currentDate.getHours());
        finalDate.setMinutes(currentDate.getMinutes());
        setDueDate(finalDate);
      }
    } else {
      // Handle cancellation/dismissal
      setShowPicker(false);
    }
  };

  // This function initiates the date picking process
  const showDatePicker = () => {
    setPickerMode("date"); // Always start with the date picker
    setShowPicker(true);
  };

  const addTaskSubmitted = async () => {
    if (userId) {
      if (taskTitle) {
        const { error } = await supabase.from("task").insert({
          user_id: userId,
          // FIX: Use the state variable that holds the picker's selected value
          goal_id: selectedGoalId,
          title: taskTitle,
          description: taskDescription,
          due_date: dueDate?.toISOString(),
          completed: false,
          is_public: isPublic,
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

  return (
    <View>
      <Modal transparent={true} visible={showAddTask} animationType="fade">
        {/* This wrapper View centers the content */}
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {showPicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={dueDate || new Date()}
                // Use 'datetime' for iOS, and the stateful mode for Android
                mode={Platform.OS === "ios" ? "datetime" : pickerMode}
                is24Hour={true}
                onChange={handleDateChange}
              />
            )}
            <Text style={styles.heading}>Add Task:</Text>
            <Text style={styles.title}>Title:</Text>
            <TextInput
              style={styles.titleInput}
              autoCapitalize="words"
              autoFocus={true}
              onChangeText={(title) => setTaskTitle(title)}
              placeholder="Enter task title..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            ></TextInput>
            <Text style={styles.title}>Description:</Text>
            <TextInput
              style={styles.descriptionInput}
              autoCapitalize="sentences"
              multiline={true}
              onChangeText={(description) => setTaskDescription(description)}
              placeholder="Optional: Describe your task..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            ></TextInput>
            <View style={styles.pickerRow}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Text style={styles.title}>Goal:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedGoalId}
                    onValueChange={(itemValue) => setSelectedGoalId(itemValue)}
                    style={styles.picker}
                    dropdownIconColor={"#FFF"}
                  >
                    <Picker.Item label="No Goal" value={null} />
                    {userGoals.map((goal) => (
                      <Picker.Item
                        key={goal.id}
                        label={goal.title}
                        value={goal.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
            <Pressable
              style={styles.checkboxContainer}
              onPress={() => setIsPublic(!isPublic)}
            >
              <Text style={styles.checkboxLabel}>Make Task Public:</Text>
              <Checkbox
                value={isPublic}
                onValueChange={setIsPublic}
                color={isPublic ? "#3ECF8E" : "rgba(77, 61, 61, 0.50)"}
              />
            </Pressable>
            {dueDate ? (
              <View style={styles.dueDateContainer}>
                <Text style={styles.dueDateText}>
                  {/* Use toLocaleString() to display both date and time */}
                  Due:{" "}
                  {dueDate.toLocaleString([], {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <TouchableOpacity onPress={() => setDueDate(null)}>
                  <MaterialCommunityIcons
                    name="delete"
                    size={20}
                    color="red"
                    style={styles.deleteIcon}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <Text
                style={[styles.dueDateText, { marginLeft: 10, marginTop: 5 }]}
              >
                Due Date: --------
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                // This now calls the function to start the date/time picking flow
                onPress={showDatePicker}
                style={[styles.buttons, styles.dueDateButton]}
              >
                <Ionicons
                  name="add-circle"
                  size={18}
                  color="#3ECF8E"
                  style={{ marginRight: 3 }}
                />
                <Text style={[styles.buttonText]}>Due Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttons, styles.closeButton]}
                onPress={() => setShowAddTask(false)}
              >
                <Text style={[styles.buttonText]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttons, styles.addButton]}
                onPress={() => addTaskSubmitted()}
              >
                <Text style={[styles.buttonText]}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default AddTaskModal;
const styles = StyleSheet.create({
  // Styles remain the same
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    height: 390,
    width: "95%",
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 5,
  },
  heading: {
    fontSize: 24,
    fontFamily: "SemiBold",
    color: "white",
    marginLeft: 5,
  },
  title: {
    fontSize: 18,
    fontFamily: "Regular",
    color: "white",
    marginLeft: 5,
    marginTop: 2,
  },
  titleInput: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 10,
    color: "white",
    fontFamily: "Light",
    textAlignVertical: "top",
    marginLeft: 10,
    marginRight: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerContainer: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
  },
  picker: {
    color: "white",
    width: "100%",
  },
  descriptionInput: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 10,
    color: "white",
    fontFamily: "Light",
    height: 70,
    textAlignVertical: "top",
    marginLeft: 10,
    marginRight: 10,
    padding: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginLeft: 10,
    marginRight: 15,
  },
  checkboxLabel: {
    fontFamily: "ExtraLight",
    color: "white",
    marginRight: 5,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttons: {
    height: 30,
    width: 110,
    borderRadius: 15,
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Regular",
    textAlign: "center",
  },
  dueDateButton: {
    flexDirection: "row",
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    alignItems: "center",
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    marginTop: 5,
  },
  dueDateText: {
    fontFamily: "ExtraLight",
    color: "white",
  },
  deleteIcon: {
    marginLeft: 8,
  },
  closeButton: { backgroundColor: "#D32F2F" },
  addButton: { backgroundColor: "#3ECF8E" },
});
