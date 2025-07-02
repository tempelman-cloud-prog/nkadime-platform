import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "./ListingDetailsScreen";
import { Colors } from "../constants/colors";
import { API_BASE } from "../api";

const RentalRequestScreen = ({
  route,
  navigation,
}: {
  route: RouteProp<RootStackParamList, "RentalRequest">;
  navigation: any;
}) => {
  const { listing } = route.params;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Please enter both start and end dates.");
      return;
    }
    setLoading(true);
    try {
      // TODO: Replace with actual user info
      const userId = "demo-user";
      const res = await fetch(`${API_BASE}/rentals/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing._id,
          userId,
          startDate,
          endDate,
          message,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit request");
      const rental = await res.json();
      Alert.alert("Request sent!", "Your rental request has been submitted.");
      // Navigate to payment screen, passing rentalId and amount
      navigation.navigate("Payment", {
        rentalId: rental._id || rental.rentalId,
        amount: rental.amount || listing.price,
      });
    } catch (e) {
      Alert.alert("Error", "Could not send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rental Request</Text>
      <Text style={styles.subtitle}>For: {listing.title}</Text>
      <TextInput
        style={styles.input}
        placeholder="Start Date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
      />
      <TextInput
        style={styles.input}
        placeholder="End Date (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
      />
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Message (optional)"
        value={message}
        onChangeText={setMessage}
        multiline
      />
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
      ) : (
        <Button
          title="Submit Request"
          color={Colors.primary}
          onPress={handleSubmit}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  subtitle: { fontSize: 18, marginBottom: 16 },
  input: {
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: Colors.cardBackground,
  },
});

export default RentalRequestScreen;
