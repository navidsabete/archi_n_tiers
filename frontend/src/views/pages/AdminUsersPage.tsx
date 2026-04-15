/**
 * Admin Users Page
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../controllers/AuthController';
import { ApiService } from '../../models/api';
import { IUserResponse, UserRole } from '@ligue-sportive/shared';

interface EditingUser {
  _id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const roleStyles = {
  ADMIN: "badge-confirmed",
  CLIENT: "badge-primary",
  LIVREUR: "badge-neutral",
  VENDEUR: "badge-pending",
};

const AdminUsersPage = () => {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<IUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin()) return;
    if (authLoading) return;
    fetchUsers();
  }, [authLoading, isAdmin]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await ApiService.getUsers();
      setUsers(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: IUserResponse) => {
    setEditingId(user._id);
    setEditingData({ _id: user._id, firstName: user.firstName, lastName: user.lastName, role: user.role });
  };

  const handleSaveEdit = async () => {
    if (!editingData) return;
    try {
      setError('');
      await ApiService.updateUser(editingData._id, {
        firstName: editingData.firstName,
        lastName: editingData.lastName,
        role: editingData.role,
      });
      setUsers(users.map(u => u._id === editingData._id ? { ...u, ...editingData } as IUserResponse : u));
      setEditingId(null);
      setEditingData(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      setError('');
      await ApiService.deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
      setDeleteConfirm(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  if (authLoading) return <div className="loading-state">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">👥 Gestion des utilisateurs</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {isLoading && <div className="loading-state">Chargement...</div>}

      {!isLoading && (
        <div className="card">
          {users.length === 0 ? (
            <div className="empty-state">Aucun utilisateur trouvé</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Prénom</th>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.email}</td>
                    <td>
                      {editingId === user._id ? (
                        <input
                          className="form-control"
                          value={editingData?.firstName || ''}
                          onChange={e => setEditingData({ ...editingData!, firstName: e.target.value })}
                        />
                      ) : user.firstName}
                    </td>
                    <td>
                      {editingId === user._id ? (
                        <input
                          className="form-control"
                          value={editingData?.lastName || ''}
                          onChange={e => setEditingData({ ...editingData!, lastName: e.target.value })}
                        />
                      ) : user.lastName}
                    </td>
                    <td>
                      {editingId === user._id ? (
                        <select
                          className="form-control"
                          value={editingData?.role || 'CLIENT'}
                          onChange={e => setEditingData({ ...editingData!, role: e.target.value as UserRole })}
                        >
                          {Object.values(UserRole).map( r => (
                            <option key={r} value={r}>{r}</option>
                          )
                          )}
                        </select>
                      ) : (
                        <span className={`badge ${roleStyles[user.role] || "badge-neutral"}`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        {editingId === user._id ? (
                          <>
                            <button className="btn btn-success btn-sm" onClick={handleSaveEdit}>Enregistrer</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Annuler</button>
                          </>
                        ) : deleteConfirm === user._id ? (
                          <>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user._id)}>Confirmer</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>Annuler</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleEdit(user)}>Modifier</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(user._id)}>Supprimer</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
