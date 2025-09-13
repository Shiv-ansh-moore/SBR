import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { useContext, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";
import FriendProofOverView from "./FriendProofOverView";

interface Friend {
  id: string;
  username: string;
}

const FriendProofOverViewList = () => {
  const userId = useContext(AuthContext).session?.user.id;
  const [friends, setFriends] = useState<Friend[] | undefined>(undefined); // Initialize as undefined for a clear loading state

  useEffect(() => {
    const fetchFriends = async () => {
      // Ensure userId exists before fetching
      if (!userId) return;

      const { data, error } = await supabase
        .from("friends")
        .select(
          `
         status,
         user1:users!friends_user1_id_fkey(id,username),
         user2:users!friends_user2_id_fkey(id,username)
         `
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq("status", "accepted");

      if (error) {
        console.error("Error fetching confirmed friends:", error);
        setFriends([]); // Set to empty array on error
        return;
      }

      if (data) {
        const formattedFriends: Friend[] = data.map((friendship) => {
          // Identify which user is the friend by comparing IDs
          const friend =
            friendship.user1.id === userId ? friendship.user2 : friendship.user1;
          return friend;
        });

        setFriends(formattedFriends);
      }
    };

    fetchFriends();
  }, [userId]);

  // Render a loading indicator while friends are being fetched
  if (friends === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={friends}
      renderItem={({ item }) => <FriendProofOverView friendId={item.id} />}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text>You haven't added any friends yet.</Text>
        </View>
      }
      contentContainerStyle={styles.listContainer}
    />
  );
};

export default FriendProofOverViewList;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
});