import type {
  User, LabTest, Lab, Booking, Report, Testimonial,
  DashboardStats, LabStats, Notification
} from '@/types';

// Current User (Mock logged in user)
export const currentUser: User = {
  id: 'u1',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@email.com',
  role: 'patient',
  avatar: '/avatar-1.jpg',
  phone: '+1 (555) 123-4567',
  address: '123 Health Street, Medical City, MC 12345'
};

// Lab Tests
export const labTests: LabTest[] = [
  {
    id: 't1',
    name: 'Complete Blood Count (CBC)',
    description: 'Comprehensive blood test that evaluates overall health and detects a wide range of disorders.',
    category: 'blood',
    labId: 'l1',
    price: 49.99,
    turnaroundTime: '4-6 hours',
    parameters: ['Hemoglobin', 'WBC Count', 'RBC Count', 'Platelets', 'Hematocrit'],
    image: '/category-blood.jpg'
  },
  {
    id: 't2',
    name: 'Lipid Profile',
    description: 'Measures cholesterol levels and triglycerides to assess cardiovascular health.',
    category: 'blood',
    labId: 'l1',
    price: 79.99,
    turnaroundTime: '6-8 hours',
    parameters: ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides', 'VLDL'],
    image: '/category-blood.jpg'
  },
  {
    id: 't3',
    name: 'Blood Sugar (Fasting)',
    description: 'Measures blood glucose levels to screen for diabetes and prediabetes.',
    category: 'blood',
    labId: 'l1',
    price: 29.99,
    turnaroundTime: '2-4 hours',
    parameters: ['Fasting Glucose', 'HbA1c'],
    image: '/category-blood.jpg'
  },
  {
    id: 't4',
    name: 'Thyroid Function Test',
    description: 'Evaluates thyroid gland function and hormone levels.',
    category: 'blood',
    labId: 'l1',
    price: 89.99,
    turnaroundTime: '8-12 hours',
    parameters: ['TSH', 'T3', 'T4', 'Free T4'],
    image: '/category-blood.jpg'
  },
  {
    id: 't5',
    name: 'Liver Function Test',
    description: 'Assesses liver health by measuring enzymes, proteins, and bilirubin.',
    category: 'blood',
    labId: 'l1',
    price: 99.99,
    turnaroundTime: '6-8 hours',
    parameters: ['ALT', 'AST', 'ALP', 'Bilirubin', 'Albumin'],
    image: '/category-blood.jpg'
  },
  {
    id: 't6',
    name: 'Kidney Function Test',
    description: 'Evaluates kidney function through creatinine, BUN, and electrolyte levels.',
    category: 'blood',
    labId: 'l1',
    price: 79.99,
    turnaroundTime: '6-8 hours',
    parameters: ['Creatinine', 'BUN', 'eGFR', 'Electrolytes'],
    image: '/category-blood.jpg'
  },
  {
    id: 't7',
    name: 'Urine Analysis',
    description: 'Comprehensive examination of urine for various health conditions.',
    category: 'urine',
    labId: 'l1',
    price: 39.99,
    turnaroundTime: '2-4 hours',
    parameters: ['pH', 'Protein', 'Glucose', 'Ketones', 'RBC', 'WBC'],
    image: '/category-urine.jpg'
  },
  {
    id: 't8',
    name: 'Urine Culture',
    description: 'Detects bacteria in urine to diagnose urinary tract infections.',
    category: 'urine',
    labId: 'l1',
    price: 59.99,
    turnaroundTime: '24-48 hours',
    parameters: ['Bacterial Count', 'Organism Identification', 'Antibiotic Sensitivity'],
    image: '/category-urine.jpg'
  },
  {
    id: 't9',
    name: 'Chest X-Ray',
    description: 'Digital X-ray imaging of chest for lungs, heart, and bones.',
    category: 'imaging',
    labId: 'l1',
    price: 149.99,
    turnaroundTime: '1-2 hours',
    parameters: ['Digital Imaging', 'Radiologist Report'],
    image: '/category-imaging.jpg'
  },
  {
    id: 't10',
    name: 'Ultrasound Abdomen',
    description: 'Non-invasive imaging of abdominal organs and structures.',
    category: 'imaging',
    labId: 'l1',
    price: 199.99,
    turnaroundTime: '2-4 hours',
    parameters: ['Liver', 'Gallbladder', 'Kidneys', 'Pancreas', 'Spleen'],
    image: '/category-imaging.jpg'
  },
  {
    id: 't11',
    name: 'Basic Health Package',
    description: 'Essential screening tests for overall health assessment.',
    category: 'health-package',
    labId: 'l1',
    price: 199.99,
    turnaroundTime: '24 hours',
    parameters: ['CBC', 'Blood Sugar', 'Lipid Profile', 'Liver Function', 'Kidney Function'],
    image: '/category-health.jpg'
  },
  {
    id: 't12',
    name: 'Comprehensive Health Package',
    description: 'Complete health screening with advanced diagnostic tests.',
    category: 'health-package',
    labId: 'l1',
    price: 499.99,
    turnaroundTime: '48 hours',
    parameters: ['CBC', 'Lipid Profile', 'Thyroid', 'Liver', 'Kidney', 'Vitamin D', 'B12', 'Iron Profile'],
    image: '/category-health.jpg'
  }
];

// Labs
export const labs: Lab[] = [
  {
    id: 'l1',
    name: 'MediCare Diagnostics',
    address: '456 Medical Plaza, Health District, HD 67890',
    phone: '+1 (555) 234-5678',
    email: 'info@medicarediagnostics.com',
    rating: 4.8,
    accreditation: ['CAP', 'CLIA', 'ISO 15189'],
    services: ['Blood Tests', 'Urine Tests', 'Imaging', 'Health Packages'],
    isApproved: true,
    image: '/category-blood.jpg'
  },
  {
    id: 'l2',
    name: 'HealthFirst Labs',
    address: '789 Wellness Boulevard, Care City, CC 54321',
    phone: '+1 (555) 345-6789',
    email: 'contact@healthfirstlabs.com',
    rating: 4.6,
    accreditation: ['CLIA', 'Joint Commission'],
    services: ['Blood Tests', 'Urine Tests', 'Molecular Diagnostics'],
    isApproved: true,
    image: '/category-urine.jpg'
  },
  {
    id: 'l3',
    name: 'Precision Pathology',
    address: '321 Science Park, Research Zone, RZ 98765',
    phone: '+1 (555) 456-7890',
    email: 'labs@precisionpath.com',
    rating: 4.9,
    accreditation: ['CAP', 'CLIA', 'ISO 15189', 'AABB'],
    services: ['Blood Tests', 'Urine Tests', 'Imaging', 'Genetic Testing'],
    isApproved: true,
    image: '/category-imaging.jpg'
  },
  {
    id: 'l4',
    name: 'City Diagnostics Center',
    address: '654 Downtown Ave, Metro City, MC 13579',
    phone: '+1 (555) 567-8901',
    email: 'info@citydiagnostics.com',
    rating: 4.4,
    accreditation: ['CLIA'],
    services: ['Blood Tests', 'Basic Health Screening'],
    isApproved: false,
    image: '/category-health.jpg'
  }
];

// Bookings
export const bookings: Booking[] = [
  {
    id: 'b1',
    patientId: 'u1',
    patientName: 'Sarah Johnson',
    testId: 't1',
    testName: 'Complete Blood Count (CBC)',
    labId: 'l1',
    labName: 'MediCare Diagnostics',
    status: 'REPORT_READY',
    collectionType: 'lab-visit',
    appointmentDate: '2024-01-15',
    appointmentTime: '09:00 AM',
    bookedAt: '2024-01-10T10:30:00Z',
    completedAt: '2024-01-15T14:00:00Z',
    reportUrl: '/reports/cbc-report.pdf',
    qrCode: 'QR-CBC-001'
  },
  {
    id: 'b2',
    patientId: 'u1',
    patientName: 'Sarah Johnson',
    testId: 't2',
    testName: 'Lipid Profile',
    labId: 'l2',
    labName: 'HealthFirst Labs',
    status: 'REPORT_READY',
    collectionType: 'home',
    appointmentDate: '2024-01-20',
    appointmentTime: '08:00 AM',
    address: '123 Health Street, Medical City, MC 12345',
    technicianName: 'Mike Chen',
    technicianPhone: '+1 (555) 987-6543',
    bookedAt: '2024-01-18T09:00:00Z',
    reportUrl: '/reports/lipid-report.pdf',
    qrCode: 'QR-LIPID-002'
  },
  {
    id: 'b3',
    patientId: 'u1',
    patientName: 'Sarah Johnson',
    testId: 't11',
    testName: 'Basic Health Package',
    labId: 'l3',
    labName: 'Precision Pathology',
    status: 'TESTING',
    collectionType: 'home',
    appointmentDate: '2024-02-01',
    appointmentTime: '10:00 AM',
    address: '123 Health Street, Medical City, MC 12345',
    technicianName: 'Lisa Wong',
    technicianPhone: '+1 (555) 876-5432',
    bookedAt: '2024-01-30T11:00:00Z'
  },
  {
    id: 'b4',
    patientId: 'u2',
    patientName: 'John Smith',
    testId: 't3',
    testName: 'Blood Sugar (Fasting)',
    labId: 'l1',
    labName: 'MediCare Diagnostics',
    status: 'SAMPLE_COLLECTED',
    collectionType: 'lab-visit',
    appointmentDate: '2024-02-04',
    appointmentTime: '08:30 AM',
    bookedAt: '2024-02-03T15:00:00Z'
  },
  {
    id: 'b5',
    patientId: 'u3',
    patientName: 'Emily Davis',
    testId: 't7',
    testName: 'Urine Analysis',
    labId: 'l2',
    labName: 'HealthFirst Labs',
    status: 'BOOKED',
    collectionType: 'lab-visit',
    appointmentDate: '2024-02-05',
    appointmentTime: '11:00 AM',
    bookedAt: '2024-02-04T09:30:00Z'
  }
];

// Reports
export const reports: Report[] = [
  {
    id: 'r1',
    bookingId: 'b1',
    patientId: 'u1',
    patientName: 'Sarah Johnson',
    testId: 't1',
    testName: 'Complete Blood Count (CBC)',
    labId: 'l1',
    labName: 'MediCare Diagnostics',
    generatedAt: '2024-01-15T14:00:00Z',
    verifiedBy: 'Dr. Robert Williams, MD',
    summary: 'All parameters are within normal range. No abnormalities detected.',
    pdfUrl: '/reports/cbc-report.pdf',
    qrCode: 'QR-CBC-001',
    parameters: [
      { name: 'Hemoglobin', value: '13.5', unit: 'g/dL', referenceRange: '12.0-15.5', status: 'normal' },
      { name: 'WBC Count', value: '7.2', unit: 'K/μL', referenceRange: '4.5-11.0', status: 'normal' },
      { name: 'RBC Count', value: '4.5', unit: 'M/μL', referenceRange: '4.0-5.2', status: 'normal' },
      { name: 'Platelets', value: '250', unit: 'K/μL', referenceRange: '150-400', status: 'normal' },
      { name: 'Hematocrit', value: '40', unit: '%', referenceRange: '36-46', status: 'normal' }
    ]
  },
  {
    id: 'r2',
    bookingId: 'b2',
    patientId: 'u1',
    patientName: 'Sarah Johnson',
    testId: 't2',
    testName: 'Lipid Profile',
    labId: 'l2',
    labName: 'HealthFirst Labs',
    generatedAt: '2024-01-21T10:00:00Z',
    verifiedBy: 'Dr. Amanda Lee, MD',
    summary: 'Cholesterol levels slightly elevated. Dietary modifications recommended.',
    pdfUrl: '/reports/lipid-report.pdf',
    qrCode: 'QR-LIPID-002',
    parameters: [
      { name: 'Total Cholesterol', value: '210', unit: 'mg/dL', referenceRange: '<200', status: 'high' },
      { name: 'HDL', value: '55', unit: 'mg/dL', referenceRange: '>40', status: 'normal' },
      { name: 'LDL', value: '130', unit: 'mg/dL', referenceRange: '<100', status: 'high' },
      { name: 'Triglycerides', value: '140', unit: 'mg/dL', referenceRange: '<150', status: 'normal' },
      { name: 'VLDL', value: '28', unit: 'mg/dL', referenceRange: '5-40', status: 'normal' }
    ]
  }
];

// Testimonials
export const testimonials: Testimonial[] = [
  {
    id: 'tm1',
    name: 'Priya Sharma',
    avatar: '/avatar-1.jpg',
    rating: 5,
    text: 'The booking process was incredibly smooth. Got my test results within 6 hours, and the home collection service was very professional. Highly recommend!',
    date: '2024-01-10'
  },
  {
    id: 'tm2',
    name: 'Marcus Johnson',
    avatar: '/avatar-2.jpg',
    rating: 5,
    text: 'As someone who hates visiting hospitals, this platform is a game-changer. The technician arrived on time, and I could track my sample status in real-time.',
    date: '2024-01-15'
  },
  {
    id: 'tm3',
    name: 'Helen Martinez',
    avatar: '/avatar-3.jpg',
    rating: 4,
    text: 'Great experience overall. The reports are detailed and easy to understand. The QR verification gives me confidence in the authenticity of results.',
    date: '2024-01-20'
  }
];

// Dashboard Stats (Admin)
export const adminStats: DashboardStats = {
  totalUsers: 12543,
  totalLabs: 89,
  totalBookings: 45678,
  pendingBookings: 234,
  completedTests: 38921,
  revenue: 2456789
};

// Lab Stats
export const labStats: LabStats = {
  incomingBookings: 12,
  pendingSamples: 8,
  completedTests: 156,
  todayTests: 24,
  pendingWorkload: 15
};

// Notifications
export const notifications: Notification[] = [
  {
    id: 'n1',
    title: 'Report Ready',
    message: 'Your Lipid Profile report is now available for download.',
    type: 'success',
    read: false,
    createdAt: '2024-01-21T10:00:00Z'
  },
  {
    id: 'n2',
    title: 'Sample Collected',
    message: 'Your sample for Basic Health Package has been collected successfully.',
    type: 'info',
    read: true,
    createdAt: '2024-02-01T10:30:00Z'
  },
  {
    id: 'n3',
    title: 'Technician Assigned',
    message: 'Lisa Wong has been assigned for your home collection on Feb 1st.',
    type: 'info',
    read: true,
    createdAt: '2024-01-31T09:00:00Z'
  },
  {
    id: 'n4',
    title: 'Booking Confirmed',
    message: 'Your appointment for CBC at MediCare Diagnostics is confirmed.',
    type: 'success',
    read: true,
    createdAt: '2024-01-10T10:30:00Z'
  }
];

// Users List (for Admin)
export const users: User[] = [
  { id: 'u1', name: 'Sarah Johnson', email: 'sarah.j@email.com', role: 'patient', phone: '+1 (555) 123-4567' },
  { id: 'u2', name: 'John Smith', email: 'john.smith@email.com', role: 'patient', phone: '+1 (555) 234-5678' },
  { id: 'u3', name: 'Emily Davis', email: 'emily.davis@email.com', role: 'patient', phone: '+1 (555) 345-6789' },
  { id: 'u4', name: 'Michael Brown', email: 'michael.b@email.com', role: 'patient', phone: '+1 (555) 456-7890' },
  { id: 'u5', name: 'Dr. Robert Williams', email: 'dr.williams@medicare.com', role: 'lab', phone: '+1 (555) 567-8901' },
  { id: 'u6', name: 'Dr. Amanda Lee', email: 'dr.lee@healthfirst.com', role: 'lab', phone: '+1 (555) 678-9012' },
  { id: 'u7', name: 'Admin User', email: 'admin@pathocare.com', role: 'admin', phone: '+1 (555) 789-0123' }
];
