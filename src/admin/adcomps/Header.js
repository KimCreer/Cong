import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Header = ({ activeTab, setActiveTab, adminProfile }) => {
    return (
        <View style={styles.headerContainer}>
            {/* Facebook-style Header */}
            <View style={styles.fbHeader}>
                <View style={styles.fbHeaderLeft}>
                    <Text style={styles.fbHeaderTitle}>Admin Portal</Text>
                </View>
                <View style={styles.fbHeaderRight}>
                    <TouchableOpacity 
                        style={styles.fbHeaderIcon}
                        onPress={() => setActiveTab('stats')}
                    >
                        <Ionicons name="stats-chart" size={24} color="#003366" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fbHeaderIcon}>
                        <Ionicons name="notifications-outline" size={24} color="#003366" />
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>3</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.fbProfileButton}
                        onPress={() => setActiveTab('profile')}
                    >
                        {adminProfile.avatarUrl ? (
                            <Image 
                                source={{ uri: adminProfile.avatarUrl }}
                                style={styles.fbProfileAvatar}
                            />
                        ) : (
                            <View style={styles.fbProfileAvatarPlaceholder}>
                                <Text style={styles.fbProfileInitials}>
                                    {adminProfile.name.split(' ').map(n => n[0]).join('')}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Top Navigation Tabs */}
            <View style={styles.topTabsContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.topTabsScroll}
                >
                    <TouchableOpacity 
                        style={[
                            styles.topTab,
                            activeTab === 'dashboard' && styles.topTabActive
                        ]}
                        onPress={() => setActiveTab('dashboard')}
                    >
                        <Ionicons 
                            name="home" 
                            size={20} 
                            color={activeTab === 'dashboard' ? "#003366" : "#666"} 
                        />
                        <Text style={[
                            styles.topTabText,
                            activeTab === 'dashboard' && styles.topTabTextActive
                        ]}>
                            Dashboard
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.topTab,
                            activeTab === 'appointments' && styles.topTabActive
                        ]}
                        onPress={() => setActiveTab('appointments')}
                    >
                        <Ionicons 
                            name="calendar" 
                            size={20} 
                            color={activeTab === 'appointments' ? "#003366" : "#666"} 
                        />
                        <Text style={[
                            styles.topTabText,
                            activeTab === 'appointments' && styles.topTabTextActive
                        ]}>
                            Appointments
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.topTab,
                            activeTab === 'concerns' && styles.topTabActive
                        ]}
                        onPress={() => setActiveTab('concerns')}
                    >
                        <Ionicons 
                            name="chatbubbles" 
                            size={20} 
                            color={activeTab === 'concerns' ? "#003366" : "#666"} 
                        />
                        <Text style={[
                            styles.topTabText,
                            activeTab === 'concerns' && styles.topTabTextActive
                        ]}>
                            Concerns
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.topTab,
                            activeTab === 'projects' && styles.topTabActive
                        ]}
                        onPress={() => setActiveTab('projects')}
                    >
                        <Ionicons 
                            name="construct" 
                            size={20} 
                            color={activeTab === 'projects' ? "#003366" : "#666"} 
                        />
                        <Text style={[
                            styles.topTabText,
                            activeTab === 'projects' && styles.topTabTextActive
                        ]}>
                            Projects
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.topTab,
                            activeTab === 'medical' && styles.topTabActive
                        ]}
                        onPress={() => setActiveTab('medical')}
                    >
                        <Ionicons 
                            name="medkit" 
                            size={20} 
                            color={activeTab === 'medical' ? "#003366" : "#666"} 
                        />
                        <Text style={[
                            styles.topTabText,
                            activeTab === 'medical' && styles.topTabTextActive
                        ]}>
                            Medical
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                            styles.topTab,
                            activeTab === 'updates' && styles.topTabActive
                        ]}
                        onPress={() => setActiveTab('updates')}
                    >
                        <Ionicons 
                            name="newspaper" 
                            size={20} 
                            color={activeTab === 'updates' ? "#003366" : "#666"} 
                        />
                        <Text style={[
                            styles.topTabText,
                            activeTab === 'updates' && styles.topTabTextActive
                        ]}>
                            Updates
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                            styles.topTab,
                            activeTab === 'profile' && styles.topTabActive
                        ]}
                        onPress={() => setActiveTab('profile')}
                    >
                        <Ionicons 
                            name="person" 
                            size={20} 
                            color={activeTab === 'profile' ? "#003366" : "#666"} 
                        />
                        <Text style={[
                            styles.topTabText,
                            activeTab === 'profile' && styles.topTabTextActive
                        ]}>
                            Profile
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 10,
    },
    fbHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    fbHeaderLeft: {
        flex: 1,
    },
    fbHeaderTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#003366',
    },
    fbHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fbHeaderIcon: {
        marginLeft: 15,
        position: 'relative',
    },
    fbProfileButton: {
        marginLeft: 15,
    },
    fbProfileAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    fbProfileAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#003366',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fbProfileInitials: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    topTabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    topTabsScroll: {
        paddingHorizontal: 15,
    },
    topTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    topTabActive: {
        borderBottomColor: '#003366',
    },
    topTabText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    topTabTextActive: {
        color: '#003366',
        fontWeight: '600',
    },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF3B30',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default Header;