use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DbConfig {
    pub connection_string: String,
}

impl DbConfig {
    pub fn default_value() -> Self {
        DbConfig {
            connection_string: "host=localhost port=5432 user=gaussdb password=Open@123 dbname=cafehub".to_string(),
        }
    }

    pub fn load(path: &Path) -> Self {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<DbConfig>(&content) {
                    return config;
                }
            }
        }
        Self::default_value()
    }

    pub fn save(&self, path: &Path) -> std::io::Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let content = serde_json::to_string_pretty(self)?;
        fs::write(path, content)
    }
}
