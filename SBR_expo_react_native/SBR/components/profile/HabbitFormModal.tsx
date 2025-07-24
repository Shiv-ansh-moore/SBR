import { Dispatch, SetStateAction } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HabitsFormModalProps {
  setShowAddHabbit: Dispatch<SetStateAction<boolean>>;
  showAddHabbit: boolean;
}
const HabbitFormModal = ({
  setShowAddHabbit,
  showAddHabbit,
}: HabitsFormModalProps) => {
  return (
    <View>
      <Modal transparent={true} visible={showAddHabbit} animationType="fade">
        {/* This wrapper View centers the content */}
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text>HabbitFormModal</Text>
            <TouchableOpacity onPress={() => setShowAddHabbit(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default HabbitFormModal;
const styles = StyleSheet.create({
  // New style for the wrapper
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modalView: {
    height: 333,
    width: "95%",
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
  },
});