// StatsTab.js
import React from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Dimensions,
    SafeAreaView 
} from "react-native";
import { LineChart, PieChart } from 'react-native-chart-kit';
import { FontAwesome5 } from "@expo/vector-icons";
import * as Animatable from 'react-native-animatable';

const StatsTab = ({ chartData, pieData, stats }) => {
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 40;
    const lineChartHeight = 280;
    const pieChartHeight = 220;
    
    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 51, 102, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#003366'
        },
        propsForLabels: {
            fontSize: 12,
            fontWeight: '500'
        },
        formatYLabel: (value) => `${value}`,
        formatXLabel: (value) => value,
        yAxisLabel: "Applications",
        yAxisSuffix: "",
        yAxisInterval: 1,
    };

    // Ensure chartData has the correct structure
    const safeChartData = {
        labels: chartData?.labels || ['No Data'],
        datasets: [{
            data: chartData?.datasets?.[0]?.data || [0],
            color: (opacity = 1) => `rgba(0, 51, 102, ${opacity})`,
            strokeWidth: 2
        }]
    };

    // Fixed hexToRgb function with proper error handling
    const hexToRgb = (hex) => {
        if (!hex || typeof hex !== 'string') return '0, 0, 0';
        
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse r, g, b values
        const r = parseInt(hex.length === 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16);
        const g = parseInt(hex.length === 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16);
        const b = parseInt(hex.length === 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16);

        return `${r}, ${g}, ${b}`;
    };

    const pieChartConfig = {
        ...chartConfig,
        color: (opacity = 1, index) => {
            const colors = ['#003366', '#4CAF50', '#FF9800', '#F44336', '#2196F3'];
            const color = colors[index % colors.length] || '#003366';
            const rgb = hexToRgb(color);
            return `rgba(${rgb}, ${opacity})`;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>System Statistics</Text>
                
                <View style={styles.statsSummary}>
                    <Animatable.View 
                        animation="fadeInLeft" 
                        duration={600}
                        delay={100}
                        style={styles.statItem}
                    >
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                            <FontAwesome5 name="calendar-check" size={20} color="#FF9800" />
                        </View>
                        <Text style={styles.statValue}>{stats?.pendingAppointments || 0}</Text>
                        <Text style={styles.statLabel}>Pending Appointments</Text>
                    </Animatable.View>
                    
                    <Animatable.View 
                        animation="fadeInRight" 
                        duration={600}
                        delay={100}
                        style={styles.statItem}
                    >
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
                            <FontAwesome5 name="comments" size={20} color="#F44336" />
                        </View>
                        <Text style={styles.statValue}>{stats?.pendingConcerns || 0}</Text>
                        <Text style={styles.statLabel}>Pending Concerns</Text>
                    </Animatable.View>
                </View>
                
                <View style={styles.statsSummary}>
                    <Animatable.View 
                        animation="fadeInLeft" 
                        duration={600}
                        delay={200}
                        style={styles.statItem}
                    >
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                            <FontAwesome5 name="project-diagram" size={20} color="#4CAF50" />
                        </View>
                        <Text style={styles.statValue}>{stats?.activeProjects || 0}</Text>
                        <Text style={styles.statLabel}>Active Projects</Text>
                    </Animatable.View>
                    
                    <Animatable.View 
                        animation="fadeInRight" 
                        duration={600}
                        delay={200}
                        style={styles.statItem}
                    >
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                            <FontAwesome5 name="file-medical" size={20} color="#2196F3" />
                        </View>
                        <Text style={styles.statValue}>{stats?.medicalApplications || 0}</Text>
                        <Text style={styles.statLabel}>Medical Apps</Text>
                    </Animatable.View>
                </View>
                
                <Text style={styles.sectionTitle}>Daily Medical Applications</Text>
                <Animatable.View 
                    animation="fadeInUp" 
                    duration={800}
                    delay={300}
                    style={styles.chartContainer}
                >
                    <LineChart
                        data={safeChartData}
                        width={chartWidth}
                        height={lineChartHeight}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                        withDots={true}
                        withShadow={false}
                        withInnerLines={true}
                        withOuterLines={true}
                        withVerticalLines={false}
                        withHorizontalLines={true}
                        withVerticalLabels={true}
                        withHorizontalLabels={true}
                        fromZero={true}
                        segments={4}
                    />
                </Animatable.View>
                
                <Text style={styles.sectionTitle}>Concerns Status Distribution</Text>
                <Animatable.View 
                    animation="fadeInUp" 
                    duration={800}
                    delay={400}
                    style={styles.chartContainer}
                >
                    <PieChart
                        data={pieData || []}
                        width={chartWidth}
                        height={pieChartHeight}
                        chartConfig={pieChartConfig}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                        style={styles.chart}
                        hasLegend={true}
                        avoidFalseZero={true}
                        center={[10, 10]}
                    />
                </Animatable.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#003366",
        marginTop: 20,
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    statsSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        width: '48%',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#003366',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontWeight: '500',
    },
    chartContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    chart: {
        borderRadius: 8,
        marginVertical: 8,
        alignSelf: 'center',
    }
});

export default StatsTab;