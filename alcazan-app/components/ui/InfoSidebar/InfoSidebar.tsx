// components/UI/InfoSidebar.tsx
import { View, StyleSheet } from 'react-native';
import PlayerStatus from "@/components/ui/InfoSidebar/PlayerStatus/PlayerStatus";
import TargetStatus from "@/components/ui/InfoSidebar/TargetStatus/TargetStatus";
import StatusLog from "@/components/ui/InfoSidebar/StatusLog/StatusLog";

export default function InfoSidebar() {
    return (
        <View style={styles.container}>
            <PlayerStatus />
            <TargetStatus />
            <StatusLog />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // ← occupe toute la hauteur disponible
        justifyContent: 'space-between', // répartit les 3 zones verticalement
        paddingVertical: 8,
        paddingHorizontal: 4,
        backgroundColor: '#111',
        gap: 20
    },
});
