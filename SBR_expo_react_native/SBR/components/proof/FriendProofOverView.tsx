import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface FriendProofOverViewProps {
  friendId: string;
}

interface ProofOverview {
  proof_media: string;
  task_left: number;
  task_done: number;
  profile_pic: string;
  nickname: string;
}

const getFriendData = async (
  friendId: string
): Promise<ProofOverview | null> => {
  const { data, error } = await supabase.rpc("get_friend_proof_overview", {
    p_friend_id: friendId,
  });

  if (error) {
    console.error("Error fetching friend proof overview:", error);
    return null;
  }

  return data[0] || null;
};

// Example usage inside your component:
const FriendProofOverView = ({ friendId }: FriendProofOverViewProps) => {
  const [overview, setOverview] = useState<ProofOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getFriendData(friendId);
      setOverview(data);
      console.log(data);
      setLoading(false);
    };

    fetchData();
  }, [friendId]);

  if (loading) {
    return <Text>Loading...</Text>; // Or a spinner
  }

  if (!overview) {
    return <Text>Could not load friend's data.</Text>;
  }

  return (
    <View>
      <Text>Nickname: {overview.nickname}</Text>
      <Text>Tasks Done: {overview.task_done}</Text>
      <Text>Tasks Left: {overview.task_left}</Text>
      {/* Render profile pic and proof media as images */}
    </View>
  );
};
export default FriendProofOverView;
const styles = StyleSheet.create({});
