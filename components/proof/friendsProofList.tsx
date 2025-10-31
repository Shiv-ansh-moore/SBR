import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import FriendProof from "./FriendProof";

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

// Define how many items to fetch per page
const PAGE_SIZE = 10;

const FriendsProofList = () => {
  const [proofs, setProofs] = useState<ProofWithDetails[]>([]);
  const [loading, setLoading] = useState(true); // For initial load
  const [loadingMore, setLoadingMore] = useState(false); // For pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [allDataLoaded, setAllDataLoaded] = useState(false); // To stop fetching

  useEffect(() => {
    // Fetch the very first page
    fetchFriendsProofs(0, true);
  }, []);

  const fetchFriendsProofs = async (page: number, initialLoad = false) => {
    // Prevent fetching if we're already loading or have all data
    if ((loading || loadingMore) && !initialLoad) return;
    if (allDataLoaded) return;

    if (initialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_friends_proof_submissions",
      {
        page_number: page, // Pass the page number
        page_size: PAGE_SIZE, // Pass the page size
      }
    );

    if (rpcError) {
      console.log(rpcError);
    } else if (rpcData) {
      // If we get fewer items than requested, we've reached the end
      if (rpcData.length < PAGE_SIZE) {
        setAllDataLoaded(true);
      }

      if (page === 0) {
        setProofs(rpcData); // Set initial data
      } else {
        // Append new data to the existing list
        setProofs((prevProofs) => [...prevProofs, ...rpcData]);
      }
      setCurrentPage(page); // Update the current page
    }

    if (initialLoad) {
      setLoading(false);
    } else {
      setLoadingMore(false);
    }
  };

  // Called when the user scrolls near the end of the list
  const handleLoadMore = () => {
    if (!loadingMore && !allDataLoaded) {
      fetchFriendsProofs(currentPage + 1); // Fetch the next page
    }
  };

  // Renders the loading spinner at the bottom
  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="large" style={styles.loader} />;
  };

  // Show a loader for the very first load
  if (loading && currentPage === 0) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={proofs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => ( // Use { item } destructuring
          <View style={styles.listContent}>
            <FriendProof proof={item} />
          </View>
        )}
        // Props for pagination
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // How close to the bottom to trigger
        ListFooterComponent={renderFooter} // Show the spinner at the bottom
      />
    </View>
  );
};

export default FriendsProofList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "90%",
    alignSelf: "center",
  },
  listContent: {
    marginBottom: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20, // Add some padding to the loader
  },
});