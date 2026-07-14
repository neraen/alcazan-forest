// components/UI/StatusLog.tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const logs = [
    '🗡️ Vous attaquez le Monstre des bois vous infligez 3 dégâts !',
    '💥 Coup critique !',

];

/**
 *
 *     '🧪 Vous utilisez Potion de mana',
 *     '🎯 Le Monstre est paralysé',
 */

export default function StatusLog() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Journal</Text>
            <ScrollView style={styles.logContainer}>
                {logs.map((log, index) => (
                    <Text key={index} style={styles.log}>
                        {log}
                    </Text>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111',
        padding: 8,
        borderRadius: 6,
        maxHeight: 120,
    },
    title: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 4,
        fontWeight: 'bold',
    },
    logContainer: {
        maxHeight: 100,
    },
    log: {
        color: '#ccc',
        fontSize: 11,
        marginBottom: 2,
    },
});
