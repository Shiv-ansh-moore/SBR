import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function chat() {
  const { id, name, pic } = useLocalSearchParams();
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        {pic ? (
          <Image style={styles.groupImage} source={pic} />
        ) : (
          <View style={[styles.groupImage, styles.placeholderContainer]}>
            <FontAwesome name="group" size={24} color="white" />
          </View>
        )}

        <Text style={styles.title}>{name}</Text>
        <TouchableOpacity style={styles.groupMembersContainer}>
          <FontAwesome name="group" size={25} color="#3ECF8E" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242424",
    height: 60,
  },
  backButton: { marginLeft: 5, marginRight: 5 },
  title: { fontFamily: "Light", color: "white", fontSize: 16 },
  groupImage: { height: 50, width: 50, borderRadius: 25, marginRight: 10 },
  groupMembersContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
    marginRight:5
  },
  placeholderContainer: {
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 25,
    height: 50,
    width: 50,
    backgroundColor: "#171717",
    justifyContent: "center",
    alignItems: "center",
  },
});
