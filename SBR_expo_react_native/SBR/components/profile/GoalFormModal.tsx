import Ionicons from "@expo/vector-icons/Ionicons";
import { Dispatch, SetStateAction, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface GoalFormModalProps {
  setShowAddGoal: Dispatch<SetStateAction<boolean>>;
  showAddGoal: boolean;
}
const GoalFormModal = ({ setShowAddGoal, showAddGoal }: GoalFormModalProps) => {
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);

  return (
    <View>
      <Modal transparent={true} visible={showAddGoal} animationType="fade">
        {/* This wrapper View centers the content */}
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.heading}>Add Goal:</Text>
            <Text style={styles.title}>Title:</Text>
            <TextInput
              style={styles.titleInput}
              autoCapitalize="words"
              autoFocus={true}
            ></TextInput>
            <Text style={styles.title}>Description:</Text>
            <TextInput
              style={styles.descriptionInput}
              autoCapitalize="words"
              multiline={true}
            ></TextInput>
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
              <TouchableOpacity style={[styles.buttons, styles.addButton]}>
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
    height: 290,
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
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
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
  closeButton: { backgroundColor: "red" },
  addButton: { backgroundColor: "#3ECF8E" },
});
