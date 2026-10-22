import fs from 'fs';

const path = 'src/components/MenuHeader.tsx';
let s = fs.readFileSync(path, 'utf8');

s = s.replace(
  `import { colors, fonts, radii, spacing } from '@/src/theme';`,
  `import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import type { AppColors } from '@/src/theme';`,
);

s = s.replace(
  'function LoginMark({ provider }: { provider: SocialProvider }) {',
  'function LoginMark({ provider, colors, styles }: { provider: SocialProvider; colors: AppColors; styles: Record<string, object> }) {',
);

s = s.replace(
  `export function MenuHeader({ title, caption }: Props) {
  const router = useRouter();`,
  `export function MenuHeader({ title, caption }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();`,
);

s = s.replace(
  '<LoginMark provider={provider} />',
  '<LoginMark provider={provider} colors={colors} styles={styles} />',
);

s = s.replace(
  `  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: '#FDE8E6',
    borderWidth: 1,
    borderColor: '#F5B7B1',
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#D6453D',
  },`,
  `  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerLine,
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.danger,
  },`,
);

s = s.replace('const styles = StyleSheet.create({', 'const createStyles = (colors: AppColors) => StyleSheet.create({');

fs.writeFileSync(path, s);
console.log('patched', path);
