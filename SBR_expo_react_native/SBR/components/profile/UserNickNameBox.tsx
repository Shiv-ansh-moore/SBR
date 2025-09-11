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
    // Guard Clause: Exit early if there's no session or user.
    if (!context.session?.user) {
      return;
    }

    // Now TypeScript knows context.session.user exists.
    const userId = context.session.user.id;

    // 1. Fetch initial user data
    const getNames = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("username, nickname")
        .eq("id", userId) // Use the safe userId variable
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      if (data) {
        setNickname(data.nickname);
        setUsername(data.username);
      }
    };
    getNames();

    // 2. Set up the real-time subscription
    //bug fix
    supabase.realtime.setAuth(context.session?.access_token);
    const channel = supabase
      .channel("public:users")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`, // Use the safe userId variable
        },
        (payload) => {
          // 3. When a change is received, update the state
          const updatedUser = payload.new;
          if (updatedUser) {
            setNickname(updatedUser.nickname);
            setUsername(updatedUser.username);
          }
        }
      )
      .subscribe();

    // 4. Cleanup function to remove the subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [context.session?.user.id]); // The dependency array is correct if the user ID changes

  return (
    <View style={styles.userNameNickName}>
      <View style={{ marginLeft: 8, marginRight: 8 }}>
        {/* NICKNAME TEXT MODIFICATION */}
        <Text
          style={[
            styles.userNameNickNameText,
            {
              color: "white",
              fontSize: 28,
            },
          ]}
          // Add these two props
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {nickname}
        </Text>
        <TouchableOpacity onPress={copyToClipboard}>
          <View style={styles.usernameRow}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
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
    width: "100%",
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