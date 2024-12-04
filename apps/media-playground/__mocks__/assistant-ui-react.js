module.exports = {
  INTERNAL: {
    generateId: jest.fn(() => 'mocked-id'),
  },
  AssistantRuntimeProvider: ({ children }) => <div>{children}</div>,
};

// jest.mock('@assistant-ui/react', () => ({
//   INTERNAL: {
//     generateId: jest.fn(() => 'mocked-id'),
//   },
//   AttachmentAdapter: jest.fn(),
// }));