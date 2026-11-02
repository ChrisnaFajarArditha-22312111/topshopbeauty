import api, { setTokens, clearTokens } from "@/lib/axios";
import {
  User,
  TokenResponse,
  MessageResponse,
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ForgotPasswordInput,
  VerifyResetCodeInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "./authTypes";

export const authApi = {
  // Register user baru
  register: async (data: RegisterInput): Promise<MessageResponse> => {
    const res = await api.post<MessageResponse>("/auth/register", data);
    return res.data;
  },

  // Verifikasi email dengan kode OTP 6-digit
  verifyEmail: async (data: VerifyEmailInput): Promise<MessageResponse> => {
    const res = await api.post<MessageResponse>("/auth/verify-email", data);
    return res.data;
  },

  // Kirim ulang kode verifikasi OTP
  resendVerification: async (email: string): Promise<MessageResponse> => {
    const res = await api.post<MessageResponse>("/auth/resend-verification", {
      email,
    });
    return res.data;
  },

  // Login dengan email & password
  login: async (data: LoginInput): Promise<TokenResponse> => {
    const res = await api.post<TokenResponse>("/auth/login", data);
    setTokens(res.data.access_token, res.data.refresh_token);
    return res.data;
  },

  // Login / Register dengan Google ID Token
  googleAuth: async (idToken: string): Promise<TokenResponse> => {
    const res = await api.post<TokenResponse>("/auth/google", {
      id_token: idToken,
    });
    setTokens(res.data.access_token, res.data.refresh_token);
    return res.data;
  },

  // Permintaan reset password (kirim OTP)
  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const res = await api.post<MessageResponse>("/auth/forgot-password", {
      email,
    });
    return res.data;
  },

  // Verifikasi kode OTP reset password
  verifyResetCode: async (data: VerifyResetCodeInput): Promise<MessageResponse> => {
    const res = await api.post<MessageResponse>("/auth/verify-reset-code", data);
    return res.data;
  },

  // Tetapkan password baru
  resetPassword: async (data: ResetPasswordInput): Promise<MessageResponse> => {
    const res = await api.post<MessageResponse>("/auth/reset-password", data);
    return res.data;
  },

  // Logout pengguna
  logout: async (): Promise<MessageResponse> => {
    try {
      const res = await api.post<MessageResponse>("/auth/logout");
      clearTokens();
      return res.data;
    } catch {
      clearTokens();
      return { message: "Berhasil logout" };
    }
  },

  // Ambil data user yang sedang login
  getCurrentUser: async (): Promise<User> => {
    const res = await api.get<User>("/users/me");
    return res.data;
  },

  // Ubah password saat login
  changePassword: async (data: ChangePasswordInput): Promise<MessageResponse> => {
    const res = await api.post<MessageResponse>("/users/change-password", data);
    return res.data;
  },
};
