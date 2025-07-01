import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App";

type EditListingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "EditListing"
>;
type EditListingScreenRouteProp = RouteProp<RootStackParamList, "EditListing">;

interface EditListingScreenProps {
  navigation: EditListingScreenNavigationProp;
  route: EditListingScreenRouteProp;
}
import { getListings, updateListing } from "../api";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../constants/colors";

const EditListingScreen = ({ route, navigation }) => {
  const { listingId } = route.params;
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "0",
    priceUnit: "day",
    location: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListing() {
      try {
        const allListings = await getListings();
        const found = (allListings.listings || []).find(
          (l: any) => l._id === listingId,
        );
        if (found) {
          setForm({
            title: found.title || "",
            description: found.description || "",
            category: found.category || "",
            price: String(found.price) || "0",
            priceUnit: found.priceUnit || "day",
            location: found.location || "",
          });
        } else {
          setError("Listing not found.");
        }
      } catch (_error: any) {
        setError("Failed to load listing. Please try again.");
      }
      setLoading(false);
    }
    fetchListing();
  }, [listingId]);

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("price", form.price);
      formData.append("priceUnit", form.priceUnit);
      formData.append("location", form.location);
      if (image) {
        const uriParts = image.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];
        formData.append("images", {
          uri: image.uri,
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      result = await updateListing(listingId, formData);

      if (!result.error) {
        Alert.alert("Success", "Listing updated!");
        navigation.goBack();
      } else {
        Alert.alert("Error", result.error || "Failed to update listing");
      }
    } catch (_error: any) {
      Alert.alert("Error", "Network or server error. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Alert.alert title="Error" message={error} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Listing</Text>
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
      <TextInput
        style={styles.input}
        placeholder="Price Unit (day, week, month)"
        value={form.priceUnit}
        onChangeText={(val) => handleChange("priceUnit", val)}
      />

      <Button title="Pick an Image" onPress={handleImagePick} />
      {image && (
        <Image source={{ uri: image.uri }} style={styles.previewImage} />
      )}

      <Button
        title={submitting ? "Saving..." : "Save Changes"}
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
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginVertical: 16,
  },
});

export default EditListingScreen;
