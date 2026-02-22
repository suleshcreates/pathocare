import { useState } from 'react';
import { Landmark, Users, Building2, LayoutDashboard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDoctorPayouts } from './AdminDoctorPayouts';
import { AdminLabPayouts } from './AdminLabPayouts';
import { Analytics } from './Analytics'; // We can use Analytics as the overview

export function AdminEarnings() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-6 text-slate-800 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold flex items-center">
                    <Landmark className="w-6 h-6 mr-2 text-indigo-600" />
                    Financial Dashboard
                </h1>
                <p className="text-slate-500 mt-1">Manage platform revenue, doctor earnings, and lab payouts</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="doctors" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Doctor Payouts</span>
                    </TabsTrigger>
                    <TabsTrigger value="labs" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Lab Payouts</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <Analytics />
                    </div>
                </TabsContent>

                <TabsContent value="doctors" className="mt-6">
                    <div className="bg-white rounded-xl border border-slate-200">
                        <AdminDoctorPayouts />
                    </div>
                </TabsContent>

                <TabsContent value="labs" className="mt-6">
                    <div className="bg-white rounded-xl border border-slate-200">
                        <AdminLabPayouts />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
