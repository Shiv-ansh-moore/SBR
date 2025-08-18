import React from "react";
import { StyleSheet, Text, View } from "react-native";

const PersonalTasks = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks:</Text>
    </View>
  );
};

export default PersonalTasks;

const styles = StyleSheet.create({
  container: {
    height: "95%",
    width: "90%",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    backgroundColor: "#171717",
  },
  title: {
    fontFamily: "SemiBold",
    color: "white",
    fontSize:24,
    marginLeft:20,
    marginTop:5
  },
});
