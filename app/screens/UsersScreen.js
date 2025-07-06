import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { COLLECTIONS, DATABASE_ID, databases } from '../config/appwrite';
import { useAuth } from '../contexts/AuthContext';

const UsersScreen = () => {
    const router = useRouter();
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchQuery, users]);

    const loadData = async () => {
        try {
            const [usersResult, rolesResult] = await Promise.all([
                databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.ROLES)
            ]);

            setUsers(usersResult.documents);
            setRoles(rolesResult.documents);
        } catch (error) {
            console.error('Error loading users:', error);
            Alert.alert('Error', 'Failed to load users');
        }
    };

    const filterUsers = () => {
        const filtered = users.filter(user =>
            user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsers(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getRoleName = (roleId) => {
        const role = roles.find(r => r.$id === roleId);
        return role ? role.role_name : 'Unknown Role';
    };

    const handleToggleUserStatus = (user) => {
        Alert.alert(
            'Toggle User Status',
            `Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} ${user.first_name} ${user.last_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await databases.updateDocument(
                                DATABASE_ID,
                                COLLECTIONS.USERS,
                                user.$id,
                                {
                                    is_active: !user.is_active
                                }
                            );
                            await loadData();
                            Alert.alert('Success', `User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
                        } catch (error) {
                            console.error('Error updating user status:', error);
                            Alert.alert('Error', 'Failed to update user status');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const renderUserItem = ({ item }) => {
        const roleName = getRoleName(item.role_id);

        return (
            <View style={[styles.userCard, !item.is_active && styles.inactiveUserCard]}>
                <View style={styles.userHeader}>
                    <View>
                        <Text style={styles.userName}>
                            {item.first_name} {item.last_name}
                        </Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        item.is_active ? styles.activeBadge : styles.inactiveBadge
                    ]}>
                        <Text style={styles.statusText}>
                            {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                    </View>
                </View>

                <View style={styles.userDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Username:</Text>
                        <Text style={styles.detailValue}>{item.username}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Role:</Text>
                        <Text style={styles.detailValue}>{roleName}</Text>
                    </View>

                    {item.phone && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Phone:</Text>
                            <Text style={styles.detailValue}>{item.phone}</Text>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Joined:</Text>
                        <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            item.is_active ? styles.deactivateButton : styles.activateButton
                        ]}
                        onPress={() => handleToggleUserStatus(item)}
                    >
                        <Text style={styles.actionButtonText}>
                            {item.is_active ? 'Deactivate' : 'Activate'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Users</Text>
                <View style={{ width: 50 }} />
            </View>

            <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.$id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    searchInput: {
        margin: 20,
        padding: 12,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    listContainer: {
        padding: 20,
    },
    userCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        borderLeftWidth: 4,
        borderLeftColor: '#34C759',
    },
    inactiveUserCard: {
        borderLeftColor: '#FF3B30',
        opacity: 0.7,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    activeBadge: {
        backgroundColor: '#34C759',
    },
    inactiveBadge: {
        backgroundColor: '#FF3B30',
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    userDetails: {
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    activateButton: {
        backgroundColor: '#34C759',
    },
    deactivateButton: {
        backgroundColor: '#FF3B30',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default UsersScreen; 