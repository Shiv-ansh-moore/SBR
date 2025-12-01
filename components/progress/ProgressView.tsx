import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ProgressItem from "./ProgressItem";
import React, { useContext, useEffect, useState } from "react";
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

// --- Types ---
interface ProofItem {
  id: number;
  created_at: string;
  proof_media: string | null;
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
const PAGE_SIZE = 10;

const Progress = () => {
  const context = useContext(AuthContext);
  const userId = context.session?.user.id;

  // Data State
  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Filter & Sort State
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [sortAscending, setSortAscending] = useState<boolean>(false);

  // Pagination State
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

    if (isReset) setLoading(true);
    else setLoadingMore(true);

    const { data, error } = await supabase.rpc("get_user_proofs_for_progress", {
      p_user_id: userId,
      p_goal_id: selectedGoalId ?? undefined, // Fix for null vs undefined
      p_sort_asc: sortAscending,
      p_limit: PAGE_SIZE,
      p_offset: currentOffset,
    });

    if (error) {
      console.error("Error fetching proofs:", error);
    } else if (data) {
      if (isReset) {
        setProofs(data);
      } else {
        setProofs((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
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

  // --- Render Functions ---

  // 1. THIS IS NEW: The Header Component
  // Contains Title, Sort Button, and Filter List
  const renderHeader = () => (
    <View>
      <Text style={styles.headerTitle}>Progress Gallery</Text>

      <View style={styles.controlsContainer}>
        {/* Sort Button */}
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

        {/* Filter List (Horizontal FlatList inside Header is OK) */}
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
  );

  const renderProofItem = ({ item }: { item: ProofItem }) => {
    const dateObj = new Date(item.created_at);
    const formattedDate = dateObj.toLocaleDateString();

    return (
      <ProgressItem
        mediaPath={item.proof_media}
        itemWidth={ITEM_WIDTH}
        taskTitle={item.task_title}
        goalTitle={item.goal_title}
        date={formattedDate}
      />
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 50 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3ECF8E" />
      </View>
    );
  };

  // --- Main Return ---
  return (
    <View style={styles.container}>
      {/* The Main FlatList now handles EVERYTHING.
         No ScrollView is wrapping this.
      */}
      {loading && !refreshing ? (
        // Show loader for initial load (centering logic needs view)
        <View style={styles.centerLoader}>
             <ActivityIndicator size="large" color="#3ECF8E" />
        </View>
      ) : (
        <FlatList
          data={proofs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProofItem}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          
          // Header Component passed here
          ListHeaderComponent={renderHeader} 
          
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3ECF8E"
            />
          }
          ListEmptyComponent={
             // Empty state needs to be below header, so it works perfectly here
            <Text style={styles.emptyText}>No proofs found.</Text>
          }
        />
      )}
    </View>
  );
};

export default Progress;

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1, // Vital: Ensures the list takes up full screen height
    paddingTop: 20,
  },
  centerLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
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
  cardContainer: {
    width: ITEM_WIDTH,
    backgroundColor: "#242424",
    borderRadius: 15,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  cardImage: {
    width: "100%",
    height: ITEM_WIDTH,
  },
  placeholderImage: {
    backgroundColor: "#1e1e1e",
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    padding: 10,
  },
  goalText: {
    color: "#3ECF8E",
    fontSize: 10,
    fontFamily: "Bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  taskTitle: {
    color: "white",
    fontSize: 14,
    fontFamily: "Regular",
    marginBottom: 5,
    height: 38,
  },
  dateText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Light",
    alignSelf: "flex-end",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});