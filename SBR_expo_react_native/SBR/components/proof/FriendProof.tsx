import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

// --- Interfaces (no change) ---
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

interface FriendProofProps {
  proof: ProofWithDetails;
}

const FriendProof = ({ proof }: FriendProofProps) => {
  const [loading, setLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [profilePicLink, setProfilePicLink] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);

  useEffect(() => {
    const fetchMedia = async () => {
      // Fetch profile picture
      if (proof.profile_pic) {
        const { data: profileUrlData } = supabase.storage
          .from("profilepic")
          .getPublicUrl(proof.profile_pic);
        setProfilePicLink(profileUrlData.publicUrl);
      }

      // Fetch proof media if it exists
      if (proof.proof_media) {
        setLoading(true);
        const { data, error } = await supabase.storage
          .from("proof-media")
          .createSignedUrl(proof.proof_media, 1800);

        if (error) {
          console.error("Error creating signed URL:", error.message);
          setSignedUrl(null);
          setLoading(false);
        } else if (data?.signedUrl) {
          const url = data.signedUrl;
          setSignedUrl(url);
          Image.getSize(
            url,
            (width, height) => {
              if (height > 0) {
                setImageAspectRatio(width / height);
              }
              setLoading(false);
            },
            (err) => {
              console.error("Failed to get image size:", err);
              setLoading(false); // Stop loading even if size check fails
            }
          );
        }
      } else {
        setLoading(false); // No media to load
      }
    };

    fetchMedia();
  }, [proof.proof_media, proof.profile_pic]);

  return (
    <View style={styles.container}>
      {/* --- Header (no change) --- */}
      <View style={styles.header}>
        {profilePicLink ? (
          <Image source={{ uri: profilePicLink }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <Text style={styles.nickname}>{proof.nickname}</Text>
      </View>

      {/* --- Proof Image --- */}
      {/* ✨ FIX 1: Apply a conditional style to the container for the loading state */}
      <View
        style={[styles.imageContainer, loading && styles.loadingContainer]}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : signedUrl ? (
          <Image
            source={{ uri: signedUrl }}
            style={[styles.proofImage, { aspectRatio: imageAspectRatio }]}
          />
        ) : (
          <Text style={styles.noImageText}>No image provided</Text>
        )}
      </View>
      <View style={styles.bottomContainer}>
        <Text style={styles.taskTitle}>{proof.task_title}</Text>
        <Text style={styles.timestamp}>
          {new Date(proof.created_at).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

export default FriendProof;

const styles = StyleSheet.create({
  container: { width: "100%" },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  nickname: {
    fontSize: 30,
    fontFamily: "Medium",
    color: "white",
  },
  imageContainer: {
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: "hidden",
  },
  // ✨ FIX 2: Add a new style for the loading container
  loadingContainer: {
    aspectRatio: 4 / 5, // A standard portrait aspect ratio
    justifyContent: "center",
    alignItems: "center",
  },
  proofImage: {
    width: "100%",
  },
  noImageText: {
    color: "#888",
    padding: 20,
  },
  taskTitle: {
    fontFamily: "Regular",
    color: "white",
    fontSize: 25,
  },
  note: {
    fontSize: 16,
    lineHeight: 22,
  },
  nicknameNote: {
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    marginBottom: 4,
    fontFamily: "ExtraLight",
  },
  bottomContainer: {
    backgroundColor: "#171717",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
});