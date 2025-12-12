# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-12-12

### Added
- **Dynamic Database Configuration**: 
  - Implemented `DbConfig` struct and file-based persistence (`db_config.json`) in Rust backend.
  - Added frontend interface `DBConfigPage` for users to input custom PostgreSQL connection strings.
  - Added "Test Connection" functionality to verify database access before saving.
  - Added a settings icon on the login page to access the configuration page.
- **UI Enhancements**:
  - Improved `CustomerLostPage` table with horizontal scrolling (`scroll={{ x: 'max-content' }}`) to prevent layout overflow.
  - Widened `Cart` drawer and optimized list item layout for better responsiveness on small screens.
  - Enhanced `LoginPage` with a background image and glassmorphism effect.
  - Refined `AdminLayout` and `CustomerLayout` sidebars for better visual hierarchy.

### Fixed
- **Database Type Mismatches**:
  - Fixed `read_status` serialization error in `admin_send_message` and `customer_send_message` (changed `i8` to `i16`).
  - Fixed `status` type handling in `report_lost_item` and `claim_lost_item` (changed `i8` to `i16`).
  - Fixed potential panic in `purchase_goods` due to `user_type` casting.
- **Transaction Logic**:
  - Refactored `purchase_goods` to use a "Select-then-Update/Insert" pattern instead of `ON CONFLICT` to support databases without unique constraints on consumption tables.
- **Build Warnings**:
  - Removed unused `OpenGaussConfig` struct and methods from `db_config.rs`.
  - Removed unused `siderWidth` variables in layout components.
  - Fixed unused `React` import warning in `DBConfigPage.tsx`.

### Changed
- **Project Structure**:
  - Updated `README.md` with comprehensive installation, feature, and configuration guides.
  - Cleaned up backend code in `src-tauri/src/lib.rs` and `src-tauri/src/db_config.rs`.
