import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// TypeScript interface to match the data from your SQL function
interface TaskCounts {
  completed_today: number;
  pending_today: number;
  overdue: number;
}

const TaskCounter = () => {
  const { session } = useContext(AuthContext);
  const [counts, setCounts] = useState<TaskCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    const fetchCounts = async () => {
      // This calls the SQL function you provided
      const { data, error } = await supabase
        .rpc("get_user_task_counts", { p_user_id: userId })
        .single();

      if (error) {
        console.error("Error fetching task counts:", error);
        setCounts(null);
      } else {
        setCounts(data);
      }
      setLoading(false);
    };

    fetchCounts();

    // Set up a real-time listener to re-fetch counts when tasks change
    const taskChannel = supabase
      .channel(`task-count-channel-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchCounts()
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(taskChannel);
    };
  }, [session?.user?.id]);

  // --- Rendering Logic ---
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#3ECF8E" />;
    }
    if (!counts) {
      return <Text style={styles.errorText}>Error loading tasks</Text>;
    }

    return (
      <>
        {/* Top-Left Corner: Completed */}
        <View style={[styles.corner, styles.topLeft]}>
          <Text style={[styles.cornerText, styles.greenText]}>
            {counts.completed_today}
          </Text>
        </View>

        {/* Center: Pending Tasks */}
        <View style={styles.center}>
          <Text style={styles.centerNumber}>{counts.pending_today}</Text>
          <Text style={styles.centerLabel}>Pending</Text>
        </View>

        {/* Bottom-Right Corner: Overdue */}
        <View style={[styles.corner, styles.bottomRight]}>
          <Text
            style={[
              styles.cornerText,
              // Apply red color only if overdue count is > 0
              counts.overdue > 0 ? styles.redText : styles.neutralText,
            ]}
          >
            {counts.overdue}
          </Text>
        </View>
      </>
    );
  };

  return <View style={styles.box}>{renderContent()}</View>;
};

export default TaskCounter;

// --- Styles ---
const styles = StyleSheet.create({
  box: {
    height: 120,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderRadius: 20,
    backgroundColor: "#171717",
    justifyContent: "center",
    alignItems: "center",
    position: "relative", // Needed for absolute positioning of corners
  },
  center: {
    alignItems: "center",
  },
  centerNumber: {
    fontFamily: "Bold",
    fontSize: 64,
    color: "white",
    lineHeight: 70,
  },
  centerLabel: {
    fontFamily: "SemiBold",
    fontSize: 14,
    color: "#AAAAAA",
    marginTop: -8,
  },
  corner: {
    position: "absolute", // Position corners relative to the parent 'box'
  },
  topLeft: {
    top: 8,
    left: 12,
  },
  bottomRight: {
    bottom: 8,
    right: 12,
  },
  cornerText: {
    fontFamily: "Bold",
    fontSize: 22,
  },
  greenText: {
    color: "#3ECF8E", // Green for completed
  },
  redText: {
    color: "#FF6347", // Red for overdue
  },
  neutralText: {
    color: "#AAAAAA", // Grey for zero overdue
  },
  errorText: {
    fontFamily: "SemiBold",
    fontSize: 14,
    color: "#FF6347",
  },
});