import { StyleSheet, Text, View } from "react-native";

interface TextMessageSentByMember {
  message: string;
}
const TextMessageSentByMember = ({message}:TextMessageSentByMember) => {
  return (
    <View>
      <Text>{message}</Text>
    </View>
  );
};
export default TextMessageSentByMember;
const styles = StyleSheet.create({});
