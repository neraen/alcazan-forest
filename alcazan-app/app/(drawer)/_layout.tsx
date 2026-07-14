import {
    View,
    StyleSheet,
    SafeAreaViewBase,
    SafeAreaViewComponent,
    DrawerLayoutAndroidBase,
    DrawerLayoutAndroidComponent, Animated
} from 'react-native';
import { Slot, Link, usePathname } from 'expo-router';
import { Text } from 'react-native';
import Image = Animated.Image;

const pages = [
    { name: 'map', label: 'Carte', icon: require('../../assets/images/ui/menu/map.png') },
    { name: 'journal', label: 'Journal', icon: require('../../assets/images/ui/menu/journal.png') },
    { name: 'social', label: 'Social', icon: require('../../assets/images/ui/menu/social.png') },
    { name: 'profile', label: 'Profil', icon: require('../../assets/images/ui/menu/profile.png') },
    { name: 'ladder', label: 'Stat', icon: require('../../assets/images/ui/menu/ladder.png') },
    { name: 'settings', label: 'Setting', icon: require('../../assets/images/ui/menu/settings.png') },
];

export default function Layout() {
    const pathname = usePathname();

    return (
        <View style={styles.container}>
            <View style={styles.menu}>
                {pages.map(({ name, label, icon }) => {
                    const isActive = pathname.includes(name);
                    return (
                        <Link
                            key={name}
                            href={`/${name}`}
                            style={[
                                styles.link,
                                isActive && { backgroundColor: '#444' },
                            ]}
                        >
                            <Image source={icon} style={styles.icon} />
                        </Link>
                    );
                })}
            </View>

            <View style={styles.content}>
                <Slot />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    menu: {
        width: 60,

        paddingTop: 20,
        paddingBottom: 20,
    },
    link: {
        paddingBottom: 6,
    },
    content: {
        flex: 1,
        backgroundColor: '#fff',
    },
    icon: {
        width: 60,
        height: 60,
        resizeMode: 'cover',
    },
});
