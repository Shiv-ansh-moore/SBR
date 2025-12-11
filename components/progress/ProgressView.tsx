import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ProgressItem from "./ProgressItem";
import ProgressItemModal from "./ProgressItemModal";
import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";

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

interface Goal {
  id: number;
  title: string;
}

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 60) / 2;
const PAGE_SIZE = 6;

const Progress = () => {
  const context = useContext(AuthContext);
  const userId = context.session?.user.id;

  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedProof, setSelectedProof] = useState<ProofItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Filter & Sort
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [sortAscending, setSortAscending] = useState<boolean>(false);

  // Pagination
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 1. Fetch Goals
  useEffect(() => {
    const fetchGoals = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("goals")
        .select("id, title")
        .eq("user_id", userId);
      if (data) setGoals(data);
    };
    fetchGoals();
  }, [userId]);

  // 2. Main Fetch Function
  const fetchProofs = async (currentOffset: number, isReset: boolean) => {
    if (!userId) return;
    if (!isReset && (!hasMore || loadingMore)) return;

    if (isReset) {
      setLoading(true);
      setProofs([]); 
    } else {
      setLoadingMore(true);
    }

    const { data: rawData, error } = await supabase.rpc("get_user_proofs_for_progress", {
      p_user_id: userId,
      p_goal_id: selectedGoalId ?? undefined,
      p_sort_asc: sortAscending,
      p_limit: PAGE_SIZE,
      p_offset: currentOffset,
    });

    if (error) {
      console.error("Error fetching proofs:", error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (rawData && rawData.length > 0) {
      // Client-Side Batch Signing
      const pathsToSign = rawData
        .map((p: ProofItem) => p.proof_media)
        .filter((path: string | null): path is string => !!path);

      let signedMap: Record<string, string> = {};

      if (pathsToSign.length > 0) {
        const { data: signedData } = await supabase.storage
          .from("proof-media")
          .createSignedUrls(pathsToSign, 3600);
        
        if (signedData) {
          signedData.forEach((item) => {
            if (item.path && item.signedUrl) {
              signedMap[item.path] = item.signedUrl;
            }
          });
        }
      }

      const proofsWithUrls = rawData.map((item: ProofItem) => ({
        ...item,
        signedUrl: item.proof_media ? signedMap[item.proof_media] : null,
      }));

      if (isReset) {
        setProofs(proofsWithUrls);
      } else {
        setProofs((prev) => [...prev, ...proofsWithUrls]);
      }
      setHasMore(rawData.length === PAGE_SIZE);
    } else if (isReset) {
      setProofs([]);
      setHasMore(false);
    }

    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  };

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchProofs(0, true);
  }, [userId, selectedGoalId, sortAscending]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchProofs(newOffset, false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setOffset(0);
    setHasMore(true);
    fetchProofs(0, true);
  };

  // --- OPTIMIZED RENDER FUNCTIONS (Fixes the bugs) ---

  // 1. Fixes "Filter gets stuck"
  const renderHeader = useCallback(() => (
    <View>
      <Text style={styles.headerTitle}>Progress Gallery</Text>
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortAscending(!sortAscending)}
        >
          <MaterialIcons
            name={sortAscending ? "arrow-upward" : "arrow-downward"}
            size={20}
            color="#3ECF8E"
          />
          <Text style={styles.sortText}>
            {sortAscending ? "Oldest" : "Newest"}
          </Text>
        </TouchableOpacity>

        <FlatList
          horizontal
          data={[{ id: -1, title: "All" }, ...goals]}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterListContent}
          renderItem={({ item }) => {
            const isSelected =
              item.id === -1
                ? selectedGoalId === null
                : selectedGoalId === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => {
                  if (item.id === -1) setSelectedGoalId(null);
                  else setSelectedGoalId(item.id);
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    isSelected && styles.filterTextSelected,
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  ), [goals, selectedGoalId, sortAscending]); // Only update when these change

  // 2. Fixes "Loading wheel resets"
  const renderEmpty = useCallback(() => {
      if (loading) {
          return (
            <View style={styles.centerLoader}>
                <ActivityIndicator size="large" color="#3ECF8E" />
            </View>
          );
      }
      return <Text style={styles.emptyText}>No proofs found.</Text>;
  }, [loading]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return <View style={{ height: 50 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3ECF8E" />
      </View>
    );
  }, [loadingMore]);

  const renderProofItem = useCallback(({ item }: { item: ProofItem }) => {
    const dateObj = new Date(item.created_at);
    const formattedDate = dateObj.toLocaleDateString();

    return (
      <ProgressItem
        signedUrl={item.signedUrl ?? null}
        itemWidth={ITEM_WIDTH}
        taskTitle={item.task_title}
        goalTitle={item.goal_title}
        date={formattedDate}
        onPress={() => {
            setSelectedProof(item);
            setIsModalVisible(true);
        }}
      />
    );
  }, [ITEM_WIDTH]);


  return (
    <View style={styles.container}>
      <FlatList
        data={proofs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProofItem}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3ECF8E"
          />
        }
      />

      <ProgressItemModal
        isVisible={isModalVisible}
        proofItem={selectedProof}
        onClose={() => {
            setIsModalVisible(false);
            setSelectedProof(null);
        }}
        onDelete={(id) => {
            setProofs((prev) => prev.filter((p) => p.id !== id));
        }}
      />
    </View>
  );
};

export default Progress;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  centerLoader: {
    paddingVertical: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "SemiBold",
    color: "white",
    fontSize: 24,
    marginLeft: 20,
    marginBottom: 15,
  },
  controlsContainer: {
    marginBottom: 15,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 20,
    marginBottom: 10,
  },
  sortText: {
    color: "#3ECF8E",
    fontFamily: "Regular",
    marginLeft: 5,
    fontSize: 14,
  },
  filterListContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  filterChipSelected: {
    backgroundColor: "#3ECF8E",
    borderColor: "#3ECF8E",
  },
  filterText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Regular",
    fontSize: 14,
  },
  filterTextSelected: {
    color: "#171717",
    fontFamily: "SemiBold",
  },
  gridContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  emptyText: {
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 50,
    fontFamily: "Light",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});