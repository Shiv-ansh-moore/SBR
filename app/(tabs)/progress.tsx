import ProgressView from "@/components/progress/ProgressView";
import React from "react";
import { StyleSheet, View } from "react-native";

const ProgressScreen = () => {
  return (
    <View style={styles.container}>
      <ProgressView />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717", // Matches your theme
  },
});

export default ProgressScreen;
