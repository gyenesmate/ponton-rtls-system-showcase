<?php
/**
 * Registers and enqueues Vite production assets from dist/.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Rtls_Showcase_Assets {

	const SCRIPT_HANDLE = 'rtls-showcase';
	const STYLE_HANDLE  = 'rtls-showcase';

	public static function init() {
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register' ), 5 );
		add_filter( 'script_loader_tag', array( __CLASS__, 'module_type' ), 10, 3 );
	}

	public static function register() {
		$js_path  = RTLS_SHOWCASE_PATH . 'dist/rtls-showcase.js';
		$css_path = RTLS_SHOWCASE_PATH . 'dist/rtls-showcase.css';

		if ( ! file_exists( $js_path ) ) {
			return;
		}

		$version = RTLS_SHOWCASE_VERSION;
		$version .= '.' . (string) filemtime( $js_path );

		wp_register_script(
			self::SCRIPT_HANDLE,
			RTLS_SHOWCASE_URL . 'dist/rtls-showcase.js',
			array(),
			$version,
			true
		);

		if ( file_exists( $css_path ) ) {
			wp_register_style(
				self::STYLE_HANDLE,
				RTLS_SHOWCASE_URL . 'dist/rtls-showcase.css',
				array(),
				$version
			);
		}
	}

	public static function enqueue() {
		wp_enqueue_script( self::SCRIPT_HANDLE );
		wp_enqueue_style( self::STYLE_HANDLE );
	}

	/**
	 * Loads the Vite ES bundle as a module.
	 *
	 * @param string $tag    Script tag HTML.
	 * @param string $handle Script handle.
	 * @param string $src    Script source URL.
	 * @return string
	 */
	public static function module_type( $tag, $handle, $src ) {
		if ( self::SCRIPT_HANDLE !== $handle ) {
			return $tag;
		}

		return sprintf(
			'<script type="module" src="%s" id="%s-js"></script>' . "\n",
			esc_url( $src ),
			esc_attr( $handle )
		);
	}

	/**
	 * Whether the shortcode is present on the current singular post.
	 *
	 * @return bool
	 */
	public static function content_has_shortcode() {
		global $post;

		if ( ! ( $post instanceof WP_Post ) ) {
			return false;
		}

		return has_shortcode( $post->post_content, 'rtls_showcase' )
			|| has_shortcode( $post->post_content, 'rtls_warehouse' );
	}
}
