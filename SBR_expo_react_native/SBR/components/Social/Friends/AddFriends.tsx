import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AddFriendsProps {
  setShowAddFriends: Dispatch<SetStateAction<boolean>>;
}

const AddFriends = ({ setShowAddFriends }: AddFriendsProps) => {
  const [newFriend, setNewFriend] = useState<string>("");
  const { session } = useContext(AuthContext);
  const user_id = session?.user.id;

  const findFriend = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("username", newFriend)
      .single();
    if (error) {
      console.error("Error Finding Friend", error);
    } else {
      return data;
    }
  };

  const addFriend = async () => {
    const friendData = await findFriend();
    const { data, error } = await supabase
      .from("friends")
      .select("status")
      .or(
        `and(user1_id.eq.${user_id},user2_id.eq.${friendData?.id}),and(user2_id.eq.${user_id},user1_id.eq.${friendData?.id})`
      );
    if (error) {
      console.log(error);
    }
    if (Array.isArray(data) && data?.length > 0) {
      if (data[0].status === "pending") {
        const { error: updateError } = await supabase
          .from("friends")
          .update({ status: "accepcted" })
          .eq("user2_id", user_id);
        if (updateError) {
          console.log(updateError);
        }
      } else {
        console.log("you are already friends");
      }
    } else {
      const { error: insertError } = await supabase.from("friends").insert({
        user1_id: user_id,
        user2_id: friendData?.id,
        status: "pending",
      });
      if (insertError) {
        console.log(insertError);
      }
    }
  };

  return (
    <Modal animationType="slide">
      <View>
        <Text>AddFriends</Text>
        <TextInput
          placeholder="Enter username"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          onChangeText={(text) => setNewFriend(text)}
        />
        <TouchableOpacity onPress={() => addFriend()}>
          <Text>Add Friend</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowAddFriends(false)}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
export default AddFriends;
const styles = StyleSheet.create({});
