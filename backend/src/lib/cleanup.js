import cron from 'node-cron';
import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import FriendRequest from '../models/friendRequest.model.js';

// Run daily at 2 AM to clean up deleted accounts older than 7 days
export const cleanupDeletedAccounts = cron.schedule('0 2 * * *', async () => {
    try {
        console.log('🧹 Running deleted accounts cleanup job...');

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find accounts deleted more than 7 days ago
        const usersToDelete = await User.find({
            isDeleted: true,
            deletedAt: { $lt: sevenDaysAgo }
        });

        console.log(`Found ${usersToDelete.length} accounts to permanently delete`);

        for (const user of usersToDelete) {
            const userId = user._id;

            // Delete all messages sent by this user
            await Message.deleteMany({ senderId: userId });

            // Delete all messages received by this user
            await Message.deleteMany({ receiverId: userId });

            // Delete all friend requests involving this user
            await FriendRequest.deleteMany({
                $or: [{ sender: userId }, { receiver: userId }]
            });

            // Remove user from other users' friend lists
            await User.updateMany(
                { friends: userId },
                { $pull: { friends: userId } }
            );

            // Finally, delete the user account permanently
            await User.findByIdAndDelete(userId);

            console.log(`✅ Permanently deleted account: ${user.email}`);
        }

        console.log('✅ Cleanup job completed');
    } catch (error) {
        console.error('❌ Error in cleanup job:', error);
    }
});

// Start the cleanup job
export const startCleanupJobs = () => {
    cleanupDeletedAccounts.start();
    console.log('🕐 Scheduled cleanup job started (runs daily at 2 AM)');
};
