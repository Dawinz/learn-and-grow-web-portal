# Project Structure Recommendations

## Option 1: Separate Repositories (Recommended)

**Structure:**
```
learn-and-grow-web-portal/     (Current repo)
├── apps/web/                  # Next.js web app
├── packages/api-client/       # Shared TypeScript API client
└── supabase/                  # Backend (shared by both)

learn-and-grow-mobile/         (Separate Flutter repo)
├── lib/
├── android/
├── ios/
└── pubspec.yaml
```

**Pros:**
- ✅ Cleaner separation of concerns
- ✅ Smaller repo sizes
- ✅ Independent versioning and releases
- ✅ Different CI/CD pipelines
- ✅ Easier to manage dependencies

**Cons:**
- ❌ API client needs to be duplicated or shared via package
- ❌ Two repos to maintain

**How to Share API Types:**
- Export TypeScript types from `packages/api-client`
- Generate Dart types from TypeScript (using tools like `json_serializable` with OpenAPI)
- Or manually maintain matching types in both repos

---

## Option 2: Monorepo (All-in-One)

**Structure:**
```
learn-and-grow-web-portal/
├── apps/
│   ├── web/                   # Next.js web app
│   └── mobile/                # Flutter mobile app
├── packages/
│   └── api-client/            # Shared API client (TypeScript)
├── supabase/                  # Backend (shared)
└── scripts/
```

**Pros:**
- ✅ Everything in one place
- ✅ Easier to share types/constants
- ✅ Single source of truth
- ✅ Easier cross-platform development

**Cons:**
- ❌ Large repository size
- ❌ Slower git operations
- ❌ Mixed tech stacks in one repo
- ❌ More complex CI/CD setup

---

## Recommendation: **Option 1 (Separate Repos)**

**Why:**
1. **Size**: Flutter projects can be 100MB+ with dependencies
2. **Tech Stack**: Dart/Flutter vs TypeScript/Next.js are very different
3. **Deployment**: Mobile apps deploy to App Store/Play Store, web deploys to Vercel
4. **Team**: Different developers might work on mobile vs web

**What to Share:**
- API documentation (already have `MOBILE_API_DESIGN.md`)
- API endpoint URLs and structure
- Type definitions (export from TypeScript, generate Dart equivalents)

---

## If You Choose Monorepo

If you decide to add the Flutter app here, structure it as:

```
apps/
├── web/                       # Next.js (existing)
└── mobile/                    # Flutter (new)
    ├── lib/
    ├── android/
    ├── ios/
    ├── pubspec.yaml
    └── README.md
```

**Add to `.gitignore`:**
```
# Flutter
apps/mobile/.dart_tool/
apps/mobile/.flutter-plugins
apps/mobile/.flutter-plugins-dependencies
apps/mobile/.packages
apps/mobile/.pub-cache/
apps/mobile/.pub/
apps/mobile/build/
apps/mobile/.ios/
apps/mobile/.android/
```

---

## My Recommendation

**Keep them separate**, but:

1. **Document the API** (✅ Already done in `MOBILE_API_DESIGN.md`)
2. **Share API client logic** via:
   - Export TypeScript types from `packages/api-client`
   - Create matching Dart models in Flutter app
   - Use the same API endpoint URLs

3. **Sync regularly**:
   - When API changes, update both repos
   - Use the same Supabase backend (already shared)
   - Keep API documentation in sync

This gives you the benefits of separation while maintaining consistency.

