import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as Clipboard from "expo-clipboard";
import { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabaseClient";
import { AuthContext } from "../../providers/AuthProvider";

const UserNickNameBox = () => {
  const context = useContext(AuthContext);
  const [username, setUsername] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");

  const copyToClipboard = async () => {
    if (username) {
      await Clipboard.setStringAsync(username);
    }
  };

  useEffect(() => {
    const getNames = async () => {
      if (context.session?.user.id) {
        const { data, error } = await supabase
          .from("users")
          .select("username, nickname")
          .eq("id", context.session?.user.id);
        if (data && data.length > 0) {
          setNickname(data[0].nickname);
          setUsername(data[0].username);
        }
      }
    };
    getNames();
  }, []);
  return (
    <View style={styles.userNameNickName}>
      <View style={{ marginLeft: 8, marginRight: 8 }}>
        <Text
          style={[
            styles.userNameNickNameText,
            {
              color: "white",
              fontSize: 28,
            },
          ]}
        >
          {nickname}
        </Text>
        <TouchableOpacity onPress={copyToClipboard}>
          <View style={styles.usernameRow}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                styles.userNameNickNameText,
                styles.usernameText,
                {
                  color: "#3ECF8E",
                  fontSize: 20,
                },
              ]}
            >
              {username}
            </Text>
            <FontAwesome6 name="copy" size={20} color="#3ECF8E" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default UserNickNameBox;
const styles = StyleSheet.create({
  userNameNickName: {
    height: 100,
    width: 180,
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    justifyContent: "center",
  },
  userNameNickNameText: {
    fontFamily: "Medium",
    padding: 0,
    margin: 0,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  usernameText: {
    flexShrink: 1,
    marginRight: 4,
  },
});
