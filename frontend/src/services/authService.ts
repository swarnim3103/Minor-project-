export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

const API_URL = "http://localhost:5000/api";

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone_number?: string | null;
}

export async function registerUser(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return data;
}
export interface DashboardReminder {
  id: number;
  medicine_name: string;
  reminder_time: string;
  status: string;
  dosage: string;
}

export interface DashboardMedicine {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string | null;
}

export interface DashboardStats {
  activeMedicines: number;
  remindersToday: number;
  adherenceRate: number;
  missedThisWeek: number;
}

export interface DashboardData {
  stats: DashboardStats;
  todaysReminders: DashboardReminder[];
  recentMedicines: DashboardMedicine[];
}

export async function getDashboard(): Promise<DashboardData> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/dashboard`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch dashboard");
  }

  return data;
}
export async function addMedicine(medicine: {
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  start_date: string;
  end_date?: string;
}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/medicines`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(medicine),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to add medicine");
  }

  return data;
}
export async function getMedicines(): Promise<
  {
    id: number;
    name: string;
    dosage: string;
    frequency: string;
    instructions?: string;
    start_date: string;
    end_date?: string;
  }[]
> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/medicines`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch medicines");
  }

  return data;
}

// =========================================================
// NEW: EMAIL OTP VERIFICATION
// =========================================================

export async function sendEmailOtp(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/send-email-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to send email OTP");
  }
  return data;
}

export async function verifyEmailOtp(
  email: string,
  otp: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/verify-email-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Incorrect OTP");
  }
  return data;
}

// =========================================================
// NEW: PHONE OTP VERIFICATION
// =========================================================

export async function sendPhoneOtp(
  phone_number: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/send-phone-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to send phone OTP");
  }
  return data;
}

export async function verifyPhoneOtp(
  phone_number: string,
  otp: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/verify-phone-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number, otp }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Incorrect OTP");
  }
  return data;
}

// =========================================================
// NEW: FORGOT PASSWORD (email OTP based)
// =========================================================

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to send reset code");
  }
  return data;
}

export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to reset password");
  }
  return data;
}