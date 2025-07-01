import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { getNotifications, markNotificationsRead } from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";

interface JwtPayload {
  userId?: string;
  id?: string;
  email?: string;
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to view notifications.");
        setLoading(false);
        return;
      }
      const decoded = jwt_decode<JwtPayload>(token);
      const userId = decoded.userId || decoded.id;
      if (!userId) {
        setError("Invalid user token.");
        setLoading(false);
        return;
      }
      getNotifications(userId).then((nots) => {
        setNotifications(nots);
        setLoading(false);
        if (nots.some((n: any) => !n.read)) {
          markNotificationsRead(userId);
        }
      });
    };
    fetchNotifications();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.info} />;
  }

  if (error) {
    return <Alert.alert title="Error" message={error} />;
  }

  const renderNotification = ({ item }) => (
    <View style={styles.notificationContainer}>
      <Text style={styles.notificationType}>{item.type}</Text>
      <Text style={styles.notificationMessage}>{item.message}</Text>
      <Text style={styles.notificationDate}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {notifications.length === 0 ? (
        <Text>No notifications yet.</Text>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
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
  notificationContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  notificationType: {
    fontWeight: "700",
    color: Colors.primary,
    minWidth: 90,
  },
  notificationMessage: {
    flex: 1,
    fontSize: 17,
    color: Colors.textDark,
  },
  notificationDate: {
    color: Colors.textLight,
    fontSize: 14,
  },
});

export default NotificationsScreen;
