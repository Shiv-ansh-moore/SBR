import { supabase } from "@/lib/supabaseClient";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image as RNImage, // 1. Alias RN Image for aspect ratio calculation
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image"; // 2. Import Expo Image

// 1. FIXED INTERFACE: Matches Progress.tsx exactly now
interface ProofItem {
  id: number;
  created_at: string;
  proof_media: string | null;
  signedUrl?: string | null;
  proof_type: string;
  task_title: string;
  goal_title: string;
  goal_id: number | null;
}

interface ProgressItemModalProps {
  isVisible: boolean;
  onClose: () => void;
  proofItem: ProofItem | null;
  onDelete: (id: number) => void;
}

const { width } = Dimensions.get("window");

const ProgressItemModal = ({
  isVisible,
  onClose,
  proofItem,
  onDelete,
}: ProgressItemModalProps) => {
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  // 2. FIXED: Use proofItem.signedUrl (camelCase)
  useEffect(() => {
    if (isVisible && proofItem?.signedUrl) {
      // Use RNImage solely for calculating dimensions
      RNImage.getSize(
        proofItem.signedUrl,
        (w, h) => {
          if (h > 0) setImageAspectRatio(w / h);
        },
        (err) => console.log("Failed to get image size", err)
      );
    }
  }, [isVisible, proofItem]);

  const handleDeletePress = () => {
    Alert.alert(
      "Delete Proof",
      "Are you sure you want to delete this proof? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDelete,
        },
      ]
    );
  };

  const performDelete = async () => {
    if (!proofItem) return;
    setIsDeleting(true);

    try {
      // 1. Delete image from Storage
      if (proofItem.proof_media) {
        await supabase.storage
          .from("proof-media")
          .remove([proofItem.proof_media]);
      }

      // 2. Delete record from DB
      const { error } = await supabase
        .from("proof_submission")
        .delete()
        .eq("id", proofItem.id);

      if (error) throw error;

      onDelete(proofItem.id);
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
      Alert.alert("Error", "Could not delete proof.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!proofItem) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Proof Details</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AntDesign name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Image Area */}
          <View style={styles.imageContainer}>
            {/* 3. Updated to Expo Image */}
            {proofItem.signedUrl ? (
              <Image
                source={proofItem.signedUrl}
                style={[
                  styles.proofImage,
                  { aspectRatio: imageAspectRatio > 0 ? imageAspectRatio : 1 },
                ]}
                contentFit="contain" // Replaces resizeMode="contain"
                transition={500}
              />
            ) : (
              <View style={styles.loaderContainer}>
                <Text style={{ color: "#888" }}>Image not available</Text>
              </View>
            )}
          </View>

          {/* Info & Actions */}
          <View style={styles.bottomContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.goalText}>{proofItem.goal_title}</Text>
              <Text style={styles.taskTitle}>{proofItem.task_title}</Text>
              <Text style={styles.timestamp}>
                {new Date(proofItem.created_at).toLocaleString()}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeletePress}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FF453A" />
                ) : (
                  <>
                    <MaterialIcons
                      name="delete-outline"
                      size={24}
                      color="#FF453A"
                    />
                    <Text style={styles.deleteText}>Delete Proof</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProgressItemModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width * 0.9,
    maxHeight: "85%",
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "SemiBold",
  },
  imageContainer: {
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: "hidden",
    minHeight: 200,
    justifyContent: "center",
    maxHeight: width * 1.2,
  },
  loaderContainer: {
    padding: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  proofImage: {
    width: "100%",
  },
  bottomContainer: {
    backgroundColor: "#171717",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    padding: 20,
  },
  infoRow: {
    marginBottom: 20,
  },
  goalText: {
    color: "#3ECF8E",
    fontSize: 12,
    fontFamily: "Bold",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontFamily: "Regular",
    color: "white",
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Light",
  },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 15,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 69, 58, 0.1)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteText: {
    color: "#FF453A",
    marginLeft: 8,
    fontFamily: "Medium",
    fontSize: 14,
  },
});