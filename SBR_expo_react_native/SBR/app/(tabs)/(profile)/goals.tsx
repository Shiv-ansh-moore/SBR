import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
const goals = () => {
  const router = useRouter();
  return (
    <View>
      <Text>goals</Text>
      <TouchableOpacity
        onPress={() => {
          router.dismiss();
        }}
      >
        <Text>Go back</Text>
      </TouchableOpacity>
    </View>
  );
};
export default goals;
const styles = StyleSheet.create({});
