/*!
 * ARIAGH.BECHARKHOON — front-end wheel engine (no dependencies).
 * SVG wheel renderer, popup builder output, triggers, OTP flow, effects, sounds, tracking.
 */
(function () {
	'use strict';

	var CFG = window.BECHARKHOON || {};
	var W = window, D = document;
	var NS = 'http://www.w3.org/2000/svg';
	var instances = {};
	var listeners = {};
	var session = { token: '', user: {}, otp: '', phone: '', wheels: [], booted: false };

	/* ------------------------------------------------------------------ utils */

	function $(sel, root) { return (root || D).querySelector(sel); }
	function $$(sel, root) { return Array.prototype.slice.call((root || D).querySelectorAll(sel)); }
	function el(tag, attrs, children) {
		var n = D.createElement(tag);
		if (attrs) {
			for (var k in attrs) {
				if (!Object.prototype.hasOwnProperty.call(attrs, k) || attrs[k] == null || attrs[k] === false) continue;
				if (k === 'text') n.textContent = attrs[k];
				else if (k === 'html') n.innerHTML = attrs[k];
				else if (k === 'class') n.className = attrs[k];
				else if (k === 'style' && typeof attrs[k] === 'object') { for (var s in attrs[k]) n.style.setProperty(s, attrs[k][s]); }
				else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
				else n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
			}
		}
		(children || []).forEach(function (c) { if (c != null && c !== false) n.appendChild(typeof c === 'string' ? D.createTextNode(c) : c); });
		return n;
	}
	function svg(tag, attrs, children) {
		var n = D.createElementNS(NS, tag);
		for (var k in (attrs || {})) { if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]); }
		(children || []).forEach(function (c) { if (c) n.appendChild(c); });
		return n;
	}
	function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
	function fa(s) {
		if (!CFG.digits || !isFa()) return String(s);
		return String(s).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; });
	}
	function isFa(wcfg) {
		if (wcfg && wcfg.lang === 'fa') return true;
		if (wcfg && wcfg.lang === 'en') return false;
		return !!CFG.fa;
	}
	function tpl(s, vars) { return String(s || '').replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }); }
	function store(k, v) {
		try {
			if (v === undefined) { var r = W.localStorage.getItem(k); return r ? JSON.parse(r) : null; }
			if (v === null) W.localStorage.removeItem(k); else W.localStorage.setItem(k, JSON.stringify(v));
		} catch (e) { return null; }
	}
	// Verified mobile stays on this device for 7 days (server keeps the token as long) → no second SMS.
	function otpStore(v) {
		if (v === undefined) { var o = store('bch_otp') || sstore('bch_otp'); return o && (!o.x || o.x > Date.now()) ? o : null; }
		if (v) v.x = Date.now() + 7 * 864e5;
		store('bch_otp', v); sstore('bch_otp', null);
	}
	function sstore(k, v) {
		try {
			if (v === undefined) { var r = W.sessionStorage.getItem(k); return r ? JSON.parse(r) : null; }
			if (v === null) W.sessionStorage.removeItem(k); else W.sessionStorage.setItem(k, JSON.stringify(v));
		} catch (e) { return null; }
	}
	function cookie(name) {
		var m = D.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
		return m ? decodeURIComponent(m[1]) : '';
	}
	function uuid() {
		if (W.crypto && W.crypto.getRandomValues) {
			var b = new Uint8Array(16); W.crypto.getRandomValues(b);
			return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
		}
		return (Date.now().toString(16) + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)).slice(0, 32);
	}
	function deviceId() {
		var id = store('bch_did') || cookie('bch_did');
		if (!id || !/^[a-f0-9-]{16,64}$/i.test(id)) id = uuid();
		store('bch_did', id);
		try { D.cookie = 'bch_did=' + id + ';path=/;max-age=31536000;SameSite=Lax' + (location.protocol === 'https:' ? ';Secure' : ''); } catch (e) {}
		return id;
	}
	function deviceType() {
		var w = W.innerWidth || 1024, ua = navigator.userAgent.toLowerCase();
		if (/ipad|tablet/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua))) return 'tablet';
		if (/mobi|iphone|ipod|android/.test(ua) || w < 640) return 'mobile';
		return w < 1024 && 'ontouchstart' in W ? 'tablet' : 'desktop';
	}
	function browser() {
		var ua = navigator.userAgent;
		if (/Edg\//.test(ua)) return 'edge';
		if (/Firefox\//.test(ua)) return 'firefox';
		if (/Chrome\//.test(ua)) return 'chrome';
		if (/Safari\//.test(ua)) return 'safari';
		return 'other';
	}
	function os() {
		var ua = navigator.userAgent;
		if (/Android/.test(ua)) return 'android';
		if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
		if (/Windows/.test(ua)) return 'windows';
		if (/Mac OS X/.test(ua)) return 'mac';
		if (/Linux/.test(ua)) return 'linux';
		return 'other';
	}
	function query() {
		var q = {};
		(location.search || '').replace(/^\?/, '').split('&').forEach(function (p) {
			if (!p) return; var kv = p.split('=');
			try { q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); } catch (e) {}
		});
		return q;
	}
	function emit(name, data) {
		(listeners[name] || []).forEach(function (fn) { try { fn(data); } catch (e) {} });
		try { D.dispatchEvent(new CustomEvent('becharkhoon:' + name, { detail: data })); } catch (e) {}
	}
	function analytics(wcfg, name, data) {
		if (!wcfg || !wcfg.advanced) return;
		if (wcfg.advanced.track_ga) {
			try { (W.dataLayer = W.dataLayer || []).push(Object.assign({ event: 'becharkhoon_' + name, wheel_id: wcfg.id, wheel: wcfg.title }, data || {})); } catch (e) {}
			if (typeof W.gtag === 'function') { try { W.gtag('event', 'becharkhoon_' + name, Object.assign({ wheel_id: wcfg.id }, data || {})); } catch (e) {} }
		}
		if (wcfg.advanced.track_pixel && typeof W.fbq === 'function') {
			try { W.fbq('trackCustom', 'Wheel' + name.charAt(0).toUpperCase() + name.slice(1), Object.assign({ wheel: wcfg.title }, data || {})); } catch (e) {}
		}
	}
	function prefersReduced() { try { return W.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
	function fmtDuration(sec, wcfg) {
		sec = Math.max(0, Math.floor(sec));
		var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
		var pad = function (n) { return (n < 10 ? '0' : '') + n; };
		var time = '\u2066' + pad(h) + ':' + pad(m) + ':' + pad(s) + '\u2069';
		var out = (d ? d + (isFa(wcfg) ? ' روز و ' : 'd ') : '') + time;
		return fa(out);
	}

	/* ------------------------------------------------------------------ context + api */

	function pageCtx() {
		if (W.BCH_PAGE && typeof W.BCH_PAGE === 'object') return W.BCH_PAGE;
		var n = D.getElementById('bch-page');
		var p = {};
		try { p = n ? JSON.parse(n.textContent) : {}; } catch (e) {}
		return p;
	}
	function clientCtx() {
		var p = pageCtx();
		var visits = sstore('bch_visit_counted') ? (store('bch_visits') || 1) : ((store('bch_visits') || 0) + 1);
		if (!sstore('bch_visit_counted')) { store('bch_visits', visits); sstore('bch_visit_counted', 1); }
		var pv = (sstore('bch_pv') || 0) + 1; sstore('bch_pv', pv);
		var q = query();
		var utm = sstore('bch_utm') || {};
		['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { if (q[k]) utm[k] = q[k]; });
		sstore('bch_utm', utm);
		var ref = sstore('bch_ref') || D.referrer || '';
		if (!sstore('bch_ref')) sstore('bch_ref', ref);
		var cookies = {};
		(D.cookie || '').split('; ').slice(0, 30).forEach(function (c) { var i = c.indexOf('='); if (i > 0) { var k = c.slice(0, i); if (!/^(wordpress|wp-|woocommerce_|wp_woocommerce)/.test(k)) cookies[k] = c.slice(i + 1).slice(0, 100); } });
		return {
			device: deviceType(), url: location.href, ref: ref, utm_source: utm.utm_source || '', utm_medium: utm.utm_medium || '', utm_campaign: utm.utm_campaign || '',
			page_type: p.page_type || 'other', object_id: p.object_id || 0, post_type: p.post_type || '', terms: p.terms || [], visits: visits, pageviews: pv,
			lang: (D.documentElement.lang || '').slice(0, 2), query: q, cookies: cookies, browser: browser(), os: os()
		};
	}

	function api(action, payload) {
		payload = payload || {};
		payload.did = session.did;
		if (session.otp) payload.otp_token = session.otp;
		var body, url, headers = {};
		if (CFG.mode === 'rest') {
			url = CFG.rest + action; body = JSON.stringify(payload); headers['Content-Type'] = 'application/json';
		} else {
			url = CFG.ajax + (CFG.ajax.indexOf('?') > -1 ? '&' : '?') + 'action=bch_' + action + '&_=' + Date.now();
			body = new URLSearchParams(); body.append('payload', JSON.stringify(payload));
		}
		return fetch(url, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: headers, body: body })
			.then(function (r) { return r.json().catch(function () { return { ok: false, message: 'HTTP ' + r.status }; }).then(function (j) { j = j || {}; j._status = r.status; return j; }); })
			.catch(function () { return { ok: false, message: isFa() ? 'اتصال برقرار نشد. اینترنت خود را بررسی کنید.' : 'Network error.' }; });
	}

	var trackQueue = [];
	var trackTimer = null;
	function track(wid, e) {
		if (!CFG.track || CFG.admin) return;
		if (CFG.dnt && (navigator.doNotTrack === '1' || W.doNotTrack === '1')) return;
		if (CFG.sample < 100 && e === 'imp' && Math.random() * 100 > CFG.sample) return;
		var key = 'bch_t_' + wid + '_' + e;
		if ((e === 'imp' || e === 'form') && sstore(key)) return;
		if (e === 'imp' || e === 'form') sstore(key, 1);
		trackQueue.push({ w: wid, e: e });
		clearTimeout(trackTimer);
		trackTimer = setTimeout(flushTrack, 1500);
	}
	function flushTrack() {
		if (!trackQueue.length) return;
		var events = trackQueue.splice(0, 20);
		var payload = JSON.stringify({ events: events, did: session.did });
		if (CFG.mode !== 'rest' && navigator.sendBeacon) {
			var fd = new FormData(); fd.append('payload', payload);
			if (navigator.sendBeacon(CFG.ajax + (CFG.ajax.indexOf('?') > -1 ? '&' : '?') + 'action=bch_track', fd)) return;
		}
		api('track', { events: events });
	}
	W.addEventListener('pagehide', flushTrack);

	/* ------------------------------------------------------------------ sound */

	var Sound = {
		ctx: null, muted: !!store('bch_muted'),
		ac: function () {
			if (!this.ctx) { var AC = W.AudioContext || W.webkitAudioContext; if (!AC) return null; try { this.ctx = new AC(); } catch (e) { return null; } }
			if (this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) {} }
			return this.ctx;
		},
		tone: function (freq, dur, type, vol, when) {
			var a = this.ac(); if (!a || this.muted) return;
			var t = a.currentTime + (when || 0), o = a.createOscillator(), g = a.createGain();
			o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
			g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
			o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
		},
		file: function (url, vol) {
			if (this.muted || !url) return false;
			try { var au = new Audio(url); au.volume = Math.min(1, vol); au.play().catch(function () {}); return true; } catch (e) { return false; }
		},
		tick: function (d) { if (!d.sound || !d.sound_tick) return; if (d.sound_tick_url && this.file(d.sound_tick_url, d.sound_volume * 0.5)) return; this.tone(1400 + Math.random() * 200, 0.04, 'square', 0.05 * d.sound_volume * 2); },
		win: function (d) {
			if (!d.sound || !d.sound_win) return; if (d.sound_win_url && this.file(d.sound_win_url, d.sound_volume)) return;
			var v = 0.18 * d.sound_volume * 2, self = this;
			[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) { self.tone(f, 0.28, 'triangle', v, i * 0.09); });
			self.tone(1567.98, 0.6, 'sine', v * 0.8, 0.5);
		},
		lose: function (d) {
			if (!d.sound || !d.sound_lose) return; if (d.sound_lose_url && this.file(d.sound_lose_url, d.sound_volume)) return;
			var v = 0.15 * d.sound_volume * 2, self = this;
			[392, 349.23, 311.13, 261.63].forEach(function (f, i) { self.tone(f, 0.3, 'sawtooth', v * 0.6, i * 0.16); });
		}
	};

	/* ------------------------------------------------------------------ effects */

	var Effects = {
		run: function (type, emoji, colors) {
			if (!type || type === 'none') return;
			var cv = el('canvas', { class: 'bchw-fx', 'aria-hidden': 'true' });
			D.body.appendChild(cv);
			var ctx = cv.getContext('2d'), dpr = Math.min(2, W.devicePixelRatio || 1);
			var Wd = W.innerWidth, H = W.innerHeight;
			cv.width = Wd * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
			colors = colors && colors.length ? colors : ['#1D4ED8', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];
			var parts = [], i, n = prefersReduced() ? 40 : 170, life = 3600;
			var glyph = { stars: '⭐', hearts: '❤️', snow: '❄️', coins: '🪙', emoji: emoji || '🎉', balloons: '🎈' }[type];
			for (i = 0; i < n; i++) {
				var p = { x: Math.random() * Wd, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 4, r: 4 + Math.random() * 6, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.3, c: colors[i % colors.length], g: 0.06 };
				if (type === 'fireworks') { var cx = Wd * (0.2 + Math.random() * 0.6), cy = H * (0.15 + Math.random() * 0.35), ang = Math.random() * 6.28, sp = 2 + Math.random() * 6; p.x = cx; p.y = cy; p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp; p.g = 0.05; p.delay = Math.floor(i / 40) * 450; }
				if (type === 'balloons') { p.y = H + 20 + Math.random() * H * 0.4; p.vy = -(1.5 + Math.random() * 2.5); p.g = 0; p.vx = (Math.random() - 0.5) * 0.8; p.r = 14 + Math.random() * 12; }
				if (type === 'snow') { p.vy = 0.8 + Math.random() * 1.6; p.g = 0; p.r = 10 + Math.random() * 8; }
				if (glyph && type !== 'balloons' && type !== 'snow') p.r = 10 + Math.random() * 10;
				parts.push(p);
			}
			var start = performance.now();
			function frame(now) {
				var t = now - start;
				ctx.clearRect(0, 0, Wd, H);
				ctx.globalAlpha = t > life - 800 ? Math.max(0, (life - t) / 800) : 1;
				parts.forEach(function (p) {
					if (p.delay && t < p.delay) return;
					p.vy += p.g; p.x += p.vx; p.y += p.vy; p.a += p.va;
					if (type === 'snow' || type === 'balloons') p.x += Math.sin((t / 600) + p.r) * 0.6;
					ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
					if (glyph) { ctx.font = p.r * 2 + 'px serif'; ctx.textAlign = 'center'; ctx.fillText(glyph, 0, 0); }
					else if (type === 'fireworks') { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(0, 0, p.r * 0.45, 0, 6.28); ctx.fill(); }
					else { ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); }
					ctx.restore();
				});
				if (t < life) requestAnimationFrame(frame); else cv.remove();
			}
			requestAnimationFrame(frame);
		}
	};

	/* ------------------------------------------------------------------ wheel renderer */

	var measureCtx = null;
	function textWidth(text, size, weight, family) {
		if (!measureCtx) { var c = D.createElement('canvas'); measureCtx = c.getContext('2d'); }
		measureCtx.font = (weight || 700) + ' ' + size + 'px ' + family;
		return measureCtx.measureText(text).width;
	}
	function wrapLines(text, size, weight, family, max) {
		var words = String(text).split(/\s+/), lines = [], cur = '';
		words.forEach(function (w) {
			var t = cur ? cur + ' ' + w : w;
			if (textWidth(t, size, weight, family) <= max || !cur) cur = t; else { lines.push(cur); cur = w; }
		});
		if (cur) lines.push(cur);
		return lines;
	}
	function polar(cx, cy, r, deg) { var a = deg * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
	function arcPath(cx, cy, r, a0, a1) {
		var p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1), large = (a1 - a0) > 180 ? 1 : 0;
		return 'M' + cx + ' ' + cy + 'L' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + 'A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + 'Z';
	}
	var uid = 0;

	/**
	 * Wheel(container, cfg) — cfg = public wheel config (design + slices).
	 */
	function Wheel(container, wcfg, opts) {
		this.c = container; this.w = wcfg; this.d = wcfg.design; this.opts = opts || {};
		this.rot = 0; this.spinning = false; this.idle = null; this.lastTick = null;
		this.id = 'bchw' + (++uid);
		this.render();
	}
	Wheel.prototype.pointerAngle = function () {
		return { top: -90, right: 0, bottom: 90, left: 180 }[this.d.pointer_position] || -90;
	};
	Wheel.prototype.seg = function () { return 360 / Math.max(1, this.w.slices.length); };
	Wheel.prototype.family = function () {
		var f = (W.getComputedStyle(this.c).fontFamily || 'Vazirmatn, Tahoma, sans-serif');
		return f;
	};
	Wheel.prototype.render = function () {
		var d = this.d, slices = this.w.slices, n = slices.length, S = 500, cx = 250, cy = 250;
		var rimW = d.rim_style === 'none' ? 0 : Math.max(0, +d.rim_width || 0) * (500 / Math.max(260, +d.size || 400)) * 1.0;
		var R = 236 - rimW, seg = 360 / n, base = this.pointerAngle() - seg / 2, id = this.id, fam = this.family();
		var defs = svg('defs');
		// Filters.
		defs.appendChild(svg('filter', { id: id + 'sh', x: '-20%', y: '-20%', width: '140%', height: '140%' }, [svg('feDropShadow', { dx: 0, dy: 6, stdDeviation: 8, 'flood-color': 'rgba(0,0,0,.35)' })]));
		defs.appendChild(svg('filter', { id: id + 'gl', x: '-50%', y: '-50%', width: '200%', height: '200%' }, [svg('feGaussianBlur', { stdDeviation: 6, result: 'b' }), svg('feMerge', {}, [svg('feMergeNode', { in: 'b' }), svg('feMergeNode', { in: 'SourceGraphic' })])]));
		var gloss = svg('radialGradient', { id: id + 'gloss', cx: '35%', cy: '30%', r: '70%' }, [svg('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': '.38' }), svg('stop', { offset: '55%', 'stop-color': '#fff', 'stop-opacity': '.06' }), svg('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': '.12' })]);
		defs.appendChild(gloss);
		var metal = svg('linearGradient', { id: id + 'metal', x1: '0', y1: '0', x2: '1', y2: '1' }, [svg('stop', { offset: '0%', 'stop-color': d.rim_color2 }), svg('stop', { offset: '45%', 'stop-color': '#fff7d6' }), svg('stop', { offset: '55%', 'stop-color': d.rim_color2 }), svg('stop', { offset: '100%', 'stop-color': d.rim_color })]);
		defs.appendChild(metal);
		var cen = svg('radialGradient', { id: id + 'cen', cx: '40%', cy: '35%', r: '75%' }, [svg('stop', { offset: '0%', 'stop-color': d.center_color }), svg('stop', { offset: '100%', 'stop-color': d.center_color2 || d.center_color })]);
		defs.appendChild(cen);

		var root = svg('svg', { viewBox: '0 0 ' + S + ' ' + S, class: 'bchw-svg', role: 'img', 'aria-label': this.w.title || 'wheel' }, [defs]);
		// Glow behind.
		if (d.glow) root.appendChild(svg('circle', { cx: cx, cy: cy, r: 238, fill: d.glow_color, class: 'bchw-glowc', filter: 'url(#' + id + 'gl)' }));
		// Rim.
		var rimG = svg('g', { class: 'bchw-rim' });
		if (rimW > 0) {
			var rimFill = d.rim_style === 'metal' ? 'url(#' + id + 'metal)' : d.rim_color;
			rimG.appendChild(svg('circle', { cx: cx, cy: cy, r: R + rimW / 2, fill: 'none', stroke: rimFill, 'stroke-width': rimW, filter: d.shadow ? 'url(#' + id + 'sh)' : null }));
			if (d.rim_style === 'double') {
				rimG.appendChild(svg('circle', { cx: cx, cy: cy, r: R + rimW * 0.5, fill: 'none', stroke: d.rim_color2, 'stroke-width': Math.max(2, rimW * 0.22) }));
			}
			if (d.rim_style === 'neon') {
				rimG.appendChild(svg('circle', { cx: cx, cy: cy, r: R + rimW * 0.5, fill: 'none', stroke: d.rim_color2, 'stroke-width': Math.max(2, rimW * 0.25), filter: 'url(#' + id + 'gl)', class: 'bchw-neon' }));
			}
		}
		root.appendChild(rimG);

		// Rotating group.
		var g = svg('g', { class: 'bchw-rot' });
		this.g = g;
		if (d.custom_mode && d.custom_image) {
			g.appendChild(svg('image', { href: d.custom_image, x: cx - R, y: cy - R, width: R * 2, height: R * 2, preserveAspectRatio: 'xMidYMid slice', transform: 'rotate(' + (+d.custom_offset || 0) + ' ' + cx + ' ' + cy + ')', 'clip-path': 'circle(' + R + 'px at ' + cx + 'px ' + cy + 'px)' }));
		}
		var pal = d.palette && d.palette.length ? d.palette : ['#1D4ED8', '#F59E0B'];
		var self = this;
		slices.forEach(function (s, i) {
			var a0 = base + i * seg, a1 = a0 + seg, mid = a0 + seg / 2;
			var col = s.color || pal[i % pal.length];
			if (n % 2 === 1 && i === n - 1 && !s.color && pal.length % 2 === 0 && col === pal[0]) col = pal[1 % pal.length];
			var fill = col;
			if (!(d.custom_mode && d.custom_image)) {
				if (d.slice_gradient || s.color2) {
					var gid = id + 'g' + i;
					var gr = svg('radialGradient', { id: gid, cx: cx, cy: cy, r: R, gradientUnits: 'userSpaceOnUse' }, [svg('stop', { offset: '20%', 'stop-color': s.color2 || col }), svg('stop', { offset: '100%', 'stop-color': col })]);
					if (!s.color2) { gr.firstChild.setAttribute('stop-color', col); gr.firstChild.setAttribute('stop-opacity', '1'); gr.appendChild(svg('stop', { offset: '100%', 'stop-color': col })); gr.insertBefore(svg('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': '.25' }), gr.firstChild); }
					defs.appendChild(gr); fill = 'url(#' + gid + ')';
				}
				g.appendChild(svg('path', { d: arcPath(cx, cy, R, a0, a1), fill: fill, stroke: d.slice_border_color, 'stroke-width': d.slice_border_width, class: 'bchw-slice' + (s.highlight ? ' is-hl' : ''), 'data-i': i }));
			} else {
				g.appendChild(svg('path', { d: arcPath(cx, cy, R, a0, a1), fill: 'transparent', class: 'bchw-slice', 'data-i': i }));
			}
			if (d.custom_mode && d.custom_image && !d.custom_labels) return;
			// Content: icon / image + label.
			var tc = s.text_color || d.text_color, fs = +d.font_size || 15, fw = d.font_weight || 800;
			var tr = R * (+d.text_position || 0.6);
			var cg = svg('g', { class: 'bchw-content' });
			var hasMedia = s.image || s.icon;
			var mediaR = R * 0.84;
			if (d.text_orientation === 'radial' && hasMedia) tr = Math.min(tr, R * 0.56);
			if (s.image) {
				var sz = +s.image_size || 34, pi = polar(cx, cy, Math.min(R - sz / 2 - 6, mediaR), mid);
				cg.appendChild(svg('image', { href: s.image, x: pi[0] - sz / 2, y: pi[1] - sz / 2, width: sz, height: sz, transform: 'rotate(' + (mid + 90) + ' ' + pi[0] + ' ' + pi[1] + ')' }));
			} else if (s.icon) {
				var isz = +d.icon_size || 22, pc = polar(cx, cy, Math.min(R - isz, mediaR), mid);
				var it = svg('text', { x: pc[0], y: pc[1], 'font-size': isz, 'text-anchor': 'middle', 'dominant-baseline': 'central', transform: 'rotate(' + (mid + 90) + ' ' + pc[0] + ' ' + pc[1] + ')' });
				it.textContent = s.icon; cg.appendChild(it);
			}
			if (!s.hidden_label && (s.label || s.sublabel)) {
				var label = String(s.label || ''), maxW, lines;
				if (d.text_orientation === 'horizontal') maxW = 2 * tr * Math.sin(Math.min(80, seg / 2) * Math.PI / 180) * 0.86;
				else if (d.text_orientation === 'curved') maxW = tr * (seg * Math.PI / 180) * 0.86;
				else maxW = hasMedia ? R * 0.44 : Math.min(R * 0.6, 2 * (R * 0.95 - tr));
				var size = fs;
				lines = wrapLines(label, size, fw, fam, maxW);
				while ((lines.length > 2 || lines.some(function (l) { return textWidth(l, size, fw, fam) > maxW; })) && size > 8) { size -= 1; lines = wrapLines(label, size, fw, fam, maxW); }
				if (lines.length > 2) lines = [lines[0], lines.slice(1).join(' ')];
				var shadow = d.text_shadow ? 'bchw-ts' : '';
				if (d.text_orientation === 'curved') {
					var pid = id + 'tp' + i, pr = tr, sweepA = a0 + 2, sweepB = a1 - 2;
					var flip = mid > 0 && mid < 180;
					var P0 = polar(cx, cy, pr, flip ? sweepB : sweepA), P1 = polar(cx, cy, pr, flip ? sweepA : sweepB);
					defs.appendChild(svg('path', { id: pid, d: 'M' + P0[0] + ' ' + P0[1] + 'A' + pr + ' ' + pr + ' 0 0 ' + (flip ? 0 : 1) + ' ' + P1[0] + ' ' + P1[1], fill: 'none' }));
					var ct = svg('text', { 'font-size': size, 'font-weight': fw, fill: tc, class: shadow, 'dominant-baseline': 'central' });
					var tp = svg('textPath', { href: '#' + pid, startOffset: '50%', 'text-anchor': 'middle' });
					tp.textContent = lines.join(' ');
					ct.appendChild(tp); cg.appendChild(ct);
				} else {
					var p = polar(cx, cy, tr, mid);
					var nm = ((mid % 360) + 360) % 360;
					var rotA = d.text_orientation === 'horizontal' ? mid + 90 : mid;
					if (d.text_orientation === 'horizontal' && nm > 0 && nm < 180) rotA = mid - 90;
					if (d.text_orientation === 'radial' && nm > 90 && nm < 270) rotA = mid + 180;
					var t = svg('text', { x: p[0], y: p[1], 'font-size': size, 'font-weight': fw, fill: tc, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: shadow, transform: 'rotate(' + rotA + ' ' + p[0] + ' ' + p[1] + ')' });
					var all = lines.slice();
					if (s.sublabel) all.push(s.sublabel);
					var lh = size * 1.12, off = -(all.length - 1) * lh / 2;
					all.forEach(function (ln, li) {
						var span = svg('tspan', { x: p[0], dy: li === 0 ? off : lh, 'font-size': (s.sublabel && li === all.length - 1 && lines.length < all.length) ? Math.max(8, size * 0.72) : null });
						span.textContent = fa(ln);
						t.appendChild(span);
					});
					if (isFa(self.w)) t.setAttribute('direction', 'rtl');
					cg.appendChild(t);
				}
			}
			g.appendChild(cg);
		});
		if (d.gloss && !(d.custom_mode && d.custom_image)) g.appendChild(svg('circle', { cx: cx, cy: cy, r: R, fill: 'url(#' + id + 'gloss)', 'pointer-events': 'none' }));
		root.appendChild(g);

		// Pegs + lights (static ring, outside rotation for lights; pegs rotate).
		if (d.pegs && n <= 24 && rimW > 0) {
			for (var k = 0; k < n; k++) {
				var pp = polar(cx, cy, R - 4, base + k * seg);
				g.appendChild(svg('circle', { cx: pp[0], cy: pp[1], r: 4.2, fill: d.light_color, stroke: 'rgba(0,0,0,.25)', 'stroke-width': 1, class: 'bchw-peg' }));
			}
		}
		if ((d.rim_style === 'lights' || d.rim_style === 'dots' || d.rim_style === 'metal' || d.rim_style === 'neon') && rimW > 4 && +d.light_count > 0) {
			var lg = svg('g', { class: 'bchw-lights bchw-anim-' + (d.light_animation || 'chase') });
			var lc = +d.light_count;
			for (var j = 0; j < lc; j++) {
				var lp = polar(cx, cy, R + rimW / 2, -90 + j * 360 / lc);
				lg.appendChild(svg('circle', { cx: lp[0], cy: lp[1], r: Math.max(2.5, Math.min(7, rimW * 0.28)), class: 'bchw-light ' + (j % 2 ? 'is-b' : 'is-a'), style: '--i:' + j + ';--n:' + lc + ';fill:' + (j % 2 ? d.light_color2 : d.light_color) }));
			}
			root.appendChild(lg);
		}
		// Frame overlay image.
		if (d.frame_image) root.appendChild(svg('image', { href: d.frame_image, x: 0, y: 0, width: S, height: S, 'pointer-events': 'none' }));

		// Center hub.
		if (d.center_style !== 'none') {
			var cr = R * (+d.center_size || 0.2), hub = svg('g', { class: 'bchw-hub' + (d.center_clickable ? ' is-click' : ''), role: d.center_clickable ? 'button' : null, tabindex: d.center_clickable ? 0 : null, 'aria-label': d.center_text || 'spin' });
			if (d.center_style === 'star') {
				var pts = [];
				for (var q = 0; q < 16; q++) { var rr = q % 2 ? cr * 0.78 : cr * 1.12, pq = polar(cx, cy, rr, -90 + q * 22.5); pts.push(pq[0].toFixed(1) + ',' + pq[1].toFixed(1)); }
				hub.appendChild(svg('polygon', { points: pts.join(' '), fill: 'url(#' + id + 'cen)', stroke: d.center_border, 'stroke-width': 3, filter: d.shadow ? 'url(#' + id + 'sh)' : null }));
			} else if (d.center_style === 'gem') {
				var gp = [];
				for (var gq = 0; gq < 8; gq++) { var gpt = polar(cx, cy, cr * 1.05, -90 + gq * 45 + 22.5); gp.push(gpt[0].toFixed(1) + ',' + gpt[1].toFixed(1)); }
				hub.appendChild(svg('polygon', { points: gp.join(' '), fill: 'url(#' + id + 'cen)', stroke: d.center_border, 'stroke-width': 3, filter: d.shadow ? 'url(#' + id + 'sh)' : null }));
			} else {
				hub.appendChild(svg('circle', { cx: cx, cy: cy, r: cr, fill: 'url(#' + id + 'cen)', stroke: d.center_border, 'stroke-width': d.center_style === 'button' ? 5 : 3, filter: d.shadow ? 'url(#' + id + 'sh)' : null }));
				if (d.center_style === 'button') hub.appendChild(svg('circle', { cx: cx, cy: cy, r: cr * 0.82, fill: 'none', stroke: d.center_border, 'stroke-opacity': '.18', 'stroke-width': 2 }));
			}
			if (d.center_image) {
				var ci = cr * 1.3;
				hub.appendChild(svg('image', { href: d.center_image, x: cx - ci / 2, y: cy - ci / 2, width: ci, height: ci, 'clip-path': 'circle(' + (ci / 2) + 'px at ' + (ci / 2) + 'px ' + (ci / 2) + 'px)' }));
			} else if (d.center_text && d.center_style !== 'circle') {
				var csz = Math.min(cr * 0.62, textWidth(d.center_text, 20, 900, fam) > cr * 1.5 ? 20 * cr * 1.5 / textWidth(d.center_text, 20, 900, fam) : 20);
				var ctx2 = svg('text', { x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.max(9, csz), 'font-weight': 900, fill: d.center_text_color });
				ctx2.textContent = fa(d.center_text); hub.appendChild(ctx2);
			}
			root.appendChild(hub);
			this.hub = hub;
		}
		// Pointer.
		root.appendChild(this.pointer(cx, cy, R, rimW));
		this.svg = root;
		this.c.innerHTML = '';
		this.c.appendChild(root);
		this.apply();
		if (d.idle_rotate && !prefersReduced() && !this.opts.static) this.startIdle();
	};
	Wheel.prototype.pointer = function (cx, cy, R, rimW) {
		var d = this.d, a = this.pointerAngle(), sc = +d.pointer_size || 1, pg = svg('g', { class: 'bchw-pointer' + (d.pointer_bounce ? ' is-bounce' : '') });
		var tipR = R - 18, outR = R + rimW + 10;
		var inner = svg('g', { class: 'bchw-pointer-in' });
		var shape;
		var col = d.pointer_color, st = d.pointer_stroke;
		// Drawn pointing "down" towards the centre, at the top; then rotated.
		switch (d.pointer_style) {
			case 'pin':
				shape = [svg('path', { d: 'M250 ' + (250 - tipR) + ' L234 ' + (250 - outR + 26) + ' A20 20 0 1 1 266 ' + (250 - outR + 26) + ' Z', fill: col, stroke: st, 'stroke-width': 3 }), svg('circle', { cx: 250, cy: 250 - outR + 20, r: 7, fill: st })];
				break;
			case 'triangle':
				shape = [svg('path', { d: 'M250 ' + (250 - tipR) + ' L228 ' + (250 - outR) + ' L272 ' + (250 - outR) + ' Z', fill: col, stroke: st, 'stroke-width': 3, 'stroke-linejoin': 'round' })];
				break;
			case 'drop':
				shape = [svg('path', { d: 'M250 ' + (250 - tipR) + ' C236 ' + (250 - tipR - 18) + ' 228 ' + (250 - outR + 18) + ' 236 ' + (250 - outR + 6) + ' A18 18 0 0 1 264 ' + (250 - outR + 6) + ' C272 ' + (250 - outR + 18) + ' 264 ' + (250 - tipR - 18) + ' 250 ' + (250 - tipR) + 'Z', fill: col, stroke: st, 'stroke-width': 3 })];
				break;
			case 'diamond':
				shape = [svg('path', { d: 'M250 ' + (250 - tipR) + ' L234 ' + (250 - outR + 16) + ' L250 ' + (250 - outR) + ' L266 ' + (250 - outR + 16) + ' Z', fill: col, stroke: st, 'stroke-width': 3, 'stroke-linejoin': 'round' })];
				break;
			case 'ticker':
				shape = [svg('rect', { x: 245, y: 250 - outR, width: 10, height: outR - tipR + 6, rx: 5, fill: col, stroke: st, 'stroke-width': 2 })];
				break;
			case 'image':
				if (d.pointer_image) { shape = [svg('image', { href: d.pointer_image, x: 226, y: 250 - outR - 4, width: 48, height: 60 })]; break; }
				/* falls through */
			default:
				shape = [svg('path', { d: 'M250 ' + (250 - tipR) + ' L230 ' + (250 - outR + 4) + ' Q250 ' + (250 - outR - 8) + ' 270 ' + (250 - outR + 4) + ' Z', fill: col, stroke: st, 'stroke-width': 3, 'stroke-linejoin': 'round', filter: d.shadow ? 'url(#' + this.id + 'sh)' : null })];
		}
		shape.forEach(function (s) { inner.appendChild(s); });
		inner.setAttribute('transform', 'translate(250 ' + (250 - outR) + ') scale(' + sc + ') translate(-250 ' + -(250 - outR) + ')');
		pg.appendChild(inner);
		pg.setAttribute('transform', 'rotate(' + (a + 90) + ' 250 250)');
		this.pointerEl = inner;
		return pg;
	};
	Wheel.prototype.apply = function () { if (this.g) this.g.setAttribute('transform', 'rotate(' + (this.rot % 360) + ' 250 250)'); };
	Wheel.prototype.startIdle = function () {
		var self = this, last = performance.now(), speed = (+this.d.idle_speed || 30) / 1000;
		this.stopIdle();
		function f(now) { if (self.spinning || !self.idle) return; self.rot += (now - last) * speed; last = now; self.apply(); self.idle = requestAnimationFrame(f); }
		this.idle = requestAnimationFrame(f);
	};
	Wheel.prototype.stopIdle = function () { if (this.idle) cancelAnimationFrame(this.idle); this.idle = null; };
	Wheel.prototype.tick = function () {
		var seg = this.seg(), b = Math.floor((this.rot + seg / 2) / seg);
		if (this.lastTick !== null && b !== this.lastTick) {
			Sound.tick(this.d);
			if (this.d.pointer_bounce && this.pointerEl) { var pe = this.pointerEl; pe.classList.remove('is-hit'); void pe.getBBox; pe.classList.add('is-hit'); }
		}
		this.lastTick = b;
	};
	/** Fast linear spin while waiting for the server. */
	Wheel.prototype.free = function () {
		var self = this; this.stopIdle(); this.spinning = true; this.freeRun = true;
		var last = performance.now();
		this.svg.classList.add('is-spinning');
		function f(now) { if (!self.freeRun) return; self.rot += (now - last) * 0.9; last = now; self.apply(); self.tick(); requestAnimationFrame(f); }
		requestAnimationFrame(f);
	};
	Wheel.prototype.ease = function (t) {
		switch (this.d.spin_easing) {
			case 'cubic': return 1 - Math.pow(1 - t, 3);
			case 'expo': return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
			case 'back': var c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
			case 'elastic': return t === 0 || t === 1 ? t : Math.pow(2, -9 * t) * Math.sin((t * 8 - 0.75) * (2 * Math.PI) / 4.5) * 0.35 + 1 - Math.pow(1 - t, 4) * 0.65 - (1 - (1 - Math.pow(1 - t, 4))) * 0;
			case 'bounce': var x = 1 - Math.pow(1 - t, 4); return t > 0.92 ? x + Math.sin((t - 0.92) / 0.08 * Math.PI) * 0.004 : x;
			default: return 1 - Math.pow(1 - t, 5);
		}
	};
	/** Land on slice index; resolves when stopped. */
	Wheel.prototype.spinTo = function (index) {
		var self = this, seg = this.seg();
		this.stopIdle(); this.freeRun = false; this.spinning = true;
		this.svg.classList.add('is-spinning');
		var jitter = this.d.land_random ? (Math.random() - 0.5) * seg * 0.7 : 0;
		var target = ((-index * seg + jitter) % 360 + 360) % 360;
		var cur = ((this.rot % 360) + 360) % 360;
		var delta = (target - cur + 360) % 360;
		var turns = prefersReduced() && this.d.reduce_motion ? 1 : Math.max(2, +this.d.spin_rotations || 8);
		delta += 360 * turns;
		var from = this.rot, dur = (prefersReduced() && this.d.reduce_motion ? 1.6 : Math.max(2, +this.d.spin_duration || 6)) * 1000, start = performance.now();
		return new Promise(function (resolve) {
			function f(now) {
				var t = Math.min(1, (now - start) / dur);
				self.rot = from + delta * self.ease(t);
				self.apply(); self.tick();
				if (t < 1) requestAnimationFrame(f);
				else { self.spinning = false; self.svg.classList.remove('is-spinning'); resolve(index); }
			}
			requestAnimationFrame(f);
		});
	};
	Wheel.prototype.stop = function () { this.freeRun = false; this.spinning = false; if (this.svg) this.svg.classList.remove('is-spinning'); };
	Wheel.prototype.highlight = function (index) {
		var paths = $$('.bchw-slice', this.svg);
		paths.forEach(function (p) { p.classList.toggle('is-win', +p.getAttribute('data-i') === index); });
		if (this.d.dim_others) this.svg.classList.add('has-winner');
		// (Do not re-append the winning path: it would be painted over its own label.)
		if (!this.d.highlight_win) paths.forEach(function (p) { p.classList.remove('is-win'); });
	};
	Wheel.prototype.reset = function () {
		this.svg.classList.remove('has-winner');
		$$('.bchw-slice', this.svg).forEach(function (p) { p.classList.remove('is-win'); });
		if (this.d.idle_rotate && !prefersReduced()) this.startIdle();
	};

	/* ------------------------------------------------------------------ popup / inline UI */

	function T(wcfg, faTxt, enTxt) { return isFa(wcfg) ? faTxt : enTxt; }

	/* ------------------------------------------------------------------ responsive + layout (Elementor-like) */

	/** desktop ≥ 1025px, tablet 640–1024px, mobile < 640px. */
	function deviceOf(width) { width = width || W.innerWidth; return width < 640 ? 'mobile' : (width < 1025 ? 'tablet' : 'desktop'); }
	function setPath(o, path, v) { var p = path.split('.'); for (var i = 0; i < p.length - 1; i++) { var k = p[i]; if (!o[k] || typeof o[k] !== 'object' || Array.isArray(o[k])) o[k] = {}; o = o[k]; } o[p[p.length - 1]] = v; }
	/** The wheel config for one device: base + that device's overrides (style only). */
	function resolveCfg(base, device) {
		var c = JSON.parse(JSON.stringify(base));
		if (!c.layout || Array.isArray(c.layout)) c.layout = {};
		var ov = (base.responsive && base.responsive[device]) || {};
		if (device !== 'desktop' && ov && !Array.isArray(ov)) for (var k in ov) if (Object.prototype.hasOwnProperty.call(ov, k)) setPath(c, k, ov[k]);
		c.device = device;
		return c;
	}
	/** Movable elements → selectors (also used by the admin live editor). */
	var LAYOUT_MAP = {
		logo: '.bchw-head .bchw-logo', badge: '.bchw-head .bchw-badge', title: '.bchw-head .bchw-title', subtitle: '.bchw-head .bchw-subtitle', desc: '.bchw-head .bchw-desc',
		countdown: '.bchw-countdown', social: '.bchw-social', fields: '.bchw-form > .bchw-field, .bchw-form > .bchw-row, .bchw-form > .bchw-consent, .bchw-form > .bchw-marketing',
		otp: '.bchw-otp', button: '.bchw-spin-btn', nothanks: '.bchw-nothanks', close: '.bchw-close', wheel: '.bchw-stage', trust: '.bchw-trust', footer: '.bchw-footer',
		result: '.bchw-view-result > .bchw-res-ic, .bchw-view-result > .bchw-title, .bchw-view-result > .bchw-res-text', code: '.bchw-codebox', actions: '.bchw-btn-apply, .bchw-btn-ghost'
	};
	var LAYOUT_INLINE = { badge: 1, social: 1, nothanks: 1, logo: 1, countdown: 1 };
	function applyLayout(scope, layout) {
		layout = layout || {};
		Object.keys(LAYOUT_MAP).forEach(function (key) {
			var L = layout[key] || {};
			$$(LAYOUT_MAP[key], scope).forEach(function (n) {
				n.setAttribute('data-bch-el', key);
				var s = n.style;
				s.removeProperty('--bch-tx'); s.removeProperty('--bch-ty');
				if (+L.x) s.setProperty('--bch-tx', (+L.x) + 'px');
				if (+L.y) s.setProperty('--bch-ty', (+L.y) + 'px');
				s.marginBlockStart = L.mt !== undefined && L.mt !== '' ? (+L.mt) + 'px' : '';
				s.marginBlockEnd = L.mb !== undefined && L.mb !== '' ? (+L.mb) + 'px' : '';
				s.width = +L.w > 0 && key !== 'wheel' && key !== 'close' ? (+L.w) + '%' : '';
				if (L.align && key !== 'wheel' && key !== 'close') {
					s.textAlign = L.align;
					if (LAYOUT_INLINE[key] || +L.w > 0 || key === 'button' || key === 'actions') {
						if (LAYOUT_INLINE[key] && !(+L.w > 0)) s.width = 'fit-content';
						if (LAYOUT_INLINE[key]) s.display = key === 'social' ? 'flex' : 'block';
						s.marginInlineStart = L.align === 'start' ? '0' : 'auto';
						s.marginInlineEnd = L.align === 'end' ? '0' : 'auto';
					}
				} else { s.textAlign = ''; s.marginInlineStart = ''; s.marginInlineEnd = ''; if (LAYOUT_INLINE[key] && n.style.display !== 'none') s.display = ''; }
				if (L.hide) s.setProperty('display', 'none', 'important'); else if (s.getPropertyValue('display') === 'none') s.removeProperty('display');
			});
		});
	}

	function Instance(wcfg, opts) {
		this.opts = opts || {};
		this.base = wcfg;
		this.device = this.opts.device || (this.opts.mobile !== undefined ? (this.opts.mobile ? 'mobile' : 'desktop') : deviceOf());
		this.w = resolveCfg(wcfg, this.device);
		this.state = wcfg.state || { can: true };
		this.inline = !!this.opts.container; this.preview = !!this.opts.preview;
		this.key = 'bch_w_' + wcfg.id;
		this.mem = store(this.key) || {};
		this.otpPhone = session.user && session.user.verified ? session.user.verified : '';
		this.fillStart = 0;
		instances[wcfg.id] = this;
	}
	Instance.prototype.isMobile = function () {
		return this.opts.mobile !== undefined ? !! this.opts.mobile : this.device === 'mobile';
	};
	Instance.prototype.save = function () { if (!this.preview) store(this.key, this.mem); };
	Instance.prototype.vars = function () {
		var p = this.w.popup, f = this.w.form, d = this.w.design;
		var v = {
			'--bchw-accent': p.accent_color, '--bchw-text': p.text_color, '--bchw-muted': p.muted_color, '--bchw-radius': p.radius + 'px', '--bchw-pad': p.padding + 'px',
			'--bchw-width': p.width + 'px', '--bchw-btn-bg': f.button_bg, '--bchw-btn-bg2': f.button_bg2 || f.button_bg, '--bchw-btn-color': f.button_color, '--bchw-btn-radius': f.button_radius + 'px',
			'--bchw-field-bg': f.field_bg, '--bchw-field-border': f.field_border, '--bchw-field-text': f.field_text, '--bchw-field-radius': f.field_radius + 'px',
			'--bchw-title': p.title_color, '--bchw-title-size': p.title_size + 'px', '--bchw-title-weight': p.title_weight, '--bchw-sub': p.subtitle_color,
			'--bchw-overlay': p.overlay_color, '--bchw-overlay-op': p.overlay_opacity, '--bchw-blur': p.overlay_blur + 'px', '--bchw-pattern': p.pattern_color,
			'--bchw-close': p.close_color, '--bchw-close-bg': p.close_bg, '--bchw-badge-bg': p.badge_bg, '--bchw-badge-color': p.badge_color,
			'--bchw-anim': p.anim_duration + 'ms', '--bchw-scale': p.font_scale, '--bchw-border': p.border_color, '--bchw-border-w': p.border_width + 'px',
			'--bchw-wheel': d.size + 'px', '--bchw-wheel-m': d.size_mobile + 'px', '--bchw-z': CFG.z || 999999,
			'--bchw-bar-bg': this.w.display.coupon_bar_bg, '--bchw-bar-color': this.w.display.coupon_bar_color
		};
		// Optional colors: empty = derived from the accent/theme.
		var opt = { code_bg: '--bchw-code-bg', code_border: '--bchw-code-border', code_color: '--bchw-code-color', copy_bg: '--bchw-copy-bg', copy_color: '--bchw-copy-color',
			apply_bg: '--bchw-apply-bg', apply_color: '--bchw-apply-color', ghost_color: '--bchw-ghost', link_color: '--bchw-link', msg_bg: '--bchw-msg-bg', msg_color: '--bchw-msg-color',
			next_color: '--bchw-next', ticker_bg: '--bchw-ticker-bg', ticker_color: '--bchw-ticker-color', social_color: '--bchw-social-color', social_dot_color: '--bchw-social-dot',
			countdown_bg: '--bchw-cd-bg', countdown_color: '--bchw-cd-color' };
		for (var k in opt) if (p[k]) v[opt[k]] = p[k];
		if (p.apply_bg) v['--bchw-apply-bg2'] = p.apply_bg2 || p.apply_bg;
		if (f.otp_bg) v['--bchw-otp-bg'] = f.otp_bg;
		if (f.otp_color) v['--bchw-otp-color'] = f.otp_color;
		if (f.label_color) v['--bchw-label'] = f.label_color;
		if (p.bg_type === 'gradient') v['--bchw-bg'] = 'linear-gradient(' + p.bg_angle + 'deg,' + p.bg_color + ',' + (p.bg_color2 || p.bg_color) + ')';
		else if (p.bg_type === 'glass') v['--bchw-bg'] = 'linear-gradient(' + p.bg_angle + 'deg,' + p.bg_color + ',' + (p.bg_color2 || p.bg_color) + ')';
		else v['--bchw-bg'] = p.bg_color;
		return v;
	};
	Instance.prototype.dir = function () {
		var p = this.w.popup.direction;
		if (p === 'rtl' || p === 'ltr') return p;
		return isFa(this.w) || CFG.rtl ? 'rtl' : 'ltr';
	};
	Instance.prototype.build = function () {
		var w = this.w, p = w.popup, self = this;
		var mobile = this.isMobile();
		var mode = this.inline ? 'inline' : (mobile ? (p.mobile_mode === 'modal' ? 'modal' : p.mobile_mode) : p.mode);
		var root = el('div', { class: 'bchw bchw-theme-' + (w.design.theme || 'classic') + ' bchw-mode-' + mode + (mobile ? ' is-mobile' : '') + (this.preview ? ' is-preview' : '') + ' ' + (p.custom_class || ''), dir: this.dir(), 'data-wheel': w.id, style: this.vars() });
		if (CFG.font === 'vazirmatn') root.classList.add('bchw-font-vazir');
		if (p.custom_css) root.appendChild(el('style', { text: p.custom_css }));
		if (!this.inline) {
			root.appendChild(el('div', { class: 'bchw-overlay', onclick: function () { if (p.close_overlay) self.close('overlay'); } }));
		}
		var layout = mobile ? 'stack' : p.layout;
		var dialog = el('div', { class: 'bchw-dialog bchw-layout-' + layout + ' bchw-side-' + p.wheel_side + ' bchw-bg-' + p.bg_type + ' bchw-shadow-' + p.shadow + ' bchw-in-' + p.anim_in + ' bchw-code-' + (p.code_style || 'dashed') + ' bchw-share-' + (p.share_style || 'brand') + (p.apply_bg ? ' has-apply-color' : '') + (mobile && p.mobile_wheel_first ? ' is-wheel-first' : '') + (mobile && p.mobile_hide_desc ? ' is-hide-desc' : ''), role: this.inline ? 'region' : 'dialog', 'aria-modal': this.inline ? null : 'true', 'aria-label': w.popup.title || w.title });
		if (p.bg_type === 'image' && p.bg_image) dialog.appendChild(el('div', { class: 'bchw-bgimg', style: { 'background-image': 'url("' + p.bg_image.replace(/"/g, '') + '")', opacity: p.bg_image_opacity } }));
		if (p.pattern && p.pattern !== 'none') dialog.appendChild(el('div', { class: 'bchw-pattern bchw-pat-' + p.pattern, 'aria-hidden': 'true' }));
		if (!this.inline && p.close_show) {
			var close = el('button', { type: 'button', class: 'bchw-close bchw-close-' + p.close_style + ' bchw-close-pos-' + p.close_position, 'aria-label': T(w, 'بستن', 'Close'), onclick: function () { self.close('button'); } }, [p.close_style === 'text' ? T(w, 'بستن', 'Close') : '×']);
			if (+p.close_delay > 0) { close.style.visibility = 'hidden'; setTimeout(function () { close.style.visibility = ''; }, p.close_delay * 1000); }
			dialog.appendChild(close);
		}
		var stage = el('div', { class: 'bchw-stage' });
		var wheelBox = el('div', { class: 'bchw-wheelbox' });
		stage.appendChild(wheelBox);
		if (w.design.mute_button && w.design.sound) {
			var mute = el('button', { type: 'button', class: 'bchw-mute' + (Sound.muted ? ' is-muted' : ''), 'aria-label': T(w, 'صدا', 'Sound'), onclick: function () { Sound.muted = !Sound.muted; store('bch_muted', Sound.muted ? 1 : null); mute.classList.toggle('is-muted', Sound.muted); mute.innerHTML = Sound.muted ? '🔇' : '🔊'; } });
			mute.innerHTML = Sound.muted ? '🔇' : '🔊';
			stage.appendChild(mute);
		}
		var panel = el('div', { class: 'bchw-panel' });
		var body = el('div', { class: 'bchw-body' }, [stage, panel]);
		dialog.appendChild(body);
		if (p.ticker && w.winners && w.winners.length) dialog.appendChild(this.ticker());
		if (CFG.powered) dialog.appendChild(el('div', { class: 'bchw-powered', html: 'ARIAGH.<b>BECHARKHOON</b>' }));
		root.appendChild(dialog);
		this.root = root; this.dialog = dialog; this.panel = panel; this.stage = stage; this.wheelBox = wheelBox;
		if (this.inline) { this.opts.container.innerHTML = ''; this.opts.container.appendChild(root); }
		else D.body.appendChild(root);
		this.sizeWheel();
		this.wheel = new Wheel(wheelBox, w, { static: this.opts.static });
		if (w.design.center_clickable && this.wheel.hub) {
			this.wheel.hub.addEventListener('click', function () { self.onSpinClick(); });
			this.wheel.hub.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.onSpinClick(); } });
		}
		this.view();
		if (!this.inline) {
			this.keyHandler = function (e) { if (e.key === 'Escape' && p.close_esc) self.close('esc'); if (e.key === 'Tab') self.trap(e); };
			D.addEventListener('keydown', this.keyHandler);
		}
		this.applyLayout();
		this.resizeHandler = function () {
			// Crossing a breakpoint (desktop/tablet/mobile): rebuild with that device's design.
			var dev = deviceOf();
			if (!self.preview && !self.opts.device && dev !== self.device && self.root && !(self.wheel && self.wheel.spinning)) {
				var open = self.root.classList.contains('is-open'), st = self.state;
				W.removeEventListener('resize', self.resizeHandler);
				if (self.keyHandler) D.removeEventListener('keydown', self.keyHandler);
				if (self.wheel) self.wheel.stopIdle();
				self.root.remove(); self.root = null;
				self.device = dev; self.w = resolveCfg(self.base, dev); self.w.state = st; self.state = st;
				self.build();
				if (open) self.root.classList.add('is-open');
				return;
			}
			self.sizeWheel(); self.fit();
		};
		W.addEventListener('resize', this.resizeHandler);
	};
	Instance.prototype.applyLayout = function () {
		if (this.root) applyLayout(this.root, this.w.layout);
	};
	/**
	 * Fit to screen: no inner scrolling — first tighten spacing, then shrink the wheel
	 * until the whole popup (title, fields, buttons) fits the viewport.
	 */
	Instance.prototype.fit = function () {
		var self = this, dlg = this.dialog;
		if (!dlg || this.inline || this.preview || !this.w.popup.fit_screen) return;
		cancelAnimationFrame(this.fitRaf);
		this.fitRaf = requestAnimationFrame(function () {
			dlg.classList.remove('is-tight');
			self.sizeWheel();
			var over = function () { return dlg.scrollHeight - dlg.clientHeight; };
			if (over() <= 1) return;
			dlg.classList.add('is-tight');
			for (var i = 0; i < 6 && over() > 1; i++) {
				var cur = self.wheelBox.offsetWidth, next = Math.max(150, Math.floor(cur - over() - 6));
				if (next >= cur) break;
				self.wheelBox.style.width = self.wheelBox.style.height = next + 'px';
				if (self.wheel && self.wheel.resize) self.wheel.resize();
			}
		});
	};
	Instance.prototype.trap = function (e) {
		var f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', this.dialog).filter(function (n) { return !n.disabled && n.offsetParent !== null; });
		if (!f.length) return;
		var first = f[0], last = f[f.length - 1];
		if (e.shiftKey && D.activeElement === first) { e.preventDefault(); last.focus(); }
		else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); first.focus(); }
	};
	Instance.prototype.sizeWheel = function () {
		var mobile = this.isMobile(), d = this.w.design;
		var max = mobile ? Math.min(+d.size_mobile || 300, W.innerWidth - 40) : (+d.size || 400);
		if (!this.inline && !mobile) max = Math.min(max, W.innerHeight - 120);
		if (this.inline && this.opts.container && !this.preview) max = Math.min(max, (this.opts.container.clientWidth || max) - 8);
		if (this.preview && mobile) max = Math.min(+d.size_mobile || 300, 350);
		if (this.w.popup.mode === 'slidein' && !mobile && !this.inline) max = Math.min(max, 260);
		this.wheelBox.style.width = this.wheelBox.style.height = Math.max(180, max) + 'px';
	};
	Instance.prototype.ticker = function () {
		var w = this.w, box = el('div', { class: 'bchw-ticker', 'aria-hidden': 'true' }), track = el('div', { class: 'bchw-ticker__track' });
		var items = w.winners.map(function (x) { return el('span', { text: '🏆 ' + tpl(w.popup.ticker_text, { name: x.name, prize: x.prize, ago: x.ago }) }); });
		items.concat(items.map(function (n) { return n.cloneNode(true); })).forEach(function (n) { track.appendChild(n); });
		box.appendChild(track);
		return box;
	};

	/** Header (logo, badge, title…) shared by every view. */
	Instance.prototype.header = function () {
		var w = this.w, p = w.popup, h = el('div', { class: 'bchw-head' });
		if (p.logo) h.appendChild(el('img', { class: 'bchw-logo', src: p.logo, alt: '', style: { width: p.logo_width + 'px' } }));
		if (p.badge) h.appendChild(el('span', { class: 'bchw-badge', text: p.badge }));
		if (p.title) h.appendChild(el('h2', { class: 'bchw-title', text: p.title }));
		if (p.subtitle) h.appendChild(el('p', { class: 'bchw-subtitle', text: p.subtitle }));
		if (p.description) h.appendChild(el('div', { class: 'bchw-desc', html: p.description }));
		if (p.countdown) { var cd = this.countdown(); if (cd) h.appendChild(cd); }
		if (p.social_proof && w.social >= (+p.social_min || 0) && w.social > 0) h.appendChild(el('div', { class: 'bchw-social', html: '<i></i>' + esc(tpl(p.social_text, { count: fa(w.social) })) }));
		return h;
	};
	Instance.prototype.countdown = function () {
		var w = this.w, p = w.popup, end;
		if (p.countdown_mode === 'fixed') end = (+p.countdown_ts || 0) * 1000;
		else {
			if (!this.mem.cd) { this.mem.cd = Date.now() + (+p.countdown_minutes || 15) * 60000; this.save(); }
			end = this.mem.cd;
			if (end < Date.now()) { this.mem.cd = Date.now() + (+p.countdown_minutes || 15) * 60000; this.save(); end = this.mem.cd; }
		}
		if (!end || end < Date.now()) return null;
		var box = el('div', { class: 'bchw-countdown bchw-cd-' + p.countdown_style }, [el('span', { class: 'bchw-cd-label', text: p.countdown_label })]);
		var digits = el('span', { class: 'bchw-cd-digits', dir: 'ltr' });
		box.appendChild(digits);
		function upd() {
			var s = Math.max(0, Math.floor((end - Date.now()) / 1000));
			if (p.countdown_style === 'boxes') {
				var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
				digits.innerHTML = [h, m, ss].map(function (n) { return '<b>' + fa((n < 10 ? '0' : '') + n) + '</b>'; }).join('<i>:</i>');
			} else digits.textContent = fmtDuration(s, w);
			if (s > 0 && D.body.contains(box)) setTimeout(upd, 1000);
		}
		upd();
		return box;
	};

	/** Decide which view to show from the eligibility state. */
	Instance.prototype.view = function () {
		var st = this.state || {}, w = this.w;
		if (st.can || (this.preview && !this.forceState)) return this.formView();
		switch (st.reason) {
			case 'login': return this.messageView(st.message || w.form.login_text, 'login');
			case 'cooldown': case 'limit': case 'max_wins': return this.messageView(st.message, 'wait');
			case 'no_credits': case 'identify': return this.messageView(st.message || w.messages.no_spins_text, 'earn');
			case 'closed': return this.messageView(st.message || w.messages.closed_text, 'closed');
			default: return this.messageView(st.message || w.messages.not_eligible_text, 'blocked');
		}
	};
	Instance.prototype.setPanel = function (nodes, cls) {
		this.panel.innerHTML = '';
		var v = el('div', { class: 'bchw-view ' + (cls || '') });
		nodes.forEach(function (n) { if (n) v.appendChild(n); });
		this.panel.appendChild(v);
		this.dialog.classList.remove('is-result', 'is-win', 'is-lose');
		var self = this;
		setTimeout(function () { self.applyLayout(); self.fit(); }, 0);
		return v;
	};
	Instance.prototype.button = function (text, onclick, cls) {
		var f = this.w.form;
		return el('button', { type: 'button', class: 'bchw-btn bchw-btn-' + f.button_size + ' bchw-btn-anim-' + f.button_animation + (f.button_full ? ' is-full' : '') + ' ' + (cls || ''), onclick: onclick }, [el('span', { text: text })]);
	};
	Instance.prototype.messageView = function (msg, kind) {
		var w = this.w, self = this, nodes = [this.header()];
		var pp = w.popup, icon = { login: pp.icon_login || '🔐', wait: pp.icon_wait || '⏳', earn: pp.icon_earn || '🎟️', closed: pp.icon_closed || '🏁', blocked: '🚫' }[kind] || 'ℹ️';
		var box = el('div', { class: 'bchw-msg bchw-msg-' + kind }, [el('div', { class: 'bchw-msg__ic', text: icon }), el('p', { class: 'bchw-msg__text', text: msg || '' })]);
		nodes.push(box);
		if (kind === 'wait' && this.state.next_at) {
			var cdn = el('div', { class: 'bchw-next' });
			var end = this.state.next_at * 1000;
			var upd = function () { var s = (end - Date.now()) / 1000; cdn.textContent = fmtDuration(s, w); if (s > 0 && D.body.contains(cdn)) setTimeout(upd, 1000); else if (s <= 0) self.refresh(); };
			upd(); nodes.push(cdn);
		}
		if (kind === 'login') {
			var url = (w.login_url || CFG.home) + ((w.login_url || '').indexOf('?') > -1 ? '&' : '?') + 'redirect_to=' + encodeURIComponent(location.href.split('#')[0] + '#bch-open-' + w.id);
			nodes.push(el('a', { class: 'bchw-btn bchw-btn-lg is-full bchw-btn-login', href: url }, [el('span', { text: w.form.login_button })]));
		}
		if (kind === 'earn') {
			if (w.earn && w.earn.length) {
				nodes.push(el('h4', { class: 'bchw-earn-title', text: w.messages.earn_title }));
				nodes.push(el('ul', { class: 'bchw-earn' }, w.earn.map(function (e) { return el('li', { text: e }); })));
			}
			if (w.messages.earn_text) nodes.push(el('div', { class: 'bchw-desc', html: w.messages.earn_text }));
			if (this.state.reason === 'identify') {
				nodes.push(this.otpBlock(true)); // Granted spins live on the mobile number.
				var lurl = (w.login_url || CFG.home) + ((w.login_url || '').indexOf('?') > -1 ? '&' : '?') + 'redirect_to=' + encodeURIComponent(location.href.split('#')[0] + '#bch-open-' + w.id);
				nodes.push(el('a', { class: 'bchw-link', href: lurl, text: w.form.login_button }));
			}
		}
		if (w.ref_link && w.messages.show_share && kind !== 'login') nodes.push(this.share());
		if (!this.inline) nodes.push(el('button', { type: 'button', class: 'bchw-nothanks', text: T(w, 'بستن', 'Close'), onclick: function () { self.close('button'); } }));
		this.setPanel(nodes, 'bchw-view-msg');
	};
	Instance.prototype.refresh = function () {
		var self = this;
		if (this.preview) return;
		api('state', { wheel_id: this.w.id, ctx: clientCtx() }).then(function (r) { if (r && r.ok && r.state) { self.state = r.state; self.view(); updateBadges(); } });
	};

	/** Phone + OTP block. standalone=true when shown outside the main form. */
	Instance.prototype.otpBlock = function (standalone) {
		var w = this.w, self = this;
		var wrap = el('div', { class: 'bchw-otp' + (standalone ? ' is-standalone' : '') });
		var phone = standalone ? el('input', { type: 'tel', class: 'bchw-input', inputmode: 'tel', autocomplete: 'tel', placeholder: '09xxxxxxxxx', dir: 'ltr', 'aria-label': T(w, 'شماره موبایل', 'Mobile') }) : null;
		var send = el('button', { type: 'button', class: 'bchw-btn-sec', text: w.form.otp_send_text });
		var code = el('input', { type: 'text', class: 'bchw-input bchw-otp-code', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 8, placeholder: w.form.otp_label, dir: 'ltr', hidden: true });
		var msg = el('div', { class: 'bchw-field-msg' });
		if (phone) wrap.appendChild(phone);
		wrap.appendChild(el('div', { class: 'bchw-otp-row' }, [code, send]));
		wrap.appendChild(msg);
		var getPhone = function () { if (phone) return phone.value; var f = $('[data-map="phone"]', self.panel); return f ? f.value : ''; };
		var timer = null;
		send.addEventListener('click', function () {
			var ph = getPhone();
			if (!ph) { msg.textContent = T(w, 'ابتدا شماره موبایل را وارد کنید.', 'Enter your mobile number first.'); return; }
			send.disabled = true; msg.textContent = '';
			if (self.preview) { code.hidden = false; msg.textContent = T(w, 'پیش‌نمایش: کد ارسال نمی‌شود.', 'Preview: no SMS is sent.'); send.disabled = false; return; }
			api('otp_send', { phone: ph, token: session.token, wheel_id: w.id }).then(function (r) {
				msg.textContent = r.message || ''; msg.className = 'bchw-field-msg ' + (r.ok ? 'is-ok' : 'is-err');
				var left = +r.resend || 0;
				// Sent now, or a code was already sent moments ago (resend cooldown) → let the user type it.
				if (r.ok || left > 0) { code.hidden = false; code.focus(); self.otpPhone = ''; }
				if (left > 0) {
					clearInterval(timer);
					timer = setInterval(function () { left--; send.textContent = left > 0 ? fa(left) + 's' : w.form.otp_send_text; if (left <= 0) { clearInterval(timer); send.disabled = false; } }, 1000);
				} else send.disabled = false;
			});
		});
		code.addEventListener('input', function () {
			var v = code.value.replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/\D/g, '');
			if (v.length === (+CFG.otpLen || 5)) self.verifyOtp(getPhone(), v, msg, code, standalone);
		});
		code.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); self.verifyOtp(getPhone(), code.value, msg, code, standalone); } });
		this.otpUi = { code: code, msg: msg, send: send, getPhone: getPhone };
		return wrap;
	};
	Instance.prototype.verifyOtp = function (phone, codeVal, msg, codeEl, standalone) {
		var self = this, w = this.w;
		if (this.verifying) return this.verifying;
		this.verifying = api('otp_verify', { phone: phone, code: codeVal, wheel_id: w.id, ctx: clientCtx(), name: (function () { var n = self.panel && $('[data-map="name"]', self.panel); return n ? n.value : ''; })() }).then(function (r) {
			self.verifying = null;
			msg.textContent = r.ok ? T(w, 'شماره تایید شد ✓', 'Number verified ✓') : (r.message || '');
			msg.className = 'bchw-field-msg ' + (r.ok ? 'is-ok' : 'is-err');
			if (r.ok) {
				session.otp = r.otp_token; session.phone = r.phone; self.otpPhone = r.phone;
				otpStore({ t: r.otp_token, p: r.phone });
				if (r.logged_in) { session.loggedIn = true; try { D.dispatchEvent(new CustomEvent('becharkhoon:login', { detail: { created: !!r.user_created } })); } catch (e) {} }
				codeEl.disabled = true;
				if (r.state) { self.state = r.state; if (standalone) self.view(); updateBadges(); }
			}
			return r.ok;
		});
		return this.verifying;
	};

	Instance.prototype.formView = function () {
		var w = this.w, f = w.form, self = this, nodes = [this.header()];
		var form = el('form', { class: 'bchw-form', novalidate: true, onsubmit: function (e) { e.preventDefault(); self.onSpinClick(); } });
		var pre = (session.user && session.user.prefill) || {};
		var known = session.user && session.user.logged_in && f.hide_known;
		var row = null;
		(f.fields || []).forEach(function (fd) {
			var mobile = self.isMobile();
			if ((mobile && !fd.mobile) || (!mobile && !fd.desktop)) return;
			var val = f.prefill_user && pre[fd.map] ? pre[fd.map] : '';
			if (known && val && ['name', 'email', 'phone'].indexOf(fd.map) > -1 && !(fd.map === 'phone' && w.access.require_otp && !self.otpPhone)) return;
			var input, id = 'bchw-' + w.id + '-' + fd.id;
			var common = { id: id, name: fd.id, class: 'bchw-input', 'data-map': fd.map, 'data-id': fd.id, placeholder: fd.placeholder || fd.label, required: fd.required, 'aria-label': fd.label || fd.placeholder };
			if (fd.type === 'select') {
				input = el('select', common, [el('option', { value: '', text: fd.placeholder || fd.label || '—' })].concat(String(fd.options || '').split(/\r?\n/).filter(Boolean).map(function (o) { return el('option', { value: o, text: o }); })));
			} else if (fd.type === 'textarea') {
				input = el('textarea', Object.assign(common, { rows: 2 }));
			} else if (fd.type === 'checkbox') {
				input = el('label', { class: 'bchw-check' }, [el('input', { type: 'checkbox', id: id, name: fd.id, 'data-map': fd.map, 'data-id': fd.id, value: '1' }), el('span', { text: fd.label })]);
			} else if (fd.type === 'radio') {
				input = el('div', { class: 'bchw-radios', 'data-id': fd.id, 'data-map': fd.map }, String(fd.options || '').split(/\r?\n/).filter(Boolean).map(function (o, i) { return el('label', { class: 'bchw-check' }, [el('input', { type: 'radio', name: id, value: o, checked: i === 0 && fd.required }), el('span', { text: o })]); }));
			} else {
				var t = { tel: 'tel', email: 'email', number: 'number', date: 'date' }[fd.type] || 'text';
				input = el('input', Object.assign(common, { type: t, value: val, dir: (t === 'tel' || t === 'email') ? 'ltr' : null, inputmode: t === 'tel' ? 'tel' : null, autocomplete: { name: 'name', email: 'email', phone: 'tel' }[fd.map] || null }));
			}
			var wrap = el('div', { class: 'bchw-field bchw-w-' + fd.width + ' bchw-type-' + fd.type }, [fd.type !== 'checkbox' && fd.label && fd.type !== 'radio' ? el('label', { class: 'bchw-label', for: id, text: fd.label + (fd.required ? ' *' : '') }) : null, input, el('div', { class: 'bchw-field-msg' })]);
			if (fd.type === 'radio' && fd.label) wrap.insertBefore(el('span', { class: 'bchw-label', text: fd.label }), wrap.firstChild);
			if (fd.width === 'half') { if (!row) { row = el('div', { class: 'bchw-row' }); form.appendChild(row); } row.appendChild(wrap); if (row.children.length >= 2) row = null; }
			else { row = null; form.appendChild(wrap); }
			if (fd.map === 'phone' && w.access.require_otp && !(self.otpPhone && self.otpPhone === val)) {
				form.appendChild(self.otpBlock(false));
			}
		});
		if (f.consent && f.consent.enabled) form.appendChild(el('label', { class: 'bchw-check bchw-consent' }, [el('input', { type: 'checkbox', name: '_consent', 'data-id': '_consent' }), el('span', { html: f.consent.text })]));
		if (f.marketing && f.marketing.enabled) form.appendChild(el('label', { class: 'bchw-check bchw-marketing' }, [el('input', { type: 'checkbox', name: '_marketing', checked: f.marketing.checked }), el('span', { html: esc(f.marketing.text) })]));
		form.appendChild(el('input', { type: 'text', name: 'website', class: 'bchw-hp', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' }));
		if (CFG.captcha && CFG.captcha.type && CFG.captcha.type !== 'off' && !(session.user && session.user.logged_in) && !this.preview) form.appendChild(this.captchaBox());
		var btnText = f.button_text;
		var st = this.state || {};
		var btn = this.button(btnText, null, 'bchw-spin-btn');
		btn.type = 'submit';
		form.appendChild(btn);
		var info = this.leftText();
		if (info) form.appendChild(el('div', { class: 'bchw-left', text: info }));
		form.appendChild(el('div', { class: 'bchw-form-msg', role: 'alert' }));
		nodes.push(form);
		if (w.popup.trust_items && w.popup.trust_items.length) nodes.push(el('ul', { class: 'bchw-trust' }, w.popup.trust_items.map(function (t) { return el('li', { text: t }); })));
		if (!this.inline && w.popup.no_thanks) nodes.push(el('button', { type: 'button', class: 'bchw-nothanks', text: w.popup.no_thanks_text, onclick: function () { self.mem.nothx = Date.now(); self.save(); self.close('nothanks'); } }));
		if (w.popup.footer_text) nodes.push(el('div', { class: 'bchw-footer', html: w.popup.footer_text }));
		this.form = form; this.spinBtn = btn;
		form.addEventListener('focusin', function () { if (!self.fillStart) { self.fillStart = Date.now(); track(w.id, 'form'); } });
		this.setPanel(nodes, 'bchw-view-form');
		if (st && st.via === 'credit' && st.credits) { /* spins badge shown via leftText */ }
	};
	Instance.prototype.leftText = function () {
		var st = this.state || {}, w = this.w, n = 0;
		if (st.via === 'bonus') return w.messages.respin_text;
		if (st.credits > 0) n += st.credits;
		if (st.free_left > 0 && st.free_left < 999) n += st.free_left;
		if (n > 1 || st.credits > 0) return tpl(w.messages.spins_left_text, { n: fa(n) });
		return '';
	};
	Instance.prototype.captchaBox = function () {
		var box = el('div', { class: 'bchw-captcha' }), c = CFG.captcha, self = this;
		var load = function (src, cb) { if (D.querySelector('script[src^="' + src.split('?')[0] + '"]')) { cb(); return; } var s = el('script', { src: src, async: true }); s.onload = cb; D.head.appendChild(s); };
		this.captchaVal = function () { return self._captcha || ''; };
		if (c.type === 'recaptcha_v2') {
			load('https://www.google.com/recaptcha/api.js?render=explicit', function () { var tries = 0; (function r() { if (W.grecaptcha && W.grecaptcha.render) { W.grecaptcha.ready(function () { W.grecaptcha.render(box, { sitekey: c.key, callback: function (t) { self._captcha = t; } }); }); } else if (tries++ < 50) setTimeout(r, 200); })(); });
		} else if (c.type === 'recaptcha_v3') {
			load('https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(c.key), function () {});
			this.captchaVal = function () { return new Promise(function (res) { if (!W.grecaptcha) return res(''); W.grecaptcha.ready(function () { W.grecaptcha.execute(c.key, { action: 'spin' }).then(res, function () { res(''); }); }); }); };
		} else if (c.type === 'turnstile') {
			load('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', function () { var tries = 0; (function r() { if (W.turnstile) W.turnstile.render(box, { sitekey: c.key, callback: function (t) { self._captcha = t; } }); else if (tries++ < 50) setTimeout(r, 200); })(); });
		} else if (c.type === 'hcaptcha') {
			load('https://js.hcaptcha.com/1/api.js?render=explicit', function () { var tries = 0; (function r() { if (W.hcaptcha) W.hcaptcha.render(box, { sitekey: c.key, callback: function (t) { self._captcha = t; } }); else if (tries++ < 50) setTimeout(r, 200); })(); });
		} else if (c.type === 'arcaptcha') {
			box.className += ' arcaptcha'; box.setAttribute('data-site-key', c.key); box.setAttribute('data-callback', 'bchArcaptcha');
			W.bchArcaptcha = function (t) { self._captcha = t; };
			load('https://widget.arcaptcha.ir/1/api.js', function () {});
		}
		return box;
	};
	Instance.prototype.collect = function () {
		var out = { fields: {}, consent: false, marketing: false, hp: '' }, self = this;
		$$('[data-id]', this.form).forEach(function (n) {
			var id = n.getAttribute('data-id');
			if (id === '_consent') { out.consent = n.checked; return; }
			if (n.classList.contains('bchw-radios')) { var c = $('input:checked', n); out.fields[id] = c ? c.value : ''; return; }
			if (n.type === 'checkbox') out.fields[id] = n.checked ? '1' : '';
			else if (n.tagName !== 'DIV' && n.tagName !== 'LABEL') out.fields[id] = n.value;
		});
		var mk = $('input[name="_marketing"]', this.form); out.marketing = !!(mk && mk.checked);
		var hp = $('.bchw-hp', this.form); out.hp = hp ? hp.value : '';
		void self;
		return out;
	};
	Instance.prototype.fieldError = function (id, msg) {
		$$('.bchw-field.has-err', this.form).forEach(function (n) { n.classList.remove('has-err'); var m = $('.bchw-field-msg', n); if (m) m.textContent = ''; });
		var gm = $('.bchw-form-msg', this.form); if (gm) gm.textContent = '';
		var target = id ? $('[data-id="' + id + '"]', this.form) : null;
		var field = target ? target.closest('.bchw-field') : null;
		if (field) { field.classList.add('has-err'); var fm = $('.bchw-field-msg', field); if (fm) fm.textContent = msg; try { (target.focus || function () {}).call(target); } catch (e) {} }
		else if (gm) gm.textContent = msg || '';
		if (this.form) { this.form.classList.remove('bchw-shake'); void this.form.offsetWidth; this.form.classList.add('bchw-shake'); }
	};
	Instance.prototype.validate = function (data) {
		var w = this.w, fields = w.form.fields || [];
		for (var i = 0; i < fields.length; i++) {
			var fd = fields[i], v = (data.fields[fd.id] || '').trim();
			if (!$('[data-id="' + fd.id + '"]', this.form)) continue;
			if (fd.required && !v) return this.fieldError(fd.id, T(w, 'این فیلد الزامی است.', 'This field is required.')), false;
			if (v && fd.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return this.fieldError(fd.id, T(w, 'ایمیل معتبر نیست.', 'Invalid email.')), false;
			if (v && fd.type === 'tel') {
				var ph = v.replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/[^\d+]/g, '').replace(/^(\+98|0098|98)/, '0');
				if (/^9\d{9}$/.test(ph)) ph = '0' + ph;
				if (!/^09\d{9}$/.test(ph) && !/^\+?\d{8,15}$/.test(ph)) return this.fieldError(fd.id, T(w, 'شماره موبایل معتبر نیست.', 'Invalid mobile number.')), false;
			}
		}
		if (w.form.consent && w.form.consent.enabled && w.form.consent.required && !data.consent) return this.fieldError(null, T(w, 'لطفاً قوانین را بپذیرید.', 'Please accept the terms.')), false;
		return true;
	};
	Instance.prototype.onSpinClick = function () {
		var self = this, w = this.w;
		if (this.busy || (this.wheel && this.wheel.spinning)) return;
		if (!this.form || !this.panel.contains(this.form)) {
			if (this.state && this.state.can) this.formView(); else return;
		}
		var data = this.collect();
		if (!this.preview && !this.validate(data)) return; // Admin preview: test spin without filling the form.
		// OTP gate.
		if (w.access.require_otp && !this.preview) {
			var phoneField = $('[data-map="phone"]', this.form);
			var phoneVal = phoneField ? phoneField.value : (session.user.prefill && session.user.prefill.phone) || '';
			var norm = function (s) { s = String(s || '').replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/[^\d+]/g, '').replace(/^(\+98|0098|98)/, '0'); return /^9\d{9}$/.test(s) ? '0' + s : s; };
			if (!this.otpPhone || norm(this.otpPhone) !== norm(phoneVal)) {
				var ui = this.otpUi;
				if (ui && ui.code && !ui.code.hidden && ui.code.value) {
					this.verifyOtp(phoneVal, ui.code.value, ui.msg, ui.code, false).then(function (ok) { if (ok) self.onSpinClick(); });
					return;
				}
				if (ui && ui.send && !ui.send.disabled) ui.send.click();
				return this.fieldError(null, T(w, 'شماره موبایل را با کد پیامکی تایید کنید.', 'Please verify your mobile with the SMS code.'));
			}
		}
		this.busy = true;
		this.spinBtn && this.spinBtn.classList.add('is-busy');
		var gm = $('.bchw-form-msg', this.form); if (gm) gm.textContent = w.messages.spinning_text;
		Sound.ac();
		emit('spin', { wheel: w.id }); analytics(w, 'spin');
		if (this.preview) return this.demoSpin();
		this.wheel.free();
		var cap = this.captchaVal ? this.captchaVal() : '';
		Promise.resolve(cap).then(function (captcha) {
			return api('spin', { wheel_id: w.id, token: session.token, fields: data.fields, consent: data.consent, marketing: data.marketing, hp: data.hp, t: self.fillStart ? (Date.now() - self.fillStart) / 1000 : 99, captcha: captcha, ctx: clientCtx(), source: self.inline ? 'inline' : (self.source || 'popup') });
		}).then(function (r) {
			if (!r || !r.ok) {
				self.wheel.stop(); self.wheel.startIdle && w.design.idle_rotate && self.wheel.startIdle();
				self.busy = false; self.spinBtn && self.spinBtn.classList.remove('is-busy');
				if (r && r.code === 'token') { return boot(true).then(function () { self.fieldError(r.field, r.message); }); }
				if (r && r.state) { self.state = r.state; self.view(); return; }
				if (r && r.code === 'otp') { self.otpPhone = ''; }
				return self.fieldError(r && r.field, (r && r.message) || w.messages.error_text);
			}
			return self.wheel.spinTo(r.index).then(function () { self.finish(r); });
		});
	};
	Instance.prototype.demoSpin = function () {
		var self = this, n = this.w.slices.length, idx = Math.floor(Math.random() * n), s = this.w.slices[idx];
		var lose = /پوچ|lose|no luck|😅/i.test(s.label + s.icon);
		return this.wheel.spinTo(idx).then(function () {
			self.finish({ ok: true, index: idx, result: lose ? 'lose' : 'win', label: s.label, title: (lose ? self.w.messages.lose_title : self.w.messages.win_title).replace('{name}', '').replace(/\s+([!؛،.,])/g, '$1').trim(), text: lose ? self.w.messages.lose_text : self.w.messages.win_text.replace('{prize}', esc(s.label)), code: lose ? '' : 'WHEEL-DEMO42', expiry: lose ? '' : T(self.w, '۷ روز', '7 days'), apply_url: lose ? '' : '#', state: { can: true, free_left: 1 }, demo: true });
		});
	};
	Instance.prototype.finish = function (r) {
		var w = this.w, d = w.design, self = this;
		this.busy = false;
		this.wheel.highlight(r.index);
		var win = r.result === 'win';
		if (win) { Sound.win(d); Effects.run(d.win_effect, d.win_emoji, d.palette); }
		else if (r.result === 'lose') { Sound.lose(d); if (d.lose_effect === 'shake') { this.dialog.classList.remove('bchw-shake'); void this.dialog.offsetWidth; this.dialog.classList.add('bchw-shake'); } }
		else { Sound.win(d); }
		if (!this.preview) { this.mem.spun = Date.now(); this.save(); }
		if (r.state) this.state = r.state;
		emit(win ? 'win' : r.result, r); analytics(w, win ? 'win' : 'result', { prize: r.label, result: r.result });
		if (win && r.code && w.display.coupon_bar && !this.preview) {
			store('bch_coupon', { w: w.id, sid: r.spin_id || 0, code: r.code, label: r.label, apply: r.apply_url, exp: r.expires_ts || 0, at: Date.now(), st: r.applied && w.display.coupon_bar_hide_applied ? 'applied' : 'active' });
			sstore('bch_bar_closed', null);
		}
		updateBadges();
		setTimeout(function () { self.resultView(r); }, 700);
		if (r.redirect && !this.preview) setTimeout(function () { location.href = r.redirect; }, 4500);
		if (+w.messages.auto_close > 0 && !this.inline && !this.preview) setTimeout(function () { self.close('auto'); }, w.messages.auto_close * 1000 + 700);
	};
	Instance.prototype.resultView = function (r) {
		var w = this.w, m = w.messages, self = this, win = r.result === 'win';
		var nodes = [el('div', { class: 'bchw-res-ic', text: win ? (w.design.win_emoji || '🎉') : (r.result === 'respin' ? '🔁' : '😅') }), el('h2', { class: 'bchw-title', text: r.title || '' }), el('div', { class: 'bchw-res-text', html: r.text || '' })];
		if (r.gift && r.gift.name) {
			var gimg = r.gift.image ? el('img', { class: 'bchw-gift-img', src: r.gift.image, alt: '' }) : el('span', { class: 'bchw-gift-img is-empty', text: '🎁' });
			nodes.push(el('div', { class: 'bchw-gift' }, [
				el('div', { class: 'bchw-gift-head', text: m.gift_text || T(w, '🎁 این محصول برات جایزه اومد!', '🎁 This product is your gift!') }),
				el('div', { class: 'bchw-gift-row' }, [gimg, el('div', { class: 'bchw-gift-info' }, [
					el('b', { class: 'bchw-gift-name', text: r.gift.name }),
					el('span', { class: 'bchw-gift-price' }, [r.gift.price ? el('del', { text: r.gift.price }) : null, el('ins', { text: T(w, 'رایگان', 'Free') })])
				])]),
				m.gift_hint ? el('div', { class: 'bchw-gift-hint', text: m.gift_hint }) : null
			]));
		}
		if (r.code) {
			var codeEl = el('code', { class: 'bchw-code', text: r.code, dir: 'ltr' });
			var copy = el('button', { type: 'button', class: 'bchw-copy', text: m.copy_text, onclick: function () { copyText(r.code).then(function () { copy.textContent = m.copied_text; copy.classList.add('is-ok'); setTimeout(function () { copy.textContent = m.copy_text; copy.classList.remove('is-ok'); }, 2000); }); } });
			nodes.push(el('div', { class: 'bchw-codebox' }, [el('span', { class: 'bchw-code-label', text: m.code_label }), el('div', { class: 'bchw-code-row' }, [codeEl, copy])]));
			if (r.expiry) nodes.push(el('div', { class: 'bchw-expiry', text: tpl(m.expires_text, { expiry: r.expiry }) }));
			if (r.applied) nodes.push(el('div', { class: 'bchw-applied', text: T(w, 'کد روی سبد خرید شما اعمال شد ✓', 'Applied to your cart ✓') }));
		}
		if (r.apply_url && r.apply_url !== '#' && m.apply_redirect !== 'stay') nodes.push(el('a', { class: 'bchw-btn bchw-btn-lg is-full bchw-btn-apply', href: r.apply_url }, [el('span', { text: m.apply_text })]));
		else if (r.apply_url) nodes.push(this.button(m.apply_text, function () { if (r.apply_url !== '#') location.href = r.apply_url; }, 'bchw-btn-apply'));
		if (r.link) nodes.push(el('a', { class: 'bchw-btn bchw-btn-lg is-full bchw-btn-apply', href: r.link, target: '_blank', rel: 'noopener' }, [el('span', { text: r.link_text })]));
		if (r.claim) nodes.push(this.claimForm(r));
		var st = r.state || {};
		if (st.can) {
			var left = this.leftText();
			if (left) nodes.push(el('div', { class: 'bchw-left', text: left }));
			nodes.push(this.button(r.result === 'respin' ? m.spin_again_text : m.spin_again_text, function () { self.wheel.reset(); self.formView(); if (r.result === 'respin' || !(w.form.fields || []).length) self.onSpinClick(); }, r.result === 'respin' ? 'bchw-btn-pulse' : 'bchw-btn-ghost'));
		} else if (st.reason === 'cooldown' && st.next_at) {
			nodes.push(el('div', { class: 'bchw-left', text: st.message || '' }));
		}
		if (this.w.ref_link && m.show_share) nodes.push(this.share());
		if (!this.inline) nodes.push(el('button', { type: 'button', class: 'bchw-nothanks', text: m.continue_text, onclick: function () { self.close('done'); } }));
		this.setPanel(nodes, 'bchw-view-result');
		this.dialog.classList.add('is-result', win ? 'is-win' : 'is-lose');
		var t = $('.bchw-title', this.panel); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
	};
	Instance.prototype.share = function () {
		var w = this.w, link = w.ref_link, txt = w.messages.share_text, self = this;
		return el('div', { class: 'bchw-share' }, [el('span', { text: txt }), el('div', { class: 'bchw-share-row' }, [
			el('a', { class: 'bchw-share-btn is-wa', href: 'https://wa.me/?text=' + encodeURIComponent(txt + ' ' + link), target: '_blank', rel: 'noopener', text: 'WhatsApp', onclick: function () { track(w.id, 'share'); } }),
			el('a', { class: 'bchw-share-btn is-tg', href: 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(txt), target: '_blank', rel: 'noopener', text: 'Telegram', onclick: function () { track(w.id, 'share'); } }),
			el('button', { type: 'button', class: 'bchw-share-btn', text: T(w, 'کپی لینک', 'Copy link'), onclick: function (e) { var b = e.currentTarget; copyText(link).then(function () { b.textContent = w.messages.copied_text; track(self.w.id, 'share'); }); } })
		])]);
	};
	Instance.prototype.claimForm = function (r) {
		var w = this.w, self = this, f = el('form', { class: 'bchw-claim' });
		f.appendChild(el('h4', { text: w.messages.claim_title }));
		var inputs = [['name', T(w, 'نام و نام خانوادگی', 'Full name'), 'text']];
		if (r.claim_fields === 'address') inputs.push(['phone', T(w, 'شماره تماس', 'Phone'), 'tel'], ['address', T(w, 'آدرس کامل پستی', 'Full address'), 'textarea'], ['postcode', T(w, 'کد پستی', 'Postcode'), 'text']);
		else if (r.claim_fields === 'phone') inputs.push(['phone', T(w, 'شماره تماس', 'Phone'), 'tel']);
		else inputs.push(['note', T(w, 'توضیحات', 'Details'), 'textarea']);
		inputs.forEach(function (x) { f.appendChild(x[2] === 'textarea' ? el('textarea', { class: 'bchw-input', name: x[0], placeholder: x[1], rows: 2 }) : el('input', { class: 'bchw-input', type: x[2], name: x[0], placeholder: x[1], dir: x[2] === 'tel' ? 'ltr' : null })); });
		var msg = el('div', { class: 'bchw-form-msg' });
		var b = this.button(w.messages.claim_button, null, ''); b.type = 'submit';
		f.appendChild(b); f.appendChild(msg);
		f.addEventListener('submit', function (e) {
			e.preventDefault();
			var data = {}; $$('[name]', f).forEach(function (n) { data[n.name] = n.value; });
			if (self.preview) { msg.textContent = w.messages.claim_success; return; }
			b.classList.add('is-busy');
			api('claim', { spin_id: r.spin_id, claim: r.claim, data: data }).then(function (res) {
				b.classList.remove('is-busy');
				msg.textContent = res.message || ''; msg.className = 'bchw-form-msg ' + (res.ok ? 'is-ok' : 'is-err');
				if (res.ok) { $$('input,textarea,button', f).forEach(function (n) { n.disabled = true; }); }
			});
		});
		return f;
	};
	Instance.prototype.open = function (source) {
		if (this.root && D.body.contains(this.root)) return;
		this.source = source || 'popup';
		closeAll(this);
		this.build();
		var self = this;
		requestAnimationFrame(function () { self.root.classList.add('is-open'); });
		if (!this.inline) D.documentElement.classList.add('bchw-lock');
		if (!this.preview) {
			this.mem.imp = (this.mem.imp || 0) + 1; this.mem.last = Date.now(); this.save();
			sstore('bch_shown_' + this.w.id, 1);
			track(this.w.id, 'open');
		}
		emit('open', { wheel: this.w.id }); analytics(this.w, 'open');
		var first = $('input:not([type=hidden]):not(.bchw-hp), .bchw-btn', this.dialog);
		if (first && !this.inline && W.innerWidth > 640) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) {} }, 350);
		hideLauncher(false);
	};
	Instance.prototype.close = function (why) {
		if (!this.root) return;
		if (this.wheel && this.wheel.spinning) return;
		var self = this, root = this.root;
		root.classList.remove('is-open'); root.classList.add('is-closing');
		D.documentElement.classList.remove('bchw-lock');
		if (this.keyHandler) D.removeEventListener('keydown', this.keyHandler);
		W.removeEventListener('resize', this.resizeHandler);
		if (this.wheel) this.wheel.stopIdle();
		setTimeout(function () { if (root.parentNode) root.parentNode.removeChild(root); }, Math.min(800, +this.w.popup.anim_duration || 300));
		if (!this.preview && why !== 'done' && why !== 'auto') { this.mem.closed = Date.now(); this.save(); track(this.w.id, 'close'); }
		this.root = null;
		emit('close', { wheel: this.w.id, why: why });
		showLauncher();
		showCouponBar();
	};

	function closeAll(except) { for (var k in instances) { if (instances[k] !== except && instances[k].root && !instances[k].inline) instances[k].close('switch'); } }

	function copyText(t) {
		if (navigator.clipboard && W.isSecureContext) return navigator.clipboard.writeText(t).catch(function () { fallbackCopy(t); });
		fallbackCopy(t); return Promise.resolve();
	}
	function fallbackCopy(t) { var ta = el('textarea', { style: { position: 'fixed', opacity: '0' } }); ta.value = t; D.body.appendChild(ta); ta.select(); try { D.execCommand('copy'); } catch (e) {} ta.remove(); }

	/* ------------------------------------------------------------------ launcher + coupon bar */

	var launcher = null, launcherWheel = null;
	function miniWheelSvg(cfg) {
		var pal = (cfg.design.palette || []).slice(0, 8), n = 8, out = '<svg viewBox="0 0 40 40" aria-hidden="true">';
		for (var i = 0; i < n; i++) { var a0 = (i * 45 - 90) * Math.PI / 180, a1 = ((i + 1) * 45 - 90) * Math.PI / 180; out += '<path d="M20 20L' + (20 + 18 * Math.cos(a0)).toFixed(2) + ' ' + (20 + 18 * Math.sin(a0)).toFixed(2) + 'A18 18 0 0 1 ' + (20 + 18 * Math.cos(a1)).toFixed(2) + ' ' + (20 + 18 * Math.sin(a1)).toFixed(2) + 'Z" fill="' + esc(pal[i % (pal.length || 1)] || '#1D4ED8') + '"/>'; }
		return out + '<circle cx="20" cy="20" r="18" fill="none" stroke="#fff" stroke-width="2"/><circle cx="20" cy="20" r="4.5" fill="#fff"/></svg>';
	}
	function buildLauncher(cfg) {
		var d = cfg.display, mobile = deviceType() === 'mobile';
		if (!d.launcher || (mobile && !d.launcher_mobile) || (!mobile && !d.launcher_desktop)) return;
		var inst = instances[cfg.id];
		if (d.launcher_hide_after_spin && inst && inst.mem.spun) return;
		var b = launcherEl(cfg);
		b.addEventListener('click', function () { track(cfg.id, 'launcher'); openWheel(cfg.id, 'launcher'); });
		launcher = b; launcherWheel = cfg.id;
		setTimeout(function () { D.body.appendChild(b); requestAnimationFrame(function () { b.classList.add('is-in'); }); updateBadges(); }, (+d.launcher_delay || 0) * 1000);
	}
	function launcherEl(cfg) {
		if (!cfg.device) cfg = resolveCfg(cfg, deviceOf());
		var d = cfg.display;
		var b = el('button', { type: 'button', class: 'bchw-launcher bchw-launcher-' + d.launcher_style + ' bchw-pos-' + d.launcher_position + ' bchw-la-' + d.launcher_animation, dir: isFa(cfg) || CFG.rtl ? 'rtl' : 'ltr', 'aria-label': d.launcher_text, style: { '--bchw-la-bg': d.launcher_bg, '--bchw-la-color': d.launcher_color, '--bchw-la-size': d.launcher_size + 'px', '--bchw-la-x': d.launcher_offset_x + 'px', '--bchw-la-y': d.launcher_offset_y + 'px', '--bchw-z': (CFG.z || 999999) - 1 } });
		var ic = el('span', { class: 'bchw-la-ic' });
		if (d.launcher_style === 'image' && d.launcher_image) ic.appendChild(el('img', { src: d.launcher_image, alt: '' }));
		else if (d.launcher_style === 'gift') ic.textContent = '🎁';
		else ic.innerHTML = miniWheelSvg(cfg);
		b.appendChild(ic);
		if (d.launcher_style === 'pill' || d.launcher_style === 'tab') b.appendChild(el('span', { class: 'bchw-la-text', text: d.launcher_text }));
		else b.appendChild(el('span', { class: 'bchw-la-tip', text: d.launcher_text }));
		b.appendChild(el('i', { class: 'bchw-la-badge', hidden: true }));
		return b;
	}
	function hideLauncher() { if (launcher) launcher.classList.add('is-hidden'); }
	function showLauncher() {
		if (!launcher) return;
		var inst = instances[launcherWheel];
		if (inst && inst.w.display.launcher_hide_after_spin && inst.mem.spun) { launcher.remove(); launcher = null; return; }
		launcher.classList.remove('is-hidden');
	}
	function updateBadges() {
		for (var k in instances) {
			var st = instances[k].state || {}, n = (st.credits || 0) + (st.free_left > 0 && st.free_left < 999 ? st.free_left : 0) + (st.bonus || 0);
			if (st.can && !n) n = 1;
			if (!st.can) n = 0;
			$$('[data-bch-spins="' + k + '"], [data-bch-spins="0"]').forEach(function (s) { s.textContent = n ? fa(n) : (s.getAttribute('data-zero') || fa(0)); });
			if (launcher && +launcherWheel === +k) {
				var bd = $('.bchw-la-badge', launcher);
				if (bd) { bd.hidden = !(instances[k].w.display.launcher_badge && n > 0); bd.textContent = fa(n > 9 ? '9+' : n); }
			}
		}
	}
	/* Sticky coupon bar: visible on every page until the code is used (applied / ordered) or expires. */
	function barCfgFor(id) {
		if (session.barCfg && +session.barCfg.id === +id) return session.barCfg;
		var cfg = null; session.wheels.forEach(function (w) { if (+w.id === +id) cfg = w; });
		return cfg;
	}
	function removeBar() {
		$$('.bchw-bar').forEach(function (b) { if (!b.classList.contains('is-preview')) b.remove(); });
		D.documentElement.classList.remove('bchw-has-bar-top', 'bchw-has-bar-bottom');
	}
	/** Build the bar element (also used by the admin live preview). */
	function barEl(cfg, c, opts) {
		opts = opts || {};
		if (!cfg.device) cfg = resolveCfg(cfg, deviceOf());
		var d = cfg.display, m = cfg.messages || {}, rtl = isFa(cfg) || CFG.rtl;
		var st = {
			'--bchw-bar-bg': d.coupon_bar_bg, '--bchw-bar-bg2': d.coupon_bar_bg2 || d.coupon_bar_bg, '--bchw-bar-color': d.coupon_bar_color,
			'--bchw-bar-font': (+d.coupon_bar_font || 14) + 'px', '--bchw-bar-radius': (+d.coupon_bar_radius || 0) + 'px', '--bchw-bar-btn-radius': (d.coupon_bar_btn_radius == null ? 999 : +d.coupon_bar_btn_radius) + 'px',
			'--bchw-z': (CFG.z || 999999) - 2
		};
		var opt = { code_bg: '--bchw-bar-code-bg', code_color: '--bchw-bar-code-color', copy_bg: '--bchw-bar-copy-bg', copy_color: '--bchw-bar-copy-color', apply_bg: '--bchw-bar-apply-bg', apply_color: '--bchw-bar-apply-color', border: '--bchw-bar-border', close_color: '--bchw-bar-x-color', cd_color: '--bchw-bar-cd-color' };
		for (var k in opt) if (d['coupon_bar_' + k]) st[opt[k]] = d['coupon_bar_' + k];
		var cls = ['bchw-bar', 'bchw-bar-' + (d.coupon_bar_position || 'bottom'), 'bchw-bar-l-' + (d.coupon_bar_layout || 'full'), 'bchw-bar-s-' + (d.coupon_bar_style || 'solid'), 'bchw-bar-sh-' + (d.coupon_bar_shadow || 'soft'), 'bchw-bar-a-' + (d.coupon_bar_anim || 'slide')];
		if (d.coupon_bar_border) cls.push('has-border');
		if (d.coupon_bar_mobile_compact) cls.push('is-compact-m');
		if (opts.preview) cls.push('is-preview');
		if (opts.mobile) cls.push('is-mobile');
		var bar = el('div', { class: cls.join(' '), dir: rtl ? 'rtl' : 'ltr', role: 'status', style: st });
		var inner = el('div', { class: 'bchw-bar-in' });
		if (d.coupon_bar_icon) inner.appendChild(el('span', { class: 'bchw-bar-ic', text: d.coupon_bar_icon }));
		var text = el('span', { class: 'bchw-bar-text' });
		var src = tpl(d.coupon_bar_text || '{code}', { prize: c.label || '' });
		var codeEl = el('b', { class: 'bchw-bar-code bchw-bar-code-' + (d.coupon_bar_code_style || 'chip'), dir: 'ltr', text: c.code });
		var parts = src.split('{code}');
		parts.forEach(function (t, i) {
			if (t) text.appendChild(el('span', { class: 'bchw-bar-t', text: t }));
			if (i < parts.length - 1) text.appendChild(i === 0 ? codeEl : codeEl.cloneNode(true));
		});
		if (parts.length < 2) text.appendChild(codeEl);
		inner.appendChild(text);
		if (d.coupon_bar_countdown && c.exp) {
			var cd = el('span', { class: 'bchw-bar-cd bchw-bar-cd-' + (d.coupon_bar_cd_style || 'text'), dir: rtl ? 'rtl' : 'ltr' });
			inner.appendChild(cd);
			(function upd() {
				var s = c.exp - Date.now() / 1000;
				cd.textContent = '⏱ ' + fmtDuration(Math.max(0, s), cfg);
				if (s <= 0 && !opts.preview) { store('bch_coupon', null); removeBar(); return; }
				if (bar.parentNode) bar._live = 1; else if (bar._live) return; // Removed: stop ticking.
				setTimeout(upd, 1000);
			})();
		}
		var acts = el('span', { class: 'bchw-bar-acts' });
		if (d.coupon_bar_copy !== false) {
			var cpLabel = el('span', { text: d.coupon_bar_copy_label || m.copy_text });
			acts.appendChild(el('button', { type: 'button', class: 'bchw-bar-copy', onclick: function () {
				if (opts.preview) return;
				copyText(c.code).then(function () { cpLabel.textContent = m.copied_text; setTimeout(function () { cpLabel.textContent = d.coupon_bar_copy_label || m.copy_text; }, 2500); });
			} }, [cpLabel]));
		}
		if (d.coupon_bar_apply && c.apply && (c.apply !== '#' || opts.preview)) {
			acts.appendChild(el('a', { class: 'bchw-bar-apply', href: c.apply, onclick: function (e) {
				if (opts.preview) { e.preventDefault(); return; }
				// Applying = using it: hide now; the server confirms on the next page (re-shows if the cart rejected it).
				var x = store('bch_coupon'); if (x && x.code === c.code && d.coupon_bar_hide_applied !== false) { x.st = 'applied'; store('bch_coupon', x); }
				e.preventDefault(); var href = e.currentTarget.href; removeBar(); location.href = href;
			} }, [el('span', { text: d.coupon_bar_apply_label || m.apply_text })]));
		}
		if (acts.childNodes.length) inner.appendChild(acts);
		bar.appendChild(inner);
		if (d.coupon_bar_close !== false) {
			bar.appendChild(el('button', { type: 'button', class: 'bchw-bar-x', 'aria-label': T(cfg, 'بستن', 'Close'), text: '×', onclick: function () { if (opts.preview) return; sstore('bch_bar_closed', c.code); removeBar(); } }));
		}
		return bar;
	}
	function showCouponBar() {
		var c = store('bch_coupon');
		if (!c || !c.code) return;
		if (c.exp && c.exp * 1000 < Date.now()) { store('bch_coupon', null); removeBar(); return; }
		if (c.st && c.st !== 'active') { removeBar(); return; } // Applied to the cart / turned off.
		if ($('.bchw-bar:not(.is-preview)')) return;
		if (sstore('bch_bar_closed') === c.code) return;
		var p = pageCtx(); if (p.page_type === 'thankyou') return;
		for (var k in instances) if (instances[k].root && !instances[k].inline && D.body.contains(instances[k].root)) return; // Popup open: show after it closes.
		var cfg = barCfgFor(c.w);
		if (!cfg || !cfg.display || !cfg.display.coupon_bar) return;
		var d = cfg.display;
		var bar = barEl(cfg, c, {});
		D.body.appendChild(bar);
		D.documentElement.classList.add('bchw-has-bar-' + (d.coupon_bar_position || 'bottom'));
		// Real height (wraps to 2 lines on phones) so the page and the launcher make room for it.
		var room = function () { if (!bar.parentNode) { W.removeEventListener('resize', room); return; } D.documentElement.style.setProperty('--bchw-bar-h', (bar.offsetHeight + (d.coupon_bar_layout && d.coupon_bar_layout !== 'full' ? 14 : 0)) + 'px'); };
		room(); W.addEventListener('resize', room);
		emit('coupon_bar', { code: c.code, wheel: c.w });
	}
	/** Server truth about the stored code (boot / re-check). */
	function syncBar(b) {
		if (b === undefined) return; // Old server or failed request: keep the local state.
		var c = store('bch_coupon');
		if (!b) return;
		if (['used', 'expired', 'gone'].indexOf(b.status) > -1) {
			if (!c || c.code === b.code) store('bch_coupon', null);
			removeBar(); return;
		}
		if (b.cfg) session.barCfg = b.cfg;
		var same = c && c.code === b.code;
		store('bch_coupon', { w: b.w, sid: b.sid || (same ? c.sid : 0), code: b.code, label: b.label != null ? b.label : (same ? c.label : ''), apply: b.apply || (same ? c.apply : ''), exp: b.exp != null ? b.exp : (same ? c.exp : 0), at: same ? c.at : Date.now(), st: b.status });
		if (b.status !== 'active') removeBar();
		else { var cur = $('.bchw-bar:not(.is-preview)'); if (cur && !same) removeBar(); showCouponBar(); }
	}
	function recheckBar() {
		var c = store('bch_coupon'); if (!c || !c.code) return;
		api('bar', { ctx: clientCtx(), bar: { code: c.code, sid: c.sid || 0, w: c.w } }).then(function (r) { if (r && r.ok) syncBar(r.bar); });
	}
	/** WooCommerce AJAX cart/checkout coupon events (classic cart & checkout). */
	function watchWooCoupons() {
		var jq = W.jQuery; if (!jq) return;
		var same = function (code) { var c = store('bch_coupon'); return c && c.code && String(code || '').toLowerCase() === String(c.code).toLowerCase(); };
		jq(D.body).on('applied_coupon applied_coupon_in_checkout', function (e, code) {
			if (!same(code)) return;
			var c = store('bch_coupon'); var cfg = barCfgFor(c.w);
			if (cfg && cfg.display && cfg.display.coupon_bar_hide_applied === false) return;
			c.st = 'applied'; store('bch_coupon', c); removeBar();
			setTimeout(recheckBar, 800); // The cart may have rejected it (minimum spend…).
		});
		jq(D.body).on('removed_coupon removed_coupon_in_checkout', function (e, code) {
			if (!same(code)) return;
			setTimeout(recheckBar, 500);
		});
	}

	/* ------------------------------------------------------------------ triggers */

	function canAuto(inst) {
		var d = inst.w.display, m = inst.mem, now = Date.now(), DAY = 86400000;
		if (d.mode === 'inline') return false;
		if (inst.w.state && !inst.w.state.can && d.hide_when_no_spins) return false;
		if (m.nothx && now - m.nothx < (+inst.w.popup.no_thanks_days || 0) * DAY) return false;
		if (m.closed && now - m.closed < (+d.hide_after_close_days || 0) * DAY) return false;
		if (m.spun && now - m.spun < (+d.hide_after_spin_days || 0) * DAY) return false;
		if (+d.max_impressions > 0 && (m.imp || 0) >= +d.max_impressions) return false;
		switch (d.frequency) {
			case 'once': if (m.imp) return false; break;
			case 'session': if (sstore('bch_shown_' + inst.w.id)) return false; break;
			case 'days': if (m.last && now - m.last < (+d.frequency_days || 1) * DAY) return false; break;
		}
		var pv = sstore('bch_pv') || 1;
		if (+d.pageviews > 0 && pv < +d.pageviews) return false;
		return true;
	}
	function armTriggers(inst) {
		var d = inst.w.display, fired = false;
		var fire = function (src) { if (fired || $('.bchw.is-open:not(.is-preview)') ) return; if (!canAuto(inst)) return; fired = true; inst.open(src); cleanup(); };
		var handlers = [];
		var on = function (t, ev, fn, opt) { t.addEventListener(ev, fn, opt); handlers.push([t, ev, fn, opt]); };
		var cleanup = function () { handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2], h[3]); }); };
		if (d.on_load) {
			var delay = (+d.delay || 0) + (+d.delay_max > +d.delay ? Math.random() * (+d.delay_max - +d.delay) : 0);
			setTimeout(function () { fire('timer'); }, delay * 1000);
		}
		if (d.scroll) on(W, 'scroll', function () { var h = D.documentElement; var pct = (h.scrollTop || D.body.scrollTop) / Math.max(1, h.scrollHeight - h.clientHeight) * 100; if (pct >= +d.scroll_percent) fire('scroll'); }, { passive: true });
		if (d.exit_intent) {
			on(D, 'mouseout', function (e) { if (!e.relatedTarget && e.clientY <= 8) fire('exit'); });
			if (d.exit_mobile) {
				var lastY = W.scrollY, lastT = Date.now(), maxY = 0;
				on(W, 'scroll', function () { var y = W.scrollY, t = Date.now(); maxY = Math.max(maxY, y); if (maxY > 600 && lastY - y > 120 && t - lastT < 260) fire('exit'); lastY = y; lastT = t; }, { passive: true });
				on(D, 'visibilitychange', function () { if (D.visibilityState === 'visible' && inst._hiddenAt && Date.now() - inst._hiddenAt > 4000) fire('return'); if (D.visibilityState === 'hidden') inst._hiddenAt = Date.now(); });
			}
		}
		if (d.inactivity) {
			var it; var reset = function () { clearTimeout(it); it = setTimeout(function () { fire('idle'); }, (+d.inactivity_seconds || 30) * 1000); };
			['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) { on(W, ev, reset, { passive: true }); }); reset();
		}
		if (d.add_to_cart && W.jQuery) W.jQuery(D.body).on('added_to_cart', function () { fire('cart'); });
	}

	function openWheel(id, source) {
		id = +id;
		var inst = instances[id];
		if (!inst && !id) { for (var k in instances) { inst = instances[k]; break; } }
		if (inst) { inst.open(source || 'button'); return; }
		// Not booted for this page (e.g. targeting) → ask the server for it explicitly.
		boot(false, id).then(function () { if (instances[id]) instances[id].open(source || 'button'); });
	}

	/* ------------------------------------------------------------------ boot */

	var bootPromise = null;
	function boot(force, openId) {
		if (bootPromise && !force && !openId) return bootPromise;
		var inline = $$('[data-bch-inline]').map(function (n) { return +n.getAttribute('data-bch-inline'); });
		var q = query();
		var hashOpen = (location.hash.match(/^#bch-open(?:-(\d+))?$/) || [])[1];
		var open = openId || +(q[CFG.openParam] || 0) || +hashOpen || 0;
		var pv = +(q.bch_preview || 0);
		// Personal link from an SMS (?bch_v=…): the visitor is that mobile — granted spins work right away.
		if (q.bch_v && /^l\d{10}09\d{9}[a-f0-9]{24}$/.test(q.bch_v)) {
			otpStore({ t: q.bch_v, p: q.bch_v.substr(11, 11) });
			try { var u = new URL(location.href); u.searchParams.delete('bch_v'); history.replaceState(null, '', u.toString()); } catch (e) {}
		}
		var saved = otpStore(); if (saved && saved.t) { session.otp = saved.t; session.phone = saved.p; }
		var sc = store('bch_coupon');
		var p = api('boot', { ctx: clientCtx(), inline: inline, open: open, preview: pv, bar: sc && sc.code ? { code: sc.code, sid: sc.sid || 0, w: sc.w } : null }).then(function (r) { return domReady.then(function () { return r; }); }).then(function (r) {
			if (!r || !r.ok) return;
			session.token = r.token; session.user = r.user || {};
			if (session.user.verified) session.phone = session.user.verified;
			(r.wheels || []).forEach(function (w) {
				var exists = instances[w.id];
				if (exists && exists.root) { exists.state = w.state; return; }
				if (!session.wheels.some(function (x) { return x.id === w.id; })) session.wheels.push(w);
				w.popup.countdown_ts = w.popup.countdown_ts || 0;
				var inst = new Instance(w, {});
				track(w.id, 'imp');
				if (w.preview) { setTimeout(function () { inst.open('preview'); }, 300); }
			});
			// Inline placements.
			$$('[data-bch-inline]').forEach(function (n) {
				var id = +n.getAttribute('data-bch-inline'), w = null;
				(r.wheels || []).forEach(function (x) { if (+x.id === id) w = x; });
				if (w && !n.getAttribute('data-ready')) { n.setAttribute('data-ready', 1); var ii = new Instance(w, { container: n }); ii.build(); }
			});
			if (!session.booted) {
				session.booted = true;
				var popupWheels = (r.wheels || []).filter(function (w) { return !w.inline || w.display.mode !== 'inline'; }).filter(function (w) { return w.display.mode !== 'inline'; });
				var page = pageCtx();
				if (page.page_type === 'thankyou' && page.granted > 0) {
					var tw = popupWheels.filter(function (w) { return !page.granted_wheel || +w.id === +page.granted_wheel; })[0] || popupWheels[0];
					if (tw && tw.display.thankyou) setTimeout(function () { openWheel(tw.id, 'thankyou'); }, 1200);
				} else if (open) {
					setTimeout(function () { openWheel(open, 'link'); }, 200);
				} else if (popupWheels.length && !pv) {
					armTriggers(instances[popupWheels[0].id]);
				}
				if (popupWheels.length) buildLauncher(popupWheels[0]);
				// Click selectors.
				popupWheels.forEach(function (w) { if (w.display.click_selector) D.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest(w.display.click_selector); if (t) { e.preventDefault(); openWheel(w.id, 'click'); } }); });
				if ('bar' in r) syncBar(r.bar);
				showCouponBar();
				watchWooCoupons();
			}
			updateBadges();
			emit('ready', { wheels: (r.wheels || []).map(function (w) { return w.id; }) });
		});
		if (!openId) bootPromise = p;
		return p;
	}

	var domReady = new Promise(function (res) { if (D.readyState !== 'loading') res(); else D.addEventListener('DOMContentLoaded', function () { res(); }); });
	function init() {
		if (CFG.admin) return;
		session.did = deviceId();
		if (CFG.fast) {
			// Fast start: ask the server now (script is in <head>), render as soon as the HTML is parsed.
			boot();
			domReady.then(function () {
				var missing = $$('[data-bch-inline]').some(function (n) { return !n.getAttribute('data-ready'); });
				if (missing) bootPromise.then(function () { if ($$('[data-bch-inline]').some(function (n) { return !n.getAttribute('data-ready'); })) boot(true); });
			});
		}
		D.addEventListener('click', function (e) {
			var t = e.target.closest ? e.target.closest('[data-bch-open], a[href^="#bch-open"], .bch-copy') : null;
			if (!t) return;
			if (t.classList.contains('bch-copy')) { e.preventDefault(); copyText(t.getAttribute('data-copy') || '').then(function () { t.classList.add('is-ok'); }); return; }
			e.preventDefault();
			var id = t.getAttribute('data-bch-open') || ((t.getAttribute('href') || '').match(/(\d+)$/) || [])[1] || 0;
			openWheel(id, 'button');
		});
		W.addEventListener('hashchange', function () { var m = location.hash.match(/^#bch-open(?:-(\d+))?$/); if (m) openWheel(m[1] || 0, 'link'); });
		var start = function () {
			if (CFG.fast) return;
			if (!D.getElementById('bch-root') && !$('[data-bch-inline]') && !$('[data-bch-open]')) return;
			var go = function () { boot(); };
			if (D.fonts && D.fonts.ready) { var t = setTimeout(go, 1500); D.fonts.ready.then(function () { clearTimeout(t); go(); }); } else go();
		};
		if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else start();
	}

	/* ------------------------------------------------------------------ public api */

	W.Becharkhoon = {
		version: CFG.ver,
		open: openWheel,
		close: function () { for (var k in instances) if (instances[k].root && !instances[k].inline) instances[k].close('api'); },
		on: function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
		instances: instances,
		Wheel: Wheel,
		Effects: Effects,
		Sound: Sound,
		/** Admin live preview: render a full popup into a container (no server calls). */
		preview: function (container, wcfg, opts) {
			opts = opts || {};
			var prev = instances[wcfg.id];
			if (prev && prev.wheel) prev.wheel.stopIdle();
			var inst = new Instance(wcfg, { container: container, preview: true, static: opts.static, mobile: opts.mobile, device: opts.device || (opts.mobile ? 'mobile' : 'desktop') });
			inst.state = opts.state || { can: true, free_left: 1 };
			inst.build();
			var gs = (wcfg.slices || []).filter(function (x) { return x.type === 'free_product'; })[0];
			if (opts.view === 'win') { inst.state = { can: true, free_left: 2 }; inst.resultView({ gift: gs ? { name: gs.gift_demo || T(wcfg, 'محصول هدیه نمونه', 'Sample gift product'), image: gs.gift_demo_image || '', price: gs.gift_demo_price || '' } : null, result: 'win', title: wcfg.messages.win_title.replace('{name}', ''), text: wcfg.messages.win_text.replace('{prize}', esc(gs ? (gs.gift_demo || gs.label) : ((wcfg.slices[0] || {}).label || ''))), code: 'WHEEL-DEMO42', expiry: T(wcfg, '۷ روز دیگر', 'in 7 days'), apply_url: '#', state: { can: true, free_left: 2 } }); }
			if (opts.view === 'lose') inst.resultView({ result: 'lose', title: wcfg.messages.lose_title.replace('{name}', ''), text: wcfg.messages.lose_text, state: {} });
			if (opts.view && ['login', 'wait', 'earn', 'closed'].indexOf(opts.view) > -1) {
				var mm = wcfg.messages, msgs = { login: '', wait: tpl(mm.cooldown_text, { time: T(wcfg, '۱ ساعت و ۳۰ دقیقه', '1h 30m') }), earn: mm.no_spins_text, closed: mm.closed_text };
				inst.state = { can: false, reason: { login: 'login', wait: 'cooldown', earn: 'no_credits', closed: 'closed' }[opts.view], next_at: Math.floor(Date.now() / 1000) + 5400, message: msgs[opts.view] };
				inst.forceState = true; inst.view();
			}
			return inst;
		},
		/** Admin live preview of the site page: floating launcher + sticky coupon bar. */
		previewPage: function (container, wcfg, opts) {
			opts = opts || {};
			container.innerHTML = '';
			wcfg = resolveCfg(wcfg, opts.device || (opts.mobile ? 'mobile' : 'desktop'));
			var rtl = isFa(wcfg) || CFG.rtl;
			var page = el('div', { class: 'bchw-mock' + (opts.mobile ? ' is-mobile' : ''), dir: rtl ? 'rtl' : 'ltr' });
			var sk = function (w, h, cls) { return el('i', { class: 'bchw-mock-sk ' + (cls || ''), style: { width: w, height: h } }); };
			page.appendChild(el('div', { class: 'bchw-mock-head' }, [sk('90px', '14px', 'is-dark'), el('span', { class: 'bchw-mock-nav' }, [sk('44px', '9px'), sk('52px', '9px'), sk('38px', '9px')])]));
			var grid = el('div', { class: 'bchw-mock-grid' });
			for (var i = 0; i < (opts.mobile ? 4 : 8); i++) grid.appendChild(el('div', { class: 'bchw-mock-card' }, [el('i', { class: 'bchw-mock-img' }), sk('70%', '9px'), sk('40%', '9px', 'is-accent')]));
			page.appendChild(el('div', { class: 'bchw-mock-hero' }, [sk('55%', '18px', 'is-dark'), sk('35%', '11px')]));
			page.appendChild(grid);
			var d = wcfg.display;
			if (d.launcher) {
				var la = launcherEl(wcfg); la.classList.add('is-in', 'is-preview'); la.disabled = false;
				var bd = $('.bchw-la-badge', la); if (bd && d.launcher_badge) { bd.hidden = false; bd.textContent = fa(1); }
				page.appendChild(la);
			}
			if (d.coupon_bar) {
				var code = (wcfg.coupon && wcfg.coupon.prefix ? wcfg.coupon.prefix : 'WHEEL-') + 'DEMO42';
				var label = (wcfg.slices.filter(function (x) { return x.label; })[0] || {}).label || T(wcfg, '۱۰٪ تخفیف', '10% off');
				var bar = barEl(wcfg, { code: code, label: label, apply: '#', exp: Math.floor(Date.now() / 1000) + 2 * 86400 + 5025 }, { preview: true, mobile: opts.mobile });
				page.appendChild(bar);
				page.classList.add('has-bar-' + (d.coupon_bar_position || 'bottom'));
			} else {
				page.appendChild(el('div', { class: 'bchw-mock-off', text: T(wcfg, 'نوار کد تخفیف خاموش است', 'The coupon bar is off') }));
			}
			container.appendChild(page);
			var pb = $('.bchw-bar', page);
			if (pb) page.style.setProperty('--bchw-bar-h', (pb.offsetHeight + (d.coupon_bar_layout && d.coupon_bar_layout !== 'full' ? 14 : 0)) + 'px');
			return page;
		},
		effect: function (type, emoji) { Effects.run(type, emoji); }
	};

	init();
})();
