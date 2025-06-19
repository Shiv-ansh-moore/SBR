import { Dispatch, SetStateAction } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AddFriendsProps {
  setShowAddFriends: Dispatch<SetStateAction<boolean>>;
}

const AddFriends = ({ setShowAddFriends }: AddFriendsProps) => {
  return (
    <Modal animationType="slide">
      <View>
        <Text>AddFriends</Text>
        <TouchableOpacity onPress={() => setShowAddFriends(false)}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
export default AddFriends;
const styles = StyleSheet.create({});
