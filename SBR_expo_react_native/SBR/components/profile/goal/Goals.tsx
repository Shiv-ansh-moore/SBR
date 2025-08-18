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

      const goalChannel = supabase
        .channel(`goals-channel-${user_id}`)
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
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            // Each list item is a row
            <View style={styles.listItemContainer}>
              {/* The bullet and title are now separate */}
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.listItemText}>{item.title}</Text>

              {/* The action buttons are grouped in their own container */}
              <View style={styles.actionButtonsContainer}>
                {deleteMode && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleOpenDeleteModal(item)}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color="red" />
                  </TouchableOpacity>
                )}
                {editMode && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setSelectedGoal(item);
                      setShowEditGoal(true);
                    }}
                  >
                    <Feather name="edit" size={20} color="orange" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={styles.noGoalsText}>No Goals yet. Add one!</Text>
          )}
        />
      </View>
      <View style={styles.crudBox}>
        <TouchableOpacity onPress={handleAddGoal}>
          <Ionicons name="add-circle" size={25} color="#3ECF8E" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEditGoalMode}>
          <Feather
            name="edit"
            size={25}
            color={editMode ? "orange" : "#3ECF8E"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteMode}>
          <MaterialCommunityIcons
            name="delete"
            size={25}
            color={deleteMode ? "red" : "#3ECF8E"}
          />
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
    width: "90%",
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

  // --- FIXED & NEW STYLES FOR THE LIST ---
  listItemContainer: {
    flexDirection: "row",
    alignItems: "flex-start", // Aligns items to the top, perfect for multi-line text
    paddingHorizontal: 10,
    marginVertical: 4,
  },
  bulletPoint: {
    fontSize: 16,
    color: "white",
    fontFamily: "Light",
    marginRight: 6, // Creates space between the bullet and the text
    lineHeight: 22, // Helps align the bullet with the first line of text
  },
  listItemText: {
    flex: 1, // **Crucial**: Allows the text to take available space and wrap
    fontSize: 16,
    color: "white",
    fontFamily: "Light",
    lineHeight: 22, // Ensures consistent line spacing on wrap
  },
  actionButtonsContainer: {
    flexDirection: "row",
    marginLeft: 8, // Adds a small gap between the text and the icons
  },
  actionButton: {
    padding: 2,
    marginLeft: 4,
  },
  // ------------------------------------------

  crudBox: {
    width: "95%",
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
  },
  noGoalsText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: "Light",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
});