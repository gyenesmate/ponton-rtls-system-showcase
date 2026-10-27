<?php
/**
 * Plugin bootstrap.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Rtls_Showcase {

	/**
	 * Supported scenario keywords. Keep in sync with src/scenarios/index.js.
	 */
	const SCENARIOS = array(
		'developer',
	);

	const DEFAULT_SCENARIO = 'developer';

	/**
	 * @var Rtls_Showcase|null
	 */
	private static $instance = null;

	/**
	 * @return Rtls_Showcase
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		Rtls_Showcase_Assets::init();
		Rtls_Showcase_Shortcode::init();
	}

	/**
	 * Sanitizes a scenario keyword. Unknown values fall back to the default.
	 *
	 * @param string $scenario Raw scenario value.
	 * @return string
	 */
	public static function sanitize_scenario( $scenario ) {
		$scenario = sanitize_key( (string) $scenario );

		if ( in_array( $scenario, self::SCENARIOS, true ) ) {
			return $scenario;
		}

		return self::DEFAULT_SCENARIO;
	}
}
