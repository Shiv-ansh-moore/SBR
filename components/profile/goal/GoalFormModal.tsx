import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Checkbox from "expo-checkbox";
import { Dispatch, SetStateAction, useContext, useState } from "react";
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

interface GoalFormModalProps {
  setShowAddGoal: Dispatch<SetStateAction<boolean>>;
  showAddGoal: boolean;
}
const GoalFormModal = ({ setShowAddGoal, showAddGoal }: GoalFormModalProps) => {
  const context = useContext(AuthContext);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const [goalTitle, setGoalTitle] = useState<string | null>();
  const [goalDescription, setGoalDescription] = useState<string | null>();
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const userId = context.session?.user.id;

  const addGoalSubmitted = async () => {
    if (userId) {
      if (goalTitle) {
        const { error } = await supabase.from("goals").insert({
          user_id: userId,
          title: goalTitle,
          description: goalDescription,
          due_date: dueDate?.toISOString(),
          is_public: isPublic,
        });
        setShowAddGoal(false);
        if (error) {
          console.log(error);
        }
      } else {
        alert("Ttile Required");
      }
    }
  };

  return (
    <View>
      <Modal transparent={true} visible={showAddGoal} animationType="fade">
        {/* This wrapper View centers the content */}
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {showDueDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={new Date()}
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
            <Text style={styles.heading}>Add Goal:</Text>
            <Text style={styles.title}>Title:</Text>
            <TextInput
              style={styles.titleInput}
              autoCapitalize="words"
              autoFocus={true}
              onChangeText={(title) => setGoalTitle(title)}
            ></TextInput>
            <Text style={styles.title}>Description:</Text>
            <TextInput
              style={styles.descriptionInput}
              autoCapitalize="words"
              multiline={true}
              onChangeText={(description) => setGoalDescription(description)}
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
                onPress={() => setShowAddGoal(false)}
              >
                <Text style={[styles.buttonText]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttons, styles.addButton]}
                onPress={() => addGoalSubmitted()}
              >
                <Text style={[styles.buttonText]}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default GoalFormModal;
const styles = StyleSheet.create({
  // New style for the wrapper
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
