const db = require("./connection");

const queries = [
  {
    run: `CREATE TABLE admin (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uid VARCHAR(999) DEFAULT NULL,
            email VARCHAR(999) DEFAULT NULL,
            password VARCHAR(999) DEFAULT NULL,
            role VARCHAR(999) DEFAULT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'admin';",
  },
  {
    run: `CREATE TABLE user (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uid VARCHAR(999) DEFAULT NULL,
            name VARCHAR(999) DEFAULT NULL,
            email VARCHAR(999) DEFAULT NULL,
            password VARCHAR(999) DEFAULT NULL,
            referral_code VARCHAR(64) DEFAULT NULL,
            referred_by VARCHAR(999) DEFAULT NULL,
            referral_bonus_claimed TINYINT(1) DEFAULT 0,
            email_verified TINYINT(1) DEFAULT 1,
            email_verify_token VARCHAR(255) DEFAULT NULL,
            email_verify_sent_at DATETIME DEFAULT NULL,
            role VARCHAR(999) DEFAULT 'user',
            plan LONGTEXT DEFAULT NULL,
            plan_ending VARCHAR(999) DEFAULT NULL,
            status VARCHAR(999) DEFAULT 'active',
            last_login VARCHAR(999) DEFAULT NULL,
            credits VARCHAR(999) DEFAULT '0',
            trial_used INT(1) DEFAULT 0,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'user';",
  },
  {
    run: "ALTER TABLE `user` ADD COLUMN `referral_code` VARCHAR(64) DEFAULT NULL AFTER `password`;",
    check: "SHOW COLUMNS FROM `user` LIKE 'referral_code';",
  },
  {
    run: "ALTER TABLE `user` ADD UNIQUE INDEX `idx_user_referral_code` (`referral_code`);",
    check: "SHOW INDEX FROM `user` WHERE Key_name = 'idx_user_referral_code';",
  },
  {
    run: "ALTER TABLE `user` ADD COLUMN `referred_by` VARCHAR(999) DEFAULT NULL AFTER `referral_code`;",
    check: "SHOW COLUMNS FROM `user` LIKE 'referred_by';",
  },
  {
    run: "ALTER TABLE `user` ADD COLUMN `referral_bonus_claimed` TINYINT(1) DEFAULT 0 AFTER `referred_by`;",
    check: "SHOW COLUMNS FROM `user` LIKE 'referral_bonus_claimed';",
  },
  {
    run: "ALTER TABLE `user` ADD COLUMN `email_verified` TINYINT(1) DEFAULT 1 AFTER `referral_bonus_claimed`;",
    check: "SHOW COLUMNS FROM `user` LIKE 'email_verified';",
  },
  {
    run: "ALTER TABLE `user` ADD COLUMN `email_verify_token` VARCHAR(255) DEFAULT NULL AFTER `email_verified`;",
    check: "SHOW COLUMNS FROM `user` LIKE 'email_verify_token';",
  },
  {
    run: "ALTER TABLE `user` ADD COLUMN `email_verify_sent_at` DATETIME DEFAULT NULL AFTER `email_verify_token`;",
    check: "SHOW COLUMNS FROM `user` LIKE 'email_verify_sent_at';",
  },
  {
    run: `CREATE TABLE referral_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            referrer_uid VARCHAR(999) DEFAULT NULL,
            referred_uid VARCHAR(999) DEFAULT NULL,
            referral_code VARCHAR(64) DEFAULT NULL,
            signup_credits INT DEFAULT 0,
            referrer_credits INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'success',
            meta JSON DEFAULT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'referral_events';",
  },
  {
    run: `CREATE TABLE plan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(999) DEFAULT NULL,
            max_characters VARCHAR(999) DEFAULT NULL,
            price VARCHAR(999) DEFAULT NULL,
            monthly_price DECIMAL(10,2) DEFAULT NULL,
            yearly_price DECIMAL(10,2) DEFAULT NULL,
            recurring_enabled TINYINT(1) DEFAULT 0,
            default_billing_interval VARCHAR(20) DEFAULT 'monthly',
            popular INT(1) DEFAULT 0,
            price_strike VARCHAR(999) DEFAULT NULL,
            credits VARCHAR(999) DEFAULT NULL,
            expiry_days VARCHAR(999) DEFAULT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'plan';",
  },
  {
    run: "ALTER TABLE `plan` ADD COLUMN `monthly_price` DECIMAL(10,2) DEFAULT NULL AFTER `price`;",
    check: "SHOW COLUMNS FROM `plan` LIKE 'monthly_price';",
  },
  {
    run: "ALTER TABLE `plan` ADD COLUMN `yearly_price` DECIMAL(10,2) DEFAULT NULL AFTER `monthly_price`;",
    check: "SHOW COLUMNS FROM `plan` LIKE 'yearly_price';",
  },
  {
    run: "ALTER TABLE `plan` ADD COLUMN `recurring_enabled` TINYINT(1) DEFAULT 0 AFTER `yearly_price`;",
    check: "SHOW COLUMNS FROM `plan` LIKE 'recurring_enabled';",
  },
  {
    run: "ALTER TABLE `plan` ADD COLUMN `default_billing_interval` VARCHAR(20) DEFAULT 'monthly' AFTER `recurring_enabled`; ",
    check: "SHOW COLUMNS FROM `plan` LIKE 'default_billing_interval';",
  },
  {
    run: "UPDATE `plan` SET monthly_price = COALESCE(monthly_price, NULLIF(price, '')), yearly_price = COALESCE(yearly_price, NULLIF(price, '') * 12) WHERE monthly_price IS NULL OR yearly_price IS NULL;",
    check: "SELECT id FROM `plan` WHERE monthly_price IS NULL OR yearly_price IS NULL LIMIT 1;",
  },
  {
    run: `CREATE TABLE credit_packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(999) DEFAULT NULL,
            price DECIMAL(10,2) DEFAULT 0,
            credits INT DEFAULT 0,
            popular INT(1) DEFAULT 0,
            status VARCHAR(50) DEFAULT 'active',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'credit_packages';",
  },
  {
    run: `CREATE TABLE influencers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uid VARCHAR(255) DEFAULT NULL,
            data LONGTEXT DEFAULT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            creation_type VARCHAR(50) NOT NULL,
            photo_url VARCHAR(500),
            prompt TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'influencers';",
  },
  {
    run: `CREATE TABLE gallery (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uid VARCHAR(255) DEFAULT NULL,
            model LONGTEXT DEFAULT NULL,
            prompt LONGTEXT DEFAULT NULL,
            status LONGTEXT DEFAULT NULL,
            error_message LONGTEXT DEFAULT NULL,
            generated_photo VARCHAR(255) DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'gallery';",
  },
  {
    run: `CREATE TABLE content (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uid VARCHAR(255) DEFAULT NULL,
            model LONGTEXT DEFAULT NULL,
            ref_video LONGTEXT DEFAULT NULL,
            other LONGTEXT DEFAULT NULL,
            status LONGTEXT DEFAULT NULL,
            job_id LONGTEXT DEFAULT NULL,
            error_message LONGTEXT DEFAULT NULL,
            generated_video VARCHAR(255) DEFAULT NULL,
            video_thumbnail VARCHAR(255) DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'content';",
  },
  {
    run: `CREATE TABLE product_content (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uid VARCHAR(255) DEFAULT NULL,
            model LONGTEXT DEFAULT NULL,
            ref_photo LONGTEXT DEFAULT NULL,
            prompt LONGTEXT DEFAULT NULL,
            other LONGTEXT DEFAULT NULL,
            status LONGTEXT DEFAULT NULL,
            job_id VARCHAR(255) DEFAULT NULL,
            error_message LONGTEXT DEFAULT NULL,
            generated_video VARCHAR(255) DEFAULT NULL,
            video_thumbnail VARCHAR(255) DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'product_content';",
  },
  {
    run: `CREATE TABLE templates_category (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) DEFAULT NULL,
            color VARCHAR(20) DEFAULT NULL,
            other TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'templates_category';",
  },
  {
    run: `CREATE TABLE templates_video (
            id INT AUTO_INCREMENT PRIMARY KEY,
            cate_id VARCHAR(255) DEFAULT NULL,
            des TEXT DEFAULT NULL,
            video VARCHAR(255) DEFAULT NULL,
            video_thumbnail VARCHAR(255) DEFAULT NULL,
            other TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'templates_video';",
  },
  {
    run: `CREATE TABLE support_msg (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uid VARCHAR(255) DEFAULT NULL,
            que LONGTEXT DEFAULT NULL,
            ans LONGTEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'support_msg';",
  },
  {
    run: `ALTER TABLE \`user\` ADD COLUMN \`email_notification\` JSON DEFAULT ('{"marketing": true, "alert": true, "task": true, "other": false}');`,
    check: "SHOW COLUMNS FROM `user` LIKE 'email_notification';",
  },
  {
    run: `CREATE TABLE web_private (
            id INT AUTO_INCREMENT PRIMARY KEY,
            inf_maker VARCHAR(255) DEFAULT NULL,
            inf_var_maker VARCHAR(255) DEFAULT NULL,
            content_video_maker VARCHAR(255) DEFAULT NULL,
            product_showcase_maker VARCHAR(255) DEFAULT NULL,
            prompt_recommend_maker VARCHAR(255) DEFAULT '5',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'web_private';",
  },
  {
    run: `INSERT INTO web_private (inf_maker, inf_var_maker, content_video_maker, product_showcase_maker, prompt_recommend_maker) 
        VALUES (100, 150, 200, 250, 5);`,
    check: "SELECT id FROM web_private LIMIT 1;",
  },
  {
    run: `CREATE TABLE prompt_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            prompt LONGTEXT DEFAULT NULL,
            type VARCHAR(255) DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'prompt_templates';",
  },
  {
    run: `CREATE TABLE ai_providers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name TEXT NOT NULL,
            provider_key VARCHAR(100) NOT NULL UNIQUE,
            is_active TINYINT(1) DEFAULT 1,
            is_default TINYINT(1) DEFAULT 0,

            -- TEXT TO IMAGE
            txt2img_enabled        TINYINT(1) DEFAULT 0,
            txt2img_base_url       TEXT DEFAULT NULL,
            txt2img_api_key        TEXT DEFAULT NULL,
            txt2img_auth_type      VARCHAR(50) DEFAULT 'bearer',
            txt2img_auth_header_key        VARCHAR(255) DEFAULT 'Authorization',
            txt2img_auth_header_prefix     VARCHAR(100) DEFAULT 'Bearer',
            txt2img_auth_body_key          TEXT DEFAULT NULL,
            txt2img_auth_query_key         TEXT DEFAULT NULL,
            txt2img_create_endpoint        TEXT DEFAULT NULL,
            txt2img_create_method          VARCHAR(10) DEFAULT 'POST',
            txt2img_create_payload         JSON DEFAULT NULL,
            txt2img_job_id_path            VARCHAR(255) DEFAULT 'data.taskId',
            txt2img_status_endpoint        TEXT DEFAULT NULL,
            txt2img_status_method          VARCHAR(10) DEFAULT 'GET',
            txt2img_state_path             VARCHAR(255) DEFAULT 'data.state',
            txt2img_success_state          VARCHAR(100) DEFAULT 'success',
            txt2img_failed_state           VARCHAR(100) DEFAULT 'fail',
            txt2img_result_path            TEXT DEFAULT NULL,

            -- IMAGE TO IMAGE
            img2img_enabled        TINYINT(1) DEFAULT 0,
            img2img_base_url       VARCHAR(500) DEFAULT NULL,
            img2img_api_key        TEXT DEFAULT NULL,
            img2img_auth_type      VARCHAR(50) DEFAULT 'bearer',
            img2img_auth_header_key        VARCHAR(255) DEFAULT 'Authorization',
            img2img_auth_header_prefix     VARCHAR(100) DEFAULT 'Bearer',
            img2img_auth_body_key          TEXT DEFAULT NULL,
            img2img_auth_query_key         TEXT DEFAULT NULL,
            img2img_create_endpoint        VARCHAR(500) DEFAULT NULL,
            img2img_create_method          VARCHAR(10) DEFAULT 'POST',
            img2img_create_payload         JSON DEFAULT NULL,
            img2img_job_id_path            VARCHAR(255) DEFAULT 'data.taskId',
            img2img_status_endpoint        VARCHAR(500) DEFAULT NULL,
            img2img_status_method          VARCHAR(10) DEFAULT 'GET',
            img2img_state_path             VARCHAR(255) DEFAULT 'data.state',
            img2img_success_state          VARCHAR(100) DEFAULT 'success',
            img2img_failed_state           VARCHAR(100) DEFAULT 'fail',
            img2img_result_path            TEXT DEFAULT NULL,

            -- REEL MAKER
            reel_enabled           TINYINT(1) DEFAULT 0,
            reel_base_url          VARCHAR(500) DEFAULT NULL,
            reel_api_key           TEXT DEFAULT NULL,
            reel_auth_type         VARCHAR(50) DEFAULT 'bearer',
            reel_auth_header_key           VARCHAR(255) DEFAULT 'Authorization',
            reel_auth_header_prefix        VARCHAR(100) DEFAULT 'Bearer',
            reel_auth_body_key             TEXT DEFAULT NULL,
            reel_auth_query_key            TEXT DEFAULT NULL,
            reel_create_endpoint           VARCHAR(500) DEFAULT NULL,
            reel_create_method             VARCHAR(10) DEFAULT 'POST',
            reel_create_payload            JSON DEFAULT NULL,
            reel_job_id_path               VARCHAR(255) DEFAULT 'data.taskId',
            reel_status_endpoint           VARCHAR(500) DEFAULT NULL,
            reel_status_method             VARCHAR(10) DEFAULT 'GET',
            reel_state_path                VARCHAR(255) DEFAULT 'data.state',
            reel_success_state             VARCHAR(100) DEFAULT 'success',
            reel_failed_state              VARCHAR(100) DEFAULT 'fail',
            reel_result_path               TEXT DEFAULT NULL,

            -- PRODUCT SHOWCASE
            showcase_enabled       TINYINT(1) DEFAULT 0,
            showcase_base_url      VARCHAR(500) DEFAULT NULL,
            showcase_api_key       TEXT DEFAULT NULL,
            showcase_auth_type     VARCHAR(50) DEFAULT 'bearer',
            showcase_auth_header_key       VARCHAR(255) DEFAULT 'Authorization',
            showcase_auth_header_prefix    VARCHAR(100) DEFAULT 'Bearer',
            showcase_auth_body_key         TEXT DEFAULT NULL,
            showcase_auth_query_key        TEXT DEFAULT NULL,
            showcase_create_endpoint       VARCHAR(500) DEFAULT NULL,
            showcase_create_method         VARCHAR(10) DEFAULT 'POST',
            showcase_create_payload        JSON DEFAULT NULL,
            showcase_job_id_path           VARCHAR(255) DEFAULT 'data.taskId',
            showcase_status_endpoint       VARCHAR(500) DEFAULT NULL,
            showcase_status_method         VARCHAR(10) DEFAULT 'GET',
            showcase_state_path            VARCHAR(255) DEFAULT 'data.state',
            showcase_success_state         VARCHAR(100) DEFAULT 'success',
            showcase_failed_state          VARCHAR(100) DEFAULT 'fail',
            showcase_result_path           TEXT DEFAULT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);`,
    check: "SHOW TABLES LIKE 'ai_providers';",
  },
  {
    run: `DELETE FROM ai_providers
      WHERE provider_key IN ('kie_ai','usevelix','wavespeed','fal_ai')
         OR name IN ('Kie.ai','Usevelix','WaveSpeed.ai','Fal.ai');`,
    check: "SELECT id FROM ai_providers WHERE provider_key IN ('kie_ai','usevelix','wavespeed','fal_ai') OR name IN ('Kie.ai','Usevelix','WaveSpeed.ai','Fal.ai') LIMIT 1;",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `influencers` ADD COLUMN `job_id` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `influencers` LIKE 'job_id';",
  },
  {
    run: "ALTER TABLE `influencers` ADD COLUMN `submission_key` VARCHAR(64) DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `influencers` LIKE 'submission_key';",
  },
  {
    run: "ALTER TABLE `influencers` ADD UNIQUE KEY `uniq_influencer_submission` (`uid`, `submission_key`);",
    check:
      "SHOW INDEX FROM `influencers` WHERE Key_name = 'uniq_influencer_submission';",
  },
  {
    run: "ALTER TABLE `gallery` ADD COLUMN `job_id` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `gallery` LIKE 'job_id';",
  },
  {
    run: "ALTER TABLE `product_content` ADD COLUMN `job_id` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `product_content` LIKE 'job_id';",
  },
  {
    run: "ALTER TABLE `product_content` ADD COLUMN `submission_key` VARCHAR(64) DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `product_content` LIKE 'submission_key';",
  },
  {
    run: "ALTER TABLE `product_content` ADD UNIQUE KEY `uniq_product_content_submission` (`uid`, `submission_key`);",
    check:
      "SHOW INDEX FROM `product_content` WHERE Key_name = 'uniq_product_content_submission';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `smtp_host` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'smtp_host';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `smtp_port` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'smtp_port';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `smtp_security` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'smtp_security';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `smtp_auth` INT(1) DEFAULT 1;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'smtp_auth';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `smtp_username` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'smtp_username';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `smtp_email` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'smtp_email';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `smtp_password` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'smtp_password';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `smtp_from` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'smtp_from';",
  },
  {
    run: `CREATE TABLE usage_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uid VARCHAR(255) DEFAULT NULL,
            task TEXT DEFAULT NULL,
            credits VARCHAR(255) DEFAULT NULL,
            status VARCHAR(255) DEFAULT NULL,
            date VARCHAR(255) DEFAULT NULL,
            des VARCHAR(255) DEFAULT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'usage_log';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `email_template_welcome` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'email_template_welcome';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `email_template_pass_recovery` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check:
      "SHOW COLUMNS FROM `web_private` LIKE 'email_template_pass_recovery';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `email_template_usage_update` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check:
      "SHOW COLUMNS FROM `web_private` LIKE 'email_template_usage_update';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `email_template_plan_activation` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check:
      "SHOW COLUMNS FROM `web_private` LIKE 'email_template_plan_activation';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `email_template_email_verification` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check:
      "SHOW COLUMNS FROM `web_private` LIKE 'email_template_email_verification';",
  },
  {
    run: "ALTER TABLE usage_log MODIFY des LONGTEXT DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `usage_log` LIKE 'des_update';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `pay_paystack_id` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_paystack_id';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `pay_paystack_key` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_paystack_key';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `paystack_active` TINYINT(1) DEFAULT 0;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'paystack_active';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `rz_id` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'rz_id';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `rz_key` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'rz_key';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `rz_active` TINYINT(1) DEFAULT 0;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'rz_active';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `pay_stripe_id` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_stripe_id';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `pay_stripe_key` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_stripe_key';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `stripe_active` TINYINT(1) DEFAULT 0;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'stripe_active';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `pay_paypal_id` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_paypal_id';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `pay_paypal_key` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_paypal_key';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `paypal_active` TINYINT(1) DEFAULT 0;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'paypal_active';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `paypal_mode` VARCHAR(20) DEFAULT 'live';",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'paypal_mode';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `pay_mercadopago_access_token` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check:
      "SHOW COLUMNS FROM `web_private` LIKE 'pay_mercadopago_access_token';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `pay_mercadopago_public_key` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_mercadopago_public_key';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `mercadopago_active` TINYINT(1) DEFAULT 0;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'mercadopago_active';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `payu_key` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'payu_key';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `payu_salt` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'payu_salt';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `payu_mode` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'test';",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'payu_mode';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `payu_active` TINYINT(1) DEFAULT 0;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'payu_active';",
  },
  {
    run: `CREATE TABLE blog (
          id INT AUTO_INCREMENT PRIMARY KEY,
          uid VARCHAR(999) DEFAULT NULL,
          title VARCHAR(999) DEFAULT NULL,
          slug VARCHAR(999) DEFAULT NULL,
          thumbnail VARCHAR(999) DEFAULT NULL,
          content LONGTEXT DEFAULT NULL,
          excerpt TEXT DEFAULT NULL,
          meta_title VARCHAR(999) DEFAULT NULL,
          meta_description TEXT DEFAULT NULL,
          meta_keywords TEXT DEFAULT NULL,
          og_image VARCHAR(999) DEFAULT NULL,
          status VARCHAR(999) DEFAULT 'draft',
          author_id VARCHAR(999) DEFAULT NULL,
          views INT DEFAULT 0,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'blog';",
  },
  {
    run: `CREATE TABLE web_public (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_name VARCHAR(999) DEFAULT NULL,
        site_logo VARCHAR(999) DEFAULT NULL,
        site_favicon VARCHAR(999) DEFAULT NULL,
        meta_title VARCHAR(999) DEFAULT NULL,
        meta_description TEXT DEFAULT NULL,
        meta_keywords TEXT DEFAULT NULL,
        og_title VARCHAR(999) DEFAULT NULL,
        og_description TEXT DEFAULT NULL,
        og_image VARCHAR(999) DEFAULT NULL,
        google_analytics_id VARCHAR(999) DEFAULT NULL,
        google_tag_manager_id VARCHAR(999) DEFAULT NULL,
        facebook_pixel_id VARCHAR(999) DEFAULT NULL,
        custom_homepage_enabled TINYINT(1) DEFAULT 0,
        custom_homepage_url VARCHAR(999) DEFAULT NULL,
        youtube_tutorial_url VARCHAR(999) DEFAULT NULL,
        currency_symbol VARCHAR(10) DEFAULT '$',
        currency_code VARCHAR(10) DEFAULT 'USD',
        currency_exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
        referral_enabled TINYINT(1) DEFAULT 1,
        referral_signup_credits INT DEFAULT 0,
        referral_referrer_credits INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'web_public';",
  },
  {
    run: "ALTER TABLE `web_public` ADD COLUMN `referral_enabled` TINYINT(1) DEFAULT 1;",
    check: "SHOW COLUMNS FROM `web_public` LIKE 'referral_enabled';",
  },
  {
    run: "ALTER TABLE `web_public` ADD COLUMN `referral_signup_credits` INT DEFAULT 0;",
    check: "SHOW COLUMNS FROM `web_public` LIKE 'referral_signup_credits';",
  },
  {
    run: "ALTER TABLE `web_public` ADD COLUMN `referral_referrer_credits` INT DEFAULT 0;",
    check: "SHOW COLUMNS FROM `web_public` LIKE 'referral_referrer_credits';",
  },
  {
    run: "ALTER TABLE `web_public` ADD COLUMN `privacy_policy_html` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_public` LIKE 'privacy_policy_html';",
  },
  {
    run: "ALTER TABLE `web_public` ADD COLUMN `tnc_html` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_public` LIKE 'tnc_html';",
  },
  {
    run: "ALTER TABLE `web_public` ADD COLUMN `about_us_html` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_public` LIKE 'about_us_html';",
  },
  {
    run: `CREATE TABLE contact_us_leads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(999) DEFAULT NULL,
            email VARCHAR(999) DEFAULT NULL,
            phone VARCHAR(999) DEFAULT NULL,
            message LONGTEXT DEFAULT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'contact_us_leads';",
  },
  {
    run: `CREATE TABLE IF NOT EXISTS orders (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        uid        VARCHAR(255) NOT NULL,
        plan_id    INT NULL,
        package_id INT NULL,
        product_type VARCHAR(50) DEFAULT 'plan',
        amount     DECIMAL(10,2) NOT NULL,
        gateway    VARCHAR(50) NOT NULL,
        meta       JSON DEFAULT NULL,
        status     VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT NOW()
      );`,
    check: `SHOW TABLES LIKE 'orders'`,
  },
  {
    run: "ALTER TABLE `orders` MODIFY `plan_id` INT NULL;",
    check: "SHOW COLUMNS FROM `orders` WHERE Field = 'plan_id' AND `Null` = 'YES';",
  },
  {
    run: "ALTER TABLE `orders` ADD COLUMN `package_id` INT NULL AFTER `plan_id`;",
    check: "SHOW COLUMNS FROM `orders` LIKE 'package_id';",
  },
  {
    run: "ALTER TABLE `orders` ADD COLUMN `product_type` VARCHAR(50) DEFAULT 'plan' AFTER `package_id`;",
    check: "SHOW COLUMNS FROM `orders` LIKE 'product_type';",
  },
  {
    run: "ALTER TABLE `web_public` ADD COLUMN `google_login_id` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_public` LIKE 'google_login_id';",
  },
  {
    run: "ALTER TABLE `user` ADD COLUMN `forget_token` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `user` LIKE 'forget_token';",
  },
  {
    run: "ALTER TABLE `admin` ADD COLUMN `forget_token` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `admin` LIKE 'forget_token';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `offline_payment_html` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'offline_payment_html';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `offline_payment_active` INT(1) DEFAULT 1;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'offline_payment_active';",
  },
  {
    run: "ALTER TABLE `user` ADD COLUMN `token_version` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `user` LIKE 'token_version';",
  },
  {
    run: "ALTER TABLE `admin` ADD COLUMN `token_version` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `admin` LIKE 'token_version';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `insta_app_id` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'insta_app_id';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `insta_app_secret` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'insta_app_secret';",
  },
  {
    run: "CREATE TABLE instagram_accounts (id INT AUTO_INCREMENT PRIMARY KEY, uid TEXT DEFAULT NULL, webhook_id TEXT DEFAULT NULL, ig_graph_id TEXT DEFAULT NULL, user_id TEXT DEFAULT NULL, page_id TEXT DEFAULT NULL, username TEXT DEFAULT NULL, name TEXT DEFAULT NULL, profile_pic LONGTEXT DEFAULT NULL, access_token LONGTEXT DEFAULT NULL, token_type TEXT DEFAULT NULL, expires_in BIGINT DEFAULT NULL, connected_at DATETIME DEFAULT NULL, other LONGTEXT DEFAULT NULL, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
    check: "SHOW TABLES LIKE 'instagram_accounts';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `tiktok_client_key` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'tiktok_client_key';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `tiktok_client_secret` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'tiktok_client_secret';",
  },
  {
    run: `CREATE TABLE IF NOT EXISTS tiktok_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) NOT NULL,
    open_id VARCHAR(255) NOT NULL,
    union_id VARCHAR(255) DEFAULT NULL,
    display_name VARCHAR(255) DEFAULT NULL,
    username VARCHAR(255) DEFAULT NULL,
    avatar_url TEXT DEFAULT NULL,
    access_token TEXT DEFAULT NULL,
    refresh_token TEXT DEFAULT NULL,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_in INT DEFAULT NULL,
    refresh_expires_in INT DEFAULT NULL,
    connected_at DATETIME DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'tiktok_accounts';",
  },
  {
    run: `CREATE TABLE IF NOT EXISTS \`scheduled_posts\` (
    \`id\`                INT AUTO_INCREMENT PRIMARY KEY,
    \`uid\`               VARCHAR(255) NOT NULL,
    \`platform\`          ENUM('instagram','tiktok') NOT NULL,
    \`account_id\`        INT NOT NULL,
    \`media_url\`         TEXT NOT NULL,
    \`media_type\`        ENUM('IMAGE','VIDEO') DEFAULT 'IMAGE',
    \`source_type\`       ENUM('influencer','gallery','content','product') NOT NULL,
    \`source_id\`         INT NOT NULL,
    \`caption\`           TEXT DEFAULT NULL,
    \`hashtags\`          TEXT DEFAULT NULL,
    \`timezone\`          VARCHAR(100) DEFAULT 'UTC',
    \`scheduled_at_utc\`  DATETIME DEFAULT NULL,
    \`post_now\`          TINYINT(1) DEFAULT 0,
    \`status\`            ENUM('pending','posted','failed') DEFAULT 'pending',
    \`platform_post_id\`  VARCHAR(255) DEFAULT NULL,
    \`error_message\`     TEXT DEFAULT NULL,
    \`posted_at\`         DATETIME DEFAULT NULL,
    \`createdAt\`         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: `SHOW TABLES LIKE 'scheduled_posts';`,
  },
  {
    run: `ALTER TABLE \`web_private\` ADD COLUMN \`talking_video_maker\` VARCHAR(255) DEFAULT '0';`,
    check: "SHOW COLUMNS FROM `web_private` LIKE 'talking_video_maker';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `prompt_recommend_maker` VARCHAR(255) DEFAULT '5';",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'prompt_recommend_maker';",
  },
  {
    run: `CREATE TABLE prompt_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) DEFAULT NULL,
    type VARCHAR(100) DEFAULT NULL,
    source_id VARCHAR(255) DEFAULT NULL,
    input LONGTEXT DEFAULT NULL,
    prompts LONGTEXT DEFAULT NULL,
    credits VARCHAR(255) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'success',
    error_message LONGTEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'prompt_recommendations';",
  },
  {
    run: `CREATE TABLE talking_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) DEFAULT NULL,
    model LONGTEXT DEFAULT NULL,
    image_url LONGTEXT DEFAULT NULL,
    text LONGTEXT DEFAULT NULL,
    voice VARCHAR(255) DEFAULT 'en-US-AriaNeural',
    lang VARCHAR(100) DEFAULT 'en-US',
    gender VARCHAR(50) DEFAULT 'female',
    voice_style VARCHAR(100) DEFAULT 'general',
    project_style VARCHAR(100) DEFAULT 'close_up',
    aspect_ratio VARCHAR(20) DEFAULT '9:16',
    character_style VARCHAR(100) DEFAULT 'realistic',
    status LONGTEXT DEFAULT NULL,
    job_id LONGTEXT DEFAULT NULL,
    error_message LONGTEXT DEFAULT NULL,
    generated_video VARCHAR(255) DEFAULT NULL,
    video_thumbnail VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'talking_content';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_enabled TINYINT(1) DEFAULT 0;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_enabled';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `launchpad_active` TINYINT(1) DEFAULT 0;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'launchpad_active';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `launchpad_page_slug` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'launchpad';",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'launchpad_page_slug';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `launchpad_embed_html` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'launchpad_embed_html';",
  },
  {
    run: "ALTER TABLE `web_private` ADD COLUMN `launchpad_webhook_secret` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'launchpad_webhook_secret';",
  },
  {
    run: `CREATE TABLE launchpad_webhook_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transaction_id VARCHAR(255) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      product_name VARCHAR(999) DEFAULT NULL,
      plan_id INT DEFAULT NULL,
      uid VARCHAR(255) DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'received',
      payload LONGTEXT DEFAULT NULL,
      error TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY launchpad_transaction_unique (transaction_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'launchpad_webhook_events';",
  },
  {
    run: `CREATE TABLE launchpad_pages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      page_path VARCHAR(255) NOT NULL,
      product_name VARCHAR(999) DEFAULT NULL,
      plan_id INT DEFAULT NULL,
      embed_html LONGTEXT DEFAULT NULL,
      active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY launchpad_page_path_unique (page_path)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'launchpad_pages';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_base_url TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_base_url';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_api_key TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_api_key';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_auth_type VARCHAR(50) DEFAULT 'bearer';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_auth_type';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_auth_header_key VARCHAR(255) DEFAULT 'Authorization';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_auth_header_key';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_auth_header_prefix VARCHAR(100) DEFAULT 'Bearer';`,
    check:
      "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_auth_header_prefix';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_auth_body_key TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_auth_body_key';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_auth_query_key TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_auth_query_key';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_create_endpoint TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_create_endpoint';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_create_method VARCHAR(10) DEFAULT 'POST';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_create_method';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_create_payload JSON DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_create_payload';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_job_id_path VARCHAR(255) DEFAULT 'jobId';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_job_id_path';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_status_endpoint TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_status_endpoint';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_status_method VARCHAR(10) DEFAULT 'GET';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_status_method';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_state_path VARCHAR(255) DEFAULT 'status';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_state_path';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_success_state VARCHAR(100) DEFAULT 'done';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_success_state';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_failed_state VARCHAR(100) DEFAULT 'failed';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_failed_state';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN talking_result_path VARCHAR(255) DEFAULT 'resultUrl';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'talking_result_path';",
  },
  {
    run: "ALTER TABLE `content` ADD COLUMN `submission_key` VARCHAR(64) DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `content` LIKE 'submission_key';",
  },
  {
    run: "ALTER TABLE `content` ADD UNIQUE KEY `uniq_content_submission` (`uid`, `submission_key`);",
    check:
      "SHOW INDEX FROM `content` WHERE Key_name = 'uniq_content_submission';",
  },
  {
    run: "ALTER TABLE `gallery` ADD COLUMN `submission_key` VARCHAR(64) DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `gallery` LIKE 'submission_key';",
  },
  {
    run: "ALTER TABLE `gallery` ADD UNIQUE KEY `uniq_gallery_submission` (`uid`, `submission_key`);",
    check:
      "SHOW INDEX FROM `gallery` WHERE Key_name = 'uniq_gallery_submission';",
  },
  {
    run: "ALTER TABLE `talking_content` ADD COLUMN `submission_key` VARCHAR(64) DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `talking_content` LIKE 'submission_key';",
  },
  {
    run: "ALTER TABLE `talking_content` ADD UNIQUE KEY `uniq_talking_submission` (`uid`, `submission_key`);",
    check:
      "SHOW INDEX FROM `talking_content` WHERE Key_name = 'uniq_talking_submission';",
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `pay_stripe_id`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_stripe_id';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `pay_stripe_key`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_stripe_key';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `stripe_active`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'stripe_active';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `pay_paystack_id`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_paystack_id';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `pay_paystack_key`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_paystack_key';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `paystack_active`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'paystack_active';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `pay_mercadopago_access_token`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_mercadopago_access_token';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `pay_mercadopago_public_key`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'pay_mercadopago_public_key';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `mercadopago_active`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'mercadopago_active';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `payu_key`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'payu_key';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `payu_salt`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'payu_salt';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `payu_mode`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'payu_mode';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `payu_active`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'payu_active';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_public` DROP COLUMN `google_login_id`;",
    check: "SHOW COLUMNS FROM `web_public` LIKE 'google_login_id';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `offline_payment_html`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'offline_payment_html';",
    runWhenExists: true,
  },
  {
    run: "ALTER TABLE `web_private` DROP COLUMN `offline_payment_active`;",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'offline_payment_active';",
    runWhenExists: true,
  },
  {
    run: `INSERT INTO ai_providers (
    name, provider_key, is_active, is_default,
    txt2img_enabled, txt2img_base_url, txt2img_api_key,
    txt2img_auth_type, txt2img_auth_header_key, txt2img_auth_header_prefix,
    txt2img_create_endpoint, txt2img_create_method, txt2img_create_payload,
    txt2img_job_id_path, txt2img_status_endpoint, txt2img_status_method,
    txt2img_state_path, txt2img_success_state, txt2img_failed_state, txt2img_result_path,
    reel_enabled, reel_base_url, reel_api_key,
    reel_auth_type, reel_auth_header_key, reel_auth_header_prefix,
    reel_create_endpoint, reel_create_method, reel_create_payload,
    reel_job_id_path, reel_status_endpoint, reel_status_method,
    reel_state_path, reel_success_state, reel_failed_state, reel_result_path,
    showcase_enabled, showcase_base_url, showcase_api_key,
    showcase_auth_type, showcase_auth_header_key, showcase_auth_header_prefix,
    showcase_create_endpoint, showcase_create_method, showcase_create_payload,
    showcase_job_id_path, showcase_status_endpoint, showcase_status_method,
    showcase_state_path, showcase_success_state, showcase_failed_state, showcase_result_path
  ) VALUES (
    'Google Veo', 'google_veo', 1, 1,
    1, 'https://generativelanguage.googleapis.com', 'YOUR_API_KEY',
    'custom_header', 'x-goog-api-key', '',
    '/v1beta/models/imagen-4.0-fast-generate-001:predict', 'POST',
    '{"instances":[{"prompt":"{{prompt}}"}],"parameters":{"sampleCount":1,"aspectRatio":"9:16"}}',
    'predictions[0].bytesBase64Encoded', '', 'GET', '', '', '',
    '@b64data(predictions[0].bytesBase64Encoded)',
    1, 'https://generativelanguage.googleapis.com', 'YOUR_API_KEY',
    'custom_header', 'x-goog-api-key', '',
    '/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning', 'POST',
    '{"instances":[{"prompt":"The character is performing the action from the reference video, cinematic motion, natural movement","image":{"bytesBase64Encoded":"@url_to_b64:{{character_image_url}}","mimeType":"image/jpeg"}}],"parameters":{"aspectRatio":"9:16","durationSeconds":8,"personGeneration":"allow_adult"}}',
    'name', '/v1beta/{{taskId}}', 'GET', 'done', 'true', 'error',
    'response.generateVideoResponse.generatedSamples[0].video.uri',
    1, 'https://generativelanguage.googleapis.com', 'YOUR_API_KEY',
    'custom_header', 'x-goog-api-key', '',
    '/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning', 'POST',
    '{"instances":[{"prompt":"{{text}}","image":{"bytesBase64Encoded":"@url_to_b64:{{image_url_1}}","mimeType":"image/jpeg"},"lastFrame":{"bytesBase64Encoded":"@url_to_b64:{{image_url_2}}","mimeType":"image/jpeg"}}],"parameters":{"aspectRatio":"{{aspect_ratio}}","durationSeconds":8,"personGeneration":"allow_adult"}}',
    'name', '/v1beta/{{taskId}}', 'GET', 'done', 'true', 'error',
    'response.generateVideoResponse.generatedSamples[0].video.uri'
  );`,
    // Skip if already merged into provider_key=google
    check: "SELECT * FROM ai_providers WHERE provider_key IN ('google_veo','google') LIMIT 1;",
  },
  {
    run: `INSERT INTO ai_providers (
    name, provider_key, is_active, is_default,
    txt2img_enabled, txt2img_base_url, txt2img_api_key,
    txt2img_auth_type, txt2img_auth_header_key, txt2img_auth_header_prefix,
    txt2img_create_endpoint, txt2img_create_method, txt2img_create_payload,
    txt2img_job_id_path, txt2img_status_endpoint, txt2img_status_method,
    txt2img_state_path, txt2img_success_state, txt2img_failed_state, txt2img_result_path,
    img2img_enabled, img2img_base_url, img2img_api_key,
    img2img_auth_type, img2img_auth_header_key, img2img_auth_header_prefix,
    img2img_create_endpoint, img2img_create_method, img2img_create_payload,
    img2img_job_id_path, img2img_status_endpoint, img2img_status_method,
    img2img_state_path, img2img_success_state, img2img_failed_state, img2img_result_path,
    reel_enabled, reel_base_url, reel_api_key,
    reel_auth_type, reel_auth_header_key, reel_auth_header_prefix,
    reel_create_endpoint, reel_create_method, reel_create_payload,
    reel_job_id_path, reel_status_endpoint, reel_status_method,
    reel_state_path, reel_success_state, reel_failed_state, reel_result_path,
    showcase_enabled, showcase_base_url, showcase_api_key,
    showcase_auth_type, showcase_auth_header_key, showcase_auth_header_prefix,
    showcase_create_endpoint, showcase_create_method, showcase_create_payload,
    showcase_job_id_path, showcase_status_endpoint, showcase_status_method,
    showcase_state_path, showcase_success_state, showcase_failed_state, showcase_result_path
  ) VALUES (
    'Alibaba Wan (DashScope)', 'alibaba_wan', 0, 0,
    1, 'https://dashscope-intl.aliyuncs.com', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/api/v1/services/aigc/text2image/image-synthesis', 'POST',
    '{"__headers":{"X-DashScope-Async":"enable"},"model":"wan2.2-t2i-flash","input":{"prompt":"{{prompt}}"},"parameters":{"size":"768*1344","n":1}}',
    'output.task_id', '/api/v1/tasks/{{taskId}}', 'GET', 'output.task_status', 'SUCCEEDED', 'FAILED', 'output.results[0].url',
    1, 'https://dashscope-intl.aliyuncs.com', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/api/v1/services/aigc/image2image/image-synthesis', 'POST',
    '{"__headers":{"X-DashScope-Async":"enable"},"model":"wanx-style-repaint-v1","input":{"prompt":"{{prompt}}","images":[{"image_url":"{{reference_url}}"}]},"parameters":{"n":1}}',
    'output.task_id', '/api/v1/tasks/{{taskId}}', 'GET', 'output.task_status', 'SUCCEEDED', 'FAILED', 'output.results[0].url',
    1, 'https://dashscope-intl.aliyuncs.com', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/api/v1/services/aigc/video-generation/video-synthesis', 'POST',
    '{"__headers":{"X-DashScope-Async":"enable"},"model":"wan2.2-i2v-flash","input":{"prompt":"The character is performing the action from the reference video, natural motion","img_url":"{{character_image_url}}"},"parameters":{"resolution":"720P","prompt_extend":true}}',
    'output.task_id', '/api/v1/tasks/{{taskId}}', 'GET', 'output.task_status', 'SUCCEEDED', 'FAILED', 'output.video_url',
    1, 'https://dashscope-intl.aliyuncs.com', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/api/v1/services/aigc/image2video/video-synthesis', 'POST',
    '{"__headers":{"X-DashScope-Async":"enable"},"model":"wan2.2-kf2v-flash","input":{"prompt":"{{text}}","first_frame_url":"{{image_url_1}}","last_frame_url":"{{image_url_2}}"},"parameters":{"resolution":"720P","prompt_extend":true}}',
    'output.task_id', '/api/v1/tasks/{{taskId}}', 'GET', 'output.task_status', 'SUCCEEDED', 'FAILED', 'output.video_url'
  );`,
    check: "SELECT * FROM ai_providers WHERE provider_key='alibaba_wan' LIMIT 1;",
  },
  {
    run: `INSERT INTO ai_providers (
    name, provider_key, is_active, is_default,
    txt2img_enabled, txt2img_base_url, txt2img_api_key,
    txt2img_auth_type, txt2img_auth_header_key, txt2img_auth_header_prefix,
    txt2img_create_endpoint, txt2img_create_method, txt2img_create_payload,
    txt2img_job_id_path, txt2img_status_endpoint, txt2img_status_method,
    txt2img_state_path, txt2img_success_state, txt2img_failed_state, txt2img_result_path,
    img2img_enabled, img2img_base_url, img2img_api_key,
    img2img_auth_type, img2img_auth_header_key, img2img_auth_header_prefix,
    img2img_create_endpoint, img2img_create_method, img2img_create_payload,
    img2img_job_id_path, img2img_status_endpoint, img2img_status_method,
    img2img_state_path, img2img_success_state, img2img_failed_state, img2img_result_path,
    reel_enabled, reel_base_url, reel_api_key,
    reel_auth_type, reel_auth_header_key, reel_auth_header_prefix,
    reel_create_endpoint, reel_create_method, reel_create_payload,
    reel_job_id_path, reel_status_endpoint, reel_status_method,
    reel_state_path, reel_success_state, reel_failed_state, reel_result_path,
    showcase_enabled, showcase_base_url, showcase_api_key,
    showcase_auth_type, showcase_auth_header_key, showcase_auth_header_prefix,
    showcase_create_endpoint, showcase_create_method, showcase_create_payload,
    showcase_job_id_path, showcase_status_endpoint, showcase_status_method,
    showcase_state_path, showcase_success_state, showcase_failed_state, showcase_result_path
  ) VALUES (
    'xAI Grok Imagine', 'xai_grok', 0, 0,
    1, 'https://api.x.ai', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/v1/images/generations', 'POST',
    '{"model":"grok-imagine-image","prompt":"{{prompt}}","aspect_ratio":"9:16","n":1}',
    'data[0].url', '', 'GET', '', '', '', 'data[0].url',
    1, 'https://api.x.ai', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/v1/images/edits', 'POST',
    '{"model":"grok-imagine-image","prompt":"{{prompt}}","image":{"url":"{{reference_url}}","type":"image_url"},"n":1}',
    'data[0].url', '', 'GET', '', '', '', 'data[0].url',
    1, 'https://api.x.ai', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/v1/videos/generations', 'POST',
    '{"model":"grok-imagine-video","prompt":"The character is performing the action from the reference video, natural cinematic motion","image":{"url":"{{character_image_url}}"},"duration":8,"aspect_ratio":"9:16","resolution":"720p"}',
    'request_id', '/v1/videos/{{taskId}}', 'GET', 'status', 'done', 'failed', 'video.url',
    1, 'https://api.x.ai', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/v1/videos/generations', 'POST',
    '{"model":"grok-imagine-video","prompt":"{{text}}","image":{"url":"{{image_url_1}}"},"duration":8,"aspect_ratio":"9:16","resolution":"720p"}',
    'request_id', '/v1/videos/{{taskId}}', 'GET', 'status', 'done', 'failed', 'video.url'
  );`,
    check: "SELECT * FROM ai_providers WHERE provider_key='xai_grok' LIMIT 1;",
  },

  {
    run: `INSERT INTO ai_providers (
    name, provider_key, is_active, is_default,
    txt2img_enabled, txt2img_base_url, txt2img_api_key,
    txt2img_auth_type, txt2img_auth_header_key, txt2img_auth_header_prefix,
    txt2img_create_endpoint, txt2img_create_method, txt2img_create_payload,
    txt2img_job_id_path, txt2img_status_endpoint, txt2img_status_method,
    txt2img_state_path, txt2img_success_state, txt2img_failed_state, txt2img_result_path,
    img2img_enabled, reel_enabled, showcase_enabled
  ) VALUES (
    'ChatGPT (OpenAI)', 'openai_chatgpt', 0, 0,
    1, 'https://api.openai.com/v1', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/chat/completions', 'POST',
    '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"{{prompt}}"}]}',
    'choices[0].message.content', '', 'GET', '', '', '', 'choices[0].message.content',
    0, 0, 0
  );`,
    check: "SELECT * FROM ai_providers WHERE provider_key='openai_chatgpt' LIMIT 1;",
  },

  {
    run: `INSERT INTO ai_providers (
    name, provider_key, is_active, is_default,
    txt2img_enabled, txt2img_base_url, txt2img_api_key,
    txt2img_auth_type, txt2img_auth_header_key, txt2img_auth_header_prefix,
    txt2img_create_endpoint, txt2img_create_method, txt2img_create_payload,
    txt2img_job_id_path, txt2img_status_endpoint, txt2img_status_method,
    txt2img_state_path, txt2img_success_state, txt2img_failed_state, txt2img_result_path,
    img2img_enabled, reel_enabled, showcase_enabled
  ) VALUES (
    'Groq (Free Text)', 'groq_free', 0, 0,
    1, 'https://api.groq.com/openai/v1', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/chat/completions', 'POST',
    '{"model":"llama-3.1-8b-instant","messages":[{"role":"user","content":"{{prompt}}"}]}',
    'choices[0].message.content', '', 'GET', '', '', '', 'choices[0].message.content',
    0, 0, 0
  );`,
    check: "SELECT * FROM ai_providers WHERE provider_key='groq_free' LIMIT 1;",
  },

  {
    run: "ALTER TABLE `web_private` ADD COLUMN `text_content_maker` VARCHAR(255) DEFAULT '3';",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'text_content_maker';",
  },

  {
    run: `CREATE TABLE text_content (
      id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
      uid VARCHAR(255) NOT NULL,
      content_type VARCHAR(50) NOT NULL DEFAULT 'caption',
      topic TEXT NOT NULL,
      tone VARCHAR(100) DEFAULT 'engaging',
      language VARCHAR(50) DEFAULT 'English',
      extra TEXT NULL,
      result LONGTEXT NULL,
      credits INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'success',
      error_msg TEXT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (uid),
      INDEX (content_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    check: "SHOW TABLES LIKE 'text_content';",
  },

  // ── Text-to-Text (txt2txt) columns on ai_providers ──
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_enabled TINYINT(1) DEFAULT 0;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_enabled';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_base_url TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_base_url';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_api_key TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_api_key';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_auth_type VARCHAR(50) DEFAULT 'bearer';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_auth_type';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_auth_header_key VARCHAR(255) DEFAULT 'Authorization';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_auth_header_key';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_auth_header_prefix VARCHAR(100) DEFAULT 'Bearer';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_auth_header_prefix';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_auth_body_key TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_auth_body_key';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_auth_query_key TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_auth_query_key';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_create_endpoint TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_create_endpoint';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_create_method VARCHAR(10) DEFAULT 'POST';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_create_method';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_create_payload JSON DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_create_payload';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_job_id_path VARCHAR(255) DEFAULT 'choices[0].message.content';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_job_id_path';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_status_endpoint TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_status_endpoint';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_status_method VARCHAR(10) DEFAULT 'GET';`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_status_method';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_state_path VARCHAR(255) DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_state_path';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_success_state VARCHAR(100) DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_success_state';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_failed_state VARCHAR(100) DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_failed_state';",
  },
  {
    run: `ALTER TABLE ai_providers ADD COLUMN txt2txt_result_path TEXT DEFAULT NULL;`,
    check: "SHOW COLUMNS FROM `ai_providers` LIKE 'txt2txt_result_path';",
  },

  // Keep Google + Grok + D-ID (+ legacy rows until mergeGoogleProviders runs at end of init)
  {
    run: `DELETE FROM ai_providers
      WHERE provider_key NOT IN ('google', 'xai_grok', 'google_veo', 'google_gemini', 'd_id');`,
    check: "SELECT id FROM ai_providers WHERE provider_key NOT IN ('google','xai_grok','google_veo','google_gemini','d_id') LIMIT 1;",
    runWhenExists: true,
  },

  {
    run: `UPDATE ai_providers SET name = 'Google Veo'
      WHERE provider_key = 'google_veo' AND name <> 'Google Veo';`,
    check: "SELECT id FROM ai_providers WHERE provider_key='google_veo' AND name <> 'Google Veo' LIMIT 1;",
    runWhenExists: true,
  },
  {
    run: `INSERT INTO ai_providers (
    name, provider_key, is_active, is_default,
    txt2img_enabled, img2img_enabled, reel_enabled, showcase_enabled,
    txt2txt_enabled, txt2txt_base_url, txt2txt_api_key,
    txt2txt_auth_type, txt2txt_auth_header_key, txt2txt_auth_header_prefix,
    txt2txt_create_endpoint, txt2txt_create_method, txt2txt_create_payload,
    txt2txt_result_path
  ) VALUES (
    'Google Gemini', 'google_gemini', 1, 0,
    0, 0, 0, 0,
    1, 'https://generativelanguage.googleapis.com', 'YOUR_API_KEY',
    'custom_header', 'x-goog-api-key', '',
    '/v1beta/models/gemini-2.0-flash:generateContent', 'POST',
    '{"model":"gemini-2.0-flash"}',
    'candidates[0].content.parts[0].text'
  );`,
    // Skip if already merged into provider_key=google
    check: "SELECT * FROM ai_providers WHERE provider_key IN ('google_gemini','google') LIMIT 1;",
  },

  {
    run: `UPDATE ai_providers SET txt2txt_enabled = 0
    WHERE provider_key = 'google_veo' AND txt2txt_enabled = 1;`,
    check: "SELECT id FROM ai_providers WHERE provider_key='google_veo' AND txt2txt_enabled=1 LIMIT 1;",
    runWhenExists: true,
  },

  {
    run: `UPDATE ai_providers SET
      talking_enabled = 1,
      talking_base_url = 'https://generativelanguage.googleapis.com',
      talking_api_key = COALESCE(NULLIF(talking_api_key,''), NULLIF(txt2img_api_key,''), NULLIF(reel_api_key,''), NULLIF(showcase_api_key,''), 'YOUR_API_KEY'),
      talking_auth_type = 'custom_header',
      talking_auth_header_key = 'x-goog-api-key',
      talking_auth_header_prefix = '',
      talking_create_endpoint = '/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning',
      talking_create_method = 'POST',
      talking_create_payload = CAST('{"instances":[{"prompt":"The person in the image talks directly to the camera and says: \\"{{text}}\\". Natural lip movement, clear speech, realistic talking-head, cinematic lighting, {{aspectRatio}} vertical framing.","image":{"bytesBase64Encoded":"@url_to_b64:{{imageUrl}}","mimeType":"image/jpeg"}}],"parameters":{"aspectRatio":"{{aspectRatio}}","durationSeconds":8,"personGeneration":"allow_adult"}}' AS JSON),
      talking_job_id_path = 'name',
      talking_status_endpoint = '/v1beta/{{taskId}}',
      talking_status_method = 'GET',
      talking_state_path = 'done',
      talking_success_state = 'true',
      talking_failed_state = 'error',
      talking_result_path = 'response.generateVideoResponse.generatedSamples[0].video.uri'
    WHERE provider_key = 'google_veo';`,
    check: "SELECT id FROM ai_providers WHERE provider_key='google_veo' AND (talking_enabled=0 OR talking_create_endpoint IS NULL OR talking_create_endpoint NOT LIKE '%veo%' OR talking_create_payload IS NULL OR talking_job_id_path='jobId') LIMIT 1;",
    runWhenExists: true,
  },

  {
    run: `UPDATE ai_providers SET
      txt2txt_enabled = 1,
      txt2txt_base_url = 'https://generativelanguage.googleapis.com',
      txt2txt_api_key = COALESCE(NULLIF(txt2txt_api_key,''), NULLIF(txt2img_api_key,''), 'YOUR_API_KEY'),
      txt2txt_auth_type = 'custom_header',
      txt2txt_auth_header_key = 'x-goog-api-key',
      txt2txt_auth_header_prefix = '',
      txt2txt_create_endpoint = '/v1beta/models/gemini-2.0-flash:generateContent',
      txt2txt_create_method = 'POST',
      txt2txt_create_payload = '{"model":"gemini-2.0-flash"}',
      txt2txt_result_path = 'candidates[0].content.parts[0].text',
      txt2img_enabled = 1,
      txt2img_base_url = 'https://generativelanguage.googleapis.com',
      txt2img_api_key = COALESCE(NULLIF(txt2img_api_key,''), NULLIF(txt2txt_api_key,''), 'YOUR_API_KEY'),
      txt2img_auth_type = 'custom_header',
      txt2img_auth_header_key = 'x-goog-api-key',
      txt2img_auth_header_prefix = '',
      txt2img_create_endpoint = '/v1beta/models/imagen-4.0-fast-generate-001:predict',
      txt2img_create_method = 'POST',
      txt2img_create_payload = '{"instances":[{"prompt":"{{prompt}}"}],"parameters":{"sampleCount":1,"aspectRatio":"9:16"}}',
      txt2img_job_id_path = 'predictions[0].bytesBase64Encoded',
      txt2img_status_endpoint = '',
      txt2img_result_path = '@b64data(predictions[0].bytesBase64Encoded)',
      img2img_enabled = 1,
      img2img_base_url = 'https://generativelanguage.googleapis.com',
      img2img_api_key = COALESCE(NULLIF(img2img_api_key,''), NULLIF(txt2img_api_key,''), NULLIF(txt2txt_api_key,''), 'YOUR_API_KEY'),
      img2img_auth_type = 'custom_header',
      img2img_auth_header_key = 'x-goog-api-key',
      img2img_auth_header_prefix = '',
      img2img_create_endpoint = '/v1beta/models/imagen-3.0-capability-001:predict',
      img2img_create_method = 'POST',
      img2img_create_payload = '{"instances":[{"prompt":"{{prompt}}","referenceImages":[{"referenceType":"REFERENCE_TYPE_SUBJECT","referenceId":1,"referenceImage":{"bytesBase64Encoded":"@url_to_b64:{{reference_url}}"}}]}],"parameters":{"sampleCount":1,"aspectRatio":"9:16"}}',
      img2img_job_id_path = 'predictions[0].bytesBase64Encoded',
      img2img_status_endpoint = '',
      img2img_result_path = '@b64data(predictions[0].bytesBase64Encoded)',
      reel_enabled = 0,
      showcase_enabled = 0,
      talking_enabled = 0,
      is_active = 1
    WHERE provider_key = 'google_gemini';`,
    check: "SELECT id FROM ai_providers WHERE provider_key='google_gemini' AND txt2img_enabled=1 AND img2img_enabled=1 AND txt2txt_enabled=1 LIMIT 1;",
  },

  {
    run: `UPDATE ai_providers SET
      txt2img_enabled = 0,
      img2img_enabled = 0,
      txt2txt_enabled = 0,
      reel_enabled = 1,
      showcase_enabled = 1,
      talking_enabled = 1,
      reel_base_url = COALESCE(NULLIF(reel_base_url,''), 'https://generativelanguage.googleapis.com'),
      showcase_base_url = COALESCE(NULLIF(showcase_base_url,''), 'https://generativelanguage.googleapis.com'),
      talking_base_url = COALESCE(NULLIF(talking_base_url,''), 'https://generativelanguage.googleapis.com'),
      talking_api_key = COALESCE(NULLIF(talking_api_key,''), NULLIF(reel_api_key,''), NULLIF(showcase_api_key,''), NULLIF(txt2img_api_key,''), 'YOUR_API_KEY'),
      talking_auth_type = 'custom_header',
      talking_auth_header_key = 'x-goog-api-key',
      talking_auth_header_prefix = '',
      talking_create_endpoint = '/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning',
      talking_create_method = 'POST',
      talking_create_payload = CAST('{"instances":[{"prompt":"The person in the image talks directly to the camera and says: \\"{{text}}\\". Natural lip movement, clear speech, realistic talking-head, cinematic lighting, {{aspectRatio}} vertical framing.","image":{"bytesBase64Encoded":"@url_to_b64:{{imageUrl}}","mimeType":"image/jpeg"}}],"parameters":{"aspectRatio":"{{aspectRatio}}","durationSeconds":8,"personGeneration":"allow_adult"}}' AS JSON),
      talking_job_id_path = 'name',
      talking_status_endpoint = '/v1beta/{{taskId}}',
      talking_status_method = 'GET',
      talking_state_path = 'done',
      talking_success_state = 'true',
      talking_failed_state = 'error',
      talking_result_path = 'response.generateVideoResponse.generatedSamples[0].video.uri',
      is_active = 1,
      is_default = 1
    WHERE provider_key = 'google_veo';`,
    check: "SELECT id FROM ai_providers WHERE provider_key='google_veo' AND reel_enabled=1 AND showcase_enabled=1 AND talking_enabled=1 AND txt2img_enabled=0 AND talking_create_endpoint LIKE '%veo%' LIMIT 1;",
  },

  // Ensure xAI Grok exists with full feature set (inactive by default — alternate to Google)
  {
    run: `INSERT INTO ai_providers (
    name, provider_key, is_active, is_default,
    txt2img_enabled, txt2img_base_url, txt2img_api_key,
    txt2img_auth_type, txt2img_auth_header_key, txt2img_auth_header_prefix,
    txt2img_create_endpoint, txt2img_create_method, txt2img_create_payload,
    txt2img_job_id_path, txt2img_status_endpoint, txt2img_status_method,
    txt2img_state_path, txt2img_success_state, txt2img_failed_state, txt2img_result_path,
    img2img_enabled, img2img_base_url, img2img_api_key,
    img2img_auth_type, img2img_auth_header_key, img2img_auth_header_prefix,
    img2img_create_endpoint, img2img_create_method, img2img_create_payload,
    img2img_job_id_path, img2img_status_endpoint, img2img_status_method,
    img2img_state_path, img2img_success_state, img2img_failed_state, img2img_result_path,
    reel_enabled, reel_base_url, reel_api_key,
    reel_auth_type, reel_auth_header_key, reel_auth_header_prefix,
    reel_create_endpoint, reel_create_method, reel_create_payload,
    reel_job_id_path, reel_status_endpoint, reel_status_method,
    reel_state_path, reel_success_state, reel_failed_state, reel_result_path,
    showcase_enabled, showcase_base_url, showcase_api_key,
    showcase_auth_type, showcase_auth_header_key, showcase_auth_header_prefix,
    showcase_create_endpoint, showcase_create_method, showcase_create_payload,
    showcase_job_id_path, showcase_status_endpoint, showcase_status_method,
    showcase_state_path, showcase_success_state, showcase_failed_state, showcase_result_path,
    talking_enabled, talking_base_url, talking_api_key,
    talking_auth_type, talking_auth_header_key, talking_auth_header_prefix,
    talking_create_endpoint, talking_create_method, talking_create_payload,
    talking_job_id_path, talking_status_endpoint, talking_status_method,
    talking_state_path, talking_success_state, talking_failed_state, talking_result_path,
    txt2txt_enabled, txt2txt_base_url, txt2txt_api_key,
    txt2txt_auth_type, txt2txt_auth_header_key, txt2txt_auth_header_prefix,
    txt2txt_create_endpoint, txt2txt_create_method, txt2txt_create_payload,
    txt2txt_result_path
  ) VALUES (
    'xAI Grok Imagine', 'xai_grok', 0, 0,
    1, 'https://api.x.ai', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/v1/images/generations', 'POST',
    '{"model":"grok-imagine-image","prompt":"{{prompt}}","aspect_ratio":"9:16","n":1}',
    'data[0].url', '', 'GET', '', '', '', 'data[0].url',
    1, 'https://api.x.ai', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/v1/images/edits', 'POST',
    '{"model":"grok-imagine-image","prompt":"{{prompt}}","image":{"url":"{{reference_url}}","type":"image_url"},"n":1}',
    'data[0].url', '', 'GET', '', '', '', 'data[0].url',
    1, 'https://api.x.ai', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/v1/videos/generations', 'POST',
    '{"model":"grok-imagine-video","prompt":"The character is performing the action from the reference video, natural cinematic motion","image":{"url":"{{character_image_url}}"},"duration":8,"aspect_ratio":"9:16","resolution":"720p"}',
    'request_id', '/v1/videos/{{taskId}}', 'GET', 'status', 'done', 'failed', 'video.url',
    1, 'https://api.x.ai', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/v1/videos/generations', 'POST',
    '{"model":"grok-imagine-video","prompt":"{{text}}","image":{"url":"{{image_url_1}}"},"duration":8,"aspect_ratio":"{{aspect_ratio}}","resolution":"720p"}',
    'request_id', '/v1/videos/{{taskId}}', 'GET', 'status', 'done', 'failed', 'video.url',
    1, 'https://api.x.ai', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/v1/videos/generations', 'POST',
    '{"model":"grok-imagine-video","prompt":"The person in the image talks directly to the camera and says: {{text}}. Natural lip movement, clear speech, realistic talking-head.","image":{"url":"{{imageUrl}}"},"duration":8,"aspect_ratio":"{{aspectRatio}}","resolution":"720p"}',
    'request_id', '/v1/videos/{{taskId}}', 'GET', 'status', 'done', 'failed', 'video.url',
    1, 'https://api.x.ai', 'YOUR_API_KEY',
    'bearer', 'Authorization', 'Bearer',
    '/v1/chat/completions', 'POST',
    '{"model":"grok-3-mini","messages":[{"role":"user","content":"{{prompt}}"}]}',
    'choices[0].message.content'
  );`,
    check: "SELECT * FROM ai_providers WHERE provider_key='xai_grok' LIMIT 1;",
  },

  {
    run: `UPDATE ai_providers SET
      talking_enabled = 1,
      talking_base_url = 'https://api.x.ai',
      talking_api_key = COALESCE(NULLIF(talking_api_key,''), NULLIF(reel_api_key,''), NULLIF(txt2img_api_key,''), 'YOUR_API_KEY'),
      talking_auth_type = 'bearer',
      talking_auth_header_key = 'Authorization',
      talking_auth_header_prefix = 'Bearer',
      talking_create_endpoint = '/v1/videos/generations',
      talking_create_method = 'POST',
      talking_create_payload = '{"model":"grok-imagine-video","prompt":"The person in the image talks directly to the camera and says: {{text}}. Natural lip movement, clear speech, realistic talking-head.","image":{"url":"{{imageUrl}}"},"duration":8,"aspect_ratio":"{{aspectRatio}}","resolution":"720p"}',
      talking_job_id_path = 'request_id',
      talking_status_endpoint = '/v1/videos/{{taskId}}',
      talking_status_method = 'GET',
      talking_state_path = 'status',
      talking_success_state = 'done',
      talking_failed_state = 'failed',
      talking_result_path = 'video.url',
      txt2txt_enabled = 1,
      txt2txt_base_url = COALESCE(NULLIF(txt2txt_base_url,''), 'https://api.x.ai'),
      txt2txt_api_key = COALESCE(NULLIF(txt2txt_api_key,''), NULLIF(txt2img_api_key,''), 'YOUR_API_KEY'),
      txt2txt_auth_type = 'bearer',
      txt2txt_auth_header_key = 'Authorization',
      txt2txt_auth_header_prefix = 'Bearer',
      txt2txt_create_endpoint = '/v1/chat/completions',
      txt2txt_create_method = 'POST',
      txt2txt_create_payload = '{"model":"grok-3-mini","messages":[{"role":"user","content":"{{prompt}}"}]}',
      txt2txt_result_path = 'choices[0].message.content'
    WHERE provider_key = 'xai_grok';`,
    check: "SELECT id FROM ai_providers WHERE provider_key='xai_grok' AND (talking_enabled=0 OR txt2txt_enabled=0 OR talking_create_endpoint IS NULL OR talking_create_endpoint='' OR talking_job_id_path='jobId') LIMIT 1;",
    runWhenExists: true,
  },

  // D-ID — fast lip-sync talking (motion from photo + TTS), not full video generation
  {
    run: `INSERT INTO ai_providers (
    name, provider_key, is_active, is_default,
    txt2img_enabled, img2img_enabled, reel_enabled, showcase_enabled, talking_enabled,
    talking_base_url, talking_api_key,
    talking_auth_type, talking_auth_header_key, talking_auth_header_prefix,
    talking_create_endpoint, talking_create_method, talking_create_payload,
    talking_job_id_path, talking_status_endpoint, talking_status_method,
    talking_state_path, talking_success_state, talking_failed_state, talking_result_path
  ) VALUES (
    'D-ID Lip Sync', 'd_id', 0, 0,
    0, 0, 0, 0, 1,
    'https://api.d-id.com', 'YOUR_API_KEY',
    'basic', 'Authorization', '',
    '/talks', 'POST',
    '{"source_url":"{{imageUrl}}","script":{"type":"text","input":"{{text}}","provider":{"type":"microsoft","voice_id":"{{voice}}"}},"config":{"stitch":true}}',
    'id', '/talks/{{taskId}}', 'GET',
    'status', 'done', 'error,rejected', 'result_url'
  );`,
    check: "SELECT * FROM ai_providers WHERE provider_key='d_id' LIMIT 1;",
  },

  {
    run: "ALTER TABLE `web_private` ADD COLUMN `book_writer_maker` VARCHAR(255) DEFAULT '2';",
    check: "SHOW COLUMNS FROM `web_private` LIKE 'book_writer_maker';",
  },

  {
    run: `CREATE TABLE books (
      id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
      uid VARCHAR(255) NOT NULL,
      title VARCHAR(500) NOT NULL,
      author_name VARCHAR(255) DEFAULT 'Anonymous',
      genre VARCHAR(100) DEFAULT 'Fiction',
      language VARCHAR(50) DEFAULT 'English',
      tone VARCHAR(100) DEFAULT 'engaging',
      page_count INT DEFAULT 8,
      synopsis TEXT NULL,
      pages LONGTEXT NULL,
      credits INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'processing',
      provider VARCHAR(255) NULL,
      error_msg TEXT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (uid),
      INDEX (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    check: "SHOW TABLES LIKE 'books';",
  },

  {
    run: "ALTER TABLE `books` ADD COLUMN `cover_image` VARCHAR(500) DEFAULT NULL;",
    check: "SHOW COLUMNS FROM `books` LIKE 'cover_image';",
  },

  // Text chat with influencers (replaces talking-video UX)
  {
    run: `CREATE TABLE influencer_chat_messages (
      id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
      uid VARCHAR(255) NOT NULL,
      influencer_id INT NOT NULL,
      role VARCHAR(20) NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_chat_uid_inf (uid, influencer_id, id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    check: "SHOW TABLES LIKE 'influencer_chat_messages';",
  },

  // Google Imagen is paid-only — keep images on xAI Grok
  {
    run: `UPDATE ai_providers SET txt2img_enabled = 0, img2img_enabled = 0
      WHERE provider_key = 'google' AND (txt2img_enabled = 1 OR img2img_enabled = 1)`,
    check: `SELECT id FROM ai_providers WHERE provider_key = 'google' AND (txt2img_enabled = 1 OR img2img_enabled = 1) LIMIT 1`,
    runWhenExists: true,
  },
  {
    run: `UPDATE ai_providers SET is_active = 1, is_default = 1
      WHERE provider_key = 'xai_grok'
        AND txt2img_api_key IS NOT NULL
        AND txt2img_api_key <> ''
        AND txt2img_api_key <> 'YOUR_API_KEY'
        AND is_default = 0`,
    check: `SELECT id FROM ai_providers WHERE provider_key = 'xai_grok'
      AND txt2img_api_key IS NOT NULL AND txt2img_api_key <> '' AND txt2img_api_key <> 'YOUR_API_KEY'
      AND is_default = 0 LIMIT 1`,
    runWhenExists: true,
  },
  {
    run: `UPDATE ai_providers SET is_default = 0
      WHERE provider_key = 'google' AND is_default = 1
        AND EXISTS (
          SELECT 1 FROM (SELECT id FROM ai_providers WHERE provider_key = 'xai_grok' AND is_default = 1) t
        )`,
    check: `SELECT id FROM ai_providers WHERE provider_key = 'google' AND is_default = 1
      AND EXISTS (SELECT 1 FROM ai_providers g WHERE g.provider_key = 'xai_grok' AND g.is_default = 1) LIMIT 1`,
    runWhenExists: true,
  },

];

const initDatabase = async () => {
  try {
    for (const query of queries) {
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query(query.check);
        const shouldRun = query.runWhenExists
          ? rows.length > 0
          : rows.length === 0;
        if (shouldRun) {
          await connection.query(query.run);
          console.log("Query executed:", query.run.substring(0, 50) + "...");
        }
      } catch (err) {
        console.warn("Init query skipped/failed:", err.message);
      } finally {
        connection.release();
      }
    }

    // Merge legacy google_veo + google_gemini into one google provider
    try {
      const { mergeGoogleProviders } = require("../scripts/mergeGoogleProviders");
      const result = await mergeGoogleProviders(db);
      if (result?.merged) {
        console.log("Merged Google providers into single 'google' entry");
      }
    } catch (err) {
      console.warn("Google provider merge skipped:", err.message);
    }

    console.log("Database initialization completed");
  } catch (error) {
    console.error("Database initialization error:", error.message);
  }
};

// initDatabase();

module.exports = { db, initDatabase, queries, getQueries: () => queries };
