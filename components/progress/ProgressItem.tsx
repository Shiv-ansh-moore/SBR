import AntDesign from "@expo/vector-icons/AntDesign";
import { Image } from "expo-image"; // 1. Import from expo-image
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"; // 2. Remove Image from RN

interface ProgressItemProps {
  signedUrl: string | null;
  itemWidth: number;
  taskTitle: string;
  goalTitle: string;
  date: string;
  onPress: () => void;
}

const ProgressItem = ({
  signedUrl,
  itemWidth,
  taskTitle,
  goalTitle,
  date,
  onPress,
}: ProgressItemProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.cardContainer, { width: itemWidth }]}
    >
      {/* Image Section */}
      <View
        style={{
          height: itemWidth,
          width: itemWidth,
          backgroundColor: "#1e1e1e",
        }}
      >
        {signedUrl && !imageError ? (
          <Image
            source={signedUrl}
            style={{ height: itemWidth, width: itemWidth }}
            contentFit="cover" // 3. Replaces resizeMode
            transition={500}   // 4. Smooth fade in
            onError={(e) => {
              console.log("Image Load Error:", e.error);
              setImageError(true);
            }}
          />
        ) : (
          <View style={[styles.center, { height: itemWidth }]}>
            <AntDesign
              name="picture"
              size={40}
              color="rgba(255,255,255,0.3)"
            />
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
    </TouchableOpacity>
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