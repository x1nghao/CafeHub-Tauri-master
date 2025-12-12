use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Account {
    pub id: i64,
    pub username: String,
    pub phone: Option<String>,
    pub gender: Option<i8>,
    pub join_time: Option<NaiveDate>,
    pub balance: Option<Decimal>,
    pub user_type: i8,
}

#[derive(Deserialize)]
pub struct RegistrationData {
    pub username: String,
    pub password: String,
    pub phone: Option<String>,
    pub gender: Option<i8>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MonthlyConsumptionSummary {
    pub month: String, // "YYYY-MM"
    pub total_amount: Decimal,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct GoodsConsumptionShare {
    pub goods_name: String,
    pub amount: Decimal,
}

#[derive(Deserialize)]
pub struct UpdateUserData {
    pub username: Option<String>,
    pub phone: Option<String>,
    pub gender: Option<i8>,
}

#[derive(Deserialize)]
pub struct UpdatePasswordData {
    pub current_password: String,
    pub new_password: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Goods {
    pub id: i32,
    pub goods_name: String,
    pub goods_type: Option<String>,
    pub price: Decimal,
    pub stock: Option<i32>,
}

#[derive(Deserialize)]
pub struct AddGoodsData {
    pub goods_name: String,
    pub goods_type: Option<String>,
    pub price: Decimal,
    pub stock: Option<i32>,
}

#[derive(Deserialize)]
pub struct UpdateGoodsData {
    pub stock: Option<i32>,
    pub price: Option<Decimal>,
}

#[derive(Deserialize)]
pub struct RechargeBalanceData {
    pub user_id: i64,
    pub amount: Decimal,
}

#[derive(Deserialize, Clone)]
pub struct PurchaseItem {
    pub goods_id: i32,
    pub quantity: i32,
}

#[derive(Deserialize)]
pub struct PurchaseGoodsData {
    pub user_id: i64,
    pub items: Vec<PurchaseItem>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct LostItem {
    pub id: i64,
    pub item_name: String,
    pub pick_place: Option<String>,
    pub pick_user_id: Option<i64>,
    pub pick_user_name: Option<String>,
    pub claim_user_id: Option<i64>,
    pub claim_user_name: Option<String>,
    pub pick_time: Option<NaiveDate>,
    pub claim_time: Option<NaiveDate>,
    pub status: i8, // 0: Unclaimed, 1: Claimed
}

#[derive(Deserialize)]
pub struct ReportLostItemData {
    pub item_name: String,
    pub pick_place: Option<String>,
    pub pick_user_id: Option<i64>,
}

#[derive(Deserialize)]
pub struct ClaimLostItemData {
    pub item_id: i64,
    pub claim_user_id: i64,
}

#[derive(Deserialize)]
pub struct SendMessageData {
    pub sender_id: i64,
    pub receiver_id: i64,
    pub title: Option<String>,
    pub message_content: String,
}

#[derive(Deserialize)]
pub struct CusSendMessageData {
    pub sender_id: i64,
    pub title: Option<String>,
    pub message_content: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MessageInfo {
    pub id: i64,
    pub sender_id: i64,
    pub receiver_id: i64,
    pub sender_username: String,
    pub receiver_username: String,
    pub title: Option<String>,
    pub message_content: String,
    pub send_date: Option<NaiveDate>,
    pub read_status: i8, // 0: Unread, 1: Read
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MarkReadData {
    pub message_id: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserBasicInfo {
    pub id: i64,
    pub username: String,
}
