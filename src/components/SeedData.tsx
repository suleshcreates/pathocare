import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { labTests, labs } from '@/data/mockData';
import { Database } from 'lucide-react';

export function SeedData() {
    const [loading, setLoading] = useState(false);

    const seedDatabase = async () => {
        setLoading(true);
        try {
            // 1. Seed Labs (Commented out: Labs require existing auth users which we can't create client-side)
            /*
            const { error: labError } = await supabase
                .from('labs')
                .upsert(labs.map(l => ({
                    lab_id: l.id, 
                    lab_name: l.name,
                    address: l.address,
                    // Columns not in schema: phone, email, rating, is_approved, image_url
                    // functionality relies on joining 'users' table
                })));
            if (labError) throw labError;
            */

            console.log('Seeding tests...');

            // 2. Seed Tests
            // Note: We MUST NOT send 'test_id' as 't1', 't2' etc because DB expects UUID.
            // We let Supabase generate proper UUIDs.
            const { error: testError } = await supabase
                .from('lab_tests')
                .upsert(labTests.map(t => ({
                    // test_id: t.id, <-- REMOVED: Invalid UUID from mock
                    test_name: t.name,
                    description: t.description,
                    category: t.category,
                    price: t.price,
                    report_time: t.turnaroundTime,
                    image_url: t.image
                })));

            if (testError) {
                console.error('Test seed error:', testError);
                throw testError;
            }

            alert('Tests seeded successfully! (Labs must be created via Sign Up)');
        } catch (err: any) {
            console.error('Seeding failed detailed:', err);
            alert('Seeding failed: ' + (err.message || JSON.stringify(err)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={seedDatabase} disabled={loading}>
            <Database className="w-4 h-4 mr-2" />
            {loading ? 'Seeding...' : 'Seed Database'}
        </Button>
    );
}
