import DeleteHabitModal from "@/components/profile/habit/DeleteHabitModal";
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
import EditHabitModal from "./EditHabitModal";
import HabitFormModal from "./HabitFormModal";

// Define a type for the habit data for better type safety
interface Habit {
  id: number;
  title: string;
}

const Habits = () => {
  const userId = useContext(AuthContext).session?.user.id;

  // State for data and UI modes
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showAddHabit, setShowAddHabit] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [showEditHabit, setShowEditHabit] = useState<boolean>(false);
  const [deleteMode, setDeleteMode] = useState<boolean>(false);
  const [showDeleteHabit, setShowDeleteHabit] = useState<boolean>(false);

  // Supabase real-time subscription
  useEffect(() => {
    if (userId) {
      const habitChannel = supabase.channel(`habit-channel-${userId}`);
      const getHabits = async () => {
        const { data, error } = await supabase
          .from("habits")
          .select("id, title")
          .eq("user_id", userId);

        if (error) {
          console.log("Error fetching habits:", error);
        } else if (data) {
          setHabits(data);
        }
      };

      getHabits();

      habitChannel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "habits",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setHabits((prev) => [...prev, payload.new as Habit]);
            } else if (payload.eventType === "UPDATE") {
              setHabits((prev) =>
                prev.map((habit) =>
                  habit.id === (payload.new as Habit).id
                    ? (payload.new as Habit)
                    : habit
                )
              );
            } else if (payload.eventType === "DELETE") {
              setHabits((prev) =>
                prev.filter((habit) => habit.id !== (payload.old as Habit).id)
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(habitChannel);
      };
    }
  }, [userId]);

  // --- Handler Functions ---

  const handleAddHabit = () => {
    setShowAddHabit(true);
    setDeleteMode(false);
    setEditMode(false);
  };

  const handleEditMode = () => {
    setEditMode((current) => !current);
    setDeleteMode(false);
  };

  const handleDeleteMode = () => {
    setDeleteMode((current) => !current);
    setEditMode(false);
  };

  const handleOpenDeleteModal = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowDeleteHabit(true);
  };

  const handleOpenEditModal = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowEditHabit(true);
  };

  const handleDeleteHabit = async () => {
    if (!selectedHabit) return;

    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", selectedHabit.id);

    if (error) {
      console.log("Error deleting habit:", error);
    } else {
      setHabits((currentHabits) =>
        currentHabits.filter((habit) => habit.id !== selectedHabit.id)
      );
    }
    setShowDeleteHabit(false);
    setSelectedHabit(null);
    setDeleteMode(false);
  };

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Habits</Text>
      <View style={styles.listContainer}>
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.listTextContainer}>
              <Text style={styles.listText}>• {item.title}</Text>
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
                  onPress={() => handleOpenEditModal(item)}
                >
                  <Feather name="edit" size={20} color="orange" />
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={styles.noItemsText}>No habits yet. Add one!</Text>
          )}
        />
      </View>

      <View style={styles.crudBox}>
        <TouchableOpacity onPress={handleAddHabit}>
          <Ionicons name="add-circle" size={25} color="#3ECF8E" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEditMode}>
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

      {/* --- Modals --- */}
      <HabitFormModal
        showAddHabit={showAddHabit}
        setShowAddHabit={setShowAddHabit}
      />
      <DeleteHabitModal
        showDeleteHabit={showDeleteHabit}
        setShowDeleteHabit={setShowDeleteHabit}
        habitTitle={selectedHabit?.title}
        onDeleteConfirm={handleDeleteHabit}
      />
      <EditHabitModal
        showEditHabit={showEditHabit}
        setShowEditHabit={setShowEditHabit}
        habitId={selectedHabit?.id ?? null}
        setEditMode={setEditMode}
      />
    </View>
  );
};

export default Habits;

// Styles are now matched with Goals component
const styles = StyleSheet.create({
  box: {
    height: 255,
    width: 160,
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
  actionButton: {
    marginRight: 5,
    padding: 2,
  },
  crudBox: {
    width: 140, // Adjusted for the smaller width
    height: 30,
    borderRadius: 20,
    backgroundColor: "#242424",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    alignSelf: "center",
    position: "absolute",
    bottom: 10,
  },
  noItemsText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: "Light",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
});
