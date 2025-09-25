import PersonalTasks from "@/components/personalTasks/PersonalTasks";
import FriendProofOverViewList from "@/components/proof/FriendProofOverViewList";
import FriendsProofList from "@/components/proof/friendsProofList";
import React, { useRef } from "react"; // ✨ 1. Import useRef
import {
  Animated, // ✨ 2. Import Animated
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const index = () => {

  return (
    <View style={styles.container}>
      <PersonalTasks/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});

export default index;