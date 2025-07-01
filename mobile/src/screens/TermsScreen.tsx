import React from "react";
import { View, Text, StyleSheet, ScrollView, Linking } from "react-native";
import { Colors } from "../constants/colors";

const TermsScreen = () => (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>Terms of Service</Text>
    <Text style={styles.paragraph}>
      Welcome to Nkadime. By using our platform, you agree to the following
      terms and conditions:
    </Text>
    <View style={styles.list}>
      <Text style={styles.listItem}>
        • All users must provide accurate information and comply with local
        laws.
      </Text>
      <Text style={styles.listItem}>
        • Equipment must be returned in the same condition as received, barring
        normal wear and tear.
      </Text>
      <Text style={styles.listItem}>
        • Payments are processed securely and held in escrow until the rental is
        complete.
      </Text>
      <Text style={styles.listItem}>
        • Nkadime is not liable for damages or losses beyond the scope of our
        insurance and dispute resolution policies.
      </Text>
      <Text style={styles.listItem}>
        • Users are responsible for arranging safe handover and return of
        equipment.
      </Text>
      <Text style={styles.listItem}>
        • For full terms and privacy policy, please contact us at{" "}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL("mailto:steamcare.info@gmail.com")}
        >
          steamcare.info@gmail.com
        </Text>
        .
      </Text>
    </View>
    <Text style={styles.paragraph}>
      Thank you for being part of the Nkadime community!
    </Text>
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
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  list: {
    marginBottom: 16,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  link: {
    color: Colors.info,
    textDecorationLine: "underline",
  },
});

export default TermsScreen;
