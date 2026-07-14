// components/UI/TargetStatus.tsx
import { View, Text, StyleSheet, Image } from 'react-native';

export default function TargetStatus() {
    return (
        <View style={styles.container}>
            <Text style={styles.name}>Monstre des bois</Text>
            <View style={styles.row}>
                <View style={styles.bars}>
                    <View style={[styles.bar, { backgroundColor: 'red', width: '40%' }]} />
                    <View style={[styles.bar, { backgroundColor: 'blue', width: '30%' }]} />
                </View>
                <Image source={require('../../../../assets/images/ui/avatar.png')} style={styles.avatar} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    name: {
        color: 'white',
        marginBottom: 4,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'white',
        marginLeft: 8,
    },
    bars: {
        height: 48,
        justifyContent: 'space-around',
    },
    bar: {
        height: 8,
        borderRadius: 4,
    },
});
