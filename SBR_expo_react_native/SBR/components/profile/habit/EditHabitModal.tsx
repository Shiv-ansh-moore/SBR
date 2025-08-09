import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
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
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Type for goals fetched for the picker
interface UserGoal {
  id: number;
  title: string;
}

interface EditHabitModalProps {
  setShowEditHabit: Dispatch<SetStateAction<boolean>>;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  showEditHabit: boolean;
  habitId: number | null;
}

const EditHabitModal = ({
  setShowEditHabit,
  showEditHabit,
  habitId,
  setEditMode,
}: EditHabitModalProps) => {
  const context = useContext(AuthContext);
  const userId = context.session?.user.id;

  // State for form fields, matching the habit schema
  const [habitTitle, setHabitTitle] = useState<string>("");
  const [habitDescription, setHabitDescription] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<string>("Daily");
  const [dueTimes, setDueTimes] = useState<string[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // 1. Fetch data when the component mounts or habitId changes
  useEffect(() => {
    // Fetches the specific habit to be edited
    const getHabitInfo = async () => {
      if (habitId) {
        const { data, error } = await supabase
          .from("habits")
          .select("*")
          .eq("id", habitId)
          .single();

        if (error) {
          Alert.alert("Error", "Could not fetch habit details.");
          console.error("Error fetching habit:", error);
        } else if (data) {
          // 2. Populate state with the fetched data
          setHabitTitle(data.title);
          setHabitDescription(data.description);
          setSelectedGoalId(data.goal_id);
          setFrequency(data.frequency || "Daily");
          setDueTimes((data.due_times as string[]) || []);
        }
      }
    };

    // Fetches all user goals for the dropdown picker
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

    if (showEditHabit) {
      getHabitInfo();
      fetchUserGoals();
    }
  }, [habitId, showEditHabit, userId]); // Re-run when modal is shown

  // 3. Handle the form submission to UPDATE the habit
  const handleEditHabit = async () => {
    if (!habitId) {
      Alert.alert("Error", "No habit selected.");
      return;
    }
    if (!habitTitle || habitTitle.trim() === "") {
      Alert.alert("Title Required", "Please enter a title for your habit.");
      return;
    }

    const { error } = await supabase
      .from("habits")
      .update({
        title: habitTitle,
        description: habitDescription,
        goal_id: selectedGoalId,
        frequency: frequency,
        due_times: dueTimes.length > 0 ? dueTimes : null,
      })
      .eq("id", habitId);

    if (error) {
      Alert.alert("Error", "Could not update the habit.");
      console.error("Error updating habit:", error);
    } else {
      setEditMode(false); // Turn off edit mode on the parent component
      setShowEditHabit(false); // Close modal on success
    }
  };

  // --- UI Helper Functions (copied from HabitFormModal) ---
  const onTimeSelected = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const timeString = selectedDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      if (!dueTimes.includes(timeString)) {
        setDueTimes([...dueTimes, timeString].sort());
      }
    }
  };

  const removeDueTime = (timeToRemove: string) => {
    setDueTimes(dueTimes.filter((time) => time !== timeToRemove));
  };

  const handleCancel = () => {
    setShowEditHabit(false);
    setEditMode(false);
  };

  return (
    <View>
      <Modal transparent={true} visible={showEditHabit} animationType="fade">
        <Pressable style={styles.centeredView} onPress={handleCancel}>
          <Pressable style={styles.modalView}>
            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode={"time"}
                is24Hour={true}
                onChange={onTimeSelected}
              />
            )}

            <Text style={styles.heading}>Edit Habit:</Text>
            <Text style={styles.title}>Title:</Text>
            <TextInput
              style={styles.titleInput}
              autoCapitalize="words"
              autoFocus={true}
              value={habitTitle}
              onChangeText={setHabitTitle}
            />

            <Text style={styles.title}>Description:</Text>
            <TextInput
              style={styles.descriptionInput}
              autoCapitalize="sentences"
              multiline={true}
              value={habitDescription || ""}
              onChangeText={setHabitDescription}
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

              <View style={{ flex: 1, marginLeft: 5 }}>
                <Text style={styles.title}>Frequency:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={frequency}
                    onValueChange={(itemValue) => setFrequency(itemValue)}
                    style={styles.picker}
                    dropdownIconColor={"#FFF"}
                  >
                    <Picker.Item label="Daily" value="Daily" />
                    <Picker.Item label="Weekly" value="Weekly" />
                    <Picker.Item label="Monthly" value="Monthly" />
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.dueTimesContainer}>
              <Text style={styles.title}>Due Times:</Text>
              <View style={styles.dueTimesList}>
                {dueTimes.length > 0 ? (
                  dueTimes.map((time) => (
                    <View key={time} style={styles.dueTimeItem}>
                      <Text style={styles.dueDateText}>{time}</Text>
                      <TouchableOpacity onPress={() => removeDueTime(time)}>
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={20}
                          color="red"
                          style={styles.deleteIcon}
                        />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.dueDateText, { marginLeft: 5 }]}>
                    None
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={[styles.buttons, styles.dueDateButton]}
              >
                <Ionicons
                  name="add-circle"
                  size={18}
                  color="#3ECF8E"
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.buttonText}>Add Time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttons, styles.closeButton]}
                onPress={handleCancel}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttons, styles.addButton]}
                onPress={handleEditHabit}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
export default EditHabitModal;

// Styles are copied from your HabitFormModal for consistency
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    minHeight: 480, // Using minHeight for flexibility
    width: "95%",
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 10,
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
    marginTop: 5,
  },
  titleInput: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    color: "white",
    fontFamily: "Light",
    paddingHorizontal: 15,
    height: 40,
  },
  descriptionInput: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    color: "white",
    fontFamily: "Light",
    height: 70,
    textAlignVertical: "top",
    padding: 15,
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
  dueTimesContainer: {
    marginTop: 5,
  },
  dueTimesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  dueTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242424",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 4,
  },
  dueDateText: {
    fontFamily: "ExtraLight",
    color: "white",
  },
  deleteIcon: {
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: "auto",
    justifyContent: "space-between",
  },
  buttons: {
    height: 35,
    width: 110,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
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
  },
  closeButton: { backgroundColor: "red" },
  addButton: { backgroundColor: "#3ECF8E" },
});
