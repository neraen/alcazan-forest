// components/Map/Case.tsx
import { View, StyleSheet } from 'react-native';

export default function Case() {
    return <View style={styles.case} />;
}

const styles = StyleSheet.create({
    case: {
        width: 22,
        height: 22,
        borderWidth: 0.5,
        borderColor: 'white',
        backgroundColor: 'transparent',
    },
});
