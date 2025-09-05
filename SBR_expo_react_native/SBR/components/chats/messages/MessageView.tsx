import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { useContext, useEffect, useState } from "react";
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
        console.log(error);
      }
      if (data) {
        setMessages(data as Message[]);
        console.log(data);
      }
    }
  };

  useEffect(() => {
    FetchMessages();
  }, [groupId]);

  return (
    <View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={(item) => {
          return item.item.message_type === "text" ? (
            item.item.user_id === userId ? (
              <TextMessageSentByYou message={item.item.message_content?.text} />
            ) : (
              <TextMessageSentByMember
                message={item.item.message_content?.text}
                created_at={item.item.created_at}
                nickname={item.item.users.nickname}
                profile_pic={item.item.users.profile_pic}
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
