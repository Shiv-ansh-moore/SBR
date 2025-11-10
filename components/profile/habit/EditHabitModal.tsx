import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface EditHabitModalProps {
  setShowEditHabit: Dispatch<SetStateAction<boolean>>;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  showEditHabit: boolean;
  habitId: number | null;
}
interface UserGoal {
  id: number;
  title: string;
}

// Day labels for text and picker
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper function to format the day button text
const formatSelectedDays = (days: number[]): string => {
  if (days.length === 0) return "Add Days";
  if (days.length === 7) return "Every Day";
  if (days.length === 5 && days.join(",") === "1,2,3,4,5") return "Weekdays";
  if (days.length === 2 && days.join(",") === "0,6") return "Weekends";

  return days.map((d) => DAY_MAP[d]).join(", ");
};

const EditHabitModal = ({
  setShowEditHabit,
  showEditHabit,
  habitId,
  setEditMode,
}: EditHabitModalProps) => {
  const context = useContext(AuthContext);
  const userId = context.session?.user.id;

  // Form State
  const [habitTitle, setHabitTitle] = useState<string>(""); // Use string, not null
  const [habitDescription, setHabitDescription] = useState<string | null>();
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  // Goal Picker State
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [showGoalPicker, setShowGoalPicker] = useState<boolean>(false);

  // Description Modal State
  const [showDescriptionModal, setShowDescriptionModal] =
    useState<boolean>(false);

  // Day Picker Modal State
  const [showDayPickerModal, setShowDayPickerModal] = useState<boolean>(false);

  // Time Picker State
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // 1. Fetch user's goals for the goal picker (runs once)
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

  // 2. Fetch the specific habit's data when the modal is opened
  useEffect(() => {
    const getHabitInfo = async () => {
      if (habitId) {
        const { data, error } = await supabase
          .from("habits")
          .select("title, description, goal_id, days_of_week, due_time")
          .eq("id", habitId)
          .single();

        if (error) {
          Alert.alert("Error", "Could not fetch habit details.");
          console.error("Error fetching habit:", error);
        } else if (data) {
          // Populate state with the fetched data
          setHabitTitle(data.title);
          setHabitDescription(data.description);
          setSelectedGoalId(data.goal_id);
          setSelectedDays((data.days_of_week as number[]) || []);
          // Convert ISO string back to Date object for the picker
          setDueTime(data.due_time ? new Date(data.due_time) : null);
        }
      }
    };

    if (showEditHabit) {
      getHabitInfo();
    }
  }, [habitId, showEditHabit]); // Re-run when modal is shown

  // --- Handlers ---

  const handleEditHabit = async () => {
    if (!habitId) {
      Alert.alert("Error", "No habit ID found to update.");
      return;
    }
    if (!habitTitle || habitTitle.trim() === "") {
      alert("Title is required");
      return;
    }

    const { error } = await supabase
      .from("habits")
      .update({
        title: habitTitle,
        description: habitDescription,
        goal_id: selectedGoalId,
        days_of_week: selectedDays,
        due_time: dueTime?.toISOString(),
      })
      .eq("id", habitId);

    if (error) {
      console.log("Error updating habit:", error.message);
      alert("Failed to update habit.");
    } else {
      handleClose(); // Close modal on success
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (event.type === "set" && selectedDate) {
      setDueTime(selectedDate);
    }
  };

  const showTimePickerModal = () => {
    setShowTimePicker(true);
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prevDays) =>
      prevDays.includes(dayIndex)
        ? prevDays.filter((d) => d !== dayIndex).sort((a, b) => a - b)
        : [...prevDays, dayIndex].sort((a, b) => a - b),
    );
  };

  // Close modal and reset parent's edit state
  const handleClose = () => {
    setShowEditHabit(false);
    setEditMode(false);
  };

  const selectedGoal = userGoals.find((g) => g.id === selectedGoalId);

  return (
    <View>
      {/* --- MAIN HABIT EDIT MODAL --- */}
      <Modal transparent={true} visible={showEditHabit} animationType="fade">
        <Pressable style={styles.centeredView} onPress={handleClose}>
          <Pressable
            style={styles.mainView}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <AntDesign
                name="closecircleo"
                size={22}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <TextInput
                placeholder="Habit Title"
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={styles.titleInput}
                autoFocus={true}
                value={habitTitle || ""}
                onChangeText={setHabitTitle}
              />
              <View style={styles.titleLine} />
            </View>

            {/* --- Row 1: Goal & Time --- */}
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
                style={[styles.inputButtons, styles.buttons]}
                onPress={showTimePickerModal}
              >
                <Text style={styles.buttonText}>
                  {dueTime
                    ? dueTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Due Time"}
                </Text>
                <Ionicons name="add-circle" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* --- Row 2: Description & Days --- */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.inputButtons, styles.buttons]}
                onPress={() => setShowDescriptionModal(true)}
              >
                <Text style={styles.buttonText} numberOfLines={1}>
                  {habitDescription
                    ? "Edit Description"
                    : "Add Description"}
                </Text>
                <Ionicons
                  name={habitDescription ? "pencil" : "add-circle"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.inputButtons, styles.buttons]}
                onPress={() => setShowDayPickerModal(true)}
              >
                <Text style={styles.buttonText} numberOfLines={1}>
                  {formatSelectedDays(selectedDays)}
                </Text>
                <Ionicons
                  name={selectedDays.length > 0 ? "pencil" : "add-circle"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {/* --- Row 3: Save Changes (Full Width) --- */}
            <View style={[styles.buttonRow, { justifyContent: "center" }]}>
              <TouchableOpacity
                style={[
                  styles.addHabitButton, // Using same style as "Add"
                  styles.buttons,
                  styles.addHabitButtonWide,
                ]}
                onPress={handleEditHabit}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
                <AntDesign name="checkcircle" size={21} color="white" />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- GOAL PICKER MODAL --- */}
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

      {/* --- DESCRIPTION MODAL --- */}
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
              <Text style={styles.descriptionTitle}>Habit Description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Add more details..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline={true}
                value={habitDescription || ""}
                onChangeText={setHabitDescription}
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

      {/* --- DAY PICKER MODAL --- */}
      <Modal
        transparent={true}
        visible={showDayPickerModal}
        animationType="fade"
        onRequestClose={() => setShowDayPickerModal(false)}
      >
        <Pressable
          style={styles.centeredView}
          onPress={() => setShowDayPickerModal(false)}
        >
          <Pressable
            style={styles.dayPickerContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.descriptionTitle}>Select Days</Text>
            <View style={styles.daysContainer}>
              {DAY_LABELS.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(index) && styles.dayButtonSelected,
                  ]}
                  onPress={() => toggleDay(index)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selectedDays.includes(index) && styles.dayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.descriptionDoneButton}
              onPress={() => setShowDayPickerModal(false)}
            >
              <Text style={styles.descriptionDoneText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- TIME PICKER --- */}
      {showTimePicker && (
        <DateTimePicker
          value={dueTime || new Date()}
          mode={"time"}
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};
export default EditHabitModal;

// Styles are copied from HabitFormModal for 1:1 consistency
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
    height: 280,
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
  addHabitButton: { backgroundColor: "#3ECF8E" },
  addHabitButtonWide: {
    width: 355,
    height: 50,
  },
  buttonText: {
    fontFamily: "Regular",
    color: "white",
    fontSize: 16,
    marginLeft: 0,
    maxWidth: "80%",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 10,
  },
  titleContainer: {
    marginTop: 15,
  },

  // --- STYLES FOR DAY PICKER ---
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginVertical: 15,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  dayButtonSelected: {
    backgroundColor: "#3ECF8E",
    borderColor: "#3ECF8E",
  },
  dayText: {
    color: "white",
    fontFamily: "Regular",
    fontSize: 16,
  },
  dayTextSelected: {
    color: "white",
  },

  // --- STYLES FOR GOAL PICKER ---
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

  // --- STYLES FOR DESCRIPTION MODAL ---
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

  // --- STYLE FOR DAY PICKER MODAL ---
  dayPickerContainer: {
    width: 350,
    backgroundColor: "#242424",
    borderRadius: 10,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 20,
  },
});