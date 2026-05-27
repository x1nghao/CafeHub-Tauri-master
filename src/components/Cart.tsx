import { CloseOutlined } from '@ant-design/icons';
import { Drawer, Typography, List, Button, Space, InputNumber, Divider, message, Modal } from 'antd'; // Added Modal
import React, { useState } from 'react'
import { purchaseGoods, PurchaseGoodsPayload, PurchaseItemData } from '@/api/product'; // Import purchaseGoods and related types

interface Product {
  id: number;
  goods_name: string;
  stock: number;
  price: number;
  goods_type: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  products: Product[];
  setIsCartDrawerVisible: (visible: boolean) => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  isCartDrawerVisible: boolean;
  userId: number | null; // Add userId prop
  onPurchaseSuccess: () => void; // Callback to refresh products on parent
}

const Cart: React.FC<CartProps> = ({
  cart,
  setCart,
  products,
  setIsCartDrawerVisible,
  isCartDrawerVisible,
  userId, // Destructure userId
  onPurchaseSuccess, // Destructure callback
}) => {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const removeFromCart = (productId: number) => {
    setCart(prevCart => {
      const itemToRemove = prevCart.find(item => item.id === productId);
      if (!itemToRemove) return prevCart;

      // Optimistically update stock in UI - this might be removed if backend is sole source of truth post-purchase
      // setProducts(prevProducts =>
      //   prevProducts.map(p =>
      //     p.id === productId ? { ...p, stock: p.stock + itemToRemove.quantity } : p
      //   )
      // );
      return prevCart.filter(item => item.id !== productId);
    });
    message.info('商品已从购物车移除');
  };

  const updateQuantityInCart = (productId: number, newQuantity: number) => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.id === productId);
      if (!itemToUpdate) return prevCart;

      const currentProductState = products.find(p => p.id === productId);
      if (!currentProductState) return prevCart;

      const quantityChange = newQuantity - itemToUpdate.quantity;

      // Check against the original stock of the product, not the dynamically changing one in UI
      // This requires knowing the original stock when the item was added or fetching it.
      // For simplicity, we'll use the currentProductState.stock which is the *available* stock.
      if (quantityChange > 0 && quantityChange > currentProductState.stock) {
        message.error('库存不足!');
        return prevCart; // Prevent update
      }

      // Optimistic UI update for stock - consider implications
      // setProducts(prevProducts =>
      //   prevProducts.map(p =>
      //     p.id === productId ? { ...p, stock: p.stock - quantityChange } : p
      //   )
      // );

      if (newQuantity <= 0) {
        // If quantity becomes 0 or less, remove the item
        // The stock adjustment logic for removal should be consistent.
        // Calling removeFromCart handles this more cleanly.
        // However, to avoid double messages, filter directly.
        // The stock adjustment for `p.stock - quantityChange` would have added back `itemToUpdate.quantity`.
        return prevCart.filter(item => item.id !== productId);
      }

      return prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });

    if (newQuantity > 0) {
      // message.success('购物车数量已更新'); // Can be too noisy
    } else {
      message.info('商品已从购物车移除');
    }
  };

  const handleCheckout = async () => {
    if (!userId) {
      message.error('用户未登录，无法结算！');
      // Optionally, redirect to login or show login modal
      return;
    }
    if (cart.length === 0) {
      message.info('购物车是空的，快去添加商品吧！');
      return;
    }

    setCheckoutLoading(true);

    const itemsToPurchase: PurchaseItemData[] = cart.map(item => ({
      goods_id: item.id,
      quantity: item.quantity,
    }));

    const payload: PurchaseGoodsPayload = {
      user_id: userId,
      items: itemsToPurchase,
    };

    try {
      const purchaseStatus = await purchaseGoods(payload);
      switch (purchaseStatus) {
        case 0:
          Modal.success({
            title: '购买成功！',
            content: '感谢您的惠顾。',
            onOk: () => {
              setCart([]); // Clear the cart
              setIsCartDrawerVisible(false);
              onPurchaseSuccess(); // Trigger product list refresh on parent
            }
          });
          break;
        case 1:
          message.error('部分商品库存不足，请调整购物车后再试。');
          // Optionally, highlight which items are out of stock if backend provides more info
          onPurchaseSuccess(); // Refresh to show updated stock
          break;
        case 2:
          message.error('账户余额不足，请充值后再试。');
          break;
        default:
          message.error(`购买过程中发生未知错误 (状态码: ${purchaseStatus})。`);
      }
    } catch (error: any) {
      console.error('结算失败:', error);
      message.error(error.message || '结算失败，请稍后重试。');
    } finally {
      setCheckoutLoading(false);
    }
  };


  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <>
      <Drawer
        title="我的购物车"
        placement="right"
        onClose={() => setIsCartDrawerVisible(false)}
        open={isCartDrawerVisible}
        width={360}
        closeIcon={<CloseOutlined />}
      >
        {cart.length === 0 ? (
          <Typography.Text>购物车是空的</Typography.Text>
        ) : (
          <>
            <List
              itemLayout="horizontal"
              dataSource={cart}
              renderItem={item => {
                // Find the product in the main products list to get its current stock
                // This stock is the "available" stock from the last fetch, not necessarily real-time pre-checkout.
                const productInList = products.find(p => p.id === item.id);
                // Max quantity user can add/set for this item in cart is item.quantity + productInList.stock
                const maxAllowedQuantity = productInList ? item.quantity + productInList.stock : item.quantity;

                return (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <List.Item.Meta
                        title={item.goods_name}
                        description={`单价: ¥${item.price}`}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '8px' }}>
                        <Space>
                          <Button size="small" onClick={() => updateQuantityInCart(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</Button>
                          <InputNumber
                            size="small"
                            min={1}
                            max={maxAllowedQuantity} // Max should be current cart quantity + available stock
                            value={item.quantity}
                            onChange={(value) => {
                              if (value !== null) { // Ensure value is not null
                                updateQuantityInCart(item.id, value as number)
                              }
                            }}
                            style={{ width: '60px' }}
                          />
                          <Button size="small" onClick={() => updateQuantityInCart(item.id, item.quantity + 1)} disabled={!productInList || productInList.stock <= 0}>+</Button>
                        </Space>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ marginRight: '10px', width: '80px', textAlign: 'right' }}>¥{(item.price * item.quantity)}</div>
                          <Button type="link" danger onClick={() => removeFromCart(item.id)}>移除</Button>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
            <Divider />
            <div style={{ textAlign: 'right' }}>
              <Typography.Title level={5}>
                总计: ¥{totalAmount}
              </Typography.Title>
              <Button
                type="primary"
                style={{ marginTop: '10px' }}
                disabled={cart.length === 0 || checkoutLoading}
                onClick={handleCheckout}
                loading={checkoutLoading}
              >
                去结算
              </Button>
            </div>
          </>
        )}
      </Drawer>
    </>
  )
}

export default Cart