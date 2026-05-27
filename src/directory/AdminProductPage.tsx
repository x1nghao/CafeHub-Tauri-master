import { AdminUpdateProduct, getProducts } from '@/api/product';
import AddGoodsBtn from '@/components/AddGoodsBtn';
import EditGoodsBtn from '@/components/EditGoodsBtn';
import { Table, Space, TableProps, message } from 'antd';
import { SortOrder } from 'antd/es/table/interface';
import React, { useEffect, useState } from 'react';

// 定义商品接口
interface Product {
  id: number;
  goods_name: string;
  price: number;
  stock: number;
  goods_type: string;
}

// 模拟商品类别
const initialCategories = ['咖啡类', '非咖啡饮品', '烘焙食品', '轻食简餐', '咖啡豆与周边'];

const AdminProductPage = () => {
  const [products, setProducts] = useState<Product[]>([]); // 商品列表
  const [categories] = useState<string[]>(initialCategories);
  const [loading, setLoading] = useState<boolean>(true); // 添加加载状态

  const handleEditProduct = async (updatedProduct: Product) => {
    // 从 updatedProduct 中提取需要发送给后端的数据
    const { id, stock, price } = updatedProduct;
    const updateData = {
      // 只发送后端 UpdateGoodsData 结构中定义的字段
      ...(stock !== undefined && { stock }), // 确保 stock 存在才添加
      ...(price !== undefined && { price }), // 确保 price 存在才添加
    };

    // 检查是否有实际需要更新的字段
    if (Object.keys(updateData).length === 0) {
      return;
    }

    try {
      setLoading(true); // 开始编辑操作，可以设置加载状态
      await AdminUpdateProduct(id, updateData);
      message.success(`商品 "${updatedProduct.goods_name}" 更新成功！`);
      fetchProducts(); // 编辑成功后刷新列表
    } catch (error: any) {
      console.error("更新商品失败:", error);
    } finally {
      setLoading(false); // 结束编辑操作
    }
  }

  // 定义获取商品数据的函数
  const fetchProducts = async () => {
    setLoading(true); // 开始加载，设置loading为true
    try {
      const fetchedProducts = await getProducts(); // 调用API获取商品
      // 注意：确保 getProducts 返回的数据结构与 Product 接口匹配
      // 例如，如果后端返回 goods_name, goods_type，需要在这里或 getProducts 函数中进行映射
      // setProducts(fetchedProducts.map(p => ({ id: p.id, goods_name: p.goods_name, price: p.price, stock: p.stock, goods_type: p.goods_type })));
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("获取商品失败:", error);
      // 可选：加载失败时可以设置一些默认或空数据
      // setProducts(initialProducts); // 例如，使用之前注释掉的模拟数据作为备用
    } finally {
      setLoading(false); // 加载完成，设置loading为false
    }
  };

  // 使用useEffect在组件挂载时获取商品数据
  useEffect(() => {
    fetchProducts();
  }, []); // 空依赖数组意味着这个effect只会在组件挂载时运行一次

  const columns: TableProps<Product>['columns'] = [
    {
      title: '商品名称',
      dataIndex: 'goods_name',
      key: 'goods_name',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price}`,
      sorter: (a: Product, b: Product) => a.price - b.price,
      sortDirections: ['descend', 'ascend'] as SortOrder[],
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a: Product, b: Product) => a.stock - b.stock,
      sortDirections: ['descend', 'ascend'] as SortOrder[],
    },
    {
      title: '类别',
      dataIndex: 'goods_type',
      key: 'goods_type',
      filters: categories.map(goods_type => ({ text: goods_type, value: goods_type })),
      onFilter: (value: React.Key | boolean, record: Product) => {
        if (typeof value === 'string') {
          return record.goods_type.includes(value);
        }
        return false;
      },
      filterMultiple: true,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space size="middle">
          <EditGoodsBtn
            record={record}
            onEditProduct={handleEditProduct}
          />
        </Space>
      ),
    },
  ];

  const cancel = () => {
  };

  const tableLocale = {
    sortTitle: '排序',
    filterTitle: '筛选',
    filterConfirm: '确定',
    filterReset: '重置',
    cancelSort: '点击取消排序',
    triggerAsc: '点击按升序排序',
    triggerDesc: '点击按降序排序',
  };

  return (
    <div style={{ padding: '20px' }}>
      <AddGoodsBtn
        initCategories={initialCategories}
        onProductAdded={fetchProducts}
      />

      <Table
        dataSource={products}
        columns={columns}
        rowKey="id"
        bordered
        title={() => '商品管理表格'}
        pagination={{ onChange: cancel, pageSize: 5 }}
        locale={tableLocale}
        loading={loading} // 显示加载状态
      />

    </div>
  );
};

export default AdminProductPage;