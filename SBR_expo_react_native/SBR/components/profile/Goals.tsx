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
    }
  }, [user_id]);

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Goals</Text>
      <View>
        <FlatList
          data={goals}
          renderItem={({ item }) => {
            return <Text style={styles.listText}>• {item.title}</Text>;
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
        <TouchableOpacity>
          <MaterialCommunityIcons name="delete" size={25} color="#3ECF8E" />
        </TouchableOpacity>
      </View>
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
  listText: {
    fontSize: 16,
    color: "white",
    fontFamily: "Light",
    marginLeft: 5,
  },
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
