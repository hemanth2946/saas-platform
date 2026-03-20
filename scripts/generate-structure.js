#!/usr/bin/env node
// Run from project root: node generate-structure.js

const fs = require('fs');
const path = require('path');

const base = process.cwd();

const folders = [
    // App Router pages
    'app/[orgId]/dashboard',
    'app/[orgId]/iam',
    'app/[orgId]/billing',
    'app/[orgId]/settings',
    'app/(auth)',
    'app/api/auth',

    // Components grouped by purpose
    'components/layout',
    'components/forms',
    'components/guards',
    'components/charts',
    'components/tables',

    // Core lib
    'lib/api',
    'lib/utils',
    'lib/validations',

    // State, types, hooks
    'hooks',
    'store',
    'types',

    // Server-only code
    'server/auth',
    'server/db',

    // Config
    'config',

    // Public assets
    'public/images',
    'public/icons',
];

const files = [
    // Barrel exports
    { path: 'types/index.ts', content: '// Global TypeScript types\nexport {};\n' },
    { path: 'hooks/index.ts', content: '// Custom React hooks\nexport {};\n' },
    { path: 'store/index.ts', content: '// Zustand stores\nexport {};\n' },
    { path: 'config/index.ts', content: '// App config & env validation\nexport {};\n' },
    { path: 'lib/api/index.ts', content: '// Typed API functions\nexport {};\n' },
    { path: 'lib/utils/index.ts', content: '// Utility functions\nexport {};\n' },
    { path: 'lib/validations/index.ts', content: '// Zod validation schemas\nexport {};\n' },
    { path: 'components/layout/index.ts', content: '// Layout components\nexport {};\n' },
    { path: 'components/forms/index.ts', content: '// Form components\nexport {};\n' },
    { path: 'components/guards/index.ts', content: '// Guard & gate components\nexport {};\n' },
    { path: 'components/charts/index.ts', content: '// Chart components\nexport {};\n' },
    { path: 'components/tables/index.ts', content: '// Table components\nexport {};\n' },
    { path: 'server/db/index.ts', content: '// Prisma client singleton\nexport {};\n' },
    { path: 'server/auth/index.ts', content: '// Auth helpers (server-only)\nexport {};\n' },

    // Placeholder middleware (will be replaced in 1E)
    {
        path: 'middleware.ts', content: `// Next.js middleware — auth guard
// Full implementation in Phase 1E
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
` },
];

console.log('\n🏗  Generating SaaS platform folder structure...\n');

// Create folders
folders.forEach((folder) => {
    const fullPath = path.join(base, folder);
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  ✅ ${folder}/`);
});

// Create files
files.forEach(({ path: filePath, content }) => {
    const fullPath = path.join(base, filePath);
    if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content);
        console.log(`  📄 ${filePath}`);
    } else {
        console.log(`  ⏭  ${filePath} (already exists, skipped)`);
    }
});

console.log('\n✅ Folder structure generated successfully!\n');
console.log('Next step: Update tsconfig.json path aliases\n');
