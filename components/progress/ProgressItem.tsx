import { supabase } from "@/lib/supabaseClient";
import AntDesign from "@expo/vector-icons/AntDesign";
// FIX: Switch back to React Native Image for stability first
import { Image, ActivityIndicator, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";

interface ProgressItemProps {
  mediaPath: string | null;
  itemWidth: number;
  taskTitle: string;
  goalTitle: string;
  date: string;
}

const ProgressItem = ({
  mediaPath,
  itemWidth,
  taskTitle,
  goalTitle,
  date,
}: ProgressItemProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false); // Track if image fails to load

  useEffect(() => {
    const fetchSignedUrl = async () => {
      // Reset state on reuse
      setLoading(true); 
      setImageError(false);
      setSignedUrl(null);

      if (!mediaPath) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.storage
        .from("proof-media")
        .createSignedUrl(mediaPath, 3600);

      if (error) {
        console.log("Error signing URL:", error.message);
        setLoading(false);
      } else if (data) {
        // console.log("Generated URL:", data.signedUrl); // Uncomment to debug
        setSignedUrl(data.signedUrl);
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [mediaPath]);

  return (
    <View style={[styles.cardContainer, { width: itemWidth }]}>
      {/* Image Section */}
      <View style={{ height: itemWidth, width: itemWidth, backgroundColor: "#1e1e1e" }}>
        {loading ? (
          <View style={[styles.center, { height: itemWidth }]}>
            <ActivityIndicator color="#3ECF8E" />
          </View>
        ) : signedUrl && !imageError ? (
          <Image
            source={{ uri: signedUrl }}
            style={{ height: itemWidth, width: itemWidth }}
            resizeMode="cover"
            onError={(e) => {
                console.log("Image Load Error:", e.nativeEvent.error);
                setImageError(true);
            }}
          />
        ) : (
          // Show placeholder if Loading is done AND (No URL OR Image Error)
          <View style={[styles.center, { height: itemWidth }]}>
            <AntDesign name="picture" size={40} color="rgba(255,255,255,0.3)" />
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.cardInfo}>
        <Text style={styles.goalText} numberOfLines={1}>
          {goalTitle}
        </Text>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {taskTitle}
        </Text>
        <Text style={styles.dateText}>{date}</Text>
      </View>
    </View>
  );
};

export default ProgressItem;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#242424",
    borderRadius: 15,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
  },
  cardInfo: {
    padding: 10,
  },
  goalText: {
    color: "#3ECF8E",
    fontSize: 10,
    fontFamily: "Bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  taskTitle: {
    color: "white",
    fontSize: 14,
    fontFamily: "Regular",
    marginBottom: 5,
    height: 38,
  },
  dateText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Light",
    alignSelf: "flex-end",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
});