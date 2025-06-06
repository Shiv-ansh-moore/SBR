import { useContext, useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { supabase } from "../../lib/supabaseClient";
import { AuthContext } from "../../providers/AuthProvider";

const Picture = () => {
  const context = useContext(AuthContext);
  const [imageLink, setImageLink] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      if (context.session?.user.id) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("profile_pic")
          .eq("id", context.session.user.id)
          .single();

        if (userError) {
          console.log("error fetching profile pic path");
          return;
        }

        const imagePath = userData?.profile_pic;

        // 2. If a path exists, create the signed URL.
        if (imagePath) {
          const { data: urlData, error: urlError } = await supabase.storage
            .from("profilepic")
            .createSignedUrl(imagePath, 500);
          if (urlData) {
            setImageLink(urlData.signedUrl);
          }
          if (urlError) {
            console.log(urlError);
          }
        } else {
          setImageLink(null);
        }
      }
    };

    fetchImage();
  }, [context.session]);

  return (
    <View>
      <Image
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
