import { render, screen, fireEvent } from '@testing-library/react';
import { AiPlanGenerator } from '@/components/ai-plan-generator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockMutate = jest.fn();
const mockMutationState = {
  mutate: mockMutate,
  isPending: false,
  error: null as Error | null,
  isError: false,
};

// Mock useMutation
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useMutation: () => mockMutationState,
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('AiPlanGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutationState.isPending = false;
    mockMutationState.error = null;
    mockMutationState.isError = false;
  });

  it('renders correctly', () => {
    render(<AiPlanGenerator eventId="test-event-id" />, { wrapper });
    
    expect(screen.getByText('Wygeneruj swój plan startowy')).toBeInTheDocument();
    expect(screen.getByText(/Na podstawie szczegółów wydarzenia/)).toBeInTheDocument();
    expect(screen.getByText('Wygeneruj plan AI')).toBeInTheDocument();
  });

  it('shows loading state when mutation is pending', () => {
    mockMutationState.isPending = true;
    
    render(<AiPlanGenerator eventId="test-event-id" />, { wrapper });
    
    expect(screen.getByText('Generowanie...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls mutate when button is clicked', () => {
    render(<AiPlanGenerator eventId="test-event-id" />, { wrapper });
    
    const button = screen.getByText('Wygeneruj plan AI');
    fireEvent.click(button);
    
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('displays error message when mutation fails', () => {
    const errorMessage = 'Failed to generate plan';
    mockMutationState.error = new Error(errorMessage);
    mockMutationState.isError = true;
    
    render(<AiPlanGenerator eventId="test-event-id" />, { wrapper });
    
    expect(screen.getByText(`Błąd: ${errorMessage}`)).toBeInTheDocument();
  });
});
