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

interface HabitFormModalProps {
  setShowAddHabit: Dispatch<SetStateAction<boolean>>;
  showAddHabit: boolean;
  goalId?: number | null; // Optional: To associate the habit with a goal
}
interface UserGoal {
  id: number;
  title: string;
}

// --- MODIFIED: Day labels for text and picker ---
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- MODIFIED: Helper function to format the day button text ---
const formatSelectedDays = (days: number[]): string => {
  if (days.length === 0) return "Add Days";
  if (days.length === 7) return "Every Day";
  if (days.length === 5 && days.join(",") === "1,2,3,4,5") return "Weekdays";
  if (days.length === 2 && days.join(",") === "0,6") return "Weekends";

  return days.map((d) => DAY_MAP[d]).join(", ");
};

const HabitFormModal = ({
  setShowAddHabit,
  showAddHabit,
  goalId = null,
}: HabitFormModalProps) => {
  const context = useContext(AuthContext);
  const userId = context.session?.user.id;

  // Form State
  const [habitTitle, setHabitTitle] = useState<string | null>();
  const [habitDescription, setHabitDescription] = useState<string | null>();
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0=Sun, 6=Sat
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(
    goalId || null,
  );

  // Goal Picker State
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [showGoalPicker, setShowGoalPicker] = useState<boolean>(false);

  // Description Modal State
  const [showDescriptionModal, setShowDescriptionModal] =
    useState<boolean>(false);

  // --- MODIFIED: State for the new Day Picker Modal ---
  const [showDayPickerModal, setShowDayPickerModal] = useState<boolean>(false);

  // Time Picker State
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // Fetch user's goals for the goal picker
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
    if (showAddHabit) {
      // When modal opens, reset to defaults or passed-in goalId
      setSelectedGoalId(goalId || null);
      setHabitTitle(null);
      setHabitDescription(null);
      setDueTime(null);
      setSelectedDays([]);
    }
  }, [showAddHabit, goalId]);

  // --- Handlers ---

  const addHabitSubmitted = async () => {
    if (userId) {
      if (habitTitle) {
        const { error } = await supabase.from("habits").insert({
          user_id: userId,
          goal_id: selectedGoalId,
          title: habitTitle,
          description: habitDescription,
          days_of_week: selectedDays, // Supabase client handles JSON serialization
          due_time: dueTime?.toISOString(),
        });

        setShowAddHabit(false);
        if (error) {
          console.log("Error adding habit:", error.message);
          alert("Failed to add habit.");
        }
      } else {
        alert("Title is required");
      }
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

  const selectedGoal = userGoals.find((g) => g.id === selectedGoalId);

  return (
    <View>
      {/* --- MAIN HABIT FORM MODAL --- */}
      <Modal transparent={true} visible={showAddHabit} animationType="fade">
        <Pressable
          style={styles.centeredView}
          onPress={() => setShowAddHabit(false)}
        >
          <Pressable
            style={styles.mainView} // <<< MODIFIED: Height is 210
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddHabit(false)}
            >
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

            {/* --- MODIFIED: Row 2: Description & Days --- */}
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
                onPress={() => setShowDayPickerModal(true)} // <<< Opens day modal
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

            {/* --- MODIFIED: Row 3: Add Habit (Full Width) --- */}
            <View style={[styles.buttonRow, { justifyContent: "center" }]}>
              <TouchableOpacity
                style={[
                  styles.addHabitButton,
                  styles.buttons,
                  styles.addHabitButtonWide, // <<< Added wide style
                ]}
                onPress={addHabitSubmitted}
              >
                <Text style={styles.buttonText}>Add Habit</Text>
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

      {/* --- MODIFIED: NEW DAY PICKER MODAL --- */}
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
            style={styles.dayPickerContainer} // <<< New Style
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
export default HabitFormModal;

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
    height: 280, // <<< MODIFIED: Height for 3 rows
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
  // --- MODIFIED: New style for wide button ---
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
    marginVertical: 15, // Added margin for spacing in modal
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20, // Circular
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#171717", // Match inner modal bg
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
  
  // --- MODIFIED: New style for Day Picker Modal ---
  dayPickerContainer: {
    width: 350,
    backgroundColor: "#242424",
    borderRadius: 10,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 20,
  },
});