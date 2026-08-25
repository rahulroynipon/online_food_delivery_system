/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { colors } from '../tokens/colors';
import { createThemeVariables, serializeThemeVariables } from './createThemeVariables';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THEMES_DIR = path.join(__dirname, '../themes');

function generate() {
  console.log('Generating themes from design tokens...');

  // Generate Light Theme
  const lightVars = createThemeVariables(colors.light);
  const lightCss = `:root, .light {\n${serializeThemeVariables(lightVars)}\n}\n`;
  fs.writeFileSync(path.join(THEMES_DIR, 'light.css'), lightCss);
  console.log('✓ Generated light.css');

  // Generate Dark Theme
  const darkVars = createThemeVariables(colors.dark);
  const darkCss = `.dark {\n${serializeThemeVariables(darkVars)}\n}\n`;
  fs.writeFileSync(path.join(THEMES_DIR, 'dark.css'), darkCss);
  console.log('✓ Generated dark.css');

  // Generate Brand Theme
  const brandVars = createThemeVariables(colors.brand);
  const brandCss = `.brand {\n${serializeThemeVariables(brandVars)}\n}\n`;
  fs.writeFileSync(path.join(THEMES_DIR, 'brand.css'), brandCss);
  console.log('✓ Generated brand.css');

  // Generate Forest Theme
  const forestVars = createThemeVariables((colors as any).forest);
  const forestCss = `.forest {\n${serializeThemeVariables(forestVars)}\n}\n`;
  fs.writeFileSync(path.join(THEMES_DIR, 'forest.css'), forestCss);
  console.log('✓ Generated forest.css');

  console.log('All themes generated successfully!');
}

generate();
