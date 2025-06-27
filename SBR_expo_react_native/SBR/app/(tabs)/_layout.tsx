import { Tabs } from "expo-router";

const _layout = () => {
  return (
    <Tabs>
      <Tabs.Screen
        name="chats"
        options={{ title: "Chats", headerShown: false }}
      />
      <Tabs.Screen
        name="index"
        options={{ title: "Tasks", headerShown: false }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Progress", headerShown: false }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{ title: "Profile", headerShown: false }}
      />
    </Tabs>
  );
};
export default _layout;
