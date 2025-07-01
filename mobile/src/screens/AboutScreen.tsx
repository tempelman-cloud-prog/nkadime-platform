import React from "react";
import { View, Text, StyleSheet } from "react-native";

const AboutScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>About Nkadime</Text>
    <Text style={styles.paragraph}>
      Nkadime is Botswana’s first peer-to-peer equipment rental platform,
      empowering individuals, small businesses, and communities to access and
      monetize tools and equipment. Our mission is to make equipment affordable,
      accessible, and secure for everyone, while promoting sustainability and
      the sharing economy across Africa.
    </Text>
    <Text style={styles.subtitle}>Our Story</Text>
    <Text style={styles.paragraph}>
      Founded by Tempelman Maruswaneng, Nkadime was inspired by the need for
      affordable, flexible access to equipment for home projects, farming,
      events, and business. We believe in the power of technology and community
      to unlock new opportunities for all.
    </Text>
    <Text style={styles.subtitle}>Meet the Director</Text>
    <Text style={styles.paragraph}>
      <Text style={{ fontWeight: "bold" }}>Tempelman Maruswaneng</Text> –
      Director
    </Text>
    <Text style={styles.paragraph}>
      Tempelman is passionate about innovation, local empowerment, and building
      solutions that work for Botswana and Africa. Nkadime is his vision for a
      more connected, resourceful, and sustainable future.
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
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default AboutScreen;
