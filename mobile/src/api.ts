// Remove @env import and use a fallback API_BASE for mobile
// import { URLSearchParams } from 'url';

export const API_BASE = process.env.API_BASE || "https://nkadime-platform.onrender.com/api";

export async function getListings(params: Record<string, any>) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/listings?${query}`);
  return res.json();
}

export async function getRentalHistory(userId: string) {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/history/${userId}`, {
    headers: {
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });
  return res.json();
}

export async function getFavorites(userId: string) {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/favorites/${userId}`, {
    headers: {
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });
  return res.json();
}

export async function removeFavorite(userId: string, listingId: string) {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/favorites`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user: userId, listing: listingId }),
  });
  return res.json();
}

// Accepts either FormData (for images) or JSON (no images)
export async function createListing(data: any) {
  // const token = await AsyncStorage.getItem("token");
  let headers: any = {};
  let body: any = data;
  let isFormData = false;

  if (typeof FormData !== "undefined" && data instanceof FormData) {
    // Do not set Content-Type for FormData; fetch will set it
    isFormData = true;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  }

  const res = await fetch(`${API_BASE}/listings`, {
    method: "POST",
    headers,
    body,
  });
  return res.json();
}

export async function updateListing(id: string, data: any) {
  // const token = await AsyncStorage.getItem("token");
  let res;
  if (data instanceof FormData) {
    res = await fetch(`${API_BASE}/listings/${id}`, {
      method: "PATCH",
      headers: {
        // ...(token ? { Authorization: `Bearer ${token}` } : {})
        // Do NOT set Content-Type for FormData; browser will set it
      },
      body: data,
    });
  } else {
    res = await fetch(`${API_BASE}/listings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        // ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data),
    });
  }
  return res.json();
}

export async function getNotifications(userId: string) {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/notifications/${userId}`, {
    headers: {
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });
  return res.json();
}

export async function markNotificationsRead(userId: string) {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/notifications/user/${userId}/read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });
  return res.json();
}

export async function getMyRentalRequests() {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/my-requests`, {
    headers: {
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });
  return res.json();
}

export async function getIncomingRentalRequests() {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/incoming-requests`, {
    headers: {
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });
  return res.json();
}

export async function approveRentalRequest(requestId: string) {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${requestId}/approve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });
  return res.json();
}

export async function declineRentalRequest(requestId: string) {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${requestId}/decline`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });
  return res.json();
}

export async function addRentalPayment(
  rentalId: string,
  data: { amount: number; method: string; reference: string; paidAt?: string },
) {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function raiseDispute(
  rentalId: string,
  data: { reason: string; evidenceUrl?: string },
) {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/dispute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function exportRentalAudit(
  rentalId: string,
  format: "pdf" | "csv" | "json" = "json",
) {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(
    `${API_BASE}/rentals/${rentalId}/export?format=${format}`,
    {
      headers: {
        // ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
    },
  );
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ error: "Failed to export rental audit" }));
    throw new Error(error.error || "Failed to export rental audit");
  }
  if (format === "pdf" || format === "csv") {
    const blob = await res.blob();
    return blob;
  } else {
    return res.json();
  }
}

export async function updateRentalStatusWithAudit(
  rentalId: string,
  data: { status: string; note?: string; userId: string },
) {
  // const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/status-audit`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      // ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  return res.json();
}
