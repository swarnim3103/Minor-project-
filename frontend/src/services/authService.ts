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

// =========================================================
// AUTH
// =========================================================

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

// =========================================================
// USER PROFILE
// =========================================================

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone_number: string | null;
  created_at: string;
  profile_picture_url: string | null;
  profile_picture_public_id?: string | null;
}

export async function getMyProfile(): Promise<UserProfile> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch profile");
  }

  return data.user;
}

// =========================================================
// PROFILE PICTURE
// =========================================================

export async function uploadProfilePicture(
  file: File
): Promise<{ message: string; profile_picture_url: string }> {
  const token = localStorage.getItem("token");
  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch(
    `${API_URL}/auth/me/profile-picture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to upload profile picture");
  }

  return data;
}

export async function removeProfilePicture(): Promise<{
  message: string;
}> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/auth/me/profile-picture`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to remove profile picture");
  }

  return data;
}

// =========================================================
// DELETE ACCOUNT
// =========================================================

export async function deleteMyAccount(
  password: string
): Promise<{ message: string }> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/auth/me`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete account");
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

// =========================================================
// DASHBOARD
// =========================================================

export interface DashboardReminder {
  id: number;
  medicine_name: string;
  reminder_time: string;
  status: "active" | "inactive";
  dosage: string;
}

export interface DashboardMedicine {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  start_date: string | null;
  end_date?: string | null;
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

// =========================================================
// MEDICINES
// =========================================================

export interface MedicinePayload {
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  start_date: string;
  end_date?: string;
}

export interface MedicineResponse {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  start_date: string;
  end_date?: string | null;
}

// ADD MEDICINE
export async function addMedicine(
  medicine: MedicinePayload
): Promise<{ message: string; medicineId: number }> {
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

// GET MEDICINES
export async function getMedicines(): Promise<MedicineResponse[]> {
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

// UPDATE MEDICINE
export async function updateMedicine(
  id: number,
  medicine: MedicinePayload
): Promise<{ message: string }> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/medicines/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(medicine),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update medicine");
  }

  return data;
}

// DELETE MEDICINE
export async function deleteMedicine(
  id: number
): Promise<{ message: string }> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/medicines/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete medicine");
  }

  return data;
}

// =========================================================
// EMAIL OTP VERIFICATION
// =========================================================

export async function sendEmailOtp(
  email: string
): Promise<{ message: string }> {
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
// PHONE OTP VERIFICATION
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
// FORGOT PASSWORD
// =========================================================

export async function forgotPassword(
  email: string
): Promise<{ message: string }> {
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
    body: JSON.stringify({
      email,
      otp,
      newPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to reset password");
  }

  return data;
}
// =========================================================
// PRESCRIPTIONS
// =========================================================

export interface Prescription {
  id: number;
  doctor_name: string;
  prescription_date: string;
  prescription_type: "online" | "scanned_physical" | "handwritten_scanned";
  file_url: string;
  original_filename: string;
}

export async function getPrescriptions(): Promise<Prescription[]> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/prescriptions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch prescriptions");
  }

  return data.prescriptions;
}

export async function uploadPrescription(payload: {
  file: File;
  doctor_name: string;
  prescription_date: string;
  prescription_type: string;
}): Promise<{ message: string; prescription: Prescription }> {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("doctor_name", payload.doctor_name);
  formData.append("prescription_date", payload.prescription_date);
  formData.append("prescription_type", payload.prescription_type);

  const response = await fetch(`${API_URL}/prescriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, // no Content-Type - browser sets it for FormData
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to upload prescription");
  }

  return data;
}

export async function deletePrescription(
  id: number
): Promise<{ message: string }> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/prescriptions/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete prescription");
  }

  return data;
}