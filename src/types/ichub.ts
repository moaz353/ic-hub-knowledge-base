export type ItemType = 'note' | 'slide' | 'book' | 'linkedin' | 'video' | 'resource' | 'tool' | 'project' | 'cheatsheet';

export interface ICItem {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  thumbnail: string;
  file: string;
  tags: string[];
  source: string;
  date: string;
  favorite: boolean;
  pinned: boolean;
  rating: number;
  annotation: string;
}

export interface TopicData {
  id: string;
  name: string;
  fullName: string;
  description: string;
  color: string;
  icon: string;
  items: ICItem[];
}

export interface TopicIndex {
  topics: string[];
}

export interface TopicMeta {
  id: string;
  name: string;
  fullName: string;
  description: string;
  color: string;
  icon: string;
  itemCount: number;
  lastUpdated: string;
}

export const TOPIC_ICONS: Record<string, string> = {
  asic: '◈',
  cdc: '⇄',
  clk: '◷',
  cts: '⋱',
  dft: '⊞',
  logiccircuit: '⊕',
  nti2024: '◎',
  pnr: '⊟',
  projects: '◧',
  qs: '≡',
  scripting: '∮',
  sta: '◑',
  systemverilog: '◇',
  verilog: '⟨/⟩',
};

export const TOPIC_COLORS: Record<string, string> = {
  asic: '#7ee787',
  cdc: '#f78166',
  clk: '#79c0ff',
  cts: '#d2a8ff',
  dft: '#ffa657',
  logiccircuit: '#56d364',
  nti2024: '#58a6ff',
  pnr: '#ff7b72',
  projects: '#e3b341',
  qs: '#bc8cff',
  scripting: '#79c0ff',
  sta: '#f78166',
  systemverilog: '#7ee787',
  verilog: '#ffa657',
};

export const TOPIC_FULLNAMES: Record<string, string> = {
  asic: 'Application-Specific Integrated Circuit',
  cdc: 'Clock Domain Crossing',
  clk: 'Clock Design & Distribution',
  cts: 'Clock Tree Synthesis',
  dft: 'Design for Testability',
  logiccircuit: 'Logic Circuit Design',
  nti2024: 'NTI 2024 Program',
  pnr: 'Place and Route',
  projects: 'VLSI Projects',
  qs: 'Quick Start Guides',
  scripting: 'Scripting & Automation',
  sta: 'Static Timing Analysis',
  systemverilog: 'SystemVerilog',
  verilog: 'Verilog HDL',
};

export const TOPIC_DESCRIPTIONS: Record<string, string> = {
  asic: 'ASIC design flow, synthesis, and implementation',
  cdc: 'Clock domain crossing analysis and synchronization',
  clk: 'Clock generation, distribution, and management',
  cts: 'Clock tree synthesis and optimization',
  dft: 'Design for testability, scan chains, BIST',
  logiccircuit: 'Digital logic design and circuit fundamentals',
  nti2024: 'NTI training program materials 2024',
  pnr: 'Placement, routing, and physical design',
  projects: 'VLSI design projects and implementations',
  qs: 'Quick start guides and reference sheets',
  scripting: 'TCL, Python, Perl scripting for EDA',
  sta: 'Timing constraints, SDC, setup/hold analysis',
  systemverilog: 'SystemVerilog language and UVM',
  verilog: 'Verilog HDL language and design patterns',
};

export const TYPE_SYMBOLS: Record<ItemType, string> = {
  note: '✎',
  slide: '▦',
  book: '▤',
  linkedin: '◉',
  video: '▶',
  resource: '◈',
  tool: '⚙',
  project: '◧',
  cheatsheet: '≡',
};

export const ITEM_TYPES: ItemType[] = [
  'note', 'slide', 'book', 'linkedin', 'video',
  'resource', 'tool', 'project', 'cheatsheet'
];
