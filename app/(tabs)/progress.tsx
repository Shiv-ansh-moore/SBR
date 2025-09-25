import PersonalTasks from "@/components/personalTasks/PersonalTasks";
import FriendProofOverViewList from "@/components/proof/FriendProofOverViewList";
import FriendsProofList from "@/components/proof/friendsProofList";
import React, { useRef } from "react"; // ✨ 1. Import useRef
import {
  Animated, // ✨ 2. Import Animated
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const pages = [<FriendsProofList />, <FriendProofOverViewList />];

const progress = () => {
  // ✨ 3. Create an Animated.Value to track the scroll position
  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <View style={styles.container}>
      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {pages.map((_, i) => {
          // ✨ 6. For each dot, create an interpolation
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

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

          // Use Animated.View and apply the animated styles
          return (
            <Animated.View
              key={i.toString()}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        // ✨ 4. Use onScroll to update scrollX in real-time
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {pages.map((page, i) => (
          <View style={styles.page} key={i}>
            {page}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  page: {
    width: width,
    flex: 1,
  },
  paginationContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF", // ✨ 5. Use a single color
    marginHorizontal: 5,
  },
});

export default progress;
