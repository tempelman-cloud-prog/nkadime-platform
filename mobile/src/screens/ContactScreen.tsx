import React from "react";
import { View, Text, StyleSheet, Linking } from "react-native";
import { Colors } from "../constants/colors";

const ContactScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Contact Us</Text>
    <Text style={styles.paragraph}>
      We'd love to hear from you! Reach out to Nkadime for support, partnership,
      or general inquiries.
    </Text>
    <View style={styles.contactList}>
      <Text style={styles.contactItem}>
        <Text style={{ fontWeight: "bold" }}>Phone:</Text>{" "}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL("tel:+26771671874")}
        >
          +267 71 671 874
        </Text>
      </Text>
      <Text style={styles.contactItem}>
        <Text style={{ fontWeight: "bold" }}>Email:</Text>{" "}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL("mailto:steamcare.info@gmail.com")}
        >
          steamcare.info@gmail.com
        </Text>
      </Text>
      <Text style={styles.contactItem}>
        <Text style={{ fontWeight: "bold" }}>Director:</Text> Tempelman
        Maruswaneng
      </Text>
    </View>
    <Text style={styles.paragraph}>
      We aim to respond to all queries within 24 hours.
    </Text>
  </View>
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
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  contactList: {
    marginBottom: 16,
  },
  contactItem: {
    fontSize: 16,
    lineHeight: 24,
  },
  link: {
    color: Colors.info,
    textDecorationLine: "underline",
  },
});

export default ContactScreen;
