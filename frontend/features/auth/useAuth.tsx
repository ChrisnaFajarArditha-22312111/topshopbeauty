"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./authApi";
import {
  User,
  LoginInput,
  RegisterInput,
  VerifyEmailInput,
  TokenResponse,
  MessageResponse,
} from "./authTypes";
import { getAccessToken, clearTokens } from "@/lib/axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<TokenResponse>;
  register: (data: RegisterInput) => Promise<MessageResponse>;
  verifyEmail: (data: VerifyEmailInput) => Promise<MessageResponse>;
  resendVerification: (email: string) => Promise<MessageResponse>;
  googleLogin: (idToken: string) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [hasToken, setHasToken] = React.useState<boolean>(false);

  React.useEffect(() => {
    setHasToken(!!getAccessToken());
  }, []);

  // Query User Profile
  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        return await authApi.getCurrentUser();
      } catch {
        clearTokens();
        setHasToken(false);
        return null;
      }
    },
    enabled: hasToken,
    staleTime: 1000 * 60 * 5, // 5 menit
    retry: 1,
  });

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      setHasToken(true);
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Berhasil masuk!", {
        description: "Selamat datang kembali di Topshop Kosmetik.",
      });
    },
  });

  // Google Login Mutation
  const googleLoginMutation = useMutation({
    mutationFn: authApi.googleAuth,
    onSuccess: async () => {
      setHasToken(true);
      await refetch();
      toast.success("Berhasil masuk dengan Google!");
    },
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
  });

  // Verify Email Mutation
  const verifyEmailMutation = useMutation({
    mutationFn: authApi.verifyEmail,
  });

  // Resend Verification Mutation
  const resendVerificationMutation = useMutation({
    mutationFn: authApi.resendVerification,
  });

  // Logout Handler
  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearTokens();
      setHasToken(false);
      queryClient.setQueryData(["currentUser"], null);
      queryClient.removeQueries();
      toast.info("Anda telah keluar");
      router.push("/");
    }
  };

  const value: AuthContextType = {
    user: user ?? null,
    isLoading: hasToken ? isLoading : false,
    isAuthenticated: !!user,
    login: async (credentials: LoginInput) => {
      return await loginMutation.mutateAsync(credentials);
    },
    register: async (data: RegisterInput) => {
      return await registerMutation.mutateAsync(data);
    },
    verifyEmail: async (data: VerifyEmailInput) => {
      return await verifyEmailMutation.mutateAsync(data);
    },
    resendVerification: async (email: string) => {
      return await resendVerificationMutation.mutateAsync(email);
    },
    googleLogin: async (idToken: string) => {
      return await googleLoginMutation.mutateAsync(idToken);
    },
    logout,
    refetchUser: () => refetch(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
