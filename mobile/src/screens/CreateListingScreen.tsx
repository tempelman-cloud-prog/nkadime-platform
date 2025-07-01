import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { createListing } from "../api";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { Colors } from "../constants/colors";

interface JwtPayload {
  userId?: string;
  id?: string;
  email?: string;
}

// type CreateListingScreenNavigationProp = StackNavigationProp<
//   RootStackParamList,
//   "CreateListing"
// >;

interface CreateListingScreenProps {
  navigation: any;
}

const CreateListingScreen = ({ navigation }: CreateListingScreenProps) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "0",
    location: "",
    priceUnit: "day",
  });
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [imageError, setImageError] = useState("");

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  // Validate and remove images (like web)
  const handleRemoveImage = (idx: number) => {
    setImages(images.filter((_, i: number) => i !== idx));
  };

  const handleImagePick = async () => {
    setImageError("");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      // Validate each file (max 5MB, image/*)
      for (const asset of result.assets) {
        if (!asset.type?.startsWith("image/")) {
          setImageError("Only image files are allowed.");
          return;
        }
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          setImageError("Each image must be less than 5MB.");
          return;
        }
      }
      setImages(result.assets);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const token = await AsyncStorage.getItem("token");
    let userId = "";
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
      userId = decoded.userId || decoded.id || "";
    }
    if (!userId) {
      Alert.alert("Error", "You must be logged in to create a listing.");
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("owner", userId);
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("price", form.price);
    formData.append("location", form.location);
    formData.append("priceUnit", form.priceUnit);
    images.forEach((image: ImagePicker.ImagePickerAsset) => {
      const uriParts = image.uri.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("images", {
        uri: image.uri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    });

    try {
      // Note: The createListing function in api.ts needs to be adapted for FormData
      const result = await createListing(formData as any); // Casting as any to bypass type checking for FormData
      if (result._id) {
        Alert.alert("Success", "Listing created!");
        navigation.navigate("ListingDetails", { listingId: result._id });
      } else {
        Alert.alert("Error", result.error || "Failed to create listing");
      }
    } catch (_error: any) {
      Alert.alert("Error", "Network or server error. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create a New Listing</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={form.title}
        onChangeText={(val) => handleChange("title", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={form.description}
        onChangeText={(val) => handleChange("description", val)}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Category"
        value={form.category}
        onChangeText={(val) => handleChange("category", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={form.location}
        onChangeText={(val) => handleChange("location", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Price"
        value={form.price}
        onChangeText={(val) => handleChange("price", val)}
        keyboardType="numeric"
      />
      {/* Simple picker might be better here */}
      <TextInput
        style={styles.input}
        placeholder="Price Unit (day, week, month)"
        value={form.priceUnit}
        onChangeText={(val) => handleChange("priceUnit", val)}
      />

      <Button title="Pick Images" onPress={handleImagePick} />
      {imageError ? (
        <Text style={{ color: 'red', marginBottom: 8 }}>{imageError}</Text>
      ) : null}
      <View style={styles.imagePreviewContainer}>
        {images.map((image: ImagePicker.ImagePickerAsset, index: number) => (
          <View key={index} style={{ position: 'relative', marginRight: 8 }}>
            <Image
              source={{ uri: image.uri }}
              style={styles.previewImage}
            />
            <Button
              title="Remove"
              color="#C62828"
              onPress={() => handleRemoveImage(index)}
            />
          </View>
        ))}
      </View>

      <Button
        title={submitting ? "Creating..." : "Create Listing"}
        onPress={handleSubmit}
        disabled={submitting}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 16,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    margin: 4,
  },
});

export default CreateListingScreen;
