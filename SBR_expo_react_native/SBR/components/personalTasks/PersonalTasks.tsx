import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import React, { useContext, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

const PersonalTasks = () => {
  const context = useContext(AuthContext);
  useEffect(() => {
    const getTasks = async () => {
      if (context.session?.user.id) {
        const { data, error } = await supabase
          .from("task")
          .select("due_date, title, completed")
          .eq("user_id", context.session?.user.id);
        if (error) {
          console.log(error);
        } else console.log(data);
      }
      getTasks();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks:</Text>
    </View>
  );
};

export default PersonalTasks;

const styles = StyleSheet.create({
  container: {
    height: "95%",
    width: "90%",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    backgroundColor: "#171717",
  },
  title: {
    fontFamily: "SemiBold",
    color: "white",
    fontSize: 24,
    marginLeft: 20,
    marginTop: 5,
  },
});
