# Nkadime Mobile App

This is the mobile application for the Nkadime platform, built with React Native and TypeScript. It allows users to browse, rent, and list equipment on the go.

## Setup Instructions

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Environment variables:**
   - Create a `.env` file in the `mobile` directory if you need to override API endpoints or add secrets. Example:
     ```
     API_URL=http://localhost:5000
     ```

3. **Run the app:**
   - For Android:
     ```
     npx react-native run-android
     ```
   - For iOS (requires MacOS):
     ```
     npx react-native run-ios
     ```

4. **Project Structure**
- `src/` - Source code (components, screens, assets)

## Notes
- Ensure the backend server is running and accessible at the API URL specified in `.env`.
- You may need to set up Android Studio or Xcode for device emulation.
- For more details, see the main [README.md](../README.md).
