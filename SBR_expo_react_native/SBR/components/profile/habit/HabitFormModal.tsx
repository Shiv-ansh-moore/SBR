import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";

// Define a simple type for the goals we fetch
interface UserGoal {
  id: number;
  title: string;
}

interface HabitFormModalProps {
  setShowAddHabit: Dispatch<SetStateAction<boolean>>;
  showAddHabit: boolean;
  goalId?: number; // Optional prop to pre-select a goal
}

const HabitFormModal = ({
  setShowAddHabit,
  showAddHabit,
  goalId,
}: HabitFormModalProps) => {
  const context = useContext(AuthContext);
  const userId = context.session?.user.id;

  const [habitTitle, setHabitTitle] = useState<string>("");
  const [habitDescription, setHabitDescription] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(
    goalId || null,
  );
  const [frequency, setFrequency] = useState<string>("Daily");
  const [dueTimes, setDueTimes] = useState<string[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);

  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // Fetch user's goals to populate the picker
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

  const resetForm = () => {
    setHabitTitle("");
    setHabitDescription(null);
    setSelectedGoalId(goalId || null);
    setFrequency("Daily");
    setDueTimes([]);
  };

  // Submission
  const addHabitSubmitted = async () => {
    if (userId) {
      if (habitTitle) {
        const { error } = await supabase.from("habits").insert({
          user_id: userId,
          title: habitTitle,
          description: habitDescription,
          goal_id: selectedGoalId,
          frequency: frequency,
          due_times: dueTimes.length > 0 ? dueTimes : null, // Store as JSONB
        });

        if (error) {
          alert("Error: Could not add habit.");
          console.log(error);
        } else {
          resetForm();
          setShowAddHabit(false);
        }
      } else {
        alert("Title is required.");
      }
    }
  };

  return (
    <View>
      <Modal transparent={true} visible={showAddHabit} animationType="fade">
        <Pressable
          style={styles.centeredView}
          onPress={() => setShowAddHabit(false)} // Close modal on overlay press
        >
          <Pressable style={styles.modalView}>
            {showTimePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={new Date()}
                mode={"time"}
                is24Hour={true}
                onChange={onTimeSelected}
              />
            )}

            <Text style={styles.heading}>Add Habit:</Text>
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

            {/* Goal & Frequency Pickers */}
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
                  </Picker>
                </View>
              </View>
            </View>

            {/* Due Times Display */}
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
                onPress={() => setShowAddHabit(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttons, styles.addButton]}
                onPress={addHabitSubmitted}
              >
                <Text style={styles.buttonText}>Add Habit</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
export default HabitFormModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    minHeight: 460,
    width: "95%",
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 10, // Added padding
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
    textAlignVertical: "top",
  },
  descriptionInput: {
backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    color: "white",
    fontFamily: "Light",
    height: 100,
    textAlignVertical: "top",
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
    marginTop: "auto", // Pushes buttons to the bottom
    justifyContent: "space-between",
  },
  buttons: {
    height: 35, // Slightly larger buttons
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