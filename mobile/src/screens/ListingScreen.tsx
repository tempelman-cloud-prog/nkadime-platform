import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from "react-native";
import { getListings, addFavorite, getFavorites, removeFavorite } from "../api";
import { Picker } from "@react-native-picker/picker";
import jwt_decode from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface JwtPayload {
  userId?: string;
  id?: string;
  email?: string;
}

const ListingScreen = ({ navigation }: any) => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [status, setStatus] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number | boolean> = {};
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;
      if (status) params.status = status;
      params.page = page;
      params.limit = pageSize;
      const data = await getListings(params);
      const activeListings = Array.isArray(data.listings)
        ? data.listings.filter((l: any) => !l.deleted)
        : [];
      setListings(activeListings);
      setTotal(data.total || 0);
      setPageSize(data.pageSize || 12);
      if (activeListings) {
        setCategories(
          Array.from(
            new Set(activeListings.map((l: any) => l.category).filter(Boolean))
          )
        );
      }
    } catch (err) {
      setError("Failed to load listings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [category, minPrice, maxPrice, sortBy, sortOrder, page, status, pageSize]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const decoded = jwt_decode<JwtPayload>(token);
        const userId = decoded.userId || decoded.id;
        if (userId) {
          getFavorites(userId).then((favs) => {
            setFavorites(favs.map((f: any) => f.listing._id));
          });
        }
      }
    };
    fetchFavorites();
  }, []);

  const handleFavorite = async (listingId: string) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      // Handle not logged in case
      return;
    }
    const decoded = jwt_decode<JwtPayload>(token);
    const userId = decoded.userId || decoded.id;
    if (!userId) return;

    if (favorites.includes(listingId)) {
      await removeFavorite(userId, listingId);
      setFavorites((favs) => favs.filter((id) => id !== listingId));
    } else {
      await addFavorite(userId, listingId);
      setFavorites((favs) => [...favs, listingId]);
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.description.toLowerCase().includes(search.toLowerCase()) ||
      listing.location.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ListingDetails", { id: item._id })}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.price}>
        {`P${Number(item.price).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })}`}{" "}
        {item.priceUnit || "per day"}
      </Text>
      <Text style={styles.location}>{item.location}</Text>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => handleFavorite(item._id)}
      >
        <Text>{favorites.includes(item._id) ? "❤️" : "🤍"}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, description, or location..."
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.row}>
          <Picker
            style={styles.picker}
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
          >
            <Picker.Item label="All Categories" value="" />
            {categories.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
          <Picker
            style={styles.picker}
            selectedValue={status}
            onValueChange={(itemValue) => setStatus(itemValue)}
          >
            <Picker.Item label="All Statuses" value="" />
            <Picker.Item label="Available" value="available" />
            <Picker.Item label="Pending Approval" value="pending approval" />
            <Picker.Item label="Unavailable" value="unavailable" />
          </Picker>
        </View>
        <View style={styles.row}>
          <Picker
            style={styles.picker}
            selectedValue={sortBy}
            onValueChange={(itemValue) => setSortBy(itemValue)}
          >
            <Picker.Item label="Sort by Newest" value="createdAt" />
            <Picker.Item label="Sort by Price" value="price" />
          </Picker>
          <Picker
            style={styles.picker}
            selectedValue={sortOrder}
            onValueChange={(itemValue) => setSortOrder(itemValue)}
          >
            <Picker.Item label="Descending" value="desc" />
            <Picker.Item label="Ascending" value="asc" />
          </Picker>
        </View>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text>Loading listings...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchListings()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          onEndReached={() => {
            if (page < total / pageSize) {
              setPage(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator /> : null}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text>No listings found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  filtersContainer: {
    padding: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  picker: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    marginBottom: 10,
  },
  retryText: {
    fontSize: 16,
    color: "#FF9800",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 18,
    marginVertical: 8,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  price: {
    fontSize: 18,
    color: "#FF9800",
    marginBottom: 2,
    fontWeight: "bold",
  },
  location: {
    fontSize: 15,
    color: "#666",
  },
  favoriteButton: {
    position: "absolute",
    top: 15,
    right: 15,
    padding: 5,
  },
});

export default ListingScreen;
