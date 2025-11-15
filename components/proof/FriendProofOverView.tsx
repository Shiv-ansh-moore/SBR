import { supabase } from "@/lib/supabaseClient";
import { Fragment, useEffect, useState } from "react"; // ✨ Import Fragment
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FriendDetailModal from "./FriendDetailModal"; // ✨ Import the new modal

// --- Interfaces and Data Fetching (no change) ---
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
  return data?.[0] || null;
};

// --- Component (Updated) ---
const FriendProofOverView = ({ friendId }: FriendProofOverViewProps) => {
  const [overview, setOverview] = useState<ProofOverview | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [profilePicLink, setProfilePicLink] = useState<string | null>(null);
  const [proofMediaLink, setProofMediaLink] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const [isModalVisible, setModalVisible] = useState(false); // ✨ Add modal state

  // --- useEffect hooks (no change) ---
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      setMediaLoading(true);
      const data = await getFriendData(friendId);
      setOverview(data);
      setDataLoading(false);
    };
    fetchData();
  }, [friendId]);

  useEffect(() => {
    const fetchMedia = async () => {
      if (!overview) {
        setMediaLoading(false);
        return;
      }
      setMediaLoading(true);
      if (overview.profile_pic) {
        const { data: profileUrlData } = supabase.storage
          .from("profilepic")
          .getPublicUrl(overview.profile_pic);
        setProfilePicLink(profileUrlData.publicUrl);
      } else {
        setProfilePicLink(null);
      }
      if (overview.proof_media) {
        const { data, error } = await supabase.storage
          .from("proof-media")
          .createSignedUrl(overview.proof_media, 1800);
        if (error) {
          console.error("Error creating signed URL:", error.message);
          setProofMediaLink(null);
          setMediaLoading(false);
        } else if (data?.signedUrl) {
          const url = data.signedUrl;
          setProofMediaLink(url);
          Image.getSize(
            url,
            (width, height) => {
              if (height > 0) setImageAspectRatio(width / height);
              setMediaLoading(false);
            },
            () => setMediaLoading(false)
          );
        }
      } else {
        setProofMediaLink(null);
        setMediaLoading(false);
      }
    };
    fetchMedia();
  }, [overview]);

  if (dataLoading) {
    return (
      <View style={[styles.container, styles.loaderContainer]}>
        <ActivityIndicator size="large" color="#3ECF8E" />
      </View>
    );
  }

  if (!overview) {
    return (
      <View style={[styles.container, styles.loaderContainer]}>
        <Text style={styles.noProofText}>Friend not found.</Text>
      </View>
    );
  }

  return (
    // ✨ Use Fragment to return multiple elements
    <Fragment>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setModalVisible(true)} // ✨ Open modal on press
      >
        {proofMediaLink && !mediaLoading ? (
          <Image
            source={{ uri: proofMediaLink }}
            style={[styles.proofImage, { aspectRatio: imageAspectRatio }]}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            {mediaLoading ? (
              <ActivityIndicator color="#3ECF8E" />
            ) : (
              <Text style={styles.noProofText}>No Recent Proof</Text>
            )}
          </View>
        )}

        <View style={styles.infoOverlay}>
          <View>
            <Text style={styles.nicknameText}>{overview.nickname}</Text>
            <Text style={[styles.statsText, styles.doneText]}>
              Done: {overview.task_done}
            </Text>
            <Text style={[styles.statsText, styles.todoText]}>
              ToDo: {overview.task_left}
            </Text>
          </View>

          {profilePicLink && (
            <Image source={{ uri: profilePicLink }} style={styles.profilePic} />
          )}
        </View>
      </TouchableOpacity>

      {/* ✨ Render the Modal */}
      <FriendDetailModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        friendId={friendId}
        initialOverview={overview}
        profilePicLink={profilePicLink}
      />
    </Fragment>
  );
};

export default FriendProofOverView;

// --- Styles (no change) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    borderRadius: 20,
    backgroundColor: "#171717",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  loaderContainer: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderContainer: {
    flex: 1,
    minHeight: 250,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
  },
  proofImage: {
    width: "100%",
    resizeMode: "cover",
  },
  infoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingBottom: 2,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nicknameText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Bold",
  },
  statsText: {
    fontSize: 14,
    fontFamily: "SemiBold",
  },
  doneText: {
    color: "#3ECF8E",
  },
  todoText: {
    color: "#FF6347",
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#3ECF8E",
  },
  noProofText: {
    padding: 20,
    textAlign: "center",
    color: "white",
    fontFamily: "SemiBold",
    fontSize: 14,
  },
});
