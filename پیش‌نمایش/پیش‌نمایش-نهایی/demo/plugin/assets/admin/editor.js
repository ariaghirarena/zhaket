/**
 * ARIAGH.BECHARKHOON — wheel editor: 13 setting tabs + live popup preview (desktop/mobile, every state).
 */
( function ( w, d ) {
	'use strict';
	var BC = w.BC;
	var F = BC.F;
	var h = BC.h;
	var t = BC.t;

	var E = ( BC.Editor = {} );

	var TYPES = function () {
		return [
			{ value: 'coupon_percent', label: t( 'کد تخفیف درصدی', 'Percent coupon' ), icon: 'percent' },
			{ value: 'coupon_fixed_cart', label: t( 'کد تخفیف مبلغ ثابت (سبد)', 'Fixed cart coupon' ), icon: 'ticket' },
			{ value: 'coupon_fixed_product', label: t( 'کد تخفیف مبلغ ثابت (هر محصول)', 'Fixed product coupon' ), icon: 'ticket' },
			{ value: 'free_shipping', label: t( 'ارسال رایگان', 'Free shipping' ), icon: 'bag' },
			{ value: 'free_product', label: t( 'محصول هدیه (رایگان)', 'Free gift product' ), icon: 'gift' },
			{ value: 'existing_coupon', label: t( 'کد تخفیف موجود ووکامرس', 'Existing coupon' ), icon: 'ticket' },
			{ value: 'wallet', label: t( 'شارژ کیف پول', 'Wallet credit' ), icon: 'database' },
			{ value: 'points', label: t( 'امتیاز باشگاه مشتریان', 'Loyalty points' ), icon: 'crown' },
			{ value: 'extra_spin', label: t( 'شانس چرخش اضافه', 'Extra spins' ), icon: 'refresh' },
			{ value: 'code_pool', label: t( 'کد از لیست آماده (کارت هدیه/شارژ…)', 'Code from a pool' ), icon: 'list' },
			{ value: 'custom', label: t( 'جایزه دلخواه / فیزیکی', 'Custom / physical prize' ), icon: 'gift' },
			{ value: 'link', label: t( 'لینک / فایل دانلودی', 'Link / download' ), icon: 'link' },
			{ value: 'respin', label: t( 'یک بار دیگر بچرخان', 'Spin again' ), icon: 'shuffle' },
			{ value: 'lose', label: t( 'پوچ', 'No prize' ), icon: 'x-circle' },
		];
	};
	E.TYPES = TYPES;
	var typeLabel = function ( v ) {
		var x = TYPES().filter( function ( o ) { return o.value === v; } )[ 0 ];
		return x ? x.label : v;
	};

	/** PHP sends empty maps as [] — layout/responsive must be objects in JS. */
	function normCfg( c ) {
		if ( ! c.layout || Array.isArray( c.layout ) ) {
			c.layout = {};
		}
		Object.keys( c.layout ).forEach( function ( k ) { if ( Array.isArray( c.layout[ k ] ) ) { c.layout[ k ] = {}; } } );
		if ( ! c.responsive || Array.isArray( c.responsive ) ) {
			c.responsive = {};
		}
		[ 'tablet', 'mobile' ].forEach( function ( d ) { if ( ! c.responsive[ d ] || Array.isArray( c.responsive[ d ] ) ) { c.responsive[ d ] = {}; } } );
		return c;
	}
	E.normCfg = normCfg;

	/** Same rule as Schema::responsive_ok(): only style may differ per device. */
	function responsiveOk( path ) {
		if ( ! /^(design|popup|form|display|layout)\.[a-z0-9_]+(\.[a-z0-9_]+)?$/.test( path ) ) {
			return false;
		}
		if ( /^form\.(fields|consent|marketing)/.test( path ) ) {
			return false;
		}
		return ! /(_text|title|subtitle|description|badge|label|placeholder|_button|_url|_image|image|logo|_css|_class|_html|palette|trust_items|deadline|_selector|devices)$/.test( path );
	}
	/**
	 * A model for the inspector that reads "device value or desktop value" and writes style changes
	 * to cfg.responsive[device] (Elementor-style per-device editing). Texts always go to the shared value.
	 */
	function deviceModel( cfg, base, prefix, device ) {
		if ( device === 'desktop' || typeof Proxy === 'undefined' ) {
			return base;
		}
		var ov = cfg.responsive[ device ];
		var make = function ( obj, path ) {
			return new Proxy( {}, {
				get: function ( tgt, k ) {
					if ( typeof k !== 'string' ) {
						return undefined;
					}
					var full = path ? path + '.' + k : k;
					if ( Object.prototype.hasOwnProperty.call( ov, full ) ) {
						return ov[ full ];
					}
					var v = obj ? obj[ k ] : undefined;
					return v && typeof v === 'object' && ! Array.isArray( v ) ? make( v, full ) : v;
				},
				set: function ( tgt, k, v ) {
					var full = path ? path + '.' + k : k;
					if ( responsiveOk( full ) ) {
						if ( obj && obj[ k ] === v ) {
							delete ov[ full ];
						} else {
							ov[ full ] = v;
						}
					} else if ( obj ) {
						obj[ k ] = v;
					}
					return true;
				},
				has: function ( tgt, k ) { return !! obj && k in obj; },
				ownKeys: function () { return obj ? Object.keys( obj ) : []; },
				getOwnPropertyDescriptor: function ( tgt, k ) { return obj && k in obj ? { enumerable: true, configurable: true } : undefined; },
			} );
		};
		return make( base, prefix );
	}

	function clone( x ) {
		return JSON.parse( JSON.stringify( x ) );
	}

	/** Strip server-only data like Frontend::public_config() so the preview equals the site. */
	E.publicConfig = function ( id, title, cfg ) {
		var c = clone( cfg );
		return {
			id: id || 0,
			title: title,
			lang: c.lang,
			slices: c.slices.map( function ( s ) {
				var o = { id: s.id, label: s.label, sublabel: s.sublabel, color: s.color, color2: s.color2, text_color: s.text_color, icon: s.icon, image: s.image, image_size: s.image_size, highlight: s.highlight, hidden_label: s.hidden_label };
				if ( s.type === 'free_product' ) {
					var gi = ( s.gift_items || [] ).filter( function ( x ) { return x.name; } )[ 0 ];
					o.type = 'free_product';
					o.gift_demo = gi ? gi.name : '';
					o.gift_demo_image = gi ? gi.image : '';
					o.gift_demo_price = gi && +gi.price ? BC.num( +gi.price, 0 ) + ' ' + t( 'تومان', '' ) : '';
				}
				return o;
			} ),
			design: c.design,
			popup: Object.assign( c.popup, { countdown_ts: c.popup.countdown_deadline ? Math.floor( new Date( c.popup.countdown_deadline.replace( ' ', 'T' ) ).getTime() / 1000 ) : 0 } ),
			form: Object.assign( c.form, { fields: c.form.fields.filter( function ( f ) { return f.enabled; } ) } ),
			display: c.display,
			messages: c.messages,
			layout: c.layout,
			responsive: c.responsive,
			access: { mode: c.access.mode, require_login: c.access.require_login, require_otp: c.access.require_otp || c.form.phone_otp, how_to_earn: c.access.show_how_to_earn },
			advanced: { track_ga: false, track_pixel: false },
			social: 27,
			winners: [ { name: t( 'عل***', 'Jo***' ), prize: ( c.slices[ 0 ] || {} ).label || '', ago: t( '۳ دقیقه', '3 mins' ) }, { name: t( 'مر***', 'An***' ), prize: ( c.slices[ 2 ] || {} ).label || '', ago: t( '۱۱ دقیقه', '11 mins' ) } ],
			earn: [ t( 'با ثبت اولین سفارش، ۱ شانس چرخاندن بگیرید', 'Place your first order to get 1 spin' ), t( 'برای خرید ۲ میلیون تومان یا بیشتر، ۱ شانس بگیرید', 'Orders of 2,000,000 or more earn 1 spin' ) ],
			ref_link: c.messages.show_share ? ( BC.config.homeUrl + '?bref=demo' ) : '',
			coupon: { prefix: c.coupon.prefix },
		};
	};

	/* ------------------------------------------------------------------ preview */

	function Preview( state ) {
		var self = this;
		this.state = state;
		this.device = 'desktop';
		this.view = 'form';
		this.stage = h( 'div', { class: 'bc-pv__stage' } );
		this.canvas = h( 'div', { class: 'bc-pv__canvas' } );
		this.stage.appendChild( this.canvas );
		var views = [
			{ value: 'form', label: t( 'فرم', 'Form' ) },
			{ value: 'win', label: t( 'برنده', 'Win' ) },
			{ value: 'lose', label: t( 'پوچ', 'Lose' ) },
			{ value: 'earn', label: t( 'بدون شانس', 'No spins' ) },
			{ value: 'wait', label: t( 'انتظار', 'Cooldown' ) },
			{ value: 'login', label: t( 'ورود', 'Login' ) },
			{ value: 'page', label: t( 'صفحه سایت', 'Site page' ), title: t( 'دکمه شناور و نوار چسبان کد تخفیف روی صفحه سایت', 'Floating launcher and sticky coupon bar on the site page' ) },
		];
		this.views = views;
		var editing = true;
		try { editing = w.localStorage.getItem( 'bch-visual-edit' ) !== '0'; } catch ( e ) {}
		this.editing = editing;
		this.canvas.classList.toggle( 'is-editing', editing );
		this.insp = h( 'div', { class: 'bc-insp', hidden: true } );
		this.insp.addEventListener( 'bc-refresh', function () { if ( self.selected ) { self.select( self.selected ); } } );
		var editBtn = h( 'button', { type: 'button', class: 'bc-btn bc-btn--sm bc-pv__edit' + ( editing ? ' is-on' : '' ), title: t( 'کلیک روی هر بخش پیش‌نمایش = ویرایش همان بخش؛ دوبار کلیک روی متن = تایپ مستقیم', 'Click any part of the preview to edit it; double-click text to type directly' ) }, BC.icon( 'edit', 14 ), h( 'span', { text: t( 'ویرایش زنده', 'Live edit' ) } ) );
		editBtn.addEventListener( 'click', function () {
			self.editing = ! self.editing;
			editBtn.classList.toggle( 'is-on', self.editing );
			self.canvas.classList.toggle( 'is-editing', self.editing );
			try { w.localStorage.setItem( 'bch-visual-edit', self.editing ? '1' : '0' ); } catch ( e ) {}
			if ( ! self.editing ) {
				self.deselect();
			}
			self.draw();
		} );
		var studioBtn = h( 'button', { type: 'button', class: 'bc-btn bc-btn--sm', title: t( 'پیش‌نمایش بزرگ با پنل ویرایش کنارش', 'Large preview with the editing panel beside it' ) }, BC.icon( 'monitor', 14 ), h( 'span', { text: t( 'استودیو', 'Studio' ) } ) );
		studioBtn.addEventListener( 'click', function () {
			var ed = self.el.closest( '.bc-editor' );
			if ( ! ed ) {
				return;
			}
			var on = ! ed.classList.contains( 'is-studio' );
			ed.classList.toggle( 'is-studio', on );
			studioBtn.classList.toggle( 'is-on', on );
			setTimeout( function () { self.fit(); }, 30 );
		} );
		this.el = h( 'div', { class: 'bc-pv' },
			h( 'div', { class: 'bc-pv__bar' },
				editBtn,
				studioBtn,
				BC.segment( [ { value: 'desktop', label: '', icon: 'monitor', title: t( 'دسکتاپ', 'Desktop' ) }, { value: 'tablet', label: '', icon: 'tablet', title: t( 'تبلت', 'Tablet' ) }, { value: 'mobile', label: '', icon: 'smartphone', title: t( 'موبایل', 'Mobile' ) } ], 'desktop', function ( v ) { self.device = v; self.deselect(); self.render(); self.devNote(); } ),
				( this.viewSeg = BC.segment( views, 'form', function ( v ) { self.view = v; self.deselect(); self.render(); } ) ),
				BC.btn( BC.il( 'play', t( 'چرخش آزمایشی', 'Test spin' ), 14 ), function () {
					self.setView( 'form', true );
					clearTimeout( self.timer );
					self.draw(); // Synchronous: a debounced render would replace the instance mid-spin.
					setTimeout( function () { if ( self.inst ) { self.inst.onSpinClick(); } }, 60 );
				}, 'sm primary' )
			),
			( this.devBar = h( 'div', { class: 'bc-pv__dev', hidden: true } ) ),
			h( 'div', { class: 'bc-pv__work' }, this.stage, this.insp ),
			h( 'p', { class: 'bc-pv__note', text: t( 'ویرایش زنده: روی هر چیزی در پیش‌نمایش کلیک کنید (عنوان، دکمه، بخش‌های گردونه، نشانگر، قاب، فیلدها…) تا تنظیماتش همین‌جا باز شود؛ روی متن‌ها دوبار کلیک کنید و مستقیم تایپ کنید. چرخش آزمایشی ثبت نمی‌شود.', 'Live edit: click anything in the preview (title, button, slices, pointer, rim, fields…) to edit it here; double-click texts to type directly. Test spins are not recorded.' ) } )
		);
		w.addEventListener( 'resize', function () { self.fit(); } );
		this.setupVisual();
	}
	/** Switch the preview view (form, win, page…) from code, keeping the segment in sync. */
	Preview.prototype.setView = function ( v, silent ) {
		this.view = v;
		var i = this.views.map( function ( x ) { return x.value; } ).indexOf( v );
		Array.prototype.forEach.call( this.viewSeg.children, function ( b, j ) { b.classList.toggle( 'is-active', j === i ); } );
		this.deselect();
		if ( ! silent ) {
			this.render();
			if ( this.el.getBoundingClientRect().top < 0 || this.el.getBoundingClientRect().top > w.innerHeight ) {
				this.el.scrollIntoView( { behavior: 'smooth', block: 'start' } );
			}
		}
	};
	Preview.prototype.render = function () {
		var self = this;
		clearTimeout( this.timer );
		this.timer = setTimeout( function () { self.draw(); }, 120 );
	};
	Preview.prototype.draw = function () {
		if ( ! w.Becharkhoon ) {
			return;
		}
		var s = this.state;
		this.devNote();
		var cfg = E.publicConfig( s.id, s.title, s.cfg );
		var mobile = this.device === 'mobile';
		var width = mobile ? 390 : ( this.device === 'tablet' ? 768 : Math.max( 360, +cfg.popup.width || 880 ) );
		this.canvas.style.width = width + 'px';
		this.canvas.classList.toggle( 'is-mobile', mobile );
		if ( this.inst && this.inst.wheel ) {
			this.inst.wheel.stopIdle();
		}
		if ( this.inlineEl ) {
			return; // Never re-render under the caret.
		}
		if ( this.view === 'page' ) {
			this.inst = null;
			w.Becharkhoon.previewPage( this.canvas, cfg, { mobile: mobile, device: this.device } );
			this.hoverEl = null;
			this.markSelected();
			this.fit();
			return;
		}
		this.inst = w.Becharkhoon.preview( this.canvas, cfg, { view: this.view, mobile: mobile, device: this.device } );
		if ( this.editing && this.inst && this.inst.wheel ) {
			this.inst.wheel.stopIdle();
		}
		this.hoverEl = null;
		this.markSelected();
		this.fit();
		this.devNote();
	};
	Preview.prototype.fit = function () {
		var avail = this.stage.clientWidth - 24;
		var width = parseFloat( this.canvas.style.width ) || 880;
		var scale = Math.min( 1, avail / width );
		this.scale = scale;
		this.canvas.style.transform = 'scale(' + scale + ')';
		this.stage.style.height = Math.ceil( this.canvas.offsetHeight * scale + 24 ) + 'px';
	};

	/* ------------------------------------------------------------------ live visual editing */

	var o = function ( pairs ) { return pairs.map( function ( p ) { return { value: p[ 0 ], label: p[ 1 ] }; } ); };
	/**
	 * Everything that can be clicked in the preview → which config object and fields it edits.
	 * Order matters: the first selector that matches while walking up from the clicked node wins.
	 */

	/* ------------------------------------------------------------------ shared UI field groups (tabs + live inspector) */

	var BAR_THEMES = function () {
		var base = { coupon_bar_style: 'solid', coupon_bar_layout: 'full', coupon_bar_shadow: 'soft', coupon_bar_border: '', coupon_bar_copy_bg: '', coupon_bar_copy_color: '', coupon_bar_code_style: 'chip', coupon_bar_cd_color: '', coupon_bar_close_color: '' };
		var x = function ( name, sw, o ) { return { name: name, sw: sw, v: Object.assign( {}, base, o ) }; };
		return [
			x( t( 'سرمه‌ای', 'Navy' ), [ '#0B1B3F', '#FBBF24' ], { coupon_bar_bg: '#0B1B3F', coupon_bar_bg2: '#1D4ED8', coupon_bar_color: '#ffffff', coupon_bar_code_bg: 'rgba(255,255,255,.14)', coupon_bar_code_color: '#FBBF24', coupon_bar_apply_bg: '#ffffff', coupon_bar_apply_color: '#0f172a' } ),
			x( t( 'آبی گرادیان', 'Blue gradient' ), [ '#1D4ED8', '#7C3AED' ], { coupon_bar_style: 'gradient', coupon_bar_bg: '#1D4ED8', coupon_bar_bg2: '#7C3AED', coupon_bar_color: '#ffffff', coupon_bar_code_bg: 'rgba(255,255,255,.18)', coupon_bar_code_color: '#ffffff', coupon_bar_apply_bg: '#ffffff', coupon_bar_apply_color: '#1D4ED8' } ),
			x( t( 'بنفش و صورتی', 'Purple pink' ), [ '#6D28D9', '#DB2777' ], { coupon_bar_style: 'gradient', coupon_bar_bg: '#6D28D9', coupon_bar_bg2: '#DB2777', coupon_bar_color: '#ffffff', coupon_bar_code_bg: 'rgba(255,255,255,.18)', coupon_bar_code_color: '#ffffff', coupon_bar_apply_bg: '#ffffff', coupon_bar_apply_color: '#6D28D9' } ),
			x( t( 'طلایی لوکس', 'Gold luxe' ), [ '#111827', '#FBBF24' ], { coupon_bar_bg: '#111827', coupon_bar_bg2: '#1f2937', coupon_bar_color: '#FDE68A', coupon_bar_code_bg: '#FBBF24', coupon_bar_code_color: '#111827', coupon_bar_apply_bg: '#FBBF24', coupon_bar_apply_color: '#111827', coupon_bar_border: '#FBBF24' } ),
			x( t( 'روشن شناور', 'Light floating' ), [ '#ffffff', '#1D4ED8' ], { coupon_bar_layout: 'floating', coupon_bar_shadow: 'strong', coupon_bar_bg: '#ffffff', coupon_bar_bg2: '#eff6ff', coupon_bar_color: '#0f172a', coupon_bar_code_bg: '#EFF6FF', coupon_bar_code_color: '#1D4ED8', coupon_bar_code_style: 'dashed', coupon_bar_apply_bg: '#1D4ED8', coupon_bar_apply_color: '#ffffff', coupon_bar_border: '#e2e8f0' } ),
			x( t( 'سبز', 'Green' ), [ '#065F46', '#10B981' ], { coupon_bar_style: 'gradient', coupon_bar_bg: '#065F46', coupon_bar_bg2: '#10B981', coupon_bar_color: '#ffffff', coupon_bar_code_bg: 'rgba(255,255,255,.18)', coupon_bar_code_color: '#ECFDF5', coupon_bar_apply_bg: '#ffffff', coupon_bar_apply_color: '#065F46' } ),
			x( t( 'فروش ویژه', 'Flash sale' ), [ '#B91C1C', '#F97316' ], { coupon_bar_style: 'gradient', coupon_bar_bg: '#B91C1C', coupon_bar_bg2: '#F97316', coupon_bar_color: '#ffffff', coupon_bar_code_bg: '#ffffff', coupon_bar_code_color: '#B91C1C', coupon_bar_apply_bg: '#FDE047', coupon_bar_apply_color: '#7F1D1D', coupon_bar_cd_style: 'chip' } ),
			x( t( 'شیشه‌ای', 'Glass' ), [ '#0f172a', '#94a3b8' ], { coupon_bar_style: 'glass', coupon_bar_layout: 'floating', coupon_bar_shadow: 'strong', coupon_bar_bg: '#0f172a', coupon_bar_bg2: '#334155', coupon_bar_color: '#ffffff', coupon_bar_code_bg: 'rgba(255,255,255,.16)', coupon_bar_code_color: '#ffffff', coupon_bar_apply_bg: '#ffffff', coupon_bar_apply_color: '#0f172a', coupon_bar_border: 'rgba(255,255,255,.25)' } ),
			x( t( 'کپسولی', 'Pill' ), [ '#0f172a', '#22C55E' ], { coupon_bar_layout: 'pill', coupon_bar_shadow: 'strong', coupon_bar_bg: '#0f172a', coupon_bar_bg2: '#1e293b', coupon_bar_color: '#ffffff', coupon_bar_code_bg: 'rgba(255,255,255,.12)', coupon_bar_code_color: '#86EFAC', coupon_bar_apply_bg: '#22C55E', coupon_bar_apply_color: '#ffffff' } ),
			x( t( 'بلیت', 'Ticket' ), [ '#FEF3C7', '#B45309' ], { coupon_bar_style: 'ticket', coupon_bar_bg: '#FEF3C7', coupon_bar_bg2: '#FDE68A', coupon_bar_color: '#78350F', coupon_bar_code_bg: '#ffffff', coupon_bar_code_color: '#B45309', coupon_bar_code_style: 'dashed', coupon_bar_apply_bg: '#B45309', coupon_bar_apply_color: '#ffffff' } ),
			x( t( 'یلدا', 'Yalda' ), [ '#7F1D1D', '#FCA5A5' ], { coupon_bar_style: 'gradient', coupon_bar_bg: '#450A0A', coupon_bar_bg2: '#991B1B', coupon_bar_color: '#FEE2E2', coupon_bar_code_bg: '#FCA5A5', coupon_bar_code_color: '#450A0A', coupon_bar_apply_bg: '#FEE2E2', coupon_bar_apply_color: '#7F1D1D' } ),
			x( t( 'نوروز', 'Nowruz' ), [ '#166534', '#BEF264' ], { coupon_bar_style: 'gradient', coupon_bar_bg: '#14532D', coupon_bar_bg2: '#65A30D', coupon_bar_color: '#ffffff', coupon_bar_code_bg: '#BEF264', coupon_bar_code_color: '#14532D', coupon_bar_apply_bg: '#ffffff', coupon_bar_apply_color: '#14532D' } ),
		];
	};

	/** A row of one-click themes; applying one re-renders the surrounding form (bc-refresh event). */
	function themePicker( list, label ) {
		return { type: 'custom', render: function ( model, onChange ) {
			var row = h( 'div', { class: 'bc-qthemes' } );
			list.forEach( function ( th ) {
				row.appendChild( h( 'button', { type: 'button', class: 'bc-qtheme', title: th.name, onClick: function () {
					Object.keys( th.v ).forEach( function ( k ) { model[ k ] = th.v[ k ]; } );
					onChange( Object.keys( th.v )[ 0 ], th.v[ Object.keys( th.v )[ 0 ] ] );
					row.dispatchEvent( new CustomEvent( 'bc-refresh', { bubbles: true } ) );
				} }, h( 'i', { style: { background: 'linear-gradient(135deg,' + th.sw[ 0 ] + ' 0 55%,' + th.sw[ 1 ] + ' 55% 100%)' } } ), h( 'span', { text: th.name } ) ) );
			} );
			return h( 'div', { class: 'bc-field bc-col-full' }, h( 'div', { class: 'bc-field__label', text: label } ), row );
		} };
	}

	/** Every setting of the sticky coupon bar. part: all|code|copy|apply|cd|close|icon */
	function barFields( part ) {
		var o2 = function ( pairs ) { return pairs.map( function ( p ) { return { value: p[ 0 ], label: p[ 1 ] }; } ); };
		var on = function ( k ) { return function ( m ) { return !! m[ k ]; }; };
		var g = {
			main: [
				themePicker( BAR_THEMES(), t( 'تم آماده (یک کلیک؛ بعد هر رنگ را جدا عوض کنید)', 'Quick theme (one click, then fine-tune any color)' ) ),
				{ k: 'coupon_bar', type: 'switch', label: t( 'نوار کد تخفیف فعال باشد', 'Coupon bar enabled' ) },
				{ k: 'coupon_bar_text', label: t( 'متن ({code} = کد، {prize} = جایزه)', 'Text ({code} = code, {prize} = prize)' ) },
				{ k: 'coupon_bar_icon', type: 'emoji', label: t( 'آیکن ابتدای نوار', 'Leading icon' ), cols: 'half' },
				{ k: 'coupon_bar_position', type: 'segment', label: t( 'محل', 'Position' ), cols: 'half', opts: o2( [ [ 'bottom', t( 'پایین', 'Bottom' ) ], [ 'top', t( 'بالا', 'Top' ) ] ] ) },
				{ k: 'coupon_bar_layout', type: 'segment', label: t( 'شکل', 'Shape' ), opts: o2( [ [ 'full', t( 'تمام‌عرض', 'Full width' ) ], [ 'floating', t( 'شناور', 'Floating' ) ], [ 'pill', t( 'کپسولی', 'Pill' ) ] ] ) },
				{ k: 'coupon_bar_style', type: 'segment', label: t( 'سبک پس‌زمینه', 'Background style' ), opts: o2( [ [ 'solid', t( 'ساده', 'Solid' ) ], [ 'gradient', t( 'گرادیان', 'Gradient' ) ], [ 'glass', t( 'شیشه‌ای', 'Glass' ) ], [ 'ticket', t( 'بلیتی', 'Ticket' ) ] ] ) },
				{ k: 'coupon_bar_bg', type: 'color', label: t( 'رنگ پس‌زمینه', 'Background' ), cols: 'third' },
				{ k: 'coupon_bar_bg2', type: 'color', label: t( 'رنگ دوم', 'Second color' ), cols: 'third', show: function ( m ) { return m.coupon_bar_style === 'gradient' || m.coupon_bar_style === 'ticket'; } },
				{ k: 'coupon_bar_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'third' },
				{ k: 'coupon_bar_border', type: 'color', label: t( 'رنگ حاشیه (خالی = بدون)', 'Border (empty = none)' ), cols: 'half' },
				{ k: 'coupon_bar_shadow', type: 'segment', label: t( 'سایه', 'Shadow' ), cols: 'half', opts: o2( [ [ 'none', t( 'بدون', 'None' ) ], [ 'soft', t( 'نرم', 'Soft' ) ], [ 'strong', t( 'پررنگ', 'Strong' ) ] ] ) },
				{ k: 'coupon_bar_font', type: 'range', label: t( 'اندازه متن', 'Font size' ), min: 11, max: 22, unit: 'px', cols: 'half' },
				{ k: 'coupon_bar_radius', type: 'range', label: t( 'گردی گوشه (شناور/کپسولی)', 'Corner radius (floating/pill)' ), min: 0, max: 40, unit: 'px', cols: 'half', show: function ( m ) { return m.coupon_bar_layout !== 'full'; } },
				{ k: 'coupon_bar_anim', type: 'segment', label: t( 'انیمیشن ورود', 'Entrance animation' ), opts: o2( [ [ 'slide', t( 'کشویی', 'Slide' ) ], [ 'fade', t( 'محو', 'Fade' ) ], [ 'bounce', t( 'فنری', 'Bounce' ) ], [ 'none', t( 'بدون', 'None' ) ] ] ) },
			],
			code: [
				{ type: 'heading', label: t( 'کد تخفیف داخل نوار', 'Code in the bar' ) },
				{ k: 'coupon_bar_code_style', type: 'segment', label: t( 'نمایش کد', 'Code style' ), opts: o2( [ [ 'chip', t( 'برچسب', 'Chip' ) ], [ 'dashed', t( 'خط‌چین', 'Dashed' ) ], [ 'plain', t( 'ساده', 'Plain' ) ] ] ) },
				{ k: 'coupon_bar_code_bg', type: 'color', label: t( 'پس‌زمینه کد', 'Code background' ), cols: 'half' },
				{ k: 'coupon_bar_code_color', type: 'color', label: t( 'رنگ کد', 'Code color' ), cols: 'half' },
			],
			copy: [
				{ type: 'heading', label: t( 'دکمه کپی', 'Copy button' ) },
				{ k: 'coupon_bar_copy', type: 'switch', label: t( 'نمایش دکمه کپی', 'Show copy button' ) },
				{ k: 'coupon_bar_copy_label', label: t( 'متن دکمه (خالی = متن پیام‌ها)', 'Label (empty = Messages tab text)' ), show: on( 'coupon_bar_copy' ) },
				{ k: 'coupon_bar_copy_bg', type: 'color', label: t( 'رنگ دکمه (خالی = توخالی)', 'Button color (empty = outline)' ), cols: 'half', show: on( 'coupon_bar_copy' ) },
				{ k: 'coupon_bar_copy_color', type: 'color', label: t( 'رنگ متن دکمه', 'Button text' ), cols: 'half', show: on( 'coupon_bar_copy' ) },
			],
			apply: [
				{ type: 'heading', label: t( 'دکمه اعمال در سبد', 'Apply button' ) },
				{ k: 'coupon_bar_apply', type: 'switch', label: t( 'نمایش دکمه «اعمال در سبد خرید»', 'Show "apply to cart"' ) },
				{ k: 'coupon_bar_apply_label', label: t( 'متن دکمه (خالی = متن پیام‌ها)', 'Label (empty = Messages tab text)' ), show: on( 'coupon_bar_apply' ) },
				{ k: 'coupon_bar_apply_bg', type: 'color', label: t( 'رنگ دکمه', 'Button color' ), cols: 'half', show: on( 'coupon_bar_apply' ) },
				{ k: 'coupon_bar_apply_color', type: 'color', label: t( 'رنگ متن دکمه', 'Button text' ), cols: 'half', show: on( 'coupon_bar_apply' ) },
				{ k: 'coupon_bar_btn_radius', type: 'range', label: t( 'گردی دکمه‌ها', 'Buttons radius' ), min: 0, max: 40, unit: 'px', onSet: function ( v, m ) { if ( +v >= 40 ) { m.coupon_bar_btn_radius = 999; } } },
			],
			cd: [
				{ type: 'heading', label: t( 'شمارش معکوس', 'Countdown' ) },
				{ k: 'coupon_bar_countdown', type: 'switch', label: t( 'نمایش زمان باقی‌مانده تا انقضا', 'Show time left until expiry' ) },
				{ k: 'coupon_bar_cd_style', type: 'segment', label: t( 'سبک', 'Style' ), cols: 'half', opts: o2( [ [ 'text', t( 'متن', 'Text' ) ], [ 'chip', t( 'برچسب', 'Chip' ) ] ] ), show: on( 'coupon_bar_countdown' ) },
				{ k: 'coupon_bar_cd_color', type: 'color', label: t( 'رنگ', 'Color' ), cols: 'half', show: on( 'coupon_bar_countdown' ) },
			],
			close: [
				{ type: 'heading', label: t( 'دکمه بستن', 'Close button' ) },
				{ k: 'coupon_bar_close', type: 'switch', label: t( 'اجازه بستن (فقط تا پایان همین بازدید)', 'Allow closing (for this visit only)' ), help: t( 'خاموش باشد، نوار تا استفاده یا انقضای کد همیشه دیده می‌شود.', 'Off = the bar always stays until the code is used or expires.' ) },
				{ k: 'coupon_bar_close_color', type: 'color', label: t( 'رنگ ×', '× color' ), show: on( 'coupon_bar_close' ) },
			],
			rules: [
				{ type: 'heading', label: t( 'کی نمایش داده شود؟', 'When is it shown?' ) },
				{ type: 'note', label: t( 'نوار روی همه صفحات سایت می‌ماند تا وقتی کد منقضی شود. به‌محض اینکه کد در سبد خرید اعمال شود یا با آن سفارش ثبت شود، خودکار حذف می‌شود.', 'The bar stays on every page until the code expires. It disappears automatically once the code is applied to the cart or used in an order.' ) },
				{ k: 'coupon_bar_hide_applied', type: 'switch', label: t( 'وقتی کد در سبد خرید اعمال شد پنهان شود', 'Hide while the code is applied to the cart' ), help: t( 'اگر مشتری کد را از سبد حذف کند، نوار دوباره ظاهر می‌شود.', 'If the customer removes the code from the cart, the bar comes back.' ) },
				{ k: 'coupon_bar_account', type: 'switch', label: t( 'روی دستگاه‌های دیگر همان کاربر هم نمایش داده شود', 'Follow the account to other devices' ), help: t( 'برای کاربر واردشده یا شماره تاییدشده.', 'For logged-in users or verified phones.' ) },
				{ k: 'coupon_bar_mobile_compact', type: 'switch', label: t( 'موبایل: فقط کد و دکمه‌ها (بدون متن)', 'Mobile: code and buttons only' ) },
			],
		};
		if ( part === 'all' ) {
			return g.main.concat( g.code, g.copy, g.apply, g.cd, g.close, g.rules );
		}
		if ( part === 'icon' ) {
			return [ g.main[ 3 ], g.main[ 0 ] ];
		}
		return g[ part ];
	}

	/** Result/state styling (popup object). */
	function resultFields( part ) {
		var o2 = function ( pairs ) { return pairs.map( function ( p ) { return { value: p[ 0 ], label: p[ 1 ] }; } ); };
		var g = {
			code: [
				{ k: 'code_style', type: 'segment', label: t( 'قاب کد جایزه', 'Code box style' ), opts: o2( [ [ 'dashed', t( 'خط‌چین', 'Dashed' ) ], [ 'solid', t( 'ساده', 'Solid' ) ], [ 'ticket', t( 'بلیتی', 'Ticket' ) ], [ 'glow', t( 'درخشان', 'Glow' ) ], [ 'plain', t( 'بدون قاب', 'Plain' ) ] ] ) },
				{ k: 'code_bg', type: 'color', label: t( 'پس‌زمینه', 'Background' ), cols: 'third' },
				{ k: 'code_border', type: 'color', label: t( 'حاشیه', 'Border' ), cols: 'third' },
				{ k: 'code_color', type: 'color', label: t( 'رنگ کد', 'Code color' ), cols: 'third' },
			],
			copy: [
				{ k: 'copy_bg', type: 'color', label: t( 'رنگ دکمه کپی', 'Copy button' ), cols: 'half' },
				{ k: 'copy_color', type: 'color', label: t( 'رنگ متن کپی', 'Copy text' ), cols: 'half' },
			],
			apply: [
				{ k: 'apply_bg', type: 'color', label: t( 'رنگ ۱ دکمه (خالی = مثل دکمه چرخاندن)', 'Color 1 (empty = like spin button)' ), cols: 'third' },
				{ k: 'apply_bg2', type: 'color', label: t( 'رنگ ۲', 'Color 2' ), cols: 'third' },
				{ k: 'apply_color', type: 'color', label: t( 'رنگ متن', 'Text' ), cols: 'third' },
			],
			misc: [
				{ k: 'ghost_color', type: 'color', label: t( 'دکمه «دوباره بچرخون»', '"Spin again" button' ), cols: 'half' },
				{ k: 'link_color', type: 'color', label: t( 'لینک‌ها (ادامه/نه ممنون)', 'Links (continue/no thanks)' ), cols: 'half' },
				{ k: 'share_style', type: 'segment', label: t( 'دکمه‌های اشتراک', 'Share buttons' ), opts: o2( [ [ 'brand', t( 'رنگ برند', 'Brand colors' ) ], [ 'mono', t( 'رنگ تاکیدی', 'Accent' ) ], [ 'outline', t( 'توخالی', 'Outline' ) ] ] ) },
			],
			states: [
				{ k: 'msg_bg', type: 'color', label: t( 'پس‌زمینه کادر پیام', 'Message box background' ), cols: 'half' },
				{ k: 'msg_color', type: 'color', label: t( 'رنگ متن پیام', 'Message text' ), cols: 'half' },
				{ k: 'next_color', type: 'color', label: t( 'رنگ زمان شانس بعدی', 'Next-spin timer color' ), cols: 'half' },
				{ k: 'icon_login', type: 'emoji', label: t( 'آیکن ورود', 'Login icon' ), cols: 'half' },
				{ k: 'icon_wait', type: 'emoji', label: t( 'آیکن انتظار', 'Wait icon' ), cols: 'third' },
				{ k: 'icon_earn', type: 'emoji', label: t( 'آیکن بدون شانس', 'No-spins icon' ), cols: 'third' },
				{ k: 'icon_closed', type: 'emoji', label: t( 'آیکن پایان کمپین', 'Ended icon' ), cols: 'third' },
			],
		};
		return part === 'all' ? g.code.concat( g.copy, g.apply, g.misc, g.states ) : g[ part ];
	}
	/** Prefix field keys so they address a sub-object of a whole-config model (obj: '*'). */
	function scoped( prefix, list ) {
		return list.map( function ( f ) {
			var c = Object.assign( {}, f );
			if ( c.k ) {
				c.k = prefix + '.' + c.k;
			}
			if ( f.show ) {
				c.show = function ( m ) { return f.show( F.get( m, prefix ) || {} ); };
			}
			return c;
		} );
	}
	E.barFields = barFields;
	E.resultFields = resultFields;

	function visualRegistry() {
		var popupBg = [
			{ k: 'bg_type', type: 'segment', label: t( 'پس‌زمینه', 'Background' ), opts: o( [ [ 'color', t( 'رنگ', 'Color' ) ], [ 'gradient', t( 'گرادیان', 'Gradient' ) ], [ 'image', t( 'تصویر', 'Image' ) ], [ 'glass', t( 'شیشه‌ای', 'Glass' ) ] ] ) },
			{ k: 'bg_color', type: 'color', label: t( 'رنگ ۱', 'Color 1' ), cols: 'half' },
			{ k: 'bg_color2', type: 'color', label: t( 'رنگ ۲', 'Color 2' ), cols: 'half', show: function ( m ) { return m.bg_type === 'gradient'; } },
			{ k: 'bg_angle', type: 'range', label: t( 'زاویه گرادیان', 'Gradient angle' ), min: 0, max: 360, unit: '°', show: function ( m ) { return m.bg_type === 'gradient'; } },
			{ k: 'bg_image', type: 'image', label: t( 'تصویر پس‌زمینه', 'Background image' ), show: function ( m ) { return m.bg_type === 'image'; } },
			{ k: 'bg_image_opacity', type: 'range', label: t( 'شفافیت تصویر', 'Image opacity' ), min: 0, max: 1, step: 0.05, show: function ( m ) { return m.bg_type === 'image'; } },
			{ k: 'pattern', type: 'select', label: t( 'طرح روی پس‌زمینه', 'Pattern' ), cols: 'half', opts: o( [ [ 'none', t( 'بدون طرح', 'None' ) ], [ 'dots', t( 'نقطه', 'Dots' ) ], [ 'confetti', t( 'کاغذرنگی', 'Confetti' ) ], [ 'stars', t( 'ستاره', 'Stars' ) ], [ 'grid', t( 'شبکه', 'Grid' ) ], [ 'waves', t( 'موج', 'Waves' ) ], [ 'diagonal', t( 'مورب', 'Diagonal' ) ], [ 'snow', t( 'برف', 'Snow' ) ], [ 'hearts', t( 'قلب', 'Hearts' ) ] ] ) },
			{ k: 'pattern_color', type: 'color', label: t( 'رنگ طرح', 'Pattern color' ), cols: 'half' },
			{ k: 'width', type: 'range', label: t( 'عرض پاپ‌آپ', 'Popup width' ), min: 360, max: 1200, step: 10, unit: 'px' },
			{ k: 'radius', type: 'range', label: t( 'گردی گوشه‌ها', 'Corner radius' ), min: 0, max: 48, unit: 'px', cols: 'half' },
			{ k: 'padding', type: 'range', label: t( 'فاصله داخلی', 'Padding' ), min: 8, max: 64, unit: 'px', cols: 'half' },
			{ k: 'border_color', type: 'color', label: t( 'رنگ حاشیه', 'Border color' ), cols: 'half' },
			{ k: 'border_width', type: 'range', label: t( 'ضخامت حاشیه', 'Border width' ), min: 0, max: 8, unit: 'px', cols: 'half' },
			{ k: 'shadow', type: 'segment', label: t( 'سایه', 'Shadow' ), opts: o( [ [ 'none', t( 'بدون', 'None' ) ], [ 'md', 'M' ], [ 'lg', 'L' ], [ 'xl', 'XL' ], [ 'glow', t( 'درخشان', 'Glow' ) ] ] ) },
			{ k: 'text_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'half' },
			{ k: 'accent_color', type: 'color', label: t( 'رنگ تاکیدی', 'Accent color' ), cols: 'half' },
			{ k: 'layout', type: 'segment', label: t( 'چیدمان', 'Layout' ), opts: o( [ [ 'split', t( 'دو ستونه', 'Split' ) ], [ 'stack', t( 'عمودی', 'Stack' ) ], [ 'overlap', t( 'روی‌هم', 'Overlap' ) ], [ 'wheel-only', t( 'فقط گردونه', 'Wheel only' ) ] ] ) },
			{ k: 'wheel_side', type: 'segment', label: t( 'سمت گردونه', 'Wheel side' ), opts: o( [ [ 'start', t( 'راست', 'Start' ) ], [ 'end', t( 'چپ', 'End' ) ] ] ) },
		];
		var btn = [
			{ k: 'button_text', label: t( 'متن دکمه', 'Button text' ) },
			{ k: 'button_bg', type: 'color', label: t( 'رنگ ۱', 'Color 1' ), cols: 'half' },
			{ k: 'button_bg2', type: 'color', label: t( 'رنگ ۲ (گرادیان)', 'Color 2 (gradient)' ), cols: 'half' },
			{ k: 'button_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'half' },
			{ k: 'button_radius', type: 'range', label: t( 'گردی', 'Radius' ), min: 0, max: 40, unit: 'px', cols: 'half' },
			{ k: 'button_size', type: 'segment', label: t( 'اندازه', 'Size' ), opts: o( [ [ 'md', t( 'متوسط', 'M' ) ], [ 'lg', t( 'بزرگ', 'L' ) ], [ 'xl', t( 'خیلی بزرگ', 'XL' ) ] ] ) },
			{ k: 'button_animation', type: 'segment', label: t( 'انیمیشن', 'Animation' ), opts: o( [ [ 'shine', t( 'درخشش', 'Shine' ) ], [ 'pulse', t( 'تپش', 'Pulse' ) ], [ 'bounce', t( 'پرش', 'Bounce' ) ], [ 'glow', t( 'هاله', 'Glow' ) ], [ 'none', t( 'بدون', 'None' ) ] ] ) },
			{ k: 'button_full', type: 'switch', label: t( 'تمام‌عرض', 'Full width' ) },
		];
		var lnch = [
			{ k: 'launcher', type: 'switch', label: t( 'دکمه شناور فعال', 'Launcher enabled' ) },
			{ k: 'launcher_style', type: 'select', label: t( 'شکل', 'Style' ), cols: 'half', opts: o( [ [ 'wheel', t( 'گردونه کوچک', 'Mini wheel' ) ], [ 'gift', t( 'جعبه هدیه', 'Gift' ) ], [ 'pill', t( 'دکمه با متن', 'Pill with text' ) ], [ 'tab', t( 'زبانه کناری', 'Side tab' ) ], [ 'image', t( 'تصویر دلخواه', 'Custom image' ) ] ] ) },
			{ k: 'launcher_animation', type: 'select', label: t( 'انیمیشن', 'Animation' ), cols: 'half', opts: o( [ [ 'spin', t( 'چرخش', 'Spin' ) ], [ 'pulse', t( 'تپش', 'Pulse' ) ], [ 'shake', t( 'تکان', 'Shake' ) ], [ 'bounce', t( 'پرش', 'Bounce' ) ], [ 'none', t( 'بدون', 'None' ) ] ] ) },
			{ k: 'launcher_image', type: 'image', label: t( 'تصویر', 'Image' ), show: function ( m ) { return m.launcher_style === 'image'; } },
			{ k: 'launcher_text', label: t( 'متن / راهنما', 'Text / tooltip' ) },
			{ k: 'launcher_position', type: 'select', label: t( 'محل', 'Position' ), opts: o( [ [ 'bottom-start', t( 'پایین - ابتدا', 'Bottom start' ) ], [ 'bottom-end', t( 'پایین - انتها', 'Bottom end' ) ], [ 'middle-start', t( 'وسط - ابتدا', 'Middle start' ) ], [ 'middle-end', t( 'وسط - انتها', 'Middle end' ) ], [ 'top-start', t( 'بالا - ابتدا', 'Top start' ) ], [ 'top-end', t( 'بالا - انتها', 'Top end' ) ] ] ) },
			{ k: 'launcher_bg', type: 'color', label: t( 'رنگ', 'Color' ), cols: 'half' },
			{ k: 'launcher_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'half' },
			{ k: 'launcher_size', type: 'range', label: t( 'اندازه', 'Size' ), min: 36, max: 120, unit: 'px' },
			{ k: 'launcher_offset_x', type: 'number', label: t( 'فاصله افقی', 'Horizontal offset' ), cols: 'half' },
			{ k: 'launcher_offset_y', type: 'number', label: t( 'فاصله عمودی', 'Vertical offset' ), cols: 'half' },
			{ k: 'launcher_badge', type: 'switch', label: t( 'نشان تعداد شانس‌ها', 'Spins-left badge' ) },
		];
		var pg = [ 'page' ];
		return [
			{ sel: '.bchw-bar-code', views: pg, label: t( 'کد تخفیف نوار', 'Bar code' ), tab: 'display', obj: 'display', fields: barFields( 'code' ) },
			{ sel: '.bchw-bar-copy', views: pg, label: t( 'دکمه کپی نوار', 'Bar copy button' ), tab: 'display', obj: 'display', text: 'coupon_bar_copy_label', fields: barFields( 'copy' ) },
			{ sel: '.bchw-bar-apply', views: pg, label: t( 'دکمه اعمال نوار', 'Bar apply button' ), tab: 'display', obj: 'display', text: 'coupon_bar_apply_label', fields: barFields( 'apply' ) },
			{ sel: '.bchw-bar-cd', views: pg, label: t( 'شمارش معکوس نوار', 'Bar countdown' ), tab: 'display', obj: 'display', fields: barFields( 'cd' ) },
			{ sel: '.bchw-bar-x', views: pg, label: t( 'بستن نوار', 'Bar close' ), tab: 'display', obj: 'display', fields: barFields( 'close' ) },
			{ sel: '.bchw-bar', views: pg, label: t( 'نوار چسبان کد تخفیف', 'Sticky coupon bar' ), tab: 'display', obj: 'display', fields: barFields( 'all' ) },
			{ sel: '.bchw-launcher', views: pg, label: t( 'دکمه شناور گردونه', 'Floating launcher' ), tab: 'display', obj: 'display', fields: lnch },
			{ sel: '.bchw-mock-off', views: pg, label: t( 'نوار کد تخفیف', 'Coupon bar' ), tab: 'display', obj: 'display', fields: barFields( 'all' ) },
			{ sel: '.bchw-copy', views: [ 'win' ], label: t( 'دکمه کپی کد', 'Copy button' ), tab: 'messages', obj: '*', text: 'messages.copy_text', fields: [ { k: 'messages.copy_text', label: t( 'متن', 'Text' ), cols: 'half' }, { k: 'messages.copied_text', label: t( 'بعد از کپی', 'After copy' ), cols: 'half' } ].concat( scoped( 'popup', resultFields( 'copy' ) ) ) },
			{ sel: '.bchw-code', views: [ 'win' ], label: t( 'کد جایزه', 'Prize code' ), tab: 'popup', obj: 'popup', fields: resultFields( 'code' ) },
			{ sel: '.bchw-btn-ghost', views: [ 'win', 'lose' ], label: t( 'دکمه دوباره بچرخون', 'Spin-again button' ), tab: 'messages', obj: '*', text: 'messages.spin_again_text', fields: [ { k: 'messages.spin_again_text', label: t( 'متن', 'Text' ) }, { k: 'popup.ghost_color', type: 'color', label: t( 'رنگ', 'Color' ) } ] },
			{ sel: '.bchw-btn-apply', views: [ 'win' ], label: t( 'دکمه اعمال در سبد', 'Apply button' ), tab: 'messages', obj: '*', text: 'messages.apply_text', fields: [ { k: 'messages.apply_text', label: t( 'متن', 'Text' ) }, { k: 'messages.apply_redirect', type: 'select', label: t( 'بعد از کلیک برود به', 'Then go to' ), opts: o( [ [ 'cart', t( 'سبد خرید', 'Cart' ) ], [ 'checkout', t( 'تسویه حساب', 'Checkout' ) ], [ 'shop', t( 'فروشگاه', 'Shop' ) ], [ 'stay', t( 'همین صفحه', 'Stay' ) ], [ 'custom', t( 'آدرس دلخواه', 'Custom URL' ) ] ] ) } ].concat( scoped( 'popup', resultFields( 'apply' ) ) ) },
			{ sel: '.bchw-gift', label: t( 'محصول هدیه برنده‌شده', 'Won gift product' ), tab: 'messages', obj: 'messages', fields: [ { k: 'gift_text', label: t( 'عنوان کادر هدیه', 'Gift box title' ) }, { k: 'gift_hint', label: t( 'راهنمای زیر هدیه', 'Hint under the gift' ) }, { type: 'note', label: t( 'محصولات هدیه در تب «جوایز»، جایزه «محصول هدیه» تعیین می‌شوند.', 'Gift products are set on the prize in the Prizes tab.' ) } ] },
			{ sel: '.bchw-left', label: t( 'متن شانس‌های باقی‌مانده', 'Spins-left text' ), tab: 'messages', obj: 'messages', fields: [ { k: 'spins_left_text', label: t( 'متن ({n})', 'Text ({n})' ) } ] },
			{ sel: '.bchw-share', label: t( 'دعوت دوستان', 'Invite friends' ), tab: 'messages', obj: '*', fields: [ { k: 'messages.show_share', type: 'switch', label: t( 'نمایش', 'Show' ) }, { k: 'messages.share_text', label: t( 'متن', 'Text' ) }, { k: 'popup.share_style', type: 'segment', label: t( 'سبک دکمه‌ها', 'Buttons style' ), opts: o( [ [ 'brand', t( 'رنگ برند', 'Brand' ) ], [ 'mono', t( 'رنگ تاکیدی', 'Accent' ) ], [ 'outline', t( 'توخالی', 'Outline' ) ] ] ) } ] },
			{ sel: '.bchw-btn-login', views: [ 'login' ], label: t( 'دکمه ورود', 'Login button' ), tab: 'form', obj: 'form', text: 'login_button', fields: [ { k: 'login_button', label: t( 'متن دکمه', 'Button text' ) }, { k: 'login_url', label: t( 'آدرس صفحه ورود (خالی = پیش‌فرض)', 'Login URL (empty = default)' ), dir: 'ltr' } ].concat( btn.slice( 1, 5 ) ) },
			{ sel: '.bchw-msg', views: [ 'login' ], label: t( 'پیام ورود', 'Login message' ), tab: 'form', obj: '*', text: 'form.login_text', fields: [ { k: 'form.login_text', label: t( 'متن', 'Text' ) }, { k: 'popup.icon_login', type: 'emoji', label: t( 'آیکن', 'Icon' ) } ].concat( scoped( 'popup', resultFields( 'states' ).slice( 0, 2 ) ) ) },
			{ sel: '.bchw-msg', views: [ 'earn' ], label: t( 'پیام بدون شانس', 'No-spins message' ), tab: 'messages', obj: '*', text: 'messages.no_spins_text', fields: [ { k: 'messages.no_spins_text', label: t( 'متن', 'Text' ) }, { k: 'popup.icon_earn', type: 'emoji', label: t( 'آیکن', 'Icon' ) } ].concat( scoped( 'popup', resultFields( 'states' ).slice( 0, 2 ) ) ) },
			{ sel: '.bchw-msg', views: [ 'wait' ], label: t( 'پیام انتظار', 'Cooldown message' ), tab: 'messages', obj: '*', fields: [ { k: 'messages.cooldown_text', label: t( 'متن ({time})', 'Text ({time})' ) }, { k: 'messages.limit_text', label: t( 'وقتی سهمیه تمام شده', 'When the quota is used up' ) }, { k: 'popup.icon_wait', type: 'emoji', label: t( 'آیکن', 'Icon' ) } ].concat( scoped( 'popup', resultFields( 'states' ).slice( 0, 2 ) ) ) },
			{ sel: '.bchw-next', views: [ 'wait' ], label: t( 'زمان شانس بعدی', 'Next-spin timer' ), tab: 'popup', obj: 'popup', fields: [ { k: 'next_color', type: 'color', label: t( 'رنگ', 'Color' ) } ] },
			{ sel: '.bchw-earn-title, .bchw-earn', views: [ 'earn' ], label: t( 'راه‌های گرفتن شانس', 'How to earn' ), tab: 'access', obj: '*', fields: [ { k: 'messages.earn_title', label: t( 'عنوان', 'Title' ) }, { k: 'access.show_how_to_earn', type: 'switch', label: t( 'نمایش فهرست قوانین شانس', 'Show earning rules' ) }, { k: 'messages.earn_text', type: 'html', label: t( 'متن اضافه', 'Extra text' ), rows: 2 }, { type: 'note', label: t( 'فهرست از «قوانین شانس» ساخته می‌شود.', 'The list comes from the earning rules.' ) } ] },
			{ sel: '.bchw-otp', label: t( 'کد تایید پیامکی', 'SMS verification' ), tab: 'form', obj: 'form', fields: [ { k: 'otp_send_text', label: t( 'متن دکمه ارسال کد', 'Send-code button' ) }, { k: 'otp_label', label: t( 'متن کادر کد', 'Code field placeholder' ) }, { k: 'otp_bg', type: 'color', label: t( 'رنگ دکمه', 'Button color' ), cols: 'half' }, { k: 'otp_color', type: 'color', label: t( 'رنگ متن دکمه', 'Button text' ), cols: 'half' } ] },
			{ sel: '.bchw-badge', label: t( 'نشان بالای عنوان', 'Badge' ), tab: 'popup', obj: 'popup', text: 'badge', fields: [ { k: 'badge', label: t( 'متن نشان (خالی = حذف)', 'Badge text (empty = hide)' ) }, { k: 'badge_bg', type: 'color', label: t( 'پس‌زمینه', 'Background' ), cols: 'half' }, { k: 'badge_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'half' } ] },
			{ sel: '.bchw-head .bchw-title, .bchw-body > .bchw-title:not(.is-result)', views: [ 'form', 'earn', 'wait', 'login' ], label: t( 'عنوان', 'Title' ), tab: 'popup', obj: 'popup', text: 'title', fields: [ { k: 'title', label: t( 'متن عنوان', 'Title' ) }, { k: 'title_color', type: 'color', label: t( 'رنگ', 'Color' ), cols: 'half' }, { k: 'title_size', type: 'range', label: t( 'اندازه', 'Size' ), min: 14, max: 56, unit: 'px', cols: 'half' }, { k: 'title_weight', type: 'segment', label: t( 'ضخامت', 'Weight' ), opts: o( [ [ 500, t( 'معمولی', 'Normal' ) ], [ 700, t( 'پررنگ', 'Bold' ) ], [ 900, t( 'خیلی پررنگ', 'Black' ) ] ] ) } ] },
			{ sel: '.bchw-title', views: [ 'win' ], label: t( 'عنوان برد', 'Win title' ), tab: 'messages', obj: 'messages', text: 'win_title', fields: [ { k: 'win_title', label: t( 'عنوان برد ({name} = نام)', 'Win title ({name})' ) } ] },
			{ sel: '.bchw-title', views: [ 'lose' ], label: t( 'عنوان پوچ', 'Loss title' ), tab: 'messages', obj: 'messages', text: 'lose_title', fields: [ { k: 'lose_title', label: t( 'عنوان پوچ', 'Loss title' ) } ] },
			{ sel: '.bchw-subtitle', label: t( 'زیرعنوان', 'Subtitle' ), tab: 'popup', obj: 'popup', text: 'subtitle', fields: [ { k: 'subtitle', label: t( 'متن زیرعنوان', 'Subtitle' ) }, { k: 'subtitle_color', type: 'color', label: t( 'رنگ', 'Color' ) } ] },
			{ sel: '.bchw-res-text', views: [ 'win' ], label: t( 'متن برد', 'Win text' ), tab: 'messages', obj: 'messages', html: 'win_text', fields: [ { k: 'win_text', type: 'html', label: t( 'متن برد ({prize} = جایزه)', 'Win text ({prize})' ), rows: 3 } ] },
			{ sel: '.bchw-res-text', views: [ 'lose' ], label: t( 'متن پوچ', 'Loss text' ), tab: 'messages', obj: 'messages', html: 'lose_text', fields: [ { k: 'lose_text', type: 'html', label: t( 'متن پوچ', 'Loss text' ), rows: 3 } ] },
			{ sel: '.bchw-head .bchw-desc', label: t( 'توضیحات', 'Description' ), tab: 'popup', obj: 'popup', html: 'description', fields: [ { k: 'description', type: 'html', label: t( 'متن توضیحات', 'Description' ), rows: 3 }, { k: 'text_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'half' }, { k: 'muted_color', type: 'color', label: t( 'رنگ کم‌رنگ', 'Muted color' ), cols: 'half' }, { k: 'font_scale', type: 'range', label: t( 'مقیاس فونت کل', 'Font scale' ), min: 0.8, max: 1.4, step: 0.05 } ] },
			{ sel: '.bchw-logo', label: t( 'لوگو', 'Logo' ), tab: 'popup', obj: 'popup', fields: [ { k: 'logo', type: 'image', label: t( 'تصویر لوگو', 'Logo image' ) }, { k: 'logo_width', type: 'range', label: t( 'عرض', 'Width' ), min: 40, max: 260, unit: 'px' } ] },
			{ sel: '.bchw-countdown', label: t( 'شمارش معکوس', 'Countdown' ), tab: 'popup', obj: 'popup', fields: [ { k: 'countdown', type: 'switch', label: t( 'نمایش', 'Show' ) }, { k: 'countdown_label', label: t( 'متن', 'Label' ) }, { k: 'countdown_mode', type: 'segment', label: t( 'نوع', 'Mode' ), opts: o( [ [ 'evergreen', t( 'برای هر بازدیدکننده', 'Per visitor' ) ], [ 'fixed', t( 'تا تاریخ مشخص', 'Fixed date' ) ] ] ) }, { k: 'countdown_minutes', type: 'number', label: t( 'دقیقه', 'Minutes' ), cols: 'half', show: function ( m ) { return m.countdown_mode === 'evergreen'; } }, { k: 'countdown_deadline', type: 'datetime', label: t( 'تا تاریخ', 'Deadline' ), cols: 'half', show: function ( m ) { return m.countdown_mode === 'fixed'; } }, { k: 'countdown_style', type: 'segment', label: t( 'سبک', 'Style' ), opts: o( [ [ 'boxes', t( 'جعبه‌ای', 'Boxes' ) ], [ 'inline', t( 'ساده', 'Inline' ) ] ] ) }, { k: 'countdown_bg', type: 'color', label: t( 'رنگ جعبه‌ها', 'Box color' ), cols: 'half' }, { k: 'countdown_color', type: 'color', label: t( 'رنگ اعداد', 'Digits color' ), cols: 'half' } ] },
			{ sel: '.bchw-social', label: t( 'اثبات اجتماعی', 'Social proof' ), tab: 'popup', obj: 'popup', fields: [ { k: 'social_proof', type: 'switch', label: t( 'نمایش', 'Show' ) }, { k: 'social_text', label: t( 'متن ({count})', 'Text ({count})' ) }, { k: 'social_min', type: 'number', label: t( 'حداقل تعداد برای نمایش', 'Minimum count' ) }, { k: 'social_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'half' }, { k: 'social_dot_color', type: 'color', label: t( 'رنگ نقطه زنده', 'Live dot' ), cols: 'half' } ] },
			{ sel: '.bchw-ticker', label: t( 'نوار برندگان', 'Winners ticker' ), tab: 'popup', obj: 'popup', fields: [ { k: 'ticker', type: 'switch', label: t( 'نمایش', 'Show' ) }, { k: 'ticker_text', label: t( 'متن ({name} {prize})', 'Text ({name} {prize})' ) }, { k: 'ticker_count', type: 'number', label: t( 'تعداد', 'Count' ) }, { k: 'ticker_bg', type: 'color', label: t( 'پس‌زمینه', 'Background' ), cols: 'half' }, { k: 'ticker_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'half' } ] },
			{ sel: '.bchw-trust', label: t( 'آیتم‌های اعتماد', 'Trust items' ), tab: 'popup', obj: 'popup', fields: [ { k: 'trust_items', type: 'list', label: t( 'هر خط یک آیتم', 'One per line' ), rows: 4 } ] },
			{ sel: '.bchw-footer', label: t( 'پاورقی', 'Footer' ), tab: 'popup', obj: 'popup', html: 'footer_text', fields: [ { k: 'footer_text', type: 'html', label: t( 'متن پاورقی', 'Footer text' ), rows: 2 } ] },
			{ sel: '.bchw-nothanks', views: [ 'form' ], label: t( 'دکمه «نه ممنون»', '"No thanks" button' ), tab: 'popup', obj: 'popup', text: 'no_thanks_text', fields: [ { k: 'no_thanks', type: 'switch', label: t( 'نمایش', 'Show' ) }, { k: 'no_thanks_text', label: t( 'متن', 'Text' ) }, { k: 'no_thanks_days', type: 'number', label: t( 'تا چند روز دوباره نمایش داده نشود', 'Hide for days' ) }, { k: 'link_color', type: 'color', label: t( 'رنگ', 'Color' ) } ] },
			{ sel: '.bchw-nothanks', views: [ 'win', 'lose' ], label: t( 'دکمه ادامه', 'Continue button' ), tab: 'messages', obj: '*', text: 'messages.continue_text', fields: [ { k: 'messages.continue_text', label: t( 'متن', 'Text' ) }, { k: 'popup.link_color', type: 'color', label: t( 'رنگ', 'Color' ) } ] },
			{ sel: '.bchw-nothanks', views: [ 'earn', 'wait', 'login' ], label: t( 'دکمه بستن', 'Close link' ), tab: 'popup', obj: 'popup', fields: [ { k: 'link_color', type: 'color', label: t( 'رنگ', 'Color' ) } ] },
			{ sel: '.bchw-close', label: t( 'دکمه بستن', 'Close button' ), tab: 'popup', obj: 'popup', fields: [ { k: 'close_show', type: 'switch', label: t( 'نمایش', 'Show' ) }, { k: 'close_style', type: 'segment', label: t( 'سبک', 'Style' ), opts: o( [ [ 'circle', t( 'دایره', 'Circle' ) ], [ 'square', t( 'مربع', 'Square' ) ], [ 'plain', t( 'ساده', 'Plain' ) ], [ 'text', t( 'متنی', 'Text' ) ] ] ) }, { k: 'close_position', type: 'segment', label: t( 'محل', 'Position' ), opts: o( [ [ 'end', t( 'گوشه', 'Corner' ) ], [ 'start', t( 'گوشه مقابل', 'Other corner' ) ], [ 'outside', t( 'بیرون', 'Outside' ) ] ] ) }, { k: 'close_color', type: 'color', label: t( 'رنگ', 'Color' ), cols: 'half' }, { k: 'close_bg', type: 'color', label: t( 'پس‌زمینه', 'Background' ), cols: 'half' }, { k: 'close_delay', type: 'number', label: t( 'ظاهر شدن بعد از (ثانیه)', 'Show after (s)' ) } ] },
			{ sel: '.bchw-codebox, .bchw-code-label', label: t( 'جعبه کد جایزه', 'Code box' ), tab: 'popup', obj: '*', fields: [ { k: 'messages.code_label', label: t( 'عنوان', 'Label' ) }, { k: 'messages.copy_text', label: t( 'دکمه کپی', 'Copy button' ), cols: 'half' }, { k: 'messages.copied_text', label: t( 'بعد از کپی', 'After copy' ), cols: 'half' } ].concat( scoped( 'popup', resultFields( 'code' ).concat( resultFields( 'copy' ) ) ) ) },
			{ sel: '.bchw-expiry', label: t( 'متن اعتبار', 'Expiry text' ), tab: 'messages', obj: 'messages', text: 'expires_text', fields: [ { k: 'expires_text', label: t( 'متن ({expiry})', 'Text ({expiry})' ) } ] },
			{ sel: '.bchw-res-ic', label: t( 'ایموجی نتیجه', 'Result emoji' ), tab: 'design', obj: 'design', fields: [ { k: 'win_emoji', type: 'emoji', label: t( 'ایموجی برد', 'Win emoji' ) }, { k: 'win_effect', type: 'select', label: t( 'افکت برد', 'Win effect' ), opts: o( [ [ 'confetti', t( 'کاغذرنگی', 'Confetti' ) ], [ 'fireworks', t( 'آتش‌بازی', 'Fireworks' ) ], [ 'coins', t( 'سکه', 'Coins' ) ], [ 'stars', t( 'ستاره', 'Stars' ) ], [ 'hearts', t( 'قلب', 'Hearts' ) ], [ 'snow', t( 'برف', 'Snow' ) ], [ 'emoji', t( 'ایموجی', 'Emoji' ) ], [ 'balloons', t( 'بادکنک', 'Balloons' ) ], [ 'none', t( 'بدون', 'None' ) ] ] ) } ] },
			{ sel: '.bchw-form .bchw-btn, .bchw-form button[type=submit]', label: t( 'دکمه چرخاندن', 'Spin button' ), tab: 'form', obj: 'form', text: 'button_text', fields: btn },
			{ sel: '.bchw-consent', label: t( 'تیک قوانین', 'Terms checkbox' ), tab: 'form', obj: 'form', fields: [ { k: 'consent.enabled', type: 'switch', label: t( 'نمایش', 'Show' ) }, { k: 'consent.required', type: 'switch', label: t( 'الزامی', 'Required' ) }, { k: 'consent.text', type: 'html', label: t( 'متن (HTML/لینک مجاز)', 'Text (HTML allowed)' ), rows: 2 } ] },
			{ sel: '.bchw-marketing', label: t( 'تیک دریافت پیشنهاد', 'Marketing checkbox' ), tab: 'form', obj: 'form', fields: [ { k: 'marketing.enabled', type: 'switch', label: t( 'نمایش', 'Show' ) }, { k: 'marketing.checked', type: 'switch', label: t( 'پیش‌فرض تیک‌خورده', 'Checked by default' ) }, { k: 'marketing.text', label: t( 'متن', 'Text' ) } ] },
			{ sel: '.bchw-field', label: t( 'فیلد فرم', 'Form field' ), tab: 'form', field: true },
			{ sel: '.bchw-hub', label: t( 'مرکز گردونه', 'Wheel center' ), tab: 'design', obj: 'design', fields: [ { k: 'center_style', type: 'select', label: t( 'سبک', 'Style' ), opts: o( [ [ 'button', t( 'دکمه', 'Button' ) ], [ 'circle', t( 'دایره', 'Circle' ) ], [ 'star', t( 'ستاره', 'Star' ) ], [ 'logo', t( 'لوگو', 'Logo' ) ], [ 'gem', t( 'جواهر', 'Gem' ) ], [ 'none', t( 'بدون', 'None' ) ] ] ) }, { k: 'center_text', label: t( 'متن', 'Text' ), cols: 'half' }, { k: 'center_text_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'half' }, { k: 'center_color', type: 'color', label: t( 'رنگ ۱', 'Color 1' ), cols: 'third' }, { k: 'center_color2', type: 'color', label: t( 'رنگ ۲', 'Color 2' ), cols: 'third' }, { k: 'center_border', type: 'color', label: t( 'دور', 'Border' ), cols: 'third' }, { k: 'center_size', type: 'range', label: t( 'اندازه', 'Size' ), min: 0.1, max: 0.4, step: 0.01 }, { k: 'center_image', type: 'image', label: t( 'تصویر / لوگو', 'Image / logo' ) }, { k: 'center_clickable', type: 'switch', label: t( 'کلیک روی مرکز = چرخاندن', 'Click center to spin' ) } ] },
			{ sel: '.bchw-pointer', label: t( 'نشانگر', 'Pointer' ), tab: 'design', obj: 'design', fields: [ { k: 'pointer_style', type: 'select', label: t( 'شکل', 'Shape' ), opts: o( [ [ 'arrow', t( 'پیکان', 'Arrow' ) ], [ 'pin', t( 'سنجاق', 'Pin' ) ], [ 'triangle', t( 'مثلث', 'Triangle' ) ], [ 'drop', t( 'قطره', 'Drop' ) ], [ 'diamond', t( 'الماس', 'Diamond' ) ], [ 'ticker', t( 'تیکر', 'Ticker' ) ], [ 'image', t( 'تصویر', 'Image' ) ] ] ) }, { k: 'pointer_position', type: 'segment', label: t( 'محل', 'Position' ), opts: o( [ [ 'top', t( 'بالا', 'Top' ) ], [ 'right', t( 'راست', 'Right' ) ], [ 'bottom', t( 'پایین', 'Bottom' ) ], [ 'left', t( 'چپ', 'Left' ) ] ] ) }, { k: 'pointer_color', type: 'color', label: t( 'رنگ', 'Color' ), cols: 'half' }, { k: 'pointer_stroke', type: 'color', label: t( 'دور', 'Stroke' ), cols: 'half' }, { k: 'pointer_size', type: 'range', label: t( 'اندازه', 'Size' ), min: 0.6, max: 1.8, step: 0.05 }, { k: 'pointer_image', type: 'image', label: t( 'تصویر نشانگر', 'Pointer image' ), show: function ( m ) { return m.pointer_style === 'image'; } }, { k: 'pointer_bounce', type: 'switch', label: t( 'تکان هنگام عبور از میخ‌ها', 'Bounce on pegs' ) } ] },
			{ sel: '.bchw-rim, .bchw-lights, .bchw-peg', label: t( 'قاب و چراغ‌ها', 'Rim & lights' ), tab: 'design', obj: 'design', fields: [ { k: 'rim_style', type: 'select', label: t( 'سبک قاب', 'Rim style' ), opts: o( [ [ 'lights', t( 'چراغ‌دار', 'Lights' ) ], [ 'solid', t( 'ساده', 'Solid' ) ], [ 'double', t( 'دوخطی', 'Double' ) ], [ 'dots', t( 'نقطه‌ای', 'Dots' ) ], [ 'metal', t( 'فلزی', 'Metal' ) ], [ 'neon', t( 'نئونی', 'Neon' ) ], [ 'none', t( 'بدون', 'None' ) ] ] ) }, { k: 'rim_color', type: 'color', label: t( 'رنگ ۱', 'Color 1' ), cols: 'half' }, { k: 'rim_color2', type: 'color', label: t( 'رنگ ۲', 'Color 2' ), cols: 'half' }, { k: 'rim_width', type: 'range', label: t( 'ضخامت', 'Width' ), min: 0, max: 40, unit: 'px' }, { k: 'light_count', type: 'range', label: t( 'تعداد چراغ', 'Lights' ), min: 4, max: 40 }, { k: 'light_color', type: 'color', label: t( 'رنگ چراغ ۱', 'Light 1' ), cols: 'half' }, { k: 'light_color2', type: 'color', label: t( 'رنگ چراغ ۲', 'Light 2' ), cols: 'half' }, { k: 'light_animation', type: 'segment', label: t( 'انیمیشن', 'Animation' ), opts: o( [ [ 'chase', t( 'دنباله', 'Chase' ) ], [ 'blink', t( 'چشمک', 'Blink' ) ], [ 'alternate', t( 'متناوب', 'Alternate' ) ], [ 'pulse', t( 'تپش', 'Pulse' ) ], [ 'none', t( 'ثابت', 'None' ) ] ] ) }, { k: 'pegs', type: 'switch', label: t( 'میخ بین بخش‌ها', 'Pegs' ) } ] },
			{ sel: '.bchw-slice', label: t( 'بخش گردونه (جایزه)', 'Wheel slice (prize)' ), tab: 'slices', slice: true },
			{ sel: '.bchw-svg, .bchw-wheelbox, .bchw-stage', label: t( 'گردونه', 'Wheel' ), tab: 'design', obj: 'design', fields: [ { k: 'size', type: 'range', label: t( 'اندازه دسکتاپ', 'Desktop size' ), min: 240, max: 640, unit: 'px', cols: 'half' }, { k: 'size_mobile', type: 'range', label: t( 'اندازه موبایل', 'Mobile size' ), min: 200, max: 420, unit: 'px', cols: 'half' }, { k: 'text_orientation', type: 'segment', label: t( 'جهت متن', 'Text direction' ), opts: o( [ [ 'radial', t( 'شعاعی', 'Radial' ) ], [ 'horizontal', t( 'افقی', 'Horizontal' ) ], [ 'curved', t( 'منحنی', 'Curved' ) ] ] ) }, { k: 'font_size', type: 'range', label: t( 'اندازه متن', 'Font size' ), min: 9, max: 28, unit: 'px', cols: 'half' }, { k: 'text_position', type: 'range', label: t( 'فاصله متن از مرکز', 'Text distance' ), min: 0.3, max: 0.85, step: 0.01, cols: 'half' }, { k: 'text_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'half' }, { k: 'slice_border_color', type: 'color', label: t( 'رنگ خط بین بخش‌ها', 'Divider color' ), cols: 'half' }, { k: 'slice_gradient', type: 'switch', label: t( 'گرادیان بخش‌ها', 'Slice gradient' ), cols: 'half' }, { k: 'gloss', type: 'switch', label: t( 'براقیت', 'Gloss' ), cols: 'half' }, { k: 'glow', type: 'switch', label: t( 'هاله', 'Glow' ), cols: 'half' }, { k: 'glow_color', type: 'color', label: t( 'رنگ هاله', 'Glow color' ), cols: 'half' }, { k: 'idle_rotate', type: 'switch', label: t( 'چرخش آرام قبل از شروع', 'Idle rotation' ) } ] },
			{ sel: '.bchw-mute', label: t( 'صدا', 'Sound' ), tab: 'design', obj: 'design', fields: [ { k: 'sound', type: 'switch', label: t( 'صدا فعال', 'Sound on' ) }, { k: 'sound_volume', type: 'range', label: t( 'بلندی', 'Volume' ), min: 0, max: 1, step: 0.05 }, { k: 'mute_button', type: 'switch', label: t( 'دکمه قطع صدا', 'Mute button' ) } ] },
			{ sel: '.bchw-overlay', label: t( 'پس‌زمینه تیره صفحه', 'Page overlay' ), tab: 'popup', obj: 'popup', fields: [ { k: 'overlay_color', type: 'color', label: t( 'رنگ', 'Color' ) }, { k: 'overlay_opacity', type: 'range', label: t( 'تیرگی', 'Opacity' ), min: 0, max: 1, step: 0.02 }, { k: 'overlay_blur', type: 'range', label: t( 'محو کردن صفحه', 'Blur' ), min: 0, max: 16, unit: 'px' }, { k: 'close_overlay', type: 'switch', label: t( 'کلیک بیرون = بستن', 'Click outside closes' ) } ] },
			{ sel: '.bchw-dialog', label: t( 'کادر پاپ‌آپ', 'Popup box' ), tab: 'popup', obj: 'popup', fields: popupBg },
		];
	}

	Preview.prototype.setupVisual = function () {
		var self = this;
		var canvas = this.canvas;
		this.hoverEl = null;
		var tag = h( 'div', { class: 'bce-tag', hidden: true } );
		this.stage.appendChild( tag );
		var showTag = function ( el, label ) {
			if ( ! el ) {
				tag.hidden = true;
				return;
			}
			var r = el.getBoundingClientRect();
			var sr = self.stage.getBoundingClientRect();
			tag.textContent = label + ( self.selected && self.selected.el === el ? '' : '  ✎' );
			tag.hidden = false;
			var top = Math.max( 18, r.top - sr.top - 4 );
			tag.style.top = top + 'px';
			tag.style.left = Math.max( 4, Math.min( sr.width - 160, r.left - sr.left ) ) + 'px';
		};
		canvas.addEventListener( 'mouseover', function ( e ) {
			if ( ! self.editing || self.inlineEl ) {
				return;
			}
			var p = self.pick( e.target, e.clientX, e.clientY );
			var el = p ? p.el : null;
			if ( el !== self.hoverEl ) {
				if ( self.hoverEl ) {
					self.hoverEl.classList.remove( 'bce-hover' );
				}
				self.hoverEl = el;
				if ( el ) {
					el.classList.add( 'bce-hover' );
				}
				showTag( el, p ? ( p.entry.slice ? t( 'جایزه', 'Prize' ) + ' ' + BC.num( p.index + 1, 0 ) : p.entry.label ) : '' );
			}
		} );
		canvas.addEventListener( 'mouseleave', function () {
			if ( self.hoverEl ) {
				self.hoverEl.classList.remove( 'bce-hover' );
				self.hoverEl = null;
			}
			showTag( null );
		} );
		var swallow = function ( e ) {
			if ( ! self.editing ) {
				return;
			}
			if ( self.inlineEl && self.inlineEl.contains( e.target ) ) {
				return; // Typing inside an inline-edited text.
			}
			if ( /^(INPUT|SELECT|TEXTAREA)$/.test( e.target.tagName ) && e.type !== 'click' ) {
				return;
			}
			if ( self.justDragged ) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			var p = self.pick( e.target, e.clientX, e.clientY );
			if ( ! p ) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			if ( e.type === 'click' ) {
				self.select( p );
			} else if ( e.type === 'dblclick' ) {
				self.inline( p );
			}
		};
		// Drag the selected element to move it (Elementor-like); saved per device as layout x/y.
		canvas.addEventListener( 'pointerdown', function ( e ) {
			if ( ! self.editing || self.inlineEl || e.button !== 0 || ! self.selected ) {
				return;
			}
			var p = self.pick( e.target, e.clientX, e.clientY );
			var key = self.layoutKey( p );
			if ( ! key || key !== self.layoutKey( self.selected ) ) {
				return;
			}
			var m = self.layoutModel( key );
			var sx = e.clientX, sy = e.clientY, bx = +m.x || 0, by = +m.y || 0, moved = false, sc = self.scale || 1;
			var nodes = canvas.querySelectorAll( '[data-bch-el="' + key + '"]' );
			canvas.classList.add( 'is-dragging' );
			var mv = function ( ev ) {
				var dx = ( ev.clientX - sx ) / sc, dy = ( ev.clientY - sy ) / sc;
				if ( ! moved && Math.abs( dx ) + Math.abs( dy ) < 3 ) {
					return;
				}
				moved = true;
				Array.prototype.forEach.call( nodes, function ( n ) {
					n.style.setProperty( '--bch-tx', Math.round( bx + dx ) + 'px' );
					n.style.setProperty( '--bch-ty', Math.round( by + dy ) + 'px' );
				} );
				tag.hidden = true;
			};
			var up = function ( ev ) {
				d.removeEventListener( 'pointermove', mv );
				d.removeEventListener( 'pointerup', up );
				canvas.classList.remove( 'is-dragging' );
				if ( moved ) {
					self.justDragged = true;
					setTimeout( function () { self.justDragged = false; }, 60 );
					self.nudge( key, ( ev.clientX - sx ) / sc, ( ev.clientY - sy ) / sc );
				}
			};
			d.addEventListener( 'pointermove', mv );
			d.addEventListener( 'pointerup', up );
			e.preventDefault();
		}, true );
		d.addEventListener( 'keydown', function ( e ) {
			if ( ! self.editing || ! self.selected || self.inlineEl || ! /^Arrow/.test( e.key ) || ! d.body.contains( canvas ) ) {
				return;
			}
			var a = d.activeElement;
			if ( a && ( /^(INPUT|SELECT|TEXTAREA)$/.test( a.tagName ) || a.isContentEditable ) ) {
				return;
			}
			var key = self.layoutKey( self.selected );
			if ( ! key ) {
				return;
			}
			e.preventDefault();
			var step = e.shiftKey ? 10 : 1;
			self.nudge( key, e.key === 'ArrowLeft' ? -step : ( e.key === 'ArrowRight' ? step : 0 ), e.key === 'ArrowUp' ? -step : ( e.key === 'ArrowDown' ? step : 0 ) );
		} );
		canvas.addEventListener( 'click', swallow, true );
		canvas.addEventListener( 'dblclick', swallow, true );
		canvas.addEventListener( 'submit', function ( e ) { if ( self.editing ) { e.preventDefault(); e.stopPropagation(); } }, true );
	};

	/** Which registry entry a clicked node belongs to (walks up from the node). */
	Preview.prototype.pick = function ( node, x, y ) {
		var reg = this.reg || ( this.reg = visualRegistry() );
		var view = this.view;
		var canvas = this.canvas;
		for ( var el = node; el && el !== canvas; el = el.parentNode ) {
			if ( ! el.matches ) {
				continue;
			}
			for ( var i = 0; i < reg.length; i++ ) {
				var r = reg[ i ];
				if ( r.views && r.views.indexOf( view ) === -1 ) {
					continue;
				}
				if ( el.matches( r.sel ) ) {
					if ( r.sel.indexOf( '.bchw-svg' ) === 0 && x !== undefined ) {
						// Inside the wheel: a slice under the pointer beats the generic "wheel" entry.
						var under = d.elementsFromPoint( x, y ).filter( function ( n ) { return n.classList && n.classList.contains( 'bchw-slice' ); } )[ 0 ];
						if ( under ) {
							return { entry: reg.filter( function ( q ) { return q.slice; } )[ 0 ], el: under, index: +under.getAttribute( 'data-i' ) };
						}
					}
					var out = { entry: r, el: el };
					if ( r.slice ) {
						out.index = +el.getAttribute( 'data-i' );
					}
					if ( r.field ) {
						var inp = el.querySelector( '[data-id]' );
						out.fieldId = inp ? inp.getAttribute( 'data-id' ) : '';
					}
					return out;
				}
			}
		}
		return null;
	};

	Preview.prototype.target = function ( p ) {
		var st = this.state;
		if ( p.entry.slice ) {
			var s = st.cfg.slices[ p.index ];
			if ( ! s ) {
				return null;
			}
			return {
				obj: s,
				title: t( 'جایزه: ', 'Prize: ' ) + ( s.label || '#' + ( p.index + 1 ) ),
				fields: [
					{ k: 'label', label: t( 'متن روی گردونه', 'Label' ) },
					{ k: 'sublabel', label: t( 'زیرعنوان', 'Sub-label' ), cols: 'half' },
					{ k: 'icon', type: 'emoji', label: t( 'ایموجی', 'Emoji' ), cols: 'half' },
					{ k: 'type', type: 'select', label: t( 'نوع جایزه', 'Prize type' ), opts: E.TYPES().map( function ( x ) { return { value: x.value, label: x.label }; } ) },
					{ k: 'value', type: 'number', label: t( 'مقدار (درصد/مبلغ/تعداد)', 'Value (percent/amount/count)' ), cols: 'half', unit: function ( m ) { return F.valueUnit( m.type ); }, show: function ( m ) { return [ 'coupon_percent', 'coupon_fixed_cart', 'coupon_fixed_product', 'wallet', 'points', 'extra_spin' ].indexOf( m.type ) > -1; } },
					{ k: 'weight', type: 'number', label: t( 'وزن شانس', 'Weight' ), cols: 'half', min: 0 },
					{ k: 'stock', type: 'number', label: t( 'موجودی (-۱ = نامحدود)', 'Stock (-1 = unlimited)' ), cols: 'half' },
					{ k: 'color', type: 'color', label: t( 'رنگ بخش', 'Slice color' ), cols: 'half' },
					{ k: 'color2', type: 'color', label: t( 'رنگ دوم (گرادیان)', 'Second color' ), cols: 'half' },
					{ k: 'text_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'half' },
					{ k: 'image', type: 'image', label: t( 'تصویر', 'Image' ) },
					{ k: 'highlight', type: 'switch', label: t( 'جایزه ویژه (درخشش)', 'Highlight' ), cols: 'half' },
					{ k: 'hidden_label', type: 'switch', label: t( 'مخفی کردن متن', 'Hide label' ), cols: 'half' },
				],
				text: 'label',
			};
		}
		if ( p.entry.field ) {
			var fd = null;
			st.cfg.form.fields.forEach( function ( f ) { if ( f.id === p.fieldId ) { fd = f; } } );
			if ( ! fd ) {
				return null;
			}
			return {
				obj: fd,
				title: t( 'فیلد: ', 'Field: ' ) + ( fd.label || fd.id ),
				fields: [
					{ k: 'label', label: t( 'عنوان', 'Label' ) },
					{ k: 'placeholder', label: t( 'متن داخل کادر', 'Placeholder' ) },
					{ k: 'required', type: 'switch', label: t( 'الزامی', 'Required' ), cols: 'half' },
					{ k: 'enabled', type: 'switch', label: t( 'فعال', 'Enabled' ), cols: 'half' },
					{ k: 'width', type: 'segment', label: t( 'عرض', 'Width' ), opts: o( [ [ 'full', t( 'کامل', 'Full' ) ], [ 'half', t( 'نصف', 'Half' ) ] ] ) },
					{ type: 'heading', label: t( 'ظاهر همه فیلدها', 'All fields' ) },
					{ k: '__form.field_bg', type: 'color', label: t( 'پس‌زمینه', 'Background' ), cols: 'half' },
					{ k: '__form.field_border', type: 'color', label: t( 'حاشیه', 'Border' ), cols: 'half' },
					{ k: '__form.field_text', type: 'color', label: t( 'رنگ متن', 'Text' ), cols: 'half' },
					{ k: '__form.field_radius', type: 'range', label: t( 'گردی', 'Radius' ), min: 0, max: 24, unit: 'px', cols: 'half' },
					{ k: '__form.label_color', type: 'color', label: t( 'رنگ عنوان فیلدها', 'Labels color' ), cols: 'half' },
				],
				text: 'label',
				labelOnly: true,
			};
		}
		var dev = this.device || 'desktop';
		var obj = p.entry.obj === '*' ? deviceModel( st.cfg, st.cfg, '', dev ) : deviceModel( st.cfg, st.cfg[ p.entry.obj ], p.entry.obj, dev );
		return { obj: obj, title: p.entry.label, fields: p.entry.fields, text: p.entry.text, html: p.entry.html };
	};

	Preview.prototype.select = function ( p ) {
		var self = this;
		var tg = this.target( p );
		if ( ! tg ) {
			return;
		}
		this.selected = p;
		this.markSelected();
		var st = this.state;
		// Fields of the form field inspector may address the whole form via "__form.".
		var model = tg.obj;
		var proxy = model;
		if ( p.entry.field ) {
			proxy = Object.create( null );
			proxy.__form = deviceModel( st.cfg, st.cfg.form, 'form', this.device || 'desktop' );
			Object.keys( model ).forEach( function ( k ) {
				Object.defineProperty( proxy, k, { enumerable: true, get: function () { return model[ k ]; }, set: function ( v ) { model[ k ] = v; } } );
			} );
		}
		var tabsKeys = [ 'slices', 'access', 'design', 'popup', 'form', 'display', 'targeting', 'coupon', 'messages', 'notify', 'schedule', 'advanced' ];
		var editable = tg.text || tg.html;
		BC.clear( this.insp );
		this.insp.hidden = false;
		this.insp.appendChild( h( 'div', { class: 'bc-insp__head' },
			h( 'span', { class: 'bc-insp__dot' } ),
			h( 'b', { text: tg.title } ),
			h( 'span', { class: 'bc-spacer' } ),
			p.entry.tab ? h( 'button', { type: 'button', class: 'bc-btn bc-btn--sm bc-btn--ghost', title: t( 'همه تنظیمات در تب مربوط', 'All settings in its tab' ), onClick: function () { if ( st.openTab ) { st.openTab( tabsKeys.indexOf( p.entry.tab ), p.entry.slice ? p.index : null ); } } }, BC.icon( 'external', 13 ), t( 'تب کامل', 'Full tab' ) ) : null,
			h( 'button', { type: 'button', class: 'bc-icon-btn', 'aria-label': t( 'بستن', 'Close' ), onClick: function () { self.deselect(); } }, BC.icon( 'x', 15 ) )
		) );
		if ( editable ) {
			this.insp.appendChild( h( 'p', { class: 'bc-insp__hint', text: t( '💡 روی همین متن در پیش‌نمایش دوبار کلیک کنید و مستقیم تایپ کنید.', '💡 Double-click the text in the preview to type directly.' ) } ) );
		}
		var onCh = function () {
			st.dirty();
			clearTimeout( self.tabTimer );
			self.tabTimer = setTimeout( function () { if ( st.reloadTab && ! self.inlineEl ) { st.reloadTab(); } }, 700 );
		};
		var dev = this.device || 'desktop';
		if ( dev !== 'desktop' && ! p.entry.slice ) {
			this.insp.appendChild( h( 'p', { class: 'bc-insp__dev' }, BC.icon( dev === 'mobile' ? 'smartphone' : 'tablet', 14 ), h( 'span', { text: dev === 'mobile' ? t( 'رنگ، اندازه و جای این بخش فقط برای موبایل تغییر می‌کند (متن‌ها برای همه یکی است).', 'Colors, sizes and position change for mobile only (texts are shared).' ) : t( 'رنگ، اندازه و جای این بخش فقط برای تبلت تغییر می‌کند (متن‌ها برای همه یکی است).', 'Colors, sizes and position change for tablet only (texts are shared).' ) } ) ) );
		}
		var body = F.render( tg.fields, proxy, onCh );
		body.classList.add( 'bc-insp__body' );
		this.insp.appendChild( body );
		var lkey = this.layoutKey( p );
		if ( lkey ) {
			this.insp.appendChild( this.layoutPanel( lkey, onCh ) );
		}
	};

	/** Which movable element (Elementor-like layout) a picked node belongs to. */
	Preview.prototype.layoutKey = function ( p ) {
		if ( ! p || ! p.el || ! p.el.closest ) {
			return '';
		}
		var n = p.el.closest( '[data-bch-el]' );
		return n && this.canvas.contains( n ) ? n.getAttribute( 'data-bch-el' ) : '';
	};
	Preview.prototype.layoutModel = function ( key ) {
		var st = this.state;
		if ( ! st.cfg.layout[ key ] || Array.isArray( st.cfg.layout[ key ] ) ) {
			st.cfg.layout[ key ] = {};
		}
		return deviceModel( st.cfg, st.cfg.layout[ key ], 'layout.' + key, this.device || 'desktop' );
	};
	/** "Position & size" section: align, move X/Y, spacing, width, hide per device. */
	Preview.prototype.layoutPanel = function ( key, onCh ) {
		var self = this;
		var m = this.layoutModel( key );
		var noAlign = key === 'wheel' || key === 'close';
		var box = h( 'div', { class: 'bc-insp__layout' } );
		var dev = this.device || 'desktop';
		var devName = { desktop: t( 'دسکتاپ', 'desktop' ), tablet: t( 'تبلت', 'tablet' ), mobile: t( 'موبایل', 'mobile' ) }[ dev ];
		box.appendChild( h( 'h4', { class: 'bc-form-heading' }, BC.icon( 'move', 16 ), h( 'span', { text: t( 'جایگاه و اندازه', 'Position & size' ) + ' — ' + devName } ) ) );
		box.appendChild( h( 'p', { class: 'bc-insp__hint', text: t( '✋ روی همین بخش در پیش‌نمایش کلیک کنید و بکشید تا جابه‌جا شود؛ با کلیدهای جهت‌نما ۱ پیکسل (با Shift ده پیکسل) حرکت می‌کند.', '✋ Drag this part in the preview to move it; arrow keys nudge 1px (Shift = 10px).' ) } ) );
		var defs = [];
		if ( ! noAlign ) {
			defs.push( { k: 'align', type: 'segment', label: t( 'تراز', 'Alignment' ), opts: [ { value: '', label: t( 'پیش‌فرض', 'Default' ) }, { value: 'start', label: t( 'ابتدا', 'Start' ) }, { value: 'center', label: t( 'وسط', 'Center' ) }, { value: 'end', label: t( 'انتها', 'End' ) } ] } );
		}
		defs.push(
			{ k: 'x', type: 'range', label: t( 'جابه‌جایی افقی', 'Move horizontally' ), min: -400, max: 400, dflt: 0, unit: 'px', cols: 'half' },
			{ k: 'y', type: 'range', label: t( 'جابه‌جایی عمودی', 'Move vertically' ), min: -400, max: 400, dflt: 0, unit: 'px', cols: 'half' }
		);
		if ( key !== 'close' ) {
			defs.push(
				{ k: 'mt', type: 'number', label: t( 'فاصله بالا (px)', 'Space above (px)' ), cols: 'half', allowEmpty: true },
				{ k: 'mb', type: 'number', label: t( 'فاصله پایین (px)', 'Space below (px)' ), cols: 'half', allowEmpty: true }
			);
		}
		if ( ! noAlign ) {
			defs.push( { k: 'w', type: 'range', label: t( 'عرض (۰ = خودکار)', 'Width (0 = auto)' ), min: 0, max: 100, dflt: 0, unit: '%' } );
		}
		defs.push( { k: 'hide', type: 'switch', label: t( 'در ', 'Hide on ' ) + devName + t( ' پنهان شود', '' ) } );
		box.appendChild( F.render( defs, m, onCh ) );
		box.appendChild( BC.btn( BC.il( 'refresh', t( 'بازگشت به حالت پیش‌فرض', 'Reset position' ), 14 ), function () {
			[ 'align', 'x', 'y', 'mt', 'mb', 'w', 'hide' ].forEach( function ( k ) {
				if ( dev === 'desktop' ) {
					delete self.state.cfg.layout[ key ][ k ];
				} else {
					delete self.state.cfg.responsive[ dev ][ 'layout.' + key + '.' + k ];
				}
			} );
			onCh();
			if ( self.selected ) {
				self.select( self.selected );
			}
		}, 'sm ghost' ) );
		return box;
	};
	/** Move the selected element by (dx, dy) px for the current device. */
	Preview.prototype.nudge = function ( key, dx, dy, commit ) {
		var m = this.layoutModel( key );
		var x = ( +m.x || 0 ) + dx, y = ( +m.y || 0 ) + dy;
		x = Math.max( -800, Math.min( 800, Math.round( x ) ) );
		y = Math.max( -800, Math.min( 800, Math.round( y ) ) );
		m.x = x;
		m.y = y;
		if ( commit !== false ) {
			this.state.dirty();
			var self = this;
			clearTimeout( this.nudgeTimer );
			this.nudgeTimer = setTimeout( function () { if ( self.selected ) { self.select( self.selected ); } }, 250 );
		}
	};
	Preview.prototype.devNote = function () {
		var dev = this.device || 'desktop';
		if ( ! this.devBar ) {
			return;
		}
		BC.clear( this.devBar );
		this.devBar.hidden = dev === 'desktop';
		if ( dev === 'desktop' ) {
			return;
		}
		var self = this;
		var ov = this.state.cfg.responsive[ dev ] || {};
		var n = Object.keys( ov ).length;
		this.devBar.appendChild( BC.icon( dev === 'mobile' ? 'smartphone' : 'tablet', 15 ) );
		this.devBar.appendChild( h( 'span', { text: ( dev === 'mobile' ? t( 'حالت ویرایش موبایل', 'Editing mobile' ) : t( 'حالت ویرایش تبلت', 'Editing tablet' ) ) + ' — ' + t( 'هر تغییری که در ویرایش زنده بدهید فقط روی همین دستگاه اعمال می‌شود.', 'live-edit changes apply to this device only.' ) + ( n ? ' (' + BC.num( n, 0 ) + t( ' تنظیم اختصاصی)', ' custom settings)' ) : '' ) } ) );
		if ( n ) {
			this.devBar.appendChild( h( 'button', { type: 'button', class: 'bc-btn bc-btn--sm bc-btn--ghost', onClick: function () {
				BC.confirm( t( 'همه تنظیمات اختصاصی این دستگاه پاک شود و مثل دسکتاپ شود؟', 'Remove all custom settings of this device?' ), function () { self.state.cfg.responsive[ dev ] = {}; self.state.dirty(); self.deselect(); self.devNote(); }, true );
			}, text: t( 'مثل دسکتاپ شود', 'Same as desktop' ) } ) );
		}
	};

	Preview.prototype.deselect = function () {
		this.selected = null;
		this.insp.hidden = true;
		BC.clear( this.insp );
		var old = this.canvas.querySelectorAll( '.bce-selected' );
		Array.prototype.forEach.call( old, function ( n ) { n.classList.remove( 'bce-selected' ); } );
	};

	/** After every re-render, find the selected element again and outline it. */
	Preview.prototype.markSelected = function () {
		var canvas = this.canvas;
		Array.prototype.forEach.call( canvas.querySelectorAll( '.bce-selected' ), function ( n ) { n.classList.remove( 'bce-selected' ); } );
		var p = this.selected;
		if ( ! p || ! this.editing ) {
			return;
		}
		var el = null;
		if ( p.entry.slice ) {
			el = canvas.querySelector( '.bchw-slice[data-i="' + p.index + '"]' );
		} else if ( p.entry.field ) {
			var inp = canvas.querySelector( '[data-id="' + p.fieldId + '"]' );
			el = inp ? inp.closest( '.bchw-field' ) : null;
		} else {
			var all = canvas.querySelectorAll( p.entry.sel );
			el = all.length ? all[ 0 ] : null;
		}
		if ( el ) {
			el.classList.add( 'bce-selected' );
			p.el = el;
		}
	};

	/** Type directly into a text in the preview. */
	Preview.prototype.inline = function ( p ) {
		var self = this;
		var tg = this.target( p );
		if ( ! tg || ! ( tg.text || tg.html ) ) {
			this.select( p );
			return;
		}
		this.select( p );
		var el = p.el;
		if ( p.entry.slice ) {
			return; // SVG text: edited in the inspector.
		}
		if ( p.entry.field ) {
			el = el.querySelector( '.bchw-label' ) || el;
		}
		var span = el.querySelector( ':scope > span' );
		if ( span && ( el.tagName === 'BUTTON' || el.tagName === 'A' ) ) {
			el = span;
		}
		var key = tg.html || tg.text;
		var st = this.state;
		el.setAttribute( 'contenteditable', 'true' );
		el.classList.add( 'bce-inline' );
		this.inlineEl = el;
		el.focus();
		try {
			var range = d.createRange();
			range.selectNodeContents( el );
			var sel = w.getSelection();
			sel.removeAllRanges();
			sel.addRange( range );
		} catch ( e ) {}
		var finish = function () {
			el.removeEventListener( 'blur', finish );
			el.removeAttribute( 'contenteditable' );
			el.classList.remove( 'bce-inline' );
			self.inlineEl = null;
			st.dirty();
			if ( self.selected ) {
				self.select( self.selected );
			}
			if ( st.reloadTab ) {
				st.reloadTab();
			}
		};
		el.addEventListener( 'input', function () {
			var v = tg.html ? el.innerHTML : el.innerText.replace( /\n+$/, '' );
			if ( p.entry.field ) {
				v = v.replace( /\s*\*$/, '' );
			}
			if ( key.indexOf( '.' ) > -1 ) {
				F.set( tg.obj, key, v );
			} else {
				tg.obj[ key ] = v;
			}
			if ( st.touch ) {
				st.touch();
			}
		} );
		el.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' || ( e.key === 'Enter' && ! tg.html && ! e.shiftKey ) ) {
				e.preventDefault();
				el.blur();
			}
		} );
		el.addEventListener( 'blur', finish );
	};

	/* ------------------------------------------------------------------ slice editor */

	function oddsBar( cfg ) {
		var total = cfg.slices.reduce( function ( a, s ) { return a + Math.max( 0, +s.weight || 0 ); }, 0 );
		var pal = cfg.design.palette;
		var bar = h( 'div', { class: 'bc-odds' } );
		cfg.slices.forEach( function ( s, i ) {
			var p = total ? ( Math.max( 0, +s.weight || 0 ) / total * 100 ) : 0;
			if ( p <= 0 ) {
				return;
			}
			bar.appendChild( h( 'span', { class: 'bc-odds__seg', title: s.label + ' — ' + BC.num( p, 1 ) + '%', style: { width: p + '%', background: s.color || pal[ i % pal.length ] } } ) );
		} );
		var wins = cfg.slices.filter( function ( s ) { return [ 'lose', 'respin' ].indexOf( s.type ) === -1; } ).reduce( function ( a, s ) { return a + Math.max( 0, +s.weight || 0 ); }, 0 );
		return h( 'div', { class: 'bc-odds-wrap' }, bar, h( 'div', { class: 'bc-odds__sum' },
			h( 'span', null, t( 'شانس برد کلی: ', 'Overall win chance: ' ), h( 'b', { text: BC.num( total ? wins / total * 100 : 0, 1 ) + '%' } ) ),
			h( 'span', { class: 'bc-muted', text: t( 'درصدها از نسبت «وزن»ها محاسبه می‌شوند؛ جمع وزن‌ها لازم نیست ۱۰۰ باشد.', 'Percentages come from weight ratios; weights need not add up to 100.' ) } )
		) );
	}

	function sliceDetails( s, i, st, redraw ) {
		var pal = st.cfg.design.palette;
		var ch = function () { st.dirty(); };
		var isType = function () {
			var list = Array.prototype.slice.call( arguments );
			return function () { return list.indexOf( s.type ) > -1; };
		};
		var woo = BC.config.woo;
		var integ = ( BC.boot && BC.boot.integrations ) || {};
		var defs = [
			{ k: 'label', label: t( 'متن روی گردونه', 'Label on the wheel' ), cols: 'half' },
			{ k: 'sublabel', label: t( 'زیرنویس (اختیاری)', 'Sub-label (optional)' ), cols: 'half' },
			{ k: 'type', type: 'select', label: t( 'نوع جایزه', 'Prize type' ), opts: TYPES(), cols: 'half', onSet: function () { redraw(); } },
			{ k: 'value', type: 'number', label: t( 'مقدار', 'Value' ), cols: 'half', min: 0, unit: function ( m ) { return F.valueUnit( m.type ); }, show: isType( 'coupon_percent', 'coupon_fixed_cart', 'coupon_fixed_product', 'wallet', 'points', 'extra_spin' ), help: { coupon_percent: t( 'درصد تخفیف (۱ تا ۱۰۰)', 'Discount percent' ), coupon_fixed_cart: t( 'مبلغ تخفیف', 'Discount amount' ), coupon_fixed_product: t( 'مبلغ تخفیف هر محصول', 'Discount per product' ), wallet: t( 'مبلغ شارژ کیف پول', 'Wallet amount' ), points: t( 'تعداد امتیاز', 'Points' ), extra_spin: t( 'تعداد شانس اضافه', 'Number of extra spins' ) }[ s.type ] || '' },
			{ k: 'coupon_code', label: t( 'کد تخفیف موجود', 'Existing coupon code' ), dir: 'ltr', show: isType( 'existing_coupon' ), help: t( 'کدی که از قبل در ووکامرس ساخته‌اید.', 'A coupon you already created in WooCommerce.' ) },
			{ type: 'note', label: t( 'از بین محصولات زیر (محصولات سایت + محصولات دستی) برای هر برنده یکی به‌صورت تصادفی انتخاب و در پاپ‌آپ به او نشان داده می‌شود. وقتی کد را در سبد خرید بزند، همان محصول رایگان با برچسب «🎁 هدیه گردونه شانس» به سبدش اضافه می‌شود. محصولات ناموجود خودکار کنار گذاشته می‌شوند.', 'For every winner one product is drawn at random from the list below (site products + manual products) and shown in the popup. When the code is applied in the cart, that product is added for free, labelled "🎁 Lucky wheel gift". Out-of-stock products are skipped.' ), show: isType( 'free_product' ) },
			{ k: 'product_ids', type: 'products', label: t( 'محصولات هدیه از سایت (یکی به‌صورت تصادفی)', 'Gift products from the shop (one at random)' ), show: isType( 'free_product' ) },
			{ type: 'custom', render: function () { return s.type === 'free_product' ? giftItems( s, ch ) : h( 'span' ); } },
			{ k: 'codes_text', type: 'textarea', label: t( 'افزودن کدها (هر خط یک کد)', 'Add codes (one per line)' ), rows: 4, dir: 'ltr', mono: true, show: isType( 'code_pool' ), help: ( st.pools && st.pools[ s.id ] ? t( 'موجود: %1 — استفاده‌شده: %2', 'Available: %1 — used: %2', BC.num( st.pools[ s.id ].available, 0 ), BC.num( st.pools[ s.id ].used, 0 ) ) + '. ' : '' ) + t( 'هر برنده یک کد یکتا می‌گیرد؛ کدهای تکراری نادیده گرفته می‌شوند. بعد از ذخیره، کدها به انبار منتقل و این کادر خالی می‌شود.', 'Each winner gets one unique code; duplicates are skipped. Saved codes move to the pool and this box empties.' ) },
			{ k: 'custom_text', type: 'html', label: t( 'توضیح جایزه', 'Prize description' ), show: isType( 'custom' ) },
			{ k: 'requires_claim', type: 'switch', label: t( 'دریافت اطلاعات تحویل از برنده', 'Collect delivery details' ), show: isType( 'custom' ), help: t( 'برای جایزه فیزیکی: فرم آدرس/تلفن بعد از برد نمایش داده می‌شود.', 'For physical prizes: shows an address/phone form after winning.' ) },
			{ k: 'claim_fields', type: 'segment', label: t( 'فرم تحویل', 'Claim form' ), opts: [ { value: 'address', label: t( 'آدرس کامل', 'Full address' ) }, { value: 'phone', label: t( 'فقط تلفن', 'Phone only' ) }, { value: 'note', label: t( 'توضیحات', 'Note' ) } ], show: function () { return s.type === 'custom' && s.requires_claim; } },
			{ k: 'link_url', label: t( 'آدرس لینک / فایل', 'Link / file URL' ), dir: 'ltr', show: isType( 'link' ), cols: 'half' },
			{ k: 'link_text', label: t( 'متن دکمه', 'Button text' ), show: isType( 'link' ), cols: 'half' },
			{ k: 'weight', type: 'number', label: t( 'وزن شانس', 'Chance weight' ), min: 0, step: 'any', cols: 'third', help: t( '۰ = هرگز برنده نمی‌شود (فقط نمایشی)', '0 = never wins (display only)' ) },
			{ k: 'stock', type: 'number', label: t( 'موجودی کل', 'Total stock' ), cols: 'third', help: ( st.stock && st.stock[ s.id ] ? t( 'برده‌شده: %1 / باقی: %2', 'Won: %1 / left: %2', BC.num( st.stock[ s.id ].won, 0 ), BC.num( st.stock[ s.id ].left, 0 ) ) + ' — ' : '' ) + t( '-۱ = نامحدود', '-1 = unlimited' ) },
			{ k: 'daily_cap', type: 'number', label: t( 'سقف برد روزانه', 'Daily win cap' ), min: 0, cols: 'third', help: t( '۰ = بدون سقف', '0 = no cap' ) },
			{ k: 'user_cap', type: 'number', label: t( 'سقف برد هر نفر', 'Per-person cap' ), min: 0, cols: 'third', help: t( 'هر نفر حداکثر چند بار این جایزه را ببرد', 'How many times one person can win this' ) },
			{ k: 'expiry_days', type: 'number', label: t( 'اعتبار (روز)', 'Valid for (days)' ), cols: 'third', show: isType( 'coupon_percent', 'coupon_fixed_cart', 'coupon_fixed_product', 'free_shipping', 'free_product', 'code_pool' ), help: t( '-۱ = طبق تنظیمات کوپن', '-1 = coupon default' ) },
			{ k: 'min_spend', type: 'number', label: t( 'حداقل خرید برای استفاده', 'Minimum spend' ), min: 0, unit: F.cur(), cols: 'third', show: isType( 'coupon_percent', 'coupon_fixed_cart', 'coupon_fixed_product', 'free_shipping', 'free_product' ), help: t( '۰ = طبق تنظیمات کوپن', '0 = coupon default' ) },
			{ k: 'max_discount', type: 'number', label: t( 'سقف مبلغ تخفیف', 'Maximum discount' ), min: 0, unit: F.cur(), cols: 'third', show: isType( 'coupon_percent' ), help: t( 'مثلاً ۲۰٪ تا سقف ۱۰۰ هزار', 'e.g. 20% up to a cap' ) },
			{ k: 'free_shipping_too', type: 'switch', label: t( 'ارسال رایگان هم بدهد', 'Also free shipping' ), show: isType( 'coupon_percent', 'coupon_fixed_cart', 'coupon_fixed_product' ) },
			{ type: 'heading', label: t( 'ظاهر این بخش', 'Slice look' ), icon: 'palette' },
			{ k: 'color', type: 'color', label: t( 'رنگ', 'Color' ), cols: 'third', placeholder: pal[ i % pal.length ] },
			{ k: 'color2', type: 'color', label: t( 'رنگ دوم (گرادیان)', 'Second color' ), cols: 'third' },
			{ k: 'text_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'third' },
			{ k: 'icon', type: 'emoji', label: t( 'آیکن / ایموجی', 'Icon / emoji' ), cols: 'half' },
			{ k: 'image', type: 'image', label: t( 'تصویر (به‌جای آیکن)', 'Image (instead of icon)' ), cols: 'half' },
			{ k: 'image_size', type: 'range', label: t( 'اندازه تصویر', 'Image size' ), min: 12, max: 90, unit: 'px', show: function () { return !! s.image; } },
			{ k: 'highlight', type: 'switch', label: t( 'جایزه ویژه (درخشش)', 'Highlight (jackpot)' ), cols: 'half' },
			{ k: 'hidden_label', type: 'switch', label: t( 'مخفی کردن متن روی گردونه', 'Hide label on the wheel' ), cols: 'half' },
			{ k: 'message', type: 'html', label: t( 'پیام اختصاصی بعد از برد/باخت', 'Custom result message' ), rows: 2, help: t( 'خالی = پیام عمومی. متغیرها: {name} {prize} {code} {expiry}', 'Empty = default. Variables: {name} {prize} {code} {expiry}' ) },
			{ type: 'custom', render: function () {
				return h( 'div', { class: 'bc-sub' }, h( 'h4', { class: 'bc-form-heading' }, BC.icon( 'filter', 16 ), h( 'span', { text: t( 'چه کسی می‌تواند این جایزه را ببرد؟', 'Who can win this prize?' ) } ) ),
					F.conditions( s.conditions, 'any', ch, { title: t( 'محدود کردن این جایزه با شرط', 'Restrict this prize with conditions' ), off: t( 'همه می‌توانند این جایزه را ببرند. مثلاً جایزه بزرگ را فقط برای سبد بالای ۱ میلیون فعال کنید.', 'Everyone can win it. e.g. offer the jackpot only to carts above a threshold.' ), presets: F.audiencePresets() } ) );
			} },
		];
		if ( ! woo && [ 'coupon_percent', 'coupon_fixed_cart', 'coupon_fixed_product', 'free_shipping', 'free_product', 'existing_coupon' ].indexOf( s.type ) > -1 ) {
			defs.unshift( { type: 'note', label: t( 'ووکامرس فعال نیست؛ این جایزه برنده نمی‌شود.', 'WooCommerce is not active; this prize can not be won.' ) } );
		}
		if ( s.type === 'wallet' && ! integ.wallet ) {
			defs.unshift( { type: 'note', label: t( 'افزونه کیف پول (TeraWallet یا YITH) پیدا نشد.', 'No wallet plugin (TeraWallet / YITH) detected.' ) } );
		}
		if ( s.type === 'points' && ! integ.points ) {
			defs.unshift( { type: 'note', label: t( 'افزونه امتیاز (WooCommerce Points، myCRED، GamiPress، YITH) پیدا نشد.', 'No points plugin detected.' ) } );
		}
		return F.render( defs, s, function ( k ) {
			if ( k === 'label' || k === 'color' || k === 'icon' || k === 'weight' || k === 'type' ) {
				st.refreshList && st.refreshList();
			}
			ch();
		} );
	}

	function slicesTab( st ) {
		var cfg = st.cfg;
		var wrap = h( 'div' );
		var openIdx = st.openSlice !== undefined && st.openSlice !== null ? st.openSlice : -1;
		st.openSlice = null;
		function draw() {
			BC.clear( wrap );
			var list = h( 'div', { class: 'bc-slices' } );
			var total = cfg.slices.reduce( function ( a, s ) { return a + Math.max( 0, +s.weight || 0 ); }, 0 );
			cfg.slices.forEach( function ( s, i ) {
				var pct = total ? Math.max( 0, +s.weight || 0 ) / total * 100 : 0;
				var color = s.color || cfg.design.palette[ i % cfg.design.palette.length ];
				var lose = [ 'lose', 'respin' ].indexOf( s.type ) > -1;
				var head = h( 'div', { class: 'bc-slice__head' + ( openIdx === i ? ' is-open' : '' ) },
					h( 'span', { class: 'bc-slice__sw', style: { background: color } }, s.icon || '' ),
					h( 'div', { class: 'bc-slice__main' }, h( 'b', { text: s.label || '—' } ), h( 'small', { class: 'bc-muted', text: typeLabel( s.type ) + ( [ 'coupon_percent', 'coupon_fixed_cart', 'wallet', 'points', 'extra_spin' ].indexOf( s.type ) > -1 ? ' | ' + BC.num( s.value ) : '' ) + ( +s.stock >= 0 ? ' | ' + t( 'موجودی ', 'stock ' ) + BC.num( s.stock, 0 ) : '' ) } ) ),
					h( 'span', { class: 'bc-slice__pct' + ( lose ? ' is-lose' : '' ), text: BC.num( pct, 1 ) + '%' } ),
					h( 'div', { class: 'bc-slice__tools' },
						h( 'button', { type: 'button', class: 'bc-icon-btn', title: t( 'بالا', 'Up' ), disabled: i === 0, onClick: function ( e ) { e.stopPropagation(); cfg.slices.splice( i - 1, 0, cfg.slices.splice( i, 1 )[ 0 ] ); openIdx = -1; st.dirty(); draw(); } }, BC.icon( 'arrow-up', 15 ) ),
						h( 'button', { type: 'button', class: 'bc-icon-btn', title: t( 'پایین', 'Down' ), disabled: i === cfg.slices.length - 1, onClick: function ( e ) { e.stopPropagation(); cfg.slices.splice( i + 1, 0, cfg.slices.splice( i, 1 )[ 0 ] ); openIdx = -1; st.dirty(); draw(); } }, BC.icon( 'arrow-down', 15 ) ),
						h( 'button', { type: 'button', class: 'bc-icon-btn', title: t( 'تکثیر', 'Duplicate' ), disabled: cfg.slices.length >= 24, onClick: function ( e ) { e.stopPropagation(); var c = clone( s ); c.id = 's' + Math.random().toString( 36 ).slice( 2, 9 ); c.codes_text = ''; cfg.slices.splice( i + 1, 0, c ); st.dirty(); draw(); } }, BC.icon( 'copy', 15 ) ),
						h( 'button', { type: 'button', class: 'bc-icon-btn', title: t( 'حذف', 'Delete' ), disabled: cfg.slices.length <= 2, onClick: function ( e ) { e.stopPropagation(); cfg.slices.splice( i, 1 ); openIdx = -1; st.dirty(); draw(); } }, BC.icon( 'trash', 15 ) )
					)
				);
				head.addEventListener( 'click', function () { openIdx = openIdx === i ? -1 : i; draw(); } );
				var item = h( 'div', { class: 'bc-slice' }, head );
				if ( openIdx === i ) {
					item.appendChild( h( 'div', { class: 'bc-slice__body' }, sliceDetails( s, i, st, draw ) ) );
				}
				list.appendChild( item );
			} );
			wrap.appendChild( oddsBar( cfg ) );
			wrap.appendChild( list );
			var add = function ( preset ) {
				var s = Object.assign( clone( BC.boot.slice_defaults ), preset, { id: 's' + Math.random().toString( 36 ).slice( 2, 9 ) } );
				cfg.slices.push( s );
				openIdx = cfg.slices.length - 1;
				st.dirty();
				draw();
			};
			wrap.appendChild( h( 'div', { class: 'bc-row bc-slices__add' },
				BC.btn( BC.il( 'plus', t( 'افزودن جایزه', 'Add prize' ), 15 ), function () { add( { label: t( 'جایزه جدید', 'New prize' ), weight: 10 } ); }, 'primary', { disabled: cfg.slices.length >= 24 } ),
				BC.btn( t( '+ پوچ', '+ No prize' ), function () { add( { label: t( 'پوچ', 'No luck' ), type: 'lose', value: 0, icon: '😅', weight: 20 } ); }, 'sm', { disabled: cfg.slices.length >= 24 } ),
				BC.btn( t( '+ ارسال رایگان', '+ Free shipping' ), function () { add( { label: t( 'ارسال رایگان', 'Free shipping' ), type: 'free_shipping', icon: '🚚', weight: 10 } ); }, 'sm', { disabled: cfg.slices.length >= 24 } ),
				BC.btn( t( '+ دوباره بچرخان', '+ Spin again' ), function () { add( { label: t( 'یک شانس دیگر', 'Spin again' ), type: 'respin', icon: '🔁', weight: 8 } ); }, 'sm', { disabled: cfg.slices.length >= 24 } ),
				BC.btn( BC.il( 'flask', t( 'شبیه‌سازی ۱۰٬۰۰۰ چرخش', 'Simulate 10,000 spins' ), 15 ), function ( e ) { simulate( st, e.currentTarget ); }, 'sm ghost' ),
				BC.btn( BC.il( 'shuffle', t( 'رنگ‌بندی خودکار', 'Auto colors' ), 15 ), function () { cfg.slices.forEach( function ( s ) { s.color = ''; s.color2 = ''; } ); st.dirty(); draw(); }, 'sm ghost' )
			) );
			wrap.appendChild( h( 'p', { class: 'bc-field__help', text: t( 'حداکثر ۲۴ بخش. برنده همیشه روی سرور و با الگوریتم تصادفی امن انتخاب می‌شود؛ مرورگر نمی‌تواند نتیجه را تغییر دهد. جایزه‌هایی که موجودی/سقفشان پر شده خودکار حذف می‌شوند.', 'Up to 24 slices. The winner is always picked on the server with a secure random draw; the browser cannot change it. Slices out of stock / over caps are skipped automatically.' ) } ) );
		}
		st.refreshList = function () {
			var o = wrap.querySelector( '.bc-odds-wrap' );
			if ( o ) {
				o.replaceWith( oddsBar( cfg ) );
			}
		};
		draw();
		return wrap;
	}

	function simulate( st, btn ) {
		if ( ! st.id ) {
			return;
		}
		BC.busy( btn, BC.api( 'wheels/' + st.id + '/simulate', { body: { n: 10000, slices: st.cfg.slices } } ) ).then( function ( r ) {
			var m = BC.modal( { title: t( 'نتیجه شبیه‌سازی %1 چرخش', 'Simulation of %1 spins', BC.num( r.n, 0 ) ) } );
			m.body.appendChild( BC.table( [
				{ label: t( 'جایزه', 'Prize' ), key: 'label' },
				{ label: t( 'دفعات', 'Hits' ), render: function ( x ) { return BC.num( x.hits, 0 ); } },
				{ label: t( 'واقعی', 'Actual' ), render: function ( x ) { return BC.num( x.pct, 2 ) + '%'; } },
				{ label: t( 'مورد انتظار', 'Expected' ), render: function ( x ) { return BC.num( r.expected[ x.id ], 2 ) + '%'; } },
			], r.rows ) );
			m.body.appendChild( h( 'p', { class: 'bc-field__help', text: t( 'شبیه‌سازی فقط وزن‌ها را می‌سنجد؛ در سایت، موجودی، سقف‌ها و شرط‌های هر بخش هم اعمال می‌شوند.', 'Only weights are simulated; on the site stock, caps and slice conditions also apply.' ) } ) );
		} ).catch( BC.fail );
	}

	/* ------------------------------------------------------------------ design tab */

	function themeGallery( st ) {
		var themes = ( BC.boot && BC.boot.themes ) || [];
		var groups = { basic: t( 'پایه', 'Basic' ), premium: t( 'لوکس', 'Premium' ), fun: t( 'شاد', 'Fun' ), nature: t( 'طبیعت و فصل‌ها', 'Nature & seasons' ), iranian: t( 'مناسبت‌های ایرانی', 'Iranian occasions' ), campaign: t( 'کمپین‌ها', 'Campaigns' ) };
		var grid = h( 'div', { class: 'bc-themes' } );
		themes.forEach( function ( th ) {
			var pal = th.design.palette;
			var cone = pal.map( function ( c, i ) { return c + ' ' + ( i * 100 / pal.length ) + '% ' + ( ( i + 1 ) * 100 / pal.length ) + '%'; } ).join( ',' );
			var bg = th.popup.bg_type === 'color' ? th.popup.bg_color : 'linear-gradient(135deg,' + th.popup.bg_color + ',' + th.popup.bg_color2 + ')';
			var on = st.cfg.design.theme === th.key;
			grid.appendChild( h( 'button', { type: 'button', class: 'bc-theme' + ( on ? ' is-active' : '' ), title: BC.fa ? th.fa : th.en, onClick: function () {
				[ 'design', 'popup', 'form', 'display' ].forEach( function ( sec ) {
					Object.keys( th[ sec ] || {} ).forEach( function ( k ) { st.cfg[ sec ][ k ] = clone( th[ sec ][ k ] ); } );
				} );
				st.cfg.design.theme = th.key;
				st.cfg.slices.forEach( function ( s ) { s.color = ''; s.color2 = ''; s.text_color = ''; } );
				st.dirty();
				st.reloadTab();
				BC.toast( t( 'تم «%1» اعمال شد', 'Theme "%1" applied', BC.fa ? th.fa : th.en ), 'success' );
			} },
				h( 'span', { class: 'bc-theme__bg', style: { background: bg } }, h( 'span', { class: 'bc-theme__wheel', style: { background: 'conic-gradient(' + cone + ')', 'border-color': th.design.rim_color } } ), h( 'span', { class: 'bc-theme__btn', style: { background: 'linear-gradient(135deg,' + th.form.button_bg + ',' + th.form.button_bg2 + ')' } } ) ),
				h( 'span', { class: 'bc-theme__name' }, h( 'b', { text: BC.fa ? th.fa : th.en } ), h( 'small', { text: groups[ th.group ] || th.group } ) )
			) );
		} );
		return grid;
	}

	function paletteEditor( st ) {
		var box = h( 'div', { class: 'bc-palette' } );
		function draw() {
			BC.clear( box );
			st.cfg.design.palette.forEach( function ( c, i ) {
				var inp = h( 'input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test( c ) ? c : '#1d4ed8' } );
				inp.addEventListener( 'input', function () { st.cfg.design.palette[ i ] = inp.value; st.dirty(); sw.style.background = inp.value; } );
				var sw = h( 'span', { class: 'bc-palette__sw', style: { background: c } } );
				box.appendChild( h( 'label', { class: 'bc-palette__item' }, sw, inp, st.cfg.design.palette.length > 2 ? h( 'button', { type: 'button', class: 'bc-palette__x', onClick: function ( e ) { e.preventDefault(); st.cfg.design.palette.splice( i, 1 ); st.dirty(); draw(); } }, '×' ) : null ) );
			} );
			if ( st.cfg.design.palette.length < 24 ) {
				box.appendChild( h( 'button', { type: 'button', class: 'bc-palette__add', onClick: function () { st.cfg.design.palette.push( '#64748b' ); st.dirty(); draw(); } }, '+' ) );
			}
		}
		draw();
		return h( 'div', { class: 'bc-field' }, h( 'label', { class: 'bc-field__label', text: t( 'پالت رنگ بخش‌ها', 'Slice palette' ) } ), box, h( 'div', { class: 'bc-field__help', text: t( 'رنگ بخش‌هایی که رنگ اختصاصی ندارند به ترتیب از این پالت انتخاب می‌شود.', 'Slices without their own color cycle through this palette.' ) } ) );
	}

	function designTab( st ) {
		var dsg = st.cfg.design;
		var on = function ( k ) { return function () { return !! dsg[ k ]; }; };
		return [
			BC.card( { title: t( 'گالری تم‌ها', 'Theme gallery' ), sub: t( '۳۶ تم آماده؛ با یک کلیک رنگ گردونه، پاپ‌آپ، دکمه و لانچر عوض می‌شود. بعد هر چیزی را دستی تغییر دهید.', '36 ready themes; one click restyles wheel, popup, button and launcher. Fine-tune anything afterwards.' ), icon: 'palette' }, themeGallery( st ) ),
			BC.card( { title: t( 'اندازه و متن', 'Size & text' ), icon: 'type' }, [
				F.render( [
					{ k: 'size', type: 'range', label: t( 'اندازه گردونه (دسکتاپ)', 'Wheel size (desktop)' ), min: 220, max: 700, unit: 'px', cols: 'half' },
					{ k: 'size_mobile', type: 'range', label: t( 'اندازه گردونه (موبایل)', 'Wheel size (mobile)' ), min: 180, max: 520, unit: 'px', cols: 'half' },
				], dsg, st.dirty ),
				paletteEditor( st ),
				F.render( [
					{ k: 'text_color', type: 'color', label: t( 'رنگ متن بخش‌ها', 'Slice text color' ), cols: 'third' },
					{ k: 'font_size', type: 'range', label: t( 'اندازه فونت', 'Font size' ), min: 8, max: 40, unit: 'px', cols: 'third' },
					{ k: 'font_weight', type: 'select', label: t( 'ضخامت فونت', 'Font weight' ), numeric: true, opts: [ 400, 600, 700, 800, 900 ].map( function ( x ) { return { value: x, label: String( x ) }; } ), cols: 'third' },
					{ k: 'text_orientation', type: 'segment', label: t( 'جهت متن', 'Text direction' ), opts: [ { value: 'radial', label: t( 'شعاعی', 'Radial' ) }, { value: 'horizontal', label: t( 'افقی', 'Across' ) }, { value: 'curved', label: t( 'منحنی', 'Curved' ) } ] },
					{ k: 'text_position', type: 'range', label: t( 'فاصله متن از مرکز', 'Text distance from centre' ), min: 0.3, max: 0.92, step: 0.01, cols: 'half' },
					{ k: 'icon_size', type: 'range', label: t( 'اندازه آیکن‌ها', 'Icon size' ), min: 12, max: 48, unit: 'px', cols: 'half' },
					{ k: 'text_shadow', type: 'switch', label: t( 'سایه متن', 'Text shadow' ), cols: 'third' },
					{ k: 'slice_gradient', type: 'switch', label: t( 'گرادیان بخش‌ها', 'Slice gradient' ), cols: 'third' },
					{ k: 'gloss', type: 'switch', label: t( 'براقیت شیشه‌ای', 'Gloss' ), cols: 'third' },
					{ k: 'slice_border_color', type: 'color', label: t( 'رنگ خط بین بخش‌ها', 'Divider color' ), cols: 'half' },
					{ k: 'slice_border_width', type: 'range', label: t( 'ضخامت خط', 'Divider width' ), min: 0, max: 8, unit: 'px', cols: 'half' },
				], dsg, st.dirty ),
			] ),
			BC.card( { title: t( 'قاب، چراغ‌ها و سایه', 'Rim, lights & glow' ), icon: 'sun' }, F.render( [
				{ k: 'rim_style', type: 'segment', label: t( 'سبک قاب', 'Rim style' ), opts: [ { value: 'lights', label: t( 'چراغ‌دار', 'Lights' ) }, { value: 'solid', label: t( 'ساده', 'Solid' ) }, { value: 'double', label: t( 'دوخطی', 'Double' ) }, { value: 'dots', label: t( 'نقطه‌ای', 'Dots' ) }, { value: 'metal', label: t( 'فلزی', 'Metal' ) }, { value: 'neon', label: t( 'نئون', 'Neon' ) }, { value: 'none', label: t( 'بدون قاب', 'None' ) } ] },
				{ k: 'rim_color', type: 'color', label: t( 'رنگ قاب', 'Rim color' ), cols: 'third' },
				{ k: 'rim_color2', type: 'color', label: t( 'رنگ دوم قاب', 'Rim color 2' ), cols: 'third' },
				{ k: 'rim_width', type: 'range', label: t( 'ضخامت قاب', 'Rim width' ), min: 0, max: 40, unit: 'px', cols: 'third' },
				{ k: 'light_count', type: 'range', label: t( 'تعداد چراغ‌ها', 'Number of lights' ), min: 0, max: 48, cols: 'third' },
				{ k: 'light_color', type: 'color', label: t( 'رنگ چراغ ۱', 'Light color 1' ), cols: 'third' },
				{ k: 'light_color2', type: 'color', label: t( 'رنگ چراغ ۲', 'Light color 2' ), cols: 'third' },
				{ k: 'light_animation', type: 'segment', label: t( 'انیمیشن چراغ‌ها', 'Light animation' ), opts: [ { value: 'chase', label: t( 'دنباله‌دار', 'Chase' ) }, { value: 'blink', label: t( 'چشمک', 'Blink' ) }, { value: 'alternate', label: t( 'یک‌درمیان', 'Alternate' ) }, { value: 'pulse', label: t( 'تپش', 'Pulse' ) }, { value: 'none', label: t( 'ثابت', 'Static' ) } ] },
				{ k: 'pegs', type: 'switch', label: t( 'میخ‌های بین بخش‌ها', 'Pegs between slices' ), cols: 'third' },
				{ k: 'shadow', type: 'switch', label: t( 'سایه', 'Shadow' ), cols: 'third' },
				{ k: 'glow', type: 'switch', label: t( 'هاله نور پشت گردونه', 'Glow behind wheel' ), cols: 'third' },
				{ k: 'glow_color', type: 'color', label: t( 'رنگ هاله', 'Glow color' ), show: on( 'glow' ) },
			], dsg, st.dirty ) ),
			BC.card( { title: t( 'مرکز و نشانگر', 'Centre & pointer' ), icon: 'target' }, F.render( [
				{ k: 'center_style', type: 'segment', label: t( 'سبک مرکز', 'Centre style' ), opts: [ { value: 'button', label: t( 'دکمه', 'Button' ) }, { value: 'circle', label: t( 'دایره', 'Circle' ) }, { value: 'star', label: t( 'ستاره', 'Star' ) }, { value: 'gem', label: t( 'جواهر', 'Gem' ) }, { value: 'logo', label: t( 'لوگو', 'Logo' ) }, { value: 'none', label: t( 'بدون', 'None' ) } ] },
				{ k: 'center_text', label: t( 'متن مرکز', 'Centre text' ), cols: 'half' },
				{ k: 'center_image', type: 'image', label: t( 'لوگو / تصویر مرکز', 'Centre logo / image' ), cols: 'half' },
				{ k: 'center_color', type: 'color', label: t( 'رنگ مرکز', 'Centre color' ), cols: 'third' },
				{ k: 'center_color2', type: 'color', label: t( 'رنگ دوم مرکز', 'Centre color 2' ), cols: 'third' },
				{ k: 'center_border', type: 'color', label: t( 'رنگ دور مرکز', 'Centre border' ), cols: 'third' },
				{ k: 'center_text_color', type: 'color', label: t( 'رنگ متن مرکز', 'Centre text color' ), cols: 'half' },
				{ k: 'center_size', type: 'range', label: t( 'اندازه مرکز', 'Centre size' ), min: 0.08, max: 0.4, step: 0.01, cols: 'half' },
				{ k: 'center_clickable', type: 'switch', label: t( 'کلیک روی مرکز = چرخاندن', 'Click centre to spin' ) },
				{ k: 'pointer_style', type: 'segment', label: t( 'شکل نشانگر', 'Pointer shape' ), opts: [ { value: 'arrow', label: t( 'فلش', 'Arrow' ) }, { value: 'pin', label: t( 'پین', 'Pin' ) }, { value: 'triangle', label: t( 'مثلث', 'Triangle' ) }, { value: 'drop', label: t( 'قطره', 'Drop' ) }, { value: 'diamond', label: t( 'الماس', 'Diamond' ) }, { value: 'ticker', label: t( 'زبانه', 'Ticker' ) }, { value: 'image', label: t( 'تصویر', 'Image' ) } ] },
				{ k: 'pointer_image', type: 'image', label: t( 'تصویر نشانگر', 'Pointer image' ), show: function () { return dsg.pointer_style === 'image'; } },
				{ k: 'pointer_position', type: 'segment', label: t( 'محل نشانگر', 'Pointer position' ), opts: [ { value: 'top', label: t( 'بالا', 'Top' ) }, { value: 'right', label: t( 'راست', 'Right' ) }, { value: 'bottom', label: t( 'پایین', 'Bottom' ) }, { value: 'left', label: t( 'چپ', 'Left' ) } ] },
				{ k: 'pointer_color', type: 'color', label: t( 'رنگ نشانگر', 'Pointer color' ), cols: 'third' },
				{ k: 'pointer_stroke', type: 'color', label: t( 'دور نشانگر', 'Pointer outline' ), cols: 'third' },
				{ k: 'pointer_size', type: 'range', label: t( 'اندازه نشانگر', 'Pointer size' ), min: 0.5, max: 2, step: 0.05, cols: 'third' },
				{ k: 'pointer_bounce', type: 'switch', label: t( 'تکان خوردن نشانگر هنگام عبور از میخ‌ها', 'Pointer flicks on each peg' ) },
			], dsg, st.dirty ) ),
			BC.card( { title: t( 'گردونه سفارشی (تصویر خودتان)', 'Custom wheel (your own image)' ), sub: t( 'طراحی کامل گردونه را خودتان در فتوشاپ/کنوا بسازید و اینجا بگذارید؛ تعداد بخش‌ها باید با جوایز برابر باشد.', 'Design the whole wheel yourself and upload it; the number of slices must match your prizes.' ), icon: 'image' }, F.render( [
				{ k: 'custom_mode', type: 'switch', label: t( 'استفاده از تصویر گردونه', 'Use a wheel image' ) },
				{ k: 'custom_image', type: 'image', label: t( 'تصویر دایره‌ای گردونه (PNG شفاف)', 'Round wheel image (transparent PNG)' ), show: on( 'custom_mode' ) },
				{ k: 'custom_offset', type: 'range', label: t( 'چرخش تصویر برای هم‌ترازی', 'Rotate image to align' ), min: -180, max: 180, unit: '°', show: on( 'custom_mode' ) },
				{ k: 'custom_labels', type: 'switch', label: t( 'نوشتن متن جوایز روی تصویر', 'Draw labels over the image' ), show: on( 'custom_mode' ) },
				{ k: 'frame_image', type: 'image', label: t( 'قاب تزئینی روی گردونه (اختیاری)', 'Decorative frame overlay (optional)' ) },
			], dsg, st.dirty ) ),
			BC.card( { title: t( 'چرخش، افکت‌ها و صدا', 'Spin, effects & sound' ), icon: 'zap' }, F.render( [
				{ k: 'spin_duration', type: 'range', label: t( 'مدت چرخش', 'Spin duration' ), min: 2, max: 20, step: 0.5, unit: t( ' ثانیه', 's' ), cols: 'half' },
				{ k: 'spin_rotations', type: 'range', label: t( 'تعداد دور کامل', 'Full rotations' ), min: 2, max: 30, cols: 'half' },
				{ k: 'spin_easing', type: 'segment', label: t( 'حرکت توقف', 'Stop easing' ), opts: [ { value: 'quint', label: t( 'نرم', 'Smooth' ) }, { value: 'cubic', label: t( 'معمولی', 'Normal' ) }, { value: 'expo', label: t( 'سریع-آرام', 'Expo' ) }, { value: 'back', label: t( 'برگشتی', 'Back' ) }, { value: 'elastic', label: t( 'کشسانی', 'Elastic' ) }, { value: 'bounce', label: t( 'لرزش پایانی', 'Settle' ) } ] },
				{ k: 'land_random', type: 'switch', label: t( 'توقف در نقطه تصادفی بخش (طبیعی‌تر)', 'Stop at a random point in the slice' ), cols: 'half' },
				{ k: 'idle_rotate', type: 'switch', label: t( 'چرخش آرام قبل از شروع', 'Slow idle rotation' ), cols: 'half' },
				{ k: 'idle_speed', type: 'range', label: t( 'سرعت چرخش آرام', 'Idle speed' ), min: 5, max: 120, unit: '°/s', show: on( 'idle_rotate' ) },
				{ k: 'win_effect', type: 'select', label: t( 'افکت برد', 'Win effect' ), cols: 'half', opts: [ { value: 'confetti', label: t( 'کاغذ رنگی', 'Confetti' ) }, { value: 'fireworks', label: t( 'آتش‌بازی', 'Fireworks' ) }, { value: 'coins', label: t( 'باران سکه', 'Coin rain' ) }, { value: 'stars', label: t( 'ستاره', 'Stars' ) }, { value: 'hearts', label: t( 'قلب', 'Hearts' ) }, { value: 'snow', label: t( 'برف', 'Snow' ) }, { value: 'balloons', label: t( 'بادکنک', 'Balloons' ) }, { value: 'emoji', label: t( 'ایموجی دلخواه', 'Custom emoji' ) }, { value: 'none', label: t( 'بدون افکت', 'None' ) } ] },
				{ k: 'win_emoji', type: 'emoji', label: t( 'ایموجی برد', 'Win emoji' ), cols: 'half' },
				{ k: 'lose_effect', type: 'segment', label: t( 'افکت پوچ', 'Lose effect' ), opts: [ { value: 'shake', label: t( 'لرزش', 'Shake' ) }, { value: 'fade', label: t( 'ساده', 'Plain' ) }, { value: 'none', label: t( 'بدون', 'None' ) } ] },
				{ k: 'highlight_win', type: 'switch', label: t( 'درخشش بخش برنده', 'Pulse the winning slice' ), cols: 'half' },
				{ k: 'dim_others', type: 'switch', label: t( 'کم‌رنگ شدن بقیه بخش‌ها', 'Dim other slices' ), cols: 'half' },
				{ type: 'custom', render: function () { return h( 'div', { class: 'bc-row' }, [ 'confetti', 'fireworks', 'coins', 'balloons', 'hearts', 'snow' ].map( function ( fx ) { return BC.btn( fx, function () { w.Becharkhoon && w.Becharkhoon.effect( fx, dsg.win_emoji ); }, 'sm ghost' ); } ) ); } },
				{ k: 'sound', type: 'switch', label: t( 'صدا (تیک، برد، باخت)', 'Sounds (tick, win, lose)' ), cols: 'half' },
				{ k: 'mute_button', type: 'switch', label: t( 'دکمه قطع صدا', 'Mute button' ), cols: 'half', show: on( 'sound' ) },
				{ k: 'sound_volume', type: 'range', label: t( 'بلندی صدا', 'Volume' ), min: 0, max: 1, step: 0.05, show: on( 'sound' ) },
				{ k: 'sound_tick', type: 'switch', label: t( 'صدای تیک', 'Tick' ), cols: 'third', show: on( 'sound' ) },
				{ k: 'sound_win', type: 'switch', label: t( 'صدای برد', 'Win' ), cols: 'third', show: on( 'sound' ) },
				{ k: 'sound_lose', type: 'switch', label: t( 'صدای باخت', 'Lose' ), cols: 'third', show: on( 'sound' ) },
				{ k: 'sound_tick_url', type: 'image', media: 'audio', label: t( 'فایل صدای تیک (اختیاری)', 'Custom tick sound' ), show: on( 'sound' ) },
				{ k: 'sound_win_url', type: 'image', media: 'audio', label: t( 'فایل صدای برد (اختیاری)', 'Custom win sound' ), show: on( 'sound' ) },
				{ k: 'sound_lose_url', type: 'image', media: 'audio', label: t( 'فایل صدای باخت (اختیاری)', 'Custom lose sound' ), show: on( 'sound' ) },
				{ k: 'reduce_motion', type: 'switch', label: t( 'احترام به «کاهش حرکت» سیستم کاربر', 'Respect "reduce motion"' ), help: t( 'برای کاربرانی که حرکت زیاد اذیتشان می‌کند، چرخش کوتاه‌تر و بدون افکت سنگین.', 'Shorter spin and lighter effects for motion-sensitive visitors.' ) },
			], dsg, st.dirty ) ),
		];
	}

	/* ------------------------------------------------------------------ popup tab */

	function popupTab( st ) {
		var p = st.cfg.popup;
		var on = function ( k ) { return function () { return !! p[ k ]; }; };
		return [
			BC.card( { title: t( 'نوع و چیدمان', 'Type & layout' ), icon: 'window' }, F.render( [
				{ k: 'mode', type: 'segment', label: t( 'نوع پاپ‌آپ', 'Popup type' ), opts: [ { value: 'modal', label: t( 'مودال وسط', 'Centre modal' ) }, { value: 'fullscreen', label: t( 'تمام‌صفحه', 'Full screen' ) }, { value: 'slidein', label: t( 'کشویی گوشه', 'Corner slide-in' ) }, { value: 'sheet', label: t( 'برگه پایین', 'Bottom sheet' ) }, { value: 'sidebar', label: t( 'نوار کناری', 'Sidebar' ) }, { value: 'half', label: t( 'نیم‌گردونه کناری', 'Half wheel' ) } ] },
				{ k: 'layout', type: 'segment', label: t( 'چیدمان', 'Layout' ), opts: [ { value: 'split', label: t( 'دو ستونه', 'Split' ) }, { value: 'stack', label: t( 'زیر هم', 'Stacked' ) }, { value: 'overlap', label: t( 'همپوشان', 'Overlap' ) }, { value: 'wheel-only', label: t( 'فقط گردونه', 'Wheel only' ) } ] },
				{ k: 'wheel_side', type: 'segment', label: t( 'سمت گردونه', 'Wheel side' ), opts: [ { value: 'start', label: t( 'ابتدا (راست در فارسی)', 'Start' ) }, { value: 'end', label: t( 'انتها', 'End' ) } ] },
				{ k: 'width', type: 'range', label: t( 'عرض پاپ‌آپ', 'Popup width' ), min: 320, max: 1400, unit: 'px', cols: 'third' },
				{ k: 'radius', type: 'range', label: t( 'گردی گوشه‌ها', 'Corner radius' ), min: 0, max: 48, unit: 'px', cols: 'third' },
				{ k: 'padding', type: 'range', label: t( 'فاصله داخلی', 'Padding' ), min: 8, max: 72, unit: 'px', cols: 'third' },
				{ k: 'font_scale', type: 'range', label: t( 'مقیاس فونت', 'Font scale' ), min: 0.7, max: 1.5, step: 0.05, cols: 'half' },
				{ k: 'direction', type: 'segment', label: t( 'جهت', 'Direction' ), cols: 'half', opts: [ { value: 'auto', label: t( 'خودکار', 'Auto' ) }, { value: 'rtl', label: 'RTL' }, { value: 'ltr', label: 'LTR' } ] },
			], p, st.dirty ) ),
			BC.card( { title: t( 'پس‌زمینه و رنگ‌ها', 'Background & colors' ), icon: 'palette' }, F.render( [
				{ k: 'bg_type', type: 'segment', label: t( 'نوع پس‌زمینه', 'Background' ), opts: [ { value: 'color', label: t( 'رنگ', 'Color' ) }, { value: 'gradient', label: t( 'گرادیان', 'Gradient' ) }, { value: 'image', label: t( 'تصویر', 'Image' ) }, { value: 'glass', label: t( 'شیشه‌ای', 'Glass' ) } ] },
				{ k: 'bg_color', type: 'color', label: t( 'رنگ ۱', 'Color 1' ), cols: 'third' },
				{ k: 'bg_color2', type: 'color', label: t( 'رنگ ۲', 'Color 2' ), cols: 'third', show: function () { return p.bg_type !== 'color'; } },
				{ k: 'bg_angle', type: 'range', label: t( 'زاویه گرادیان', 'Gradient angle' ), min: 0, max: 360, unit: '°', cols: 'third', show: function () { return p.bg_type !== 'color'; } },
				{ k: 'bg_image', type: 'image', label: t( 'تصویر پس‌زمینه', 'Background image' ), show: function () { return p.bg_type === 'image'; } },
				{ k: 'bg_image_opacity', type: 'range', label: t( 'شفافیت تصویر', 'Image opacity' ), min: 0, max: 1, step: 0.05, show: function () { return p.bg_type === 'image'; } },
				{ k: 'pattern', type: 'select', label: t( 'طرح زمینه', 'Pattern' ), cols: 'half', opts: [ [ 'none', t( 'بدون', 'None' ) ], [ 'confetti', t( 'کاغذ رنگی', 'Confetti' ) ], [ 'dots', t( 'نقطه', 'Dots' ) ], [ 'stars', t( 'ستاره', 'Stars' ) ], [ 'grid', t( 'شطرنجی', 'Grid' ) ], [ 'waves', t( 'موج', 'Waves' ) ], [ 'diagonal', t( 'مورب', 'Diagonal' ) ], [ 'snow', t( 'برف', 'Snow' ) ], [ 'hearts', t( 'قلب', 'Hearts' ) ] ].map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ) },
				{ k: 'pattern_color', type: 'color', label: t( 'رنگ طرح', 'Pattern color' ), cols: 'half' },
				{ k: 'text_color', type: 'color', label: t( 'رنگ متن', 'Text' ), cols: 'third' },
				{ k: 'muted_color', type: 'color', label: t( 'رنگ متن کم‌رنگ', 'Muted text' ), cols: 'third' },
				{ k: 'accent_color', type: 'color', label: t( 'رنگ تاکیدی', 'Accent' ), cols: 'third' },
				{ k: 'border_color', type: 'color', label: t( 'رنگ حاشیه', 'Border' ), cols: 'half' },
				{ k: 'border_width', type: 'range', label: t( 'ضخامت حاشیه', 'Border width' ), min: 0, max: 8, unit: 'px', cols: 'half' },
				{ k: 'shadow', type: 'segment', label: t( 'سایه', 'Shadow' ), opts: [ { value: 'none', label: t( 'بدون', 'None' ) }, { value: 'md', label: t( 'کم', 'Soft' ) }, { value: 'lg', label: t( 'متوسط', 'Medium' ) }, { value: 'xl', label: t( 'زیاد', 'Strong' ) }, { value: 'glow', label: t( 'درخشان', 'Glow' ) } ] },
			], p, st.dirty ) ),
			BC.card( { title: t( 'لایه پشت، انیمیشن و دکمه بستن', 'Overlay, animation & close' ), icon: 'layers' }, F.render( [
				{ k: 'overlay_color', type: 'color', label: t( 'رنگ لایه پشت', 'Overlay color' ), cols: 'third' },
				{ k: 'overlay_opacity', type: 'range', label: t( 'تیرگی', 'Opacity' ), min: 0, max: 1, step: 0.02, cols: 'third' },
				{ k: 'overlay_blur', type: 'range', label: t( 'محوشدگی پشت', 'Backdrop blur' ), min: 0, max: 20, unit: 'px', cols: 'third' },
				{ k: 'close_overlay', type: 'switch', label: t( 'بستن با کلیک بیرون', 'Close on outside click' ), cols: 'half' },
				{ k: 'close_esc', type: 'switch', label: t( 'بستن با Esc', 'Close with Esc' ), cols: 'half' },
				{ k: 'anim_in', type: 'select', label: t( 'انیمیشن ورود', 'Entrance' ), cols: 'third', opts: [ [ 'zoom', t( 'بزرگ‌نمایی', 'Zoom' ) ], [ 'fade', t( 'محو', 'Fade' ) ], [ 'slide-up', t( 'از پایین', 'Slide up' ) ], [ 'slide-down', t( 'از بالا', 'Slide down' ) ], [ 'slide-side', t( 'از کنار', 'Slide side' ) ], [ 'bounce', t( 'جهشی', 'Bounce' ) ], [ 'flip', t( 'ورق', 'Flip' ) ], [ 'rotate', t( 'چرخشی', 'Rotate' ) ], [ 'none', t( 'بدون', 'None' ) ] ].map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ) },
				{ k: 'anim_out', type: 'select', label: t( 'انیمیشن خروج', 'Exit' ), cols: 'third', opts: [ [ 'fade', t( 'محو', 'Fade' ) ], [ 'zoom', t( 'کوچک‌نمایی', 'Zoom' ) ], [ 'slide-down', t( 'به پایین', 'Slide down' ) ], [ 'none', t( 'بدون', 'None' ) ] ].map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ) },
				{ k: 'anim_duration', type: 'range', label: t( 'مدت انیمیشن', 'Duration' ), min: 0, max: 1500, step: 50, unit: 'ms', cols: 'third' },
				{ k: 'close_show', type: 'switch', label: t( 'نمایش دکمه بستن', 'Show close button' ), cols: 'half' },
				{ k: 'close_delay', type: 'number', label: t( 'نمایش دکمه بستن بعد از (ثانیه)', 'Show close after (s)' ), min: 0, cols: 'half', show: on( 'close_show' ) },
				{ k: 'close_style', type: 'segment', label: t( 'سبک دکمه بستن', 'Close style' ), opts: [ { value: 'circle', label: t( 'دایره', 'Circle' ) }, { value: 'square', label: t( 'مربع', 'Square' ) }, { value: 'plain', label: t( 'ساده', 'Plain' ) }, { value: 'text', label: t( 'متنی', 'Text' ) } ], show: on( 'close_show' ) },
				{ k: 'close_position', type: 'segment', label: t( 'محل دکمه بستن', 'Close position' ), opts: [ { value: 'end', label: t( 'گوشه انتها', 'End corner' ) }, { value: 'start', label: t( 'گوشه ابتدا', 'Start corner' ) }, { value: 'outside', label: t( 'بیرون کادر', 'Outside' ) } ], show: on( 'close_show' ) },
				{ k: 'close_color', type: 'color', label: t( 'رنگ ×', '× color' ), cols: 'half', show: on( 'close_show' ) },
				{ k: 'close_bg', type: 'color', label: t( 'پس‌زمینه ×', '× background' ), cols: 'half', show: on( 'close_show' ) },
			], p, st.dirty ) ),
			BC.card( { title: t( 'محتوا', 'Content' ), icon: 'type' }, F.render( [
				{ k: 'logo', type: 'image', label: t( 'لوگو', 'Logo' ), cols: 'half' },
				{ k: 'logo_width', type: 'range', label: t( 'عرض لوگو', 'Logo width' ), min: 40, max: 300, unit: 'px', cols: 'half' },
				{ k: 'badge', label: t( 'برچسب بالای عنوان', 'Badge above title' ), cols: 'third' },
				{ k: 'badge_bg', type: 'color', label: t( 'پس‌زمینه برچسب', 'Badge background' ), cols: 'third' },
				{ k: 'badge_color', type: 'color', label: t( 'رنگ برچسب', 'Badge text' ), cols: 'third' },
				{ k: 'title', label: t( 'عنوان', 'Title' ) },
				{ k: 'title_color', type: 'color', label: t( 'رنگ عنوان', 'Title color' ), cols: 'third' },
				{ k: 'title_size', type: 'range', label: t( 'اندازه عنوان', 'Title size' ), min: 16, max: 56, unit: 'px', cols: 'third' },
				{ k: 'title_weight', type: 'select', label: t( 'ضخامت عنوان', 'Title weight' ), numeric: true, cols: 'third', opts: [ 500, 600, 700, 800, 900 ].map( function ( x ) { return { value: x, label: String( x ) }; } ) },
				{ k: 'subtitle', label: t( 'زیرعنوان', 'Subtitle' ), cols: 'half' },
				{ k: 'subtitle_color', type: 'color', label: t( 'رنگ زیرعنوان', 'Subtitle color' ), cols: 'half' },
				{ k: 'description', type: 'html', label: t( 'توضیحات (HTML مجاز)', 'Description (HTML allowed)' ) },
				{ k: 'trust_items', type: 'list', label: t( 'نکات اعتمادساز (هر خط یک مورد، حداکثر ۶)', 'Trust points (one per line, max 6)' ), rows: 3, placeholder: t( 'بدون نیاز به خرید\nکد فوری پیامک می‌شود', 'No purchase needed\nInstant code by SMS' ) },
				{ k: 'footer_text', type: 'html', label: t( 'متن پایین', 'Footer text' ), rows: 2 },
				{ k: 'no_thanks', type: 'switch', label: t( 'لینک «نه ممنون»', '"No thanks" link' ), cols: 'third' },
				{ k: 'no_thanks_text', label: t( 'متن لینک', 'Link text' ), cols: 'third', show: on( 'no_thanks' ) },
				{ k: 'no_thanks_days', type: 'number', label: t( 'تا چند روز نشان نده', 'Hide for days' ), min: 0, cols: 'third', show: on( 'no_thanks' ) },
			], p, st.dirty ) ),
			BC.card( { title: t( 'فوریت و اثبات اجتماعی', 'Urgency & social proof' ), icon: 'clock' }, F.render( [
				{ k: 'countdown', type: 'switch', label: t( 'شمارش معکوس', 'Countdown timer' ) },
				{ k: 'countdown_mode', type: 'segment', label: t( 'نوع شمارش', 'Countdown type' ), show: on( 'countdown' ), opts: [ { value: 'evergreen', label: t( 'برای هر بازدیدکننده (چند دقیقه)', 'Per visitor (minutes)' ) }, { value: 'fixed', label: t( 'تا تاریخ مشخص', 'Until a date' ) } ] },
				{ k: 'countdown_minutes', type: 'number', label: t( 'دقیقه', 'Minutes' ), min: 1, cols: 'half', show: function () { return p.countdown && p.countdown_mode === 'evergreen'; } },
				{ k: 'countdown_deadline', type: 'datetime', label: t( 'پایان (به وقت سایت)', 'Ends at (site time)' ), cols: 'half', show: function () { return p.countdown && p.countdown_mode === 'fixed'; } },
				{ k: 'countdown_label', label: t( 'متن شمارش', 'Countdown label' ), cols: 'half', show: on( 'countdown' ) },
				{ k: 'countdown_style', type: 'segment', label: t( 'سبک', 'Style' ), cols: 'half', show: on( 'countdown' ), opts: [ { value: 'boxes', label: t( 'جعبه‌ای', 'Boxes' ) }, { value: 'inline', label: t( 'خطی', 'Inline' ) } ] },
				{ k: 'social_proof', type: 'switch', label: t( 'نمایش تعداد چرخش‌های امروز (واقعی)', 'Show today\'s spin count (real)' ) },
				{ k: 'social_text', label: t( 'متن ({count})', 'Text ({count})' ), cols: 'half', show: on( 'social_proof' ) },
				{ k: 'social_min', type: 'number', label: t( 'حداقل برای نمایش', 'Minimum to show' ), min: 0, cols: 'half', show: on( 'social_proof' ) },
				{ k: 'ticker', type: 'switch', label: t( 'نوار متحرک برندگان اخیر (نام‌ها پوشیده)', 'Recent winners ticker (masked names)' ) },
				{ k: 'ticker_text', label: t( 'متن ({name} {prize} {ago})', 'Text ({name} {prize} {ago})' ), cols: 'half', show: on( 'ticker' ) },
				{ k: 'ticker_count', type: 'number', label: t( 'تعداد', 'Count' ), min: 1, max: 30, cols: 'half', show: on( 'ticker' ) },
			], p, st.dirty ) ),
			BC.card( {
				title: t( 'ظاهر نتیجه، کد جایزه و پیام‌ها', 'Result, prize code & messages look' ),
				sub: t( 'رنگ‌ها و سبک کادر کد، دکمه کپی، دکمه اعمال، دکمه‌های دوم، لینک‌ها، اشتراک‌گذاری و صفحه‌های «بدون شانس / انتظار / ورود». خالی = هماهنگ با رنگ تاکیدی.', 'Code box, copy and apply buttons, secondary buttons, links, share buttons and the no-spins / cooldown / login screens. Empty = follows the accent color.' ),
				icon: 'palette',
				actions: BC.btn( BC.il( 'edit', t( 'دیدن در پیش‌نمایش', 'See in preview' ), 14 ), function () { if ( st.showView ) { st.showView( 'win' ); } }, 'sm' ),
			}, F.render( resultFields( 'all' ), p, st.dirty ) ),
			BC.card( { title: t( 'موبایل', 'Mobile' ), icon: 'smartphone' }, F.render( [
				{ k: 'mobile_mode', type: 'segment', label: t( 'نوع نمایش در موبایل', 'Mobile display' ), opts: [ { value: 'sheet', label: t( 'برگه پایین (پیشنهادی)', 'Bottom sheet (best)' ) }, { value: 'modal', label: t( 'مودال', 'Modal' ) }, { value: 'fullscreen', label: t( 'تمام‌صفحه', 'Full screen' ) } ] },
				{ k: 'mobile_wheel_first', type: 'switch', label: t( 'گردونه بالای فرم', 'Wheel above the form' ), cols: 'half' },
				{ k: 'mobile_hide_desc', type: 'switch', label: t( 'مخفی کردن توضیحات در موبایل', 'Hide description on mobile' ), cols: 'half' },
			], p, st.dirty ) ),
			BC.card( { title: t( 'CSS سفارشی', 'Custom CSS' ), icon: 'code' }, F.render( [
				{ k: 'custom_class', label: t( 'کلاس CSS اضافه', 'Extra CSS class' ), dir: 'ltr' },
				{ k: 'custom_css', type: 'textarea', label: t( 'CSS (فقط برای این گردونه)', 'CSS (this wheel only)' ), rows: 6, dir: 'ltr', mono: true, help: t( 'کلاس‌های اصلی: .bchw-dialog .bchw-title .bchw-btn .bchw-input .bchw-wheelbox', 'Main classes: .bchw-dialog .bchw-title .bchw-btn .bchw-input .bchw-wheelbox' ) },
			], p, st.dirty ) ),
		];
	}

	/* ------------------------------------------------------------------ form tab */

	function fieldsBuilder( st ) {
		var f = st.cfg.form;
		var box = h( 'div', { class: 'bc-fields' } );
		var maps = [ [ 'name', t( 'نام', 'Name' ) ], [ 'phone', t( 'موبایل', 'Mobile' ) ], [ 'email', t( 'ایمیل', 'Email' ) ], [ 'birthday', t( 'تاریخ تولد', 'Birthday' ) ], [ 'city', t( 'شهر', 'City' ) ], [ 'gender', t( 'جنسیت', 'Gender' ) ], [ 'custom', t( 'دلخواه', 'Custom' ) ] ];
		var types = [ [ 'text', t( 'متن', 'Text' ) ], [ 'tel', t( 'موبایل', 'Phone' ) ], [ 'email', t( 'ایمیل', 'Email' ) ], [ 'number', t( 'عدد', 'Number' ) ], [ 'date', t( 'تاریخ', 'Date' ) ], [ 'select', t( 'لیست کشویی', 'Select' ) ], [ 'radio', t( 'گزینه‌ای', 'Radio' ) ], [ 'checkbox', t( 'تیک', 'Checkbox' ) ], [ 'textarea', t( 'متن بلند', 'Textarea' ) ] ];
		var opt = function ( list ) { return list.map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ); };
		function draw() {
			BC.clear( box );
			f.fields.forEach( function ( fd, i ) {
				box.appendChild( h( 'div', { class: 'bc-fielditem' + ( fd.enabled ? '' : ' is-off' ) },
					h( 'div', { class: 'bc-fielditem__head' },
						h( 'b', { text: fd.label || fd.id } ), BC.badge( ( types.filter( function ( x ) { return x[ 0 ] === fd.type; } )[ 0 ] || [ '', fd.type ] )[ 1 ], 'brand' ), fd.required ? BC.badge( t( 'الزامی', 'Required' ), 'warn' ) : null,
						h( 'span', { class: 'bc-spacer' } ),
						h( 'button', { type: 'button', class: 'bc-icon-btn', disabled: i === 0, onClick: function () { f.fields.splice( i - 1, 0, f.fields.splice( i, 1 )[ 0 ] ); st.dirty(); draw(); } }, BC.icon( 'arrow-up', 15 ) ),
						h( 'button', { type: 'button', class: 'bc-icon-btn', disabled: i === f.fields.length - 1, onClick: function () { f.fields.splice( i + 1, 0, f.fields.splice( i, 1 )[ 0 ] ); st.dirty(); draw(); } }, BC.icon( 'arrow-down', 15 ) ),
						h( 'button', { type: 'button', class: 'bc-icon-btn', onClick: function () { f.fields.splice( i, 1 ); st.dirty(); draw(); } }, BC.icon( 'trash', 15 ) )
					),
					F.render( [
						{ k: 'enabled', type: 'switch', label: t( 'فعال', 'Enabled' ), cols: 'third' },
						{ k: 'required', type: 'switch', label: t( 'الزامی', 'Required' ), cols: 'third' },
						{ k: 'width', type: 'segment', label: t( 'عرض', 'Width' ), cols: 'third', opts: [ { value: 'full', label: t( 'کامل', 'Full' ) }, { value: 'half', label: t( 'نصف', 'Half' ) } ] },
						{ k: 'label', label: t( 'عنوان', 'Label' ), cols: 'half' },
						{ k: 'placeholder', label: t( 'متن راهنما', 'Placeholder' ), cols: 'half' },
						{ k: 'type', type: 'select', label: t( 'نوع', 'Type' ), cols: 'half', opts: opt( types ), onSet: function () { draw(); } },
						{ k: 'map', type: 'select', label: t( 'ذخیره به‌عنوان', 'Save as' ), cols: 'half', opts: opt( maps ), help: fd.map === 'phone' ? t( 'شماره موبایل برای محدودیت‌ها، OTP، پیامک جایزه و شانس‌های پیامکی استفاده می‌شود.', 'Used for limits, OTP, prize SMS and phone-based spins.' ) : ( fd.map === 'birthday' ? t( 'برای قانون «هدیه تولد» ذخیره می‌شود.', 'Stored for birthday rewards.' ) : '' ) },
						{ k: 'options', type: 'textarea', label: t( 'گزینه‌ها (هر خط یکی)', 'Options (one per line)' ), rows: 3, show: function () { return [ 'select', 'radio' ].indexOf( fd.type ) > -1; } },
						{ k: 'desktop', type: 'switch', label: t( 'نمایش در دسکتاپ', 'Show on desktop' ), cols: 'half' },
						{ k: 'mobile', type: 'switch', label: t( 'نمایش در موبایل', 'Show on mobile' ), cols: 'half' },
					], fd, st.dirty )
				) );
			} );
			box.appendChild( h( 'div', { class: 'bc-row' },
				BC.btn( BC.il( 'plus', t( 'افزودن فیلد', 'Add field' ), 15 ), function () {
					var n = Object.assign( clone( BC.boot.field_defaults ), { id: 'f' + Math.random().toString( 36 ).slice( 2, 8 ), label: t( 'فیلد جدید', 'New field' ) } );
					f.fields.push( n );
					st.dirty();
					draw();
				}, 'sm' ),
				[ [ 'name', 'text', t( 'نام', 'Name' ) ], [ 'phone', 'tel', t( 'موبایل', 'Mobile' ) ], [ 'email', 'email', t( 'ایمیل', 'Email' ) ], [ 'birthday', 'date', t( 'تاریخ تولد', 'Birthday' ) ], [ 'city', 'text', t( 'شهر', 'City' ) ] ].map( function ( x ) {
					var exists = f.fields.some( function ( fd ) { return fd.map === x[ 0 ]; } );
					return exists ? null : BC.btn( '+ ' + x[ 2 ], function () {
						f.fields.push( Object.assign( clone( BC.boot.field_defaults ), { id: x[ 0 ], map: x[ 0 ], type: x[ 1 ], label: x[ 2 ], placeholder: x[ 0 ] === 'phone' ? '09xxxxxxxxx' : '' } ) );
						st.dirty();
						draw();
					}, 'sm ghost' );
				} )
			) );
		}
		draw();
		return box;
	}

	function formTab( st ) {
		var f = st.cfg.form;
		return [
			BC.card( { title: t( 'فیلدهای فرم', 'Form fields' ), sub: t( 'هر تعداد فیلد با هر ترتیب؛ برای مخاطبان خروجی CSV دارید.', 'Any fields in any order; exportable to CSV.' ), icon: 'list' }, fieldsBuilder( st ) ),
			BC.card( { title: t( 'تایید موبایل و کاربران عضو', 'Mobile verification & members' ), icon: 'shield' }, F.render( [
				{ k: 'phone_otp', type: 'switch', label: t( 'تایید شماره موبایل با کد پیامکی (OTP)', 'Verify the mobile with an SMS code (OTP)' ), help: t( 'قوی‌ترین روش جلوگیری از تقلب؛ هر شماره فقط طبق سهمیه می‌چرخاند. نیاز به تنظیم پنل پیامک دارد.', 'The strongest anti-cheat: each number spins only within its allowance. Needs an SMS panel.' ) },
				{ k: 'otp_send_text', label: t( 'متن دکمه ارسال کد', 'Send-code button' ), cols: 'half', show: function () { return f.phone_otp || st.cfg.access.require_otp; } },
				{ k: 'otp_label', label: t( 'متن کادر کد', 'Code field placeholder' ), cols: 'half', show: function () { return f.phone_otp || st.cfg.access.require_otp; } },
				{ k: 'prefill_user', type: 'switch', label: t( 'پر کردن خودکار برای کاربران عضو', 'Prefill for logged-in users' ), cols: 'half' },
				{ k: 'hide_known', type: 'switch', label: t( 'مخفی کردن فیلدهای پرشده برای اعضا', 'Hide known fields for members' ), cols: 'half' },
				{ k: 'login_text', label: t( 'پیام «ابتدا وارد شوید»', '"Please log in" message' ) },
				{ k: 'login_button', label: t( 'متن دکمه ورود', 'Login button' ), cols: 'half' },
				{ k: 'login_url', label: t( 'آدرس صفحه ورود (خالی = حساب کاربری ووکامرس)', 'Login URL (empty = My account)' ), dir: 'ltr', cols: 'half' },
			], f, st.dirty ) ),
			BC.card( { title: t( 'رضایت‌نامه و خبرنامه', 'Consent & marketing' ), icon: 'check-circle' }, F.render( [
				{ k: 'consent.enabled', type: 'switch', label: t( 'تیک پذیرش قوانین', 'Terms checkbox' ), cols: 'half' },
				{ k: 'consent.required', type: 'switch', label: t( 'الزامی', 'Required' ), cols: 'half', show: function () { return f.consent.enabled; } },
				{ k: 'consent.text', type: 'html', label: t( 'متن (لینک مجاز)', 'Text (links allowed)' ), rows: 2, show: function () { return f.consent.enabled; } },
				{ k: 'marketing.enabled', type: 'switch', label: t( 'تیک دریافت پیشنهادهای پیامکی', 'Marketing opt-in checkbox' ), cols: 'half' },
				{ k: 'marketing.checked', type: 'switch', label: t( 'پیش‌فرض تیک‌خورده', 'Checked by default' ), cols: 'half', show: function () { return f.marketing.enabled; } },
				{ k: 'marketing.text', label: t( 'متن', 'Text' ), show: function () { return f.marketing.enabled; } },
			], f, st.dirty ) ),
			BC.card( { title: t( 'دکمه و ظاهر فیلدها', 'Button & field styles' ), icon: 'sliders' }, F.render( [
				{ k: 'button_text', label: t( 'متن دکمه چرخاندن', 'Spin button text' ) },
				{ k: 'button_bg', type: 'color', label: t( 'رنگ دکمه', 'Button color' ), cols: 'third' },
				{ k: 'button_bg2', type: 'color', label: t( 'رنگ دوم (گرادیان)', 'Gradient color' ), cols: 'third' },
				{ k: 'button_color', type: 'color', label: t( 'رنگ متن دکمه', 'Button text' ), cols: 'third' },
				{ k: 'button_radius', type: 'range', label: t( 'گردی دکمه', 'Button radius' ), min: 0, max: 40, unit: 'px', cols: 'half' },
				{ k: 'button_size', type: 'segment', label: t( 'اندازه', 'Size' ), cols: 'half', opts: [ { value: 'md', label: t( 'متوسط', 'Medium' ) }, { value: 'lg', label: t( 'بزرگ', 'Large' ) }, { value: 'xl', label: t( 'خیلی بزرگ', 'XL' ) } ] },
				{ k: 'button_animation', type: 'segment', label: t( 'انیمیشن دکمه', 'Button animation' ), opts: [ { value: 'shine', label: t( 'درخشش', 'Shine' ) }, { value: 'pulse', label: t( 'تپش', 'Pulse' ) }, { value: 'bounce', label: t( 'پرش', 'Bounce' ) }, { value: 'glow', label: t( 'هاله', 'Glow' ) }, { value: 'none', label: t( 'بدون', 'None' ) } ] },
				{ k: 'button_full', type: 'switch', label: t( 'دکمه تمام‌عرض', 'Full-width button' ) },
				{ k: 'field_bg', type: 'color', label: t( 'پس‌زمینه فیلد', 'Field background' ), cols: 'third' },
				{ k: 'field_border', type: 'color', label: t( 'حاشیه فیلد', 'Field border' ), cols: 'third' },
				{ k: 'field_text', type: 'color', label: t( 'متن فیلد', 'Field text' ), cols: 'third' },
				{ k: 'field_radius', type: 'range', label: t( 'گردی فیلدها', 'Field radius' ), min: 0, max: 30, unit: 'px' },
			], f, st.dirty ) ),
		];
	}

	/* ------------------------------------------------------------------ display / targeting */

	function displayTab( st ) {
		var dsp = st.cfg.display;
		var on = function ( k ) { return function () { return !! dsp[ k ]; }; };
		return [
			BC.card( { title: t( 'نحوه نمایش', 'How it shows' ), icon: 'eye' }, F.render( [
				{ k: 'mode', type: 'segment', label: t( 'حالت', 'Mode' ), opts: [ { value: 'popup', label: t( 'پاپ‌آپ خودکار', 'Auto popup' ) }, { value: 'inline', label: t( 'فقط داخل صفحه (شورت‌کد)', 'Inline only (shortcode)' ) }, { value: 'both', label: t( 'هر دو', 'Both' ) } ] },
				{ k: 'devices', type: 'chips', label: t( 'دستگاه‌ها', 'Devices' ), opts: [ { value: 'desktop', label: t( 'دسکتاپ', 'Desktop' ) }, { value: 'tablet', label: t( 'تبلت', 'Tablet' ) }, { value: 'mobile', label: t( 'موبایل', 'Mobile' ) } ] },
			], dsp, st.dirty ) ),
			BC.card( { title: t( 'چه زمانی باز شود؟ (تریگرها)', 'When to open (triggers)' ), sub: t( 'هر کدام زودتر رخ دهد پاپ‌آپ را باز می‌کند.', 'Whichever happens first opens the popup.' ), icon: 'zap' }, F.render( [
				{ k: 'on_load', type: 'switch', label: t( 'بعد از چند ثانیه', 'After a delay' ), cols: 'half' },
				{ k: 'delay', type: 'number', label: t( 'تاخیر (ثانیه)', 'Delay (s)' ), min: 0, cols: 'third', show: on( 'on_load' ) },
				{ k: 'delay_max', type: 'number', label: t( 'تاخیر تصادفی تا', 'Random up to (s)' ), min: 0, cols: 'third', show: on( 'on_load' ) },
				{ k: 'scroll', type: 'switch', label: t( 'بعد از اسکرول صفحه', 'After scrolling' ), cols: 'half' },
				{ k: 'scroll_percent', type: 'range', label: t( 'درصد اسکرول', 'Scroll %' ), min: 5, max: 100, unit: '%', cols: 'half', show: on( 'scroll' ) },
				{ k: 'exit_intent', type: 'switch', label: t( 'قصد خروج (دسکتاپ)', 'Exit intent (desktop)' ), cols: 'half' },
				{ k: 'exit_mobile', type: 'switch', label: t( 'قصد خروج در موبایل (اسکرول سریع به بالا / بازگشت به تب)', 'Mobile exit intent (fast scroll-up / tab return)' ), cols: 'half', show: on( 'exit_intent' ) },
				{ k: 'inactivity', type: 'switch', label: t( 'بعد از بی‌فعالیتی', 'After inactivity' ), cols: 'half' },
				{ k: 'inactivity_seconds', type: 'number', label: t( 'ثانیه بی‌فعالیتی', 'Idle seconds' ), min: 5, cols: 'half', show: on( 'inactivity' ) },
				{ k: 'pageviews', type: 'number', label: t( 'حداقل تعداد صفحات دیده‌شده در این بازدید', 'Minimum pages viewed this visit' ), min: 0, cols: 'half' },
				{ k: 'add_to_cart', type: 'switch', label: t( 'بعد از افزودن به سبد (Ajax)', 'After add-to-cart (Ajax)' ), cols: 'half' },
				{ k: 'thankyou', type: 'switch', label: t( 'باز شدن خودکار در صفحه تشکر خرید وقتی شانس گرفته', 'Auto-open on the thank-you page when spins were earned' ) },
				{ k: 'click_selector', label: t( 'با کلیک روی این المان‌ها (CSS selector)', 'On click of (CSS selector)' ), dir: 'ltr', placeholder: '.open-wheel, #promo-btn', help: t( 'همچنین هر لینکی با آدرس #bch-open یا دکمه‌ای با data-bch-open="شناسه" گردونه را باز می‌کند.', 'Any link to #bch-open or element with data-bch-open="ID" also opens it.' ) },
			], dsp, st.dirty ) ),
			BC.card( { title: t( 'دفعات نمایش', 'Frequency' ), icon: 'clock' }, F.render( [
				{ k: 'frequency', type: 'segment', label: t( 'نمایش خودکار', 'Auto show' ), opts: [ { value: 'always', label: t( 'هر بار', 'Every page' ) }, { value: 'session', label: t( 'یک‌بار در هر بازدید', 'Once per visit' ) }, { value: 'days', label: t( 'هر چند روز یک‌بار', 'Every N days' ) }, { value: 'once', label: t( 'فقط یک‌بار', 'Only once' ) } ] },
				{ k: 'frequency_days', type: 'number', label: t( 'هر چند روز', 'Every N days' ), min: 1, cols: 'half', show: function () { return dsp.frequency === 'days'; } },
				{ k: 'max_impressions', type: 'number', label: t( 'حداکثر دفعات نمایش به هر نفر (۰ = نامحدود)', 'Max impressions per visitor (0 = ∞)' ), min: 0, cols: 'half' },
				{ k: 'hide_after_close_days', type: 'number', label: t( 'بعد از بستن، تا چند روز خودکار باز نشود', 'After closing, hide for days' ), min: 0, cols: 'half' },
				{ k: 'hide_after_spin_days', type: 'number', label: t( 'بعد از چرخاندن، تا چند روز خودکار باز نشود', 'After spinning, hide for days' ), min: 0, cols: 'half' },
				{ k: 'hide_when_no_spins', type: 'switch', label: t( 'اگر شانسی ندارد پاپ‌آپ خودکار باز نشود', 'Don\'t auto-open when the visitor has no spins' ) },
			], dsp, st.dirty ) ),
			BC.card( { title: t( 'دکمه شناور (لانچر)', 'Floating launcher' ), icon: 'wheel' }, F.render( [
				{ k: 'launcher', type: 'switch', label: t( 'نمایش دکمه شناور', 'Show floating button' ) },
				{ k: 'launcher_style', type: 'segment', label: t( 'شکل', 'Style' ), show: on( 'launcher' ), opts: [ { value: 'wheel', label: t( 'گردونه کوچک', 'Mini wheel' ) }, { value: 'gift', label: t( 'هدیه', 'Gift' ) }, { value: 'image', label: t( 'تصویر', 'Image' ) }, { value: 'pill', label: t( 'دکمه با متن', 'Pill' ) }, { value: 'tab', label: t( 'زبانه کناری', 'Side tab' ) } ] },
				{ k: 'launcher_image', type: 'image', label: t( 'تصویر', 'Image' ), show: function () { return dsp.launcher && dsp.launcher_style === 'image'; } },
				{ k: 'launcher_text', label: t( 'متن / راهنما', 'Text / tooltip' ), show: on( 'launcher' ) },
				{ k: 'launcher_position', type: 'select', label: t( 'محل', 'Position' ), cols: 'half', show: on( 'launcher' ), opts: [ [ 'bottom-start', t( 'پایین - ابتدا', 'Bottom start' ) ], [ 'bottom-end', t( 'پایین - انتها', 'Bottom end' ) ], [ 'middle-start', t( 'وسط - ابتدا', 'Middle start' ) ], [ 'middle-end', t( 'وسط - انتها', 'Middle end' ) ], [ 'top-start', t( 'بالا - ابتدا', 'Top start' ) ], [ 'top-end', t( 'بالا - انتها', 'Top end' ) ] ].map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ) },
				{ k: 'launcher_animation', type: 'select', label: t( 'انیمیشن', 'Animation' ), cols: 'half', show: on( 'launcher' ), opts: [ [ 'spin', t( 'چرخش', 'Spin' ) ], [ 'pulse', t( 'تپش', 'Pulse' ) ], [ 'shake', t( 'تکان', 'Shake' ) ], [ 'bounce', t( 'پرش', 'Bounce' ) ], [ 'none', t( 'بدون', 'None' ) ] ].map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ) },
				{ k: 'launcher_bg', type: 'color', label: t( 'رنگ', 'Color' ), cols: 'third', show: on( 'launcher' ) },
				{ k: 'launcher_color', type: 'color', label: t( 'رنگ متن', 'Text color' ), cols: 'third', show: on( 'launcher' ) },
				{ k: 'launcher_size', type: 'range', label: t( 'اندازه', 'Size' ), min: 36, max: 120, unit: 'px', cols: 'third', show: on( 'launcher' ) },
				{ k: 'launcher_offset_x', type: 'number', label: t( 'فاصله افقی', 'Horizontal offset' ), cols: 'third', show: on( 'launcher' ) },
				{ k: 'launcher_offset_y', type: 'number', label: t( 'فاصله عمودی', 'Vertical offset' ), cols: 'third', show: on( 'launcher' ) },
				{ k: 'launcher_delay', type: 'number', label: t( 'نمایش بعد از (ثانیه)', 'Show after (s)' ), min: 0, cols: 'third', show: on( 'launcher' ) },
				{ k: 'launcher_badge', type: 'switch', label: t( 'نشان تعداد شانس‌ها', 'Spins-left badge' ), cols: 'half', show: on( 'launcher' ) },
				{ k: 'launcher_hide_after_spin', type: 'switch', label: t( 'بعد از چرخاندن پنهان شود', 'Hide after spinning' ), cols: 'half', show: on( 'launcher' ) },
				{ k: 'launcher_desktop', type: 'switch', label: t( 'در دسکتاپ', 'On desktop' ), cols: 'half', show: on( 'launcher' ) },
				{ k: 'launcher_mobile', type: 'switch', label: t( 'در موبایل', 'On mobile' ), cols: 'half', show: on( 'launcher' ) },
			], dsp, st.dirty ) ),
			barCard( st, dsp ),
		];
	}

	/** Manual gift products (name, image, price, chance) for "free gift product" slices. */
	function giftItems( s, ch ) {
		s.gift_items = s.gift_items || [];
		var box = h( 'div', { class: 'bc-gifts bc-col-full' } );
		var draw = function () {
			BC.clear( box );
			box.appendChild( h( 'div', { class: 'bc-gifts__head' }, h( 'b', { text: t( 'محصولات دستی (خارج از فروشگاه)', 'Manual products (not in the shop)' ) } ), h( 'span', { class: 'bc-muted', text: t( 'با عکس و قیمت؛ اگر برنده شود همین محصول به سبد خرید می‌رود.', 'With image and price; when drawn, this product goes into the cart.' ) } ) ) );
			s.gift_items.forEach( function ( it, i ) {
				var row = h( 'div', { class: 'bc-gift' },
					h( 'div', { class: 'bc-gift__img' + ( it.image ? '' : ' is-empty' ), style: it.image ? { backgroundImage: 'url("' + String( it.image ).replace( /"/g, '' ) + '")' } : null }, it.image ? null : '🎁' ),
					F.render( [
						{ k: 'name', label: t( 'نام محصول', 'Product name' ) },
						{ k: 'price', type: 'number', label: t( 'قیمت (برای نمایش «رایگان»)', 'Price (shown struck-through)' ), min: 0, unit: F.cur(), cols: 'half' },
						{ k: 'weight', type: 'number', label: t( 'شانس نسبی', 'Relative chance' ), min: 0, step: 'any', cols: 'half', help: t( 'پیش‌فرض ۱', 'Default 1' ) },
						{ k: 'image', type: 'image', label: t( 'عکس محصول', 'Product image' ), onSet: function () { draw(); } },
					], it, ch ),
					h( 'button', { type: 'button', class: 'bc-icon-btn bc-gift__del', title: t( 'حذف', 'Remove' ), onClick: function () { s.gift_items.splice( i, 1 ); ch(); draw(); } }, BC.icon( 'trash', 15 ) )
				);
				box.appendChild( row );
			} );
			box.appendChild( BC.btn( BC.il( 'plus', t( 'افزودن محصول دستی', 'Add a manual product' ), 14 ), function () { s.gift_items.push( { key: '', name: '', image: '', price: 0, weight: 1 } ); ch(); draw(); }, 'sm' ) );
		};
		draw();
		return box;
	}

	/** Coupon bar settings card; re-renders itself when a quick theme is applied. */
	function barCard( st, dsp ) {
		var box = h( 'div' );
		var draw = function () {
			BC.clear( box );
			box.appendChild( F.render( barFields( 'all' ), dsp, st.dirty ) );
		};
		box.addEventListener( 'bc-refresh', function () { draw(); st.dirty(); } );
		draw();
		return BC.card( {
			title: t( 'نوار چسبان کد تخفیف بعد از برد', 'Sticky coupon bar after winning' ),
			sub: t( 'کد برنده را روی همه صفحات نشان می‌دهد تا وقتی استفاده شود یا منقضی شود. همه رنگ‌ها، دکمه‌ها و شکلش قابل تغییر است.', 'Shows the won code on every page until it is used or expires. Every color, button and shape is customizable.' ),
			icon: 'ticket',
			actions: BC.btn( BC.il( 'edit', t( 'ویرایش زنده در پیش‌نمایش', 'Live edit in preview' ), 14 ), function () { if ( st.showView ) { st.showView( 'page' ); } }, 'sm' ),
		}, box );
	}

	function pageRules( st ) {
		var tg = st.cfg.targeting;
		var box = h( 'div', { class: 'bc-rules' } );
		var types = [ [ 'home', t( 'صفحه اصلی', 'Home' ) ], [ 'shop', t( 'فروشگاه', 'Shop' ) ], [ 'product', t( 'محصول (شناسه‌ها اختیاری)', 'Product (ids optional)' ) ], [ 'product_cat', t( 'دسته محصول (شناسه‌ها)', 'Product category (ids)' ) ], [ 'product_tag', t( 'برچسب محصول', 'Product tag' ) ], [ 'cart', t( 'سبد خرید', 'Cart' ) ], [ 'checkout', t( 'تسویه حساب', 'Checkout' ) ], [ 'thankyou', t( 'تشکر از خرید', 'Thank-you' ) ], [ 'account', t( 'حساب کاربری', 'My account' ) ], [ 'blog', t( 'وبلاگ', 'Blog' ) ], [ 'post', t( 'نوشته (شناسه‌ها اختیاری)', 'Post (ids optional)' ) ], [ 'page', t( 'برگه (شناسه‌ها اختیاری)', 'Page (ids optional)' ) ], [ 'category', t( 'دسته نوشته', 'Category' ) ], [ 'tag', t( 'برچسب', 'Tag' ) ], [ 'search', t( 'نتایج جستجو', 'Search' ) ], [ '404', '404' ], [ 'archive', t( 'آرشیو', 'Archive' ) ], [ 'post_type', t( 'نوع نوشته', 'Post type' ) ], [ 'object_id', t( 'شناسه صفحه', 'Object ID' ) ], [ 'url_contains', t( 'آدرس شامل', 'URL contains' ) ], [ 'url_exact', t( 'آدرس دقیقاً', 'Exact URL' ) ], [ 'url_regex', t( 'آدرس (Regex)', 'URL regex' ) ], [ 'query_param', t( 'پارامتر آدرس (key=value)', 'Query param (key=value)' ) ] ];
		function draw() {
			BC.clear( box );
			box.appendChild( F.render( [ { k: 'pages', type: 'segment', label: t( 'کجا نمایش داده شود؟', 'Where to show?' ), opts: [ { value: 'all', label: t( 'همه صفحات', 'All pages' ) }, { value: 'include', label: t( 'فقط این صفحات', 'Only these' ) }, { value: 'exclude', label: t( 'همه به‌جز این‌ها', 'All except' ) } ], onSet: draw } ], tg, st.dirty ) );
			if ( tg.pages === 'all' ) {
				return;
			}
			tg.page_rules.forEach( function ( r, i ) {
				var sel = h( 'select', { class: 'bc-input bc-select' }, types.map( function ( x ) { return h( 'option', { value: x[ 0 ], text: x[ 1 ] } ); } ) );
				sel.value = r.type;
				sel.addEventListener( 'change', function () { r.type = sel.value; st.dirty(); } );
				var val = h( 'input', { class: 'bc-input', dir: 'ltr', value: r.value || '', placeholder: t( 'مقدار (برای چند مورد با کاما جدا کنید)', 'Value (comma-separate several)' ) } );
				val.addEventListener( 'input', function () { r.value = val.value; st.dirty(); } );
				box.appendChild( h( 'div', { class: 'bc-cond__row' }, sel, val, h( 'button', { type: 'button', class: 'bc-icon-btn', onClick: function () { tg.page_rules.splice( i, 1 ); st.dirty(); draw(); } }, BC.icon( 'trash', 15 ) ) ) );
			} );
			box.appendChild( BC.btn( BC.il( 'plus', t( 'افزودن قانون صفحه', 'Add page rule' ), 14 ), function () { tg.page_rules.push( { type: 'product', value: '' } ); st.dirty(); draw(); }, 'sm' ) );
			if ( tg.pages === 'include' && ! tg.page_rules.length ) {
				box.appendChild( BC.alert( 'warn', t( 'هیچ قانونی اضافه نشده؛ فعلاً در همه صفحات نمایش داده می‌شود.', 'No rules yet; it currently shows everywhere.' ) ) );
			}
		}
		draw();
		return box;
	}

	function targetingTab( st ) {
		return [
			BC.card( { title: t( 'صفحات', 'Pages' ), icon: 'map' }, pageRules( st ) ),
			BC.card( { title: t( 'مخاطبان پاپ‌آپ', 'Popup audience' ), sub: t( 'چه کسانی پاپ‌آپ را ببینند (بر اساس کاربر، سبد، منبع ورود، UTM، دستگاه، زمان و…). برای «چه کسی اجازه چرخاندن دارد» از تب «چه کسی و چند بار» استفاده کنید.', 'Who sees the popup (user, cart, referrer, UTM, device, time…). For who may spin, use the "Who & how often" tab.' ), icon: 'users' }, F.conditions( st.cfg.targeting.audience, 'any', st.dirty, { title: t( 'نمایش فقط برای مخاطبان خاص', 'Show only to a specific audience' ), off: t( 'پاپ‌آپ برای همه بازدیدکنندگان نمایش داده می‌شود.', 'The popup shows to every visitor.' ), presets: F.audiencePresets() } ) ),
		];
	}

	/* ------------------------------------------------------------------ access (who & how many) */

	function limitsEditor( st ) {
		var a = st.cfg.access;
		var box = h( 'div', { class: 'bc-limits' } );
		var periods = [ [ 'lifetime', t( 'کل دوره', 'in total' ) ], [ 'hour', t( 'در هر ساعت', 'per hour' ) ], [ 'day', t( 'در هر روز', 'per day' ) ], [ 'week', t( 'در هر هفته', 'per week' ) ], [ 'month', t( 'در هر ماه', 'per month' ) ], [ 'rolling', t( 'در هر … ساعت (پنجره متحرک)', 'per rolling N hours' ) ] ];
		function draw() {
			BC.clear( box );
			a.limits.forEach( function ( l, i ) {
				var cnt = h( 'input', { class: 'bc-input bc-input--sm', type: 'number', min: 0, value: l.count, dir: 'ltr' } );
				cnt.addEventListener( 'input', function () { l.count = +cnt.value || 0; st.dirty(); summary(); } );
				var per = h( 'select', { class: 'bc-input bc-select' }, periods.map( function ( x ) { return h( 'option', { value: x[ 0 ], text: x[ 1 ] } ); } ) );
				per.value = l.period;
				per.addEventListener( 'change', function () { l.period = per.value; st.dirty(); draw(); } );
				var hrs = l.period === 'rolling' ? h( 'input', { class: 'bc-input bc-input--sm', type: 'number', min: 1, value: l.hours, dir: 'ltr' } ) : null;
				if ( hrs ) {
					hrs.addEventListener( 'input', function () { l.hours = +hrs.value || 24; st.dirty(); summary(); } );
				}
				box.appendChild( h( 'div', { class: 'bc-cond__row' }, h( 'span', { text: t( 'حداکثر', 'At most' ) } ), cnt, h( 'span', { text: t( 'بار', 'spins' ) } ), per, hrs, hrs ? h( 'span', { text: t( 'ساعت', 'hours' ) } ) : null, h( 'button', { type: 'button', class: 'bc-icon-btn', onClick: function () { a.limits.splice( i, 1 ); st.dirty(); draw(); } }, BC.icon( 'trash', 15 ) ) ) );
			} );
			box.appendChild( BC.btn( BC.il( 'plus', t( 'افزودن محدودیت', 'Add limit' ), 14 ), function () { a.limits.push( { count: 1, period: 'day', hours: 24 } ); st.dirty(); draw(); }, 'sm' ) );
			box.appendChild( sumEl );
			summary();
		}
		var sumEl = h( 'div', { class: 'bc-summary' } );
		function summary() {
			var lines = [];
			var who = [];
			if ( a.limit_user ) { who.push( t( 'حساب کاربری', 'account' ) ); }
			if ( a.limit_phone ) { who.push( t( 'شماره موبایل', 'mobile' ) ); }
			if ( a.limit_email ) { who.push( t( 'ایمیل', 'email' ) ); }
			if ( a.limit_device ) { who.push( t( 'دستگاه', 'device' ) ); }
			if ( a.limit_ip ) { who.push( 'IP' ); }
			if ( a.mode === 'credits' ) {
				lines.push( t( 'فقط کسانی که «شانس» گرفته‌اند (طبق قوانین شانس یا هدیه دستی) می‌چرخانند؛ هر چرخش یک شانس مصرف می‌کند.', 'Only people who earned spins (rules or manual grants) can spin; each spin uses one.' ) );
			} else if ( a.mode === 'hybrid' ) {
				lines.push( t( 'سهمیه رایگان زیر + شانس‌های کسب‌شده (بعد از تمام شدن سهمیه رایگان).', 'Free allowance below + earned spins once the free allowance is used.' ) );
			}
			a.limits.forEach( function ( l ) {
				var p = periods.filter( function ( x ) { return x[ 0 ] === l.period; } )[ 0 ];
				lines.push( t( 'هر نفر حداکثر %1 بار %2', 'Each person at most %1 spins %2', BC.num( l.count, 0 ), l.period === 'rolling' ? t( 'در هر %1 ساعت', 'per %1 hours', BC.num( l.hours, 0 ) ) : p[ 1 ] ) );
			} );
			if ( ! a.limits.length && a.mode !== 'credits' ) {
				lines.push( t( '⚠️ بدون محدودیت: هر نفر بی‌نهایت بار می‌تواند بچرخاند!', '⚠️ No limit: anyone can spin unlimited times!' ) );
			}
			if ( +a.cooldown_minutes > 0 ) {
				lines.push( t( 'فاصله بین دو چرخش: %1 دقیقه', 'Cooldown between spins: %1 min', BC.num( a.cooldown_minutes, 0 ) ) );
			}
			if ( +a.max_wins > 0 ) {
				lines.push( t( 'حداکثر %1 برد', 'Max %1 wins', BC.num( a.max_wins, 0 ) ) );
			}
			lines.push( t( 'شناسایی هر نفر با: %1', 'People are identified by: %1', who.join( '، ' ) || '—' ) );
			BC.clear( sumEl );
			sumEl.appendChild( h( 'b', { text: t( 'خلاصه قوانین:', 'Summary:' ) } ) );
			sumEl.appendChild( h( 'ul', null, lines.map( function ( l ) { return h( 'li', { text: l } ); } ) ) );
		}
		st.summary = summary;
		draw();
		return box;
	}

	function accessTab( st ) {
		var a = st.cfg.access;
		var e = st.cfg.engine;
		return [
			BC.card( { title: t( 'چه کسی می‌تواند بچرخاند؟', 'Who can spin?' ), icon: 'users' }, [
				F.render( [
					{ k: 'mode', type: 'segment', label: t( 'نوع دسترسی', 'Access type' ), onSet: function () { st.summary && st.summary(); }, opts: [ { value: 'free', label: t( 'آزاد با سهمیه', 'Free with allowance' ) }, { value: 'credits', label: t( 'فقط با شانس کسب‌شده', 'Earned spins only' ) }, { value: 'hybrid', label: t( 'ترکیبی', 'Hybrid' ) } ] },
					{ type: 'note', show: function () { return a.mode !== 'free'; }, html: t( 'شانس‌ها را در صفحه <a href="#/rules">قوانین شانس</a> تعریف کنید؛ مثلاً «اولین سفارش = ۱ شانس» یا «خرید بالای ۲ میلیون = ۱ شانس». در صفحه <a href="#/credits">شانس‌های کاربران</a> هم می‌توانید دستی به هر کاربر/شماره شانس بدهید.', 'Define how spins are earned on <a href="#/rules">Spin rules</a> (e.g. first order = 1 spin, order over 2M = 1 spin). Grant spins manually on <a href="#/credits">User spins</a>.' ) },
					{ k: 'require_login', type: 'switch', label: t( 'فقط کاربران عضو (لاگین)', 'Logged-in users only' ), cols: 'half' },
					{ k: 'require_otp', type: 'switch', label: t( 'الزام تایید موبایل با OTP', 'Require mobile OTP' ), cols: 'half' },
					{ type: 'note', show: function () { return a.mode === 'free'; }, html: t( 'شانس‌هایی که دستی، با قوانین یا پیامک گروهی به کسی می‌دهید، بعد از تمام شدن سهمیه آزاد هم قابل استفاده است.', 'Spins you grant (manually, by rules or bulk SMS) are usable even after the free allowance is used up.' ) },
					{ k: 'cap_credits', type: 'switch', label: t( 'سهمیه بالا، چرخش با شانس‌های گرفته‌شده را هم محدود کند', 'The allowance also caps spins with granted chances' ), show: function () { return a.mode === 'credits'; }, help: t( 'خاموش (پیشنهادی): هر شانسی که داده شده همیشه قابل استفاده است.', 'Off (recommended): every granted spin can always be used.' ) },
					{ k: 'credit_scope', type: 'segment', label: t( 'کدام شانس‌ها قبول است؟', 'Which spins are accepted?' ), opts: [ { value: 'any', label: t( 'عمومی + مخصوص این گردونه', 'General + this wheel' ) }, { value: 'this', label: t( 'فقط مخصوص این گردونه', 'This wheel only' ) } ] },
					{ k: 'blocked_roles', type: 'chips', label: t( 'نقش‌های غیرمجاز', 'Blocked roles' ), opts: function () { return ( BC.boot.roles || [] ).filter( function ( r ) { return r.value !== 'guest'; } ); } },
				], a, function () { st.dirty(); st.summary && st.summary(); } ),
			] ),
			BC.card( { title: t( 'چند بار؟ (سهمیه هر نفر)', 'How many times? (per person)' ), icon: 'clock' }, [
				limitsEditor( st ),
				F.render( [
					{ type: 'heading', label: t( 'شناسایی افراد برای شمارش', 'How people are identified' ), icon: 'shield' },
					{ k: 'limit_user', type: 'switch', label: t( 'حساب کاربری', 'Account' ), cols: 'third' },
					{ k: 'limit_phone', type: 'switch', label: t( 'شماره موبایل', 'Mobile number' ), cols: 'third' },
					{ k: 'limit_email', type: 'switch', label: t( 'ایمیل', 'Email' ), cols: 'third' },
					{ k: 'limit_device', type: 'switch', label: t( 'دستگاه/مرورگر', 'Device/browser' ), cols: 'third' },
					{ k: 'limit_ip', type: 'switch', label: 'IP', cols: 'third', help: t( 'IP برای کاربران یک شبکه مشترک (مثلاً یک اداره) سخت‌گیرانه است.', 'IP is strict for shared networks.' ) },
					{ k: 'cooldown_minutes', type: 'number', label: t( 'حداقل فاصله بین دو چرخش (دقیقه)', 'Minimum minutes between spins' ), min: 0, cols: 'half' },
					{ k: 'max_wins', type: 'number', label: t( 'حداکثر تعداد برد هر نفر (۰ = نامحدود)', 'Max wins per person (0 = ∞)' ), min: 0, cols: 'half' },
					{ k: 'max_wins_period', type: 'segment', label: t( 'دوره سقف برد', 'Max wins period' ), opts: [ { value: 'lifetime', label: t( 'کل دوره', 'Lifetime' ) }, { value: 'day', label: t( 'روزانه', 'Daily' ) }, { value: 'week', label: t( 'هفتگی', 'Weekly' ) }, { value: 'month', label: t( 'ماهانه', 'Monthly' ) } ], show: function () { return +a.max_wins > 0; } },
				], a, function () { st.dirty(); st.summary && st.summary(); } ),
			] ),
			BC.card( { title: t( 'شرط‌های مجاز بودن برای چرخاندن', 'Eligibility conditions' ), sub: t( 'مثال‌ها: فقط کسانی که مجموع خریدشان بالای ۲ میلیون است، فقط کسانی که هنوز خرید نکرده‌اند، فقط اگر سبدشان بالای ۵۰۰ هزار است، فقط مشتریان یک محصول خاص و…', 'e.g. only customers who spent over 2M, only first-time buyers, only carts above 500k, only buyers of a product…' ), icon: 'filter' }, F.conditions( a.conditions, 'any', st.dirty, { title: t( 'محدود به افراد واجد شرایط', 'Restrict to eligible people' ), off: t( 'همه (طبق سهمیه بالا) می‌توانند بچرخانند.', 'Everyone (within the allowance) can spin.' ), presets: F.audiencePresets() } ) ),
			BC.card( { title: t( 'راهنمای کسب شانس در پاپ‌آپ', 'How-to-earn in the popup' ), icon: 'ticket' }, F.render( [
				{ k: 'show_how_to_earn', type: 'switch', label: t( 'وقتی شانس ندارد، راه‌های گرفتن شانس را نشان بده', 'When out of spins, list how to earn more' ) },
				{ k: 'earn_hint', type: 'textarea', label: t( 'متن دلخواه (هر خط یک مورد؛ خالی = ساخت خودکار از قوانین شانس)', 'Custom lines (one per line; empty = generated from rules)' ), rows: 3, show: function () { return a.show_how_to_earn; } },
			], a, st.dirty ) ),
			BC.card( { title: t( 'موتور شانس', 'Luck engine' ), sub: t( 'برای تجربه بهتر کاربر و کنترل بودجه جوایز.', 'Better experience and prize budget control.' ), icon: 'cpu' }, F.render( [
				{ k: 'first_spin_win', type: 'switch', label: t( 'اولین چرخش هر نفر حتماً برنده شود', 'First spin always wins' ), cols: 'half' },
				{ k: 'pity_after', type: 'number', label: t( 'تضمین برد بعد از N باخت پشت‌سرهم (۰ = خاموش)', 'Guaranteed win after N losses (0 = off)' ), min: 0, cols: 'half' },
				{ k: 'max_respins', type: 'number', label: t( 'حداکثر «دوباره بچرخان» پشت‌سرهم', 'Max consecutive re-spins' ), min: 0, cols: 'half' },
				{ k: 'respin_counts', type: 'switch', label: t( '«دوباره بچرخان» از سهمیه کم شود', 'Re-spins count against the allowance' ), cols: 'half' },
				{ k: 'daily_win_cap', type: 'number', label: t( 'سقف کل بردهای روزانه این گردونه (۰ = بدون سقف)', 'Daily win cap for this wheel (0 = none)' ), min: 0, cols: 'half' },
				{ k: 'total_win_cap', type: 'number', label: t( 'سقف کل بردها (۰ = بدون سقف)', 'Total win cap (0 = none)' ), min: 0, cols: 'half' },
				{ k: 'fallback_slice', type: 'select', label: t( 'وقتی هیچ جایزه‌ای در دسترس نیست روی کدام بخش بایستد؟', 'Where to land when no prize is available' ), opts: function () { return [ { value: '', label: t( 'اولین «پوچ»', 'First "no prize"' ) } ].concat( st.cfg.slices.filter( function ( s ) { return [ 'lose', 'respin' ].indexOf( s.type ) > -1; } ).map( function ( s ) { return { value: s.id, label: s.label }; } ) ); } },
				{ k: 'vip_boost', type: 'range', label: t( 'افزایش شانس جوایز ویژه برای مشتریان قبلی', 'Boost highlighted prizes for returning customers' ), min: 0, max: 300, step: 10, unit: '%' },
			], e, st.dirty ) ),
		];
	}

	/* ------------------------------------------------------------------ coupon, messages, notify, schedule, advanced */

	function couponTab( st ) {
		var c = st.cfg.coupon;
		var sample = h( 'code', { dir: 'ltr' } );
		var upd = function () {
			var cs = { upper_num: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ', num: '0123456789', lower_num: 'abcdefghjkmnpqrstuvwxyz23456789', mixed: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789' }[ c.charset ] || 'ABC123';
			var out = '';
			for ( var i = 0; i < ( +c.length || 8 ); i++ ) {
				out += cs.charAt( Math.floor( Math.random() * cs.length ) );
			}
			sample.textContent = ( c.prefix || '' ).toUpperCase() + out;
		};
		upd();
		return [
			! BC.config.woo ? BC.alert( 'warn', t( 'ووکامرس فعال نیست؛ جوایز کد تخفیف فقط با ووکامرس کار می‌کنند.', 'WooCommerce is not active; coupon prizes need WooCommerce.' ) ) : null,
			BC.card( { title: t( 'ساخت کد یکتا', 'Unique code' ), icon: 'ticket', actions: h( 'span', { class: 'bc-muted' }, t( 'نمونه: ', 'Sample: ' ), sample ) }, F.render( [
				{ k: 'prefix', label: t( 'پیشوند', 'Prefix' ), dir: 'ltr', cols: 'third' },
				{ k: 'length', type: 'number', label: t( 'طول بخش تصادفی', 'Random length' ), min: 4, max: 24, cols: 'third' },
				{ k: 'charset', type: 'select', label: t( 'کاراکترها', 'Characters' ), cols: 'third', opts: [ [ 'upper_num', 'A-Z 2-9' ], [ 'upper', 'A-Z' ], [ 'num', '0-9' ], [ 'lower_num', 'a-z 2-9' ], [ 'mixed', 'A-Z a-z 2-9' ] ].map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ) },
				{ k: 'description', label: t( 'توضیح کوپن (داخلی)', 'Coupon description (internal)' ) },
			], c, function () { upd(); st.dirty(); } ) ),
			BC.card( { title: t( 'اعتبار و محدودیت‌ها', 'Validity & restrictions' ), icon: 'lock' }, F.render( [
				{ k: 'expiry_days', type: 'number', label: t( 'اعتبار (روز)', 'Valid for (days)' ), min: 0, cols: 'half' },
				{ k: 'expiry_hours', type: 'number', label: t( '+ ساعت', '+ hours' ), min: 0, cols: 'half', help: t( 'برای کمپین‌های فوری مثل «۲ ساعت فرصت داری».', 'For flash campaigns like "valid for 2 hours".' ) },
				{ k: 'min_spend', type: 'number', label: t( 'حداقل مبلغ خرید', 'Minimum spend' ), min: 0, unit: F.cur(), cols: 'third' },
				{ k: 'max_spend', type: 'number', label: t( 'حداکثر مبلغ خرید', 'Maximum spend' ), min: 0, unit: F.cur(), cols: 'third' },
				{ k: 'max_discount', type: 'number', label: t( 'سقف تخفیف کدهای درصدی', 'Cap for percent codes' ), min: 0, unit: F.cur(), cols: 'third' },
				{ k: 'usage_limit', type: 'number', label: t( 'تعداد دفعات استفاده از کد', 'Usage limit' ), min: 0, cols: 'half' },
				{ k: 'usage_limit_user', type: 'number', label: t( 'دفعات استفاده هر کاربر', 'Usage limit per user' ), min: 0, cols: 'half' },
				{ k: 'limit_items', type: 'number', label: t( 'اعمال روی حداکثر چند قلم (۰ = همه)', 'Apply to at most N items (0 = all)' ), min: 0, cols: 'half' },
				{ k: 'individual_use', type: 'switch', label: t( 'با کدهای دیگر ترکیب نشود', 'Individual use only' ), cols: 'half' },
				{ k: 'exclude_sale', type: 'switch', label: t( 'روی محصولات حراجی اعمال نشود', 'Exclude sale items' ), cols: 'half' },
				{ k: 'free_shipping', type: 'switch', label: t( 'همه کدها ارسال رایگان هم بدهند', 'All codes also give free shipping' ), cols: 'half' },
				{ k: 'restrict_email', type: 'switch', label: t( 'فقط با ایمیل برنده قابل استفاده', 'Usable only with the winner\'s email' ), cols: 'half' },
				{ k: 'first_order_only', type: 'switch', label: t( 'فقط برای اولین خرید', 'First order only' ), cols: 'half' },
				{ k: 'auto_apply', type: 'switch', label: t( 'اعمال خودکار روی سبد بعد از برد', 'Auto-apply to the cart after winning' ), cols: 'half' },
				{ k: 'product_ids', type: 'products', label: t( 'فقط برای این محصولات', 'Only these products' ), cols: 'half' },
				{ k: 'exclude_product_ids', type: 'products', label: t( 'به‌جز این محصولات', 'Exclude products' ), cols: 'half' },
				{ k: 'category_ids', type: 'categories', label: t( 'فقط این دسته‌ها', 'Only these categories' ), cols: 'half' },
				{ k: 'exclude_category_ids', type: 'categories', label: t( 'به‌جز این دسته‌ها', 'Exclude categories' ), cols: 'half' },
			], c, st.dirty ) ),
		];
	}

	function messagesTab( st ) {
		var m = st.cfg.messages;
		var v = t( 'متغیرها: {name} {prize} {code} {expiry}', 'Variables: {name} {prize} {code} {expiry}' );
		return [
			BC.card( { title: t( 'برد', 'Win' ), icon: 'gift' }, F.render( [
				{ k: 'win_title', label: t( 'عنوان برد', 'Win title' ), help: v },
				{ k: 'win_text', type: 'html', label: t( 'متن برد', 'Win text' ), rows: 2 },
				{ k: 'code_label', label: t( 'برچسب کد', 'Code label' ), cols: 'third' },
				{ k: 'copy_text', label: t( 'دکمه کپی', 'Copy button' ), cols: 'third' },
				{ k: 'copied_text', label: t( 'بعد از کپی', 'After copy' ), cols: 'third' },
				{ k: 'expires_text', label: t( 'متن اعتبار ({expiry})', 'Expiry text ({expiry})' ), cols: 'half' },
				{ k: 'apply_text', label: t( 'دکمه اعمال', 'Apply button' ), cols: 'half' },
				{ k: 'apply_redirect', type: 'segment', label: t( 'بعد از اعمال کجا برود؟', 'After applying go to' ), opts: [ { value: 'cart', label: t( 'سبد خرید', 'Cart' ) }, { value: 'checkout', label: t( 'تسویه حساب', 'Checkout' ) }, { value: 'shop', label: t( 'فروشگاه', 'Shop' ) }, { value: 'stay', label: t( 'همین صفحه', 'Stay' ) }, { value: 'custom', label: t( 'آدرس دلخواه', 'Custom URL' ) } ] },
				{ k: 'apply_url', label: t( 'آدرس دلخواه', 'Custom URL' ), dir: 'ltr', show: function () { return m.apply_redirect === 'custom'; } },
				{ k: 'continue_text', label: t( 'دکمه ادامه', 'Continue button' ), cols: 'half' },
				{ k: 'auto_close', type: 'number', label: t( 'بستن خودکار بعد از (ثانیه، ۰ = خاموش)', 'Auto-close after (s, 0 = off)' ), min: 0, cols: 'half' },
			], m, st.dirty ) ),
			BC.card( { title: t( 'پوچ و دوباره', 'Lose & re-spin' ), icon: 'refresh' }, F.render( [
				{ k: 'lose_title', label: t( 'عنوان پوچ', 'Lose title' ) },
				{ k: 'lose_text', type: 'html', label: t( 'متن پوچ', 'Lose text' ), rows: 2 },
				{ k: 'respin_text', label: t( 'متن «دوباره بچرخان»', 'Re-spin text' ) },
				{ k: 'spin_again_text', label: t( 'دکمه چرخش دوباره', 'Spin again button' ), cols: 'half' },
				{ k: 'spins_left_text', label: t( 'شانس‌های باقی‌مانده ({n})', 'Spins left ({n})' ), cols: 'half' },
			], m, st.dirty ) ),
			BC.card( { title: t( 'وضعیت‌ها و خطاها', 'States & errors' ), icon: 'info' }, F.render( [
				{ k: 'spinning_text', label: t( 'هنگام چرخش', 'While spinning' ), cols: 'half' },
				{ k: 'error_text', label: t( 'خطای عمومی', 'Generic error' ), cols: 'half' },
				{ k: 'no_spins_text', label: t( 'بدون شانس', 'No spins' ) },
				{ k: 'cooldown_text', label: t( 'زمان انتظار ({time})', 'Cooldown ({time})' ), cols: 'half' },
				{ k: 'limit_text', label: t( 'سهمیه تمام شده', 'Limit reached' ), cols: 'half' },
				{ k: 'not_eligible_text', label: t( 'واجد شرایط نیست', 'Not eligible' ) },
				{ k: 'closed_text', type: 'html', label: t( 'کمپین تمام شده', 'Campaign ended' ), rows: 2 },
				{ k: 'earn_title', label: t( 'عنوان راهنمای کسب شانس', 'How-to-earn title' ) },
				{ k: 'earn_text', type: 'html', label: t( 'توضیح اضافه کسب شانس', 'Extra how-to-earn text' ), rows: 2 },
			], m, st.dirty ) ),
			BC.card( { title: t( 'اشتراک‌گذاری و تحویل جایزه', 'Sharing & claims' ), icon: 'send' }, F.render( [
				{ k: 'show_share', type: 'switch', label: t( 'نمایش لینک دعوت (اگر سیستم معرفی فعال باشد)', 'Show invite link (when referrals are on)' ) },
				{ k: 'share_text', label: t( 'متن دعوت', 'Invite text' ), show: function () { return m.show_share; } },
				{ k: 'gift_text', label: t( 'عنوان کادر محصول هدیه تصادفی', 'Random gift box title' ) },
				{ k: 'gift_hint', label: t( 'راهنمای زیر محصول هدیه', 'Hint under the gift' ) },
				{ k: 'claim_title', label: t( 'عنوان فرم تحویل', 'Claim form title' ) },
				{ k: 'claim_button', label: t( 'دکمه ثبت', 'Claim button' ), cols: 'half' },
				{ k: 'claim_success', type: 'html', label: t( 'پیام موفقیت', 'Success message' ), rows: 2 },
			], m, st.dirty ) ),
		];
	}

	function notifyTab( st ) {
		var n = st.cfg.notify;
		var vars = t( 'متغیرها: {name} {mobile} {prize} {prize_type} {code} {expiry} {expiry_days} {link} {wheel} {wheel_link} {site} — راهنمای کامل: پیامک و اعلان ← راهنمای متغیرها', 'Variables: {name} {mobile} {prize} {prize_type} {code} {expiry} {expiry_days} {link} {wheel} {wheel_link} {site} — full list: SMS & alerts → Variables' );
		var mode = BC.boot && BC.boot.sms_mode;
		return [
			mode === 'disabled' ? BC.alert( 'warn', t( 'ارسال پیامک خاموش است یا پنل پیامک انتخاب نشده.', 'SMS sending is off or no panel is selected.' ), h( 'a', { href: '#/sms', text: t( ' تنظیم پیامک ←', ' Set up SMS →' ) } ) ) : ( mode === 'test' ? BC.alert( 'info', t( 'حالت تست پیامک روشن است؛ پیامک‌ها فقط در گزارش ثبت می‌شوند.', 'SMS test mode is on; messages are only logged.' ) ) : null ),
			BC.card( { title: t( 'پیامک‌های این گردونه', 'SMS for this wheel' ), sub: t( 'متن و الگوی همه پیامک‌ها یک‌جا در «پیامک و اعلان ← پیامک‌های خودکار» تعیین می‌شود؛ این‌جا انتخاب کنید این گردونه کدام‌ها را بفرستد.', 'Texts and patterns of all messages are set once in SMS & alerts → Automatic messages; here choose which ones this wheel sends.' ), icon: 'message', actions: h( 'a', { class: 'bc-btn bc-btn--sm', href: '#/sms?tab=templates' }, BC.icon( 'edit', 14 ), t( 'ویرایش متن پیامک‌ها', 'Edit message texts' ) ) }, F.render( [
				{ k: 'sms_customer', type: 'switch', label: t( 'پیامک جایزه به برنده', 'Prize SMS to the winner' ), cols: 'half' },
				{ k: 'sms_lose', type: 'switch', label: t( 'پیامک دلداری بعد از پوچ', 'Consolation SMS after a loss' ), cols: 'half' },
				{ k: 'sms_override', type: 'switch', label: t( 'متن اختصاصی برای همین گردونه', 'Custom text for this wheel only' ), help: t( 'خاموش = متن مشترک صفحه «پیامک‌های خودکار». روشن = این گردونه متن/الگوی خودش را می‌فرستد.', 'Off = the shared text from Automatic messages. On = this wheel sends its own text/pattern.' ), show: function () { return n.sms_customer || n.sms_lose; } },
				{ k: 'sms_mode', type: 'segment', label: t( 'نوع ارسال پیامک جایزه', 'Prize SMS sending' ), show: function () { return n.sms_override && n.sms_customer; }, opts: [ { value: 'text', label: t( 'متن', 'Text' ) }, { value: 'pattern', label: t( 'الگو (پترن)', 'Pattern' ) } ] },
				{ k: 'sms_text', type: 'textarea', label: t( 'متن پیامک جایزه', 'Prize SMS text' ), rows: 4, help: vars, show: function () { return n.sms_override && n.sms_customer; } },
				{ k: 'sms_pattern', label: t( 'کد الگو / شناسه قالب', 'Pattern code / template id' ), dir: 'ltr', cols: 'half', show: function () { return n.sms_override && n.sms_customer && n.sms_mode === 'pattern'; } },
				{ k: 'sms_pattern_vars', type: 'textarea', label: t( 'پارامترهای الگو (هر خط: نام=مقدار)', 'Pattern parameters (name=value per line)' ), rows: 3, dir: 'ltr', mono: true, cols: 'half', help: t( 'مثال: code={code}', 'e.g. code={code}' ), show: function () { return n.sms_override && n.sms_customer && n.sms_mode === 'pattern'; } },
				{ k: 'sms_lose_text', type: 'textarea', label: t( 'متن پیامک پوچ (خالی = متن مشترک)', 'Loss SMS text (empty = shared text)' ), rows: 2, help: vars, show: function () { return n.sms_override && n.sms_lose; } },
				{ type: 'heading', label: t( 'پیامک «شانس چرخاندن گرفتید» برای این گردونه', '"You got spins" SMS for this wheel' ), icon: 'ticket' },
				{ k: 'credit_override', type: 'switch', label: t( 'متن اختصاصی همین گردونه', 'Custom text for this wheel' ), help: t( 'برای شانس‌هایی که مخصوص این گردونه داده می‌شوند (قانون شانس، دادن دستی، هدیه گروهی). خاموش = متن مشترک.', 'For spins granted for this wheel (rules, manual, bulk). Off = the shared text.' ) },
				{ k: 'credit_text', type: 'textarea', label: t( 'متن پیامک', 'SMS text' ), rows: 3, help: t( 'متغیرها: {name} {n} (تعداد شانس) {spins} (کل شانس‌ها) {wheel} {wheel_link} (لینک اختصاصی این گردونه) {credit_expiry} {site}', 'Variables: {name} {n} {spins} {wheel} {wheel_link} {credit_expiry} {site}' ), show: function () { return n.credit_override; } },
				{ type: 'note', html: t( 'پیامک «شانس گرفتید» در هر <a href="#/rules">قانون شانس</a> روشن/خاموش می‌شود و پیامک یادآوری انقضا در کارت پایین همین صفحه.', 'The "spins earned" SMS is switched per <a href="#/rules">spin rule</a>; the expiry reminder in the card below.' ) },
			], n, st.dirty ) ),
			BC.card( { title: t( 'ایمیل به برنده', 'Email to the winner' ), icon: 'mail' }, F.render( [
				{ k: 'email_customer', type: 'switch', label: t( 'ارسال ایمیل جایزه (اگر ایمیل دارد)', 'Send prize email (if an email is known)' ) },
				{ k: 'email_subject', label: t( 'موضوع', 'Subject' ), show: function () { return n.email_customer; } },
				{ k: 'email_heading', label: t( 'تیتر', 'Heading' ), cols: 'half', show: function () { return n.email_customer; } },
				{ k: 'email_button', label: t( 'متن دکمه', 'Button text' ), cols: 'half', show: function () { return n.email_customer; } },
				{ k: 'email_body', type: 'html', label: t( 'متن ایمیل (HTML)', 'Email body (HTML)' ), rows: 6, help: vars, show: function () { return n.email_customer; } },
			], n, st.dirty ) ),
			BC.card( { title: t( 'یادآوری قبل از انقضا', 'Reminder before expiry' ), sub: t( 'به برنده‌هایی که از کدشان استفاده نکرده‌اند یادآوری می‌شود؛ معمولاً فروش زیادی برمی‌گرداند.', 'Reminds winners who have not used their code — usually recovers many sales.' ), icon: 'bell' }, F.render( [
				{ k: 'reminder', type: 'switch', label: t( 'فعال', 'Enabled' ), cols: 'third' },
				{ k: 'reminder_days', type: 'number', label: t( 'چند روز قبل', 'Days before' ), min: 1, cols: 'third', show: function () { return n.reminder; } },
				{ k: 'reminder_channel', type: 'segment', label: t( 'کانال', 'Channel' ), cols: 'third', show: function () { return n.reminder; }, opts: [ { value: 'sms', label: t( 'پیامک', 'SMS' ) }, { value: 'email', label: t( 'ایمیل', 'Email' ) }, { value: 'both', label: t( 'هر دو', 'Both' ) } ] },
				{ type: 'note', html: t( 'متن پیامک یادآوری در <a href="#/sms?tab=templates">پیامک‌های خودکار ← یادآوری انقضای جایزه</a> است.', 'The reminder SMS text is in <a href="#/sms?tab=templates">Automatic messages → Expiry reminder</a>.' ), show: function () { return n.reminder && n.reminder_channel !== 'email'; } },
				{ k: 'reminder_email_body', type: 'html', label: t( 'متن ایمیل یادآوری (خالی = همان متن پیامک یادآوری)', 'Reminder email body (empty = the reminder SMS text)' ), rows: 3, help: vars, show: function () { return n.reminder && n.reminder_channel !== 'sms'; } },
			], n, st.dirty ) ),
			BC.card( { title: t( 'اطلاع به مدیر و اتصال‌ها', 'Admin alerts & integrations' ), icon: 'bell' }, F.render( [
				{ k: 'admin_email', type: 'switch', label: t( 'ایمیل به مدیر', 'Email the admin' ), cols: 'third' },
				{ k: 'admin_sms', type: 'switch', label: t( 'پیامک به مدیر', 'SMS the admin' ), cols: 'third', help: t( 'متن: پیامک‌های خودکار ← برنده جدید', 'Text: Automatic messages → New winner' ) },
				{ k: 'admin_messenger', type: 'switch', label: t( 'پیام در بله/تلگرام', 'Bale / Telegram message' ), cols: 'third' },
				{ k: 'admin_only_wins', type: 'switch', label: t( 'فقط برای بردها', 'Wins only' ), cols: 'half' },
				{ k: 'webhooks', type: 'switch', label: t( 'ارسال به وب‌هوک‌ها (n8n، Zapier، CRM)', 'Send to webhooks (n8n, Zapier, CRM)' ), cols: 'half' },
				{ type: 'note', html: t( 'گیرنده‌ها، ربات بله/تلگرام و وب‌هوک‌ها در <a href="#/sms">پیامک و اعلان</a> تنظیم می‌شوند.', 'Recipients, Bale/Telegram bots and webhooks are set in <a href="#/sms">SMS & alerts</a>.' ) },
			], n, st.dirty ) ),
		];
	}

	function scheduleTab( st ) {
		var s = st.cfg.schedule;
		return [
			BC.card( { title: t( 'زمان‌بندی کمپین', 'Campaign schedule' ), sub: t( 'به وقت سایت (%1). خارج از این بازه گردونه نمایش داده نمی‌شود و چرخاندن ممکن نیست.', 'Site time (%1). Outside this window the wheel is hidden and spinning is blocked.', ( BC.boot.site || {} ).tz || '' ), icon: 'calendar' }, F.render( [
				{ k: 'start', type: 'datetime', label: t( 'شروع', 'Starts' ), cols: 'half' },
				{ k: 'end', type: 'datetime', label: t( 'پایان', 'Ends' ), cols: 'half' },
				{ k: 'days', type: 'chips', numeric: true, label: t( 'روزهای فعال', 'Active days' ), opts: [ 6, 0, 1, 2, 3, 4, 5 ].map( function ( i ) { return { value: i, label: F.weekdays()[ i ] }; } ) },
				{ k: 'hour_from', type: 'number', label: t( 'از ساعت', 'From hour' ), min: 0, max: 23, cols: 'half' },
				{ k: 'hour_to', type: 'number', label: t( 'تا ساعت', 'To hour' ), min: 1, max: 24, cols: 'half', help: t( 'بازه شبانه هم ممکن است، مثلاً ۲۲ تا ۲ بامداد.', 'Overnight windows work too, e.g. 22 to 2.' ) },
			], s, st.dirty ) ),
		];
	}

	function openParam() {
		return ( BC.boot && BC.boot.settings && BC.boot.settings.open_param ) || 'bch_open';
	}
	/** The link people receive for this wheel (same rule as Frontend::wheel_url). */
	function wheelLink( st ) {
		var a = st.cfg.advanced;
		var u = String( a.landing_url || '' ).trim();
		if ( u ) {
			return a.landing_open ? u + ( u.indexOf( '?' ) > -1 ? '&' : '?' ) + openParam() + '=' + st.id : u;
		}
		return BC.config.homeUrl + '?' + openParam() + '=' + st.id;
	}
	E.wheelLink = wheelLink;
	function advancedTab( st ) {
		var a = st.cfg.advanced;
		var sc = '[becharkhoon id="' + st.id + '"]';
		var linkBox = h( 'div', { class: 'bc-copyline' } );
		var drawLink = function () {
			BC.clear( linkBox );
			var x = wheelLink( st );
			linkBox.appendChild( h( 'code', { dir: 'ltr', text: x } ) );
			linkBox.appendChild( BC.btn( BC.icon( 'copy', 14 ), function () { BC.copy( x ); }, 'sm ghost', { 'aria-label': t( 'کپی', 'Copy' ) } ) );
		};
		drawLink();
		return [
			BC.card( { title: t( 'لینک اختصاصی این گردونه', 'This wheel\'s own link' ), sub: t( 'لینکی که در پیامک‌ها و ایمیل‌های این گردونه ({wheel_link}) برای مشتری می‌رود: پیامک «شانس گرفتید»، پوچ، یادآوری و پیامک گروهی. اگر گردونه را با شورت‌کد در یک برگه گذاشته‌اید، آدرس همان برگه را بدهید.', 'The link sent in this wheel\'s SMS and emails ({wheel_link}): spins earned, loss, reminders and bulk SMS. If you placed the wheel on a page with its shortcode, enter that page.' ), icon: 'link' }, [
				F.render( [
					{ k: 'landing_url', label: t( 'آدرس صفحه گردونه (خالی = صفحه اصلی سایت با باز شدن خودکار پاپ‌آپ)', 'Wheel page URL (empty = home page, popup opens automatically)' ), dir: 'ltr', placeholder: BC.config.homeUrl + 'lucky-wheel/' },
					{ k: 'landing_open', type: 'switch', label: t( 'پاپ‌آپ گردونه در آن صفحه هم خودکار باز شود', 'Also open the popup automatically on that page' ), help: t( 'برای برگه‌ای که شورت‌کد داخل صفحه دارد خاموش بگذارید.', 'Keep off for a page that embeds the wheel with the shortcode.' ), show: function () { return !! String( a.landing_url || '' ).trim(); } },
				], a, function () { st.dirty(); drawLink(); } ),
				h( 'div', { class: 'bc-field__label', text: t( 'لینکی که ارسال می‌شود:', 'Link that will be sent:' ) } ),
				linkBox,
			] ),
			BC.card( { title: t( 'نمایش در صفحه', 'Embedding' ), icon: 'code' }, [
				h( 'div', { class: 'bc-kv' }, [ sc, '[becharkhoon_button id="' + st.id + '" text="' + t( 'بچرخون', 'Spin' ) + '"]', '[becharkhoon_spins id="' + st.id + '"]', '[becharkhoon_winners id="' + st.id + '" count="10"]', st.cfg.display.mode !== 'popup' ? null : null, '<a href="#bch-open-' + st.id + '">…</a>', BC.config.homeUrl + '?' + openParam() + '=' + st.id ].filter( Boolean ).map( function ( x ) {
					return h( 'div', { class: 'bc-copyline' }, h( 'code', { dir: 'ltr', text: x } ), BC.btn( BC.icon( 'copy', 14 ), function () { BC.copy( x ); }, 'sm ghost', { 'aria-label': t( 'کپی', 'Copy' ) } ) );
				} ) ),
				h( 'p', { class: 'bc-field__help', text: t( 'بلوک «گردونه بچرخون» در گوتنبرگ و ویجت المنتور هم موجود است.', 'A Gutenberg block and an Elementor widget are available too.' ) } ),
			] ),
			BC.card( { title: t( 'تست A/B و اولویت', 'A/B test & priority' ), icon: 'shuffle' }, F.render( [
				{ k: 'priority', type: 'number', label: t( 'اولویت (عدد کمتر = مهم‌تر)', 'Priority (lower = first)' ), cols: 'half', help: t( 'اگر چند گردونه در یک صفحه واجد شرایط باشند، فقط پاپ‌آپ اولویت بالاتر خودکار باز می‌شود.', 'When several wheels qualify on a page, only the top-priority popup auto-opens.' ) },
				{ k: 'ab_group', label: t( 'نام گروه A/B', 'A/B group name' ), dir: 'ltr', cols: 'half', help: t( 'گردونه‌های با نام گروه یکسان بین بازدیدکنندگان تقسیم می‌شوند و نتیجه را در گزارش‌ها مقایسه می‌کنید.', 'Wheels with the same group split traffic; compare them in Reports.' ) },
			], st.meta, st.dirty ), F.render( [
				{ k: 'ab_weight', type: 'range', label: t( 'سهم ترافیک در گروه', 'Traffic share in group' ), min: 1, max: 100, unit: '%', show: function () { return !! st.meta.ab_group; } },
			], a, st.dirty ) ),
			BC.card( { title: t( 'ردیابی و رفتار', 'Tracking & behaviour' ), icon: 'chart' }, F.render( [
				{ k: 'track_ga', type: 'switch', label: t( 'ارسال رویداد به Google Analytics / Tag Manager', 'Send events to Google Analytics / GTM' ), cols: 'half' },
				{ k: 'track_pixel', type: 'switch', label: t( 'ارسال رویداد به Meta Pixel', 'Send events to Meta Pixel' ), cols: 'half' },
				{ k: 'redirect_win', label: t( 'هدایت به آدرس بعد از برد (اختیاری)', 'Redirect after a win (optional)' ), dir: 'ltr' },
				{ k: 'shortcode_only', type: 'switch', label: t( 'فقط با شورت‌کد / لینک (پاپ‌آپ خودکار نه)', 'Shortcode / link only (no auto popup)' ) },
			], a, st.dirty ) ),
			BC.card( { title: t( 'زبان و یادداشت', 'Language & note' ), icon: 'globe' }, F.render( [
				{ k: 'lang', type: 'segment', label: t( 'زبان گردونه', 'Wheel language' ), opts: [ { value: 'auto', label: t( 'خودکار (زبان سایت)', 'Auto (site)' ) }, { value: 'fa', label: 'فارسی' }, { value: 'en', label: 'English' } ] },
				{ k: 'note', type: 'textarea', label: t( 'یادداشت داخلی', 'Internal note' ), rows: 2 },
			], st.cfg, st.dirty ) ),
		];
	}

	/* ------------------------------------------------------------------ editor shell */

	E.open = function ( view, id ) {
		BC.clear( view );
		view.appendChild( BC.spinner() );
		BC.api( 'wheels/' + id ).then( function ( r ) {
			E.render( view, r );
		} ).catch( function ( e ) {
			BC.clear( view );
			view.appendChild( BC.alert( 'error', e.message ) );
		} );
	};

	E.render = function ( view, r ) {
		var wh = r.wheel;
		var st = {
			id: wh.id,
			title: wh.title,
			status: wh.status,
			cfg: normCfg( clone( wh.config ) ),
			meta: { priority: wh.priority, ab_group: wh.ab_group },
			stock: r.stock,
			pools: r.pools,
			changed: false,
		};
		var saveBtn;
		var stateBadge = h( 'span', { class: 'bc-unsaved', hidden: true, text: t( 'تغییرات ذخیره نشده', 'Unsaved changes' ) } );
		var preview = new Preview( st );
		st.showView = function ( v ) { preview.setView( v ); };
		st.dirty = function () {
			st.changed = true;
			stateBadge.hidden = false;
			preview.render();
		};
		w.onbeforeunload = function () {
			return st.changed ? true : undefined;
		};
		var tabsDef = [
			{ key: 'slices', label: t( 'جوایز', 'Prizes' ), icon: 'gift', render: function () { return slicesTab( st ); } },
			{ key: 'access', label: t( 'چه کسی و چند بار', 'Who & how often' ), icon: 'users', render: function () { return accessTab( st ); } },
			{ key: 'design', label: t( 'ظاهر گردونه', 'Wheel design' ), icon: 'palette', render: function () { return designTab( st ); } },
			{ key: 'popup', label: t( 'پاپ‌آپ', 'Popup' ), icon: 'window', render: function () { return popupTab( st ); } },
			{ key: 'form', label: t( 'فرم', 'Form' ), icon: 'list', render: function () { return formTab( st ); } },
			{ key: 'display', label: t( 'نمایش و تریگر', 'Display & triggers' ), icon: 'eye', render: function () { return displayTab( st ); } },
			{ key: 'targeting', label: t( 'هدف‌گیری', 'Targeting' ), icon: 'target', render: function () { return targetingTab( st ); } },
			{ key: 'coupon', label: t( 'کوپن', 'Coupon' ), icon: 'ticket', render: function () { return couponTab( st ); } },
			{ key: 'messages', label: t( 'پیام‌ها', 'Messages' ), icon: 'message', render: function () { return messagesTab( st ); } },
			{ key: 'notify', label: t( 'اعلان‌ها', 'Notifications' ), icon: 'bell', render: function () { return notifyTab( st ); } },
			{ key: 'schedule', label: t( 'زمان‌بندی', 'Schedule' ), icon: 'calendar', render: function () { return scheduleTab( st ); } },
			{ key: 'advanced', label: t( 'پیشرفته', 'Advanced' ), icon: 'settings', render: function () { return advancedTab( st ); } },
		];
		var startTab = 0;
		try {
			startTab = Math.max( 0, tabsDef.map( function ( x ) { return x.key; } ).indexOf( w.sessionStorage.getItem( 'bch-editor-tab' ) ) );
		} catch ( e ) {}
		var tabs = BC.tabs( tabsDef, function ( i ) {
			try { w.sessionStorage.setItem( 'bch-editor-tab', tabsDef[ i ].key ); } catch ( e ) {}
			st.currentTab = i;
		}, startTab );
		st.reloadTab = function () { tabs.select( st.currentTab || 0 ); };
		st.openTab = function ( i, sliceIdx ) {
			if ( i < 0 ) {
				return;
			}
			st.openSlice = sliceIdx;
			tabs.select( i );
			var tb = tabs.querySelector( '.bc-tabs' );
			if ( tb && tb.getBoundingClientRect().top < 0 ) {
				tb.scrollIntoView( { behavior: 'smooth', block: 'start' } );
			}
			var ed = tabs.closest( '.bc-editor' );
			if ( ed && ed.classList.contains( 'is-studio' ) ) {
				ed.classList.remove( 'is-studio' );
			}
		};
		st.touch = function () {
			st.changed = true;
			stateBadge.hidden = false;
		};

		var title = h( 'input', { class: 'bc-input bc-title-input', value: st.title, 'aria-label': t( 'نام گردونه', 'Wheel name' ) } );
		title.addEventListener( 'input', function () { st.title = title.value; st.dirty(); } );
		var statusSel = BC.segment( [ { value: 'active', label: t( 'فعال', 'Active' ) }, { value: 'paused', label: t( 'متوقف', 'Paused' ) }, { value: 'draft', label: t( 'پیش‌نویس', 'Draft' ) } ], st.status, function ( v ) { st.status = v; st.dirty(); } );

		function save() {
			var cfg = clone( st.cfg );
			return BC.busy( saveBtn, BC.api( 'wheels/' + st.id, { method: 'PUT', body: { title: st.title, status: st.status, priority: st.meta.priority, ab_group: st.meta.ab_group, config: cfg } } ) ).then( function ( res ) {
				st.cfg = normCfg( clone( res.wheel.config ) );
				st.stock = res.stock;
				st.pools = res.pools;
				st.changed = false;
				stateBadge.hidden = true;
				BC.toast( t( 'ذخیره شد ✓', 'Saved ✓' ), 'success' );
				st.reloadTab();
				preview.render();
			} ).catch( BC.fail );
		}
		saveBtn = BC.btn( BC.il( 'save', t( 'ذخیره', 'Save' ), 16 ), save, 'primary' );
		var keyHandler = function ( e ) {
			if ( ( e.ctrlKey || e.metaKey ) && e.key === 's' && d.body.contains( saveBtn ) ) {
				e.preventDefault();
				save();
			}
		};
		d.addEventListener( 'keydown', keyHandler );

		BC.clear( view );
		view.appendChild( h( 'div', { class: 'bc-editor-head' },
			h( 'a', { href: '#/wheels', class: 'bc-btn bc-btn--ghost bc-btn--sm' }, BC.icon( BC.fa ? 'arrow-right' : 'arrow-left', 16 ), t( 'گردونه‌ها', 'Wheels' ) ),
			title, statusSel, stateBadge, h( 'span', { class: 'bc-spacer' } ),
			h( 'a', { class: 'bc-btn', href: BC.config.homeUrl + '?bch_preview=' + st.id, target: '_blank', rel: 'noopener' }, BC.icon( 'external', 16 ), t( 'پیش‌نمایش در سایت', 'Preview on site' ) ),
			saveBtn
		) );
		view.appendChild( h( 'div', { class: 'bc-editor' }, h( 'div', { class: 'bc-editor__main' }, tabs ), h( 'aside', { class: 'bc-editor__preview' }, preview.el ) ) );
		preview.draw();
	};
} )( window, document );
