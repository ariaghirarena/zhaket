/* ARIAGH.AIWRITER — preview landing behaviour (no external requests) */
(function () {
  'use strict';

  var PROVIDERS = [
    'OpenAI', 'Anthropic Claude', 'Google Gemini', 'OpenRouter', 'Groq', 'Mistral AI',
    'DeepSeek', 'xAI Grok', 'Together AI', 'Fireworks AI', 'Perplexity', 'Cohere',
    'Cerebras', 'DeepInfra', 'Moonshot Kimi', 'Alibaba Qwen', 'Zhipu GLM',
    'AvalAI', 'GapGPT', 'Cloudflare Workers AI', 'Claude Pro'
  ];

  function buildMarquee() {
    var track = document.getElementById('provTrack');
    if (!track) return;
    var html = PROVIDERS.map(function (name, i) {
      return '<span class="pill"><b>' + (i + 1 > 9 ? toFa(i + 1) : toFa(i + 1)) + '</b>' + name + '</span>';
    }).join('');
    track.innerHTML = html + html; // duplicate for a seamless loop
  }

  function toFa(n) {
    var d = '۰۱۲۳۴۵۶۷۸۹';
    return String(n).replace(/\d/g, function (c) { return d[+c]; });
  }

  function stickyHead() {
    var head = document.getElementById('head');
    if (!head) return;
    var onScroll = function () {
      head.classList.toggle('solid', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function reveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 60 + 'ms';
      io.observe(el);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildMarquee();
    stickyHead();
    reveal();
  });
})();
