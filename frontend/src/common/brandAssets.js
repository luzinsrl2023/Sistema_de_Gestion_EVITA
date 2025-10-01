export const DEFAULT_LOGO_SVG = `<svg fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white"><path d="M8 10h16c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2z" fill="currentColor" opacity="0.3"></path><path d="M10 14h8v1H10v-1zm0 2h6v1h-6v-1z" fill="currentColor"></path><circle cx="9" cy="12" r="1" fill="currentColor"></circle><path d="M22 8l2 2-2 2-1-1 1-1-1-1 1-1z" fill="currentColor"></path><circle cx="24" cy="7" r="0.8" fill="currentColor" opacity="0.8"></circle><circle cx="26" cy="9" r="0.6" fill="currentColor" opacity="0.6"></circle><circle cx="25" cy="11" r="0.4" fill="currentColor" opacity="0.4"></circle></svg>`;

export const DEFAULT_PLACEHOLDER_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(DEFAULT_LOGO_SVG)}`;

export const DEFAULT_LOGO_OPTIONS = [
  {
    id: 'evita-official',
    label: 'EVITA Oficial',
    description: 'Logo principal del sistema',
    url: 'https://raw.githubusercontent.com/luzinsrl2023/Sistema_de_Gestion_EVITA/main/logo/evita1.png'
  },
  {
    id: 'evita-secundario',
    label: 'EVITA Alternativo',
    description: 'Versión alternativa para fondos oscuros',
    url: 'https://raw.githubusercontent.com/luzinsrl2023/Sistema_de_Gestion_EVITA/main/logo/evita2.png'
  },
  {
    id: 'placeholder-minimal',
    label: 'Opción genérica',
    description: 'Marcador genérico ligero',
    url: DEFAULT_PLACEHOLDER_LOGO
  }
];

export const DEFAULT_LOGO_DATA_URL = DEFAULT_LOGO_OPTIONS[0].url;
