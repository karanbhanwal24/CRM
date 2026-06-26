import {
  PropsWithChildren,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { apiClient, publicApiClient } from "../lib/api";
import {
  clearAuthStorage,
  getStoredTokens,
  getStoredUser,
  setStoredTokens,
  setStoredUser,
} from "../lib/auth-storage";
import type { AuthTokens, AuthUser, UserRole } from "../types/auth";

type LoginPayload = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type RefreshResponse = {
  access: string;
  refresh?: string;
};

let refreshPromise: Promise<AuthTokens | null> | null = null;

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const tokensRef = useRef<AuthTokens | null>(getStoredTokens());

  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use((config) => {
      const accessToken = tokensRef.current?.access;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status !== 401 || originalRequest?._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;
        const refreshedTokens = await refreshAccessToken(tokensRef.current?.refresh ?? null);
        if (!refreshedTokens) {
          resetAuthState();
          return Promise.reject(error);
        }

        tokensRef.current = refreshedTokens;
        originalRequest.headers.Authorization = `Bearer ${refreshedTokens.access}`;
        return apiClient(originalRequest);
      }
    );

    void bootstrapSession();

    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  async function bootstrapSession(): Promise<void> {
    const currentTokens = tokensRef.current;
    if (!currentTokens?.refresh) {
      setIsBootstrapping(false);
      return;
    }

    const refreshedTokens = await refreshAccessToken(currentTokens.refresh);
    if (!refreshedTokens) {
      resetAuthState();
      setIsBootstrapping(false);
      return;
    }

    tokensRef.current = refreshedTokens;

    try {
      const response = await apiClient.get<AuthUser>("/auth/me/");
      startTransition(() => {
        setUser(response.data);
        setStoredUser(response.data);
      });
    } catch {
      resetAuthState();
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function login(payload: LoginPayload): Promise<void> {
    const response = await publicApiClient.post<AuthTokens & { user: AuthUser }>("/auth/login/", payload);
    tokensRef.current = {
      access: response.data.access,
      refresh: response.data.refresh,
    };
    setStoredTokens(tokensRef.current);
    setStoredUser(response.data.user);
    startTransition(() => {
      setUser(response.data.user);
    });
  }

  async function logout(): Promise<void> {
    try {
      if (tokensRef.current?.refresh) {
        await apiClient.post("/auth/logout/", { refresh: tokensRef.current.refresh });
      }
    } catch {
      // Local cleanup must still happen if the server rejects an expired token.
    } finally {
      resetAuthState();
    }
  }

  function hasRole(role: UserRole | UserRole[]): boolean {
    if (!user) {
      return false;
    }
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }

  function resetAuthState(): void {
    tokensRef.current = null;
    clearAuthStorage();
    startTransition(() => {
      setUser(null);
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isBootstrapping,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

async function refreshAccessToken(refreshToken: string | null): Promise<AuthTokens | null> {
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = publicApiClient
      .post<RefreshResponse>("/auth/refresh/", { refresh: refreshToken })
      .then((response) => {
        const nextTokens = {
          access: response.data.access,
          refresh: response.data.refresh ?? refreshToken,
        };
        setStoredTokens(nextTokens);
        return nextTokens;
      })
      .catch(() => {
        clearAuthStorage();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
