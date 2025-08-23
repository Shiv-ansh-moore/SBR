// EditTaskModal.tsx

import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
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
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "set" && selectedDate) {
      const currentDate = selectedDate;
      if (pickerMode === "date") {
        if (Platform.OS === "android") {
          setDueDate(currentDate);
          setPickerMode("time");
          setShowPicker(true);
        } else {
          setDueDate(currentDate);
        }
      } else {
        const finalDate = dueDate ? new Date(dueDate) : new Date();
        finalDate.setHours(currentDate.getHours());
        finalDate.setMinutes(currentDate.getMinutes());
        setDueDate(finalDate);
      }
    } else {
      setShowPicker(false);
    }
  };

  const showDatePicker = () => {
    setPickerMode("date");
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
            // Call the callback function with the deleted task's ID
            onTaskDeleted(task.id);
            // Then close the modal
            setShowEditModal(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal transparent={true} visible={showEditModal} animationType="fade">
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {showPicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode={Platform.OS === "ios" ? "datetime" : pickerMode}
              is24Hour={true}
              onChange={handleDateChange}
            />
          )}
          <Text style={styles.heading}>Edit Task:</Text>
          <Text style={styles.title}>Title:</Text>
          <TextInput
            style={styles.titleInput}
            autoCapitalize="words"
            value={taskTitle}
            onChangeText={setTaskTitle}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
          <Text style={styles.title}>Description:</Text>
          <TextInput
            style={styles.descriptionInput}
            autoCapitalize="sentences"
            multiline={true}
            value={taskDescription || ""}
            onChangeText={setTaskDescription}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
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
                Due:{" "}
                {dueDate.toLocaleString([], {
                  /* Formatting options */
                })}
              </Text>
              <TouchableOpacity onPress={() => setDueDate(null)}>
                <MaterialCommunityIcons name="delete" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.dueDateText}>Due Date: --------</Text>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={showDatePicker}
              style={[styles.buttons, styles.dueDateButton]}
            >
              <Text style={styles.buttonText}>Due Date</Text>
            </TouchableOpacity>
            {/* THIS IS THE NEW "CLOSE" BUTTON */}
            <TouchableOpacity
              style={[styles.buttons, styles.deleteButton]}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttons, styles.updateButton]}
              onPress={handleUpdateTask}
            >
              <Text style={styles.buttonText}>Update</Text>
            </TouchableOpacity>
          </View>
          {/* THIS IS THE NEW "DELETE" BUTTON */}
          <TouchableOpacity style={styles.closeIcon} onPress={handleDeleteTask}>
            <MaterialCommunityIcons name="delete" size={30} color="red" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
export default EditTaskModal;
const styles = StyleSheet.create({
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
    marginLeft: 10,
    marginTop: 5,
  },
  deleteIcon: {
    marginLeft: 8,
  },
  deleteButton: { backgroundColor: "#D32F2F" },
  updateButton: { backgroundColor: "#3ECF8E" },
  closeIcon: { position: "absolute", top: 10, right: 10 },
});
