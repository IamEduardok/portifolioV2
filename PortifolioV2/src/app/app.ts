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
  @ViewChild('portraitImage') private portraitImage?: ElementRef<HTMLImageElement>;
  @ViewChild('pixelPortrait') private pixelPortrait?: ElementRef<HTMLCanvasElement>;
  @ViewChild('portraitStage') private portraitStage?: ElementRef<HTMLElement>;
  @ViewChild('heroShell') private heroShell?: ElementRef<HTMLElement>;
  @ViewChild('hero') private hero?: ElementRef<HTMLElement>;
  @ViewChild('timelineSection') private timelineSection?: ElementRef<HTMLElement>;
  @ViewChildren('timelineRow') private timelineRows?: QueryList<ElementRef<HTMLElement>>;

  protected readonly menuOpen = signal(false);
  protected readonly timeline = TIMELINE;
  protected readonly skills = SKILLS;
  protected readonly year = new Date().getFullYear();

  private readonly platformId = inject(PLATFORM_ID);
  private revealObserver?: IntersectionObserver;
  private activeRowObserver?: IntersectionObserver;
  private scrollFrame = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.observeEntrances();
    this.observeTimelineRows();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.updateScrollEffects();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onScroll);
      cancelAnimationFrame(this.scrollFrame);
    }
    this.revealObserver?.disconnect();
    this.activeRowObserver?.disconnect();
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected preparePixelPortrait(): void {
    const image = this.portraitImage?.nativeElement;
    const canvas = this.pixelPortrait?.nativeElement;
    if (!image || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = 72;
    canvas.height = 88;
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  }

  protected movePixelReveal(event: PointerEvent): void {
    const stage = this.portraitStage?.nativeElement;
    if (!stage) return;

    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty('--mouse-x', `${event.clientX - bounds.left}px`);
    stage.style.setProperty('--mouse-y', `${event.clientY - bounds.top}px`);
    stage.style.setProperty('--portrait-rotate-y', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 7}deg`);
    stage.style.setProperty('--portrait-rotate-x', `${-((event.clientY - bounds.top) / bounds.height - 0.5) * 5}deg`);
    stage.classList.add('is-hovered');
  }

  protected resetPixelReveal(): void {
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

  private updateScrollEffects(): void {
    const shell = this.heroShell?.nativeElement;
    const hero = this.hero?.nativeElement;
    const timeline = this.timelineSection?.nativeElement;

    if (shell && hero) {
      const bounds = shell.getBoundingClientRect();
      const distance = Math.max(shell.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -bounds.top / distance));
      hero.style.setProperty('--hero-scroll', progress.toFixed(3));
    }

    if (timeline) {
      const bounds = timeline.getBoundingClientRect();
      const distance = bounds.height + window.innerHeight;
      const progress = Math.min(1, Math.max(0, (window.innerHeight - bounds.top) / distance));
      timeline.style.setProperty('--timeline-progress', progress.toFixed(3));
    }
  }
}
