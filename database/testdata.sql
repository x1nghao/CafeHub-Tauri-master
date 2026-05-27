INSERT INTO account (username, password, phone, gender, join_time, balance, user_type)
VALUES ('admin', '$2b$12$d9n2xF3hslElNuQAqrln/OeEeYRLnMZIOwvnlpqns5uwr92Wq65yK', NULL, NULL, NULL, NULL, 0);

INSERT INTO account (username, password, phone, gender, join_time, balance, user_type)
VALUES 
('user1', '$2b$12$d9n2xF3hslElNuQAqrln/OeEeYRLnMZIOwvnlpqns5uwr92Wq65yK', '13900139001', 1, '2024-10-05', 100.00, 1),
('user2', '$2b$12$d9n2xF3hslElNuQAqrln/OeEeYRLnMZIOwvnlpqns5uwr92Wq65yK', '13900139002', 0, '2024-12-12', 50.00, 1),
('user3', '$2b$12$d9n2xF3hslElNuQAqrln/OeEeYRLnMZIOwvnlpqns5uwr92Wq65yK', '13900139003', 0, '2025-01-13', 75.50, 1),
('user4', '$2b$12$d9n2xF3hslElNuQAqrln/OeEeYRLnMZIOwvnlpqns5uwr92Wq65yK', '13900139004', 1, '2025-03-22', 200.00, 1),
('user5', '$2b$12$d9n2xF3hslElNuQAqrln/OeEeYRLnMZIOwvnlpqns5uwr92Wq65yK', '13900139005', 0, '2025-05-13', 30.25, 1);

-- password: 123456 ($2b$12$d9n2xF3hslElNuQAqrln/OeEeYRLnMZIOwvnlpqns5uwr92Wq65yK)

INSERT INTO goods (goods_name, goods_type, stock, price) VALUES
('意式浓缩', '咖啡类', 50, 18.00),
('拿铁咖啡', '咖啡类', 50, 25.00),
('卡布奇诺', '咖啡类', 50, 25.00),
('焦糖玛奇朵', '咖啡类', 50, 28.00),
('冰美式咖啡', '咖啡类', 50, 22.00),
('冷萃咖啡', '咖啡类', 30, 30.00),
('英式早餐茶', '非咖啡饮品', 40, 20.00),
('抹茶拿铁', '非咖啡饮品', 40, 25.00),
('热巧克力', '非咖啡饮品', 40, 22.00),
('草莓奶昔', '非咖啡饮品', 30, 28.00),
('柠檬蜂蜜水', '非咖啡饮品', 50, 18.00),
('芝士蛋糕', '烘焙食品', 20, 32.00),
('提拉米苏', '烘焙食品', 20, 35.00),
('牛角包', '烘焙食品', 30, 15.00),
('肉桂卷', '烘焙食品', 25, 18.00),
('巧克力曲奇', '烘焙食品', 40, 12.00),
('火腿芝士三明治', '轻食简餐', 25, 28.00),
('鸡肉牛油果三明治', '轻食简餐', 25, 32.00),
('凯撒沙拉', '轻食简餐', 20, 30.00),
('全日早餐', '轻食简餐', 15, 38.00),
('南瓜汤', '轻食简餐', 30, 22.00),
('埃塞俄比亚单品豆', '咖啡豆与周边', 15, 120.00),
('哥伦比亚单品豆', '咖啡豆与周边', 15, 110.00),
('法压壶', '咖啡豆与周边', 10, 180.00),
('品牌咖啡杯', '咖啡豆与周边', 20, 65.00);

INSERT INTO lost_items (item_name, pick_place, pick_user_id, claim_user_id, pick_time, claim_time, status)
VALUES
('黑色钱包', '前台', 2, 3, '2025-01-10', '2025-01-12', 1),
('iPhone 12', '3号桌', 4, NULL, '2025-01-15', NULL, 0),
('笔记本电脑', '2号桌', 3, NULL, '2025-02-05', NULL, 0),
('雷朋太阳镜', '洗手间', 2, 4, '2025-03-10', '2025-03-11', 1),
('长柄雨伞', '入口', 3, NULL, '2025-04-15', NULL, 0),
('身份证', '电梯间', 3, 5, '2025-04-01', '2025-04-07', 1),
('AirPods耳机', '咖啡厅角落', 3, NULL, '2025-05-05', NULL, 0),
('工牌', '入口', 2, NULL, '2025-05-10', NULL, 0);

INSERT INTO message (sender_id, receiver_id, title, message_content, send_date, read_status)
VALUES
(3, 1, '钱包丢失咨询', '您好，我在一楼大厅丢失了一个黑色钱包，请问有人捡到吗？', '2025-02-01', 0),
(1, 3, '回复：钱包丢失咨询', '您好，已查到有类似钱包被拾获，请携带身份证到前台认领。', '2025-02-02', 1),
(2, 1, '笔记本电脑认领问题', '我遗失了联想笔记本电脑，请问认领需要什么手续？', '2025-03-03', 1),
(1, 2, '回复：笔记本电脑认领问题', '请提供购买凭证或设备序列号，并到失物招领处办理。', '2025-03-03', 1),
(4, 1, 'AirPods耳机可能被捡到', '我的AirPods可能丢在咖啡厅了，能帮忙查一下吗？', '2025-03-05', 0),
(5, 1, '身份证认领', '我的身份证被捡到了吗？名字是张三。', '2025-04-06', 1),
(1, 5, '回复：身份证认领', '已找到您的身份证，请尽快到前台领取。', '2025-04-06', 1),
(6, 1, '雨伞认领', '请问有人捡到长柄雨伞吗？', '2025-04-15', 0);