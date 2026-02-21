import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import {
    Plus, Search, MoreVertical, Edit,
    Trash2, Beaker, IndianRupee, Clock, Activity, Loader2, Upload
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { labService } from '@/services/labService';
import { toast } from 'sonner';

// Define Test Interface
interface Test {
    test_id: string; // Changed from id to match schema
    test_name: string; // Changed from name
    category: string;
    price: number;
    home_visit_charge?: number;
    description?: string;
    report_time?: string;
    sample_type?: string;
    image_url?: string;
}

export function ManageTests() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Form State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [currentTest, setCurrentTest] = useState<Partial<Test>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Fetch Tests
    const fetchTests = async () => {
        setLoading(true);
        try {
            const data = await labService.getTests();
            setTests(data);
        } catch (error) {
            console.error("Failed to fetch tests:", error);
            toast.error("Failed to load tests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, []);

    useEffect(() => {
        if (!loading && containerRef.current) {
            gsap.fromTo(
                containerRef.current.querySelectorAll('.animate-item'),
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
            );
        }
    }, [loading, tests]);

    // Handle Create/Update
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Validation
            if (!currentTest.test_name || !currentTest.price) {
                toast.error("Name and Price are required");
                setIsSubmitting(false);
                return;
            }

            let imageUrl = currentTest.image_url || '';

            // Upload image if selected
            if (selectedImage) {
                try {
                    const { supabase } = await import('@/lib/supabase');
                    const fileExt = selectedImage.name.split('.').pop();
                    const fileName = `test_${Date.now()}.${fileExt}`;

                    console.log('Uploading image:', fileName, 'Size:', selectedImage.size);

                    const { data: uploadData, error: uploadError } = await supabase
                        .storage
                        .from('test-images')
                        .upload(fileName, selectedImage, {
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (uploadError) {
                        console.error('Image upload failed:', uploadError);
                        toast.error(`Image upload failed: ${uploadError.message}`);
                    } else {
                        console.log('Upload successful:', uploadData);
                        const { data: urlData } = supabase
                            .storage
                            .from('test-images')
                            .getPublicUrl(fileName);
                        imageUrl = urlData.publicUrl;
                        console.log('Public URL:', imageUrl);
                    }
                } catch (uploadErr: any) {
                    console.error('Upload exception:', uploadErr);
                    toast.error('Image upload error - check if bucket exists');
                }
            }

            const testData = { ...currentTest, image_url: imageUrl };

            if (currentTest.test_id) {
                // Update
                await labService.updateTest(currentTest.test_id, testData);
                toast.success("Test updated successfully");
            } else {
                // Create
                await labService.createTest(testData);
                toast.success("Test created successfully");
            }
            setIsAddOpen(false);
            setCurrentTest({});
            setSelectedImage(null);
            setImagePreview(null);
            fetchTests();
        } catch (error) {
            console.error("Operation failed:", error);
            toast.error("Failed to save test");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Delete
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this test?")) return;
        try {
            await labService.deleteTest(id);
            toast.success("Test deleted");
            setTests(tests.filter(t => t.test_id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete test");
        }
    };

    const openEdit = (test: Test) => {
        setCurrentTest(test);
        setImagePreview(test.image_url || null);
        setSelectedImage(null);
        setIsAddOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Filtering
    const filteredTests = tests.filter(test => {
        const matchesSearch = test.test_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || test.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', ...Array.from(new Set(tests.map(t => t.category).filter(Boolean)))];

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-emerald-600" /></div>;

    return (
        <div ref={containerRef} className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-item">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manage Tests</h1>
                    <p className="text-slate-500 mt-1">Add, edit, or remove tests from your lab's catalog.</p>
                </div>
                <Button onClick={() => { setCurrentTest({}); setIsAddOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Add New Test
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 animate-item">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search tests..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Tests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-item">
                {filteredTests.map((test) => (
                    <Card key={test.test_id} className="group hover:shadow-md transition-all duration-300 border-slate-200">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                    <Beaker className="w-6 h-6" />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEdit(test)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(test.test_id)}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-bold text-lg text-slate-900 mb-1">{test.test_name}</h3>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
                                    {test.category}
                                </Badge>
                            </div>

                            <div className="space-y-2 text-sm text-slate-500 mb-6">
                                <div className="flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4" />
                                    <span>₹{test.price}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{test.report_time || '24 hrs'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    <span>{test.sample_type || 'Blood'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentTest.test_id ? 'Edit Test' : 'Add New Test'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Test Name</Label>
                            <Input
                                value={currentTest.test_name || ''}
                                onChange={e => setCurrentTest({ ...currentTest, test_name: e.target.value })}
                                placeholder="e.g. Complete Blood Count"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={currentTest.category || 'Blood'}
                                    onValueChange={v => setCurrentTest({ ...currentTest, category: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Blood">Blood</SelectItem>
                                        <SelectItem value="Urine">Urine</SelectItem>
                                        <SelectItem value="Imaging">Imaging</SelectItem>
                                        <SelectItem value="Pathology">Pathology</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Test Price (₹)</Label>
                                <Input
                                    type="number"
                                    value={currentTest.price || ''}
                                    onChange={e => setCurrentTest({ ...currentTest, price: Number(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Home Visit Charge (₹) - Optional</Label>
                            <Input
                                type="number"
                                value={currentTest.home_visit_charge || ''}
                                onChange={e => setCurrentTest({ ...currentTest, home_visit_charge: Number(e.target.value) })}
                                placeholder="e.g. 200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Report Time</Label>
                            <Input
                                value={currentTest.report_time || ''}
                                onChange={e => setCurrentTest({ ...currentTest, report_time: e.target.value })}
                                placeholder="e.g. 24 Hours"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sample Type</Label>
                            <Input
                                value={currentTest.sample_type || ''}
                                onChange={e => setCurrentTest({ ...currentTest, sample_type: e.target.value })}
                                placeholder="e.g. Blood Serum"
                            />
                        </div>

                        {/* Thumbnail Upload */}
                        <div className="space-y-2">
                            <Label>Test Thumbnail (Optional)</Label>
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer block">
                                        <div className="flex flex-col items-center gap-2 text-slate-500">
                                            <Upload className="w-8 h-8" />
                                            <span className="text-sm">Click to upload image</span>
                                            <span className="text-xs text-slate-400">PNG, JPG up to 5MB</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-emerald-600 text-white" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Test'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
