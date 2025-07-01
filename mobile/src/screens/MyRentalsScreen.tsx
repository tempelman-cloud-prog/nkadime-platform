import React, { useEffect, useState } from "react";
import { Colors } from "../constants/colors";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  TextInput,
} from "react-native";
import {
  getMyRentalRequests,
  getIncomingRentalRequests,
  approveRentalRequest,
  declineRentalRequest,
  addRentalPayment,
  raiseDispute,
  updateRentalStatusWithAudit,
} from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";

interface JwtPayload {
  userId?: string;
  id?: string;
  email?: string;
}

import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";

type MyRentalsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MyRentals"
>;

interface MyRentalsScreenProps {
  navigation: MyRentalsScreenNavigationProp;
}

const MyRentalsScreen = ({ navigation }: MyRentalsScreenProps) => {
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentRental, setPaymentRental] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeRental, setDisputeRental] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mine, incoming] = await Promise.all([
        getMyRentalRequests(),
        getIncomingRentalRequests(),
      ]);
      setMyRequests(mine);
      setIncomingRequests(incoming);
    } catch (err) {
      setError("Failed to load rental requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveRentalRequest(id);
      fetchRequests();
    } catch {
      setError("Failed to approve request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      await declineRentalRequest(id);
      fetchRequests();
    } catch {
      setError("Failed to decline request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayment = async () => {
    if (!paymentRental) return;
    try {
      await addRentalPayment(paymentRental._id, {
        amount: Number(paymentAmount),
        method: paymentMethod,
        reference: paymentReference,
      });
      fetchRequests();
      setPaymentModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to process payment");
    }
  };

  const handleRaiseDispute = async () => {
    if (!disputeRental) return;
    try {
      await raiseDispute(disputeRental._id, { reason: disputeReason });
      fetchRequests();
      setDisputeModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to raise dispute");
    }
  };

  const handleMarkReturned = async (rentalId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const decoded = jwt_decode<JwtPayload>(token);
      const userId = decoded.userId || decoded.id;
      if (!userId) return;

      await updateRentalStatusWithAudit(rentalId, {
        status: "completed",
        userId,
      });
      fetchRequests();
    } catch (error) {
      Alert.alert("Error", "Failed to mark as returned");
    }
  };

  const renderMyRequest = ({ item }) => (
    <View style={styles.requestContainer}>
      <Text style={styles.listingTitle}>{item.listing.title}</Text>
      <Text>Status: {item.status}</Text>
      {item.status === "approved" && (
        <Button
          title="Pay"
          onPress={() => {
            setPaymentRental(item);
            setPaymentModalVisible(true);
          }}
        />
      )}
      {item.status === "paid" && (
        <Button
          title="Mark as Returned"
          onPress={() => handleMarkReturned(item._id)}
        />
      )}
      {item.status !== "completed" &&
        item.status !== "cancelled" &&
        !item.dispute && (
          <Button
            title="Raise Dispute"
            color={Colors.error}
            onPress={() => {
              setDisputeRental(item);
              setDisputeModalVisible(true);
            }}
          />
        )}
    </View>
  );

  const renderIncomingRequest = ({ item }) => (
    <View style={styles.requestContainer}>
      <Text style={styles.listingTitle}>{item.listing.title}</Text>
      <Text>Renter: {item.renter.name}</Text>
      <Text>Status: {item.status}</Text>
      {item.status === "pending" && (
        <View style={styles.buttonContainer}>
          <Button
            title="Approve"
            onPress={() => handleApprove(item._id)}
            disabled={actionLoading === item._id}
          />
          <Button
            title="Decline"
            color={Colors.error}
            onPress={() => handleDecline(item._id)}
            disabled={actionLoading === item._id}
          />
        </View>
      )}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color={Colors.info} />;
  if (error) return <Alert.alert title="Error" message={error} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Rental Activity</Text>
      <Text style={styles.sectionTitle}>Requests I Made</Text>
      <FlatList
        data={myRequests}
        renderItem={renderMyRequest}
        keyExtractor={(item) => item._id}
      />

      <Text style={styles.sectionTitle}>Requests for My Listings</Text>
      <FlatList
        data={incomingRequests}
        renderItem={renderIncomingRequest}
        keyExtractor={(item) => item._id}
      />

      <Modal visible={paymentModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Pay for Rental</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Payment Method"
            value={paymentMethod}
            onChangeText={setPaymentMethod}
          />
          <TextInput
            style={styles.input}
            placeholder="Reference"
            value={paymentReference}
            onChangeText={setPaymentReference}
          />
          <Button title="Pay" onPress={handlePayment} />
          <Button
            title="Cancel"
            onPress={() => setPaymentModalVisible(false)}
          />
        </View>
      </Modal>

      <Modal visible={disputeModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Raise a Dispute</Text>
          <TextInput
            style={styles.input}
            placeholder="Reason for dispute"
            value={disputeReason}
            onChangeText={setDisputeReason}
            multiline
          />
          <Button title="Submit Dispute" onPress={handleRaiseDispute} />
          <Button
            title="Cancel"
            onPress={() => setDisputeModalVisible(false)}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  requestContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.textDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  listingTitle: { fontSize: 18, fontWeight: "bold" },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  modalContainer: { flex: 1, justifyContent: "center", padding: 32 },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
});

export default MyRentalsScreen;
