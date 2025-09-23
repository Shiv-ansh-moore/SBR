import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AntDesign } from "@expo/vector-icons"; // 1. Import the icon

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
  const [imageAspectRatio, setImageAspectRatio] = useState(4 / 5); // Default aspect ratio

  useEffect(() => {
    const getProofDetails = async () => {
      if (!proofId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_proof_from_id",
        { proof_id: proofId }
      );

      if (rpcError || !rpcData || rpcData.length === 0) {
        console.error("Error fetching proof details:", rpcError);
        setIsLoading(false);
        return;
      }

      const details = rpcData[0];
      setProof(details);

      // Get public URL for the profile picture
      if (details.profile_pic) {
        const { data: picData } = supabase.storage
          .from("profilepic")
          .getPublicUrl(details.profile_pic);
        setProfilePicUrl(picData.publicUrl);
      }

      // Get signed URL for the proof media and calculate its aspect ratio
      if (details.proof_media) {
        const { data, error } = await supabase.storage
          .from("proof-media")
          .createSignedUrl(details.proof_media, 1800); // URL valid for 30 mins

        if (error) {
          console.error("Error creating signed URL for proof:", error);
        } else if (data?.signedUrl) {
          const url = data.signedUrl;
          setProofMediaUrl(url);
          Image.getSize(
            url,
            (width, height) => {
              if (height > 0) {
                setImageAspectRatio(width / height);
              }
            },
            (err) => {
              console.error("Failed to get image size:", err);
              // Keep default aspect ratio if getSize fails
            }
          );
        }
      }
      setIsLoading(false);
    };

    getProofDetails();
  }, [proofId]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.avatar} />
        <View style={styles.loadingBubble}>
          <ActivityIndicator size="small" color="#888" />
        </View>
      </View>
    );
  }

  if (!proof) {
    // You can render an error message here if you'd like
    return null;
  }

  return (
    <View style={styles.container}>
      {profilePicUrl ? (
        <Image source={{ uri: profilePicUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar} /> // Placeholder if no pic
      )}
      <View style={styles.bubble}>
        <Text style={styles.nickname}>{`~\u2009${proof.nickname}`}</Text>

        {proofMediaUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: proofMediaUrl }}
              style={[styles.proofImage, { aspectRatio: imageAspectRatio }]}
            />
          </View>
        )}
        
        {/* 2. Create a container for the icon and title */}
        <View style={styles.titleContainer}>
          <Text style={styles.taskTitle}>{proof.task_title}</Text>
          <AntDesign name="checkcircle" size={24} color="#3ECF8E" />
        </View>

        {proof.note && <Text style={styles.note}>{proof.note}</Text>}

        <Text style={styles.timestamp}>
          {new Date(proof.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
};

export default ProofMessage;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    maxWidth: "80%",
    alignSelf: "flex-start",
    marginTop: 10,
    marginLeft: 10,
    alignItems: "flex-start", // Vertically aligns avatar to the top
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#333", // Placeholder color
  },
  bubble: {
    flex: 1,
    borderWidth: 0.25,
    borderColor: "#3ECF8E",
    backgroundColor: "#242424",
    borderRadius: 20,
    borderTopLeftRadius: 0,
    padding: 10,
  },
  loadingBubble: {
    flex: 1,
    backgroundColor: "#242424",
    borderRadius: 20,
    borderTopLeftRadius: 0,
    padding: 12,
    height: 80, // Fixed height for loading state
    justifyContent: "center",
    alignItems: "center",
  },
  nickname: {
    fontFamily: "Medium",
    fontSize: 13,
    color: "#CF6A3E",
    marginBottom: 4,
  },
  // 3. Add a style for the new container
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1, // Allows text to wrap if it's long
    fontFamily: "Regular",
    color: "#3ECF8E",
    fontSize: 15,
    marginLeft: 8, // Add space between icon and text
  },
  imageContainer: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 8,
  },
  proofImage: {
    width: "100%",
    // Aspect ratio is set dynamically in the component style
  },
  note: {
    fontFamily: "Regular",
    fontSize: 14,
    color: "#ccc",
    fontStyle: "italic",
    marginBottom: 8,
  },
  timestamp: {
    fontFamily: "ExtraLight",
    fontSize: 10,
    color: "#888",
    alignSelf: "flex-end", // Position timestamp to the bottom right
  },
});