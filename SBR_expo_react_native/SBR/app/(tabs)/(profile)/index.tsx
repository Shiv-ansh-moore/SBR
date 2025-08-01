import EditProfileButton from "@/components/profile/EditProfileButton";
import GoalFormModal from "@/components/profile/GoalFormModal";
import Goals from "@/components/profile/Goals";
import HabbitFormModal from "@/components/profile/HabbitFormModal";
import Habits from "@/components/profile/Habits";
import ProfilePicture from "@/components/profile/ProfilePicture";
import UserNickNameBox from "@/components/profile/UserNickNameBox";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const index = () => {
  const [showAddHabbit, setShowAddHabbit] = useState<boolean>(false);
  const [showAddGoal, setShowAddGoal] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      <View style={styles.profilePicUserName}>
        <ProfilePicture width={130} height={130} />
        <UserNickNameBox />
      </View>
      <EditProfileButton />
      <Habits setShowAddHabbit={setShowAddHabbit} />
      <Goals setShowAddGoal={setShowAddGoal} />
      <GoalFormModal
        showAddGoal={showAddGoal}
        setShowAddGoal={setShowAddGoal}
      />
      <HabbitFormModal
        setShowAddHabbit={setShowAddHabbit}
        showAddHabbit={showAddHabbit}
      />
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
