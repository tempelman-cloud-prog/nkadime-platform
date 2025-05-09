# Nkadime Platform

Nkadime is a peer-to-peer equipment rental platform that connects users looking to rent equipment with those who have equipment available for rent. This project includes a web application, a mobile application, and integrated AI features to enhance user experience.

## Project Structure

The project is organized into the following main directories:

- **web**: Contains the web application built with React.
  - **src**: Source code for the web application.
    - **components**: Reusable React components.
    - **pages**: Main pages of the web application.
    - **assets**: Static assets like images and stylesheets.
    - **App.tsx**: Main component setting up routing and layout.
    - **index.tsx**: Entry point rendering the App component.
  - **package.json**: Configuration file for npm dependencies and scripts.
  - **tsconfig.json**: TypeScript configuration file.

- **mobile**: Contains the mobile application built with React Native.
  - **src**: Source code for the mobile application.
    - **components**: Reusable React Native components.
    - **screens**: Main screens of the mobile application.
    - **assets**: Static assets like images and stylesheets.
    - **App.tsx**: Main component setting up navigation and layout.
    - **index.ts**: Entry point rendering the App component.
  - **package.json**: Configuration file for npm dependencies and scripts.
  - **tsconfig.json**: TypeScript configuration file.

- **ai**: Contains AI features and services.
  - **src**: Source code for AI services.
    - **models**: Machine learning models for AI features.
    - **services**: Services interacting with AI models.
    - **index.py**: Entry point for AI services.
  - **requirements.txt**: Python dependencies for AI services.

- **backend**: Contains the backend application built with Node.js and Express.
  - **src**: Source code for the backend application.
    - **controllers**: Business logic for various routes.
    - **models**: Data structures and database interactions.
    - **routes**: API endpoints for the backend application.
    - **app.ts**: Main entry point for the backend application.
  - **package.json**: Configuration file for npm dependencies and scripts.
  - **tsconfig.json**: TypeScript configuration file.

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd nkadime-platform
   ```

2. **Install dependencies**:
   - For the web application:
     ```
     cd web
     npm install
     ```
   - For the mobile application:
     ```
     cd mobile
     npm install
     ```
   - For the backend:
     ```
     cd backend
     npm install
     ```
   - For the AI services:
     ```
     cd ai
     pip install -r requirements.txt
     ```

3. **Run the applications**:
   - Start the web application:
     ```
     cd web
     npm start
     ```
   - Start the mobile application (ensure you have the necessary environment set up):
     ```
     cd mobile
     npm start
     ```
   - Start the backend server:
     ```
     cd backend
     npm start
     ```
   - Run the AI services:
     ```
     cd ai
     python index.py
     ```

## Usage Guidelines

- Users can browse available equipment, create listings, and manage their rentals through the web and mobile applications.
- AI features will assist in recommendations and user interactions.
- Ensure to follow the setup instructions carefully to run all components of the platform successfully.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.