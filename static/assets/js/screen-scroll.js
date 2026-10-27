/* Full-screen section navigation for this static page. */
(() => {
  'use strict';

  class ScreenScroll {
    constructor(selector, options = {}) {
      this.root = document.querySelector(selector);
      if (!this.root) throw new Error('ScreenScroll root was not found');
      this.options = options;
      this.panels = Array.from(this.root.querySelectorAll(options.sectionSelector || '.fullpage-section'));
      if (!this.panels.length) throw new Error('ScreenScroll has no sections');

      this.index = 0;
      this.speed = options.scrollingSpeed || 0;
      this.allowScrolling = true;
      this.allowKeyboard = options.keyboardScrolling !== false;
      this.lockUntil = 0;
      this.wheelTotal = 0;
      this.lastWheel = 0;
      this.touchStart = null;
      this.transitionTimer = null;
      this.resizeFrame = null;
      this.destroyed = false;

      this.onWheel = this.onWheel.bind(this);
      this.onTouchStart = this.onTouchStart.bind(this);
      this.onTouchEnd = this.onTouchEnd.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onResize = this.onResize.bind(this);

      document.documentElement.classList.add('fp-enabled');
      this.root.classList.add('screen-scroll-active');
      this.measure();
      this.place(false);
      window.scrollTo(0, 0);
      window.addEventListener('wheel', this.onWheel, { passive: false });
      this.root.addEventListener('touchstart', this.onTouchStart, { passive: true });
      this.root.addEventListener('touchend', this.onTouchEnd, { passive: true });
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('resize', this.onResize);
    }

    measure() {
      this.height = window.innerHeight;
      this.panels.forEach(panel => { panel.style.height = `${this.height}px`; });
    }

    place(animate) {
      this.root.style.transition = animate && this.speed
        ? `transform ${this.speed}ms ${this.options.easingcss3 || 'ease-in-out'}`
        : 'none';
      this.root.style.transform = `translate3d(0, -${this.index * this.height}px, 0)`;
    }

    destination(index) {
      return { index, item: this.panels[index] };
    }

    goTo(index, animate = true) {
      if (this.destroyed) return;
      const next = Math.max(0, Math.min(this.panels.length - 1, index));
      if (next === this.index) return;
      const origin = this.destination(this.index);
      const destination = this.destination(next);
      clearTimeout(this.transitionTimer);
      if (this.options.onLeave) this.options.onLeave(origin, destination);
      this.index = next;
      this.place(animate);
      const duration = animate ? this.speed : 0;
      this.lockUntil = performance.now() + duration + 100;
      const finish = () => {
        if (this.destroyed) return;
        if (this.options.afterLoad) this.options.afterLoad(origin, destination);
      };
      if (duration) this.transitionTimer = setTimeout(finish, duration);
      else finish();
    }

    moveTo(section) { this.goTo(Number(section) - 1); }
    silentMoveTo(section) { this.goTo(Number(section) - 1, false); }
    setAllowScrolling(allow) { this.allowScrolling = !!allow; }
    setKeyboardScrolling(allow) { this.allowKeyboard = !!allow; }
    setScrollingSpeed(speed) { this.speed = Math.max(0, Number(speed) || 0); }

    isNormalTarget(target) {
      return target instanceof Element && this.options.normalScrollElements &&
        !!target.closest(this.options.normalScrollElements);
    }

    onWheel(event) {
      if (!this.allowScrolling || this.isNormalTarget(event.target)) return;
      if (event.cancelable) event.preventDefault();
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const now = performance.now();
      if (now < this.lockUntil) return;
      if (now - this.lastWheel > 160 || Math.sign(this.wheelTotal) !== Math.sign(event.deltaY)) this.wheelTotal = 0;
      this.lastWheel = now;
      this.wheelTotal += event.deltaY;
      if (Math.abs(this.wheelTotal) < 20) return;
      const direction = Math.sign(this.wheelTotal);
      this.wheelTotal = 0;
      this.goTo(this.index + direction);
    }

    onTouchStart(event) {
      if (!this.allowScrolling || this.isNormalTarget(event.target) || event.touches.length !== 1) {
        this.touchStart = null;
        return;
      }
      this.touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }

    onTouchEnd(event) {
      const start = this.touchStart;
      this.touchStart = null;
      if (!start || !this.allowScrolling || !event.changedTouches.length || performance.now() < this.lockUntil) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      const threshold = Math.max(35, this.height * (this.options.touchSensitivity || 8) / 100);
      if (Math.abs(dy) >= threshold && Math.abs(dy) > Math.abs(dx)) this.goTo(this.index + (dy < 0 ? 1 : -1));
    }

    onKeyDown(event) {
      if (!this.allowKeyboard || this.isNormalTarget(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      let next = this.index;
      if (['ArrowDown', 'PageDown'].includes(event.key) || event.key === ' ' && !event.shiftKey) next++;
      else if (['ArrowUp', 'PageUp'].includes(event.key) || event.key === ' ' && event.shiftKey) next--;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = this.panels.length - 1;
      else return;
      if (event.cancelable) event.preventDefault();
      if (performance.now() >= this.lockUntil) this.goTo(next);
    }

    onResize() {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => {
        if (this.destroyed) return;
        this.measure();
        this.place(false);
        if (this.options.afterResize) this.options.afterResize();
      });
    }

    destroy() {
      this.destroyed = true;
      clearTimeout(this.transitionTimer);
      cancelAnimationFrame(this.resizeFrame);
      window.removeEventListener('wheel', this.onWheel);
      this.root.removeEventListener('touchstart', this.onTouchStart);
      this.root.removeEventListener('touchend', this.onTouchEnd);
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('resize', this.onResize);
      document.documentElement.classList.remove('fp-enabled');
      this.root.classList.remove('screen-scroll-active');
      this.root.style.removeProperty('transition');
      this.root.style.removeProperty('transform');
      this.panels.forEach(panel => panel.style.removeProperty('height'));
    }
  }

  window.ScreenScroll = ScreenScroll;
})();
