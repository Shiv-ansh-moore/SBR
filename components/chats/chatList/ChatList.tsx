import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import { useContext, useEffect, useState, useCallback } from "react";
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
  unread_count: number;
}

// NEW: Define the structure of the last message data we expect
interface LastMessage {
  created_at: string;
  message_type: string;
  users: { nickname: string } | null; // From the joined users table
}

// --- NEW: GroupListItem Component ---
// This component manages the state for a single group row
const GroupListItem = ({
  item,
  userId,
  onGroupUpdate, // 1. Accept the new callback prop
}: {
  item: Groups; // We still only need the basic Groups info to render
  userId: string;
  onGroupUpdate: (groupId: number, messageTimestamp: string) => void; // Define its type
}) => {
  const router = useRouter();
  const [lastMessage, setLastMessage] = useState<LastMessage | null>(null);
  const [unreadCount, setUnreadCount] = useState(item.unread_count);

  useEffect(() => {
    setUnreadCount(item.unread_count);
  }, [item.unread_count]);

  const fetchMostRecentMessage = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("created_at, message_type, users(nickname)")
      .eq("group_id", item.id)
      .limit(1)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error fetching last message for group ${item.id}:`, error);
      return;
    }

    if (data && data.length > 0) {
      setLastMessage(data[0] as LastMessage);
      // 2. Report the *real* last message time back to the parent
      onGroupUpdate(item.id, data[0].created_at);
    } else {
      setLastMessage(null); // No messages in this group
      // 3. Report the group's creation time as a fallback
      // This ensures it's sorted correctly relative to other empty groups
      onGroupUpdate(item.id, item.created_at);
    }
  };

  useEffect(() => {
    // This will run on mount, fetching the initial last message
    // and calling onGroupUpdate for the first time.
    fetchMostRecentMessage();

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
          // A new message arrived!
          const newMessage = payload.new as {
            user_id: string;
            created_at: string; // Get the timestamp directly from the payload
          };

          // 1. Re-fetch message details for the UI (like sender's nickname)
          fetchMostRecentMessage();

          // 2. *Immediately* tell the parent to re-sort
          // This is faster than waiting for the fetch above to complete
          onGroupUpdate(item.id, newMessage.created_at);

          // 3. Increment the unread count in the UI
          if (newMessage.user_id !== userId) {
            setUnreadCount((currentCount) => currentCount + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [item.id, userId, onGroupUpdate]);

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
        {/* 1. Conditionally style the time text */}
        <Text
          style={[
            styles.timeOfLastMessage,
            unreadCount === 0 && { color: "#888" }, // Apply grey color if unreadCount is 0
          ]}
        >
          {formatMessageTime()}
        </Text>

        {/* 2. Always render the bubble, but only show text if count > 0 */}
        <View style={styles.unreadMessageCount}>
          {unreadCount > 0 && (
            <Text style={styles.timeOfLastMessage}>{unreadCount}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- UPDATED: ChatList Component ---
// --- Interfaces ---
interface Groups {
  created_at: string;
  created_by: string | null;
  group_pic: string | null;
  id: number;
  name: string;
  unread_count: number;
}

// NEW: This interface will be used for our state
// It includes the original group data + the timestamp we need for sorting
interface GroupWithLastMessage extends Groups {
  last_message_at: string; // We'll use this for sorting
}

// ... (Keep LastMessage and GroupListItem component for now) ...

// --- UPDATED: ChatList Component ---
const ChatList = () => {
  const context = useContext(AuthContext);
  // 1. Change the state to use the new, richer interface
  const [groups, setGroups] = useState<GroupWithLastMessage[]>([]);

  // 2. Create a sorting function
  // We'll use useCallback to prevent re-creating this function on every render
  const sortGroups = (
    updatedGroups: GroupWithLastMessage[]
  ): GroupWithLastMessage[] => {
    return [...updatedGroups].sort((a, b) => {
      // Sort by last_message_at in descending order (newest first)
      return (
        new Date(b.last_message_at).getTime() -
        new Date(a.last_message_at).getTime()
      );
    });
  };

  // 3. Update fetchGroups to use the new state shape
  const fetchGroups = async () => {
    if (context.session?.user.id) {
      const { data, error } = await supabase.rpc(
        "get_groups_with_unread_counts",
        {
          p_user_id: context.session.user.id,
        }
      );

      if (error) {
        console.error("Error fetching groups with counts:", error);
        return;
      }

      if (data) {
        // Map the data from the RPC (Groups[]) to our new state (GroupWithLastMessage[])
        // We use the group's created_at as a *temporary* timestamp
        // The child component will send us the *real* last message time shortly.
        const initialGroups = data.map((group: Groups) => ({
          ...group,
          last_message_at: group.created_at, // Use as fallback for initial sort
        }));

        // Set the initial, sorted state
        setGroups(sortGroups(initialGroups));
      }
    }
  };

  // 4. Create a callback function to handle updates from children
  // This is the key to lifting state up.
  const handleGroupUpdate = useCallback(
    (groupId: number, messageTimestamp: string) => {
      setGroups((currentGroups) => {
        // Find the group and update its last_message_at timestamp
        const updatedGroups = currentGroups.map((group) =>
          group.id === groupId
            ? { ...group, last_message_at: messageTimestamp }
            : group
        );

        // Re-sort the entire list with the new information
        return sortGroups(updatedGroups);
      });
    },
    [] // This function never needs to change
  );

  // This useEffect (for fetching the *list* of groups) is unchanged
  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [context.session?.user.id])
  );

  // This useEffect (for real-time *group list* updates) is unchanged
  useEffect(() => {
    if (!context.session?.user.id) return;

    supabase.realtime.setAuth(context.session?.access_token);
    const channel = supabase
      .channel("chat_members_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_members",
          filter: `user_id=eq.${context.session.user.id}`,
        },
        (payload) => {
          fetchGroups(); // Re-fetch all groups
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
        data={groups} // This data is now always sorted
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          // 5. Pass the new callback function down as a prop
          <GroupListItem
            item={item}
            userId={context.session?.user.id || ""}
            onGroupUpdate={handleGroupUpdate}
          />
        )}
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
