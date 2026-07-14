// app/(drawer)/carte.tsx
import { Text, StyleSheet, ImageBackground, View } from 'react-native';
import MapView from '../../components/Map/MapView';
import InfoSidebar from "@/components/ui/InfoSidebar/InfoSidebar";
import SpellBar from "@/components/ui/Spellbar/Spellbar";


export default function CarteScreen() {
    return (
        <ImageBackground
            source={require('../../assets/images/backgrounds/game-background.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <Text style={styles.title}>Forêt d'Alcazan</Text>
                <View style={styles.content}>
                    <InfoSidebar />
                    <MapView />
                    <SpellBar />
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: 'rgba(0,0,0,0.4)', // Optional: sombre léger pour lisibilité
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'stretch', // très important ici
        gap: 6,
    },
});
