import { supabase } from "@/lib/supabaseClient";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

const friendsProofList = () => {
  useEffect(() => {
    fetchFriendsProofs();
  }, []);
  const fetchFriendsProofs = async () => {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_friends_proof_submissions"
    );
    console.log(rpcData);
  };
  return (
    <View>
      <Text>friendsProofList</Text>
    </View>
  );
};

export default friendsProofList;

const styles = StyleSheet.create({});
