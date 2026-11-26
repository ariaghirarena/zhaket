/**
 * ARIAGH.BECHARKHOON — admin pages: dashboard, wheels, rules, spins, leads, credits, reports,
 * SMS & alerts, settings, tools, guide.
 */
( function ( w, d ) {
	'use strict';
	var BC = w.BC;
	var F = BC.F;
	var h = BC.h;
	var t = BC.t;
	var P = ( BC.pages = {} );

	function clone( x ) {
		return JSON.parse( JSON.stringify( x ) );
	}
	function head( icon, title, sub, actions ) {
		return h( 'div', { class: 'bc-page-head' },
			h( 'div', null, h( 'h1', null, BC.icon( icon, 24 ), h( 'span', { text: title } ) ), sub ? h( 'p', { class: 'bc-muted', text: sub } ) : null ),
			actions ? h( 'div', { class: 'bc-page-head__actions' }, actions ) : null
		);
	}
	function load( view, promise, render ) {
		BC.clear( view );
		view.appendChild( BC.spinner() );
		return promise.then( function ( data ) {
			BC.clear( view );
			render( data );
		} ).catch( function ( e ) {
			BC.clear( view );
			view.appendChild( BC.alert( 'error', e.message ) );
		} );
	}
	function iso( dt ) {
		return dt.getFullYear() + '-' + ( '0' + ( dt.getMonth() + 1 ) ).slice( -2 ) + '-' + ( '0' + dt.getDate() ).slice( -2 );
	}
	function rangePicker( state, onChange ) {
		var opts = [ { value: 7, label: t( '۷ روز', '7 days' ) }, { value: 30, label: t( '۳۰ روز', '30 days' ) }, { value: 90, label: t( '۹۰ روز', '90 days' ) }, { value: 365, label: t( 'یک سال', '1 year' ) } ];
		return BC.segment( opts, state.days, function ( v ) {
			state.days = v;
			var to = new Date();
			var from = new Date( Date.now() - ( v - 1 ) * 86400000 );
			state.from = iso( from );
			state.to = iso( to );
			onChange();
		} );
	}
	function wheelSelect( value, onChange, allLabel ) {
		var sel = h( 'select', { class: 'bc-input bc-select' }, h( 'option', { value: '', text: allLabel || t( 'همه گردونه‌ها', 'All wheels' ) } ), ( BC.boot.wheels || [] ).map( function ( wh ) {
			return h( 'option', { value: wh.id, text: wh.title } );
		} ) );
		sel.value = value || '';
		sel.addEventListener( 'change', function () { onChange( sel.value ); } );
		return sel;
	}
	var RESULT = function ( r ) {
		return r === 'win' ? BC.badge( t( 'برنده', 'Win' ), 'good' ) : ( r === 'respin' ? BC.badge( t( 'دوباره', 'Re-spin' ), 'brand' ) : BC.badge( t( 'پوچ', 'Lose' ), 'default' ) );
	};
	var STATUS = function ( s ) {
		var m = {
			issued: [ t( 'صادر شده', 'Issued' ), 'brand' ], redeemed: [ t( 'استفاده شده', 'Redeemed' ), 'good' ], expired: [ t( 'منقضی', 'Expired' ), 'bad' ], revoked: [ t( 'باطل', 'Revoked' ), 'bad' ],
			pending: [ t( 'منتظر آدرس', 'Awaiting details' ), 'warn' ], claimed: [ t( 'آدرس ثبت شد', 'Claimed' ), 'warn' ], delivered: [ t( 'تحویل شد', 'Delivered' ), 'good' ], lost: [ '—', 'default' ], respin: [ '—', 'default' ],
		};
		var x = m[ s ] || [ s, 'default' ];
		return BC.badge( x[ 0 ], x[ 1 ] );
	};

	/* ================================================================== Dashboard */
	P.dashboard = function ( view ) {
		var st = { days: 30, from: iso( new Date( Date.now() - 29 * 86400000 ) ), to: iso( new Date() ), wheel: '' };
		function render() {
			load( view, BC.api( 'dashboard', { query: { from: st.from, to: st.to, wheel: st.wheel } } ), function ( r ) {
				var tt = r.totals;
				var pv = r.previous;
				var delta = function ( k ) {
					if ( ! pv[ k ] ) {
						return '';
					}
					var p = ( tt[ k ] - pv[ k ] ) / pv[ k ] * 100;
					return ( p >= 0 ? '▲ ' : '▼ ' ) + BC.num( Math.abs( p ), 0 ) + '% ' + t( 'نسبت به دوره قبل', 'vs previous' );
				};
				view.appendChild( head( 'dashboard', t( 'داشبورد بچرخون', 'Becharkhoon dashboard' ), t( 'خلاصه عملکرد گردونه‌ها، برندگان و فروش حاصل از جوایز.', 'Wheel performance, winners and revenue from prizes.' ), [ wheelSelect( st.wheel, function ( v ) { st.wheel = v; render(); } ), rangePicker( st, render ), h( 'a', { class: 'bc-btn bc-btn--primary', href: '#/wheels?new=1' }, BC.icon( 'plus', 16 ), t( 'گردونه جدید', 'New wheel' ) ) ] ) );
				// Setup checklist.
				var todo = ( r.checks || [] ).filter( function ( c ) { return ! c.ok; } );
				if ( todo.length ) {
					var labels = {
						wheel: [ t( 'اولین گردونه را بسازید', 'Create your first wheel' ), '#/wheels?new=1' ],
						active: [ t( 'یک گردونه را «فعال» کنید', 'Activate a wheel' ), '#/wheels' ],
						woo: [ t( 'برای جوایز کد تخفیف، ووکامرس را فعال کنید', 'Activate WooCommerce for coupon prizes' ), '#/guide' ],
						sms: [ t( 'پنل پیامک را وصل کنید (برای پیامک جایزه/OTP)', 'Connect an SMS panel (prize SMS / OTP)' ), '#/sms' ],
						rules: [ t( 'برای گردونه‌های «شانس‌دار» قانون شانس بسازید', 'Create spin rules for credit-based wheels' ), '#/rules' ],
						cron: [ t( 'کران وردپرس فعال نیست (یادآوری‌ها)', 'WP-Cron is not scheduled (reminders)' ), '#/tools' ],
						test: [ t( 'حالت تست روشن است؛ فقط مدیران گردونه را می‌بینند', 'Test mode is on; only admins see wheels' ), '#/settings' ],
					};
					var total = ( r.checks || [] ).length;
					view.appendChild( BC.card( { title: t( 'راه‌اندازی', 'Setup' ), sub: t( '%1 از %2 مرحله انجام شده — موارد باقی‌مانده:', '%1 of %2 steps done — remaining:', BC.num( total - todo.length, 0 ), BC.num( total, 0 ) ), icon: 'rocket', cls: 'bc-card--onboarding' }, h( 'ul', { class: 'bc-checklist' }, todo.map( function ( c ) {
						var l = labels[ c.key ] || [ c.key, '#/' ];
						return h( 'li', { class: 'bc-iconline' }, BC.yes( false ), h( 'a', { href: l[ 1 ], text: l[ 0 ] } ) );
					} ) ) ) );
				}
				view.appendChild( h( 'div', { class: 'bc-kpis' },
					BC.kpi( 'eye', 'blue', t( 'نمایش پاپ‌آپ', 'Popup opens' ), BC.num( tt.opens, 0 ), BC.num( tt.open_rate ) + '% ' + t( 'از بازدیدها', 'of impressions' ) ),
					BC.kpi( 'wheel', 'green', t( 'چرخش', 'Spins' ), BC.num( tt.spins, 0 ), delta( 'spins' ) || ( BC.num( tt.conversion ) + '% ' + t( 'نرخ تبدیل', 'conversion' ) ) ),
					BC.kpi( 'gift', 'amber', t( 'برنده', 'Winners' ), BC.num( tt.wins, 0 ), BC.num( tt.win_rate ) + '% ' + t( 'نرخ برد', 'win rate' ) ),
					BC.kpi( 'users', 'blue', t( 'مخاطب جدید', 'New leads' ), BC.num( tt.leads, 0 ), delta( 'leads' ) ),
					BC.kpi( 'ticket', 'green', t( 'استفاده از جایزه', 'Redeemed prizes' ), BC.num( tt.redeemed, 0 ), BC.num( tt.redeem_rate ) + '% ' + t( 'از بردها', 'of wins' ) ),
					BC.kpi( 'trending', 'green', t( 'فروش از جوایز', 'Revenue from prizes' ), BC.money( tt.revenue ), tt.discount ? t( 'تخفیف داده‌شده: %1', 'discount given: %1', BC.money( tt.discount ) ) : delta( 'revenue' ) )
				) );
				var rows = Object.keys( r.series ).map( function ( day ) { return Object.assign( { date: day }, r.series[ day ] ); } );
				view.appendChild( h( 'div', { class: 'bc-grid-2 bc-grid-2--top' },
					BC.card( { title: t( 'روند روزانه', 'Daily trend' ), icon: 'chart' }, BC.charts.line( rows, { x: 'date', height: 230, series: [ { key: 'opens', label: t( 'نمایش', 'Opens' ) }, { key: 'spins', label: t( 'چرخش', 'Spins' ) }, { key: 'wins', label: t( 'برد', 'Wins' ) }, { key: 'redeemed', label: t( 'استفاده', 'Redeemed' ) } ] } ) ),
					BC.card( { title: t( 'قیف تبدیل', 'Funnel' ), icon: 'filter' }, BC.charts.bars( [
						{ label: t( 'نمایش', 'Impressions' ), value: tt.impressions },
						{ label: t( 'باز شدن', 'Opens' ), value: tt.opens },
						{ label: t( 'شروع فرم', 'Form started' ), value: tt.form_starts },
						{ label: t( 'چرخش', 'Spins' ), value: tt.spins },
						{ label: t( 'برد', 'Wins' ), value: tt.wins },
						{ label: t( 'استفاده از جایزه', 'Redeemed' ), value: tt.redeemed },
					] ) )
				) );
				view.appendChild( h( 'div', { class: 'bc-grid-2 bc-grid-2--top' },
					BC.card( { title: t( 'توزیع جوایز', 'Prize distribution' ), icon: 'gift' }, r.prizes.length ? BC.charts.donut( r.prizes.slice( 0, 8 ).map( function ( p ) { return { label: p.slice_label, value: +p.n }; } ), { size: 170 } ) : BC.empty( t( 'هنوز چرخشی ثبت نشده', 'No spins yet' ) ) ),
					BC.card( { title: t( 'آخرین چرخش‌ها', 'Latest spins' ), icon: 'activity', actions: h( 'a', { href: '#/spins', class: 'bc-btn bc-btn--sm' }, t( 'همه', 'All' ) ) }, BC.table( [
						{ label: t( 'زمان', 'When' ), render: function ( x ) { return BC.ago( x.created_at ); } },
						{ label: t( 'نتیجه', 'Result' ), render: function ( x ) { return h( 'span', { class: 'bc-iconline' }, RESULT( x.result ), h( 'span', { text: x.slice_label } ) ); } },
						{ label: t( 'شخص', 'Who' ), render: function ( x ) { return x.name || x.phone || x.email || '—'; } },
					], r.recent ) )
				) );
				var credits = r.credits || {};
				view.appendChild( h( 'div', { class: 'bc-kpis bc-kpis--sm' },
					BC.kpi( 'ticket', 'blue', t( 'شانس داده‌شده', 'Spins granted' ), BC.num( credits.granted, 0 ) ),
					BC.kpi( 'check', 'green', t( 'شانس مصرف‌شده', 'Spins used' ), BC.num( credits.used, 0 ) ),
					BC.kpi( 'clock', 'amber', t( 'شانس در انتظار مصرف', 'Spins waiting' ), BC.num( credits.available, 0 ) ),
					BC.kpi( 'message', 'blue', t( 'کد تایید ارسال‌شده', 'OTP codes sent' ), BC.num( tt.otp_sent, 0 ) )
				) );
			} );
		}
		render();
	};

	/* ================================================================== Wheels */
	P.wheels = function ( view, q ) {
		function newWheel() {
			var m = BC.modal( { title: t( 'گردونه جدید', 'New wheel' ), wide: true } );
			var name = h( 'input', { class: 'bc-input', placeholder: t( 'نام گردونه (اختیاری)', 'Wheel name (optional)' ) } );
			m.body.appendChild( h( 'div', { class: 'bc-field' }, h( 'label', { class: 'bc-field__label', text: t( 'نام', 'Name' ) } ), name ) );
			m.body.appendChild( h( 'h4', { class: 'bc-form-heading', text: t( 'از یک الگوی آماده شروع کنید', 'Start from a template' ) } ) );
			var grid = h( 'div', { class: 'bc-tpls' } );
			var create = function ( body, btn ) {
				body.title = name.value;
				BC.busy( btn, BC.api( 'wheels', { body: body } ) ).then( function ( r ) {
					m.close();
					BC.toast( t( 'گردونه ساخته شد', 'Wheel created' ), 'success' );
					BC.refreshBoot().then( function () { location.hash = '#/edit?id=' + r.id; } );
				} ).catch( BC.fail );
			};
			grid.appendChild( h( 'button', { type: 'button', class: 'bc-tpl', onClick: function ( e ) { create( {}, e.currentTarget ); } }, h( 'span', { class: 'bc-tpl__ic' }, BC.icon( 'plus', 20 ) ), h( 'b', { text: t( 'گردونه خالی', 'Blank wheel' ) } ), h( 'small', { text: t( 'تنظیمات پیش‌فرض با ۸ جایزه نمونه', 'Defaults with 8 sample prizes' ) } ) ) );
			( BC.boot.templates || [] ).forEach( function ( tp ) {
				grid.appendChild( h( 'button', { type: 'button', class: 'bc-tpl', onClick: function ( e ) { create( { template: tp.key }, e.currentTarget ); } }, h( 'span', { class: 'bc-tpl__ic' }, BC.icon( 'wheel', 20 ) ), h( 'b', { text: tp.title } ), h( 'small', { text: tp.desc } ) ) );
			} );
			m.body.appendChild( grid );
			m.foot.appendChild( BC.btn( BC.il( 'upload', t( 'درون‌ریزی از فایل', 'Import from file' ), 15 ), function () {
				BC.pickFile().then( function ( txt ) {
					BC.api( 'wheels/import', { body: { data: txt } } ).then( function ( r ) {
						m.close();
						BC.refreshBoot().then( function () { location.hash = '#/edit?id=' + r.id; } );
					} ).catch( BC.fail );
				} );
			} ) );
		}
		load( view, BC.api( 'wheels' ), function ( list ) {
			view.appendChild( head( 'wheel', t( 'گردونه‌ها', 'Wheels' ), t( 'هر تعداد گردونه با تم، جایزه، قوانین و صفحات جداگانه بسازید.', 'Create any number of wheels, each with its own theme, prizes, rules and pages.' ), BC.btn( BC.il( 'plus', t( 'گردونه جدید', 'New wheel' ), 16 ), newWheel, 'primary' ) ) );
			if ( ! list.length ) {
				view.appendChild( BC.empty( t( 'هنوز گردونه‌ای ندارید', 'No wheels yet' ), t( 'با یک الگوی آماده در کمتر از یک دقیقه شروع کنید.', 'Start from a template in under a minute.' ), BC.btn( BC.il( 'plus', t( 'ساخت اولین گردونه', 'Create the first wheel' ), 16 ), newWheel, 'primary' ), 'wheel' ) );
			}
			var grid = h( 'div', { class: 'bc-wheels' } );
			list.forEach( function ( wh ) {
				var thumb = h( 'div', { class: 'bc-wheel__thumb' } );
				var modes = { free: t( 'آزاد با سهمیه', 'Free' ), credits: t( 'با شانس کسب‌شده', 'Earned spins' ), hybrid: t( 'ترکیبی', 'Hybrid' ) };
				var statusB = wh.status === 'active' ? ( wh.open ? BC.badge( t( 'فعال', 'Active' ), 'good' ) : BC.badge( t( 'خارج از زمان‌بندی', 'Out of schedule' ), 'warn' ) ) : ( wh.status === 'paused' ? BC.badge( t( 'متوقف', 'Paused' ), 'warn' ) : BC.badge( t( 'پیش‌نویس', 'Draft' ), 'default' ) );
				var card = h( 'div', { class: 'bc-wheel' },
					h( 'a', { href: '#/edit?id=' + wh.id, class: 'bc-wheel__top' }, thumb, h( 'div', { class: 'bc-wheel__info' }, h( 'b', { text: wh.title } ), h( 'div', { class: 'bc-chips' }, statusB, BC.badge( modes[ wh.mode ] || wh.mode, 'brand' ), BC.badge( '#' + wh.id, 'default' ) ) ) ),
					h( 'div', { class: 'bc-wheel__stats' },
						h( 'div', null, h( 'b', { text: BC.num( wh.spins, 0 ) } ), h( 'small', { text: t( 'چرخش', 'spins' ) } ) ),
						h( 'div', null, h( 'b', { text: BC.num( wh.wins, 0 ) } ), h( 'small', { text: t( 'برد', 'wins' ) } ) ),
						h( 'div', null, h( 'b', { text: BC.num( wh.redeemed, 0 ) } ), h( 'small', { text: t( 'استفاده', 'redeemed' ) } ) ),
						h( 'div', null, h( 'b', { text: BC.money( wh.revenue ) } ), h( 'small', { text: t( 'فروش', 'revenue' ) } ) )
					),
					h( 'div', { class: 'bc-wheel__actions' },
						h( 'a', { href: '#/edit?id=' + wh.id, class: 'bc-btn bc-btn--sm bc-btn--primary' }, BC.icon( 'edit', 14 ), t( 'ویرایش', 'Edit' ) ),
						BC.btn( wh.status === 'active' ? t( 'توقف', 'Pause' ) : t( 'فعال‌سازی', 'Activate' ), function ( e ) {
							BC.busy( e.currentTarget, BC.api( 'wheels/' + wh.id + '/status', { body: { status: wh.status === 'active' ? 'paused' : 'active' } } ) ).then( function () { BC.refreshBoot(); P.wheels( view ); } ).catch( BC.fail );
						}, 'sm' ),
						h( 'a', { class: 'bc-btn bc-btn--sm', href: BC.config.homeUrl + '?bch_preview=' + wh.id, target: '_blank', rel: 'noopener', title: t( 'پیش‌نمایش', 'Preview' ) }, BC.icon( 'external', 14 ) ),
						BC.btn( BC.icon( 'copy', 14 ), function () {
							BC.api( 'wheels/' + wh.id + '/duplicate', { body: {} } ).then( function () { BC.toast( t( 'کپی ساخته شد', 'Duplicated' ), 'success' ); BC.refreshBoot(); P.wheels( view ); } ).catch( BC.fail );
						}, 'sm', { title: t( 'تکثیر', 'Duplicate' ) } ),
						BC.btn( BC.icon( 'download', 14 ), function () {
							BC.api( 'wheels/' + wh.id + '/export' ).then( function ( r ) { BC.download( 'becharkhoon-wheel-' + wh.id + '.json', JSON.stringify( r, null, 2 ) ); } ).catch( BC.fail );
						}, 'sm', { title: t( 'خروجی', 'Export' ) } ),
						BC.btn( BC.icon( 'trash', 14 ), function () {
							BC.confirm( t( 'گردونه «%1» حذف شود؟ آمار و برندگان قبلی حفظ می‌شوند.', 'Delete wheel "%1"? Past spins are kept.', wh.title ), function () {
								BC.api( 'wheels/' + wh.id, { method: 'DELETE' } ).then( function () { BC.refreshBoot(); P.wheels( view ); } ).catch( BC.fail );
							}, true );
						}, 'sm ghost', { title: t( 'حذف', 'Delete' ) } )
					)
				);
				grid.appendChild( card );
				if ( w.Becharkhoon && wh.preview ) {
					setTimeout( function () { new w.Becharkhoon.Wheel( thumb, wh.preview, { static: true } ); }, 0 );
				}
			} );
			view.appendChild( grid );
			if ( q && q.new ) {
				newWheel();
			}
		} );
	};
	P.edit = function ( view, q ) {
		BC.Editor.open( view, +q.id );
	};

	/* ================================================================== Rules */
	P.rules = function ( view ) {
		var TR = {
			first_order: [ t( 'اولین سفارش', 'First order' ), t( 'وقتی مشتری اولین سفارش پرداخت‌شده‌اش را ثبت کند.', 'When a customer places their first paid order.' ), 'gift' ],
			order_amount: [ t( 'سفارش بالای مبلغ مشخص', 'Order above an amount' ), t( 'هر سفارش با مبلغ برابر یا بیشتر از عدد تعیین‌شده (مثلاً ۲ میلیون).', 'Each order of at least the amount (e.g. 2,000,000).' ), 'trending' ],
			every_amount: [ t( 'به ازای هر X تومان خرید', 'Per amount spent' ), t( 'تعداد شانس = مبلغ سفارش ÷ X (با سقف).', 'Spins = order total ÷ X (capped).' ), 'percent' ],
			order_paid: [ t( 'هر سفارش', 'Every order' ), t( 'هر سفارش پرداخت‌شده (با شرط‌های دلخواه).', 'Every paid order (with optional conditions).' ), 'bag' ],
			nth_order: [ t( 'سفارش شماره N', 'Nth order' ), t( 'مثلاً دومین یا پنجمین سفارش مشتری (وفاداری).', 'e.g. the 2nd or 5th order (loyalty).' ), 'crown' ],
			register: [ t( 'ثبت‌نام در سایت', 'Registration' ), t( 'وقتی کاربر جدید ثبت‌نام می‌کند.', 'When a new user registers.' ), 'user' ],
			review: [ t( 'دیدگاه محصول', 'Product review' ), t( 'بعد از تایید دیدگاه کاربر روی محصول.', 'When a product review is approved.' ), 'message' ],
			referral_signup: [ t( 'ثبت‌نام دوست دعوت‌شده', 'Referred signup' ), t( 'به دعوت‌کننده وقتی دوستش با لینک او ثبت‌نام کند.', 'To the referrer when a friend signs up via their link.' ), 'users' ],
			referral_order: [ t( 'خرید دوست دعوت‌شده', 'Referred order' ), t( 'به دعوت‌کننده وقتی دوستش خرید کند (یک‌بار برای هر دوست).', 'To the referrer when a friend buys (once per friend).' ), 'users' ],
			birthday: [ t( 'تولد مشتری', 'Birthday' ), t( 'روز تولد (از فیلد تاریخ تولد فرم گردونه).', 'On their birthday (from the wheel form\'s birthday field).' ), 'gift' ],
			lead: [ t( 'ثبت شماره در فرم', 'Lead captured' ), t( 'وقتی شماره تاییدشده/کاربر جدید در فرم ثبت شود.', 'When a verified number / user joins via the form.' ), 'magnet' ],
		};
		load( view, BC.api( 'rules' ), function ( r ) {
			var rules = r.rules;
			var dirty = false;
			var saveBtn = BC.btn( BC.il( 'save', t( 'ذخیره قوانین', 'Save rules' ), 16 ), function () {
				BC.busy( saveBtn, BC.api( 'rules', { method: 'PUT', body: { rules: rules } } ) ).then( function ( res ) {
					rules = res.rules;
					dirty = false;
					BC.toast( t( 'قوانین ذخیره شد ✓', 'Rules saved ✓' ), 'success' );
					draw();
				} ).catch( BC.fail );
			}, 'primary' );
			view.appendChild( head( 'ticket', t( 'قوانین شانس', 'Spin rules' ), t( 'تعیین کنید هر کسی با چه کاری چند بار می‌تواند گردونه را بچرخاند. شانس‌ها به حساب کاربری (یا شماره موبایل برای مهمان‌ها) اضافه می‌شوند.', 'Decide who earns how many spins for what. Spins go to the account (or mobile number for guests).' ), saveBtn ) );
			view.appendChild( BC.alert( 'info', t( 'نکته: گردونه‌ای که این شانس‌ها را قبول کند باید در تب «چه کسی و چند بار» روی «فقط با شانس کسب‌شده» یا «ترکیبی» باشد. وضعیت‌های سفارش قابل قبول در تنظیمات (پیش‌فرض: در حال انجام و تکمیل‌شده) تعیین می‌شود؛ سفارش لغو/مسترد شده، شانس‌های استفاده‌نشده‌اش را از دست می‌دهد.', 'Tip: the wheel must use "Earned spins only" or "Hybrid" access. Qualifying order statuses are set in Settings (default: processing & completed); refunded/cancelled orders lose their unused spins.' ) ) );
			var box = h( 'div' );
			view.appendChild( box );
			function draw() {
				BC.clear( box );
				if ( ! rules.length ) {
					box.appendChild( BC.empty( t( 'هنوز قانونی ندارید', 'No rules yet' ), t( 'مثلاً: «اولین سفارش = ۱ شانس» یا «سفارش بالای ۲ میلیون = ۱ شانس».', 'e.g. "first order = 1 spin" or "order over 2M = 1 spin".' ), null, 'ticket' ) );
				}
				rules.forEach( function ( rule, i ) {
					var tr = TR[ rule.trigger ] || [ rule.trigger, '', 'ticket' ];
					var isOrder = [ 'order_paid', 'first_order', 'order_amount', 'every_amount', 'nth_order', 'referral_order' ].indexOf( rule.trigger ) > -1;
					var defs = [
						{ k: 'enabled', type: 'switch', label: t( 'فعال', 'Enabled' ), cols: 'third' },
						{ k: 'title', label: t( 'عنوان (در سوابق مشتری)', 'Title (shown to the customer)' ), cols: 'third' },
						{ k: 'trigger', type: 'select', label: t( 'وقتی…', 'When…' ), cols: 'third', opts: Object.keys( TR ).map( function ( k ) { return { value: k, label: TR[ k ][ 0 ] }; } ), onSet: function () { draw(); } },
						{ k: 'amount', type: 'number', label: rule.trigger === 'every_amount' ? t( 'به ازای هر (مبلغ)', 'Per (amount)' ) : t( 'حداقل مبلغ سفارش', 'Minimum order total' ), min: 0, unit: F.cur(), cols: 'third', show: function () { return [ 'order_amount', 'every_amount' ].indexOf( rule.trigger ) > -1; }, help: rule.amount ? BC.money( rule.amount ) : '' },
						{ k: 'nth', type: 'number', label: t( 'شماره سفارش', 'Order number' ), min: 1, cols: 'third', show: function () { return rule.trigger === 'nth_order'; } },
						{ k: 'qty', type: 'number', label: t( 'تعداد شانس', 'Spins to give' ), min: 1, max: 100, cols: 'third' },
						{ k: 'max_qty', type: 'number', label: t( 'سقف شانس در هر سفارش', 'Max spins per order' ), min: 1, cols: 'third', show: function () { return rule.trigger === 'every_amount'; } },
						{ k: 'wheel_id', type: 'select', numeric: true, label: t( 'برای کدام گردونه', 'For which wheel' ), cols: 'third', opts: [ { value: 0, label: t( 'همه گردونه‌ها', 'Any wheel' ) } ].concat( ( BC.boot.wheels || [] ).map( function ( x ) { return { value: x.id, label: x.title }; } ) ) },
						{ k: 'expiry_days', type: 'number', label: t( 'انقضای شانس (روز، ۰ = همیشگی)', 'Spins expire after (days, 0 = never)' ), min: 0, cols: 'third' },
						{ k: 'max_per_user', type: 'number', label: t( 'سقف کل برای هر نفر (۰ = نامحدود)', 'Lifetime cap per person (0 = ∞)' ), min: 0, cols: 'third' },
						{ k: 'statuses', type: 'chips', label: t( 'وضعیت‌های سفارش (خالی = طبق تنظیمات)', 'Order statuses (empty = settings)' ), opts: function () { return BC.boot.statuses || []; }, show: function () { return isOrder; } },
						{ k: 'notify_sms', type: 'switch', label: t( 'پیامک «شانس گرفتید» با لینک گردونه', 'SMS "you earned spins" with a link' ), cols: 'half' },
						{ k: 'notify_email', type: 'switch', label: t( 'ایمیل اطلاع‌رسانی', 'Email notification' ), cols: 'half' },
						{ k: 'show_in_popup', type: 'switch', label: t( 'نمایش در راهنمای «چطور شانس بگیرم»', 'List in "how to earn"' ), cols: 'half' },
						{ k: 'hint', label: t( 'متن راهنما (خالی = خودکار)', 'Hint text (empty = automatic)' ), cols: 'half' },
						{ type: 'custom', render: function () {
							return h( 'div', { class: 'bc-sub' }, F.conditions( rule.conditions, isOrder ? 'order' : 'any', function () { dirty = true; }, { title: t( 'شرط‌های بیشتر', 'More conditions' ), off: t( 'بدون شرط اضافه.', 'No extra conditions.' ), presets: isOrder ? F.orderPresets() : F.audiencePresets() } ) );
						} },
					];
					var card = BC.card( { title: ( rule.title || tr[ 0 ] ), sub: tr[ 1 ], icon: tr[ 2 ], actions: [
						rule.enabled ? BC.badge( t( 'فعال', 'On' ), 'good' ) : BC.badge( t( 'خاموش', 'Off' ), 'default' ),
						isOrder && rule.id ? BC.btn( BC.il( 'refresh', t( 'اعمال روی سفارش‌های قبلی', 'Apply to past orders' ), 14 ), function ( e ) { backfill( rule, e.currentTarget ); }, 'sm ghost' ) : null,
						BC.btn( BC.icon( 'trash', 15 ), function () { rules.splice( i, 1 ); dirty = true; draw(); }, 'sm ghost', { 'aria-label': t( 'حذف', 'Delete' ) } ),
					] }, F.render( defs, rule, function () { dirty = true; } ) );
					box.appendChild( card );
				} );
				var add = h( 'div', { class: 'bc-tpls bc-tpls--sm' } );
				Object.keys( TR ).forEach( function ( k ) {
					add.appendChild( h( 'button', { type: 'button', class: 'bc-tpl', onClick: function () {
						var def = clone( BC.boot.rule_defaults );
						def.trigger = k;
						def.title = TR[ k ][ 0 ];
						if ( k === 'order_amount' ) { def.amount = 2000000; }
						if ( k === 'every_amount' ) { def.amount = 500000; }
						rules.push( def );
						dirty = true;
						draw();
						setTimeout( function () { w.scrollTo( 0, d.body.scrollHeight ); }, 50 );
					} }, h( 'span', { class: 'bc-tpl__ic' }, BC.icon( TR[ k ][ 2 ], 18 ) ), h( 'b', { text: TR[ k ][ 0 ] } ), h( 'small', { text: TR[ k ][ 1 ] } ) ) );
				} );
				box.appendChild( BC.card( { title: t( 'افزودن قانون', 'Add a rule' ), icon: 'plus' }, add ) );
			}
			function backfill( rule, btn ) {
				var m = BC.modal( { title: t( 'اعمال روی سفارش‌های قبلی', 'Apply to past orders' ) } );
				var days = h( 'input', { class: 'bc-input', type: 'number', value: 30, min: 1, max: 365 } );
				m.body.appendChild( h( 'p', { text: t( 'این قانون روی سفارش‌های پرداخت‌شده چند روز گذشته اجرا می‌شود. هر سفارش فقط یک‌بار شانس می‌گیرد (تکراری ثبت نمی‌شود).', 'Runs this rule on paid orders of the last N days. Each order is rewarded once (no duplicates).' ) } ) );
				m.body.appendChild( h( 'div', { class: 'bc-field' }, h( 'label', { class: 'bc-field__label', text: t( 'چند روز گذشته', 'Last N days' ) } ), days ) );
				var out = h( 'p', { class: 'bc-muted' } );
				m.body.appendChild( out );
				var go = BC.btn( t( 'اجرا', 'Run' ), function () {
					var total = 0;
					var page = 1;
					var step = function () {
						return BC.api( 'rules/backfill', { body: { rule_id: rule.id, days: +days.value, page: page } } ).then( function ( r ) {
							total += r.granted;
							out.textContent = t( 'شانس داده‌شده: %1', 'Granted: %1', BC.num( total, 0 ) );
							if ( r.next ) {
								page = r.next;
								return step();
							}
						} );
					};
					if ( dirty ) {
						BC.toast( t( 'ابتدا قوانین را ذخیره کنید.', 'Save the rules first.' ), 'warn' );
						return;
					}
					BC.busy( go, step() ).then( function () { BC.toast( t( 'انجام شد', 'Done' ), 'success' ); } ).catch( BC.fail );
				}, 'primary' );
				m.foot.appendChild( go );
				void btn;
			}
			draw();
		} );
	};

	/* ================================================================== Spins */
	P.spins = function ( view, q ) {
		var st = { page: 1, search: q.search || '', result: '', status: '', wheel_id: q.wheel || '' };
		function render() {
			load( view, BC.api( 'spins', { query: { page: st.page, per_page: 25, search: st.search, result: st.result, status: st.status, wheel_id: st.wheel_id } } ), function ( r ) {
				var exportUrl = BC.config.exportUrl + '&what=spins' + ( st.wheel_id ? '&wheel_id=' + st.wheel_id : '' ) + ( st.result ? '&result=' + st.result : '' );
				view.appendChild( head( 'activity', t( 'چرخش‌ها و برندگان', 'Spins & winners' ), t( 'همه چرخش‌ها با جایزه، کد، وضعیت استفاده و سفارش مرتبط.', 'Every spin with its prize, code, redemption status and order.' ), h( 'a', { class: 'bc-btn', href: exportUrl }, BC.icon( 'download', 16 ), t( 'خروجی CSV / اکسل', 'Export CSV / Excel' ) ) ) );
				var search = h( 'input', { class: 'bc-input', type: 'search', placeholder: t( 'جستجو: نام، موبایل، ایمیل، کد، جایزه، IP', 'Search: name, phone, email, code, prize, IP' ), value: st.search } );
				search.addEventListener( 'change', function () { st.search = search.value; st.page = 1; render(); } );
				var resSel = h( 'select', { class: 'bc-input bc-select' }, [ [ '', t( 'همه نتایج', 'All results' ) ], [ 'win', t( 'برنده', 'Wins' ) ], [ 'lose', t( 'پوچ', 'Losses' ) ], [ 'respin', t( 'دوباره', 'Re-spins' ) ] ].map( function ( x ) { return h( 'option', { value: x[ 0 ], text: x[ 1 ] } ); } ) );
				resSel.value = st.result;
				resSel.addEventListener( 'change', function () { st.result = resSel.value; st.page = 1; render(); } );
				var stSel = h( 'select', { class: 'bc-input bc-select' }, [ [ '', t( 'همه وضعیت‌ها', 'All statuses' ) ], [ 'issued', t( 'صادر شده', 'Issued' ) ], [ 'redeemed', t( 'استفاده شده', 'Redeemed' ) ], [ 'expired', t( 'منقضی', 'Expired' ) ], [ 'pending', t( 'منتظر آدرس', 'Awaiting details' ) ], [ 'claimed', t( 'آدرس ثبت شد', 'Claimed' ) ], [ 'delivered', t( 'تحویل شد', 'Delivered' ) ], [ 'revoked', t( 'باطل', 'Revoked' ) ] ].map( function ( x ) { return h( 'option', { value: x[ 0 ], text: x[ 1 ] } ); } ) );
				stSel.value = st.status;
				stSel.addEventListener( 'change', function () { st.status = stSel.value; st.page = 1; render(); } );
				view.appendChild( h( 'div', { class: 'bc-filters' }, search, wheelSelect( st.wheel_id, function ( v ) { st.wheel_id = v; st.page = 1; render(); } ), resSel, stSel ) );
				view.appendChild( BC.card( { title: t( '%1 چرخش', '%1 spins', BC.num( r.total, 0 ) ), icon: 'list' }, [ BC.table( [
					{ label: '#', render: function ( x ) { return BC.num( x.id, 0 ); } },
					{ label: t( 'زمان', 'Date' ), render: function ( x ) { return h( 'span', { title: x.created_local, text: BC.date( x.created_at, true ) } ); } },
					{ label: t( 'گردونه', 'Wheel' ), key: 'wheel' },
					{ label: t( 'نتیجه', 'Result' ), render: function ( x ) { return h( 'div', { class: 'bc-iconline' }, RESULT( x.result ), h( 'span', { text: x.slice_label } ) ); } },
					{ label: t( 'کد', 'Code' ), render: function ( x ) { return x.coupon_code ? h( 'span', { class: 'bc-iconline' }, h( 'code', { dir: 'ltr', text: x.coupon_id ? x.coupon_code.toUpperCase() : x.coupon_code } ), BC.btn( BC.icon( 'copy', 13 ), function () { BC.copy( x.coupon_code ); }, 'sm ghost' ) ) : null; } },
					{ label: t( 'وضعیت', 'Status' ), render: function ( x ) { return h( 'div', null, STATUS( x.status ), x.order_id ? h( 'a', { href: x.edit_order, class: 'bc-link', text: ' #' + x.order_id } ) : null ); } },
					{ label: t( 'شخص', 'Person' ), render: function ( x ) { return h( 'div', { class: 'bc-person' }, x.name ? h( 'b', { text: x.name } ) : null, x.phone ? h( 'span', { dir: 'ltr', text: x.phone } ) : null, x.email ? h( 'small', { dir: 'ltr', text: x.email } ) : null, x.user_id > 0 ? h( 'a', { href: BC.config.adminUrl + 'user-edit.php?user_id=' + x.user_id, class: 'bc-link', text: t( 'حساب', 'account' ) } ) : null ); } },
					{ label: t( 'منبع', 'Source' ), render: function ( x ) { return h( 'small', { text: [ x.source, x.meta && x.meta.device, x.meta && x.meta.via ].filter( Boolean ).join( ' | ' ) } ); } },
					{ label: '', render: function ( x ) { return spinActions( x, render ); } },
				], r.items ), BC.pager( r.total, st.page, 25, function ( p ) { st.page = p; render(); } ) ] ) );
			} );
		}
		render();
	};
	function spinActions( x, done ) {
		var claim = x.meta && x.meta.claim;
		return h( 'div', { class: 'bc-row bc-row--tight' },
			claim ? BC.btn( BC.icon( 'eye', 14 ), function () {
				var m = BC.modal( { title: t( 'اطلاعات تحویل', 'Delivery details' ) } );
				Object.keys( claim ).forEach( function ( k ) { m.body.appendChild( h( 'p', null, h( 'b', { text: k + ': ' } ), claim[ k ] ) ); } );
				m.foot.appendChild( BC.btn( t( 'علامت «تحویل شد»', 'Mark delivered' ), function () { BC.api( 'spins/' + x.id, { method: 'PUT', body: { status: 'delivered' } } ).then( function () { m.close(); done(); } ).catch( BC.fail ); }, 'primary' ) );
			}, 'sm', { title: t( 'آدرس', 'Address' ) } ) : null,
			x.result === 'win' && ( x.phone || x.email ) ? BC.btn( BC.icon( 'send', 14 ), function () {
				var m = BC.modal( { title: t( 'ارسال مجدد جایزه', 'Resend prize' ) } );
				m.body.appendChild( h( 'p', { text: t( 'پیامک یا ایمیل جایزه دوباره ارسال شود؟', 'Resend the prize SMS or email?' ) } ) );
				if ( x.phone ) {
					m.foot.appendChild( BC.btn( t( 'پیامک', 'SMS' ), function ( e ) { BC.busy( e.currentTarget, BC.api( 'spins/' + x.id + '/resend', { body: { channel: 'sms' } } ) ).then( function ( r ) { BC.toast( r.ok ? t( 'ارسال شد', 'Sent' ) : t( 'ارسال نشد؛ گزارش پیامک را ببینید', 'Failed; see the SMS log' ), r.ok ? 'success' : 'error' ); m.close(); } ); }, 'primary' ) );
				}
				if ( x.email ) {
					m.foot.appendChild( BC.btn( t( 'ایمیل', 'Email' ), function ( e ) { BC.busy( e.currentTarget, BC.api( 'spins/' + x.id + '/resend', { body: { channel: 'email' } } ) ).then( function ( r ) { BC.toast( r.ok ? t( 'ارسال شد', 'Sent' ) : t( 'ارسال نشد', 'Failed' ), r.ok ? 'success' : 'error' ); m.close(); } ); } ) );
				}
			}, 'sm', { title: t( 'ارسال مجدد', 'Resend' ) } ) : null,
			x.result === 'win' && [ 'issued', 'pending', 'claimed' ].indexOf( x.status ) > -1 ? BC.btn( BC.icon( 'x-circle', 14 ), function () {
				BC.confirm( t( 'این جایزه باطل شود؟ کد تخفیف آن به زباله‌دان منتقل می‌شود.', 'Revoke this prize? Its coupon is trashed.' ), function () {
					BC.api( 'spins/' + x.id, { method: 'PUT', body: { status: 'revoked' } } ).then( done ).catch( BC.fail );
				}, true );
			}, 'sm ghost', { title: t( 'ابطال', 'Revoke' ) } ) : null,
			x.edit_coupon ? h( 'a', { class: 'bc-btn bc-btn--sm bc-btn--ghost', href: x.edit_coupon, title: t( 'کوپن', 'Coupon' ) }, BC.icon( 'ticket', 14 ) ) : null
		);
	}

	/* ================================================================== Leads */
	P.leads = function ( view ) {
		var st = { page: 1, search: '', marketing: false, verified: false };
		function render() {
			load( view, BC.api( 'leads', { query: { page: st.page, per_page: 25, search: st.search, marketing: st.marketing ? 1 : '', verified: st.verified ? 1 : '' } } ), function ( r ) {
				view.appendChild( head( 'users', t( 'مخاطبان', 'Leads' ), t( 'هر کسی که فرم گردونه را پر کرده؛ برای بازاریابی پیامکی و ایمیلی.', 'Everyone who filled a wheel form — for SMS and email marketing.' ), [
					BC.btn( BC.il( 'download', t( 'خروجی برای پیامک / باشگاه مشتریان', 'Export for SMS / customer club' ), 16 ), function () { exportContacts( { source: 'leads', marketing: st.marketing, verified: st.verified } ); } ),
					h( 'a', { class: 'bc-btn', href: BC.config.exportUrl + '&what=leads' + ( st.marketing ? '&marketing=1' : '' ) }, BC.icon( 'download', 16 ), t( 'CSV کامل مخاطبان', 'Full leads CSV' ) ),
					BC.btn( BC.il( 'send', t( 'پیامک گروهی', 'Bulk SMS' ), 16 ), bulkSms, 'primary' ),
				] ) );
				var search = h( 'input', { class: 'bc-input', type: 'search', placeholder: t( 'جستجو: نام، موبایل، ایمیل', 'Search: name, phone, email' ), value: st.search } );
				search.addEventListener( 'change', function () { st.search = search.value; st.page = 1; render(); } );
				var mk = h( 'input', { type: 'checkbox', checked: st.marketing } );
				mk.addEventListener( 'change', function () { st.marketing = mk.checked; st.page = 1; render(); } );
				var vf = h( 'input', { type: 'checkbox', checked: st.verified } );
				vf.addEventListener( 'change', function () { st.verified = vf.checked; st.page = 1; render(); } );
				view.appendChild( h( 'div', { class: 'bc-filters' }, search, h( 'label', { class: 'bc-check' }, mk, t( 'فقط موافقان دریافت پیشنهاد', 'Marketing opt-in only' ) ), h( 'label', { class: 'bc-check' }, vf, t( 'فقط موبایل تاییدشده', 'Verified mobile only' ) ) ) );
				view.appendChild( BC.card( { title: t( '%1 مخاطب', '%1 leads', BC.num( r.total, 0 ) ), icon: 'users' }, [ BC.table( [
					{ label: t( 'نام', 'Name' ), render: function ( x ) { return x.name || '—'; } },
					{ label: t( 'موبایل', 'Mobile' ), render: function ( x ) { return x.phone ? h( 'span', { class: 'bc-iconline' }, h( 'span', { dir: 'ltr', text: x.phone } ), +x.phone_verified ? BC.icon( 'shield', 14, 'is-good' ) : null ) : '—'; } },
					{ label: t( 'ایمیل', 'Email' ), render: function ( x ) { return x.email ? h( 'span', { dir: 'ltr', text: x.email } ) : '—'; } },
					{ label: t( 'چرخش/برد', 'Spins/wins' ), render: function ( x ) { return BC.num( x.spins, 0 ) + ' / ' + BC.num( x.wins, 0 ); } },
					{ label: t( 'فیلدها', 'Fields' ), render: function ( x ) { var k = Object.keys( x.fields || {} ); return k.length ? h( 'small', { text: k.map( function ( n ) { return n + ': ' + x.fields[ n ]; } ).join( ' | ' ) } ) : '—'; } },
					{ label: t( 'پیشنهادها', 'Opt-in' ), render: function ( x ) { return BC.yes( +x.marketing ); } },
					{ label: t( 'اولین ثبت', 'First seen' ), render: function ( x ) { return BC.date( x.created_at ); } },
					{ label: '', render: function ( x ) { return h( 'div', { class: 'bc-row bc-row--tight' }, h( 'a', { class: 'bc-btn bc-btn--sm bc-btn--ghost', href: '#/spins?search=' + encodeURIComponent( x.phone || x.email ), title: t( 'چرخش‌ها', 'Spins' ) }, BC.icon( 'activity', 14 ) ), BC.btn( BC.icon( 'trash', 14 ), function () { BC.confirm( t( 'این مخاطب حذف شود؟', 'Delete this lead?' ), function () { BC.api( 'leads/' + x.id, { method: 'DELETE' } ).then( render ).catch( BC.fail ); }, true ); }, 'sm ghost' ) ); } },
				], r.items ), BC.pager( r.total, st.page, 25, function ( p ) { st.page = p; render(); } ) ] ) );
			} );
		}
		function bulkSms() {
			bulkCenter( { source: 'leads', marketing: st.marketing, verified: st.verified } );
		}
		render();
	};

	/* ================================================================== Period picker (Jalali-aware) */
	function pparts( dt ) {
		try {
			var o = {};
			new Intl.DateTimeFormat( 'en-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' } ).formatToParts( dt ).forEach( function ( x ) {
				if ( x.type !== 'literal' ) {
					o[ x.type ] = +String( x.value ).replace( /\D/g, '' );
				}
			} );
			return o;
		} catch ( e ) {
			return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
		}
	}
	function monthStart( dt ) {
		var x = new Date( dt.getTime() );
		if ( BC.fa ) {
			x.setDate( x.getDate() - ( pparts( x ).day - 1 ) );
		} else {
			x.setDate( 1 );
		}
		return x;
	}
	function yearStart( dt ) {
		var x = new Date( dt.getTime() );
		if ( ! BC.fa ) {
			return new Date( x.getFullYear(), 0, 1 );
		}
		for ( var i = 0; i < 370; i++ ) {
			var p = pparts( x );
			if ( p.month === 1 && p.day === 1 ) {
				break;
			}
			x.setDate( x.getDate() - 1 );
		}
		return x;
	}
	var PRESETS = function () {
		return [
			[ 'today', t( 'امروز', 'Today' ) ], [ 'yesterday', t( 'دیروز', 'Yesterday' ) ], [ '7', t( '۷ روز اخیر', 'Last 7 days' ) ], [ '30', t( '۳۰ روز اخیر', 'Last 30 days' ) ],
			[ 'month', t( 'این ماه', 'This month' ) ], [ 'lastmonth', t( 'ماه قبل', 'Last month' ) ], [ '90', t( '۹۰ روز اخیر', 'Last 90 days' ) ], [ 'year', t( 'امسال', 'This year' ) ], [ 'all', t( 'از ابتدا تا امروز', 'All time' ) ], [ 'custom', t( 'بازه دلخواه…', 'Custom…' ) ],
		];
	};
	function presetRange( k ) {
		var now = new Date();
		var day = 86400000;
		var f = now;
		var to = now;
		switch ( k ) {
			case 'yesterday': f = to = new Date( Date.now() - day ); break;
			case '7': f = new Date( Date.now() - 6 * day ); break;
			case '30': f = new Date( Date.now() - 29 * day ); break;
			case '90': f = new Date( Date.now() - 89 * day ); break;
			case 'month': f = monthStart( now ); break;
			case 'lastmonth': to = new Date( monthStart( now ).getTime() - day ); f = monthStart( to ); break;
			case 'year': f = yearStart( now ); break;
			case 'all': f = new Date( 2015, 0, 1 ); break;
		}
		return { from: iso( f ), to: iso( to ) };
	}
	/** "2026-10-29" or "2026-10-29 14:05" (site time) → readable (Jalali in Persian). */
	function localLabel( s ) {
		if ( ! s ) {
			return '—';
		}
		var m = String( s ).match( /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/ );
		if ( ! m ) {
			return s;
		}
		var dt = new Date( +m[ 1 ], +m[ 2 ] - 1, +m[ 3 ], +( m[ 4 ] || 0 ), +( m[ 5 ] || 0 ) );
		var o = { year: 'numeric', month: 'long', day: 'numeric' };
		if ( m[ 4 ] ) {
			o.hour = '2-digit';
			o.minute = '2-digit';
		}
		try {
			return dt.toLocaleString( BC.fa ? 'fa-IR-u-ca-persian' : 'en-GB', o );
		} catch ( e ) {
			return s;
		}
	}
	/** Short axis label for "Y-m-d" or "Y-m-d H:00" buckets. */
	function axisLabel( s, short ) {
		var m = String( s ).match( /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):\d{2})?/ );
		if ( ! m ) {
			return s;
		}
		var dt = new Date( +m[ 1 ], +m[ 2 ] - 1, +m[ 3 ], +( m[ 4 ] || 0 ) );
		try {
			if ( m[ 4 ] ) {
				return short ? BC.digits( m[ 4 ] + ':00' ) : dt.toLocaleString( BC.fa ? 'fa-IR-u-ca-persian' : 'en-GB', { month: 'short', day: 'numeric', hour: '2-digit' } );
			}
			return dt.toLocaleDateString( BC.fa ? 'fa-IR-u-ca-persian' : 'en-GB', short ? { month: 'numeric', day: 'numeric' } : { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' } );
		} catch ( e ) {
			return s;
		}
	}
	/**
	 * Period bar: presets (this Persian month, last month, this year…) or an exact custom range.
	 * opts.time = true → custom range has hours and minutes.
	 */
	function rangeBar( st, onChange, opts ) {
		opts = opts || {};
		if ( ! st.preset ) {
			st.preset = '30';
		}
		if ( ! st.from ) {
			Object.assign( st, presetRange( st.preset ) );
		}
		var box = h( 'div', { class: 'bc-range' } );
		var sel = h( 'select', { class: 'bc-input bc-select', 'aria-label': t( 'بازه زمانی', 'Period' ) }, PRESETS().map( function ( p ) { return h( 'option', { value: p[ 0 ], text: p[ 1 ] } ); } ) );
		sel.value = st.preset;
		var type = opts.time ? 'datetime-local' : 'date';
		var toInput = function ( v ) { return opts.time ? String( v ).replace( ' ', 'T' ).slice( 0, 16 ) + ( String( v ).length <= 10 ? 'T00:00' : '' ) : String( v ).slice( 0, 10 ); };
		var fi = h( 'input', { class: 'bc-input', type: type, dir: 'ltr', value: toInput( st.from ) } );
		var ti = h( 'input', { class: 'bc-input', type: type, dir: 'ltr', value: opts.time && String( st.to ).length <= 10 ? String( st.to ) + 'T23:59' : toInput( st.to ) } );
		var custom = h( 'div', { class: 'bc-range__custom', hidden: st.preset !== 'custom' }, h( 'span', { text: t( 'از', 'From' ) } ), fi, h( 'span', { text: t( 'تا', 'to' ) } ), ti,
			BC.btn( t( 'اعمال', 'Apply' ), function () {
				if ( ! fi.value || ! ti.value ) {
					return;
				}
				st.from = fi.value.replace( 'T', ' ' );
				st.to = ti.value.replace( 'T', ' ' );
				onChange();
			}, 'sm primary' ) );
		var label = h( 'div', { class: 'bc-range__label' }, BC.icon( 'calendar', 14 ), h( 'span', { text: localLabel( st.from ) + ' ← ' + localLabel( st.to ) } ) );
		if ( ! BC.fa ) {
			label.lastChild.textContent = localLabel( st.from ) + ' → ' + localLabel( st.to );
		}
		sel.addEventListener( 'change', function () {
			st.preset = sel.value;
			custom.hidden = st.preset !== 'custom';
			if ( st.preset !== 'custom' ) {
				Object.assign( st, presetRange( st.preset ) );
				onChange();
			}
		} );
		box.appendChild( h( 'div', { class: 'bc-range__row' }, sel, label ) );
		box.appendChild( custom );
		return box;
	}
	var STATUS_LABEL = function ( s ) {
		var x = ( BC.boot.statuses || [] ).filter( function ( y ) { return y.value === s; } )[ 0 ];
		var fb = { completed: t( 'تکمیل‌شده', 'Completed' ), processing: t( 'در حال انجام', 'Processing' ), 'on-hold': t( 'در انتظار بررسی', 'On hold' ), pending: t( 'در انتظار پرداخت', 'Pending payment' ), cancelled: t( 'لغو‌شده', 'Cancelled' ), refunded: t( 'مسترد‌شده', 'Refunded' ), failed: t( 'ناموفق', 'Failed' ), trash: t( 'زباله‌دان', 'Trash' ) };
		return x ? x.label : ( fb[ s ] || s );
	};
	var TYPE_LABEL = function ( v ) {
		var list = BC.Editor && BC.Editor.TYPES ? BC.Editor.TYPES() : [];
		var x = list.filter( function ( y ) { return y.value === v; } )[ 0 ];
		return x ? x.label : ( v || t( 'سایر', 'Other' ) );
	};
	var DT = function ( s ) { return BC.date( s, true ); };
	var delta = function ( cur, prev, invert ) {
		if ( ! prev ) {
			return '';
		}
		var p = ( cur - prev ) / prev * 100;
		return ( p >= 0 ? '▲ ' : '▼ ' ) + BC.num( Math.abs( p ), 0 ) + '% ' + t( 'نسبت به دوره قبل', 'vs previous' );
	};

	/* ================================================================== Bulk SMS + real spin gifts */
	function smsParts( s ) {
		s = String( s || '' );
		var uni = /[^\x00-\x7F]/.test( s );
		var n = s.length;
		var per = uni ? ( n > 70 ? 67 : 70 ) : ( n > 160 ? 153 : 160 );
		return { chars: n, parts: n ? Math.ceil( n / per ) : 0 };
	}
	function bulkCenter( preset ) {
		var m = BC.modal( { title: t( 'پیامک گروهی و هدیه شانس', 'Bulk SMS & spin gifts' ), wide: true } );
		var wheels = ( BC.boot.wheels || [] ).map( function ( x ) { return { value: x.id, label: x.title }; } );
		var model = Object.assign( {
			source: 'all', numbers: '', exclude: '', wheel_id: 0, marketing: true, verified: false, winners: '', inactive_days: 0, min_spins: 0, balance: '', unused_code: false, min_orders: 0, min_spent: 0, limit: 0,
			send_sms: true, mode: 'text', text: t( '{name} عزیز، یک شانس چرخش هدیه گرفتی 🎁 همین حالا بچرخون: {wheel_link}', 'Hi {name}, you got a free spin 🎁 Spin now: {wheel_link}' ), code: '', params: 'name={name}\nlink={wheel_link}', fallback: true,
			grant: 1, grant_wheel: wheels.length ? wheels[ 0 ].value : 0, grant_days: 14, grant_note: t( 'هدیه پیامکی', 'SMS gift' ),
			spin_now: '', spun: '', account: '', min_wins: 0, has_email: false, skip_recent: 0,
			title: '', batch_size: 100, interval_min: 0,
		}, preset || {} );
		var rs = { preset: 'all' };
		Object.assign( rs, presetRange( 'all' ) );
		var srcOpts = [
			{ value: 'all', label: t( 'همه (فرم + چرخش + شانس)', 'Everyone (forms + spins + grants)' ) },
			{ value: 'leads', label: t( 'مخاطبان فرم', 'Form leads' ) },
			{ value: 'people', label: t( 'کسانی که چرخانده یا شانس گرفته‌اند', 'Who spun / got spins' ) },
			{ value: 'customers', label: t( 'مشتریان ووکامرس', 'WooCommerce customers' ) },
			{ value: 'manual', label: t( 'شماره‌های دلخواه (وارد کردن دستی)', 'My own list (paste numbers)' ) },
		];
		var notManual = function ( x ) { return x.source !== 'manual'; };
		var VARS = [ 'name', 'mobile', 'wheel', 'wheel_link', 'n', 'spins', 'wins', 'site', 'site_url', 'date' ];
		var textArea = null;
		var counter = h( 'div', { class: 'bc-field__help' } );
		var updCounter = function () {
			var p = smsParts( model.text.replace( /\{wheel_link\}|\{link\}/g, 'https://example.com/?bch_open=1&bch_v=' + new Array( 48 ).join( 'x' ) ) );
			counter.textContent = t( '%1 نویسه، حدود %2 پیامک برای هر نفر (با لینک شخصی)', '%1 chars, about %2 SMS parts per person (with the personal link)', BC.num( p.chars, 0 ), BC.num( p.parts, 0 ) );
		};
		var chips = h( 'div', { class: 'bc-row bc-row--tight', style: { 'flex-wrap': 'wrap' } }, VARS.map( function ( v ) {
			return h( 'button', { type: 'button', class: 'bc-cchip', dir: 'ltr', text: '{' + v + '}', onClick: function () {
				if ( ! textArea ) {
					return;
				}
				var a = textArea.selectionStart || textArea.value.length;
				textArea.value = textArea.value.slice( 0, a ) + '{' + v + '}' + textArea.value.slice( textArea.selectionEnd || a );
				textArea.dispatchEvent( new Event( 'input' ) );
				textArea.focus();
			} } );
		} ) );
		var who = F.render( [
			{ type: 'heading', icon: 'users', label: t( '۱. گیرندگان', '1. Recipients' ) },
			{ k: 'source', type: 'select', label: t( 'از کدام افراد؟', 'Who?' ), opts: srcOpts },
			{ k: 'numbers', type: 'textarea', rows: 5, dir: 'ltr', label: t( 'شماره‌ها — هر خط یک شماره، یا «شماره، نام»', 'Numbers — one per line, or "mobile, name"' ), placeholder: '09121234567, علی\n09351234567', show: function ( x ) { return x.source === 'manual'; } },
			{ k: 'wheel_id', type: 'select', numeric: true, label: t( 'فقط افرادِ این گردونه', 'Only people of this wheel' ), cols: 'half', show: notManual, opts: [ { value: 0, label: t( 'همه گردونه‌ها', 'All wheels' ) } ].concat( wheels ) },
			{ k: 'winners', type: 'segment', label: t( 'برنده‌ها', 'Winners' ), cols: 'half', show: notManual, opts: [ { value: '', label: t( 'مهم نیست', 'Any' ) }, { value: 'yes', label: t( 'فقط برنده‌ها', 'Winners only' ) }, { value: 'no', label: t( 'فقط بازنده‌ها', 'Never won' ) } ] },
			{ k: 'marketing', type: 'switch', label: t( 'فقط کسانی که با دریافت پیشنهاد موافقت کرده‌اند (پیشنهادی)', 'Only marketing opt-ins (recommended)' ), cols: 'half', show: notManual },
			{ k: 'verified', type: 'switch', label: t( 'فقط موبایل‌های تاییدشده با کد', 'Only OTP-verified mobiles' ), cols: 'half', show: notManual },
			{ k: 'balance', type: 'segment', label: t( 'شانس باقی‌مانده', 'Spins left' ), cols: 'half', show: notManual, opts: [ { value: '', label: t( 'مهم نیست', 'Any' ) }, { value: 'has', label: t( 'دارد', 'Has spins' ) }, { value: 'none', label: t( 'ندارد', 'No spins' ) } ] },
			{ k: 'unused_code', type: 'switch', label: t( 'فقط کسانی که کد جایزه‌شان را استفاده نکرده‌اند', 'Only people with an unused prize code' ), cols: 'half', show: notManual },
			{ k: 'inactive_days', type: 'number', min: 0, label: t( 'حداقل روز از آخرین فعالیت (بازگشت مشتری)', 'Inactive for at least (days)' ), unit: t( 'روز', 'days' ), cols: 'third', show: notManual },
			{ k: 'min_spins', type: 'number', min: 0, label: t( 'حداقل تعداد چرخش', 'Min spins' ), cols: 'third', show: notManual },
			{ k: 'spin_now', type: 'segment', label: t( 'همین الان می‌تواند گردونه را بچرخاند؟', 'Can spin the wheel right now?' ), help: t( 'دقیقاً همان بررسی خود گردونه (سهمیه رایگان + شانس‌های باقی‌مانده) روی گردونه انتخاب‌شده در «هدیه شانس» یا فیلتر گردونه.', 'Exactly the wheel’s own check (free quota + spins left) on the wheel chosen in the gift or the wheel filter.' ), opts: [ { value: '', label: t( 'مهم نیست', 'Any' ) }, { value: 'no', label: t( 'هیچ شانسی ندارند', 'Has no spin now' ) }, { value: 'yes', label: t( 'شانس دارند', 'Can spin now' ) } ] },
			{ k: 'spun', type: 'segment', label: t( 'چرخانده‌اند؟', 'Spun before?' ), cols: 'half', show: notManual, opts: [ { value: '', label: t( 'مهم نیست', 'Any' ) }, { value: 'yes', label: t( 'حداقل یک‌بار', 'At least once' ) }, { value: 'no', label: t( 'هرگز نچرخانده‌اند', 'Never spun' ) } ] },
			{ k: 'account', type: 'segment', label: t( 'حساب کاربری', 'Account' ), cols: 'half', opts: [ { value: '', label: t( 'مهم نیست', 'Any' ) }, { value: 'user', label: t( 'عضو سایت', 'Site members' ) }, { value: 'guest', label: t( 'مهمان', 'Guests' ) } ] },
			{ k: 'min_wins', type: 'number', min: 0, label: t( 'حداقل تعداد برد', 'Min wins' ), cols: 'third', show: notManual },
			{ k: 'skip_recent', type: 'number', min: 0, unit: t( 'روز', 'days' ), label: t( 'به کسانی که در N روز اخیر پیامک گروهی گرفته‌اند نفرست', 'Skip people who got a bulk SMS in the last N days' ), cols: 'third' },
			{ k: 'has_email', type: 'switch', label: t( 'فقط دارای ایمیل', 'Only with an email' ), cols: 'third', show: notManual },
			{ k: 'limit', type: 'number', min: 0, label: t( 'حداکثر گیرنده (۰ = همه)', 'Max recipients (0 = all)' ), cols: 'third' },
			{ k: 'min_orders', type: 'number', min: 0, label: t( 'حداقل تعداد سفارش', 'Min orders' ), cols: 'half', show: function ( x ) { return x.source === 'customers'; } },
			{ k: 'min_spent', type: 'number', min: 0, unit: F.cur(), label: t( 'حداقل مجموع خرید', 'Min total spent' ), cols: 'half', show: function ( x ) { return x.source === 'customers'; } },
			{ k: 'exclude', type: 'textarea', rows: 2, dir: 'ltr', label: t( 'این شماره‌ها حذف شوند (اختیاری)', 'Exclude these numbers (optional)' ) },
		], model, function () { refresh(); } );
		var periodBox = h( 'div' );
		var drawPeriod = function () {
			BC.clear( periodBox );
			periodBox.hidden = model.source === 'manual';
			periodBox.appendChild( h( 'div', { class: 'bc-field__label', text: t( 'بازه فعالیت (چرخش، ثبت فرم یا گرفتن شانس)', 'Activity period (spin, form or granted spins)' ) } ) );
			periodBox.appendChild( rangeBar( rs, function () { drawPeriod(); refresh(); } ) );
		};
		var gift = F.render( [
			{ type: 'heading', icon: 'ticket', label: t( '۲. هدیه شانس (واقعی، روی شماره هر نفر)', '2. Spin gift (real, on each mobile)' ) },
			{ k: 'grant', type: 'number', min: 0, max: 100, label: t( 'تعداد شانس برای هر نفر (۰ = بدون هدیه)', 'Spins per person (0 = none)' ), unit: t( 'شانس', 'spins' ), cols: 'third' },
			{ k: 'grant_wheel', type: 'select', numeric: true, label: t( 'برای کدام گردونه', 'For which wheel' ), cols: 'third', show: function ( x ) { return x.grant > 0; }, opts: [ { value: 0, label: t( 'همه گردونه‌ها', 'Any wheel' ) } ].concat( wheels ) },
			{ k: 'grant_days', type: 'number', min: 0, label: t( 'مهلت استفاده (۰ = بدون انقضا)', 'Valid for (0 = no expiry)' ), unit: t( 'روز', 'days' ), cols: 'third', show: function ( x ) { return x.grant > 0; } },
			{ k: 'grant_note', label: t( 'توضیح (در تاریخچه شانس‌ها)', 'Note (shown in the spins history)' ), show: function ( x ) { return x.grant > 0; } },
			{ type: 'note', label: t( 'شانس روی شماره موبایل ثبت می‌شود: اگر با همان شماره وارد حساب شود، با لینک شخصی پیامک وارد شود یا شماره را با کد تایید کند، شانسش را می‌بیند و می‌چرخاند. هر نفر در هر ارسال فقط یک‌بار.', 'Spins are stored on the mobile: logging in with it, opening the personal SMS link or verifying it by code shows and uses them. Once per person per send.' ) },
		], model, function () { refresh(); } );
		var msg = F.render( [
			{ type: 'heading', icon: 'message', label: t( '۳. پیامک', '3. SMS' ) },
			{ k: 'send_sms', type: 'switch', label: t( 'پیامک هم ارسال شود', 'Also send an SMS' ) },
			{ k: 'mode', type: 'segment', label: t( 'نوع ارسال', 'Sending type' ), show: function ( x ) { return x.send_sms; }, opts: [ { value: 'text', label: t( 'متن آزاد', 'Plain text' ) }, { value: 'pattern', label: t( 'الگو (خدماتی / پترن)', 'Pattern (template)' ) } ] },
			{ k: 'text', type: 'custom', show: function ( x ) { return x.send_sms; }, render: function () {
				textArea = h( 'textarea', { class: 'bc-input', rows: 4 } );
				textArea.value = model.text;
				textArea.addEventListener( 'input', function () { model.text = textArea.value; updCounter(); refresh(); } );
				updCounter();
				return h( 'div', { class: 'bc-field' }, h( 'label', { class: 'bc-field__label', text: t( 'متن پیامک (برای الگو: متن جایگزین در صورت خطا)', 'SMS text (for patterns: fallback text)' ) } ), textArea, counter, chips );
			} },
			{ k: 'code', label: t( 'کد الگو', 'Pattern code' ), dir: 'ltr', cols: 'half', show: function ( x ) { return x.send_sms && x.mode === 'pattern'; } },
			{ k: 'fallback', type: 'switch', label: t( 'اگر الگو خطا داد، متن بالا ارسال شود', 'If the pattern fails, send the text' ), cols: 'half', show: function ( x ) { return x.send_sms && x.mode === 'pattern'; } },
			{ k: 'params', type: 'textarea', rows: 3, dir: 'ltr', label: t( 'پارامترهای الگو — هر خط: نام=مقدار', 'Pattern params — one per line: name=value' ), show: function ( x ) { return x.send_sms && x.mode === 'pattern'; } },
		], model, function () { refresh(); } );
		var schedHelp = h( 'div', { class: 'bc-form-note' } );
		var sched = F.render( [
			{ type: 'heading', icon: 'clock', label: t( '۴. زمان‌بندی ارسال', '4. Sending schedule' ) },
			{ k: 'title', label: t( 'نام این ارسال (برای گزارش)', 'Name of this send (for the report)' ), placeholder: t( 'مثلاً: هدیه یلدا', 'e.g. Holiday gift' ) },
			{ k: 'batch_size', type: 'number', min: 1, max: 500, unit: t( 'نفر', 'people' ), label: t( 'در هر دسته چند نفر؟', 'People per batch' ), cols: 'half' },
			{ k: 'interval_min', type: 'number', min: 0, max: 1440, unit: t( 'دقیقه', 'min' ), label: t( 'فاصله بین دسته‌ها (۰ = پشت سر هم)', 'Minutes between batches (0 = back to back)' ), cols: 'half' },
			{ type: 'custom', render: function () { return schedHelp; } },
		], model, function () { refresh(); } );
		var info = h( 'div', { class: 'bc-export__count' } );
		var samples = h( 'div' );
		var body = function () {
			var b = Object.assign( {}, model );
			if ( rs.preset !== 'all' && model.source !== 'manual' ) {
				b.from = rs.from;
				b.to = rs.to;
			}
			return b;
		};
		var timer = null;
		var refresh = function () {
			periodBox.hidden = model.source === 'manual';
			clearTimeout( timer );
			timer = setTimeout( function () {
				info.textContent = t( 'در حال شمارش…', 'Counting…' );
				BC.api( 'bulk/preview', { body: body() } ).then( function ( r ) {
					var nb = Math.ceil( r.total / Math.max( 1, +model.batch_size || 1 ) );
					schedHelp.textContent = r.total ? ( +model.interval_min > 0
						? t( '%1 نفر ← %2 دسته؛ دسته اول همین الان، بعد هر %3 دقیقه یک دسته؛ پایان حدود %4 دقیقه بعد.', '%1 people → %2 batches; first now, then one every %3 min; ends in about %4 min.', BC.num( r.total, 0 ), BC.num( nb, 0 ), BC.num( model.interval_min, 0 ), BC.num( ( nb - 1 ) * model.interval_min, 0 ) )
						: t( '%1 نفر ← %2 دسته پشت سر هم.', '%1 people → %2 batches back to back.', BC.num( r.total, 0 ), BC.num( nb, 0 ) ) ) : '';
					BC.clear( info );
					info.appendChild( BC.icon( 'users', 18 ) );
					info.appendChild( h( 'span', { html: t( '<b>%1</b> گیرنده یکتا', '<b>%1</b> unique recipients', BC.num( r.total, 0 ) ) + ( r.mode === 'test' ? ' — ' + t( 'حالت تست: پیامک فقط در گزارش ثبت می‌شود', 'test mode: SMS are only logged' ) : ( r.mode === 'off' ? ' — ' + t( 'ارسال پیامک خاموش است', 'SMS sending is off' ) : '' ) ) } ) );
					BC.clear( samples );
					if ( r.wheel ) {
						samples.appendChild( h( 'p', { class: 'bc-muted' }, t( 'لینک گردونه «%1»: ', 'Wheel "%1" link: ', r.wheel.title ), h( 'a', { href: r.wheel.link, target: '_blank', dir: 'ltr', text: r.wheel.link } ) ) );
					}
					if ( model.send_sms && r.samples && r.samples.length ) {
						samples.appendChild( h( 'div', { class: 'bc-field__label', text: t( 'نمونه پیامک‌ها (همان چیزی که هر نفر دریافت می‌کند):', 'Sample messages (exactly what each person gets):' ) } ) );
						r.samples.forEach( function ( s ) {
							var pt = s.pattern ? h( 'small', { dir: 'ltr', class: 'bc-muted', text: 'pattern ' + s.pattern.code + ': ' + JSON.stringify( s.pattern.params ) } ) : null;
							samples.appendChild( h( 'div', { class: 'bc-card', style: { padding: '10px 14px', margin: '6px 0' } }, h( 'b', { dir: 'ltr', text: s.mobile } ), h( 'div', { style: { 'white-space': 'pre-wrap', 'overflow-wrap': 'anywhere' }, text: s.text } ), pt ) );
						} );
					}
				} ).catch( function ( e ) { info.textContent = e.message; } );
			}, 350 );
		};
		m.body.appendChild( who );
		m.body.appendChild( periodBox );
		m.body.appendChild( gift );
		m.body.appendChild( msg );
		m.body.appendChild( sched );
		m.body.appendChild( info );
		m.body.appendChild( samples );
		drawPeriod();
		var go = BC.btn( BC.il( 'send', t( 'شروع ارسال', 'Start' ), 16 ), function () {
			var what = [];
			if ( model.grant > 0 ) {
				what.push( t( '%1 شانس به هر نفر', '%1 spins each', BC.num( model.grant, 0 ) ) );
			}
			if ( model.send_sms ) {
				what.push( t( 'ارسال پیامک (هزینه طبق پنل پیامک)', 'send the SMS (your panel charges apply)' ) );
			}
			BC.confirm( t( 'برای گیرندگان انتخاب‌شده: %1. شروع شود؟', 'For the selected recipients: %1. Start?', what.join( ' + ' ) ), function () {
				BC.busy( go, BC.api( 'bulk/start', { body: body() } ) ).then( function ( r ) {
					BC.toast( t( 'ارسال گروهی ساخته شد: %1 نفر', 'Bulk send created: %1 people', BC.num( r.total, 0 ) ), 'success' );
					m.close();
					w.location.hash = '#/campaigns?id=' + r.id;
				} ).catch( BC.fail );
			} );
		}, 'primary' );
		m.foot.appendChild( h( 'a', { class: 'bc-btn bc-btn--ghost', href: '#/campaigns', text: t( 'ارسال‌های قبلی و گزارش‌ها', 'Previous sends & reports' ), onClick: function () { m.close(); } } ) );
		m.foot.appendChild( go );
		refresh();
	}
	BC.bulkCenter = bulkCenter;

	/* ================================================================== Bulk sends (scheduled campaigns + full report) */
	var CST = function () {
		return {
			running: [ t( 'در حال ارسال', 'Sending' ), 'brand' ],
			paused: [ t( 'متوقف موقت', 'Paused' ), 'warn' ],
			done: [ t( 'تمام شد', 'Finished' ), 'good' ],
			cancelled: [ t( 'لغو شد', 'Cancelled' ), 'bad' ],
		};
	};
	var IST = function () {
		return {
			pending: [ t( 'در صف ارسال', 'Waiting' ), 'default' ],
			sent: [ t( 'ارسال شد', 'Sent' ), 'good' ],
			failed: [ t( 'خطا', 'Failed' ), 'bad' ],
			cancelled: [ t( 'ارسال نشد', 'Not sent' ), 'warn' ],
			done: [ t( 'انجام شد', 'Done' ), 'good' ],
		};
	};
	function campBadge( s ) {
		var x = CST()[ s ] || [ s, 'default' ];
		return BC.badge( x[ 0 ], x[ 1 ] );
	}
	function campProgress( c ) {
		var k = c.counts || {};
		var done = ( k.total || 0 ) - ( k.pending || 0 );
		var pct = k.total ? Math.round( done / k.total * 100 ) : 0;
		return h( 'div', { style: { 'min-width': '140px' } }, h( 'div', { class: 'bc-progressbar' }, h( 'span', { style: { width: pct + '%' } } ) ), h( 'small', { class: 'bc-muted', text: BC.num( done, 0 ) + ' / ' + BC.num( k.total, 0 ) + ' (' + BC.num( pct, 0 ) + '٪)' } ) );
	}
	function campSchedule( c ) {
		var batches = Math.ceil( ( c.total || 0 ) / Math.max( 1, c.batch_size ) );
		return c.interval_min > 0
			? t( 'هر %1 دقیقه %2 نفر (%3 دسته)', '%2 people every %1 min (%3 batches)', BC.num( c.interval_min, 0 ), BC.num( c.batch_size, 0 ), BC.num( batches, 0 ) )
			: t( 'پشت سر هم، دسته‌های %1 نفره', 'Back to back, batches of %1', BC.num( c.batch_size, 0 ) );
	}
	function campAction( c, act, extra, done ) {
		return BC.api( 'bulk/' + c.id + '/action', { body: Object.assign( { do: act }, extra || {} ) } ).then( function ( r ) {
			if ( act === 'retry' ) {
				BC.toast( r.queued ? t( '%1 نفر دوباره در صف ارسال قرار گرفتند', '%1 people queued again', BC.num( r.queued, 0 ) ) : t( 'موردی برای ارسال دوباره نبود', 'Nothing to resend' ), r.queued ? 'success' : 'info' );
			}
			if ( done ) {
				done( r );
			}
			return r;
		} ).catch( BC.fail );
	}

	P.campaigns = function ( view, q ) {
		var timer = null;
		var stop = function () { clearTimeout( timer ); timer = null; };
		var alive = function () { return d.body.contains( view ) && ( w.location.hash || '' ).indexOf( '#/campaigns' ) === 0; };
		if ( q && q.id ) {
			return campaignDetail( view, +q.id, stop, alive, function ( fn, ms ) { stop(); timer = setTimeout( function () { if ( alive() ) { fn(); } }, ms ); } );
		}
		var st = { page: 1, status: '', search: '' };
		function render() {
			stop();
			load( view, BC.api( 'bulk/campaigns', { query: { page: st.page, per_page: 20, status: st.status, search: st.search } } ), function ( r ) {
				view.appendChild( head( 'send', t( 'ارسال‌های گروهی', 'Bulk sends' ), t( 'هر ارسال گروهی یک کمپین است: زمان‌بندی (مثلاً هر ۱۵ دقیقه ۵۰ نفر)، پیشرفت، گزارش کامل ارسال‌شده‌ها، خطاها و ارسال‌نشده‌ها و ارسال دوباره برای آن‌ها.', 'Each bulk send is a campaign: schedule (e.g. 50 people every 15 minutes), progress, full report of sent, failed and unsent recipients, and resending to them.' ), [
					BC.btn( BC.il( 'plus', t( 'ارسال گروهی جدید', 'New bulk send' ), 16 ), function () { bulkCenter(); }, 'primary' ),
				] ) );
				if ( r.mode !== 'live' ) {
					view.appendChild( BC.alert( 'warn', r.mode === 'test' ? t( 'حالت تست پیامک روشن است: پیامک‌ها واقعاً ارسال نمی‌شوند و فقط در گزارش ثبت می‌شوند.', 'SMS test mode is on: messages are only logged.' ) : t( 'ارسال پیامک خاموش است یا پنلی انتخاب نشده.', 'SMS sending is off or no panel is selected.' ) ) );
				}
				view.appendChild( BC.alert( 'info', t( 'ارسال‌ها در پس‌زمینه با زمان‌بند وردپرس انجام می‌شوند (حتی وقتی این صفحه بسته است)؛ زمان‌بند وردپرس با بازدید سایت فعال می‌شود. وقتی این صفحه باز است ارسال‌های سررسیده فوراً انجام می‌شوند. برای دقت کامل روی سایت‌های کم‌بازدید، در هاست یک کران‌جاب برای wp-cron.php بسازید.', 'Sends run in the background with WP-Cron (even with this page closed); WP-Cron runs on site visits. While this page is open, due batches go out immediately. For exact timing on quiet sites add a server cron for wp-cron.php.' ) ) );
				var search = h( 'input', { class: 'bc-input', type: 'search', placeholder: t( 'جستجوی عنوان', 'Search title' ), value: st.search } );
				search.addEventListener( 'change', function () { st.search = search.value; st.page = 1; render(); } );
				var sf = h( 'select', { class: 'bc-input bc-select' }, [ [ '', t( 'همه وضعیت‌ها', 'All statuses' ) ] ].concat( Object.keys( CST() ).map( function ( k ) { return [ k, CST()[ k ][ 0 ] ]; } ) ).map( function ( x ) { return h( 'option', { value: x[ 0 ], text: x[ 1 ] } ); } ) );
				sf.value = st.status;
				sf.addEventListener( 'change', function () { st.status = sf.value; st.page = 1; render(); } );
				view.appendChild( h( 'div', { class: 'bc-filters' }, search, sf ) );
				view.appendChild( BC.card( { title: t( '%1 ارسال گروهی', '%1 bulk sends', BC.num( r.total, 0 ) ), icon: 'send' }, [ BC.table( [
					{ label: t( 'عنوان', 'Title' ), render: function ( c ) { return h( 'a', { href: '#/campaigns?id=' + c.id }, h( 'b', { text: c.title } ), h( 'div', { class: 'bc-muted', style: { 'font-size': '12px' }, text: BC.date( c.created_at, true ) } ) ); } },
					{ label: t( 'وضعیت', 'Status' ), render: function ( c ) { return campBadge( c.status ); } },
					{ label: t( 'پیشرفت', 'Progress' ), render: campProgress },
					{ label: t( 'ارسال شد / خطا / ارسال نشده', 'Sent / failed / not sent' ), render: function ( c ) { var k = c.counts; return h( 'span', null, h( 'b', { class: 'is-good', text: BC.num( k.sent, 0 ) } ), ' / ', h( 'b', { style: { color: '#dc2626' }, text: BC.num( k.failed, 0 ) } ), ' / ', h( 'b', { text: BC.num( k.pending + k.cancelled, 0 ) } ) ); } },
					{ label: t( 'شانس هدیه', 'Spin gift' ), render: function ( c ) { return c.grant ? BC.num( c.counts.granted, 0 ) + ' × ' + BC.num( c.grant, 0 ) : '—'; } },
					{ label: t( 'زمان‌بندی', 'Schedule' ), render: function ( c ) { return h( 'small', null, campSchedule( c ), c.status === 'running' && c.counts.pending ? h( 'div', { class: 'bc-muted', text: t( 'دسته بعدی: %1', 'Next batch: %1', BC.date( c.next_run, true ) ) } ) : null ); } },
					{ label: '', render: function ( c ) { return h( 'a', { class: 'bc-btn bc-btn--sm', href: '#/campaigns?id=' + c.id }, BC.icon( 'list', 14 ), t( 'گزارش کامل', 'Full report' ) ); } },
				], r.items, BC.empty( t( 'هنوز ارسال گروهی‌ای انجام نشده.', 'No bulk sends yet.' ) ) ), BC.pager( r.total, st.page, 20, function ( p ) { st.page = p; render(); } ) ] ) );
				if ( r.items.some( function ( c ) { return c.status === 'running'; } ) ) {
					timer = setTimeout( function () { if ( alive() ) { BC.api( 'bulk/tick', { body: {} } ).then( render, render ); } }, 15000 );
				}
			} );
		}
		render();
	};

	function campaignDetail( view, id, stop, alive, later ) {
		var st = { status: '', batch: 0, search: '', page: 1, per: 50, sel: {} };
		var box = h( 'div' );
		var listBox = h( 'div' );
		function tickThenDraw() {
			BC.api( 'bulk/tick', { body: { id: id } } ).then( draw, draw );
		}
		function draw() {
			stop();
			BC.api( 'bulk/' + id ).then( function ( c ) {
				BC.clear( view );
				var k = c.counts;
				var wheel = ( BC.boot.wheels || [] ).filter( function ( x ) { return +x.id === +c.grant_wheel; } )[ 0 ];
				var acts = [ h( 'a', { class: 'bc-btn', href: '#/campaigns' }, BC.icon( BC.fa ? 'arrow-right' : 'arrow-left', 16 ), t( 'همه ارسال‌ها', 'All sends' ) ) ];
				if ( c.status === 'running' ) {
					acts.push( BC.btn( BC.il( 'send', t( 'دسته بعدی همین الان', 'Next batch now' ), 16 ), function ( e ) { BC.busy( e.currentTarget, campAction( c, 'send_now' ) ).then( draw ); } ) );
					acts.push( BC.btn( BC.il( 'pause', t( 'توقف موقت', 'Pause' ), 16 ), function () { campAction( c, 'pause', null, draw ); } ) );
				}
				if ( c.status === 'paused' ) {
					acts.push( BC.btn( BC.il( 'play', t( 'ادامه ارسال', 'Resume' ), 16 ), function () { campAction( c, 'resume', null, draw ); }, 'primary' ) );
				}
				if ( c.status === 'running' || c.status === 'paused' ) {
					acts.push( BC.btn( BC.il( 'x', t( 'لغو باقی‌مانده', 'Cancel the rest' ), 16 ), function () { BC.confirm( t( 'ارسال برای %1 نفر باقی‌مانده لغو شود؟ (بعداً می‌توانید دوباره ارسال کنید)', 'Cancel for the %1 people left? (you can resend later)', BC.num( k.pending, 0 ) ), function () { campAction( c, 'cancel', null, draw ); }, true ); } ) );
				}
				acts.push( BC.btn( BC.icon( 'trash', 16 ), function () { BC.confirm( t( 'این کمپین و گزارشش حذف شود؟ (شانس‌های داده‌شده باقی می‌مانند)', 'Delete this campaign and its report? (granted spins stay)' ), function () { campAction( c, 'delete', null, function () { w.location.hash = '#/campaigns'; } ); }, true ); }, 'ghost' ) );
				view.appendChild( head( 'send', c.title, campSchedule( c ) + ( c.grant ? ' — ' + t( '%1 شانس برای هر نفر', '%1 spins each', BC.num( c.grant, 0 ) ) + ( wheel ? ' (' + wheel.title + ')' : '' ) : '' ), acts ) );
				view.appendChild( h( 'div', { class: 'bc-row', style: { 'align-items': 'center', gap: '12px', 'margin-bottom': '12px' } }, campBadge( c.status ), h( 'div', { style: { flex: '1' } }, campProgress( c ) ), c.status === 'running' && k.pending ? h( 'span', { class: 'bc-muted', text: t( 'دسته بعدی: %1', 'Next batch: %1', BC.date( c.next_run, true ) ) } ) : null ) );
				view.appendChild( h( 'div', { class: 'bc-kpis' },
					BC.kpi( 'users', 'blue', t( 'گیرندگان', 'Recipients' ), BC.num( k.total, 0 ), t( '%1 دسته ارسال شده', '%1 batches sent', BC.num( c.batches, 0 ) ) ),
					BC.kpi( 'check', 'green', t( 'پیامک ارسال شد', 'SMS sent' ), BC.num( k.sent, 0 ) ),
					BC.kpi( 'alert', 'amber', t( 'خطا خورده', 'Failed' ), BC.num( k.failed, 0 ) ),
					BC.kpi( 'clock', 'blue', t( 'ارسال نشده (در صف / لغو)', 'Not sent (waiting / cancelled)' ), BC.num( k.pending + k.cancelled, 0 ), BC.num( k.pending, 0 ) + ' ' + t( 'در صف', 'waiting' ) ),
					c.grant ? BC.kpi( 'ticket', 'green', t( 'شانس داده شد', 'Spins granted' ), BC.num( k.granted, 0 ), k.grant_failed ? BC.num( k.grant_failed, 0 ) + ' ' + t( 'شانس نگرفتند', 'not granted' ) : '' ) : null
				) );
				var problems = k.failed + k.cancelled + k.grant_failed;
				view.appendChild( BC.card( { title: t( 'ارسال دوباره', 'Resend' ), icon: 'refresh', sub: t( 'فقط برای همان افراد دوباره ارسال می‌شود؛ شانسی که قبلاً داده شده هرگز دوباره داده نمی‌شود (فقط کسانی که شانس نگرفته‌اند شانس می‌گیرند).', 'Only those people get it again; a spin already granted is never granted twice (only the ones without it get it).' ) }, [ h( 'div', { class: 'bc-row', style: { 'flex-wrap': 'wrap' } },
					BC.btn( BC.il( 'refresh', t( 'خطا خورده‌ها (%1)', 'Failed (%1)', BC.num( k.failed, 0 ) ), 16 ), function () { campAction( c, 'retry', { scope: 'failed' }, draw ); }, k.failed ? 'primary' : '' ),
					BC.btn( BC.il( 'refresh', t( 'ارسال‌نشده‌ها (%1)', 'Not sent (%1)', BC.num( k.cancelled + k.failed, 0 ) ), 16 ), function () { campAction( c, 'retry', { scope: 'unsent' }, draw ); } ),
					c.grant ? BC.btn( BC.il( 'ticket', t( 'شانس‌نگرفته‌ها (%1)', 'Not granted (%1)', BC.num( k.grant_failed, 0 ) ), 16 ), function () { campAction( c, 'retry', { scope: 'no_grant' }, draw ); } ) : null,
					BC.btn( BC.il( 'refresh', t( 'همه مشکل‌دارها (%1)', 'All problems (%1)', BC.num( problems, 0 ) ), 16 ), function () { campAction( c, 'retry', { scope: 'problem' }, draw ); } )
				) ] ) );
				if ( c.send_sms ) {
					view.appendChild( BC.card( { title: c.mode === 'pattern' ? t( 'الگو + متن پشتیبان', 'Pattern + fallback text' ) : t( 'متن پیامک', 'SMS text' ), icon: 'message' }, [ h( 'div', { style: { 'white-space': 'pre-wrap' }, text: c.text || '—' } ) ] ) );
				}
				view.appendChild( listBox );
				drawList( c );
				if ( c.status === 'running' ) {
					later( tickThenDraw, 10000 );
				}
			} ).catch( function ( e ) { BC.clear( view ); view.appendChild( BC.alert( 'error', e.message ) ); } );
		}
		function drawList( c ) {
			BC.clear( listBox );
			var k = c.counts;
			var opts = [
				[ '', t( 'همه', 'All' ), k.total ], [ 'sent', t( 'ارسال شد', 'Sent' ), k.sent ], [ 'failed', t( 'خطا خورده', 'Failed' ), k.failed ],
				[ 'unsent', t( 'ارسال نشده', 'Not sent' ), k.failed + k.pending + k.cancelled ], [ 'pending', t( 'در صف', 'Waiting' ), k.pending ], [ 'cancelled', t( 'لغو شده', 'Cancelled' ), k.cancelled ],
			];
			if ( c.grant ) {
				opts.push( [ 'no_grant', t( 'شانس نگرفته', 'Not granted' ), k.grant_failed ] );
			}
			opts.push( [ 'problem', t( 'همه مشکل‌دارها', 'All problems' ), k.failed + k.cancelled + k.grant_failed ] );
			var seg = h( 'div', { class: 'bc-choicechips' }, opts.map( function ( o ) {
				return h( 'button', { type: 'button', class: 'bc-cchip' + ( st.status === o[ 0 ] ? ' is-on' : '' ), onClick: function () { st.status = o[ 0 ]; st.page = 1; st.sel = {}; drawList( c ); } }, o[ 1 ] + ' (' + BC.num( o[ 2 ], 0 ) + ')' );
			} ) );
			var search = h( 'input', { class: 'bc-input', type: 'search', placeholder: t( 'جستجو: موبایل، نام، متن خطا', 'Search: mobile, name, error' ), value: st.search } );
			search.addEventListener( 'change', function () { st.search = search.value; st.page = 1; drawList( c ); } );
			var bsel = h( 'select', { class: 'bc-input bc-select' }, [ h( 'option', { value: 0, text: t( 'همه دسته‌ها', 'All batches' ) } ) ].concat( Array.apply( null, { length: Math.max( c.batches, 0 ) } ).map( function ( x, i ) { return h( 'option', { value: i + 1, text: t( 'دسته %1', 'Batch %1', BC.num( i + 1, 0 ) ) } ); } ) ) );
			bsel.value = st.batch;
			bsel.addEventListener( 'change', function () { st.batch = +bsel.value; st.page = 1; drawList( c ); } );
			var perSel = h( 'select', { class: 'bc-input bc-select' }, [ 50, 100, 300, 1000 ].map( function ( n ) { return h( 'option', { value: n, text: t( '%1 در صفحه', '%1 per page', BC.num( n, 0 ) ) } ); } ) );
			perSel.value = st.per;
			perSel.addEventListener( 'change', function () { st.per = +perSel.value; st.page = 1; drawList( c ); } );
			var exp = h( 'a', { class: 'bc-btn', href: BC.config.exportUrl + '&what=bulk&id=' + id + '&status=' + encodeURIComponent( st.status ) }, BC.icon( 'download', 16 ), t( 'خروجی CSV همین فهرست', 'CSV of this list' ) );
			var tbl = h( 'div' );
			var selBar = h( 'div', { class: 'bc-row', hidden: true } );
			listBox.appendChild( BC.card( { title: t( 'گزارش گیرندگان', 'Recipients report' ), icon: 'list' }, [ seg, h( 'div', { class: 'bc-filters' }, search, bsel, perSel, exp ), selBar, tbl ] ) );
			var updSel = function () {
				var ids = Object.keys( st.sel ).filter( function ( x ) { return st.sel[ x ]; } );
				BC.clear( selBar );
				selBar.hidden = ! ids.length;
				if ( ids.length ) {
					selBar.appendChild( h( 'b', { text: t( '%1 نفر انتخاب شده', '%1 selected', BC.num( ids.length, 0 ) ) } ) );
					selBar.appendChild( BC.btn( BC.il( 'refresh', t( 'ارسال دوباره برای انتخاب‌شده‌ها', 'Resend to selected' ), 16 ), function () { campAction( c, 'retry', { ids: ids }, function () { st.sel = {}; draw(); } ); }, 'primary' ) );
				}
			};
			tbl.appendChild( BC.spinner() );
			BC.api( 'bulk/' + id + '/items', { query: { status: st.status, batch: st.batch || '', search: st.search, page: st.page, per_page: st.per } } ).then( function ( r ) {
				BC.clear( tbl );
				var all = h( 'input', { type: 'checkbox', 'aria-label': t( 'انتخاب همه', 'Select all' ), onChange: function () { r.items.forEach( function ( x ) { st.sel[ x.id ] = all.checked; } ); drawRows(); updSel(); } } );
				var rowsBox = h( 'div' );
				tbl.appendChild( h( 'label', { class: 'bc-check' }, all, t( 'انتخاب همه این صفحه', 'Select this page' ) ) );
				tbl.appendChild( rowsBox );
				function drawRows() {
					BC.clear( rowsBox );
					rowsBox.appendChild( BC.table( [
						{ label: '', width: '32px', render: function ( x ) { var cb = h( 'input', { type: 'checkbox', checked: !! st.sel[ x.id ], onChange: function () { st.sel[ x.id ] = cb.checked; updSel(); } } ); return cb; } },
						{ label: t( 'موبایل', 'Mobile' ), render: function ( x ) { return h( 'a', { dir: 'ltr', href: '#/credits?search=' + x.phone, text: x.phone } ); } },
						{ label: t( 'نام', 'Name' ), render: function ( x ) { return x.name || '—'; } },
						{ label: t( 'پیامک', 'SMS' ), render: function ( x ) { var s = IST()[ x.status ] || [ x.status, 'default' ]; return BC.badge( s[ 0 ], s[ 1 ] ); } },
						c.grant ? { label: t( 'شانس', 'Spin' ), render: function ( x ) { return x.grant_status === 'granted' ? BC.badge( t( 'داده شد', 'Granted' ), 'good' ) : ( x.grant_status === 'failed' ? BC.badge( t( 'نگرفت', 'Not granted' ), 'bad' ) : '—' ); } } : null,
						{ label: t( 'دسته', 'Batch' ), render: function ( x ) { return +x.batch ? BC.num( x.batch, 0 ) : '—'; } },
						{ label: t( 'تلاش', 'Tries' ), render: function ( x ) { return BC.num( x.tries, 0 ); } },
						{ label: t( 'زمان ارسال', 'Sent at' ), render: function ( x ) { return x.sent_at ? BC.date( x.sent_at, true ) : '—'; } },
						{ label: t( 'پاسخ پنل / خطا', 'Panel response / error' ), render: function ( x ) { return x.response ? h( 'small', { dir: 'auto', title: x.message || '', style: { 'overflow-wrap': 'anywhere' }, text: String( x.response ).slice( 0, 160 ) } ) : '—'; } },
						{ label: '', render: function ( x ) { return x.status !== 'pending' ? BC.btn( BC.icon( 'refresh', 14 ), function () { campAction( c, 'retry', { ids: [ x.id ] }, draw ); }, 'sm ghost' ) : null; } },
					].filter( Boolean ), r.items, BC.empty( t( 'در این فهرست کسی نیست.', 'Nobody in this list.' ) ) ) );
				}
				drawRows();
				var pg = BC.pager( r.total, st.page, st.per, function ( p ) { st.page = p; drawList( c ); } );
				if ( pg ) {
					tbl.appendChild( pg );
				}
				updSel();
			} ).catch( function ( e ) { BC.clear( tbl ); tbl.appendChild( BC.alert( 'error', e.message ) ); } );
		}
		view.appendChild( box );
		tickThenDraw();
	}

	/* ================================================================== Contacts export (bulk SMS & customer club) */
	function exportContacts( defaults ) {
		var m = BC.modal( { title: t( 'خروجی شماره‌ها برای پیامک گروهی و باشگاه مشتریان', 'Export contacts for bulk SMS & customer club' ), wide: true } );
		var model = Object.assign( { source: 'all', format: 'txt', style: '09', marketing: false, verified: false, winners: false, need_phone: true, wheel_id: 0, period: 'all' }, defaults || {} );
		var rs = { preset: 'all' };
		var info = h( 'div', { class: 'bc-export__count' } );
		var periodBox = h( 'div' );
		var form = h( 'div' );
		var draw = function () {
			BC.clear( form );
			form.appendChild( F.render( [
				{ k: 'source', type: 'segment', label: t( 'از کدام افراد؟', 'Who?' ), opts: [ { value: 'all', label: t( 'همه (فرم + چرخش + شانس)', 'Everyone' ) }, { value: 'leads', label: t( 'فقط مخاطبان فرم', 'Form leads only' ) }, { value: 'people', label: t( 'هر کسی که چرخانده یا شانس گرفته', 'Anyone who spun / got spins' ) } ] },
				{ k: 'format', type: 'segment', label: t( 'نوع فایل', 'File type' ), opts: [ { value: 'txt', label: t( 'فقط شماره‌ها (TXT) — برای پنل پیامک', 'Numbers only (TXT) — for SMS panels' ) }, { value: 'csv', label: t( 'اکسل کامل (CSV) — باشگاه مشتریان', 'Full Excel (CSV) — customer club' ) } ] },
				{ k: 'style', type: 'segment', label: t( 'شکل شماره', 'Number format' ), opts: [ { value: '09', label: '0912…' }, { value: '9', label: '912…' }, { value: '98', label: '98912…' }, { value: '+98', label: '+98912…' } ] },
				{ k: 'marketing', type: 'switch', label: t( 'فقط کسانی که با دریافت پیشنهاد موافقت کرده‌اند', 'Only marketing opt-ins' ), cols: 'half' },
				{ k: 'verified', type: 'switch', label: t( 'فقط موبایل‌های تاییدشده با کد', 'Only OTP-verified numbers' ), cols: 'half' },
				{ k: 'winners', type: 'switch', label: t( 'فقط برنده‌ها', 'Only winners' ), cols: 'half' },
				{ k: 'need_phone', type: 'switch', label: t( 'فقط افراد دارای شماره موبایل', 'Only people with a mobile' ), cols: 'half', show: function ( x ) { return x.format === 'csv'; } },
				{ k: 'wheel_id', type: 'select', numeric: true, label: t( 'گردونه', 'Wheel' ), opts: [ { value: 0, label: t( 'همه گردونه‌ها', 'All wheels' ) } ].concat( ( BC.boot.wheels || [] ).map( function ( x ) { return { value: x.id, label: x.title }; } ) ) },
			], model, function () { refresh(); } ) );
		};
		var params = function () {
			var p = { source: model.source, format: model.format, style: model.style, marketing: model.marketing ? 1 : '', verified: model.verified ? 1 : '', winners: model.winners ? 1 : '', need_phone: model.need_phone || model.format === 'txt' ? 1 : '', wheel_id: model.wheel_id || '' };
			if ( rs.preset !== 'all' ) {
				p.from = rs.from;
				p.to = rs.to;
			}
			return p;
		};
		var timer = null;
		var refresh = function () {
			clearTimeout( timer );
			timer = setTimeout( function () {
				info.textContent = t( 'در حال شمارش…', 'Counting…' );
				BC.api( 'contacts/count', { query: params() } ).then( function ( r ) {
					BC.clear( info );
					info.appendChild( BC.icon( 'users', 18 ) );
					info.appendChild( h( 'span', { html: t( '<b>%1</b> شماره موبایل یکتا (تکراری‌ها حذف شده) از %2 نفر', '<b>%1</b> unique mobiles (duplicates removed) out of %2 people', BC.num( r.phones, 0 ), BC.num( r.total, 0 ) ) } ) );
				} ).catch( function ( e ) { info.textContent = e.message; } );
			}, 250 );
		};
		var drawPeriod = function () {
			BC.clear( periodBox );
			periodBox.appendChild( h( 'div', { class: 'bc-field__label', text: t( 'بازه فعالیت (چرخش، ثبت فرم یا گرفتن شانس)', 'Activity period (spin, form or granted spins)' ) } ) );
			periodBox.appendChild( rangeBar( rs, function () { drawPeriod(); refresh(); } ) );
		};
		rs.preset = 'all';
		Object.assign( rs, presetRange( 'all' ) );
		draw();
		drawPeriod();
		m.body.appendChild( BC.alert( 'info', t( 'فایل TXT را مستقیم در دفترچه تلفن پنل پیامک (SMS.ir، ملی‌پیامک، کاوه‌نگار، فراز و…) بارگذاری کنید. فایل CSV با اکسل باز می‌شود و ستون‌های نام، موبایل، ایمیل، تعداد چرخش/برد، شانس باقی‌مانده و همه فیلدهای فرم (تولد، شهر…) را برای باشگاه مشتریان دارد.', 'Upload the TXT straight into your SMS panel phonebook. The CSV opens in Excel with name, mobile, email, spins/wins, spins left and every form field (birthday, city…) for your customer club.' ) ) );
		m.body.appendChild( form );
		m.body.appendChild( periodBox );
		m.body.appendChild( info );
		var go = h( 'a', { class: 'bc-btn bc-btn--primary', href: '#', onClick: function ( e ) {
			e.preventDefault();
			var p = params();
			var q = Object.keys( p ).filter( function ( k ) { return p[ k ] !== '' && p[ k ] !== undefined; } ).map( function ( k ) { return encodeURIComponent( k ) + '=' + encodeURIComponent( p[ k ] ); } ).join( '&' );
			w.location.href = BC.config.exportUrl + '&what=contacts&' + q;
		} }, BC.icon( 'download', 16 ), t( 'دانلود فایل', 'Download' ) );
		m.foot.appendChild( go );
		refresh();
	}

	/* ================================================================== Credits → User spins */
	P.credits = function ( view ) {
		var st = { tab: 0, people: { page: 1, search: '', only: '', sort: '', wheel_id: '' }, events: { page: 1, search: '', type: '', wheel_id: '' }, ledger: { page: 1, search: '', status: '', wheel_id: '' }, range: { preset: 'all' } };
		Object.assign( st.range, presetRange( 'all' ) );
		var tabsEl = null;
		function draw() {
			BC.clear( view );
			view.appendChild( head( 'ticket', t( 'شانس‌های کاربران', 'User spins' ), t( 'همه کسانی که تا امروز گردونه را چرخانده‌اند یا شانس گرفته‌اند — با تعداد چرخش، برد، شانس باقی‌مانده و تاریخچه دقیق. هر چرخش و هر شانس جدید خودکار اینجا اضافه می‌شود.', 'Everyone who ever spun or received spins — spins, wins, spins left and an exact timeline. Every new spin and grant appears here automatically.' ), [
				BC.btn( BC.il( 'send', t( 'خروجی برای پیامک / باشگاه', 'Export for SMS / club' ), 16 ), function () { exportContacts( { source: 'people' } ); } ),
				BC.btn( BC.il( 'send', t( 'پیامک + شانس گروهی', 'Bulk SMS + spins' ), 16 ), function () { bulkCenter( { source: 'people' } ); } ),
				BC.btn( BC.il( 'users', t( 'هدیه گروهی به کاربران سایت', 'Bulk grant to site users' ), 16 ), bulk ),
				BC.btn( BC.il( 'plus', t( 'دادن شانس', 'Grant spins' ), 16 ), function () { grant(); }, 'primary' ),
			] ) );
			view.appendChild( h( 'div', { class: 'bc-filters bc-filters--range' }, rangeBar( st.range, function () { st.people.page = st.events.page = 1; draw(); }, { time: true } ) ) );
			tabsEl = BC.tabs( [
				{ label: t( 'افراد', 'People' ), icon: 'users', render: peopleTab },
				{ label: t( 'تاریخچه دقیق', 'Timeline' ), icon: 'clock', render: eventsTab },
				{ label: t( 'شانس‌های داده‌شده', 'Granted spins' ), icon: 'ticket', render: ledgerTab },
			], function ( i ) { st.tab = i; }, st.tab );
			view.appendChild( tabsEl );
		}
		var rq = function () { return { from: st.range.from, to: st.range.to }; };
		function peopleTab() {
			var box = h( 'div' );
			var s = st.people;
			var redraw = function () { BC.clear( box ); box.appendChild( peopleTab() ); };
			load( box, BC.api( 'people', { query: Object.assign( rq(), { page: s.page, per_page: 25, search: s.search, only: s.only, sort: s.sort, wheel_id: s.wheel_id } ) } ), function ( r ) {
				var sum = r.sum || {};
				var cr = r.credits || {};
				box.appendChild( h( 'div', { class: 'bc-kpis' },
					BC.kpi( 'users', 'blue', t( 'افراد', 'People' ), BC.num( r.total, 0 ) ),
					BC.kpi( 'wheel', 'green', t( 'چرخش', 'Spins' ), BC.num( sum.spins, 0 ), BC.num( sum.paid, 0 ) + ' ' + t( 'با شانس کسب‌شده', 'with earned spins' ) ),
					BC.kpi( 'gift', 'amber', t( 'برد', 'Wins' ), BC.num( sum.wins, 0 ), BC.num( sum.redeemed, 0 ) + ' ' + t( 'استفاده‌شده', 'redeemed' ) ),
					BC.kpi( 'ticket', 'blue', t( 'شانس داده‌شده در این بازه', 'Spins granted (period)' ), BC.num( sum.granted, 0 ) ),
					BC.kpi( 'clock', 'green', t( 'شانس منتظر مصرف (الان)', 'Spins waiting (now)' ), BC.num( cr.available, 0 ), t( 'کل داده‌شده: %1', 'all granted: %1', BC.num( cr.granted, 0 ) ) )
				) );
				var search = h( 'input', { class: 'bc-input', type: 'search', placeholder: t( 'جستجو: نام، موبایل، ایمیل', 'Search: name, phone, email' ), value: s.search } );
				search.addEventListener( 'change', function () { s.search = search.value; s.page = 1; redraw(); } );
				var only = h( 'select', { class: 'bc-input bc-select' }, [ [ '', t( 'همه افراد', 'Everyone' ) ], [ 'spinners', t( 'کسانی که چرخانده‌اند', 'Who spun' ) ], [ 'winners', t( 'برنده‌ها', 'Winners' ) ], [ 'redeemed', t( 'کسانی که از جایزه استفاده کردند', 'Redeemed a prize' ) ], [ 'granted', t( 'کسانی که شانس گرفته‌اند', 'Received spins' ) ] ].map( function ( x ) { return h( 'option', { value: x[ 0 ], text: x[ 1 ] } ); } ) );
				only.value = s.only;
				only.addEventListener( 'change', function () { s.only = only.value; s.page = 1; redraw(); } );
				var sort = h( 'select', { class: 'bc-input bc-select' }, [ [ '', t( 'آخرین فعالیت', 'Latest activity' ) ], [ 'spins', t( 'بیشترین چرخش', 'Most spins' ) ], [ 'wins', t( 'بیشترین برد', 'Most wins' ) ], [ 'granted', t( 'بیشترین شانس', 'Most granted' ) ], [ 'first', t( 'قدیمی‌ترین', 'Oldest' ) ] ].map( function ( x ) { return h( 'option', { value: x[ 0 ], text: x[ 1 ] } ); } ) );
				sort.value = s.sort;
				sort.addEventListener( 'change', function () { s.sort = sort.value; s.page = 1; redraw(); } );
				var csv = BC.config.exportUrl + '&what=people&from=' + encodeURIComponent( st.range.from ) + '&to=' + encodeURIComponent( st.range.to ) + ( s.only ? '&only=' + s.only : '' ) + ( s.wheel_id ? '&wheel_id=' + s.wheel_id : '' ) + ( s.search ? '&search=' + encodeURIComponent( s.search ) : '' );
				box.appendChild( h( 'div', { class: 'bc-filters' }, search, wheelSelect( s.wheel_id, function ( v ) { s.wheel_id = v; s.page = 1; redraw(); } ), only, sort, h( 'a', { class: 'bc-btn', href: csv }, BC.icon( 'download', 15 ), 'CSV' ) ) );
				box.appendChild( BC.card( { title: t( '%1 نفر', '%1 people', BC.num( r.total, 0 ) ), icon: 'users' }, [ BC.table( [
					{ label: t( 'شخص', 'Person' ), render: function ( x ) { return h( 'div', { class: 'bc-person' }, h( 'b', { text: x.user_name || x.name || ( x.phone || x.email ? '' : t( 'مهمان', 'Guest' ) ) } ), x.phone ? h( 'span', { dir: 'ltr', text: x.phone } ) : null, x.email ? h( 'small', { dir: 'ltr', text: x.email } ) : null ); } },
					{ label: t( 'چرخش', 'Spins' ), render: function ( x ) { return h( 'div', null, h( 'b', { text: BC.num( x.spins, 0 ) } ), x.paid ? h( 'small', { class: 'bc-muted', text: ' (' + BC.num( x.paid, 0 ) + t( ' با شانس', ' earned' ) + ')' } ) : null ); } },
					{ label: t( 'برد', 'Wins' ), render: function ( x ) { return BC.num( x.wins, 0 ) + ( x.redeemed ? ' / ' + BC.num( x.redeemed, 0 ) + t( ' استفاده', ' used' ) : '' ); } },
					{ label: t( 'شانس گرفته', 'Granted' ), render: function ( x ) { return BC.num( x.granted, 0 ); } },
					{ label: t( 'شانس باقی‌مانده', 'Spins left' ), render: function ( x ) { return x.balance > 0 ? BC.badge( BC.num( x.balance, 0 ), 'good' ) : BC.num( 0, 0 ); } },
					{ label: t( 'اولین فعالیت', 'First' ), render: function ( x ) { return h( 'small', { text: DT( x.first_at ) } ); } },
					{ label: t( 'آخرین فعالیت', 'Last' ), render: function ( x ) { return h( 'div', null, h( 'small', { text: DT( x.last_at ) } ), h( 'div', { class: 'bc-muted', text: BC.ago( x.last_at ) } ) ); } },
					{ label: '', render: function ( x ) {
						return h( 'div', { class: 'bc-row bc-row--tight' },
							BC.btn( BC.icon( 'clock', 14 ), function () { personTimeline( x ); }, 'sm ghost', { title: t( 'تاریخچه', 'Timeline' ) } ),
							BC.btn( BC.icon( 'plus', 14 ), function () { grant( x ); }, 'sm ghost', { title: t( 'دادن شانس', 'Grant spins' ) } ) );
					} },
				], r.items, BC.empty( t( 'در این بازه کسی گردونه را نچرخانده', 'Nobody spun in this period' ), t( 'بازه زمانی را «از ابتدا تا امروز» بگذارید.', 'Try "All time".' ), null, 'users' ) ), BC.pager( r.total, s.page, 25, function ( p ) { s.page = p; redraw(); } ) ] ) );
			} );
			return box;
		}
		var evRow = [
			{ label: t( 'زمان دقیق', 'Exact time' ), render: function ( x ) { return h( 'div', null, h( 'small', { text: DT( x.t ) } ), h( 'div', { class: 'bc-muted', text: BC.ago( x.t ) } ) ); } },
			{ label: t( 'رویداد', 'Event' ), render: function ( x ) { return x.type === 'spin' ? BC.badge( t( '۱ شانس مصرف شد (چرخش)', '1 spin used' ), +x.is_free ? 'default' : 'brand' ) : BC.badge( t( '+%1 شانس گرفت', '+%1 spins', BC.num( x.qty, 0 ) ), 'good' ); } },
			{ label: t( 'شخص', 'Person' ), render: function ( x ) { return h( 'div', { class: 'bc-person' }, x.user_name || x.name ? h( 'b', { text: x.user_name || x.name } ) : null, x.phone ? h( 'span', { dir: 'ltr', text: x.phone } ) : null, ! x.phone && x.email ? h( 'small', { dir: 'ltr', text: x.email } ) : null ); } },
			{ label: t( 'جزئیات', 'Details' ), render: function ( x ) { return x.type === 'spin' ? h( 'span', { class: 'bc-iconline' }, RESULT( x.result ), h( 'span', { text: x.label } ), x.code ? h( 'code', { text: x.code, dir: 'ltr' } ) : null ) : h( 'span', { text: x.label } ); } },
			{ label: t( 'گردونه', 'Wheel' ), render: function ( x ) { var y = ( BC.boot.wheels || [] ).filter( function ( z ) { return +z.id === +x.wheel_id; } )[ 0 ]; return +x.wheel_id ? ( y ? y.title : '#' + x.wheel_id ) : t( 'همه', 'Any' ); } },
		];
		function eventsTab() {
			var box = h( 'div' );
			var s = st.events;
			var redraw = function () { BC.clear( box ); box.appendChild( eventsTab() ); };
			load( box, BC.api( 'people/events', { query: Object.assign( rq(), { page: s.page, per_page: 30, search: s.search, type: s.type, wheel_id: s.wheel_id } ) } ), function ( r ) {
				var search = h( 'input', { class: 'bc-input', type: 'search', placeholder: t( 'جستجو: موبایل، ایمیل، جایزه', 'Search: phone, email, prize' ), value: s.search } );
				search.addEventListener( 'change', function () { s.search = search.value; s.page = 1; redraw(); } );
				box.appendChild( h( 'div', { class: 'bc-filters' }, search, wheelSelect( s.wheel_id, function ( v ) { s.wheel_id = v; s.page = 1; redraw(); } ), BC.segment( [ { value: '', label: t( 'همه', 'All' ) }, { value: 'spin', label: t( 'چرخش‌ها', 'Spins' ) }, { value: 'grant', label: t( 'شانس گرفتن', 'Grants' ) } ], s.type, function ( v ) { s.type = v; s.page = 1; redraw(); } ) ) );
				box.appendChild( BC.card( { title: t( '%1 رویداد', '%1 events', BC.num( r.total, 0 ) ), icon: 'clock' }, [ BC.table( evRow, r.items, BC.empty( t( 'رویدادی در این بازه نیست', 'No events in this period' ) ) ), BC.pager( r.total, s.page, 30, function ( p ) { s.page = p; redraw(); } ) ] ) );
			} );
			return box;
		}
		function personTimeline( x ) {
			var m = BC.modal( { title: t( 'تاریخچه: ', 'Timeline: ' ) + ( x.user_name || x.name || x.phone || x.email ), wide: true } );
			var page = 1;
			var draw2 = function () {
				load( m.body, BC.api( 'people/events', { query: { from: '2015-01-01', to: iso( new Date( Date.now() + 86400000 ) ), person: x.key, page: page, per_page: 50 } } ), function ( r ) {
					m.body.appendChild( h( 'div', { class: 'bc-kpis bc-kpis--sm' },
						BC.kpi( 'wheel', 'green', t( 'چرخش', 'Spins' ), BC.num( x.spins, 0 ) ),
						BC.kpi( 'gift', 'amber', t( 'برد', 'Wins' ), BC.num( x.wins, 0 ) ),
						BC.kpi( 'ticket', 'blue', t( 'کل شانس گرفته', 'All granted' ), BC.num( x.granted_all, 0 ) ),
						BC.kpi( 'clock', 'green', t( 'شانس باقی‌مانده', 'Spins left' ), BC.num( x.balance, 0 ) )
					) );
					m.body.appendChild( BC.table( evRow, r.items ) );
					BC.append( m.body, BC.pager( r.total, page, 50, function ( p ) { page = p; draw2(); } ) );
				} );
			};
			draw2();
		}
		function ledgerTab() {
			var box = h( 'div' );
			var s = st.ledger;
			var redraw = function () { BC.clear( box ); box.appendChild( ledgerTab() ); };
			load( box, BC.api( 'credits', { query: { page: s.page, per_page: 25, search: s.search, status: s.status, wheel_id: s.wheel_id } } ), function ( r ) {
				var search = h( 'input', { class: 'bc-input', type: 'search', placeholder: t( 'جستجو: کاربر، موبایل، ایمیل، توضیح', 'Search: user, phone, email, note' ), value: s.search } );
				search.addEventListener( 'change', function () { s.search = search.value; s.page = 1; redraw(); } );
				var stSel = h( 'select', { class: 'bc-input bc-select' }, [ [ '', t( 'همه', 'All' ) ], [ 'available', t( 'قابل استفاده', 'Available' ) ], [ 'revoked', t( 'باطل‌شده', 'Revoked' ) ] ].map( function ( x ) { return h( 'option', { value: x[ 0 ], text: x[ 1 ] } ); } ) );
				stSel.value = s.status;
				stSel.addEventListener( 'change', function () { s.status = stSel.value; s.page = 1; redraw(); } );
				box.appendChild( h( 'div', { class: 'bc-filters' }, search, wheelSelect( s.wheel_id, function ( v ) { s.wheel_id = v; s.page = 1; redraw(); } ), stSel, h( 'a', { class: 'bc-btn', href: BC.config.exportUrl + '&what=credits' }, BC.icon( 'download', 15 ), 'CSV' ) ) );
				var wheelName = function ( id ) {
					var x = ( BC.boot.wheels || [] ).filter( function ( y ) { return +y.id === +id; } )[ 0 ];
					return +id ? ( x ? x.title : '#' + id ) : t( 'همه گردونه‌ها', 'Any wheel' );
				};
				box.appendChild( BC.card( { title: t( '%1 ردیف شانس داده‌شده', '%1 grants', BC.num( r.total, 0 ) ), icon: 'list' }, [ BC.table( [
					{ label: t( 'صاحب', 'Owner' ), render: function ( x ) { return h( 'div', { class: 'bc-person' }, x.user_name ? h( 'b', { text: x.user_name } ) : null, x.phone ? h( 'span', { dir: 'ltr', text: x.phone } ) : null, x.email && ! x.user_name ? h( 'small', { dir: 'ltr', text: x.email } ) : null ); } },
					{ label: t( 'بابت', 'For' ), render: function ( x ) { return h( 'div', null, h( 'span', { text: x.note || x.reason } ), x.ref_type === 'order' ? h( 'a', { class: 'bc-link', href: BC.config.adminUrl + 'post.php?post=' + x.ref_id + '&action=edit', text: ' #' + x.ref_id } ) : null ); } },
					{ label: t( 'گردونه', 'Wheel' ), render: function ( x ) { return wheelName( x.wheel_id ); } },
					{ label: t( 'شانس', 'Spins' ), render: function ( x ) { return h( 'b', { text: BC.num( x.left, 0 ) + ' / ' + BC.num( x.qty, 0 ) } ); } },
					{ label: t( 'زمان', 'Time' ), render: function ( x ) { return h( 'small', { text: DT( x.created_at ) } ); } },
					{ label: t( 'انقضا', 'Expires' ), render: function ( x ) { return x.expires_at ? DT( x.expires_at ) : t( 'همیشگی', 'Never' ); } },
					{ label: t( 'وضعیت', 'Status' ), render: function ( x ) { return x.status === 'revoked' ? BC.badge( t( 'باطل', 'Revoked' ), 'bad' ) : ( x.left > 0 ? BC.badge( t( 'فعال', 'Active' ), 'good' ) : BC.badge( t( 'مصرف شد', 'Used' ), 'default' ) ); } },
					{ label: '', render: function ( x ) { return x.status === 'active' && x.left > 0 ? BC.btn( BC.icon( 'x-circle', 14 ), function () { BC.confirm( t( 'شانس‌های باقی‌مانده این ردیف باطل شود؟', 'Revoke the remaining spins of this row?' ), function () { BC.api( 'credits/' + x.id + '/revoke', { body: {} } ).then( redraw ).catch( BC.fail ); }, true ); }, 'sm ghost', { title: t( 'ابطال', 'Revoke' ) } ) : null; } },
				], r.items, BC.empty( t( 'هنوز به کسی شانس داده نشده', 'No spins granted yet' ), t( 'گردونه‌های «آزاد» شانس جداگانه نمی‌سازند؛ چرخش‌ها در تب «افراد» و «تاریخچه» هستند. با قوانین شانس یا دکمه «دادن شانس» اینجا پر می‌شود.', 'Free wheels do not create grants — their spins are in People and Timeline. Rules or "Grant spins" fill this list.' ), null, 'ticket' ) ), BC.pager( r.total, s.page, 25, function ( p ) { s.page = p; redraw(); } ) ] ) );
			} );
			return box;
		}
		function grant( person ) {
			var m = BC.modal( { title: t( 'دادن شانس چرخاندن', 'Grant spins' ), wide: true } );
			var model = { user_ids: person && +person.uid ? [ +person.uid ] : [], phones: person && ! +person.uid && person.phone ? person.phone : '', emails: person && ! +person.uid && ! person.phone && person.email ? person.email : '', qty: 1, wheel_id: 0, expires_days: 30, note: t( 'هدیه مدیر', 'Gift from admin' ), notify: true };
			m.body.appendChild( F.render( [
				{ k: 'user_ids', type: 'users', label: t( 'کاربران', 'Users' ), help: t( 'با نام، ایمیل یا شماره موبایل جستجو کنید.', 'Search by name, email or mobile.' ) },
				{ k: 'phones', type: 'textarea', label: t( 'یا شماره موبایل‌ها (هر خط یکی؛ برای مهمان‌ها)', 'Or mobile numbers (one per line; for guests)' ), rows: 3, dir: 'ltr', cols: 'half' },
				{ k: 'emails', type: 'textarea', label: t( 'یا ایمیل‌ها (هر خط یکی)', 'Or emails (one per line)' ), rows: 3, dir: 'ltr', cols: 'half' },
				{ k: 'qty', type: 'number', label: t( 'تعداد شانس', 'Spins' ), min: 1, max: 100, cols: 'third' },
				{ k: 'wheel_id', type: 'select', numeric: true, label: t( 'گردونه', 'Wheel' ), cols: 'third', opts: [ { value: 0, label: t( 'همه گردونه‌ها', 'Any wheel' ) } ].concat( ( BC.boot.wheels || [] ).map( function ( x ) { return { value: x.id, label: x.title }; } ) ) },
				{ k: 'expires_days', type: 'number', label: t( 'انقضا (روز، ۰ = همیشگی)', 'Expires (days, 0 = never)' ), min: 0, cols: 'third' },
				{ k: 'note', label: t( 'توضیح (به مشتری نمایش داده می‌شود)', 'Note (shown to the customer)' ) },
				{ k: 'notify', type: 'switch', label: t( 'پیامک اطلاع‌رسانی با لینک گردونه', 'Notify by SMS with the wheel link' ) },
			], model, function () {} ) );
			var go = BC.btn( t( 'ثبت', 'Grant' ), function () {
				BC.busy( go, BC.api( 'credits', { body: model } ) ).then( function ( r ) {
					BC.toast( t( '%1 ردیف شانس ثبت شد', '%1 grants created', BC.num( r.granted, 0 ) ), 'success' );
					m.close();
					draw();
				} ).catch( BC.fail );
			}, 'primary' );
			m.foot.appendChild( go );
		}
		function bulk() {
			var m = BC.modal( { title: t( 'هدیه گروهی به مشتریان', 'Bulk grant to customers' ), wide: true } );
			var model = { role: 'customer', min_orders: 0, min_spent: 0, qty: 1, wheel_id: 0, expires_days: 14, note: t( 'هدیه ویژه', 'Special gift' ), campaign: 'c' + Date.now().toString( 36 ) };
			m.body.appendChild( BC.alert( 'info', t( 'به همه کاربران با نقش انتخاب‌شده (و شرط‌های خرید) شانس داده می‌شود. هر کاربر در هر کمپین فقط یک‌بار.', 'All users with the role (and purchase filters) get spins — once per campaign.' ) ) );
			m.body.appendChild( F.render( [
				{ k: 'role', type: 'select', label: t( 'نقش کاربری', 'Role' ), opts: [ { value: '', label: t( 'همه کاربران', 'All users' ) } ].concat( ( BC.boot.roles || [] ).filter( function ( r ) { return r.value !== 'guest'; } ) ), cols: 'third' },
				{ k: 'min_orders', type: 'number', label: t( 'حداقل تعداد سفارش', 'Min orders' ), min: 0, cols: 'third' },
				{ k: 'min_spent', type: 'number', label: t( 'حداقل مجموع خرید', 'Min total spent' ), min: 0, unit: F.cur(), cols: 'third' },
				{ k: 'qty', type: 'number', label: t( 'تعداد شانس', 'Spins' ), min: 1, cols: 'third' },
				{ k: 'wheel_id', type: 'select', numeric: true, label: t( 'گردونه', 'Wheel' ), cols: 'third', opts: [ { value: 0, label: t( 'همه گردونه‌ها', 'Any wheel' ) } ].concat( ( BC.boot.wheels || [] ).map( function ( x ) { return { value: x.id, label: x.title }; } ) ) },
				{ k: 'expires_days', type: 'number', label: t( 'انقضا (روز)', 'Expires (days)' ), min: 0, cols: 'third' },
				{ k: 'note', label: t( 'توضیح', 'Note' ) },
			], model, function () {} ) );
			var out = h( 'p', { class: 'bc-muted' } );
			m.body.appendChild( out );
			var go = BC.btn( t( 'شروع', 'Start' ), function () {
				var total = 0;
				var step = function ( offset ) {
					return BC.api( 'credits/bulk', { body: Object.assign( {}, model, { offset: offset } ) } ).then( function ( r ) {
						total += r.granted;
						out.textContent = t( 'تا اینجا: %1 کاربر', 'So far: %1 users', BC.num( total, 0 ) );
						if ( ! r.done ) {
							return step( r.next );
						}
					} );
				};
				BC.busy( go, step( 0 ) ).then( function () { BC.toast( t( 'تمام شد: %1 کاربر', 'Done: %1 users', BC.num( total, 0 ) ), 'success' ); draw(); } ).catch( BC.fail );
			}, 'primary' );
			m.foot.appendChild( go );
		}
		draw();
	};

	/* ================================================================== Reports (real WooCommerce money) */
	P.reports = function ( view ) {
		var st = { range: { preset: 'month' }, wheel: '', statuses: [ 'completed' ], basis: 'created', opage: 1, osearch: '' };
		Object.assign( st.range, presetRange( 'month' ) );
		var syncing = false;
		function q() {
			return { from: st.range.from, to: st.range.to, wheel: st.wheel, statuses: st.statuses.join( ',' ), basis: st.basis };
		}
		function exportHref( what ) {
			var x = q();
			return BC.config.exportUrl + '&what=' + what + '&from=' + encodeURIComponent( x.from ) + '&to=' + encodeURIComponent( x.to ) + '&statuses=' + encodeURIComponent( x.statuses ) + '&basis=' + x.basis + ( x.wheel ? '&wheel_id=' + x.wheel : '' );
		}
		function runSync( restart, bar, done ) {
			syncing = true;
			var step = function ( first ) {
				return BC.api( 'reports/sync', { body: { restart: first && restart ? 1 : 0 } } ).then( function ( s ) {
					if ( bar ) {
						var pct = s.total ? Math.min( 100, Math.round( s.scanned / s.total * 100 ) ) : 100;
						bar.style.width = ( s.done ? 100 : pct ) + '%';
						bar.parentNode.nextSibling.textContent = t( 'بررسی %1 کد تخفیف از سفارش‌های ووکامرس — %2 سفارش گردونه پیدا شد', 'Checked %1 WooCommerce coupon lines — %2 wheel orders found', BC.num( s.scanned, 0 ), BC.num( s.rows, 0 ) );
					}
					if ( ! s.done ) {
						return step( false );
					}
					return s;
				} );
			};
			return step( true ).then( function ( s ) { syncing = false; if ( done ) { done( s ); } } ).catch( function ( e ) { syncing = false; BC.fail( e ); } );
		}
		function render() {
			load( view, BC.api( 'reports', { query: q() } ), function ( r ) {
				var M = r.money;
				var MP = r.money_prev;
				var A = r.activity;
				var AP = r.activity_prev;
				var C = r.counters || {};
				view.appendChild( head( 'chart', t( 'گزارش‌های پیشرفته', 'Advanced reports' ), t( 'پول واقعی از ووکامرس: جمع تخفیف کدهای گردونه فقط از سفارش‌های واقعی (پیش‌فرض: تکمیل‌شده)، فروش، هدیه‌ها، مرجوعی‌ها، نرخ تبدیل و رفتار مشتری‌ها.', 'Real WooCommerce money: wheel-code discounts from real orders only (default: completed), sales, gifts, refunds, conversion and customer behaviour.' ), [
					wheelSelect( st.wheel, function ( v ) { st.wheel = v; render(); } ),
					h( 'a', { class: 'bc-btn', href: exportHref( 'orders' ) }, BC.icon( 'download', 16 ), t( 'سفارش‌ها CSV', 'Orders CSV' ) ),
					h( 'a', { class: 'bc-btn', href: BC.config.exportUrl + '&what=spins&from=' + String( st.range.from ).slice( 0, 10 ) + '&to=' + String( st.range.to ).slice( 0, 10 ) + ( st.wheel ? '&wheel_id=' + st.wheel : '' ) }, BC.icon( 'download', 16 ), t( 'چرخش‌ها CSV', 'Spins CSV' ) ),
				] ) );
				// Filters: period + which orders count as sales + which date decides the period.
				var stOpts = ( BC.boot.statuses && BC.boot.statuses.length ? BC.boot.statuses : [ 'completed', 'processing', 'on-hold', 'pending', 'cancelled', 'refunded', 'failed' ].map( function ( s ) { return { value: s, label: STATUS_LABEL( s ) }; } ) );
				view.appendChild( h( 'div', { class: 'bc-card bc-report-filters' },
					h( 'div', { class: 'bc-report-filters__row' }, h( 'b', { text: t( 'بازه:', 'Period:' ) } ), rangeBar( st.range, function () { st.opage = 1; render(); }, { time: true } ) ),
					h( 'div', { class: 'bc-report-filters__row' }, h( 'b', { text: t( 'سفارش‌هایی که حساب می‌شوند:', 'Orders counted:' ) } ), F.chips( stOpts, st.statuses, function ( v ) { st.statuses = v.length ? v : [ 'completed' ]; st.opage = 1; render(); } ) ),
					h( 'div', { class: 'bc-report-filters__row' }, h( 'b', { text: t( 'تاریخ ملاک:', 'Date by:' ) } ), BC.segment( [ { value: 'created', label: t( 'ثبت سفارش', 'Order date' ) }, { value: 'paid', label: t( 'پرداخت', 'Paid date' ) }, { value: 'completed', label: t( 'تکمیل سفارش', 'Completed date' ) } ], st.basis, function ( v ) { st.basis = v; render(); } ) )
				) );
				// Sync state.
				var sy = r.sync || {};
				if ( ! sy.woo ) {
					view.appendChild( BC.alert( 'warn', t( 'ووکامرس فعال نیست؛ گزارش مالی (تخفیف‌ها و فروش) فقط با ووکامرس کار می‌کند. آمار چرخش‌ها پایین‌تر هست.', 'WooCommerce is not active; money reports need it. Spin statistics are below.' ) ) );
				} else {
					var bar = h( 'i', { style: { width: ( sy.done ? 100 : 0 ) + '%' } } );
					var syncBox = h( 'div', { class: 'bc-sync' },
						BC.icon( sy.done ? 'check-circle' : 'refresh', 18 ),
						h( 'div', { class: 'bc-sync__text' },
							h( 'b', { text: sy.done ? t( 'همگام با ووکامرس', 'In sync with WooCommerce' ) : t( 'در حال خواندن سفارش‌های قبلی ووکامرس…', 'Reading past WooCommerce orders…' ) } ),
							h( 'div', { class: 'bc-sync__bar' }, bar ),
							h( 'small', { class: 'bc-muted', text: t( '%1 سفارش با کد گردونه ثبت شده. هر سفارش جدید، تغییر وضعیت، لغو یا مرجوعی خودکار اعمال می‌شود.', '%1 wheel orders on record. New orders, status changes, cancellations and refunds update automatically.', BC.num( sy.rows, 0 ) ) } )
						),
						BC.btn( BC.il( 'refresh', t( 'همگام‌سازی دوباره همه سفارش‌های قبلی', 'Re-sync all past orders' ), 14 ), function ( e ) {
							if ( syncing ) {
								return;
							}
							BC.busy( e.currentTarget, runSync( true, bar ) ).then( function () { BC.toast( t( 'همگام‌سازی کامل شد', 'Sync finished' ), 'success' ); render(); } );
						}, 'sm' )
					);
					view.appendChild( syncBox );
					if ( ! sy.done && ! syncing ) {
						runSync( ! sy.started, bar, function () { render(); } );
					}
				}
				// Money KPIs.
				view.appendChild( h( 'div', { class: 'bc-kpis bc-kpis--money' },
					h( 'div', { class: 'bc-kpi bc-kpi--hero' },
						h( 'span', { class: 'bc-kpi__label', text: t( 'جمع تخفیف داده‌شده با کدهای گردونه', 'Total discount from wheel codes' ) } ),
						h( 'span', { class: 'bc-kpi__value', text: BC.money( M.discount ) } ),
						h( 'span', { class: 'bc-kpi__delta', text: t( 'از %1 سفارش %2 — بدون سفارش‌های لغو/ناتمام', 'from %1 %2 orders — cancelled/unfinished excluded', BC.num( M.orders, 0 ), st.statuses.map( STATUS_LABEL ).join( '، ' ) ) } ),
						MP.discount ? h( 'span', { class: 'bc-kpi__delta', text: delta( M.discount, MP.discount ) } ) : null
					),
					BC.kpi( 'trending', 'green', t( 'فروش سفارش‌های دارای کد', 'Sales with wheel codes' ), BC.money( M.total ), delta( M.total, MP.total ) ),
					BC.kpi( 'check', 'green', t( 'فروش خالص (منهای مرجوعی)', 'Net sales (minus refunds)' ), BC.money( M.net ), M.refunded ? t( 'مرجوعی: %1', 'refunded: %1', BC.money( M.refunded ) ) : '' ),
					BC.kpi( 'bag', 'blue', t( 'تعداد سفارش', 'Orders' ), BC.num( M.orders, 0 ), delta( M.orders, MP.orders ) ),
					BC.kpi( 'gift', 'amber', t( 'ارزش هدیه‌های رایگان', 'Free gifts value' ), BC.money( M.gift_value ) ),
					BC.kpi( 'bag', 'blue', t( 'میانگین هر سفارش', 'Average order' ), BC.money( M.avg_order ), t( 'میانگین تخفیف: %1', 'avg discount: %1', BC.money( M.avg_discount ) ) ),
					BC.kpi( 'percent', 'amber', t( 'سهم تخفیف از فروش', 'Discount share' ), BC.num( M.discount_pct, 1 ) + '%', t( 'تخفیف + هدیه ÷ مبلغ قبل از تخفیف', '(discount + gifts) ÷ gross' ) ),
					BC.kpi( 'trending', 'green', t( 'بازده هر ۱ تومان تخفیف', 'Sales per 1 of discount' ), BC.num( M.per_toman, 1 ), t( 'تومان فروش خالص', 'of net sales' ) ),
					BC.kpi( 'users', 'blue', t( 'مشتری‌ها', 'Customers' ), BC.num( M.customers, 0 ) )
				) );
				// Status breakdown (what happened to every order that used a wheel code).
				var bsRows = ( r.by_status || [] ).map( function ( x ) { return Object.assign( { counted: st.statuses.indexOf( x.status ) > -1 }, x ); } );
				view.appendChild( h( 'div', { class: 'bc-grid-2 bc-grid-2--top' },
					BC.card( { title: t( 'وضعیت همه سفارش‌های دارای کد گردونه', 'All wheel-code orders by status' ), sub: t( 'فقط وضعیت‌های تیک‌خورده در جمع تخفیف و فروش حساب شده‌اند.', 'Only ticked statuses count in totals.' ), icon: 'list' }, BC.table( [
						{ label: t( 'وضعیت', 'Status' ), render: function ( x ) { return h( 'span', { class: 'bc-iconline' }, BC.yes( x.counted ), h( 'span', { text: STATUS_LABEL( x.status ) } ) ); } },
						{ label: t( 'سفارش', 'Orders' ), render: function ( x ) { return BC.num( x.orders, 0 ); } },
						{ label: t( 'مبلغ', 'Amount' ), render: function ( x ) { return BC.money( x.total ); } },
						{ label: t( 'تخفیف', 'Discount' ), render: function ( x ) { return BC.money( x.discount ); } },
					], bsRows, BC.empty( t( 'در این بازه سفارشی با کد گردونه ثبت نشده', 'No wheel-code orders in this period' ) ) ) ),
					BC.card( { title: t( 'تخفیف بر اساس نوع جایزه', 'Discount by prize type' ), icon: 'percent' }, ( r.by_type || [] ).length ? BC.charts.bars( r.by_type.map( function ( x ) { return { label: TYPE_LABEL( x.type ), value: x.discount + x.gift, display: BC.money( x.discount + x.gift ), sub: '(' + BC.num( x.orders, 0 ) + t( ' سفارش', ' orders' ) + ')' }; } ), { colorBy: true } ) : BC.empty( t( 'هنوز سفارشی نیست', 'No orders yet' ) ) )
				) );
				// Series.
				var rows = Object.keys( r.series ).map( function ( k ) { return Object.assign( { date: k }, r.series[ k ] ); } );
				view.appendChild( BC.card( { title: t( 'فروش و تخفیف در طول زمان', 'Sales & discount over time' ), icon: 'trending' }, BC.charts.line( rows, { x: 'date', height: 240, xFormat: axisLabel, series: [ { key: 'sales', label: t( 'فروش خالص', 'Net sales' ), format: BC.money }, { key: 'discount', label: t( 'تخفیف', 'Discount' ), axis: 'right', format: BC.money }, { key: 'gift', label: t( 'ارزش هدیه', 'Gift value' ), axis: 'right', dashed: true, format: BC.money } ] } ) ) );
				view.appendChild( h( 'div', { class: 'bc-grid-2 bc-grid-2--top' },
					BC.card( { title: t( 'فعالیت گردونه', 'Wheel activity' ), icon: 'activity' }, BC.charts.line( rows, { x: 'date', height: 200, xFormat: axisLabel, series: [ { key: 'spins', label: t( 'چرخش', 'Spins' ) }, { key: 'wins', label: t( 'برد', 'Wins' ) }, { key: 'leads', label: t( 'مخاطب جدید', 'New leads' ) } ] } ) ),
					BC.card( { title: t( 'سفارش‌ها با کد گردونه', 'Orders with wheel codes' ), icon: 'bag' }, BC.charts.line( rows, { x: 'date', height: 200, xFormat: axisLabel, series: [ { key: 'orders', label: t( 'سفارش', 'Orders' ) } ] } ) )
				) );
				// Activity KPIs (straight from the spins table).
				view.appendChild( h( 'div', { class: 'bc-kpis bc-kpis--sm' },
					BC.kpi( 'eye', 'blue', t( 'باز شدن پاپ‌آپ', 'Popup opens' ), BC.num( C.opens, 0 ), BC.num( C.impressions, 0 ) + t( ' نمایش', ' impressions' ) ),
					BC.kpi( 'wheel', 'green', t( 'چرخش', 'Spins' ), BC.num( A.spins, 0 ), delta( A.spins, AP.spins ) ),
					BC.kpi( 'gift', 'amber', t( 'برد', 'Wins' ), BC.num( A.wins, 0 ), BC.num( A.win_rate, 1 ) + '% ' + t( 'نرخ برد', 'win rate' ) ),
					BC.kpi( 'ticket', 'blue', t( 'کد تخفیف صادرشده', 'Codes issued' ), BC.num( A.codes, 0 ), BC.num( A.open_codes, 0 ) + t( ' هنوز استفاده نشده', ' still unused' ) ),
					BC.kpi( 'check', 'green', t( 'جایزه استفاده‌شده', 'Prizes redeemed' ), BC.num( A.redeemed, 0 ), BC.num( A.redeem_rate, 1 ) + '% ' + t( 'از کدها', 'of codes' ) ),
					BC.kpi( 'clock', 'amber', t( 'منقضی بدون استفاده', 'Expired unused' ), BC.num( A.expired, 0 ) ),
					BC.kpi( 'users', 'blue', t( 'افراد / مخاطب جدید', 'People / new leads' ), BC.num( A.people, 0 ) + ' / ' + BC.num( A.leads, 0 ) ),
					BC.kpi( 'plus', 'green', t( 'شانس داده‌شده', 'Spins granted' ), BC.num( A.granted, 0 ), BC.num( A.credit_spins, 0 ) + t( ' چرخش با شانس', ' credit spins' ) )
				) );
				// Prize table.
				view.appendChild( BC.card( { title: t( 'عملکرد هر جایزه', 'Per-prize performance' ), sub: t( '«برده‌شده» در همین بازه؛ «سفارش/فروش/تخفیف» از سفارش‌های این بازه (حتی اگر جایزه قبل‌تر برده شده باشد).', '"Won" in this period; orders/sales/discount from orders in this period (even for prizes won earlier).' ), icon: 'gift' }, BC.table( [
					{ label: t( 'جایزه', 'Prize' ), render: function ( x ) { return h( 'div', null, h( 'span', { class: 'bc-iconline' }, RESULT( x.result ), h( 'b', { text: x.label } ) ), h( 'small', { class: 'bc-muted', text: TYPE_LABEL( x.type ) } ) ); } },
					{ label: t( 'برده‌شده', 'Won' ), render: function ( x ) { return BC.num( x.n, 0 ); } },
					{ label: t( 'استفاده', 'Redeemed' ), render: function ( x ) { return x.result === 'win' ? BC.num( x.redeemed, 0 ) : '—'; } },
					{ label: t( 'سفارش', 'Orders' ), render: function ( x ) { return BC.num( x.orders, 0 ); } },
					{ label: t( 'نرخ تبدیل', 'Conversion' ), render: function ( x ) { return x.n && x.result === 'win' ? BC.num( x.orders / x.n * 100, 1 ) + '%' : '—'; } },
					{ label: t( 'فروش خالص', 'Net sales' ), render: function ( x ) { return BC.money( x.sales ); } },
					{ label: t( 'تخفیف', 'Discount' ), render: function ( x ) { return h( 'b', { text: BC.money( x.discount ) } ); } },
					{ label: t( 'هدیه', 'Gifts' ), render: function ( x ) { return x.gift ? BC.money( x.gift ) : '—'; } },
				], r.prizes, BC.empty( t( 'در این بازه چرخشی نیست', 'No spins in this period' ) ) ) ) );
				// Timing.
				var T = r.timing || {};
				var bins = T.bins || {};
				var wd = BC.fa ? [ 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه' ] : [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
				view.appendChild( h( 'div', { class: 'bc-grid-2 bc-grid-2--top' },
					BC.card( { title: t( 'چقدر بعد از برد خرید می‌کنند؟', 'How soon after winning do they buy?' ), sub: t( 'میانگین: %1 ساعت — میانه: %2 ساعت', 'Average: %1 h — median: %2 h', BC.num( T.avg_hours, 1 ), BC.num( T.median_hours, 1 ) ), icon: 'clock' }, BC.charts.bars( [
						{ label: t( 'تا ۱ ساعت', '≤ 1 hour' ), value: bins.h1 }, { label: t( 'همان روز', 'Same day' ), value: bins.h24 }, { label: t( 'تا ۳ روز', '≤ 3 days' ), value: bins.d3 }, { label: t( 'تا ۷ روز', '≤ 7 days' ), value: bins.d7 }, { label: t( 'بیشتر از ۷ روز', '> 7 days' ), value: bins.more },
					], { colorBy: true } ) ),
					BC.card( { title: t( 'بهترین ساعت‌ها و روزهای خرید', 'Best purchase hours & days' ), icon: 'calendar' }, h( 'div', null, BC.charts.columns( ( T.hours || [] ).map( function ( _, i ) { return BC.digits( i ); } ), T.hours || [], { height: 150 } ), BC.charts.columns( [ 6, 0, 1, 2, 3, 4, 5 ].map( function ( i ) { return wd[ i ]; } ), [ 6, 0, 1, 2, 3, 4, 5 ].map( function ( i ) { return ( T.weekdays || [] )[ i ] || 0; } ), { height: 150 } ) ) )
				) );
				// Top customers + sources/devices.
				var devNames = { desktop: t( 'دسکتاپ', 'Desktop' ), mobile: t( 'موبایل', 'Mobile' ), tablet: t( 'تبلت', 'Tablet' ), other: t( 'سایر', 'Other' ) };
				var srcNames = { popup: t( 'پاپ‌آپ', 'Popup' ), launcher: t( 'دکمه شناور', 'Launcher' ), inline: t( 'داخل صفحه', 'Inline' ), button: t( 'دکمه/لینک', 'Button/link' ), timer: t( 'تایمر', 'Timer' ), exit: t( 'قصد خروج', 'Exit intent' ), scroll: t( 'اسکرول', 'Scroll' ), thankyou: t( 'صفحه تشکر', 'Thank-you' ), link: t( 'لینک پیامک', 'SMS link' ) };
				view.appendChild( h( 'div', { class: 'bc-grid-2 bc-grid-2--top' },
					BC.card( { title: t( 'بهترین مشتری‌های گردونه', 'Top wheel customers' ), icon: 'crown' }, BC.table( [
						{ label: t( 'مشتری', 'Customer' ), render: function ( x ) { return h( 'div', { class: 'bc-person' }, h( 'b', { text: x.name || '—' } ), x.phone ? h( 'span', { dir: 'ltr', text: x.phone } ) : null ); } },
						{ label: t( 'سفارش', 'Orders' ), render: function ( x ) { return BC.num( x.orders, 0 ); } },
						{ label: t( 'خرید', 'Spent' ), render: function ( x ) { return BC.money( x.total ); } },
						{ label: t( 'تخفیف', 'Discount' ), render: function ( x ) { return BC.money( x.discount ); } },
					], r.customers, BC.empty( t( 'هنوز خریدی نیست', 'No purchases yet' ) ) ) ),
					h( 'div', { class: 'bc-stack' },
						BC.card( { title: t( 'منبع چرخش‌ها', 'Spin sources' ), icon: 'map' }, BC.charts.bars( ( r.sources || [] ).map( function ( s ) { return { label: srcNames[ s.source ] || s.source || '—', value: +s.n, sub: '(' + BC.num( +s.wins, 0 ) + t( ' برد', ' wins' ) + ')' }; } ) ) ),
						BC.card( { title: t( 'دستگاه چرخاننده‌ها', 'Spinner devices' ), icon: 'smartphone' }, BC.charts.bars( Object.keys( r.devices || {} ).map( function ( k ) { return { label: devNames[ k ] || k, value: r.devices[ k ] }; } ), { colorBy: true } ) )
					)
				) );
				// Order list.
				var oBox = h( 'div' );
				view.appendChild( BC.card( { title: t( 'سفارش‌های دارای کد گردونه', 'Orders with wheel codes' ), icon: 'bag', actions: h( 'a', { class: 'bc-btn bc-btn--sm', href: exportHref( 'orders' ) }, BC.icon( 'download', 14 ), 'CSV' ) }, oBox ) );
				orders( oBox );
			} );
		}
		function orders( box ) {
			load( box, BC.api( 'reports/orders', { query: Object.assign( q(), { page: st.opage, per_page: 20, search: st.osearch } ) } ), function ( r ) {
				var search = h( 'input', { class: 'bc-input', type: 'search', placeholder: t( 'جستجو: شماره سفارش، کد، موبایل، نام', 'Search: order #, code, phone, name' ), value: st.osearch } );
				search.addEventListener( 'change', function () { st.osearch = search.value; st.opage = 1; orders( box ); } );
				box.appendChild( h( 'div', { class: 'bc-filters' }, search ) );
				box.appendChild( BC.table( [
					{ label: t( 'سفارش', 'Order' ), render: function ( x ) { return h( 'a', { class: 'bc-link', href: x.edit_url, target: '_blank', text: '#' + BC.digits( x.order_id ) } ); } },
					{ label: t( 'تاریخ', 'Date' ), render: function ( x ) { return h( 'small', { text: DT( x.d ) } ); } },
					{ label: t( 'وضعیت', 'Status' ), render: function ( x ) { return BC.badge( STATUS_LABEL( x.status ), x.status === 'completed' ? 'good' : ( [ 'cancelled', 'failed', 'refunded' ].indexOf( x.status ) > -1 ? 'bad' : 'warn' ) ); } },
					{ label: t( 'مشتری', 'Customer' ), render: function ( x ) { return h( 'div', { class: 'bc-person' }, h( 'b', { text: x.name || '—' } ), x.phone ? h( 'span', { dir: 'ltr', text: x.phone } ) : null ); } },
					{ label: t( 'کد / جایزه', 'Code / prize' ), render: function ( x ) { return h( 'div', null, h( 'code', { dir: 'ltr', text: x.codes } ), h( 'div', { class: 'bc-muted', text: x.prize } ) ); } },
					{ label: t( 'مبلغ', 'Total' ), render: function ( x ) { return BC.money( x.total ); } },
					{ label: t( 'تخفیف', 'Discount' ), render: function ( x ) { return h( 'b', { text: BC.money( x.discount ) } ); } },
					{ label: t( 'هدیه', 'Gift' ), render: function ( x ) { return +x.gift_value ? BC.money( x.gift_value ) : '—'; } },
					{ label: t( 'برد تا خرید', 'Win → buy' ), render: function ( x ) { if ( ! x.spin_at ) { return '—'; } var hrs = ( new Date( x.d.replace( ' ', 'T' ) + 'Z' ) - new Date( x.spin_at.replace( ' ', 'T' ) + 'Z' ) ) / 3600000; return hrs < 48 ? BC.num( hrs, 1 ) + t( ' ساعت', ' h' ) : BC.num( hrs / 24, 1 ) + t( ' روز', ' d' ); } },
				], r.items, BC.empty( t( 'سفارشی با این فیلترها نیست', 'No orders for these filters' ) ) ) );
				BC.append( box, BC.pager( r.total, st.opage, 20, function ( p ) { st.opage = p; orders( box ); } ) );
			} );
		}
		render();
	};


	/* ================================================================== SMS & alerts */
	var SMS_TABS = [ 'connect', 'templates', 'bulk', 'vars', 'otp', 'email', 'messenger', 'webhooks', 'log', 'system' ];
	P.sms = function ( view, q ) {
		load( view, BC.api( 'settings' ), function ( s ) {
			var model = clone( s );
			model.sms_tpl = model.sms_tpl && ! Array.isArray( model.sms_tpl ) ? model.sms_tpl : {};
			var cat = BC.boot.sms || {};
			var save = BC.btn( BC.il( 'save', t( 'ذخیره', 'Save' ), 16 ), function () {
				var keys = [ 'sms_enabled', 'sms_test_mode', 'sms_driver', 'sms_fields', 'admin_phones', 'sms_tpl', 'sms_log_days', 'otp_length', 'otp_ttl', 'otp_resend', 'otp_max_attempts', 'otp_daily_per_phone', 'sms_magic_link', 'sms_magic_days', 'otp_site_login', 'otp_register', 'email_from_name', 'email_from_address', 'email_template', 'email_logo', 'email_color', 'email_footer', 'admin_emails', 'bale_token', 'bale_chat_id', 'telegram_token', 'telegram_chat_id', 'telegram_api', 'webhooks' ];
				var body = {};
				keys.forEach( function ( k ) { body[ k ] = model[ k ]; } );
				BC.busy( save, BC.api( 'settings', { method: 'PUT', body: body } ) ).then( function ( r ) {
					var tpl = model.sms_tpl;
					model = Object.assign( model, clone( r ) );
					model.sms_tpl = tpl;
					BC.boot.settings = r;
					BC.toast( t( 'ذخیره شد ✓', 'Saved ✓' ), 'success' );
					BC.refreshBoot();
				} ).catch( BC.fail );
			}, 'primary' );
			view.appendChild( head( 'message', t( 'پیامک و اعلان', 'SMS & alerts' ), t( 'اتصال به ۲۶ سامانه پیامکی ایران (بیش از ۶۰ برند)، متن یا الگوی همه پیامک‌های خودکار، راهنمای متغیرها، کد تایید، ایمیل، بله/تلگرام، وب‌هوک و گزارش ارسال.', '26 Iranian SMS connections (60+ brands), text or pattern for every automatic message, variable guide, OTP, email, Bale/Telegram, webhooks and delivery log.' ), save ) );
			var start = Math.max( 0, SMS_TABS.indexOf( ( q && q.tab ) || 'connect' ) );
			view.appendChild( BC.tabs( [
				{ label: t( 'اتصال سامانه پیامکی', 'SMS provider' ), icon: 'key', render: function () { return smsConnect( model, cat ); } },
				{ label: t( 'پیامک‌های خودکار', 'Automatic messages' ), icon: 'edit', render: function () { return smsTemplates( model, cat ); } },
				{ label: t( 'ارسال گروهی', 'Bulk send' ), icon: 'send', render: function () { return bulkPanel( model ); } },
				{ label: t( 'راهنمای متغیرها', 'Variables guide' ), icon: 'braces', render: function () { return smsVars(); } },
				{ label: t( 'کد تایید (OTP)', 'Verification (OTP)' ), icon: 'shield', render: function () { return otpPanel( model ); } },
				{ label: t( 'ایمیل', 'Email' ), icon: 'mail', render: function () { return emailPanel( model ); } },
				{ label: t( 'بله / تلگرام', 'Bale / Telegram' ), icon: 'send', render: function () { return messengerPanel( model ); } },
				{ label: t( 'وب‌هوک‌ها', 'Webhooks' ), icon: 'webhook', render: function () { return webhookPanel( model ); } },
				{ label: t( 'گزارش پیامک‌ها', 'SMS log' ), icon: 'inbox', render: function () { return smsLog(); } },
				{ label: t( 'گزارش سیستم', 'System log' ), icon: 'list', render: function () { return logPanel(); } },
			], function ( i ) {
				try { w.history.replaceState( null, '', '#/sms?tab=' + SMS_TABS[ i ] ); } catch ( e ) {}
			}, start ) );
		} );
	};

	function smsModeChip( model ) {
		var on = model.sms_enabled && model.sms_driver;
		var kind = ! on ? [ 'bad', t( 'ارسال پیامک خاموش است', 'SMS sending is off' ) ] : ( model.sms_test_mode ? [ 'warn', t( 'حالت تست — فقط در گزارش ثبت می‌شود', 'Test mode — logged only' ) ] : [ 'good', t( 'فعال — پیامک واقعی ارسال می‌شود', 'Live — real SMS are sent' ) ] );
		return BC.badge( kind[ 1 ], kind[ 0 ] );
	}

	/** Shared: event + sample-based test send. */
	function smsTestSend( btn, out, body ) {
		if ( ! body.to ) {
			BC.toast( t( 'شماره موبایل تست را وارد کنید.', 'Enter a test mobile number.' ), 'error' );
			return;
		}
		BC.busy( btn, BC.api( 'test/sms', { body: body } ) ).then( function ( r ) {
			var modes = { live: t( 'ارسال واقعی', 'live' ), test: t( 'حالت تست — ارسال نشد', 'test mode — not sent' ), disabled: t( 'ارسال خاموش است', 'sending is off' ) };
			out.hidden = false;
			out.className = 'bc-pre bc-smsout ' + ( r.ok && r.mode === 'live' ? 'is-ok' : ( r.mode === 'live' ? 'is-bad' : 'is-warn' ) );
			out.textContent = ( r.ok && r.mode === 'live' ? '✓ ' : ( r.mode === 'live' ? '✗ ' : '• ' ) ) + ( modes[ r.mode ] || r.mode ) + '\n\n' + t( 'پیام ارسالی:', 'Message:' ) + '\n' + r.message + '\n\n' + t( 'پاسخ سامانه:', 'Panel response:' ) + '\n' + ( r.response || '—' );
		} ).catch( BC.fail );
	}

	function smsConnect( model, cat ) {
		var box = h( 'div', { class: 'bc-split' } );
		var main = h( 'div' );
		var side = h( 'div' );
		box.appendChild( main );
		box.appendChild( side );
		model.sms_fields = model.sms_fields && ! Array.isArray( model.sms_fields ) ? model.sms_fields : {};
		var families = { main: t( 'سامانه‌های اصلی (REST)', 'Main providers (REST)' ), reseller: t( 'سایر سامانه‌ها و نمایندگی‌ها', 'Other providers & resellers' ), soap: t( 'مبتنی بر SOAP / وب‌سرویس قدیمی', 'SOAP / legacy web services' ), custom: t( 'اتصال دستی', 'Manual connection' ) };
		var chipBox = h( 'span' );
		function chip() { BC.clear( chipBox ); chipBox.appendChild( smsModeChip( model ) ); }
		function draw() {
			BC.clear( main );
			chip();
			var search = h( 'input', { type: 'search', class: 'bc-input', placeholder: t( 'جستجوی نام پنل… (مثلاً فراز، ملی پیامک، مدیانا)', 'Search panels… (e.g. Faraz, Melipayamak)' ) } );
			var sel = h( 'select', { class: 'bc-input bc-select', size: 1 } );
			function fill( qv ) {
				BC.clear( sel );
				sel.appendChild( h( 'option', { value: '', text: t( '— انتخاب پنل پیامک —', '— Choose a panel —' ) } ) );
				qv = ( qv || '' ).toLowerCase().trim();
				Object.keys( families ).forEach( function ( fam ) {
					var og = h( 'optgroup', { label: families[ fam ] } );
					Object.keys( cat ).forEach( function ( id ) {
						var d = cat[ id ];
						var hay = ( d.name + ' ' + ( d.brands || [] ).join( ' ' ) + ' ' + id ).toLowerCase();
						if ( d.family === fam && ( ! qv || hay.indexOf( qv ) > -1 || id === model.sms_driver ) ) {
							og.appendChild( h( 'option', { value: id, text: d.name + ( d.brands && d.brands.length ? ' — ' + d.brands.slice( 0, 4 ).join( '، ' ) : '' ) } ) );
						}
					} );
					if ( og.children.length ) {
						sel.appendChild( og );
					}
				} );
				sel.value = model.sms_driver || '';
			}
			fill( '' );
			search.addEventListener( 'input', function () { fill( search.value ); } );
			sel.addEventListener( 'change', function () { model.sms_driver = sel.value; draw(); } );
			main.appendChild( BC.card( { title: t( 'سامانه پیامکی', 'SMS provider' ), sub: t( 'از بین %1 اتصال آماده انتخاب کنید. اگر پنل شما در لیست نیست، احتمالاً نماینده یکی از همین‌هاست (برندهای هم‌خانواده کنار هر گزینه نوشته شده) یا «اتصال دستی» را انتخاب کنید.', 'Choose one of %1 connections. If yours is missing it is probably a reseller of one of these, or use the manual connection.', BC.num( Object.keys( cat ).length, 0 ) ), icon: 'key', actions: chipBox }, [
				F.render( [
					{ k: 'sms_enabled', type: 'switch', label: t( 'ارسال پیامک فعال باشد', 'SMS sending enabled' ), cols: 'half' },
					{ k: 'sms_test_mode', type: 'switch', label: t( 'حالت تست (پیامک واقعی ارسال نشود؛ فقط در گزارش ثبت شود)', 'Test mode (log only, nothing is really sent)' ), cols: 'half' },
				], model, chip ),
				h( 'div', { class: 'bc-field' }, h( 'label', { class: 'bc-field__label', text: t( 'انتخاب پنل', 'Panel' ) } ), search, sel, h( 'div', { class: 'bc-field__help', text: t( 'بعد از انتخاب، فیلدها و راهنمای گام‌به‌گام همان پنل پایین نمایش داده می‌شود.', 'After choosing, the panel fields and its step-by-step guide appear below.' ) } ) ),
			] ) );
			var id = model.sms_driver;
			if ( ! id || ! cat[ id ] ) {
				return;
			}
			var drv = cat[ id ];
			var cfg = model.sms_fields[ id ] = model.sms_fields[ id ] || {};
			var defs = Object.keys( drv.fields ).map( function ( k ) {
				var f = drv.fields[ k ];
				var type = { password: 'secret', textarea: 'textarea', select: 'select', url: 'text' }[ f.type ] || 'text';
				var def = { k: k, type: type, label: f.label, help: f.help, dir: 'ltr', cols: type === 'textarea' ? null : 'half', mono: type === 'textarea' };
				if ( type === 'select' && f.options ) {
					def.opts = Object.keys( f.options ).map( function ( o ) { return { value: o, label: f.options[ o ] }; } );
				}
				if ( type === 'secret' ) {
					def.help = ( cfg[ k ] ? t( 'ذخیره شده (رمزنگاری‌شده). برای تغییر، مقدار جدید را وارد کنید.', 'Saved (encrypted). Type a new value to change it.' ) : t( 'به‌صورت رمزنگاری‌شده ذخیره می‌شود.', 'Stored encrypted.' ) ) + ( f.help ? ' ' + f.help : '' );
				}
				return def;
			} );
			main.appendChild( BC.card( { title: drv.name, icon: 'server', actions: drv.site ? h( 'a', { class: 'bc-btn bc-btn--sm', href: drv.site, target: '_blank', rel: 'noopener' }, BC.icon( 'external', 14 ), drv.site.replace( /^https?:\/\//, '' ).replace( /\/.*$/, '' ) ) : null }, [
				h( 'div', { class: 'bc-row', style: { 'margin-block-end': '12px' } },
					drv.pattern ? BC.badge( t( 'ارسال با الگو (پترن) پشتیبانی می‌شود', 'Pattern sending supported' ), 'good' ) : BC.badge( t( 'فقط ارسال متنی', 'Text only' ), 'warn' ),
					drv.soap ? BC.badge( drv.soap_ok ? t( 'SOAP روی هاست فعال است', 'SOAP is enabled on the host' ) : t( 'SOAP روی هاست فعال نیست', 'SOAP is NOT enabled on the host' ), drv.soap_ok ? 'good' : 'bad' ) : null
				),
				drv.brands && drv.brands.length ? h( 'p', { class: 'bc-field__help', text: t( 'برندهای سازگار: ', 'Compatible brands: ' ) + drv.brands.join( '، ' ) } ) : null,
				drv.soap && ! drv.soap_ok ? BC.alert( 'warn', t( 'افزونه SOAP روی PHP هاست شما فعال نیست؛ از پشتیبانی هاست بخواهید php-soap را فعال کند یا پنل REST را انتخاب کنید.', 'The PHP SOAP extension is not enabled on your host; ask your host to enable php-soap or choose a REST panel.' ) ) : null,
				F.render( defs, cfg, function () {} ),
			] ) );
			main.appendChild( BC.card( { title: t( 'راهنمای گام‌به‌گام اتصال ', 'Step-by-step guide: ' ) + drv.name, icon: 'book' }, h( 'div', { class: 'bc-guide-html', html: drv.guide } ) ) );
			main.appendChild( BC.card( { title: t( 'موبایل مدیران', 'Admin mobiles' ), sub: t( 'برای پیامک‌های «برنده جدید» و «درخواست تحویل جایزه» (هر خط یا با کاما یک شماره)', 'For "new winner" and "prize claim" messages (one per line or comma separated)' ), icon: 'user' }, F.render( [
				{ k: 'admin_phones', type: 'textarea', label: t( 'شماره‌ها', 'Numbers' ), rows: 2, dir: 'ltr', placeholder: '09121234567, 09351234567' },
				{ k: 'sms_log_days', type: 'number', label: t( 'نگهداری گزارش پیامک (روز؛ ۰ = همیشه)', 'Keep SMS log (days; 0 = forever)' ), min: 0, cols: 'half' },
			], model, function () {} ) ) );
		}
		draw();

		// Side: test + tips.
		var to = h( 'input', { class: 'bc-input', dir: 'ltr', placeholder: '09xxxxxxxxx', inputmode: 'tel' } );
		var ev = h( 'select', { class: 'bc-input bc-select' }, h( 'option', { value: '', text: t( 'یک پیام متنی ساده', 'A simple text message' ) } ) );
		( ( BC.boot.sms_events || {} ).events || [] ).forEach( function ( e ) {
			var mt = model.sms_tpl[ e.key ] && model.sms_tpl[ e.key ].mode === 'pattern' ? t( 'الگو', 'pattern' ) : t( 'متن', 'text' );
			ev.appendChild( h( 'option', { value: e.key, text: e.label + ' (' + mt + ' — ' + t( 'با مقادیر نمونه', 'sample values' ) + ')' } ) );
		} );
		var out = h( 'pre', { class: 'bc-pre bc-smsout', hidden: true } );
		var credit = h( 'div', { class: 'bc-field__help' } );
		side.appendChild( BC.card( { title: t( 'تست اتصال', 'Test the connection' ), sub: t( 'اول «ذخیره» بزنید، بعد تست کنید.', 'Save first, then test.' ), icon: 'zap' }, [
			BC.btn( BC.il( 'database', t( 'استعلام اعتبار پنل', 'Check panel balance' ), 15 ), function ( e ) {
				BC.busy( e.currentTarget, BC.api( 'test/credit', { body: {} } ) ).then( function ( r ) { credit.textContent = ( r.ok ? '✓ ' : '✗ ' ) + r.message; } ).catch( BC.fail );
			}, 'ghost' ),
			credit,
			h( 'div', { class: 'bc-field' }, h( 'label', { class: 'bc-field__label', text: t( 'شماره موبایل برای تست', 'Test mobile' ) } ), to ),
			h( 'div', { class: 'bc-field' }, h( 'label', { class: 'bc-field__label', text: t( 'چه چیزی ارسال شود؟', 'What to send?' ) } ), ev ),
			BC.btn( BC.il( 'send', t( 'ارسال پیامک تست', 'Send test SMS' ), 15 ), function ( e ) { smsTestSend( e.currentTarget, out, { to: to.value, event: ev.value } ); }, 'primary' ),
			out,
			h( 'p', { class: 'bc-field__help', text: t( 'اگر «حالت تست» روشن باشد پیامک واقعی ارسال نمی‌شود؛ پاسخ واقعی سامانه را فقط وقتی حالت تست خاموش است می‌بینید.', 'In test mode nothing is really sent; you see the real panel response only when test mode is off.' ) } ),
		] ) );
		var ip = BC.boot.server_ip;
		side.appendChild( BC.card( { title: t( 'نکات مهم', 'Important notes' ), icon: 'shield' }, h( 'ul', { class: 'bc-tips' }, [
			t( '<b>لینک در پیامک:</b> مخابرات ارسال لینک را روی خطوط عمومی/تبلیغاتی محدود کرده است. برای پیامک جایزه (که لینک اعمال کد دارد) و کد تایید از <b>خط خدماتی</b> یا <b>ارسال با الگو (پترن)</b> استفاده کنید.', '<b>Links in SMS:</b> public/advertising lines may block links. Use a service line or pattern sending for prize and OTP messages.' ),
			t( '<b>کد تایید (OTP):</b> فقط با الگو (پترن) سریع و مطمئن به دست مشتری می‌رسد.', '<b>OTP:</b> only pattern sending is fast and reliable.' ),
			t( '<b>امنیت:</b> کلیدها و رمزها رمزنگاری‌شده ذخیره می‌شوند و هرگز به مرورگر ارسال نمی‌شوند.', '<b>Security:</b> keys and passwords are stored encrypted and never sent to the browser.' ),
			t( '<b>IP مجاز:</b> اگر پنل شما محدودیت IP دارد، IP سرور سایت را در پنل ثبت کنید', '<b>Allowed IP:</b> if your panel restricts IPs, whitelist the server IP' ) + ( ip ? ': <code dir="ltr">' + ip + '</code>' : '' ) + '.',
			t( '<b>هر پیامک فارسی</b> تا ۷۰ حرف یک پیامک حساب می‌شود و بعد از آن هر ۶۷ حرف یک پیامک (انگلیسی: ۱۶۰ و ۱۵۳).', '<b>Persian SMS</b> count 70 characters per part, then 67 (Latin: 160 / 153).' ),
		].map( function ( x ) { return h( 'li', { html: x } ); } ) ) ) );
		return box;
	}

	/* ---------- automatic messages (Visitor-style template editor) ---------- */
	var SMS_LATIN = /^[\u0000-\u007f€£¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉÄÖÑÜ§¿äöñüà\n]*$/;
	function smsCount( text ) {
		var len = ( text || '' ).length;
		var latin = SMS_LATIN.test( text || '' );
		var one = latin ? 160 : 70;
		var multi = latin ? 153 : 67;
		var parts = len === 0 ? 0 : ( len <= one ? 1 : Math.ceil( len / multi ) );
		return { len: len, parts: parts, latin: latin };
	}
	function smsRender( text, vars ) {
		return String( text || '' ).replace( /\{([a-z0-9_]+)\}/gi, function ( m, k ) { return vars[ k ] !== undefined ? String( vars[ k ] ) : ''; } ).replace( /\n{3,}/g, '\n\n' ).replace( /[ \t]+\n/g, '\n' ).trim();
	}
	function smsParams( lines ) {
		var out = [];
		String( lines || '' ).split( /\r?\n/ ).forEach( function ( l ) {
			l = l.trim();
			var i = l.indexOf( '=' );
			if ( l && i > 0 ) {
				out.push( [ l.slice( 0, i ).trim(), l.slice( i + 1 ).trim() ] );
			}
		} );
		return out;
	}
	function smsUnknown( text, allowed ) {
		var out = [];
		String( text || '' ).replace( /\{([a-z0-9_]+)\}/gi, function ( m, k ) {
			if ( allowed.indexOf( k ) === -1 && out.indexOf( k ) === -1 ) {
				out.push( k );
			}
			return m;
		} );
		return out;
	}
	function insertAt( field, str ) {
		if ( ! field ) {
			return;
		}
		var s = field.selectionStart || field.value.length;
		var e = field.selectionEnd || s;
		field.value = field.value.slice( 0, s ) + str + field.value.slice( e );
		field.focus();
		field.selectionStart = field.selectionEnd = s + str.length;
		field.dispatchEvent( new Event( 'input' ) );
	}

	/* ---------- automatic messages: per message choose Off / direct text / panel pattern ---------- */
	var VAR_SYNONYMS = {
		otp: [ 'otp', 'verify', 'verification', 'pin', 'pass', 'password', 'ramz', 'tayid', 'taeed' ],
		code: [ 'code', 'coupon', 'kod', 'cod', 'takhfif', 'discount', 'voucher', 'cupon' ],
		name: [ 'name', 'fullname', 'fname', 'firstname', 'esm', 'nam', 'customer', 'user', 'moshtari' ],
		prize: [ 'prize', 'gift', 'reward', 'jayeze', 'jaiezeh', 'jayze', 'hedye', 'award', 'item' ],
		expiry: [ 'expiry', 'expire', 'expires', 'date', 'until', 'valid', 'etebar', 'tarikh', 'deadline' ],
		expiry_days: [ 'days', 'day', 'rooz', 'ruz', 'remain' ],
		link: [ 'link', 'url', 'apply', 'pay', 'lnk' ],
		wheel_link: [ 'wheellink', 'spinlink', 'open' ],
		wheel: [ 'wheel', 'gardoone', 'gardune', 'campaign' ],
		site: [ 'site', 'shop', 'store', 'brand', 'company', 'forooshgah', 'sherkat' ],
		site_url: [ 'siteurl', 'website', 'home' ],
		mobile: [ 'mobile', 'phone', 'tel', 'number', 'shomare', 'mob' ],
		n: [ 'n', 'count', 'qty', 'tedad', 'num', 'spins', 'chance', 'shans' ],
		spins: [ 'total', 'balance', 'remaining', 'all' ],
		rule: [ 'rule', 'reason', 'ghanoon', 'dalil' ],
		minutes: [ 'minutes', 'minute', 'min', 'daghighe', 'time' ],
		order_id: [ 'order', 'orderid', 'invoice', 'sefaresh', 'factor' ],
		order_total: [ 'amount', 'price', 'sum', 'mablagh', 'ordertotal' ],
		result: [ 'result', 'natije', 'status' ],
		claim: [ 'claim', 'address', 'adres', 'info', 'details' ],
		spin_id: [ 'spinid', 'id', 'shenase' ],
	};
	function guessVar( name, allowed, eventKey ) {
		var n = String( name || '' ).toLowerCase().replace( /[^a-z0-9]/g, '' );
		if ( ! n ) {
			return '';
		}
		if ( /^(date|tarikh|expire|expiry|until|valid)/.test( n ) && allowed.indexOf( 'expiry' ) > -1 ) {
			return 'expiry';
		}
		if ( allowed.indexOf( n ) > -1 ) {
			return n;
		}
		if ( eventKey === 'otp' && /code|kod|otp|pin|ramz/.test( n ) ) {
			return 'otp';
		}
		var best = '';
		Object.keys( VAR_SYNONYMS ).some( function ( v ) {
			if ( allowed.indexOf( v ) === -1 ) {
				return false;
			}
			if ( VAR_SYNONYMS[ v ].some( function ( s ) { return n === s || ( s.length > 3 && n.indexOf( s ) > -1 ); } ) ) {
				best = v;
				return true;
			}
			return false;
		} );
		return best;
	}
	/** Variable names written inside a pasted panel pattern: %x%, #x#, {x}, {0}, [x], $x. */
	function detectPatternVars( text ) {
		var out = [];
		var re = /%([A-Za-z0-9_\-]+)%|#([A-Za-z0-9_\-]+)#|\{([A-Za-z0-9_\-]+)\}|\[([A-Za-z0-9_\-]+)\]|\$([A-Za-z][A-Za-z0-9_]*)/g;
		var m;
		while ( ( m = re.exec( String( text || '' ) ) ) ) {
			var v = m[ 1 ] || m[ 2 ] || m[ 3 ] || m[ 4 ] || m[ 5 ];
			if ( v && out.indexOf( v ) === -1 ) {
				out.push( v );
			}
		}
		return out;
	}
	function markerOf( drv, name ) {
		var mk = ( drv && drv.marker ) || '%{}%';
		return mk.replace( '{}', name );
	}
	function paramName( drv, i, v ) {
		if ( drv && drv.pattern === 'tokens' ) {
			return [ 'token', 'token2', 'token3', 'token10', 'token20' ][ i ] || ( 'token' + ( i + 1 ) );
		}
		if ( drv && drv.pattern === 'positional' ) {
			return String( i );
		}
		return v;
	}
	/** Rows [{name, value}] from the {variables} used in a text, in order. */
	function rowsFromText( drv, text ) {
		var vars = [];
		String( text || '' ).replace( /\{([a-z0-9_]+)\}/gi, function ( m, k ) {
			if ( vars.indexOf( k ) === -1 && k !== 'site' && k !== 'site_url' ) {
				vars.push( k );
			}
			return m;
		} );
		var max = drv && drv.pattern === 'tokens' ? 5 : 10;
		return vars.slice( 0, max ).map( function ( v, i ) { return { name: paramName( drv, i, v ), value: '{' + v + '}' }; } );
	}
	/** Suggested text to register as a pattern on the panel, from the message text and the rows. */
	function suggestPattern( drv, text, rows ) {
		var out = String( text || '' );
		rows.forEach( function ( r ) {
			if ( r.name && r.value ) {
				out = out.split( r.value ).join( markerOf( drv, r.name ) );
			}
		} );
		return out.replace( /\{(site|site_url)\}/g, function ( m, k ) { return ( BC.boot.sms_events.samples || {} )[ k ] || ''; } ).replace( /\{[a-z0-9_]+\}/gi, '…' );
	}
	function fillPattern( drv, pattern, rows, samples ) {
		var out = String( pattern || '' );
		rows.forEach( function ( r ) {
			var val = smsRender( r.value, samples ) || '-';
			[ markerOf( drv, r.name ), '%' + r.name + '%', '#' + r.name + '#', '{' + r.name + '}', '[' + r.name + ']' ].forEach( function ( mk ) { out = out.split( mk ).join( val ); } );
		} );
		return out;
	}
	function phoneMock( text, metaText, warn ) {
		return h( 'div', { class: 'bc-phone' },
			h( 'div', { class: 'bc-phone__bar' }, h( 'span', { class: 'bc-phone__dot' } ), h( 'b', { text: ( BC.boot.sms_events.samples || {} ).site || 'SMS' } ) ),
			h( 'div', { class: 'bc-phone__screen' }, h( 'div', { class: 'bc-phone__bubble', dir: BC.fa ? 'rtl' : 'auto', text: text || '—' } ) ),
			metaText ? h( 'div', { class: 'bc-phone__meta', text: metaText } ) : null,
			warn
		);
	}

	function smsTemplates( model, cat ) {
		var meta = BC.boot.sms_events || { events: [], variables: {}, samples: {} };
		var samples = meta.samples || {};
		var flat = {};
		Object.keys( meta.variables ).forEach( function ( g ) { Object.keys( meta.variables[ g ].vars ).forEach( function ( k ) { flat[ k ] = meta.variables[ g ].vars[ k ]; } ); } );
		var drv = cat[ model.sms_driver ] || null;
		var box = h( 'div', { class: 'bc-msgs' } );
		var testTo = h( 'input', { class: 'bc-input', dir: 'ltr', placeholder: '09xxxxxxxxx', inputmode: 'tel' } );

		box.appendChild( h( 'div', { class: 'bc-msgs__intro' },
			h( 'div', { class: 'bc-msgs__introtext' },
				h( 'h3', { text: t( 'هر پیامک چطور ارسال شود؟', 'How should each message be sent?' ) } ),
				h( 'p', { html: t( 'برای هر پیامک یکی را انتخاب کنید: <b>خاموش</b>، <b>متن مستقیم</b> (متن را این‌جا می‌نویسید و افزونه با همان API که وارد کرده‌اید ارسال می‌کند) یا <b>پترن سامانه</b> (فقط کد پترن را وارد می‌کنید و افزونه خودش پارامترها را وصل می‌کند).', 'For each message choose: <b>Off</b>, <b>Direct text</b> (written here, sent through your API) or <b>Panel pattern</b> (enter only the pattern code; the plugin maps the parameters).' ) } ),
				h( 'div', { class: 'bc-row' },
					drv ? BC.badge( t( 'سامانه: ', 'Panel: ' ) + drv.name.split( ' — ' )[ 0 ], 'brand' ) : BC.badge( t( 'پنل پیامک انتخاب نشده', 'No SMS panel selected' ), 'bad' ),
					drv ? ( drv.pattern ? BC.badge( t( 'پترن پشتیبانی می‌شود', 'Patterns supported' ), 'good' ) : BC.badge( t( 'این پنل پترن ندارد؛ فقط متن مستقیم', 'No patterns on this panel; direct text only' ), 'warn' ) ) : null,
					smsModeChip( model )
				)
			),
			h( 'div', { class: 'bc-msgs__test' }, h( 'label', { class: 'bc-field__label', text: t( 'موبایل شما برای «ارسال تست»', 'Your mobile for "Send test"' ) } ), testTo )
		) );

		meta.events.forEach( function ( e ) {
			var cur = model.sms_tpl[ e.key ] = Object.assign( { on: e.toggle !== false, mode: 'text', text: '', code: '', params: '', fallback: false, sample: '' }, model.sms_tpl[ e.key ] || {} );
			if ( ! cur.text ) {
				cur.text = e.default;
			}
			if ( ! cur.params ) {
				cur.params = e.hint;
			}
			var rows = smsParams( cur.params ).map( function ( p ) { return { name: p[ 0 ], value: p[ 1 ] }; } );
			var always = e.toggle === null;
			function how() {
				return ! always && ! cur.on ? 'off' : cur.mode;
			}
			function syncParams() {
				cur.params = rows.filter( function ( r ) { return r.name; } ).map( function ( r ) { return r.name + '=' + r.value; } ).join( '\n' );
			}

			var row = h( 'section', { class: 'bc-msg2' } );
			var summary = h( 'span', { class: 'bc-msg2__sum' } );
			var body = h( 'div', { class: 'bc-msg2__body', hidden: true } );
			var built = false;
			function updSummary() {
				BC.clear( summary );
				var m = how();
				if ( m === 'off' ) {
					summary.appendChild( BC.badge( t( 'ارسال نمی‌شود', 'Not sent' ), 'default' ) );
				} else if ( m === 'pattern' ) {
					summary.appendChild( cur.code ? BC.badge( t( 'پترن ', 'Pattern ' ) + cur.code, 'good' ) : BC.badge( t( 'کد پترن وارد نشده!', 'Pattern code missing!' ), 'bad' ) );
				} else {
					var c = smsCount( smsRender( cur.text, samples ) );
					summary.appendChild( BC.badge( t( 'متن | %1 پیامک', 'Text | %1 part(s)', BC.num( c.parts, 0 ) ), 'brand' ) );
				}
				row.classList.toggle( 'is-off', m === 'off' );
			}
			var modeOpts = ( always ? [] : [ { value: 'off', label: t( 'خاموش', 'Off' ) } ] ).concat( [ { value: 'text', label: t( 'متن مستقیم', 'Direct text' ) }, { value: 'pattern', label: t( 'پترن سامانه', 'Panel pattern' ) } ] );
			var seg = BC.segment( modeOpts, how(), function ( v ) {
				if ( v === 'off' ) {
					cur.on = false;
				} else {
					cur.on = true;
					cur.mode = v;
				}
				updSummary();
				draw();
				open( true );
			} );
			seg.classList.add( 'bc-msg2__seg' );
			var headBtn = h( 'button', { type: 'button', class: 'bc-msg2__head', 'aria-expanded': 'false', onClick: function () { open( body.hidden ); } },
				h( 'span', { class: 'bc-msg2__ic' }, BC.icon( e.to === 'admins' ? 'user' : ( e.key === 'otp' ? 'shield' : 'message' ), 18 ) ),
				h( 'span', { class: 'bc-msg2__title' }, h( 'b', { text: e.label } ), h( 'small', { text: e.desc } ) ),
				h( 'span', { class: 'bc-msg2__to', text: e.to === 'admins' ? t( 'به مدیران', 'to admins' ) : t( 'به مشتری', 'to customer' ) } ),
				summary,
				h( 'span', { class: 'bc-msg2__chev' }, BC.icon( 'chevron-down', 18 ) )
			);
			row.appendChild( h( 'div', { class: 'bc-msg2__top' }, headBtn, seg ) );
			row.appendChild( body );
			function open( on ) {
				body.hidden = ! on;
				headBtn.setAttribute( 'aria-expanded', on ? 'true' : 'false' );
				row.classList.toggle( 'is-open', on );
				if ( on && ! built ) {
					draw();
				}
			}

			function chipsFor( getField ) {
				var chips = h( 'div', { class: 'bc-varchips', title: t( 'روی متغیر کلیک کنید تا در جای مکان‌نما درج شود', 'Click to insert at the cursor' ) } );
				e.allowed.forEach( function ( v ) {
					var info = flat[ v ];
					chips.appendChild( h( 'button', { type: 'button', class: 'bc-varchip', title: info ? info[ 1 ] + ' — ' + t( 'مثال: ', 'e.g. ' ) + info[ 2 ] : v, onClick: function () { insertAt( getField(), '{' + v + '}' ); } }, h( 'code', { dir: 'ltr', text: '{' + v + '}' } ), info ? h( 'span', { text: info[ 0 ] } ) : null ) );
				} );
				return chips;
			}
			function textWarnings( txt ) {
				var w = [];
				var unk = smsUnknown( txt, e.allowed );
				if ( unk.length ) {
					w.push( t( 'این متغیرها در این پیامک مقدار ندارند: ', 'Not available in this message: ' ) + unk.map( function ( x ) { return '{' + x + '}'; } ).join( ' ' ) );
				}
				if ( how() === 'text' && /https?:\/\/|\{(link|wheel_link|site_url)\}/.test( txt ) ) {
					w.push( t( 'متن لینک دارد؛ روی خط تبلیغاتی ممکن است ارسال نشود. خط خدماتی یا «پترن سامانه» مطمئن‌تر است.', 'The text has a link; advertising lines may block it. A service line or a panel pattern is safer.' ) );
				}
				return w;
			}
			function warnBox( list ) {
				return list.length ? h( 'div', { class: 'bc-smspv__warn' }, list.map( function ( x ) { return h( 'div', { text: '⚠ ' + x } ); } ) ) : null;
			}

			function draw() {
				built = true;
				BC.clear( body );
				var m = how();
				if ( m === 'off' ) {
					body.appendChild( h( 'div', { class: 'bc-msg2__off' }, BC.icon( 'pause', 18 ), h( 'span', { text: t( 'این پیامک ارسال نمی‌شود. برای فعال‌سازی بالا «متن مستقیم» یا «پترن سامانه» را بزنید.', 'This message is not sent. Choose "Direct text" or "Panel pattern" above to enable it.' ) } ) ) );
					return;
				}
				var out = h( 'pre', { class: 'bc-pre bc-smsout', hidden: true } );
				var right = h( 'div', { class: 'bc-msg2__preview' } );

				if ( m === 'text' ) {
					var ta = h( 'textarea', { class: 'bc-input bc-msg2__text', rows: 6, dir: BC.fa ? 'rtl' : 'auto' } );
					ta.value = cur.text;
					var refresh = function () {
						cur.text = ta.value;
						var txt = smsRender( cur.text, samples );
						var c = smsCount( txt );
						BC.clear( right );
						right.appendChild( phoneMock( txt, t( '%1 حرف | %2 پیامک', '%1 chars | %2 part(s)', BC.num( c.len, 0 ), BC.num( c.parts, 0 ) ) + ' (' + ( c.latin ? t( 'لاتین', 'Latin' ) : t( 'فارسی', 'Unicode' ) ) + ')', warnBox( textWarnings( cur.text ) ) ) );
						updSummary();
					};
					ta.addEventListener( 'input', refresh );
					body.appendChild( h( 'div', { class: 'bc-msg2__grid' },
						h( 'div', null,
							h( 'div', { class: 'bc-msg2__step' }, h( 'span', { class: 'bc-step-n', text: '۱' } ), h( 'b', { text: t( 'متن پیامک را بنویسید', 'Write the message' ) } ) ),
							ta,
							h( 'p', { class: 'bc-field__help', text: t( 'افزونه همین متن را بعد از جایگزینی متغیرها، با API پنل شما (همان کلیدی که در «اتصال سامانه» وارد کرده‌اید) ارسال می‌کند.', 'The plugin sends this text, with variables replaced, through your panel API (the key you entered under SMS provider).' ) } ),
							h( 'div', { class: 'bc-msg2__step' }, h( 'span', { class: 'bc-step-n', text: '۲' } ), h( 'b', { text: t( 'متغیرها (کلیک = درج)', 'Variables (click to insert)' ) } ) ),
							chipsFor( function () { return ta; } )
						),
						right
					) );
					refresh();
				} else {
					// ---------- pattern ----------
					if ( drv && ! drv.pattern ) {
						body.appendChild( BC.alert( 'warn', t( 'پنل فعلی (%1) ارسال با پترن ندارد؛ این پیامک به‌صورت «متن مستقیم» ارسال می‌شود.', 'The current panel (%1) has no pattern sending; this message is sent as direct text.', drv.name ) ) );
					}
					var code = h( 'input', { class: 'bc-input bc-msg2__code', dir: 'ltr', placeholder: '123456', value: cur.code } );
					var tbl = h( 'div', { class: 'bc-pmap' } );
					var sugBox = h( 'div', { class: 'bc-pattern-suggest', dir: BC.fa ? 'rtl' : 'auto' } );
					var pasteWrap = h( 'div', { class: 'bc-msg2__paste', hidden: ! cur.sample } );
					var paste = h( 'textarea', { class: 'bc-input', rows: 3, dir: BC.fa ? 'rtl' : 'auto', placeholder: t( 'متن پترن را از پنل کپی و این‌جا بچسبانید؛ مثلاً: سلام %name% کد شما %code%', 'Paste the pattern text from your panel, e.g. Hi %name% your code %code%' ) } );
					paste.value = cur.sample || '';
					var detected = h( 'div', { class: 'bc-field__help' } );
					var srcText = h( 'textarea', { class: 'bc-input', rows: 4, dir: BC.fa ? 'rtl' : 'auto' } );
					srcText.value = cur.text;
					var fb = h( 'input', { type: 'checkbox', checked: !! cur.fallback } );
					var sugWrap = null;
					var lastField = null;

					var refreshP = function () {
						cur.code = code.value.trim();
						cur.sample = paste.value;
						cur.text = srcText.value;
						cur.fallback = fb.checked;
						syncParams();
						var sug = suggestPattern( drv, cur.text, rows );
						sugBox.textContent = sug;
						sugWrap.hidden = ! pasteWrap.hidden;
						// Preview: what the customer receives + exact request.
						var shown = cur.sample.trim() ? fillPattern( drv, cur.sample, rows, samples ) : smsRender( cur.text, samples );
						var warns = [];
						if ( ! cur.code ) {
							warns.push( t( 'کد پترن را وارد کنید؛ تا خالی است همین متن به‌صورت عادی ارسال می‌شود.', 'Enter the pattern code; until then the text is sent normally.' ) );
						}
						rows.forEach( function ( r ) {
							if ( ! r.name ) {
								warns.push( t( 'یک پارامتر نام ندارد.', 'A parameter has no name.' ) );
							}
							if ( ! r.value ) {
								warns.push( t( 'پارامتر «%1» مقدار ندارد؛ «-» ارسال می‌شود.', 'Parameter "%1" has no value; "-" is sent.', r.name ) );
							}
						} );
						if ( cur.sample.trim() ) {
							var inPanel = detectPatternVars( cur.sample );
							inPanel.forEach( function ( v ) {
								if ( ! rows.some( function ( r ) { return r.name === v; } ) ) {
									warns.push( t( 'متغیر «%1» در پترن پنل هست ولی در جدول پارامترها نیست.', 'Variable "%1" is in the panel pattern but not mapped.', v ) );
								}
							} );
						}
						if ( drv && drv.pattern === 'tokens' ) {
							rows.forEach( function ( r ) {
								if ( r.name && [ 'token', 'token2', 'token3', 'token10', 'token20' ].indexOf( r.name ) === -1 ) {
									warns.push( t( 'کاوه‌نگار فقط token, token2, token3, token10, token20 را می‌شناسد: ', 'Kavenegar only knows token…token20: ' ) + r.name );
								}
							} );
						}
						var req = h( 'div', { class: 'bc-reqbox' },
							h( 'div', { class: 'bc-reqbox__h', text: t( 'درخواستی که افزونه به پنل می‌فرستد', 'Request the plugin sends to the panel' ) } ),
							h( 'div', { class: 'bc-reqbox__row' }, h( 'span', { text: t( 'کد پترن', 'Pattern code' ) } ), h( 'code', { dir: 'ltr', text: cur.code || '—' } ) ),
							rows.map( function ( r ) { return h( 'div', { class: 'bc-reqbox__row' }, h( 'code', { dir: 'ltr', text: r.name || '?' } ), h( 'span', { dir: 'auto', text: smsRender( r.value, samples ) || '-' } ) ); } )
						);
						BC.clear( right );
						right.appendChild( phoneMock( shown, cur.sample.trim() ? t( 'پیش‌نمایش با متن پترن شما و مقادیر نمونه', 'Preview with your pattern text and sample values' ) : t( 'پیش‌نمایش با مقادیر نمونه', 'Preview with sample values' ), warnBox( warns ) ) );
						right.appendChild( req );
						updSummary();
					};

					var drawRows = function () {
						BC.clear( tbl );
						var head = h( 'div', { class: 'bc-pmap__row bc-pmap__head' }, h( 'span', { text: drv && drv.pattern === 'positional' ? t( 'ترتیب در پترن', 'Position' ) : t( 'نام متغیر در پترن پنل', 'Variable name in the panel pattern' ) } ), h( 'span' ), h( 'span', { text: t( 'چه مقداری جایش برود؟', 'What value goes there?' ) } ), h( 'span', { text: t( 'نمونه', 'Example' ) } ), h( 'span' ) );
						tbl.appendChild( head );
						rows.forEach( function ( r, i ) {
							var nameEl;
							if ( drv && drv.pattern === 'tokens' ) {
								nameEl = h( 'select', { class: 'bc-input bc-select' }, [ 'token', 'token2', 'token3', 'token10', 'token20' ].map( function ( x ) { return h( 'option', { value: x, text: x } ); } ) );
								nameEl.value = r.name || 'token';
								nameEl.addEventListener( 'change', function () { r.name = nameEl.value; refreshP(); } );
							} else if ( drv && drv.pattern === 'positional' ) {
								r.name = String( i );
								nameEl = h( 'span', { class: 'bc-pmap__pos', text: '{' + i + '}' } );
							} else {
								nameEl = h( 'input', { class: 'bc-input', dir: 'ltr', value: r.name, placeholder: 'name' } );
								nameEl.addEventListener( 'input', function () { r.name = nameEl.value.trim().replace( /^[%#{[]+|[%#}\]]+$/g, '' ); refreshP(); } );
							}
							var single = /^\{([a-z0-9_]+)\}$/.exec( r.value || '' );
							var sel = h( 'select', { class: 'bc-input bc-select' }, e.allowed.map( function ( v ) { return h( 'option', { value: v, text: ( flat[ v ] ? flat[ v ][ 0 ] : v ) + '  {' + v + '}' } ); } ).concat( [ h( 'option', { value: '__custom', text: t( 'متن/ترکیب دلخواه…', 'Custom text / mix…' ) } ) ] ) );
							var custom = h( 'input', { class: 'bc-input', dir: 'auto', value: r.value, placeholder: t( 'مثلاً {prize} تا {expiry}', 'e.g. {prize} until {expiry}' ) } );
							sel.value = single && e.allowed.indexOf( single[ 1 ] ) > -1 ? single[ 1 ] : '__custom';
							custom.hidden = sel.value !== '__custom';
							var ex = h( 'small', { class: 'bc-pmap__ex', dir: 'auto', text: smsRender( r.value, samples ) || '-' } );
							sel.addEventListener( 'change', function () {
								if ( sel.value === '__custom' ) {
									custom.hidden = false;
									custom.focus();
								} else {
									r.value = '{' + sel.value + '}';
									custom.value = r.value;
									custom.hidden = true;
								}
								ex.textContent = smsRender( r.value, samples ) || '-';
								refreshP();
							} );
							custom.addEventListener( 'focus', function () { lastField = custom; } );
							custom.addEventListener( 'input', function () { r.value = custom.value; ex.textContent = smsRender( r.value, samples ) || '-'; refreshP(); } );
							tbl.appendChild( h( 'div', { class: 'bc-pmap__row' },
								nameEl,
								h( 'span', { class: 'bc-pmap__arrow', text: '←' } ),
								h( 'div', { class: 'bc-pmap__val' }, sel, custom ),
								ex,
								h( 'div', { class: 'bc-row bc-row--tight' },
									drv && drv.pattern === 'positional' ? h( 'button', { type: 'button', class: 'bc-icon-btn', disabled: i === 0, title: t( 'بالا', 'Up' ), onClick: function () { rows.splice( i - 1, 0, rows.splice( i, 1 )[ 0 ] ); drawRows(); refreshP(); } }, BC.icon( 'arrow-up', 14 ) ) : null,
									h( 'button', { type: 'button', class: 'bc-icon-btn', title: t( 'حذف', 'Remove' ), onClick: function () { rows.splice( i, 1 ); drawRows(); refreshP(); } }, BC.icon( 'trash', 14 ) )
								)
							) );
						} );
						tbl.appendChild( h( 'div', { class: 'bc-row' },
							BC.btn( BC.il( 'plus', t( 'افزودن پارامتر', 'Add parameter' ), 14 ), function () {
								var used = rows.map( function ( r ) { return r.name; } );
								var nm = drv && drv.pattern === 'tokens' ? ( [ 'token', 'token2', 'token3', 'token10', 'token20' ].filter( function ( x ) { return used.indexOf( x ) === -1; } )[ 0 ] || 'token' ) : '';
								rows.push( { name: nm, value: '{' + ( e.allowed[ 0 ] || 'name' ) + '}' } );
								drawRows();
								refreshP();
							}, 'sm' )
						) );
					};

					var detect = function () {
						var vars = detectPatternVars( paste.value );
						if ( ! vars.length ) {
							detected.textContent = t( 'متغیری در متن پیدا نشد؛ متغیرها باید مثل %name% یا #name# یا {0} نوشته شده باشند.', 'No variables found; they must look like %name%, #name# or {0}.' );
							return;
						}
						var old = {};
						rows.forEach( function ( r ) { old[ r.name ] = r.value; } );
						rows = vars.map( function ( v, i ) {
							var g = old[ v ] || ( guessVar( v, e.allowed, e.key ) ? '{' + guessVar( v, e.allowed, e.key ) + '}' : '' );
							return { name: drv && drv.pattern === 'positional' && /^\d+$/.test( v ) ? v : v, value: g };
						} );
						var unmatched = rows.filter( function ( r ) { return ! r.value; } ).map( function ( r ) { return r.name; } );
						detected.textContent = t( '✓ %1 متغیر پیدا و وصل شد.', '✓ %1 variable(s) found and mapped.', BC.num( vars.length, 0 ) ) + ( unmatched.length ? ' ' + t( 'برای این‌ها مقدار را انتخاب کنید: ', 'Choose a value for: ' ) + unmatched.join( '، ' ) : '' );
						drawRows();
						refreshP();
					};

					[ code, paste, srcText ].forEach( function ( f ) { f.addEventListener( 'input', refreshP ); } );
					srcText.addEventListener( 'focus', function () { lastField = srcText; } );
					fb.addEventListener( 'change', refreshP );
					paste.addEventListener( 'input', function () { clearTimeout( paste._t ); paste._t = setTimeout( detect, 500 ); } );

					var help = drv && drv.pattern_help ? h( 'details', { class: 'bc-msg2__help' }, h( 'summary', { text: t( 'کد پترن و نام پارامترها در %1 کجاست؟', 'Where are the pattern code and parameter names in %1?', drv.name.split( ' — ' )[ 0 ] ) } ), h( 'div', { class: 'bc-guide-html', html: drv.pattern_help } ) ) : null;
					body.appendChild( h( 'div', { class: 'bc-msg2__grid' },
						h( 'div', null,
							h( 'div', { class: 'bc-msg2__step' }, h( 'span', { class: 'bc-step-n', text: '۱' } ), h( 'b', { text: t( 'کد پترن را وارد کنید', 'Enter the pattern code' ) } ) ),
							code,
							help,
							h( 'div', { class: 'bc-msg2__step' }, h( 'span', { class: 'bc-step-n', text: '۲' } ), h( 'b', { text: t( 'پترن را در پنل چطور ساخته‌اید؟', 'Your pattern on the panel' ) } ) ),
							h( 'div', { class: 'bc-choice2' },
								h( 'button', { type: 'button', class: 'bc-choice2__btn' + ( cur.sample ? '' : ' is-on' ), onClick: function ( ev ) {
									pasteWrap.hidden = true;
									paste.value = '';
									rows = rowsFromText( drv, srcText.value );
									drawRows();
									refreshP();
									Array.prototype.forEach.call( ev.currentTarget.parentNode.children, function ( b ) { b.classList.remove( 'is-on' ); } );
									ev.currentTarget.classList.add( 'is-on' );
								} }, h( 'b', { text: t( '✨ هنوز نساخته‌ام', '✨ Not created yet' ) } ), h( 'small', { text: t( 'افزونه متن پترن را می‌سازد؛ کپی و در پنل ثبت کنید', 'The plugin writes the pattern text for you to register' ) } ) ),
								h( 'button', { type: 'button', class: 'bc-choice2__btn' + ( cur.sample ? ' is-on' : '' ), onClick: function ( ev ) {
									pasteWrap.hidden = false;
									sugWrap.hidden = true;
									paste.focus();
									Array.prototype.forEach.call( ev.currentTarget.parentNode.children, function ( b ) { b.classList.remove( 'is-on' ); } );
									ev.currentTarget.classList.add( 'is-on' );
								} }, h( 'b', { text: t( '📋 ساخته‌ام؛ متنش را دارم', '📋 Already created' ) } ), h( 'small', { text: t( 'متن پترن را بچسبانید تا متغیرها خودکار وصل شوند', 'Paste its text and variables are mapped automatically' ) } ) )
							),
							pasteWrap,
							sugWrap = h( 'div', { class: 'bc-msg2__suggest' },
								h( 'div', { class: 'bc-row bc-row--between' }, h( 'small', { class: 'bc-muted', text: t( 'متن پیشنهادی برای ثبت پترن در پنل:', 'Suggested pattern text to register on your panel:' ) } ), BC.btn( BC.il( 'copy', t( 'کپی', 'Copy' ), 13 ), function () { BC.copy( sugBox.textContent ); }, 'sm ghost' ) ),
								sugBox
							),
							h( 'div', { class: 'bc-msg2__step' }, h( 'span', { class: 'bc-step-n', text: '۳' } ), h( 'b', { text: t( 'پارامترهای پترن (خودکار پر می‌شود؛ قابل تغییر)', 'Pattern parameters (auto-filled; editable)' ) } ) ),
							tbl,
							h( 'details', { class: 'bc-msg2__help' },
								h( 'summary', { text: t( 'متن پیامک (برای ساخت متن پترن و پیامک پشتیبان)', 'Message text (used to build the pattern text and as fallback)' ) } ),
								srcText,
								chipsFor( function () { return lastField || srcText; } ),
								BC.btn( BC.il( 'zap', t( 'ساخت دوباره پارامترها از این متن', 'Rebuild parameters from this text' ), 13 ), function () { rows = rowsFromText( drv, srcText.value ); drawRows(); refreshP(); }, 'sm ghost' )
							),
							h( 'label', { class: 'bc-msg2__fb' }, h( 'span', { class: 'bc-switch' }, fb, h( 'span' ) ), h( 'span', { text: t( 'اگر پنل پترن را رد کرد، همین متن به‌صورت عادی ارسال شود (پیامک پشتیبان)', 'If the panel rejects the pattern, send the text normally (fallback)' ) } ) )
						),
						right
					) );
					pasteWrap.appendChild( paste );
					pasteWrap.appendChild( detected );
					drawRows();
					refreshP();
				}

				body.appendChild( h( 'div', { class: 'bc-msg2__foot' },
					e.scope ? h( 'small', { class: 'bc-muted', text: 'ℹ ' + e.scope } ) : h( 'span' ),
					h( 'div', { class: 'bc-row' },
						BC.btn( BC.il( 'undo', t( 'پیش‌فرض', 'Default' ), 14 ), function () {
							cur.text = e.default;
							cur.params = e.hint;
							cur.sample = '';
							rows = smsParams( cur.params ).map( function ( p ) { return { name: p[ 0 ], value: p[ 1 ] }; } );
							draw();
						}, 'sm ghost' ),
						BC.btn( BC.il( 'send', t( 'ارسال تست این پیامک', 'Send a test of this message' ), 14 ), function ( ev ) {
							smsTestSend( ev.currentTarget, out, { to: testTo.value, event: e.key, template: { mode: cur.mode, text: cur.text, code: cur.code, params: cur.params, fallback: cur.fallback } } );
						}, 'sm primary' )
					)
				) );
				body.appendChild( out );
			}
			updSummary();
			box.appendChild( row );
		} );
		var first = box.querySelector( '.bc-msg2__head' );
		if ( first ) {
			first.click();
		}
		return box;
	}

	/* ---------- variables reference ---------- */
	function smsVars() {
		var meta = BC.boot.sms_events || { events: [], variables: {} };
		var box = h( 'div' );
		box.appendChild( BC.alert( 'info', t( 'متغیرها را بین آکولاد {} بنویسید. هر متغیر فقط در پیامک‌هایی که ستون آخر نشان می‌دهد مقدار دارد؛ اگر جای دیگری استفاده شود ویرایشگر هشدار می‌دهد و هنگام ارسال خالی می‌شود. برای کپی روی متغیر کلیک کنید.', 'Write variables in braces {}. A variable only has a value in the messages listed in the last column; elsewhere the editor warns and it is sent empty. Click a variable to copy it.' ) ) );
		Object.keys( meta.variables ).forEach( function ( g ) {
			var grp = meta.variables[ g ];
			var rows = Object.keys( grp.vars ).map( function ( k ) {
				var v = grp.vars[ k ];
				var where = meta.events.filter( function ( e ) { return e.allowed.indexOf( k ) > -1; } ).map( function ( e ) { return e.label; } );
				return { k: k, v: v, where: where };
			} );
			box.appendChild( BC.card( { title: grp.label, icon: 'braces', cls: 'bc-card--flush' }, BC.table( [
				{ label: t( 'متغیر', 'Variable' ), render: function ( x ) { return h( 'button', { type: 'button', class: 'bc-varchip', title: t( 'کپی', 'Copy' ), onClick: function () { BC.copy( '{' + x.k + '}' ); } }, h( 'code', { dir: 'ltr', text: '{' + x.k + '}' } ) ); } },
				{ label: t( 'عنوان', 'Title' ), render: function ( x ) { return h( 'b', { text: x.v[ 0 ] } ); } },
				{ label: t( 'توضیح', 'Description' ), render: function ( x ) { return h( 'span', { text: x.v[ 1 ] } ); } },
				{ label: t( 'مثال خروجی', 'Example' ), render: function ( x ) { return h( 'span', { dir: 'auto', text: x.v[ 2 ] } ); } },
				{ label: t( 'قابل استفاده در', 'Usable in' ), render: function ( x ) { return h( 'small', { text: x.where.join( '، ' ) || '—' } ); } },
			], rows ) ) );
		} );
		box.appendChild( BC.card( { title: t( 'نکات', 'Tips' ), icon: 'info' }, h( 'ul', { class: 'bc-tips' }, [
			t( 'متغیرها به حروف کوچک انگلیسی حساس‌اند: <code>{name}</code> درست است، <code>{Name}</code> یا <code>{ name }</code> جایگزین نمی‌شود.', 'Variables are case-sensitive lowercase: <code>{name}</code> works, <code>{Name}</code> or <code>{ name }</code> does not.' ),
			t( 'در حالت <b>الگو</b>، مقدار هر پارامتر را با همین متغیرها بسازید؛ مثلاً <code dir="ltr">name={name}</code> یا ترکیبی: <code dir="ltr">info={prize} - {expiry}</code>. پارامتر خالی با «-» ارسال می‌شود چون پنل‌ها مقدار خالی را رد می‌کنند.', 'In <b>pattern</b> mode build each parameter from these variables, e.g. <code dir="ltr">name={name}</code> or <code dir="ltr">info={prize} - {expiry}</code>. Empty parameters are sent as "-" because panels reject empty values.' ),
			t( 'در کاوه‌نگار، پارامترها token / token2 / token3 (بدون فاصله) و token10 / token20 (با فاصله) هستند؛ افزونه فاصله‌های token تا token3 را خودکار با نیم‌فاصله جایگزین می‌کند.', 'Kavenegar parameters are token / token2 / token3 (no spaces) and token10 / token20 (spaces allowed); spaces in token..token3 are replaced automatically.' ),
			t( 'در ملی پیامک (ارسال با BodyId) و پنل‌های ترتیبی، ترتیب خطوط پارامتر مهم است: خط اول = {0}، خط دوم = {1} و …؛ نام سمت چپ برای خوانایی است (مثل <code dir="ltr">0={name}</code>).', 'In Melipayamak (BodyId) and positional panels the line order matters: first line = {0}, second = {1}…; the left name is only for readability.' ),
			t( '{code} همیشه با حروف بزرگ لاتین نوشته می‌شود (کدهای آماده با همان حروف واردشده)؛ {link} کد را خودکار روی سبد خرید اعمال می‌کند.', '{code} is always written in Latin capitals (pool codes keep their case); {link} applies the code to the cart automatically.' ),
			t( 'متغیرهای عمومی ({site}، {site_url}، {date}، {time}) در همه پیامک‌ها مقدار دارند.', 'General variables ({site}, {site_url}, {date}, {time}) work in every message.' ),
		].map( function ( x ) { return h( 'li', { html: x } ); } ) ) ) );
		return box;
	}

	function bulkPanel( model ) {
		var box = h( 'div' );
		box.appendChild( BC.card( { title: t( 'پیامک گروهی پیشرفته + هدیه شانس واقعی', 'Advanced bulk SMS + real spin gifts' ), icon: 'send', sub: t( 'گیرندگان را با فیلترها انتخاب کنید (مخاطبان فرم، چرخاننده‌ها، مشتریان ووکامرس یا لیست دلخواه)، به هر نفر شانس واقعی روی شماره‌اش بدهید و پیامک متنی یا الگویی با لینک شخصی گردونه بفرستید.', 'Pick recipients with filters (form leads, spinners, WooCommerce customers or your own list), give each one real spins on their mobile and send a text or pattern SMS with a personal wheel link.' ) }, [
			h( 'ul', { class: 'bc-list' }, [
				t( 'فیلترها: گردونه، بازه فعالیت، برنده/بازنده، موافق دریافت پیشنهاد، موبایل تاییدشده، شانس باقی‌مانده، کد استفاده‌نشده، غیرفعال از N روز، حداقل چرخش، حداقل سفارش و مبلغ خرید، حذف شماره‌ها، سقف تعداد.', 'Filters: wheel, activity period, winners/losers, opt-in, verified, spins left, unused code, inactive N days, min spins, min orders and spend, exclusions, max recipients.' ),
				t( 'متغیرها: {name} {mobile} {wheel} {wheel_link} {n} {spins} {wins} {site} {date} — {wheel_link} لینک شخصی است و شماره را بدون کد تایید شناسایی می‌کند.', 'Variables: {name} {mobile} {wheel} {wheel_link} {n} {spins} {wins} {site} {date} — {wheel_link} is personal and identifies the mobile without a code.' ),
				t( 'زمان‌بندی: مثلاً هر ۱۵ دقیقه ۵۰ نفر؛ گزارش کامل هر نفر و ارسال دوباره خطاها در «ارسال‌های گروهی».', 'Scheduling, e.g. 50 people every 15 minutes; a full per-person report and resending in “Bulk sends”.' ),
			].map( function ( x ) { return h( 'li', { text: x } ); } ) ),
			h( 'div', { class: 'bc-row' }, BC.btn( BC.il( 'send', t( 'شروع ارسال گروهی', 'Start a bulk send' ), 16 ), function () { bulkCenter(); }, 'primary' ), h( 'a', { class: 'bc-btn', href: '#/campaigns' }, BC.icon( 'list', 16 ), t( 'ارسال‌های قبلی و گزارش‌ها', 'Previous sends & reports' ) ) ),
		] ) );
		box.appendChild( BC.card( { title: t( 'لینک شخصی در پیامک', 'Personal link in SMS' ), icon: 'link' }, [ F.render( [
			{ k: 'sms_magic_link', type: 'switch', label: t( 'لینک گردونه در پیامک‌ها شخصی باشد (بدون نیاز به کد تایید)', 'Make wheel links in SMS personal (no code needed)' ), help: t( 'کسی که از لینک پیامک وارد شود، شماره‌اش شناخته می‌شود و شانس‌های هدیه را فوراً می‌بیند. بعد از تغییر «ذخیره» را بزنید.', 'Whoever opens the SMS link is recognised by mobile and sees the gifted spins at once. Press Save after changing.' ) },
			{ k: 'sms_magic_days', type: 'number', min: 1, max: 365, unit: t( 'روز', 'days' ), label: t( 'اعتبار لینک شخصی', 'Personal link valid for' ), cols: 'half', show: function ( x ) { return x.sms_magic_link; } },
		], model, function () {} ) ] ) );
		return box;
	}

	function otpPanel( model ) {
		return BC.card( { title: t( 'کد تایید شماره موبایل', 'Mobile verification code' ), sub: t( 'وقتی در گردونه «تایید موبایل با کد» روشن باشد استفاده می‌شود. متن یا الگوی پیامک کد در «پیامک‌های خودکار ← کد تایید شماره موبایل» است.', 'Used when a wheel requires OTP. Its text or pattern is in Automatic messages → Mobile verification code.' ), icon: 'shield', actions: h( 'a', { class: 'bc-btn bc-btn--sm', href: '#/sms?tab=templates' }, BC.icon( 'edit', 14 ), t( 'متن/الگوی پیامک کد', 'Code SMS text/pattern' ) ) }, [
			F.render( [
				{ k: 'otp_length', type: 'number', label: t( 'تعداد رقم', 'Digits' ), min: 4, max: 8, cols: 'third' },
				{ k: 'otp_ttl', type: 'number', label: t( 'اعتبار کد (ثانیه)', 'Code lifetime (s)' ), min: 60, cols: 'third' },
				{ k: 'otp_resend', type: 'number', label: t( 'فاصله ارسال مجدد (ثانیه)', 'Resend wait (s)' ), min: 20, cols: 'third' },
				{ k: 'otp_max_attempts', type: 'number', label: t( 'حداکثر تلاش اشتباه', 'Max wrong attempts' ), min: 1, cols: 'half' },
				{ k: 'otp_daily_per_phone', type: 'number', label: t( 'حداکثر ارسال روزانه به هر شماره', 'Max sends per number per day' ), min: 1, cols: 'half' },
				{ k: 'otp_site_login', type: 'switch', label: t( 'بعد از تایید کد، در خود سایت هم وارد حساب شود', 'After the code, also sign in to the site' ), help: t( 'با همان شماره وارد حساب کاربری‌اش می‌شود (سبد خرید، حساب من، شانس‌های بعدی بدون پیامک دوباره). حساب‌های مدیر و کارمندان هرگز با کد پیامکی وارد نمی‌شوند.', 'Signs in to the account with that mobile (cart, my account, next spins without another SMS). Admin and staff accounts are never signed in by SMS code.' ) },
				{ k: 'otp_register', type: 'switch', label: t( 'اگر حسابی با این شماره نبود، حساب مشتری بساز', 'Create a customer account when none has this mobile' ), show: function ( m ) { return m.otp_site_login; } },
			], model, function () {} ),
			h( 'div', { class: 'bc-row' }, ( function () {
				var to = h( 'input', { class: 'bc-input', dir: 'ltr', placeholder: '09xxxxxxxxx', style: { 'max-width': '200px' } } );
				return [ to, BC.btn( t( 'ارسال کد آزمایشی 12345', 'Send test code 12345' ), function ( e ) {
					BC.busy( e.currentTarget, BC.api( 'test/otp', { body: { to: to.value } } ) ).then( function ( r ) { BC.toast( r.ok ? ( r.mode === 'test' ? t( 'حالت تست: فقط در گزارش ثبت شد', 'Test mode: only logged' ) : t( 'ارسال شد', 'Sent' ) ) : t( 'ناموفق؛ «گزارش پیامک‌ها» را ببینید', 'Failed; see the SMS log' ), r.ok ? 'success' : 'error' ); } ).catch( BC.fail );
				} ) ];
			} )() ),
		] );
	}

	/* ---------- SMS delivery log ---------- */
	function smsLog() {
		var box = h( 'div' );
		var st = { status: '', context: '', search: '', page: 1 };
		var labels = { sent: [ t( 'ارسال شد', 'Sent' ), 'good' ], failed: [ t( 'ناموفق', 'Failed' ), 'bad' ], test: [ t( 'تست', 'Test' ), 'warn' ], disabled: [ t( 'خاموش', 'Off' ), 'default' ] };
		var ctx = {};
		( ( BC.boot.sms_events || {} ).events || [] ).forEach( function ( e ) { ctx[ e.key ] = e.label; } );
		ctx.bulk = t( 'پیامک گروهی', 'Bulk SMS' );
		ctx.test = t( 'تست', 'Test' );
		ctx.resend = t( 'ارسال مجدد', 'Resend' );
		function render() {
			BC.clear( box );
			box.appendChild( BC.spinner() );
			BC.api( 'sms/log', { query: { status: st.status, context: st.context, search: st.search, page: st.page, per_page: 30 } } ).then( function ( r ) {
				BC.clear( box );
				var stSel = h( 'select', { class: 'bc-input bc-select' }, h( 'option', { value: '', text: t( 'همه وضعیت‌ها', 'All statuses' ) } ), Object.keys( labels ).map( function ( k ) { return h( 'option', { value: k, text: labels[ k ][ 0 ] + ( r.stats && r.stats[ k ] ? ' (' + BC.num( r.stats[ k ], 0 ) + ')' : '' ) } ); } ) );
				stSel.value = st.status;
				stSel.addEventListener( 'change', function () { st.status = stSel.value; st.page = 1; render(); } );
				var cSel = h( 'select', { class: 'bc-input bc-select' }, h( 'option', { value: '', text: t( 'همه نوع‌ها', 'All types' ) } ), Object.keys( ctx ).map( function ( k ) { return h( 'option', { value: k, text: ctx[ k ] } ); } ) );
				cSel.value = st.context;
				cSel.addEventListener( 'change', function () { st.context = cSel.value; st.page = 1; render(); } );
				var search = h( 'input', { class: 'bc-input', type: 'search', placeholder: t( 'شماره یا متن', 'Number or text' ), value: st.search } );
				search.addEventListener( 'change', function () { st.search = search.value; st.page = 1; render(); } );
				box.appendChild( h( 'div', { class: 'bc-filters' }, stSel, cSel, search, BC.btn( t( 'پاک کردن گزارش پیامک', 'Clear SMS log' ), function () { BC.confirm( t( 'همه گزارش پیامک‌ها پاک شود؟', 'Clear the whole SMS log?' ), function () { BC.api( 'sms/log', { method: 'DELETE' } ).then( render ); }, true ); }, 'sm ghost' ) ) );
				box.appendChild( BC.card( { title: t( 'گزارش پیامک‌ها', 'SMS log' ), sub: BC.num( r.total, 0 ) + ' ' + t( 'پیامک', 'messages' ), icon: 'inbox', cls: 'bc-card--flush' }, BC.table( [
					{ label: t( 'تاریخ', 'Date' ), render: function ( x ) { return BC.date( x.created_at, true ); } },
					{ label: t( 'موبایل', 'Mobile' ), render: function ( x ) { return h( 'span', { dir: 'ltr', text: x.mobile } ); } },
					{ label: t( 'نوع', 'Type' ), render: function ( x ) { return h( 'small', { text: x.context_label || x.context } ); } },
					{ label: t( 'متن', 'Text' ), render: function ( x ) { return h( 'div', { class: 'bc-smslog__msg', dir: 'auto', text: x.message } ); } },
					{ label: t( 'وضعیت', 'Status' ), render: function ( x ) { var l = labels[ x.status ] || [ x.status, 'default' ]; return BC.badge( l[ 0 ], l[ 1 ] ); } },
					{ label: t( 'پنل / پاسخ سامانه', 'Panel / response' ), render: function ( x ) { return h( 'div', null, h( 'small', { text: ( BC.boot.sms[ x.provider ] || {} ).name || x.provider } ), h( 'code', { class: 'bc-smslog__resp', dir: 'ltr', text: ( x.response || '' ).slice( 0, 220 ) } ) ); } },
				], r.items, BC.empty( t( 'پیامکی ارسال نشده است.', 'No messages yet.' ), '', null, 'message' ) ) ) );
				BC.append( box, BC.pager( r.total, st.page, 30, function ( p ) { st.page = p; render(); } ) );
			} ).catch( BC.fail );
		}
		render();
		return box;
	}

	function emailPanel( model ) {
		var to = h( 'input', { class: 'bc-input', dir: 'ltr', type: 'email', placeholder: 'you@example.com' } );
		return BC.card( { title: t( 'ایمیل‌ها', 'Emails' ), icon: 'mail' }, [
			F.render( [
				{ k: 'email_from_name', label: t( 'نام فرستنده', 'From name' ), cols: 'half' },
				{ k: 'email_from_address', label: t( 'ایمیل فرستنده', 'From address' ), dir: 'ltr', cols: 'half' },
				{ k: 'email_template', type: 'segment', label: t( 'قالب ایمیل', 'Template' ), opts: [ { value: 'branded', label: t( 'قالب بچرخون', 'Becharkhoon' ) }, { value: 'woocommerce', label: t( 'قالب ایمیل ووکامرس', 'WooCommerce emails' ) } ] },
				{ k: 'email_logo', type: 'image', label: t( 'لوگو', 'Logo' ), cols: 'half' },
				{ k: 'email_color', type: 'color', label: t( 'رنگ', 'Color' ), cols: 'half' },
				{ k: 'email_footer', type: 'textarea', label: t( 'پانویس', 'Footer' ), rows: 2 },
				{ k: 'admin_emails', type: 'textarea', label: t( 'ایمیل مدیران (هر خط یکی؛ خالی = ایمیل مدیر سایت)', 'Admin emails (one per line; empty = site admin)' ), rows: 2, dir: 'ltr' },
			], model, function () {} ),
			h( 'div', { class: 'bc-row' }, to, BC.btn( t( 'ارسال ایمیل تست', 'Send test email' ), function ( e ) {
				BC.busy( e.currentTarget, BC.api( 'test/email', { body: { to: to.value } } ) ).then( function ( r ) { BC.toast( r.ok ? t( 'ارسال شد', 'Sent' ) : t( 'ناموفق', 'Failed' ), r.ok ? 'success' : 'error' ); } ).catch( BC.fail );
			} ) ),
		] );
	}
	function messengerPanel( model ) {
		return BC.card( { title: t( 'اطلاع فوری به مدیر در پیام‌رسان', 'Instant admin alerts in messengers' ), sub: t( 'برندگان و درخواست‌های تحویل جایزه فوراً در بله یا تلگرام شما.', 'Winners and claims instantly in Bale or Telegram.' ), icon: 'send' }, [
			F.render( [
				{ type: 'heading', label: t( 'بله (پیشنهادی برای ایران)', 'Bale (recommended in Iran)' ) },
				{ k: 'bale_token', type: 'secret', label: t( 'توکن ربات بله', 'Bale bot token' ), cols: 'half', help: t( 'در بله به @botfather پیام دهید، ربات بسازید و توکن را کپی کنید.', 'Message @botfather in Bale to create a bot and copy its token.' ) },
				{ k: 'bale_chat_id', label: t( 'شناسه گفتگو (chat_id)', 'Chat id' ), dir: 'ltr', cols: 'half', help: t( 'ربات را به گروه/کانال اضافه یا به آن پیام دهید؛ شناسه را از getUpdates بگیرید.', 'Add the bot to a group/channel or message it; get the id from getUpdates.' ) },
				{ type: 'heading', label: t( 'تلگرام', 'Telegram' ) },
				{ k: 'telegram_token', type: 'secret', label: t( 'توکن ربات', 'Bot token' ), cols: 'half' },
				{ k: 'telegram_chat_id', label: 'chat_id', dir: 'ltr', cols: 'half' },
				{ k: 'telegram_api', label: t( 'آدرس API (برای سرورهای ایران: پراکسی/ورکر کلودفلر)', 'API base (use a proxy / Cloudflare worker on Iranian hosts)' ), dir: 'ltr' },
			], model, function () {} ),
			BC.btn( t( 'ارسال پیام تست', 'Send test message' ), function ( e ) {
				BC.busy( e.currentTarget, BC.api( 'test/messenger', { body: {} } ) ).then( function ( r ) { BC.toast( r.ok ? t( 'ارسال شد', 'Sent' ) : t( 'ناموفق؛ گزارش را ببینید', 'Failed; see the log' ), r.ok ? 'success' : 'error' ); } ).catch( BC.fail );
			} ),
		] );
	}
	function webhookPanel( model ) {
		var box = h( 'div' );
		model.webhooks = model.webhooks || [];
		function draw() {
			BC.clear( box );
			model.webhooks.forEach( function ( hk, i ) {
				box.appendChild( BC.card( { title: hk.url || t( 'وب‌هوک جدید', 'New webhook' ), icon: 'webhook', actions: BC.btn( BC.icon( 'trash', 15 ), function () { model.webhooks.splice( i, 1 ); draw(); }, 'sm ghost' ) }, F.render( [
					{ k: 'active', type: 'switch', label: t( 'فعال', 'Active' ), cols: 'third' },
					{ k: 'url', label: 'URL', dir: 'ltr', cols: 'third' },
					{ k: 'secret', label: t( 'کلید امضا (HMAC)', 'Signing secret (HMAC)' ), dir: 'ltr', cols: 'third' },
					{ k: 'events', type: 'chips', label: t( 'رویدادها (خالی = همه)', 'Events (empty = all)' ), opts: [ [ 'spin', t( 'هر چرخش', 'Every spin' ) ], [ 'win', t( 'برد', 'Win' ) ], [ 'lose', t( 'پوچ', 'Lose' ) ], [ 'lead', t( 'مخاطب', 'Lead' ) ], [ 'credit', t( 'شانس جدید', 'Spins earned' ) ], [ 'redeem', t( 'استفاده از جایزه', 'Redeemed' ) ] ].map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ) },
				], hk, function () {} ) ) );
			} );
			box.appendChild( h( 'div', { class: 'bc-row' },
				BC.btn( BC.il( 'plus', t( 'افزودن وب‌هوک', 'Add webhook' ), 15 ), function () { model.webhooks.push( { url: '', events: [], secret: '', active: true } ); draw(); } ),
				BC.btn( t( 'ارسال رویداد تست (بعد از ذخیره)', 'Send a test event (after saving)' ), function ( e ) { BC.busy( e.currentTarget, BC.api( 'test/webhook', { body: {} } ) ).then( function () { BC.toast( t( 'ارسال شد؛ گزارش را ببینید', 'Sent; check the log' ), 'success' ); } ).catch( BC.fail ); }, 'ghost' )
			) );
			box.appendChild( h( 'p', { class: 'bc-field__help', html: t( 'بدنه JSON: <code>{event, site, time, data}</code> و هدر <code>X-Becharkhoon-Signature: sha256=…</code>. مناسب n8n، Zapier، Make و CRM.', 'JSON body: <code>{event, site, time, data}</code> with header <code>X-Becharkhoon-Signature: sha256=…</code>. Works with n8n, Zapier, Make and CRMs.' ) } ) );
		}
		draw();
		return box;
	}
	function logPanel() {
		var box = h( 'div' );
		var st = { channel: '', page: 1 };
		function render() {
			BC.clear( box );
			box.appendChild( BC.spinner() );
			BC.api( 'logs', { query: { channel: st.channel, page: st.page, per_page: 30 } } ).then( function ( r ) {
				BC.clear( box );
				box.appendChild( h( 'div', { class: 'bc-filters' }, BC.segment( [ [ '', t( 'همه', 'All' ) ], [ 'sms', t( 'پیامک', 'SMS' ) ], [ 'email', t( 'ایمیل', 'Email' ) ], [ 'messenger', t( 'پیام‌رسان', 'Messenger' ) ], [ 'webhook', t( 'وب‌هوک', 'Webhook' ) ], [ 'system', t( 'سیستم', 'System' ) ] ].map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ), st.channel, function ( v ) { st.channel = v; st.page = 1; render(); } ), BC.btn( t( 'پاک کردن گزارش', 'Clear log' ), function () { BC.confirm( t( 'همه گزارش‌ها پاک شود؟', 'Clear all logs?' ), function () { BC.api( 'logs', { method: 'DELETE' } ).then( render ); }, true ); }, 'sm ghost' ) ) );
				box.appendChild( BC.table( [
					{ label: t( 'زمان', 'Time' ), render: function ( x ) { return BC.date( x.created_at, true ); } },
					{ label: t( 'کانال', 'Channel' ), render: function ( x ) { return BC.badge( x.channel, 'default' ); } },
					{ label: t( 'وضعیت', 'Status' ), render: function ( x ) { return BC.badge( x.level, x.level === 'ok' ? 'good' : ( x.level === 'error' ? 'bad' : 'default' ) ); } },
					{ label: t( 'پیام', 'Message' ), render: function ( x ) { return h( 'div', null, h( 'span', { dir: 'auto', text: x.message } ), x.context ? h( 'details', null, h( 'summary', { text: t( 'جزئیات / پاسخ سامانه', 'Details / raw response' ) } ), h( 'pre', { class: 'bc-pre', text: JSON.stringify( x.context, null, 2 ) } ) ) : null ); } },
				], r.items ) );
				BC.append( box, BC.pager( r.total, st.page, 30, function ( p ) { st.page = p; render(); } ) );
			} ).catch( BC.fail );
		}
		render();
		return box;
	}

	/* ================================================================== Settings */
	P.settings = function ( view ) {
		load( view, BC.api( 'settings' ), function ( s ) {
			var model = clone( s );
			var save = BC.btn( BC.il( 'save', t( 'ذخیره تنظیمات', 'Save settings' ), 16 ), function () {
				BC.busy( save, BC.api( 'settings', { method: 'PUT', body: model } ) ).then( function ( r ) {
					var langChanged = r.ui_language !== s.ui_language;
					s = r;
					model = clone( r );
					BC.boot.settings = r;
					BC.toast( t( 'ذخیره شد ✓', 'Saved ✓' ), 'success' );
					if ( langChanged ) {
						setTimeout( function () { location.reload(); }, 600 );
					}
				} ).catch( BC.fail );
			}, 'primary' );
			view.appendChild( head( 'settings', t( 'تنظیمات', 'Settings' ), t( 'تنظیمات کلی افزونه، امنیت و ضدتقلب، حساب کاربری و یکپارچه‌سازی‌ها.', 'General, security & anti-fraud, My Account and integrations.' ), save ) );
			var integ = BC.boot.integrations || {};
			view.appendChild( BC.tabs( [
				{ label: t( 'عمومی', 'General' ), icon: 'settings', render: function () {
					return [ BC.card( { title: t( 'عمومی', 'General' ), icon: 'settings' }, F.render( [
						{ k: 'enabled', type: 'switch', label: t( 'افزونه در سایت فعال باشد', 'Enabled on the site' ), help: t( 'خاموش = هیچ گردونه‌ای نمایش داده نمی‌شود.', 'Off = no wheel is shown.' ) },
						{ k: 'test_mode', type: 'switch', label: t( 'حالت تست (فقط مدیران گردونه را می‌بینند)', 'Test mode (only admins see wheels)' ) },
						{ k: 'ui_language', type: 'segment', label: t( 'زبان پنل مدیریت', 'Admin language' ), opts: [ { value: 'auto', label: t( 'خودکار', 'Auto' ) }, { value: 'fa', label: 'فارسی' }, { value: 'en', label: 'English' } ] },
						{ k: 'admin_theme', type: 'segment', label: t( 'پوسته پنل', 'Admin theme' ), opts: [ { value: 'light', label: t( 'روشن', 'Light' ) }, { value: 'dark', label: t( 'تیره', 'Dark' ) }, { value: 'auto', label: t( 'خودکار', 'Auto' ) } ] },
						{ k: 'brand_name', label: t( 'نام نمایشی افزونه در منو (وایت‌لیبل)', 'Menu name (white label)' ), cols: 'half' },
						{ k: 'admin_webfont', type: 'switch', label: t( 'فونت وزیرمتن در پنل', 'Vazirmatn font in admin' ), cols: 'half' },
						{ k: 'front_font', type: 'segment', label: t( 'فونت گردونه در سایت', 'Front-end font' ), opts: [ { value: 'vazirmatn', label: t( 'وزیرمتن', 'Vazirmatn' ) }, { value: 'inherit', label: t( 'فونت قالب', 'Theme font' ) }, { value: 'custom', label: t( 'دلخواه (CSS)', 'Custom (CSS URL)' ) } ] },
						{ k: 'front_font_url', label: t( 'آدرس CSS فونت', 'Font CSS URL' ), dir: 'ltr', show: function () { return model.front_font === 'custom'; } },
						{ k: 'load_front_webfont', type: 'switch', label: t( 'بارگذاری وزیرمتن از Google Fonts', 'Load Vazirmatn from Google Fonts' ), show: function () { return model.front_font === 'vazirmatn'; }, help: t( 'اگر قالب شما خودش وزیرمتن دارد، خاموش کنید.', 'Turn off if your theme already loads Vazirmatn.' ) },
						{ k: 'persian_digits', type: 'switch', label: t( 'اعداد فارسی', 'Persian digits' ), cols: 'half' },
						{ k: 'jalali_dates', type: 'switch', label: t( 'تاریخ شمسی در پیام‌ها', 'Jalali dates in messages' ), cols: 'half' },
						{ k: 'currency_label', label: t( 'واحد پول در متن‌ها (خالی = ووکامرس)', 'Currency label (empty = WooCommerce)' ), cols: 'half' },
						{ k: 'z_index', type: 'number', label: 'z-index', cols: 'half' },
						{ k: 'powered_by', type: 'switch', label: t( 'نمایش «ARIAGH.BECHARKHOON» زیر پاپ‌آپ', 'Show "ARIAGH.BECHARKHOON" under the popup' ) },
					], model, function () {} ) ) ];
				} },
				{ label: t( 'امنیت و ضدتقلب', 'Security' ), icon: 'shield', render: function () {
					return [ BC.card( { title: t( 'ضدتقلب', 'Anti-fraud' ), icon: 'shield' }, F.render( [
						{ k: 'rate_limit_per_minute', type: 'number', label: t( 'حداکثر درخواست چرخش هر IP در دقیقه', 'Max spin requests per IP per minute' ), min: 1, cols: 'half' },
						{ k: 'ip_daily_limit', type: 'number', label: t( 'حداکثر چرخش روزانه هر IP در همه گردونه‌ها (۰ = خاموش)', 'Max daily spins per IP, all wheels (0 = off)' ), min: 0, cols: 'half' },
						{ k: 'honeypot', type: 'switch', label: t( 'تله ربات (honeypot)', 'Bot honeypot' ), cols: 'half' },
						{ k: 'min_fill_seconds', type: 'number', label: t( 'حداقل زمان پر کردن فرم (ثانیه)', 'Minimum form fill time (s)' ), min: 0, cols: 'half' },
						{ k: 'captcha', type: 'select', label: t( 'کپچا', 'Captcha' ), cols: 'third', opts: [ [ 'off', t( 'خاموش', 'Off' ) ], [ 'arcaptcha', t( 'آرکپچا (ایرانی)', 'ArCaptcha (Iranian)' ) ], [ 'recaptcha_v2', 'reCAPTCHA v2' ], [ 'recaptcha_v3', 'reCAPTCHA v3' ], [ 'turnstile', 'Cloudflare Turnstile' ], [ 'hcaptcha', 'hCaptcha' ] ].map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ) },
						{ k: 'captcha_site_key', label: 'Site key', dir: 'ltr', cols: 'third', show: function () { return model.captcha !== 'off'; } },
						{ k: 'captcha_secret', type: 'secret', label: 'Secret key', cols: 'third', show: function () { return model.captcha !== 'off'; } },
						{ k: 'recaptcha_threshold', type: 'range', label: t( 'حداقل امتیاز reCAPTCHA v3', 'reCAPTCHA v3 minimum score' ), min: 0.1, max: 0.9, step: 0.1, show: function () { return model.captcha === 'recaptcha_v3'; } },
						{ k: 'ip_source', type: 'segment', label: t( 'تشخیص IP واقعی', 'Real IP source' ), opts: [ { value: 'auto', label: t( 'خودکار', 'Auto' ) }, { value: 'cloudflare', label: 'Cloudflare' }, { value: 'arvan', label: t( 'ابرآروان', 'ArvanCloud' ) }, { value: 'xff', label: 'X-Forwarded-For' }, { value: 'remote', label: 'REMOTE_ADDR' } ] },
						{ k: 'block_disposable', type: 'switch', label: t( 'رد ایمیل‌های موقت', 'Block disposable emails' ), cols: 'half' },
						{ k: 'check_mx', type: 'switch', label: t( 'بررسی وجود دامنه ایمیل (MX)', 'Check email domain (MX)' ), cols: 'half' },
						{ k: 'email_domain_mode', type: 'segment', label: t( 'فیلتر دامنه ایمیل', 'Email domain filter' ), opts: [ { value: 'off', label: t( 'خاموش', 'Off' ) }, { value: 'blacklist', label: t( 'لیست سیاه', 'Blacklist' ) }, { value: 'whitelist', label: t( 'فقط این دامنه‌ها', 'Whitelist' ) } ] },
						{ k: 'email_domains', type: 'textarea', label: t( 'دامنه‌ها (هر خط یکی)', 'Domains (one per line)' ), rows: 2, dir: 'ltr', show: function () { return model.email_domain_mode !== 'off'; } },
						{ k: 'block_ips', type: 'textarea', label: t( 'IPهای مسدود (هر خط؛ * مجاز)', 'Blocked IPs (one per line; * allowed)' ), rows: 2, dir: 'ltr', cols: 'third' },
						{ k: 'block_phones', type: 'textarea', label: t( 'موبایل‌های مسدود', 'Blocked mobiles' ), rows: 2, dir: 'ltr', cols: 'third' },
						{ k: 'block_emails', type: 'textarea', label: t( 'ایمیل‌های مسدود', 'Blocked emails' ), rows: 2, dir: 'ltr', cols: 'third' },
						{ k: 'phone_country', type: 'segment', label: t( 'قالب شماره موبایل', 'Mobile format' ), opts: [ { value: 'IR', label: t( 'ایران (09…)', 'Iran (09…)' ) }, { value: 'INTL', label: t( 'بین‌المللی', 'International' ) } ] },
					], model, function () {} ) ) ];
				} },
				{ label: t( 'ووکامرس و حساب کاربری', 'WooCommerce' ), icon: 'bag', render: function () {
					return [ BC.card( { title: t( 'سفارش‌ها و کوپن‌ها', 'Orders & coupons' ), icon: 'bag' }, F.render( [
						{ k: 'order_statuses', type: 'chips', label: t( 'وضعیت‌هایی که «سفارش پرداخت‌شده» حساب می‌شوند', 'Statuses that count as paid' ), opts: function () { return BC.boot.statuses || []; }, help: t( 'برای قوانین شانس، سابقه خرید و ثبت استفاده از جوایز.', 'Used for spin rules, purchase history and redemption tracking.' ) },
						{ k: 'revoke_on_refund', type: 'switch', label: t( 'ابطال شانس‌های استفاده‌نشده با لغو/استرداد سفارش', 'Revoke unused spins on refund/cancel' ) },
						{ k: 'coupon_cleanup_days', type: 'number', label: t( 'حذف خودکار کوپن‌های منقضی و استفاده‌نشده بعد از (روز، ۰ = خاموش)', 'Delete expired unused coupons after (days, 0 = off)' ), min: 0 },
						{ k: 'auto_apply_param', label: t( 'پارامتر لینک اعمال کد', 'Apply-link parameter' ), dir: 'ltr', cols: 'half' },
						{ k: 'open_param', label: t( 'پارامتر لینک باز کردن گردونه', 'Open-link parameter' ), dir: 'ltr', cols: 'half' },
						{ k: 'cart_notice', type: 'switch', label: t( 'اعلان «شانس دارید» در سبد خرید', '"You have spins" notice in cart' ), cols: 'half' },
						{ k: 'thankyou_notice', type: 'switch', label: t( 'کادر «شانس گرفتید» در صفحه تشکر', '"You earned spins" box on thank-you' ), cols: 'half' },
					], model, function () {} ) ), BC.card( { title: t( 'حساب کاربری من', 'My Account' ), icon: 'user' }, F.render( [
						{ k: 'myaccount_tab', type: 'switch', label: t( 'تب «گردونه شانس من» (شانس‌ها، جوایز، کدها)', '"My lucky wheel" tab (spins, prizes, codes)' ) },
						{ k: 'myaccount_title', label: t( 'عنوان تب', 'Tab title' ), cols: 'third' },
						{ k: 'myaccount_slug', label: t( 'نامک (slug)', 'Slug' ), dir: 'ltr', cols: 'third' },
						{ k: 'myaccount_position', type: 'number', label: t( 'جایگاه در منو', 'Menu position' ), min: 0, cols: 'third' },
					], model, function () {} ) ), BC.card( { title: t( 'سیستم دعوت از دوستان', 'Referrals' ), icon: 'users' }, F.render( [
						{ k: 'referral_enabled', type: 'switch', label: t( 'فعال (لینک دعوت اختصاصی هر مشتری)', 'Enabled (personal invite link per customer)' ), help: t( 'با قوانین «ثبت‌نام/خرید دوست دعوت‌شده» شانس بدهید.', 'Reward with the "referred signup/order" rules.' ) },
						{ k: 'referral_param', label: t( 'پارامتر لینک', 'Link parameter' ), dir: 'ltr', cols: 'half' },
						{ k: 'referral_cookie_days', type: 'number', label: t( 'ماندگاری (روز)', 'Cookie days' ), min: 1, cols: 'half' },
					], model, function () {} ) ), BC.card( { title: t( 'کیف پول و امتیاز', 'Wallet & points' ), icon: 'database' }, F.render( [
						{ type: 'note', label: t( 'شناسایی‌شده — کیف پول: %1 / امتیاز: %2', 'Detected — wallet: %1 / points: %2', integ.wallet || '—', integ.points || '—' ) },
						{ k: 'wallet_provider', type: 'select', label: t( 'افزونه کیف پول', 'Wallet plugin' ), cols: 'half', opts: [ [ 'auto', t( 'خودکار', 'Auto' ) ], [ 'terawallet', 'TeraWallet' ], [ 'yith_funds', 'YITH Account Funds' ], [ 'custom', t( 'سفارشی (فیلتر)', 'Custom (filter)' ) ] ].map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ) },
						{ k: 'points_provider', type: 'select', label: t( 'افزونه امتیاز', 'Points plugin' ), cols: 'half', opts: [ [ 'auto', t( 'خودکار', 'Auto' ) ], [ 'wc_points', 'WooCommerce Points & Rewards' ], [ 'mycred', 'myCRED' ], [ 'gamipress', 'GamiPress' ], [ 'yith_points', 'YITH Points' ], [ 'custom', t( 'سفارشی (فیلتر)', 'Custom (filter)' ) ] ].map( function ( x ) { return { value: x[ 0 ], label: x[ 1 ] }; } ) },
					], model, function () {} ) ) ];
				} },
				{ label: t( 'عملکرد و داده', 'Performance & data' ), icon: 'server', render: function () {
					return [ BC.card( { title: t( 'کش و عملکرد', 'Cache & performance' ), icon: 'zap' }, F.render( [
						{ type: 'note', label: t( 'گردونه با کش صفحه (LiteSpeed، WP Rocket، ابرآروان، کلودفلر) سازگار است: صفحه کش می‌شود و وضعیت هر کاربر با یک درخواست کش‌نشدنی جدا گرفته می‌شود.', 'Works with page caches (LiteSpeed, WP Rocket, Arvan, Cloudflare): pages stay cached; per-visitor state comes from an uncached request.' ) },
						{ k: 'fast_boot', type: 'switch', label: t( 'نمایش سریع گردونه (منتظر لود کامل صفحه نماند)', 'Fast start (don\'t wait for the full page load)' ), help: t( 'گردونه همان لحظه‌ای که سایت باز می‌شود آماده می‌شود و صفحه پشتش لود می‌شود؛ منتظر عکس‌ها، فونت‌ها و بقیه صفحه نمی‌ماند. برای نمایش فوری، «تاخیر نمایش» گردونه را در تب «نمایش و تریگر» روی ۰ بگذارید. اگر از افزونه کش/بهینه‌سازی (مثل WP Rocket یا LiteSpeed) استفاده می‌کنید، wheel.js را از «تاخیر در اجرای JS» مستثنا کنید.', 'The wheel is ready the moment the site opens while the page loads behind it — no waiting for images, fonts or the rest of the page. For an instant popup set the wheel delay to 0 (Display tab). If you use a cache/optimizer (WP Rocket, LiteSpeed), exclude wheel.js from "delay JS".' ) },
						{ k: 'ajax_mode', type: 'segment', label: t( 'مسیر درخواست‌ها', 'Request route' ), opts: [ { value: 'admin-ajax', label: 'admin-ajax ' + t( '(پیشنهادی)', '(recommended)' ) }, { value: 'rest', label: 'REST API' } ], help: t( 'اگر admin-ajax در هاست شما مسدود است REST را انتخاب کنید (در این حالت تشخیص کاربر لاگین‌شده ممکن نیست).', 'Use REST only if admin-ajax is blocked (logged-in detection is not possible then).' ) },
						{ k: 'tracking_enabled', type: 'switch', label: t( 'ثبت آمار نمایش و باز شدن', 'Track impressions & opens' ), cols: 'half' },
						{ k: 'track_sample', type: 'range', label: t( 'نمونه‌برداری نمایش‌ها (سایت‌های پربازدید)', 'Impression sampling (high traffic)' ), min: 1, max: 100, unit: '%', cols: 'half' },
						{ k: 'respect_dnt', type: 'switch', label: t( 'احترام به Do-Not-Track', 'Respect Do-Not-Track' ) },
					], model, function () {} ) ), BC.card( { title: t( 'نگهداری داده', 'Data retention' ), icon: 'database' }, F.render( [
						{ k: 'data_retention_days', type: 'number', label: t( 'حذف چرخش‌ها و مخاطبان قدیمی‌تر از (روز، ۰ = هرگز)', 'Delete spins & leads older than (days, 0 = never)' ), min: 0, cols: 'half' },
						{ k: 'log_retention_days', type: 'number', label: t( 'نگهداری گزارش ارسال (روز)', 'Keep delivery log (days)' ), min: 0, cols: 'half' },
						{ k: 'delete_on_uninstall', type: 'switch', label: t( 'حذف همه داده‌ها هنگام پاک کردن افزونه', 'Delete all data on uninstall' ) },
					], model, function () {} ) ) ];
				} },
			] ) );
		} );
	};

	/* ================================================================== Tools */
	P.tools = function ( view ) {
		load( view, BC.api( 'tools/status' ), function ( s ) {
			view.appendChild( head( 'wrench', t( 'ابزارها', 'Tools' ), t( 'وضعیت سیستم، پشتیبان‌گیری، ریست آمار و حریم خصوصی.', 'System status, backups, stats reset and privacy.' ) ) );
			var row = function ( label, value, ok ) {
				return h( 'tr', null, h( 'td', { text: label } ), h( 'td', null, ok === undefined ? null : BC.yes( ok ), h( 'span', { dir: 'auto', text: ' ' + value } ) ) );
			};
			var tables = Object.keys( s.tables );
			view.appendChild( h( 'div', { class: 'bc-grid-2 bc-grid-2--top' },
				BC.card( { title: t( 'وضعیت سیستم', 'System status' ), icon: 'server' }, h( 'div', { class: 'bc-table-wrap' }, h( 'table', { class: 'bc-table' }, h( 'tbody', null,
					row( 'PHP', s.php, s.php >= '7.4' ), row( 'WordPress', s.wp ), row( 'WooCommerce', s.woo || t( 'نصب نیست', 'Not installed' ), !! s.woo ), row( 'ARIAGH.BECHARKHOON', s.plugin + ' (DB ' + s.db + ')' ),
					row( t( 'جداول', 'Tables' ), tables.filter( function ( k ) { return s.tables[ k ]; } ).length + '/' + tables.length, tables.every( function ( k ) { return s.tables[ k ]; } ) ),
					row( t( 'کران روزانه', 'Daily cron' ), s.cron ? BC.date( new Date( s.cron * 1000 ).toISOString(), true ) : t( 'زمان‌بندی نشده', 'Not scheduled' ), !! s.cron ),
					s.cron_disabled ? row( 'DISABLE_WP_CRON', t( 'فعال — مطمئن شوید کران واقعی سرور اجرا می‌شود', 'On — make sure a real server cron runs' ), false ) : null,
					row( t( 'افزونه‌های کش', 'Cache plugins' ), s.caches.join( '، ' ) || '—' ),
					row( 'CDN', [ s.cdn.cloudflare ? 'Cloudflare' : '', s.cdn.arvan ? t( 'ابرآروان', 'ArvanCloud' ) : '' ].filter( Boolean ).join( '، ' ) || '—' ),
					row( t( 'IP شما', 'Your IP' ), s.ip ), row( t( 'منطقه زمانی', 'Timezone' ), s.timezone + ' — ' + s.time, !! s.timezone ),
					row( t( 'رکوردها', 'Records' ), t( '%1 چرخش، %2 مخاطب، %3 شانس', '%1 spins, %2 leads, %3 credits', BC.num( s.counts.spins, 0 ), BC.num( s.counts.leads, 0 ), BC.num( s.counts.credits, 0 ) ) )
				) ) ) ),
				BC.card( { title: t( 'نگهداری', 'Maintenance' ), icon: 'wrench' }, h( 'div', { class: 'bc-stack' },
					tool( 'refresh', t( 'ساخت/تعمیر جداول', 'Create / repair tables' ), 'repair' ),
					tool( 'play', t( 'اجرای کران روزانه اکنون (یادآوری‌ها و پاکسازی)', 'Run the daily cron now (reminders & cleanup)' ), 'run_cron' ),
					tool( 'zap', t( 'پاک کردن کش گردونه‌ها و افزونه کش', 'Purge wheel + page caches' ), 'flush_cache' ),
					tool( 'trash', t( 'صفر کردن آمار همه گردونه‌ها', 'Reset statistics of all wheels' ), 'reset_stats', true )
				) )
			) );
			view.appendChild( h( 'div', { class: 'bc-grid-2 bc-grid-2--top' },
				BC.card( { title: t( 'پشتیبان و انتقال', 'Backup & migration' ), icon: 'download' }, h( 'div', { class: 'bc-stack' },
					BC.btn( BC.il( 'download', t( 'خروجی همه گردونه‌ها، قوانین و تنظیمات (بدون رمزها)', 'Export all wheels, rules and settings (no secrets)' ), 15 ), function ( e ) {
						BC.busy( e.currentTarget, BC.api( 'tools/export_all', { body: {} } ) ).then( function ( r ) { BC.download( 'becharkhoon-backup-' + iso( new Date() ) + '.json', JSON.stringify( r, null, 2 ) ); } ).catch( BC.fail );
					} ),
					BC.btn( BC.il( 'upload', t( 'درون‌ریزی فایل پشتیبان', 'Import a backup file' ), 15 ), function () {
						BC.pickFile().then( function ( txt ) {
							BC.confirm( t( 'تنظیمات جایگزین و گردونه‌ها به‌صورت پیش‌نویس اضافه شوند؟ قوانین هم اضافه شوند؟', 'Replace settings and add wheels as drafts? Rules are appended too.' ), function () {
								BC.api( 'tools/import_all', { body: { data: txt, with_rules: true } } ).then( function ( r ) { BC.toast( t( '%1 گردونه درون‌ریزی شد', '%1 wheels imported', BC.num( r.wheels, 0 ) ), 'success' ); BC.refreshBoot(); } ).catch( BC.fail );
							} );
						} );
					} )
				) ),
				BC.card( { title: t( 'حریم خصوصی (حذف اطلاعات یک نفر)', 'Privacy (erase one person)' ), icon: 'lock' }, ( function () {
					var model = { phone: '', email: '' };
					return [ F.render( [ { k: 'phone', label: t( 'موبایل', 'Mobile' ), dir: 'ltr', cols: 'half' }, { k: 'email', label: t( 'ایمیل', 'Email' ), dir: 'ltr', cols: 'half' } ], model, function () {} ), BC.btn( t( 'حذف اطلاعات شخصی', 'Erase personal data' ), function ( e ) {
						var b = e.currentTarget;
						BC.confirm( t( 'اطلاعات شخصی این فرد از چرخش‌ها و مخاطبان حذف شود؟', 'Erase this person\'s data from spins and leads?' ), function () {
							BC.busy( b, BC.api( 'tools/erase_person', { body: model } ) ).then( function ( r ) { BC.toast( t( '%1 ردیف پاک شد', '%1 rows erased', BC.num( r.rows, 0 ) ), 'success' ); } ).catch( BC.fail );
						}, true );
					}, 'danger' ), h( 'p', { class: 'bc-field__help', text: t( 'ابزار «خروجی/حذف اطلاعات شخصی» خود وردپرس هم داده‌های گردونه را پوشش می‌دهد.', 'WordPress\' own Export/Erase Personal Data tools cover wheel data too.' ) } ) ];
				} )() )
			) );
			function tool( icon, label, what, danger ) {
				return BC.btn( BC.il( icon, label, 15 ), function ( e ) {
					var b = e.currentTarget;
					var run = function () { BC.busy( b, BC.api( 'tools/' + what, { body: {} } ) ).then( function () { BC.toast( t( 'انجام شد', 'Done' ), 'success' ); } ).catch( BC.fail ); };
					if ( danger ) {
						BC.confirm( label + '؟', run, true );
					} else {
						run();
					}
				}, danger ? 'ghost' : '' );
			}
		} );
	};

	/* ================================================================== Guide */
	P.guide = function ( view ) {
		view.appendChild( head( 'book', t( 'راهنما', 'Guide' ), t( 'از نصب تا اولین برنده در ۵ دقیقه.', 'From install to your first winner in 5 minutes.' ) ) );
		var steps = [
			[ t( 'ساخت گردونه', 'Create a wheel' ), t( 'از «گردونه‌ها ← گردونه جدید» یک الگو انتخاب کنید (مثلاً «هدیه اولین خرید» یا «خرید بالای ۲ میلیون»). الگو، تم و قانون شانس را با هم می‌سازد.', 'Wheels → New wheel → pick a template (e.g. first-order gift, big order). It creates the theme and spin rules together.' ) ],
			[ t( 'جوایز و شانس برد', 'Prizes and odds' ), t( 'در تب «جوایز» هر بخش را تنظیم کنید: نوع جایزه (کد تخفیف، ارسال رایگان، محصول هدیه، کیف پول، امتیاز، کد آماده، جایزه فیزیکی…)، وزن شانس، موجودی و سقف روزانه. با «شبیه‌سازی» احتمال‌ها را چک کنید.', 'In Prizes set each slice: type (coupon, free shipping, gift product, wallet, points, code pool, physical…), weight, stock and daily cap. Check the odds with the simulator.' ) ],
			[ t( 'چه کسی چند بار؟', 'Who and how often?' ), t( 'در تب «چه کسی و چند بار»: آزاد با سهمیه (مثلاً روزی ۱ بار) یا «فقط با شانس کسب‌شده». برای «فقط اولین سفارش» یا «خرید بالای ۲ میلیون» در صفحه «قوانین شانس» قانون بسازید. شرط‌های دلخواه (مجموع خرید، تعداد سفارش، سبد، نقش، محصول خریداری‌شده…) هم دارید.', 'In "Who & how often": free with an allowance (e.g. once a day) or earned spins only. For "first order" or "order over 2M" create rules on Spin rules. Add any conditions (total spent, order count, cart, role, bought product…).' ) ],
			[ t( 'ظاهر و پاپ‌آپ', 'Look and popup' ), t( 'یکی از ۳۶ تم را انتخاب کنید یا همه‌چیز را دستی بسازید؛ یا تصویر گردونه خودتان را بگذارید. پیش‌نمایش زنده سمت چپ همه حالت‌ها (فرم، برد، پوچ، انتظار…) را روی دسکتاپ و موبایل نشان می‌دهد.', 'Pick one of 36 themes, design everything manually, or upload your own wheel image. The live preview shows every state on desktop and mobile.' ) ],
			[ t( 'پیامک', 'SMS' ), t( 'در «پیامک و اعلان» پنل خود را انتخاب کنید (۲۶ اتصال، ۶۰+ برند)، کلید را وارد و پیامک تست بفرستید. برای جلوگیری از تقلب «تایید موبایل با OTP» را روشن کنید.', 'In SMS & alerts choose your panel (26 connections, 60+ brands), enter the key and send a test. Turn on OTP to stop cheating.' ) ],
			[ t( 'فعال‌سازی', 'Go live' ), t( 'وضعیت گردونه را «فعال» کنید و ذخیره کنید. با «پیش‌نمایش در سایت» همان‌طور که مشتری می‌بیند تست کنید. اگر افزونه کش دارید یک‌بار کش را پاک کنید.', 'Set the wheel to Active and save. Use "Preview on site". Purge your page cache once.' ) ],
		];
		view.appendChild( BC.card( { title: t( 'شروع سریع', 'Quick start' ), icon: 'rocket' }, h( 'ol', { class: 'bc-guide__steps' }, steps.map( function ( s ) { return h( 'li', null, h( 'b', { text: s[ 0 ] } ), h( 'br' ), h( 'span', { text: s[ 1 ] } ) ); } ) ) ) );
		var sc = [
			[ '[becharkhoon id="1"]', t( 'گردونه را داخل صفحه (نه پاپ‌آپ) نمایش می‌دهد.', 'Shows the wheel inside the page (not as a popup).' ), [ [ 'id', t( 'شماره گردونه (در لیست گردونه‌ها کنار نام هست). خالی = اولین گردونه فعال', 'Wheel id (shown in the wheels list). Empty = first active wheel' ) ], [ 'mode', t( 'inline (پیش‌فرض) یا button = به‌جای گردونه، دکمه بازکردن پاپ‌آپ', 'inline (default) or button = a button that opens the popup' ) ], [ 'text', t( 'متن دکمه در حالت button', 'Button text in button mode' ) ], [ 'class', t( 'کلاس CSS دلخواه', 'Extra CSS class' ) ] ] ],
			[ '[becharkhoon_button id="1" text="بچرخون"]', t( 'دکمه‌ای که پاپ‌آپ گردونه را باز می‌کند (برای بنر، منو، صفحه محصول…).', 'A button that opens the wheel popup (banners, menus, product pages…).' ), [ [ 'id', t( 'شماره گردونه؛ خالی = اولین گردونه فعال', 'Wheel id; empty = first active wheel' ) ], [ 'text', t( 'متن دکمه؛ پیش‌فرض «🎡 گردونه شانس را بچرخان»', 'Button text' ) ], [ 'class', t( 'کلاس CSS دلخواه', 'Extra CSS class' ) ] ] ],
			[ '[becharkhoon_spins id="1" zero="شانسی ندارید"]', t( 'تعداد شانس‌های باقی‌مانده کاربر فعلی (به‌روز و سازگار با کش).', 'Remaining spins of the current visitor (live, cache-safe).' ), [ [ 'id', t( 'شماره گردونه', 'Wheel id' ) ], [ 'zero', t( 'متنی که وقتی شانسی ندارد نمایش داده شود (اختیاری)', 'Text shown when the visitor has no spins (optional)' ) ] ] ],
			[ '[becharkhoon_my_prizes]', t( 'جدول جوایز و کدهای مشتری واردشده (همان تب «گردونه شانس» حساب کاربری).', 'Prize/code history of the logged-in customer.' ), [] ],
			[ '[becharkhoon_winners id="1" count="10"]', t( 'آخرین برندگان با نام ماسک‌شده (اثبات اجتماعی).', 'Latest winners with masked names (social proof).' ), [ [ 'id', t( 'شماره گردونه؛ خالی = اولین گردونه فعال', 'Wheel id; empty = first active wheel' ) ], [ 'count', t( 'تعداد (پیش‌فرض ۱۰)', 'How many (default 10)' ) ] ] ],
			[ '[becharkhoon_referral]', t( 'لینک دعوت اختصاصی مشتری واردشده با دکمه کپی (وقتی «دعوت دوستان» در تنظیمات روشن است).', 'Referral link of the logged-in customer (when referrals are enabled).' ), [] ],
		];
		var links = [
			[ '#bch-open-1', t( 'لینک داخلی: هر لینکی با این آدرس، پاپ‌آپ گردونه ۱ را باز می‌کند (در منو یا دکمه‌های صفحه‌ساز).', 'Any link with this href opens wheel 1 (menus, page-builder buttons).' ) ],
			[ BC.config.homeUrl + '?bch_open=1', t( 'باز شدن خودکار گردونه ۱ با ورود به سایت (برای پیامک، ایمیل، استوری).', 'Opens wheel 1 on arrival (SMS, email, stories).' ) ],
			[ BC.config.homeUrl + '?bch_apply=CODE', t( 'اعمال خودکار کد روی سبد خرید و رفتن به سبد.', 'Applies a code to the cart and goes to the cart.' ) ],
			[ 'Becharkhoon.open(1)', t( 'جاوااسکریپت: باز کردن گردونه از کد خودتان.', 'JavaScript: open a wheel from your own code.' ) ],
		];
		view.appendChild( BC.card( { title: t( 'شورت‌کدها', 'Shortcodes' ), sub: t( 'در هر برگه، نوشته، ابزارک یا صفحه‌ساز (المنتور ← ابزارک شورت‌کد) قرار دهید. بلاک گوتنبرگ «گردونه شانس» و ویجت المنتور هم دارید.', 'Use in any page, post, widget or page builder. There is also a Gutenberg block and an Elementor widget.' ), icon: 'code', cls: 'bc-card--flush' }, BC.table( [
			{ label: t( 'شورت‌کد', 'Shortcode' ), render: function ( x ) { return h( 'div', { class: 'bc-copyline' }, h( 'code', { dir: 'ltr', text: x[ 0 ] } ), BC.btn( BC.icon( 'copy', 14 ), function () { BC.copy( x[ 0 ] ); }, 'sm ghost' ) ); } },
			{ label: t( 'کاربرد', 'Purpose' ), render: function ( x ) { return h( 'span', { text: x[ 1 ] } ); } },
			{ label: t( 'ویژگی‌ها (اختیاری)', 'Attributes (optional)' ), render: function ( x ) { return x[ 2 ].length ? h( 'ul', { class: 'bc-attrs' }, x[ 2 ].map( function ( a ) { return h( 'li', null, h( 'code', { dir: 'ltr', text: a[ 0 ] } ), ' — ', h( 'span', { text: a[ 1 ] } ) ); } ) ) : h( 'small', { text: t( 'ندارد', 'none' ) } ); } },
		], sc ) ) );
		view.appendChild( BC.card( { title: t( 'لینک‌ها و API', 'Links & API' ), icon: 'link', cls: 'bc-card--flush' }, BC.table( [
			{ label: t( 'آدرس / کد', 'URL / code' ), render: function ( x ) { return h( 'div', { class: 'bc-copyline' }, h( 'code', { dir: 'ltr', text: x[ 0 ] } ), BC.btn( BC.icon( 'copy', 14 ), function () { BC.copy( x[ 0 ] ); }, 'sm ghost' ) ); } },
			{ label: t( 'کاربرد', 'Purpose' ), render: function ( x ) { return h( 'span', { text: x[ 1 ] } ); } },
		], links ) ) );
		view.appendChild( BC.card( { title: t( 'متغیرهای پیامک', 'SMS variables' ), icon: 'braces' }, h( 'p', { html: t( 'فهرست کامل متغیرهای پیامک ({name}، {prize}، {code}، {expiry} و…) با توضیح، مثال و این‌که در کدام پیامک کار می‌کنند در <a href="#/sms?tab=vars">پیامک و اعلان ← راهنمای متغیرها</a> است.', 'The full SMS variable reference is in <a href="#/sms?tab=vars">SMS & alerts → Variables guide</a>.' ) } ) ) );
		var faq = [
			[ t( 'نتیجه گردونه قابل تقلب است؟', 'Can the result be cheated?' ), t( 'خیر. برنده همیشه روی سرور با random_int (تصادفی رمزنگاری‌شده) انتخاب می‌شود؛ مرورگر فقط انیمیشن را نشان می‌دهد. محدودیت‌ها با قفل پایگاه‌داده و شمارش سمت سرور اعمال می‌شوند.', 'No. The winner is picked on the server with random_int; the browser only animates. Limits use database locks and server-side counting.' ) ],
			[ t( 'با کش (LiteSpeed، ابرآروان، کلودفلر) مشکلی ندارد؟', 'Does it work with page caches?' ), t( 'نه. صفحه کش می‌شود و وضعیت هر کاربر با درخواست جداگانه no-store گرفته می‌شود؛ توکن امنیتی هم از همان درخواست می‌آید، پس nonce کهنه مشکلی ایجاد نمی‌کند.', 'Yes. Pages stay cached; per-visitor state and the security token come from a separate no-store request.' ) ],
			[ t( 'مهمان‌ها چطور شانس خرید را استفاده می‌کنند؟', 'How do guests use earned spins?' ), t( 'شانس سفارش مهمان به شماره موبایل صورتحساب داده می‌شود؛ کافی است در گردونه همان شماره را با کد پیامکی تایید کند.', 'Guest-order spins are attached to the billing mobile; the guest verifies it with an SMS code in the wheel.' ) ],
			[ t( 'کد تخفیف چطور به سبد اعمال می‌شود؟', 'How is the code applied?' ), t( 'بعد از برد اگر سبد خالی نباشد خودکار اعمال می‌شود؛ دکمه «اعمال در سبد» و لینک داخل پیامک هم کد را اعمال و مشتری را به سبد/تسویه می‌برد. محصول هدیه هم خودکار به سبد اضافه می‌شود.', 'After a win it is applied automatically if the cart has items; the apply button and the SMS link also apply it and redirect. Gift products are added automatically.' ) ],
			[ t( 'چند گردونه همزمان؟', 'Several wheels at once?' ), t( 'بله. هر گردونه صفحات، مخاطبان و زمان‌بندی خودش را دارد؛ اگر چند گردونه در یک صفحه واجد شرایط باشند اولویت تعیین می‌کند. برای تست A/B نام گروه یکسان بدهید.', 'Yes. Each wheel has its own pages, audience and schedule; priority decides when several qualify. Give the same group name for A/B tests.' ) ],
			[ t( 'برای توسعه‌دهندگان', 'For developers' ), t( 'رویدادهای JS: becharkhoon:open / spin / win / lose / close روی document؛ API: Becharkhoon.open(id). هوک‌های PHP: becharkhoon_spin، becharkhoon_credit_granted، becharkhoon_prize_redeemed، فیلترهای becharkhoon_spin_payload، becharkhoon_sms_drivers، becharkhoon_condition_{type}. WP-CLI: wp becharkhoon stats|wheels|grant|cron', 'JS events: becharkhoon:open / spin / win / lose / close on document; API: Becharkhoon.open(id). PHP hooks: becharkhoon_spin, becharkhoon_credit_granted, becharkhoon_prize_redeemed, filters becharkhoon_spin_payload, becharkhoon_sms_drivers, becharkhoon_condition_{type}. WP-CLI: wp becharkhoon stats|wheels|grant|cron' ) ],
		];
		view.appendChild( BC.card( { title: t( 'پرسش‌های پرتکرار', 'FAQ' ), icon: 'info' }, h( 'div', { class: 'bc-faq' }, faq.map( function ( f ) { return h( 'details', null, h( 'summary', { text: f[ 0 ] } ), h( 'p', { text: f[ 1 ] } ) ); } ) ) ) );
	};
} )( window, document );
