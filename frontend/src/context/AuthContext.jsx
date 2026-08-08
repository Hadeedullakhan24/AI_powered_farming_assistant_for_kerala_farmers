// Re-export everything from the TypeScript version to avoid duplicate context instances.
// Having two separate files (AuthContext.jsx and AuthContext.tsx) caused a blank screen
// because they each created a different React context object, so components using
// useAuth() from this file couldn't see the AuthProvider from the .tsx file.
export { AuthProvider, useAuth, default } from './AuthContext.tsx'
