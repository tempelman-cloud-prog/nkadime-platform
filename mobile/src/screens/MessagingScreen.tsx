import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { RootStackParamList } from "./ListingDetailsScreen";
import { Colors } from "../constants/colors";

import { API_BASE } from "@env";

const MessagingScreen = ({ route }: any) => {
  const { listing } = route?.params || {};
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("demo-user");
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<any>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    // Load user ID from AsyncStorage on mount
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserId(user.id || user._id || user.email || "demo-user");
        }
      } catch (_e) {
        /* Intentionally ignore errors during user ID loading */
      }
    })();
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      setError(null);
      try {
        const effectiveUserId = userId;
        const res = await fetch(
          `${API_BASE}/messages/${listing?._id}?userId=${effectiveUserId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.messages || []);
      } catch (_e: any) {
        setMessages([]);
        setError(e?.message || "Could not load messages.");
      } finally {
        setLoading(false);
      }
    }
    if (listing?._id) fetchMessages();
  }, [listing?._id, userId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/messages/${listing._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: userId, text: input }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      setInput("");
      // Refresh messages
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : data.messages || []);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    } catch (e: any) {
      setError(e?.message || "Could not send message.");
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" } as { name: keyof RootStackParamList }],
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.lightGray }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
          {listing?.title ? `Messaging: ${listing.title}` : "Messaging"}
        </Text>
        <Button title="Logout" color={Colors.darkRed} onPress={handleLogout} />
      </View>
      {error && (
        <View
          style={{
            backgroundColor: Colors.lightRed,
            padding: 10,
            margin: 10,
            borderRadius: 8,
            borderColor: Colors.darkRed,
            borderWidth: 1,
          }}
        >
          <Text style={{ color: Colors.darkRed, fontWeight: "bold" }}>
            {error}
          </Text>
          <Text
            style={{ color: Colors.darkRed, marginTop: 4 }}
            onPress={() => setError(null)}
          >
            Dismiss
          </Text>
        </View>
      )}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, idx) => idx.toString()}
          contentContainerStyle={[
            styles.messages,
            !messages.length && { flex: 1, justifyContent: "center" },
          ]}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.sender === userId ? styles.bubbleSelf : styles.bubbleOther,
                {
                  shadowColor: Colors.textDark,
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
            >
              <Text style={styles.bubbleText}>{item.text}</Text>
              <Text style={styles.bubbleMeta}>{item.sender}</Text>
            </View>
          )}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <Text
              style={{
                color: Colors.textLight,
                textAlign: "center",
                marginTop: 32,
              }}
            >
              No messages yet. Start the conversation!
            </Text>
          }
        />
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <Button
          title="Send"
          color={Colors.primary}
          onPress={handleSend}
          disabled={!input.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    padding: 16,
    backgroundColor: Colors.textPrimary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  headerText: {
    color: Colors.cardBackground,
    fontWeight: "bold",
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  messages: { padding: 16, flexGrow: 1 },
  bubble: { padding: 12, borderRadius: 16, marginBottom: 10, maxWidth: "80%" },
  bubbleSelf: { backgroundColor: Colors.primary, alignSelf: "flex-end" },
  bubbleOther: {
    backgroundColor: Colors.cardBackground,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.mediumGray,
  },
  bubbleText: { fontSize: 16, color: Colors.textDark },
  bubbleMeta: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: Colors.mediumGray,
    backgroundColor: Colors.cardBackground,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    fontSize: 16,
    backgroundColor: Colors.lighterOrange,
  },
});

export default MessagingScreen;
