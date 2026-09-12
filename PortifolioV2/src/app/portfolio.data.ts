export interface TimelineEntry {
  year: string;
  title: string;
  description: string;
  image: string;
  size: 'large' | 'small';
  side: 'left' | 'right' | 'center';
}

export const TIMELINE: TimelineEntry[] = [
  {
    year: '2020',
    title: 'O primeiro projeto.',
    description: 'O início da jornada, transformando curiosidade em interfaces que realmente funcionam.',
    image: '/images/timeline-01.svg',
    size: 'large',
    side: 'center',
  },
  {
    year: '2021',
    title: 'Novas ferramentas.',
    description: 'Mais repertório, mais experimentos e uma visão mais clara sobre produto digital.',
    image: '/images/timeline-02.svg',
    size: 'small',
    side: 'right',
  },
  {
    year: '2022',
    title: 'Código com intenção.',
    description: 'A engenharia passou a caminhar junto com tipografia, movimento e direção visual.',
    image: '/images/timeline-03.svg',
    size: 'large',
    side: 'center',
  },
  {
    year: '2023',
    title: 'Projetos reais.',
    description: 'Desafios maiores, colaboração em equipe e entregas orientadas a resultado.',
    image: '/images/timeline-01.svg',
    size: 'small',
    side: 'left',
  },
  {
    year: '2024',
    title: 'Experiências completas.',
    description: 'Interfaces rápidas, responsivas e cuidadas do primeiro frame até o deploy.',
    image: '/images/timeline-02.svg',
    size: 'large',
    side: 'center',
  },
  {
    year: '2026',
    title: 'O próximo capítulo.',
    description: 'Uma história ainda em movimento, aberta a novas ideias, pessoas e produtos.',
    image: '/images/timeline-03.svg',
    size: 'large',
    side: 'center',
  },
];

export const SKILLS = ['Angular', 'TypeScript', 'Interfaces', 'Motion', 'APIs', 'Experiências web'];
