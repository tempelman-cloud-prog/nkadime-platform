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

export async function getListings() {
  const res = await fetch(`${API_BASE}/listings`);
  return res.json();
}

export async function createReview(data: {
  listing: string;
  reviewer: string;
  rating: number;
  comment: string;
  images: string[];
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

export async function updateUser(userId: string, data: { name?: string; location?: string; profilePic?: File | null }) {
  const token = localStorage.getItem("token");
  let res;
  if (data.profilePic) {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.location) formData.append("location", data.location);
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
        location: data.location
      }),
    });
  }
  return res.json();
}