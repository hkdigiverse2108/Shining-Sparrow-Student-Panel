import client from '../api/client';

export interface SignupPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  password?: string;
  designation?: string;
  district: string;
  std: string;
  reachFrom: string;
  schoolName?: string;
  agreeTerms: boolean;
}

export interface LoginPayload {
  phoneNumber: string;
  otr: string;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone: string;
  designation?: string;
  profilePhoto?: string;
  district?: string;
  std?: string;
  reachFrom?: string;
  schoolName?: string;
  address?: string;
}

export interface ChangePasswordPayload {
  email: string;
  oldPassword?: string;
  newPassword?: string;
}

const authService = {
  signup: async (payload: SignupPayload) => {
    // Default designation to Student if not provided
    const data = {
      ...payload,
      designation: payload.designation || 'Student',
    };
    const response = await client.post('/user/signup', data);
    return response.data;
  },

  login: async (payload: LoginPayload) => {
    const data = {
      userType: 'user',
      phoneNumber: payload.phoneNumber,
      otr: payload.otr,
    };
    const response = await client.post('/auth/login', data);
    return response.data;
  },

  forgotOtr: async (email: string) => {
    const response = await client.post('/auth/forgot-otr', { email });
    return response.data;
  },

  adminLogin: async (payload: AdminLoginPayload) => {
    const data = {
      userType: 'admin',
      email: payload.email,
      password: payload.password,
    };
    const response = await client.post('/auth/login', data);
    return response.data;
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const data = {
      fullName: payload.fullName,
      phone: payload.phone,
      designation: payload.designation || 'Student',
      profilePhoto: payload.profilePhoto || '',
      district: payload.district,
      std: payload.std,
      reachFrom: payload.reachFrom,
      schoolName: payload.schoolName,
      address: payload.address,
    };
    const response = await client.post('/auth/update-profile', data);
    return response.data;
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const response = await client.post('/auth/change-password', payload);
    return response.data;
  },

  getPaymentHistory: async () => {
    const response = await client.get('/user/payments/history');
    return response.data;
  },
};

export default authService;
