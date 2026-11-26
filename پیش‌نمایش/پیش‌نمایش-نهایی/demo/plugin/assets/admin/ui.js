/**
 * ARIAGH.BECHARKHOON admin UI toolkit (no build step, no framework).
 * Visual language shared with ARIAGH.SEOLITY / AI Writer. Bilingual: BC.t( fa, en ).
 */
( function ( w, d ) {
	'use strict';

	var C = w.BCH || {};
	var BC = ( w.BC = w.BC || {} );
	BC.config = C;
	BC.fa = !! C.fa;

	/* ------------------------------------------------------------------ i18n + formatting */
	BC.t = function ( fa, en ) {
		var s = BC.fa ? fa : ( en === undefined ? fa : en );
		for ( var i = 2; i < arguments.length; i++ ) {
			s = s.replace( '%' + ( i - 1 ), arguments[ i ] ).replace( '%s', arguments[ i ] );
		}
		return s;
	};
	var t = BC.t;
	BC.digits = function ( s ) {
		return BC.fa ? String( s ).replace( /\d/g, function ( x ) { return '۰۱۲۳۴۵۶۷۸۹'[ x ]; } ) : String( s );
	};
	BC.num = function ( n, digits ) {
		if ( n === null || n === undefined || n === '' || isNaN( n ) ) {
			return '—';
		}
		try {
			return Number( n ).toLocaleString( BC.fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: digits === undefined ? 1 : digits } );
		} catch ( e ) {
			return String( n );
		}
	};
	BC.money = function ( n ) {
		var cur = ( BC.boot && BC.boot.currency ) || ( BC.fa ? 'تومان' : '' );
		return BC.num( n, 0 ) + ( cur ? ' ' + cur : '' );
	};
	/** UTC "Y-m-d H:i:s" → local (Jalali in Persian). */
	BC.date = function ( s, withTime ) {
		if ( ! s ) {
			return '—';
		}
		var dt = new Date( String( s ).replace( ' ', 'T' ) + ( /Z|\+/.test( s ) || String( s ).length <= 10 ? '' : 'Z' ) );
		if ( isNaN( dt ) ) {
			return s;
		}
		var o = { year: 'numeric', month: 'short', day: 'numeric' };
		if ( withTime ) {
			o.hour = '2-digit';
			o.minute = '2-digit';
		}
		try {
			return dt.toLocaleString( BC.fa ? 'fa-IR-u-ca-persian' : 'en-GB', o );
		} catch ( e ) {
			return s;
		}
	};
	BC.ago = function ( s ) {
		var dt = new Date( String( s ).replace( ' ', 'T' ) + 'Z' );
		var sec = Math.max( 1, ( Date.now() - dt ) / 1000 );
		var u = sec < 60 ? [ sec, t( 'ثانیه', 's' ) ] : sec < 3600 ? [ sec / 60, t( 'دقیقه', 'min' ) ] : sec < 86400 ? [ sec / 3600, t( 'ساعت', 'h' ) ] : [ sec / 86400, t( 'روز', 'd' ) ];
		return BC.num( Math.floor( u[ 0 ] ), 0 ) + ' ' + u[ 1 ] + ' ' + t( 'پیش', 'ago' );
	};

	/* ------------------------------------------------------------------ DOM */
	BC.h = function h( tag, attrs ) {
		var el = d.createElement( tag );
		attrs = attrs || {};
		Object.keys( attrs ).forEach( function ( k ) {
			var v = attrs[ k ];
			if ( v === null || v === undefined || v === false ) {
				return;
			}
			if ( k === 'class' ) {
				el.className = v;
			} else if ( k === 'style' && typeof v === 'object' ) {
				Object.keys( v ).forEach( function ( p ) { el.style.setProperty( p, v[ p ] ); } );
			} else if ( k.indexOf( 'on' ) === 0 && typeof v === 'function' ) {
				el.addEventListener( k.slice( 2 ).toLowerCase(), v );
			} else if ( k === 'text' ) {
				el.textContent = v;
			} else if ( k === 'html' ) {
				el.innerHTML = v;
			} else if ( k === 'value' ) {
				el.value = v;
			} else if ( k === 'checked' ) {
				el.checked = !! v;
			} else if ( v === true ) {
				el.setAttribute( k, '' );
			} else {
				el.setAttribute( k, v );
			}
		} );
		for ( var i = 2; i < arguments.length; i++ ) {
			BC.append( el, arguments[ i ] );
		}
		return el;
	};
	BC.append = function ( el, child ) {
		if ( child === null || child === undefined || child === false ) {
			return el;
		}
		if ( Array.isArray( child ) ) {
			child.forEach( function ( c ) { BC.append( el, c ); } );
		} else if ( child instanceof Node ) {
			el.appendChild( child );
		} else {
			el.appendChild( d.createTextNode( String( child ) ) );
		}
		return el;
	};
	BC.clear = function ( el ) {
		while ( el && el.firstChild ) {
			el.removeChild( el.firstChild );
		}
		return el;
	};
	var h = BC.h;

	/* ------------------------------------------------------------------ API */
	BC.api = function ( path, opts ) {
		opts = opts || {};
		var method = opts.method || ( opts.body ? 'POST' : 'GET' );
		var url = ( C.root || '/wp-json/becharkhoon/v1/' ) + path.replace( /^\//, '' );
		var query = Object.assign( {}, opts.query || {} );
		if ( 'GET' === method ) {
			query._b = Date.now(); // Never served from a page cache / CDN.
		}
		var q = Object.keys( query ).filter( function ( k ) {
			return query[ k ] !== '' && query[ k ] !== null && query[ k ] !== undefined;
		} ).map( function ( k ) {
			return encodeURIComponent( k ) + '=' + encodeURIComponent( query[ k ] );
		} ).join( '&' );
		if ( q ) {
			url += ( url.indexOf( '?' ) > -1 ? '&' : '?' ) + q;
		}
		return fetch( url, {
			method: method,
			cache: 'no-store',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': C.nonce },
			body: opts.body ? JSON.stringify( opts.body ) : undefined,
		} ).then( function ( res ) {
			return res.text().then( function ( txt ) {
				var data = null;
				try {
					data = txt ? JSON.parse( txt ) : null;
				} catch ( e ) {
					data = { message: txt.replace( /<[^>]+>/g, ' ' ).slice( 0, 300 ) };
				}
				if ( ! res.ok ) {
					var err = new Error( ( data && data.message ) || res.statusText );
					err.status = res.status;
					err.data = data;
					throw err;
				}
				return data;
			} );
		} );
	};

	/* ------------------------------------------------------------------ Icons */
	BC.ICONS = {
		'wheel': '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/><circle cx="12" cy="12" r="2.2"/>',
		'gift': '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
		'ticket': '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
		'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
		'message': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
		'palette': '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C21.97 6.01 17.46 2 12 2z"/>',
		'window': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
		'percent': '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
		'smartphone': '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
		'monitor': '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
		'tablet': '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 18h2"/>',
		'move': '<path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3"/>',
		'crown': '<path d="m2 7 4 10h12l4-10-6 4-4-6-4 6z"/><path d="M6 21h12"/>',
		'shuffle': '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
		'mail': '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
		'webhook': '<path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>',
		'type-cursor': '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
		'sliders': '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
		'magnet': '<path d="m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3z"/><path d="m5 8 4 4M12 15l4 4"/>',
		'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
		'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
		'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
		'trending-down': '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
		'brain': '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z"/>',
		'landmark': '<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10"/><path d="m12 3 9 5H3z"/>',
		'activity': '<path d="M22 12h-4l-3 8L9 4l-3 8H2"/>',
		'alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4M12 17h.01"/>',
		'arrow-down': '<path d="M12 5v14M19 12l-7 7-7-7"/>',
		'arrow-up': '<path d="m5 12 7-7 7 7M12 19V5"/>',
		'bag': '<path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
		'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
		'book': '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
		'bot': '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4"/><circle cx="12" cy="3" r="1"/><circle cx="9" cy="14" r="1.2"/><circle cx="15" cy="14" r="1.2"/><path d="M2 13v3M22 13v3"/>',
		'braces': '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
		'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
		'chart': '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
		'check': '<path d="M20 6 9 17l-5-5"/>',
		'chevron-down': '<path d="m6 9 6 6 6-6"/>',
		'chevrons-down': '<path d="m7 13 5 5 5-5M7 6l5 5 5-5"/>',
		'chevrons-up': '<path d="m17 11-5-5-5 5M17 18l-5-5-5 5"/>',
		'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		'cloud': '<path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.34 9.2 4.5 4.5 0 0 0 6.5 19z"/>',
		'code': '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
		'content': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
		'copy': '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
		'corner': '<path d="M4 4v7a4 4 0 0 0 4 4h12"/><path d="m15 10 5 5-5 5"/>',
		'cpu': '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
		'dashboard': '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
		'database': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
		'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
		'edit': '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
		'external': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
		'eye': '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
		'eye-off': '<path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.16 3.19"/><path d="M6.61 6.61A17.6 17.6 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.39-1.61"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="m2 2 20 20"/>',
		'filter': '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
		'flask': '<path d="M9 3h6"/><path d="M10 3v6.5L4.6 18.4A1.75 1.75 0 0 0 6.1 21h11.8a1.75 1.75 0 0 0 1.5-2.6L14 9.5V3"/><path d="M7.5 15h9"/>',
		'folder': '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>',
		'github': '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
		'globe': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
		'grip': '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
		'hash': '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
		'image': '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
		'inbox': '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
		'info': '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
		'key': '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/>',
		'keyboard': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 16h6"/>',
		'layers': '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
		'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
		'list': '<path d="M11 6h10M11 12h10M11 18h10"/><path d="m3 6 1.5 1.5L7 5"/><path d="m3 12 1.5 1.5L7 11"/><path d="m3 18 1.5 1.5L7 17"/>',
		'loader': '<path d="M21 12a9 9 0 1 1-6.22-8.56"/>',
		'lock': '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
		'map': '<path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
		'menu': '<path d="M4 6h16M4 12h16M4 18h16"/>',
		'moon': '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
		'more': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
		'pause': '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
		'play': '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/>',
		'plus': '<path d="M12 5v14M5 12h14"/>',
		'lifebuoy': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9"/>',
		'list-checks': '<path d="M11 6h10M11 12h10M11 18h10"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
		'power': '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
		'prompt': '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 8h8M8 12h5"/>',
		'pulse': '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
		'refresh': '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
		'review': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 15 2 2 4-4"/>',
		'rocket': '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
		'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
		'search': '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
		'send': '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
		'seo': '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M8 11.5l2 2 4-4"/>',
		'server': '<rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><path d="M6 7h.01M6 17h.01"/>',
		'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
		'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
		'sparkles': '<path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/><path d="M5 2.5l.6 1.4L7 4.5l-1.4.6L5 6.5l-.6-1.4L3 4.5l1.4-.6z"/>',
		'stack': '<rect x="3" y="3" width="18" height="6" rx="1.5"/><rect x="3" y="15" width="18" height="6" rx="1.5"/><path d="M7 12h10"/>',
		'swords': '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="m5 14 4 4M7 17l-3 3M3 19l2 2"/>',
		'target': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
		'terminal': '<path d="m4 17 6-6-6-6M12 19h8"/>',
		'trash': '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
		'trending': '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
		'type': '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
		'undo': '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
		'unlink': '<path d="m18.8 13.4 1.7-1.7a5 5 0 0 0-7.1-7.1l-1.7 1.7"/><path d="m5.2 10.6-1.7 1.7a5 5 0 0 0 7.1 7.1l1.7-1.7"/><path d="M8 2v3M2 8h3M16 22v-3M22 16h-3"/>',
		'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
		'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
		'wand': '<path d="m15 4-1-1M21 10l-1-1M18 3v2M22 7h-2"/><path d="M3 21 14.5 9.5"/><path d="m12.5 7.5 4 4"/>',
		'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
		'x': '<path d="M18 6 6 18M6 6l12 12"/>',
		'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
		'x-circle': '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
		'zap': '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
	};

	var SVGNS = 'http://www.w3.org/2000/svg';
	BC.icon = function ( name, size, cls ) {
		var svg = d.createElementNS( SVGNS, 'svg' );
		size = size || 18;
		svg.setAttribute( 'class', 'bc-ic' + ( cls ? ' ' + cls : '' ) );
		svg.setAttribute( 'width', size );
		svg.setAttribute( 'height', size );
		svg.setAttribute( 'viewBox', '0 0 24 24' );
		svg.setAttribute( 'fill', 'none' );
		svg.setAttribute( 'stroke', 'currentColor' );
		svg.setAttribute( 'stroke-width', '1.75' );
		svg.setAttribute( 'stroke-linecap', 'round' );
		svg.setAttribute( 'stroke-linejoin', 'round' );
		svg.setAttribute( 'aria-hidden', 'true' );
		svg.setAttribute( 'focusable', 'false' );
		svg.innerHTML = BC.ICONS[ name ] || BC.ICONS.info;
		return svg;
	};
	BC.il = function ( name, label, size ) {
		return [ BC.icon( name, size || 16 ), h( 'span', { text: label } ) ];
	};
	BC.yes = function ( ok, size ) {
		return BC.icon( ok ? 'check-circle' : 'x-circle', size || 16, ok ? 'is-good' : 'is-bad' );
	};

	/* ------------------------------------------------------------------ Feedback */
	var toastBox;
	BC.toast = function ( msg, type ) {
		if ( ! toastBox ) {
			toastBox = h( 'div', { class: 'bc-toasts bc-root', role: 'status', 'aria-live': 'polite', dir: BC.fa ? 'rtl' : 'ltr' } );
			d.body.appendChild( toastBox );
		}
		var el = h( 'div', { class: 'bc-toast bc-toast--' + ( type || 'info' ) }, msg );
		toastBox.appendChild( el );
		setTimeout( function () {
			el.classList.add( 'is-out' );
			setTimeout( function () { el.remove(); }, 300 );
		}, type === 'error' ? 7000 : 3200 );
	};
	BC.fail = function ( e ) {
		BC.toast( ( e && e.message ) || t( 'خطایی رخ داد.', 'Something went wrong.' ), 'error' );
	};
	BC.modal = function ( opts ) {
		var prev = d.activeElement;
		var close;
		var overlay = h( 'div', { class: 'bc-modal-overlay bc-root' + ( BC.fa ? ' is-rtl' : '' ), role: 'presentation', dir: BC.fa ? 'rtl' : 'ltr' } );
		var box = h( 'div', { class: 'bc-modal' + ( opts.wide ? ' bc-modal--wide' : '' ), role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || '' } );
		var body = h( 'div', { class: 'bc-modal__body' } );
		var foot = h( 'div', { class: 'bc-modal__foot' } );
		box.appendChild( h( 'div', { class: 'bc-modal__head' }, h( 'h2', { text: opts.title || '' } ), h( 'button', { class: 'bc-icon-btn', type: 'button', 'aria-label': t( 'بستن', 'Close' ), onClick: function () { close(); } }, BC.icon( 'x', 18 ) ) ) );
		box.appendChild( body );
		box.appendChild( foot );
		overlay.appendChild( box );
		BC.applyTheme( overlay );
		function onKey( e ) {
			if ( e.key === 'Escape' ) {
				close();
			}
		}
		close = function () {
			overlay.remove();
			d.removeEventListener( 'keydown', onKey );
			if ( prev && prev.focus ) {
				prev.focus();
			}
			if ( opts.onClose ) {
				opts.onClose();
			}
		};
		d.addEventListener( 'keydown', onKey );
		overlay.addEventListener( 'mousedown', function ( e ) {
			if ( e.target === overlay ) {
				close();
			}
		} );
		d.body.appendChild( overlay );
		setTimeout( function () {
			var f = box.querySelector( 'input, textarea, select, .bc-modal__body button' );
			if ( f ) {
				f.focus();
			}
		}, 30 );
		return { body: body, foot: foot, close: close, box: box };
	};
	BC.confirm = function ( message, onYes, danger ) {
		var m = BC.modal( { title: t( 'تایید', 'Please confirm' ) } );
		m.body.appendChild( h( 'p', { text: message } ) );
		m.foot.appendChild( h( 'button', { class: 'bc-btn', type: 'button', onClick: m.close }, t( 'انصراف', 'Cancel' ) ) );
		m.foot.appendChild( h( 'button', { class: 'bc-btn ' + ( danger ? 'bc-btn--danger' : 'bc-btn--primary' ), type: 'button', onClick: function () {
			m.close();
			onYes();
		} }, t( 'تایید', 'Confirm' ) ) );
	};

	/* ------------------------------------------------------------------ Theme */
	BC.applyTheme = function ( el ) {
		var pref = C.theme || 'light';
		try {
			pref = w.localStorage.getItem( 'bch-admin-theme' ) || pref;
		} catch ( e ) {}
		var dark = pref === 'dark' || ( pref === 'auto' && w.matchMedia && w.matchMedia( '(prefers-color-scheme: dark)' ).matches );
		el.setAttribute( 'data-theme', dark ? 'dark' : 'light' );
	};

	/* ------------------------------------------------------------------ Components */
	BC.spinner = function ( label ) {
		return h( 'div', { class: 'bc-loading', role: 'status' }, h( 'span', { class: 'bc-spinner' } ), h( 'span', { text: label || t( 'در حال بارگذاری…', 'Loading…' ) } ) );
	};
	BC.empty = function ( title, text, action, icon ) {
		return h( 'div', { class: 'bc-empty' }, h( 'div', { class: 'bc-empty__icon', 'aria-hidden': 'true' }, BC.icon( icon || 'inbox', 24 ) ), h( 'h3', { text: title } ), text ? h( 'p', { text: text } ) : null, action || null );
	};
	BC.badge = function ( text, kind ) {
		return h( 'span', { class: 'bc-badge bc-badge--' + ( kind || 'default' ) }, text );
	};
	BC.btn = function ( label, onClick, kind, extra ) {
		var cls = 'bc-btn';
		( kind || '' ).split( ' ' ).forEach( function ( k ) {
			if ( k ) {
				cls += ' bc-btn--' + k;
			}
		} );
		var attrs = Object.assign( { class: cls, type: 'button', onClick: onClick }, extra || {} );
		return h( 'button', attrs, label );
	};
	/** Run an async action on a button with a busy state. */
	BC.busy = function ( btn, promise ) {
		btn.classList.add( 'is-busy' );
		btn.disabled = true;
		return Promise.resolve( promise ).then( function ( r ) {
			btn.classList.remove( 'is-busy' );
			btn.disabled = false;
			return r;
		}, function ( e ) {
			btn.classList.remove( 'is-busy' );
			btn.disabled = false;
			throw e;
		} );
	};
	BC.card = function ( opts, body ) {
		opts = opts || {};
		return h( 'section', { class: 'bc-card' + ( opts.cls ? ' ' + opts.cls : '' ) },
			opts.title ? h( 'div', { class: 'bc-card__head' },
				h( 'div', { class: 'bc-card__title' }, opts.icon ? h( 'span', { class: 'bc-card__ic' }, BC.icon( opts.icon, 18 ) ) : null, h( 'div', null, h( 'h3', { text: opts.title } ), opts.sub ? h( 'p', { text: opts.sub } ) : null ) ),
				opts.actions ? h( 'div', { class: 'bc-card__actions' }, opts.actions ) : null
			) : null,
			h( 'div', { class: 'bc-card__body' }, body )
		);
	};
	BC.kpi = function ( icon, color, label, value, sub ) {
		return h( 'div', { class: 'bc-kpi has-icon' },
			h( 'span', { class: 'bc-kpi__ic is-' + ( color || 'blue' ) }, BC.icon( icon, 22 ) ),
			h( 'span', { class: 'bc-kpi__label', text: label } ),
			h( 'span', { class: 'bc-kpi__value', text: value } ),
			sub ? h( 'span', { class: 'bc-kpi__delta', text: sub } ) : null
		);
	};
	BC.tabs = function ( tabs, onChange, start ) {
		var wrap = h( 'div', { class: 'bc-tabs', role: 'tablist' } );
		var panel = h( 'div', { class: 'bc-tabpanel', role: 'tabpanel' } );
		function select( i ) {
			Array.prototype.forEach.call( wrap.children, function ( b, j ) {
				b.setAttribute( 'aria-selected', i === j ? 'true' : 'false' );
				b.classList.toggle( 'is-active', i === j );
			} );
			BC.clear( panel );
			BC.append( panel, tabs[ i ].render() );
			if ( onChange ) {
				onChange( i, tabs[ i ] );
			}
		}
		tabs.forEach( function ( tab, i ) {
			wrap.appendChild( h( 'button', { class: 'bc-tab', role: 'tab', type: 'button', onClick: function () { select( i ); } }, tab.icon ? BC.icon( tab.icon, 15 ) : null, h( 'span', { text: tab.label } ) ) );
		} );
		select( start || 0 );
		var el = h( 'div', { class: 'bc-tabset' }, wrap, panel );
		el.select = select;
		return el;
	};
	BC.segment = function ( options, value, onChange ) {
		var box = h( 'div', { class: 'bc-segment', role: 'radiogroup' } );
		options.forEach( function ( o ) {
			var b = h( 'button', { type: 'button', title: o.title || null, class: 'bc-segment__btn' + ( String( o.value ) === String( value ) ? ' is-active' : '' ), onClick: function () {
				Array.prototype.forEach.call( box.children, function ( x ) { x.classList.remove( 'is-active' ); } );
				b.classList.add( 'is-active' );
				onChange( o.value );
			} }, o.icon ? BC.icon( o.icon, 14 ) : null, o.label );
			box.appendChild( b );
		} );
		return box;
	};
	BC.pager = function ( total, page, per, onPage ) {
		var pages = Math.ceil( ( total || 0 ) / per );
		if ( pages <= 1 ) {
			return null;
		}
		return h( 'div', { class: 'bc-pager' },
			BC.btn( t( 'قبلی', 'Previous' ), function () { onPage( page - 1 ); }, 'sm', { disabled: page <= 1 } ),
			h( 'span', { text: t( 'صفحه %1 از %2', 'Page %1 of %2', BC.num( page, 0 ), BC.num( pages, 0 ) ) } ),
			BC.btn( t( 'بعدی', 'Next' ), function () { onPage( page + 1 ); }, 'sm', { disabled: page >= pages } )
		);
	};
	BC.table = function ( cols, rows, empty ) {
		if ( ! rows || ! rows.length ) {
			return empty || BC.empty( t( 'موردی یافت نشد', 'Nothing here yet' ) );
		}
		return h( 'div', { class: 'bc-table-wrap' }, h( 'table', { class: 'bc-table' },
			h( 'thead', null, h( 'tr', null, cols.map( function ( c ) { return h( 'th', { text: c.label, style: c.width ? { width: c.width } : null } ); } ) ) ),
			h( 'tbody', null, rows.map( function ( r ) {
				return h( 'tr', null, cols.map( function ( c ) {
					var v = c.render ? c.render( r ) : r[ c.key ];
					return h( 'td', { class: c.cls || null }, v === undefined || v === null || v === '' ? '—' : v );
				} ) );
			} ) )
		) );
	};
	BC.copy = function ( text ) {
		var done = function () { BC.toast( t( 'کپی شد', 'Copied' ), 'success' ); };
		if ( navigator.clipboard && w.isSecureContext ) {
			navigator.clipboard.writeText( text ).then( done );
			return;
		}
		var ta = h( 'textarea', { style: { position: 'fixed', opacity: '0' } } );
		ta.value = text;
		d.body.appendChild( ta );
		ta.select();
		try { d.execCommand( 'copy' ); done(); } catch ( e ) {}
		ta.remove();
	};
	BC.download = function ( filename, text, type ) {
		var blob = new Blob( [ text ], { type: type || 'application/json' } );
		var a = h( 'a', { href: URL.createObjectURL( blob ), download: filename } );
		d.body.appendChild( a );
		a.click();
		setTimeout( function () { URL.revokeObjectURL( a.href ); a.remove(); }, 500 );
	};
	BC.pickFile = function ( accept ) {
		return new Promise( function ( resolve ) {
			var inp = h( 'input', { type: 'file', accept: accept || '.json,application/json', style: { display: 'none' } } );
			inp.addEventListener( 'change', function () {
				var f = inp.files[ 0 ];
				if ( ! f ) {
					return;
				}
				var r = new FileReader();
				r.onload = function () { resolve( String( r.result ) ); };
				r.readAsText( f );
			} );
			d.body.appendChild( inp );
			inp.click();
			setTimeout( function () { inp.remove(); }, 60000 );
		} );
	};
	BC.alert = function ( kind, text, extra ) {
		return h( 'div', { class: 'bc-alert bc-alert--' + kind }, BC.icon( { info: 'info', warn: 'alert', error: 'alert', success: 'check-circle' }[ kind ] || 'info', 18 ), h( 'div', null, h( 'span', { text: text } ), extra || null ) );
	};
} )( window, document );
