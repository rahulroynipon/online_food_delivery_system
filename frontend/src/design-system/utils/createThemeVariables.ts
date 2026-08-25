import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { animations } from '../tokens/animations';

export function createThemeVariables(themeColors: Record<string, string>) {
  const variables: Record<string, string> = {};

  // 1. Map Colors
  Object.entries(themeColors).forEach(([key, val]) => {
    // e.g. primary -> --color-primary
    // kebab case conversion or straightforward mapping:
    const variableName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    variables[variableName] = val;
  });

  // 2. Map Radius
  Object.entries(radius).forEach(([key, val]) => {
    variables[`--radius-${key}`] = val;
  });

  // 3. Map Shadows
  Object.entries(shadows).forEach(([key, val]) => {
    variables[`--shadow-${key}`] = val;
  });

  // 4. Map Typography fontFamilies
  Object.entries(typography.fontFamilies).forEach(([key, val]) => {
    variables[`--font-${key}`] = val;
  });

  // 5. Map Typography fontSizes
  Object.entries(typography.fontSizes).forEach(([key, val]) => {
    variables[`--font-size-${key}`] = val;
  });

  // 6. Map Typography fontWeights
  Object.entries(typography.fontWeights).forEach(([key, val]) => {
    variables[`--font-weight-${key}`] = val;
  });

  // 7. Map Spacing
  Object.entries(spacing).forEach(([key, val]) => {
    variables[`--spacing-${key}`] = val;
  });

  // 8. Map Animations
  Object.entries(animations.durations).forEach(([key, val]) => {
    variables[`--duration-${key}`] = val;
  });
  Object.entries(animations.easings).forEach(([key, val]) => {
    variables[`--easing-${key}`] = val;
  });

  return variables;
}

export function serializeThemeVariables(variables: Record<string, string>): string {
  return Object.entries(variables)
    .map(([key, val]) => `  ${key}: ${val};`)
    .join('\n');
}
