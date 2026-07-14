// components/Map/MapView.tsx
import { View, StyleSheet, ImageBackground } from 'react-native';
import Case from './Case';

const MAP_WIDTH = 24;
const MAP_HEIGHT = 16;

export default function MapView() {
    const grid = [];

    for (let row = 0; row < MAP_HEIGHT; row++) {
        const rowCases = [];
        for (let col = 0; col < MAP_WIDTH; col++) {
            rowCases.push(<Case key={`${row}-${col}`} />);
        }
        grid.push(
            <View key={row} style={styles.row}>
                {rowCases}
            </View>
        );
    }

    return (
        <ImageBackground
            source={require('../../assets/images/maps/16.png')}
            style={styles.map}
            resizeMode="cover"
        >
            {grid}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    map: {
        width: 24 * 22, // 480px
        height: 16 * 22, // 320px
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
    },
});
