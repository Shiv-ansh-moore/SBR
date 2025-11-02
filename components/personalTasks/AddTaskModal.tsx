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

      if (pickerMode === "time") {
        // On Android, after picking a date, we immediately show the time picker
        if (Platform.OS === "android") {
          setDueDate(currentDate); // Set the date first
          setPickerMode("date"); // Switch mode to time
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

  const showDatePicker = () => {
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
          description: taskDescription,
          due_date: dueDate?.toISOString(),
          completed: false,
          is_public: isPublic,
        });
        setShowAddTask(false);
        setDueDate(null);
        setSelectedGoalId(null);
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
              <AntDesign name="closecircleo" size={22} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <TextInput
                placeholder="Title"
                placeholderTextColor="#FFFFFF"
                style={styles.titleInput}
                autoFocus={true}
              />
              <View style={styles.titleLine} />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.inputButtons, styles.buttons]}>
                <Text style={styles.buttonText}>No Goal</Text>
                <Octicons name="triangle-down" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputButtons, styles.buttons, styles.dateButton]}
              >
                <View style={styles.dateContainer}>
                  <Text style={styles.timeText}>--:--</Text>
                  <Text style={styles.dateText}>--/--/--</Text>
                </View>
                <Ionicons name="add-circle" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.inputButtons, styles.buttons]}>
                <Text style={styles.buttonText}>Description</Text>
                <Ionicons name="add-circle" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addTaskButton, styles.buttons]}>
                <Text style={styles.buttonText}>Add Task</Text>
                <AntDesign name="checkcircle" size={21} color="white" />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    height: 190,
    width: 360,
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
    width: 320,
    height: 1,
    backgroundColor: "#D9D9D9",
    alignSelf: "center", // centers both input and line horizontally
  },
  buttons: {
    width: 150,
    height: 40,
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
});
