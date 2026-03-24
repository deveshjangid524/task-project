import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RewardsBadge = () => {
    const { user } = useAuth();
    const [rewards, setRewards] = useState(0);
    const [showAnimation, setShowAnimation] = useState(false);
    const [rewardedTasks, setRewardedTasks] = useState(new Set());

    useEffect(() => {
        // Load rewards and rewarded tasks from localStorage
        const loadRewards = async () => {
            try {
                if (!user?._id) return;

                // Load rewards total
                const storedRewards = localStorage.getItem(`rewards_${user._id}`);
                if (storedRewards) {
                    setRewards(parseInt(storedRewards, 10));
                }

                // Load rewarded tasks to prevent duplicates
                const storedRewardedTasks = localStorage.getItem(`rewardedTasks_${user._id}`);
                if (storedRewardedTasks) {
                    setRewardedTasks(new Set(JSON.parse(storedRewardedTasks)));
                }

                // Optional: Sync with backend when available
                try {
                    const response = await api.get(`/users/${user._id}/rewards`);
                    if (response.data?.totalRewards !== undefined) {
                        setRewards(response.data.totalRewards);
                        localStorage.setItem(`rewards_${user._id}`, response.data.totalRewards.toString());
                    }
                } catch (backendError) {
                    console.log('Backend sync not available, using localStorage only');
                }
            } catch (error) {
                console.error('Error loading rewards:', error);
            }
        };

        loadRewards();
    }, [user]);

    const addRewards = useCallback((points, taskId = null) => {
        // Check if this task was already rewarded (if taskId provided)
        if (taskId && rewardedTasks.has(taskId)) {
            console.log(`Task ${taskId} already rewarded, skipping`);
            return false;
        }

        const newRewards = rewards + points;
        setRewards(newRewards);
        
        // Save to localStorage
        localStorage.setItem(`rewards_${user._id}`, newRewards.toString());
        
        // Track rewarded task to prevent duplicates
        if (taskId) {
            const newRewardedTasks = new Set(rewardedTasks);
            newRewardedTasks.add(taskId);
            setRewardedTasks(newRewardedTasks);
            localStorage.setItem(`rewardedTasks_${user._id}`, JSON.stringify([...newRewardedTasks]));
        }
        
        // Try to sync with backend
        api.post(`/users/${user._id}/rewards`, { points, taskId })
            .catch(error => console.log('Backend sync failed, rewards saved locally'));
        
        // Show animation
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 2000);
        
        return true;
    }, [rewards, rewardedTasks, user._id]);

    // Make this function globally accessible
    useEffect(() => {
        window.addRewards = addRewards;
        return () => {
            delete window.addRewards;
        };
    }, [addRewards]);

    return (
        <div className="relative group">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <Trophy className="w-4 h-4" />
                <span className="font-bold text-sm">{rewards}</span>
                <Star className="w-3 h-3" />
            </div>
            
            {/* Animation overlay */}
            {showAnimation && (
                <div className="absolute -top-8 -right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold animate-bounce">
                    +100!
                </div>
            )}
        </div>
    );
};

export default RewardsBadge;
