// src/components/GroupImagePicker.tsx

import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

// Define a shared interface for the image data
export interface NewImageData {
  base64: string;
  mimeType: string;
}

interface GroupImagePickerProps {
  // Callback function to pass image data to the parent
  onImageSelected: (imageData: NewImageData | null) => void;
}

const GroupImagePicker = ({ onImageSelected }: GroupImagePickerProps) => {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    // const permissionResult =
    //   await ImagePicker.requestMediaLibraryPermissionsAsync();
    // if (permissionResult.granted === false) {
    //   Alert.alert("Permission Required", "You need to allow access to your photos to set a group image.");
    //   return;
    // }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Reduced quality for faster uploads
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.uri && asset.base64 && asset.mimeType) {
        setImageUri(asset.uri);
        onImageSelected({ base64: asset.base64, mimeType: asset.mimeType });
      } else {
        Alert.alert("Error", "Could not read the selected image data.");
        onImageSelected(null);
      }
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera" size={40} color="#555" />
            <Text style={styles.placeholderText}>Select Image</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#242424",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#888",
    marginTop: 5,
    fontFamily: "Light",
  },
});

export default GroupImagePicker;