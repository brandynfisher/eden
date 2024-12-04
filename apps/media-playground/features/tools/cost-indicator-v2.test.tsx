// import React from 'react';
// import { render, screen, waitFor } from '@testing-library/react';
// import { describe, expect, it, jest, beforeEach } from '@jest/globals';
// import CostIndicatorV2 from '@/features/tools/cost-indicator-v2';
// import * as UseAuthStateModule from '@/hooks/use-auth-state';
// import { useFormContext } from 'react-hook-form';
// import { useCostCalculation } from '@/hooks/use-cost-calculation';
// import * as ClerkNextJs from '@clerk/nextjs';
//
// // Comprehensive module mocking with ESM support
// jest.mock('@/hooks/use-auth-state', () => ({
//   // __esModule: true,
//   useAuthState: jest.fn(),
// }));
//
// jest.mock('@clerk/nextjs', () => ({
//   __esModule: true,
//   useClerk: jest.fn(() => ({
//     openSignIn: jest.fn(),
//   })),
//   useAuth: jest.fn(() => ({
//     isSignedIn: true,
//   })),
// }));
//
// jest.mock('react-hook-form', () => ({
//   __esModule: true,
//   useFormContext: jest.fn(),
// }));
//
// jest.mock('@/hooks/use-cost-calculation', () => ({
//   __esModule: true,
//   useCostCalculation: jest.fn(),
//   getCostConfig: jest.fn(() => ({})),
// }));
//
// jest.mock('@/components/loading-indicator', () => () => (
//   <div data-testid="loading-indicator">Loading...</div>
// ));
//
// describe('CostIndicatorV2', () => {
//   const mockAuthState = {
//     verifyAuth: jest.fn().mockResolvedValue(true),
//     user: null,
//     balance: 100,
//     foreverBalance: 50,
//     subscriptionBalance: 25,
//     hasMinimumSubscriptionTier: true,
//     hasEden2EarlyAccess: true,
//     hasAssistantAccess: true,
//     isSignedIn: true,
//     refetchMe: jest.fn(),
//   };
//
//   const mockFormValues = { width: 1024, prompts: ['prompt1', 'prompt2'] };
//
//   beforeEach(() => {
//     // Reset all mocks
//     jest.resetAllMocks();
//
//     // Explicitly mock the imported hooks
//     (UseAuthStateModule.useAuthState as jest.Mock).mockReturnValue(mockAuthState);
//
//     (ClerkNextJs.useClerk as jest.Mock).mockReturnValue({
//       openSignIn: jest.fn(),
//     });
//
//     (ClerkNextJs.useAuth as jest.Mock).mockReturnValue({
//       isSignedIn: true,
//     });
//
//     (useFormContext as jest.Mock).mockReturnValue({
//       watch: jest.fn((paramNames: string[]) =>
//         paramNames.map(name => mockFormValues[name] || 0),
//       ),
//     });
//
//     (useCostCalculation as jest.Mock).mockReturnValue({
//       calculateCost: jest.fn((formula: string, config: object) =>
//         formula.includes('prompts.length') ? 10 : 50,
//       ),
//     });
//   });
//
//   it('mocks useAuthState', () => {
//     const { balance } = UseAuthStateModule.useAuthState();
//     expect(balance).toBe(100);
//   });
//
//   it('renders the loading indicator during suspense', async () => {
//     render(<CostIndicatorV2 formula="width / prompts.length" />);
//     expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
//     await waitFor(() => {
//       expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
//     });
//   });
// });
