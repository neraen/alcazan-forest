// components/Map/SpellBar.tsx
import { View, StyleSheet } from 'react-native';

export default function SpellBar() {
    return (
        <View style={styles.bar}>
            {[...Array(7)].map((_, i) => (
                <View key={i} style={styles.spellSlot} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
        gap: 6,
    },
    spellSlot: {
        width: 35,
        height: 35,
        gap:10,
        backgroundColor: '#555',
        borderWidth: 1,
        borderColor: '#aaa',
    },
});
