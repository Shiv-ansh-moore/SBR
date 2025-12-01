import ProgressView from "@/components/progress/ProgressView";
import FriendProofOverViewList from "@/components/proof/FriendProofOverViewList";
import React, { useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view"; // Import PagerView

const pages = [<ProgressView />, <FriendProofOverViewList />];

const ProgressScreen = () => {
  // PagerView gives us two values: position (index 0, 1) and offset (percentage 0.0 - 1.0)
  const position = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(0)).current;

  // We combine them to get a smooth value: 0 -> 0.5 -> 1
  const scrollX = useMemo(() => Animated.add(position, offset), [position, offset]);

  return (
    <View style={styles.container}>
      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {pages.map((_, i) => {
          // Logic Updated: PagerView works on Index (0, 1), not Width (pixels)
          const inputRange = [i - 1, i, i + 1];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8], // Inactive, Active, Inactive width
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3], // Inactive, Active, Inactive opacity
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={i.toString()}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>

      {/* Replaced ScrollView with PagerView */}
      <PagerView
        style={styles.pagerView}
        initialPage={0}
        // This maps the native event to our animated values
        onPageScroll={Animated.event(
          [{ nativeEvent: { position: position, offset: offset } }],
          { useNativeDriver: false }
        )}
      >
        {pages.map((page, i) => (
          // PagerView requires a key for direct children View
          <View style={styles.page} key={i.toString()}>
            {page}
          </View>
        ))}
      </PagerView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717", // Matches your theme
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1, // Ensures content fills the page
  },
  paginationContainer: {
    marginTop: 20,
    marginBottom: 10, // Added a little bottom margin
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
    marginHorizontal: 5,
  },
});

export default ProgressScreen;