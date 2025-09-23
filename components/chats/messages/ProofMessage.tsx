import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ProofMessageProps {
  proofId: number;
}

interface ProofDetails {
  created_at: string;
  id: number;
  nickname: string;
  note: string | null;
  profile_pic: string;
  proof_media: string;
  task_title: string;
}

const ProofMessage = ({ proofId }: ProofMessageProps) => {
  const [proof, setProof] = useState<ProofDetails | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [proofMediaUrl, setProofMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getProofDetails = async () => {
      if (!proofId) return;
      setIsLoading(true);
      // 1. Fetch the proof details from the RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_proof_from_id",
        { proof_id: proofId }
      );

      if (rpcError) {
        console.error("Error fetching proof details:", rpcError);
        setIsLoading(false);
        return;
      }

      if (rpcData && rpcData.length > 0) {
        const details = rpcData[0];
        setProof(details);

        // 2. Get public URL for the profile picture
        if (details.profile_pic) {
          const { data: picData } = supabase.storage
            .from("profilepic")
            .getPublicUrl(details.profile_pic);
          setProfilePicUrl(picData.publicUrl);
        }

        // 3. Get signed URL for the proof media
        if (details.proof_media) {
          const { data, error } = await supabase.storage
            .from("proof-media")
            .createSignedUrl(details.proof_media, 1800); // URL valid for 30 mins

          if (error) {
            console.error("Error creating signed URL for proof:", error);
          } else {
            setProofMediaUrl(data.signedUrl);
          }
        }
      }
      setIsLoading(false);
    };
    getProofDetails();
  }, [proofId]);

  return (
    <View>
      <Text>{proofId}</Text>
    </View>
  );
};

export default ProofMessage;

const styles = StyleSheet.create({});
