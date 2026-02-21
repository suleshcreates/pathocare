import { supabase } from '@/lib/supabase';

export const testService = {
    // Get all available tests (optionally filtered by category)
    async getTests(category?: string) {
        let query = supabase
            .from('lab_tests')
            .select('*');

        if (category) {
            query = query.eq('category', category);
        }

        const { data: tests, error: testsError } = await query;
        if (testsError) throw testsError;

        // Fetch all labs to get lab info
        const { data: labs, error: labsError } = await supabase
            .from('labs')
            .select('lab_id, lab_name, address');

        if (labsError) {
            console.error('Failed to fetch labs:', labsError);
        }

        // Create a lookup map for labs
        const labMap = new Map();
        if (labs) {
            labs.forEach((lab: any) => labMap.set(lab.lab_id, lab));
        }

        // Map DB fields to Frontend fields
        return tests.map((item: any) => {
            const lab = labMap.get(item.lab_id);
            return {
                id: item.test_id,
                labId: item.lab_id,
                name: item.test_name,
                description: item.description,
                category: item.category || 'blood',
                price: item.price,
                homeVisitCharge: item.home_visit_charge,
                turnaroundTime: item.report_time,
                image: item.image_url,
                parameters: [],
                // Lab info
                labName: lab?.lab_name || 'Unknown Lab',
                labAddress: lab?.address || ''
            };
        });
    },

    // Get filtered tests by search term
    async searchTests(term: string) {
        const { data, error } = await supabase
            .from('lab_tests')
            .select('*')
            .ilike('name', `%${term}%`); // Case-insensitive partial match

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.test_id,
            labId: item.lab_id,
            name: item.test_name,
            description: item.description,
            category: item.category || 'blood',
            price: item.price,
            homeVisitCharge: item.home_visit_charge,
            turnaroundTime: item.report_time,
            image: item.image_url
        }));
    },

    // Get a single test by ID
    async getTestById(id: string) {
        const { data, error } = await supabase
            .from('lab_tests')
            .select('*')
            .eq('test_id', id) // Ensure we use test_id not id
            .single();

        if (error) throw error;

        // Map fields
        return {
            id: data.test_id,
            labId: data.lab_id,
            name: data.test_name,
            description: data.description,
            category: data.category || 'blood',
            price: data.price,
            homeVisitCharge: data.home_visit_charge,
            turnaroundTime: data.report_time,
            image: data.image_url,
            parameters: []
        };
    },

    // Add a new test (Lab/Admin only)
    async addTest(test: any) {
        const { data, error } = await supabase
            .from('lab_tests')
            .insert([{
                test_name: test.name,
                description: test.description,
                category: test.category,
                price: test.price,
                report_time: test.turnaroundTime,
                image_url: test.image
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete a test
    async deleteTest(id: string) {
        const { error } = await supabase
            .from('lab_tests')
            .delete()
            .eq('test_id', id);

        if (error) throw error;
    },

    // Get tests by Lab ID
    async getTestsByLab(labId: string) {
        const { data, error } = await supabase
            .from('lab_tests')
            .select('*')
            .eq('lab_id', labId);

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.test_id,
            labId: item.lab_id,
            name: item.test_name,
            description: item.description,
            category: item.category || 'blood',
            price: item.price,
            homeVisitCharge: item.home_visit_charge,
            turnaroundTime: item.report_time,
            image: item.image_url,
            parameters: []
        }));
    }
};
