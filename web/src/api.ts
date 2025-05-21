const API_BASE = "http://localhost:5000/api";

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function register(data: { name: string; email: string; password: string; phone?: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createListing(data: {
  owner: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  location: string;
  priceUnit?: string;
}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/listings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getListings(params?: Record<string, string | number | boolean>) {
  let url = `${API_BASE}/listings`;
  if (params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") search.append(key, String(value));
    });
    url += `?${search.toString()}`;
  }
  const res = await fetch(url);
  return res.json();
}

export async function createReview(data: {
  listing?: string;
  reviewer: string;
  reviewedUser?: string;
  rating: number;
  comment: string;
  images: string[];
  rental?: string;
}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getReviews(listingId: string) {
  const res = await fetch(`${API_BASE}/reviews/${listingId}`);
  return res.json();
}

export async function updateUser(userId: string, data: { name?: string; location?: string; profilePic?: File | null; bio?: string }) {
  const token = localStorage.getItem("token");
  let res;
  if (data.profilePic) {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.location) formData.append("location", data.location);
    if (data.bio !== undefined) formData.append("bio", data.bio);
    formData.append("profilePic", data.profilePic);
    res = await fetch(`${API_BASE}/users/${userId}`, {
      method: "PUT",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData,
    });
  } else {
    res = await fetch(`${API_BASE}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        name: data.name,
        location: data.location,
        bio: data.bio
      }),
    });
  }
  return res.json();
}

export async function getRentalHistory(userId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/history/${userId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

export async function createRentalRequest(data: {
  listing: string;
  renter: string;
  owner: string;
  startDate: string;
  endDate: string;
}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateRentalStatus(rentalId: string, status: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function addFavorite(userId: string, listingId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user: userId, listing: listingId }),
  });
  return res.json();
}

export async function getFavorites(userId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/favorites/${userId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

export async function removeFavorite(userId: string, listingId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/favorites`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user: userId, listing: listingId }),
  });
  return res.json();
}

export async function createNotification(user: string, type: string, message: string, data?: any) {
  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:5000/api/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user, type, message, data }),
  });
  return res.json();
}

export async function getNotifications(userId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`http://localhost:5000/api/notifications/${userId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

export async function markNotificationsRead(userId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`http://localhost:5000/api/notifications/user/${userId}/read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

export async function getUserReviews(userId: string) {
  const res = await fetch(`${API_BASE}/user-reviews/${userId}`);
  return res.json();
}

export async function getUserAverageRating(userId: string) {
  const res = await fetch(`${API_BASE}/average-rating/user/${userId}`);
  return res.json();
}

export async function updateListing(id: string, data: any) {
  const token = localStorage.getItem("token");
  let res;
  if (data instanceof FormData) {
    res = await fetch(`${API_BASE}/listings/${id}`, {
      method: "PATCH",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
        // Do NOT set Content-Type for FormData; browser will set it
      },
      body: data,
    });
  } else {
    res = await fetch(`${API_BASE}/listings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data),
    });
  }
  return res.json();
}

export async function deleteListing(id: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/listings/${id}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

// Add new API functions for robust transaction features
export async function addRentalMessage(rentalId: string, data: { message?: string; evidenceUrl?: string; userId: string }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function addRentalPayment(rentalId: string, data: { amount: number; method: string; reference: string; paidAt?: string }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function addRentalReview(rentalId: string, data: { by: string; rating: number; comment: string }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function exportRentalAudit(rentalId: string, format: 'pdf' | 'csv' | 'json' = 'json') {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/export?format=${format}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to export rental audit' }));
    throw new Error(error.error || 'Failed to export rental audit');
  }
  if (format === 'pdf' || format === 'csv') {
    const blob = await res.blob();
    return blob;
  } else {
    return res.json();
  }
}

export async function updateRentalStatusWithAudit(rentalId: string, data: { status: string; note?: string; userId: string }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/status-audit`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function sendListingMessage(listingId: string, message: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/listings/${listingId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

export async function getListingMessages(listingId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/listings/${listingId}/messages`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

// Raise a dispute on a rental
export async function raiseDispute(rentalId: string, data: { reason: string; evidenceUrl?: string }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/dispute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Fetch rental requests made by the current user (as renter)
export async function getMyRentalRequests() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/my-requests`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

// Fetch rental requests for listings owned by the current user (as owner)
export async function getIncomingRentalRequests() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/incoming-requests`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

// Approve a rental request
export async function approveRentalRequest(requestId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${requestId}/approve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

// Decline a rental request
export async function declineRentalRequest(requestId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${requestId}/decline`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

export async function getReceivedMessages() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/messages/received`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

export async function markMessagesRead(listingId: string, fromUserId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/messages/${listingId}/mark-read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ fromUserId })
  });
  return res.json();
}

export async function sendMessageReply(listingId: string, toUserId: string, message: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/messages/${listingId}/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ toUserId, message })
  });
  return res.json();
}

export async function getUserStats(userId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/users/${userId}/stats`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}