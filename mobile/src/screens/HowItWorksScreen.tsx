import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Colors } from "../constants/colors";

const HowItWorksScreen = () => (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>How It Works</Text>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>For Renters</Text>
      <Text style={styles.step}>
        <Text style={{ fontWeight: "bold" }}>1. Search & Book:</Text> Use our
        AI-powered search to find the right equipment for your project or event.
      </Text>
      <Text style={styles.step}>
        <Text style={{ fontWeight: "bold" }}>2. Secure Payment:</Text> Pay
        safely with Orange Money or card; your funds are held in escrow until
        you receive the equipment.
      </Text>
      <Text style={styles.step}>
        <Text style={{ fontWeight: "bold" }}>3. Meet & Use:</Text> Pick up the
        equipment or arrange delivery, confirm its condition, and use it for
        your rental period.
      </Text>
      <Text style={styles.step}>
        <Text style={{ fontWeight: "bold" }}>4. Return & Rate:</Text> Return the
        equipment on time and rate the owner for future trust.
      </Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>For Owners</Text>
      <Text style={styles.step}>
        <Text style={{ fontWeight: "bold" }}>1. List Your Equipment:</Text>{" "}
        Upload photos and details. Our AI helps categorize and optimize your
        listing.
      </Text>
      <Text style={styles.step}>
        <Text style={{ fontWeight: "bold" }}>2. Approve Bookings:</Text> Get
        notified when someone wants to rent your equipment. Approve or decline
        requests easily.
      </Text>
      <Text style={styles.step}>
        <Text style={{ fontWeight: "bold" }}>3. Meet & Handover:</Text> Arrange
        a safe handover or delivery. Funds are held in escrow for your security.
      </Text>
      <Text style={styles.step}>
        <Text style={{ fontWeight: "bold" }}>4. Get Paid & Rate:</Text> After
        the rental, confirm return and receive your payment. Rate the renter to
        help the community.
      </Text>
    </View>
  </ScrollView>
);

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
  card: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  step: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
});

export default HowItWorksScreen;
