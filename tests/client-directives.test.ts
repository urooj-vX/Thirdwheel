import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Client Directives Verification', () => {
  it('ensures all TSX components using hooks, handlers, or GSAP carry the "use client" directive', () => {
    function getAllTsxFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getAllTsxFiles(filePath));
        } else if (filePath.endsWith('.tsx')) {
          results.push(filePath);
        }
      });
      return results;
    }

    const srcDir = path.resolve(process.cwd(), 'src');
    const tsxFiles = getAllTsxFiles(srcDir);

    const clientHookPatterns = ['useState', 'useEffect', 'useRef', 'useCallback', 'gsap', 'onClick'];

    tsxFiles.forEach((file) => {
      const relativePath = path.relative(process.cwd(), file);
      // Skip layout.tsx as it is a server component
      if (relativePath.includes('layout.tsx')) return;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      const needsClientDirective = clientHookPatterns.some((pattern) => content.includes(pattern));

      if (needsClientDirective) {
        const firstNonEmptyLine = lines.find((l) => l.trim().length > 0) || '';
        const hasUseClient = firstNonEmptyLine.includes("'use client'") || firstNonEmptyLine.includes('"use client"');

        expect(
          hasUseClient,
          `File ${relativePath} uses client hooks/GSAP/handlers but is missing 'use client'; as the first line!`
        ).toBe(true);
      }
    });
  });
});
