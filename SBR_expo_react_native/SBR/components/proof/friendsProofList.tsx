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

const FriendsProofList = () => {
  const [proofs, setProofs] = useState<ProofWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriendsProofs();
  }, []);
  const fetchFriendsProofs = async () => {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_friends_proof_submissions"
    );
    if (rpcError) {
      console.log(rpcError);
      setLoading(false);
      return;
    }
    if (rpcData) {
      setProofs(rpcData);
      setLoading(false);
      return;
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }
  return (
    <View style={styles.container}>
      <FlatList
        data={proofs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={(item) => (
          <View style={styles.listContent}>
            <FriendProof proof={item.item} />
          </View>
        )}
      />
    </View>
  );
};

export default FriendsProofList;

const styles = StyleSheet.create({
  // Change container to ensure it fills the available space
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
  },
});
