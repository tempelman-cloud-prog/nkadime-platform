import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

const API_BASE = 'http://localhost:5000/api';

const ListingScreen = ({ navigation }: any) => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/listings`);
        const data = await res.json();
        setListings(data.listings || []);
      } catch (e) {
        setError('Failed to load listings.');
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  // Helper: format price with currency (Botswana Pula)
  const formatPrice = (price: number) => `P${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={listings}
      keyExtractor={item => item._id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ListingDetails', { id: item._id })}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.price}>{formatPrice(item.price)} {item.priceUnit || 'per day'}</Text>
          <Text style={styles.location}>{item.location}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32 }}>No listings found.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, color: '#0a2342' },
  price: { fontSize: 18, color: '#FF9800', marginBottom: 2 },
  location: { fontSize: 15, color: '#333' },
});

export default ListingScreen;
