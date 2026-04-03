// User Roles
export type UserRole = 'patient' | 'lab' | 'admin' | 'doctor' | 'technician';

// User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: 'ACTIVE' | 'PENDING' | 'REJECTED';
  avatar?: string;
  phone?: string;
  address?: string;
}

// Test Category
export type TestCategory = 'blood' | 'urine' | 'imaging' | 'health-package';

// Lab Test
export interface LabTest {
  id: string;
  labId: string;
  name: string;
  description: string;
  category: TestCategory;
  price: number;
  homeVisitCharge?: number;
  turnaroundTime: string;
  parameters?: string[];
  image?: string;
  labName?: string;
  labAddress?: string;
}

// Lab
export interface Lab {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  accreditation: string[];
  services: string[];
  isApproved: boolean;
  image?: string;
}

// Booking Status
// Booking Status (Strict Match to DB Enum)
// Booking Status (Strict Match to DB Enum)
export type BookingStatus =
  | 'REQUESTED'
  | 'REJECTED'
  | 'PAYMENT_PENDING'
  | 'BOOKED'
  | 'TECH_ASSIGNED'
  | 'SAMPLE_COLLECTED'
  | 'TESTING'
  | 'REPORT_READY';

export const LAB_STATUS_LABELS: Record<BookingStatus, string> = {
  REQUESTED: 'New Request',
  REJECTED: 'Rejected',
  PAYMENT_PENDING: 'Payment Pending',
  BOOKED: 'Booked',
  TECH_ASSIGNED: 'Technician Assigned',
  SAMPLE_COLLECTED: 'Sample Collected',
  TESTING: 'Processing',
  REPORT_READY: 'Completed' // UI says "Completed", DB says REPORT_READY
};

// Sample Collection Type
export type CollectionType = 'home' | 'lab-visit';

// Booking
export interface Booking {
  id: string;
  patientId: string;
  patientName: string;
  testId: string;
  testName: string;
  labId: string;
  labName: string;
  status: BookingStatus;
  collectionType: CollectionType;
  appointmentDate: string;
  appointmentTime: string;
  address?: string;
  technicianName?: string;
  technicianPhone?: string;
  assignedTechnicianId?: string; // New field
  bookedAt: string;
  completedAt?: string;
  reportUrl?: string;
  qrCode?: string;
}

// Report
export interface Report {
  id: string;
  bookingId: string;
  patientId: string;
  patientName: string;
  testId: string;
  testName: string;
  labId: string;
  labName: string;
  generatedAt: string;
  verifiedBy: string;
  parameters: ReportParameter[];
  summary: string;
  pdfUrl: string;
  qrCode: string;
}

// Report Parameter
export interface ReportParameter {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low' | 'critical';
}

// Testimonial
export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

// Stats
export interface DashboardStats {
  totalUsers: number;
  totalLabs: number;
  totalBookings: number;
  pendingBookings: number;
  completedTests: number;
  revenue: number;
}

// Lab Stats
export interface LabStats {
  incomingBookings: number;
  pendingSamples: number;
  completedTests: number;
  todayTests: number;
  pendingWorkload: number;
}

// Notification
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

// ==========================================
// DOCTOR CONSULTATION MODULE TYPES
// ==========================================

export type ConsultationType = 'hospital';
export type DoctorAppointmentStatus = 'pending_approval' | 'payment_pending' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'rejected';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  specialization?: string;
  medicalRegNo?: string;
  consultationFee?: number;
  avatar?: string;
  status?: string;
  profileImg?: string;
  workingHospital?: string;
  qualification?: string;
  experienceYears?: number;
  bio?: string;
}

export interface DoctorSlot {
  slotId: string;
  doctorId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  consultationType: ConsultationType;
}

export interface DoctorAppointment {
  appointmentId: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  patientMobile?: string;
  doctorId: string;
  doctorName?: string;
  doctorEmail?: string;
  doctorSpecialization?: string;
  slotId: string;
  consultationType: ConsultationType;
  status: DoctorAppointmentStatus;
  paymentStatus: PaymentStatus;
  meetingRoomId?: string;
  meetingStarted: boolean;
  secureSessionToken?: string;
  slotDate?: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface DoctorPayment {
  paymentId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface DoctorNote {
  noteId: string;
  doctorAppointmentId: string;
  doctorId: string;
  patientId: string;
  note: string;
  createdAt: string;
}
