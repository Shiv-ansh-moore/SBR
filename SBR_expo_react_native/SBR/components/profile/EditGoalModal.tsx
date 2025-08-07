import { supabase } from "@/lib/supabaseClient";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Checkbox from "expo-checkbox";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
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

interface EditGoalModalProps {
  setShowEditGoal: Dispatch<SetStateAction<boolean>>;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  showEditGoal: boolean;
  goalId: number | null;
}

const EditGoalModal = ({
  setShowEditGoal,
  showEditGoal,
  goalId,
  setEditMode,
}: EditGoalModalProps) => {
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const [goalTitle, setGoalTitle] = useState<string>(""); // Initialize as empty string
  const [goalDescription, setGoalDescription] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(false);

  // 1. Fetch goal data when the component mounts or goalId changes
  useEffect(() => {
    const getGoalInfo = async () => {
      if (goalId) {
        const { data, error } = await supabase
          .from("goals")
          .select("*")
          .eq("id", goalId)
          .single(); // Use .single() to get a single object, not an array

        if (error) {
          Alert.alert("Error", "Could not fetch goal details.");
          console.error("Error fetching goal:", error);
        }

        if (data) {
          // 2. Populate state with fetched data
          setGoalTitle(data.title);
          setGoalDescription(data.description);
          setIsPublic(data.is_public);
          if (data.due_date) {
            setDueDate(new Date(data.due_date));
          }
        }
      }
    };

    getGoalInfo();
  }, [goalId]); // Dependency array ensures this runs when goalId changes

  // 3. Handle the form submission to update the goal
  const handleEditGoal = async () => {
    if (!goalId) {
      Alert.alert("Error", "No goal selected.");
      return;
    }
    if (!goalTitle || goalTitle.trim() === "") {
      Alert.alert("Title Required", "Please enter a title for your goal.");
      return;
    }

    const { error } = await supabase
      .from("goals")
      .update({
        title: goalTitle,
        description: goalDescription,
        due_date: dueDate ? dueDate.toISOString() : null,
        is_public: isPublic,
      })
      .eq("id", goalId);

    if (error) {
      Alert.alert("Error", "Could not update the goal.");
      console.error("Error updating goal:", error);
    } else {
      setEditMode((currentMode) => !currentMode);
      setShowEditGoal(false); // Close modal on success
    }
  };

  return (
    <View>
      <Modal transparent={true} visible={showEditGoal} animationType="fade">
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {showDueDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={dueDate || new Date()} // Use existing due date or today
                mode={"date"}
                is24Hour={true}
                onChange={(event, selectedDate) => {
                  setShowDueDatePicker(false);
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
              />
            )}
            <Text style={styles.heading}>Edit Goal:</Text>
            <Text style={styles.title}>Title:</Text>
            <TextInput
              style={styles.titleInput}
              autoCapitalize="words"
              autoFocus={true}
              onChangeText={(title) => setGoalTitle(title)}
              value={goalTitle} // 4. Bind value to state
            ></TextInput>
            <Text style={styles.title}>Description:</Text>
            <TextInput
              style={styles.descriptionInput}
              autoCapitalize="words"
              multiline={true}
              onChangeText={(description) => setGoalDescription(description)}
              value={goalDescription || ""} // Bind value to state
            ></TextInput>
            <Pressable
              style={styles.checkboxContainer}
              onPress={() => setIsPublic(!isPublic)}
            >
              <Text style={styles.checkboxLabel}>Make Goal Public:</Text>
              <Checkbox
                value={isPublic}
                onValueChange={setIsPublic}
                color={isPublic ? "#3ECF8E" : "rgba(77, 61, 61, 0.50)"}
              />
            </Pressable>
            {dueDate ? (
              <View style={styles.dueDateContainer}>
                <Text style={styles.dueDateText}>
                  Due Date: {dueDate.toDateString()}
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
                onPress={() => setShowDueDatePicker(true)}
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
                onPress={() => {
                  setEditMode((currentMode) => !currentMode);
                  setShowEditGoal(false);
                }}
              >
                <Text style={[styles.buttonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttons, styles.addButton]}
                onPress={handleEditGoal} // 5. Call update function on press
              >
                <Text style={[styles.buttonText]}>Edit Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EditGoalModal;

// --- Styles remain the same as you provided ---
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modalView: {
    height: 330,
    width: "95%",
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
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
  },
  titleInput: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    color: "white",
    fontFamily: "Light",
    textAlignVertical: "top",
    marginLeft: 10,
    marginRight: 10,
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
    marginLeft: 10,
    marginRight: 10,
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
    flexDirection: "row",
    marginTop: 5,
    marginLeft: 10,
    marginRight: 10,
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
    alignItems: "center", // This is the key property for vertical alignment
    marginLeft: 10,
    marginTop: 5,
  },
  dueDateText: {
    fontFamily: "ExtraLight",
    color: "white",
  },
  deleteIcon: {
    marginLeft: 8, // Adds a little space between the text and the icon
  },
  closeButton: { backgroundColor: "red" },
  addButton: { backgroundColor: "#3ECF8E" },
});
