import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, StatusBar } from "react-native";
import { Card, Divider, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";

export default function InfoScreen() {
    const openLink = (url) => {
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#003366" barStyle="light-content" />
            
            {/* Header Section with Gradient */}
            <LinearGradient
                colors={['#003366', '#0275d8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <Icon name="account-tie" size={32} color="#ffffff" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>Congressman Jimmy Fresnedi</Text>
            </LinearGradient>

            <ScrollView style={styles.infoList} showsVerticalScrollIndicator={false}>
                {/* Enhanced Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        <Image
                            source={{ uri: "https://tse2.mm.bing.net/th?id=OIP.99ZQlY1GeOswoUspD-hqsAHaHa&pid=Api" }}
                            style={styles.profileImage}
                        />
                    </View>
                    <Text style={styles.profileName}>Hon. Jimmy Fresnedi</Text>
                    <Text style={styles.profileTitle}>Representative, 2nd District</Text>
                    <View style={styles.badgeContainer}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Public Servant</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Education Advocate</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Icon name="calendar-clock" size={24} color="#0275d8" />
                        <Text style={styles.statNumber}>15+</Text>
                        <Text style={styles.statLabel}>Years in Service</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Icon name="file-document-outline" size={24} color="#0275d8" />
                        <Text style={styles.statNumber}>45</Text>
                        <Text style={styles.statLabel}>Bills Authored</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Icon name="account-group" size={24} color="#0275d8" />
                        <Text style={styles.statNumber}>500K+</Text>
                        <Text style={styles.statLabel}>Constituents</Text>
                    </View>
                </View>

                {/* Biography */}
                <Card style={styles.infoCard}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <Icon name="book-open-variant" size={22} color="#0275d8" />
                            <Text style={styles.infoTitle}>Biography</Text>
                        </View>
                        <Divider style={styles.divider} />
                        <Text style={styles.infoText}>
                            Congressman Jimmy Fresnedi has dedicated over 15 years to public service, beginning his career as a local councilor before being elected to Congress. Born and raised in his district, he understands firsthand the challenges faced by his constituents.
                        </Text>
                        <Text style={styles.infoText}>
                            With a background in law and public administration, he has consistently advocated for education, healthcare reforms, and sustainable community development initiatives that have transformed the district into a progressive hub of innovation and opportunity.
                        </Text>
                    </Card.Content>
                </Card>

                {/* Education */}
                <Card style={styles.infoCard}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <Icon name="school" size={22} color="#0275d8" />
                            <Text style={styles.infoTitle}>Education</Text>
                        </View>
                        <Divider style={styles.divider} />
                        <View style={styles.educationItem}>
                            <Text style={styles.educationDegree}>Bachelor of Laws</Text>
                            <Text style={styles.educationSchool}>University of the Philippines</Text>
                            <Text style={styles.educationYear}>1998-2002</Text>
                        </View>
                        <View style={styles.educationItem}>
                            <Text style={styles.educationDegree}>Master in Public Administration</Text>
                            <Text style={styles.educationSchool}>Ateneo de Manila University</Text>
                            <Text style={styles.educationYear}>2005-2007</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Key Achievements */}
                <Card style={styles.infoCard}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <Icon name="trophy" size={22} color="#0275d8" />
                            <Text style={styles.infoTitle}>Key Achievements</Text>
                        </View>
                        <Divider style={styles.divider} />
                        <View style={styles.achievementItem}>
                            <Icon name="check-circle" size={18} color="#28a745" style={styles.achievementIcon} />
                            <Text style={styles.achievementText}>
                                <Text style={styles.achievementHighlight}>Educational Reform:</Text> Established the District Scholarship Program providing full scholarships to over 5,000 underprivileged students.
                            </Text>
                        </View>
                        <View style={styles.achievementItem}>
                            <Icon name="check-circle" size={18} color="#28a745" style={styles.achievementIcon} />
                            <Text style={styles.achievementText}>
                                <Text style={styles.achievementHighlight}>Healthcare Initiative:</Text> Secured funding for the construction of 3 new district hospitals and 12 community health centers.
                            </Text>
                        </View>
                        <View style={styles.achievementItem}>
                            <Icon name="check-circle" size={18} color="#28a745" style={styles.achievementIcon} />
                            <Text style={styles.achievementText}>
                                <Text style={styles.achievementHighlight}>Infrastructure Development:</Text> Spearheaded the District Development Plan resulting in improved roads, bridges, and public facilities.
                            </Text>
                        </View>
                        <View style={styles.achievementItem}>
                            <Icon name="check-circle" size={18} color="#28a745" style={styles.achievementIcon} />
                            <Text style={styles.achievementText}>
                                <Text style={styles.achievementHighlight}>Community Programs:</Text> Initiated livelihood programs benefiting over 10,000 families through skills training and microfinance support.
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Legislative Focus */}
                <Card style={styles.infoCard}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <Icon name="file-document-multiple" size={22} color="#0275d8" />
                            <Text style={styles.infoTitle}>Legislative Focus</Text>
                        </View>
                        <Divider style={styles.divider} />
                        <View style={styles.focusAreas}>
                            <View style={styles.focusItem}>
                                <Icon name="school" size={24} color="#0275d8" />
                                <Text style={styles.focusText}>Education</Text>
                            </View>
                            <View style={styles.focusItem}>
                                <Icon name="hospital-building" size={24} color="#0275d8" />
                                <Text style={styles.focusText}>Healthcare</Text>
                            </View>
                            <View style={styles.focusItem}>
                                <Icon name="road-variant" size={24} color="#0275d8" />
                                <Text style={styles.focusText}>Public Works </Text>
                            </View>
                            <View style={styles.focusItem}>
                                <Icon name="sprout" size={24} color="#0275d8" />
                                <Text style={styles.focusText}>Environment</Text>
                            </View>
                            <View style={styles.focusItem}>
                                <Icon name="briefcase" size={24} color="#0275d8" />
                                <Text style={styles.focusText}>Job Creation</Text>
                            </View>
                            <View style={styles.focusItem}>
                                <Icon name="shield" size={24} color="#0275d8" />
                                <Text style={styles.focusText}>Public Safety</Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Office Hours */}
                <Card style={styles.infoCard}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <Icon name="clock-outline" size={22} color="#0275d8" />
                            <Text style={styles.infoTitle}>Office Hours</Text>
                        </View>
                        <Divider style={styles.divider} />
                        <View style={styles.hoursItem}>
                            <Text style={styles.hoursDay}>Monday - Friday</Text>
                            <Text style={styles.hoursTime}>8:00 AM - 5:00 PM</Text>
                        </View>
                        <View style={styles.hoursItem}>
                            <Text style={styles.hoursDay}>Saturday</Text>
                            <Text style={styles.hoursTime}>9:00 AM - 12:00 PM</Text>
                        </View>
                        <Text style={styles.hoursNote}>
                            * Public consultations every Wednesday, 1:00 PM - 4:00 PM
                        </Text>
                    </Card.Content>
                </Card>

                {/* Enhanced Contact Information */}
                <Card style={styles.infoCard}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <Icon name="phone-classic" size={22} color="#0275d8" />
                            <Text style={styles.infoTitle}>Contact Information</Text>
                        </View>
                        <Divider style={styles.divider} />
                        
                        <TouchableOpacity style={styles.contactItem} onPress={() => openLink('https://maps.app.goo.gl/')}>
                            <Icon name="map-marker" size={22} color="#0275d8" style={styles.contactIcon} />
                            <View style={styles.contactTextContainer}>
                                <Text style={styles.contactLabel}>District Office</Text>
                                <Text style={styles.contactText}>123 Legislative Building, District Ave.</Text>
                            </View>
                            <Icon name="chevron-right" size={22} color="#0275d8" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('tel:+123456789')}>
                            <Icon name="phone" size={22} color="#0275d8" style={styles.contactIcon} />
                            <View style={styles.contactTextContainer}>
                                <Text style={styles.contactLabel}>Office Phone</Text>
                                <Text style={styles.contactText}>(123) 456-7890</Text>
                            </View>
                            <Icon name="chevron-right" size={22} color="#0275d8" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('mailto:jimmy.fresnedi@congress.gov')}>
                            <Icon name="email" size={22} color="#0275d8" style={styles.contactIcon} />
                            <View style={styles.contactTextContainer}>
                                <Text style={styles.contactLabel}>Email</Text>
                                <Text style={styles.contactText}>jimmy.fresnedi@congress.gov</Text>
                            </View>
                            <Icon name="chevron-right" size={22} color="#0275d8" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.contactItem} onPress={() => openLink('https://www.jimmyfresnedi.gov')}>
                            <Icon name="web" size={22} color="#0275d8" style={styles.contactIcon} />
                            <View style={styles.contactTextContainer}>
                                <Text style={styles.contactLabel}>Website</Text>
                                <Text style={styles.contactText}>www.jimmyfresnedi.gov</Text>
                            </View>
                            <Icon name="chevron-right" size={22} color="#0275d8" />
                        </TouchableOpacity>
                    </Card.Content>
                </Card>

                {/* Social Media */}
                <Card style={styles.infoCard}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <Icon name="share-variant" size={22} color="#0275d8" />
                            <Text style={styles.infoTitle}>Connect With Us</Text>
                        </View>
                        <Divider style={styles.divider} />
                        <View style={styles.socialContainer}>
                            <TouchableOpacity style={styles.socialButton} onPress={() => openLink('https://facebook.com/')}>
                                <Icon name="facebook" size={28} color="#ffffff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton} onPress={() => openLink('https://twitter.com/')}>
                                <Icon name="twitter" size={28} color="#ffffff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton} onPress={() => openLink('https://instagram.com/')}>
                                <Icon name="instagram" size={28} color="#ffffff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton} onPress={() => openLink('https://youtube.com/')}>
                                <Icon name="youtube" size={28} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    </Card.Content>
                </Card>

              

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2025 Office of Congressman Jimmy Fresnedi</Text>
                    <Text style={styles.footerText}>All Rights Reserved</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f2f5",
    },
    header: {
        paddingVertical: 25,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
    },
    headerIcon: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#ffffff",
    },
    infoList: {
        padding: 16,
    },
    profileSection: {
        alignItems: "center",
        marginBottom: 25,
        backgroundColor: "#ffffff",
        borderRadius: 15,
        padding: 20,
        elevation: 4,
    },
    profileImageContainer: {
        borderWidth: 3,
        borderColor: "#0275d8",
        borderRadius: 75,
        padding: 3,
        marginBottom: 15,
    },
    profileImage: {
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    profileName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#003366",
        marginBottom: 5,
    },
    profileTitle: {
        fontSize: 16,
        color: "#555",
        marginBottom: 10,
    },
    badgeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: 10,
    },
    badge: {
        backgroundColor: "#e6f2ff",
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 12,
        margin: 4,
        borderWidth: 1,
        borderColor: "#0275d8",
    },
    badgeText: {
        color: "#0275d8",
        fontSize: 12,
        fontWeight: "500",
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        padding: 15,
        margin: 5,
        elevation: 2,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#003366",
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
        marginTop: 5,
    },
    infoCard: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#003366",
        marginLeft: 10,
    },
    divider: {
        height: 1,
        backgroundColor: "#e0e0e0",
        marginVertical: 10,
    },
    infoText: {
        fontSize: 15,
        color: "#444",
        lineHeight: 22,
        marginBottom: 10,
    },
    educationItem: {
        marginBottom: 15,
    },
    educationDegree: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    educationSchool: {
        fontSize: 14,
        color: "#555",
        marginTop: 2,
    },
    educationYear: {
        fontSize: 13,
        color: "#777",
        fontStyle: "italic",
        marginTop: 2,
    },
    achievementItem: {
        flexDirection: "row",
        marginBottom: 12,
        alignItems: "flex-start",
    },
    achievementIcon: {
        marginTop: 2,
        marginRight: 10,
    },
    achievementText: {
        flex: 1,
        fontSize: 14,
        color: "#444",
        lineHeight: 20,
    },
    achievementHighlight: {
        fontWeight: "bold",
        color: "#003366",
    },
    focusAreas: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    focusItem: {
        width: "32%",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    focusText: {
        fontSize: 12,
        color: "#444",
        marginTop: 5,
        textAlign: "center",
    },
    hoursItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    hoursDay: {
        fontSize: 15,
        fontWeight: "500",
        color: "#444",
    },
    hoursTime: {
        fontSize: 15,
        color: "#0275d8",
    },
    hoursNote: {
        fontSize: 13,
        color: "#666",
        fontStyle: "italic",
        marginTop: 10,
    },
    contactItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    contactIcon: {
        marginRight: 15,
    },
    contactTextContainer: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 14,
        color: "#666",
    },
    contactText: {
        fontSize: 15,
        color: "#333",
        fontWeight: "500",
    },
    socialContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 5,
        marginBottom: 5,
    },
    socialButton: {
        backgroundColor: "#0275d8",
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
    },
    newsletterCard: {
        marginBottom: 20,
        overflow: "hidden",
    },
    newsletterGradient: {
        borderRadius: 12,
    },
    newsletterContent: {
        alignItems: "center",
        padding: 20,
    },
    newsletterIcon: {
        marginBottom: 10,
    },
    newsletterTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#ffffff",
        marginBottom: 10,
    },
    newsletterText: {
        fontSize: 14,
        color: "#ffffff",
        textAlign: "center",
        marginBottom: 15,
    },
    newsletterButton: {
        backgroundColor: "#ffffff",
        borderRadius: 25,
        marginTop: 10,
    },
    newsletterButtonLabel: {
        color: "#0275d8",
        fontWeight: "bold",
    },
    footer: {
        alignItems: "center",
        padding: 20,
    },
    footerText: {
        fontSize: 12,
        color: "#777",
    },
});