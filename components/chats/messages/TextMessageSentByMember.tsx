// TextMessageSentByMember.tsx

import { supabase } from "@/lib/supabaseClient";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
// --- ADD ---
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

// --- MODIFY ---: Add new props to the interface
interface TextMessageSentByMemberProps {
  message: string;
  nickname: string;
  profile_pic: string | null;
  created_at: string;
  userId: string; // <-- Add this
  onProfilePicPress: ( // <-- Add this
    userId: string,
    nickname: string,
    profilePicPath: string | null
  ) => void;
}
const TextMessageSentByMember = ({
  message,
  profile_pic,
  nickname,
  // --- ADD ---: Destructure new props
  userId,
  onProfilePicPress,
}: TextMessageSentByMemberProps) => { // --- MODIFY ---
  const [profilePicUrl, setProfilePicUrl] = useState<string>();

  const getProfilePic = () => {
    if (profile_pic) {
      const { data: urlData } = supabase.storage
        .from("profilepic")
        .getPublicUrl(profile_pic);
      setProfilePicUrl(urlData.publicUrl);
    }
  };

  useEffect(() => {
    getProfilePic();
  }, [profile_pic]); // --- MODIFY ---: Add dependency

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onProfilePicPress(userId, nickname, profile_pic)}
      >
        <Image style={styles.profilePic} source={profilePicUrl} />
      </TouchableOpacity>
      <View style={styles.textBox}>
        <Text style={styles.nickName}>{`~\u2009${nickname}`}</Text>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </View>
  );
};
export default TextMessageSentByMember;
const styles = StyleSheet.create({
// ... (no changes to styles)
  container: {
    flexDirection: "row",
    maxWidth: "70%",
    marginTop: 10,
    marginLeft: 10,
  },
  profilePic: { height: 35, width: 35, borderRadius: 20, marginRight: 5 },
  nickName: { fontFamily: "Medium", fontSize: 13, color: "#CF6A3E" },
  textBox: {
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    backgroundColor: "#242424",
    borderTopLeftRadius: 0,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
    paddingTop: 5,
  },
  messageText: { fontFamily: "Regular", fontSize: 10, color: "white" },
});