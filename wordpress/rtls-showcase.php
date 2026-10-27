<?php
/**
 * Plugin Name: RTLS Showcase
 * Description: Modular Vite-built RTLS showcase engine for Avada/WordPress. Select scenarios via shortcode or data-scenario.
 * Version: 1.1.0
 * Author: Máté Gyenes
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Text Domain: rtls-showcase
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'RTLS_SHOWCASE_VERSION', '1.1.0' );
define( 'RTLS_SHOWCASE_FILE', __FILE__ );
define( 'RTLS_SHOWCASE_URL', plugin_dir_url( __FILE__ ) );
define( 'RTLS_SHOWCASE_PATH', plugin_dir_path( __FILE__ ) );

require_once RTLS_SHOWCASE_PATH . 'includes/class-rtls-showcase.php';
require_once RTLS_SHOWCASE_PATH . 'includes/class-assets.php';
require_once RTLS_SHOWCASE_PATH . 'includes/class-shortcode.php';

Rtls_Showcase::instance();
