import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import ListingScreen from './screens/ListingScreen';
import ProfileScreen from './screens/ProfileScreen';
import RentalRequestScreen from './screens/RentalRequestScreen';
import PaymentScreen from './screens/PaymentScreen';
import TransactionHistoryScreen from './screens/TransactionHistoryScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import MessagingScreen from './screens/MessagingScreen';
import ListingDetailsScreen, { RootStackParamList } from './screens/ListingDetailsScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  const [isAuthChecked, setIsAuthChecked] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const user = await AsyncStorage.getItem('user');
      setIsAuthenticated(!!user);
      setIsAuthChecked(true);
    })();
  }, []);

  if (!isAuthChecked) {
    return null; // or a splash/loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? 'Home' : 'Login'}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Listings" component={ListingScreen} />
        <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="RentalRequest" component={RentalRequestScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen name="Messaging" component={MessagingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;