import { Card, Button, Typography, Tag } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import React from 'react';

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
    <Card
      hoverable
      className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border-none bg-white h-full flex flex-col justify-between overflow-hidden"
      bodyStyle={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
          <Typography.Title level={4} className="!mb-0 !text-gray-800 line-clamp-2 text-lg">
            {p.goods_name}
          </Typography.Title>
        </div>
        
        <div className="mb-4">
           <Tag color="orange" className="bg-orange-50 text-orange-600 border-orange-100 rounded-full px-2">
             {p.goods_type}
           </Tag>
        </div>

        <div className="space-y-1 mb-6">
          <div className="flex items-baseline">
            <span className="text-gray-400 text-sm mr-2">价格:</span>
            <span className="text-xl font-bold text-[#6F4E37]">¥{Number(p.price).toFixed(2)}</span>
          </div>
          <div className="flex items-center">
             <span className="text-gray-400 text-sm mr-2">库存:</span>
             <Typography.Text type={p.stock === 0 ? "danger" : "secondary"} strong>
               {p.stock}
             </Typography.Text>
          </div>
        </div>
      </div>

      <Button
        type="primary"
        onClick={() => addToCart(p)}
        disabled={p.stock === 0}
        block
        icon={<ShoppingCartOutlined />}
        size="large"
        className={`
          h-11 rounded-full border-none shadow-md transition-all duration-300 font-medium
          ${p.stock === 0 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200' 
            : 'bg-[#6F4E37] hover:!bg-[#8B5A2B] shadow-[#6F4E37]/20 hover:scale-[1.02] active:scale-95'
          }
        `}
      >
        {p.stock === 0 ? '已售罄' : '添加到购物车'}
      </Button>
    </Card>
  )
}

export default ProductInfo