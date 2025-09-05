import { StyleSheet, Text, View } from "react-native";

interface TextMessageSentByYou {
  message: string;
}
const TextMessageSentByYou = ({ message }: TextMessageSentByYou) => {
  return (
    <View style={styles.textBox}>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
};
export default TextMessageSentByYou;
const styles = StyleSheet.create({
  textBox: {
    maxWidth: "80%",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    backgroundColor: "#242424",
    borderTopRightRadius: 0,
    padding: 10,
    margin: 10,
    marginLeft: "auto",
  },
  messageText: { fontFamily: "Regular", fontSize: 10, color: "white" },
});
