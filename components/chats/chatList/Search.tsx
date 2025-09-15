import AntDesign from "@expo/vector-icons/AntDesign";
import { StyleSheet, TextInput, View } from "react-native";

const Search = () => {
  return (
    // This is the main container for the search bar
    <View style={styles.container}>
      {/* Icon is a sibling to the TextInput */}
      <AntDesign
        name="search1"
        size={20}
        color="#3ECF8E"
        style={styles.icon}
      />
      {/* TextInput no longer has children */}
      <TextInput
        placeholder="Search..."
        placeholderTextColor="#999"
        style={styles.input}
      />
    </View>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height:45,
    alignItems: "center",
    backgroundColor: "#171717",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    borderRadius: 20,
    width: "95%",
    alignSelf: "center",
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: "#fff",
    fontSize: 16,
  },
});