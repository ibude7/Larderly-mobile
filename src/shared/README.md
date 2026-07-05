# Shared package (vendored)

These files are copied from the Larderly web monorepo package `@larderly/shared`
(`packages/shared` in the main Larderly repo).

**Do not edit casually** — keep in sync with web when mappers or constants change.

| File | Exports |
|------|---------|
| `constants.ts` | `DEFAULT_STORAGE_LOCATIONS` |
| `householdMapper.ts` | Inventory ↔ pantry mappers, location mapper |
| `shoppingMapper.ts` | Shopping list item mapper |
| `utils.ts` | Date/timestamp helpers |
| `index.ts` | Re-exports |

Import via `from '../shared'` or `from '../../shared'` in app code.
