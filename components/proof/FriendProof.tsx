import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image as RNImage, // 1. Alias RN Image for the getSize utility
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image"; // 2. Import Expo Image
import CommentModal from "./CommentModal";

interface ProofWithDetails {
  id: number;
  created_at: string;
  proof_media: string;
  note: string;
  task_title: string;
  task_owner_id: string;
  profile_pic: string;
  nickname: string;
  like_count?: number;
  comment_count?: number;
  user_has_liked?: boolean;
}

interface FriendProofProps {
  proof: ProofWithDetails;
}

const FriendProof = ({ proof }: FriendProofProps) => {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [profilePicLink, setProfilePicLink] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);

  // Interaction State
  const [isLiked, setIsLiked] = useState(proof.user_has_liked || false);
  const [likeCount, setLikeCount] = useState(proof.like_count || 0);
  const [commentCount, setCommentCount] = useState(proof.comment_count || 0);
  const [showComments, setShowComments] = useState(false);

  // --- Fetch initial stats ---
  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user.id) return;

      const { data: likeData } = await supabase
        .from("proof_likes")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("proof_id", proof.id)
        .single();

      setIsLiked(!!likeData);

      const { count: lCount } = await supabase
        .from("proof_likes")
        .select("*", { count: "exact", head: true })
        .eq("proof_id", proof.id);

      const { count: cCount } = await supabase
        .from("proof_comments")
        .select("*", { count: "exact", head: true })
        .eq("proof_id", proof.id);

      if (lCount !== null) setLikeCount(lCount);
      if (cCount !== null) setCommentCount(cCount);
    };

    fetchStats();
  }, [proof.id, session?.user.id]);

  // --- Image Fetching ---
  useEffect(() => {
    const fetchMedia = async () => {
      if (proof.profile_pic) {
        const { data: profileUrlData } = supabase.storage
          .from("profilepic")
          .getPublicUrl(proof.profile_pic);
        setProfilePicLink(profileUrlData.publicUrl);
      }

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
          
          // 3. Use RNImage here solely for calculating size before render
          RNImage.getSize(
            url,
            (width, height) => {
              if (height > 0) setImageAspectRatio(width / height);
              setLoading(false);
            },
            (err) => {
              console.error("Failed to get image size:", err);
              setLoading(false);
            }
          );
        }
      } else {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [proof.proof_media, proof.profile_pic]);

  // Handle Like Toggle
  const handleLike = async () => {
    if (!session?.user.id) return;

    const previousState = isLiked;
    const previousCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      if (isLiked) {
        await supabase
          .from("proof_likes")
          .delete()
          .eq("user_id", session.user.id)
          .eq("proof_id", proof.id);
      } else {
        await supabase.from("proof_likes").insert({
          user_id: session.user.id,
          proof_id: proof.id,
        });
      }
    } catch (error) {
      setIsLiked(previousState);
      setLikeCount(previousCount);
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {profilePicLink ? (
          // 4. Updated Profile Pic to Expo Image
          <Image 
            source={profilePicLink} 
            style={styles.avatar} 
            contentFit="cover"
            transition={500}
          />
        ) : (
          <View style={styles.avatar} />
        )}
        <Text style={styles.nickname}>{proof.nickname}</Text>
      </View>

      <View style={[styles.imageContainer, loading && styles.loadingContainer]}>
        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : signedUrl ? (
          // 5. Updated Main Proof Image to Expo Image
          <Image
            source={signedUrl}
            style={[styles.proofImage, { aspectRatio: imageAspectRatio }]}
            contentFit="cover"
            transition={500} // Adds a smooth fade-in
          />
        ) : (
          <Text style={styles.noImageText}>No image provided</Text>
        )}
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.infoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{proof.task_title}</Text>
            <Text style={styles.timestamp}>
              {new Date(proof.created_at).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <AntDesign
              name={isLiked ? "heart" : "hearto"}
              size={24}
              color={isLiked ? "#E53E3E" : "white"}
            />
            <Text style={styles.actionText}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowComments(true)}
          >
            <FontAwesome name="comment-o" size={24} color="white" />
            <Text style={styles.actionText}>{commentCount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CommentModal
        isVisible={showComments}
        onClose={() => setShowComments(false)}
        proofId={proof.id}
        onCommentAdded={() => setCommentCount((prev) => prev + 1)}
      />
    </View>
  );
};

export default FriendProof;

const styles = StyleSheet.create({
  container: {
    width: "90%",
    alignSelf: "center",
    marginTop: 20,
  },
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
  loadingContainer: {
    aspectRatio: 4 / 5,
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
  bottomContainer: {
    backgroundColor: "#171717",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 10,
  },
  infoRow: {
    marginBottom: 10,
  },
  taskTitle: {
    fontFamily: "Regular",
    color: "white",
    fontSize: 25,
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    fontFamily: "ExtraLight",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    color: "white",
    marginLeft: 6,
    fontSize: 16,
    fontFamily: "Regular",
  },
});