-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Notifications can be created by system" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.role() = 'authenticated' AND notifications.user_id = auth.uid());

CREATE POLICY "Notifications can be created by system" ON notifications
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            NEW.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.role() = 'authenticated' AND notifications.user_id = auth.uid());

-- Notification preferences policies
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can create their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;

CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.role() = 'authenticated' AND notification_preferences.user_id = auth.uid());

CREATE POLICY "Users can create their own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND NEW.user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.role() = 'authenticated' AND notification_preferences.user_id = auth.uid()); 