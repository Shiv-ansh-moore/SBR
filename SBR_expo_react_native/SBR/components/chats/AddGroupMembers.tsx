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
  TouchableOpacity,
  View,
} from "react-native";

interface AddGroupMembersProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  groupId: string;
}

interface Friend {
  id: string;
  username: string;
}

const AddGroupMembers = ({
  setShowModal,
  showModal,
  groupId,
}: AddGroupMembersProps) => {
  const { session } = useContext(AuthContext);
  const [addableFriends, setAddableFriends] = useState<Friend[]>([]);
  const user_id = session?.user.id;

  useEffect(() => {
    if (showModal) {
      fetchData();
    }
  }, [user_id, showModal, groupId]);

  const fetchData = async () => {
    if (!user_id || !groupId) return;

    try {
      // Step 1: Fetch all of the current user's accepted friends
      const { data: friendsData, error: friendsError } = await supabase
        .from("friends")
        .select(
          `
          status,
          user1:users!friends_user1_id_fkey(id,username),
          user2:users!friends_user2_id_fkey(id,username)
          `
        )
        .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`)
        .eq("status", "accepted");

      if (friendsError) throw friendsError;

      const allFriends: Friend[] = friendsData.map((friendship) => ({
        id:
          friendship.user1.id === user_id
            ? friendship.user2.id
            : friendship.user1.id,
        username:
          friendship.user1.id === user_id
            ? friendship.user2.username
            : friendship.user1.username,
      }));

      // Step 2: Fetch the IDs of users already in the current group
      const { data: membersData, error: membersError } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("group_id", parseInt(groupId, 10));

      if (membersError) throw membersError;

      const memberIds = new Set(membersData.map((member) => member.user_id));

      // Step 3: Filter the friends list to show only those not in the group
      const filteredFriends = allFriends.filter(
        (friend) => !memberIds.has(friend.id)
      );

      setAddableFriends(filteredFriends);
    } catch (error) {
      console.error("Error fetching data for group members:", error);
      Alert.alert("Error", "Could not load your friends list.");
    }
  };

  // Adds a selected friend to the chat_members table
  const addMember = async (friendId: string) => {
    if (!groupId) return;

    const { error } = await supabase
      .from("chat_members")
      .insert({ group_id: parseInt(groupId, 10), user_id: friendId });

    if (error) {
      console.error("Error adding member to group:", error);
      Alert.alert("Error", "Could not add member to the group.");
    } else {
      // Refresh the list to remove the newly added member
      fetchData();
    }
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendRow}>
      <Text style={styles.friendName}>{item.username}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addMember(item.id)}
      >
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal animationType="slide" visible={showModal}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Add Members</Text>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <Ionicons name="close-circle" size={30} color="#E53935" />
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.subHeading}>Friends</Text>
          <FlatList
            data={addableFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>
                All of your friends are in this group.
              </Text>
            }
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default AddGroupMembers;

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
  listSection: {
    flex: 1,
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
  addButton: {
    backgroundColor: "#3ECF8E",
    paddingHorizontal: 20,
    paddingVertical: 8,
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
});
