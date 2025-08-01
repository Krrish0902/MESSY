import { DateTime } from 'luxon';
import { supabase } from '../lib/supabase';
import { NotificationService } from './NotificationService';

export class MessCutService {
  static async requestMessCut(subscriptionId: string, date: string, mealType: string, reason?: string) {
    try {
      // Check if request is made at least 12 hours in advance
      const deliveryDateTime = DateTime.fromISO(`${date}T${this.getMealTime(mealType)}`);
      const now = DateTime.now();
      const hoursDifference = deliveryDateTime.diff(now, 'hours').hours;

      if (hoursDifference < 12) {
        throw new Error('Mess cut requests must be made at least 12 hours in advance');
      }

      // Update delivery status to skipped
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .update({
          status: 'skipped',
          skip_reason: reason,
          skip_requested_at: now.toISO(),
        })
        .eq('subscription_id', subscriptionId)
        .eq('date', date)
        .eq('meal_type', mealType)
        .select('*, subscriptions(mess_id, messes(owner_id, name))')
        .single();

      if (deliveryError) throw deliveryError;

      // Send notification to mess owner
      const messOwnerId = delivery.subscriptions.messes.owner_id;
      const messName = delivery.subscriptions.messes.name;
      
      await NotificationService.sendNotification(
        messOwnerId,
        'Mess Cut Request',
        `A customer has requested to skip ${mealType} on ${date} for ${messName}`,
        {
          type: 'mess_cut',
          deliveryId: delivery.id,
          date,
          mealType,
          reason,
        }
      );

      return delivery;
    } catch (error) {
      console.error('Error requesting mess cut:', error);
      throw error;
    }
  }

  static async acknowledgeMessCut(deliveryId: string) {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({
          delivery_notes: 'Acknowledged by mess owner',
        })
        .eq('id', deliveryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error acknowledging mess cut:', error);
      throw error;
    }
  }

  static canRequestMessCut(date: string, mealType: string): boolean {
    const deliveryDateTime = DateTime.fromISO(`${date}T${this.getMealTime(mealType)}`);
    const now = DateTime.now();
    const hoursDifference = deliveryDateTime.diff(now, 'hours').hours;
    return hoursDifference >= 12;
  }

  private static getMealTime(mealType: string): string {
    switch (mealType) {
      case 'breakfast':
        return '08:00';
      case 'lunch':
        return '13:00';
      case 'dinner':
        return '20:00';
      default:
        return '12:00';
    }
  }
}