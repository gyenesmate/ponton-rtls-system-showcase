<?php
/**
 * Shortcode: [rtls_showcase scenario="uwb-positioning"]
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Rtls_Showcase_Shortcode {

	public static function init() {
		add_shortcode( 'rtls_showcase', array( __CLASS__, 'render' ) );
		// Backward-compatible alias for the previous plugin shortcode.
		add_shortcode( 'rtls_warehouse', array( __CLASS__, 'render_legacy' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'maybe_enqueue' ), 20 );
	}

	public static function maybe_enqueue() {
		$should_enqueue = Rtls_Showcase_Assets::content_has_shortcode();

		if ( defined( 'RTLS_SHOWCASE_ALWAYS_ENQUEUE' ) && RTLS_SHOWCASE_ALWAYS_ENQUEUE ) {
			$should_enqueue = true;
		}

		$should_enqueue = (bool) apply_filters( 'rtls_showcase_should_enqueue', $should_enqueue );

		if ( $should_enqueue ) {
			Rtls_Showcase_Assets::enqueue();
		}
	}

	/**
	 * Legacy shortcode maps to the UWB positioning warehouse scenario.
	 *
	 * @param array|string $atts Shortcode attributes.
	 * @return string
	 */
	public static function render_legacy( $atts = array() ) {
		$atts = shortcode_atts(
			array(
				'height'     => '640px',
				'min_height' => '420px',
				'quality'    => 'medium',
				'class'      => '',
				'scenario'   => 'uwb-positioning',
			),
			$atts,
			'rtls_warehouse'
		);

		return self::render( $atts );
	}

	/**
	 * @param array|string $atts Shortcode attributes.
	 * @return string
	 */
	public static function render( $atts = array() ) {
		Rtls_Showcase_Assets::enqueue();

		$atts = shortcode_atts(
			array(
				'scenario'   => Rtls_Showcase::DEFAULT_SCENARIO,
				'height'     => '640px',
				'min_height' => '420px',
				'quality'    => 'medium',
				'class'      => '',
			),
			$atts,
			'rtls_showcase'
		);

		$scenario = Rtls_Showcase::sanitize_scenario( $atts['scenario'] );
		$quality  = in_array( $atts['quality'], array( 'high', 'medium', 'low' ), true )
			? $atts['quality']
			: 'medium';

		$classes = trim( 'rtls-showcase ' . sanitize_html_class( $atts['class'] ) );
		$style   = sprintf(
			'--rtls-height:%s;--rtls-min-height:%s;',
			esc_attr( $atts['height'] ),
			esc_attr( $atts['min_height'] )
		);

		return sprintf(
			'<div class="%1$s" style="%2$s" data-scenario="%3$s" data-quality="%4$s" aria-label="RTLS showcase"></div>',
			esc_attr( $classes ),
			esc_attr( $style ),
			esc_attr( $scenario ),
			esc_attr( $quality )
		);
	}
}
