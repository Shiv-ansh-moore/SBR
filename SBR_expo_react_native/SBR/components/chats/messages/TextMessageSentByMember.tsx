import { supabase } from "@/lib/supabaseClient";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface TextMessageSentByMember {
  message: string;
  nickname: string;
  profile_pic: string | null;
  created_at: string;
}
const TextMessageSentByMember = ({
  message,
  profile_pic,
  nickname,
}: TextMessageSentByMember) => {
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
  }, []);

  return (
    <View style={styles.container}>
      <Image style={styles.profilePic} source={profilePicUrl} />
      <View style={styles.textBox}>
        <Text style={styles.nickName}>{`~\u2009${nickname}`}</Text>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </View>
  );
};
export default TextMessageSentByMember;
const styles = StyleSheet.create({
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
