import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { createSale, clearSale } from '../store/slices/posSlice';

const POSScreen = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const dispatch = useDispatch();
  const { currentSale, loading } = useSelector((state) => state.pos);

  // Mock products - in real app, fetch from API
  const products = [
    { id: 1, name: 'Product 1', price: 10.00 },
    { id: 2, name: 'Product 2', price: 15.00 },
    { id: 3, name: 'Product 3', price: 20.00 },
  ];

  const handleAddProduct = (product) => {
    dispatch({
      type: 'pos/addItemToSale',
      payload: {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
      },
    });
  };

  const handleCompleteSale = async () => {
    if (currentSale.items.length === 0) {
      Alert.alert('Error', 'No items in sale');
      return;
    }

    const saleData = {
      items: currentSale.items,
      branch_id: 1,
      user_id: 1,
      payment_method: 'cash',
      discount_amount: currentSale.discount,
    };

    try {
      await dispatch(createSale(saleData)).unwrap();
      Alert.alert('Success', 'Sale completed successfully!');
    } catch (error) {
      Alert.alert('Error', error.detail || 'Failed to complete sale');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Point of Sale</Text>

      {/* Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products</Text>
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productButton}
            onPress={() => handleAddProduct(product)}
          >
            <Text style={styles.productText}>
              {product.name} - ${product.price}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Current Sale */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Sale</Text>
        {currentSale.items.map((item, index) => (
          <View key={index} style={styles.saleItem}>
            <Text>{item.product_name}</Text>
            <Text>Qty: {item.quantity}</Text>
            <Text>${item.total_price.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.total}>
          <Text>Subtotal: ${currentSale.total.toFixed(2)}</Text>
          <Text>Tax (12%): ${currentSale.tax.toFixed(2)}</Text>
          <Text style={styles.totalText}>
            Total: ${(currentSale.total + currentSale.tax).toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.completeButton, loading && styles.buttonDisabled]}
          onPress={handleCompleteSale}
          disabled={loading || currentSale.items.length === 0}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Processing...' : 'Complete Sale'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productButton: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  productText: {
    fontSize: 16,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 5,
  },
  total: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  completeButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default POSScreen;