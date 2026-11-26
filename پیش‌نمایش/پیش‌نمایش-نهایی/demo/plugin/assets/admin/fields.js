/**
 * ARIAGH.BECHARKHOON — declarative settings forms bound to a model by dotted paths,
 * pickers (media, products, categories, users), list editors and the condition builder.
 */
( function ( w, d ) {
	'use strict';
	var BC = w.BC;
	var h = BC.h;
	var t = BC.t;

	var F = ( BC.F = {} );

	F.get = function ( obj, path ) {
		return String( path ).split( '.' ).reduce( function ( o, k ) {
			return o === undefined || o === null ? undefined : o[ k ];
		}, obj );
	};
	F.set = function ( obj, path, val ) {
		var parts = String( path ).split( '.' );
		var o = obj;
		for ( var i = 0; i < parts.length - 1; i++ ) {
			if ( o[ parts[ i ] ] === undefined || o[ parts[ i ] ] === null ) {
				o[ parts[ i ] ] = {};
			}
			o = o[ parts[ i ] ];
		}
		o[ parts[ parts.length - 1 ] ] = val;
	};

	var uid = 0;

	/** Media library picker (falls back to a URL prompt). */
	F.media = function ( onPick, type ) {
		if ( w.wp && w.wp.media ) {
			var frame = w.wp.media( { title: t( 'انتخاب فایل', 'Choose file' ), library: { type: type || 'image' }, multiple: false } );
			frame.on( 'select', function () {
				var a = frame.state().get( 'selection' ).first().toJSON();
				onPick( a.url );
			} );
			frame.open();
		} else {
			var u = w.prompt( 'URL' );
			if ( u ) {
				onPick( u );
			}
		}
	};

	/** Async search picker for ids (products / categories / users / pages). */
	F.picker = function ( what, value, onChange, opts ) {
		opts = opts || {};
		var ids = ( Array.isArray( value ) ? value : String( value || '' ).split( ',' ) ).map( function ( x ) { return String( x ).trim(); } ).filter( Boolean );
		var labels = {};
		var box = h( 'div', { class: 'bc-picker' } );
		var chips = h( 'div', { class: 'bc-picker__chips' } );
		var input = h( 'input', { class: 'bc-input', type: 'search', placeholder: opts.placeholder || t( 'جستجو برای افزودن…', 'Search to add…' ) } );
		var list = h( 'div', { class: 'bc-picker__list', hidden: true } );
		function emit() {
			onChange( opts.single ? ( ids[ 0 ] || '' ) : ( opts.strings ? ids.slice() : ids.map( Number ) ) );
		}
		function draw() {
			BC.clear( chips );
			ids.forEach( function ( id ) {
				chips.appendChild( h( 'span', { class: 'bc-chip bc-chip--btn' }, h( 'span', { text: labels[ id ] || ( '#' + id ) } ), h( 'button', { type: 'button', class: 'bc-chip__x', 'aria-label': 'x', onClick: function () {
					ids = ids.filter( function ( x ) { return x !== id; } );
					draw();
					emit();
				} }, '×' ) ) );
			} );
		}
		if ( ids.length ) {
			BC.api( 'search/' + what, { query: { ids: ids.join( ',' ) } } ).then( function ( r ) {
				( r || [] ).forEach( function ( x ) { labels[ String( x.value ) ] = x.label; } );
				draw();
			} ).catch( function () {} );
		}
		var timer;
		input.addEventListener( 'input', function () {
			clearTimeout( timer );
			var q = input.value.trim();
			if ( q.length < 2 ) {
				list.hidden = true;
				return;
			}
			timer = setTimeout( function () {
				BC.api( 'search/' + what, { query: { q: q } } ).then( function ( r ) {
					BC.clear( list );
					( r || [] ).forEach( function ( x ) {
						list.appendChild( h( 'button', { type: 'button', class: 'bc-picker__opt', onClick: function () {
							var id = String( x.value );
							labels[ id ] = x.label;
							if ( opts.single ) {
								ids = [ id ];
							} else if ( ids.indexOf( id ) === -1 ) {
								ids.push( id );
							}
							input.value = '';
							list.hidden = true;
							draw();
							emit();
						} }, x.label ) );
					} );
					if ( ! ( r || [] ).length ) {
						list.appendChild( h( 'div', { class: 'bc-muted bc-picker__none', text: t( 'چیزی پیدا نشد', 'No results' ) } ) );
					}
					list.hidden = false;
				} ).catch( BC.fail );
			}, 300 );
		} );
		input.addEventListener( 'blur', function () { setTimeout( function () { list.hidden = true; }, 200 ); } );
		draw();
		box.appendChild( chips );
		box.appendChild( h( 'div', { class: 'bc-picker__search' }, input, list ) );
		return box;
	};

	/** Multi-select chips from fixed options. */
	F.chips = function ( options, value, onChange ) {
		var cur = ( Array.isArray( value ) ? value : String( value || '' ).split( ',' ).filter( Boolean ) ).map( String );
		var box = h( 'div', { class: 'bc-choicechips' } );
		options.forEach( function ( o ) {
			var on = cur.indexOf( String( o.value ) ) > -1;
			var b = h( 'button', { type: 'button', class: 'bc-cchip' + ( on ? ' is-on' : '' ), onClick: function () {
				var i = cur.indexOf( String( o.value ) );
				if ( i > -1 ) {
					cur.splice( i, 1 );
				} else {
					cur.push( String( o.value ) );
				}
				b.classList.toggle( 'is-on' );
				onChange( cur.slice() );
			} }, o.label );
			box.appendChild( b );
		} );
		return box;
	};

	var EMOJIS = [ '🎁', '🎉', '💰', '🪙', '💎', '🚚', '🔥', '⭐', '❤️', '🍀', '😅', '🔁', '🎟️', '🛍️', '☕', '🍕', '🎂', '👑', '🏆', '📦', '🎮', '📱', '🌸', '🍉', '🎄', '🎃', '🌙', '☀️', '❄️', '💯', '%' ];

	/** WooCommerce currency (the shop's own unit, e.g. تومان). */
	F.cur = function () {
		return ( BC.boot && BC.boot.currency ) || ( BC.fa ? 'تومان' : '' );
	};
	/** Unit for a prize value by type: % / currency / count. */
	F.valueUnit = function ( type ) {
		if ( type === 'coupon_percent' ) {
			return '٪';
		}
		if ( [ 'coupon_fixed_cart', 'coupon_fixed_product', 'wallet' ].indexOf( type ) > -1 ) {
			return F.cur();
		}
		if ( type === 'points' ) {
			return t( 'امتیاز', 'points' );
		}
		if ( type === 'extra_spin' ) {
			return t( 'شانس', 'spins' );
		}
		return '';
	};

	/** One field row. Returns { el, refresh }. */
	F.field = function ( def, model, onChange ) {
		var id = 'bcf' + ( ++uid );
		var val = def.k ? F.get( model, def.k ) : undefined;
		var set = function ( v ) {
			if ( def.k ) {
				F.set( model, def.k, v );
			}
			if ( def.onSet ) {
				def.onSet( v, model );
			}
			onChange( def.k, v );
		};
		var ctrl;
		var unitRefresh = null;
		switch ( def.type ) {
			case 'heading':
				return { el: h( 'h4', { class: 'bc-form-heading' }, def.icon ? BC.icon( def.icon, 16 ) : null, h( 'span', { text: def.label } ) ), def: def };
			case 'note':
				return { el: h( 'div', { class: 'bc-form-note' }, BC.icon( 'info', 16 ), h( 'span', { html: def.html || '', text: def.html ? null : def.label } ) ), def: def };
			case 'custom':
				return { el: def.render( model, onChange ), def: def };
			case 'switch':
				var cb = h( 'input', { type: 'checkbox', id: id, checked: !! val, onChange: function () { set( cb.checked ); } } );
				return { el: h( 'div', { class: 'bc-field bc-field--toggle' + ( def.cols ? ' bc-col-' + def.cols : '' ) },
					h( 'div', { class: 'bc-field__text' }, h( 'label', { class: 'bc-field__label', for: id, text: def.label } ), def.help ? h( 'div', { class: 'bc-field__help', html: def.help } ) : null ),
					h( 'div', { class: 'bc-field__control' }, h( 'label', { class: 'bc-switch' }, cb, h( 'span' ) ) )
				), def: def };
			case 'textarea':
			case 'html':
			case 'list':
				ctrl = h( 'textarea', { class: 'bc-input' + ( def.mono ? ' bc-mono-input' : '' ), id: id, rows: def.rows || ( def.type === 'html' ? 4 : 3 ), dir: def.dir || null, placeholder: def.placeholder || '' } );
				ctrl.value = def.type === 'list' ? ( Array.isArray( val ) ? val.join( '\n' ) : '' ) : ( val === undefined || val === null ? '' : val );
				ctrl.addEventListener( 'input', function () {
					set( def.type === 'list' ? ctrl.value.split( /\r?\n/ ).map( function ( x ) { return x.trim(); } ).filter( Boolean ) : ctrl.value );
				} );
				break;
			case 'number':
				var numIn = h( 'input', { class: 'bc-input', type: 'number', id: id, min: def.min, max: def.max, step: def.step || 'any', dir: 'ltr', value: val === undefined || val === null ? '' : val } );
				ctrl = numIn;
				// Read the <input> itself (ctrl may be re-wrapped with a unit box below).
				numIn.addEventListener( 'input', function () { set( numIn.value === '' ? ( def.allowEmpty ? '' : 0 ) : Number( numIn.value ) ); } );
				if ( def.unit ) {
					var uEl = h( 'span', { class: 'bc-input-unit__u' } );
					var uFn = function () { var u = typeof def.unit === 'function' ? def.unit( model ) : def.unit; uEl.textContent = u || ''; uEl.hidden = ! u; };
					uFn();
					ctrl = h( 'div', { class: 'bc-input-unit' }, ctrl, uEl );
					unitRefresh = uFn;
				}
				break;
			case 'range':
				if ( val === undefined || val === null || val === '' ) {
					val = def.dflt !== undefined ? def.dflt : def.min;
				}
				var out = h( 'output', { class: 'bc-range__val', text: BC.digits( val ) + ( def.unit || '' ) } );
				var rg = h( 'input', { type: 'range', class: 'bc-range', id: id, min: def.min, max: def.max, step: def.step || 1, value: val } );
				rg.addEventListener( 'input', function () {
					out.textContent = BC.digits( rg.value ) + ( def.unit || '' );
					set( Number( rg.value ) );
				} );
				ctrl = h( 'div', { class: 'bc-range-wrap' }, rg, out );
				break;
			case 'color':
				var swatch = h( 'input', { type: 'color', class: 'bc-color__picker', value: /^#[0-9a-f]{6}$/i.test( val || '' ) ? val : '#1d4ed8' } );
				var txt = h( 'input', { type: 'text', class: 'bc-input bc-color__text', dir: 'ltr', value: val || '', placeholder: def.placeholder || 'auto' } );
				var dot = h( 'span', { class: 'bc-color__dot', style: { background: val || 'transparent' } } );
				swatch.addEventListener( 'input', function () {
					txt.value = swatch.value;
					dot.style.background = swatch.value;
					set( swatch.value );
				} );
				txt.addEventListener( 'change', function () {
					dot.style.background = txt.value;
					if ( /^#[0-9a-f]{6}$/i.test( txt.value ) ) {
						swatch.value = txt.value;
					}
					set( txt.value.trim() );
				} );
				ctrl = h( 'div', { class: 'bc-color' }, h( 'label', { class: 'bc-color__swatch' }, dot, swatch ), txt );
				break;
			case 'select':
				ctrl = h( 'select', { class: 'bc-input bc-select', id: id } );
				( typeof def.opts === 'function' ? def.opts( model ) : def.opts ).forEach( function ( o ) {
					ctrl.appendChild( h( 'option', { value: o.value, text: o.label } ) );
				} );
				ctrl.value = val === undefined || val === null ? '' : String( val );
				ctrl.addEventListener( 'change', function () {
					var v = ctrl.value;
					set( def.numeric ? Number( v ) : v );
				} );
				break;
			case 'segment':
				ctrl = BC.segment( def.opts, val, set );
				break;
			case 'chips':
				ctrl = F.chips( typeof def.opts === 'function' ? def.opts( model ) : def.opts, val, function ( v ) {
					set( def.numeric ? v.map( Number ) : v );
				} );
				break;
			case 'image':
				var url = h( 'input', { type: 'url', class: 'bc-input', dir: 'ltr', value: val || '', placeholder: 'https://…' } );
				var prev = h( 'img', { class: 'bc-imgprev', src: val || '', alt: '', hidden: ! val } );
				url.addEventListener( 'change', function () {
					prev.src = url.value;
					prev.hidden = ! url.value;
					set( url.value.trim() );
				} );
				ctrl = h( 'div', { class: 'bc-imgfield' }, prev, url, BC.btn( BC.il( 'image', t( 'انتخاب', 'Choose' ), 15 ), function () {
					F.media( function ( u ) {
						url.value = u;
						prev.src = u;
						prev.hidden = false;
						set( u );
					}, def.media );
				}, 'sm' ), val ? BC.btn( BC.icon( 'x', 14 ), function () {
					url.value = '';
					prev.hidden = true;
					set( '' );
				}, 'sm ghost', { 'aria-label': t( 'حذف', 'Remove' ) } ) : null );
				break;
			case 'emoji':
				var em = h( 'input', { type: 'text', class: 'bc-input bc-emoji-input', value: val || '', maxlength: 8 } );
				em.addEventListener( 'input', function () { set( em.value ); } );
				var pal = h( 'div', { class: 'bc-emojis' }, EMOJIS.map( function ( e ) {
					return h( 'button', { type: 'button', onClick: function () { em.value = e; set( e ); } }, e );
				} ) );
				ctrl = h( 'div', { class: 'bc-emoji' }, em, pal );
				break;
			case 'products':
			case 'categories':
			case 'users':
			case 'pages':
				ctrl = F.picker( def.type, val, set, { single: def.single } );
				break;
			case 'datetime':
				ctrl = h( 'input', { type: 'datetime-local', class: 'bc-input', dir: 'ltr', value: ( val || '' ).replace( ' ', 'T' ).slice( 0, 16 ) } );
				ctrl.addEventListener( 'change', function () { set( ctrl.value.replace( 'T', ' ' ) ); } );
				break;
			case 'secret':
				ctrl = h( 'input', { type: 'password', class: 'bc-input', id: id, dir: 'ltr', autocomplete: 'new-password', value: val || '', placeholder: def.placeholder || '' } );
				ctrl.addEventListener( 'input', function () { set( ctrl.value ); } );
				break;
			default:
				ctrl = h( 'input', { type: def.inputType || 'text', class: 'bc-input', id: id, dir: def.dir || null, maxlength: def.max || null, value: val === undefined || val === null ? '' : val, placeholder: def.placeholder || '' } );
				ctrl.addEventListener( 'input', function () { set( ctrl.value ); } );
		}
		var el = h( 'div', { class: 'bc-field' + ( def.cols ? ' bc-col-' + def.cols : '' ) },
			def.label ? h( 'label', { class: 'bc-field__label', for: id }, def.label, def.badge ? h( 'span', { class: 'bc-badge bc-badge--brand', text: def.badge } ) : null ) : null,
			ctrl,
			def.help ? h( 'div', { class: 'bc-field__help', html: def.help } ) : null
		);
		return { el: el, def: def, unit: unitRefresh };
	};

	/**
	 * Render a list of field definitions; conditional fields (def.show) update live.
	 */
	F.render = function ( defs, model, onChange ) {
		var wrap = h( 'div', { class: 'bc-fgrid' } );
		var rows = [];
		var refresh = function () {
			rows.forEach( function ( r ) {
				if ( r.def.show ) {
					r.el.hidden = ! r.def.show( model );
				}
				if ( r.unit ) {
					r.unit();
				}
			} );
		};
		defs.forEach( function ( def ) {
			if ( ! def ) {
				return;
			}
			var r = F.field( def, model, function ( k, v ) {
				refresh();
				onChange( k, v );
			} );
			rows.push( r );
			wrap.appendChild( r.el );
		} );
		refresh();
		wrap.refresh = refresh;
		return wrap;
	};

	/* ------------------------------------------------------------------ Conditions */

	F.condLabels = function () {
		return {
			logged_in: t( 'کاربر وارد شده باشد', 'Logged in' ),
			user_role: t( 'نقش کاربری', 'User role' ),
			user_id: t( 'کاربر خاص', 'Specific users' ),
			registered_days: t( 'روزهای گذشته از ثبت‌نام', 'Days since registration' ),
			order_count: t( 'تعداد سفارش‌های پرداخت‌شده', 'Paid orders count' ),
			total_spent: t( 'مجموع خرید', 'Total spent' ),
			avg_order: t( 'میانگین مبلغ سفارش', 'Average order value' ),
			last_order_days: t( 'روز از آخرین سفارش', 'Days since last order' ),
			bought_product: t( 'قبلاً این محصول را خریده', 'Has bought product' ),
			bought_category: t( 'قبلاً از این دسته خریده', 'Has bought from category' ),
			phone_verified: t( 'موبایل تاییدشده دارد', 'Verified mobile' ),
			has_phone: t( 'شماره موبایل دارد', 'Has a mobile number' ),
			user_meta: t( 'فیلد متای کاربر', 'User meta field' ),
			wheel_spins: t( 'تعداد چرخش‌های قبلی در این گردونه', 'Previous spins on this wheel' ),
			wheel_wins: t( 'تعداد بردهای قبلی در این گردونه', 'Previous wins on this wheel' ),
			cart_total: t( 'مبلغ سبد خرید', 'Cart total' ),
			cart_subtotal: t( 'جمع جزء سبد', 'Cart subtotal' ),
			cart_items: t( 'تعداد اقلام سبد', 'Cart items' ),
			cart_product: t( 'محصول در سبد', 'Product in cart' ),
			cart_category: t( 'دسته در سبد', 'Category in cart' ),
			cart_has_coupon: t( 'سبد کد تخفیف دارد', 'Cart has a coupon' ),
			order_total: t( 'مبلغ سفارش', 'Order total' ),
			order_subtotal: t( 'جمع جزء سفارش', 'Order subtotal' ),
			order_items: t( 'تعداد اقلام سفارش', 'Order items' ),
			order_number: t( 'شماره سفارش مشتری (۱ = اولین سفارش)', 'Customer order # (1 = first)' ),
			order_product: t( 'محصول در سفارش', 'Product in order' ),
			order_category: t( 'دسته در سفارش', 'Category in order' ),
			payment_method: t( 'روش پرداخت', 'Payment method' ),
			shipping_method: t( 'روش ارسال', 'Shipping method' ),
			order_coupon: t( 'کد تخفیف سفارش', 'Order coupon' ),
			billing_city: t( 'شهر خریدار', 'Billing city' ),
			billing_state: t( 'استان خریدار', 'Billing state' ),
			created_via: t( 'منبع ثبت سفارش', 'Order created via' ),
			device: t( 'دستگاه', 'Device' ),
			page_type: t( 'نوع صفحه', 'Page type' ),
			url: t( 'آدرس صفحه', 'Page URL' ),
			referrer: t( 'سایت ارجاع‌دهنده', 'Referrer' ),
			utm_source: 'utm_source',
			utm_medium: 'utm_medium',
			utm_campaign: 'utm_campaign',
			query_param: t( 'پارامتر آدرس', 'URL parameter' ),
			cookie: t( 'کوکی', 'Cookie' ),
			visit_count: t( 'تعداد بازدید', 'Visit count' ),
			new_visitor: t( 'بازدیدکننده جدید', 'New visitor' ),
			country: t( 'کشور (CDN)', 'Country (CDN)' ),
			language: t( 'زبان', 'Language' ),
			browser: t( 'مرورگر', 'Browser' ),
			os: t( 'سیستم‌عامل', 'Operating system' ),
			weekday: t( 'روز هفته', 'Weekday' ),
			hour: t( 'ساعت روز', 'Hour of day' ),
			date: t( 'تاریخ (میلادی)', 'Date' ),
		};
	};
	F.opLabels = function () {
		return {
			gte: '≥', gt: '>', lte: '≤', lt: '<', eq: '=', neq: '≠', between: t( 'بین', 'between' ),
			in: t( 'یکی از', 'is any of' ), not_in: t( 'هیچ‌کدام از', 'is none of' ),
			is_true: t( 'بله', 'yes' ), is_false: t( 'خیر', 'no' ),
			contains: t( 'شامل', 'contains' ), not_contains: t( 'شامل نباشد', 'does not contain' ), starts: t( 'شروع با', 'starts with' ), ends: t( 'پایان با', 'ends with' ), empty: t( 'خالی', 'is empty' ), not_empty: t( 'خالی نباشد', 'is not empty' ),
		};
	};
	F.groupLabels = function () {
		return { user: t( 'کاربر و سابقه خرید', 'Customer & history' ), cart: t( 'سبد خرید', 'Cart' ), order: t( 'سفارش', 'Order' ), visitor: t( 'بازدیدکننده و صفحه', 'Visitor & page' ), time: t( 'زمان', 'Time' ) };
	};
	function valueOptions( input ) {
		var b = BC.boot || {};
		switch ( input ) {
			case 'roles':
				return b.roles || [];
			case 'devices':
				return [ { value: 'desktop', label: t( 'دسکتاپ', 'Desktop' ) }, { value: 'tablet', label: t( 'تبلت', 'Tablet' ) }, { value: 'mobile', label: t( 'موبایل', 'Mobile' ) } ];
			case 'weekdays':
				return [ 6, 0, 1, 2, 3, 4, 5 ].map( function ( i ) { return { value: String( i ), label: F.weekdays()[ i ] }; } );
			case 'page_types':
				return F.pageTypes().map( function ( p ) { return { value: p[ 0 ], label: p[ 1 ] }; } );
			case 'payment':
				return b.payments || [];
			case 'shipping':
				return b.shipping || [];
			case 'browsers':
				return [ 'chrome', 'safari', 'firefox', 'edge', 'other' ].map( function ( x ) { return { value: x, label: x }; } );
			case 'os':
				return [ 'android', 'ios', 'windows', 'mac', 'linux', 'other' ].map( function ( x ) { return { value: x, label: x }; } );
		}
		return null;
	}
	F.weekdays = function () {
		return BC.fa ? [ 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه' ] : [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
	};
	F.pageTypes = function () {
		return [ [ 'front', t( 'صفحه اصلی', 'Front page' ) ], [ 'shop', t( 'فروشگاه', 'Shop' ) ], [ 'product', t( 'محصول', 'Product' ) ], [ 'product_cat', t( 'دسته محصول', 'Product category' ) ], [ 'cart', t( 'سبد خرید', 'Cart' ) ], [ 'checkout', t( 'تسویه حساب', 'Checkout' ) ], [ 'thankyou', t( 'تشکر از خرید', 'Thank-you' ) ], [ 'account', t( 'حساب کاربری', 'My account' ) ], [ 'blog', t( 'وبلاگ', 'Blog' ) ], [ 'post', t( 'نوشته', 'Post' ) ], [ 'page', t( 'برگه', 'Page' ) ], [ 'category', t( 'دسته نوشته', 'Category' ) ], [ 'search', t( 'جستجو', 'Search' ) ], [ '404', '404' ], [ 'archive', t( 'آرشیو', 'Archive' ) ] ];
	};

	/**
	 * Condition set editor. scope: 'any' (no order conditions) | 'order' (earning rules).
	 */
	F.conditions = function ( set, scope, onChange, opts ) {
		opts = opts || {};
		set.groups = set.groups || [];
		var cat = ( BC.boot && BC.boot.conditions ) || {};
		var L = F.condLabels();
		var O = F.opLabels();
		var G = F.groupLabels();
		var box = h( 'div', { class: 'bc-cond' } );
		function changed() {
			onChange( set );
		}
		function typeSelect( c, rerender ) {
			var sel = h( 'select', { class: 'bc-input bc-select' } );
			var groups = {};
			Object.keys( cat ).forEach( function ( k ) {
				var x = cat[ k ];
				if ( x.ctx === 'order' && scope !== 'order' ) {
					return;
				}
				( groups[ x.group ] = groups[ x.group ] || [] ).push( k );
			} );
			Object.keys( groups ).forEach( function ( g ) {
				var og = h( 'optgroup', { label: G[ g ] || g } );
				groups[ g ].forEach( function ( k ) { og.appendChild( h( 'option', { value: k, text: L[ k ] || k } ) ); } );
				sel.appendChild( og );
			} );
			sel.value = c.type;
			sel.addEventListener( 'change', function () {
				c.type = sel.value;
				c.op = cat[ c.type ].ops[ 0 ];
				c.value = '';
				c.value2 = '';
				changed();
				rerender();
			} );
			return sel;
		}
		function valueCtrl( c ) {
			var meta = cat[ c.type ] || { input: 'text' };
			var opts2 = valueOptions( meta.input );
			if ( meta.input === 'bool' || c.op === 'empty' || c.op === 'not_empty' ) {
				return null;
			}
			if ( opts2 ) {
				return F.chips( opts2, c.value, function ( v ) { c.value = v; changed(); } );
			}
			if ( meta.input === 'products' || meta.input === 'cats' || meta.input === 'users' ) {
				return F.picker( { products: 'products', cats: 'categories', users: 'users' }[ meta.input ], c.value, function ( v ) { c.value = v.map( String ); changed(); } );
			}
			var type = meta.input === 'date' ? 'date' : ( meta.input === 'number' || meta.input === 'money' ? 'number' : 'text' );
			var parts = [];
			if ( meta.input === 'kv' ) {
				var key = h( 'input', { class: 'bc-input', dir: 'ltr', placeholder: t( 'نام', 'name' ), value: c.key || '' } );
				key.addEventListener( 'input', function () { c.key = key.value; changed(); } );
				parts.push( key );
			}
			var v1 = h( 'input', { class: 'bc-input', type: type, dir: type === 'text' ? 'auto' : 'ltr', value: Array.isArray( c.value ) ? c.value.join( ',' ) : ( c.value || '' ), placeholder: meta.input === 'money' ? ( ( BC.boot && BC.boot.currency ) || '' ) : '' } );
			v1.addEventListener( 'input', function () { c.value = v1.value; changed(); } );
			parts.push( v1 );
			if ( c.op === 'between' ) {
				var v2 = h( 'input', { class: 'bc-input', type: type, dir: 'ltr', value: c.value2 || '' } );
				v2.addEventListener( 'input', function () { c.value2 = v2.value; changed(); } );
				parts.push( h( 'span', { class: 'bc-muted', text: t( 'تا', 'and' ) } ), v2 );
			}
			if ( meta.input === 'money' ) {
				var hint = h( 'small', { class: 'bc-muted bc-cond__hint' } );
				var upd = function () { hint.textContent = v1.value ? BC.money( v1.value ) : ''; };
				v1.addEventListener( 'input', upd );
				upd();
				parts.push( hint );
			}
			return h( 'div', { class: 'bc-cond__val' }, parts );
		}
		function render() {
			BC.clear( box );
			var en = h( 'input', { type: 'checkbox', checked: !! set.enabled } );
			en.addEventListener( 'change', function () { set.enabled = en.checked; changed(); render(); } );
			box.appendChild( h( 'label', { class: 'bc-cond__toggle' }, h( 'span', { class: 'bc-switch' }, en, h( 'span' ) ), h( 'b', { text: opts.title || t( 'فعال‌سازی شرط‌ها', 'Enable conditions' ) } ) ) );
			if ( ! set.enabled ) {
				if ( opts.off ) {
					box.appendChild( h( 'p', { class: 'bc-muted', text: opts.off } ) );
				}
				return;
			}
			box.appendChild( h( 'p', { class: 'bc-field__help', text: t( 'شرط‌های داخل یک گروه همه باید برقرار باشند (و). گروه‌ها با «یا» جدا می‌شوند.', 'All conditions in a group must match (AND). Groups are joined with OR.' ) } ) );
			set.groups.forEach( function ( group, gi ) {
				if ( gi > 0 ) {
					box.appendChild( h( 'div', { class: 'bc-cond__or', text: t( 'یا', 'OR' ) } ) );
				}
				var g = h( 'div', { class: 'bc-cond__group' } );
				group.forEach( function ( c, ci ) {
					var meta = cat[ c.type ] || { ops: [ 'eq' ] };
					var op = h( 'select', { class: 'bc-input bc-select bc-cond__op' }, meta.ops.map( function ( o ) { return h( 'option', { value: o, text: O[ o ] || o } ); } ) );
					op.value = c.op;
					op.addEventListener( 'change', function () { c.op = op.value; changed(); render(); } );
					g.appendChild( h( 'div', { class: 'bc-cond__row' },
						ci > 0 ? h( 'span', { class: 'bc-cond__and', text: t( 'و', 'AND' ) } ) : null,
						typeSelect( c, render ), op, valueCtrl( c ),
						h( 'button', { type: 'button', class: 'bc-icon-btn', 'aria-label': t( 'حذف', 'Remove' ), onClick: function () {
							group.splice( ci, 1 );
							if ( ! group.length ) {
								set.groups.splice( gi, 1 );
							}
							changed();
							render();
						} }, BC.icon( 'trash', 15 ) )
					) );
				} );
				g.appendChild( BC.btn( BC.il( 'plus', t( 'شرط «و»', 'AND condition' ), 14 ), function () {
					group.push( { type: 'order_count', op: 'gte', value: '1', value2: '', key: '' } );
					changed();
					render();
				}, 'sm ghost' ) );
				box.appendChild( g );
			} );
			box.appendChild( h( 'div', { class: 'bc-cond__add' }, BC.btn( BC.il( 'plus', set.groups.length ? t( 'گروه «یا»', 'OR group' ) : t( 'افزودن شرط', 'Add condition' ), 14 ), function () {
				set.groups.push( [ { type: scope === 'order' ? 'order_total' : 'logged_in', op: scope === 'order' ? 'gte' : 'is_true', value: '', value2: '', key: '' } ] );
				changed();
				render();
			}, 'sm' ) ) );
			if ( opts.presets ) {
				box.appendChild( h( 'div', { class: 'bc-cond__presets' }, h( 'span', { class: 'bc-muted', text: t( 'الگوهای آماده:', 'Quick presets:' ) } ), opts.presets.map( function ( p ) {
					return h( 'button', { type: 'button', class: 'bc-chip bc-chip--btn', onClick: function () {
						set.groups.push( JSON.parse( JSON.stringify( p.group ) ) );
						changed();
						render();
					} }, p.label );
				} ) ) );
			}
		}
		render();
		return box;
	};

	/** Common presets for "who can spin". */
	F.audiencePresets = function () {
		return [
			{ label: t( 'فقط کسانی که هنوز خرید نکرده‌اند', 'Never purchased' ), group: [ { type: 'order_count', op: 'eq', value: '0', value2: '', key: '' } ] },
			{ label: t( 'مشتریان با حداقل یک خرید', 'At least one order' ), group: [ { type: 'order_count', op: 'gte', value: '1', value2: '', key: '' } ] },
			{ label: t( 'مجموع خرید بالای ۲ میلیون', 'Spent over 2,000,000' ), group: [ { type: 'total_spent', op: 'gte', value: '2000000', value2: '', key: '' } ] },
			{ label: t( 'سبد خرید بالای ۵۰۰ هزار', 'Cart over 500,000' ), group: [ { type: 'cart_total', op: 'gte', value: '500000', value2: '', key: '' } ] },
			{ label: t( 'فقط کاربران عضو', 'Members only' ), group: [ { type: 'logged_in', op: 'is_true', value: '', value2: '', key: '' } ] },
			{ label: t( 'مشتریان غیرفعال ۶۰ روزه', 'Inactive for 60 days' ), group: [ { type: 'last_order_days', op: 'gte', value: '60', value2: '', key: '' } ] },
			{ label: t( 'فقط موبایل', 'Mobile only' ), group: [ { type: 'device', op: 'in', value: [ 'mobile' ], value2: '', key: '' } ] },
		];
	};
	F.orderPresets = function () {
		return [
			{ label: t( 'اولین سفارش', 'First order' ), group: [ { type: 'order_number', op: 'eq', value: '1', value2: '', key: '' } ] },
			{ label: t( 'سفارش بالای ۲ میلیون', 'Order ≥ 2,000,000' ), group: [ { type: 'order_total', op: 'gte', value: '2000000', value2: '', key: '' } ] },
			{ label: t( 'حداقل ۳ قلم کالا', 'At least 3 items' ), group: [ { type: 'order_items', op: 'gte', value: '3', value2: '', key: '' } ] },
		];
	};
} )( window, document );
