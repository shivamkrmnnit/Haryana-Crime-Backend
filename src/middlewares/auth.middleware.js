import { supabase } from '../config/supabaseClient.js';

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) return res.status(401).json({ message: 'Unauthorized' });

        req.user = data.user;
        next();
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};
