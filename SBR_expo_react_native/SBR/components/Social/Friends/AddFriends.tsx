import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
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

interface Friend {
  id: string;
  username: string;
}

interface FriendInfo {
  user: Friend;
  status: String;
  sender: boolean;
}

const AddFriends = ({ setShowAddFriends }: AddFriendsProps) => {
  const [newFriend, setNewFriend] = useState<string>("");
  const { session } = useContext(AuthContext);
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const user_id = session?.user.id;

  useEffect(() => {
    fetchFriends();
  }, [user_id]);

  const fetchFriends = async () => {
    const { data, error } = await supabase
      .from("friends")
      .select(
        `status,
          user1:users!friends_user1_id_fkey(id,username),
          user2:users!friends_user2_id_fkey(id,username)
        `
      )
      .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`);
    console.log(data);
    console.log("hello");
    if (data) {
      const friendInfo = data.map((friendship) => {
        if (friendship.user1.id === user_id)
          return {
            user: friendship.user2,
            status: friendship.status,
            sender: true,
          };
        else {
          return {
            user: friendship.user1,
            status: friendship.status,
            sender: false,
          };
        }
      });
      console.log("hi");
      console.log(friendInfo);
      setFriends(friendInfo);
    }
  };

  const findNewFriend = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("username", newFriend)
      .single();
    if (error) {
      console.error("Error Finding Friend", error);
    }
    if (data?.id) {
      if (data.id == user_id) {
        console.log("That is you");
      } else {
        return data;
      }
    }
  };

  const acceptFriend = async (friendId: string) => {
    if (user_id) {
      const { error: updateError } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .or(`and(user1_id.eq.${friendId},user2_id.eq.${user_id})`);
      if (updateError) {
        console.log(updateError);
      }
      await fetchFriends();
    }
  };

  const addFriend = async () => {
    const friendData = await findNewFriend();
    const { data, error } = await supabase
      .from("friends")
      .select("status")
      .or(
        `and(user1_id.eq.${user_id},user2_id.eq.${friendData?.id}),and(user2_id.eq.${user_id},user1_id.eq.${friendData?.id})`
      );
    if (error) {
      console.log("Error adding firend", error);
    }
    if (user_id && friendData) {
      if (Array.isArray(data) && data?.length > 0) {
        if (data[0].status === "pending") {
          acceptFriend(friendData.id);
        } else {
          console.log("you are already friends");
        }
      } else {
        const { error: insertError } = await supabase.from("friends").insert({
          user1_id: user_id,
          user2_id: friendData.id,
          status: "pending",
        });
        if (insertError) {
          console.log(insertError);
        }
      }
    }
    await fetchFriends();
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
        <Text>Pending Requests</Text>
        {friends
          .filter((f) => f.status === "pending")
          .map((friendInfo) =>
            !friendInfo.sender ? (
              <View>
                <Text key={friendInfo.user.id}>{friendInfo.user.username}</Text>
                <TouchableOpacity
                  onPress={async () => {
                    acceptFriend(friendInfo.user.id);
                  }}
                >
                  <Text>accept</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text key={friendInfo.user.id}>{friendInfo.user.username} pending</Text>
            )
          )}
        <Text>Firends</Text>
        <View>
          {friends
            .filter((f) => f.status === "accepted")
            .map((friendInfo) => (
              <Text key={friendInfo.user.id}>{friendInfo.user.username}</Text>
            ))}
        </View>
        <TouchableOpacity onPress={() => setShowAddFriends(false)}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
export default AddFriends;
const styles = StyleSheet.create({});
