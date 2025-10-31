// MessageView.tsx

import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { useContext, useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import TextMessageSentByMember from "./TextMessageSentByMember";
import TextMessageSentByYou from "./TextMessageSentByYou";
import ProofMessage from "./ProofMessage";

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
  message_content: { text: string } | null; // <-- ALLOW NULL
  user_id: string;
  proof_id: number | null; // <-- ALLOW NULL
  users: UserProfile;
}

const MessageView = ({ groupId }: MessageViewProps) => {
  const PAGE_SIZE = 30;
  const userId = useContext(AuthContext).session?.user.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const context = useContext(AuthContext);

  const [loading, setLoading] = useState(false); // To prevent multiple fetches
  const [loadingOlder, setLoadingOlder] = useState(false); // For pagination spinner
  const [page, setPage] = useState(0); // To track current page
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false); // To stop fetching

  const flatListRef = useRef<FlatList<Message>>(null);

  const FetchMessages = async () => {
    if (userId) {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          "id, created_at, message_type, message_content, user_id,users(nickname, profile_pic, username), proof_id"
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);
      if (error) {
        console.log("Error fetching messages:", error);
      }
      if (data) {
        setMessages(data as Message[]); // This cast is correct
        setPage(1);
        if (data.length < PAGE_SIZE) {
          setAllMessagesLoaded(true); // No more messages to load
        }
      }
    }
  };

  const loadOlderMessages = async () => {
    // Prevent fetching if already loading or all messages are loaded
    if (loadingOlder || allMessagesLoaded || !userId) return;

    setLoadingOlder(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("chat_messages")
      .select(
        "id, created_at, message_type, message_content, user_id,users(nickname, profile_pic, username), proof_id"
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: false }) // Keep the same order
      .range(from, to); // Fetch the next page

    if (error) {
      console.error("Error fetching older messages:", error);
    }
    if (data) {
      if (data.length < PAGE_SIZE) {
        setAllMessagesLoaded(true); // This was the last page
      }

      // Add the new (older) messages to the end of the existing array
      // *** FIX 1: Cast data to Message[] to resolve the 'Json' type error ***
      setMessages((currentMessages) => [
        ...currentMessages,
        ...(data as Message[]),
      ]);
      setPage((prevPage) => prevPage + 1);
    }
    setLoadingOlder(false);
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
          console.log(payload)
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
              completeMessage,
              ...currentMessages,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        inverted // <-- ADD THIS
        onEndReached={loadOlderMessages} // <-- ADD THIS
        onEndReachedThreshold={0.5} // <-- ADD THIS (triggers at 50% from the end)
        ListFooterComponent={() =>
          // This will appear at the "top" of the inverted list
          loadingOlder ? (
            <ActivityIndicator size="small" style={{ margin: 10 }} />
          ) : null
        }
        renderItem={({ item }) => {
          return item.message_type === "text" ? (
            item.user_id === userId ? (
              // *** FIX 2: Add '|| ""' to handle the 'undefined' case ***
              <TextMessageSentByYou message={item.message_content?.text || ""} />
            ) : (
              // *** FIX 3: Add '|| ""' to handle the 'undefined' case ***
              <TextMessageSentByMember
                message={item.message_content?.text || ""}
                created_at={item.created_at}
                nickname={item.users.nickname}
                profile_pic={item.users.profile_pic}
              />
            )
          ) : // MODIFICATION: Only render ProofMessage if proof_id is not null
          item.proof_id ? (
            <ProofMessage
              proofId={item.proof_id} // TS now knows this is a number
              currentUserId={userId}
              senderId={item.user_id}
            />
          ) : null; // Don't render anything if it's not text and has no proof_id
        }}
      />
    </View>
  );
};

export default MessageView;

const styles = StyleSheet.create({});