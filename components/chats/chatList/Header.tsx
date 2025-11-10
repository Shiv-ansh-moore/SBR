import Entypo from "@expo/vector-icons/Entypo";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import CreateGroupModal from "./CreateGroupModal";
import CameraModal from "@/components/camera/CameraModal";

const Header = () => {
  // State to control the visibility of the dropdown menu
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);

  // Function to toggle the menu's visibility
  const toggleMenu = () => {
    setMenuVisible(!isMenuVisible);
  };

  // Function to handle the "Create a group" action
  const handleCreateGroup = () => {
    setShowAddGroupModal(true);
    toggleMenu(); // Close the menu after selection
  };

  return (
    <View>
      <View style={styles.container}>
        <Text style={styles.heading}>Chats:</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.proofButton}
            onPress={() => {
              setShowCameraModal(true);
            }}
          >
            <Text style={styles.proofButtonText}>Proof</Text>
            <Entypo name="camera" size={25} color="#3ECF8E" />
          </TouchableOpacity>
          {/* This button now toggles the menu */}
          <TouchableOpacity style={styles.options} onPress={toggleMenu}>
            <SimpleLineIcons name="options-vertical" size={25} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleMenu} // Allows closing with the back button on Android
      >
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.modalOverlay}>
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleCreateGroup}
              >
                <Text style={styles.menuItemText}>Create a group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <CreateGroupModal
        showAddGroup={showAddGroupModal}
        setShowAddGroup={setShowAddGroupModal}
      />
      <CameraModal
        setShowCameraModal={setShowCameraModal}
        showCameraModal={showCameraModal}
        taskId={undefined}
      />
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    fontFamily: "SemiBold",
    color: "white",
    fontSize: 24,
    marginLeft: 20,
  },
  buttonContainer: { flexDirection: "row", alignItems: "center" },
  proofButton: {
    backgroundColor: "#242424",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    borderRadius: 20,
    height: 40,
    width: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 10,
    marginRight: 10,
  },
  proofButtonText: { fontFamily: "Bold", color: "white", fontSize: 15 },
  options: { marginRight: 10 },

  // --- New Styles for the Dropdown Menu ---
  modalOverlay: {
    flex: 1,
  },
  menuContainer: {
    position: "absolute",
    top: 45, // Adjust this value to position the menu correctly below the button
    right: 15, // Adjust this value to align with the options button
    backgroundColor: "#242424",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    // paddingVertical: 5 ,
    // paddingHorizontal: 5,
  },
  menuItemText: {
    color: "white",
    fontFamily: "Medium",
    fontSize: 16,
  },
});
