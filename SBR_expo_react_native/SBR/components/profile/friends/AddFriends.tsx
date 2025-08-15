import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import Ionicons from "@expo/vector-icons/Ionicons";
// --- NEW --- Import MaterialCommunityIcons for the delete icon
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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

  // --- NEW --- State for managing the delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [friendToDelete, setFriendToDelete] = useState<FriendInfo | null>(null);

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

  const declineFriend = async (friendId: string) => {
    if (!user_id) return;
    const { error } = await supabase
      .from("friends")
      .delete()
      .eq("user1_id", friendId)
      .eq("user2_id", user_id);

    if (error) {
      Alert.alert("Error", "Could not decline friend request.");
    } else {
      fetchFriends();
    }
  };

  // --- NEW --- Function to remove an accepted friend
  const deleteFriend = async () => {
    if (!user_id || !friendToDelete) return;
    const friendId = friendToDelete.user.id;

    // This query handles deleting the row regardless of who is user1 or user2
    const { error } = await supabase
      .from("friends")
      .delete()
      .or(
        `and(user1_id.eq.${user_id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user_id})`
      );

    if (error) {
      Alert.alert("Error", "Could not remove friend.");
      console.error("Delete friend error:", error);
    } else {
      // Close modal and refresh the list
      setShowDeleteModal(false);
      setFriendToDelete(null);
      fetchFriends();
    }
  };

  // --- NEW --- Handler to open the modal
  const handleDeletePress = (friend: FriendInfo) => {
    setFriendToDelete(friend);
    setShowDeleteModal(true);
  };

  // --- MODIFIED --- Render function for accepted friends now includes a delete button
  const renderFriendItem = ({ item }: { item: FriendInfo }) => (
    <View style={styles.friendRow}>
      <Text style={styles.friendName}>{item.user.username}</Text>
      <TouchableOpacity onPress={() => handleDeletePress(item)}>
        <MaterialCommunityIcons name="delete" size={24} color="#E53935" />
      </TouchableOpacity>
    </View>
  );

  const renderRequestItem = ({ item }: { item: FriendInfo }) => (
    <View style={styles.friendRow}>
      <Text style={styles.friendName}>{item.user.username}</Text>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptFriend(item.user.id)}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => declineFriend(item.user.id)}
        >
          <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>
      </View>
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
              <Text style={styles.emptyListText}>
                No friends yet. Add one!
              </Text>
            }
          />
        </View>

        {/* --- NEW --- Delete Confirmation Modal */}
        <Modal transparent={true} visible={showDeleteModal} animationType="fade">
          <View style={styles.modalCenteredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>
                Are you sure you want to remove "
                {friendToDelete?.user.username}" as a friend?
              </Text>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setFriendToDelete(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonDelete]}
                  onPress={deleteFriend}
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  acceptButton: {
    backgroundColor: "#3ECF8E",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 8,
  },
  declineButton: {
    backgroundColor: "#E53935",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 8,
  },
  buttonText: {
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
  // --- NEW --- Styles for the delete confirmation modal
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalView: {
    height: 200,
    width: "90%",
    backgroundColor: "#171717",
    borderRadius: 20,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    padding: 20,
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalText: {
    color: "white",
    fontSize: 18,
    fontFamily: "SemiBold",
    textAlign: "center",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
    width: "45%",
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#4A4A4A",
  },
  modalButtonDelete: {
    backgroundColor: "#E53935",
  },
  modalButtonText: {
    color: "white",
    fontFamily: "SemiBold",
    fontSize: 16,
  },
});