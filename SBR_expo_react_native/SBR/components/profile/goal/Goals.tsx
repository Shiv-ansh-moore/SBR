import DeleteGoalModal from "@/components/profile/goal/DeleteGoalModal";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useContext, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EditGoalModal from "./EditGoalModal";
import GoalFormModal from "./GoalFormModal";

interface Goal {
  id: number;
  title: string;
}

const Goals = () => {
  const user_id = useContext(AuthContext).session?.user.id;
  const [goals, setGoals] = useState<Goal[]>([]);
  const [deleteMode, setDeleteMode] = useState<boolean>(false);
  const [showDeleteGoal, setShowDeleteGoal] = useState<boolean>(false);
  const goalChannel = supabase.channel("goalChannel");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [showEditGoal, setShowEditGoal] = useState<boolean>(false);
  const [showAddGoal, setShowAddGoal] = useState<boolean>(false);

  useEffect(() => {
    if (user_id) {
      const getGoals = async () => {
        const { data, error } = await supabase
          .from("goals")
          .select("id ,title")
          .eq("user_id", user_id);
        if (error) {
          console.log(error);
        } else if (data) {
          setGoals(data);
        }
      };
      getGoals();
      goalChannel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "goals",
            filter: `user_id=eq.${user_id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setGoals((prevGoals) => [...prevGoals, payload.new as Goal]);
            } else if (payload.eventType === "UPDATE") {
              setGoals((prevGoals) =>
                prevGoals.map((goal) =>
                  goal.id === (payload.new as Goal).id
                    ? (payload.new as Goal)
                    : goal
                )
              );
            }
          }
        )
        .subscribe();
      return () => {
        console.log("Cleaning up the channel!");
        supabase.removeChannel(goalChannel);
      };
    }
  }, [user_id]);

  const handleOpenDeleteModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDeleteGoal(true);
  };
  const handleAddGoal = () => {
    setShowAddGoal(true);
    setDeleteMode(false);
    setEditMode(false);
  };

  const handleDeleteMode = () => {
    setDeleteMode((currentMode) => !currentMode);
    setEditMode(false);
  };

  const handleEditGoalMode = () => {
    setEditMode((currentMode) => !currentMode);
    setDeleteMode(false);
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", selectedGoal.id);

    if (error) {
      console.log(error);
    } else {
      setGoals((currentGoals) =>
        currentGoals.filter((goal) => goal.id !== selectedGoal.id)
      );
    }
    setShowDeleteGoal(false);
    setSelectedGoal(null);
    setDeleteMode(false);
  };

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Goals</Text>
      <View style={styles.listContainer}>
        <FlatList
          data={goals}      
          renderItem={({ item }) => {
            return (
              <View style={styles.listTextContainer}>
                <Text style={styles.listText}>• {item.title}</Text>
                {deleteMode && (
                  <TouchableOpacity
                    style={styles.deleteGoalButton}
                    onPress={() => handleOpenDeleteModal(item)}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={20}
                      color="red"
                    />
                  </TouchableOpacity>
                )}
                {editMode && (
                  <TouchableOpacity
                    style={styles.deleteGoalButton}
                    onPress={() => {
                      setSelectedGoal(item);
                      setShowEditGoal(true);
                    }}
                  >
                    <Feather name="edit" size={20} color="orange" />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        ListEmptyComponent={() => (
                  <Text style={styles.noGoalsText}>No Goals yet. Add one!</Text>
                )}></FlatList>
      </View>
      <View style={styles.crudBox}>
        <TouchableOpacity onPress={() => handleAddGoal()}>
          <Ionicons name="add-circle" size={25} color="#3ECF8E" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEditGoalMode()}>
          {editMode ? (
            <Feather name="edit" size={25} color="orange" />
          ) : (
            <Feather name="edit" size={25} color="#3ECF8E" />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteMode()}>
          {deleteMode ? (
            <MaterialCommunityIcons name="delete" size={25} color="red" />
          ) : (
            <MaterialCommunityIcons name="delete" size={25} color="#3ECF8E" />
          )}
        </TouchableOpacity>
      </View>
      <DeleteGoalModal
        setShowDeleteGoal={setShowDeleteGoal}
        showDeleteGoal={showDeleteGoal}
        goalTitle={selectedGoal?.title}
        onDeleteConfirm={handleDeleteGoal}
      />
      <EditGoalModal
        showEditGoal={showEditGoal}
        setShowEditGoal={setShowEditGoal}
        goalId={selectedGoal?.id ?? null}
        setEditMode={setEditMode}
      />
      <GoalFormModal
        showAddGoal={showAddGoal}
        setShowAddGoal={setShowAddGoal}
      />
    </View>
  );
};
export default Goals;
const styles = StyleSheet.create({
  box: {
    height: 255,
    width: 333,
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    backgroundColor: "#171717",
  },
  title: {
    fontSize: 24,
    color: "white",
    fontFamily: "SemiBold",
    marginLeft: 10,
  },
  listContainer: { height: 180 },
  listTextContainer: { flexDirection: "row", justifyContent: "space-between" },
  listText: {
    fontSize: 16,
    color: "white",
    fontFamily: "Light",
    marginLeft: 5,
  },
  deleteGoalButton: { marginRight: 5 },
  crudBox: {
    width: 313,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#242424",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 5,
    alignSelf: "center",
    position: "absolute",
    bottom: 0,
  },  noGoalsText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: "Light",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
});