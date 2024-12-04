module.exports = {
  INTERNAL: {
    generateId: jest.fn(() => 'mocked-id'),
  },
  AssistantRuntimeProvider: ({ children }) => <div>{children}</div>,
  useExternalMessageConverter: jest.fn(() => ({
    id: 'mocked-id',
    content: 'mocked-content',
    role: 'user',
    status: { type: 'complete', reason: 'stop' },
  })),
  CompositeAttachmentAdapter: jest.fn(),
  TextContentPart: jest.fn(),
  useExternalStoreRuntime: jest.fn(),
};

// jest.mock('@assistant-ui/react', () => ({
//   INTERNAL: {
//     generateId: jest.fn(() => 'mocked-id'),
//   },
//   AttachmentAdapter: jest.fn(),
// }));