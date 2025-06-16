import { useState, useEffect } from 'react';
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore, doc, getDoc } from "@react-native-firebase/firestore";

// Map tab names to their corresponding task permissions
export const TAB_PERMISSIONS = {
    dashboard: null, // Always accessible
    profile: null,   // Always accessible
    appointments: 'appointments',
    concerns: 'concerns',
    projects: 'projects',
    medical: 'medical',
    updates: 'updates',
    stats: null      // Only for superadmin
};

export const useAdminNavigation = () => {
    const [adminPermissions, setAdminPermissions] = useState({
        isSuperAdmin: false,
        tasks: [],
        loading: true
    });

    useEffect(() => {
        const fetchAdminPermissions = async () => {
            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;
                
                if (!currentUser) {
                    setAdminPermissions({
                        isSuperAdmin: false,
                        tasks: [],
                        loading: false
                    });
                    return;
                }

                const db = getFirestore();
                const adminRef = doc(db, "admins", currentUser.uid);
                const adminSnap = await getDoc(adminRef);

                if (adminSnap.exists) {
                    const data = adminSnap.data();
                    setAdminPermissions({
                        isSuperAdmin: data.adminType === 'superadmin',
                        tasks: data.tasks || [],
                        loading: false
                    });
                } else {
                    setAdminPermissions({
                        isSuperAdmin: false,
                        tasks: [],
                        loading: false
                    });
                }
            } catch (error) {
                console.error("Error fetching admin permissions:", error);
                setAdminPermissions({
                    isSuperAdmin: false,
                    tasks: [],
                    loading: false
                });
            }
        };

        fetchAdminPermissions();
    }, []);

    const canAccessTab = (tabName) => {
        if (adminPermissions.loading) return false;
        
        // Super admin has access to everything
        if (adminPermissions.isSuperAdmin) return true;
        
        // Check if tab requires specific permission
        const requiredTask = TAB_PERMISSIONS[tabName];
        
        // If no specific permission required, allow access
        if (requiredTask === null) return true;
        
        // Check if admin has the required task permission
        return adminPermissions.tasks.includes(requiredTask);
    };

    const getAccessibleTabs = () => {
        return Object.keys(TAB_PERMISSIONS).filter(tabName => canAccessTab(tabName));
    };

    return {
        ...adminPermissions,
        canAccessTab,
        getAccessibleTabs
    };
}; 