import PersonalTasks from "@/components/personalTasks/PersonalTasks";
import FriendProofOverViewList from "@/components/proof/FriendProofOverViewList";
import FriendsProofList from "@/components/proof/friendsProofList";
import React, { useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";

const pages = [
  <PersonalTasks />,
  <FriendsProofList />,
  <FriendProofOverViewList />,
];

const HomeScreen = () => {
  // PagerView uses Position (Index) and Offset (Percentage)
  const position = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(0)).current;

  // Merge them for the smooth dot animation
  const scrollX = useMemo(
    () => Animated.add(position, offset),
    [position, offset]
  );

  return (
    <View style={styles.container}>
      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {pages.map((_, i) => {
          // Logic Updated: PagerView works on Index (0, 1), not Width
          const inputRange = [i - 1, i, i + 1];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
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

      {/* PagerView Implementation */}
      <PagerView
        style={styles.pagerView}
        initialPage={0}
        onPageScroll={Animated.event(
          [{ nativeEvent: { position: position, offset: offset } }],
          { useNativeDriver: false }
        )}
      >
        {pages.map((page, i) => (
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
    backgroundColor: "#171717", // Matches your dark theme
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  paginationContainer: {
    marginTop: 20,
    marginBottom: 10,
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

export default HomeScreen;
