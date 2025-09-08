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
import CameraModal from "../camera/CameraModal";
import AddTaskModal from "./AddTaskModal";
import EditTaskModal from "./EditTaskModal";

interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  is_public: boolean;
  goal_id: number | null;
  completed: boolean;
}

// --- NEW: Sorting helper function to keep logic consistent ---
const sortTasks = (tasks: Task[]): Task[] => {
  // Create a shallow copy to avoid mutating the original array
  return [...tasks].sort((a, b) => {
    // 1. Completed tasks come first (as per your original logic)
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

    // 4. If both have no due date, maintain a stable order (by id)
    return a.id - b.id;
  });
};

const PersonalTasks = () => {
  const context = useContext(AuthContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddTask, setShowAddTask] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const getTasks = async () => {
      if (context.session?.user.id) {
        const { data, error } = await supabase
          .from("task")
          .select(
            "id, title, description, due_date, is_public, goal_id, completed"
          )
          .eq("user_id", context.session?.user.id);
        if (error) {
          console.log(error);
        } else if (data) {
          // --- CHANGE: Use the new sorting helper function ---
          setTasks(sortTasks(data));
        }
      }
    };

    getTasks();

    const taskChannel = supabase
      .channel(`task-channel-${context.session?.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task",
          filter: `user_id=eq.${context.session?.user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // --- CHANGE: Add the new task and re-sort the entire list ---
            setTasks((prevTasks) => sortTasks([...prevTasks, payload.new as Task]));
          } else if (payload.eventType === "UPDATE") {
            // --- CHANGE: Map the updated task and re-sort the list ---
            setTasks((prevTasks) =>
              sortTasks(
                prevTasks.map((task) =>
                  task.id === (payload.new as Task).id
                    ? (payload.new as Task)
                    : task
                )
              )
            );
          } else if (payload.eventType === "DELETE") {
            // --- NEW: Handle real-time deletions ---
            setTasks((prevTasks) =>
              prevTasks.filter((task) => task.id !== (payload.old as Task).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
    };
  }, [context.session?.user.id]);

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleTaskDeleted = (taskId: number) => {
    // This function provides an "optimistic" update for a smoother UX
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  return (
    // The rest of your JSX remains unchanged...
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
              <TouchableOpacity
                onPress={() => {
                  handleTaskPress(item);
                }}
              >
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
                          hour12: false,
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
              </TouchableOpacity>
            );
          }}
        ></FlatList>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.addTaskButton}
          onPress={() => setShowAddTask(true)}
        >
          <AntDesign name="pluscircle" size={67} color="#3ECF8E" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.proofButton}
          onPress={() => setShowCameraModal(true)}
        >
          <Text style={styles.proofButtonText}>Proof</Text>
          <Entypo name="camera" size={60} color="#3ECF8E" />
        </TouchableOpacity>
      </View>
      <AddTaskModal setShowAddTask={setShowAddTask} showAddTask={showAddTask} />
      {selectedTask && (
        <EditTaskModal
          setShowEditModal={setShowEditModal}
          showEditModal={showEditModal}
          task={selectedTask}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
      <CameraModal
        setShowCameraModal={setShowCameraModal}
        showCameraModal={showCameraModal}
      />
    </View>
  );
};

export default PersonalTasks;

// Styles remain unchanged...
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
    borderRadius: 100,
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
    textDecorationLine: "line-through",
  },
  completedBullet: { color: "#3ECF8E" },
  overdue: {
    color: "red",
  },
});