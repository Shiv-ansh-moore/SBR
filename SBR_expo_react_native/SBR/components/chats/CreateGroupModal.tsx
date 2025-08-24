import { supabase } from "@/lib/supabaseClient";
import { Dispatch, SetStateAction, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";

interface CreateGroupModalProps {
  showAddGroup: boolean;
  setShowAddGroup: Dispatch<SetStateAction<boolean>>;
}

const CreateGroupModal = ({
  showAddGroup,
  setShowAddGroup,
}: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState<string>("");

  const resetForm = () => {
    setGroupName("");
  };

  const addGroupSubmitted = async () => {
    if (!groupName.trim()) {
      alert("Group name is required.");
      return;
    }

    const { error } = await supabase.from("groups").insert({
      name: groupName.trim(),
    });

    if (error) {
      console.log("Error creating group:", error.message);
      alert("Failed to create group.");
    } else {
      resetForm();
      setShowAddGroup(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setShowAddGroup(false);
  };

  return (
    <Modal transparent={true} visible={showAddGroup} animationType="fade">
      <Pressable style={styles.centeredView} onPress={handleClose}>
        {/* By wrapping the modal content in a Pressable that stops propagation,
            we can close the modal by clicking the background but not the modal itself. */}
        <Pressable style={styles.modalView}>
          <Text style={styles.heading}>Create Group:</Text>
          <Text style={styles.title}>Name:</Text>
          <TextInput
            style={styles.titleInput}
            value={groupName}
            autoCapitalize="words"
            autoFocus={true}
            onChangeText={setGroupName}
            placeholder="Enter group name..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.buttons, styles.closeButton]}
              onPress={handleClose}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttons, styles.addButton]}
              onPress={addGroupSubmitted}
            >
              <Text style={styles.buttonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CreateGroupModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    minHeight: 200, // Adjusted height for simpler content
    width: "95%",
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 15,
  },
  heading: {
    fontSize: 24,
    fontFamily: "SemiBold",
    color: "white",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: "Regular",
    color: "white",
    marginTop: 5,
    marginBottom: 5,
  },
  titleInput: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 10,
    color: "white",
    fontFamily: "Light",
    height: 45,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: "auto", // Pushes buttons to the bottom
    paddingTop: 20,
    justifyContent: "space-between",
  },
  buttons: {
    height: 35,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    flex: 1, // Make buttons share space
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Regular",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#D32F2F",
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#3ECF8E",
    marginLeft: 10,
  },
});