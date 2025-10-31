// ProofMessage.tsx
// removed resize was makeing the images look wierd when initally loading causing the auto scroller not to work
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AntDesign } from "@expo/vector-icons";

// MODIFICATION 1: Update props interface
interface ProofMessageProps {
  proofId: number;
  currentUserId: string | undefined;
  senderId: string;
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

// MODIFICATION 2: Update component signature to accept new props
const ProofMessage = ({
  proofId,
  currentUserId,
  senderId,
}: ProofMessageProps) => {
  const [proof, setProof] = useState<ProofDetails | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [proofMediaUrl, setProofMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageAspectRatio, setImageAspectRatio] = useState(4 / 5);

  // MODIFICATION 3: Check if the message was sent by the current user
  const isSentByYou = currentUserId === senderId;

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

      // Only get profile pic if it's not sent by the current user
      if (details.profile_pic && !isSentByYou) {
        const { data: picData } = supabase.storage
          .from("profilepic")
          .getPublicUrl(details.profile_pic);
        setProfilePicUrl(picData.publicUrl);
      }

      if (details.proof_media) {
        const { data, error } = await supabase.storage
          .from("proof-media")
          .createSignedUrl(details.proof_media, 1800);

        if (error) {
          console.error("Error creating signed URL for proof:", error);
        } else if (data?.signedUrl) {
          const url = data.signedUrl;
          setProofMediaUrl(url);
          // Image.getSize(
          //   url,
          //   (width, height) => {
          //     if (height > 0) {
          //       setImageAspectRatio(width / height);
          //     }
          //   },
          //   (err) => {
          //     console.error("Failed to get image size:", err);
          //   }
          // );
        }
      }
      setIsLoading(false);
    };

    getProofDetails();
  }, [proofId, isSentByYou]); // Add isSentByYou to dependency array

  // MODIFICATION 4: Update loading state to be side-aware
  if (isLoading) {
    return (
      <View style={isSentByYou ? styles.containerSent : styles.container}>
        {!isSentByYou && <View style={styles.avatar} />}
        <View
          style={isSentByYou ? styles.loadingBubbleSent : styles.loadingBubble}
        >
          <ActivityIndicator size="small" color="#888" />
        </View>
      </View>
    );
  }

  if (!proof) {
    return null;
  }

  // MODIFICATION 5: Update main return to render conditionally
  return (
    <View style={isSentByYou ? styles.containerSent : styles.container}>
      {!isSentByYou &&
        (profilePicUrl ? (
          <Image source={{ uri: profilePicUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        ))}
      <View style={isSentByYou ? styles.bubbleSent : styles.bubble}>
        {!isSentByYou && (
          <Text style={styles.nickname}>{`~\u2009${proof.nickname}`}</Text>
        )}

        {proofMediaUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: proofMediaUrl }}
              style={[styles.proofImage, { aspectRatio: imageAspectRatio }]}
            />
          </View>
        )}

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

// MODIFICATION 6: Add and adjust styles for sent messages
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    maxWidth: "80%",
    alignSelf: "flex-start",
    marginTop: 10,
    marginLeft: 10,
    alignItems: "flex-start",
  },
  containerSent: {
    flexDirection: "row",
    maxWidth: "70%",
    alignSelf: "flex-end",
    marginTop: 10,
    marginRight: 10,
    alignItems: "flex-start",
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#333",
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
  bubbleSent: {
    flex: 1,
    borderWidth: 0.25,
    borderColor: "#3ECF8E",
    backgroundColor: "#242424",
    borderRadius: 20,
    borderTopRightRadius: 0,
    padding: 10,
  },
  loadingBubble: {
    flex: 1,
    backgroundColor: "#242424",
    borderRadius: 20,
    borderTopLeftRadius: 0,
    // padding: 12,
    height: 400,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBubbleSent: {
    flex: 1,
    backgroundColor: "#242424",
    borderRadius: 20,
    borderTopRightRadius: 0,
    padding: 12,
    height: 400,
    justifyContent: "center",
    alignItems: "center",
  },
  nickname: {
    fontFamily: "Medium",
    fontSize: 13,
    color: "#CF6A3E",
    marginBottom: 4,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontFamily: "Regular",
    color: "#3ECF8E",
    fontSize: 15,
    marginRight: 8, // Use marginRight for sent messages
  },
  imageContainer: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 8,
  },
  proofImage: {
    width: "100%",
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
    alignSelf: "flex-end",
  },
});