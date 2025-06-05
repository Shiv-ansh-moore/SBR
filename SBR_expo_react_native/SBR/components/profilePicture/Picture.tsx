import { useContext, useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { supabase } from "../../lib/supabaseClient";
import { AuthContext } from "../../providers/AuthProvider";

const Picture = () => {
  const context = useContext(AuthContext);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imageLink, setImageLink] = useState<string | null>(null);

  useEffect(() => {
    const fetchImagePath = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("profile_pic")
        .eq("id", context.session?.user.id);
      if (data) {
        setImagePath(data[0].profile_pic);
      }
      if (error) {
        console.log("error fetching profile pic");
      }
    };
    fetchImagePath();
  }, [context.session]);

  useEffect(() => {
    const fetchImage = async () => {
      if (imagePath) {
        console.log(imagePath)
        const { data, error } = await supabase.storage
          .from("profilepic")
          .createSignedUrl(imagePath, 500);
        if (data) {
          setImageLink(data.signedUrl);
        }
        if (error) {
          console.log(error);
        }
      } else {
        console.log("imageLink is null, cannot create signed URL");
      }
    };
    fetchImage();
  }, [imagePath]);

  return (
    <View>
      <Image
        // If imageLink exists, use it as the source. Otherwise, use the default image.
        source={
          imageLink
            ? { uri: imageLink }
            : require("../../assets/images/profilePic/defaultProfile.jpg")
        }
        style={styles.image}
      />
    </View>
  );
};

export default Picture;

const styles = StyleSheet.create({
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
