use crate::models::*;
use crate::db_config::DbConfig;
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Datelike, Local, NaiveDate};
use r2d2::Pool;
use r2d2_postgres::{
    postgres::{error::SqlState, NoTls},
    PostgresConnectionManager,
};
use rust_decimal::Decimal;
use tauri::{State, AppHandle, Manager};
use std::str::FromStr;

// Helper function to get a DB connection from AppState
fn get_db_client(state: &AppState) -> Result<r2d2::PooledConnection<PostgresConnectionManager<NoTls>>, String> {
    let pool_guard = state.db.lock().map_err(|_| "Failed to acquire lock on database pool".to_string())?;
    
    if let Some(pool) = pool_guard.as_ref() {
        pool.get().map_err(|e| format!("Failed to get DB connection: {}", e))
    } else {
        Err("Database not connected. Please check your configuration.".to_string())
    }
}

#[tauri::command]
pub fn login(
    username: String,
    password: String,
    state: State<AppState>,
) -> Result<Account, String> {
    let mut client = get_db_client(&state)?;

    let row = client
        .query_opt(
            "SELECT id, username, password, phone, gender, join_time, balance, user_type FROM account WHERE username = $1",
            &[&username],
        )
        .map_err(|e| format!("Database query failed: {}", e))?;

    match row {
        Some(row) => {
            let id: i64 = row.get("id");
            let uname: String = row.get("username");
            let stored_hashed_password: String = row.get("password");
            let phone: Option<String> = row.get("phone");
            let gender: Option<i16> = row.get("gender");
            let gender: Option<i8> = gender.map(|g| g as i8);
            let join_time: Option<NaiveDate> = row.get("join_time");
            let balance: Option<Decimal> = row.get("balance");
            let user_type: Option<i16> = row.get("user_type");
            let user_type: i8 = user_type.unwrap_or(1) as i8;

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
        None => {
            println!("Login failed for user {}: User not found", username);
            Err("Invalid username or password".to_string())
        }
    }
}

#[tauri::command]
pub fn register_user(data: RegistrationData, state: State<AppState>) -> Result<i32, String> {
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

    let mut client = get_db_client(&state)?;
    let current_date = Local::now().date_naive();
    let user_type: i8 = 1;
    let default_balance: Decimal = Decimal::new(0, 2);

    let hashed_password = hash(&data.password, DEFAULT_COST).map_err(|e| {
        eprintln!("Failed to hash password for user {}: {}", data.username, e);
        "Password hashing failed".to_string()
    })?;

    let result = client.execute(
        "INSERT INTO account (username, password, phone, gender, join_time, balance, user_type) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        &[
            &data.username,
            &hashed_password,
            &data.phone,
            &data.gender,
            &current_date,
            &default_balance,
            &user_type,
        ],
    );

    match result {
        Ok(_) => Ok(1),
        Err(e) => {
            eprintln!("Database insert failed for user {}: {}", data.username, e);
            if let Some(db_err) = e.as_db_error() {
                if db_err.code() == &SqlState::UNIQUE_VIOLATION {
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
    state: State<AppState>,
) -> Result<String, String> {
    if data.new_password.is_empty() {
        return Err("New password cannot be empty".to_string());
    }
    if data.current_password.is_empty() {
        return Err("Current password cannot be empty".to_string());
    }

    let mut client = get_db_client(&state)?;

    let row = client.query_opt(
        "SELECT password FROM account WHERE id = $1 AND user_type = 1",
        &[&user_id],
    ).map_err(|e| format!("Database query failed: {}", e))?;

    let stored_hashed_password: String = match row {
        Some(row) => row.get("password"),
        None => {
            return Err(format!(
                "User with ID {} not found or is not a customer.",
                user_id
            ));
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

    let update_result = client.execute(
        "UPDATE account SET password = $1 WHERE id = $2 AND user_type = 1",
        &[&new_hashed_password, &user_id],
    );

    match update_result {
        Ok(rows_affected) => {
            if rows_affected > 0 {
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
pub fn get_total_users(state: State<AppState>) -> Result<i64, String> {
    let mut client = get_db_client(&state)?;
    let row = client.query_opt("SELECT COUNT(*) FROM account WHERE user_type = 1", &[]);

    match row {
        Ok(Some(row)) => {
            let count: i64 = row.get(0);
            Ok(count)
        }
        Ok(None) => Ok(0),
        Err(e) => {
            eprintln!("Database query failed for total users: {}", e);
            Err(format!("Database query failed: {}", e))
        }
    }
}

#[tauri::command]
pub fn get_new_users_this_month(state: State<AppState>) -> Result<i64, String> {
    let mut client = get_db_client(&state)?;
    let now = Local::now();
    let current_year = now.year();
    let current_month_num = now.month();

    let first_day_current_month = NaiveDate::from_ymd_opt(current_year, current_month_num, 1)
        .ok_or_else(|| "Failed to construct first day of current month".to_string())?;

    let row = client.query_opt(
        "SELECT COUNT(*) FROM account WHERE user_type = 1 AND join_time >= $1",
        &[&first_day_current_month],
    );

    match row {
        Ok(Some(row)) => {
            let count: i64 = row.get(0);
            Ok(count)
        }
        Ok(None) => Ok(0),
        Err(e) => {
            eprintln!("Database query failed for new users this month: {}", e);
            Err(format!("Database query failed: {}", e))
        }
    }
}

#[tauri::command]
pub fn get_monthly_consumption_summary(
    state: State<AppState>,
) -> Result<Vec<MonthlyConsumptionSummary>, String> {
    let mut client = get_db_client(&state)?;

    let query = "SELECT month, SUM(amount) as total_amount FROM consumption GROUP BY month ORDER BY month ASC";

    let rows = client.query(query, &[]).map_err(|e| {
        format!(
            "Database query failed for monthly consumption summary: {}",
            e
        )
    })?;

    let results: Vec<MonthlyConsumptionSummary> = rows.iter().map(|row| {
        MonthlyConsumptionSummary {
            month: row.get("month"),
            total_amount: row.get("total_amount"),
        }
    }).collect();

    Ok(results)
}

#[tauri::command]
pub fn save_db_config(connection_string: String, app_handle: AppHandle, state: State<AppState>) -> Result<(), String> {
    // 1. Save config to file
    let config_path = app_handle.path().app_config_dir().map_err(|e| e.to_string())?.join("db_config.json");
    let config = DbConfig { connection_string: connection_string.clone() };
    config.save(&config_path).map_err(|e| format!("Failed to save config: {}", e))?;

    // 2. Try to reconnect
    let pg_config = r2d2_postgres::postgres::Config::from_str(&connection_string)
        .map_err(|e| format!("Invalid connection string: {}", e))?;
    let manager = PostgresConnectionManager::new(pg_config, NoTls);
    
    // Attempt to build new pool
    // We use a small timeout (e.g. 3s) for this check so the UI doesn't hang for 30s on bad config
    let new_pool = Pool::builder()
        .max_size(10) // Restore default or desired size
        .connection_timeout(std::time::Duration::from_secs(3))
        .build(manager)
        .map_err(|e| format!("Failed to create new DB pool with provided config: {}", e))?;

    // 3. Update AppState
    {
        let mut db_guard = state.db.lock().map_err(|_| "Failed to acquire lock on database state".to_string())?;
        *db_guard = Some(new_pool);
    }
    
    Ok(())
}

#[tauri::command]
pub fn get_current_db_config(app_handle: AppHandle) -> Result<String, String> {
    let config_path = app_handle.path().app_config_dir().map_err(|e| e.to_string())?.join("db_config.json");
    let config = DbConfig::load(&config_path);
    Ok(config.connection_string)
}

#[tauri::command]
pub fn test_db_connection(connection_string: String) -> Result<String, String> {
    use r2d2_postgres::postgres::Config;
    use std::str::FromStr;

    let config = Config::from_str(&connection_string).map_err(|e| format!("Invalid connection string: {}", e))?;
    let manager = PostgresConnectionManager::new(config, NoTls);
    // Try to build a pool with size 1 just to test connection
    let pool = Pool::builder().max_size(1).connection_timeout(std::time::Duration::from_secs(5)).build(manager).map_err(|e| format!("Failed to create pool: {}", e))?;
    let _client = pool.get().map_err(|e| format!("Failed to connect to database: {}", e))?;
    Ok("Connection successful".to_string())
}

#[tauri::command]
pub fn get_goods_consumption_share_current_month(
    state: State<AppState>,
) -> Result<Vec<GoodsConsumptionShare>, String> {
    let mut client = get_db_client(&state)?;

    let now = Local::now();
    let current_month_str = now.format("%Y-%m").to_string();

    let query = "
        SELECT g.goods_name, SUM(c.amount) as consumed_amount
        FROM consumption c
        JOIN goods g ON c.goods_id = g.id
        WHERE c.month = $1
        GROUP BY g.goods_name
        ORDER BY consumed_amount DESC";

    let rows = client.query(query, &[&current_month_str]).map_err(|e| {
        eprintln!(
            "[RUST ERROR] Database query failed for current month goods consumption share (month: {}): {}",
            current_month_str, e
        );
        format!(
            "Database query failed for current month goods consumption share: {}",
            e
        )
    })?;

    let results: Vec<GoodsConsumptionShare> = rows.iter().map(|row| {
        GoodsConsumptionShare {
            goods_name: row.get("goods_name"),
            amount: row.get("consumed_amount"),
        }
    }).collect();

    Ok(results)
}

#[tauri::command]
pub fn get_user_details(user_id: i64, state: State<AppState>) -> Result<Account, String> {
    let mut client = get_db_client(&state)?;

    let row = client.query_opt(
        "SELECT id, username, phone, gender, join_time, balance, user_type FROM account WHERE id = $1 AND user_type = 1",
        &[&user_id],
    ).map_err(|e| {
        eprintln!(
            "Database query failed for user details (ID {}): {}",
            user_id, e
        );
        format!("Database query failed: {}", e)
    })?;

    match row {
        Some(row) => {
            let gender: Option<i16> = row.get("gender");
            let user_type: Option<i16> = row.get("user_type");
            Ok(Account {
                id: row.get("id"),
                username: row.get("username"),
                phone: row.get("phone"),
                gender: gender.map(|g| g as i8),
                join_time: row.get("join_time"),
                balance: row.get("balance"),
                user_type: user_type.unwrap_or(1) as i8,
            })
        },
        None => Err(format!(
            "User with ID {} not found or is not a customer.",
            user_id
        )),
    }
}

#[tauri::command]
pub fn get_user_monthly_consumption(
    user_id: i64,
    state: State<AppState>,
) -> Result<Vec<MonthlyConsumptionSummary>, String> {
    let mut client = get_db_client(&state)?;

    let query = "
        SELECT month, SUM(amount) as total_amount
        FROM consumption
        WHERE user_id = $1
        GROUP BY month
        ORDER BY month ASC";

    let rows = client.query(query, &[&user_id]).map_err(|e| {
        format!("Database query failed for user monthly consumption: {}", e)
    })?;

    let results: Vec<MonthlyConsumptionSummary> = rows.iter().map(|row| {
        MonthlyConsumptionSummary {
            month: row.get("month"),
            total_amount: row.get("total_amount"),
        }
    }).collect();

    Ok(results)
}

#[tauri::command]
pub fn update_user_details(
    user_id: i64,
    data: UpdateUserData,
    state: State<AppState>,
) -> Result<String, String> {
    let mut client = get_db_client(&state)?;

    let mut set_clauses: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn r2d2_postgres::postgres::types::ToSql + Sync + Send>> = Vec::new();

    if let Some(uname_val) = &data.username {
        if uname_val.is_empty() {
            return Err("Username cannot be empty.".to_string());
        }

        let row = client
            .query_opt("SELECT username FROM account WHERE id = $1", &[&user_id])
            .map_err(|e| format!("DB error checking current username: {}", e))?;

        let is_changing_username = match row {
            Some(row) => {
                let current_uname: String = row.get("username");
                current_uname != *uname_val
            },
            None => true,
        };

        if is_changing_username {
            let existing_user = client.query_opt(
                "SELECT id FROM account WHERE username = $1 AND id != $2",
                &[uname_val, &user_id]
            ).map_err(|e| format!("DB error checking username uniqueness: {}", e))?;

            if existing_user.is_some() {
                return Err(format!("Username '{}' is already taken.", uname_val));
            }
            params.push(Box::new(uname_val.clone()));
            set_clauses.push(format!("username = ${}", params.len()));
        }
    }

    if let Some(phone_val) = &data.phone {
        if phone_val.is_empty() {
            set_clauses.push("phone = NULL".to_string());
        } else {
            if !phone_val.chars().all(|c| c.is_ascii_digit()) || phone_val.len() != 11 {
                return Err("Invalid phone number format. Must be 11 digits.".to_string());
            }
            params.push(Box::new(phone_val.clone()));
            set_clauses.push(format!("phone = ${}", params.len()));
        }
    }

    if let Some(gender_val) = data.gender {
        if gender_val == 0 || gender_val == 1 {
            params.push(Box::new(gender_val));
            set_clauses.push(format!("gender = ${}", params.len()));
        } else {
            return Err("Invalid gender value. Must be 0 (Male) or 1 (Female).".to_string());
        }
    }

    if set_clauses.is_empty() {
        return Ok("No details provided to update or values are the same.".to_string());
    }

    params.push(Box::new(user_id));
    let user_id_param_index = params.len();

    let query_string = format!(
        "UPDATE account SET {} WHERE id = ${} AND user_type = 1",
        set_clauses.join(", "),
        user_id_param_index
    );

    let params_slice: Vec<&(dyn r2d2_postgres::postgres::types::ToSql + Sync)> = params
        .iter()
        .map(|p| p.as_ref() as &(dyn r2d2_postgres::postgres::types::ToSql + Sync))
        .collect();

    match client.execute(&query_string, &params_slice) {
        Ok(rows_affected) => {
            if rows_affected > 0 {
                Ok("User details updated successfully.".to_string())
            } else {
                Ok("No changes made to user details (user not found, not a customer, or new values match old values).".to_string())
            }
        }
        Err(e) => {
            eprintln!("Database update failed for user ID {}: {}", user_id, e);
            if let Some(db_err) = e.as_db_error() {
                if db_err.code() == &SqlState::UNIQUE_VIOLATION {
                    return Err("Update failed: Username or Phone number might already be in use by another account.".to_string());
                }
            }
            Err(format!("Database update failed: {}", e))
        }
    }
}

#[tauri::command]
pub fn get_all_goods(state: State<AppState>) -> Result<Vec<Goods>, String> {
    let mut client = get_db_client(&state)?;

    let query = "SELECT id, goods_name, goods_type, price, stock FROM goods";

    let rows = client.query(query, &[]).map_err(|e| format!("Database query failed for all goods: {}", e))?;

    let results: Vec<Goods> = rows.iter().map(|row| {
        Goods {
            id: row.get("id"),
            goods_name: row.get("goods_name"),
            goods_type: row.get("goods_type"),
            price: row.get("price"),
            stock: row.get("stock"),
        }
    }).collect();

    Ok(results)
}

#[tauri::command]
pub fn add_goods(data: AddGoodsData, state: State<AppState>) -> Result<String, String> {
    if data.goods_name.is_empty() {
        return Err("Goods name cannot be empty".to_string());
    }
    if data.price <= Decimal::ZERO {
        return Err("Price must be positive".to_string());
    }

    let mut client = get_db_client(&state)?;

    let stock_value = data.stock.unwrap_or(0);

    let result = client.execute(
        "INSERT INTO goods (goods_name, goods_type, price, stock) VALUES ($1, $2, $3, $4)",
        &[
            &data.goods_name,
            &data.goods_type,
            &data.price,
            &stock_value,
        ],
    );

    match result {
        Ok(_) => Ok(format!("Goods '{}' added successfully.", data.goods_name)),
        Err(e) => {
            eprintln!(
                "Database insert failed for goods {}: {}",
                data.goods_name, e
            );
            if let Some(db_err) = e.as_db_error() {
                if db_err.code() == &SqlState::UNIQUE_VIOLATION {
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
    state: State<AppState>,
) -> Result<String, String> {
    let mut client = get_db_client(&state)?;

    let mut set_clauses: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn r2d2_postgres::postgres::types::ToSql + Sync + Send>> = Vec::new();

    if let Some(stock_val) = data.stock {
        if stock_val < 0 {
            return Err("Stock cannot be negative".to_string());
        }
        params.push(Box::new(stock_val));
        set_clauses.push(format!("stock = ${}", params.len()));
    }

    if let Some(price_val) = data.price {
        if price_val <= Decimal::ZERO {
            return Err("Price must be positive".to_string());
        }
        params.push(Box::new(price_val));
        set_clauses.push(format!("price = ${}", params.len()));
    }

    if set_clauses.is_empty() {
        return Ok("No details provided to update.".to_string());
    }

    params.push(Box::new(goods_id));
    let goods_id_index = params.len();

    let query = format!(
        "UPDATE goods SET {} WHERE id = ${}",
        set_clauses.join(", "),
        goods_id_index
    );

    let params_slice: Vec<&(dyn r2d2_postgres::postgres::types::ToSql + Sync)> = params
        .iter()
        .map(|p| p.as_ref() as &(dyn r2d2_postgres::postgres::types::ToSql + Sync))
        .collect();

    match client.execute(&query, &params_slice) {
        Ok(rows_affected) => {
            if rows_affected > 0 {
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
    state: State<AppState>,
) -> Result<String, String> {
    if data.amount <= Decimal::ZERO {
        return Err("Recharge amount must be positive".to_string());
    }

    let mut client = get_db_client(&state)?;

    let row = client
        .query_opt(
            "SELECT user_type FROM account WHERE id = $1",
            &[&data.user_id],
        )
        .map_err(|e| format!("Failed to query user: {}", e))?;

    match row {
        Some(row) => {
            let user_type: Option<i16> = row.get("user_type");
            let user_type: i8 = user_type.unwrap_or(1) as i8;
            if user_type == 1 {
                let update_result = client.execute(
                    "UPDATE account SET balance = balance + $1 WHERE id = $2 AND user_type = 1",
                    &[&data.amount, &data.user_id],
                );

                match update_result {
                    Ok(rows_affected) => {
                        if rows_affected > 0 {
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
            } else {
                Err(format!("User with ID {} is not a customer.", data.user_id))
            }
        }
        None => Err(format!("User with ID {} not found.", data.user_id)),
    }
}

#[tauri::command]
pub fn purchase_goods(data: PurchaseGoodsData, state: State<AppState>) -> Result<i32, String> {
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

    let mut client = get_db_client(&state)?;

    let mut tx = client
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    let mut total_purchase_price = Decimal::ZERO;

    struct ProcessedItemDetail {
        goods_id: i32,
        quantity: i32,
        item_total_price: Decimal,
    }
    let mut processed_item_details: Vec<ProcessedItemDetail> = Vec::new();

    for item in &data.items {
        let row = tx
            .query_opt(
                "SELECT price, stock FROM goods WHERE id = $1 FOR UPDATE",
                &[&item.goods_id],
            )
            .map_err(|e| format!("Failed to query goods ID {}: {}", item.goods_id, e))?;

        let (price_per_item, current_stock): (Decimal, i32) = match row {
            Some(row) => (row.get("price"), row.get("stock")),
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

    let row = tx
        .query_opt(
            "SELECT balance, user_type FROM account WHERE id = $1 AND user_type = 1 FOR UPDATE",
            &[&data.user_id],
        )
        .map_err(|e| format!("Failed to query user: {}", e))?;

    let current_balance: Decimal = match row {
        Some(row) => {
            let user_type: Option<i16> = row.get("user_type");
            let _user_type: i8 = user_type.unwrap_or(1) as i8;
            row.get("balance")
        },
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
        tx.execute(
            "UPDATE goods SET stock = stock - $1 WHERE id = $2",
            &[&p_item_detail.quantity, &p_item_detail.goods_id],
        )
        .map_err(|e| {
            format!(
                "Failed to update stock for goods ID {}: {}",
                p_item_detail.goods_id, e
            )
        })?;
    }

    tx.execute(
        "UPDATE account SET balance = balance - $1 WHERE id = $2",
        &[&total_purchase_price, &data.user_id],
    )
    .map_err(|e| format!("Failed to update user balance: {}", e))?;

    let current_month_str = Local::now().format("%Y-%m").to_string();
    for p_item_detail in &processed_item_details {
        // Explicitly check if consumption record exists
        let existing_record = tx.query_opt(
            "SELECT amount FROM consumption WHERE user_id = $1 AND month = $2 AND goods_id = $3 FOR UPDATE",
            &[&data.user_id, &current_month_str, &p_item_detail.goods_id]
        ).map_err(|e| format!("Failed to check existing consumption: {}", e))?;

        match existing_record {
            Some(_) => {
                // Update existing record
                tx.execute(
                    "UPDATE consumption SET amount = amount + $1 WHERE user_id = $2 AND month = $3 AND goods_id = $4",
                    &[&p_item_detail.item_total_price, &data.user_id, &current_month_str, &p_item_detail.goods_id]
                ).map_err(|e| format!("Failed to update consumption for goods ID {}: {}", p_item_detail.goods_id, e))?;
            },
            None => {
                // Insert new record
                tx.execute(
                    "INSERT INTO consumption (user_id, month, goods_id, amount) VALUES ($1, $2, $3, $4)",
                    &[&data.user_id, &current_month_str, &p_item_detail.goods_id, &p_item_detail.item_total_price]
                ).map_err(|e| format!("Failed to insert consumption for goods ID {}: {}", p_item_detail.goods_id, e))?;
            }
        }
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(0)
}

#[tauri::command]
pub fn get_all_lost_items(state: State<AppState>) -> Result<Vec<LostItem>, String> {
    let mut client = get_db_client(&state)?;

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

    let rows = client.query(query, &[]).map_err(|e| format!("Database query failed for all lost items: {}", e))?;

    let results: Vec<LostItem> = rows.iter().map(|row| {
        let status: i16 = row.get("status");
        LostItem {
            id: row.get("id"),
            item_name: row.get("item_name"),
            pick_place: row.get("pick_place"),
            pick_user_id: row.get("pick_user_id"),
            pick_user_name: row.get("pick_user_name"),
            claim_user_id: row.get("claim_user_id"),
            claim_user_name: row.get("claim_user_name"),
            pick_time: row.get("pick_time"),
            claim_time: row.get("claim_time"),
            status: status as i8,
        }
    }).collect();

    Ok(results)
}

#[tauri::command]
pub fn report_lost_item(
    data: ReportLostItemData,
    state: State<AppState>,
) -> Result<String, String> {
    if data.item_name.is_empty() {
        return Err("Item name cannot be empty".to_string());
    }

    let mut client = get_db_client(&state)?;

    let current_date = Local::now().date_naive();
    let status: i16 = 0;

    let result = client.execute(
        "INSERT INTO lost_items (item_name, pick_place, pick_user_id, pick_time, status) VALUES ($1, $2, $3, $4, $5)",
        &[
            &data.item_name,
            &data.pick_place,
            &data.pick_user_id,
            &current_date,
            &status,
        ],
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
pub fn claim_lost_item(data: ClaimLostItemData, state: State<AppState>) -> Result<String, String> {
    let mut client = get_db_client(&state)?;

    let current_date = Local::now().date_naive();
    let new_status: i16 = 1;

    let row = client
        .query_opt(
            "SELECT status FROM lost_items WHERE id = $1",
            &[&data.item_id],
        )
        .map_err(|e| format!("Failed to query lost item status: {}", e))?;

    match row {
        Some(row) => {
            let status: i16 = row.get("status");
            let status = status as i8;
            if status == 0 {
                let update_result = client.execute(
                    "UPDATE lost_items SET status = $1, claim_user_id = $2, claim_time = $3 WHERE id = $4",
                    &[&new_status, &data.claim_user_id, &current_date, &data.item_id],
                );

                match update_result {
                    Ok(rows_affected) => {
                        if rows_affected > 0 {
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
            } else if status == 1 {
                Err(format!(
                    "Item ID {} has already been claimed.",
                    data.item_id
                ))
            } else {
                Err(format!("Unknown status for item ID {}.", data.item_id))
            }
        }
        None => Err(format!("Lost item with ID {} not found.", data.item_id)),
    }
}

#[tauri::command]
pub fn admin_send_message(data: SendMessageData, state: State<AppState>) -> Result<i32, String> {
    if data.message_content.is_empty() {
        return Err("Message content cannot be empty".to_string());
    }
    if data.sender_id == data.receiver_id {
        return Err("Sender and receiver cannot be the same user".to_string());
    }

    let mut client = get_db_client(&state)?;

    let sender_exists = client
        .query_opt("SELECT id FROM account WHERE id = $1", &[&data.sender_id])
        .map_err(|e| format!("Failed to verify sender: {}", e))?;

    if sender_exists.is_none() {
        println!(
            "Send message failed: Sender with ID {} not found.",
            data.sender_id
        );
        return Ok(1);
    }

    let receiver_exists = client
        .query_opt("SELECT id FROM account WHERE id = $1", &[&data.receiver_id])
        .map_err(|e| format!("Failed to verify receiver: {}", e))?;

    if receiver_exists.is_none() {
        println!(
            "Send message failed: Receiver with ID {} not found.",
            data.receiver_id
        );
        return Ok(2);
    }

    let current_date = Local::now().date_naive();
    let read_status: i16 = 0;

    let result = client.execute(
        "INSERT INTO message (sender_id, receiver_id, title, message_content, send_date, read_status) VALUES ($1, $2, $3, $4, $5, $6)",
        &[
            &data.sender_id,
            &data.receiver_id,
            &data.title,
            &data.message_content,
            &current_date,
            &read_status,
        ],
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
    state: State<AppState>,
) -> Result<i32, String> {
    if data.message_content.is_empty() {
        return Err("Message content cannot be empty".to_string());
    }

    let mut client = get_db_client(&state)?;

    let admin_id_row = client.query_opt("SELECT id FROM account WHERE user_type = 0 LIMIT 1", &[]);
    
    let admin_id: i64 = match admin_id_row {
        Ok(Some(row)) => row.get("id"),
        Ok(None) => {
            println!("Send message failed: Administrator account (user_type = 0) not found.");
            return Ok(2);
        }
        Err(e) => {
            eprintln!("Database error while querying for administrator: {}", e);
            return Err(format!("Database error finding administrator: {}", e));
        }
    };

    let sender_info_row = client.query_opt(
        "SELECT user_type FROM account WHERE id = $1",
        &[&data.sender_id],
    );

    match sender_info_row {
        Ok(Some(row)) => {
            let user_type: Option<i16> = row.get("user_type");
            let user_type: i8 = user_type.unwrap_or(1) as i8;
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
    let read_status: i16 = 0;

    let result = client.execute(
        "INSERT INTO message (sender_id, receiver_id, title, message_content, send_date, read_status) VALUES ($1, $2, $3, $4, $5, $6)",
        &[
            &data.sender_id,
            &admin_id,
            &data.title,
            &data.message_content,
            &current_date,
            &read_status,
        ],
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
    state: State<AppState>,
) -> Result<Vec<MessageInfo>, String> {
    let mut client = get_db_client(&state)?;

    let query = "
        SELECT
            m.id, m.sender_id, m.receiver_id,
            s_acc.username AS sender_username,
            r_acc.username AS receiver_username,
            m.title, m.message_content, m.send_date, m.read_status
        FROM message m
        JOIN account s_acc ON m.sender_id = s_acc.id
        JOIN account r_acc ON m.receiver_id = r_acc.id
        WHERE m.sender_id = $1";

    let rows = client.query(query, &[&user_id]).map_err(|e| format!("Database query failed for sent messages: {}", e))?;

    let results: Vec<MessageInfo> = rows.iter().map(|row| {
        let read_status: i16 = row.get("read_status");
        MessageInfo {
            id: row.get("id"),
            sender_id: row.get("sender_id"),
            receiver_id: row.get("receiver_id"),
            sender_username: row.get("sender_username"),
            receiver_username: row.get("receiver_username"),
            title: row.get("title"),
            message_content: row.get("message_content"),
            send_date: row.get("send_date"),
            read_status: read_status as i8,
        }
    }).collect();

    Ok(results)
}

#[tauri::command]
pub fn get_recived_messages(
    user_id: i64,
    state: State<AppState>,
) -> Result<Vec<MessageInfo>, String> {
    let mut client = get_db_client(&state)?;

    let query = "
        SELECT
            m.id, m.sender_id, m.receiver_id,
            s_acc.username AS sender_username,
            r_acc.username AS receiver_username,
            m.title, m.message_content, m.send_date, m.read_status
        FROM message m
        JOIN account s_acc ON m.sender_id = s_acc.id
        JOIN account r_acc ON m.receiver_id = r_acc.id
        WHERE m.receiver_id = $1";

    let rows = client.query(query, &[&user_id]).map_err(|e| format!("Database query failed for recieved messages: {}", e))?;

    let results: Vec<MessageInfo> = rows.iter().map(|row| {
        let read_status: i16 = row.get("read_status");
        MessageInfo {
            id: row.get("id"),
            sender_id: row.get("sender_id"),
            receiver_id: row.get("receiver_id"),
            sender_username: row.get("sender_username"),
            receiver_username: row.get("receiver_username"),
            title: row.get("title"),
            message_content: row.get("message_content"),
            send_date: row.get("send_date"),
            read_status: read_status as i8,
        }
    }).collect();

    Ok(results)
}

#[tauri::command]
pub fn mark_message_as_read(
    data: MarkReadData,
    current_user_id: i64,
    state: State<AppState>,
) -> Result<i32, String> {
    let mut client = get_db_client(&state)?;

    let row = client.query_opt(
        "SELECT receiver_id, read_status FROM message WHERE id = $1",
        &[&data.message_id],
    );

    match row {
        Ok(Some(row)) => {
            let receiver_id_db: i64 = row.get("receiver_id");
            let read_status_db: i16 = row.get("read_status");
            let read_status_db: i8 = read_status_db as i8;

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

            let new_read_status: i16 = 1;

            let update_result = client.execute(
                "UPDATE message SET read_status = $3 WHERE id = $1 AND receiver_id = $2",
                &[&data.message_id, &current_user_id, &new_read_status],
            );

            match update_result {
                Ok(rows_affected) => {
                    if rows_affected > 0 {
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
pub fn get_all_users(state: State<AppState>) -> Result<Vec<UserBasicInfo>, String> {
    let mut client = get_db_client(&state)?;

    let query = "SELECT id, username FROM account ORDER BY id ASC";

    let rows = client.query(query, &[]).map_err(|e| format!("Database query failed for fetching all users: {}", e))?;

    let results: Vec<UserBasicInfo> = rows.iter().map(|row| {
        UserBasicInfo {
            id: row.get("id"),
            username: row.get("username"),
        }
    }).collect();

    Ok(results)
}
