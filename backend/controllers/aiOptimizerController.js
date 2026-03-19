const { Mistral } = require('@mistralai/mistralai');
const Task = require('../models/Task');

console.log('MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? 'Present' : 'Missing');

const mistral = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY
});

// @desc    Get all tasks data for AI optimization
// @route   POST /api/tasks/ai-optimize
// @access  Private (Admin, Project Manager)
const optimizeTasksWithAI = async (req, res) => {
    try {
        console.log('AI optimization endpoint hit!');
        console.log('User:', req.user);
        console.log('User role:', req.user.role);
        
        // Get all tasks with full details
        const tasks = await Task.find({})
            .populate('assignedTo', 'name email')
            .populate('dependsOn', 'title status priority');

        console.log('Found tasks:', tasks.length);

        // Prepare task data for AI
        const taskData = tasks.map(task => ({
            id: task._id,
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            status: task.status,
            assignedTo: task.assignedTo ? task.assignedTo.name : 'Unassigned',
            dependsOn: task.dependsOn.map(dep => ({
                id: dep._id,
                title: dep.title,
                status: dep.status,
                priority: dep.priority
            })),
            estimatedHours: task.timeEstimates?.estimatedHours || 1,
            startDate: task.scheduling?.startDate,
            dueDate: task.scheduling?.dueDate,
            createdAt: task.createdAt
        }));

        // Create prompt for Mistral AI
        const prompt = `You are an expert project manager and AI scheduler. Analyze the following tasks and provide an optimized schedule.

Tasks data:
${JSON.stringify(taskData, null, 2)}

Please provide:
1. An optimized task order considering dependencies, priorities, and workload
2. Suggested start dates for each task
3. Resource allocation recommendations
4. Potential bottlenecks or risks
5. Estimated completion timeline

Format your response as JSON with the following structure:
{
  "optimizedSchedule": [
    {
      "taskId": "task_id",
      "suggestedStartDate": "YYYY-MM-DD",
      "suggestedDueDate": "YYYY-MM-DD", 
      "priority": "High/Medium/Low",
      "reasoning": "Why this task should be scheduled here",
      "riskLevel": "Low/Medium/High"
    }
  ],
  "recommendations": [
    "General recommendations for the project"
  ],
  "bottlenecks": [
    "Potential bottlenecks to watch out for"
  ],
  "estimatedCompletion": "YYYY-MM-DD",
  "resourceAllocation": {
    "teamMemberName": {
      "tasksCount": number,
      "totalHours": number,
      "workload": "Balanced/Overloaded/Underloaded"
    }
  }
}

Consider:
- Task dependencies must be respected
- Higher priority tasks should be scheduled earlier
- Workload should be balanced across team members
- Realistic time estimates
- Buffer time for unexpected delays`;

        // Call Mistral AI
        const response = await mistral.chat.complete({
            model: "mistral-large-latest",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            maxTokens: 4000
        });

        const aiResponse = response.choices[0].message.content;
        
        // Try to parse JSON response
        let optimizedSchedule;
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                optimizedSchedule = JSON.parse(jsonMatch[0]);
            } else {
                optimizedSchedule = JSON.parse(aiResponse);
            }
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', parseError);
            return res.status(500).json({ 
                message: 'AI response could not be processed',
                rawResponse: aiResponse
            });
        }

        res.json({
            message: 'AI optimization completed successfully',
            originalTasks: taskData,
            optimizedSchedule,
            aiInsights: {
                totalTasks: taskData.length,
                recommendations: optimizedSchedule.recommendations || [],
                bottlenecks: optimizedSchedule.bottlenecks || [],
                estimatedCompletion: optimizedSchedule.estimatedCompletion,
                resourceAllocation: optimizedSchedule.resourceAllocation || {}
            }
        });

    } catch (error) {
        console.error('AI optimization error:', error);
        res.status(500).json({ 
            message: 'Failed to optimize tasks with AI',
            error: error.message 
        });
    }
};

module.exports = {
    optimizeTasksWithAI
};
