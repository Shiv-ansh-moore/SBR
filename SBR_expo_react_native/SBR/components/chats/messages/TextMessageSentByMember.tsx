import { StyleSheet, Text, View } from "react-native";

interface TextMessageSentByMember {
  message: string;
}
const TextMessageSentByMember = ({ message }: TextMessageSentByMember) => {
  return (
    <View style={styles.textBox}>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
};
export default TextMessageSentByMember;
const styles = StyleSheet.create({
  textBox: {
    maxWidth: "80%",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    backgroundColor: "#242424",
    borderTopLeftRadius: 0,
    padding: 10,
    margin: 10,
  },
  messageText: { fontFamily: "Regular", fontSize: 10, color: "white" },
});
