/**
 * Admin Stats Page
 */
import { useEffect, useState } from 'react';
import { ApiService } from '../../models/api';
import { IStatsResponse } from '@ligue-sportive/shared';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatCents = (value: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value / 100);

const AdminStatsPage = () => {
 
  const roleColors: Record<string, string> = {
    ADMIN: '#22c55e',    // badge-confirmed (vert)
    CLIENT: '#1d4ed8',   // badge-primary (bleu)
    LIVREUR: '#6b7280',  // badge-neutral (gris)
    VENDEUR: '#f59e0b',  // badge-pending (orange)
  };

  const [stats, setStats] = useState<IStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    loadStats();
  }, []);


  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ApiService.getStats();
      setStats(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const pieData = stats?.userRoles.map(r => ({
    name: r.userRole,
    value: r.userCount
  })) || [];


  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📊 Statistiques</h1>
      </div>

      {loading && <div className="loading-state">Chargement des stats...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && stats && (
      <>  
      <div className="stats-grid">
        <div className="card">
        <div className="card-header">Produit le plus vendu</div>
          <div className="card-body">
              {stats.topSale ? (
                  <>
                    <strong>{stats.topSale.productName}</strong>
                    <div>Ventes : {stats.topSale.totalSold}</div>
                  </>
                ) : (
                  <span>Aucune donnée</span>
                )}
          </div>
        </div>
         <div className="card">
        <div className="card-header">Catégorie la plus populaire</div>
          <div className="card-body">
              {stats.topCategory ? (
                  <>
                    <strong>{stats.topCategory.category}</strong>
                    <div>Produits : {stats.topCategory.productCount}</div>
                  </>
                ) : (
                  <span>Aucune donnée</span>
                )}
          </div>
        </div>
        <div className="card">
        <div className="card-header">Commission plateforme totale</div>
          <div className="card-body">
              <strong>{formatCents(stats.totalPlatformCommissionCents)}</strong>
              <div className="text-muted">8% des paiements approuvés</div>
          </div>
        </div>
      </div>

        <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              Répartition des utilisateurs
            </div>
            <div className="card-body" style={{ height: 300 }}>
              {pieData.length === 0 ? (
                <div className="empty-state">Aucune donnée</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label={({ name, percent, value }) => { 
                            const pct = percent ? (percent * 100).toFixed(0) : '0';
                            return `${name}: ${value} (${pct}%)`;
                            }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={roleColors[entry.name] || '#ccc'} />
                      ))}
                    </Pie>

                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
              </div>
          </div>
        </>
    )}
    </div>
  );
};

export default AdminStatsPage;
