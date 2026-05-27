mod commands;
mod db_config;
mod models;

use db_config::MySQLConfig;
use mysql::{Opts, OptsBuilder, Pool};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mysql_config: MySQLConfig = MySQLConfig::new(
        "root".to_string(),
        "123456".to_string(),
        "localhost".to_string(),
        "cafehub".to_string(),
    );

    let mysql_url = mysql_config.format_url();
    let pool_options =
        OptsBuilder::from_opts(Opts::from_url(&mysql_url).expect("Invalid database URL"));
    let pool = Pool::new(pool_options).expect("Failed to create DB pool.");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(pool)
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
            commands::recharge_balance
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
