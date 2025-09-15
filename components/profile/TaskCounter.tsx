import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  TextStyle, // Import TextStyle for type safety
} from "react-native";

// --- Interfaces (No Change) ---
interface TaskCounts {
  completed_today: number;
  pending_today: number;
  overdue: number;
}

// --- Main Component ---
const TaskCounter = () => {
  const { session } = useContext(AuthContext);
  const [counts, setCounts] = useState<TaskCounts | null>(null);
  const [loading, setLoading] = useState(true);

  // Data fetching logic is unchanged
  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const fetchCounts = async () => {
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
    return () => {
      supabase.removeChannel(taskChannel);
    };
  }, [session?.user?.id]);

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#3ECF8E" />;
    }
    if (!counts) {
      return <Text style={styles.errorText}>Error</Text>;
    }

    // The "Scoreboard" layout
    return (
      <>
        {/* Top-Left Corner: Completed */}
        <View style={[styles.corner, styles.topLeft]}>
          <Text style={[styles.cornerText, styles.greenText]}>
            {counts.completed_today}
          </Text>
        </View>

        {/* Center Stage: Pending */}
        <View style={styles.center}>
          <Text style={styles.centerNumber}>{counts.pending_today}</Text>
          <Text style={styles.centerLabel}>Pending</Text>
        </View>

        {/* Bottom-Right Corner: Overdue */}
        <View style={[styles.corner, styles.bottomRight]}>
          {/* ✨ FIX 1: Apply style conditionally here in the JSX */}
          <Text
            style={[
              styles.cornerText,
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

// Styles for the Scoreboard layout
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
    position: "relative",
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
    position: "absolute",
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
    color: "#3ECF8E",
  },
  // ✨ FIX 2: Replace the function with two static style objects.
  redText: {
    color: "#FF6347",
  },
  neutralText: {
    color: "#AAAAAA",
  },
  errorText: {
    fontFamily: "SemiBold",
    fontSize: 14,
    color: "#FF6347",
  },
});