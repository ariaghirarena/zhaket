/**
 * ARIAGH.BECHARKHOON — admin SPA shell: top bar, sidebar, hash router, bootstrap data.
 * Visual language shared with ARIAGH.SEOLITY. Routes: #/slug?query.
 */
( function ( w, d ) {
	'use strict';
	var BC = w.BC;
	var C = BC.config || {};
	var h = BC.h;
	var t = BC.t;
	var root;
	var nav;
	var view;
	var current = null;
	var lastHash = '';

	var ICONS = {
		dashboard: 'dashboard',
		wheels: 'wheel',
		edit: 'wheel',
		rules: 'list-checks',
		spins: 'gift',
		leads: 'users',
		credits: 'ticket',
		campaigns: 'send',
		reports: 'chart',
		sms: 'message',
		settings: 'settings',
		tools: 'wrench',
		guide: 'book',
	};
	var LABELS = {
		dashboard: t( 'داشبورد', 'Dashboard' ),
		wheels: t( 'گردونه‌ها', 'Wheels' ),
		rules: t( 'قوانین شانس', 'Spin rules' ),
		spins: t( 'چرخش‌ها و برندگان', 'Spins & winners' ),
		leads: t( 'مخاطبان', 'Leads' ),
		credits: t( 'شانس‌های کاربران', 'User spins' ),
		campaigns: t( 'ارسال‌های گروهی', 'Bulk sends' ),
		reports: t( 'گزارش‌ها', 'Reports' ),
		sms: t( 'پیامک و اعلان', 'SMS & alerts' ),
		settings: t( 'تنظیمات', 'Settings' ),
		tools: t( 'ابزارها', 'Tools' ),
		guide: t( 'راهنما', 'Guide' ),
	};
	var GROUPS = [
		[ null, [ 'dashboard', 'wheels', 'rules' ] ],
		[ t( 'نتایج', 'Results' ), [ 'spins', 'leads', 'credits', 'campaigns', 'reports' ] ],
		[ t( 'پیکربندی', 'Setup' ), [ 'sms', 'settings', 'tools', 'guide' ] ],
	];

	BC.query = function () {
		var q = {};
		var s = location.hash.split( '?' )[ 1 ] || '';
		s.split( '&' ).forEach( function ( p ) {
			if ( ! p ) {
				return;
			}
			var kv = p.split( '=' );
			try {
				q[ decodeURIComponent( kv[ 0 ] ) ] = decodeURIComponent( ( kv[ 1 ] || '' ).replace( /\+/g, ' ' ) );
			} catch ( e ) {
				q[ kv[ 0 ] ] = kv[ 1 ] || '';
			}
		} );
		return q;
	};
	BC.go = function ( hash ) {
		if ( location.hash === hash ) {
			route();
		} else {
			location.hash = hash;
		}
	};

	function allowed() {
		var list = C.routes || Object.keys( LABELS );
		var map = {};
		list.forEach( function ( s ) {
			map[ s ] = true;
		} );
		if ( map.wheels ) {
			map.edit = true;
		}
		return map;
	}

	function brandMark() {
		var brand = C.brand || '';
		var custom = brand && [ 'بچرخون', 'becharkhoon' ].indexOf( brand.toLowerCase() ) === -1;
		return h( 'a', { href: '#/dashboard', class: 'bc-brand', 'aria-label': 'ARIAGH.BECHARKHOON' },
			h( 'img', { src: ( C.pluginUrl || '' ) + 'assets/img/mark.svg', alt: '', class: 'bc-brand__logo' } ),
			h( 'span', { class: 'bc-brand__text' },
				custom ? h( 'span', { class: 'bc-wordmark', text: brand } ) : h( 'span', { class: 'bc-wordmark', dir: 'ltr' }, 'ARIAGH.', h( 'b', { text: 'BECHARKHOON' } ) ),
				h( 'small', { text: t( 'افزونه بچرخون — گردونه شانس هوشمند', 'Smart lucky wheel for WordPress' ) + ' | ' + t( 'نسخه %s', 'version %s', BC.digits( C.version || '' ) ) } )
			)
		);
	}

	function shell() {
		root = d.getElementById( 'bch-app' );
		if ( ! root ) {
			return false;
		}
		BC.clear( root );
		root.classList.add( 'bc-root' );
		root.setAttribute( 'dir', BC.fa ? 'rtl' : 'ltr' );
		root.setAttribute( 'lang', BC.fa ? 'fa' : 'en' );
		root.classList.toggle( 'is-rtl', BC.fa );
		BC.applyTheme( root );

		var ok = allowed();
		nav = h( 'nav', { class: 'bc-nav', 'aria-label': t( 'منوی بچرخون', 'Becharkhoon navigation' ) } );
		GROUPS.forEach( function ( g ) {
			var kids = g[ 1 ].filter( function ( s ) {
				return ok[ s ];
			} );
			if ( ! kids.length ) {
				return;
			}
			if ( g[ 0 ] ) {
				nav.appendChild( h( 'div', { class: 'bc-nav__group', text: g[ 0 ] } ) );
			}
			kids.forEach( function ( s ) {
				nav.appendChild( h( 'a', { href: '#/' + s, class: 'bc-nav__item', 'data-route': s },
					BC.icon( ICONS[ s ], 18, 'bc-nav__icon' ),
					h( 'span', { class: 'bc-nav__label', text: LABELS[ s ] } ),
					h( 'em', { class: 'bc-nav__count', 'data-count': s } )
				) );
			} );
		} );

		var themeBtn = h( 'button', { class: 'bc-icon-btn', type: 'button', title: t( 'حالت تیره/روشن', 'Toggle dark mode' ), 'aria-label': t( 'حالت تیره/روشن', 'Toggle dark mode' ), onClick: function () {
			var next = root.getAttribute( 'data-theme' ) === 'dark' ? 'light' : 'dark';
			try {
				w.localStorage.setItem( 'bch-admin-theme', next );
			} catch ( e ) {}
			BC.applyTheme( root );
		} }, BC.icon( 'moon', 17 ) );

		var cta = C.canManage === false ? null : h( 'a', { href: '#/wheels?new=1', class: 'bc-btn bc-btn--primary bc-top__cta' }, BC.icon( 'plus', 17 ), h( 'span', { text: t( 'گردونه جدید', 'New wheel' ) } ) );
		var top = h( 'header', { class: 'bc-top' },
			h( 'button', { class: 'bc-icon-btn bc-menu-btn', type: 'button', 'aria-label': t( 'منو', 'Menu' ), onClick: function () {
				root.classList.toggle( 'nav-open' );
			} }, BC.icon( 'menu', 18 ) ),
			brandMark(),
			h( 'div', { class: 'bc-top__status', id: 'bc-top-status' } ),
			h( 'div', { class: 'bc-top__actions' }, themeBtn, cta )
		);
		view = h( 'main', { class: 'bc-view', id: 'bc-view', tabindex: '-1' } );
		root.appendChild( top );
		root.appendChild( h( 'div', { class: 'bc-layout' },
			h( 'aside', { class: 'bc-side' }, nav, h( 'div', { class: 'bc-side__foot', dir: 'ltr', text: 'ARIAGH.BECHARKHOON ' + ( C.version || '' ) } ) ),
			view
		) );
		root.addEventListener( 'click', function ( e ) {
			if ( root.classList.contains( 'nav-open' ) && ! e.target.closest( '.bc-side' ) && ! e.target.closest( '.bc-menu-btn' ) ) {
				root.classList.remove( 'nav-open' );
			}
		} );
		return true;
	}

	function topStatus( b ) {
		var box = d.getElementById( 'bc-top-status' );
		if ( ! box ) {
			return;
		}
		BC.clear( box );
		var chip = function ( icon, text, kind, href ) {
			return h( href ? 'a' : 'span', { class: 'bc-chip-status' + ( kind ? ' is-' + kind : '' ), href: href || null }, BC.icon( icon, 15 ), h( 'span', { text: text } ) );
		};
		var wheels = b.wheels || [];
		var active = wheels.filter( function ( x ) {
			return x.status === 'active';
		} ).length;
		box.appendChild( chip( 'wheel', active ? t( '%s گردونه فعال', '%s active wheel(s)', BC.num( active, 0 ) ) : t( 'گردونه فعالی نیست', 'No active wheel' ), active ? 'ok' : 'warn', '#/wheels' ) );
		var s = b.settings || {};
		var smsOn = s.sms_driver && s.sms_driver !== 'none' && s.sms_driver !== '';
		var drv = smsOn && b.sms && b.sms[ s.sms_driver ] ? b.sms[ s.sms_driver ].name : '';
		box.appendChild( chip( 'smartphone', smsOn ? t( 'پیامک: %s', 'SMS: %s', drv || s.sms_driver ) : t( 'پنل پیامک وصل نیست', 'No SMS panel' ), smsOn ? 'ok' : 'warn', '#/sms' ) );
		box.appendChild( chip( 'bag', C.woo ? t( 'ووکامرس فعال', 'WooCommerce active' ) : t( 'بدون ووکامرس', 'No WooCommerce' ), C.woo ? 'info' : 'warn', null ) );
		if ( s.enabled === false || s.enabled === 0 || s.enabled === '0' ) {
			box.appendChild( chip( 'pause', t( 'افزونه خاموش است', 'Plugin disabled' ), 'warn', '#/settings' ) );
		}
		var setCount = function ( slug, n ) {
			var el = root.querySelector( '[data-count="' + slug + '"]' );
			if ( el ) {
				el.textContent = n ? BC.num( n, 0 ) : '';
			}
		};
		setCount( 'wheels', active );
	}

	BC.refreshBoot = function () {
		return BC.api( 'bootstrap' ).then( function ( b ) {
			BC.boot = b || {};
			topStatus( BC.boot );
			return BC.boot;
		} );
	};

	function route() {
		var hash = location.hash.replace( /^#\/?/, '' );
		var slug = hash.split( '?' )[ 0 ] || C.route || 'dashboard';
		var ok = allowed();
		if ( ! BC.pages[ slug ] || ! ok[ slug ] ) {
			slug = ok.dashboard ? 'dashboard' : Object.keys( ok )[ 0 ];
		}
		// Leaving the editor: let the editor's unsaved-changes guard veto first.
		if ( current === 'edit' && w.onbeforeunload && w.onbeforeunload() && ! w.confirm( t( 'تغییرات ذخیره نشده از بین می‌رود. ادامه می‌دهید؟', 'Unsaved changes will be lost. Continue?' ) ) ) {
			w.history.replaceState( null, '', lastHash || '#/edit' );
			return;
		}
		lastHash = location.hash;
		if ( slug !== 'edit' ) {
			w.onbeforeunload = null;
		}
		var navSlug = slug === 'edit' ? 'wheels' : slug;
		Array.prototype.forEach.call( nav.querySelectorAll( '.bc-nav__item' ), function ( a ) {
			var on = a.getAttribute( 'data-route' ) === navSlug;
			a.classList.toggle( 'is-active', on );
			if ( on ) {
				a.setAttribute( 'aria-current', 'page' );
			} else {
				a.removeAttribute( 'aria-current' );
			}
		} );
		root.classList.remove( 'nav-open' );
		root.setAttribute( 'data-route', slug );
		BC.clear( view );
		current = slug;
		d.title = ( LABELS[ navSlug ] || '' ) + ' ‹ ' + ( C.brand || 'Becharkhoon' );
		try {
			BC.pages[ slug ]( view, BC.query() );
		} catch ( e ) {
			view.appendChild( BC.alert( 'error', e.message ) );
			if ( w.console ) {
				w.console.error( e );
			}
		}
		view.focus( { preventScroll: true } );
		w.scrollTo( 0, 0 );
	}
	BC.route = route;

	function boot() {
		if ( ! shell() ) {
			return;
		}
		view.appendChild( BC.spinner( t( 'در حال بارگذاری…', 'Loading…' ) ) );
		BC.refreshBoot().then( function () {
			if ( ! location.hash && C.route && C.route !== 'dashboard' ) {
				w.history.replaceState( null, '', '#/' + C.route );
			}
			w.addEventListener( 'hashchange', route );
			route();
		} ).catch( function ( e ) {
			BC.clear( view );
			view.appendChild( BC.alert( 'error', t( 'بارگذاری اطلاعات افزونه ناموفق بود: %s', 'Could not load plugin data: %s', e.message ) + ( e.status === 403 || e.status === 401 ? ' — ' + t( 'صفحه را رفرش کنید (نشست منقضی شده).', 'Reload the page (session expired).' ) : '' ) ) );
			view.appendChild( BC.btn( t( 'تلاش دوباره', 'Retry' ), function () {
				w.location.reload();
			}, 'primary' ) );
		} );
	}

	if ( d.readyState === 'loading' ) {
		d.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
} )( window, document );
