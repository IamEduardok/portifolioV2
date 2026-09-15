import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import { SKILLS, TIMELINE } from './portfolio.data';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('portraitStage') private portraitStage?: ElementRef<HTMLElement>;
  @ViewChild('heroShell') private heroShell?: ElementRef<HTMLElement>;
  @ViewChild('heroInner') private heroInner?: ElementRef<HTMLElement>;
  @ViewChild('heroShade') private heroShade?: ElementRef<HTMLElement>;
  @ViewChild('hero') private hero?: ElementRef<HTMLElement>;
  @ViewChild('timelineSection') private timelineSection?: ElementRef<HTMLElement>;
  @ViewChildren('timelineRow') private timelineRows?: QueryList<ElementRef<HTMLElement>>;

  protected readonly menuOpen = signal(false);
  protected readonly timeline = TIMELINE;
  protected readonly skills = SKILLS;
  protected readonly hoveredSkill = signal<number | null>(null);
  protected readonly selectedSkill = signal<number | null>(null);
  protected readonly year = new Date().getFullYear();

  private readonly platformId = inject(PLATFORM_ID);
  private revealObserver?: IntersectionObserver;
  private activeRowObserver?: IntersectionObserver;
  private scrollFrame = 0;
  private smoothFrame = 0;
  private smoothScroll?: { raf: (time: number) => void; destroy: () => void };

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.observeEntrances();
    this.observeTimelineRows();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll, { passive: true });
    void this.startSmoothScrolling();
    this.updateScrollEffects();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onScroll);
      cancelAnimationFrame(this.scrollFrame);
      cancelAnimationFrame(this.smoothFrame);
    }
    this.smoothScroll?.destroy();
    this.revealObserver?.disconnect();
    this.activeRowObserver?.disconnect();
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected showSkill(index: number): void {
    this.hoveredSkill.set(index);
  }

  protected hideSkill(index: number): void {
    if (this.hoveredSkill() === index) this.hoveredSkill.set(null);
  }

  protected toggleSkill(index: number): void {
    this.hoveredSkill.set(null);
    this.selectedSkill.update((selected) => (selected === index ? null : index));
  }

  protected isSkillOpen(index: number): boolean {
    return this.hoveredSkill() === index || (this.hoveredSkill() === null && this.selectedSkill() === index);
  }

  protected movePortraitReveal(event: PointerEvent): void {
    const stage = this.portraitStage?.nativeElement;
    if (!stage) return;

    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty('--mouse-x', `${event.clientX - bounds.left}px`);
    stage.style.setProperty('--mouse-y', `${event.clientY - bounds.top}px`);
    stage.style.setProperty('--portrait-rotate-y', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 7}deg`);
    stage.style.setProperty('--portrait-rotate-x', `${-((event.clientY - bounds.top) / bounds.height - 0.5) * 5}deg`);
    stage.classList.add('is-hovered');
  }

  protected resetPortraitReveal(): void {
    const stage = this.portraitStage?.nativeElement;
    if (!stage) return;
    stage.classList.remove('is-hovered');
    stage.style.setProperty('--portrait-rotate-y', '0deg');
    stage.style.setProperty('--portrait-rotate-x', '0deg');
  }

  private observeEntrances(): void {
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          this.revealObserver?.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    elements.forEach((element) => this.revealObserver?.observe(element));
  }

  private observeTimelineRows(): void {
    if (!('IntersectionObserver' in window)) return;

    this.activeRowObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => entry.target.classList.toggle('is-current', entry.isIntersecting));
      },
      { rootMargin: '-38% 0px -38% 0px', threshold: 0 },
    );
    this.timelineRows?.forEach((row) => this.activeRowObserver?.observe(row.nativeElement));
  }

  private readonly onScroll = (): void => {
    cancelAnimationFrame(this.scrollFrame);
    this.scrollFrame = requestAnimationFrame(() => this.updateScrollEffects());
  };

  private async startSmoothScrolling(): Promise<void> {
    if (!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const { default: Lenis } = await import('lenis');
    const smoothScroll = new Lenis({ smoothWheel: true });
    this.smoothScroll = smoothScroll;

    const animate = (time: number) => {
      smoothScroll.raf(time);
      this.smoothFrame = requestAnimationFrame(animate);
    };
    this.smoothFrame = requestAnimationFrame(animate);
  }

  private updateScrollEffects(): void {
    const shell = this.heroShell?.nativeElement;
    const inner = this.heroInner?.nativeElement;
    const shade = this.heroShade?.nativeElement;
    const hero = this.hero?.nativeElement;
    const timeline = this.timelineSection?.nativeElement;

    if (shell && inner && shade && hero && timeline) {
      const viewportHeight = window.innerHeight || 1;
      const timelineTop = timeline.getBoundingClientRect().top;
      const progress = Math.min(1, Math.max(0, 1 - timelineTop / viewportHeight));
      const shrink = window.matchMedia?.('(max-width: 639px)').matches ? 0 : 0.1;

      hero.style.setProperty('--hero-scroll', progress.toFixed(3));
      inner.style.transform = progress > 0 && shrink > 0 ? `scale(${1 - shrink * progress})` : '';
      inner.style.willChange = progress > 0 && shrink > 0 ? 'transform' : '';
      inner.style.visibility = progress >= 1 ? 'hidden' : 'visible';
      shade.style.opacity = `${0.55 * progress}`;
    }

    if (timeline) {
      const bounds = timeline.getBoundingClientRect();
      const distance = bounds.height + window.innerHeight;
      const progress = Math.min(1, Math.max(0, (window.innerHeight - bounds.top) / distance));
      timeline.style.setProperty('--timeline-progress', progress.toFixed(3));
    }
  }
}
