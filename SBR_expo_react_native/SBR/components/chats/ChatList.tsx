import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
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

  const fetchGroups = async () => {
    if (context.session?.user.id) {
      const { data, error } = await supabase
        .from("chat_members")
        .select("groups(*)")
        .eq("user_id", context.session.user.id);
      if (data) {
        const extractedGroups = data.map((item) => item.groups);
        setGroups(extractedGroups);
      }
    }
  };
  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <View>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={(item) => {
          return (
            <TouchableOpacity style={styles.groupContainer}>
              {/* --- MODIFICATION START --- */}
              {item.item.group_pic ? (
                <Image style={styles.groupImage} source={item.item.group_pic} />
              ) : (
                <View style={[styles.groupImage, styles.placeholderContainer]}>
                  <FontAwesome name="group" size={24} color="white" />
                </View>
              )}
              {/* --- MODIFICATION END --- */}
              <View>
                <Text style={styles.groupName}>{item.item.name}</Text>
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
const styles = StyleSheet.create({
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
