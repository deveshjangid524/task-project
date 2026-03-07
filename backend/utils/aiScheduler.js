const { GoogleGenAI } = require('@google/genai');
const Task = require('../models/Task');
const User = require('../models/User');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const calculateOptimizedSchedule = async () => {
    try {
        // 1. Fetch all tasks that are not completed
        const tasks = await Task.find({ status: { $ne: 'Completed' } }).populate('assignedTo');

        // Return early if there are no tasks
        if (!tasks || tasks.length === 0) {
            return [];
        }

        // 2. Format the workload into a JSON structure for Gemini
        const workloadPayload = tasks.map(task => {
            const assignedTo = task.assignedTo ? {
                id: task.assignedTo._id.toString(),
                name: task.assignedTo.name,
                workingHoursPerDay: task.assignedTo.availability?.workingHoursPerDay || 8
            } : null;

            return {
                taskId: task._id.toString(),
                title: task.title,
                priority: task.priority,
                estimatedHours: task.timeEstimates.estimatedHours || 1,
                dependencies: task.dependsOn.map(dep => dep.toString()),
                assignedTo: assignedTo
            };
        });

        // 3. Create the prompt instruction for Gemini
        const prompt = `
You are an expert Project Manager AI. I will provide you with a JSON array of active tasks in a project.
Each task has an ID, an estimated duration in hours, dependencies (IDs of tasks that must be finished before this task can start), and the assigned user (including their working hours per day).

Your job is to schedule these tasks effectively, resolving any dependency chains.
Assume the project starts TOMORROW at 9:00 AM.
Assume standard working days (Monday-Friday) and skip weekends (Saturday/Sunday).
Use the 'workingHoursPerDay' of the assigned user to determine how many calendar days a task takes. If unassigned, assume 8 working hours per day.

Calculate the exact 'startDate' and 'dueDate' (as ISO 8601 strings) for EVERY task provided.
Ensure that a task's 'startDate' is AFTER the 'dueDate' of all its dependencies.

Return ONLY a valid JSON array matching this exact schema for every task:
[
  {
    "taskId": "...",
    "startDate": "YYYY-MM-DDTHH:mm:ss.000Z",
    "dueDate": "YYYY-MM-DDTHH:mm:ss.000Z"
  }
]

Here are the tasks to schedule:
${JSON.stringify(workloadPayload, null, 2)}
`;

        // 4. Call Gemini 2.5 Flash
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // Inform the API to expect structured JSON
                responseMimeType: "application/json",
            }
        });

        const rawText = response.text();
        if (!rawText) throw new Error("Gemini returned an empty response.");

        // 5. Parse the JSON result
        const scheduledTasks = JSON.parse(rawText);

        const updatedTasksList = [];

        // 6. Update MongoDB with the AI's optimized dates
        for (const schedule of scheduledTasks) {
            const task = tasks.find(t => t._id.toString() === schedule.taskId);
            if (task) {
                task.scheduling.aiOptimizedStartDate = new Date(schedule.startDate);
                task.scheduling.aiOptimizedDueDate = new Date(schedule.dueDate);
                task.scheduling.isRescheduledByAI = true;

                // Add a history log
                task.historyLogs.push({
                    action: 'Scheduled by AI',
                    details: `Gemini optimized dates: ${task.scheduling.aiOptimizedStartDate.toLocaleDateString()} to ${task.scheduling.aiOptimizedDueDate.toLocaleDateString()}`
                });

                await task.save();
                updatedTasksList.push(task);
            }
        }

        return updatedTasksList;
    } catch (error) {
        console.error('Error in AI Scheduler (Gemini):', error);
        throw error;
    }
};

module.exports = { calculateOptimizedSchedule };
