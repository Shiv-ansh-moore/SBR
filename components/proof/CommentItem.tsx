import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { StyleSheet } from "react-native";

interface Comment {
  id: number;
  content: string;
  created_at: string;
  users: {
    nickname: string;
    profile_pic: string | null;
  };
}

interface CommentModalProps {
  isVisible: boolean;
  onClose: () => void;
  proofId: number;
  onCommentAdded: () => void;
}

// ---------------------------------------------------------
// ✅ FIX 1: Extract this to a separate component OUTSIDE
// ---------------------------------------------------------
const CommentItem = ({ item }: { item: Comment }) => {
  const [picUrl, setPicUrl] = useState<string | null>(null);

  useEffect(() => {
    if (item.users.profile_pic) {
      const { data } = supabase.storage
        .from("profilepic")
        .getPublicUrl(item.users.profile_pic);
      setPicUrl(data.publicUrl);
    }
  }, [item.users.profile_pic]);

  return (
    <View style={styles.commentItem}>
      {picUrl ? (
        <Image source={{ uri: picUrl }} style={styles.commentAvatar} />
      ) : (
        <View style={styles.commentAvatarPlaceholder} />
      )}
      <View style={styles.commentTextContainer}>
        <Text style={styles.commentUser}>{item.users.nickname}</Text>
        <Text style={styles.commentContent}>{item.content}</Text>
      </View>
    </View>
  );
};

export default CommentItem;

const styles = StyleSheet.create({
  commentItem: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "flex-start", // Ensures avatar stays at top if comment is long
  },
  commentAvatar: {
    width: 35,
    height: 35,
    borderRadius: 20, // Circular
    marginRight: 10,
    backgroundColor: "#333", // Fallback background
  },
  commentAvatarPlaceholder: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#333", // Dark grey placeholder
  },
  commentTextContainer: {
    flex: 1, // Takes up remaining width
    backgroundColor: "#242424", // The 'Card' color used in your app
    padding: 10,
    borderRadius: 12,
    borderTopLeftRadius: 2, // Creates a subtle "Speech Bubble" effect pointing to avatar
  },
  commentUser: {
    color: "#3ECF8E", // Your App's Green Accent
    fontSize: 13,
    fontFamily: "SemiBold", // Assuming you are using your custom font
    marginBottom: 2,
  },
  commentContent: {
    color: "white",
    fontSize: 14,
    fontFamily: "Regular", // Assuming you are using your custom font
    lineHeight: 20, // Improves readability for multi-line comments
  },
});
