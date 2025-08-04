import DeleteGoalModal from "@/components/profile/DeleteGoalModal";
import { supabase } from "@/lib/supabaseClient";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthContext } from "../../providers/AuthProvider";

interface GoalsProps {
  setShowAddGoal: Dispatch<SetStateAction<boolean>>;
}
interface Goal {
  id: number;
  title: string;
}

const Goals = ({ setShowAddGoal }: GoalsProps) => {
  const user_id = useContext(AuthContext).session?.user.id;
  const [goals, setGoals] = useState<Goal[]>([]);
  const [deleteMode, setDeleteMode] = useState<boolean>(false);
  const [showDeleteGoal, setShowDeleteGoal] = useState<boolean>(false);
  const goalChannel = supabase.channel("goalChannel");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

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

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return; // Guard against no selected goal

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
    // Close modal and reset state
    setShowDeleteGoal(false);
    setSelectedGoal(null);
    setDeleteMode(false); // Optionally turn off delete mode after a deletion
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
              </View>
            );
          }}
        ></FlatList>
      </View>
      <View style={styles.crudBox}>
        <TouchableOpacity onPress={() => setShowAddGoal(true)}>
          <Ionicons name="add-circle" size={25} color="#3ECF8E" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Feather name="edit" size={25} color="#3ECF8E" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDeleteMode((currentMode) => !currentMode)}
        >
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
  },
});
