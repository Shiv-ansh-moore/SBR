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

// --- Interfaces ---
interface Groups {
  created_at: string;
  created_by: string | null;
  group_pic: string | null;
  id: number;
  name: string;
}

// NEW: Define the structure of the last message data we expect
interface LastMessage {
  created_at: string;
  message_type: string;
  users: { nickname: string } | null; // From the joined users table
}

// --- NEW: GroupListItem Component ---
// This component manages the state for a single group row
const GroupListItem = ({ item }: { item: Groups }) => {
  const router = useRouter();
  const [lastMessage, setLastMessage] = useState<LastMessage | null>(null);

  // This function now fetches the last message for *this* group
  const fetchMostRecentMessage = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("created_at, message_type, users(nickname)") // Select nickname from joined users
      .eq("group_id", item.id)
      .limit(1)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error fetching last message for group ${item.id}:`, error);
      return;
    }

    if (data && data.length > 0) {
      setLastMessage(data[0] as LastMessage);
    } else {
      setLastMessage(null); // No messages in this group yet
    }
  };

  // This useEffect handles both initial fetch and real-time updates
  useEffect(() => {
    // 1. Fetch the last message when the component mounts
    fetchMostRecentMessage();

    // 2. Set up real-time subscription for NEW messages in THIS group
    const channel = supabase
      .channel(`group_messages_${item.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `group_id=eq.${item.id}`,
        },
        (payload) => {
          // New message arrived! Re-fetch to get the latest.
          // This is simpler and ensures we get the joined user data.
          fetchMostRecentMessage();
        }
      )
      .subscribe();

    // 3. Cleanup function: Unsubscribe from the channel when unmounting
    return () => {
      supabase.removeChannel(channel);
    };
  }, [item.id]); // Re-run if the group ID changes

  // --- Helper functions for rendering ---
  const formatMessageText = () => {
    if (!lastMessage) {
      return "No messages yet";
    }
    // Use nickname if available, otherwise "Someone"
    const sender = lastMessage.users?.nickname || "Someone";

    // Handle different message types
    const action =
      lastMessage.message_type === "text"
        ? "sent a message"
        : `sent an ${lastMessage.message_type}`; // e.g., "sent an image"

    return `${sender} ${action}`;
  };

  const formatMessageTime = () => {
    if (!lastMessage) {
      return ""; // No time if no message
    }
    try {
      // Format to HH:MM (e.g., 21:15)
      return new Date(lastMessage.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return "??:??";
    }
  };

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
      {/* Group Image / Placeholder */}
      {item.group_pic ? (
        <Image style={styles.groupImage} source={item.group_pic} />
      ) : (
        <View style={[styles.groupImage, styles.placeholderContainer]}>
          <FontAwesome name="group" size={24} color="white" />
        </View>
      )}

      {/* Group Name & Last Message */}
      <View>
        <Text style={styles.groupName}>{item.name}</Text>
        {/* Use the dynamic message text */}
        <Text style={styles.lastMessage}>{formatMessageText()}</Text>
      </View>

      {/* Time & Unread Count */}
      <View style={styles.lastMessageContainer}>
        {/* Use the dynamic message time */}
        <Text style={styles.timeOfLastMessage}>{formatMessageTime()}</Text>
        {/* Note: Unread count logic is not implemented yet */}
        <View style={styles.unreadMessageCount}>
          {/* <Text style={styles.timeOfLastMessage}>4</Text> */}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- UPDATED: ChatList Component ---
const ChatList = () => {
  const context = useContext(AuthContext);
  const [groups, setGroups] = useState<Groups[]>([]);
  // router is no longer needed here

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
        const extractedGroups = data
          .map((item) => item.groups)
          .filter((group): group is Groups => group !== null);
        setGroups(extractedGroups);
      }
    }
  };

  // REMOVED fetchMostRecentMessage (moved into GroupListItem)

  // This useEffect (for fetching the *list* of groups) is unchanged
  useEffect(() => {
    fetchGroups();

    if (!context.session?.user.id) return;
    supabase.realtime.setAuth(context.session?.access_token);
    
    const channel = supabase
      .channel("chat_members_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_members",
          filter: `user_id=eq.${context.session.user.id}`,
        },
        (payload) => {
          console.log("New group membership detected!", payload);
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [context.session?.user.id]);

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        // Use the new GroupListItem component for rendering
        renderItem={({ item }) => <GroupListItem item={item} />}
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