import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const FAQScreen = () => (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>Frequently Asked Questions</Text>
    <View style={styles.faqList}>
      <View style={styles.faqItem}>
        <Text style={styles.question}>What is Nkadime?</Text>
        <Text style={styles.answer}>
          Nkadime is a peer-to-peer platform that allows people in Botswana to
          rent or lend equipment easily and securely.
        </Text>
      </View>
      <View style={styles.faqItem}>
        <Text style={styles.question}>Who can use Nkadime?</Text>
        <Text style={styles.answer}>
          Anyone in Botswana looking to rent equipment for home, business,
          events, or farming, as well as owners who want to earn income from
          their tools.
        </Text>
      </View>
      <View style={styles.faqItem}>
        <Text style={styles.question}>How do I pay or get paid?</Text>
        <Text style={styles.answer}>
          Payments are made securely through Orange Money or card. Owners
          receive payment after the rental is complete and confirmed.
        </Text>
      </View>
      <View style={styles.faqItem}>
        <Text style={styles.question}>Is it safe?</Text>
        <Text style={styles.answer}>
          Yes! Nkadime uses AI-powered fraud detection, escrow payments, and a
          rating system to keep the community safe and trustworthy.
        </Text>
      </View>
      <View style={styles.faqItem}>
        <Text style={styles.question}>How do I list my equipment?</Text>
        <Text style={styles.answer}>
          Sign up, upload photos and details of your equipment, and set your
          price. Our AI helps categorize your listing for better visibility.
        </Text>
      </View>
      <View style={styles.faqItem}>
        <Text style={styles.question}>What if equipment is damaged?</Text>
        <Text style={styles.answer}>
          Nkadime offers optional insurance and a dispute resolution process to
          protect both renters and owners.
        </Text>
      </View>
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
  faqList: {
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
  },
  question: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  answer: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default FAQScreen;
