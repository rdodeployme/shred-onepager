'use client';
import { useEffect } from 'react';

/* reveal-on-scroll, parallax, header state, process progress */
export default function Effects() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rv = Array.from(document.querySelectorAll<HTMLElement>('.rv'));
    document.documentElement.classList.add('js');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach((el) => io.observe(el));

    const par = Array.from(document.querySelectorAll<HTMLElement>('[data-par]'));
    const proc = document.querySelector<HTMLElement>('.proc');
    const header = document.querySelector<HTMLElement>('header.top');
    const story = document.getElementById('line');
    let tick = false;
    function upd() {
      tick = false;
      const vh = window.innerHeight;
      if (!reduce) par.forEach((el) => {
        const r = el.parentElement!.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const k = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = `translate3d(0,${(k * -Number(el.dataset.par || 60)).toFixed(1)}px,0) scale(1.18)`;
      });
      if (proc) {
        const r = proc.getBoundingClientRect();
        const k = Math.max(0, Math.min(1, (vh * 0.72 - r.top) / r.height));
        proc.style.setProperty('--k', k.toFixed(3));
        proc.querySelectorAll<HTMLElement>('article').forEach((a, i, all) => a.classList.toggle('lit', k > (i + 0.35) / all.length));
      }
      if (header && story) {
        const r = story.getBoundingClientRect();
        header.classList.toggle('solid', r.bottom < 80);
      }
    }
    const on = () => { if (!tick) { tick = true; requestAnimationFrame(upd); } };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    upd();
    return () => { io.disconnect(); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, []);
  return null;
}
