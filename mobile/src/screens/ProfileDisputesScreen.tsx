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
} from "react-native";
import { getRentalHistory } from "../api"; // Assuming api.ts is in ../

const ProfileDisputesScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disputes, setDisputes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDisputes() {
      setLoading(true);
      setError("");
      try {
        const history = await getRentalHistory(userId!);
        setDisputes(
          (history || []).filter((r: any) => r.dispute && r.dispute.status),
        );
      } catch (err) {
        setError("Failed to load disputes.");
      } finally {
        setLoading(false);
      }
    }
    fetchDisputes();
  }, [userId]);

  const renderDispute = ({ item }) => (
    <View style={styles.disputeContainer}>
      <Text style={styles.disputeStatus}>Status: {item.dispute.status}</Text>
      <Text style={styles.disputeReason}>Reason:</Text>
      <Text style={styles.disputeText}>{item.dispute.reason}</Text>
      {item.dispute.evidenceUrl && (
        <Text style={styles.disputeText}>
          <Text style={{ fontWeight: "bold" }}>Evidence:</Text>{" "}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL(item.dispute.evidenceUrl)}
          >
            View
          </Text>
        </Text>
      )}
      <Text style={styles.rentalText}>
        Rental:{" "}
        <Button
          title="View Transaction"
          onPress={() =>
            navigation.navigate("TransactionHistory", { focus: item._id })
          }
        />
      </Text>
      <Text style={styles.dateText}>
        Raised:{" "}
        {item.dispute.raisedAt
          ? new Date(item.dispute.raisedAt).toLocaleString()
          : "-"}
      </Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.info} />;
  }

  if (error) {
    return <Alert.alert title="Error" message={error} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Disputes</Text>
      {disputes.length === 0 ? (
        <Text>No disputes found for this user.</Text>
      ) : (
        <FlatList
          data={disputes}
          renderItem={renderDispute}
          keyExtractor={(item) => item._id}
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
  disputeContainer: {
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
  disputeStatus: {
    fontWeight: "bold",
    color: Colors.error,
  },
  disputeReason: {
    fontWeight: "600",
    marginTop: 8,
  },
  disputeText: {
    marginBottom: 8,
  },
  link: {
    color: Colors.info,
    textDecorationLine: "underline",
  },
  rentalText: {
    color: Colors.textLight,
    fontSize: 13,
    marginBottom: 8,
  },
  dateText: {
    color: Colors.textLight,
    fontSize: 12,
  },
});

export default ProfileDisputesScreen;
