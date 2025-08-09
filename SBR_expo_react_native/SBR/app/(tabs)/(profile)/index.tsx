
import EditProfileButton from "@/components/profile/EditProfileButton";
import Goals from "@/components/profile/goal/Goals";
import Habits from "@/components/profile/habit/Habits";
import ProfilePicture from "@/components/profile/ProfilePicture";
import UserNickNameBox from "@/components/profile/UserNickNameBox";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const index = () => {
  const [showAddHabbit, setShowAddHabbit] = useState<boolean>(false);


  return (
    <View style={styles.container}>
      <View style={styles.profilePicUserName}>
        <ProfilePicture width={130} height={130} />
        <UserNickNameBox />
      </View>
      <EditProfileButton />
      <Habits/>
      <Goals/>
    </View>
  );
};
export default index;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  profilePicUserName: { flexDirection: "row" },
});
