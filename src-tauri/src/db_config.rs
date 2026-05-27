pub struct MySQLConfig {
    user: String,
    password: String,
    host: String,
    database: String,
}

impl MySQLConfig {
    pub fn new(user: String, password: String, host: String, database: String) -> Self {
        MySQLConfig {
            user,
            password,
            host,
            database,
        }
    }
    pub fn format_url(&self) -> String {
        format!(
            "mysql://{}:{}@{}/{}",
            self.user, self.password, self.host, self.database
        )
    }
}
