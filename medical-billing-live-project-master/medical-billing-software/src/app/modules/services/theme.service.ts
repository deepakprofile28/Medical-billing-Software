import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ThemePreset {
  name: string;
  label: string;
  color: string;
  darkSidebar: string;
  lightAccent: string;
}

export const PRESET_THEMES: ThemePreset[] = [
  { name: 'green', label: 'Emerald Green', color: '#10b981', darkSidebar: '#052e24', lightAccent: '#34d399' },
  { name: 'blue', label: 'Royal Blue', color: '#2563eb', darkSidebar: '#0b1f44', lightAccent: '#60a5fa' },
  { name: 'sky', label: 'Ocean Sky', color: '#0284c7', darkSidebar: '#08253a', lightAccent: '#38bdf8' },
  { name: 'teal', label: 'Clinical Teal', color: '#0d9488', darkSidebar: '#042724', lightAccent: '#2dd4bf' },
  { name: 'purple', label: 'Royal Purple', color: '#7c3aed', darkSidebar: '#200b46', lightAccent: '#a78bfa' },
  { name: 'indigo', label: 'Deep Indigo', color: '#4f46e5', darkSidebar: '#13113f', lightAccent: '#818cf8' },
  { name: 'red', label: 'Crimson Red', color: '#dc2626', darkSidebar: '#3b0d0d', lightAccent: '#f87171' },
  { name: 'rose', label: 'Rose Pink', color: '#e11d48', darkSidebar: '#3d091a', lightAccent: '#fb7185' },
  { name: 'orange', label: 'Amber Orange', color: '#ea580c', darkSidebar: '#361505', lightAccent: '#fb923c' },
  { name: 'cyan', label: 'Diagnostic Cyan', color: '#0891b2', darkSidebar: '#06252f', lightAccent: '#22d3ee' },
  { name: 'navy', label: 'Midnight Navy', color: '#1e3a8a', darkSidebar: '#09132c', lightAccent: '#93c5fd' },
  { name: 'slate', label: 'Graphite Slate', color: '#475569', darkSidebar: '#0f172a', lightAccent: '#94a3b8' }
];

// Modern color name dictionary mapping popular names to vibrant Tailwind shades
const COLOR_NAME_MAP: Record<string, string> = {
  green: '#10b981',
  emerald: '#10b981',
  blue: '#2563eb',
  sky: '#0284c7',
  teal: '#0d9488',
  purple: '#7c3aed',
  violet: '#8b5cf6',
  indigo: '#4f46e5',
  red: '#dc2626',
  crimson: '#e11d48',
  rose: '#e11d48',
  pink: '#db2777',
  orange: '#ea580c',
  amber: '#f59e0b',
  yellow: '#eab308',
  cyan: '#0891b2',
  navy: '#1e3a8a',
  slate: '#475569',
  gray: '#4b5563',
  grey: '#4b5563',
  dark: '#1e293b',
  black: '#0f172a',
  lime: '#65a30d',
  fuchsia: '#c026d3'
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'medbill_theme_color';
  private readonly INPUT_STORAGE_KEY = 'medbill_theme_input';
  private readonly DEFAULT_COLOR = '#10b981';

  private currentThemeSubject = new BehaviorSubject<string>(this.loadCachedTheme());
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.initTheme();
  }

  /**
   * Initializes theme on app load
   */
  initTheme(): void {
    const cached = this.loadCachedTheme();
    this.applyTheme(cached);
  }

  /**
   * Get cached color from localStorage or fallback to default
   */
  private loadCachedTheme(): string {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && this.isValidColor(stored)) {
        return stored;
      }
    } catch (e) {
      console.warn('Error reading stored theme:', e);
    }
    return this.DEFAULT_COLOR;
  }

  /**
   * Get raw user input (e.g. 'blue', '#0284c7')
   */
  getUserInput(): string {
    try {
      return localStorage.getItem(this.INPUT_STORAGE_KEY) || this.loadCachedTheme();
    } catch {
      return this.DEFAULT_COLOR;
    }
  }

  /**
   * Resolves any input (hex, color name, rgb) into a normalized hex string (#rrggbb)
   */
  resolveColorToHex(input: string): string | null {
    if (!input || !input.trim()) return null;
    let clean = input.trim().toLowerCase();

    // Check modern color name map
    if (COLOR_NAME_MAP[clean]) {
      return COLOR_NAME_MAP[clean];
    }

    // Check if input is hex without '#' (e.g. '10b981' or '0284c7')
    if (/^[0-9a-f]{6}$/i.test(clean)) {
      return `#${clean}`;
    }
    if (/^[0-9a-f]{3}$/i.test(clean)) {
      return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`;
    }

    // Check standard hex code with '#'
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean)) {
      if (clean.length === 4) {
        return `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
      }
      return clean;
    }

    // Fallback: Browser native canvas color resolver for any standard CSS color name
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#000000'; // reset
          ctx.fillStyle = clean;
          if (ctx.fillStyle !== '#000000' || clean === 'black') {
            return ctx.fillStyle;
          }
        }
      } catch {
        // ignore
      }
    }

    return null;
  }

  /**
   * Check if a color string can be resolved
   */
  isValidColor(input: string): boolean {
    return this.resolveColorToHex(input) !== null;
  }

  /**
   * Apply a theme color dynamically across the entire application
   * @param colorInput Color code (e.g. #0284c7) or color name (e.g. blue)
   */
  applyTheme(colorInput: string): boolean {
    const hex = this.resolveColorToHex(colorInput);
    if (!hex) {
      return false;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, hex);
      localStorage.setItem(this.INPUT_STORAGE_KEY, colorInput.trim());
    } catch (e) {
      console.warn('Could not save theme to localStorage:', e);
    }

    this.currentThemeSubject.next(hex);

    // Calculate derived shades
    const rgb = this.hexToRgb(hex);
    if (!rgb) return false;

    // Dark sidebar gradient shades matching the chosen hue
    const dark1 = this.rgbToHex(Math.round(rgb.r * 0.18), Math.round(rgb.g * 0.18), Math.round(rgb.b * 0.18));
    const dark2 = this.rgbToHex(Math.round(rgb.r * 0.10), Math.round(rgb.g * 0.10), Math.round(rgb.b * 0.10));
    const dark3 = this.rgbToHex(Math.round(rgb.r * 0.05), Math.round(rgb.g * 0.05), Math.round(rgb.b * 0.05));

    // Darker hover for buttons
    const hoverHex = this.rgbToHex(
      Math.max(0, Math.round(rgb.r * 0.85)),
      Math.max(0, Math.round(rgb.g * 0.85)),
      Math.max(0, Math.round(rgb.b * 0.85))
    );

    // Lighter shade for icons, badges, accents
    const lightHex = this.rgbToHex(
      Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.35)),
      Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.35)),
      Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.35))
    );

    if (typeof document !== 'undefined') {
      const root = document.documentElement;

      // 1. Set root CSS custom properties
      root.style.setProperty('--app-theme-color', hex);
      root.style.setProperty('--app-theme-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      root.style.setProperty('--app-theme-dark-1', dark1);
      root.style.setProperty('--app-theme-dark-2', dark2);
      root.style.setProperty('--app-theme-dark-3', dark3);
      root.style.setProperty('--app-theme-hover', hoverHex);
      root.style.setProperty('--app-theme-light', lightHex);
      root.style.setProperty('--app-theme-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
      root.style.setProperty('--app-theme-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`);

      // 2. Inject or update global high-priority override stylesheet
      this.injectGlobalThemeStyle({
        hex,
        rgb,
        dark1,
        dark2,
        dark3,
        hoverHex,
        lightHex
      });
    }

    return true;
  }

  /**
   * Injects or updates a global <style> tag at the end of <head>
   * ensuring that all sidebars, active menu items, icons, and buttons update across ALL pages
   */
  private injectGlobalThemeStyle(theme: {
    hex: string;
    rgb: { r: number; g: number; b: number };
    dark1: string;
    dark2: string;
    dark3: string;
    hoverHex: string;
    lightHex: string;
  }): void {
    const styleId = 'app-dynamic-theme-overrides';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const { hex, rgb, dark1, dark2, dark3, hoverHex, lightHex } = theme;

    styleTag.textContent = `
      :root {
        --app-theme-color: ${hex} !important;
        --app-theme-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b} !important;
        --app-theme-dark-1: ${dark1} !important;
        --app-theme-dark-2: ${dark2} !important;
        --app-theme-dark-3: ${dark3} !important;
        --app-theme-hover: ${hoverHex} !important;
        --app-theme-light: ${lightHex} !important;
      }

      /* 1. APP SIDEBAR & NAVIGATION BACKGROUND */
      .app-sidebar,
      aside.app-sidebar,
      .sidebar {
        background: linear-gradient(180deg, ${dark1} 0%, ${dark2} 60%, ${dark3} 100%) !important;
      }

      /* 2. SIDEBAR BRAND ICON & HEADER */
      .brand-icon-box {
        background: linear-gradient(135deg, ${hex} 0%, ${hoverHex} 100%) !important;
        box-shadow: 0 4px 14px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important;
      }

      .brand-subtitle {
        color: ${lightHex} !important;
      }

      /* 3. ACTIVE STORE BADGE */
      .sidebar-store-pill {
        background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.14) !important;
        border: 1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important;
      }

      .sidebar-store-pill .text-emerald,
      .sidebar-store-pill i {
        color: ${lightHex} !important;
      }

      .sidebar-store-pill .store-label {
        color: ${lightHex} !important;
      }

      /* 4. SIDEBAR MENU ITEMS & ACTIVE HIGHLIGHTS */
      .menu-item.root-item:hover,
      .menu-item.root-item.active,
      .menu-item.active,
      .sidebar-nav a.active {
        background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22) !important;
        color: #ffffff !important;
      }

      .menu-item.root-item.active::before,
      .menu-item.active::before {
        background: ${hex} !important;
      }

      .menu-icon,
      .menu-item:hover .menu-icon,
      .menu-item.active .menu-icon {
        color: ${lightHex} !important;
      }

      .badge-live-pulse {
        background: ${hex} !important;
        color: #ffffff !important;
      }

      /* 5. SUBMENUS & SUBMENU ITEMS */
      .sub-menu {
        border-left-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35) !important;
      }

      .sub-menu-item:hover,
      .sub-menu-item.active,
      .sub-menu-item[routerLinkActive="active"] {
        background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18) !important;
        color: #ffffff !important;
      }

      .sub-menu-item.active .sub-icon,
      .sub-menu-item:hover .sub-icon {
        color: ${lightHex} !important;
      }

      /* 6. PRIMARY BUTTONS & ACTION CONTROLS */
      .btn-save-top,
      .btn-save-main,
      .btn-primary,
      .btn-submit-top,
      .btn-save-settings,
      .btn-create-submit {
        background: linear-gradient(135deg, ${hex} 0%, ${hoverHex} 100%) !important;
        box-shadow: 0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35) !important;
        border-color: ${hex} !important;
        color: #ffffff !important;
      }

      .btn-save-top:hover:not(:disabled),
      .btn-save-main:hover:not(:disabled),
      .btn-primary:hover:not(:disabled),
      .btn-submit-top:hover:not(:disabled) {
        background: linear-gradient(135deg, ${hoverHex} 0%, ${dark1} 100%) !important;
        box-shadow: 0 6px 16px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45) !important;
      }

      /* 7. SETTINGS TABS & ACTIVE INDICATORS */
      .tab-btn.active,
      .settings-nav-tabs .tab-btn.active {
        background: ${hex} !important;
        color: #ffffff !important;
        border-color: ${hex} !important;
        box-shadow: 0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important;
      }

      /* 8. GENERAL ACCENTS & ICONS */
      .text-emerald,
      .text-theme {
        color: ${hex} !important;
      }

      .bg-theme {
        background-color: ${hex} !important;
        color: #ffffff !important;
      }

      .badge-theme {
        background: ${hex} !important;
        color: #ffffff !important;
      }

      /* 9. INPUT FOCUS RINGS */
      .modern-input:focus,
      .custom-input:focus,
      .custom-select:focus,
      .custom-textarea:focus {
        border-color: ${hex} !important;
        box-shadow: 0 0 0 3px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22) !important;
      }
    `;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const clean = hex.replace('#', '');
    if (clean.length === 6) {
      return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
      };
    }
    return null;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const clamped = Math.max(0, Math.min(255, n));
      const s = clamped.toString(16);
      return s.length === 1 ? '0' + s : s;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

