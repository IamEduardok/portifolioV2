import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';

interface Project {
  index: string;
  title: string;
  category: string;
  description: string;
  stack: string[];
  accent: string;
  shape: 'orb' | 'prism' | 'portal';
}

@Component({
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('heroCanvas') private canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroScene') private sceneRef?: ElementRef<HTMLElement>;

  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();
  protected readonly projects: Project[] = [
    {
      index: '01',
      title: 'Nexus Finance',
      category: 'Fintech / Product',
      description: 'Dashboard financeiro que transforma dados complexos em decisões rápidas e visuais.',
      stack: ['Angular', 'TypeScript', 'Charts'],
      accent: '#00e5ff',
      shape: 'orb',
    },
    {
      index: '02',
      title: 'Atlas Commerce',
      category: 'E-commerce / Experience',
      description: 'Experiência de compra modular, veloz e pensada para converter em qualquer tela.',
      stack: ['Angular', 'SSR', 'Design system'],
      accent: '#ff6b35',
      shape: 'prism',
    },
    {
      index: '03',
      title: 'Pulse Studio',
      category: 'Creative / Immersive',
      description: 'Site imersivo para um estúdio criativo, unindo movimento, som e narrativa digital.',
      stack: ['Three.js', 'WebGL', 'Motion'],
      accent: '#b7ff3c',
      shape: 'portal',
    },
  ];

  protected readonly skills = [
    'Angular', 'TypeScript', 'Three.js', 'WebGL', 'Node.js', 'UI Engineering', 'Motion Design', 'Design Systems',
  ];

  private readonly platformId = inject(PLATFORM_ID);
  private renderer?: THREE.WebGLRenderer;
  private animationFrame = 0;
  private resizeObserver?: ResizeObserver;
  private revealObserver?: IntersectionObserver;
  private sceneGroup?: THREE.Group;
  private pointer = new THREE.Vector2();
  private pointerTarget = new THREE.Vector2();
  private reducedMotion = false;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if ('IntersectionObserver' in window) {
      this.initReveals();
    } else {
      document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
    }
    if ('WebGLRenderingContext' in window) this.initThreeScene();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.animationFrame);
      window.removeEventListener('pointermove', this.onPointerMove);
    }
    this.resizeObserver?.disconnect();
    this.revealObserver?.disconnect();
    this.sceneGroup?.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.renderer?.dispose();
  }

  protected toggleMenu(): void { this.menuOpen.update((open) => !open); }
  protected closeMenu(): void { this.menuOpen.set(false); }
  protected trackProject(_: number, project: Project): string { return project.index; }

  private initReveals(): void {
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          this.revealObserver?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach((element) => this.revealObserver?.observe(element));
  }

  private initThreeScene(): void {
    const canvas = this.canvasRef?.nativeElement;
    const host = this.sceneRef?.nativeElement;
    if (!canvas || !host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 9);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    this.renderer = renderer;

    scene.add(new THREE.AmbientLight(0xdffaff, 1.5));
    const keyLight = new THREE.PointLight(0x00e5ff, 45, 30);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x6246ea, 35, 25);
    rimLight.position.set(-5, -2, 2);
    scene.add(rimLight);

    const group = new THREE.Group();
    this.sceneGroup = group;
    scene.add(group);
    const coreGeometry = new THREE.IcosahedronGeometry(1.75, 2);
    const core = new THREE.Mesh(coreGeometry, new THREE.MeshPhysicalMaterial({
      color: 0x11161a, metalness: 0.82, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.14,
    }));
    group.add(core);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(coreGeometry, 18),
      new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.72 }),
    );
    edges.scale.setScalar(1.008);
    group.add(edges);

    [2.35, 2.75].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.018, 8, 160),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.58, side: THREE.DoubleSide }),
      );
      ring.rotation.set(Math.PI / (2.8 + index), index * 0.8, index * 0.45);
      ring.userData['speed'] = index === 0 ? 0.22 : -0.14;
      group.add(ring);
    });

    const satelliteMaterial = new THREE.MeshStandardMaterial({
      color: 0xeef7f8, emissive: 0x006674, emissiveIntensity: 0.45, metalness: 0.55, roughness: 0.25,
    });
    const satelliteGeometry = new THREE.OctahedronGeometry(0.19, 0);
    for (let index = 0; index < 5; index++) {
      const angle = (index / 5) * Math.PI * 2;
      const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
      satellite.position.set(Math.cos(angle) * 2.65, Math.sin(angle * 1.4) * 1.15, Math.sin(angle) * 1.25);
      group.add(satellite);
    }

    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(210 * 3);
    for (let index = 0; index < positions.length; index += 3) {
      const radius = 3.2 + Math.random() * 2.8;
      const angle = Math.random() * Math.PI * 2;
      positions[index] = Math.cos(angle) * radius;
      positions[index + 1] = (Math.random() - 0.5) * 6;
      positions[index + 2] = Math.sin(angle) * radius - 1;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.026, transparent: true, opacity: 0.55 }),
    );
    scene.add(particles);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      group.scale.setScalar(width < 720 ? 0.72 : 1);
      group.position.y = width < 720 ? -0.35 : 0;
    };
    this.resizeObserver = new ResizeObserver(resize);
    this.resizeObserver.observe(host);
    resize();

    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    const clock = new THREE.Clock();
    const render = () => {
      const elapsed = clock.getElapsedTime();
      this.pointer.lerp(this.pointerTarget, 0.045);
      group.rotation.x += (this.pointer.y * 0.22 - group.rotation.x) * 0.035;
      group.rotation.y += (this.pointer.x * 0.35 - group.rotation.y) * 0.035;
      if (!this.reducedMotion) {
        core.rotation.y = elapsed * 0.13;
        core.rotation.z = elapsed * 0.07;
        edges.rotation.copy(core.rotation);
        particles.rotation.y = elapsed * -0.025;
        group.children.forEach((child) => {
          if (child.userData['speed']) child.rotation.z = elapsed * child.userData['speed'];
        });
      }
      renderer.render(scene, camera);
      this.animationFrame = requestAnimationFrame(render);
    };
    render();
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    this.pointerTarget.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
  };
}
