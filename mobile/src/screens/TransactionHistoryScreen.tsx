import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_BASE = 'http://localhost:5000/api';

const TransactionHistoryScreen = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      setError('');
      try {
        // TODO: Replace with actual user ID/auth
        const userId = 'demo-user';
        const res = await fetch(`${API_BASE}/rentals/history/${userId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setTransactions(data);
        } else if (Array.isArray(data.rentals)) {
          setTransactions(data.rentals);
        } else {
          setTransactions([]);
        }
      } catch (e) {
        setError('Failed to load transactions.');
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
  };

  // Helper: format price with currency (Botswana Pula)
  const formatPrice = (price: number) => `P${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#FF9800" /></View>;
  }
  if (error) {
    return <View style={styles.centered}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }
  if (!transactions.length) {
    return <View style={styles.centered}><Text>No transactions found.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction History</Text>
      <Button title="Logout" color="#d32f2f" onPress={handleLogout} />
      <FlatList
        data={transactions}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.listing?.title || 'Listing'}</Text>
            <Text>Status: {item.status}</Text>
            <Text style={styles.price}>Amount: {formatPrice(item.amount || item.payment?.amount || 0)}</Text>
            <Text>Start: {item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}</Text>
            <Text>End: {item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  listContainer: { paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 14, elevation: 2 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  price: { fontSize: 18, color: '#FF9800', marginBottom: 2 },
});

export default TransactionHistoryScreen;
