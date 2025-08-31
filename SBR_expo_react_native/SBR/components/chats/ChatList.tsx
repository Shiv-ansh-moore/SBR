import { supabase } from "@/lib/supabaseClient";
import { StyleSheet, Text, View } from "react-native";
const ChatList = () => {
  const fetchChats = async () => {
    const { data, error } = await supabase.from("groups").select("*");
  };
  return (
    <View>
      <Text>ChatList</Text>
    </View>
  );
};
export default ChatList;
const styles = StyleSheet.create({});
