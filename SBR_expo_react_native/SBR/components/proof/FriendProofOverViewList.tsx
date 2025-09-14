import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FriendProofOverView from "./FriendProofOverView";

// --- ✨ Add an optional property for the placeholder ---
interface Friend {
  id: string;
  username: string;
  isPlaceholder?: boolean;
}

const FriendProofOverViewList = () => {
  const userId = useContext(AuthContext).session?.user.id;
  const [friends, setFriends] = useState<Friend[] | undefined>(undefined);

  useEffect(() => {
    const fetchFriends = async () => {
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
        setFriends([]);
        return;
      }

      if (data) {
        const formattedFriends: Friend[] = data.map((friendship) => {
          const friend =
            friendship.user1.id === userId
              ? friendship.user2
              : friendship.user1;
          return friend;
        });

        // --- ✨ Logic to add a placeholder item for an odd number of friends ---
        if (formattedFriends.length % 2 !== 0) {
          formattedFriends.push({
            id: "placeholder",
            isPlaceholder: true,
            username: "",
          });
        }

        setFriends(formattedFriends);
      }
    };

    fetchFriends();
  }, [userId]);

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
      // --- ✨ Conditionally render a placeholder or the real component ---
      renderItem={({ item }) => {
        if (item.isPlaceholder) {
          // This empty view acts as the placeholder.
          // Its style must match the `flex` and `margin` of the real item's container.
          return <View style={styles.emptyItem} />;
        }
        return <FriendProofOverView friendId={item.id} />;
      }}
      keyExtractor={(item) => item.id}
      numColumns={2}
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
    paddingHorizontal: 8,
    marginTop: 20,
  },
  emptyItem: {
    flex: 1,
    margin: 8,
  },
});
