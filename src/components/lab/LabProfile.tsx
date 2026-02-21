import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { labService } from '@/services/labService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, Building2, Phone, MapPin, Hash } from 'lucide-react';

export default function LabProfile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        lab_name: '',
        registration_number: '',
        address: '',
        contact_number: '' // Assuming this might be in 'users' table or 'labs' table depending on schema. 
        // Based on previous checks, 'mobile' is in 'users', 'address' is in 'labs'.
        // But let's check what 'labs' table has.
        // Labs table has: lab_id, lab_name, registration_number, address.
        // Users table has: mobile.
    });

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        if (!user) return;
        try {
            const profile = await labService.getLabProfile(user.id);
            if (profile) {
                setFormData({
                    lab_name: profile.lab_name || '',
                    registration_number: profile.registration_number || '',
                    address: profile.address || '',
                    contact_number: '' // We might need to fetch user details for mobile if we want to edit it here.
                    // For now, let's focus on Lab specific details.
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            await labService.updateLabProfile(user.id, {
                lab_name: formData.lab_name,
                registration_number: formData.registration_number,
                address: formData.address
            });
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-4 md:p-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Lab Settings</h1>
                <p className="text-slate-500">Manage your laboratory profile and preferences</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-teal-600" />
                        Lab Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="lab_name">Lab Name</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    id="lab_name"
                                    name="lab_name"
                                    placeholder="Enter lab name"
                                    value={formData.lab_name}
                                    onChange={handleChange}
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="registration_number">Registration Number</Label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    id="registration_number"
                                    name="registration_number"
                                    placeholder="License / Registration No."
                                    value={formData.registration_number}
                                    onChange={handleChange}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    id="address"
                                    name="address"
                                    placeholder="Full address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
