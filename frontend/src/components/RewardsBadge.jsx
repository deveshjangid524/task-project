import React, { useState, useEffect } from 'react';
import { Trophy, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RewardsBadge = () => {
    const { user } = useAuth();
    const [rewards, setRewards] = useState(0);
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        // Load rewards from localStorage or API
        const loadRewards = async () => {
            try {
                // Try to get from localStorage first
                const storedRewards = localStorage.getItem(`rewards_${user?._id}`);
                if (storedRewards) {
                    setRewards(parseInt(storedRewards, 10));
                }
                
                // Optionally sync with backend
                // const response = await api.get(`/users/${user?._id}/rewards`);
                // setRewards(response.data.totalRewards || 0);
            } catch (error) {
                console.error('Error loading rewards:', error);
            }
        };

        if (user?._id) {
            loadRewards();
        }
    }, [user]);

    const addRewards = (points) => {
        const newRewards = rewards + points;
        setRewards(newRewards);
        localStorage.setItem(`rewards_${user?._id}`, newRewards.toString());
        
        // Show animation
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 2000);
    };

    // Make this function globally accessible
    useEffect(() => {
        window.addRewards = addRewards;
        return () => {
            delete window.addRewards;
        };
    }, [rewards]);

    return (
        <div className="relative">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <Trophy className="w-4 h-4" />
                <span className="font-bold text-sm">{rewards}</span>
                <Star className="w-3 h-3" />
            </div>
            
            {/* Animation overlay */}
            {showAnimation && (
                <div className="absolute -top-8 -right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold animate-bounce">
                    +{rewards % 100 || 100}!
                </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    <div className="font-bold">Reward Points</div>
                    <div>Complete tasks to earn points!</div>
                    <div className="text-yellow-400">+100 per task completed</div>
                </div>
            </div>
        </div>
    );
};

export default RewardsBadge;
