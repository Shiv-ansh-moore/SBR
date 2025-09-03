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

// Re-used for both members and friends
interface User {
  id: string;
  username: string;
}

const AddGroupMembers = ({
  setShowModal,
  showModal,
  groupId,
}: AddGroupMembersProps) => {
  const { session } = useContext(AuthContext);
  const user_id = session?.user.id;

  // State for both lists
  const [existingMembers, setExistingMembers] = useState<User[]>([]);
  const [addableFriends, setAddableFriends] = useState<User[]>([]);

  useEffect(() => {
    if (showModal) {
      fetchData();
    }
  }, [user_id, showModal, groupId]);

  const fetchData = async () => {
    if (!user_id || !groupId) return;

    try {
      // Step 1: Fetch existing group members with their usernames
      const { data: membersData, error: membersError } = await supabase
        .from("chat_members")
        .select("user:users!chat_members_user_id_fkey(id, username)")
        .eq("group_id", parseInt(groupId, 10));

      if (membersError) throw membersError;

      const currentMembers = membersData
        .map((item) => item.user)
        .filter(Boolean) as User[]; // Filter out any null user joins
      setExistingMembers(currentMembers);
      const memberIds = new Set(currentMembers.map((member) => member.id));

      // Step 2: Fetch all of the current user's friends
      const { data: friendsData, error: friendsError } = await supabase
        .from("friends")
        .select(
          `
          user1:users!friends_user1_id_fkey(id,username),
          user2:users!friends_user2_id_fkey(id,username)
          `
        )
        .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`)
        .eq("status", "accepted");

      if (friendsError) throw friendsError;

      const allFriends: User[] = friendsData.map((friendship) => ({
        id:
          friendship.user1.id === user_id
            ? friendship.user2.id
            : friendship.user1.id,
        username:
          friendship.user1.id === user_id
            ? friendship.user2.username
            : friendship.user1.username,
      }));

      // Step 3: Filter friends list to exclude those already in the group
      const filteredFriends = allFriends.filter(
        (friend) => !memberIds.has(friend.id)
      );
      setAddableFriends(filteredFriends);
    } catch (error) {
      console.error("Error fetching data for group members:", error);
      Alert.alert("Error", "Could not load group and friend data.");
    }
  };

  // Adds a selected friend to the chat_members table
  const addMember = (friendId: string, friendUsername: string) => {
    if (!groupId) return;

    Alert.alert(
      "Confirm", // Title of the alert
      `Are you sure you want to add ${friendUsername} to the group?`, // Message
      [
        // Buttons array
        {
          text: "Cancel",
          style: "cancel", // This button dismisses the alert
        },
        {
          text: "Add",
          onPress: async () => {
            // This button runs the logic to add the member
            const { error } = await supabase
              .from("chat_members")
              .insert({ group_id: parseInt(groupId, 10), user_id: friendId });

            if (error) {
              console.error("Error adding member to group:", error);
              Alert.alert("Error", "Could not add member to the group.");
            } else {
              // Refresh both lists on success
              fetchData();
            }
          },
        },
      ]
    );
  };

  // --- RENDER ITEMS ---

  // Renders a row for an existing member (no button)
  const renderMemberItem = ({ item }: { item: User }) => (
    <View style={styles.memberRow}>
      <Text style={styles.friendName}>{item.username}</Text>
    </View>
  );

  // Renders a row for a friend that can be added (with button)
  const renderFriendItem = ({ item }: { item: User }) => (
    <View style={styles.friendRow}>
      <Text style={styles.friendName}>{item.username}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addMember(item.id, item.username)}
      >
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal animationType="slide" visible={showModal}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Group Members</Text>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <Ionicons name="close-circle" size={30} color="#E53935" />
          </TouchableOpacity>
        </View>

        {/* --- UI SPLIT INTO TWO SECTIONS --- */}

        {/* Top half: Existing Members */}
        <View style={styles.listSection}>
          <Text style={styles.subHeading}>In The Group</Text>
          <FlatList
            data={existingMembers}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>
                This group is empty.
              </Text>
            }
          />
        </View>

        {/* Bottom half: Friends to Add */}
        <View style={styles.listSection}>
          <Text style={styles.subHeading}>Add Friends To Group</Text>
          <FlatList
            data={addableFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>
                All your friends are in this group.
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
  // Each list section now takes up half the available space
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
  // Style for the "Add" row
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
  // Style for the "Existing member" row
  memberRow: {
    flexDirection: "row",
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