import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";

interface GoalFormModalProps {
  setShowAddGoal: Dispatch<SetStateAction<boolean>>;
  showAddGoal: boolean;
}
const GoalFormModal = ({ setShowAddGoal, showAddGoal }: GoalFormModalProps) => {
  const context = useContext(AuthContext);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [goalTitle, setGoalTitle] = useState<string | null>();
  const [goalDescription, setGoalDescription] = useState<string | null>();
  // <<< MODIFIED: Removed isPublic state
  const [showDescriptionModal, setShowDescriptionModal] =
    useState<boolean>(false);
  const userId = context.session?.user.id;

  useEffect(() => {
    if (!showAddGoal) {
      setGoalTitle(null);
      setGoalDescription(null);
      setDueDate(null);
      // <<< MODIFIED: Removed setIsPublic
    }
  }, [showAddGoal]);

  const addGoalSubmitted = async () => {
    if (userId) {
      if (goalTitle) {
        const { error } = await supabase.from("goals").insert({
          user_id: userId,
          title: goalTitle,
          description: goalDescription,
          due_date: dueDate?.toISOString(),
          is_public: true, // <<< MODIFIED: Set back to default true
        });
        setShowAddGoal(false);
        if (error) {
          console.log(error);
          alert("Failed to add goal.");
        }
      } else {
        alert("Title is required");
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (event.type === "set" && selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const showDatePicker = () => {
    setShowPicker(true);
  };

  return (
    <View>
      <Modal transparent={true} visible={showAddGoal} animationType="fade">
        <Pressable
          style={styles.centeredView}
          onPress={() => setShowAddGoal(false)}
        >
          <Pressable
            style={styles.mainView}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddGoal(false)}
            >
              <AntDesign
                name="closecircleo"
                size={22}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <TextInput
                placeholder="Goal Title"
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={styles.titleInput}
                autoFocus={true}
                value={goalTitle || ""}
                onChangeText={setGoalTitle}
              />
              <View style={styles.titleLine} />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.inputButtons, styles.buttons]}
                onPress={showDatePicker}
              >
                <Text style={styles.buttonText} numberOfLines={1}>
                  {dueDate ? dueDate.toLocaleDateString() : "Due Date"}
                </Text>
                <Ionicons name="add-circle" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.inputButtons, styles.buttons]}
                onPress={() => setShowDescriptionModal(true)}
              >
                <Text style={styles.buttonText} numberOfLines={1}>
                  {goalDescription
                    ? "Edit Description"
                    : "Add Description"}
                </Text>
                <Ionicons
                  name={goalDescription ? "pencil" : "add-circle"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {/* <<< START: MODIFIED Button Row */}
            <View style={[styles.buttonRow, { justifyContent: "center" }]}>
              {/* Public/Private button removed */}
              <TouchableOpacity
                style={[
                  styles.addGoalButton,
                  styles.buttons,
                  styles.addGoalButtonWide, // <<< Added wide style
                ]}
                onPress={addGoalSubmitted}
              >
                <Text style={styles.buttonText}>Add Goal</Text>
                <AntDesign name="checkcircle" size={21} color="white" />
              </TouchableOpacity>
            </View>
            {/* <<< END: MODIFIED Button Row */}
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
              <Text style={styles.descriptionTitle}>Goal Description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Add more details..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline={true}
                value={goalDescription || ""}
                onChangeText={setGoalDescription}
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

      {/* --- DATE TIME PICKER --- */}
      {showPicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode={"date"}
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};
export default GoalFormModal;

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
  addGoalButton: { backgroundColor: "#3ECF8E" },
  addGoalButtonWide: {
    // <<< NEW: Style for wide button
    width: 355, // Combined width of two original buttons
    height:50
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
    marginBottom:5
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
});