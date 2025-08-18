import EditProfileButton from "@/components/profile/editProfile/EditProfileButton";
import FriendsButton from "@/components/profile/friends/FriendsButton";
import Goals from "@/components/profile/goal/Goals";
import Habits from "@/components/profile/habit/Habits";
import ProfilePicture from "@/components/profile/ProfilePicture";
import TaskCounter from "@/components/profile/TaskCounter";
import UserNickNameBox from "@/components/profile/UserNickNameBox";
import { StyleSheet, View } from "react-native";

const index = () => {
  return (
    <View style={styles.container}>
        <View style={styles.profilePicUserName}>
          <ProfilePicture width={130} height={130} />
          <View style={styles.userNickNameBox}>
            <UserNickNameBox />
          </View>
        </View>
        <View style={styles.buttonsHabitsContainer}>
          <View style={styles.buttons}>
            <EditProfileButton />
            <FriendsButton />
            <TaskCounter />
          </View>
          <Habits />
        </View>
        <Goals />
      </View>
  );
};
export default index;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  userNickNameBox: { width: "45%" },
  profilePicUserName: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
    marginBottom: 35,
  },
  buttons: { width: "45%", justifyContent: "space-between" },
  buttonsHabitsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 35,
  },
});
