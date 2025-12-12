mod commands;
mod db_config;
mod models;

use db_config::DbConfig;
use models::AppState;
use r2d2::Pool;
use r2d2_postgres::{postgres::NoTls, PostgresConnectionManager};
use std::str::FromStr;
use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle();
            // Ensure config directory exists
            // We use unwrap_or_else to fallback if path resolution fails, though unlikely on desktop
            let config_dir = app_handle
                .path()
                .app_config_dir()
                .expect("Failed to get app config dir");
            let config_path = config_dir.join("db_config.json");

            let db_config = DbConfig::load(&config_path);
            println!("Loading DB config from: {:?}", config_path);
            println!("Connection string: {}", db_config.connection_string);

            let mut pool_option = None;

            match r2d2_postgres::postgres::Config::from_str(&db_config.connection_string) {
                Ok(config) => {
                    let manager = PostgresConnectionManager::new(config, NoTls);
                    // Use build instead of new to catch errors without panicking
                    // Set a short timeout (e.g. 2s) for startup check to avoid long wait if DB is down
                    match Pool::builder()
                        .connection_timeout(Duration::from_secs(2))
                        .build(manager) {
                        Ok(pool) => {
                            println!("Database connection established successfully.");
                            pool_option = Some(pool);
                        }
                        Err(e) => {
                            eprintln!("Failed to create DB pool: {}", e);
                            // Do not panic, just log the error. The app will start with pool_option = None.
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Invalid database configuration string: {}", e);
                }
            }

            // Initialize AppState with the pool (or None)
            let app_state = AppState {
                db: Mutex::new(pool_option),
            };

            app.manage(app_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::login,
            commands::register_user,
            commands::get_total_users,
            commands::get_new_users_this_month,
            commands::get_monthly_consumption_summary,
            commands::get_goods_consumption_share_current_month,
            commands::get_user_details,
            commands::get_user_monthly_consumption,
            commands::update_user_details,
            commands::update_user_password,
            commands::get_all_goods,
            commands::add_goods,
            commands::update_goods_info,
            commands::purchase_goods,
            commands::get_all_lost_items,
            commands::report_lost_item,
            commands::claim_lost_item,
            commands::admin_send_message,
            commands::customer_send_message,
            commands::get_sent_messages,
            commands::get_recived_messages,
            commands::mark_message_as_read,
            commands::get_all_users,
            commands::recharge_balance,
            commands::save_db_config,
            commands::get_current_db_config,
            commands::test_db_connection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
