## How it works

`@edenlabs/eden-react` ships two entry points that re-export the same component name from platform-specific files:

- `src/index.ts` re-exports `TypographyH1` from `./components/typography/TypographyH1.web`. After the `tsup` build, that becomes `dist/index.js`, which is the file referenced by the package's `module` field and by the `exports` map (`{ ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" } }`).
- `src/index.native.ts` re-exports the native version from `./components/typography/TypographyH1.native`, producing `dist/index.native.js`/`.cjs`. The `package.json` also declares `"react-native": "./dist/index.native.cjs"` as the platform-specific entry.

When you write:

```ts
import { TypographyH1 } from '@edenlabs/eden-react';
```

then the bundler behaves as follows:

1. Web or Next.js: webpack (or Turbopack) follows the `exports.import` -> `./dist/index.js` path. That file, built from `index.ts`, pulls in the `.web.tsx` implementation.
2. Expo or React Native: Metro's resolver looks at `["react-native", "browser", "main"]` by default. Because the package sets the `"react-native"` field to `./dist/index.native.cjs`, Metro uses that build, which imports the `.native.tsx` component.

The actual component selection therefore happens inside those compiled index files; once Metro or webpack has picked the top-level entry for its platform, that entry exports the right implementation. TypeScript sees the shared `.d.ts` file (`dist/index.d.ts`) for both cases, so the API surface remains the same no matter which runtime pulls it in.
