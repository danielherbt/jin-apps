import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../store/slices/inventorySlice';

const InventoryScreen = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.inventory);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    sku: '',
    barcode: '',
    category: '',
    stock_quantity: '',
    min_stock: '',
    branch_id: 1,
  });

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        cost: product.cost?.toString() || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category: product.category || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        min_stock: product.min_stock?.toString() || '',
        branch_id: product.branch_id || 1,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        cost: '',
        sku: '',
        barcode: '',
        category: '',
        stock_quantity: '',
        min_stock: '',
        branch_id: 1,
      });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingProduct(null);
  };

  const handleSubmit = async () => {
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      stock_quantity: parseInt(formData.stock_quantity),
      min_stock: parseInt(formData.min_stock),
    };

    if (editingProduct) {
      await dispatch(updateProduct({ id: editingProduct.id, productData: data }));
    } else {
      await dispatch(createProduct(data));
    }
    handleCloseModal();
    dispatch(getProducts()); // Refresh list
  };

  const handleDelete = (product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${product.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dispatch(deleteProduct(product.id));
            dispatch(getProducts()); // Refresh list
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>SKU: {item.sku}</Text>
        <Text style={styles.productPrice}>${item.price}</Text>
        <Text style={styles.productStock}>
          Stock: {item.stock_quantity} {item.stock_quantity <= item.min_stock && '(Low Stock)'}
        </Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => handleOpenModal(item)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleOpenModal()}
        >
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error.detail || 'An error occurred'}</Text>
        </View>
      )}

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Description"
                multiline
                numberOfLines={3}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Price"
                  keyboardType="numeric"
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Cost"
                  keyboardType="numeric"
                  value={formData.cost}
                  onChangeText={(text) => setFormData({ ...formData, cost: text })}
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="SKU"
                  value={formData.sku}
                  onChangeText={(text) => setFormData({ ...formData, sku: text })}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Barcode"
                  value={formData.barcode}
                  onChangeText={(text) => setFormData({ ...formData, barcode: text })}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Category"
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
              />

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Stock Quantity"
                  keyboardType="numeric"
                  value={formData.stock_quantity}
                  onChangeText={(text) => setFormData({ ...formData, stock_quantity: text })}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Min Stock"
                  keyboardType="numeric"
                  value={formData.min_stock}
                  onChangeText={(text) => setFormData({ ...formData, min_stock: text })}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonText}>
                    {editingProduct ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  errorText: {
    color: '#721c24',
  },
  listContainer: {
    padding: 10,
  },
  productCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    marginBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productSku: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  productStock: {
    fontSize: 14,
    color: '#28a745',
    marginTop: 2,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 70,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#ffc107',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  submitButton: {
    backgroundColor: '#28a745',
  },
});

export default InventoryScreen;