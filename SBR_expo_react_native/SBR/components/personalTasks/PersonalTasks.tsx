import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import Entypo from '@expo/vector-icons/Entypo';
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Task {
  due_date: string | null;
  title: string;
  completed: boolean;
  id: number;
}

const PersonalTasks = () => {
  const context = useContext(AuthContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    const getTasks = async () => {
      if (context.session?.user.id) {
        const { data, error } = await supabase
          .from("task")
          .select("due_date, title, completed, id")
          .eq("user_id", context.session?.user.id);
        if (error) {
          console.log(error);
        } else setTasks(data);
        console.log(data);
      }
    };
    getTasks();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks:</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>
              {item.due_date
                ? new Date(item.due_date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
            </Text>
            <Text>{item.title}</Text>
            <TouchableOpacity style={styles.taskProofButton}>
              <Entypo name="camera" size={30} color="white" />
            </TouchableOpacity>
          </View>
        )}
      ></FlatList>
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
  taskProofButton: {
    backgroundColor: "#242424",
    width: 45,
    height: 45,
    borderRadius: 45,
    alignItems: "center",
    justifyContent:"center",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
  },
});
