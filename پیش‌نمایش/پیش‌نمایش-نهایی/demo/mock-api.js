/**
 * بچرخون — رهگیر REST برای دموی مرورگری
 * ---------------------------------------------------------------------------
 * این فایل قبل از دارایی‌های UI بارگذاری می‌شود و window.fetch را می‌گیرد.
 * هر درخواست به `becharkhoon/v1/*` با پاسخِ محلی جواب می‌گیرد؛ هیچ درخواستی
 * به شبکه نمی‌رود. شکل پاسخ‌ها از Rest.php / Stats.php / Settings.php کپی شده
 * تا با rendererهای واقعی پنل سازگار باشد.
 *
 * داده‌ها نمونه‌اند: فروشگاه demo-shop.ir، بدون هیچ دادهٔ واقعی یا کلید.
 */
( function ( w ) {
	'use strict';

	var ROOT = 'becharkhoon/v1/';
	var REAL_FETCH = w.fetch.bind( w );

	/* ---------------------------------------------------------------- helpers */
	function clone( o ) {
		return JSON.parse( JSON.stringify( o ) );
	}
	function pad( n ) {
		return ( n < 10 ? '0' : '' ) + n;
	}
	function ymd( d ) {
		return d.getUTCFullYear() + '-' + pad( d.getUTCMonth() + 1 ) + '-' + pad( d.getUTCDate() );
	}
	function today() {
		return ymd( new Date() );
	}
	function daysAgo( n ) {
		var d = new Date();
		d.setUTCDate( d.getUTCDate() - n );
		return d;
	}
	/** Deterministic pseudo-random so screenshots stay identical between reloads. */
	function rnd( seed ) {
		var x = Math.sin( seed * 12.9898 ) * 43758.5453;
		return x - Math.floor( x );
	}
	function ok( data, status ) {
		return Promise.resolve( new Response( JSON.stringify( data ), {
			status: status || 200,
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
		} ) );
	}
	function fail( message, status ) {
		return Promise.resolve( new Response( JSON.stringify( { code: 'demo', message: message } ), {
			status: status || 403,
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
		} ) );
	}
	var DISABLED = 'این عمل در دموی مرورگری غیرفعال است؛ روی سایت واقعی اجرا می‌شود.';

	/* ---------------------------------------------------------------- fixtures */
	var SITE = {
		name: 'فروشگاه نمونه',
		url: 'https://demo-shop.ir/',
		locale: 'fa_IR',
		tz: 'Asia/Tehran',
	};

	/* ۳۶ تم واقعی — از assets/data/themes.json نسخهٔ ۱.۸.۰ (themes-data.js) */
	var THEMES = w.BCH_THEMES || [];

	var TEMPLATES = [
		{ key: 'welcome', title: 'خوش‌آمدگویی', desc: 'برای بازدیدکنندهٔ تازه', theme: 'classic' },
		{ key: 'first_order', title: 'اولین سفارش', desc: 'شانس هدیه بعد از خرید اول', theme: 'forest' },
		{ key: 'big_order', title: 'سفارش بزرگ', desc: 'پاداش سفارش بالای مبلغ مشخص', theme: 'bgold' },
		{ key: 'every_amount', title: 'هر مبلغی', desc: 'شانس به ازای هر مبلغ خرید', theme: 'ocean' },
		{ key: 'exit_intent', title: 'قصد خروج', desc: 'وقتی موس به سمت بستن تب می‌رود', theme: 'neon' },
		{ key: 'daily_member', title: 'عضو روزانه', desc: 'یک شانس هر روز', theme: 'candy' },
		{ key: 'vip', title: 'مشتری ویژه', desc: 'برای مشتریان با ارزش بالا', theme: 'royal' },
		{ key: 'review', title: 'نظر و امتیاز', desc: 'پاداش ثبت نظر', theme: 'pastel' },
		{ key: 'referral', title: 'معرفی دوست', desc: 'شانس برای معرف', theme: 'sunset' },
		{ key: 'yalda', title: 'یلدا', desc: 'کمپین شب یلدا', theme: 'yalda' },
		{ key: 'nowruz', title: 'نوروز', desc: 'کمپین عید', theme: 'nowruz' },
		{ key: 'black_friday', title: 'بلک فرایدی', desc: 'فروش ویژه', theme: 'black_friday' },
	];

	var SMS = {
		smsir: { name: 'SMS.ir', fields: [ 'key', 'line' ] },
		ippanel: { name: 'IPPANEL', fields: [ 'username', 'password', 'from' ] },
		kavenegar: { name: 'کاوه‌نگار', fields: [ 'api_key', 'sender' ] },
		faraz: { name: 'فراز‌اسمس', fields: [ 'username', 'password' ] },
		melipayamak: { name: 'ملی‌پیامک', fields: [ 'username', 'password', 'from' ] },
		ghasedak: { name: 'قاصدک', fields: [ 'api_key' ] },
		magfa: { name: 'مگفا', fields: [ 'username', 'password', 'domain' ] },
		generic: { name: 'پنل عمومی (Generic)', fields: [ 'url', 'method', 'token' ] },
	};

	var CONDITIONS = {};
	[
		[ 'logged_in', 'user', 'bool', 'self::BOOL' ],
		[ 'user_role', 'user', 'roles', 'self::LIST' ],
		[ 'orders_count', 'user', 'number', 'self::NUM' ],
		[ 'total_spent', 'user', 'number', 'self::NUM' ],
		[ 'first_order', 'user', 'bool', 'self::BOOL' ],
		[ 'member_level', 'user', 'text', 'self::LIST' ],
		[ 'user_city', 'user', 'text', 'self::TEXT' ],
		[ 'phone_verified', 'user', 'bool', 'self::BOOL' ],
		[ 'returning', 'user', 'bool', 'self::BOOL' ],
		[ 'has_spins', 'user', 'bool', 'self::BOOL' ],
		[ 'cart_total', 'cart', 'number', 'self::NUM' ],
		[ 'cart_items', 'cart', 'number', 'self::NUM' ],
		[ 'cart_product', 'cart', 'products', 'self::LIST' ],
		[ 'cart_category', 'cart', 'terms', 'self::LIST' ],
		[ 'cart_coupon', 'cart', 'text', 'self::LIST' ],
		[ 'order_status', 'order', 'text', 'self::LIST' ],
		[ 'payment_method', 'order', 'text', 'self::LIST' ],
		[ 'shipping_method', 'order', 'text', 'self::LIST' ],
		[ 'last_order_total', 'order', 'number', 'self::NUM' ],
		[ 'last_order_days', 'order', 'number', 'self::NUM' ],
		[ 'source', 'visitor', 'text', 'self::LIST' ],
		[ 'utm_campaign', 'visitor', 'text', 'self::TEXT' ],
		[ 'device', 'visitor', 'text', 'self::LIST' ],
		[ 'browser', 'visitor', 'text', 'self::LIST' ],
		[ 'country', 'visitor', 'text', 'self::LIST' ],
		[ 'is_new_visitor', 'visitor', 'bool', 'self::BOOL' ],
		[ 'hour_range', 'time', 'range', 'self::RANGE' ],
		[ 'weekday', 'time', 'text', 'self::LIST' ],
		[ 'jalali_date', 'time', 'range', 'self::RANGE' ],
		[ 'occasion', 'time', 'text', 'self::LIST' ],
	].forEach( function ( c ) {
		CONDITIONS[ c[ 0 ] ] = { group: c[ 1 ], input: c[ 2 ], ops: c[ 3 ], ctx: 'any' };
	} );

	var PRIZE_TYPES = [ 'coupon_percent', 'coupon_fixed_cart', 'coupon_fixed_product', 'free_shipping',
		'existing_coupon', 'free_product', 'wallet', 'points', 'extra_spin', 'code_pool', 'custom',
		'link', 'lose', 'respin' ];

	var SETTINGS = {
		enabled: true, test_mode: false, ui_language: 'auto', admin_theme: 'light', admin_webfont: false,
		brand_name: '', front_font: 'vazirmatn', front_font_url: '', load_front_webfont: false,
		persian_digits: true, jalali_dates: true, currency_label: 'تومان', powered_by: false,
		z_index: 999999, cache_bust: true, ajax_mode: 'admin-ajax', fast_boot: false,
		sms_magic_link: true, otp_site_login: true, otp_register: true, sms_magic_days: 30,
		tracking_enabled: true, track_sample: 100, respect_dnt: false, data_retention_days: 0,
		log_retention_days: 60, coupon_cleanup_days: 30, delete_on_uninstall: false,
		myaccount_tab: true, myaccount_title: '', myaccount_slug: 'lucky-wheel', myaccount_position: 3,
		thankyou_notice: true, cart_notice: true, auto_apply_param: 'bch_apply', open_param: 'bch_open',
		referral_enabled: false, referral_param: 'bref', referral_cookie_days: 30,
		order_statuses: [ 'processing', 'completed' ], revoke_on_refund: true,
		rate_limit_per_minute: 20, ip_daily_limit: 0, block_ips: '', block_emails: '', block_phones: '',
		email_domain_mode: 'off', email_domains: '', block_disposable: true, check_mx: false,
		honeypot: true, min_fill_seconds: 2, captcha: 'off', captcha_site_key: '', captcha_secret: '',
		recaptcha_threshold: 0.5, ip_source: 'auto', phone_country: 'IR',
		sms_enabled: true, sms_test_mode: false, sms_driver: 'kavenegar', sms_fields: { kavenegar: { api_key: '••••••••', sender: '3000xxxx' } },
		admin_phones: '', sms_tpl: {}, sms_log_days: 180, otp_length: 5, otp_ttl: 180,
		otp_resend: 60, otp_max_attempts: 5, otp_daily_per_phone: 6,
		email_from_name: 'فروشگاه نمونه', email_from_address: 'shop@demo-shop.ir',
		email_template: 'branded', email_logo: '', email_color: '#1D4ED8', email_footer: '',
		admin_emails: '', bale_token: '', bale_chat_id: '', telegram_token: '', telegram_chat_id: '',
		telegram_api: 'https://api.telegram.org', webhooks: [], wallet_provider: 'auto',
		points_provider: 'auto',
	};

	var SLICE_DEFAULTS = { label: 'جایزه', prize_type: 'custom', weight: 10, stock: 0, color: '#1D4ED8', icon: '' };

	function slices() {
		return [
			{ id: 1, label: 'کوپن ۱۵٪', prize_type: 'coupon_percent', amount: 15, cap: 200000, weight: 18, color: '#10B981', icon: 'percent', stock: 50 },
			{ id: 2, label: 'ارسال رایگان', prize_type: 'free_shipping', amount: 0, weight: 14, color: '#0EA5E9', icon: 'truck', stock: 80 },
			{ id: 3, label: '۵۰ هزار تومان', prize_type: 'coupon_fixed_cart', amount: 50000, weight: 12, color: '#F59E0B', icon: 'wallet', stock: 30 },
			{ id: 4, label: 'امتیاز باشگاه', prize_type: 'points', amount: 120, weight: 10, color: '#8B5CF6', icon: 'star', stock: 100 },
			{ id: 5, label: 'پوچ', prize_type: 'lose', amount: 0, weight: 26, color: '#E2E8F0', icon: 'x', stock: 0 },
			{ id: 6, label: 'محصول هدیه', prize_type: 'free_product', amount: 0, weight: 6, color: '#EC4899', icon: 'gift', stock: 15 },
			{ id: 7, label: 'کوپن ۱۰٪', prize_type: 'coupon_percent', amount: 10, cap: 150000, weight: 10, color: '#3CC47E', icon: 'percent', stock: 60 },
			{ id: 8, label: 'چرخش مجدد', prize_type: 'respin', amount: 0, weight: 4, color: '#64748B', icon: 'rotate', stock: 0 },
		];
	}

	/* پیش‌فرض‌های واقعی گردونه — استخراج‌شده از Schema::defaults() افزونه */
	var CONFIG_DEFAULTS = {
	 "design": {
	  "theme": "classic",
	  "size": 400,
	  "size_mobile": 300,
	  "palette": [
	   "#1D4ED8",
	   "#F59E0B",
	   "#10B981",
	   "#EF4444",
	   "#8B5CF6",
	   "#0EA5E9",
	   "#EC4899",
	   "#F97316"
	  ],
	  "text_color": "#ffffff",
	  "font_size": 15,
	  "font_weight": 800,
	  "text_orientation": "radial",
	  "text_position": 0.6,
	  "text_shadow": true,
	  "icon_size": 22,
	  "slice_border_color": "rgba(255,255,255,.35)",
	  "slice_border_width": 2,
	  "slice_gradient": true,
	  "gloss": true,
	  "shadow": true,
	  "glow": true,
	  "glow_color": "rgba(29,78,216,.45)",
	  "rim_style": "lights",
	  "rim_color": "#0B1B3F",
	  "rim_color2": "#1D4ED8",
	  "rim_width": 16,
	  "light_color": "#FFF7CC",
	  "light_color2": "#FBBF24",
	  "light_count": 16,
	  "light_animation": "chase",
	  "pegs": true,
	  "center_style": "button",
	  "center_color": "#ffffff",
	  "center_color2": "#dbeafe",
	  "center_border": "#0B1B3F",
	  "center_size": 0.2,
	  "center_image": "",
	  "center_text": "بچرخون",
	  "center_text_color": "#0B1B3F",
	  "center_clickable": true,
	  "pointer_style": "arrow",
	  "pointer_position": "top",
	  "pointer_color": "#EF4444",
	  "pointer_stroke": "#ffffff",
	  "pointer_image": "",
	  "pointer_size": 1,
	  "pointer_bounce": true,
	  "custom_mode": false,
	  "custom_image": "",
	  "custom_offset": 0,
	  "custom_labels": false,
	  "frame_image": "",
	  "spin_duration": 6,
	  "spin_rotations": 8,
	  "spin_easing": "quint",
	  "idle_rotate": true,
	  "idle_speed": 30,
	  "land_random": true,
	  "win_effect": "confetti",
	  "win_emoji": "🎉",
	  "lose_effect": "shake",
	  "highlight_win": true,
	  "dim_others": true,
	  "sound": true,
	  "sound_tick": true,
	  "sound_win": true,
	  "sound_lose": true,
	  "sound_volume": 0.5,
	  "sound_tick_url": "",
	  "sound_win_url": "",
	  "sound_lose_url": "",
	  "mute_button": true,
	  "reduce_motion": true
	 },
	 "popup": {
	  "mode": "modal",
	  "layout": "split",
	  "wheel_side": "start",
	  "width": 880,
	  "radius": 24,
	  "padding": 32,
	  "bg_type": "gradient",
	  "bg_color": "#ffffff",
	  "bg_color2": "#eff6ff",
	  "bg_angle": 135,
	  "bg_image": "",
	  "bg_image_opacity": 1,
	  "pattern": "confetti",
	  "pattern_color": "rgba(29,78,216,.10)",
	  "text_color": "#0f172a",
	  "muted_color": "#64748b",
	  "accent_color": "#1D4ED8",
	  "border_color": "transparent",
	  "border_width": 0,
	  "shadow": "xl",
	  "overlay_color": "#0b1220",
	  "overlay_opacity": 0.62,
	  "overlay_blur": 4,
	  "close_overlay": true,
	  "close_esc": true,
	  "anim_in": "zoom",
	  "anim_out": "fade",
	  "anim_duration": 450,
	  "close_show": true,
	  "close_position": "end",
	  "close_style": "circle",
	  "close_color": "#334155",
	  "close_bg": "rgba(15,23,42,.06)",
	  "close_delay": 0,
	  "logo": "",
	  "logo_width": 110,
	  "badge": "فقط امروز",
	  "badge_bg": "#FEF3C7",
	  "badge_color": "#B45309",
	  "title": "گردونه شانس رو بچرخون! 🎁",
	  "title_color": "#0f172a",
	  "title_size": 28,
	  "title_weight": 900,
	  "subtitle": "همین حالا شانس‌ات رو امتحان کن و تخفیف ویژه بگیر",
	  "subtitle_color": "#334155",
	  "description": "شماره موبایل‌ات را وارد کن و گردونه را بچرخان. جایزه‌ات فوراً نمایش داده و پیامک می‌شود.",
	  "countdown": false,
	  "countdown_mode": "evergreen",
	  "countdown_minutes": 15,
	  "countdown_deadline": "",
	  "countdown_label": "فرصت باقی‌مانده:",
	  "countdown_style": "boxes",
	  "social_proof": true,
	  "social_text": "{count} نفر امروز گردونه را چرخاندند",
	  "social_min": 3,
	  "ticker": false,
	  "ticker_text": "{name} برنده «{prize}» شد",
	  "ticker_count": 10,
	  "trust_items": [],
	  "footer_text": "",
	  "no_thanks": true,
	  "no_thanks_text": "نه ممنون، بعداً",
	  "no_thanks_days": 3,
	  "font_scale": 1,
	  "direction": "auto",
	  "mobile_mode": "sheet",
	  "mobile_hide_desc": false,
	  "mobile_wheel_first": true,
	  "fit_screen": true,
	  "custom_css": "",
	  "custom_class": "",
	  "code_style": "dashed",
	  "code_bg": "",
	  "code_border": "",
	  "code_color": "",
	  "copy_bg": "",
	  "copy_color": "",
	  "apply_bg": "",
	  "apply_bg2": "",
	  "apply_color": "",
	  "ghost_color": "",
	  "link_color": "",
	  "msg_bg": "",
	  "msg_color": "",
	  "icon_login": "🔐",
	  "icon_wait": "⏳",
	  "icon_earn": "🎟️",
	  "icon_closed": "🏁",
	  "next_color": "",
	  "share_style": "brand",
	  "ticker_bg": "",
	  "ticker_color": "",
	  "social_color": "",
	  "social_dot_color": "#22c55e",
	  "countdown_bg": "",
	  "countdown_color": ""
	 },
	 "form": {
	  "fields": [
	   {
	    "id": "name",
	    "type": "text",
	    "map": "name",
	    "label": "نام",
	    "placeholder": "نام شما",
	    "required": false,
	    "enabled": true,
	    "width": "full",
	    "help": "",
	    "value": "",
	    "options": [],
	    "pattern": "",
	    "maxlength": 0,
	    "min": 0,
	    "max": 0,
	    "css": "",
	    "autofill": ""
	   },
	   {
	    "id": "phone",
	    "type": "tel",
	    "map": "phone",
	    "label": "شماره موبایل",
	    "placeholder": "09xxxxxxxxx",
	    "required": true,
	    "enabled": true,
	    "width": "full",
	    "help": "",
	    "value": "",
	    "options": [],
	    "pattern": "",
	    "maxlength": 0,
	    "min": 0,
	    "max": 0,
	    "css": "",
	    "autofill": ""
	   },
	   {
	    "id": "email",
	    "type": "email",
	    "map": "email",
	    "label": "ایمیل",
	    "placeholder": "you@example.com",
	    "required": false,
	    "enabled": false,
	    "width": "full",
	    "help": "",
	    "value": "",
	    "options": [],
	    "pattern": "",
	    "maxlength": 0,
	    "min": 0,
	    "max": 0,
	    "css": "",
	    "autofill": ""
	   }
	  ],
	  "phone_otp": false,
	  "prefill_user": true,
	  "hide_known": true,
	  "consent": {
	   "enabled": false,
	   "required": true,
	   "text": "با <a href=\"/terms\" target=\"_blank\">قوانین و شرایط</a> موافقم"
	  },
	  "marketing": {
	   "enabled": false,
	   "checked": true,
	   "text": "پیشنهادهای ویژه را برایم پیامک کن"
	  },
	  "button_text": "بچرخون!",
	  "button_bg": "#1D4ED8",
	  "button_bg2": "#7C3AED",
	  "button_color": "#ffffff",
	  "button_radius": 14,
	  "button_size": "lg",
	  "button_animation": "shine",
	  "button_full": true,
	  "field_bg": "#ffffff",
	  "field_border": "#d7dbe7",
	  "field_text": "#0f172a",
	  "field_radius": 12,
	  "otp_send_text": "ارسال کد تایید",
	  "otp_label": "کد تایید پیامک‌شده",
	  "login_text": "برای چرخاندن گردونه وارد حساب کاربری شوید",
	  "login_button": "ورود / ثبت‌نام",
	  "login_url": "",
	  "otp_bg": "",
	  "otp_color": "",
	  "label_color": ""
	 },
	 "display": {
	  "mode": "popup",
	  "on_load": true,
	  "delay": 6,
	  "delay_max": 0,
	  "scroll": false,
	  "scroll_percent": 40,
	  "exit_intent": true,
	  "exit_mobile": true,
	  "inactivity": false,
	  "inactivity_seconds": 30,
	  "pageviews": 0,
	  "click_selector": "",
	  "add_to_cart": false,
	  "thankyou": true,
	  "frequency": "days",
	  "frequency_days": 1,
	  "max_impressions": 0,
	  "hide_after_close_days": 1,
	  "hide_after_spin_days": 0,
	  "hide_when_no_spins": false,
	  "devices": [
	   "desktop",
	   "tablet",
	   "mobile"
	  ],
	  "launcher": true,
	  "launcher_position": "bottom-start",
	  "launcher_style": "wheel",
	  "launcher_image": "",
	  "launcher_text": "گردونه شانس",
	  "launcher_bg": "#1D4ED8",
	  "launcher_color": "#ffffff",
	  "launcher_size": 62,
	  "launcher_animation": "spin",
	  "launcher_badge": true,
	  "launcher_hide_after_spin": false,
	  "launcher_offset_x": 20,
	  "launcher_offset_y": 20,
	  "launcher_mobile": true,
	  "launcher_desktop": true,
	  "launcher_delay": 0,
	  "coupon_bar": true,
	  "coupon_bar_position": "bottom",
	  "coupon_bar_text": "🎁 کد {code} ({prize}) برای شما فعال است",
	  "coupon_bar_bg": "#0B1B3F",
	  "coupon_bar_color": "#ffffff",
	  "coupon_bar_countdown": true,
	  "coupon_bar_apply": true,
	  "coupon_bar_layout": "full",
	  "coupon_bar_style": "solid",
	  "coupon_bar_bg2": "#1D4ED8",
	  "coupon_bar_icon": "",
	  "coupon_bar_code_style": "chip",
	  "coupon_bar_code_bg": "rgba(255,255,255,.14)",
	  "coupon_bar_code_color": "#FBBF24",
	  "coupon_bar_copy": true,
	  "coupon_bar_copy_label": "",
	  "coupon_bar_copy_bg": "",
	  "coupon_bar_copy_color": "",
	  "coupon_bar_apply_label": "",
	  "coupon_bar_apply_bg": "#ffffff",
	  "coupon_bar_apply_color": "#0f172a",
	  "coupon_bar_btn_radius": 999,
	  "coupon_bar_radius": 16,
	  "coupon_bar_font": 14,
	  "coupon_bar_shadow": "soft",
	  "coupon_bar_border": "",
	  "coupon_bar_close": true,
	  "coupon_bar_close_color": "",
	  "coupon_bar_cd_style": "text",
	  "coupon_bar_cd_color": "",
	  "coupon_bar_anim": "slide",
	  "coupon_bar_mobile_compact": true,
	  "coupon_bar_hide_applied": true,
	  "coupon_bar_account": true
	 },
	 "targeting": {
	  "pages": "all",
	  "page_rules": [],
	  "audience": {
	   "enabled": false,
	   "groups": []
	  },
	  "conditions": []
	 },
	 "access": {
	  "mode": "free",
	  "require_login": false,
	  "require_otp": false,
	  "limit_user": true,
	  "limit_phone": true,
	  "limit_email": true,
	  "limit_device": true,
	  "limit_ip": false,
	  "limits": [
	   {
	    "count": 1,
	    "period": "day",
	    "hours": 24
	   }
	  ],
	  "cooldown_minutes": 0,
	  "max_wins": 0,
	  "max_wins_period": "lifetime",
	  "credit_scope": "any",
	  "cap_credits": false,
	  "conditions": {
	   "enabled": false,
	   "groups": []
	  },
	  "blocked_roles": [],
	  "show_how_to_earn": true,
	  "earn_hint": ""
	 },
	 "engine": {
	  "first_spin_win": false,
	  "pity_after": 0,
	  "respin_counts": false,
	  "max_respins": 3,
	  "daily_win_cap": 0,
	  "total_win_cap": 0,
	  "fallback_slice": "",
	  "personal_odds": false,
	  "vip_boost": 0
	 },
	 "coupon": {
	  "prefix": "WHEEL-",
	  "length": 8,
	  "charset": "upper_num",
	  "expiry_days": 7,
	  "expiry_hours": 0,
	  "min_spend": 0,
	  "max_spend": 0,
	  "max_discount": 0,
	  "individual_use": true,
	  "exclude_sale": false,
	  "free_shipping": false,
	  "usage_limit": 1,
	  "usage_limit_user": 1,
	  "limit_items": 0,
	  "product_ids": [],
	  "exclude_product_ids": [],
	  "category_ids": [],
	  "exclude_category_ids": [],
	  "restrict_email": true,
	  "auto_apply": true,
	  "first_order_only": false,
	  "description": ""
	 },
	 "messages": {
	  "win_title": "تبریک {name}! 🎉",
	  "win_text": "شما برنده <b>{prize}</b> شدید",
	  "code_label": "کد جایزه شما",
	  "copy_text": "کپی",
	  "copied_text": "کپی شد ✓",
	  "apply_text": "اعمال در سبد خرید",
	  "apply_redirect": "cart",
	  "apply_url": "",
	  "continue_text": "ادامه خرید",
	  "expires_text": "معتبر تا {expiry}",
	  "lose_title": "ای بابا! 😅",
	  "lose_text": "این بار شانس با شما نبود. دفعه بعد حتماً!",
	  "respin_text": "یک شانس مجدد گرفتید، دوباره بچرخانید!",
	  "spins_left_text": "{n} شانس دیگر دارید",
	  "spin_again_text": "دوباره بچرخون",
	  "no_spins_text": "فعلاً شانسی برای چرخاندن ندارید.",
	  "cooldown_text": "شانس بعدی شما: {time}",
	  "limit_text": "سهمیه چرخاندن شما تمام شده است.",
	  "not_eligible_text": "این گردونه شامل حساب شما نمی‌شود.",
	  "closed_text": "این کمپین به پایان رسیده است.",
	  "earn_title": "چطور شانس چرخاندن بگیرم؟",
	  "earn_text": "",
	  "spinning_text": "در حال چرخش...",
	  "error_text": "خطایی رخ داد، دوباره تلاش کنید.",
	  "share_text": "دوستانت را دعوت کن و شانس بیشتر بگیر",
	  "gift_text": "🎁 این محصول برات جایزه اومد!",
	  "gift_hint": "کد را در سبد خرید بزنید تا محصول رایگان به سبدتان اضافه شود.",
	  "claim_title": "برای دریافت جایزه اطلاعات تحویل را وارد کنید",
	  "claim_button": "ثبت و دریافت جایزه",
	  "claim_success": "اطلاعات شما ثبت شد. به‌زودی با شما تماس می‌گیریم.",
	  "auto_close": 0,
	  "show_share": true
	 },
	 "notify": {
	  "email_customer": true,
	  "email_subject": "🎁 جایزه گردونه شانس شما: {prize}",
	  "email_heading": "تبریک! برنده شدید",
	  "email_body": "<p>سلام {name} عزیز،</p><p>شما در گردونه شانس {site} برنده <b>{prize}</b> شدید.</p><p>کد شما: <b>{code}</b></p><p>اعتبار تا: {expiry}</p>",
	  "email_button": "استفاده از جایزه",
	  "sms_customer": true,
	  "sms_override": false,
	  "credit_override": false,
	  "sms_mode": "text",
	  "sms_text": null,
	  "sms_pattern": "",
	  "sms_pattern_vars": "prize={prize}ncode={code}nexpiry={expiry}",
	  "sms_lose": false,
	  "sms_lose_text": "",
	  "admin_email": false,
	  "admin_sms": false,
	  "admin_messenger": false,
	  "admin_only_wins": true,
	  "reminder": false,
	  "reminder_days": 1,
	  "reminder_channel": "sms",
	  "reminder_text": "{name} عزیز، کد {code} ({prize}) فردا منقضی می‌شود. {link}",
	  "reminder_email_body": "",
	  "credit_sms": false,
	  "credit_text": null,
	  "webhooks": true
	 },
	 "schedule": {
	  "start": "",
	  "end": "",
	  "days": [
	   0,
	   1,
	   2,
	   3,
	   4,
	   5,
	   6
	  ],
	  "hour_from": 0,
	  "hour_to": 24
	 },
	 "advanced": {
	  "track_ga": true,
	  "track_pixel": false,
	  "redirect_win": "",
	  "shortcode_only": false,
	  "ab_weight": 50,
	  "inline_autoload": true,
	  "preload": false,
	  "landing_url": "",
	  "landing_open": false
	 },
	 "layout": {},
	 "responsive": {
	  "tablet": [],
	  "mobile": []
	 },
	 "slices": [
	  {
	   "id": "s1",
	   "label": "۱۰٪ تخفیف",
	   "weight": 30,
	   "stock": 0,
	   "highlight": false,
	   "icon": "",
	   "color": "",
	   "text_color": "",
	   "coupon_days": 0,
	   "product_id": 0,
	   "category_id": 0,
	   "url": "",
	   "code_pool": "",
	   "min_cart": 0,
	   "max_uses": 0,
	   "per_user": 0,
	   "points": 0,
	   "wallet": 0,
	   "image": "",
	   "desc": "",
	   "type": "coupon_percent",
	   "value": 10
	  },
	  {
	   "id": "s2",
	   "label": "پوچ",
	   "weight": 25,
	   "stock": 0,
	   "highlight": false,
	   "icon": "😅",
	   "color": "",
	   "text_color": "",
	   "coupon_days": 0,
	   "product_id": 0,
	   "category_id": 0,
	   "url": "",
	   "code_pool": "",
	   "min_cart": 0,
	   "max_uses": 0,
	   "per_user": 0,
	   "points": 0,
	   "wallet": 0,
	   "image": "",
	   "desc": "",
	   "type": "lose",
	   "value": 0
	  },
	  {
	   "id": "s3",
	   "label": "۱۵٪ تخفیف",
	   "weight": 15,
	   "stock": 0,
	   "highlight": false,
	   "icon": "",
	   "color": "",
	   "text_color": "",
	   "coupon_days": 0,
	   "product_id": 0,
	   "category_id": 0,
	   "url": "",
	   "code_pool": "",
	   "min_cart": 0,
	   "max_uses": 0,
	   "per_user": 0,
	   "points": 0,
	   "wallet": 0,
	   "image": "",
	   "desc": "",
	   "type": "coupon_percent",
	   "value": 15
	  },
	  {
	   "id": "s4",
	   "label": "ارسال رایگان",
	   "weight": 12,
	   "stock": 0,
	   "highlight": false,
	   "icon": "🚚",
	   "color": "",
	   "text_color": "",
	   "coupon_days": 0,
	   "product_id": 0,
	   "category_id": 0,
	   "url": "",
	   "code_pool": "",
	   "min_cart": 0,
	   "max_uses": 0,
	   "per_user": 0,
	   "points": 0,
	   "wallet": 0,
	   "image": "",
	   "desc": "",
	   "type": "free_shipping",
	   "value": 0
	  },
	  {
	   "id": "s5",
	   "label": "۲۰٪ تخفیف",
	   "weight": 6,
	   "stock": 0,
	   "highlight": false,
	   "icon": "",
	   "color": "",
	   "text_color": "",
	   "coupon_days": 0,
	   "product_id": 0,
	   "category_id": 0,
	   "url": "",
	   "code_pool": "",
	   "min_cart": 0,
	   "max_uses": 0,
	   "per_user": 0,
	   "points": 0,
	   "wallet": 0,
	   "image": "",
	   "desc": "",
	   "type": "coupon_percent",
	   "value": 20
	  },
	  {
	   "id": "s6",
	   "label": "یک شانس دیگر",
	   "weight": 8,
	   "stock": 0,
	   "highlight": false,
	   "icon": "🔁",
	   "color": "",
	   "text_color": "",
	   "coupon_days": 0,
	   "product_id": 0,
	   "category_id": 0,
	   "url": "",
	   "code_pool": "",
	   "min_cart": 0,
	   "max_uses": 0,
	   "per_user": 0,
	   "points": 0,
	   "wallet": 0,
	   "image": "",
	   "desc": "",
	   "type": "respin",
	   "value": 0
	  },
	  {
	   "id": "s7",
	   "label": "۳۰٪ تخفیف",
	   "weight": 3,
	   "stock": 0,
	   "highlight": true,
	   "icon": "",
	   "color": "",
	   "text_color": "",
	   "coupon_days": 0,
	   "product_id": 0,
	   "category_id": 0,
	   "url": "",
	   "code_pool": "",
	   "min_cart": 0,
	   "max_uses": 0,
	   "per_user": 0,
	   "points": 0,
	   "wallet": 0,
	   "image": "",
	   "desc": "",
	   "type": "coupon_percent",
	   "value": 30
	  },
	  {
	   "id": "s8",
	   "label": "جایزه ویژه",
	   "weight": 1,
	   "stock": 5,
	   "highlight": true,
	   "icon": "🎁",
	   "color": "",
	   "text_color": "",
	   "coupon_days": 0,
	   "product_id": 0,
	   "category_id": 0,
	   "url": "",
	   "code_pool": "",
	   "min_cart": 0,
	   "max_uses": 0,
	   "per_user": 0,
	   "points": 0,
	   "wallet": 0,
	   "image": "",
	   "desc": "",
	   "type": "coupon_percent",
	   "value": 50
	  }
	 ]
	};

	function config( over ) {
		var c = clone( CONFIG_DEFAULTS );
		if ( over ) {
			Object.keys( over ).forEach( function ( k ) {
				c[ k ] = over[ k ] && typeof over[ k ] === 'object' && c[ k ] && ! Array.isArray( over[ k ] )
					? Object.assign( {}, c[ k ], over[ k ] ) : clone( over[ k ] );
			} );
		}
		return c;
	}

	var WHEELS = [
		{ id: 1, title: 'گردونهٔ خوش‌آمدگویی', status: 'active', priority: 10, ab_group: '', theme: 'classic',
			mode: 'credits', display: 'popup', config: applyTheme( config(), 'classic' ), spins: 8420, wins: 2610, redeemed: 1880, revenue: 39400000,
			updated: '2026-11-24 18:20:00', open: true },
		{ id: 2, title: 'کمپین شب یلدا', status: 'active', priority: 20, ab_group: 'A', theme: 'yalda',
			mode: 'free', display: 'inline', config: applyTheme( config( { access: { mode: 'free', require_otp: false } } ), 'yalda' ),
			spins: 3260, wins: 1402, redeemed: 980, revenue: 12800000, updated: '2026-11-22 09:05:00', open: true },
		{ id: 3, title: 'پاداش مشتری ویژه', status: 'draft', priority: 5, ab_group: 'B', theme: 'bgold',
			mode: 'credits', display: 'button', config: applyTheme( config(), 'bgold' ),
			spins: 0, wins: 0, redeemed: 0, revenue: 0, updated: '2026-11-19 14:40:00', open: false },
	];

	/* Templates::apply_theme() in PHP — same merge, same order. */
	function applyTheme( cfg, key ) {
		var th = null;
		THEMES.forEach( function ( t ) {
			if ( t.key === key ) {
				th = t;
			}
		} );
		if ( ! th ) {
			return cfg;
		}
		[ 'design', 'popup', 'form', 'display' ].forEach( function ( sec ) {
			Object.keys( th[ sec ] || {} ).forEach( function ( k ) {
				if ( Object.prototype.hasOwnProperty.call( cfg[ sec ] || {}, k ) ) {
					cfg[ sec ][ k ] = clone( th[ sec ][ k ] );
				}
			} );
		} );
		cfg.design.theme = key;
		return cfg;
	}

	/* What Frontend::public_config() hands to the front-end wheel engine. */
	function publicConfig( cfg ) {
		return {
			design: cfg.design,
			slices: cfg.slices,
			form: cfg.form,
			display: cfg.display,
			messages: cfg.messages || {},
			layout: cfg.layout || {},
			responsive: cfg.responsive || {},
			access: cfg.access,
			coupon: cfg.coupon || {},
		};
	}

	function wheelList() {
		return WHEELS.map( function ( x ) {
			return {
				id: x.id, title: x.title, status: x.status, priority: x.priority, ab_group: x.ab_group,
				theme: x.config.design.theme, mode: x.config.access.mode, display: x.config.display.mode,
				slices: x.config.slices.length,
				/* real REST sends Frontend::public_config($w) here; pages.js feeds it to
				   new Becharkhoon.Wheel(thumb, preview) so every card shows its own live wheel */
				preview: publicConfig( x.config ),
				spins: x.spins, wins: x.wins,
				redeemed: x.redeemed, revenue: x.revenue, updated: x.updated, open: x.open,
			};
		} );
	}

	function metrics( seed, scale ) {
		var m = {};
		[ 'impressions', 'opens', 'closes', 'launcher', 'form_starts', 'spins', 'wins', 'losses',
			'leads', 'redeemed', 'revenue', 'otp_sent', 'claims', 'shares' ].forEach( function ( k, i ) {
			m[ k ] = Math.round( ( 120 + rnd( seed + i * 7 ) * 480 ) * scale );
		} );
		m.spins = Math.max( m.spins, 60 );
		m.wins = Math.round( m.spins * 0.31 );
		m.losses = m.spins - m.wins;
		m.redeemed = Math.round( m.wins * 0.72 );
		m.revenue = Math.round( m.wins * 420000 );
		m.conversion = m.opens > 0 ? Math.round( m.spins / m.opens * 1000 ) / 10 : 0;
		m.win_rate = m.spins > 0 ? Math.round( m.wins / m.spins * 1000 ) / 10 : 0;
		m.redeem_rate = m.wins > 0 ? Math.round( m.redeemed / m.wins * 1000 ) / 10 : 0;
		m.open_rate = m.impressions > 0 ? Math.round( m.opens / m.impressions * 1000 ) / 10 : 0;
		return m;
	}

	function series( from, to ) {
		var out = {};
		var d = new Date( from + 'T00:00:00Z' );
		var end = new Date( to + 'T00:00:00Z' );
		var i = 0;
		while ( d <= end && i++ < 400 ) {
			var day = ymd( d );
			out[ day ] = metrics( d.getUTCDate() + d.getUTCMonth() * 31, 0.45 + rnd( d.getUTCDate() ) * 0.9 );
			d.setUTCDate( d.getUTCDate() + 1 );
		}
		return out;
	}

	/* names are clearly fictional; phones use the 0912 000 xxxx pattern reserved for examples */
	var PEOPLE = [
		[ 'نگار محمدی', '09120000101', 'negar@example.com' ],
		[ 'سعید رضایی', '09120000102', 'saeed@example.com' ],
		[ 'مریم اکبری', '09120000103', '' ],
		[ 'امیر کاظمی', '09120000104', 'amir@example.com' ],
		[ 'زهرا نیک‌پور', '09120000105', '' ],
		[ 'حسین مرادی', '09120000106', 'hossein@example.com' ],
		[ 'فاطمه سلطانی', '09120000107', '' ],
		[ 'رضا شریفی', '09120000108', 'reza@example.com' ],
		[ 'الهام کریمی', '09120000109', '' ],
		[ 'محمد طاهری', '09120000110', '' ],
		[ 'سارا احمدی', '09120000111', 'sara@example.com' ],
		[ 'علی فرهادی', '09120000112', '' ],
	];
	var PRIZE_POOL = [
		[ 'کوپن ۱۵٪', 'coupon_percent', 'win' ],
		[ 'ارسال رایگان', 'free_shipping', 'win' ],
		[ '۵۰ هزار تومان', 'coupon_fixed_cart', 'win' ],
		[ 'امتیاز باشگاه', 'points', 'win' ],
		[ 'پوچ', 'lose', 'lose' ],
		[ 'محصول هدیه', 'free_product', 'win' ],
	];

	function spins( n ) {
		var out = [];
		for ( var i = 0; i < n; i++ ) {
			var p = PEOPLE[ i % PEOPLE.length ];
			var pr = PRIZE_POOL[ ( i * 3 + 1 ) % PRIZE_POOL.length ];
			var d = daysAgo( Math.floor( i / 6 ) );
			out.push( {
				id: 9120 - i,
				wheel_id: 1,
				slice_id: pr[ 1 ] === 'lose' ? 5 : ( i % 3 ) + 1,
				slice_label: pr[ 0 ],
				prize_type: pr[ 1 ],
				result: pr[ 2 ],
				status: pr[ 2 ] === 'lose' ? 'closed' : ( i % 4 === 0 ? 'pending' : 'redeemed' ),
				name: p[ 0 ],
				phone: p[ 1 ],
				email: p[ 2 ],
				coupon_code: pr[ 2 ] === 'lose' ? '' : 'BCH-' + ( 1000 + i * 7 ),
				revenue: pr[ 2 ] === 'lose' ? 0 : 120000 + ( i % 5 ) * 40000,
				source: [ 'direct', 'instagram', 'google', 'newsletter', 'referral' ][ i % 5 ],
				created_at: ymd( d ) + ' ' + pad( 9 + ( i % 12 ) ) + ':' + pad( ( i * 7 ) % 60 ) + ':00',
			} );
		}
		return out;
	}

	function leads( n ) {
		return spins( n ).filter( function ( s ) {
			return s.phone;
		} ).map( function ( s, i ) {
			return {
				id: 4100 - i,
				wheel_id: 1,
				name: s.name,
				phone: s.phone,
				email: s.email,
				verified: i % 4 !== 1,
				marketing: i % 3 === 0,
				spins: 1 + ( i % 4 ),
				orders: i % 2,
				status: i % 4 === 1 ? 'lead' : 'customer',
				wheel_title: 'گردونهٔ خوش‌آمدگویی',
				created_at: s.created_at,
			};
		} );
	}

	function credits( n ) {
		return spins( n ).map( function ( s, i ) {
			return {
				id: 7200 - i,
				user_id: 0,
				person: s.phone,
				name: s.name,
				wheel_id: 1,
				wheel_title: 'گردونهٔ خوش‌آمدگویی',
				amount: 1 + ( i % 3 ),
				used: i % 3,
				status: i % 5 === 0 ? 'expired' : 'active',
				reason: [ 'purchase', 'signup', 'daily', 'review', 'referral', 'grant' ][ i % 6 ],
				note: '',
				created_at: s.created_at,
				expires_at: ymd( daysAgo( -20 - i ) ) + ' 23:59:59',
			};
		} );
	}

	function people( n ) {
		return spins( n ).map( function ( s, i ) {
			return {
				person: s.phone,
				uid: 0,
				name: s.name,
				user_name: '',
				email: s.email,
				phone: s.phone,
				spins: 1 + ( i % 6 ),
				wins: i % 3 === 0 ? 2 : 1,
				granted: 2 + ( i % 4 ),
				balance: i % 4,
				revenue: 120000 + ( i % 5 ) * 60000,
				first_at: ymd( daysAgo( 26 - ( i % 5 ) ) ) + ' 10:12:00',
				last_at: s.created_at,
				verified: i % 4 !== 1,
				marketing: i % 3 === 0,
			};
		} );
	}

	/* ---------------------------------------------------------------- handlers */
	var H = {};

	H.bootstrap = function () {
		return {
			settings: clone( SETTINGS ),
			themes: THEMES,
			templates: TEMPLATES,
			sms: SMS,
			sms_events: [ 'otp', 'win', 'lose', 'expiring', 'admin_new_lead', 'admin_daily' ],
			sms_mode: 'live',
			server_ip: '198.51.100.10',
			conditions: CONDITIONS,
			triggers: [ 'order_completed', 'order_processing', 'user_register', 'user_login', 'profile_update',
				'newsletter_subscribe', 'product_share', 'product_review', 'daily_visit', 'referral_signup', 'custom' ],
			rule_defaults: { enabled: true, credits: 1, daily_cap: 3, wheel_id: 1 },
			roles: [ { value: 'guest', label: 'مهمان' }, { value: 'customer', label: 'مشتری' },
				{ value: 'subscriber', label: 'مشترک' }, { value: 'administrator', label: 'مدیر' } ],
			payments: [ { value: 'bacs', label: 'انتقال بانکی' }, { value: 'cod', label: 'پرداخت در محل' },
				{ value: 'zarinpal', label: 'زرین‌پال' } ],
			shipping: [ { value: 'flat_rate', label: 'نرخ ثابت' }, { value: 'free_shipping', label: 'ارسال رایگان' } ],
			statuses: [ { value: 'processing', label: 'در حال انجام' }, { value: 'completed', label: 'تکمیل‌شده' },
				{ value: 'on-hold', label: 'در انتظار' } ],
			integrations: { wallet: true, points: true, membership: false, newsletter: true },
			defaults: config(),
			slice_defaults: SLICE_DEFAULTS,
			field_defaults: { required: false, label: '', placeholder: '' },
			prize_types: PRIZE_TYPES,
			currency: 'تومان',
			site: SITE,
			wheels: wheelList(),
			shortcodes: [ '[becharkhoon id="1"]', '[becharkhoon_button id="1" text=""]',
				'[becharkhoon_spins id="1"]', '[becharkhoon_my_prizes]',
				'[becharkhoon_winners id="1" count="10"]', '[becharkhoon_referral]' ],
		};
	};

	H.dashboard = function ( q ) {
		var to = q.to || today();
		var from = q.from || ymd( daysAgo( 29 ) );
		var total = metrics( 3, 26 );
		var prev = metrics( 9, 22 );
		var srs = series( from, to );
		return {
			from: from,
			to: to,
			totals: total,
			previous: prev,
			series: srs,
			prizes: [
				{ wheel_id: 1, slice_id: 1, slice_label: 'کوپن ۱۵٪', prize_type: 'coupon_percent', result: 'win', n: 412, redeemed: 298, revenue: 2140000 },
				{ wheel_id: 1, slice_id: 2, slice_label: 'ارسال رایگان', prize_type: 'free_shipping', result: 'win', n: 264, redeemed: 210, revenue: 530000 },
				{ wheel_id: 1, slice_id: 3, slice_label: '۵۰ هزار تومان', prize_type: 'coupon_fixed_cart', result: 'win', n: 148, redeemed: 92, revenue: 4600000 },
				{ wheel_id: 1, slice_id: 4, slice_label: 'امتیاز باشگاه', prize_type: 'points', result: 'win', n: 126, redeemed: 104, revenue: 0 },
				{ wheel_id: 1, slice_id: 5, slice_label: 'پوچ', prize_type: 'lose', result: 'lose', n: 640, redeemed: 0, revenue: 0 },
			],
			sources: [
				{ source: 'instagram', n: 1820, wins: 540 },
				{ source: 'direct', n: 1240, wins: 402 },
				{ source: 'google', n: 860, wins: 260 },
				{ source: 'newsletter', n: 420, wins: 148 },
				{ source: 'referral', n: 260, wins: 96 },
			],
			hours: [ 4, 3, 2, 2, 3, 6, 12, 22, 34, 46, 52, 58, 63, 66, 61, 58, 64, 78, 96, 108, 92, 64, 34, 14 ],
			credits: { active: 8214, used: 5980, expired: 312, granted: 14506 },
			recent: spins( 12 ),
			wheels: wheelList(),
			checks: [
				{ key: 'wheel', ok: true }, { key: 'active', ok: true }, { key: 'woo', ok: true },
				{ key: 'sms', ok: true }, { key: 'rules', ok: true }, { key: 'cron', ok: true },
				{ key: 'test', ok: true },
			],
		};
	};

	H.wheels = function () {
		return wheelList();
	};

	H.wheel_get = function ( id ) {
		var w = WHEELS.filter( function ( x ) {
			return String( x.id ) === String( id );
		} )[ 0 ];
		if ( ! w ) {
			return { error: 'not_found' };
		}
		return {
			wheel: {
				id: w.id, title: w.title, status: w.status, priority: w.priority, ab_group: w.ab_group,
				config: clone( w.config ), updated: w.updated,
			},
			/* keyed by slice id, exactly as the editor reads them */
			stock: { s8: { won: 2, left: 3, total: 5 }, s7: { won: 41, left: -1, total: -1 } },
			pools: { s8: { available: 0, used: 0 } },
		};
	};

	H.spins = function ( q ) {
		var all = spins( 46 );
		var page = parseInt( q.page, 10 ) || 1;
		var per = parseInt( q.per_page, 10 ) || 25;
		return { items: all.slice( ( page - 1 ) * per, page * per ), total: all.length };
	};

	H.leads = function ( q ) {
		var all = leads( 38 );
		var page = parseInt( q.page, 10 ) || 1;
		var per = parseInt( q.per_page, 10 ) || 25;
		return { items: all.slice( ( page - 1 ) * per, page * per ), total: all.length };
	};

	H.credits = function ( q ) {
		var all = credits( 42 );
		var page = parseInt( q.page, 10 ) || 1;
		var per = parseInt( q.per_page, 10 ) || 25;
		return { items: all.slice( ( page - 1 ) * per, page * per ), total: all.length };
	};

	H.people = function ( q ) {
		var all = people( 30 );
		var page = parseInt( q.page, 10 ) || 1;
		var per = parseInt( q.per_page, 10 ) || 25;
		return {
			items: all.slice( ( page - 1 ) * per, page * per ),
			total: all.length,
			sum: { spins: 214, wins: 68, granted: 380, balance: 96, revenue: 48200000 },
			credits: { active: 8214, used: 5980, expired: 312, granted: 14506 },
		};
	};

	H.people_events = function () {
		var all = spins( 24 ).map( function ( s, i ) {
			return {
				id: 5100 - i, person: s.phone, type: [ 'spin', 'credit', 'lead', 'win' ][ i % 4 ],
				title: s.slice_label, wheel_id: 1, created_at: s.created_at,
			};
		} );
		return { items: all, total: all.length };
	};

	H.contacts_count = function () {
		return { total: 3412, marketing: 1284, verified: 2890, winners: 1108 };
	};

	H.rules = function () {
		var mk = function ( id, trigger, title, credits, wheel, cond ) {
			return {
				id: id, trigger: trigger, title: title, enabled: id !== 5, credits: credits,
				daily_cap: 3, wheel_id: wheel, amount: trigger === 'order_amount' ? 2000000 : 0,
				nth: trigger === 'nth_order' ? 3 : 0, max_qty: 3, conditions: cond || [],
			};
		};
		return {
			rules: [
				mk( 1, 'first_order', 'اولین سفارش', 1, 0, [ { field: 'user_role', op: 'in', value: [ 'customer' ] } ] ),
				mk( 2, 'register', 'ثبت‌نام در سایت', 2, 1 ),
				mk( 3, 'review', 'دیدگاه محصول', 1, 1 ),
				mk( 4, 'order_amount', 'سفارش بالای ۲ میلیون', 2, 2 ),
				mk( 5, 'referral_signup', 'ثبت‌نام دوست دعوت‌شده', 2, 0 ),
				mk( 6, 'every_amount', 'به ازای هر ۵۰۰ هزار تومان', 1, 0 ),
				mk( 7, 'lead', 'ثبت شماره در فرم', 1, 1 ),
				mk( 8, 'birthday', 'تولد مشتری', 3, 2 ),
			],
		};
	};

	H.settings = function () {
		return clone( SETTINGS );
	};

	H.reports = function ( q ) {
		var to = q.to || today();
		var from = q.from || ymd( daysAgo( 29 ) );
		var money = { orders: 512, total: 44200000, net: 39400000, discount: 4820000, refunded: 380000, items: 1180, aov: 76953 };
		var moneyPrev = { orders: 438, total: 38100000, net: 34200000, discount: 3920000, refunded: 210000, items: 1010, aov: 78082 };
		var activity = { spins: 1248, wins: 386, leads: 412, redeemed: 298, opens: 3860, impressions: 12400, win_rate: 30.9, conversion: 32.3 };
		var activityPrev = { spins: 1102, wins: 341, leads: 370, redeemed: 262, opens: 3410, impressions: 11200, win_rate: 30.9, conversion: 32.3 };
		return {
			period: { from: from, to: to, from_utc: from + ' 00:00:00', to_utc: to + ' 23:59:59' },
			style: {},
			money: money,
			money_prev: moneyPrev,
			activity: activity,
			activity_prev: activityPrev,
			counters: { coupon: 412, discount_total: 4820000, roi: 8.2, best_day: ymd( daysAgo( 4 ) ) },
			series: series( from, to ),
			prizes: [
				{ slice_label: 'کوپن ۱۵٪', n: 412, redeemed: 298, discount: 2140000, revenue: 12800000 },
				{ slice_label: 'ارسال رایگان', n: 264, redeemed: 210, discount: 530000, revenue: 9600000 },
				{ slice_label: '۵۰ هزار تومان', n: 148, redeemed: 92, discount: 4600000, revenue: 7400000 },
				{ slice_label: 'امتیاز باشگاه', n: 126, redeemed: 104, discount: 0, revenue: 9600000 },
			],
			sync: { done: true, scanned: 1840, rows: 512, page: 0, pages: 1 },
			parent: { net: 39400000, orders: 512 },
			orders: [],
		};
	};

	H.reports_orders = function ( q ) {
		var all = spins( 30 ).map( function ( s, i ) {
			return {
				order_id: 5400 - i, status: i % 5 === 0 ? 'completed' : 'processing',
				total: 480000 + ( i % 6 ) * 120000, discount: 50000 + ( i % 4 ) * 25000,
				coupon: s.coupon_code, person: s.phone, name: s.name, created_at: s.created_at,
			};
		} );
		var page = parseInt( q.page, 10 ) || 1;
		var per = parseInt( q.per_page, 10 ) || 20;
		return { items: all.slice( ( page - 1 ) * per, page * per ), total: all.length };
	};

	H.bulk_campaigns = function ( q ) {
		var c = function ( id, title, status, sent, failed, pending, grant, next ) {
			return {
				id: id, title: title, status: status, mode: 'live', grant: grant || 0,
				grant_wheel: grant ? 1 : 0, send_sms: true, text: 'بینندگان گرامی، جایزهٔ شما در گردونه ثبت شد.',
				created_at: '2026-11-' + ( 24 - id % 5 ) + ' 12:0' + ( id % 6 ) + ':00',
				next_run: next || '', batches: 4,
				counts: { sent: sent, failed: failed, pending: pending, cancelled: status === 'cancelled' ? 12 : 0,
					granted: grant ? sent : 0, grant_failed: 0, total: sent + failed + pending },
			};
		};
		var all = [
			c( 31, 'اطلاع برندگان هفته', 'running', 240, 0, 146, 0, '2026-11-24 13:00:00' ),
			c( 30, 'یادآوری شانس مصرف‌نشده', 'paused', 380, 6, 818, 1, '2026-11-25 09:00:00' ),
			c( 29, 'کد تایید موبایل', 'done', 2890, 4, 0, 0 ),
			c( 28, 'تبریک خرید اول', 'cancelled', 6, 12, 0, 1 ),
		];
		return { items: all, total: all.length, page: 1, per_page: 20, mode: 'live' };
	};

	/* campaign detail — same object as the list row, plus what the report page reads */
	H.bulk_campaign = function ( id ) {
		var list = H.bulk_campaigns( {} ).items;
		var c = list.filter( function ( x ) {
			return String( x.id ) === String( id );
		} )[ 0 ];
		return c || { error: 'not_found' };
	};

	H.bulk_items = function ( id, q ) {
		var st = [ 'sent', 'sent', 'sent', 'failed', 'pending' ];
		var all = [];
		for ( var i = 0; i < 42; i++ ) {
			var p = PEOPLE[ i % PEOPLE.length ];
			all.push( {
				id: 9000 - i,
				name: p[ 0 ],
				phone: p[ 1 ],
				status: st[ i % st.length ],
				batch: 1 + ( i % 4 ),
				tries: i % 5 === 3 ? 2 : 1,
				message: 'تبریک! جایزهٔ شما در گردونه ثبت شد. کد: BCH-' + ( 2000 + i ),
				response: i % 5 === 3 ? 'Invalid receptor' : 'OK',
				sent_at: '2026-11-24 12:' + pad( 10 + i % 40 ) + ':00',
				grant_status: i % 3 ? 'done' : '',
			} );
		}
		var page = parseInt( q.page, 10 ) || 1;
		var per = parseInt( q.per_page, 10 ) || 50;
		return { items: all.slice( ( page - 1 ) * per, page * per ), total: all.length };
	};

	H.sms_log = function () {
		var all = spins( 26 ).map( function ( s, i ) {
			return {
				id: 8800 - i, to: s.phone, name: s.name, context: i % 3 ? 'win' : 'otp',
				status: i % 7 === 0 ? 'failed' : 'sent', driver: 'kavenegar',
				text: i % 3 ? 'تبریک! جایزهٔ شما در گردونه ثبت شد.' : 'کد تایید شما: ۴۸۲۹۱۶',
				created_at: s.created_at,
			};
		} );
		return { items: all, total: all.length };
	};

	H.logs = function () {
		var all = spins( 22 ).map( function ( s, i ) {
			return {
				id: 3300 - i, channel: i % 4 ? 'spin' : 'system', level: i % 9 === 0 ? 'error' : 'info',
				message: i % 4 ? 'چرخش ثبت شد — ' + s.slice_label : 'همگام‌سازی سفارش‌ها انجام شد',
				created_at: s.created_at,
			};
		} );
		return { items: all, total: all.length };
	};

	H.tools_status = function () {
		return {
			php: '8.1', wp: '6.6', woo: '9.0', plugin: '1.8.0', db: 6,
			tables: { wheels: true, spins: true, leads: true, credits: true, stats: true, codes: true,
				stock: true, log: true, orders: true, sms: true, bulk: true, bulk_items: true },
			cron: Math.round( Date.now() / 1000 ) + 3600,
			cron_disabled: false,
			caches: [ 'LiteSpeed Cache' ],
			cdn: { cloudflare: true, arvan: false },
			ip: '198.51.100.10', timezone: 'Asia/Tehran', time: '۱۴:۲۲',
			counts: { spins: 12480, leads: 3412, credits: 14506, codes: 376, campaigns: 4 },
			sms: { driver: 'kavenegar', mode: 'live', credit: 2400 },
			privacy: { retention: 0 },
		};
	};

	H.search = function () {
		return { items: [], total: 0 };
	};

	H.credit_balance = function () {
		return { active: 8214, used: 5980, expired: 312, granted: 14506 };
	};

	/* ---------------------------------------------------------------- router */
	function match( path ) {
		var p = path.replace( /\/+$/, '' );
		var map = [
			[ /^bootstrap$/, 'bootstrap' ],
			[ /^dashboard$/, 'dashboard' ],
			[ /^wheels$/, 'wheels' ],
			[ /^wheels\/(\d+)$/, 'wheel_get' ],
			[ /^spins$/, 'spins' ],
			[ /^leads$/, 'leads' ],
			[ /^credits$/, 'credits' ],
			[ /^people$/, 'people' ],
			[ /^people\/events$/, 'people_events' ],
			[ /^contacts\/count$/, 'contacts_count' ],
			[ /^rules$/, 'rules' ],
			[ /^settings$/, 'settings' ],
			[ /^reports$/, 'reports' ],
			[ /^reports\/orders$/, 'reports_orders' ],
			[ /^bulk\/campaigns$/, 'bulk_campaigns' ],
			[ /^bulk\/(\d+)\/items$/, 'bulk_items' ],
			[ /^bulk\/(\d+)$/, 'bulk_campaign' ],
			[ /^sms\/log$/, 'sms_log' ],
			[ /^logs$/, 'logs' ],
			[ /^tools\/status$/, 'tools_status' ],
		];
		for ( var i = 0; i < map.length; i++ ) {
			var m = p.match( map[ i ][ 0 ] );
			if ( m ) {
				return { name: map[ i ][ 1 ], args: m.slice( 1 ) };
			}
		}
		if ( /^search\//.test( p ) ) {
			return { name: 'search', args: [] };
		}
		if ( /^tools\//.test( p ) ) {
			return { name: 'tools_status', args: [] };
		}
		return null;
	}

	function query( url ) {
		var q = {};
		var s = ( url.split( '?' )[ 1 ] || '' ).split( '#' )[ 0 ];
		s.split( '&' ).forEach( function ( kv ) {
			if ( ! kv ) {
				return;
			}
			var parts = kv.split( '=' );
			q[ decodeURIComponent( parts[ 0 ] ) ] = decodeURIComponent( ( parts[ 1 ] || '' ).replace( /\+/g, ' ' ) );
		} );
		return q;
	}

	w.fetch = function ( input, init ) {
		var url = typeof input === 'string' ? input : ( input && input.url ) || '';
		var at = url.indexOf( ROOT );
		if ( at === -1 ) {
			/* anything else that is not ours must not reach the network either */
			if ( /^https?:/i.test( url ) ) {
				return fail( 'درخواست بیرونی در دمو مسدود است.', 403 );
			}
			return REAL_FETCH( input, init );
		}
		var path = url.slice( at + ROOT.length ).split( '?' )[ 0 ];
		var method = ( ( init && init.method ) || 'GET' ).toUpperCase();
		var hit = match( path );
		if ( ! hit ) {
			return method === 'GET'
				? ok( { items: [], total: 0 } )
				: fail( DISABLED, 403 );
		}
		if ( method !== 'GET' ) {
			return fail( DISABLED, 403 );
		}
		var fn = H[ hit.name ];
		if ( ! fn ) {
			return ok( {} );
		}
		/* single-item handlers take the id first; list handlers take the query object */
		var out = hit.args.length
			? fn.apply( null, hit.args.concat( [ query( url ) ] ) )
			: fn.call( null, query( url ) );
		if ( out && out.error === 'not_found' ) {
			return fail( 'موردی یافت نشد.', 404 );
		}
		return ok( out );
	};

	/* the demo banner flag, used by demo.css */
	w.BC_DEMO = { active: true, site: SITE };
} )( window );
