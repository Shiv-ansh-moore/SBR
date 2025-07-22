import { StyleSheet, Text, View } from 'react-native'
const index = () => {
  return (
    <View style={styles.container}>
      <Text>Profile</Text>
    </View>
  )
}
export default index
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});