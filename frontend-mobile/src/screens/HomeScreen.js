import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../store/slices/authSlice';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleLogout = () => {
    dispatch(logout());
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>POS Mobile</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('POS')}
      >
        <Text style={styles.buttonText}>Point of Sale</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Inventory')}
      >
        <Text style={styles.buttonText}>Inventory Management</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#1976d2',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: '#dc004e',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;