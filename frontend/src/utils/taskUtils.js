// DEPRECATED: Blockchain integration removed in favor of Supabase
// This file contains legacy blockchain code that is no longer used
// Current implementation uses Supabase for data storage

// Helper function to format task data consistently
export const formatTaskForDisplay = (task) => {
  return {
    ...task,
    // Ensure reward is a string with proper decimal places
    reward: typeof task.reward === 'string' ? task.reward : task.reward.toString(),
    // Ensure dates are properly formatted
    deadline: task.deadline instanceof Date ? task.deadline.toISOString().split('T')[0] : task.deadline,
    // Default status if not provided
    status: task.status || 'open'
  };
};
