import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "react-native-image-picker";
import { Image } from "react-native";
import { ImagePickerResponse } from "react-native-image-picker";
import { Colors } from "../constants/colors";

const API_BASE = "http://localhost:5000/api";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          setUser(userObj);
          setName(userObj.name || "");
          setEmail(userObj.email || "");
          setProfilePic(userObj.profilePic || null);
        }
      } catch (e) {
        /* Intentionally ignore errors during user ID loading */
      }
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    navigation.reset({ index: 0, routes: [{ name: "Login" as never }] });
  };

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert("Name and email are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/users/${user.id || user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          ...(password ? { password } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error)
        throw new Error(data.error || "Failed to update profile");
      // Update AsyncStorage
      const updatedUser = { ...user, name, email };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditMode(false);
      setPassword("");
      Alert.alert("Profile updated!");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    ImagePicker.launchImageLibrary(
      { mediaType: "photo", quality: 0.7 },
      async (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) return;
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          if (asset.uri) {
            setUploading(true);
            try {
              const formData = new FormData();
              formData.append("profilePic", {
                uri: asset.uri,
                name: asset.fileName || "profile.jpg",
                type: asset.type || "image/jpeg",
              } as any);
              const res = await fetch(
                `${API_BASE}/users/${user.id || user._id}`,
                {
                  method: "PUT",
                  headers: { Authorization: "" }, // Add auth if needed
                  body: formData,
                },
              );
              const data = await res.json();
              if (!res.ok || data.error)
                throw new Error(data.error || "Failed to upload image");
              setProfilePic(data.profilePic || asset.uri);
              const updatedUser = {
                ...user,
                profilePic: data.profilePic || asset.uri,
              };
              await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
              setUser(updatedUser);
              Alert.alert("Profile picture updated!");
            } catch (e: any) {
              Alert.alert("Error", e.message || "Could not upload image.");
            } finally {
              setUploading(false);
            }
          }
        }
      },
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        {profilePic ? (
          <Image
            source={{ uri: profilePic }}
            style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 8 }}
          />
        ) : (
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: Colors.mediumGray,
              marginBottom: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: Colors.textLight, fontSize: 32 }}>👤</Text>
          </View>
        )}
        <Button
          title={uploading ? "Uploading..." : "Change Picture"}
          color={Colors.textSecondary}
          onPress={handlePickImage}
          disabled={uploading}
        />
      </View>
      {editMode ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="New Password (leave blank to keep current)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <Button
              title={saving ? "Saving..." : "Save"}
              color={Colors.success}
              onPress={handleSave}
              disabled={saving}
            />
            <Button
              title="Cancel"
              color={Colors.textLight}
              onPress={() => {
                setEditMode(false);
                setPassword("");
                setName(user.name);
                setEmail(user.email);
              }}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{user?.name}</Text>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email}</Text>
          <Button
            title="Edit Profile"
            color={Colors.primary}
            onPress={() => setEditMode(true)}
          />
          <View style={{ marginTop: 12 }}>
            <Button
              title="View Disputes"
              onPress={() =>
                navigation.navigate("ProfileDisputes", { userId: user?._id })
              }
            />
          </View>
        </>
      )}
      <View style={{ marginTop: 24 }}>
        <Button title="Logout" color={Colors.error} onPress={handleLogout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    color: Colors.textPrimary,
  },
  input: {
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: Colors.cardBackground,
  },
  label: { fontWeight: "bold", marginTop: 12, color: Colors.textPrimary },
  value: { fontSize: 16, marginBottom: 8, color: Colors.textSecondary },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
});

export default ProfileScreen;
