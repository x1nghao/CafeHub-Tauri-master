use crate::models::*;
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Datelike, Local, NaiveDate};
use mysql::{params, prelude::Queryable, Error as MySQLError, Pool};
use rust_decimal::Decimal;
use tauri::State;

#[tauri::command]
pub fn login(
    username: String,
    password: String,
    mysql_pool: State<Pool>,
) -> Result<Account, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let result: Result<Option<(i64, String, String, Option<String>, Option<i8>, Option<NaiveDate>, Option<Decimal>, i8)>, mysql::Error> =
        conn.exec_first(
            "SELECT id, username, password, phone, gender, join_time, balance, user_type FROM account WHERE username = :username",
            params! {"username" => &username},
        );

    match result {
        Ok(Some((
            id,
            uname,
            stored_hashed_password,
            phone,
            gender,
            join_time,
            balance,
            user_type,
        ))) => {
            let valid_password = verify(&password, &stored_hashed_password).map_err(|e| {
                eprintln!("Password verification error for user {}: {}", username, e);
                "Password verification process failed".to_string()
            })?;

            if valid_password {
                let account = Account {
                    id,
                    username: uname,
                    phone,
                    gender,
                    join_time,
                    balance,
                    user_type,
                };
                Ok(account)
            } else {
                println!("Login failed for user {}: Invalid password", username);
                Err("Invalid username or password".to_string())
            }
        }
        Ok(None) => {
            println!("Login failed for user {}: User not found", username);
            Err("Invalid username or password".to_string())
        }
        Err(e) => {
            eprintln!("Database query failed for user {}: {}", username, e);
            Err(format!("Database query failed: {}", e))
        }
    }
}

#[tauri::command]
pub fn register_user(data: RegistrationData, mysql_pool: State<Pool>) -> Result<i32, String> {
    if data.username.is_empty() || data.password.is_empty() {
        return Err("Username and password cannot be empty".to_string());
    }

    if let Some(gender_val) = data.gender {
        if gender_val != 0 && gender_val != 1 {
            return Ok(4);
        }
    }

    if let Some(ref phone_str) = data.phone {
        if !phone_str.chars().all(|c| c.is_ascii_digit()) || phone_str.len() != 11 {
            return Ok(3);
        }
    }

    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;
    let current_date = Local::now().date_naive();
    let user_type: i8 = 1;
    let default_balance: Decimal = Decimal::new(0, 2);

    let hashed_password = hash(&data.password, DEFAULT_COST).map_err(|e| {
        eprintln!("Failed to hash password for user {}: {}", data.username, e);
        "Password hashing failed".to_string()
    })?;

    let result = conn.exec_drop(
        "INSERT INTO account (username, password, phone, gender, join_time, balance, user_type) VALUES (:username, :password, :phone, :gender, :join_time, :balance, :user_type)",
        params! {
            "username" => &data.username,
            "password" => &hashed_password,
            "phone" => &data.phone,
            "gender" => &data.gender,
            "join_time" => current_date,
            "balance" => default_balance,
            "user_type" => user_type,
        }
    );

    match result {
        Ok(_) => Ok(1),
        Err(e) => {
            eprintln!("Database insert failed for user {}: {}", data.username, e);
            if let MySQLError::MySqlError(ref mysql_err) = e {
                if mysql_err.code == 1062 {
                    return Ok(2);
                }
            }
            Err(format!("Database error during registration: {}", e))
        }
    }
}

#[tauri::command]
pub fn update_user_password(
    user_id: i64,
    data: UpdatePasswordData,
    mysql_pool: State<Pool>,
) -> Result<String, String> {
    if data.new_password.is_empty() {
        return Err("New password cannot be empty".to_string());
    }
    if data.current_password.is_empty() {
        return Err("Current password cannot be empty".to_string());
    }

    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let stored_hashed_password_result: Result<Option<String>, mysql::Error> = conn.exec_first(
        "SELECT password FROM account WHERE id = :user_id AND user_type = 1",
        params! { "user_id" => user_id },
    );

    let stored_hashed_password = match stored_hashed_password_result {
        Ok(Some(hash)) => hash,
        Ok(None) => {
            return Err(format!(
                "User with ID {} not found or is not a customer.",
                user_id
            ));
        }
        Err(e) => {
            eprintln!(
                "Database query failed for current password (ID {}): {}",
                user_id, e
            );
            return Err(format!("Database query failed: {}", e));
        }
    };

    let valid_current_password =
        verify(&data.current_password, &stored_hashed_password).map_err(|e| {
            eprintln!(
                "Current password verification error for user ID {}: {}",
                user_id, e
            );
            "Password verification process failed".to_string()
        })?;

    if !valid_current_password {
        return Err("Incorrect current password".to_string());
    }

    let new_hashed_password = hash(&data.new_password, DEFAULT_COST).map_err(|e| {
        eprintln!("Failed to hash new password for user ID {}: {}", user_id, e);
        "Password hashing failed".to_string()
    })?;

    let update_result = conn.exec_drop(
        "UPDATE account SET password = :new_password WHERE id = :user_id AND user_type = 1",
        params! {
            "new_password" => &new_hashed_password,
            "user_id" => user_id,
        },
    );

    match update_result {
        Ok(_) => {
            if conn.affected_rows() > 0 {
                Ok("Password updated successfully.".to_string())
            } else {
                Err("Failed to update password, user not found or no change made.".to_string())
            }
        }
        Err(e) => {
            eprintln!(
                "Database password update failed for user ID {}: {}",
                user_id, e
            );
            Err(format!("Database password update failed: {}", e))
        }
    }
}

#[tauri::command]
pub fn get_total_users(mysql_pool: State<Pool>) -> Result<i64, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;
    let count: Result<Option<i64>, mysql::Error> =
        conn.query_first("SELECT COUNT(*) FROM account WHERE user_type = 1");

    match count {
        Ok(Some(num_users)) => Ok(num_users),
        Ok(None) => Ok(0),
        Err(e) => {
            eprintln!("Database query failed for total users: {}", e);
            Err(format!("Database query failed: {}", e))
        }
    }
}

#[tauri::command]
pub fn get_new_users_this_month(mysql_pool: State<Pool>) -> Result<i64, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;
    let now = Local::now();
    let current_year = now.year();
    let current_month_num = now.month();

    let first_day_current_month = NaiveDate::from_ymd_opt(current_year, current_month_num, 1)
        .ok_or_else(|| "Failed to construct first day of current month".to_string())?;

    let count: Result<Option<i64>, mysql::Error> = conn.exec_first(
        "SELECT COUNT(*) FROM account WHERE user_type = 1 AND join_time >= :start_date",
        params! {
            "start_date" => first_day_current_month.format("%Y-%m-%d").to_string(),
        },
    );

    match count {
        Ok(Some(num_users)) => Ok(num_users),
        Ok(None) => Ok(0),
        Err(e) => {
            eprintln!("Database query failed for new users this month: {}", e);
            Err(format!("Database query failed: {}", e))
        }
    }
}

#[tauri::command]
pub fn get_monthly_consumption_summary(
    mysql_pool: State<Pool>,
) -> Result<Vec<MonthlyConsumptionSummary>, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let query = "SELECT month, SUM(amount) as total_amount FROM consumption GROUP BY month ORDER BY month ASC";

    let results: Vec<MonthlyConsumptionSummary> = conn
        .query_map(query, |(month, total_amount)| MonthlyConsumptionSummary {
            month,
            total_amount,
        })
        .map_err(|e| {
            format!(
                "Database query failed for monthly consumption summary: {}",
                e
            )
        })?;

    Ok(results)
}

#[tauri::command]
pub fn get_goods_consumption_share_current_month(
    mysql_pool: State<Pool>,
) -> Result<Vec<GoodsConsumptionShare>, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let now = Local::now();
    let current_month_str = now.format("%Y-%m").to_string();

    let query = "
        SELECT g.goods_name, SUM(c.amount) as consumed_amount
        FROM consumption c
        JOIN goods g ON c.goods_id = g.id
        WHERE c.month = :current_month
        GROUP BY g.goods_name
        ORDER BY consumed_amount DESC";

    match conn.exec_map(
        query,
        params! { "current_month" => &current_month_str },
        |(goods_name, amount_val): (String, Decimal)| GoodsConsumptionShare {
            goods_name,
            amount: amount_val,
        },
    ) {
        Ok(results) => Ok(results),
        Err(e) => {
            eprintln!(
                "[RUST ERROR] Database query failed for current month goods consumption share (month: {}): {}",
                current_month_str, e
            );
            Err(format!(
                "Database query failed for current month goods consumption share: {}",
                e
            ))
        }
    }
}

#[tauri::command]
pub fn get_user_details(user_id: i64, mysql_pool: State<Pool>) -> Result<Account, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let result: Result<Option<(i64, String, Option<String>, Option<i8>, Option<NaiveDate>, Option<Decimal>, i8)>, mysql::Error> =
        conn.exec_first(
            "SELECT id, username, phone, gender, join_time, balance, user_type FROM account WHERE id = :user_id AND user_type = 1",
            params! { "user_id" => user_id },
        );

    match result {
        Ok(Some((id, username, phone, gender, join_time, balance, user_type))) => Ok(Account {
            id,
            username,
            phone,
            gender,
            join_time,
            balance,
            user_type,
        }),
        Ok(None) => Err(format!(
            "User with ID {} not found or is not a customer.",
            user_id
        )),
        Err(e) => {
            eprintln!(
                "Database query failed for user details (ID {}): {}",
                user_id, e
            );
            Err(format!("Database query failed: {}", e))
        }
    }
}

#[tauri::command]
pub fn get_user_monthly_consumption(
    user_id: i64,
    mysql_pool: State<Pool>,
) -> Result<Vec<MonthlyConsumptionSummary>, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let query = "
        SELECT month, SUM(amount) as total_amount
        FROM consumption
        WHERE user_id = :user_id
        GROUP BY month
        ORDER BY month ASC";

    let results: Vec<MonthlyConsumptionSummary> = conn
        .exec_map(
            query,
            params! { "user_id" => user_id },
            |(month, total_amount)| MonthlyConsumptionSummary {
                month,
                total_amount,
            },
        )
        .map_err(|e| format!("Database query failed for user monthly consumption: {}", e))?;

    Ok(results)
}

#[tauri::command]
pub fn update_user_details(
    user_id: i64,
    data: UpdateUserData,
    mysql_pool: State<Pool>,
) -> Result<String, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let mut set_clauses: Vec<String> = Vec::new();
    let mut query_params_vec: Vec<(String, mysql::Value)> = Vec::new();

    if let Some(uname_val) = &data.username {
        if uname_val.is_empty() {
            return Err("Username cannot be empty.".to_string());
        }

        let current_username_check: Option<String> = conn
            .exec_first(
                "SELECT username FROM account WHERE id = :user_id",
                params! { "user_id" => user_id },
            )
            .map_err(|e| format!("DB error checking current username: {}", e))?;

        let is_changing_username = match current_username_check {
            Some(ref current_uname) => current_uname != uname_val,
            None => true,
        };

        if is_changing_username {
            let existing_user: Option<i64> = conn.exec_first(
                "SELECT id FROM account WHERE username = :username AND id != :user_id_to_exclude",
                params! { "username" => uname_val, "user_id_to_exclude" => user_id }
            ).map_err(|e| format!("DB error checking username uniqueness: {}", e))?;

            if existing_user.is_some() {
                return Err(format!("Username '{}' is already taken.", uname_val));
            }
            set_clauses.push("username = :username".to_string());
            query_params_vec.push(("username".to_string(), uname_val.clone().into()));
        }
    }

    if let Some(phone_val) = &data.phone {
        if phone_val.is_empty() {
            set_clauses.push("phone = NULL".to_string());
        } else {
            if !phone_val.chars().all(|c| c.is_ascii_digit()) || phone_val.len() != 11 {
                return Err("Invalid phone number format. Must be 11 digits.".to_string());
            }
            set_clauses.push("phone = :phone".to_string());
            query_params_vec.push(("phone".to_string(), phone_val.clone().into()));
        }
    }

    if let Some(gender_val) = data.gender {
        if gender_val == 0 || gender_val == 1 {
            set_clauses.push("gender = :gender".to_string());
            query_params_vec.push(("gender".to_string(), gender_val.into()));
        } else {
            return Err("Invalid gender value. Must be 0 (Male) or 1 (Female).".to_string());
        }
    }

    if set_clauses.is_empty() {
        return Ok("No details provided to update or values are the same.".to_string());
    }

    query_params_vec.push(("user_id".to_string(), user_id.into()));
    let params_for_exec = mysql::Params::from(query_params_vec);

    let query_string = format!(
        "UPDATE account SET {} WHERE id = :user_id AND user_type = 1",
        set_clauses.join(", ")
    );

    match conn.exec_drop(&query_string, params_for_exec) {
        Ok(_) => {
            if conn.affected_rows() > 0 {
                Ok("User details updated successfully.".to_string())
            } else {
                Ok("No changes made to user details (user not found, not a customer, or new values match old values).".to_string())
            }
        }
        Err(e) => {
            eprintln!("Database update failed for user ID {}: {}", user_id, e);
            if let MySQLError::MySqlError(ref mysql_err) = e {
                if mysql_err.code == 1062 {
                    return Err("Update failed: Username or Phone number might already be in use by another account.".to_string());
                }
            }
            Err(format!("Database update failed: {}", e))
        }
    }
}

#[tauri::command]
pub fn get_all_goods(mysql_pool: State<Pool>) -> Result<Vec<Goods>, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let query = "SELECT id, goods_name, goods_type, price, stock FROM goods";

    let results: Vec<Goods> = conn
        .query_map(query, |(id, goods_name, goods_type, price, stock)| Goods {
            id,
            goods_name,
            goods_type,
            price,
            stock,
        })
        .map(|items| items)
        .map_err(|e| format!("Database query failed for all goods: {}", e))?;

    Ok(results)
}

#[tauri::command]
pub fn add_goods(data: AddGoodsData, mysql_pool: State<Pool>) -> Result<String, String> {
    if data.goods_name.is_empty() {
        return Err("Goods name cannot be empty".to_string());
    }
    if data.price <= Decimal::ZERO {
        return Err("Price must be positive".to_string());
    }

    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let stock_value = data.stock.unwrap_or(0);

    let result = conn.exec_drop(
        "INSERT INTO goods (goods_name, goods_type, price, stock) VALUES (:goods_name, :goods_type, :price, :stock)",
        params! {
            "goods_name" => &data.goods_name,
            "goods_type" => &data.goods_type,
            "price" => data.price,
            "stock" => stock_value,
        }
    );

    match result {
        Ok(_) => Ok(format!("Goods '{}' added successfully.", data.goods_name)),
        Err(e) => {
            eprintln!(
                "Database insert failed for goods {}: {}",
                data.goods_name, e
            );
            if let MySQLError::MySqlError(ref mysql_err) = e {
                if mysql_err.code == 1062 {
                    return Err(format!(
                        "Goods with name '{}' already exists.",
                        data.goods_name
                    ));
                }
            }
            Err(format!("Database error while adding goods: {}", e))
        }
    }
}

#[tauri::command]
pub fn update_goods_info(
    goods_id: i32,
    data: UpdateGoodsData,
    mysql_pool: State<Pool>,
) -> Result<String, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let mut set_clauses: Vec<String> = Vec::new();
    let mut query_params: Vec<(String, mysql::Value)> = Vec::new();

    if let Some(stock_val) = data.stock {
        if stock_val < 0 {
            return Err("Stock cannot be negative".to_string());
        }
        set_clauses.push("stock = :stock".to_string());
        query_params.push(("stock".to_string(), stock_val.into()));
    }

    if let Some(price_val) = data.price {
        if price_val <= Decimal::ZERO {
            return Err("Price must be positive".to_string());
        }
        set_clauses.push("price = :price".to_string());
        query_params.push(("price".to_string(), price_val.into()));
    }

    if set_clauses.is_empty() {
        return Ok("No details provided to update.".to_string());
    }

    query_params.push(("goods_id".to_string(), goods_id.into()));

    let query = format!(
        "UPDATE goods SET {} WHERE id = :goods_id",
        set_clauses.join(", ")
    );

    match conn.exec_drop(&query, mysql::Params::from(query_params)) {
        Ok(_) => {
            if conn.affected_rows() > 0 {
                Ok(format!(
                    "Info for goods ID {} updated successfully.",
                    goods_id
                ))
            } else {
                Err(format!(
                    "Goods with ID {} not found or no changes made.",
                    goods_id
                ))
            }
        }
        Err(e) => {
            eprintln!(
                "Database update failed for goods info (ID {}): {}",
                goods_id, e
            );
            Err(format!("Database error while updating goods info: {}", e))
        }
    }
}

#[tauri::command]
pub fn recharge_balance(
    data: RechargeBalanceData,
    mysql_pool: State<Pool>,
) -> Result<String, String> {
    if data.amount <= Decimal::ZERO {
        return Err("Recharge amount must be positive".to_string());
    }

    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let user_exists: Option<i8> = conn
        .exec_first(
            "SELECT user_type FROM account WHERE id = :user_id",
            params! { "user_id" => data.user_id },
        )
        .map_err(|e| format!("Failed to query user: {}", e))?;

    match user_exists {
        Some(1) => {
            let update_result = conn.exec_drop(
                "UPDATE account SET balance = balance + :amount WHERE id = :user_id AND user_type = 1",
                params! {
                    "amount" => data.amount,
                    "user_id" => data.user_id,
                },
            );

            match update_result {
                Ok(_) => {
                    if conn.affected_rows() > 0 {
                        Ok(format!(
                            "Successfully recharged {} for user ID {}.",
                            data.amount, data.user_id
                        ))
                    } else {
                        Err(format!(
                            "Failed to recharge balance for user ID {}. User not found or no change made.",
                            data.user_id
                        ))
                    }
                }
                Err(e) => {
                    eprintln!(
                        "Database update failed for balance recharge (user ID {}): {}",
                        data.user_id, e
                    );
                    Err(format!("Database error while recharging balance: {}", e))
                }
            }
        }
        Some(_) => Err(format!("User with ID {} is not a customer.", data.user_id)),
        None => Err(format!("User with ID {} not found.", data.user_id)),
    }
}

#[tauri::command]
pub fn purchase_goods(data: PurchaseGoodsData, mysql_pool: State<Pool>) -> Result<i32, String> {
    if data.items.is_empty() {
        return Err("No items provided for purchase.".to_string());
    }

    for item in &data.items {
        if item.quantity <= 0 {
            return Err(format!(
                "Quantity for goods ID {} must be positive.",
                item.goods_id
            ));
        }
    }

    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let mut tx = conn
        .start_transaction(mysql::TxOpts::default())
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    let mut total_purchase_price = Decimal::ZERO;

    struct ProcessedItemDetail {
        goods_id: i32,
        quantity: i32,
        item_total_price: Decimal,
    }
    let mut processed_item_details: Vec<ProcessedItemDetail> = Vec::new();

    for item in &data.items {
        let goods_info: Option<(Decimal, i32)> = tx
            .exec_first(
                "SELECT price, stock FROM goods WHERE id = :goods_id FOR UPDATE",
                params! { "goods_id" => item.goods_id },
            )
            .map_err(|e| format!("Failed to query goods ID {}: {}", item.goods_id, e))?;

        let (price_per_item, current_stock) = match goods_info {
            Some(info) => info,
            None => {
                return Err(format!("Goods with ID {} not found.", item.goods_id));
            }
        };

        if current_stock < item.quantity {
            return Ok(1);
        }

        let item_total_price = price_per_item * Decimal::from(item.quantity);
        total_purchase_price += item_total_price;
        processed_item_details.push(ProcessedItemDetail {
            goods_id: item.goods_id,
            quantity: item.quantity,
            item_total_price,
        });
    }

    let user_info: Option<(Decimal, i8)> = tx
        .exec_first(
            "SELECT balance, user_type FROM account WHERE id = :user_id AND user_type = 1 FOR UPDATE",
            params! { "user_id" => data.user_id },
        )
        .map_err(|e| format!("Failed to query user: {}", e))?;

    let (current_balance, _user_type) = match user_info {
        Some(info) => info,
        None => {
            return Err(format!(
                "Customer account with ID {} not found.",
                data.user_id
            ));
        }
    };

    if current_balance < total_purchase_price {
        return Ok(2);
    }

    for p_item_detail in &processed_item_details {
        tx.exec_drop(
            "UPDATE goods SET stock = stock - :quantity WHERE id = :goods_id",
            params! {
                "quantity" => p_item_detail.quantity,
                "goods_id" => p_item_detail.goods_id,
            },
        )
        .map_err(|e| {
            format!(
                "Failed to update stock for goods ID {}: {}",
                p_item_detail.goods_id, e
            )
        })?;
    }

    tx.exec_drop(
        "UPDATE account SET balance = balance - :total_price WHERE id = :user_id",
        params! {
            "total_price" => total_purchase_price,
            "user_id" => data.user_id,
        },
    )
    .map_err(|e| format!("Failed to update user balance: {}", e))?;

    let current_month_str = Local::now().format("%Y-%m").to_string();
    for p_item_detail in &processed_item_details {
        tx.exec_drop(
            "INSERT INTO consumption (user_id, month, goods_id, amount) VALUES (:user_id, :month, :goods_id, :amount)
             ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount)",
            params! {
                "user_id" => data.user_id,
                "month" => &current_month_str,
                "goods_id" => p_item_detail.goods_id,
                "amount" => p_item_detail.item_total_price,
            },
        )
        .map_err(|e| format!("Failed to record consumption for goods ID {}: {}", p_item_detail.goods_id, e))?;
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(0)
}

#[tauri::command]
pub fn get_all_lost_items(mysql_pool: State<Pool>) -> Result<Vec<LostItem>, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let query = "
        SELECT
            li.id,
            li.item_name,
            li.pick_place,
            li.pick_user_id,
            p_acc.username AS pick_user_name,
            li.claim_user_id,
            c_acc.username AS claim_user_name,
            li.pick_time,
            li.claim_time,
            li.status
        FROM
            lost_items li
        LEFT JOIN
            account p_acc ON li.pick_user_id = p_acc.id
        LEFT JOIN
            account c_acc ON li.claim_user_id = c_acc.id
        ORDER BY
            li.pick_time DESC, li.id DESC;
    ";

    let results: Vec<LostItem> = conn
        .query_map(
            query,
            |(
                id,
                item_name,
                pick_place,
                pick_user_id,
                pick_user_name,
                claim_user_id,
                claim_user_name,
                pick_time,
                claim_time,
                status,
            )| {
                LostItem {
                    id,
                    item_name,
                    pick_place,
                    pick_user_id,
                    pick_user_name,
                    claim_user_id,
                    claim_user_name,
                    pick_time,
                    claim_time,
                    status,
                }
            },
        )
        .map_err(|e| format!("Database query failed for all lost items: {}", e))?;

    Ok(results)
}

#[tauri::command]
pub fn report_lost_item(
    data: ReportLostItemData,
    mysql_pool: State<Pool>,
) -> Result<String, String> {
    if data.item_name.is_empty() {
        return Err("Item name cannot be empty".to_string());
    }

    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let current_date = Local::now().date_naive();
    let status: i8 = 0;

    let result = conn.exec_drop(
        "INSERT INTO lost_items (item_name, pick_place, pick_user_id, pick_time, status) VALUES (:item_name, :pick_place, :pick_user_id, :pick_time, :status)",
        params! {
            "item_name" => &data.item_name,
            "pick_place" => &data.pick_place,
            "pick_user_id" => &data.pick_user_id,
            "pick_time" => current_date,
            "status" => status,
        }
    );

    match result {
        Ok(_) => Ok(format!(
            "Lost item '{}' reported successfully.",
            data.item_name
        )),
        Err(e) => {
            eprintln!(
                "Database insert failed for lost item {}: {}",
                data.item_name, e
            );
            Err(format!("Database error while reporting lost item: {}", e))
        }
    }
}

#[tauri::command]
pub fn claim_lost_item(data: ClaimLostItemData, mysql_pool: State<Pool>) -> Result<String, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let current_date = Local::now().date_naive();
    let new_status: i8 = 1;

    let item_status: Option<i8> = conn
        .exec_first(
            "SELECT status FROM lost_items WHERE id = :item_id",
            params! { "item_id" => data.item_id },
        )
        .map_err(|e| format!("Failed to query lost item status: {}", e))?;

    match item_status {
        Some(0) => {
            let update_result = conn.exec_drop(
                "UPDATE lost_items SET status = :status, claim_user_id = :claim_user_id, claim_time = :claim_time WHERE id = :item_id",
                params! {
                    "status" => new_status,
                    "claim_user_id" => data.claim_user_id,
                    "claim_time" => current_date,
                    "item_id" => data.item_id,
                }
            );

            match update_result {
                Ok(_) => {
                    if conn.affected_rows() > 0 {
                        Ok(format!("Item ID {} claimed successfully.", data.item_id))
                    } else {
                        Err(format!("Failed to update item ID {}. It might have been claimed or deleted concurrently.", data.item_id))
                    }
                }
                Err(e) => {
                    eprintln!(
                        "Database update failed for claiming item ID {}: {}",
                        data.item_id, e
                    );
                    Err(format!("Database error while claiming item: {}", e))
                }
            }
        }
        Some(1) => Err(format!(
            "Item ID {} has already been claimed.",
            data.item_id
        )),
        None => Err(format!("Lost item with ID {} not found.", data.item_id)),
        Some(_) => Err(format!("Unknown status for item ID {}.", data.item_id)),
    }
}

#[tauri::command]
pub fn admin_send_message(data: SendMessageData, mysql_pool: State<Pool>) -> Result<i32, String> {
    if data.message_content.is_empty() {
        return Err("Message content cannot be empty".to_string());
    }
    if data.sender_id == data.receiver_id {
        return Err("Sender and receiver cannot be the same user".to_string());
    }

    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let sender_exists: Option<i64> = conn
        .exec_first(
            "SELECT id FROM account WHERE id = :id",
            params! {"id" => data.sender_id},
        )
        .map_err(|e| format!("Failed to verify sender: {}", e))?;
    if sender_exists.is_none() {
        println!(
            "Send message failed: Sender with ID {} not found.",
            data.sender_id
        );
        return Ok(1);
    }

    let receiver_exists: Option<i64> = conn
        .exec_first(
            "SELECT id FROM account WHERE id = :id",
            params! {"id" => data.receiver_id},
        )
        .map_err(|e| format!("Failed to verify receiver: {}", e))?;
    if receiver_exists.is_none() {
        println!(
            "Send message failed: Receiver with ID {} not found.",
            data.receiver_id
        );
        return Ok(2);
    }

    let current_date = Local::now().date_naive();
    let read_status: i8 = 0;

    let result = conn.exec_drop(
        "INSERT INTO message (sender_id, receiver_id, title, message_content, send_date, read_status) VALUES (:sender_id, :receiver_id, :title, :message_content, :send_date, :read_status)",
        params! {
            "sender_id" => data.sender_id,
            "receiver_id" => data.receiver_id,
            "title" => &data.title,
            "message_content" => &data.message_content,
            "send_date" => current_date,
            "read_status" => read_status,
        }
    );

    match result {
        Ok(_) => Ok(0),
        Err(e) => {
            eprintln!("Database insert failed for message: {}", e);
            Err(format!("Database error while sending message: {}", e))
        }
    }
}

#[tauri::command]
pub fn customer_send_message(
    data: CusSendMessageData,
    mysql_pool: State<Pool>,
) -> Result<i32, String> {
    if data.message_content.is_empty() {
        return Err("Message content cannot be empty".to_string());
    }

    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let admin_id_result: Result<Option<i64>, mysql::Error> =
        conn.exec_first("SELECT id FROM account WHERE user_type = 0 LIMIT 1", ());

    let admin_id = match admin_id_result {
        Ok(Some(id)) => id,
        Ok(None) => {
            println!("Send message failed: Administrator account (user_type = 0) not found.");
            return Ok(2);
        }
        Err(e) => {
            eprintln!("Database error while querying for administrator: {}", e);
            return Err(format!("Database error finding administrator: {}", e));
        }
    };

    let sender_info_result: Result<Option<i8>, mysql::Error> = conn.exec_first(
        "SELECT user_type FROM account WHERE id = :sender_id",
        params! {"sender_id" => data.sender_id},
    );

    match sender_info_result {
        Ok(Some(user_type)) => {
            if user_type != 1 {
                println!(
                    "Send message failed: Sender ID {} is not a customer (user_type: {}).",
                    data.sender_id, user_type
                );
                return Err(format!(
                    "Sender ID {} is not a customer. Only customers can send messages to the administrator.",
                    data.sender_id
                ));
            }
        }
        Ok(None) => {
            println!(
                "Send message failed: Sender (customer) with ID {} not found.",
                data.sender_id
            );
            return Ok(1);
        }
        Err(e) => {
            eprintln!("Database error while verifying sender: {}", e);
            return Err(format!("Database error verifying sender: {}", e));
        }
    }

    let current_date = Local::now().date_naive();
    let read_status: i8 = 0;

    let result = conn.exec_drop(
        "INSERT INTO message (sender_id, receiver_id, title, message_content, send_date, read_status) VALUES (:sender_id, :receiver_id, :title, :message_content, :send_date, :read_status)",
        params! {
            "sender_id" => data.sender_id,
            "receiver_id" => admin_id,
            "title" => &data.title,
            "message_content" => &data.message_content,
            "send_date" => current_date,
            "read_status" => read_status,
        }
    );

    match result {
        Ok(_) => Ok(0),
        Err(e) => {
            eprintln!("Database insert failed for message: {}", e);
            Err(format!("Database error while sending message: {}", e))
        }
    }
}

#[tauri::command]
pub fn get_sent_messages(
    user_id: i64,
    mysql_pool: State<Pool>,
) -> Result<Vec<MessageInfo>, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let query = "
        SELECT
            m.id, m.sender_id, m.receiver_id,
            s_acc.username AS sender_username,
            r_acc.username AS receiver_username,
            m.title, m.message_content, m.send_date, m.read_status
        FROM message m
        JOIN account s_acc ON m.sender_id = s_acc.id
        JOIN account r_acc ON m.receiver_id = r_acc.id
        WHERE m.sender_id = :user_id";

    let results: Vec<MessageInfo> = conn
        .exec_map(
            query,
            params! { "user_id" => user_id },
            |(
                id,
                sender_id_db,
                receiver_id_db,
                sender_username,
                receiver_username,
                title,
                message_content,
                send_date,
                read_status,
            )| {
                MessageInfo {
                    id,
                    sender_id: sender_id_db,
                    receiver_id: receiver_id_db,
                    sender_username,
                    receiver_username,
                    title,
                    message_content,
                    send_date,
                    read_status,
                }
            },
        )
        .map_err(|e| format!("Database query failed for sent messages: {}", e))?;

    Ok(results)
}

#[tauri::command]
pub fn get_recived_messages(
    user_id: i64,
    mysql_pool: State<Pool>,
) -> Result<Vec<MessageInfo>, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let query = "
        SELECT
            m.id, m.sender_id, m.receiver_id,
            s_acc.username AS sender_username,
            r_acc.username AS receiver_username,
            m.title, m.message_content, m.send_date, m.read_status
        FROM message m
        JOIN account s_acc ON m.sender_id = s_acc.id
        JOIN account r_acc ON m.receiver_id = r_acc.id
        WHERE m.receiver_id = :user_id";

    let results: Vec<MessageInfo> = conn
        .exec_map(
            query,
            params! { "user_id" => user_id },
            |(
                id,
                sender_id_db,
                receiver_id_db,
                sender_username,
                receiver_username,
                title,
                message_content,
                send_date,
                read_status,
            )| {
                MessageInfo {
                    id,
                    sender_id: sender_id_db,
                    receiver_id: receiver_id_db,
                    sender_username,
                    receiver_username,
                    title,
                    message_content,
                    send_date,
                    read_status,
                }
            },
        )
        .map_err(|e| format!("Database query failed for recieved messages: {}", e))?;

    Ok(results)
}

#[tauri::command]
pub fn mark_message_as_read(
    data: MarkReadData,
    current_user_id: i64,
    mysql_pool: State<Pool>,
) -> Result<i32, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let query_result: Result<Option<(i64, i8)>, mysql::Error> = conn.exec_first(
        "SELECT receiver_id, read_status FROM message WHERE id = :message_id",
        params! { "message_id" => data.message_id },
    );

    match query_result {
        Ok(Some((receiver_id_db, read_status_db))) => {
            if receiver_id_db != current_user_id {
                println!(
                    "User ID {} attempted to mark message ID {} as read, but is not the receiver (receiver ID {}).",
                    current_user_id, data.message_id, receiver_id_db
                );
                return Ok(1);
            }

            if read_status_db == 1 {
                println!(
                    "Message ID {} was already read by user ID {}.",
                    data.message_id, current_user_id
                );
                return Ok(0);
            }

            let update_result = conn.exec_drop(
                "UPDATE message SET read_status = 1 WHERE id = :message_id AND receiver_id = :receiver_id",
                params! {
                    "message_id" => data.message_id,
                    "receiver_id" => current_user_id,
                }
            );

            match update_result {
                Ok(_) => {
                    if conn.affected_rows() > 0 {
                        Ok(0)
                    } else {
                        eprintln!(
                            "Failed to mark message ID {} as read for user ID {}: 0 rows affected despite prior checks.",
                            data.message_id, current_user_id
                        );
                        Err(format!(
                            "Failed to mark message ID {} as read. The message state might have changed concurrently or an unexpected issue occurred.",
                            data.message_id
                        ))
                    }
                }
                Err(e) => {
                    eprintln!(
                        "Database update failed for marking message read (ID {}): {}",
                        data.message_id, e
                    );
                    Err(format!(
                        "Database error while marking message as read: {}",
                        e
                    ))
                }
            }
        }
        Ok(None) => Err(format!("Message with ID {} not found.", data.message_id)),
        Err(e) => {
            eprintln!(
                "Database query failed for message details (ID {}): {}",
                data.message_id, e
            );
            Err(format!(
                "Database query failed to retrieve message details: {}",
                e
            ))
        }
    }
}

#[tauri::command]
pub fn get_all_users(mysql_pool: State<Pool>) -> Result<Vec<UserBasicInfo>, String> {
    let mut conn = mysql_pool
        .get_conn()
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;

    let query = "SELECT id, username FROM account ORDER BY id ASC";

    let results: Vec<UserBasicInfo> = conn
        .query_map(query, |(id, username)| UserBasicInfo { id, username })
        .map_err(|e| format!("Database query failed for fetching all users: {}", e))?;

    Ok(results)
}
