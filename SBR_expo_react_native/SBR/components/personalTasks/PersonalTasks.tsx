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

// 1. Update the Task interface to include 'completed_at'
interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  is_public: boolean;
  goal_id: number | null;
  completed: boolean;
  completed_at: string | null; // Add this field
}

const sortTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1; // Incomplete tasks first
    }
    const aDate = a.due_date ? new Date(a.due_date) : null;
    const bDate = b.due_date ? new Date(b.due_date) : null;
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    if (aDate && bDate) {
      return aDate.getTime() - bDate.getTime();
    }
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
  const [taskIdForCamera, setTaskIdForCamera] = useState<number | undefined>();

    // 1. Create a helper function to check if a task should be in our list
  const isTaskVisible = (task: Task): boolean => {
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    if (!task.completed) {
      return true; // Always show incomplete tasks
    }
    const completedTime = task.completed_at
      ? new Date(task.completed_at).getTime()
      : 0;
    return completedTime > twelveHoursAgo; // Show if completed recently
  };

  useEffect(() => {
    const getTasks = async () => {
      if (context.session?.user.id) {
        const twelveHoursAgo = new Date(
          Date.now() - 12 * 60 * 60 * 1000
        ).toISOString();
        const { data, error } = await supabase
          .from("task")
          .select(
            "id, title, description, due_date, is_public, goal_id, completed, completed_at"
          )
          .eq("user_id", context.session?.user.id)
          .or(
            `completed.eq.false,and(completed.eq.true,completed_at.gte.${twelveHoursAgo})`
          );
        if (error) {
          console.log("Error fetching tasks:", error);
        } else if (data) {
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
          const newTask = payload.new as Task;
          const oldId = (payload.old as { id: number })?.id;

          if (payload.eventType === "INSERT") {
            // Only add the new task if it matches our visibility criteria
            if (isTaskVisible(newTask)) {
              setTasks((prevTasks) =>
                sortTasks([...prevTasks, newTask])
              );
            }
          } else if (payload.eventType === "UPDATE") {
            const taskShouldBeVisible = isTaskVisible(newTask);

            setTasks((prevTasks) => {
              const taskExists = prevTasks.some((t) => t.id === newTask.id);

              if (taskShouldBeVisible && taskExists) {
                // If it should be visible and is already in the list, update it
                return sortTasks(
                  prevTasks.map((task) =>
                    task.id === newTask.id ? newTask : task
                  )
                );
              } else if (taskShouldBeVisible && !taskExists) {
                 // If it should be visible but ISN'T in the list, add it
                 return sortTasks([...prevTasks, newTask]);
              } else if (!taskShouldBeVisible && taskExists) {
                // If it should NOT be visible but IS in the list, remove it
                return prevTasks.filter((task) => task.id !== newTask.id);
              }
              // Otherwise, the state is correct, do nothing
              return prevTasks;
            });
          } else if (payload.eventType === "DELETE") {
            // The old ID is all we need for delete
            setTasks((prevTasks) =>
              prevTasks.filter((task) => task.id !== oldId)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
    };
  }, [context.session?.user.id]);

  // 4. Add an effect to periodically filter out old completed tasks from the state
  useEffect(() => {
    const interval = setInterval(() => {
      const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
      setTasks((currentTasks) =>
        currentTasks.filter((task) => {
          // Keep the task if it's not completed
          if (!task.completed) {
            return true;
          }
          // Keep the task if it was completed within the last 12 hours
          const completedTime = task.completed_at
            ? new Date(task.completed_at).getTime()
            : 0;
          return completedTime > twelveHoursAgo;
        })
      );
    }, 60 * 60 * 1000); // This check runs every hour

    return () => clearInterval(interval);
  }, []);

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleTaskDeleted = (taskId: number) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const handleCameraPress = (taskId: number) => {
    setTaskIdForCamera(taskId);
    setShowCameraModal(true);
  };

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
                  <TouchableOpacity
                    style={styles.taskProofButton}
                    onPress={() => handleCameraPress(item.id)}
                    disabled={item.completed}
                  >
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
          onPress={() => {
            setTaskIdForCamera(undefined);
            setShowCameraModal(true);
          }}
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
        taskId={taskIdForCamera}
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