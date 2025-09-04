import { Json } from "@/database.types";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface MessageViewProps {
  groupId: number;
}

interface Message {
  id: number;
  created_at: string;
  message_type: string;
  message_content: Json;
}

const MessageView = ({ groupId }: MessageViewProps) => {
  const userId = useContext(AuthContext).session?.user.id;
  const [messages, setMessages] = useState<Message[]>([]);

  const FetchMessages = async () => {
    if (userId) {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, created_at, message_type, message_content")
        .eq("group_id", groupId);
      if (error) {
        console.log(error);
      }
      if (data) {
        setMessages(data);
      }
    }
  };

  useEffect(() => {
    FetchMessages();
  }, []);
  return (
    <View>
      <Text>MessageView</Text>
    </View>
  );
};
export default MessageView;
const styles = StyleSheet.create({});
