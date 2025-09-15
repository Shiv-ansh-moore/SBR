// components/social/FriendDetailModal.js
import { supabase } from "@/lib/supabaseClient";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FriendProof from "./FriendProof"; // Assuming FriendProof is in the same folder

// --- Interfaces ---
interface ProofWithDetails {
  id: number;
  created_at: string;
  proof_media: string;
  note: string;
  task_title: string;
  task_owner_id: string;
  profile_pic: string;
  nickname: string;
}

interface IncompleteTask {
  id: number;
  title: string;
  due_date: string | null;
}

interface ProofOverview {
  profile_pic: string;
  nickname: string;
}

interface FriendDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  friendId: string;
  initialOverview: ProofOverview | null;
  profilePicLink: string | null;
}

// --- Component ---
const FriendDetailModal = ({
  isVisible,
  onClose,
  friendId,
  initialOverview,
  profilePicLink,
}: FriendDetailModalProps) => {
  const [proofs, setProofs] = useState<ProofWithDetails[]>([]);
  const [tasks, setTasks] = useState<IncompleteTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);

      // Fetch recent proofs and incomplete tasks in parallel
      const [proofsResponse, tasksResponse] = await Promise.all([
        supabase.rpc("get_user_proofs_last_24_hours", { p_user_id: friendId }),
        supabase.rpc("get_user_incomplete_tasks", { p_user_id: friendId }),
      ]);

      if (proofsResponse.error) {
        console.error("Error fetching recent proofs:", proofsResponse.error);
      } else {
        setProofs(proofsResponse.data || []);
      }

      if (tasksResponse.error) {
        console.error("Error fetching incomplete tasks:", tasksResponse.error);
      } else {
        setTasks(tasksResponse.data || []);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [isVisible, friendId]);

  const renderTaskItem = ({ item }: { item: IncompleteTask }) => (
    <View style={styles.taskItemContainer}>
      <Text style={styles.bulletPoint}>•</Text>
      <Text style={styles.taskItemText}>{item.title}</Text>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* --- Header --- */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              {profilePicLink && (
                <Image
                  source={{ uri: profilePicLink }}
                  style={styles.profilePic}
                />
              )}
              <Text style={styles.nicknameText}>{initialOverview?.nickname}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color="#555" />
            </TouchableOpacity>
          </View>

          {/* --- Content --- */}
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#3ECF8E"
              style={{ marginTop: 50 }}
            />
          ) : (
            <>
              {/* Recent Proofs Section */}
              <View style={styles.proofsSection}>
                <Text style={styles.sectionTitle}>Recent Proofs (24h)</Text>
                <FlatList
                  data={proofs}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => <FriendProof proof={item} />}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      No proofs submitted today.
                    </Text>
                  }
                />
              </View>

              {/* Incomplete Tasks Section */}
              <View style={styles.tasksSection}>
                <Text style={styles.sectionTitle}>Tasks ToDo</Text>
                <FlatList
                  data={tasks}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderTaskItem}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      No tasks left to do! 🎉
                    </Text>
                  }
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default FriendDetailModal;

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "100%",
    backgroundColor: "#171717",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  nicknameText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Bold",
  },
  closeButton: {
    padding: 5,
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "SemiBold",
    marginTop: 15,
    marginBottom: 5,
    marginLeft: 15,
  },
  proofsSection: {
    flex: 3, // Takes up 3 parts of the available space
  },
  tasksSection: {
    flex: 1, // Takes up 1 part of the available space
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Regular",
  },
  taskItemContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 6,
    width: "90%",
    alignSelf: "center",
  },
  bulletPoint: {
    color: "white",
    fontSize: 16,
    fontFamily: "Light",
    marginRight: 8,
    lineHeight: 22,
  },
  taskItemText: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontFamily: "Light",
    lineHeight: 22,
  },
});