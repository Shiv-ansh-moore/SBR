import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Groups {
  created_at: string;
  created_by: string | null;
  group_pic: string | null;
  id: number;
  name: string;
}

const ChatList = () => {
  const context = useContext(AuthContext);
  const [groups, setGroups] = useState<Groups[]>([]);
  const router = useRouter();

  // No changes needed to this function
  const fetchGroups = async () => {
    if (context.session?.user.id) {
      const { data, error } = await supabase
        .from("chat_members")
        .select("groups(*)")
        .eq("user_id", context.session.user.id);

      if (error) {
        console.error("Error fetching groups:", error);
        return;
      }

      if (data) {
        // Extract the 'groups' object from each item and filter out any potential null values
        const extractedGroups = data
          .map((item) => item.groups)
          .filter((group): group is Groups => group !== null);
        setGroups(extractedGroups);
      }
    }
  };

  useEffect(() => {
    // Perform the initial fetch when the component mounts
    fetchGroups();

    // Ensure user is logged in before attempting to subscribe
    if (!context.session?.user.id) return;
    supabase.realtime.setAuth(context.session?.access_token);
    // Set up the real-time subscription
    const channel = supabase
      .channel("chat_members_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT", // Listen only for new rows
          schema: "public",
          table: "chat_members",
          filter: `user_id=eq.${context.session.user.id}`, // Important: Only listen for changes related to the current user
        },
        (payload) => {
          console.log("New group membership detected!", payload);
          // When a change is detected, re-run the fetchGroups function to update the UI
          fetchGroups();
        }
      )
      .subscribe();

    // Cleanup function: Unsubscribe from the channel when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [context.session?.user.id]); // Re-run the effect if the user logs in or out

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              style={styles.groupContainer}
              onPress={() => {
                router.push({
                  pathname: `/(tabs)/(chats)/[id]`,
                  params: {
                    id: item.id,
                    name: item.name,
                    pic: item.group_pic,
                  },
                });
              }}
            >
              {item.group_pic ? (
                <Image style={styles.groupImage} source={item.group_pic} />
              ) : (
                <View style={[styles.groupImage, styles.placeholderContainer]}>
                  <FontAwesome name="group" size={24} color="white" />
                </View>
              )}
              <View>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.lastMessage}>Someone Sent</Text>
              </View>
              <View style={styles.lastMessageContainer}>
                <Text style={styles.timeOfLastMessage}>21:15</Text>
                <View style={styles.unreadMessageCount}>
                  <Text style={styles.timeOfLastMessage}>4</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default ChatList;

// --- Styles (no changes) ---
const styles = StyleSheet.create({
  container: { height: "85%" },
  groupContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
  },
  groupImage: { height: 50, width: 50, borderRadius: 25, marginRight: 10 },
  placeholderContainer: {
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 25,
    height: 50,
    width: 50,
    backgroundColor: "#171717",
    justifyContent: "center",
    alignItems: "center",
  },
  groupName: { fontFamily: "Light", fontSize: 16, color: "white" },
  lastMessage: { fontFamily: "Thin", fontSize: 13, color: "white" },
  lastMessageContainer: { marginLeft: "auto" },
  timeOfLastMessage: { fontFamily: "Bold", fontSize: 12, color: "#3ECF8E" },
  unreadMessageCount: {
    height: 20,
    width: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 10,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
});
