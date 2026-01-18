/**
 * SDUI Component Registration
 *
 * Registers all built-in React components with the SDUI registry.
 * Import this file to enable all standard SDUI components.
 */

import { lazy } from 'react';
import { registerComponents } from './registry';

// Lazy load all components
// We use a helper to map named exports to default exports for React.lazy
const load = (importPromise: Promise<any>, name: string) =>
  importPromise.then((module: any) => ({ default: module[name] }));

const Button = lazy(() => load(import('../components/react/Button'), 'Button'));
const Text = lazy(() => load(import('../components/react/Text'), 'Text'));
const Container = lazy(() => load(import('../components/react/Container'), 'Container'));
const Card = lazy(() => load(import('../components/react/Card'), 'Card'));
const Hero = lazy(() => load(import('../components/react/Hero'), 'Hero'));
const List = lazy(() => load(import('../components/react/List'), 'List'));
const Input = lazy(() => load(import('../components/react/Input'), 'Input'));
const Image = lazy(() => load(import('../components/react/Image'), 'Image'));
const Badge = lazy(() => load(import('../components/react/Badge'), 'Badge'));
const Divider = lazy(() => load(import('../components/react/Divider'), 'Divider'));
const Spacer = lazy(() => load(import('../components/react/Spacer'), 'Spacer'));
const ThemeSwitcher = lazy(() => load(import('./theme/ThemeSwitcher'), 'ThemeSwitcher'));
const Tabs = lazy(() => load(import('../components/react/Tabs'), 'Tabs'));

/**
 * Register all built-in SDUI components
 */
export function registerSDUIComponents(): void {
  registerComponents([
    {
      name: 'Button',
      component: Button,
    },
    {
      name: 'Text',
      component: Text,
    },
    {
      name: 'Container',
      component: Container,
    },
    {
      name: 'Card',
      component: Card,
    },
    {
      name: 'Hero',
      component: Hero,
    },
    {
      name: 'List',
      component: List,
    },
    {
      name: 'Input',
      component: Input,
    },
    {
      name: 'Image',
      component: Image,
    },
    {
      name: 'Badge',
      component: Badge,
    },
    {
      name: 'Divider',
      component: Divider,
    },
    {
      name: 'Spacer',
      component: Spacer,
    },
    {
      name: 'ThemeSwitcher',
      component: ThemeSwitcher,
    },
    {
      name: 'Tabs',
      component: Tabs,
    },
  ]);
}

// Auto-register on import
registerSDUIComponents();
