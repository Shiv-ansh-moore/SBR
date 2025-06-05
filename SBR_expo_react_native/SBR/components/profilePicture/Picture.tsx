import { Image, StyleSheet, View } from "react-native";

const Picture = () => {
  return (
    <View>
      <Image
        source={require("../../assets/images/profilePic/defaultProfile.jpg")}
        style={styles.image}
      />
    </View>
  );
};

export default Picture;

const styles = StyleSheet.create({
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
