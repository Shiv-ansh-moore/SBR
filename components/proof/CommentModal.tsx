import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import CommentItem from "../proof/CommentItem"
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "react-native";

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

const CommentModal = ({
  isVisible,
  onClose,
  proofId,
  onCommentAdded,
}: CommentModalProps) => {
  const { session } = useContext(AuthContext);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      fetchComments();
    }
  }, [isVisible, proofId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("proof_comments")
      .select(`
        id,
        content,
        created_at,
        users (
          nickname,
          profile_pic
        )
      `)
      .eq("proof_id", proofId)
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else setComments(data as any);
    setLoading(false);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !session?.user.id) return;

    setSubmitting(true);
    const { error } = await supabase.from("proof_comments").insert({
      proof_id: proofId,
      user_id: session.user.id,
      content: newComment.trim(),
    });

    if (error) {
      console.error("Error posting comment:", error);
    } else {
      setNewComment("");
      fetchComments();
      onCommentAdded();
    }
    setSubmitting(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      {/* ✅ FIX 2: KeyboardAvoidingView Adjustments 
         1. behavior="padding" works best on iOS.
         2. On Android, often 'undefined' is better inside Modals (letting the OS pan the window).
         3. keyboardVerticalOffset prevents the keyboard from covering the input on iOS.
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Adjust this number if still covered (e.g., 20 or 50)
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* List */}
          {loading ? (
            <ActivityIndicator size="large" color="#3ECF8E" style={{ flex: 1 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              // Use the external component here
              renderItem={({ item }) => <CommentItem item={item} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
              }
            />
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor="#888"
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              onPress={handleSendComment}
              disabled={submitting || !newComment.trim()}
              style={styles.sendButton}
            >
              {submitting ? (
                <ActivityIndicator color="#3ECF8E" />
              ) : (
                <Ionicons
                  name="send"
                  size={24}
                  color={newComment.trim() ? "#3ECF8E" : "#555"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CommentModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end", // Pushes content to bottom
  },
  modalContainer: {
    backgroundColor: "#171717",
    height: "80%", // Takes up bottom 80%
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    overflow: "hidden", // Ensures content stays within rounded corners
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "SemiBold",
  },
  closeButton: {
    position: "absolute",
    right: 15,
  },
  listContent: {
    padding: 15,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 15,
  },
  commentAvatar: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#333",
  },
  commentAvatarPlaceholder: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#333",
  },
  commentTextContainer: {
    flex: 1,
    backgroundColor: "#242424",
    padding: 10,
    borderRadius: 12,
    borderTopLeftRadius: 2,
  },
  commentUser: {
    color: "#3ECF8E",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
  },
  commentContent: {
    color: "white",
    fontSize: 14,
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
    backgroundColor: "#171717",
    // Important for iOS safe area if modal goes to very bottom
    paddingBottom: Platform.OS === "ios" ? 30 : 10, 
  },
  input: {
    flex: 1,
    backgroundColor: "#242424",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "white",
    marginRight: 10,
    maxHeight: 100, // Limits input height
  },
  sendButton: {
    padding: 5,
  },
});