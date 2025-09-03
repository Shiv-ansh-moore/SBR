import { StyleSheet, Text, View } from 'react-native'

interface TextMessageSentByYou{
    message: string
}
const TextMessageSentByYou = ({message}:TextMessageSentByYou) => {
  return (
    <View>
      <Text>{message}</Text>
    </View>
  )
}
export default TextMessageSentByYou
const styles = StyleSheet.create({})