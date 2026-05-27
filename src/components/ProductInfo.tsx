import { Card, Button, Typography } from 'antd'
import React from 'react'

interface ProductInfoProps {
  p: {
    id: number;
    goods_name: string;
    stock: number;
    price: number;
    goods_type: string;
  };
  addToCart: (product: { id: number; goods_name: string; stock: number; price: number; goods_type: string }) => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ p, addToCart }) => {
  return (
    <>
      <Card
        hoverable
        title={p.goods_name}
        actions={[
          <Button
            type="primary"
            onClick={() => addToCart(p)}
            disabled={p.stock === 0}
            block
          >
            {p.stock === 0 ? '已售罄' : '添加到购物车'}
          </Button>
        ]}
      >
        <Card.Meta
          description={`价格: ¥${p.price}`}
        />
        <Typography.Text type={p.stock === 0 ? "danger" : "secondary"} style={{ display: 'block', marginTop: '8px' }}>
          库存: {p.stock}
        </Typography.Text>
      </Card>
    </>
  )
}

export default ProductInfo