// components/UI/PlayerStatus.tsx
import { View, Text, StyleSheet, Image } from 'react-native';

export default function PlayerStatus() {
    return (
        <View style={styles.container}>
            <Text style={styles.name}>Clément</Text>
            <View style={styles.row}>
                <Image source={require('../../../../assets/images/ui/avatar.png')} style={styles.avatar} />
                <View style={styles.bars}>
                    <View style={[styles.bar, { backgroundColor: 'red', width: '80%' }]} />
                    <View style={[styles.bar, { backgroundColor: 'blue', width: '60%' }]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        alignItems: 'flex-start',
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
        marginRight: 8,
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
