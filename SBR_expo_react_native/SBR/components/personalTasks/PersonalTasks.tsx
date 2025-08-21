import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
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
        } else if (data) {
          // --- CHANGE: Sort the data before setting the state ---
          const sortedData = data.sort((a, b) => {
            // 1. Completed tasks come first
            if (a.completed !== b.completed) {
              return a.completed ? -1 : 1;
            }

            // For tasks with the same completion status:
            const aDate = a.due_date ? new Date(a.due_date) : null;
            const bDate = b.due_date ? new Date(b.due_date) : null;

            // 2. Tasks with a due date come before tasks without one
            if (aDate && !bDate) return -1;
            if (!aDate && bDate) return 1;

            // 3. If both have due dates, sort them chronologically
            if (aDate && bDate) {
              return aDate.getTime() - bDate.getTime();
            }

            // 4. If both have no due date, keep their original order
            return 0;
          });
          setTasks(sortedData);
        }
      }
    };
    getTasks();
  }, []); // The empty dependency array is correct for a fetch on mount

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks:</Text>
      <View style={styles.tasksContainer}>
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const now = new Date();
            const dueDate = item.due_date ? new Date(item.due_date) : null;
            const isOverdue = dueDate && dueDate < now && !item.completed;

            return (
              <View style={styles.taskContainer}>
                <Text
                  style={[
                    styles.bullet,
                    item.completed && styles.completedBullet,
                    isOverdue && styles.overdue,
                  ]}
                >
                  •
                </Text>
                <Text
                  style={[
                    styles.timeTaskText,
                    item.completed && styles.completedText,
                    isOverdue && styles.overdue,
                  ]}
                >
                  {item.due_date
                    ? new Date(item.due_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </Text>
                <Text
                  style={[
                    styles.standardTaskText,
                    item.completed && styles.completedText,
                    isOverdue && styles.overdue,
                  ]}
                >
                  {item.title}
                </Text>
                <TouchableOpacity style={styles.taskProofButton}>
                  {item.completed ? (
                    <AntDesign name="checkcircle" size={30} color="#3ECF8E" />
                  ) : (
                    <Entypo
                      name="camera"
                      size={30}
                      color={isOverdue ? "red" : "white"}
                    />
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        ></FlatList>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addTaskButton}>
          <AntDesign name="pluscircle" size={67} color="#3ECF8E" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.proofButton}>
          <Text style={styles.proofButtonText}>Proof</Text>
          <Entypo name="camera" size={60} color="#3ECF8E" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PersonalTasks;

const styles = StyleSheet.create({
  container: {
    height: "90%",
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
  tasksContainer: {
    marginTop: 25,
    marginLeft: 25,
    marginRight: 25,
    height: "75%",
  },
  taskContainer: {
    flexDirection: "row",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  bullet: { fontFamily: "Light", fontSize: 16, color: "white" },
  standardTaskText: {
    fontFamily: "Light",
    fontSize: 16,
    color: "white",
    width: 160,
  },
  timeTaskText: {
    fontFamily: "Light",
    fontSize: 20,
    color: "white",
    width: 70,
  },
  taskProofButton: {
    backgroundColor: "#242424",
    width: 45,
    height: 45,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
  },
  addTaskButton: {
    backgroundColor: "#242424",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    height: 90,
    width: 90,
    borderRadius: 100, // Corrected from "100%" to a number for React Native
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 20,
    marginRight: 20,
  },
  proofButton: {
    backgroundColor: "#242424",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    borderRadius: 20,
    height: 90,
    width: 180,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 10,
  },
  proofButtonText: { fontFamily: "Bold", color: "white", fontSize: 24 },
  completedText: {
    color: "#3ECF8E",
    textDecorationLine: "line-through", // This line adds the strikethrough
  },
  completedBullet: { color: "#3ECF8E" },
  overdue: {
    color: "red",
  },
});