import { Button, Form, Input, InputNumber, message, Modal } from 'antd'
import React, { useState, useEffect } from 'react'

// 定义商品接口
interface Product {
  id: number;
  goods_name: string;
  price: number;
  stock: number;
  goods_type: string;
}

// 定义组件的 props 接口
interface EditGoodsBtnProps {
  record: Product; // 传入的商品记录
  onEditProduct: (updatedProduct: Product) => void; // 编辑商品的回调函数
  // categories: string[]; // Removed as it's not used in this version for price/stock edit
}

const EditGoodsBtn: React.FC<EditGoodsBtnProps> = ({ record, onEditProduct }) => {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  // Store the product being edited to ensure we have its original data (like id, goods_type)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [editForm] = Form.useForm();

  const showEditModal = (productToEdit: Product) => {
    setEditingProduct(productToEdit);
    // Set form fields with the current product's data
    editForm.setFieldsValue({
      goods_name: productToEdit.goods_name,
      price: productToEdit.price,
      stock: productToEdit.stock,
      // goods_type is not editable in this form, so no need to set it explicitly for an editable field
    });
    setIsEditModalVisible(true);
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingProduct(null); // Clear the editing product state
    editForm.resetFields();
  };

  const handleEditOk = async () => {
    if (!editingProduct) return; // Should not happen if modal is visible with a product

    try {
      // Validate form fields
      const values = await editForm.validateFields(); // values will contain { price: number, stock: number }

      // Construct the updated product object
      // It's important to include all fields of the Product interface
      // as onEditProduct expects a full Product object.
      const updatedProduct: Product = {
        ...editingProduct, // Spread original product data (id, goods_name, goods_type)
        price: values.price,   // Override with new price from form
        stock: values.stock,   // Override with new stock from form
      };

      onEditProduct(updatedProduct); // Call the callback with the fully updated product object

      // Close modal and reset form
      setIsEditModalVisible(false);
      setEditingProduct(null);
      editForm.resetFields();
      // message.success('商品信息更新成功'); // Removed: Parent component (AdminProductPage) will show message after backend update.
    } catch (errorInfo) {
      // This catch block handles form validation errors
      console.log('表单验证失败:', errorInfo);
      message.error('更新失败，请检查表单输入是否有效。');
    }
  };

  // Effect to update form when record changes (e.g. if parent re-renders with new record for same button instance)
  useEffect(() => {
    if (editingProduct && record.id === editingProduct.id) {
      editForm.setFieldsValue({
        goods_name: record.goods_name,
        price: record.price,
        stock: record.stock,
      });
    }
  }, [record, editForm, editingProduct]);


  return (
    <>
      <Button type="link" onClick={() => showEditModal(record)}>
        编辑
      </Button>
      <Modal
        title="修改商品信息"
        open={isEditModalVisible}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
        okText="保存"
        cancelText="取消"
        destroyOnClose // Destroys modal children when closed, useful for resetting form state
      >
        {/* Ensure editingProduct is not null before rendering the Form */}
        {editingProduct && (
          <Form form={editForm} layout="vertical" name="editProductForm" initialValues={{
            goods_name: editingProduct.goods_name,
            price: editingProduct.price,
            stock: editingProduct.stock,
          }}>
            <Form.Item name="goods_name" label="商品名称">
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="price"
              label="价格"
              rules={[
                { required: true, message: '请输入商品价格!' },
                {
                  type: 'number',
                  min: 0.01, // Price should generally be greater than 0
                  message: '价格必须大于0!',
                  transform: value => Number(value) // Ensure value is treated as number
                },
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={0.01} step={0.01} precision={2} addonAfter="元 (￥)" />
            </Form.Item>
            <Form.Item
              name="stock"
              label="库存"
              rules={[
                { required: true, message: '请输入商品库存!' },
                {
                  type: 'number',
                  min: 0,
                  message: '库存不能为负数!',
                  transform: value => Number(value) // Ensure value is treated as number
                },
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={0} step={1} precision={0} />
            </Form.Item>
            {/* goods_type is not editable here, it will be preserved from editingProduct */}
          </Form>
        )}
      </Modal>
    </>
  )
}

export default EditGoodsBtn