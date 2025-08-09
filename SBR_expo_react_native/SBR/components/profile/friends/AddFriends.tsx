import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AddFriendsProps {
  showFriends: boolean;
  setShowFriends: Dispatch<SetStateAction<boolean>>;
}

interface Friend {
  id: string;
  username: string;
}

interface FriendInfo {
  user: Friend;
  status: string;
  sender: boolean;
}

const AddFriends = ({ setShowFriends, showFriends }: AddFriendsProps) => {
  const [newFriend, setNewFriend] = useState<string>("");
  const { session } = useContext(AuthContext);
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const user_id = session?.user.id;

  const pendingRequests = friends.filter(
    (f) => f.status === "pending" && !f.sender
  );
  const acceptedFriends = friends.filter((f) => f.status === "accepted");

  useEffect(() => {
    if (showFriends) {
      fetchFriends();
    }
  }, [user_id, showFriends]);

  const fetchFriends = async () => {
    if (!user_id) return;
    const { data, error } = await supabase
      .from("friends")
      .select(
        `
        status,
        user1:users!friends_user1_id_fkey(id,username),
        user2:users!friends_user2_id_fkey(id,username)
        `
      )
      .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`);

    if (error) {
      console.error("Error fetching friends:", error);
      return;
    }
    if (data) {
      const friendInfo = data.map((friendship) => ({
        user:
          friendship.user1.id === user_id
            ? friendship.user2
            : friendship.user1,
        status: friendship.status,
        sender: friendship.user1.id === user_id,
      }));
      setFriends(friendInfo);
    }
  };

  // CORRECTED addFriend FUNCTION
  const addFriend = async () => {
    if (newFriend.trim() === "") {
      Alert.alert("Input empty", "Please enter a username.");
      return;
    }

    const { data: friendData, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("username", newFriend.trim())
      .single();

    if (findError || !friendData) {
      Alert.alert("User not found", `Could not find user "${newFriend}".`);
      return;
    }

    // This 'if' block is the fix. It ensures both IDs are defined.
    if (user_id && friendData.id) {
      if (friendData.id === user_id) {
        Alert.alert("That's you!", "You can't add yourself as a friend.");
        return;
      }

      const isAlreadyFriends = friends.some(
        (f) => f.user.id === friendData.id
      );
      if (isAlreadyFriends) {
        Alert.alert(
          "Already connected",
          "You have a pending or accepted request with this user."
        );
        return;
      }

      // Inside this block, TypeScript knows user_id and friendData.id are strings.
      const { error: insertError } = await supabase.from("friends").insert({
        user1_id: user_id,
        user2_id: friendData.id,
        status: "pending",
      });

      if (insertError) {
        Alert.alert("Error", "Could not send friend request.");
        console.error(insertError);
      } else {
        Alert.alert("Success!", `Friend request sent to ${newFriend}.`);
        setNewFriend("");
        fetchFriends();
      }
    } else {
      Alert.alert("Error", "Could not identify current user or friend.");
    }
  };

  const acceptFriend = async (friendId: string) => {
    if (!user_id) return;
    const { error } = await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("user1_id", friendId)
      .eq("user2_id", user_id);

    if (error) {
      Alert.alert("Error", "Could not accept friend request.");
    } else {
      fetchFriends();
    }
  };

  const renderFriendItem = ({ item }: { item: FriendInfo }) => (
    <View style={styles.friendRow}>
      <Text style={styles.friendName}>{item.user.username}</Text>
    </View>
  );

  const renderRequestItem = ({ item }: { item: FriendInfo }) => (
    <View style={styles.friendRow}>
      <Text style={styles.friendName}>{item.user.username}</Text>
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => acceptFriend(item.user.id)}
      >
        <Text style={styles.acceptButtonText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal animationType="slide" visible={showFriends}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Friends</Text>
          <TouchableOpacity onPress={() => setShowFriends(false)}>
            <Ionicons name="close-circle" size={30} color="#E53935" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter username to add"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            autoCapitalize="none"
            value={newFriend}
            onChangeText={setNewFriend}
          />
          <TouchableOpacity style={styles.addButton} onPress={addFriend}>
            <Text style={styles.addButtonText}>Add Friend</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.subHeading}>Pending Requests</Text>
          <FlatList
            data={pendingRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.user.id}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>No new requests.</Text>
            }
          />
        </View>

        <View style={styles.listSection}>
          <Text style={styles.subHeading}>Friends</Text>
          <FlatList
            data={acceptedFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.user.id}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>No friends yet. Add one!</Text>
            }
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};
export default AddFriends;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 32,
    fontFamily: "SemiBold",
    color: "white",
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 15,
    color: "white",
    fontFamily: "Light",
    paddingHorizontal: 15,
    height: 50,
    fontSize: 16,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#3ECF8E",
    borderRadius: 15,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "SemiBold",
  },
  listSection: {
    flex: 1,
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 22,
    fontFamily: "Regular",
    color: "white",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 61, 61, 0.50)",
    paddingBottom: 5,
  },
  friendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#242424",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  friendName: {
    fontSize: 16,
    color: "white",
    fontFamily: "Light",
  },
  acceptButton: {
    backgroundColor: "#3ECF8E",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: "white",
    fontFamily: "SemiBold",
    fontSize: 14,
  },
  emptyListText: {
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginTop: 15,
    fontFamily: "Light",
  },
});