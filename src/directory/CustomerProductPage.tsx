import { useState, useEffect } from 'react';
import { Col, Row, FloatButton, Typography, Divider, message, Spin } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import Cart from '../components/Cart';
import ProductInfo from '@/components/ProductInfo';
import { getProducts, Product as ApiProduct } from '@/api/product';
import type { Account } from '@/api/user'; // Import Account type

interface Product extends ApiProduct { }

interface CartItem extends Product {
  quantity: number;
}

const CustomerProductPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartDrawerVisible, setIsCartDrawerVisible] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Fetch user ID from localStorage
  useEffect(() => {
    const storedAccountString = localStorage.getItem('loginAccount');
    if (storedAccountString) {
      try {
        const storedAccount: Account = JSON.parse(storedAccountString);
        if (storedAccount && typeof storedAccount.id === 'number') {
          setUserId(storedAccount.id);
        } else {
          console.error("User ID not found or invalid in stored account data.");
          message.error("无法获取用户信息，请重新登录。");
          // Optionally, redirect to login page
          // navigate('/login');
        }
      } catch (error) {
        console.error("Failed to parse stored account data:", error);
        message.error("用户信息解析失败，请重新登录。");
        localStorage.removeItem('loginAccount'); // Clear corrupted data
        // Optionally, redirect to login page
      }
    } else {
      console.warn("No user account found in localStorage. Please login.");
      message.error("请先登录再进行操作。");
      // Optionally, redirect to login page
      // navigate('/login'); // You would need to import useNavigate from 'react-router-dom'
    }
  }, []);


  const fetchProducts = async () => {
    setLoading(true);
    try {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("加载商品失败:", error);
      message.error('商品加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    const existingCartItem = cart.find(item => item.id === product.id);
    const currentProductState = products.find(p => p.id === product.id);

    if (!currentProductState || currentProductState.stock === 0) {
      message.warning('该商品已售罄!');
      return;
    }

    if (existingCartItem && existingCartItem.quantity >= currentProductState.stock) {
      message.warning(`库存不足，${product.goods_name} 购物车中已有 ${existingCartItem.quantity} 件!`);
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    message.success(`${product.goods_name} 已添加到购物车`);
  };

  const uniqueCategories = Array.from(new Set(products.map(p => p.goods_type))).sort();
  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  if (loading && products.length === 0) { // Show loading only if products are not yet loaded
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="正在加载商品..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>欢迎选购</Typography.Title>
      {uniqueCategories.length === 0 && !loading && (
        <Typography.Text style={{ textAlign: 'center', display: 'block' }}>暂无商品</Typography.Text>
      )}
      {uniqueCategories.map(goods_type => (
        <div key={goods_type} style={{ marginBottom: '30px' }}>
          <Divider orientation="left"><Typography.Title level={3}>{goods_type}</Typography.Title></Divider>
          <Row gutter={[16, 16]}>
            {products
              .filter(p => p.goods_type === goods_type)
              .map(p => (
                <Col key={p.id} xs={24} sm={12} md={8} lg={6}>
                  <ProductInfo p={p} addToCart={addToCart} />
                </Col>
              ))}
          </Row>
        </div>
      ))}

      <FloatButton
        icon={<ShoppingCartOutlined />}
        badge={{ count: totalCartItems, color: 'red' }}
        tooltip={<div>查看购物车</div>}
        onClick={() => setIsCartDrawerVisible(true)}
        style={{ right: 24 }}
      />

      <Cart
        cart={cart}
        setCart={setCart}
        products={products}
        setProducts={setProducts} // Still needed for optimistic updates in cart quantity adjustment
        isCartDrawerVisible={isCartDrawerVisible}
        setIsCartDrawerVisible={setIsCartDrawerVisible}
        userId={userId} // Pass the user ID
        onPurchaseSuccess={fetchProducts} // Pass fetchProducts as callback
      />
    </div>
  );
};

export default CustomerProductPage;