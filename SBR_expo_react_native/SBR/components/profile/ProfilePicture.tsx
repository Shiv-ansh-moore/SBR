import { Image } from "expo-image";
import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AuthContext } from "../../providers/AuthProvider";

interface ProfilePictureProps {
  height: number;
  width: number;
}

const ProfilePicture = ({ height, width }: ProfilePictureProps) => {
  const context = useContext(AuthContext);

  return (
    <View >
      <Image
        source={context.profilePicLink}
        // 3. Apply dynamic styles in an array
        style={[
          styles.profilePic,
          {
            width: width,
            height: height,
            borderRadius: width / 2,
          },
        ]}
      />
    </View>
  );
};
export default ProfilePicture;
const styles = StyleSheet.create({
  profilePic: {
    backgroundColor: "#e0e0e0",
  },
});
