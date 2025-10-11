
'use client';

import { firestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

// Note: For a real app, you'd want more robust error handling here.

/**
 * Creates a notification for a specific user.
 * @param userId The ID of the user to notify.
 * @param message The notification message.
 * @param link Optional link for the notification.
 */
export async function createNotification(userId: string, message: string, link?: string) {
  if (!userId) {
    console.error("User ID is required to create a notification.");
    return;
  }
  const notificationsColRef = collection(firestore, 'users', userId, 'notifications');
  
  try {
    await addDoc(notificationsColRef, {
      message,
      link,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    // In a real app, you might want to use a more sophisticated error reporting service
    // or handle specific Firestore permission errors.
  }
}

/**
 * Marks a specific notification as read.
 * @param userId The ID of the user.
 * @param notificationId The ID of the notification to mark as read.
 */
export async function markNotificationAsRead(userId: string, notificationId: string) {
    if (!userId || !notificationId) return;
    const notifDocRef = doc(firestore, 'users', userId, 'notifications', notificationId);
    try {
        await updateDoc(notifDocRef, { read: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
}
