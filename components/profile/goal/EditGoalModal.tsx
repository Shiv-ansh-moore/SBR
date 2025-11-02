import { supabase } from "@/lib/supabaseClient";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  KeyboardAvoidingView,
  Platform,
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
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [goalTitle, setGoalTitle] = useState<string>("");
  const [goalDescription, setGoalDescription] = useState<string | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] =
    useState<boolean>(false);

  useEffect(() => {
    const getGoalInfo = async () => {
      if (goalId && showEditGoal) {
        const { data, error } = await supabase
          .from("goals")
          .select("*")
          .eq("id", goalId)
          .single();

        if (error) {
          Alert.alert("Error", "Could not fetch goal details.");
          console.error("Error fetching goal:", error);
        }

        if (data) {
          setGoalTitle(data.title);
          setGoalDescription(data.description);
          if (data.due_date) {
            setDueDate(new Date(data.due_date));
          } else {
            setDueDate(null);
          }
        }
      } else if (!showEditGoal) {
        setGoalTitle("");
        setGoalDescription(null);
        setDueDate(null);
      }
    };

    getGoalInfo();
  }, [goalId, showEditGoal]);

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
      })
      .eq("id", goalId);

    if (error) {
      Alert.alert("Error", "Could not update the goal.");
      console.error("Error updating goal:", error);
    } else {
      setEditMode(false);
      setShowEditGoal(false);
    }
  };

  // <<< START: NEW - Handle Delete
  const handleDeleteGoal = () => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!goalId) {
              Alert.alert("Error", "No goal selected.");
              return;
            }

            const { error } = await supabase
              .from("goals")
              .delete()
              .eq("id", goalId);

            if (error) {
              Alert.alert("Error", "Could not delete the goal.");
              console.error("Error deleting goal:", error);
            } else {
              setEditMode(false);
              setShowEditGoal(false);
            }
          },
        },
      ]
    );
  };
  // <<< END: NEW

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (event.type === "set") {
      setDueDate(selectedDate || null);
    }
  };

  const showDatePicker = () => {
    setShowPicker(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setShowEditGoal(false);
  };

  return (
    <View>
      <Modal transparent={true} visible={showEditGoal} animationType="fade">
        <Pressable style={styles.centeredView} onPress={handleCancel}>
          <Pressable
            style={styles.mainView}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
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
                value={goalTitle}
                onChangeText={setGoalTitle}
              />
              <View style={styles.titleLine} />
            </View>

            {/* --- Button Grid Row 1 --- */}
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

            {/* --- Button Grid Row 2 (MODIFIED) --- */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.deleteGoalButton, // <<< MODIFIED
                  styles.buttons,
                ]}
                onPress={handleDeleteGoal} // <<< MODIFIED
              >
                <Text style={styles.buttonText}>Delete Goal</Text>
                <Ionicons name="trash-outline" size={21} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveGoalButton,
                  styles.buttons,
                  // <<< saveGoalButtonWide removed
                ]}
                onPress={handleEditGoal}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
                <AntDesign name="checkcircle" size={21} color="white" />
              </TouchableOpacity>
            </View>
            {/* --- End Button Grid --- */}
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

export default EditGoalModal;

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
  saveGoalButton: { backgroundColor: "#3ECF8E" },
  deleteGoalButton: {
    // <<< NEW
    backgroundColor: "red",
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
    marginVertical: 15,
  },
  titleContainer: {
    marginTop: 15,
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