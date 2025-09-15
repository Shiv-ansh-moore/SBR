import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
// 1. Import useRef and add it to the React import
import { useContext, useEffect, useRef, useState } from "react";
// Make sure FlatList type is imported if you are using TypeScript with the ref
import { FlatList, StyleSheet, Text, View } from "react-native";
import TextMessageSentByMember from "./TextMessageSentByMember";
import TextMessageSentByYou from "./TextMessageSentByYou";

interface MessageViewProps {
  groupId: number;
}

interface UserProfile {
  nickname: string;
  profile_pic: string | null;
  username: string;
}

interface Message {
  id: number;
  created_at: string;
  message_type: string;
  message_content: { text: string };
  user_id: string;
  users: UserProfile;
}

const MessageView = ({ groupId }: MessageViewProps) => {
  const userId = useContext(AuthContext).session?.user.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const context = useContext(AuthContext);

  // 2. Create a ref for the FlatList
  const flatListRef = useRef<FlatList<Message>>(null);

  // The initial fetch function remains the same
  const FetchMessages = async () => {
    if (userId) {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          "id, created_at, message_type, message_content, user_id,users(nickname, profile_pic, username)"
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });
      if (error) {
        console.log("Error fetching messages:", error);
      }
      if (data) {
        setMessages(data as Message[]);
      }
    }
  };

  useEffect(() => {
    if (groupId) {
      FetchMessages();
    }
    supabase.realtime.setAuth(context.session?.access_token);
    const channel = supabase
      .channel(`chat-group-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          const { data: userData, error } = await supabase
            .from("users")
            .select("nickname, profile_pic, username")
            .eq("id", newMessage.user_id)
            .single();

          if (error) {
            console.error("Error fetching user for new message:", error);
            return;
          }

          if (userData) {
            const completeMessage: Message = {
              ...newMessage,
              users: userData,
            };
            setMessages((currentMessages) => [
              ...currentMessages,
              completeMessage,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  // 3. Add a new useEffect to scroll when the messages array changes
  useEffect(() => {
    // We check if there are messages to avoid scrolling on an empty list
    if (messages.length > 0) {
      // The optional chaining (?.) is a safeguard in case the ref isn't ready yet
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]); // This effect runs every time the 'messages' state updates

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        // 4. Attach the ref to the FlatList component
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          return item.message_type === "text" ? (
            item.user_id === userId ? (
              <TextMessageSentByYou message={item.message_content?.text} />
            ) : (
              <TextMessageSentByMember
                message={item.message_content?.text}
                created_at={item.created_at}
                nickname={item.users.nickname}
                profile_pic={item.users.profile_pic}
              />
            )
          ) : (
            <Text>different message</Text>
          );
        }}
      />
    </View>
  );
};

export default MessageView;

const styles = StyleSheet.create({});
