import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { LoginDto, RegisterDto } from '@/types';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: (data: LoginDto) => authApi.login(data),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.accessToken);
      queryClient.invalidateQueries();
      router.push('/');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterDto) => authApi.register(data),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.accessToken);
      queryClient.invalidateQueries();
      router.push('/');
    },
  });

  const logout = () => {
    clearAuth();
    queryClient.clear();
    router.push('/login');
  };

  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await authApi.getMe();
      return response.data;
    },
    enabled: isAuthenticated(),
    retry: false,
  });

  return {
    user: currentUser || user,
    accessToken,
    isAuthenticated: isAuthenticated(),
    isLoading: loginMutation.isPending || registerMutation.isPending || isLoadingUser,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
