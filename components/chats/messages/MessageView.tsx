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
  AppState, // <-- 1. IMPORT APPSTATE
  AppStateStatus,
} from "react-native";
import TextMessageSentByMember from "./TextMessageSentByMember";
import TextMessageSentByYou from "./TextMessageSentByYou";
import ProofMessage from "./ProofMessage";
import FriendDetailModal from "@/components/proof/FriendDetailModal";

interface MessageViewProps {
  groupId: number;
}

interface UserProfile {
  nickname: string;
  profile_pic: string | null;
  username: string;
}

interface ProofOverview {
  profile_pic: string;
  nickname: string;
}

interface Message {
  id: number;
  created_at: string;
  message_type: string;
  message_content: { text: string } | null;
  user_id: string;
  proof_id: number | null;
  users: UserProfile;
}

const MessageView = ({ groupId }: MessageViewProps) => {
  const PAGE_SIZE = 30;
  const userId = useContext(AuthContext).session?.user.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const context = useContext(AuthContext);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [page, setPage] = useState(0);
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
  const appState = useRef(AppState.currentState);
  const flatListRef = useRef<FlatList<Message>>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedFriendOverview, setSelectedFriendOverview] =
    useState<ProofOverview | null>(null);
  const [selectedFriendPicUrl, setSelectedFriendPicUrl] = useState<
    string | null
  >(null);

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
        setMessages(data as Message[]);
        setPage(1);
        if (data.length < PAGE_SIZE) {
          setAllMessagesLoaded(true);
        }
      }
    }
  };
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App has come to the foreground - Refreshing messages");
        FetchMessages();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [groupId, userId]);

  const loadOlderMessages = async () => {
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
        setAllMessagesLoaded(true);
      }
      setMessages((currentMessages) => [
        ...currentMessages,
        ...(data as Message[]),
      ]);
      setPage((prevPage) => prevPage + 1);
    }
    setLoadingOlder(false);
  };

  const handleProfilePicPress = (
    userId: string,
    nickname: string,
    profilePicPath: string | null
  ) => {
    setSelectedFriendId(userId);
    setSelectedFriendOverview({
      nickname: nickname,
      profile_pic: profilePicPath || "",
    });

    if (profilePicPath) {
      const { data: urlData } = supabase.storage
        .from("profilepic")
        .getPublicUrl(profilePicPath);
      setSelectedFriendPicUrl(urlData.publicUrl);
    } else {
      setSelectedFriendPicUrl(null);
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedFriendId(null);
    setSelectedFriendOverview(null);
    setSelectedFriendPicUrl(null);
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
        inverted
        onEndReached={loadOlderMessages}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          loadingOlder ? (
            <ActivityIndicator size="small" style={{ margin: 10 }} />
          ) : null
        }
        renderItem={({ item }) => {
          return item.message_type === "text" ? (
            item.user_id === userId ? (
              // *** FIX 2: Add '|| ""' to handle the 'undefined' case ***
              <TextMessageSentByYou
                message={item.message_content?.text || ""}
              />
            ) : (
              // *** FIX 3: Add '|| ""' to handle the 'undefined' case ***
              <TextMessageSentByMember
                message={item.message_content?.text || ""}
                created_at={item.created_at}
                nickname={item.users.nickname}
                profile_pic={item.users.profile_pic}
                userId={item.user_id} // <-- Pass user ID
                onProfilePicPress={handleProfilePicPress}
              />
            )
          ) : // MODIFICATION: Only render ProofMessage if proof_id is not null
          item.proof_id ? (
            <ProofMessage
              proofId={item.proof_id} // TS now knows this is a number
              currentUserId={userId}
              senderId={item.user_id}
              onProfilePicPress={handleProfilePicPress} // <-- ADD THIS LINE
            />
          ) : null; // Don't render anything if it's not text and has no proof_id
        }}
      />
      {selectedFriendId && (
        <FriendDetailModal
          isVisible={modalVisible}
          onClose={handleCloseModal}
          friendId={selectedFriendId}
          initialOverview={selectedFriendOverview}
          profilePicLink={selectedFriendPicUrl}
        />
      )}
    </View>
  );
};

export default MessageView;

const styles = StyleSheet.create({});
