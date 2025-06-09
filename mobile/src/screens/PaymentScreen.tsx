import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';

const API_BASE = 'http://localhost:5000/api';

const PaymentScreen = ({ route, navigation }: any) => {
  // For demo: expect rentalId and amount passed via route.params
  const { rentalId, amount } = route?.params || {};
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper: format price with currency (Botswana Pula)
  const formatPrice = (price: number) => `P${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvc) {
      Alert.alert('Please fill in all payment fields.');
      return;
    }
    setLoading(true);
    try {
      // TODO: Replace with real payment integration
      const res = await fetch(`${API_BASE}/payments/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId,
          amount,
          cardNumber,
          expiry,
          cvc,
        }),
      });
      if (!res.ok) throw new Error('Payment failed');
      Alert.alert('Payment successful!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.subtitle}>Amount: {amount ? formatPrice(amount) : 'N/A'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Card Number"
        value={cardNumber}
        onChangeText={setCardNumber}
        keyboardType="number-pad"
        maxLength={16}
      />
      <TextInput
        style={styles.input}
        placeholder="Expiry (MM/YY)"
        value={expiry}
        onChangeText={setExpiry}
        maxLength={5}
      />
      <TextInput
        style={styles.input}
        placeholder="CVC"
        value={cvc}
        onChangeText={setCvc}
        keyboardType="number-pad"
        maxLength={4}
      />
      {loading ? (
        <ActivityIndicator color="#FF9800" style={{ marginTop: 16 }} />
      ) : (
        <Button title="Pay Now" color="#FF9800" onPress={handlePayment} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 18, marginBottom: 16 },
  input: { width: '100%', maxWidth: 340, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 16, backgroundColor: '#fff' },
});

export default PaymentScreen;
