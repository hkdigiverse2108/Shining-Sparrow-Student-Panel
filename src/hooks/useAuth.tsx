/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/auth.service';
import type { SignupPayload, LoginPayload, AdminLoginPayload, UpdateProfilePayload, ChangePasswordPayload } from '../services/auth.service';

export interface StudentProfile {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  otr: string;
  district: string;
  std: string;
  reachFrom: string;
  role: string;
  profilePhoto?: string;
  designation?: string;
  schoolName?: string;
}

interface AuthContextType {
  token: string | null;
  student: StudentProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  login: (payload: LoginPayload) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminLogin: (payload: AdminLoginPayload) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signup: (payload: SignupPayload) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProfile: (payload: UpdateProfilePayload) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changePassword: (payload: ChangePasswordPayload) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('shining_sparrow_student_token'));
  const [student, setStudent] = useState<StudentProfile | null>(() => {
    const storedProfile = localStorage.getItem('shining_sparrow_student_profile');
    if (storedProfile) {
      try {
        return JSON.parse(storedProfile);
      } catch {
        localStorage.removeItem('shining_sparrow_student_profile');
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleAuthLogout = () => {
      setToken(null);
      setStudent(null);
    };
    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await authService.login(payload);
      if (response && response.status === 200) {
        const userToken = response.data.token;
        const userProfile = response.data;
        
        localStorage.setItem('shining_sparrow_student_token', userToken);
        localStorage.setItem('shining_sparrow_student_profile', JSON.stringify(userProfile));
        
        setToken(userToken);
        setStudent(userProfile);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (payload: AdminLoginPayload) => {
    setIsLoading(true);
    try {
      const response = await authService.adminLogin(payload);
      if (response && response.status === 200) {
        const userToken = response.data.token;
        const userProfile = response.data;
        
        localStorage.setItem('shining_sparrow_student_token', userToken);
        localStorage.setItem('shining_sparrow_student_profile', JSON.stringify(userProfile));
        
        setToken(userToken);
        setStudent(userProfile);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: SignupPayload) => {
    setIsLoading(true);
    try {
      const response = await authService.signup(payload);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    setIsLoading(true);
    try {
      const response = await authService.updateProfile(payload);
      if (response && response.status === 200) {
        const updatedStudent = {
          ...student,
          ...response.data,
          fullName: payload.fullName,
          phoneNumber: payload.phone,
          profilePhoto: payload.profilePhoto || student?.profilePhoto,
          district: payload.district !== undefined ? payload.district : student?.district,
          std: payload.std !== undefined ? payload.std : student?.std,
          reachFrom: payload.reachFrom !== undefined ? payload.reachFrom : student?.reachFrom,
          schoolName: payload.schoolName !== undefined ? payload.schoolName : student?.schoolName,
        } as StudentProfile;

        localStorage.setItem('shining_sparrow_student_profile', JSON.stringify(updatedStudent));
        setStudent(updatedStudent);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (payload: ChangePasswordPayload) => {
    return await authService.changePassword(payload);
  };

  const logout = () => {
    localStorage.removeItem('shining_sparrow_student_token');
    localStorage.removeItem('shining_sparrow_student_profile');
    setToken(null);
    setStudent(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        token,
        student,
        isAuthenticated,
        isLoading,
        login,
        adminLogin,
        signup,
        updateProfile,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
