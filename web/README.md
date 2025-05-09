# Nkadime Web App

This is the web frontend for the Nkadime platform, built with React and TypeScript. It allows users to browse, rent, and list equipment.

## Setup Instructions

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Environment variables:**
   - Create a `.env` file in the `web` directory if you need to override API endpoints or add secrets. Example:
     ```
     REACT_APP_API_URL=http://localhost:5000
     ```

3. **Run the app:**
   ```
   npm start
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

4. **Run tests:**
   ```
   npm test
   ```

5. **Build for production:**
   ```
   npm run build
   ```

## Features
- Browse and search equipment listings
- User registration and login
- Create and manage listings
- Secure payments (Orange Money integration)
- AI-powered recommendations and fraud detection

## Project Structure
- `src/` - Source code (components, pages, assets)
- `public/` - Static files

## Notes
- Ensure the backend server is running and accessible at the API URL specified in `.env`.
- For more details, see the main [README.md](../README.md).
