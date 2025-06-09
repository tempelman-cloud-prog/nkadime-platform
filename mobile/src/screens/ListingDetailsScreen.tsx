import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView, Button, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';

// Define navigation param types for stack
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Listings: undefined;
  ListingDetails: { id: string };
  Profile: undefined;
  RentalRequest: { listing: any };
  Payment: undefined;
  TransactionHistory: undefined;
  Reviews: undefined;
  Messaging: undefined;
};

const API_BASE = 'http://localhost:5000/api';

const ListingDetailsScreen = ({ route, navigation }: { route: RouteProp<RootStackParamList, 'ListingDetails'>, navigation: any }) => {
  const { id } = route.params;
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function fetchListing() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/listings`);
        const data = await res.json();
        const found = (data.listings || []).find((l: any) => l._id === id);
        setListing(found || null);
      } catch (e) {
        setError('Failed to load listing details.');
      } finally {
        setLoading(false);
      }
    }
    async function fetchReviews() {
      try {
        const res = await fetch(`${API_BASE}/reviews/${id}`);
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : data.reviews || []);
      } catch (e) {
        setReviews([]);
      }
    }
    fetchListing();
    fetchReviews();
  }, [id]);

  const handleReviewSubmit = async () => {
    if (!reviewRating || !reviewText) {
      Alert.alert('Please enter a rating and review.');
      return;
    }
    setSubmittingReview(true);
    try {
      // TODO: Replace with actual user info
      const userId = 'demo-user';
      const res = await fetch(`${API_BASE}/reviews/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer: userId,
          rating: Number(reviewRating),
          comment: reviewText,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      setReviewText('');
      setReviewRating('');
      // Refresh reviews
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : data.reviews || []);
      Alert.alert('Review submitted!');
    } catch (e) {
      Alert.alert('Error', 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Messaging button handler
  const handleMessagePress = () => {
    navigation.navigate('Messaging', { listing });
  };

  // Helper: format price with currency (Botswana Pula)
  const formatPrice = (price: number) => `P${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }
  if (error || !listing) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red' }}>{error || 'Listing not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {listing.images && listing.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {listing.images.map((img: string, idx: number) => (
            <Image
              key={idx}
              source={{ uri: `http://localhost:5000${img}` }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}
      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.category}>{listing.category}</Text>
      <Text style={styles.price}>Price: {formatPrice(listing.price)} {listing.priceUnit || 'per day'}</Text>
      <Text style={styles.location}>Location: {listing.location}</Text>
      <Text style={styles.description}>{listing.description}</Text>
      <Button
        title="Request to Rent"
        color="#FF9800"
        onPress={() => navigation.navigate('RentalRequest', { listing })}
      />
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleMessagePress}
      >
        <Text style={styles.primaryButtonText}>Message Owner</Text>
      </TouchableOpacity>
      {/* Reviews Section */}
      <View style={{ width: '100%', marginTop: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={{ color: '#888' }}>No reviews yet.</Text>
        ) : (
          reviews.map((review, idx) => (
            <View key={idx} style={{ marginBottom: 12, backgroundColor: '#f7f7f7', borderRadius: 8, padding: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>{review.reviewerName || 'User'}</Text>
              <Text style={{ color: '#FF9800' }}>Rating: {review.rating || '-'}/5</Text>
              <Text>{review.comment}</Text>
            </View>
          ))
        )}
        {/* Add Review Form */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Add a Review</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8, backgroundColor: '#fff' }}
            placeholder="Rating (1-5)"
            value={reviewRating}
            onChangeText={setReviewRating}
            keyboardType="number-pad"
            maxLength={1}
          />
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8, backgroundColor: '#fff', minHeight: 40 }}
            placeholder="Write your review..."
            value={reviewText}
            onChangeText={setReviewText}
            multiline
          />
          <Button
            title={submittingReview ? 'Submitting...' : 'Submit Review'}
            color="#FF9800"
            onPress={handleReviewSubmit}
            disabled={submittingReview}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, alignItems: 'center', backgroundColor: '#f9f9f9' },
  image: { width: 260, height: 180, borderRadius: 12, marginRight: 12 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 6, color: '#0a2342', textAlign: 'center' },
  category: { fontSize: 16, color: '#607D8B', marginBottom: 2 },
  price: { fontSize: 18, color: '#FF9800', marginBottom: 2 },
  location: { fontSize: 16, color: '#333', marginBottom: 8 },
  description: { fontSize: 16, color: '#222', marginTop: 8, textAlign: 'center' },
  primaryButton: { marginTop: 12, marginBottom: 8, backgroundColor: '#0a2342', borderRadius: 8, padding: 12, alignItems: 'center', width: 220 },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default ListingDetailsScreen;
