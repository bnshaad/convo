# Neo Chat - Project Memory & Context

## 1. Project Specifications
- **Framework**: Next.js 16 (App Router)
- **State Management**: Zustand with `persist` middleware for settings and session.
- **Styling**: Vanilla CSS with Tailwind-like utility classes (defined in `globals.css`).
- **Design System**: Neobrutalism (Thick borders, high contrast, zero border-radius, offset shadows).
- **Authentication**: Firebase Authentication (Email/Password strictly enforced).
- **Backend**: Firebase Firestore (real-time database), Firebase Storage (media uploads).
- **Real-time Features**: Firestore onSnapshot listeners for live messages, typing indicators, and user presence.

## 2. Directory Structure
```text
/src
├── app/                     // Next.js App Router
│   ├── (app)/               // Protected routes (AuthGuard enforced)
│   │   ├── chats/           // Chat interface with real-time subscriptions
│   │   │   └── [id]/        // Individual conversation view
│   │   ├── settings/        // User preferences
│   │   └── ...              // Notifications, Profile, Media, Search
│   ├── (auth)/              // Auth routes (Login, Register)
│   ├── onboarding/          // Welcome flow
│   ├── layout.tsx           // Global layout with PresenceProvider
│   └── page.tsx             // Landing page
├── components/
│   ├── ui/                  // Neobrutalist UI components (NbButton, NbCard, etc.)
│   ├── chat/                // ChatInitializer for auto-subscriptions
│   ├── providers/           // PresenceProvider for online status
│   ├── auth/                // AuthGuard & SessionSync components
│   └── layout/              // Navigation and layout components
├── lib/                     // Utilities and shared logic
│   ├── services/            // NEW: Service layer (chatService, userService)
│   ├── firebase.ts          // Firebase app initialization
│   └── nb.ts                // Neobrutalist utility (cn)
├── store/                   // Zustand stores (ZustandProvider enforced)
│   ├── useAuthStore.ts      // Firebase Auth state
│   ├── useChatStore.ts      // Chat state (Delegates to chatService)
│   └── useSettingsStore.ts  // Persistent user preferences
├── hooks/                   // Custom React hooks
│   └── usePresence.ts       // User online/offline tracking
├── vercel.json              // Vercel deployment configuration
├── middleware.ts            // Route protection & redirection
└── ...

Root Firebase Config:
├── firebase.json            // Firebase services configuration
├── .firebaserc              // Project association (convo-d5171)
├── firestore.rules          // Security rules for data access
├── firestore.indexes.json   // Query performance indexes
└── storage.rules            // Storage security rules
```

## 3. Core Features
- **Firebase Authentication**: Email/Password and Anonymous sign-in with real user accounts.
- **Real-time Chat**: Live message synchronization via Firestore onSnapshot listeners.
- **Conversations**: Create, join, and leave group chats with unread message counters.
- **Message Features**: Send, edit, delete messages; add emoji reactions; reply to messages.
- **Typing Indicators**: Real-time typing status showing who's currently typing.
- **User Presence**: Online/offline status tracking with heartbeat updates.
- **Notifications**: Real-time notification system for new messages.
- **Guest Access**: REMOVED (Production requirement for authenticated-only access).
- **Persistent Settings**: User preferences saved to `localStorage` via Zustand persist.
- **Onboarding**: Multi-slide welcome flow for new users.

## 4. Key Work History
- **Initial Setup**: Next.js 16 boilerplate with Neobrutalist design primitives.
- **State Implementation**: Established Zustand stores for decoupled state management.
- **Auth & Protection**: Implemented `middleware.ts` to enforce auth requirement on `/app` routes.
- **System Hardening**: 
  - Fixed Guest flow to prevent redirection loops.
  - Implemented `useSettingsStore` with persistence to solve "settings not saving" issue.
  - Linked Landing Page to Auth Store for streamlined entry.
- **Dark Mode Implementation**: Connected `darkMode` state to global adaptive CSS variables and refined all UI components for a "Dark Neobrutalist" look.
- **Search & Notifications**: Implemented filtering logic and a dedicated notifications center with state-driven actions.
- **Design System Audit**: Performed a full visual audit to enforce zero `border-radius` and theme-aware shadows across all pages.
- **Onboarding Optimization**: Implemented skip-logic for returning guests and a streamlined single-slide flow for new guests to reduce friction.

### Firebase Backend Integration (2026-04-21)
- **Firebase Setup**: Configured project `convo-d5171` with Authentication, Firestore, and Security Rules.
- **Firestore Database**: Implemented collections for:
  - `conversations` - Chat metadata with participant arrays
  - `conversations/{id}/messages` - Message subcollections with reactions
  - `conversations/{id}/typing` - Real-time typing indicators
  - `notifications` - User notification queue
  - `presence` - User online status tracking
- **Security Rules**: Deployed comprehensive rules ensuring:
  - Only conversation participants can read/write messages
  - Users can only edit/delete their own messages
  - Only conversation creators can delete conversations
  - Users can only access their own notifications
- **Chat Store Enhancement**: Full Firestore integration with:
  - Real-time subscriptions (conversations, messages, notifications, typing)
  - Message CRUD operations (create, edit, delete)
  - Emoji reactions system
  - Reply threading support
  - Conversation management (create, leave, delete)
  - Unread count tracking per user
- **Presence System**: Implemented user online/offline tracking using Firestore with heartbeat updates every 30 seconds.
- **Media Upload**: Firebase Storage integration for images and files (placeholder for future activation).
- **Component Updates**: 
  - Created `PresenceProvider` for global presence management
  - Created `ChatInitializer` for auto-subscription to user data
  - Updated all auth pages to use Firebase Authentication methods
  - Fixed login/register forms to use proper Firebase auth flows

### Production Stabilization & Audit (2026-04-21)
- **Refactoring**: Decoupled Firebase SDK logic into a dedicated **Service Layer** (`chatService.ts`, `userService.ts`), improving store simplicity and testability.
- **Security Enforcement**:
  - Completely **removed Guest/Anonymous access** across the entire app (UI, Auth logic, and Onboarding).
  - Implemented a robust client-side **AuthGuard** to protect the internal navigation group.
- **Feature Optimization**:
  - **Typing Indicator**: Implemented throttled updates (once per 4s) and guaranteed cleanup on unmount to reduce Firestore writes.
  - **Bulk Operations**: Implemented Firestore `WriteBatch` for `markRead` and `clearNotifications` to improve performance and data consistency.
  - **Media Integration**: Linked the lightbox gallery back to chat conversations for seamless context switching.
- **Production Readiness**:
  - Resolved **26 ESLint errors** (Cascading renders, Hook dependencies, Type safety) to guarantee zero build failures on Vercel.
  - Added `vercel.json` to handle SPA routing and deep-linking on production servers.
  - Verified local production build (`npm run build`) with 100% success rate.

## 5. Upcoming Roadmap
- [x] **Real Backend Integration**: Firebase Firestore + Authentication implemented.
- [ ] **Image Uploads**: Activate Firebase Storage for media sharing in chat.
- [ ] **Push Notifications**: Implement Firebase Cloud Messaging for offline notifications.
- [x] **User Search**: Add ability to search and invite users by email/username.
- [x] **Production Audit**: Full stabilization, lint-fixing, and security hardening complete.
- [ ] **Performance Optimization**: Implement message pagination for long histories.
- [ ] **Accessibility Audit**: Final pass on ARIA labels for Neobrutalist components.
