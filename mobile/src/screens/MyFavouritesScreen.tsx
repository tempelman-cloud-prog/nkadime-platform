import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { getFavorites, removeFavorite } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import { Colors } from "../constants/colors";

interface JwtPayload {
  userId?: string;
  id?: string;
  email?: string;
}

import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";

type MyFavouritesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MyFavourites"
>;

interface MyFavouritesScreenProps {
  navigation: MyFavouritesScreenNavigationProp;
}

const MyFavouritesScreen = ({ navigation }: MyFavouritesScreenProps) => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to view your favourites.");
        setLoading(false);
        return;
      }
      const decoded = jwt_decode<JwtPayload>(token);
      const userId = decoded.userId || decoded.id;
      if (!userId) {
        setError("Invalid user token.");
        setLoading(false);
        return;
      }
      getFavorites(userId).then((favs) => {
        setFavorites(favs.map((f: any) => f.listing));
        setLoading(false);
      });
    };
    fetchFavorites();
  }, []);

  const handleRemove = async (listingId: string) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    const decoded = jwt_decode<JwtPayload>(token);
    const userId = decoded.userId || decoded.id;
    if (!userId) return;
    await removeFavorite(userId, listingId);
    setFavorites((favs) => favs.filter((l: any) => l._id !== listingId));
  };

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.info} />;
  }

  if (error) {
    return <Alert.alert title="Error" message={error} />;
  }

  const renderFavorite = ({ item }) => (
    <View style={styles.listingContainer}>
      <TouchableOpacity
        onPress={() => handleRemove(item._id)}
        style={styles.removeButton}
      >
        <Text style={styles.removeButtonText}>♥</Text>
      </TouchableOpacity>
      {item.images && item.images.length > 0 && (
        <Image
          source={{
            uri: `https://nkadime-platform.onrender.com${item.images[0]}`,
          }}
          style={styles.listingImage}
        />
      )}
      <View style={styles.listingDetails}>
        <Text style={styles.listingTitle}>{item.title}</Text>
        <Text style={styles.listingPrice}>
          {item.price} {item.priceUnit || ""}
        </Text>
        <Text style={styles.listingLocation}>{item.location}</Text>
        <Text style={styles.listingDescription}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Favourites</Text>
      {favorites.length === 0 ? (
        <Text>You have no favourite listings yet.</Text>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(__, idx) => idx.toString()}
        />
      )}
    </View>
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
  listingContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    shadowColor: Colors.textDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  removeButton: {
    position: "absolute",
    top: 18,
    left: 18,
    backgroundColor: Colors.primary,
    borderRadius: 19,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  removeButtonText: {
    color: Colors.cardBackground,
    fontSize: 22,
    fontWeight: "900",
  },
  listingImage: {
    width: "100%",
    height: 190,
  },
  listingDetails: {
    padding: 24,
  },
  listingTitle: {
    fontWeight: "800",
    fontSize: 22,
    color: Colors.primary,
    marginBottom: 10,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  listingLocation: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  listingDescription: {
    fontSize: 16,
    color: Colors.textDark,
  },
});

export default MyFavouritesScreen;
