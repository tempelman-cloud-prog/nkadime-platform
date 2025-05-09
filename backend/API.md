# Nkadime Backend API Documentation

Base URL: `http://localhost:5000/api`

## Users

### Create User
- **POST** `/users`
- **Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "phone": "string (optional)"
  }
  //Response:
  // 201 Created: User object
  //400 Bad Request: { "error": "..." }
  //Get User
  //GET /users/:id
  //Response:
  //200 OK: User object
  //404 Not Found: { "error": "User not found" }

  //Listings
  //Create Listing
  //POST /listings
  //Body:
  {
  "owner": "userId",
  "title": "string",
  "description": "string",
  "category": "string",
  "images": ["string"],
  "price": number,
  "location": "string"
} 
  //Response:
  //201 Created: Listing object
  //400 Bad Request: { "error": "..." }
  //Get Listings
  //GET /listings
  //Query Params (optional): category, location, minPrice, maxPrice available
  //Response:
  //200 OK: Array of listings

 
  // Favorites
  //Add Favorite
  //POST /favorites
  //Body:
{
  "user": "userId",
  "listing": "listingId"
}
 //Response:
 //201 Created: Favorite object
 //400 Bad Request: { "error": "..." }
 //Get Favorites
 //GET /favorites/:userId
 //Response:
 //200 OK: Array of favorites


 Reviews
 Add Review
 POST /reviews
 Body:

 {
  "listing": "listingId",
  "reviewer": "userId",
  "rating": number,
  "comment": "string",
  "images": ["string"]
}

  //Response:
  //201 Created: Review object
  //400 Bad Request: { "error": "..." }
  //Get Reviews
  //GET /reviews/:listingId
  //Response:
  //200 OK: Array of reviews


  //Notifications
  //Create Notification
  //POST /notifications
  //Body:

  {
  "user": "userId",
  "type": "string",
  "message": "string"
}

Response:
201 Created: Notification object
400 Bad Request: { "error": "..." }
Get Notifications
GET /notifications/:userId
Response:
200 OK: Array of notifications


Error Response Format
{ "error": "Error message here" }
Note: All endpoints return JSON responses.

