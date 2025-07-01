import React from "react";
import { View, Text, Button, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = ({ navigation }: any) => {
  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    navigation.reset({ index: 0, routes: [{ name: "Login" as never }] });
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>
        Home
      </Text>
      <Button
        title="Go to Listings"
        onPress={() => navigation.navigate("Listings")}
      />
      <Button
        title="Go to Profile"
        onPress={() => navigation.navigate("Profile")}
      />
      <Button
        title="Request Rental"
        onPress={() => navigation.navigate("RentalRequest")}
      />
      <Button
        title="Make Payment"
        onPress={() => navigation.navigate("Payment")}
      />
      <Button
        title="Transaction History"
        onPress={() => navigation.navigate("TransactionHistory")}
      />
      <Button title="Reviews" onPress={() => navigation.navigate("Reviews")} />
      <Button
        title="Messaging"
        onPress={() => navigation.navigate("Messaging")}
      />

      <View style={{ marginVertical: 10 }} />

      <Text style={{ fontSize: 20, fontWeight: "bold", marginVertical: 10 }}>
        New Features
      </Text>
      <Button
        title="My Rentals"
        onPress={() => navigation.navigate("MyRentals")}
      />
      <Button
        title="Create Listing"
        onPress={() => navigation.navigate("CreateListing")}
      />
      <Button
        title="My Favourites"
        onPress={() => navigation.navigate("MyFavourites")}
      />
      <Button
        title="Notifications"
        onPress={() => navigation.navigate("Notifications")}
      />

      <View style={{ marginVertical: 10 }} />

      <Text style={{ fontSize: 20, fontWeight: "bold", marginVertical: 10 }}>
        About Nkadime
      </Text>
      <Button title="About Us" onPress={() => navigation.navigate("About")} />
      <Button
        title="How It Works"
        onPress={() => navigation.navigate("HowItWorks")}
      />
      <Button
        title="Contact Us"
        onPress={() => navigation.navigate("Contact")}
      />
      <Button title="FAQ" onPress={() => navigation.navigate("FAQ")} />
      <Button
        title="Terms of Service"
        onPress={() => navigation.navigate("Terms")}
      />

      <View style={{ marginVertical: 10 }} />

      <Button title="Logout" color="#d32f2f" onPress={handleLogout} />
    </ScrollView>
  );
};

export default HomeScreen;
