import React, { Dispatch, SetStateAction } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DeleteHabitModalProps {
  setShowDeleteHabit: Dispatch<SetStateAction<boolean>>;
  showDeleteHabit: boolean;
  habitTitle?: string;
  onDeleteConfirm: () => void;
}

const DeleteHabitModal = ({
  setShowDeleteHabit,
  showDeleteHabit,
  habitTitle,
  onDeleteConfirm,
}: DeleteHabitModalProps) => {
  return (
    <View>
      <Modal transparent={true} visible={showDeleteHabit} animationType="fade">
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {/* Display the title of the habit being deleted */}
            <Text style={styles.modalText}>
              Are you sure you want to delete "{habitTitle}"?
            </Text>
            <View style={styles.buttonContainer}>
              {/* Cancel Button */}
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setShowDeleteHabit(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              {/* Delete Button */}
              <TouchableOpacity
                style={[styles.button, styles.buttonDelete]}
                onPress={onDeleteConfirm} // The function is called directly now
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DeleteHabitModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Darkened background
  },
  modalView: {
    height: 200, // Adjusted height for content
    width: "90%", // Adjusted width
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 20, // Add padding
    justifyContent: "space-between", // Space out text and buttons
    alignItems: "center",
  },
  modalText: {
    color: "white",
    fontSize: 18,
    fontFamily: "SemiBold", // Assuming you have this font
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
    width: "45%",
    alignItems: "center",
  },
  buttonCancel: {
    backgroundColor: "#4A4A4A",
  },
  buttonDelete: {
    backgroundColor: "#E53935", // A standard red color for deletion
  },
  buttonText: {
    color: "white",
    fontFamily: "SemiBold",
    fontSize: 16,
  },
});