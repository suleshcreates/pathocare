import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import { PatientDashboard } from '@/components/patient/PatientDashboard';
import { BrowseTests } from '@/components/patient/BrowseTests';
import { BookTest } from '@/components/patient/BookTest';
import { Appointments } from '@/components/patient/Appointments';
import { Reports } from '@/components/patient/Reports';
import { TestHistory } from '@/components/patient/TestHistory';
import { LabDashboard } from '@/components/lab/LabDashboard';
import { BookingManagement } from '@/components/lab/BookingManagement';
import { SampleWorkflow } from '@/components/lab/SampleWorkflow';
import { UploadReport } from '@/components/lab/UploadReport';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { LabApproval } from '@/components/admin/LabApproval';
import { DoctorApproval } from '@/components/admin/DoctorApproval';
import { BookingOversight } from '@/components/admin/BookingOversight';
import { AdminEarnings } from '@/components/admin/AdminEarnings';
import { ManageTests } from '@/components/lab/ManageTests';
import { ManageSchedule } from '@/components/lab/ManageSchedule';
import { TechnicianDashboard } from '@/components/technician/TechnicianDashboard';
import { ManageTechnicians } from '@/components/lab/ManageTechnicians';
import LabProfile from '@/components/lab/LabProfile';
import { DoctorDashboard } from '@/components/doctor/DoctorDashboard';
import { ManageSlots } from '@/components/doctor/ManageSlots';
import { DoctorAppointments } from '@/components/doctor/DoctorAppointments';
import { DoctorEarnings } from '@/components/doctor/DoctorEarnings';
import { BrowseDoctors } from '@/components/patient/BrowseDoctors';
import { PatientDoctorAppointments } from '@/components/patient/PatientDoctorAppointments';

export function Dashboard() {
    const { role } = useAuth();
    // in a real app, this local state would likely be replaced by sub-routes (e.g., /dashboard/tests)
    // But for this refactor step, we keep the internal view switching to minimize scope creep, 
    // while still using the Layout component.
    const [currentView, setCurrentView] = useState('dashboard');

    const normalizedRole = (role?.toLowerCase() || 'patient') as 'patient' | 'lab' | 'admin';
    console.log('Dashboard Render:', { role, normalizedRole, currentView, hash: window.location.hash });

    const renderContent = () => {
        console.log('Rendering content for:', { normalizedRole, currentView });
        if (normalizedRole === 'patient') {
            switch (currentView) {
                case 'dashboard': return <PatientDashboard />;
                case 'tests': return <BrowseTests />;
                case 'book': return <BookTest />;
                case 'appointments': return <Appointments />;
                case 'reports': return <Reports />;
                case 'history': return <TestHistory />;
                case 'doctors': return <BrowseDoctors />;
                case 'doctor-appointments': return <PatientDoctorAppointments />;
                default: return <PatientDashboard />;
            }
        }

        if (normalizedRole === 'lab') {
            switch (currentView) {
                case 'dashboard': return <LabDashboard />;
                case 'tests': return <ManageTests />; // New View
                case 'schedule': return <ManageSchedule />; // New View
                case 'bookings': return <BookingManagement />;
                case 'technicians': return <ManageTechnicians />; // New Route
                case 'workflow': return <SampleWorkflow />;
                case 'upload': return <UploadReport />;
                case 'performance': return <LabDashboard />;
                case 'settings': return <LabProfile />;
                default: return <LabDashboard />;
            }
        }

        if (normalizedRole === 'admin') {
            switch (currentView) {
                case 'dashboard': return <AdminDashboard />;
                case 'users': return <UserManagement />;
                case 'labs': return <LabApproval />;
                case 'doctors': return <DoctorApproval />;
                case 'bookings': return <BookingOversight />;
                case 'payouts': return <AdminEarnings />;
                case 'settings': return <AdminDashboard />;
                default: return <AdminDashboard />;
            }
        }

        if (normalizedRole === 'technician') {
            return <TechnicianDashboard />;
        }

        if (normalizedRole === 'doctor') {
            switch (currentView) {
                case 'dashboard': return <DoctorDashboard />;
                case 'slots': return <ManageSlots />;
                case 'appointments': return <DoctorAppointments />;
                case 'patients': return <DoctorAppointments />;
                case 'earnings': return <DoctorEarnings />;
                default: return <DoctorDashboard />;
            }
        }

        return <PatientDashboard />;
    };

    // We need to pass a way to change views to the Layout/Sidebar. 
    // Accessing `window.location.hash` was the old way. 
    // Ideally, we'd refactor Layout/Sidebar to accept `onNavigate` props or use Links.
    // For this step, we'll assume Sidebar uses some global event or we patch it later.
    // BUT: The original code utilized `window.location.hash`. 
    // Let's stick to hash logic WITHIN the dashboard for now to keep the sidebar working without massive refactor of all components.
    // Alternatively, we can patch `window.location.hash` listener here too, or better yet, proper state.

    // Let's try to maintain compatibility with existing Sidebar implementation:
    // Existing App.tsx listened to hashchange. Let's replicate that simply for now 
    // so we don't break the Sidebar which likely sets `href="#dashboard"`.

    // We need to detect hash changes to update internal view.
    // Since we are using react-router-dom, we should use useLocation hook
    // which updates whenever the URL changes (including hash).
    const location = useLocation();

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        setCurrentView(hash || 'dashboard');
    }, [location.hash]);

    // Helper for Pending Status
    const { user } = useAuth();
    if (user?.status === 'PENDING') {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Approval Pending</h2>
                    <p className="text-slate-500 mt-2 max-w-md">
                        Your account is currently under review by our administrators. You will be notified once your account is activated.
                    </p>
                    <div className="mt-8 p-4 bg-slate-50 rounded-lg max-w-md w-full text-left">
                        <h4 className="font-semibold text-slate-700 mb-2">What happens next?</h4>
                        <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                            <li>Admin verifies your credentials</li>
                            <li>You receive an email confirmation</li>
                            <li>Full dashboard access is granted</li>
                        </ul>
                    </div>
                </div>
            </Layout>
        );
    }

    if (user?.status === 'REJECTED') {
        // Similar handling for rejected if needed, or rely on Login check
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                    <h2 className="text-2xl font-bold text-rose-600">Account Suspended</h2>
                    <p className="mt-2 text-slate-600">Please contact support for assistance.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            {renderContent()}
        </Layout>
    );
}
